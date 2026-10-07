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
