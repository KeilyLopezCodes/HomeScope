const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

// Prisma serializa los campos DECIMAL como string para no perder precisión
const decimal = (example) => ({ type: 'string', format: 'decimal', example });

const errorResponse = (description, example) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: { success: false, message: example }
    }
  }
});

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HomeScope API',
      version: '1.0.0',
      description: 'API REST de HomeScope — plataforma de búsqueda y gestión de propiedades inmobiliarias.',
    },
    // Relativo: funciona en cualquier puerto/host donde se sirva /api/docs
    servers: [
      { url: '/api', description: 'Servidor actual' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido en POST /auth/login (válido 8 horas)'
        }
      },

      parameters: {
        PropertyId: {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer', minimum: 1, maximum: 2147483647 },
          description: 'ID de la propiedad',
          example: 3
        }
      },

      responses: {
        BadRequest:    errorResponse('Datos o parámetros inválidos', 'ID de propiedad inválido'),
        Unauthorized:  errorResponse('Token no proporcionado', 'Acceso denegado: Token no proporcionado'),
        // El middleware de auth responde 403 cuando el token es inválido o expiró
        Forbidden:     errorResponse('Token inválido o expirado, o el recurso no pertenece al usuario autenticado', 'No tienes permisos para editar esta propiedad'),
        NotFound:      errorResponse('Recurso no encontrado', 'Propiedad no encontrada'),
        InternalError: errorResponse('Error interno del servidor', 'Error interno del servidor')
      },

      schemas: {
        // ── Genéricos ─────────────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operación exitosa' },
            data:    { type: 'object' }
          }
        },
        MessageResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operación exitosa' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Descripción del error' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            totalItems:  { type: 'integer', example: 100 },
            totalPages:  { type: 'integer', example: 10 },
            currentPage: { type: 'integer', example: 1 },
            limit:       { type: 'integer', example: 10 }
          }
        },

        // ── Auth ──────────────────────────────────────────────
        AuthRegister: {
          type: 'object',
          required: ['correo', 'contrasena'],
          description: 'Se aceptan `correo`/`email` y `contrasena`/`password` como alias.',
          properties: {
            correo:     { type: 'string', format: 'email', example: 'juan@example.com' },
            contrasena: { type: 'string', format: 'password', example: 'MiPassword123' },
            nombre:     { type: 'string', example: 'Juan', description: "Por defecto 'Usuario'" },
            apellido:   { type: 'string', example: 'Pérez' },
            telefono:   { type: 'string', example: '+502 5555-5555' }
          }
        },
        AuthLogin: {
          type: 'object',
          required: ['correo', 'contrasena'],
          description: 'Se aceptan `correo`/`email` y `contrasena`/`password` como alias.',
          properties: {
            correo:     { type: 'string', format: 'email', example: 'juan@example.com' },
            contrasena: { type: 'string', format: 'password', example: 'MiPassword123' }
          }
        },
        UsuarioPublico: {
          type: 'object',
          properties: {
            id:       { type: 'integer', example: 2 },
            nombre:   { type: 'string', example: 'Carlos' },
            apellido: { type: 'string', example: 'Mendoza' },
            correo:   { type: 'string', format: 'email', example: 'vendedor@homescope.test' },
            telefono: { type: 'string', nullable: true, example: '50230001234' }
          }
        },
        Usuario: {
          type: 'object',
          properties: {
            id:                { type: 'integer', example: 2 },
            nombre:            { type: 'string', example: 'Carlos' },
            apellido:          { type: 'string', example: 'Mendoza' },
            correo:            { type: 'string', format: 'email', example: 'vendedor@homescope.test' },
            telefono:          { type: 'string', nullable: true, example: '50230001234' },
            foto_url:          { type: 'string', nullable: true, example: null },
            correo_verificado: { type: 'boolean', example: false },
            estado:            { type: 'string', example: 'activo' },
            fecha_registro:    { type: 'string', format: 'date-time' },
            ultimo_acceso:     { type: 'string', format: 'date-time', nullable: true }
          }
        },

        // ── Propiedades ───────────────────────────────────────
        PropertyInput: {
          type: 'object',
          required: ['titulo', 'descripcion', 'precio'],
          description: 'Los campos opcionales omitidos toman valores por defecto. La propiedad se crea siempre en estado `borrador`.',
          properties: {
            titulo:            { type: 'string', maxLength: 150, example: 'Casa en zona 10' },
            descripcion:       { type: 'string', example: 'Amplia casa con jardín' },
            precio:            { type: 'number', minimum: 0, example: 150000 },
            moneda:            { type: 'string', minLength: 3, maxLength: 3, default: 'USD', example: 'GTQ' },
            modalidad:         { type: 'string', enum: ['VENTA', 'ALQUILER'], default: 'VENTA', description: 'No distingue mayúsculas' },
            tipo_propiedad_id: { type: 'integer', default: 1, example: 1, description: '1=Casa, 2=Apartamento, 3=Terreno, 4=Local Comercial, 5=Oficina. Debe existir.' },
            habitaciones:      { type: 'integer', default: 0, example: 3 },
            banos:             { type: 'number', default: 0, example: 2.5 },
            area_m2:           { type: 'number', default: 0, example: 120.5 },
            parqueos:          { type: 'integer', default: 0, example: 2, description: 'Alias aceptado: `estacionamientos`' },
            direccion:         { type: 'string', default: '', example: 'Calle 5, Zona 10' },
            zona:              { type: 'string', default: '1', example: '10' },
            municipio:         { type: 'string', default: 'Guatemala', example: 'Guatemala' },
            departamento:      { type: 'string', default: 'Guatemala', example: 'Guatemala' },
            latitud:           { type: 'number', default: 0, example: 14.6049 },
            longitud:          { type: 'number', default: 0, example: -90.5069 }
          }
        },
        PropertyUpdate: {
          type: 'object',
          minProperties: 1,
          description: 'Solo se aplican estos campos; cualquier otro (estado, vendedor_id, etc.) se ignora. Debe enviarse al menos uno.',
          properties: {
            titulo:            { type: 'string', example: 'Casa remodelada en zona 10' },
            descripcion:       { type: 'string' },
            precio:            { type: 'number', minimum: 0, example: 145000 },
            moneda:            { type: 'string', example: 'USD' },
            modalidad:         { type: 'string', enum: ['VENTA', 'ALQUILER'] },
            tipo_propiedad_id: { type: 'integer', example: 1 },
            habitaciones:      { type: 'integer' },
            banos:             { type: 'number' },
            area_m2:           { type: 'number' },
            parqueos:          { type: 'integer' },
            direccion:         { type: 'string' },
            zona:              { type: 'string' },
            municipio:         { type: 'string' },
            departamento:      { type: 'string' },
            latitud:           { type: 'number' },
            longitud:          { type: 'number' },
            google_place_id:   { type: 'string' }
          }
        },
        EstadoUpdate: {
          type: 'object',
          required: ['estado'],
          properties: {
            estado: {
              type: 'string',
              enum: ['borrador', 'publicado', 'pausado', 'vendido', 'alquilado', 'no_disponible'],
              example: 'publicado',
              description: 'No distingue mayúsculas'
            }
          }
        },
        Property: {
          type: 'object',
          description: 'Fila de la tabla `propiedad`. Los campos decimales se devuelven como string.',
          properties: {
            id:                  { type: 'integer', example: 3 },
            vendedor_id:         { type: 'integer', example: 2 },
            tipo_propiedad_id:   { type: 'integer', example: 1 },
            titulo:              { type: 'string', example: 'Casa en zona 10' },
            descripcion:         { type: 'string', example: 'Amplia casa con jardín' },
            modalidad:           { type: 'string', enum: ['VENTA', 'ALQUILER'] },
            precio:              decimal('150000'),
            moneda:              { type: 'string', example: 'GTQ' },
            habitaciones:        { type: 'integer', example: 3 },
            banos:               decimal('2.5'),
            area_m2:             decimal('120.5'),
            parqueos:            { type: 'integer', example: 2 },
            direccion:           { type: 'string', example: 'Calle 5, Zona 10' },
            zona:                { type: 'string', example: '10' },
            municipio:           { type: 'string', example: 'Guatemala' },
            departamento:        { type: 'string', example: 'Guatemala' },
            latitud:             decimal('14.6049'),
            longitud:            decimal('-90.5069'),
            google_place_id:     { type: 'string', nullable: true },
            estado:              { type: 'string', enum: ['borrador', 'publicado', 'pausado', 'vendido', 'alquilado', 'no_disponible'] },
            paso_formulario:     { type: 'integer', example: 1 },
            fecha_publicacion:   { type: 'string', format: 'date-time', nullable: true },
            fecha_expiracion:    { type: 'string', format: 'date-time', nullable: true },
            fecha_creacion:      { type: 'string', format: 'date-time' },
            fecha_actualizacion: { type: 'string', format: 'date-time' }
          }
        },
        TipoPropiedad: {
          type: 'object',
          properties: {
            id:     { type: 'integer', example: 1 },
            nombre: { type: 'string', example: 'Casa' }
          }
        },
        Foto: {
          type: 'object',
          properties: {
            id:           { type: 'integer', example: 12 },
            propiedad_id: { type: 'integer', example: 3 },
            url:          { type: 'string', format: 'uri', example: 'https://res.cloudinary.com/demo/image/upload/v1/homescope/propiedades/3/abc.jpg' },
            public_id:    { type: 'string', example: 'homescope/propiedades/3/abc' },
            orden:        { type: 'integer', example: 0 },
            es_portada:   { type: 'boolean', example: true },
            tamano_bytes: { type: 'integer', example: 245760 },
            fecha_subida: { type: 'string', format: 'date-time' }
          }
        },
        PriceHistoryEntry: {
          type: 'object',
          properties: {
            id:              { type: 'integer', example: 18 },
            propiedad_id:    { type: 'integer', example: 3 },
            precio_anterior: decimal('150000'),
            precio_nuevo:    decimal('145000'),
            cambiado_por:    { type: 'integer', example: 2 },
            fecha_cambio:    { type: 'string', format: 'date-time' },
            usuario: {
              type: 'object',
              properties: {
                id:     { type: 'integer', example: 2 },
                nombre: { type: 'string', example: 'Carlos' }
              }
            }
          }
        },
        IndiceResumen: {
          type: 'object',
          properties: {
            puntaje_total:  decimal('78.50'),
            nivel_semaforo: { type: 'string', example: 'verde' }
          }
        },
        IndiceConveniencia: {
          type: 'object',
          properties: {
            id:                { type: 'integer', example: 1 },
            propiedad_id:      { type: 'integer', example: 3 },
            puntaje_total:     decimal('78.50'),
            nivel_semaforo:    { type: 'string', example: 'verde' },
            radio_m:           { type: 'integer', example: 2000 },
            version_algoritmo: { type: 'string', example: 'v1' },
            es_vigente:        { type: 'boolean', example: true },
            fecha_calculo:     { type: 'string', format: 'date-time' }
          }
        },
        PropertyListItem: {
          description: 'Elemento del listado público: incluye vendedor, tipo, solo la foto de portada y el índice vigente.',
          allOf: [
            { $ref: '#/components/schemas/Property' },
            {
              type: 'object',
              properties: {
                usuario:             { $ref: '#/components/schemas/UsuarioPublico' },
                tipo_propiedad:      { $ref: '#/components/schemas/TipoPropiedad' },
                foto_propiedad:      { type: 'array', maxItems: 1, items: { $ref: '#/components/schemas/Foto' } },
                indice_conveniencia: { type: 'array', maxItems: 1, items: { $ref: '#/components/schemas/IndiceResumen' } }
              }
            }
          ]
        },
        PropertyDetail: {
          description: 'Ficha completa: vendedor, tipo, todas las fotos (por orden), historial de precios (cronológico) e índices.',
          allOf: [
            { $ref: '#/components/schemas/Property' },
            {
              type: 'object',
              properties: {
                usuario:             { $ref: '#/components/schemas/UsuarioPublico' },
                tipo_propiedad:      { $ref: '#/components/schemas/TipoPropiedad' },
                foto_propiedad:      { type: 'array', items: { $ref: '#/components/schemas/Foto' } },
                historial_precio:    { type: 'array', items: { $ref: '#/components/schemas/PriceHistoryEntry' } },
                indice_conveniencia: { type: 'array', items: { $ref: '#/components/schemas/IndiceConveniencia' } }
              }
            }
          ]
        },
        MyPropertyItem: {
          description: 'Propiedad del vendedor autenticado, con su tipo y todas sus fotos.',
          allOf: [
            { $ref: '#/components/schemas/Property' },
            {
              type: 'object',
              properties: {
                tipo_propiedad: { $ref: '#/components/schemas/TipoPropiedad' },
                foto_propiedad: { type: 'array', items: { $ref: '#/components/schemas/Foto' } }
              }
            }
          ]
        },
        PaginatedProperties: {
          type: 'object',
          properties: {
            success:    { type: 'boolean', example: true },
            data:       { type: 'array', items: { $ref: '#/components/schemas/PropertyListItem' } },
            pagination: { $ref: '#/components/schemas/Pagination' }
          }
        },

        // ── Lugares ───────────────────────────────────────────
        Lugar: {
          type: 'object',
          properties: {
            google_place_id:     { type: 'string', example: 'ChIJN1t_tDeuEmsRUsoyG83frY4' },
            nombre:              { type: 'string', example: 'Hospital General' },
            latitud:             { type: 'number', example: 14.6101 },
            longitud:            { type: 'number', example: -90.5122 },
            distancia_m:         { type: 'number', example: 812.4 },
            tiempo_estimado_min: { type: 'integer', example: 10, description: 'Caminando, a 80 m/min' },
            radio_consulta_m:    { type: 'integer', example: 5000 }
          }
        },

        // ── Reportes ──────────────────────────────────────────
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
      }
    }
  },
  // glob con "/" (en Windows path.join usa "\" y el glob no encuentra archivos)
  apis: [path.join(__dirname, '../routes/*.js').replace(/\\/g, '/')]
};

module.exports = swaggerJsdoc(options);
