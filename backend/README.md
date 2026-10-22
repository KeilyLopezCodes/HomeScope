# HomeScope - Backend API & Base de Datos

Servidor REST API para la plataforma inmobiliaria **HomeScope**, construido sobre Node.js, Express, PostgreSQL en Docker y Prisma ORM (v5).

---

## Requisitos Previos

Asegúrate de tener instalado y activo lo siguiente antes de comenzar:

* **Docker Desktop**: Debe estar abierto y en ejecución.
* **Node.js**: Versión LTS (v18, v20 o v24).
* **Git**: Para el control de versiones.
* **PowerShell**: En entorno Windows (recomendado para la ejecución de scripts SQL).


---

## Estructura del Proyecto

```text
HomeScope/
├── docker-compose.yml          # Configuración del contenedor PostgreSQL
├── scripts/
│   ├── init.sql                # Script de creación de las 22 tablas, comentarios e índices
│   └── SeedHomeScope.sql       # Script de población inicial (Roles, Permisos y Asignaciones)
└── backend/
    ├── Dockerfile              # Instrucciones de empaquetado para el contenedor Node.js
    ├── package.json            # Dependencias del servidor y scripts
    ├── server.js               # Punto de entrada principal del servidor
    ├── .env                    # Variables de entorno (DB URL y Puerto)
    ├── prisma/
    │   └── schema.prisma       # Esquema generado mediante introspección
    └── src/
        ├── app.js              # Configuración de Express y middlewares
        ├── config/
        │   └── db.js           # Cliente de conexión a Prisma Client
        ├── controllers/        # Maneja la recepción de solicitudes HTTP (req, res)
        ├── interfaces/         # Contratos/Interfaces abstractos de los repositorios
        ├── middlewares/        # Funciones intermedias (autenticación JWT, permisos)
        ├── models/             # Definiciones de DTOs y esquemas de validación
        ├── repositories/       # Implementación concreta del acceso a datos (Prisma ORM)
        ├── routes/
        │   └── health.routes.js # Ruta de prueba de salud de la API y conexión a la BD
        └── services/           # Lógica de negocio pura (depende de las interfaces de repositorios)


```

---

## Instalación y Configuración Paso a Paso

### 1. Configurar Variables de Entorno

Dentro de la carpeta `backend/`, crea o edita el archivo `.env` con los datos de conexión correspondientes:

```env
PORT=3000
NODE_ENV=development
DB_USER=tu_admin
DB_PASSWORD=tu_contraseña
DB_HOST=db
DB_PORT=5432
DB_NAME=HomeScope
DATABASE_URL="postgresql://admin:tu_contraseña@db:5432/HomeScope?schema=public"
JWT_SECRET="secret_key"

```

* **Especificación del archivo `.env`:** Archivo de configuración centralizado ubicado en la carpeta `backend/`. Almacena de forma segura las variables de entorno del servidor, los puertos de ejecución, el entorno de trabajo (`development`), las credenciales y el host de conexión con la base de datos dentro de la red de Docker (`db`), así como la clave criptográfica para la validación de tokens JWT.

---

### 2. Levantamiento de Contenedores y Actualización con Docker

Desde la raíz del proyecto (`HomeScope/`), puedes levantar los servicios o aplicar cambios recientes en tus dependencias y archivos de configuración ejecutando:

```bash
docker compose up --build -d

```

* **Levanta los contenedores en segundo plano (`-d`)**: Pone en marcha las instancias de la base de datos y la aplicación.
* **Reconstruye las imágenes (`--build`)**: Detecta automáticamente si hubo modificaciones en el `Dockerfile`, en el `package.json` o si instalaste nuevos paquetes, reinstalando las dependencias dentro del contenedor para mantener todo sincronizado sin necesidad de comandos adicionales.

---

### 3. Creación de Esquema e Inserción de Datos Iniciales (SQL Scripts)

Abre una terminal en la raíz del proyecto para ejecutar la migración del esquema e inserción del seed de seguridad (3 roles, 55 permisos, 89 relaciones):

1. Crear las 22 tablas, claves primarias, llaves foráneas e índices:
```powershell
Get-Content scripts/init.sql | docker exec -i postgresDB psql -U admin -d HomeScope

```


2. Poblar los roles, permisos y asignaciones iniciales:
```powershell
Get-Content scripts/SeedHomeScope.sql | docker exec -i postgresDB psql -U admin -d HomeScope

```



---

### 4. Sincronización e Instalación del Backend (Prisma ORM)

Navega a la carpeta `backend/` y genera la estructura si es necesario:

```powershell
# 1. Crear la estructura inicial si no existe
New-Item -ItemType Directory -Path prisma -Force

# 2. Introspección: Lee las 22 tablas de PostgreSQL y crea el schema.prisma
npx prisma@5 db pull

# 3. Generación del cliente de Prisma para consultas JS/TS
npx prisma@5 generate

```

---

## Verificación del Servidor y Base de Datos

Inicia el servidor en modo desarrollo:

```bash
npm run dev

```

### Probar el Endpoint de Salud (`/api/health`)

Abre tu navegador o una herramienta de pruebas e ingresa a:

```text
http://localhost:3000/api/health

```

Debes recibir una respuesta exitosa confirmando el estado de la API y el conteo en tiempo real de los datos en PostgreSQL:

```json
{
  "status": "OK",
  "service": "HomeScope Backend API",
  "database": "PostgreSQL (Docker + Prisma)",
  "datos": {
    "roles": 3,
    "permisos": 55
  },
  "timestamp": "2026-09-28T15:25:00.000Z"
}

```

---

## Dependencias y Scripts del Backend

Las dependencias principales del proyecto declaradas en `backend/package.json` son las siguientes:

### Instalación de Dotenv

```bash
npm install dotenv

```

* **Especificación:** Librería que permite cargar las variables de entorno definidas en el archivo `.env` hacia `process.env` en la aplicación de Node.js, facilitando la lectura segura de credenciales, puertos y URLs de conexión.

---

### Instalación de Express

```bash
npm install express

```

* **Especificación:** Framework web minimalista y flexible para Node.js, utilizado para estructurar y levantar el servidor REST API, manejar rutas, peticiones HTTP y middlewares.

---

### Instalación de Prisma ORM

```bash
npm install prisma@7.10.0 @prisma/client@7.10.0 --save-exact

```

### Adaptador de Prisma para PostgreSQL

Adaptador de Prisma para PostgreSQL y librería para el hasheo seguro de contraseñas mediante algoritmos de encriptación.
```bash
npm install @prisma/adapter-pg bcryptjs

```

* **Especificación:** Cliente oficial de Prisma (versión 5.22.0) optimizado para realizar consultas tipadas, seguras y eficientes hacia la base de datos PostgreSQL.

---

### Instalación de JSON Web Token

```bash
npm install jsonwebtoken

```

* **Especificación:** Librería utilizada para generar y verificar tokens de autenticación (JWT), permitiendo proteger las rutas de la API y gestionar sesiones de usuario seguras.

---

### Instalación de Bcrypt.js

```bash
npm install bcryptjs

```

* **Especificación:** Herramienta para el hasheo seguro de contraseñas mediante algoritmos de encriptación, ideal para almacenar credenciales protegidas en la base de datos.

---

### Instalación de Nodemailer

```bash
npm install nodemailer

```

* **Especificación:** Módulo para Node.js que facilita el envío rápido y seguro de correos electrónicos desde la aplicación (notificaciones, recuperación de contraseñas, etc.).


## Carga de imágenes (T25 · Cloudinary)

Los vendedores suben hasta 10 fotos por propiedad. Las imágenes se validan en el backend
y se guardan en Cloudinary; en la base de datos (`foto_propiedad`) quedan la URL, el orden
y cuál es la portada.

### Qué necesitas
1. Las credenciales de Cloudinary.
2. Agregarlas a `backend/.env`:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

3. Instalar las dependencias nuevas (`cloudinary` y `multer`) después de hacer `git pull`:

```bash
cd backend
npm install
```

En el frontend no hay paquetes nuevos. Si Vite no encuentra `react-hook-form`,
corre `npm install` dentro de `frontend/`.

> Si cambias el `.env`, reinicia el backend (nodemon no vigila ese archivo): escribe `rs` + Enter.

### Cómo probarlo
1. Levanta la base de datos, el backend (`npm run dev`) y el frontend (`npm run dev`).
2. Regístrate e inicia sesión (si te pide verificar el correo, ver "Problemas frecuentes").
3. Entra a `http://localhost:5173/publicar` y llena los 4 pasos.
4. En el paso 2: elige varias fotos, cambia la portada, reordénalas (arrastrando o con ◀ ▶) y quita alguna.
5. En el paso 4 presiona **Publicar Propiedad**: verás la barra de progreso y el mensaje de éxito.
6. Verifica en la base de datos:

```bash
docker exec -i postgresDB psql -U admin -d HomeScope -c "SELECT id, propiedad_id, orden, es_portada FROM foto_propiedad ORDER BY orden;"
```

### Endpoints (requieren `Authorization: Bearer <token>`)

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/api/properties/:id/fotos` | Sube fotos (`form-data`: campo `fotos` repetido, y `portada` con el índice de la portada) |
| PUT | `/api/properties/:id/fotos/orden` | Cambia el orden y la portada. Body: `{ "ids": [..], "portadaId": X }` |
| DELETE | `/api/properties/:id/fotos/:fotoId` | Elimina una foto (Cloudinary y base de datos) |

Al eliminar una propiedad también se eliminan sus fotos de Cloudinary.

### Reglas
- Formatos: jpg, png y webp. Máximo 5 MB por foto y 10 fotos por propiedad.
- El backend revisa el contenido real del archivo, no solo la extensión.
- Solo el dueño de la propiedad puede subir, ordenar o borrar sus fotos.

### Problemas frecuentes
- **"No se pudo conectar con el servidor"**: el backend está apagado o se cayó; revisa su terminal.
- **`Must supply cloud_name` o `Invalid API key`**: faltan o están mal las claves de Cloudinary en el `.env`.
- **Miniaturas rotas en el paso 2**: recarga con `Ctrl + Shift + R` y vuelve a elegir las fotos.
- **No te deja iniciar sesión por correo sin verificar**: verifícalo a mano:

```bash
docker exec -i postgresDB psql -U admin -d HomeScope -c "UPDATE usuario SET correo_verificado = true WHERE correo = 'tu@correo.com';"
```
## Mensajería interna (T30 / T41)

Chat entre comprador y vendedor, siempre ligado a una propiedad. Los mensajes se guardan en PostgreSQL y se entregan en tiempo real con WebSockets (socket.io).

### Dependencias nuevas
```bash
cd backend && npm install     # socket.io
cd frontend && npm install    # socket.io-client
```
No hay cambios en la base de datos: usa las tablas `conversacion`, `mensaje` y `notificacion` que ya existen.

### Endpoints (todos requieren `Authorization: Bearer <token>`)
| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/api/conversaciones` | Abre o reutiliza la conversación de una propiedad (`propiedad_id`, `contenido` opcional) |
| GET | `/api/conversaciones` | Lista mis conversaciones con mensajes sin leer |
| GET | `/api/conversaciones/:id` | Detalle (solo participantes) |
| GET | `/api/conversaciones/:id/mensajes` | Mensajes en orden cronológico; marca como leídos los del otro |
| POST | `/api/conversaciones/:id/mensajes` | Envía un mensaje (máx. 2000 caracteres) |

Documentados en Swagger: `http://localhost:3000/api/docs` → sección **Mensajería**.

### Eventos WebSocket
El cliente se conecta a `http://localhost:3000` con `auth: { token }`. Eventos que recibe: `mensaje:nuevo`, `notificacion:nueva`, `mensaje:enviado`, `mensajes:leidos`.

### Reglas
- Una conversación por propiedad y comprador.
- Solo participan el comprador y el dueño de la propiedad (otros reciben 403).
- Solo se puede escribir sobre propiedades en estado `publicado`.
- No se permiten correos ni teléfonos dentro del chat (se rechaza el mensaje).
- Si se cae la conexión, el cliente reconecta solo y muestra un aviso.

### Cómo probarlo
1. Levantar base de datos, backend (`npm run dev`) y frontend (`npm run dev`).
2. Tener dos usuarios y una propiedad `publicado` cuyo dueño sea uno de ellos.
3. Abrir **dos navegadores distintos** (o uno normal y uno en incógnito): vendedor y comprador. El mismo navegador comparte la sesión.
4. Comprador: abrir `http://localhost:5173/propiedades/<id>` → **Enviar mensaje al vendedor** → escribir un mensaje.
5. Vendedor (fuera de `/mensajes`): debe aparecer el aviso "Nuevo mensaje de…" abajo a la derecha, sin recargar.
6. Responder y comprobar que el comprador lo ve en vivo.
7. Probar la reconexión: detener el backend y volver a levantarlo; debe aparecer y desaparecer el banner "Reconectando el chat…".
8. Verificar en BD:
```bash
docker exec postgresDB psql -U <DB_USER> -d <DB_NAME> -c "SELECT id,conversacion_id,remitente_id,contenido FROM mensaje ORDER BY id DESC LIMIT 5;"
```

## Agenda de visitas (T18)

Servicio backend para que el vendedor declare cuándo puede atender visitas y para que el comprador solicite una visita en un horario libre. El vendedor confirma o reprograma, y las dos partes reciben un recordatorio antes de la visita.

### Cambios en la base de datos
Aplicar la migración (es idempotente, se puede correr varias veces). Una base nueva ya la trae en `init.sql`.
```bash
docker cp scripts/migracion_agenda.sql postgresDB:/tmp/migracion_agenda.sql
docker exec postgresDB psql -U <DB_USER> -d <DB_NAME> -1 -v ON_ERROR_STOP=1 -f /tmp/migracion_agenda.sql
```
No hay dependencias nuevas.

### Endpoints (todos requieren `Authorization: Bearer <token>`)
| Método | Ruta | Quién | Qué hace |
|---|---|---|---|
| GET | `/api/disponibilidad` | Vendedor | Mis franjas de disponibilidad |
| PUT | `/api/disponibilidad` | Vendedor | Define mis horarios (reemplaza las franjas del ámbito) |
| GET | `/api/visitas/horarios/:propiedadId` | Comprador | Horarios libres de una propiedad |
| POST | `/api/visitas` | Comprador | Solicita una visita |
| GET | `/api/visitas` | Ambos | Mis visitas |
| PATCH | `/api/visitas/:id/confirmar` | Vendedor | Confirma una solicitud |
| PATCH | `/api/visitas/:id/reprogramar` | Vendedor | Propone otro horario |
| PATCH | `/api/visitas/:id/aceptar` | Comprador | Acepta el horario reprogramado |
| PATCH | `/api/visitas/:id/cancelar` | Ambos | Cancela (o rechaza, si el vendedor la descarta) |

Documentados en Swagger: `http://localhost:3000/api/docs` → sección **Agenda**.

### Reglas
- `dia_semana`: 1 = lunes … 7 = domingo. Horas `HH:MM` en hora de Guatemala.
- Las franjas pueden ser generales o solo para una propiedad (estas tienen prioridad).
- Cada visita dura 1 hora y se reserva en horas en punto, con mínimo 2 horas de anticipación y hasta 30 días.
- Estados: `solicitada` → `confirmada` / `reprogramada` → `confirmada`; también `cancelada` y `rechazada`.
- No se puede reservar un horario ocupado: dos solicitudes simultáneas no pueden tomar el mismo.
- Un comprador solo puede tener una visita activa por propiedad. Nadie agenda su propia propiedad.
- Las respuestas nunca incluyen correo ni teléfono, solo nombres.

### Recordatorios
Cada minuto el backend busca visitas **confirmadas** que empiecen dentro de las próximas 24 horas (cambia con `REMINDER_HORAS`) y crea una notificación para el comprador y otra para el vendedor. Si hay correo configurado (`EMAIL_USER` y `EMAIL_PASS`), también se envía un correo. Cada recordatorio se envía una sola vez. Con `RECORDATORIO_CORREO=false` solo se notifica en la app.

### Cómo probarlo
1. Aplicar la migración y reiniciar el backend.
2. Tener dos usuarios y una propiedad `publicado` cuyo dueño sea el vendedor. En Swagger, usar dos pestañas del navegador con un token distinto en cada una.
3. **Vendedor:** `PUT /api/disponibilidad` con `{"franjas":[{"dia_semana":4,"hora_inicio":"08:00","hora_fin":"12:00"}]}` (ajustar el día).
4. **Comprador:** `GET /api/visitas/horarios/<id>`, copiar un `inicio` y hacer `POST /api/visitas` con `{"propiedad_id": <id>, "fecha_hora": "<inicio>"}`. Debe responder 201 con estado `solicitada`.
5. **Vendedor:** `GET /api/visitas` y `PATCH /api/visitas/<id>/confirmar`.
6. Probar errores: repetir la solicitud (409), pedir una hora que no está en la lista (400), confirmar como comprador (403).
7. **Reprogramar:** vendedor `PATCH .../reprogramar` con otra hora de la lista; comprador `PATCH .../aceptar`.
8. **Recordatorio:** con una visita confirmada, poner `REMINDER_HORAS=720` en `backend/.env`, reiniciar y esperar un minuto. Debe salir en la terminal `[recordatorios] 1 recordatorio(s)...` y verificarse en la base:
```bash
docker exec postgresDB psql -U <DB_USER> -d <DB_NAME> -c "SELECT usuario_id,tipo,titulo,enviada_correo FROM notificacion WHERE tipo='recordatorio_visita';"
```
Al terminar, volver `REMINDER_HORAS` a 24.