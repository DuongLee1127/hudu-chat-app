import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Chat Realtime API',
      version: '1.0.0',
      description: 'API documentation for Chat Realtime project',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },

  // Nếu code chạy bằng ts-node/dev:
  apis: ['./src/routes/*.ts'],

  // Nếu build ra dist rồi chạy node dist/server.js thì có thể cần:
  // apis: ['./dist/routes/*.js']
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
