import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { db } from './database/connection.js';
import { SocketHandler } from './socket/socket-handler.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error-middleware.js';
dotenv.config();
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:51229',
    'https://oddscaster.site',
    process.env.FRONTEND_URL
].filter(Boolean);
app.use(cors({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        if (process.env.NODE_ENV === 'development' &&
            (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
const isProduction = process.env.NODE_ENV === 'production';
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: isProduction ? 120 : 1000,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        return req.path.includes('/socket.io') || req.path.includes('/static');
    }
});
app.use('/api', limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);
const socketHandler = new SocketHandler(server);
app.set('io', socketHandler.getIO());
async function startServer() {
    try {
        const isDbConnected = await db.testConnection();
        if (!isDbConnected) {
            console.error('Failed to connect to database');
            process.exit(1);
        }
        console.log('✅ Database connected successfully');
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📡 Socket.IO server initialized`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
        });
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
async function gracefulShutdown(signal) {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    try {
        await db.close();
        console.log('✅ Database connections closed');
        server.close(() => {
            console.log('✅ HTTP server closed');
            process.exit(0);
        });
        setTimeout(() => {
            console.log('❌ Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    }
    catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
}
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
startServer();
export { app, server, socketHandler };
//# sourceMappingURL=server.js.map