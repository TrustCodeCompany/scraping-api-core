import express from 'express';
import cors from 'cors';
import sunatRoutes from "@modules/sunat/sunatRoutes";
import {errorHandler} from "@shared/middleware/errorHandler";
import {logger} from "@utils/logger";
import { setupSwagger } from "@shared/utils/swagger";
import systemRoutes from "@modules/system/systemRoutes";

const path = process.env.BASE_PATH || '/api/v1';
const app = express();

// ============================================
// SOLUCIÓN CORS PARA SWAGGER UI
// ============================================

// IMPORTANTE: CORS debe ir ANTES de cualquier otro middleware
app.use(cors({
  origin: '*', // Permitir todos los orígenes (puedes restringir después)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Headers CORS adicionales para asegurar compatibilidad
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Manejar preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Swagger
setupSwagger(app);

app.use(path + '/sunat', sunatRoutes);
app.use(path + '/system', systemRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // CRÍTICO: Escuchar en todas las interfaces
// @ts-ignore
app.listen(PORT, HOST, () => {
  logger.info(`🚀 Server running on ${HOST}:${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📚 Swagger: http://${HOST}:${PORT}/api-docs`);
  logger.info(`🔐 CORS: ENABLED (all origins)`);
  logger.info(`⚠️  NOTE: Use container IP or domain to access from outside`);
});
