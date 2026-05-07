import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import pino from 'pino';
import { router as apiRouter } from './routes/api';

const logger = pino({ name: 'quizzz' });

const PORT = parseInt(process.env['PORT'] ?? '8080', 10);

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

// Static file serving (frontend assets)
app.use(express.static(path.join(__dirname, '..', 'public')));

// REST API routes
app.use('/api', apiRouter);

// TODO: WebSocket upgrade handler (future task — REQ-SV-03)

const server = http.createServer(app);

server.listen(PORT, () => {
  logger.info({ port: PORT }, 'quizzz server listening');
});

// Graceful shutdown
function shutdown(): void {
  logger.info('shutting down');
  server.close((err) => {
    if (err) {
      logger.error({ err }, 'error during server close');
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
