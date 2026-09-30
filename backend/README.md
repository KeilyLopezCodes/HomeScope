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
        ├── middlewares/        # Funciones intermedias (autenticación JWT, permisos)
        ├── models/             # Definiciones de DTOs y esquemas de validación
        ├── routes/
        │   └── health.routes.js # Ruta de prueba de salud de la API y conexión a la BD
        └── services/           # Lógica de negocio reusable y transacciones con Prisma

---

# Intalación y configuracion paso a paso

## Configurar Variables de Entorno
Dentro de la carpeta backend/, se creo o esito el archivo .env con los datos de conexion a la base de datos de Docker
    PORT=
    DATABASE_URL=

## Levantamiento de la Base de Datos con Docker
Desde la raíz del proyecto (HomeScope/), levanta el contenedor de PostgreSQL ejecutando:
    docker compose up -d

## Creación de Esquema e Inserción de Datos Iniciales (SQL Scripts)
Abre una terminal en la raíz del proyecto para ejecutar la migración del esquema e inserción del seed de seguridad (3 roles, 55 permisos, 89 relaciones):
    1. Crear las 22 tablas, claves primarias, llaves foráneas e índices:
        Get-Content scripts/init.sql | docker exec -i postgresDB psql -U admin -d HomeScope

    2. Poblar los roles, permisos y asignaciones iniciales:
        Get-Content scripts/SeedHomeScope.sql | docker exec -i postgresDB psql -U admin -d HomeScope

## Sincronización e Instalación del Backend (Prisma ORM)
Navega a la carpeta backend/ e instala las dependencias necesarias:
    
    npm install @prisma/client@5.22.0

A continuación, sincroniza el esquema de PostgreSQL hacia Prisma y genera el cliente local:

    # 1. Crear la estructura inicial si no existe
        New-Item -ItemType Directory -Path prisma -Force

    # 2. Introspección: Lee las 22 tablas de PostgreSQL y crea el schema.prisma
        npx prisma@5 db pull

    # 3. Generación del cliente de Prisma para consultas JS/TS
        npx prisma@5 generate

## Verificación del Servidor y Base de Datos
Iniciar el Servidor en Modo Desarrollo:
    
    npm run dev

## Probar el Endpoint de Salud (/api/health):
Abre tu navegador e ingresa a:

    http://localhost:3000/api/health

Debes recibir una respuesta exitosa confirmando el estado de la API y el conteo en tiempo real de los datos en PostgreSQL:

JSON
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

## Explorador Visual de Datos (Prisma Studio):
Para explorar las 22 tablas y registros mediante una interfaz web interactiva, ejecuta:

    npx prisma@5 studio