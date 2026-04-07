import { describe, it, expect } from 'vitest';
import { base64Encode, base64Decode, base64UrlEncode, base64UrlDecode } from './base64.js';

describe('base64', () => {
  describe('base64Encode', () => {
    it('should encode basic string', () => {
      expect(base64Encode('hello')).toBe('aGVsbG8=');
    });

    it('should encode empty string', () => {
      expect(base64Encode('')).toBe('');
    });

    it('should encode unicode', () => {
      expect(base64Encode('你好')).toBe('5L2g5aW9');
    });
  });

  describe('base64Decode', () => {
    it('should decode basic string', () => {
      expect(base64Decode('aGVsbG8=')).toBe('hello');
    });

    it('should decode empty string', () => {
      expect(base64Decode('')).toBe('');
    });

    it('should decode without padding', () => {
      expect(base64Decode('aGVsbG8')).toBe('hello');
    });

    it('should decode URL-safe format', () => {
      expect(base64Decode('5L2g5aW9')).toBe('你好');
    });
  });

  describe('base64UrlEncode', () => {
    it('should encode with URL-safe characters', () => {
      const encoded = base64UrlEncode('hello+world/test');
      expect(encoded).not.toContain('+');
      expect(encoded).not.toContain('/');
    });

    it('should not include padding', () => {
      const encoded = base64UrlEncode('hello');
      expect(encoded).not.toContain('=');
    });
  });

  describe('base64UrlDecode', () => {
    it('should decode URL-safe format', () => {
      expect(base64UrlDecode('aGVsbG8')).toBe('hello');
    });

    it('should decode with URL-safe chars', () => {
      const original = 'hello+world/test';
      const encoded = base64UrlEncode(original);
      expect(base64UrlDecode(encoded)).toBe(original);
    });
  });

  describe('round-trip', () => {
    it('should encode and decode back to original', () => {
      const original = 'test string 测试';
      expect(base64Decode(base64Encode(original))).toBe(original);
    });

    it('should URL-safe encode and decode back to original', () => {
      const original = 'test+string/测试';
      expect(base64UrlDecode(base64UrlEncode(original))).toBe(original);
    });
  });
});
