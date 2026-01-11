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
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Servidor de desarrollo',
      },
    ],
  },
  apis: ['./src/modules/**/*.ts', './src/app.ts'], // Rutas donde buscarán los comentarios de Swagger
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('Swagger documentation available at http://localhost:3000/api-docs');
};
