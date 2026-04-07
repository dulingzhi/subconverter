import { describe, it, expect } from 'vitest';
import { parseLink, parseSubscription } from './subscription-parser.js';
import { ProxyType } from '../types/index.js';

describe('proxy-parser', () => {
  describe('parseSS', () => {
    it('should parse Shadowsocks link with new format', () => {
      // ss://base64(method:password@server:port)
      const url = 'ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwYXNzd29yZA@192.168.1.1:8388';
      const node = parseLink(url);

      expect(node).not.toBeNull();
      expect(node?.type).toBe(ProxyType.Shadowsocks);
      expect(node?.server).toBe('192.168.1.1');
      expect(node?.port).toBe(8388);
      expect(node?.cipher).toBe('chacha20-ietf-poly1305');
      expect(node?.password).toBe('password');
    });

    it('should parse Shadowsocks link with name', () => {
      const url = 'ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwYXNzd29yZA@192.168.1.1:8388#MyServer';
      const node = parseLink(url);

      expect(node).not.toBeNull();
      expect(node?.name).toBe('MyServer');
    });
  });

  describe('parseVmess', () => {
    it('should parse Vmess link', () => {
      const vmessJson = {
        add: '192.168.1.1',
        port: '443',
        id: 'uuid-string-here',
        aid: '0',
        net: 'ws',
        type: 'none',
        host: 'example.com',
        path: '/path',
        tls: 'tls',
        ps: 'My VMess Server'
      };

      const encoded = Buffer.from(JSON.stringify(vmessJson)).toString('base64');
      const url = `vmess://${encoded}`;
      const node = parseLink(url);

      expect(node).not.toBeNull();
      expect(node?.type).toBe(ProxyType.Vmess);
      expect(node?.server).toBe('192.168.1.1');
      expect(node?.port).toBe(443);
      expect(node?.uuid).toBe('uuid-string-here');
      expect(node?.name).toBe('My VMess Server');
    });
  });

  describe('parseTrojan', () => {
    it('should parse Trojan link', () => {
      const url = 'trojan://password@192.168.1.1:443?sni=example.com#MyTrojan';
      const node = parseLink(url);

      expect(node).not.toBeNull();
      expect(node?.type).toBe(ProxyType.Trojan);
      expect(node?.server).toBe('192.168.1.1');
      expect(node?.port).toBe(443);
      expect(node?.password).toBe('password');
      expect(node?.name).toBe('MyTrojan');
    });
  });

  describe('parseHysteria2', () => {
    it('should parse Hysteria2 link', () => {
      const url = 'hysteria2://password@192.168.1.1:443#MyHysteria2';
      const node = parseLink(url);

      expect(node).not.toBeNull();
      expect(node?.type).toBe(ProxyType.Hysteria2);
      expect(node?.server).toBe('192.168.1.1');
      expect(node?.port).toBe(443);
      expect(node?.password).toBe('password');
      expect(node?.name).toBe('MyHysteria2');
    });
  });
});

describe('subscription-parser', () => {
  describe('parseSubscription', () => {
    it('should parse multiple links', () => {
      const content = `ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwYXNzd29yZA@192.168.1.1:8388#SS1
ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwYXNzd29yZA@192.168.1.2:8388#SS2`;

      const nodes = parseSubscription(content);

      expect(nodes).toHaveLength(2);
      expect(nodes[0].name).toBe('SS1');
      expect(nodes[1].name).toBe('SS2');
    });

    it('should skip empty lines and comments', () => {
      const content = `# This is a comment
ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwYXNzd29yZA@192.168.1.1:8388#SS1

# Another comment`;

      const nodes = parseSubscription(content);

      expect(nodes).toHaveLength(1);
    });

    it('should handle base64 encoded subscription', () => {
      const plain = 'ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwYXNzd29yZA@192.168.1.1:8388#SS1';
      const encoded = Buffer.from(plain).toString('base64');

      const nodes = parseSubscription(encoded);

      expect(nodes.length).toBeGreaterThan(0);
    });
  });
});
