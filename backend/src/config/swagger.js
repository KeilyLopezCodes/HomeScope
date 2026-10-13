const path = require('path');
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
        // ── Auth / Usuario ────────────────────────────────────
        RegisterInput: {
          type: 'object',
          required: ['correo', 'contrasena'],
          description: 'También se aceptan los alias `email` (por `correo`) y `password` (por `contrasena`).',
          properties: {
            correo:     { type: 'string', format: 'email', example: 'juan@correo.com' },
            contrasena: { type: 'string', format: 'password', example: 'MiClave123' },
            nombre:     { type: 'string', default: 'Usuario', example: 'Juan' },
            apellido:   { type: 'string', default: '', example: 'Pérez' },
            telefono:   { type: 'string', nullable: true, example: '55551234' }
          }
        },
        LoginInput: {
          type: 'object',
          required: ['correo', 'contrasena'],
          description: 'También se aceptan los alias `email` y `password`.',
          properties: {
            correo:     { type: 'string', format: 'email', example: 'juan@correo.com' },
            contrasena: { type: 'string', format: 'password', example: 'MiClave123' }
          }
        },
        UserSummary: {
          type: 'object',
          properties: {
            id:     { type: 'integer', example: 5 },
            nombre: { type: 'string', example: 'Juan' },
            correo: { type: 'string', example: 'juan@correo.com' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id:                { type: 'integer', example: 5 },
            correo:            { type: 'string', example: 'juan@correo.com' },
            nombre:            { type: 'string', example: 'Juan' },
            apellido:          { type: 'string', example: 'Pérez' },
            telefono:          { type: 'string', nullable: true, example: '55551234' },
            correo_verificado: { type: 'boolean', example: true }
          }
        },
        // ── Places ────────────────────────────────────────────
        Place: {
          type: 'object',
          properties: {
            google_place_id:     { type: 'string', example: 'ChIJN1t_tDeuEmsRUsoyG83frY4' },
            nombre:              { type: 'string', example: 'Supermercado La Torre' },
            latitud:             { type: 'number', example: 14.6012 },
            longitud:            { type: 'number', example: -90.5101 },
            distancia_m:         { type: 'number', example: 532.7 },
            tiempo_estimado_min: { type: 'integer', example: 7, description: 'Minutos a pie (80 m/min)' },
            radio_consulta_m:    { type: 'integer', example: 5000 }
          }
        },
        // ── Property ──────────────────────────────────────────
        PropertyInput: {
          type: 'object',
          required: ['titulo', 'descripcion', 'precio'],
          properties: {
            titulo:           { type: 'string', example: 'Casa en zona 10' },
            descripcion:      { type: 'string', example: 'Amplia casa con jardín' },
            modalidad:        { type: 'string', enum: ['VENTA', 'ALQUILER'], default: 'VENTA' },
            precio:           { type: 'number', example: 150000 },
            moneda:           { type: 'string', default: 'USD', example: 'GTQ' },
            tipo_propiedad_id:{ type: 'integer', default: 1, description: '1=Casa, 2=Apartamento, 3=Terreno, 4=Local Comercial, 5=Oficina' },
            habitaciones:     { type: 'integer', example: 3 },
            banos:            { type: 'number', example: 2.5 },
            area_m2:          { type: 'number', example: 120.5 },
            parqueos:         { type: 'integer', example: 2 },
            direccion:        { type: 'string', example: 'Calle 5, Zona 10' },
            zona:             { type: 'string', default: '1', example: '10' },
            municipio:        { type: 'string', default: 'Guatemala' },
            departamento:     { type: 'string', default: 'Guatemala' },
            latitud:          { type: 'number', example: 14.6049 },
            longitud:         { type: 'number', example: -90.5069 }
          }
        },
        PropertyUpdate: {
          type: 'object',
          description: 'Todos los campos son opcionales. Si cambia el precio se registra automáticamente en el historial.',
          properties: {
            titulo:       { type: 'string', example: 'Casa remodelada en zona 10' },
            descripcion:  { type: 'string' },
            precio:       { type: 'number', minimum: 0, example: 145000 },
            modalidad:    { type: 'string', enum: ['VENTA', 'ALQUILER'] },
            habitaciones: { type: 'integer' },
            banos:        { type: 'number' },
            area_m2:      { type: 'number' },
            parqueos:     { type: 'integer' },
            direccion:    { type: 'string' }
          }
        },
        Property: {
          type: 'object',
          properties: {
            id:                  { type: 'integer', example: 3 },
            vendedor_id:         { type: 'integer', example: 2 },
            tipo_propiedad_id:   { type: 'integer', example: 1 },
            titulo:              { type: 'string', example: 'Casa en zona 10' },
            descripcion:         { type: 'string', example: 'Amplia casa con jardín' },
            modalidad:           { type: 'string', example: 'VENTA' },
            precio:              { type: 'string', example: '150000', description: 'Decimal serializado como string' },
            moneda:              { type: 'string', example: 'GTQ' },
            habitaciones:        { type: 'integer', example: 3 },
            banos:               { type: 'string', example: '2.5' },
            area_m2:             { type: 'string', example: '120.5' },
            parqueos:            { type: 'integer', example: 2 },
            direccion:           { type: 'string' },
            zona:                { type: 'string' },
            municipio:           { type: 'string' },
            departamento:        { type: 'string' },
            latitud:             { type: 'string', example: '14.6049' },
            longitud:            { type: 'string', example: '-90.5069' },
            estado:              { type: 'string', enum: ['borrador', 'publicado', 'pausado', 'vendido', 'alquilado', 'no_disponible'] },
            fecha_publicacion:   { type: 'string', format: 'date-time', nullable: true },
            fecha_creacion:      { type: 'string', format: 'date-time' },
            fecha_actualizacion: { type: 'string', format: 'date-time' }
          }
        },
        PropertyDetail: {
          allOf: [
            { $ref: '#/components/schemas/Property' },
            {
              type: 'object',
              properties: {
                usuario: {
                  type: 'object',
                  properties: {
                    id:       { type: 'integer' },
                    nombre:   { type: 'string' },
                    apellido: { type: 'string' },
                    correo:   { type: 'string' },
                    telefono: { type: 'string', nullable: true }
                  }
                },
                tipo_propiedad:      { type: 'object', properties: { id: { type: 'integer' }, nombre: { type: 'string', example: 'Casa' } } },
                foto_propiedad:      { type: 'array', items: { $ref: '#/components/schemas/Foto' } },
                historial_precio:    { type: 'array', items: { $ref: '#/components/schemas/PriceHistoryEntry' } },
                indice_conveniencia: { type: 'array', items: { type: 'object' } }
              }
            }
          ]
        },
        PriceHistoryEntry: {
          type: 'object',
          description: 'Registro inmutable de un cambio de precio',
          properties: {
            id:              { type: 'integer', example: 1 },
            propiedad_id:    { type: 'integer', example: 46 },
            precio_anterior: { type: 'string', example: '1000' },
            precio_nuevo:    { type: 'string', example: '1500' },
            cambiado_por:    { type: 'integer', example: 5 },
            fecha_cambio:    { type: 'string', format: 'date-time' },
            usuario: {
              type: 'object',
              properties: {
                id:     { type: 'integer', example: 5 },
                nombre: { type: 'string', example: 'Juan' }
              }
            }
          }
        },
        Foto: {
          type: 'object',
          properties: {
            id:           { type: 'integer', example: 12 },
            propiedad_id: { type: 'integer', example: 46 },
            url:          { type: 'string', example: 'https://res.cloudinary.com/.../foto.jpg' },
            public_id:    { type: 'string', example: 'homescope/propiedades/46/abc123' },
            orden:        { type: 'integer', example: 0 },
            es_portada:   { type: 'boolean', example: true },
            tamano_bytes: { type: 'integer', example: 245760 },
            fecha_subida: { type: 'string', format: 'date-time' }
          }
        },
        // ── Report ────────────────────────────────────────────
        Report: {
          type: 'object',
          properties: {
            id:             { type: 'integer', example: 1 },
            propiedad_id:   { type: 'integer', example: 46 },
            motivo:         { type: 'string', example: 'fraude' },
            descripcion:    { type: 'string', nullable: true, example: 'El vendedor pide un depósito antes de mostrar la casa.' },
            estado:         { type: 'string', enum: ['pendiente', 'en_revision', 'resuelto', 'descartado'], example: 'pendiente' },
            fecha_creacion: { type: 'string', format: 'date-time' }
          }
        },
        ReportDetail: {
          type: 'object',
          properties: {
            id:             { type: 'integer', example: 1 },
            motivo:         { type: 'string', example: 'fotos_falsas' },
            descripcion:    { type: 'string', nullable: true },
            estado:         { type: 'string', enum: ['pendiente', 'en_revision', 'resuelto', 'descartado'] },
            fecha_creacion: { type: 'string', format: 'date-time' },
            propiedad: {
              type: 'object',
              properties: {
                id:          { type: 'integer', example: 3 },
                titulo:      { type: 'string', example: 'Casa en zona 10' },
                estado:      { type: 'string', example: 'publicado' },
                vendedor_id: { type: 'integer', example: 2 }
              }
            },
            reportante: {
              type: 'object',
              properties: {
                id:       { type: 'integer' },
                nombre:   { type: 'string' },
                apellido: { type: 'string' }
              }
            },
            acciones_moderacion: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id:               { type: 'integer' },
                  accion:           { type: 'string', enum: ['aprobar_reporte', 'rechazar_reporte'] },
                  motivo:           { type: 'string' },
                  fecha_accion:     { type: 'string', format: 'date-time' },
                  administrador_id: { type: 'integer' }
                }
              }
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            totalItems:  { type: 'integer', example: 12 },
            totalPages:  { type: 'integer', example: 1 },
            currentPage: { type: 'integer', example: 1 },
            limit:       { type: 'integer', example: 20 }
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
              items: { $ref: '#/components/schemas/PropertyDetail' }
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
      },
      parameters: {
        PropertyId: {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer', minimum: 1 },
          description: 'ID de la propiedad'
        }
      },
      responses: {
        BadRequest:   { description: 'Datos o ID inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        Unauthorized: { description: 'Token no proporcionado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        Forbidden:    { description: 'Token inválido o el usuario no es el dueño de la propiedad', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        NotFound:     { description: 'Propiedad no encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
      }
    }
  },
  // glob con "/" (en Windows path.join usa "\" y el glob no encuentra archivos)
  apis: [path.join(__dirname, '../routes/*.js').replace(/\\/g, '/')]
};

module.exports = swaggerJsdoc(options);
