# HomeScope · Frontend · Autenticación

Formularios de **Registro**, **Inicio de sesión** y **Recuperación de contraseña**, conectados a la API del backend. El token JWT se guarda en `localStorage` para mantener la sesión al recargar la página.

## Tecnologías

- React + Vite
- Tailwind CSS
- React Router DOM
- Fetch API (sin librerías extra)

## Instalación y ejecución

```bash
cd frontend
npm install
npm install react-router-dom
npm run dev
```

La app queda en `http://localhost:5173`. El backend debe estar corriendo al mismo tiempo (por defecto en el puerto `3000`).

### Variables de entorno

Crear un archivo `.env` en la raíz de `frontend/` (junto a `package.json`):

```env
VITE_API_URL=http://localhost:3000/api
```

> Vite solo lee el `.env` al arrancar. Si lo cambias, reinicia `npm run dev`.

## Estructura de carpetas

```
frontend/
├── public/
│   └── logo.png                 ← ícono de la pestaña
└── src/
    ├── app/
    │   └── App.jsx              ← rutas de la aplicación
    ├── assets/
    │   └── logo.png             ← logo de HomeScope
    ├── components/
    │   ├── AuthUI.jsx           ← layout, inputs, botones y alertas reutilizables
    │   └── RutaProtegida.jsx    ← bloquea rutas si no hay sesión
    ├── context/
    │   └── AuthContext.jsx      ← estado global de sesión (token y usuario)
    ├── pages/
    │   ├── Login.jsx
    │   ├── Registro.jsx
    │   ├── Recuperacion.jsx     ← pide el correo para recuperar
    │   ├── NuevaPassword.jsx    ← formulario del link que llega al correo
    │   └── Verificado.jsx       ← resultado de verificar el correo
    ├── services/
    │   └── authApi.js           ← todas las llamadas a la API de auth
    └── main.jsx
```

## Rutas del frontend

| Ruta | Pantalla | Acceso |
|---|---|---|
| `/login` | Inicio de sesión | Pública |
| `/registro` | Crear cuenta | Pública |
| `/recuperar` | Pedir link de recuperación | Pública |
| `/nueva-password?token=...` | Crear nueva contraseña | Pública (requiere token del correo) |
| `/verificado?status=ok\|error` | Resultado de la verificación | Pública |
| `/` | Inicio | **Protegida** (redirige a `/login` si no hay sesión) |

## Pantallas

### Inicio de sesión

![Login](docs/img/login.png)

Correo y contraseña. Si el backend responde con éxito, se guarda la sesión y se redirige a `/`. Si el correo aún no fue verificado, el backend responde con un mensaje que se muestra en pantalla.

### Registro

![Registro](docs/img/registro.png)

Campos: nombre, apellido, correo, contraseña y confirmación. Validaciones en el cliente: mínimo 8 caracteres y que ambas contraseñas coincidan. Al registrarse, el usuario recibe un correo para activar su cuenta y es enviado a `/login` con un aviso.

### Recuperación de contraseña

![Recuperación](docs/img/recuperacion.png)

El usuario escribe su correo. Siempre se muestra el mismo mensaje, exista o no el correo, para no revelar qué cuentas están registradas.

### Nueva contraseña

![Nueva contraseña](docs/img/nueva-password.png)

Pantalla a la que llega el usuario desde el link del correo. Lee el `token` de la URL y lo envía junto con la nueva contraseña.

### Verificación de correo

![Verificado](docs/img/verificadoOK.png)
![Verificado](docs/img/verificadoERROR.png)

Después de dar clic en el link del correo, el backend verifica la cuenta y redirige a esta pantalla con `?status=ok` o `?status=error`.

## Flujos

**Registro y primer acceso**

```
Registro → correo con link → clic → /verificado → Login → sesión iniciada
```

**Recuperar contraseña**

```
/recuperar → correo con link (15 min) → /nueva-password → Login
```

## Endpoints que consume

Todos cuelgan de `VITE_API_URL` (por defecto `http://localhost:3000/api`).

| Método | Endpoint | Función en `authApi.js` | Body |
|---|---|---|---|
| POST | `/auth/register` | `registrar()` | `{ nombre, apellido, email, password }` |
| POST | `/auth/login` | `iniciarSesion()` | `{ email, password }` |
| POST | `/auth/forgot-password` | `pedirRecuperacion()` | `{ email }` |
| POST | `/auth/reset-password` | `cambiarPassword()` | `{ token, password }` |
| PUT | `/auth/profile` | `actualizarPerfil()` | `{ nombre, telefono }` + header `Authorization` |

El backend siempre responde con la forma `{ success, message, data }`. Si `success` es `false` o el status no es 2xx, `authApi.js` lanza un error con el `message` del backend, y cada pantalla lo muestra en una alerta.

## Manejo de la sesión

La sesión vive en `AuthContext` y se guarda en `localStorage`:

| Clave | Contenido |
|---|---|
| `homescope_token` | Token JWT |
| `homescope_user` | `{ id, nombre, email }` en JSON |

- Al cargar la app, el contexto lee `localStorage`, así que la sesión sobrevive a recargas.
- `login()` guarda token y usuario. `logout()` los borra.
- Para llamar a rutas protegidas, el token se envía como `Authorization: Bearer <token>`.
- `RutaProtegida` revisa si hay token; si no, redirige a `/login`.

Uso en cualquier componente:

```jsx
import { useAuth } from '../context/AuthContext';

const { user, token, estaAutenticado, logout } = useAuth();
```

## Diseño

Paleta de HomeScope, aplicada con valores de Tailwind:

| Color | Hex | Uso |
|---|---|---|
| Azul | `#1E4273` | Panel lateral, botones, links |
| Verde | `#2E9E6B` | Detalles y mensajes de éxito |
| Oscuro | `#222A33` | Títulos y textos |
| Blanco | `#FFFFFF` | Fondo del formulario |

Todas las piezas visuales (layout, campos, botones, alertas) están en `components/AuthUI.jsx`. Para cambiar el aspecto de todas las pantallas basta con editar ese archivo.

## Cambios necesarios en el backend

Para que este frontend funcione, el backend tiene:

- `cors` habilitado para `http://localhost:5173`.
- Rutas nuevas `POST /auth/forgot-password` y `POST /auth/reset-password`.
- `GET /auth/verify-email` redirige a `{FRONTEND_URL}/verificado` en lugar de responder JSON.
- Variable `FRONTEND_URL=http://localhost:5173` en su `.env`.


##  Solución de Problemas Frecuentes (Troubleshooting)

Si durante la ejecución local encuentras fallas de inicio en alguno de los dos entornos, verifica las siguientes causas y soluciones:

### 1. Error en el Backend: `[nodemon] app crashed - waiting for file changes before starting...`
* **Causa:** Ocurre habitualmente cuando Node.js no logra resolver el paquete `cors` dentro del archivo principal del servidor (`app.js` o `server.js`).
* **Solución:** Abre la terminal en la carpeta del backend e instala la dependencia:
  ```bash
  cd backend
  npm install cors
  npm run dev

## Error en el frontend: La vista no carga
* **Ocurre:** cuando Vite no logra resolver las rutas de la aplicación porque la librería de enrutamiento no está presente en el proyecto cliente.

* **Solución:** Corre los siguientes comandos dentro de la carpeta frontend:
  ```bash
  cd frontend
  npm install react-router-dom
  npm run dev

### Libreria instalada para el formularioPublicacion 
* **Descripción:** Es la librería principal encargada del manejo, captura y validación eficiente de formularios en React.
  ```bash
  cd frontend
  npm install react-hook-form

## Utilidad en HomeScope

* **Manejo de formularios por pasos:** Preserva el estado de la información ingresada en cada una de las 4 etapas del flujo de publicación de inmuebles.
* **Validación de campos:** Verifica en tiempo real que los campos obligatorios (como precios, títulos y direcciones) se cumplan antes de permitir avanzar de paso.
* **Renderizado condicional:** Oculta y muestra campos dinámicamente (por ejemplo, remueve habitaciones, baños y parqueos si el usuario selecciona que la propiedad es un *Terreno / Lote*).
* **Gestión de borradores:** Extrae mediante `getValues()` la totalidad de los datos para ser guardados como borrador en el almacenamiento local (`localStorage`).

---

## 📁 Arquitectura y Descripción Detallada de Archivos

### 📄 `src/api/propertyApi.js`
* **Ubicación:** `src/api/propertyApi.js`
* **¿Qué hace?:** Define los métodos asíncronos que conectan el frontend con la API REST del backend para crear, enviar y gestionar propiedades, adjuntando el token de autenticación del usuario.
* **¿Por qué está en esta carpeta?:** Sigue el principio de **separación de responsabilidades** (*API Layer*). Aislar las peticiones HTTP en una carpeta dedicada evita mezclar la lógica de red con los componentes visuales en JSX, permitiendo reutilizar las consultas en cualquier pantalla de la aplicación.

---

### 📄 `src/data/guatemalaData.js`
* **Ubicación:** `src/data/guatemalaData.js`
* **¿Qué hace?:** Almacena un objeto JavaScript con la estructura geográfica oficial de Guatemala, organizando los 22 departamentos con sus respectivos municipios asignados.
* **¿Por qué está en esta carpeta?:** Actúa como una fuente de datos estática e inmutable. Mantenerla en la carpeta `data/` desacopla los datos estáticos de la interfaz gráfica, permitiendo alimentar de forma limpia los selectores desplegables en cascada y facilitando su reutilización en futuros componentes de búsqueda y filtrado.

---

### 📄 `src/components/FormularioPublicacion.jsx`
* **Ubicación:** `src/components/FormularioPublicacion.jsx`
* **¿Qué hace?:** Es el componente de interfaz que renderiza la vista completa para crear y publicar un inmueble en la plataforma. Guía al usuario a través de 4 pasos interactivos:
  1. **Paso 1 (Datos Generales):** Captura de título, modalidad de negocio, tipo de inmueble, precio, moneda y características físicas.
  2. **Paso 2 (Fotografías):** Carga y vista previa de las imágenes de la propiedad.
  3. **Paso 3 (Ubicación):** Captura de la dirección exacta, zona, y selectores dinámicos de departamento y municipio de Guatemala.
  4. **Paso 4 (Confirmación):** Resumen previo a la publicación definitiva en el sistema.
* **¿Por qué está en esta carpeta?:** Corresponde a un componente reutilizable de la interfaz de usuario (*UI Component*) dentro de la estructura modular de la aplicación.

---

## Descripcion de los tipos de Modalidades de Propiedad en HomeScope

El sistema incluye las modalidades clave del mercado de bienes raíces adaptadas a Guatemala:

* **Venta:** Transferencia total del dominio y titularidad del inmueble del propietario al comprador mediante pago único o crédito hipotecario.
* **Alquiler:** Cesión del uso del inmueble a un inquilino a cambio de un pago periódico mensual.
* **Alquiler con opción a compra:** Contrato donde el inquilino alquila la propiedad por un periodo pactado con el derecho prioritario de comprarla, abonando en muchos casos parte de las rentas al precio final.
* **Cesión de derechos:** Transferencia a un tercero de los derechos sobre un contrato de preventa/planos o un terreno en proceso de titulación o loteamiento.
* **Subarriendo:** Modalidad en la que un arrendatario original alquila parte o la totalidad del inmueble a un tercero, contando con la autorización del propietario.

##  Instrucciones para Ejecutar y Probar la Vista del Formulario

Sigue estos pasos para poner en marcha el proyecto en tu entorno local y probar el flujo completo de publicación:

### 1. Iniciar los Servidores de Desarrollo

Debes abrir **dos terminales independientes** en tu editor de código o consola de comandos:

* **Terminal 1 (Backend):**  
  Navega hacia el directorio del servidor y ejecuta el script de inicio:
  ```bash
  cd backend
  npm run dev

* **Terminal 2 (Frontend):**  
  Navega hacia el directorio del cliente y ejecuta la aplicación de React:
  ```bash
  cd frontend
  npm run dev
### 2. Acceso a la Vista de Publicación

Una vez que ambos servidores estén ejecutándose correctamente:

1. Abre tu navegador web.
2. Ingresa a la siguiente URL:  
    `http://localhost:5173/publicar`

---

### 3. Prueba del Formulario de Publicación

Al ingresar a la vista, podrás probar las siguientes funcionalidades e interactuar con el flujo por pasos:

* **Paso 1 (Datos Generales):** Completa el título, selecciona la modalidad del inmueble, el precio y el tipo de propiedad. Si seleccionas **Terreno / Lote**, observa cómo se ocultan automáticamente los campos de habitaciones, baños y parqueos.
* **Paso 2 (Fotografías):** Adjunta imágenes para visualizar la vista previa interactiva y probar la opción de eliminar archivos.
* **Paso 3 (Ubicación):** Selecciona cualquier departamento de Guatemala (por ejemplo, *Jalapa*) y verifica cómo el selector de municipios se actualiza en cascada con los municipios correspondientes.
* **Paso 4 (Confirmación):** Revisa el resumen generado con todos los datos consolidados y procede a la prueba de guardado o envío.