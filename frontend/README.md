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

