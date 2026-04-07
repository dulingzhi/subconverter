import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { convert, parseTargetFormat, convertSync } from '../core/converter.js';
import { TargetFormat } from '../types/index.js';

export interface SubRequest {
  Querystring: {
    url?: string;
    target?: string;
    config?: string;
    artifact?: string;
    content?: string;
    // Filter options
    include?: string;
    exclude?: string;
    filter?: string;
    // Other options
    sort?: string;
    rename?: string;
    append_type?: string;
    append_info?: string;
    expand?: string;
    dev_id?: string;
    interval?: string;
    strict?: string;
    udp?: string;
    tfo?: string;
    scv?: string;
  };
  Body: {
    content?: string;
  };
  Headers: {
    'user-agent'?: string;
  };
}

/**
 * Main subconverter endpoint handler
 */
export async function subconverterHandler(
  request: FastifyRequest<SubRequest>,
  reply: FastifyReply
) {
  const {
    url,
    target = 'clash',
    config,
    artifact,
    content,
    include,
    exclude,
    filter,
    sort,
    rename,
    append_type,
    append_info,
    expand,
    dev_id,
    interval,
    strict,
    udp,
    tfo,
    scv,
  } = request.query;

  // Check for POST content
  const postContent = request.body?.content || content;

  if (!url && !postContent) {
    reply.code(400);
    return 'Error: Missing required parameter "url" or "content"';
  }

  try {
    const format = parseTargetFormat(target);

    console.log('Processing conversion request:', { url: url ? 'present' : 'none', content: postContent ? 'present' : 'none', target: format });

    const result = await convert({
      target: format,
      url,
      content: postContent,
      config,
      artifact,
      include,
      exclude,
      filter,
      sort: sort === 'true',
      rename,
      udp: udp === 'true',
      tfo: tfo === 'true',
      scv: scv === 'true',
    });

    console.log('Conversion result:', result ? `${result.length} bytes` : 'empty');

    // Set appropriate content type based on target
    const contentType = getContentType(format);
    reply.header('Content-Type', contentType);

    // Add subscription info headers if available
    if (url) {
      reply.header('Profile-Update-Interval', interval || '24');
    }

    // If result is empty, provide helpful error message
    if (!result || result.trim() === '') {
      console.warn('Conversion returned empty result');
      reply.code(500);
      return url
        ? 'Error: Failed to fetch or parse subscription from URL. The URL may be inaccessible from the server or contain no valid proxies.'
        : 'Error: No valid proxies found in content';
    }

    return result;
  } catch (error) {
    console.error('Conversion error:', error);
    reply.code(500);

    if (error instanceof Error) {
      return `Error: ${error.message}`;
    }
    return 'Error: Conversion failed';
  }
}

/**
 * Get content type for target format
 */
function getContentType(format: TargetFormat): string {
  switch (format) {
    case TargetFormat.Clash:
    case TargetFormat.ClashR:
      return 'text/plain; charset=utf-8';
    case TargetFormat.Surge:
    case TargetFormat.Surge2:
    case TargetFormat.Surge3:
    case TargetFormat.Surge4:
    case TargetFormat.Surge5:
      return 'text/plain; charset=utf-8';
    case TargetFormat.Quantumult:
    case TargetFormat.QuantumultX:
      return 'text/plain; charset=utf-8';
    case TargetFormat.Mellow:
      return 'text/plain; charset=utf-8';
    case TargetFormat.Shadowsocks:
    case TargetFormat.ShadowsocksD:
      return 'text/plain; charset=utf-8';
    case TargetFormat.V2Ray:
      return 'text/plain; charset=utf-8';
    case TargetFormat.Trojan:
      return 'text/plain; charset=utf-8';
    case TargetFormat.Hysteria:
    case TargetFormat.Hysteria2:
      return 'text/plain; charset=utf-8';
    case TargetFormat.SingBox:
      return 'application/json; charset=utf-8';
    default:
      return 'text/plain; charset=utf-8';
  }
}

/**
 * Version endpoint handler
 */
export function versionHandler(): string {
  return 'subconverter-node 1.0.0\n';
}

/**
 * Health check endpoint handler
 */
export function healthHandler(): { status: string; timestamp: string } {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Register all API routes
 */
export async function registerRoutes(fastify: FastifyInstance) {
  // Health check
  fastify.get('/health', async () => healthHandler());

  // Version
  fastify.get('/version', () => versionHandler());

  // Main conversion endpoint
  fastify.get('/sub', async (request, reply) => {
    return subconverterHandler(request as FastifyRequest<SubRequest>, reply);
  });

  fastify.post('/sub', async (request, reply) => {
    return subconverterHandler(request as FastifyRequest<SubRequest>, reply);
  });

  // Simple conversion endpoints
  fastify.get('/v2clash', async (request, reply) => {
    (request as any).query.target = 'clash';
    return subconverterHandler(request as FastifyRequest<SubRequest>, reply);
  });

  fastify.get('/v2surge', async (request, reply) => {
    (request as any).query.target = 'surge';
    return subconverterHandler(request as FastifyRequest<SubRequest>, reply);
  });

  fastify.get('/v2quanx', async (request, reply) => {
    (request as any).query.target = 'quanx';
    return subconverterHandler(request as FastifyRequest<SubRequest>, reply);
  });
}
