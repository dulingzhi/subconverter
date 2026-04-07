/**
 * Base64 encoding and decoding utilities
 */

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

export function base64Encode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let result = '';
  let i = 0;

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

export function base64Decode(input: string): string {
  // Remove whitespace and data URL prefix if present
  input = input.trim().replace(/^data:[^;]+;base64,/, '');

  // Add padding if needed
  while (input.length % 4 !== 0) {
    input += '=';
  }

  // Replace URL-safe characters
  input = input.replace(/-/g, '+').replace(/_/g, '/');

  let result = '';
  let bits = 0;
  let bitCount = 0;

  for (let i = 0; i < input.length; i++) {
    if (input[i] === '=') break;

    const charIndex = BASE64_CHARS.indexOf(input[i]);
    if (charIndex === -1) continue;

    bits = (bits << 6) | charIndex;
    bitCount += 6;

    if (bitCount >= 8) {
      bitCount -= 8;
      result += String.fromCharCode((bits >> bitCount) & 0xff);
    }
  }

  return result;
}

/**
 * URL-safe Base64 encoding
 */
export function base64UrlEncode(input: string): string {
  return base64Encode(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * URL-safe Base64 decoding
 */
export function base64UrlDecode(input: string): string {
  // Add padding if needed
  while (input.length % 4 !== 0) {
    input += '=';
  }
  return base64Decode(input.replace(/-/g, '+').replace(/_/g, '/'));
}
