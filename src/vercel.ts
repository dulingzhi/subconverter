import fastify, { FastifyInstance } from 'fastify';
import { loadConfig } from './config/loader.js';
import { registerRoutes } from './api/handlers.js';
import { version } from './version.js';

let fastifyInstance: FastifyInstance | null = null;

// Build the Fastify instance
async function buildFastify(): Promise<FastifyInstance> {
  if (fastifyInstance) {
    return fastifyInstance;
  }

  // Load configuration
  const config = loadConfig();

  // Create Fastify instance
  fastifyInstance = fastify({
    logger: {
      level: config.logLevel || 'info',
    },
    maxParamLength: 10000,
  });

  // Register routes
  await registerRoutes(fastifyInstance);

  // Add 404 handler
  fastifyInstance.setNotFoundHandler((request, reply) => {
    reply.code(404);
    return 'subconverter-node ' + version + '\nEndpoint not found\n';
  });

  // Add error handler
  fastifyInstance.setErrorHandler((error, request, reply) => {
    fastifyInstance!.log.error(error);
    reply.code(500);
    return 'Error: ' + error.message;
  });

  return fastifyInstance;
}

// Vercel Serverless export
export default async function handler(req: any, res: any) {
  const instance = await buildFastify();

  // Handle the request
  await instance.ready();
  instance.server.emit('request', req, res);
}

// Standalone server for local development
if (process.env.VERCEL !== '1') {
  const config = loadConfig();

  buildFastify().then(instance => {
    instance.listen({
      port: config.listenPort || 25500,
      host: config.listenAddress || '0.0.0.0',
    }, (err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }

      console.log(``);
      console.log(`╔═══════════════════════════════════════════════════════════╗`);
      console.log(`║           subconverter-node ${version.padEnd(28)}║`);
      console.log(`╠═══════════════════════════════════════════════════════════╣`);
      console.log(`║  Server running @ http://${config.listenAddress === '0.0.0.0' ? 'localhost' : config.listenAddress}:${String(config.listenPort).padEnd(34)}║`);
      console.log(`╠═══════════════════════════════════════════════════════════╣`);
      console.log(`║  Available endpoints:                                     ║`);
      console.log(`║    GET  /sub             - Main conversion endpoint       ║`);
      console.log(`║    POST /sub             - Main conversion endpoint       ║`);
      console.log(`║    GET  /v2clash         - Convert to Clash               ║`);
      console.log(`║    GET  /v2surge         - Convert to Surge               ║`);
      console.log(`║    GET  /v2quanx         - Convert to Quantumult X        ║`);
      console.log(`║    GET  /version         - Version info                   ║`);
      console.log(`║    GET  /health          - Health check                   ║`);
      console.log(`╚═══════════════════════════════════════════════════════════╝`);
      console.log(``);
    });
  }).catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
