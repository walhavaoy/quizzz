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
const logger = (0, pino_1.default)({ name: 'quizzz' });
const app = (0, express_1.default)();
exports.app = app;
// Serve static files from public/ — resolved relative to compiled output in dist/
app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'public')));
// TODO: Mount REST API routes here once routes/api.ts is implemented:
// import apiRouter from './routes/api';
// app.use('/api', apiRouter);
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
// Graceful shutdown
function shutdown(signal) {
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
