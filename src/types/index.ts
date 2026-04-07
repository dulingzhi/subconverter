/**
 * Proxy node types
 */
export enum ProxyType {
  Shadowsocks = 'ss',
  ShadowsocksR = 'ssr',
  Vmess = 'vmess',
  Trojan = 'trojan',
  Hysteria = 'hysteria',
  Hysteria2 = 'hysteria2',
  Snell = 'snell',
  SOCKS = 'socks',
  HTTP = 'http',
  VLESS = 'vless',
  TUIC = 'tuic',
  JUIC = 'juic',
}

export enum NetworkType {
  TCP = 'tcp',
  UDP = 'udp',
  WebSocket = 'ws',
  HTTP = 'http',
  H2 = 'h2',
  gRPC = 'grpc',
}

export interface TLSOptions {
  enabled: boolean;
  serverName?: string;
  alpn?: string[];
  fingerprint?: string;
  ca?: string;
  caStr?: string;
  insecure?: boolean;
  tls13?: boolean;
}

export interface WSOpts {
  path?: string;
  headers?: Record<string, string>;
}

export interface HTTPOpts {
  path?: string;
  headers?: Record<string, string>;
  method?: string;
}

export interface GRPCOpts {
  serviceName?: string;
}

export interface RealityOpts {
  publicKey?: string;
  shortId?: string;
  spiderX?: string;
}

export interface ProxyNode {
  name: string;
  type: ProxyType;
  server: string;
  port: number;
  udp?: boolean;
  tfo?: boolean;
  skipCertVerify?: boolean;
  group?: string;
  password?: string;
  cipher?: string;

  // VMess specific
  uuid?: string;
  alterId?: number;
  network?: NetworkType;
  wsOpts?: WSOpts;
  httpOpts?: HTTPOpts;
  grpcOpts?: GRPCOpts;
  tls?: TLSOptions;
  reality?: RealityOpts;

  // SSR specific
  ssrProtocol?: string;
  protocolParam?: string;
  ssrObfs?: string;
  obfsParam?: string;

  // Hysteria specific
  hyProtocol?: string;
  up?: string;
  down?: string;
  upSpeed?: number;
  downSpeed?: number;
  auth?: string;
  authStr?: string;
  hyObfs?: string;
  recvWindowConn?: number;
  recvWindow?: number;
  disableMTUDiscovery?: boolean;
  hopInterval?: string;
  cwnd?: number;

  // Snell specific
  snellVersion?: number;
  psk?: string;

  // SOCKS/HTTP
  username?: string;

  // Underlying proxy (for nested proxies)
  underlyingProxy?: string;
}

export interface SubscriptionInfo {
  upload: number;
  download: number;
  total: number;
  expire: number;
}

export interface SubscriptionConfig {
  nodes: ProxyNode[];
  userInfo?: SubscriptionInfo;
  source?: string;
}

export interface RulesetConfig {
  name: string;
  type: 'surge' | 'quanx' | 'clash-domain' | 'clash-ipcidr' | 'clash-classical';
  url: string;
  interval?: number;
}

export interface ProxyGroup {
  name: string;
  type: 'select' | 'url-test' | 'fallback' | 'load-balance' | 'relay';
  proxies?: string[];
  url?: string;
  interval?: number;
  tolerance?: number;
  use?: string[];
  filter?: string;
  excludeFilter?: string;
}

export interface ClashConfig {
  port?: number;
  socksPort?: number;
  allowLan?: boolean;
  mode?: 'rule' | 'global' | 'direct';
  logLevel?: 'silent' | 'error' | 'warning' | 'info' | 'debug';
  externalController?: string;
  externalUI?: string;
  secret?: string;
  dns?: Record<string, unknown>;
  proxies?: ProxyNode[];
  'proxy-groups'?: ProxyGroup[];
  rules?: string[];
}

export interface SurgeConfig {
  'general'?: Record<string, string>;
  'proxy'?: ProxyNode[];
  'proxy-group'?: ProxyGroup[];
  'rule'?: string[];
}

export interface QuantumultXConfig {
  servers?: ProxyNode[];
  'filter-local'?: string[];
  'filter-remote'?: string[];
}

export enum TargetFormat {
  Clash = 'clash',
  ClashR = 'clashr',
  Surge = 'surge',
  Surge2 = 'surge2',
  Surge3 = 'surge3',
  Surge4 = 'surge4',
  Surge5 = 'surge5',
  Quantumult = 'quan',
  QuantumultX = 'quanx',
  Mellow = 'mellow',
  Shadowsocks = 'ss',
  ShadowsocksD = 'ssd',
  V2Ray = 'v2ray',
  Trojan = 'trojan',
  Hysteria = 'hysteria',
  Hysteria2 = 'hysteria2',
  Snell = 'snell',
  Mixed = 'mixed',
  Auto = 'auto',
  SingBox = 'singbox',
  Loon = 'loon',
}

export interface ConvertOptions {
  target: TargetFormat;
  url?: string;
  content?: string;
  config?: string;
  artifact?: string;
  // Additional options
  appendType?: boolean;
  appendInfo?: boolean;
  expand?: boolean;
  deviceId?: string;
  interval?: number;
  strict?: boolean;
  udp?: boolean;
  tfo?: boolean;
  scv?: boolean;
  sort?: boolean;
  filter?: string;
  exclude?: string;
  include?: string;
  rename?: string;
  left?: string;
  right?: string;
}
