import { ProxyNode, TargetFormat, ConvertOptions, SubscriptionConfig } from '../types/index.js';
import { parseSubscriptionContent, parseSubscriptionFromUrl, parseClashConfig, parseQuantumultConfig, parseSurgeConfig, parseLink } from '../parser/subscription-parser.js';
import { generate } from '../generator/output.js';

/**
 * Filter nodes based on include/exclude patterns
 */
export function filterNodes(
  nodes: ProxyNode[],
  options?: { include?: string; exclude?: string; filter?: string }
): ProxyNode[] {
  let result = [...nodes];

  // Apply exclude filter
  if (options?.exclude) {
    try {
      const excludeRegex = new RegExp(options.exclude, 'i');
      result = result.filter(node => !excludeRegex.test(node.name));
    } catch {
      // Invalid regex, use simple string match
      result = result.filter(node => !node.name.toLowerCase().includes(options.exclude!.toLowerCase()));
    }
  }

  // Apply include filter
  if (options?.include) {
    try {
      const includeRegex = new RegExp(options.include, 'i');
      result = result.filter(node => includeRegex.test(node.name));
    } catch {
      // Invalid regex, use simple string match
      result = result.filter(node => node.name.toLowerCase().includes(options.include!.toLowerCase()));
    }
  }

  // Apply general filter (acts as include)
  if (options?.filter) {
    try {
      const filterRegex = new RegExp(options.filter, 'i');
      result = result.filter(node => filterRegex.test(node.name));
    } catch {
      result = result.filter(node => node.name.toLowerCase().includes(options.filter!.toLowerCase()));
    }
  }

  return result;
}

/**
 * Sort nodes by name
 */
export function sortNodes(nodes: ProxyNode[], order: 'asc' | 'desc' = 'asc'): ProxyNode[] {
  return [...nodes].sort((a, b) => {
    const cmp = a.name.localeCompare(b.name);
    return order === 'asc' ? cmp : -cmp;
  });
}

/**
 * Rename nodes using regex
 */
export function renameNodes(
  nodes: ProxyNode[],
  pattern: string,
  replacement: string
): ProxyNode[] {
  try {
    const regex = new RegExp(pattern, 'g');
    return nodes.map(node => ({
      ...node,
      name: node.name.replace(regex, replacement),
    }));
  } catch {
    // Invalid regex, return original
    return nodes;
  }
}

/**
 * Detect target format from string
 */
export function parseTargetFormat(format: string): TargetFormat {
  const lower = format.toLowerCase();

  switch (lower) {
    case 'clash':
      return TargetFormat.Clash;
    case 'clashr':
      return TargetFormat.ClashR;
    case 'surge':
    case 'surge4':
      return TargetFormat.Surge4;
    case 'surge2':
      return TargetFormat.Surge2;
    case 'surge3':
      return TargetFormat.Surge3;
    case 'surge5':
      return TargetFormat.Surge5;
    case 'quan':
    case 'quantumult':
      return TargetFormat.Quantumult;
    case 'quanx':
    case 'quantumultx':
      return TargetFormat.QuantumultX;
    case 'mellow':
      return TargetFormat.Mellow;
    case 'ss':
    case 'shadowsocks':
      return TargetFormat.Shadowsocks;
    case 'ssd':
    case 'shadowsocksd':
      return TargetFormat.ShadowsocksD;
    case 'v2ray':
      return TargetFormat.V2Ray;
    case 'trojan':
      return TargetFormat.Trojan;
    case 'hysteria':
      return TargetFormat.Hysteria;
    case 'hysteria2':
      return TargetFormat.Hysteria2;
    case 'snell':
      return TargetFormat.Snell;
    case 'mixed':
      return TargetFormat.Mixed;
    case 'auto':
      return TargetFormat.Auto;
    case 'singbox':
    case 'sing-box':
      return TargetFormat.SingBox;
    case 'loon':
      return TargetFormat.Loon;
    default:
      return TargetFormat.Clash;
  }
}

/**
 * Detect source type from content or URL
 */
export function detectSourceType(input: string): 'subscription' | 'clash' | 'quan' | 'surge' | 'link' {
  const trimmed = input.trim();

  // Check if it's a URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return 'subscription';
  }

  // Check for Clash config
  if (trimmed.includes('proxies:') || trimmed.includes('proxy-groups:')) {
    return 'clash';
  }

  // Check for Quantumult config
  if (trimmed.includes('[SERVER]') || trimmed.includes('[server_local]')) {
    return 'quan';
  }

  // Check for Surge config
  if (trimmed.includes('[Proxy]')) {
    return 'surge';
  }

  // Check if it's a single link
  if (parseLink(trimmed)) {
    return 'link';
  }

  // Default to subscription
  return 'subscription';
}

/**
 * Main conversion function
 */
export async function convert(options: ConvertOptions): Promise<string> {
  const { target } = options;
  let nodes: ProxyNode[] = [];

  // Parse source
  if (options.content) {
    const sourceType = detectSourceType(options.content);

    switch (sourceType) {
      case 'clash':
        nodes = parseClashConfig(options.content);
        break;
      case 'quan':
        nodes = parseQuantumultConfig(options.content);
        break;
      case 'surge':
        nodes = parseSurgeConfig(options.content);
        break;
      case 'link':
        const linkNode = parseLink(options.content.trim());
        if (linkNode) {
          nodes = [linkNode];
        }
        break;
      default:
        const subConfig = parseSubscriptionContent(options.content);
        nodes = subConfig.nodes;
    }
  } else if (options.url) {
    const subConfig = await parseSubscriptionFromUrl(options.url);
    nodes = subConfig.nodes;
  }

  // Apply filters
  nodes = filterNodes(nodes, options);

  // Apply sorting
  if (options.sort) {
    nodes = sortNodes(nodes);
  }

  // Apply rename
  if (options.rename) {
    const [pattern, ...replacementParts] = options.rename.split(',');
    const replacement = replacementParts.join(',') || '';
    nodes = renameNodes(nodes, pattern, replacement);
  }

  // Generate output
  return generate(nodes, target, {
    groups: undefined,
    rules: undefined,
    filters: undefined,
  });
}

/**
 * Simple conversion without async operations
 */
export function convertSync(options: ConvertOptions & { content: string }): string {
  const { target, content } = options;
  let nodes: ProxyNode[] = [];

  const sourceType = detectSourceType(content);

  switch (sourceType) {
    case 'clash':
      nodes = parseClashConfig(content);
      break;
    case 'quan':
      nodes = parseQuantumultConfig(content);
      break;
    case 'surge':
      nodes = parseSurgeConfig(content);
      break;
    case 'link':
      const linkNode = parseLink(content.trim());
      if (linkNode) {
        nodes = [linkNode];
      }
      break;
    default:
      const subConfig = parseSubscriptionContent(content);
      nodes = subConfig.nodes;
  }

  // Apply filters
  nodes = filterNodes(nodes, options);

  // Apply sorting
  if (options.sort) {
    nodes = sortNodes(nodes);
  }

  // Apply rename
  if (options.rename) {
    const [pattern, ...replacementParts] = options.rename.split(',');
    const replacement = replacementParts.join(',') || '';
    nodes = renameNodes(nodes, pattern, replacement);
  }

  // Generate output
  return generate(nodes, target);
}
