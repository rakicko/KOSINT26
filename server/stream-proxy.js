'use strict';

/**
 * Selective Manifest-Only Stream Proxy for KOSINT26
 *
 * HYBRID STREAMING ARCHITECTURE:
 * - Proxies ONLY the lightweight textual .m3u8 manifest files to inject CORS headers.
 * - Parses and rewrites all relative video segment (.ts / .m4s) URLs into absolute CDN paths.
 * - Clients download multi-megabyte video chunks DIRECTLY from broadcaster CDNs.
 * - Consumes virtually 0 outbound bandwidth on Render (under 100 GB/month limit).
 */

const axios = require('axios');

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
 * Parses and rewrites relative segment & sub-manifest URIs in an HLS manifest.
 * - Sub-manifests (.m3u8): routed through manifest proxy so variant lists receive CORS headers.
 * - Video segments (.ts, .m4s, .aac): rewritten to absolute origin CDN URLs for direct client download.
 */
function rewriteManifest(manifestText, manifestUrl) {
  if (!manifestText || typeof manifestText !== 'string') return '';

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

      // If the line points to a child variant m3u8 playlist, route through the manifest proxy
      // so the browser gets CORS headers on the sub-manifest without proxying video chunks
      if (absUrl.toLowerCase().includes('.m3u8')) {
        return `/api/stream/manifest?url=${encodeURIComponent(absUrl)}`;
      }

      // Media segment (.ts, .m4s, .mp4, .aac): point directly to broadcaster origin CDN
      return absUrl;
    } catch {
      return line;
    }
  });

  return rewritten.join('\n');
}

/**
 * Express handler for GET /api/stream/manifest?url=...
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

  try {
    let manifestText = '';

    // 1. Attempt fetch via native global fetch (Node 18+)
    if (typeof fetch === 'function') {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      try {
        const upstreamRes = await fetch(targetUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            'Accept': '*/*'
          }
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
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          'Accept': '*/*'
        }
      });
      manifestText = response.data;
    }

    if (!manifestText || !manifestText.includes('#EXTM3U')) {
      // Some servers might return an HTML error page or empty body
      return res.status(502).json({
        error: 'Upstream response is not a valid HLS manifest (#EXTM3U missing)',
        url: targetUrl
      });
    }

    // Rewrite relative URLs to absolute CDN URLs
    const rewritten = rewriteManifest(manifestText, targetUrl);

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

// Router instantiation
const express = require('express');
const streamProxyRouter = express.Router();
streamProxyRouter.get('/manifest', handleManifestProxy);

module.exports = {
  streamProxyRouter,
  handleManifestProxy,
  validateStreamUrl,
  rewriteManifest
};
