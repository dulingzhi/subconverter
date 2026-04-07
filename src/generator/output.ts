import { ProxyNode, TargetFormat, ClashConfig, ProxyGroup } from '../types/index.js';

/**
 * Generate Clash config from proxy nodes
 */
export function generateClash(
  nodes: ProxyNode[],
  groups: ProxyGroup[] = [],
  rules: string[] = []
): string {
  const config: Partial<ClashConfig> = {
    port: 7890,
    socksPort: 7891,
    allowLan: false,
    mode: 'rule',
    logLevel: 'info',
  };

  // Convert nodes to Clash proxy format
  const proxies = nodes.map(node => {
    const proxy: Record<string, unknown> = {
      name: node.name,
      type: node.type,
      server: node.server,
      port: node.port,
    };

    if (node.password) proxy.password = node.password;
    if (node.cipher) proxy.cipher = node.cipher;
    if (node.uuid) proxy.uuid = node.uuid;
    if (node.alterId !== undefined) proxy.alterId = node.alterId;
    if (node.udp !== undefined) proxy.udp = node.udp;
    if (node.tfo !== undefined) proxy.tfo = node.tfo;
    if (node.skipCertVerify !== undefined) proxy['skip-cert-verify'] = node.skipCertVerify;

    // TLS options
    if (node.tls?.enabled) {
      proxy.tls = true;
      if (node.tls.serverName) {
        proxy.servername = node.tls.serverName;
      }
      if (node.tls.alpn) {
        proxy.alpn = node.tls.alpn;
      }
    }

    // Reality options for VLESS
    if (node.reality) {
      const realityOpts: Record<string, string | undefined> = {
        'public-key': node.reality.publicKey,
        'short-id': node.reality.shortId,
      };
      if (node.reality.spiderX) {
        realityOpts['spider-x'] = node.reality.spiderX;
      }
      proxy['reality-opts'] = realityOpts;
    }

    // Flow for VLESS
    if (node.type === 'vless' && node.network === 'tcp') {
      // Flow is typically xtls-rprx-vision for reality
    }

    // Network options
    if (node.network) {
      proxy.network = node.network;

      if (node.network === 'ws' && node.wsOpts) {
        proxy['ws-opts'] = {
          path: node.wsOpts.path,
          headers: node.wsOpts.headers,
        };
      }

      if (node.network === 'h2' && node.httpOpts) {
        proxy['h2-opts'] = {
          host: node.httpOpts.headers?.Host ? [node.httpOpts.headers.Host] : undefined,
          path: node.httpOpts.path,
        };
      }

      if (node.network === 'grpc' && node.grpcOpts) {
        proxy['grpc-opts'] = {
          'grpc-service-name': node.grpcOpts.serviceName,
        };
      }
    }

    // SSR options
    if (node.type === 'ssr') {
      if (node.ssrProtocol) proxy.protocol = node.ssrProtocol;
      if (node.protocolParam) proxy['protocol-param'] = node.protocolParam;
      if (node.ssrObfs) proxy.obfs = node.ssrObfs;
      if (node.obfsParam) proxy['obfs-param'] = node.obfsParam;
    }

    return proxy;
  });

  if (proxies.length > 0) {
    config.proxies = proxies as any;
  }

  // Build proxy groups
  const proxyGroups: ProxyGroup[] = [];

  if (groups.length > 0) {
    proxyGroups.push(...groups);
  } else if (nodes.length > 0) {
    // Default groups - only add if we have nodes
    const nodeNames = nodes.map(n => n.name);
    proxyGroups.push(
      {
        name: 'Proxy',
        type: 'select',
        proxies: ['DIRECT', ...nodeNames],
      },
      {
        name: 'Auto',
        type: 'url-test',
        proxies: nodeNames,
        url: 'http://www.gstatic.com/generate_204',
        interval: 300,
      }
    );
  }

  if (proxyGroups.length > 0) {
    config['proxy-groups'] = proxyGroups as any;
  }

  // Default rules
  if (rules.length === 0) {
    rules = [
      'GEOIP,LAN,DIRECT',
      'GEOIP,CN,DIRECT',
      'MATCH,Proxy',
    ];
  }
  config.rules = rules;

  return toYAML(config);
}

/**
 * Generate Surge config from proxy nodes
 */
export function generateSurge(
  nodes: ProxyNode[],
  groups: ProxyGroup[] = [],
  rules: string[] = []
): string {
  const lines: string[] = [];

  // General section
  lines.push('[General]');
  lines.push('loglevel = notify');
  lines.push('enable = true');
  lines.push('dns-server = system, 119.29.29.29');
  lines.push('');

  // Proxy section
  lines.push('[Proxy]');
  lines.push('DIRECT = direct');

  for (const node of nodes) {
    const surgeLine = formatSurgeProxy(node);
    if (surgeLine) {
      lines.push(surgeLine);
    }
  }
  lines.push('');

  // Proxy Group section
  lines.push('[Proxy Group]');
  if (groups.length > 0) {
    for (const group of groups) {
      const groupLine = formatSurgeGroup(group, nodes);
      if (groupLine) {
        lines.push(groupLine);
      }
    }
  } else {
    const proxyNames = nodes.map(n => n.name);
    lines.push(`Proxy = select, DIRECT, ${proxyNames.join(', ')}`);
  }
  lines.push('');

  // Rule section
  lines.push('[Rule]');
  if (rules.length > 0) {
    lines.push(...rules);
  } else {
    lines.push('FINAL,Proxy');
  }

  return lines.join('\n');
}

/**
 * Format a single proxy node for Surge
 */
function formatSurgeProxy(node: ProxyNode): string | null {
  switch (node.type) {
    case 'ss':
      return `${node.name} = ss, ${node.server}, ${node.port}, encrypt-method=${node.cipher}, password=${node.password}`;
    case 'vmess':
      return formatSurgeVMess(node);
    case 'trojan':
      return `${node.name} = trojan, ${node.server}, ${node.port}, password=${node.password}`;
    default:
      return null;
  }
}

/**
 * Format VMess proxy for Surge
 */
function formatSurgeVMess(node: ProxyNode): string {
  const parts: string[] = [
    node.name,
    '= vmess',
    node.server,
    node.port.toString(),
    `username=${node.uuid}`,
  ];

  if (node.tls?.enabled) {
    parts.push('tls=true');
    if (node.tls.serverName) {
      parts.push(`sni=${node.tls.serverName}`);
    }
  }

  if (node.network === 'ws') {
    parts.push('ws=true');
    if (node.wsOpts?.path) {
      parts.push(`ws-path=${node.wsOpts.path}`);
    }
    if (node.wsOpts?.headers?.Host) {
      parts.push(`ws-headers=Host:${node.wsOpts.headers.Host}`);
    }
  }

  return parts.join(', ');
}

/**
 * Format proxy group for Surge
 */
function formatSurgeGroup(group: ProxyGroup, nodes: ProxyNode[]): string {
  const availableProxies = nodes.map(n => n.name);
  const proxies = group.proxies?.filter(p => availableProxies.includes(p)) || [];

  if (group.type === 'select') {
    return `${group.name} = select, ${proxies.join(', ')}`;
  }

  if (group.type === 'url-test' || group.type === 'fallback') {
    return `${group.name} = ${group.type}, ${proxies.join(', ')}, url=${group.url || 'http://www.gstatic.com/generate_204'}, interval=${group.interval || 300}`;
  }

  return '';
}

/**
 * Generate Quantumult X config
 */
export function generateQuantumultX(
  nodes: ProxyNode[],
  filters: string[] = []
): string {
  const lines: string[] = [];

  // Servers section
  lines.push('[SERVER]');

  for (const node of nodes) {
    const quanxLine = formatQuantumultXProxy(node);
    if (quanxLine) {
      lines.push(quanxLine);
    }
  }
  lines.push('');

  // Filter section
  if (filters.length > 0) {
    lines.push('[FILTER_LOCAL]');
    lines.push(...filters);
  }

  return lines.join('\n');
}

/**
 * Format a single proxy node for Quantumult X
 */
function formatQuantumultXProxy(node: ProxyNode): string | null {
  switch (node.type) {
    case 'ss':
      return `${node.name} = ss, ${node.server}, ${node.port}, chacha20-ietf-poly1305, "${node.password}", obfs=none`;
    case 'vmess':
      return formatQuantumultXVMess(node);
    case 'trojan':
      return `${node.name} = trojan, ${node.server}, ${node.port}, password=${node.password}, over-tls=true, tls-host=${node.tls?.serverName || node.server}`;
    default:
      return null;
  }
}

/**
 * Format VMess proxy for Quantumult X
 */
function formatQuantumultXVMess(node: ProxyNode): string {
  const parts: string[] = [
    `${node.name} = vmess`,
    node.server,
    node.port.toString(),
    'chacha20-ietf-poly1305',
    node.uuid!,
    'auto',
  ];

  if (node.tls?.enabled) {
    parts.push('over-tls=true');
    if (node.tls.serverName) {
      parts.push(`tls-host=${node.tls.serverName}`);
    }
  }

  if (node.network === 'ws') {
    parts.push('obfs=ws');
    if (node.wsOpts?.path) {
      parts.push(`obfs-path=${node.wsOpts.path}`);
    }
  }

  return parts.join(', ');
}

/**
 * Convert object to YAML format
 */
function toYAML(obj: unknown, indent = 0): string {
  const spaces = '  '.repeat(indent);
  let result = '';

  if (obj === null || obj === undefined) {
    return 'null';
  }

  if (typeof obj !== 'object') {
    return String(obj);
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (typeof item === 'object' && item !== null) {
        result += `${spaces}- ${toYAML(item, indent + 1).trimStart()}\n`;
      } else {
        result += `${spaces}- ${item}\n`;
      }
    }
    return result;
  }

  const entries = Object.entries(obj as Record<string, unknown>);
  for (const [key, value] of entries) {
    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value === 'object') {
      result += `${spaces}${key}:\n${toYAML(value, indent + 1)}`;
    } else {
      result += `${spaces}${key}: ${value}\n`;
    }
  }

  return result;
}

/**
 * Generate output in specified format
 */
export function generate(
  nodes: ProxyNode[],
  format: TargetFormat,
  options?: {
    groups?: ProxyGroup[];
    rules?: string[];
    filters?: string[];
  }
): string {
  switch (format) {
    case TargetFormat.Clash:
    case TargetFormat.ClashR:
      return generateClash(nodes, options?.groups || [], options?.rules || []);
    case TargetFormat.Surge:
    case TargetFormat.Surge4:
    case TargetFormat.Surge5:
      return generateSurge(nodes, options?.groups || [], options?.rules || []);
    case TargetFormat.QuantumultX:
      return generateQuantumultX(nodes, options?.filters || []);
    default:
      // For link-based formats, return base64 encoded list
      const links = nodes.map(node => encodeProxy(node)).filter(Boolean);
      return base64Encode(links.join('\n'));
  }
}

/**
 * Encode a proxy node to URL format
 */
function encodeProxy(node: ProxyNode): string | null {
  // Implementation depends on specific format requirements
  return null;
}

// Import base64 for encoding
function base64Encode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let result = '';
  let i = 0;
  const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  while (i < bytes.length) {
    const byte1 = bytes[i++];
    const byte2 = i < bytes.length ? bytes[i++] : 0;
    const byte3 = i < bytes.length ? bytes[i++] : 0;

    result += BASE64_CHARS[byte1 >> 2];
    result += BASE64_CHARS[((byte1 & 0x03) << 4) | (byte2 >> 4)];
    result += byte2 !== 0 ? BASE64_CHARS[((byte2 & 0x0f) << 2) | (byte3 >> 6)] : '=';
    result += byte3 !== 0 ? BASE64_CHARS[byte3 & 0x3f] : '=';
  }

  return result;
}
