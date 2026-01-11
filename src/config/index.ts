// ============================================
// src/config/index.ts
// ============================================

import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

/**
 * Configuración centralizada de la aplicación
 * Todas las variables de entorno en un solo lugar
 */
export const config = {
  // Servidor
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    name: 'Qontar Backend',
    version: '1.0.0'
  },

  // Base de datos
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'qontar',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    poolMin: 2,
    poolMax: 10
  },

  // Scraper
  scraper: {
    browserPoolSize: parseInt(process.env.BROWSER_POOL_SIZE || '3', 10),
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT || '10', 10),
    timeout: parseInt(process.env.SCRAPER_TIMEOUT || '30000', 10),
    headless: process.env.HEADLESS !== 'false'
  },

  // SUNAT
  sunat: {
    baseUrl: process.env.SUNAT_BASE_URL || 'https://e-menu.sunat.gob.pe',
    timeout: parseInt(process.env.SUNAT_TIMEOUT || '15000', 10)
  },

  // Seguridad
  security: {
    jwtSecret: process.env.JWT_SECRET || 'change-this-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10)
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    prettyPrint: process.env.NODE_ENV !== 'production'
  }
} as const;

// Validación de configuración crítica
export function validateConfig(): void {
  const required = [
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0 && config.app.env === 'production') {
    throw new Error(
      `❌ Faltan variables de entorno requeridas: ${missing.join(', ')}`
    );
  }
}

// Helpers de ambiente
export const isDevelopment = config.app.env === 'development';
export const isProduction = config.app.env === 'production';
export const isTest = config.app.env === 'test';
