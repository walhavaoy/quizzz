import type {
  ServerMessage,
  ConnectionStatus,
  WsEventType,
} from '../src/shared/types';

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 10000;

// Payload type for each event type
interface StatusChangePayload {
  status: ConnectionStatus;
}

type MessageTypeMap = {
  player_joined: Extract<ServerMessage, { type: 'player_joined' }>;
  game_start: Extract<ServerMessage, { type: 'game_start' }>;
  question: Extract<ServerMessage, { type: 'question' }>;
  timer_tick: Extract<ServerMessage, { type: 'timer_tick' }>;
  round_result: Extract<ServerMessage, { type: 'round_result' }>;
  game_over: Extract<ServerMessage, { type: 'game_over' }>;
  player_left: Extract<ServerMessage, { type: 'player_left' }>;
  error: Extract<ServerMessage, { type: 'error' }>;
  status_change: StatusChangePayload;
};

type WsCallback<T> = (data: T) => void;

// Minimal browser-compatible logger (pino is server-only)
const log = {
  info: (msg: string, ...args: unknown[]) => {
    if (typeof console !== 'undefined') console.info('[WsClient]', msg, ...args);
  },
  warn: (msg: string, ...args: unknown[]) => {
    if (typeof console !== 'undefined') console.warn('[WsClient]', msg, ...args);
  },
  error: (msg: string, ...args: unknown[]) => {
    if (typeof console !== 'undefined') console.error('[WsClient]', msg, ...args);
  },
};

export class WsClient {
  private socket: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private gameId = '';
  private playerId = '';
  private handlers = new Map<string, Set<WsCallback<unknown>>>();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * REQ-WC-01: Open a WebSocket connection for the given game and player.
   * Calling connect() while already connected closes the existing socket first.
   */
  connect(gameId: string, playerId: string): void {
    this.gameId = gameId;
    this.playerId = playerId;
    this.reconnectAttempts = 0;
    this.clearReconnectTimer();

    if (this.socket !== null) {
      // Close existing socket without triggering auto-reconnect
      this.socket.onclose = null;
      this.socket.onerror = null;
      if (
        this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING
      ) {
        this.socket.close(1000);
      }
      this.socket = null;
    }

    this.openSocket();
  }

  /**
   * REQ-WC-03: Register a callback for a specific event type.
   * Multiple callbacks per event type are supported.
   */
  on<T extends WsEventType>(
    eventType: T,
    callback: WsCallback<MessageTypeMap[T]>,
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    (this.handlers.get(eventType) as Set<WsCallback<unknown>>).add(
      callback as WsCallback<unknown>,
    );
  }

  /**
   * REQ-WC-03: Unregister a previously registered callback.
   */
  off<T extends WsEventType>(
    eventType: T,
    callback: WsCallback<MessageTypeMap[T]>,
  ): void {
    const set = this.handlers.get(eventType);
    if (set) {
      set.delete(callback as WsCallback<unknown>);
      if (set.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  /**
   * REQ-WC-10: Return the current connection status.
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Send a message to the server. No-op if the socket is not open.
   */
  send(message: object): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      log.warn('send() called but socket is not open', { readyState: this.socket?.readyState });
    }
  }

  /**
   * Close the connection intentionally (code 1000). Suppresses auto-reconnect.
   */
  disconnect(): void {
    this.clearReconnectTimer();
    // Prevent auto-reconnect from triggering
    this.reconnectAttempts = MAX_RECONNECT_ATTEMPTS;

    if (this.socket !== null) {
      this.socket.onclose = null;
      this.socket.onerror = null;
      if (
        this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING
      ) {
        this.socket.close(1000);
      }
      this.socket = null;
    }

    this.setStatus('disconnected');
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  /**
   * Build the WS URL and open a new socket, attaching all event handlers.
   */
  private openSocket(): void {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${location.host}/ws?gameId=${encodeURIComponent(this.gameId)}&playerId=${encodeURIComponent(this.playerId)}`;

    log.info('Opening WebSocket', { url, attempt: this.reconnectAttempts });
    this.setStatus('connecting');

    const socket = new WebSocket(url);
    this.socket = socket;

    socket.onopen = () => {
      if (this.socket !== socket) return; // stale handler
      log.info('Connected');
      this.reconnectAttempts = 0;
      this.setStatus('connected');
    };

    // REQ-WC-02: Parse and dispatch typed messages
    socket.onmessage = (event: MessageEvent) => {
      if (this.socket !== socket) return;
      let msg: unknown;
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        log.warn('Received malformed JSON — ignoring', { data: event.data });
        return;
      }

      if (
        typeof msg !== 'object' ||
        msg === null ||
        typeof (msg as Record<string, unknown>)['type'] !== 'string'
      ) {
        log.warn('Message missing string "type" field — ignoring', { msg });
        return;
      }

      const typed = msg as ServerMessage;
      this.dispatch(typed.type, typed);
    };

    // REQ-WC-04: Handle close gracefully; REQ-WC-05: auto-reconnect
    socket.onclose = (event: CloseEvent) => {
      if (this.socket !== socket) return;
      this.socket = null;
      log.info('WebSocket closed', { code: event.code, reason: event.reason });
      this.setStatus('disconnected');

      if (event.code !== 1000 && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(
          INITIAL_BACKOFF_MS * Math.pow(2, this.reconnectAttempts),
          MAX_BACKOFF_MS,
        );
        log.info('Scheduling reconnect', { attempt: this.reconnectAttempts + 1, delayMs: delay });
        this.setStatus('reconnecting');
        this.reconnectAttempts += 1;
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          this.openSocket();
        }, delay);
      } else if (event.code !== 1000) {
        log.warn('Max reconnect attempts reached — giving up');
      }
    };

    // REQ-WC-04: Handle errors
    socket.onerror = (event: Event) => {
      if (this.socket !== socket) return;
      log.error('WebSocket error', { event });
      // onclose always fires after onerror — reconnect logic handled there
    };
  }

  /** Update status and notify status_change listeners. */
  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.dispatch('status_change', { status });
  }

  /** Invoke all callbacks registered for the given event type. */
  private dispatch(eventType: string, data: unknown): void {
    const set = this.handlers.get(eventType);
    if (!set) return;
    for (const cb of set) {
      try {
        cb(data);
      } catch (err) {
        log.error(`Handler for "${eventType}" threw an error`, { err });
      }
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
