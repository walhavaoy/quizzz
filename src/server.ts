import http from 'http';
import path from 'path';
import express from 'express';
import { WebSocketServer } from 'ws';
import pino from 'pino';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { registerWsHandler } from './ws/handler';

const logger = pino({ name: 'quizzz' });

const app = express();

// Health check endpoint (before middleware that could block it)
app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

// REQ-SV-10: Request logging middleware
app.use(pinoHttp({ logger }));

// REQ-SV-11: CORS headers — allow all origins
app.use(cors());

// Serve static files from public/ — resolved relative to compiled output in dist/
app.use(express.static(path.join(__dirname, '..', 'public')));

// TODO: Mount REST API routes here once routes/api.ts is implemented:
// import apiRouter from './routes/api';
// app.use('/api', apiRouter);

const server = http.createServer(app);

const wss = new WebSocketServer({ noServer: true });

// Upgrade HTTP connections to WebSocket
server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

// Wire in WS handler (REQ-WS-01 through REQ-WS-08, REQ-GE-21)
registerWsHandler(wss);

const PORT = Number(process.env.PORT) || 8080;

server.listen(PORT, () => {
  logger.info({ port: PORT }, 'quizzz server listening');
});

// REQ-SV-05: Graceful shutdown
let shuttingDown = false;

function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info({ signal }, 'Shutdown signal received');

  // Force-exit if graceful shutdown stalls after 5 s
  const forceExit = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 5000);
  forceExit.unref();

  // Terminate all WebSocket clients, then close servers
  wss.clients.forEach((client) => client.terminate());
  try {
    wss.close(() => {
      logger.info('WebSocket server closed');
      try {
        server.close(() => {
          logger.info('HTTP server closed');
          process.exit(0);
        });
      } catch (err) {
        logger.error({ err }, 'Error closing HTTP server');
        process.exit(1);
      }
    });
  } catch (err) {
    logger.error({ err }, 'Error closing WebSocket server');
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app, server, wss };
