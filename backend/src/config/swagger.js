const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HomeScope API',
      version: '1.0.0',
      description: 'API REST de HomeScope — plataforma de búsqueda y gestión de propiedades inmobiliarias.',
    },
    servers: [
      { url: 'http://localhost:3000/api', description: 'Servidor local' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido en POST /auth/login'
        }
      },
      schemas: {
        // ── Auth ──────────────────────────────────────────────
        AuthRegister: {
          type: 'object',
          required: ['nombre', 'apellido', 'correo', 'password'],
          properties: {
            nombre:   { type: 'string', example: 'Juan' },
            apellido: { type: 'string', example: 'Pérez' },
            correo:   { type: 'string', format: 'email', example: 'juan@example.com' },
            password: { type: 'string', format: 'password', example: 'MiPassword123' },
            telefono: { type: 'string', example: '+502 5555-5555' }
          }
        },
        AuthLogin: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email', example: 'juan@example.com' },
            password: { type: 'string', format: 'password', example: 'MiPassword123' }
          }
        },
        // ── Property ──────────────────────────────────────────
        PropertyInput: {
          type: 'object',
          required: ['titulo', 'precio', 'modalidad', 'tipo_propiedad_id', 'latitud', 'longitud'],
          properties: {
            titulo:           { type: 'string', example: 'Casa en zona 10' },
            descripcion:      { type: 'string', example: 'Amplia casa con jardín' },
            modalidad:        { type: 'string', enum: ['VENTA', 'ALQUILER'], example: 'VENTA' },
            precio:           { type: 'number', example: 150000 },
            moneda:           { type: 'string', example: 'USD' },
            tipo_propiedad_id:{ type: 'integer', example: 1, description: '1=Casa, 2=Apartamento, 3=Terreno, 4=Local Comercial, 5=Oficina' },
            habitaciones:     { type: 'integer', example: 3 },
            banos:            { type: 'number', example: 2.5 },
            area_m2:          { type: 'number', example: 120.5 },
            parqueos:         { type: 'integer', example: 2 },
            direccion:        { type: 'string', example: 'Calle 5, Zona 10' },
            zona:             { type: 'string', example: '10' },
            municipio:        { type: 'string', example: 'Guatemala' },
            departamento:     { type: 'string', example: 'Guatemala' },
            latitud:          { type: 'number', example: 14.6049 },
            longitud:         { type: 'number', example: -90.5069 }
          }
        },
        // ── Responses ─────────────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operación exitosa' },
            data:    { type: 'object' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Descripción del error' }
          }
        },
        PaginatedProperties: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'array',
              items: { type: 'object' }
            },
            pagination: {
              type: 'object',
              properties: {
                totalItems:  { type: 'integer', example: 100 },
                totalPages:  { type: 'integer', example: 10 },
                currentPage: { type: 'integer', example: 1 },
                limit:       { type: 'integer', example: 10 }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

module.exports = swaggerJsdoc(options);
