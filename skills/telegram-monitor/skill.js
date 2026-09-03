'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const axios = require('axios');

// Default public channels if not configured
const DEFAULT_CHANNELS = ['koridorsrb', 'srpskinat', 'istokinfo'];

// In-memory cache
let telegramCache = null;
let lastFetchTime = 0;
const DEFAULT_CACHE_TTL_MS = parseInt(process.env.TELEGRAM_CACHE_TTL_MS || '60000', 10); // 60 seconds

/**
 * Clean and normalize channel usernames
 * Strips '@' or 'https://t.me/' prefixes
 */
function normalizeChannelName(rawName) {
  if (!rawName || typeof rawName !== 'string') return '';
  let cleaned = rawName.trim();
  cleaned = cleaned.replace(/^https?:\/\/t\.me\/(s\/)?/i, '');
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
 * Parse public Telegram web channel preview (https://t.me/s/<channel>)
 * Official read-only public channel feed provided directly by Telegram without credentials
 */
async function fetchViaPublicWeb(channels, limitPerChannel) {
  const posts = [];
  const errors = [];

  for (const channelName of channels) {
    try {
      const url = `https://t.me/s/${encodeURIComponent(channelName)}`;
      const response = await axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,sr;q=0.8'
        }
      });

      const html = response.data || '';
      
      const titleMatch = html.match(/<div class="tgme_channel_info_header_title"[^>]*><span dir="auto">([^<]+)<\/span>/i) ||
                         html.match(/<meta property="og:title" content="([^"]+)"/i);
      const channelTitle = titleMatch ? titleMatch[1].trim() : `@${channelName}`;

      const widgetBlocks = html.split('<div class="tgme_widget_message_wrap');
      const channelPosts = [];

      for (let i = 1; i < widgetBlocks.length; i++) {
        const block = widgetBlocks[i];

        const idMatch = block.match(/data-post="[^"/]+\/(\d+)"/i);
        if (!idMatch) continue;
        const msgId = parseInt(idMatch[1], 10);
        if (isNaN(msgId) || msgId <= 0) continue;

        let rawText = '';
        const textMatch = block.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        if (textMatch) {
          rawText = textMatch[1]
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
        }

        let msgDate = new Date().toISOString();
        const timeMatch = block.match(/<time[^>]+datetime="([^"]+)"/i);
        if (timeMatch) {
          const parsed = new Date(timeMatch[1]);
          if (!isNaN(parsed.getTime())) {
            msgDate = parsed.toISOString();
          }
        }

        let views = null;
        const viewsMatch = block.match(/<span class="tgme_widget_message_views">([^<]+)<\/span>/i);
        if (viewsMatch) {
          const vStr = viewsMatch[1].trim().toUpperCase();
          if (vStr.endsWith('K')) views = Math.round(parseFloat(vStr) * 1000);
          else if (vStr.endsWith('M')) views = Math.round(parseFloat(vStr) * 1000000);
          else views = parseInt(vStr.replace(/\D/g, ''), 10) || null;
        }

        const hasPhoto = block.includes('tgme_widget_message_photo');
        const hasVideo = block.includes('tgme_widget_message_video');
        const hasDoc = block.includes('tgme_widget_message_document');

        let media = {
          hasMedia: hasPhoto || hasVideo || hasDoc,
          type: hasPhoto ? 'photo' : hasVideo ? 'video' : hasDoc ? 'document' : null,
          description: hasPhoto ? 'Photo attachment' : hasVideo ? 'Video clip' : hasDoc ? 'Document' : null,
          hasPreview: hasPhoto || hasVideo,
          previewUrl: `/api/telegram/media?channel=${encodeURIComponent(channelName)}&id=${msgId}`
        };

        channelPosts.push({
          id: `tg-${channelName}-${msgId}`,
          messageId: msgId,
          channel: `@${channelName}`,
          channelUsername: channelName,
          channelTitle,
          timestamp: msgDate,
          text: rawText,
          url: `https://t.me/${channelName}/${msgId}`,
          media,
          views,
          forwards: null
        });
      }

      channelPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      posts.push(...channelPosts.slice(0, limitPerChannel));

    } catch (err) {
      console.warn(`[telegram-monitor] Public web fetch error for @${channelName}:`, err.message);
      errors.push({ channel: channelName, error: err.message });
    }
  }

  return { posts, errors };
}

/**
 * Fallback to Telegram Bot API (HTTP) chat inspection if BOT_TOKEN is provided
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
            text,
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
 * Fetch a safe lightweight media preview for Telegram
 */
async function fetchMediaThumbnail({ channel, messageId, demo = false }) {
  if (!channel || !messageId) return null;

  const normalized = normalizeChannelName(channel);
  const msgId = parseInt(messageId, 10);
  if (isNaN(msgId) || msgId <= 0) return null;

  const allowedChannels = getConfiguredChannels();
  if (!allowedChannels.includes(normalized)) {
    console.warn(`[telegram-monitor] Media request rejected for unconfigured channel: ${channel}`);
    return null;
  }

  const cacheKey = `${normalized}:${msgId}`;

  if (demo) {
    const svgBuf = getDemoThumbnailSvg(normalized, 'photo');
    return { buffer: svgBuf, mimeType: 'image/svg+xml' };
  }

  const cached = mediaThumbnailCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < MEDIA_CACHE_TTL_MS)) {
    return { buffer: cached.buffer, mimeType: cached.mimeType };
  }

  const svgBuf = getDemoThumbnailSvg(normalized, 'photo');
  mediaThumbnailCache.set(cacheKey, {
    buffer: svgBuf,
    mimeType: 'image/svg+xml',
    timestamp: Date.now()
  });

  return { buffer: svgBuf, mimeType: 'image/svg+xml' };
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
    source: 'Telegram Public Feed (Demo Mode)',
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
  if (useDemo) {
    return getDemoData(channels || getConfiguredChannels());
  }

  if (!forceRefresh && telegramCache && (Date.now() - lastFetchTime < DEFAULT_CACHE_TTL_MS)) {
    return { ...telegramCache, isCached: true };
  }

  const targetChannels = (Array.isArray(channels) && channels.length > 0)
    ? channels.map(c => normalizeChannelName(c)).filter(Boolean)
    : getConfiguredChannels();

  const limit = Math.max(1, Math.min(20, parseInt(limitPerChannel || process.env.TELEGRAM_LIMIT_PER_CHANNEL || '10', 10)));
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  try {
    let posts = [];
    let fetchErrors = [];

    // Approach 1: Official Bot API if configured
    if (botToken) {
      try {
        const result = await fetchViaBotApi(botToken, targetChannels);
        if (result.posts.length > 0) {
          posts = result.posts;
        }
      } catch (botErr) {
        console.warn('[telegram-monitor] Bot API attempt failed, falling back to public web:', botErr.message);
      }
    }

    // Approach 2: Public channel web reader (official, read-only, credential-free)
    if (posts.length === 0) {
      const result = await fetchViaPublicWeb(targetChannels, limit);
      posts = result.posts;
      fetchErrors = result.errors;
    }

    posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    let status = 'LIVE_DATA';
    if (posts.length === 0) {
      status = fetchErrors.length >= targetChannels.length && targetChannels.length > 0
        ? 'UNAVAILABLE'
        : 'NO_POSTS';
    }

    const payload = {
      skill: 'telegram-monitor',
      status,
      source: botToken ? 'Telegram Official Bot API' : 'Telegram Public Channel Feeds',
      updatedAt: new Date().toISOString(),
      channels: targetChannels,
      count: posts.length,
      posts,
      error: status === 'UNAVAILABLE' ? (fetchErrors[0]?.error || 'Failed to fetch public channel messages') : null,
      message: status === 'NO_POSTS' ? 'No recent posts found in configured public channels.' : null,
      isCached: false
    };

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
      source: 'Telegram Public Channel Feeds',
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
  getConfiguredChannels,
  DEFAULT_CHANNELS,
  getDemoData
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
