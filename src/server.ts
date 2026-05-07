import express from 'express';
import path from 'path';
import pino from 'pino';
import apiRouter from './routes/api.js';

const logger = pino({ name: 'quizzz' });

const app = express();
const PORT = Number(process.env['PORT'] ?? 8080);

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

app.use('/api', apiRouter);

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'quizzz server started');
});

function shutdown(): void {
  logger.info('shutting down');
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default server;
