const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HomeScope API',
      version: '1.0.0',
      description: 'API REST para la plataforma HomeScope de búsqueda y gestión de propiedades inmobiliarias.',
    },
    servers: [{ url: 'http://localhost:3000/api', description: 'Servidor local' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        AuthRegister: {
          type: 'object',
          required: ['nombre', 'email', 'password'],
          properties: {
            nombre: { type: 'string', example: 'Juan Pérez' },
            email: { type: 'string', format: 'email', example: 'juan@example.com' },
            password: { type: 'string', format: 'password', example: 'MiPassword123' },
          },
        },
        AuthLogin: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'juan@example.com' },
            password: { type: 'string', format: 'password', example: 'MiPassword123' },
          },
        },
        Property: {
          type: 'object',
          required: ['titulo', 'precio', 'tipo', 'lat', 'lng'],
          properties: {
            titulo: { type: 'string', example: 'Apartamento en el centro' },
            descripcion: { type: 'string', example: 'Hermoso apartamento con vista al mar' },
            precio: { type: 'number', example: 150000 },
            tipo: { type: 'string', enum: ['venta', 'alquiler'], example: 'venta' },
            habitaciones: { type: 'integer', example: 3 },
            banos: { type: 'integer', example: 2 },
            area: { type: 'number', example: 85.5 },
            direccion: { type: 'string', example: 'Calle 123, Ciudad' },
            lat: { type: 'number', example: 9.9281 },
            lng: { type: 'number', example: -84.0907 },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Mensaje de error' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
