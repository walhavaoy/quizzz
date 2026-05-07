import http from 'http';
import path from 'path';
import express from 'express';
import { WebSocketServer } from 'ws';
import pino from 'pino';

const logger = pino({ name: 'quizzz' });

const app = express();

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

// Stub handler — wire in ws/handler.ts once that module is implemented
wss.on('connection', (ws, _req) => {
  logger.info('WebSocket client connected');
  ws.on('close', () => {
    logger.info('WebSocket client disconnected');
  });
});

const PORT = Number(process.env.PORT) || 8080;

server.listen(PORT, () => {
  logger.info({ port: PORT }, 'quizzz server listening');
});

// Graceful shutdown
function shutdown(signal: string): void {
  logger.info({ signal }, 'Shutting down gracefully');
  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error during server close');
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app, server, wss };
