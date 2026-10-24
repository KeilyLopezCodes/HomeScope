# HomeScope

Plataforma web para publicar, buscar y gestionar propiedades en venta o alquiler. Incluye un **índice de conveniencia** por zona (lugares cercanos), chat en tiempo real entre comprador y vendedor, agenda de visitas, panel del vendedor con estadísticas, moderación y verificación de vendedores.

---

## Tabla de contenido

1. [Stack tecnológico](#1-stack-tecnológico)
2. [Arquitectura](#2-arquitectura)
3. [Requisitos previos](#3-requisitos-previos)
4. [Instalación local paso a paso](#4-instalación-local-paso-a-paso)
5. [Variables de entorno](#5-variables-de-entorno)
6. [Lista completa de endpoints](#6-lista-completa-de-endpoints)
7. [Modelo de datos](#7-modelo-de-datos)
8. [Decisiones de diseño](#8-decisiones-de-diseño)
9. [Verificación rápida (smoke test)](#9-verificación-rápida-smoke-test)
10. [Limitaciones conocidas](#10-limitaciones-conocidas)
11. [Flujo de trabajo del equipo](#11-flujo-de-trabajo-del-equipo)

---

## 1. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite 7 + Tailwind CSS, React Router v7 |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL (Docker) |
| ORM / acceso a datos | Prisma 7 con adaptador `pg`; SQL parametrizado para estadísticas y favoritos |
| Autenticación | JWT (`Authorization: Bearer <token>`) |
| Imágenes | Cloudinary |
| Tiempo real | socket.io (chat) |
| Lugares cercanos | Google Maps Places API |
| Correo | SMTP (Nodemailer)
| Subida de archivos | Multer (multipart) → Cloudinary |
| Documentación API | Swagger (`/api/docs`) |

---

## 2. Arquitectura

```
┌────────────────────┐   HTTP/JSON + WebSocket   ┌─────────────────────────┐
│  Frontend (Vite)   │ ────────────────────────► │  Backend (Express)      │
│  React SPA :5173   │                           │  API REST + socket.io   │
└────────────────────┘                           │  :3000                  │
                                                 └───────┬─────────┬───────┘
                                                         │         │
                                    Prisma / pg          │         │ HTTPS
                                                         ▼         ▼
                                              ┌────────────┐  ┌──────────────────┐
                                              │ PostgreSQL │  │ Cloudinary       │
                                              │ (Docker)   │  │ Google Places    │
                                              └────────────┘  │ SMTP             │
                                                              └──────────────────┘
```

### Backend en capas

```
routes  →  controllers  →  services  →  repositories  →  base de datos
```

- **routes**: define URL, método, middlewares (auth, permisos) y documentación Swagger.
- **controllers**: traduce HTTP ↔ servicio (lee `req`, responde `res`). Sin lógica de negocio.
- **services**: reglas de negocio (validaciones, estados, permisos de propiedad).
- **repositories**: único lugar con consultas a la base de datos.

### Estructura de carpetas <!-- VERIFICAR: comparar con tu árbol real (Get-ChildItem -Recurse -Depth 2) -->

```
HomeScope/
├── backend/
│   ├── prisma/              # schema.prisma (generado con db pull)
│   ├── scripts/             # scripts SQL de migración / índices
│   └── src/
│       ├── app.js           # montaje de rutas y middlewares globales
│       ├── config/          # db (cliente Prisma), cloudinary, swagger
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       └── middlewares/     # authenticateToken, permisos, upload
├── frontend/
│   └── src/
│       ├── api/             # funciones de acceso a la API
│       ├── components/
│       ├── context/         # AuthContext, ChatContext
│       ├── hooks/
│       ├── pages/           # incluye pages/admin/
│       └── utils/
└── README.md
```

### Flujos relevantes

- **Autenticación**: registro → correo de verificación → login devuelve JWT → el frontend lo guarda en `localStorage` (`homescope_token`) y lo envía en cada petición. Ante un 401 el frontend cierra sesión.
- **Chat en tiempo real**: el cliente abre un socket autenticado; los mensajes se persisten en `mensaje` vía REST y se difunden por socket a la conversación.
- **Índice de conveniencia**: al crear/editar una propiedad se calcula en segundo plano (consulta a Google Places por categoría y puntúa cada una). No bloquea la respuesta; se puede recalcular manualmente.
- **Agenda de visitas**: el vendedor define franjas semanales; el comprador elige un horario libre (bloques de 1 h, mínimo 2 h de anticipación, hasta 30 días); el vendedor confirma, reprograma o rechaza; el comprador acepta una reprogramación.
- **Estadísticas del vendedor**: vistas (con deduplicación), favoritos y mensajes por propiedad, y serie diaria de interés.

---

## 3. Requisitos previos

- Node.js 20 o superior y npm
- Docker Desktop (para PostgreSQL)
- Git
- Cuentas / claves (gratuitas) de: Cloudinary, Google Cloud (Places API) y un correo SMTP (por ejemplo Gmail con contraseña de aplicación)

---

## 4. Instalación local paso a paso

### 4.1 Clonar

```powershell
git clone <URL_DEL_REPOSITORIO>
cd HomeScope
git checkout develop
```

### 4.2 Base de datos

```powershell
docker run --name postgresDB -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=<TU_PASSWORD> -e POSTGRES_DB=HomeScope -p 5432:5432 -d postgres:16
```

Crear las tablas (27 en total). 

Ejecutar los scripts SQL en este orden (desde la raíz del repo):

```powershell
Get-Content backend\scripts\init.sql | docker exec -i postgresDB psql -U admin -d HomeScope
Get-Content backend\scripts\seed_roles_permisos.postgres.sql | docker exec -i postgresDB psql -U admin -d HomeScope
Get-Content backend\scripts\seed_tipo_propiedad.sql | docker exec -i postgresDB psql -U admin -d HomeScope
Get-Content backend\scripts\seedCategoria.sql | docker exec -i postgresDB psql -U admin -d HomeScope
Get-Content backend\scripts\migracion_resenas.sql | docker exec -i postgresDB psql -U admin -d HomeScope
Get-Content backend\scripts\migracion_agenda.sql | docker exec -i postgresDB psql -U admin -d HomeScope
Get-Content backend\scripts\t35_indices.sql | docker exec -i postgresDB psql -U admin -d HomeScope
```
Datos de prueba (opcionales):

```powershell
Get-Content backend\scripts\seed-propiedades-prueba.sql | docker exec -i postgresDB psql -U admin -d HomeScope
Get-Content backend\scripts\seed-propiedades-reales-t34.sql | docker exec -i postgresDB psql -U admin -d HomeScope
```

Comprobar:

```powershell
docker exec -it postgresDB psql -U admin -d HomeScope -c "\dt"
```

### 4.3 Backend

```powershell
cd backend
npm install
```

Crear `backend/.env` (ver [sección 5](#5-variables-de-entorno)) y luego:

```powershell
npx prisma generate
npm run dev
```

La API queda en `http://localhost:3000` y Swagger en `http://localhost:3000/api/docs`.

### 4.4 Frontend

```powershell
cd ..\frontend
npm install
```

Crear `frontend/.env`:

```
VITE_API_URL=http://localhost:3000/api
```

```powershell
npm run dev
```

Abrir `http://localhost:5173`.

### 4.5 Crear el primer administrador

Registra un usuario desde la interfaz y asígnale el rol admin en la base de datos:

```powershell
docker exec -it postgresDB psql -U admin -d HomeScope
```

```sql
-- Ajusta el correo. Revisa los ids de rol con: SELECT * FROM rol;
INSERT INTO usuario_rol (usuario_id, rol_id)
SELECT u.id, r.id FROM usuario u, rol r
WHERE u.correo = 'tu_correo@ejemplo.com' AND r.nombre = 'admin';
```
---

## 5. Variables de entorno

### Backend (`backend/.env`)

| Variable | Descripción |
|---|---|
| `PORT` | Puerto de la API (3000) |
| `NODE_ENV` | `development` / `production` |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexión a PostgreSQL |
| `DATABASE_URL` | URL de conexión para Prisma, p. ej. `postgresql://admin:<password>@localhost:5432/HomeScope` |
| `JWT_SECRET` | Secreto para firmar los tokens (cadena larga y aleatoria) |
| `FRONTEND_URL` | Origen permitido por CORS y base de los enlaces de los correos (`http://localhost:5173`) |
| `EMAIL_USER`, `EMAIL_PASS` | Cuenta SMTP para correos de verificación y recuperación |
| `AUTO_VERIFICAR_CORREO` | `true` marca los correos como verificados sin enviar mensaje (solo desarrollo) |
| `GOOGLE_MAPS_API_KEY` | Clave de Google Places para el índice de conveniencia |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Credenciales de Cloudinary |
| `TZ_OFFSET_MIN` | *(opcional)* Desfase horario en minutos para la agenda. Por defecto `-360` (Guatemala, UTC−6) |

### Frontend (`frontend/.env`)

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API. Si falta, usa `http://localhost:3000/api` |

---

## 6. Lista completa de endpoints

Prefijo común: `/api`. 🔒 = requiere `Authorization: Bearer <token>`. 🛡️ = además requiere rol de moderación/admin.
<!-- VERIFICAR: confirmar los prefijos de montaje con:  Select-String backend\src\app.js -Pattern "app.use" -->

### Autenticación — `/api/auth`
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/register` | — | Registrar usuario |
| POST | `/login` | — | Iniciar sesión (devuelve JWT) |
| PUT | `/profile` | 🔒 | Actualizar perfil |
| GET | `/verify-email` | — | Verificar correo con token |
| POST | `/resend-verification` | — | Reenviar correo de verificación |
| POST | `/forgot-password` | — | Solicitar recuperación |
| POST | `/reset-password` | — | Restablecer contraseña |

### Propiedades — `/api/properties`
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/` | 🔒 | Crear propiedad |
| GET | `/` | — | Listar / buscar (con filtros) |
| GET | `/mine` | 🔒 | Mis propiedades |
| GET | `/:id` | — | Detalle |
| PUT | `/:id` | 🔒 | Editar (solo dueño) |
| PATCH | `/:id/estado` | 🔒 | Cambiar estado (publicado, pausado, etc.) |
| DELETE | `/:id` | 🔒 | Eliminar |
| GET | `/:id/history` | — | Historial de precios |
| POST | `/:id/reportes` | 🔒 | Reportar la propiedad |
| POST | `/:id/fotos` | 🔒 | Subir fotos (multipart) |
| PUT | `/:id/fotos/orden` | 🔒 | Reordenar fotos |
| DELETE | `/:id/fotos/:fotoId` | 🔒 | Eliminar foto |

### Índice de conveniencia (geo) — `/api`
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/v1/propiedades/:id/indice` | — | Obtener índice de conveniencia |
| POST | `/api/v1/propiedades/:id/indice/recalcular` | 🔒 | Recalcular índice |
| GET | `/places/search` | — | Buscar lugares cercanos por categoría |

### Reseñas y vendedores
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/reviews` | 🔒 | Crear reseña |
| GET | `/api/sellers/:id` | — | Perfil público del vendedor |
| GET | `/api/sellers/:id/reviews` | — | Reseñas del vendedor |

### Mensajería — `/api/conversaciones`
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/` | 🔒 | Iniciar conversación sobre una propiedad |
| GET | `/` | 🔒 | Listar mis conversaciones |
| GET | `/:id` | 🔒 | Detalle |
| GET | `/:id/mensajes` | 🔒 | Listar mensajes |
| POST | `/:id/mensajes` | 🔒 | Enviar mensaje |

### Favoritos — `/api/favoritos`
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/` | 🔒 | Listar favoritos |
| POST | `/lote` | 🔒 | Subir favoritos locales (máx. 100) |
| PUT | `/:propiedadId` | 🔒 | Agregar |
| DELETE | `/:propiedadId` | 🔒 | Quitar |

### Visitas — `/api/visitas`
| Método | Ruta | Auth / permiso | Descripción |
|---|---|---|---|
| GET | `/horarios/:propiedadId` | 🔒 `visita.solicitar` | Horarios disponibles |
| POST | `/` | 🔒 `visita.solicitar` | Solicitar visita |
| GET | `/` | 🔒 `visita.ver_propias` | Mis visitas (como comprador o vendedor) |
| PATCH | `/:id/confirmar` | 🔒 `visita.confirmar` | Vendedor confirma |
| PATCH | `/:id/reprogramar` | 🔒 `visita.confirmar` | Vendedor propone otra hora |
| PATCH | `/:id/aceptar` | 🔒 `visita.solicitar` | Comprador acepta la reprogramación |
| PATCH | `/:id/cancelar` | 🔒 `visita.cancelar` | Cancelar |

### Disponibilidad del vendedor — `/api/disponibilidad`
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/` | 🔒 | Ver mi disponibilidad |
| PUT | `/` | 🔒 | Reemplazar mi disponibilidad |

### Analítica y panel del vendedor — `/api`
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/vistas/:propiedadId` | opcional | Registrar vista (dedupe 30 min, excluye al dueño) |
| GET | `/panel-vendedor/estadisticas` | 🔒 | Estadísticas por propiedad y serie de interés (`?periodo=7\|30\|90`) |

### Verificación de vendedores — `/api/verificaciones`
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| (ver `verificacion.routes.js`) | | 🔒 | Solicitar verificación y consultar estado |

### Reportes — `/api/reportes`
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/motivos` | — | Catálogo de motivos |
| GET | `/` | 🔒🛡️ | Listar reportes |
| PATCH | `/:id/aprobar` | 🔒🛡️ | Aprobar |
| PATCH | `/:id/rechazar` | 🔒🛡️ | Rechazar |

### Administración — `/api/admin` (🔒🛡️)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/reportes` | Listar reportes |
| GET | `/reportes/:id` | Detalle de reporte |
| PATCH | `/reportes/:id` | Resolver reporte |
| PATCH | `/propiedades/:id/estado` | Moderar propiedad |
| DELETE | `/propiedades/:id` | Eliminar propiedad |
| GET | `/usuarios` | Listar usuarios |
| PATCH | `/usuarios/:id/estado` | Suspender / reactivar usuario |
| GET | `/acciones` | Bitácora de acciones de moderación |
| GET | `/verificaciones` | Listar solicitudes de verificación |
| PATCH | `/verificaciones/:id` | Aprobar / rechazar verificación |

---

## 7. Modelo de datos

27 tablas agrupadas por dominio:

| Dominio | Tablas |
|---|---|
| Usuarios y seguridad | `usuario`, `rol`, `permiso`, `rol_permiso`, `usuario_rol`, `token_usuario`, `verificacion_vendedor` |
| Propiedades | `propiedad`, `tipo_propiedad`, `foto_propiedad`, `historial_precio` |
| Zona e índice | `indice_conveniencia`, `sub_puntaje_categoria`, `categoria_interes`, `punto_interes`, `comentario_zona` |
| Interacción | `favorito`, `busqueda_guardada`, `resena`, `vista_propiedad`, `notificacion` |
| Mensajería | `conversacion`, `mensaje` |
| Agenda | `visita`, `disponibilidad_vendedor` |
| Moderación | `reporte`, `accion_moderacion` |

Estados de `visita`: `solicitada → confirmada | reprogramada | rechazada | cancelada → realizada`.

---

## 8. Decisiones de diseño

| Decisión | Justificación |
|---|---|
| Arquitectura en capas (routes → controllers → services → repositories) | Separa HTTP, reglas de negocio y datos; facilita probar y repartir trabajo entre el equipo. |
| PostgreSQL | Datos muy relacionales (usuarios, propiedades, visitas, mensajes) con integridad referencial y consultas agregadas para estadísticas. |
| Prisma + SQL parametrizado puntual | Prisma da tipado y migración del esquema existente (`db pull`); las consultas de series y conteos son más claras y eficientes en SQL. |
| JWT sin estado | Simplifica el backend (sin sesiones en servidor) y funciona igual en local y desplegado. |
| Cloudinary para fotos | Evita guardar binarios en la BD o en disco del servidor; entrega optimizada por CDN. |
| Índice de conveniencia en segundo plano | Las llamadas a Google Places son lentas y con costo; no deben bloquear la publicación. |
| Favoritos guardados en servidor (con migración desde `localStorage`) | Permite contarlos en el panel del vendedor y conservarlos entre dispositivos. |
| Agenda en bloques de 1 h, 2 h de anticipación, máx. 30 días | Reglas simples que evitan solicitudes inmediatas o demasiado lejanas. |
| Zona horaria fija vía `TZ_OFFSET_MIN` | Guatemala no usa horario de verano; evita ambigüedades entre servidor y navegador. |
| Vistas deduplicadas (30 min) y sin contar al dueño | Mantiene la métrica de interés confiable. |
| Gráfica SVG propia | Sin dependencias extra; accesible (teclado, tabla alternativa). |
| DTO de agenda sin correo ni teléfono | Protege datos personales de comprador y vendedor. |
| Pagos simulados (destacadas / verificación) | Alcance académico: se demuestra el flujo sin manejar datos de tarjeta. |
| Flag `VALIDAR_PERMISOS` en rutas | Permite activar la validación por permisos de forma gradual sin romper el desarrollo. |
| Un solo administrador inicial | Suficiente para moderar; evita construir una interfaz de roles fuera del alcance. |

---

## 9. Verificación rápida (smoke test)

1. `http://localhost:3000/api/docs` muestra Swagger.
2. Registrar un usuario, iniciar sesión y confirmar que `/api/properties` responde.
3. Crear una propiedad con fotos → aparece en el listado y su índice de conveniencia se calcula.
4. Como otro usuario: guardar favorito, iniciar chat, solicitar visita.
5. Como vendedor: ver `/panel` con estadísticas y confirmar la visita en la pestaña *Visitas*.
6. Como admin: abrir `/admin` y revisar reportes y verificaciones.

---

## 11. Flujo de trabajo del equipo

- Ramas de trabajo → Pull Request hacia `develop` (nunca directo a `main`), con *merge* normal, sin *squash* ni `--force`.
- Solo `main` se despliega.
