import type { IncomingMessage } from 'http';
import type { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';
import pino from 'pino';
import type { ClientMessage, ServerMessage } from '../shared/types';
import { getOrCreateEngine, deleteEngine } from '../game/engine';

const logger = pino({ name: 'quizzz:ws' });

// Map gameId → set of connected sockets
const gameClients = new Map<string, Set<WebSocket>>();
// Map socket → { gameId, playerId }
const socketMeta = new Map<WebSocket, { gameId: string; playerId: string }>();

function broadcast(gameId: string, message: ServerMessage): void {
  const clients = gameClients.get(gameId);
  if (!clients) return;
  const payload = JSON.stringify(message);
  for (const ws of clients) {
    if ((ws as WebSocket & { readyState: number }).readyState === 1 /* OPEN */) {
      ws.send(payload);
    }
  }
}

function parseQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const questionMark = url.indexOf('?');
  if (questionMark === -1) return params;
  const query = url.slice(questionMark + 1);
  for (const pair of query.split('&')) {
    const [key, val] = pair.split('=');
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(val ?? '');
  }
  return params;
}

export function handleConnection(ws: WebSocket, req: IncomingMessage): void {
  const url = req.url ?? '';
  const params = parseQueryParams(url);
  const gameId = params['gameId'] ?? '';
  const playerId = params['playerId'] ?? '';

  if (!gameId || !playerId) {
    logger.warn({ url }, 'WebSocket connection missing gameId or playerId — closing');
    ws.close(1008, 'Missing gameId or playerId');
    return;
  }

  logger.info({ gameId, playerId }, 'WebSocket client connected');

  // Register this socket
  if (!gameClients.has(gameId)) {
    gameClients.set(gameId, new Set());
  }
  gameClients.get(gameId)!.add(ws);
  socketMeta.set(ws, { gameId, playerId });

  ws.on('message', (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString()) as ClientMessage;
    } catch {
      logger.warn({ raw: raw.toString() }, 'Malformed JSON from client — ignoring');
      return;
    }

    switch (msg.type) {
      case 'play_again': {
        const engine = getOrCreateEngine(gameId);
        engine.resetGame();
        logger.info({ gameId, playerId }, 'play_again received — broadcasting back_to_lobby');
        broadcast(gameId, { type: 'back_to_lobby' });
        break;
      }

      default:
        logger.warn({ type: (msg as { type: string }).type }, 'Unhandled client message type');
    }
  });

  ws.on('close', () => {
    const meta = socketMeta.get(ws);
    if (!meta) return;
    socketMeta.delete(ws);
    const clients = gameClients.get(meta.gameId);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) {
        gameClients.delete(meta.gameId);
        deleteEngine(meta.gameId);
        logger.info({ gameId: meta.gameId }, 'All clients disconnected — engine cleaned up');
      }
    }
    logger.info({ gameId: meta.gameId, playerId: meta.playerId }, 'WebSocket client disconnected');
  });

  ws.on('error', (err) => {
    logger.error({ err, gameId, playerId }, 'WebSocket error');
  });
}

export function createWsHandler(wss: WebSocketServer): void {
  wss.on('connection', (ws, req) => {
    handleConnection(ws, req);
  });
}

export { broadcast };
