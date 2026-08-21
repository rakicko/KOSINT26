'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const axios = require('axios');

// Default public channels if not configured
const DEFAULT_CHANNELS = ['koridorsrb', 'srpskinat', 'istokinfo'];

// In-memory cache
let telegramCache = null;
let lastFetchTime = 0;
const DEFAULT_CACHE_TTL_MS = parseInt(process.env.TELEGRAM_CACHE_TTL_MS || '60000', 10); // 60 seconds

// Singleton Telegram client instance to reuse connection
let activeClient = null;
let clientConnecting = null;

/**
 * Clean and normalize channel usernames
 * Strips '@' or 'https://t.me/' prefixes
 */
function normalizeChannelName(rawName) {
  if (!rawName || typeof rawName !== 'string') return '';
  let cleaned = rawName.trim();
  cleaned = cleaned.replace(/^https?:\/\/t\.me\//i, '');
  cleaned = cleaned.replace(/^@/, '');
  cleaned = cleaned.replace(/\/$/, '');
  return cleaned.trim();
}

/**
 * Parse configured channels from environment or defaults
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

  // Geo / Venue (Read-only metadata, strictly non-interactive)
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
 * Initialize or get active MTProto client
 */
async function getTelegramClient() {
  const apiIdStr = process.env.TELEGRAM_API_ID || process.env.TG_API_ID;
  const apiHash = process.env.TELEGRAM_API_HASH || process.env.TG_API_HASH;
  const sessionStr = process.env.TELEGRAM_SESSION || process.env.TELEGRAM_STRING_SESSION || '';
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!apiIdStr || !apiHash) {
    return null;
  }

  const apiId = parseInt(apiIdStr, 10);
  if (isNaN(apiId) || apiId <= 0) {
    return null;
  }

  if (activeClient && activeClient.connected) {
    return activeClient;
  }

  if (clientConnecting) {
    return clientConnecting;
  }

  clientConnecting = (async () => {
    try {
      const stringSession = new StringSession(sessionStr);
      const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 2,
        timeout: 10,
        autoReconnect: true,
        useWSS: false
      });

      if (botToken) {
        await client.start({
          botAuthToken: botToken
        });
      } else {
        await client.connect();
      }

      activeClient = client;
      return client;
    } catch (err) {
      console.warn('[telegram-monitor] Failed to connect MTProto client:', err.message);
      activeClient = null;
      throw err;
    } finally {
      clientConnecting = null;
    }
  })();

  return clientConnecting;
}

/**
 * Fetch messages via official MTProto API for configured channels
 */
async function fetchViaMTProto(client, channels, limitPerChannel) {
  const posts = [];
  const errors = [];

  for (const channelName of channels) {
    try {
      const entity = await client.getEntity(channelName);
      const channelTitle = entity?.title || channelName;
      const username = entity?.username || channelName;

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
            id: `tg-${username}-${msgId}`,
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
      errors.push({ channel: channelName, error: err.message });
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

  for (const channelName of channels) {
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
      errors.push({ channel: channelName, error: err.message });
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

  const normalized = normalizeChannelName(channel);
  const msgId = parseInt(messageId, 10);
  if (isNaN(msgId) || msgId <= 0) return null;

  // Security whitelist check: only allow configured channels
  const allowedChannels = getConfiguredChannels();
  if (!allowedChannels.includes(normalized)) {
    console.warn(`[telegram-monitor] Media request rejected for unconfigured channel: ${channel}`);
    return null;
  }

  const cacheKey = `${normalized}:${msgId}`;

  // Check demo mode
  if (demo) {
    const svgBuf = getDemoThumbnailSvg(normalized, 'photo');
    return { buffer: svgBuf, mimeType: 'image/svg+xml' };
  }

  // Check memory cache
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

    // Download ONLY the small thumbnail
    let thumbBuffer = null;
    try {
      thumbBuffer = await client.downloadMedia(msg, {
        thumb: 1,
        workers: 1
      });
    } catch (e) {
      // Fallback to smallest available photo size if thumb:1 is not indexed
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
 * Generate simulated demo posts for standalone CLI testing
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
 * 
 * Returns normalized structure:
 * {
 *   skill: 'telegram-monitor',
 *   status: 'LIVE_DATA' | 'NO_POSTS' | 'NOT_CONFIGURED' | 'UNAVAILABLE' | 'INVALID_DATA',
 *   source: 'Telegram Official API',
 *   updatedAt: '...',
 *   channels: ['koridorsrb', 'srpskinat', 'istokinfo'],
 *   count: N,
 *   posts: [ ... ],
 *   message: '...',
 *   isCached: boolean
 * }
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

  // Check if credentials are configured
  const apiId = process.env.TELEGRAM_API_ID || process.env.TG_API_ID;
  const apiHash = process.env.TELEGRAM_API_HASH || process.env.TG_API_HASH;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if ((!apiId || !apiHash) && !botToken) {
    return {
      skill: 'telegram-monitor',
      status: 'NOT_CONFIGURED',
      source: 'Telegram Official API',
      updatedAt: new Date().toISOString(),
      channels: targetChannels,
      count: 0,
      posts: [],
      message: 'Telegram API is not configured. Set TELEGRAM_API_ID and TELEGRAM_API_HASH (or TELEGRAM_BOT_TOKEN) in environment variables.',
      isCached: false
    };
  }

  try {
    let posts = [];
    let fetchErrors = [];

    // Approach 1: Telegram MTProto Official Client
    if (apiId && apiHash) {
      try {
        const client = await getTelegramClient();
        if (client) {
          const result = await fetchViaMTProto(client, targetChannels, limit);
          posts = result.posts;
          fetchErrors = result.errors;
        }
      } catch (clientErr) {
        console.warn('[telegram-monitor] MTProto fetch failed:', clientErr.message);
        fetchErrors.push({ general: clientErr.message });
      }
    }

    // Approach 2: Telegram Bot API fallback if MTProto failed or not available
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
      error: status === 'UNAVAILABLE' || status === 'INVALID_DATA' ? (fetchErrors[0]?.error || 'Failed to fetch messages') : null,
      message: status === 'NO_POSTS' ? 'No recent posts found in configured public channels.' : null,
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
  DEFAULT_CHANNELS
};

if (require.main === module) {
  const isTest = process.argv.includes('--test');
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
