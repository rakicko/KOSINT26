'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const axios = require('axios');

// Lifecycle States
const ClientLifecycleState = Object.freeze({
  IDLE: 'IDLE',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  DISCONNECTING: 'DISCONNECTING',
  DISCONNECTED: 'DISCONNECTED',
  FAILED: 'FAILED'
});

// Environment Types
const TelegramEnvironment = Object.freeze({
  LOCAL: 'local',
  PRODUCTION: 'production'
});

const SESSION_FILE_LOCAL = path.join(__dirname, '.telegram_session_local');
const SESSION_FILE_LEGACY = path.join(__dirname, '.telegram_session');
const LOCK_FILE_LOCAL = path.join(__dirname, '.telegram_local.lock');
const ENV_FILE = path.join(__dirname, '../../.env');

// Default public channels if not configured
const DEFAULT_CHANNELS = ['koridorsrb', 'srpskinat', 'istokinfo'];

// Dynamic map of resolved channel entities: normalized identifier -> { username, title, id, canonical }
const resolvedChannelMap = new Map();

// Known aliases mapping for canonical channel usernames
const KNOWN_CHANNEL_ALIASES = {
  'istokinfo': 'istokinfo',
  'istok_info': 'istokinfo',
  'istok info': 'istokinfo',
  'исток инфо': 'istokinfo',
  'koridorsrb': 'koridorsrb',
  'koridor_srb': 'koridorsrb',
  'koridor srbija': 'koridorsrb',
  'коридор србија': 'koridorsrb',
  'srpskinat': 'srpskinat',
  'srpski_nat': 'srpskinat',
  'srpski nacionalni info': 'srpskinat',
  'српски национални инфо': 'srpskinat'
};

// In-memory cache
let telegramCache = null;
let lastFetchTime = 0;
const DEFAULT_CACHE_TTL_MS = parseInt(process.env.TELEGRAM_CACHE_TTL_MS || '60000', 10); // 60 seconds

// Singleton Telegram client instance state
let activeClient = null;
let clientConnectingPromise = null;
let clientDisconnectingPromise = null;
let lifecycleState = ClientLifecycleState.IDLE;
let isShutdownRegistered = false;
let localLockHeld = false;

/**
 * Determine active runtime environment for Telegram sessions
 * Resolves to 'production' or 'local'
 */
function getTelegramEnvironment() {
  const explicitEnv = (process.env.TELEGRAM_ENVIRONMENT || process.env.TELEGRAM_ENV || '').toLowerCase().trim();
  if (explicitEnv === 'production' || explicitEnv === 'prod') {
    return TelegramEnvironment.PRODUCTION;
  }
  if (explicitEnv === 'local' || explicitEnv === 'development' || explicitEnv === 'dev' || explicitEnv === 'test') {
    return TelegramEnvironment.LOCAL;
  }

  // Render environment auto-detection
  const isRender = Boolean(
    process.env.RENDER === 'true' ||
    process.env.RENDER === '1' ||
    process.env.RENDER_SERVICE_ID ||
    process.env.IS_RENDER === 'true'
  );
  if (isRender) {
    return TelegramEnvironment.PRODUCTION;
  }

  // NODE_ENV detection
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase().trim();
  if (nodeEnv === 'production') {
    return TelegramEnvironment.PRODUCTION;
  }

  return TelegramEnvironment.LOCAL;
}

/**
 * Retrieve saved StringSession strictly for the given environment
 * Never allows cross-environment fallback between local and production
 */
function getSavedSession(targetEnv) {
  const env = targetEnv || getTelegramEnvironment();

  if (env === TelegramEnvironment.PRODUCTION) {
    const prodSession = process.env.TELEGRAM_SESSION_PRODUCTION || process.env.TELEGRAM_SESSION_PROD;
    if (prodSession && prodSession.trim()) {
      return prodSession.trim();
    }
    // Strict isolation: NEVER fall back to local session or files in production
    return '';
  }

  // Local environment
  const localSession = process.env.TELEGRAM_SESSION_LOCAL || process.env.TELEGRAM_SESSION_DEV;
  if (localSession && localSession.trim()) {
    return localSession.trim();
  }

  // Local session file fallback strictly for local dev
  if (fs.existsSync(SESSION_FILE_LOCAL)) {
    try {
      const fileSession = fs.readFileSync(SESSION_FILE_LOCAL, 'utf8').trim();
      if (fileSession) return fileSession;
    } catch (e) {}
  }

  if (fs.existsSync(SESSION_FILE_LEGACY)) {
    try {
      const fileSession = fs.readFileSync(SESSION_FILE_LEGACY, 'utf8').trim();
      if (fileSession) return fileSession;
    } catch (e) {}
  }

  // Strict isolation: NEVER fall back to production session in local dev
  return '';
}

/**
 * Validate Telegram configuration for the target environment
 */
function validateTelegramConfiguration(targetEnv) {
  const env = targetEnv || getTelegramEnvironment();
  const apiIdStr = process.env.TELEGRAM_API_ID || process.env.TG_API_ID;
  const apiHash = process.env.TELEGRAM_API_HASH || process.env.TG_API_HASH;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const sessionStr = getSavedSession(env);

  const errors = [];

  if (!apiIdStr && !apiHash && !botToken) {
    errors.push('TELEGRAM_API_ID and TELEGRAM_API_HASH (or TELEGRAM_BOT_TOKEN) are not configured in environment variables.');
    return { valid: false, env, errors, mode: 'UNCONFIGURED' };
  }

  if (apiIdStr && !apiHash) errors.push('TELEGRAM_API_HASH is missing in environment variables.');
  if (!apiIdStr && apiHash) errors.push('TELEGRAM_API_ID is missing in environment variables.');

  if (apiIdStr) {
    const apiId = parseInt(apiIdStr, 10);
    if (isNaN(apiId) || apiId <= 0) {
      errors.push('TELEGRAM_API_ID must be a valid positive integer.');
    }
  }

  if (apiIdStr && apiHash) {
    if (!sessionStr && !botToken) {
      if (env === TelegramEnvironment.PRODUCTION) {
        errors.push('TELEGRAM_SESSION_PRODUCTION (or TELEGRAM_SESSION_PROD) is required in production (Render). Refusing to fallback to local session to prevent AUTH_KEY_DUPLICATED.');
      } else {
        errors.push('TELEGRAM_SESSION_LOCAL is required in local development. Run "node skills/telegram-monitor/skill.js --auth" to create a local session.');
      }
    }
  }

  return {
    valid: errors.length === 0,
    env,
    errors,
    sessionConfigured: Boolean(sessionStr),
    botTokenConfigured: Boolean(botToken),
    mode: botToken ? 'BOT_API' : (sessionStr ? 'MTPROTO' : 'UNCONFIGURED')
  };
}

/**
 * Check if a process ID is actively running
 */
function isPidAlive(pid) {
  if (!pid || typeof pid !== 'number') return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM';
  }
}

/**
 * Acquire local session lock to prevent dual local processes (Antigravity/nodemon)
 * from invoking MTProto concurrently with the same local session key
 */
function acquireLocalLock() {
  const env = getTelegramEnvironment();
  if (env !== TelegramEnvironment.LOCAL) {
    return { acquired: true };
  }

  if (localLockHeld) {
    return { acquired: true };
  }

  try {
    if (fs.existsSync(LOCK_FILE_LOCAL)) {
      try {
        const content = fs.readFileSync(LOCK_FILE_LOCAL, 'utf8');
        const lockData = JSON.parse(content);
        const lockPid = lockData.pid;

        if (lockPid && lockPid !== process.pid && isPidAlive(lockPid)) {
          return {
            acquired: false,
            heldByPid: lockPid,
            reason: `Local Telegram session is already locked by active Node process (PID: ${lockPid}). Simultaneous connections cause 406 AUTH_KEY_DUPLICATED.`
          };
        }
      } catch (parseErr) {
        // Stale or invalid lock file, safe to overwrite
      }
    }

    const payload = JSON.stringify({
      pid: process.pid,
      env,
      createdAt: new Date().toISOString(),
      timestamp: Date.now()
    }, null, 2);

    fs.writeFileSync(LOCK_FILE_LOCAL, payload, { encoding: 'utf8', mode: 0o600 });
    localLockHeld = true;
    return { acquired: true };
  } catch (err) {
    console.warn('[telegram-monitor] Warning: Could not write local lock file:', err.message);
    return { acquired: true, warning: err.message };
  }
}

/**
 * Release local session lock
 */
function releaseLocalLock() {
  if (!localLockHeld && !fs.existsSync(LOCK_FILE_LOCAL)) {
    return;
  }

  try {
    if (fs.existsSync(LOCK_FILE_LOCAL)) {
      const content = fs.readFileSync(LOCK_FILE_LOCAL, 'utf8');
      const lockData = JSON.parse(content);
      if (lockData.pid === process.pid) {
        fs.unlinkSync(LOCK_FILE_LOCAL);
      }
    }
  } catch (err) {
    // Ignore release errors during shutdown
  } finally {
    localLockHeld = false;
  }
}

/**
 * Persist StringSession locally into .env and session store
 */
function persistSession(sessionString, targetEnv = TelegramEnvironment.LOCAL) {
  if (!sessionString || typeof sessionString !== 'string') return;
  const trimmed = sessionString.trim();
  const isProd = targetEnv === TelegramEnvironment.PRODUCTION;
  const sessionVar = isProd ? 'TELEGRAM_SESSION_PRODUCTION' : 'TELEGRAM_SESSION_LOCAL';

  // 1. Save to local session file for local dev
  if (!isProd) {
    try {
      fs.writeFileSync(SESSION_FILE_LOCAL, trimmed, { encoding: 'utf8', mode: 0o600 });
    } catch (err) {
      console.warn('[telegram-auth] Could not write to .telegram_session_local file:', err.message);
    }
  }

  // 2. Update or append key in .env file
  try {
    let envContent = '';
    if (fs.existsSync(ENV_FILE)) {
      envContent = fs.readFileSync(ENV_FILE, 'utf8');
    }

    const regex = new RegExp(`^${sessionVar}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${sessionVar}=${trimmed}`);
    } else if (envContent.includes(`${sessionVar}=`)) {
      const inlineRegex = new RegExp(`${sessionVar}=.*`);
      envContent = envContent.replace(inlineRegex, `${sessionVar}=${trimmed}`);
    } else {
      envContent = envContent ? `${envContent.trimEnd()}\n${sessionVar}=${trimmed}\n` : `${sessionVar}=${trimmed}\n`;
    }
    fs.writeFileSync(ENV_FILE, envContent, { encoding: 'utf8' });
  } catch (err) {
    console.warn(`[telegram-auth] Could not update ${sessionVar} in .env file:`, err.message);
  }

  process.env[sessionVar] = trimmed;
}

/**
 * Prompt user in CLI via readline
 */
function askQuestion(promptText) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(promptText, answer => {
      rl.close();
      resolve(answer ? answer.trim() : '');
    });
  });
}

/**
 * Clean and normalize channel identifier to lowercase handle
 */
function normalizeChannelName(rawName) {
  if (!rawName || typeof rawName !== 'string') return '';
  let cleaned = rawName.trim();
  cleaned = cleaned.replace(/^https?:\/\/t\.me\/s\//i, '');
  cleaned = cleaned.replace(/^https?:\/\/t\.me\//i, '');
  cleaned = cleaned.replace(/^t\.me\//i, '');
  cleaned = cleaned.replace(/^@/, '');
  cleaned = cleaned.replace(/\/$/, '');
  return cleaned.trim().toLowerCase();
}

/**
 * Parse configured channels from environment or defaults (normalized lowercase list)
 */
function getConfiguredChannels() {
  const envChannels = process.env.TELEGRAM_CHANNELS;
  if (envChannels && typeof envChannels === 'string') {
    const list = envChannels
      .split(',')
      .map(c => normalizeChannelName(c))
      .filter(Boolean);
    if (list.length > 0) return list;
  }
  return [...DEFAULT_CHANNELS];
}

/**
 * Register a resolved channel entity for bidirectional alias & media authorization matching
 */
function registerResolvedChannel(rawIdentifier, { username, title, id, canonical }) {
  const meta = {
    username: username || '',
    title: title || '',
    id: id ? String(id) : '',
    canonical: canonical || normalizeChannelName(username || rawIdentifier)
  };
  const normRaw = normalizeChannelName(rawIdentifier);
  if (normRaw) resolvedChannelMap.set(normRaw, meta);
  if (username) {
    const normUser = normalizeChannelName(username);
    if (normUser) resolvedChannelMap.set(normUser, meta);
  }
  if (title) {
    const normTitle = normalizeChannelName(title);
    if (normTitle) resolvedChannelMap.set(normTitle, meta);
  }
  if (id) {
    resolvedChannelMap.set(String(id), meta);
  }
}

/**
 * Check if a channel identifier is authorized against configured channels and resolved entities
 * Supports case-insensitivity, display names, and canonical aliases without allowing arbitrary channels
 */
function isChannelConfigured(channelIdentifier) {
  if (!channelIdentifier || typeof channelIdentifier !== 'string') return false;
  const target = normalizeChannelName(channelIdentifier);
  if (!target) return false;

  const configured = getConfiguredChannels();
  if (configured.includes(target)) {
    return true;
  }

  // Check alias map
  if (KNOWN_CHANNEL_ALIASES[target] && configured.includes(KNOWN_CHANNEL_ALIASES[target])) {
    return true;
  }

  // Check dynamically resolved channel map
  if (resolvedChannelMap.has(target)) {
    const meta = resolvedChannelMap.get(target);
    if (meta && meta.canonical && configured.includes(meta.canonical)) {
      return true;
    }
  }

  for (const [key, meta] of resolvedChannelMap.entries()) {
    if (meta.username && normalizeChannelName(meta.username) === target && configured.includes(meta.canonical)) return true;
    if (meta.title && normalizeChannelName(meta.title) === target && configured.includes(meta.canonical)) return true;
    if (meta.id && String(meta.id) === target && configured.includes(meta.canonical)) return true;
  }

  return false;
}

/**
 * Extract safe, basic media information from a Telegram message object
 */
function extractMediaInfo(msg, channelUsername = '') {
  if (!msg || !msg.media) {
    return { hasMedia: false, type: null, description: null, hasPreview: false, previewUrl: null };
  }

  const media = msg.media;
  const className = media.className || media.constructor?.name || '';
  const username = channelUsername ? normalizeChannelName(channelUsername) : '';
  const msgId = msg.id;

  // Photo
  if (className === 'MessageMediaPhoto' || media.photo) {
    return {
      hasMedia: true,
      type: 'photo',
      description: 'Photo attachment',
      hasPreview: true,
      previewUrl: (username && msgId) ? `/api/telegram/media?channel=${encodeURIComponent(username)}&id=${msgId}` : null
    };
  }

  // Document (Video, Audio, File, Animation/GIF)
  if (className === 'MessageMediaDocument' || media.document) {
    const doc = media.document || {};
    const mime = (doc.mimeType || '').toLowerCase();
    const hasThumbs = Array.isArray(doc.thumbs) && doc.thumbs.length > 0;
    
    if (mime.startsWith('video/')) {
      return {
        hasMedia: true,
        type: 'video',
        description: 'Video clip',
        mimeType: mime,
        hasPreview: hasThumbs,
        previewUrl: (hasThumbs && username && msgId) ? `/api/telegram/media?channel=${encodeURIComponent(username)}&id=${msgId}` : null
      };
    }
    if (mime.startsWith('audio/')) {
      return {
        hasMedia: true,
        type: 'audio',
        description: 'Audio file',
        mimeType: mime,
        hasPreview: false,
        previewUrl: null
      };
    }
    if (mime.includes('gif')) {
      return {
        hasMedia: true,
        type: 'animation',
        description: 'GIF / Animation',
        mimeType: mime,
        hasPreview: hasThumbs,
        previewUrl: (hasThumbs && username && msgId) ? `/api/telegram/media?channel=${encodeURIComponent(username)}&id=${msgId}` : null
      };
    }
    return {
      hasMedia: true,
      type: 'document',
      description: 'Document attachment',
      mimeType: mime || undefined,
      hasPreview: false,
      previewUrl: null
    };
  }

  // Web page preview
  if (className === 'MessageMediaWebPage' || media.webpage) {
    const wp = media.webpage || {};
    const hasPhoto = !!wp.photo;
    return {
      hasMedia: true,
      type: 'webpage',
      description: wp.title || 'Linked web preview',
      webUrl: wp.url || null,
      webTitle: wp.title || null,
      webDescription: wp.description ? wp.description.substring(0, 160) : null,
      hasPreview: hasPhoto,
      previewUrl: (hasPhoto && username && msgId) ? `/api/telegram/media?channel=${encodeURIComponent(username)}&id=${msgId}` : null
    };
  }

  // Poll
  if (className === 'MessageMediaPoll' || media.poll) {
    const poll = media.poll || {};
    return {
      hasMedia: true,
      type: 'poll',
      description: `Poll: ${poll.question || 'Survey'}`,
      hasPreview: false,
      previewUrl: null
    };
  }

  // Geo / Venue
  if (className === 'MessageMediaGeo' || className === 'MessageMediaVenue') {
    return {
      hasMedia: true,
      type: 'location',
      description: 'Location share attachment',
      hasPreview: false,
      previewUrl: null
    };
  }

  return {
    hasMedia: true,
    type: 'other',
    description: 'Media attachment',
    hasPreview: false,
    previewUrl: null
  };
}

/**
 * Initialize or get active singleton MTProto client
 * Protected against race conditions, duplicate connections, and multi-process collisions
 */
async function getTelegramClient(customClientFactory = null) {
  const env = getTelegramEnvironment();

  // 1. If already connected, reuse existing singleton immediately
  if (lifecycleState === ClientLifecycleState.CONNECTED && activeClient && activeClient.connected) {
    return activeClient;
  }

  // 2. If connection is in progress, coalesce concurrent calls to the same Promise
  if (clientConnectingPromise) {
    return clientConnectingPromise;
  }

  // 3. If disconnecting, wait until disconnection finishes before reconnecting
  if (clientDisconnectingPromise) {
    await clientDisconnectingPromise;
  }

  // 4. Validate environment-specific configuration
  const validation = validateTelegramConfiguration(env);
  if (!validation.valid) {
    validation.errors.forEach(err => console.warn(`[telegram-monitor] ${err}`));
    lifecycleState = ClientLifecycleState.FAILED;
    return null;
  }

  // 5. Local lock check
  if (env === TelegramEnvironment.LOCAL) {
    const lockResult = acquireLocalLock();
    if (!lockResult.acquired) {
      console.warn(`[telegram-monitor] ${lockResult.reason}`);
      lifecycleState = ClientLifecycleState.FAILED;
      return null;
    }
  }

  const apiId = parseInt(process.env.TELEGRAM_API_ID || process.env.TG_API_ID, 10);
  const apiHash = process.env.TELEGRAM_API_HASH || process.env.TG_API_HASH;
  const sessionStr = getSavedSession(env);
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  console.log(`[telegram-monitor] Initializing Telegram singleton [Environment: ${env.toUpperCase()} | SessionMode: ${botToken ? 'BOT_API' : (env === TelegramEnvironment.PRODUCTION ? 'TELEGRAM_SESSION_PRODUCTION' : 'TELEGRAM_SESSION_LOCAL')}]`);

  lifecycleState = ClientLifecycleState.CONNECTING;

  async function connectClient() {
    try {
      let client;
      if (typeof customClientFactory === 'function') {
        client = customClientFactory({ sessionStr, apiId, apiHash, botToken, env });
      } else {
        const stringSession = new StringSession(sessionStr || '');
        client = new TelegramClient(stringSession, apiId, apiHash, {
          connectionRetries: 3,
          timeout: 10,
          autoReconnect: true,
          useWSS: false
        });
      }

      if (botToken) {
        if (!client.connected) {
          await client.start({ botAuthToken: botToken });
        }
      } else {
        if (!client.connected) {
          await client.connect();
        }

        const isAuth = await client.checkAuthorization();
        if (!isAuth) {
          console.warn(`[telegram-monitor] Telegram session is not authorized in ${env} environment.`);
          lifecycleState = ClientLifecycleState.FAILED;
          try { await client.disconnect(); } catch (e) {}
          releaseLocalLock();
          activeClient = null;
          return null;
        }
      }

      activeClient = client;
      lifecycleState = ClientLifecycleState.CONNECTED;
      ensureShutdownHandlersRegistered();
      return activeClient;
    } catch (err) {
      lifecycleState = ClientLifecycleState.FAILED;
      activeClient = null;
      releaseLocalLock();

      const errMsg = err?.message || String(err);
      if (errMsg.includes('AUTH_KEY_DUPLICATED')) {
        console.error(`[telegram-monitor] 🛑 CRITICAL 406: AUTH_KEY_DUPLICATED detected in ${env} environment.`);
        console.error(`[telegram-monitor] Ensure Render uses TELEGRAM_SESSION_PRODUCTION and localhost uses TELEGRAM_SESSION_LOCAL with distinct session keys.`);
      } else {
        console.warn(`[telegram-monitor] Failed to connect MTProto client (${env}):`, errMsg);
      }
      return null;
    }
  }

  clientConnectingPromise = connectClient().finally(() => {
    clientConnectingPromise = null;
  });

  return clientConnectingPromise;
}

/**
 * Gracefully disconnect singleton Telegram client
 */
async function disconnectTelegramClient() {
  if (clientDisconnectingPromise) {
    return clientDisconnectingPromise;
  }

  if (!activeClient && lifecycleState !== ClientLifecycleState.CONNECTING) {
    lifecycleState = ClientLifecycleState.DISCONNECTED;
    releaseLocalLock();
    return;
  }

  lifecycleState = ClientLifecycleState.DISCONNECTING;

  async function performDisconnect() {
    try {
      if (activeClient && typeof activeClient.disconnect === 'function') {
        await activeClient.disconnect();
      }
    } catch (err) {
      console.warn('[telegram-monitor] Disconnect error:', err.message);
    } finally {
      activeClient = null;
      clientConnectingPromise = null;
      lifecycleState = ClientLifecycleState.DISCONNECTED;
      releaseLocalLock();
    }
  }

  clientDisconnectingPromise = performDisconnect().finally(() => {
    clientDisconnectingPromise = null;
  });

  return clientDisconnectingPromise;
}


/**
 * Register process signal handlers for graceful shutdown once
 */
function ensureShutdownHandlersRegistered() {
  if (isShutdownRegistered) return;
  isShutdownRegistered = true;

  const handleShutdown = async (signal) => {
    try {
      await disconnectTelegramClient();
    } catch (e) {}
  };

  process.once('SIGINT', () => handleShutdown('SIGINT'));
  process.once('SIGTERM', () => handleShutdown('SIGTERM'));
  process.once('beforeExit', () => handleShutdown('beforeExit'));
}

/**
 * Testing helper to reset internal singleton state
 */
function _resetTelegramClientForTesting() {
  activeClient = null;
  clientConnectingPromise = null;
  clientDisconnectingPromise = null;
  lifecycleState = ClientLifecycleState.IDLE;
  isShutdownRegistered = false;
  resolvedChannelMap.clear();
  mediaThumbnailCache.clear();
  telegramCache = null;
  lastFetchTime = 0;
  releaseLocalLock();
}

/**
 * Get current client lifecycle state
 */
function getClientLifecycleState() {
  return lifecycleState;
}

/**
 * Interactive one-time login flow for Telegram user accounts
 */
async function authenticateInteractive() {
  const isProd = process.argv.includes('--prod') || process.argv.includes('--production');
  const targetEnv = isProd ? TelegramEnvironment.PRODUCTION : TelegramEnvironment.LOCAL;
  const sessionVarName = isProd ? 'TELEGRAM_SESSION_PRODUCTION' : 'TELEGRAM_SESSION_LOCAL';

  const apiIdStr = process.env.TELEGRAM_API_ID || process.env.TG_API_ID;
  const apiHash = process.env.TELEGRAM_API_HASH || process.env.TG_API_HASH;

  if (!apiIdStr || !apiHash) {
    console.error('\n❌ Error: TELEGRAM_API_ID and TELEGRAM_API_HASH must be configured in .env before running --auth.');
    process.exit(1);
  }

  const apiId = parseInt(apiIdStr, 10);
  if (isNaN(apiId) || apiId <= 0) {
    console.error('\n❌ Error: TELEGRAM_API_ID must be a valid positive integer.');
    process.exit(1);
  }

  console.log(`\n🔐 Telegram MTProto Authentication [Target: ${targetEnv.toUpperCase()} -> ${sessionVarName}]`);
  console.log('─────────────────────────────────────────────────────────────────');

  const existingSession = getSavedSession(targetEnv);
  const stringSession = new StringSession(existingSession);

  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 3,
    timeout: 15,
    autoReconnect: true,
    useWSS: false
  });

  try {
    await client.connect();

    const isAuthorized = await client.checkAuthorization();
    if (isAuthorized) {
      console.log('✅ Existing session for this environment is already authenticated and active!');
      try {
        const me = await client.getMe();
        if (me) {
          console.log(`👤 Connected as: ${me.firstName || ''} ${me.lastName || ''} (@${me.username || me.phone || 'user'})`);
        }
      } catch (e) {}
      const savedStr = client.session.save();
      persistSession(savedStr, targetEnv);
      console.log(`💾 Session verified and saved to ${sessionVarName}.`);
      await client.disconnect();
      return;
    }

    console.log(`Initiating Telegram authentication for ${targetEnv.toUpperCase()} with official MTProto servers...\n`);

    await client.start({
      phoneNumber: async () => {
        return await askQuestion('📱 Enter your Telegram phone number (international format, e.g. +383... / +381...): ');
      },
      password: async (hint) => {
        const hintText = hint ? ` (hint: ${hint})` : '';
        return await askQuestion(`🔒 Enter your 2FA Two-Step Password${hintText}: `);
      },
      phoneCode: async (isCodeViaApp) => {
        const via = isCodeViaApp ? 'Telegram app' : 'SMS';
        return await askQuestion(`📨 Enter the login code received via ${via}: `);
      },
      onError: (err) => {
        console.error('⚠️  Authentication note:', err.message || err);
      }
    });

    const isNowAuthorized = await client.checkAuthorization();
    if (!isNowAuthorized) {
      throw new Error('Authentication completed but session authorization check failed.');
    }

    console.log('\n🎉 Authentication successful!');
    try {
      const me = await client.getMe();
      if (me) {
        console.log(`👤 Logged in as: ${me.firstName || ''} ${me.lastName || ''} (@${me.username || me.phone || 'user'})`);
      }
    } catch (e) {}

    const savedSessionString = client.session.save();
    persistSession(savedSessionString, targetEnv);

    console.log(`💾 Session saved into ${sessionVarName}.`);
    if (isProd) {
      console.log('🚀 For Render deployment: Set TELEGRAM_SESSION_PRODUCTION (or TELEGRAM_SESSION_PROD) in Render Dashboard -> Environment Variables.\n');
    } else {
      console.log('✨ Local development is now configured. You can start SENTINEL without sharing session keys.\n');
    }

    await client.disconnect();
  } catch (err) {
    console.error('\n❌ Authentication failed:', err.message || err);
    try { await client.disconnect(); } catch (e) {}
    process.exit(1);
  }
}

/**
 * Fetch messages via official MTProto API for configured channels
 */
async function fetchViaMTProto(client, channels, limitPerChannel) {
  const posts = [];
  const errors = [];

  for (const rawChannel of channels) {
    const channelName = normalizeChannelName(rawChannel);
    if (!channelName) continue;

    try {
      const entity = await client.getEntity(channelName);
      const channelTitle = entity?.title || rawChannel;
      const username = entity?.username || channelName;
      const entityId = entity?.id ? String(entity.id) : null;

      // Register in resolved channel map so media retrieval recognizes any variations
      registerResolvedChannel(rawChannel, { username, title: channelTitle, id: entityId, canonical: channelName });
      registerResolvedChannel(username, { username, title: channelTitle, id: entityId, canonical: channelName });

      const messages = await client.getMessages(entity, {
        limit: limitPerChannel
      });

      if (Array.isArray(messages)) {
        for (const msg of messages) {
          if (!msg || typeof msg.id !== 'number') continue;
          
          const rawText = msg.message || '';
          const msgDate = msg.date ? new Date(msg.date * 1000).toISOString() : new Date().toISOString();
          const msgId = msg.id;
          const url = username ? `https://t.me/${username}/${msgId}` : null;
          const media = extractMediaInfo(msg, username);

          posts.push({
            id: `tg-${channelName}-${msgId}`,
            messageId: msgId,
            channel: `@${username}`,
            channelUsername: username,
            channelTitle: channelTitle || `@${username}`,
            timestamp: msgDate,
            text: rawText,
            url,
            media,
            views: typeof msg.views === 'number' ? msg.views : null,
            forwards: typeof msg.forwards === 'number' ? msg.forwards : null
          });
        }
      }
    } catch (err) {
      console.warn(`[telegram-monitor] Error fetching channel @${channelName}:`, err.message);
      errors.push({ channel: rawChannel, error: err.message });
    }
  }

  return { posts, errors };
}

/**
 * Fallback to Telegram Bot API (HTTP) chat inspection if only BOT_TOKEN is provided
 */
async function fetchViaBotApi(botToken, channels) {
  const posts = [];
  const errors = [];

  for (const rawChannel of channels) {
    const channelName = normalizeChannelName(rawChannel);
    if (!channelName) continue;

    try {
      const chatId = `@${channelName}`;
      const url = `https://api.telegram.org/bot${botToken}/getChat`;
      const res = await axios.get(url, {
        params: { chat_id: chatId },
        timeout: 8000
      });

      if (res.data && res.data.ok && res.data.result) {
        const chat = res.data.result;
        const pinned = chat.pinned_message;

        registerResolvedChannel(rawChannel, { username: chat.username || channelName, title: chat.title || rawChannel, id: chat.id, canonical: channelName });

        if (pinned && pinned.message_id) {
          const msgDate = pinned.date ? new Date(pinned.date * 1000).toISOString() : new Date().toISOString();
          const text = pinned.text || pinned.caption || '';
          const msgId = pinned.message_id;

          posts.push({
            id: `tg-${channelName}-${msgId}`,
            messageId: msgId,
            channel: `@${channelName}`,
            channelUsername: channelName,
            channelTitle: chat.title || `@${channelName}`,
            timestamp: msgDate,
            text: text,
            url: `https://t.me/${channelName}/${msgId}`,
            media: {
              hasMedia: !!(pinned.photo || pinned.video || pinned.document),
              type: pinned.photo ? 'photo' : pinned.video ? 'video' : pinned.document ? 'document' : null,
              description: pinned.photo ? 'Photo attachment' : pinned.video ? 'Video clip' : null,
              hasPreview: false,
              previewUrl: null
            },
            isPinned: true
          });
        }
      }
    } catch (err) {
      console.warn(`[telegram-monitor] Bot API error for @${channelName}:`, err.message);
      errors.push({ channel: rawChannel, error: err.message });
    }
  }

  return { posts, errors };
}

// In-memory media thumbnail cache
const mediaThumbnailCache = new Map();
const MEDIA_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getDemoThumbnailSvg(channel, type = 'photo') {
  const isVideo = type === 'video';
  const icon = isVideo ? '🎬' : '📷';
  const label = isVideo ? 'VIDEO PREVIEW' : 'IMAGE ATTACHMENT';
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0b1329" />
          <stop offset="50%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#020617" />
        </linearGradient>
        <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(56,189,248,0.06)" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="640" height="360" fill="url(#bg)" />
      <rect width="640" height="360" fill="url(#grid)" />
      <rect x="20" y="20" width="600" height="320" rx="8" fill="none" stroke="rgba(56,189,248,0.2)" stroke-dasharray="4 4" />
      <text x="320" y="150" font-size="42" text-anchor="middle" dominant-baseline="middle">${icon}</text>
      <text x="320" y="200" font-family="monospace" font-size="14" font-weight="bold" fill="#38bdf8" text-anchor="middle" letter-spacing="1">@${channel.toUpperCase()} · ${label}</text>
      <text x="320" y="230" font-family="monospace" font-size="11" fill="#64748b" text-anchor="middle">CLICK TO OPEN ON TELEGRAM</text>
    </svg>
  `, 'utf-8');
}

/**
 * Fetch a lightweight media thumbnail from Telegram
 */
async function fetchMediaThumbnail({ channel, messageId, demo = false }) {
  if (!channel || !messageId) return null;

  const msgId = parseInt(messageId, 10);
  if (isNaN(msgId) || msgId <= 0) return null;

  if (!isChannelConfigured(channel)) {
    console.warn(`[telegram-monitor] Media request rejected for unconfigured channel: ${channel}`);
    return null;
  }

  const normalized = normalizeChannelName(channel);
  const cacheKey = `${normalized}:${msgId}`;

  if (demo) {
    const svgBuf = getDemoThumbnailSvg(normalized, 'photo');
    return { buffer: svgBuf, mimeType: 'image/svg+xml' };
  }

  const cached = mediaThumbnailCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < MEDIA_CACHE_TTL_MS)) {
    return { buffer: cached.buffer, mimeType: cached.mimeType };
  }

  try {
    const client = await getTelegramClient();
    if (!client) return null;

    const entity = await client.getEntity(normalized);
    if (!entity) return null;

    const messages = await client.getMessages(entity, { ids: [msgId] });
    const msg = messages && messages[0];
    if (!msg || !msg.media) return null;

    let thumbBuffer = null;
    try {
      thumbBuffer = await client.downloadMedia(msg, {
        thumb: 1,
        workers: 1
      });
    } catch (e) {
      try {
        thumbBuffer = await client.downloadMedia(msg, {
          thumb: 0,
          workers: 1
        });
      } catch (e2) {
        console.warn(`[telegram-monitor] Failed to download thumbnail for @${normalized}/${msgId}:`, e2.message);
      }
    }

    if (thumbBuffer && Buffer.isBuffer(thumbBuffer) && thumbBuffer.length > 0) {
      const mimeType = 'image/jpeg';
      mediaThumbnailCache.set(cacheKey, {
        buffer: thumbBuffer,
        mimeType,
        timestamp: Date.now()
      });
      return { buffer: thumbBuffer, mimeType };
    }

    return null;
  } catch (err) {
    console.warn(`[telegram-monitor] Error fetching media thumbnail for @${normalized}/${msgId}:`, err.message);
    return null;
  }
}

/**
 * Generate simulated demo posts for standalone testing
 */
function getDemoData(channels = DEFAULT_CHANNELS) {
  const now = Date.now();
  const demoPosts = [
    {
      id: 'tg-koridorsrb-1042',
      messageId: 1042,
      channel: '@koridorsrb',
      channelUsername: 'koridorsrb',
      channelTitle: 'Koridor Srbija',
      timestamp: new Date(now - 15 * 60 * 1000).toISOString(),
      text: 'Извештај о стању на путевима: Саобраћај на правцу Рашка - Јариње одвија се без застоја. Појачан интензитет теретних возила.',
      url: 'https://t.me/koridorsrb/1042',
      media: {
        hasMedia: true,
        type: 'video',
        description: 'Traffic report video clip',
        mimeType: 'video/mp4',
        hasPreview: true,
        previewUrl: '/api/telegram/media?channel=koridorsrb&id=1042&demo=true'
      },
      views: 1240,
      forwards: 35
    },
    {
      id: 'tg-srpskinat-892',
      messageId: 892,
      channel: '@srpskinat',
      channelUsername: 'srpskinat',
      channelTitle: 'Српски Национални Инфо',
      timestamp: new Date(now - 45 * 60 * 1000).toISOString(),
      text: 'Редовно праћење ситуације на северу Косова и Метохије. Снабдевање основним намирницама и лековима стабилно у свим општинама.',
      url: 'https://t.me/srpskinat/892',
      media: {
        hasMedia: true,
        type: 'photo',
        description: 'Photo attachment',
        hasPreview: true,
        previewUrl: '/api/telegram/media?channel=srpskinat&id=892&demo=true'
      },
      views: 2890,
      forwards: 78
    },
    {
      id: 'tg-istokinfo-521',
      messageId: 521,
      channel: '@istokinfo',
      channelUsername: 'istokinfo',
      channelTitle: 'Исток Инфо',
      timestamp: new Date(now - 110 * 60 * 1000).toISOString(),
      text: 'Информативна белешка: Метеоролошке прилике на подручју Ибра повољне, водостај река у границама нормале.',
      url: 'https://t.me/istokinfo/521',
      media: { hasMedia: false, type: null, description: null, hasPreview: false, previewUrl: null },
      views: 890,
      forwards: 12
    }
  ];

  return {
    skill: 'telegram-monitor',
    status: 'LIVE_DATA',
    source: 'Telegram Official API (Test/Demo Mode)',
    updatedAt: new Date().toISOString(),
    channels,
    count: demoPosts.length,
    posts: demoPosts,
    message: 'Displaying test/demo data for verification.',
    isCached: false
  };
}

/**
 * Main skill entry point: Fetches recent posts from configured public Telegram channels
 */
async function fetchTelegram({
  channels = null,
  limitPerChannel = null,
  forceRefresh = false,
  useDemo = false
} = {}) {
  // Check demo mode
  if (useDemo) {
    return getDemoData(channels || getConfiguredChannels());
  }

  // Check cache
  if (!forceRefresh && telegramCache && (Date.now() - lastFetchTime < DEFAULT_CACHE_TTL_MS)) {
    return { ...telegramCache, isCached: true };
  }

  const targetChannels = (Array.isArray(channels) && channels.length > 0)
    ? channels.map(c => normalizeChannelName(c)).filter(Boolean)
    : getConfiguredChannels();

  const limit = Math.max(1, Math.min(20, parseInt(limitPerChannel || process.env.TELEGRAM_LIMIT_PER_CHANNEL || '10', 10)));

  // Validate environment configuration
  const env = getTelegramEnvironment();
  const validation = validateTelegramConfiguration(env);

  if (!validation.valid) {
    return {
      skill: 'telegram-monitor',
      status: 'NOT_CONFIGURED',
      source: 'Telegram Official API',
      updatedAt: new Date().toISOString(),
      channels: targetChannels,
      count: 0,
      posts: [],
      error: 'NOT_CONFIGURED',
      message: validation.errors[0] || 'Telegram API is not configured.',
      isCached: false
    };
  }

  try {
    let posts = [];
    let fetchErrors = [];
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const apiId = process.env.TELEGRAM_API_ID || process.env.TG_API_ID;
    const apiHash = process.env.TELEGRAM_API_HASH || process.env.TG_API_HASH;

    // Approach 1: Telegram MTProto Official Client
    if (apiId && apiHash) {
      try {
        const client = await getTelegramClient();
        if (client) {
          const result = await fetchViaMTProto(client, targetChannels, limit);
          posts = result.posts;
          fetchErrors = result.errors;
        } else if (!botToken) {
          fetchErrors.push({
            general: env === TelegramEnvironment.PRODUCTION
              ? 'Production session is not configured or unauthorized.'
              : 'Local session not authenticated. Run "node skills/telegram-monitor/skill.js --auth" to authenticate.'
          });
        }
      } catch (clientErr) {
        const msg = clientErr.message || '';
        if (msg.includes('AUTH_KEY_DUPLICATED')) {
          fetchErrors.push({
            general: `406 AUTH_KEY_DUPLICATED: Session key collision between local and production. Ensure ${env === 'production' ? 'TELEGRAM_SESSION_PRODUCTION' : 'TELEGRAM_SESSION_LOCAL'} is unique to this environment.`
          });
        } else {
          console.warn('[telegram-monitor] MTProto fetch failed:', msg);
          fetchErrors.push({ general: msg });
        }
      }
    }

    // Approach 2: Telegram Bot API fallback
    if (posts.length === 0 && botToken) {
      try {
        const result = await fetchViaBotApi(botToken, targetChannels);
        posts = result.posts;
        fetchErrors = result.errors;
      } catch (botErr) {
        console.warn('[telegram-monitor] Bot API fetch failed:', botErr.message);
        fetchErrors.push({ botApi: botErr.message });
      }
    }

    // Sort posts chronologically descending (newest first)
    posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Determine status
    let status = 'LIVE_DATA';
    if (posts.length === 0) {
      if (fetchErrors.length >= targetChannels.length && targetChannels.length > 0) {
        const allInvalid = fetchErrors.every(e => (e.error || '').includes('USERNAME_INVALID') || (e.error || '').includes('CHANNEL_PRIVATE'));
        status = allInvalid ? 'INVALID_DATA' : 'UNAVAILABLE';
      } else if (fetchErrors.length > 0) {
        status = 'UNAVAILABLE';
      } else {
        status = 'NO_POSTS';
      }
    }

    const payload = {
      skill: 'telegram-monitor',
      status,
      source: 'Telegram Official API',
      updatedAt: new Date().toISOString(),
      channels: targetChannels,
      count: posts.length,
      posts,
      error: status === 'UNAVAILABLE' || status === 'INVALID_DATA' ? (fetchErrors[0]?.error || fetchErrors[0]?.general || 'Failed to fetch messages') : null,
      message: status === 'NO_POSTS' ? 'No recent posts found in configured public channels.' : (status === 'UNAVAILABLE' ? (fetchErrors[0]?.general || 'Telegram service unreachable') : null),
      isCached: false
    };

    // Cache successful response
    if (status === 'LIVE_DATA' || status === 'NO_POSTS') {
      telegramCache = payload;
      lastFetchTime = Date.now();
    }

    return payload;
  } catch (err) {
    console.error('[telegram-monitor] Unexpected error:', err.message);
    return {
      skill: 'telegram-monitor',
      status: 'UNAVAILABLE',
      source: 'Telegram Official API',
      updatedAt: new Date().toISOString(),
      channels: targetChannels,
      count: 0,
      posts: [],
      error: 'SERVICE_UNAVAILABLE',
      message: err.message || 'Telegram network service is currently unreachable.',
      isCached: false
    };
  }
}

module.exports = {
  fetchTelegram,
  fetchMediaThumbnail,
  normalizeChannelName,
  extractMediaInfo,
  getConfiguredChannels,
  isChannelConfigured,
  registerResolvedChannel,
  authenticateInteractive,
  getSavedSession,
  persistSession,
  getTelegramEnvironment,
  validateTelegramConfiguration,
  getTelegramClient,
  disconnectTelegramClient,
  getClientLifecycleState,
  acquireLocalLock,
  releaseLocalLock,
  _resetTelegramClientForTesting,
  ClientLifecycleState,
  TelegramEnvironment,
  DEFAULT_CHANNELS,
  KNOWN_CHANNEL_ALIASES
};

if (require.main === module) {
  const isAuth = process.argv.includes('--auth') || process.argv.includes('-a');
  const isTest = process.argv.includes('--test');

  if (isAuth) {
    authenticateInteractive();
  } else {
    fetchTelegram({ useDemo: isTest }).then(res => {
      console.log('Status:', res.status);
      console.log('Source:', res.source);
      console.log('Channels:', res.channels);
      console.log('Total Posts:', res.count);
      if (res.posts && res.posts.length > 0) {
        console.log('Sample Post:\n', JSON.stringify(res.posts[0], null, 2));
      } else {
        console.log('Message:', res.message || res.error || 'No posts');
      }
    }).catch(console.error);
  }
}
