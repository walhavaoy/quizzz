import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import pino from 'pino';
import type {
  QuestionMessage,
  TimerTickMessage,
  RoundResultMessage,
  GameOverMessage,
  PlayerLeftMessage,
  ClientMessage,
} from '../shared/types';
import { getGame, getPlayer, isHost, startGame, registerCallbacks } from '../game/engine';

const logger = pino({ name: 'ws-handler' });

// ---------------------------------------------------------------------------
// Client tracking: which WS connections belong to which game
// ---------------------------------------------------------------------------

const gameClients = new Map<string, Set<WebSocket>>();

interface ClientMeta {
  gameId: string;
  playerId: string;
}

const clientMeta = new Map<WebSocket, ClientMeta>();

// ---------------------------------------------------------------------------
// Broadcast helper — sends JSON to all OPEN clients in a game
// ---------------------------------------------------------------------------

function broadcastToGame(gameId: string, message: object): void {
  const clients = gameClients.get(gameId);
  if (!clients) return;

  const data = JSON.stringify(message);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

// ---------------------------------------------------------------------------
// Engine callback implementations
// ---------------------------------------------------------------------------

function onQuestion(
  gameId: string,
  round: number,
  totalRounds: number,
  text: string,
  options: string[],
  timeLimit: number,
): void {
  const msg: QuestionMessage = {
    type: 'question',
    round,
    totalRounds,
    text,
    options,
    timeLimit,
  };
  broadcastToGame(gameId, msg);
}

function onTimerTick(gameId: string, remaining: number): void {
  const msg: TimerTickMessage = {
    type: 'timer_tick',
    remaining,
  };
  broadcastToGame(gameId, msg);
}

function onRoundResult(
  gameId: string,
  correctIndex: number,
  scores: Array<{
    playerId: string;
    nickname: string;
    score: number;
    delta: number;
    answered: number | null;
  }>,
): void {
  const msg: RoundResultMessage = {
    type: 'round_result',
    correctIndex,
    scores,
  };
  broadcastToGame(gameId, msg);
}

function onGameOver(
  gameId: string,
  rankings: Array<{
    playerId: string;
    nickname: string;
    score: number;
    rank: number;
  }>,
): void {
  const msg: GameOverMessage = {
    type: 'game_over',
    rankings,
  };
  broadcastToGame(gameId, msg);
}

// ---------------------------------------------------------------------------
// Connection handler
// ---------------------------------------------------------------------------

function handleConnection(ws: WebSocket, req: IncomingMessage): void {
  // Parse gameId and playerId from query string
  const urlStr = req.url ?? '';
  let gameId = '';
  let playerId = '';

  try {
    const parsed = new URL(urlStr, 'http://localhost');
    gameId = parsed.searchParams.get('gameId') ?? '';
    playerId = parsed.searchParams.get('playerId') ?? '';
  } catch (err) {
    logger.error({ err, url: urlStr }, 'Failed to parse WS URL');
    ws.close(4001, 'Invalid URL');
    return;
  }

  if (!gameId || !playerId) {
    logger.warn({ gameId, playerId }, 'Missing gameId or playerId');
    ws.close(4001, 'Missing gameId or playerId');
    return;
  }

  const game = getGame(gameId);
  if (!game) {
    logger.warn({ gameId }, 'Game not found');
    ws.close(4001, 'Game not found');
    return;
  }

  const player = getPlayer(game, playerId);
  if (!player) {
    logger.warn({ gameId, playerId }, 'Player not found in game');
    ws.close(4001, 'Player not found');
    return;
  }

  // Register this client
  if (!gameClients.has(gameId)) {
    gameClients.set(gameId, new Set());
  }
  (gameClients.get(gameId) as Set<WebSocket>).add(ws);
  clientMeta.set(ws, { gameId, playerId });

  logger.info({ gameId, playerId, nickname: player.nickname }, 'WS client connected');

  // Handle incoming messages
  ws.on('message', (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(String(raw)) as ClientMessage;
    } catch {
      logger.warn({ gameId, playerId }, 'Received malformed JSON');
      return;
    }

    if (typeof msg !== 'object' || msg === null || typeof msg.type !== 'string') {
      logger.warn({ gameId, playerId }, 'Message missing type field');
      return;
    }

    switch (msg.type) {
      case 'start_game': {
        logger.info({ gameId, playerId }, 'Received start_game');
        if (!isHost(game, playerId)) {
          logger.warn({ gameId, playerId }, 'Non-host attempted to start game');
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'error', message: 'Only the host can start the game' }));
          }
          break;
        }
        startGame(gameId);
        break;
      }
      case 'ping': {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
        break;
      }
      default:
        logger.warn({ gameId, playerId, type: (msg as { type: string }).type }, 'Unknown message type');
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    logger.info({ gameId, playerId, nickname: player.nickname }, 'WS client disconnected');

    const clients = gameClients.get(gameId);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) {
        gameClients.delete(gameId);
      }
    }
    clientMeta.delete(ws);

    // Broadcast player_left if game is still in lobby
    const currentGame = getGame(gameId);
    if (currentGame && currentGame.status === 'lobby') {
      const leftMsg: PlayerLeftMessage = {
        type: 'player_left',
        playerId,
        nickname: player.nickname,
      };
      broadcastToGame(gameId, leftMsg);
    }
  });
}

// ---------------------------------------------------------------------------
// Setup — called once from server.ts
// ---------------------------------------------------------------------------

export function setupWsHandler(wss: WebSocketServer): void {
  // Register engine event callbacks
  registerCallbacks({
    onQuestion,
    onTimerTick,
    onRoundResult,
    onGameOver,
  });

  // Handle new connections
  wss.on('connection', handleConnection);

  logger.info('WebSocket handler initialized');
}
