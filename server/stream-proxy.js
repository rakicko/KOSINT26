'use strict';

/**
 * Selective Manifest-Only Stream Proxy for KOSINT26
 *
 * HYBRID STREAMING ARCHITECTURE:
 * - Proxies lightweight textual .m3u8 manifest files to inject CORS and legitimate broadcaster headers.
 * - Parses and rewrites relative video segment (.ts / .m4s) URLs into absolute CDN paths by default.
 * - Clients download multi-megabyte video chunks DIRECTLY from broadcaster CDNs (0 Render bandwidth consumed).
 * - Provides an optional header-spoofed segment proxy (/api/stream/segment) strictly for hotlink-protected CDNs.
 */

const axios = require('axios');
const express = require('express');

/**
 * SSRF and Protocol Validator
 * Ensures only valid remote HTTP/HTTPS streaming endpoints are proxied.
 * Rejects private, loopback, link-local, and internal cloud metadata addresses.
 */
function validateStreamUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'URL parameter must be a non-empty string' };
  }

  const trimmed = rawUrl.trim();
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Malformed stream URL' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTP and HTTPS protocols are supported' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost and loopbacks
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local')
  ) {
    return { valid: false, error: 'Access to loopback addresses is restricted' };
  }

  // Block AWS/GCP/Azure link-local metadata
  if (hostname === '169.254.169.254' || hostname.startsWith('169.254.')) {
    return { valid: false, error: 'Access to link-local metadata is restricted' };
  }

  // Block common RFC 1918 private IP subnets
  if (
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
  ) {
    return { valid: false, error: 'Access to private subnets is restricted' };
  }

  return { valid: true, url: parsed.href, origin: parsed.origin };
}

/**
 * Derives legitimate broadcaster upstream request headers (User-Agent, Referer, Origin)
 * to bypass 403 Forbidden hotlink defenses on regional CDNs.
 */
function getBroadcasterHeaders(targetUrl, customReferer) {
  let referer = customReferer ? String(customReferer).trim() : '';
  let origin = '';

  if (!referer) {
    try {
      const u = new URL(targetUrl);
      const host = u.hostname.toLowerCase();

      if (host.includes('bhtelecom.ba')) {
        referer = 'https://webtv.bhtelecom.ba/';
        origin = 'https://webtv.bhtelecom.ba';
      } else if (host.includes('gjirafa.net') || host.includes('gjirafa.com')) {
        referer = 'https://video.gjirafa.com/';
        origin = 'https://video.gjirafa.com';
      } else if (host.includes('rts.rs')) {
        referer = 'https://www.rts.rs/';
        origin = 'https://www.rts.rs';
      } else if (host.includes('rtklive.com')) {
        referer = 'https://www.rtklive.com/';
        origin = 'https://www.rtklive.com';
      } else if (host.includes('koha.net')) {
        referer = 'https://www.koha.net/';
        origin = 'https://www.koha.net';
      } else if (host.includes('n1info.')) {
        referer = 'https://n1info.rs/';
        origin = 'https://n1info.rs';
      } else if (host.includes('euronews.')) {
        referer = 'https://euronews.rs/';
        origin = 'https://euronews.rs';
      } else if (host.includes('trt.net.tr') || host.includes('trt.com.tr') || host.includes('trtworld.com')) {
        referer = 'https://www.trtworld.com/';
        origin = 'https://www.trtworld.com';
      } else {
        referer = u.origin + '/';
        origin = u.origin;
      }
    } catch {
      referer = 'https://www.google.com/';
      origin = 'https://www.google.com';
    }
  } else {
    try {
      origin = new URL(referer).origin;
    } catch {
      origin = referer;
    }
  }

  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Referer': referer,
    'Origin': origin,
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9,sr;q=0.8,sq;q=0.7',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site'
  };
}

/**
 * Parses and rewrites relative segment & sub-manifest URIs in an HLS manifest.
 * - Sub-manifests (.m3u8): routed through manifest proxy so variant lists receive CORS headers.
 * - Video segments (.ts, .m4s, .aac):
 *     * Default: rewritten to absolute origin CDN URLs for direct client download (0 Render bandwidth).
 *     * With proxySegments=true: routed through /api/stream/segment for hotlink-protected feeds.
 */
function rewriteManifest(manifestText, manifestUrl, options = {}) {
  if (!manifestText || typeof manifestText !== 'string') return '';

  const proxySegments = Boolean(options.proxySegments);
  const referer = options.referer || '';

  const lines = manifestText.split(/\r?\n/);
  const rewritten = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    // Rewrite tag attributes with URIs (e.g., #EXT-X-KEY:METHOD=...,URI="key.bin")
    if (trimmed.startsWith('#')) {
      return line.replace(/URI="([^"]+)"/g, (match, uri) => {
        try {
          const absUri = new URL(uri, manifestUrl).href;
          return `URI="${absUri}"`;
        } catch {
          return match;
        }
      });
    }

    // Line is a URI (variant sub-playlist or media chunk)
    try {
      const absUrl = new URL(trimmed, manifestUrl).href;

      // Variant sub-playlist (.m3u8): route through manifest proxy
      if (absUrl.toLowerCase().includes('.m3u8')) {
        let proxyPath = `/api/stream/manifest?url=${encodeURIComponent(absUrl)}`;
        if (referer) proxyPath += `&ref=${encodeURIComponent(referer)}`;
        if (proxySegments) proxyPath += `&proxySegments=1`;
        return proxyPath;
      }

      // Media segment (.ts, .m4s, .mp4, .aac):
      if (proxySegments) {
        let segPath = `/api/stream/segment?url=${encodeURIComponent(absUrl)}`;
        if (referer) segPath += `&ref=${encodeURIComponent(referer)}`;
        return segPath;
      }

      // Default: direct origin CDN path
      return absUrl;
    } catch {
      return line;
    }
  });

  return rewritten.join('\n');
}

/**
 * Express handler for GET /api/stream/manifest?url=...&ref=...&proxySegments=1
 */
async function handleManifestProxy(req, res) {
  // CORS & No-Cache response headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  const rawTargetUrl = req.query.url;
  const validation = validateStreamUrl(rawTargetUrl);

  if (!validation.valid) {
    return res.status(400).json({
      error: 'Invalid or restricted stream URL',
      details: validation.error
    });
  }

  const targetUrl = validation.url;
  const customRef = req.query.ref || '';
  const proxySegments = req.query.proxySegments === '1' || req.query.proxySegments === 'true';
  const upstreamHeaders = getBroadcasterHeaders(targetUrl, customRef);

  try {
    let manifestText = '';

    // 1. Attempt fetch via native global fetch (Node 18+)
    if (typeof fetch === 'function') {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      try {
        const upstreamRes = await fetch(targetUrl, {
          signal: controller.signal,
          headers: upstreamHeaders
        });

        clearTimeout(timeoutId);

        if (!upstreamRes.ok) {
          return res.status(502).json({
            error: 'Upstream broadcaster CDN returned error',
            status: upstreamRes.status,
            statusText: upstreamRes.statusText,
            url: targetUrl
          });
        }

        manifestText = await upstreamRes.text();
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        throw fetchErr;
      }
    } else {
      // 2. Fallback to axios
      const response = await axios.get(targetUrl, {
        timeout: 6500,
        responseType: 'text',
        headers: upstreamHeaders
      });
      manifestText = response.data;
    }

    if (!manifestText || !manifestText.includes('#EXTM3U')) {
      return res.status(502).json({
        error: 'Upstream response is not a valid HLS manifest (#EXTM3U missing)',
        url: targetUrl
      });
    }

    // Rewrite relative URLs to absolute CDN URLs (or segment proxy if requested)
    const rewritten = rewriteManifest(manifestText, targetUrl, {
      proxySegments,
      referer: upstreamHeaders.Referer
    });

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    return res.status(200).send(rewritten);

  } catch (err) {
    const isTimeout = err.name === 'AbortError' || err.code === 'ECONNABORTED' || err.message?.includes('timeout');
    const statusCode = isTimeout ? 504 : 502;
    return res.status(statusCode).json({
      error: isTimeout ? 'Gateway timeout fetching stream manifest' : 'Failed to fetch manifest from upstream CDN',
      details: err.message || String(err),
      url: targetUrl
    });
  }
}

/**
 * Express handler for GET /api/stream/segment?url=...&ref=...
 * Streams a single media chunk (.ts/.m4s) with spoofed headers when broadcaster strictly forbids raw client IP/browser headers.
 */
async function handleSegmentProxy(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
  res.setHeader('Cache-Control', 'public, max-age=300');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  const rawTargetUrl = req.query.url;
  const validation = validateStreamUrl(rawTargetUrl);

  if (!validation.valid) {
    return res.status(400).json({
      error: 'Invalid or restricted segment URL',
      details: validation.error
    });
  }

  const targetUrl = validation.url;
  const upstreamHeaders = getBroadcasterHeaders(targetUrl, req.query.ref);
  if (req.headers.range) {
    upstreamHeaders.Range = req.headers.range;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const upstreamRes = await fetch(targetUrl, {
      signal: controller.signal,
      headers: upstreamHeaders
    });

    clearTimeout(timeoutId);

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).send('Segment upstream error');
    }

    const contentType = upstreamRes.headers.get('content-type') || 'video/mp2t';
    res.setHeader('Content-Type', contentType);

    const contentLength = upstreamRes.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    if (upstreamRes.body) {
      const { Readable } = require('stream');
      Readable.fromWeb(upstreamRes.body).pipe(res);
    } else {
      const buffer = await upstreamRes.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  } catch (err) {
    return res.status(502).send('Failed to proxy video segment');
  }
}

// Router instantiation
const streamProxyRouter = express.Router();
streamProxyRouter.get('/manifest', handleManifestProxy);
streamProxyRouter.get('/segment', handleSegmentProxy);

module.exports = {
  streamProxyRouter,
  handleManifestProxy,
  handleSegmentProxy,
  validateStreamUrl,
  getBroadcasterHeaders,
  rewriteManifest
};
