import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer } from 'ws';
import pino from 'pino';
import { router as apiRouter } from './routes/api';

const logger = pino({ name: 'quizzz' });

const PORT = Number(process.env['PORT']) || 8080;

const app = express();

// JSON body parser
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.on('finish', () => {
    logger.info({ method: req.method, url: req.url, status: res.statusCode }, 'request');
  });
  next();
});

// Serve static files from public/ — resolved relative to compiled output in dist/
app.use(express.static(path.join(__dirname, '..', 'public')));

// REST API routes
app.use('/api', apiRouter);

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
