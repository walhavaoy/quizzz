"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wss = exports.server = exports.app = void 0;
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const pino_1 = __importDefault(require("pino"));
const cors_1 = __importDefault(require("cors"));
const pino_http_1 = __importDefault(require("pino-http"));
const api_js_1 = require("./routes/api.js");
const logger = (0, pino_1.default)({ name: 'quizzz' });
const app = (0, express_1.default)();
exports.app = app;
// Health check endpoint (before middleware that could block it)
app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok' });
});
// REQ-SV-10: Request logging middleware
app.use((0, pino_http_1.default)({ logger }));
// REQ-SV-11: CORS headers — allow all origins
app.use((0, cors_1.default)());
// Parse JSON request bodies for API routes
app.use(express_1.default.json());
// Mount REST API routes
app.use('/api', api_js_1.apiRouter);
// Serve static files from public/ — resolved relative to compiled output in dist/
app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'public')));
const server = http_1.default.createServer(app);
exports.server = server;
const wss = new ws_1.WebSocketServer({ noServer: true });
exports.wss = wss;
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
// REQ-SV-05: Graceful shutdown
let shuttingDown = false;
function shutdown(signal) {
    if (shuttingDown)
        return;
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
            }
            catch (err) {
                logger.error({ err }, 'Error closing HTTP server');
                process.exit(1);
            }
        });
    }
    catch (err) {
        logger.error({ err }, 'Error closing WebSocket server');
        process.exit(1);
    }
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
