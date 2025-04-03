const swaggerJsDoc = require('swagger-jsdoc');

const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API Quest API',
      version: '1.0.0',
      description: 'Документация API для платформы API Quest',
      contact: {
        name: 'Команда разработки API Quest'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Локальный сервер разработки'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: [
    './server/routes/*.js',
    './server/models/*.js'
  ]
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = swaggerSpec;