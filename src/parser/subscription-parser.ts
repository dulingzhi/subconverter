import { ProxyNode, SubscriptionConfig } from '../types/index.js';
import { base64Decode } from '../utils/base64.js';
import { parseSS, parseSSR, parseVmess, parseTrojan, parseHysteria2, parseVLESS, parseSOCKS, parseHTTP } from './proxy-parser.js';

/**
 * Try to parse a single proxy link
 */
export function parseLink(link: string): ProxyNode | null {
  const trimmed = link.trim();

  if (trimmed.startsWith('ss://')) {
    return parseSS(trimmed);
  }
  if (trimmed.startsWith('ssr://')) {
    return parseSSR(trimmed);
  }
  if (trimmed.startsWith('vmess://')) {
    return parseVmess(trimmed);
  }
  if (trimmed.startsWith('trojan://')) {
    return parseTrojan(trimmed);
  }
  if (trimmed.startsWith('hysteria2://') || trimmed.startsWith('hy2://')) {
    return parseHysteria2(trimmed);
  }
  if (trimmed.startsWith('vless://')) {
    return parseVLESS(trimmed);
  }
  if (trimmed.startsWith('socks://')) {
    return parseSOCKS(trimmed);
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Only parse as HTTP proxy if it's not a valid URL with other schemes
    try {
      const url = new URL(trimmed);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        // Check if it's actually an HTTP proxy link (has username@host:port format)
        if (url.username || url.password) {
          return parseHTTP(trimmed);
        }
      }
    } catch {
      // Not a valid URL
    }
  }

  return null;
}

/**
 * Parse subscription content
 */
export function parseSubscription(content: string): ProxyNode[] {
  const nodes: ProxyNode[] = [];

  // Try to decode as base64 first (many subs are base64 encoded)
  let decoded = content;
  try {
    // Check if content looks like base64
    if (/^[A-Za-z0-9+/=]+$/.test(content.trim())) {
      const attempt = base64Decode(content.trim());
      // Validate it's valid UTF-8 text
      if (attempt && /^[\s\S]*$/.test(attempt)) {
        decoded = attempt;
      }
    }
  } catch {
    // Not base64, use as-is
  }

  // Split by lines
  const lines = decoded.split(/[\r\n]+/).filter(line => line.trim());

  for (const line of lines) {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }

    const node = parseLink(line);
    if (node) {
      nodes.push(node);
    }
  }

  return nodes;
}

/**
 * Parse subscription from URL (fetch and parse)
 */
export async function parseSubscriptionFromUrl(
  url: string,
  timeout = 30000
): Promise<SubscriptionConfig> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ClashForWindows/0.20.0',
        'Accept': '*/*',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const content = await response.text();
    const nodes = parseSubscription(content);

    // Parse subscription info from headers if available
    const userInfo = response.headers.get('subscription-userinfo');
    let subscriptionInfo = undefined;

    if (userInfo) {
      const info: Record<string, number> = {};
      userInfo.split(';').forEach(part => {
        const [key, value] = part.trim().split('=');
        if (key && value) {
          info[key.trim()] = parseInt(value.trim(), 10);
        }
      });
      subscriptionInfo = {
        upload: info.upload || 0,
        download: info.download || 0,
        total: info.total || 0,
        expire: info.expire || 0,
      };
    }

    return {
      nodes,
      userInfo: subscriptionInfo,
      source: url,
    };
  } catch (error) {
    if (error instanceof Error) {
      if ((error as any).code === 'UND_ERR_CONNECT' || error.message.includes('timeout')) {
        throw new Error(`Failed to connect to subscription URL: ${url}. This may be due to network restrictions or the server being unreachable.`);
      }
      throw new Error(`Failed to fetch subscription: ${error.message}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Parse subscription from content string
 */
export function parseSubscriptionContent(content: string): SubscriptionConfig {
  const nodes = parseSubscription(content);
  return {
    nodes,
  };
}

/**
 * Parse Clash config to extract nodes
 */
export function parseClashConfig(content: string): ProxyNode[] {
  // Simple YAML parsing - in production, use a proper YAML parser
  const nodes: ProxyNode[] = [];

  // Find proxies section
  const proxyMatch = content.match(/proxies:\s*([\s\S]*?)(?=\n\w|\nproxy-groups|$)/);
  if (!proxyMatch) {
    return nodes;
  }

  const proxySection = proxyMatch[1];

  // Parse each proxy entry (simplified)
  const proxyEntries = proxySection.match(/-\s*name:\s*[^\n]+[\s\S]*?(?=-\s*name:|$)/g) || [];

  for (const entry of proxyEntries) {
    try {
      const nameMatch = entry.match(/name:\s*['"]?([^'"\n]+)['"]?/);
      const serverMatch = entry.match(/server:\s*['"]?([^'"\n]+)['"]?/);
      const portMatch = entry.match(/port:\s*(\d+)/);
      const typeMatch = entry.match(/type:\s*(['"]?[^'"\n]+['"]?)/);
      const passwordMatch = entry.match(/password:\s*['"]?([^'"\n]+)['"]?/);
      const uuidMatch = entry.match(/uuid:\s*['"]?([^'"\n]+)['"]?/);

      if (nameMatch && serverMatch && portMatch) {
        nodes.push({
          name: nameMatch[1].trim(),
          type: (typeMatch?.[1]?.trim() || 'ss') as any,
          server: serverMatch[1].trim(),
          port: parseInt(portMatch[1], 10),
          password: passwordMatch?.[1]?.trim(),
          uuid: uuidMatch?.[1]?.trim(),
        });
      }
    } catch {
      continue;
    }
  }

  return nodes;
}

/**
 * Parse Quantumult/X config to extract nodes
 */
export function parseQuantumultConfig(content: string): ProxyNode[] {
  const nodes: ProxyNode[] = [];

  // Find [SERVER] or [server_local] section
  const serverSection = content.match(/\[(?:SERVER|server_local)\]([\s\S]*?)(?=\[|$)/i);
  if (!serverSection) {
    return nodes;
  }

  const lines = serverSection[1].split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));

  for (const line of lines) {
    // Parse Quan format: name = ip, port, type, "password", ...
    const parts = line.split(',').map(p => p.trim());
    if (parts.length < 4) continue;

    const name = parts[0].split('=')[0].trim();
    const server = parts[1];
    const port = parseInt(parts[2], 10);
    const type = parts[3];

    nodes.push({
      name,
      type: type as any,
      server,
      port,
      password: parts[4]?.replace(/['"]/g, ''),
    });
  }

  return nodes;
}

/**
 * Parse Surge config to extract nodes
 */
export function parseSurgeConfig(content: string): ProxyNode[] {
  const nodes: ProxyNode[] = [];

  // Find [Proxy] section
  const proxySection = content.match(/\[Proxy\]([\s\S]*?)(?=\[|$)/i);
  if (!proxySection) {
    return nodes;
  }

  const lines = proxySection[1].split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));

  for (const line of lines) {
    // Parse Surge format: name = type, server, port, ...
    const match = line.match(/^([^=]+)\s*=\s*(.+)$/);
    if (!match) continue;

    const name = match[1].trim();
    const params = match[2].split(',').map(p => p.trim());

    if (params.length < 2) continue;

    const type = params[0];
    const server = params[1];
    const port = params[2] ? parseInt(params[2], 10) : undefined;

    nodes.push({
      name,
      type: type as any,
      server,
      port: port || 0,
    });
  }

  return nodes;
}
