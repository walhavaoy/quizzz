import type { IncomingMessage } from 'http';
import type { WebSocket, WebSocketServer } from 'ws';
import pino from 'pino';
import { engine } from '../game/engine';
import type { ClientMessage, ServerMessage } from '../shared/types';

const logger = pino({ name: 'ws-handler' });

// ─── Connection tracking ──────────────────────────────────────────────────────

interface ConnectionMeta {
  gameId: string;
  playerId: string;
}

/** ws socket → game/player context */
const connections = new Map<WebSocket, ConnectionMeta>();

/** playerId → active socket (for reconnection and targeted sends) */
const playerSockets = new Map<string, WebSocket>();

// ─── Broadcast helpers ────────────────────────────────────────────────────────

/**
 * Send a message to a single socket, ignoring errors on closed sockets.
 */
function sendTo(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

/**
 * Send a message to all connected players in a game.
 * If excludePlayerId is set, that player's socket is skipped.
 */
function broadcast(gameId: string, msg: ServerMessage, excludePlayerId?: string): void {
  for (const [ws, meta] of connections) {
    if (meta.gameId === gameId && meta.playerId !== excludePlayerId) {
      sendTo(ws, msg);
    }
  }
}

// ─── Engine event wiring ──────────────────────────────────────────────────────

engine.on('player_joined', (gameId, _player, players) => {
  broadcast(gameId, { type: 'player_joined', player: _player, players });
});

engine.on('game_started', (gameId, questionCount) => {
  broadcast(gameId, { type: 'game_start', questionCount });
});

engine.on('question', (gameId, round, question, totalRounds) => {
  broadcast(gameId, { type: 'question', round, question, totalRounds });
});

engine.on('timer_tick', (gameId, remaining) => {
  broadcast(gameId, { type: 'timer_tick', remaining });
});

engine.on('round_result', (gameId, correctIndex, players) => {
  broadcast(gameId, { type: 'round_result', correctIndex, players });
});

engine.on('game_over', (gameId, players) => {
  broadcast(gameId, { type: 'game_over', players });
});

// REQ-GE-21 / REQ-WS-10: Disconnect events
engine.on('player_left', (gameId, playerId, players) => {
  broadcast(gameId, { type: 'player_left', playerId, players });
  playerSockets.delete(playerId);
});

engine.on('player_disconnected', (gameId, playerId, players) => {
  broadcast(gameId, { type: 'player_disconnected', playerId, players });
  // Keep playerSockets entry so reconnection can find the gameId/playerId mapping
});

engine.on('host_changed', (gameId, newHostId) => {
  broadcast(gameId, { type: 'host_changed', newHostId });
});

engine.on('game_destroyed', (gameId) => {
  // Close any remaining sockets for this game
  for (const [ws, meta] of connections) {
    if (meta.gameId === gameId) {
      playerSockets.delete(meta.playerId);
      connections.delete(ws);
      ws.close(1001, 'Game ended');
    }
  }
});

// ─── Connection handler ───────────────────────────────────────────────────────

/**
 * REQ-WS-01: Accept WebSocket connections with gameId and playerId query params.
 * Supports:
 *   - Normal join: /ws?gameId=X&playerId=Y  (player already joined via REST API)
 *   - Reconnect:   /ws?gameId=X&playerId=Y  (same URL; server detects the player exists + is disconnected)
 */
function handleConnection(ws: WebSocket, req: IncomingMessage): void {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const gameId = url.searchParams.get('gameId') ?? '';
  const playerId = url.searchParams.get('playerId') ?? '';

  if (!gameId || !playerId) {
    logger.warn('WebSocket connection missing gameId or playerId — closing');
    ws.close(1008, 'Missing gameId or playerId');
    return;
  }

  const game = engine.getGame(gameId);
  if (!game) {
    logger.warn({ gameId, playerId }, 'WebSocket connection for unknown game — closing');
    ws.close(1008, 'Game not found');
    return;
  }

  const player = game.players.find((p) => p.id === playerId);
  if (!player) {
    logger.warn({ gameId, playerId }, 'WebSocket connection for unknown player — closing');
    ws.close(1008, 'Player not found');
    return;
  }

  // REQ-GE-21: If there is already a live socket for this playerId, replace it
  const existingSocket = playerSockets.get(playerId);
  if (existingSocket && existingSocket !== ws) {
    logger.info({ gameId, playerId }, 'Replacing stale socket for player');
    // connections.delete prevents the close handler from running disconnect logic for the old socket
    connections.delete(existingSocket);
    existingSocket.close(1001, 'Replaced by new connection');
  }

  connections.set(ws, { gameId, playerId });
  playerSockets.set(playerId, ws);

  // REQ-GE-21: Reconnection — player was previously disconnected
  if (player.disconnected) {
    const result = engine.reconnectPlayer(gameId, playerId);
    if (result.kind === 'reconnected') {
      logger.info({ gameId, playerId }, 'Player reconnected — sending state_sync');
      sendTo(ws, { type: 'state_sync', game: result.summary });
      // Reuse player_joined to notify others; clients already handle it by refreshing the player list.
      // A dedicated player_reconnected type is out of scope — this is semantically equivalent here.
      broadcast(gameId, { type: 'player_joined', player, players: result.summary.players }, playerId);
    } else if (result.kind === 'game_over') {
      sendTo(ws, { type: 'game_over', players: game.players });
    }
  }

  logger.info({ gameId, playerId }, 'WebSocket connected');

  // ─── Incoming messages ──────────────────────────────────────────────────

  ws.on('message', (raw: Buffer) => {
    let msg: unknown;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      logger.warn({ gameId, playerId }, 'Received malformed JSON — ignoring');
      return;
    }

    if (
      typeof msg !== 'object' ||
      msg === null ||
      typeof (msg as Record<string, unknown>)['type'] !== 'string'
    ) {
      logger.warn({ gameId, playerId }, 'Message missing type field — ignoring');
      return;
    }

    const clientMsg = msg as ClientMessage;

    if (clientMsg.type === 'start_game') {
      const ok = engine.startGame(gameId, playerId);
      if (!ok) {
        logger.warn({ gameId, playerId }, 'start_game rejected');
      }
      return;
    }

    if (clientMsg.type === 'answer') {
      engine.submitAnswer(gameId, playerId, clientMsg.optionIndex);
      return;
    }

    // 'reconnect' is handled via initial connection URL params — ignore if received as message
    logger.warn({ gameId, playerId, type: clientMsg.type }, 'Unknown message type — ignoring');
  });

  // ─── REQ-GE-21: Disconnect handling ────────────────────────────────────

  ws.on('close', () => {
    const meta = connections.get(ws);
    if (!meta) return; // already cleaned up (e.g. replaced by reconnection)

    connections.delete(ws);

    // Only remove from playerSockets if this ws is still the current socket
    if (playerSockets.get(meta.playerId) === ws) {
      playerSockets.delete(meta.playerId);
    }

    logger.info({ gameId: meta.gameId, playerId: meta.playerId }, 'WebSocket closed');

    const result = engine.disconnectPlayer(meta.gameId, meta.playerId);
    logger.info({ gameId: meta.gameId, playerId: meta.playerId, result: result.kind }, 'Disconnect handled');
  });

  ws.on('error', (err: Error) => {
    logger.error({ err, gameId, playerId }, 'WebSocket error');
    // 'close' event always fires after 'error', so disconnect logic runs there
  });
}

// ─── Register handler with a WebSocketServer ─────────────────────────────────

/**
 * REQ-WS-08: Wire the connection handler to the provided WebSocketServer instance.
 */
export function registerWsHandler(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    handleConnection(ws, req);
  });
}
