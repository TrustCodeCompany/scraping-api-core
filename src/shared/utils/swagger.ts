import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TrustBalance Scraping Core API',
      version: '1.0.0',
      description: 'API para el scraping de información de SUNAT',
      contact: {
        name: 'API Support',
        email: 'support@trustbalance.com'
      }
    },
    // ============================================
    // SERVIDORES: Múltiples entornos
    // ============================================
    servers: [
      {
        url: 'http://155.133.23.114:3000/api/v1',
        description: 'Servidor de Producción (Contabo)',
      },
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Servidor de Desarrollo Local',
      },
      {
        url: '{protocol}://{host}:{port}/api/v1',
        description: 'Servidor Personalizado',
        variables: {
          protocol: {
            enum: ['http', 'https'],
            default: 'http'
          },
          host: {
            default: '155.133.23.114'
          },
          port: {
            default: '3000'
          }
        }
      }
    ],
    // ============================================
    // COMPONENTES: Schemas de seguridad
    // ============================================
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa tu token JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error'
            },
            message: {
              type: 'string',
              example: 'Mensaje de error'
            }
          }
        }
      }
    },
    // Seguridad global (opcional, puedes quitarlo si no usas JWT aún)
    // security: [{ bearerAuth: [] }]
  },
  // Rutas donde buscar las anotaciones de Swagger
  apis: [
    './src/modules/**/*.ts',
    './src/modules/**/**/*.ts',
    './src/app.ts',
    './dist/modules/**/*.js',
    './dist/modules/**/**/*.js',
    './dist/app.js'
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  // ============================================
  // CONFIGURACIÓN DE SWAGGER UI
  // ============================================
  const swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true, // Mantener el token entre recargas
      displayRequestDuration: true, // Mostrar duración de requests
      tryItOutEnabled: true,
      filter: true, // Habilitar búsqueda
      showExtensions: true,
      showCommonExtensions: true,
      // ============================================
      // CRÍTICO PARA CORS
      // ============================================
      withCredentials: false, // Desactivar credentials para CORS con origin: *

      // Configuración de requests
      requestInterceptor: (req: any) => {
        // Log de requests (útil para debugging)
        console.log('📤 Swagger Request:', {
          method: req.method,
          url: req.url,
          headers: req.headers
        });
        return req;
      },

      responseInterceptor: (res: any) => {
        // Log de responses (útil para debugging)
        console.log('📥 Swagger Response:', {
          status: res.status,
          url: res.url
        });
        return res;
      }
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .scheme-container { 
        background: #1b1b1b; 
        padding: 20px;
        border-radius: 4px;
      }
    `,
    customSiteTitle: 'TrustBalance API Docs',
    customfavIcon: '/favicon.ico'
  };

  // ============================================
  // MIDDLEWARE DE SWAGGER
  // ============================================

  // Servir la UI de Swagger
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Endpoint para obtener el spec en JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(swaggerSpec);
  });

  // Log de confirmación
  const port = process.env.PORT || 3000;
  const env = process.env.NODE_ENV || 'development';

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║              📚 SWAGGER DOCUMENTATION                  ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  Environment: ${env.padEnd(40)} ║`);
  console.log(`║  Port: ${port.toString().padEnd(47)} ║`);
  console.log('╠════════════════════════════════════════════════════════╣');

  if (env === 'production') {
    console.log(`║  🌐 http://155.133.23.114:${port}/api-docs               ║`);
  } else {
    console.log(`║  🏠 http://localhost:${port}/api-docs                    ║`);
  }

  console.log(`║  📄 http://localhost:${port}/api-docs.json               ║`);
  console.log('╚════════════════════════════════════════════════════════╝');
};
