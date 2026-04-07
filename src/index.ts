import Fastify from 'fastify';
import { loadConfig } from './config/loader.js';
import { registerRoutes } from './api/handlers.js';
import { version } from './version.js';

async function main() {
  // Load configuration
  const config = loadConfig();

  // Create Fastify instance
  const fastify = Fastify({
    logger: {
      level: config.logLevel,
    },
    maxParamLength: 10000,
  });

  // Register routes
  await registerRoutes(fastify);

  // Add 404 handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.code(404);
    return 'subconverter-node ' + version + '\nEndpoint not found\n';
  });

  // Add error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    reply.code(500);
    return 'Error: ' + error.message;
  });

  // Start server
  try {
    await fastify.listen({
      port: config.listenPort,
      host: config.listenAddress,
    });

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
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

// Start the server
main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
