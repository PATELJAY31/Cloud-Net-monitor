import dns from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import { performance } from 'node:perf_hooks';
import { ApiError } from '../utils/apiError.js';

const MAX_RESPONSE_BYTES = 64 * 1024;
const REQUEST_TIMEOUT_MS = 5000;
const MAX_REDIRECTS = 2;
const BLOCKED_HOSTS = new Set(['localhost', 'metadata.google.internal']);
const BLOCKED_IPV4 = new Set(['0.0.0.0', '169.254.169.254']);

export async function analyzeTarget(rawTarget) {
  const normalized = normalizeTarget(rawTarget);
  const candidates = normalized.explicitProtocol
    ? [normalized.url]
    : [new URL(`https://${normalized.host}`), new URL(`http://${normalized.host}`)];

  const attempts = [];
  let dnsResult = null;

  for (const candidate of candidates) {
    try {
      const validation = await validateUrl(candidate);
      dnsResult ??= validation.dnsResult;
      const httpResult = await requestUrl(candidate);
      return {
        target: rawTarget,
        normalizedTarget: candidate.toString(),
        hostname: candidate.hostname,
        dns: dnsResult,
        reachable: true,
        http: httpResult,
        httpsAvailable: candidate.protocol === 'https:',
        analyzedAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      attempts.push({
        protocol: candidate.protocol.replace(':', '').toUpperCase(),
        error: 'No HTTP/HTTPS service detected for this protocol.',
      });
    }
  }

  return {
    target: rawTarget,
    normalizedTarget: candidates[0].toString(),
    hostname: candidates[0].hostname,
    dns: dnsResult ?? (await resolvePublicHost(candidates[0].hostname)),
    reachable: false,
    http: {
      statusCode: null,
      protocol: attempts.map((attempt) => attempt.protocol).join('/'),
      responseTimeMs: null,
      finalUrl: null,
      server: null,
      message: 'No HTTP/HTTPS service detected.',
    },
    httpsAvailable: false,
    analyzedAt: new Date().toISOString(),
  };
}

function normalizeTarget(rawTarget) {
  const trimmed = rawTarget.trim();
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)) {
    const url = new URL(trimmed);
    return { explicitProtocol: true, host: url.hostname, url };
  }

  return {
    explicitProtocol: false,
    host: trimmed.replace(/\/+$/, ''),
    url: new URL(`https://${trimmed.replace(/\/+$/, '')}`),
  };
}

async function validateUrl(url) {
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new ApiError(400, 'UNSUPPORTED_PROTOCOL', 'Only HTTP and HTTPS targets can be analyzed.');
  }
  if (url.username || url.password) {
    throw new ApiError(400, 'TARGET_REJECTED', 'Targets with embedded credentials are not allowed.');
  }
  if (url.port) {
    throw new ApiError(400, 'TARGET_REJECTED', 'Custom ports are not allowed.');
  }
  if (!url.hostname || isBlockedHostname(url.hostname)) {
    throw privateTargetError();
  }

  const dnsResult = await resolvePublicHost(url.hostname);
  return { dnsResult };
}

function isBlockedHostname(hostname) {
  const host = hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.lan')) {
    return true;
  }
  if (net.isIP(host) === 0 && !host.includes('.')) {
    return true;
  }
  return false;
}

async function resolvePublicHost(hostname) {
  const started = performance.now();
  const addresses = net.isIP(hostname)
    ? [{ address: hostname, family: net.isIP(hostname) }]
    : await dns.lookup(hostname, { all: true, verbatim: true }).catch(() => {
        throw new ApiError(400, 'DNS_LOOKUP_FAILED', 'The target hostname could not be resolved.');
      });
  const lookupTimeMs = Math.round(performance.now() - started);

  for (const item of addresses) {
    if (!isPublicIp(item.address)) {
      throw privateTargetError();
    }
  }

  return {
    resolved: addresses.length > 0,
    lookupTimeMs,
    ipv4: addresses.filter((item) => item.family === 4).map((item) => item.address),
    ipv6: addresses.filter((item) => item.family === 6).map((item) => item.address),
  };
}

function isPublicIp(address) {
  const version = net.isIP(address);
  if (version === 4) return isPublicIpv4(address);
  if (version === 6) return isPublicIpv6(address);
  return false;
}

function isPublicIpv4(address) {
  if (BLOCKED_IPV4.has(address)) return false;
  const [a, b] = address.split('.').map(Number);
  if (a === 10 || a === 127 || a === 0) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 169 && b === 254) return false;
  if (a >= 224) return false;
  return true;
}

function isPublicIpv6(address) {
  const normalized = address.toLowerCase();
  if (normalized === '::' || normalized === '::1') return false;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return false;
  if (normalized.startsWith('fe80:')) return false;
  if (normalized.startsWith('ff')) return false;
  return true;
}

function privateTargetError() {
  return new ApiError(
    400,
    'PRIVATE_TARGET_NOT_ALLOWED',
    'Private/local addresses cannot be analyzed from the CloudNet cloud server. Use CloudNet Agent Mode to monitor devices inside your local network.',
  );
}

async function requestUrl(initialUrl) {
  let currentUrl = initialUrl;
  const started = performance.now();

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    await validateUrl(currentUrl);
    const response = await singleRequest(currentUrl);

    if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.location && redirects < MAX_REDIRECTS) {
      currentUrl = new URL(response.location, currentUrl);
      continue;
    }

    return {
      statusCode: response.statusCode,
      statusMessage: response.statusMessage,
      protocol: currentUrl.protocol.replace(':', '').toUpperCase(),
      responseTimeMs: Math.round(performance.now() - started),
      finalUrl: currentUrl.toString(),
      server: sanitizeHeader(response.server),
      message: response.statusCode ? 'HTTP service responded.' : 'No HTTP/HTTPS service detected.',
    };
  }

  throw new ApiError(400, 'TOO_MANY_REDIRECTS', 'The target redirected too many times.');
}

function singleRequest(url) {
  const client = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const request = client.request(
      url,
      {
        method: 'GET',
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
          'User-Agent': 'CloudNetMonitorTargetAnalyzer/1.0',
          Accept: 'text/html,application/json,text/plain;q=0.8,*/*;q=0.5',
        },
      },
      (response) => {
        let bytes = 0;
        response.on('data', (chunk) => {
          bytes += chunk.length;
          if (bytes > MAX_RESPONSE_BYTES) {
            request.destroy();
          }
        });
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode,
            statusMessage: response.statusMessage,
            location: response.headers.location,
            server: response.headers.server,
          });
        });
      },
    );

    request.on('timeout', () => request.destroy(new Error('Request timed out.')));
    request.on('error', reject);
    request.end();
  });
}

function sanitizeHeader(value) {
  if (!value || Array.isArray(value)) return null;
  return value.slice(0, 120);
}
