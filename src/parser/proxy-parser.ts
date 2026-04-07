import { ProxyNode, ProxyType, NetworkType, TLSOptions, WSOpts, GRPCOpts, RealityOpts } from '../types/index.js';

interface ParsedURL {
  protocol: string;
  username: string;
  password: string;
  hostname: string;
  port: number;
  searchParams: URLSearchParams;
  hash: string;
}

/**
 * Safely parse URL
 */
function safeParseURL(url: string): ParsedURL | null {
  try {
    const parsed = new URL(url);
    return {
      protocol: parsed.protocol,
      username: parsed.username,
      password: parsed.password,
      hostname: parsed.hostname,
      port: parseInt(parsed.port, 10),
      searchParams: parsed.searchParams,
      hash: parsed.hash.slice(1), // Remove leading #
    };
  } catch {
    return null;
  }
}

/**
 * Parse Shadowsocks URL
 * Format: ss://base64(method:password@server:port)[#name]
 *         ss://base64(method:password)@server:port[#name]
 */
export function parseSS(url: string): ProxyNode | null {
  try {
    // Remove prefix
    let content = url.replace(/^ss:\/\//, '');

    // Extract name if present
    let name = '';
    const hashIndex = content.lastIndexOf('#');
    if (hashIndex !== -1) {
      name = decodeURIComponent(content.slice(hashIndex + 1));
      content = content.slice(0, hashIndex);
    }

    // Try to decode as base64
    let decoded: string;
    try {
      // Add padding if needed
      let padded = content.replace(/-/g, '+').replace(/_/g, '/');
      while (padded.length % 4 !== 0) {
        padded += '=';
      }
      decoded = atob(padded);
    } catch {
      return null;
    }

    // Check format: method:password@server:port
    const atIndex = decoded.lastIndexOf('@');
    if (atIndex === -1) {
      return null;
    }

    const userInfo = decoded.slice(0, atIndex);
    const serverInfo = decoded.slice(atIndex + 1);

    const colonIndex = userInfo.indexOf(':');
    if (colonIndex === -1) {
      return null;
    }

    const method = userInfo.slice(0, colonIndex);
    const password = userInfo.slice(colonIndex + 1);

    const lastColon = serverInfo.lastIndexOf(':');
    if (lastColon === -1) {
      return null;
    }

    const server = serverInfo.slice(0, lastColon);
    const port = parseInt(serverInfo.slice(lastColon + 1), 10);

    if (!server || !port || !method || !password) {
      return null;
    }

    return {
      name: name || `SS-${server}:${port}`,
      type: ProxyType.Shadowsocks,
      server,
      port,
      cipher: method,
      password,
    };
  } catch {
    return null;
  }
}

/**
 * Parse ShadowsocksR URL
 * Format: ssr://base64(server:port:protocol:method:obfs:base64(password)/?params)
 */
export function parseSSR(url: string): ProxyNode | null {
  try {
    let content = url.replace(/^ssr:\/\//, '');

    // Handle with /? params
    const queryIndex = content.indexOf('/?');
    let params = new URLSearchParams();
    if (queryIndex !== -1) {
      params = new URLSearchParams(content.slice(queryIndex + 2));
      content = content.slice(0, queryIndex);
    }

    // Decode base64
    let decoded: string;
    try {
      let padded = content.replace(/-/g, '+').replace(/_/g, '/');
      while (padded.length % 4 !== 0) {
        padded += '=';
      }
      decoded = atob(padded);
    } catch {
      return null;
    }

    // Split by :
    const parts = decoded.split(':');
    if (parts.length < 6) {
      return null;
    }

    const server = parts[0];
    const port = parseInt(parts[1], 10);
    const protocol = parts[2];
    const method = parts[3];
    const obfs = parts[4];
    const password = atob(parts[5]);

    const node: ProxyNode = {
      name: `SSR-${server}:${port}`,
      type: ProxyType.ShadowsocksR,
      server,
      port,
      ssrProtocol: protocol,
      cipher: method,
      ssrObfs: obfs,
      password,
    };

    // Parse optional parameters
    const remarks = params.get('remarks');
    if (remarks) {
      try {
        node.name = atob(remarks);
      } catch {
        node.name = remarks;
      }
    }

    const obfsParam = params.get('obfsparam');
    if (obfsParam) {
      try {
        node.obfsParam = atob(obfsParam);
      } catch {
        node.obfsParam = obfsParam;
      }
    }

    const protocolParam = params.get('protoparam');
    if (protocolParam) {
      try {
        node.protocolParam = atob(protocolParam);
      } catch {
        node.protocolParam = protocolParam;
      }
    }

    return node;
  } catch {
    return null;
  }
}

/**
 * Parse Vmess URL
 * Format: vmess://base64(json)
 */
export function parseVmess(url: string): ProxyNode | null {
  try {
    const content = url.replace(/^vmess:\/\//, '');

    // Decode base64
    let jsonStr: string;
    try {
      let padded = content.replace(/-/g, '+').replace(/_/g, '/');
      while (padded.length % 4 !== 0) {
        padded += '=';
      }
      jsonStr = atob(padded);
    } catch {
      return null;
    }

    const json = JSON.parse(jsonStr);

    const node: ProxyNode = {
      name: json.ps || `VMess-${json.add}:${json.port}`,
      type: ProxyType.Vmess,
      server: json.add,
      port: parseInt(json.port, 10),
      uuid: json.id,
      alterId: parseInt(json.aid, 10) || 0,
      cipher: json.scy || 'auto',
    };

    // Network
    if (json.net) {
      node.network = json.net as NetworkType;
    }

    // TLS
    if (json.tls === 'tls' || json.tls === '1') {
      node.tls = {
        enabled: true,
        serverName: json.sni || json.host,
        insecure: json.verify_cert === false,
      };
    }

    // WS options
    if (json.net === 'ws') {
      node.wsOpts = {
        path: json.path || '/',
        headers: json.host ? { Host: json.host } : undefined,
      } as WSOpts;
    }

    // H2 options
    if (json.net === 'h2') {
      node.httpOpts = {
        path: json.path || '/',
        headers: json.host ? { Host: json.host } : undefined,
      };
    }

    // gRPC options
    if (json.net === 'grpc') {
      node.grpcOpts = {
        serviceName: json.path,
      } as GRPCOpts;
    }

    return node;
  } catch {
    return null;
  }
}

/**
 * Parse Trojan URL
 * Format: trojan://password@server:port[?params][#name]
 */
export function parseTrojan(url: string): ProxyNode | null {
  const parsed = safeParseURL(url);
  if (!parsed || parsed.protocol !== 'trojan:') {
    return null;
  }

  const node: ProxyNode = {
    name: parsed.hash || `Trojan-${parsed.hostname}:${parsed.port}`,
    type: ProxyType.Trojan,
    server: parsed.hostname,
    port: parsed.port,
    password: decodeURIComponent(parsed.username || parsed.password),
    tls: {
      enabled: true,
      serverName: parsed.searchParams.get('sni') || parsed.hostname,
    } as TLSOptions,
  };

  // Network
  const network = parsed.searchParams.get('type');
  if (network) {
    node.network = network as NetworkType;
  }

  // WS options
  if (node.network === 'ws') {
    const path = parsed.searchParams.get('path') || '/';
    node.wsOpts = { path } as WSOpts;
  }

  return node;
}

/**
 * Parse Hysteria2 URL
 * Format: hysteria2://password@server:port[?params][#name]
 */
export function parseHysteria2(url: string): ProxyNode | null {
  const parsed = safeParseURL(url);
  if (!parsed || (parsed.protocol !== 'hysteria2:' && parsed.protocol !== 'hy2:')) {
    return null;
  }

  const node: ProxyNode = {
    name: parsed.hash || `Hysteria2-${parsed.hostname}:${parsed.port}`,
    type: ProxyType.Hysteria2,
    server: parsed.hostname,
    port: parsed.port,
    password: decodeURIComponent(parsed.username || parsed.password),
  };

  // Parse optional parameters
  const sni = parsed.searchParams.get('sni');
  if (sni) {
    node.tls = { serverName: sni } as TLSOptions;
  }

  const insecure = parsed.searchParams.get('insecure');
  if (insecure === '1') {
    node.skipCertVerify = true;
  }

  const obfs = parsed.searchParams.get('obfs');
  if (obfs) {
    node.hyObfs = obfs;
  }

  const up = parsed.searchParams.get('up');
  if (up) {
    node.up = up;
  }

  const down = parsed.searchParams.get('down');
  if (down) {
    node.down = down;
  }

  return node;
}

/**
 * Parse VLESS URL
 * Format: vless://uuid@server:port[?params][#name]
 */
export function parseVLESS(url: string): ProxyNode | null {
  const parsed = safeParseURL(url);
  if (!parsed || parsed.protocol !== 'vless:') {
    return null;
  }

  const node: ProxyNode = {
    name: parsed.hash || `VLESS-${parsed.hostname}:${parsed.port}`,
    type: ProxyType.VLESS,
    server: parsed.hostname,
    port: parsed.port,
    uuid: decodeURIComponent(parsed.username),
  };

  const flow = parsed.searchParams.get('flow');
  if (flow) {
    // Handle flow
  }

  const security = parsed.searchParams.get('security');
  if (security === 'tls') {
    node.tls = {
      enabled: true,
      serverName: parsed.searchParams.get('sni') || undefined,
    } as TLSOptions;
  } else if (security === 'reality') {
    node.reality = {
      publicKey: parsed.searchParams.get('pbk') || undefined,
      shortId: parsed.searchParams.get('sid') || undefined,
      spiderX: parsed.searchParams.get('spx') || undefined,
    } as RealityOpts;
  }

  const network = parsed.searchParams.get('type');
  if (network) {
    node.network = network as NetworkType;
  }

  // WS options
  if (node.network === 'ws') {
    const path = parsed.searchParams.get('path') || '/';
    const host = parsed.searchParams.get('host');
    node.wsOpts = {
      path,
      headers: host ? { Host: host } : undefined,
    } as WSOpts;
  }

  return node;
}

/**
 * Parse SOCKS URL
 * Format: socks://username:password@server:port[#name]
 */
export function parseSOCKS(url: string): ProxyNode | null {
  const parsed = safeParseURL(url);
  if (!parsed || parsed.protocol !== 'socks:') {
    return null;
  }

  return {
    name: parsed.hash || `SOCKS-${parsed.hostname}:${parsed.port}`,
    type: ProxyType.SOCKS,
    server: parsed.hostname,
    port: parsed.port,
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
  };
}

/**
 * Parse HTTP URL
 * Format: http://username:password@server:port[#name]
 */
export function parseHTTP(url: string): ProxyNode | null {
  const parsed = safeParseURL(url);
  if (!parsed || parsed.protocol !== 'http:') {
    return null;
  }

  return {
    name: parsed.hash || `HTTP-${parsed.hostname}:${parsed.port}`,
    type: ProxyType.HTTP,
    server: parsed.hostname,
    port: parsed.port,
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
  };
}
