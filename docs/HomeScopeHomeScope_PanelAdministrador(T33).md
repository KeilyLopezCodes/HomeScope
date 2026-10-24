# HomeScope — Backend del Panel de Administrador (T33)

| Campo | Valor |
|---|---|
| Tarea | T33 (HOM-49) — Backend de Panel de Administrador |
| Responsable | Backend Developer 1 |
| Módulo | Moderación y administración |
| Arquitectura | Ver documento de arquitectura §6.1 (módulo "Moderación y administración") y §12 (seguridad) |
| Estado | Implementado y probado con pruebas automáticas; falta la verificación manual (§10) |

---

## 1. Qué hace

Como administrador de la plataforma, el panel backend permite:

- Ver y gestionar los **reportes** que hacen los usuarios.
- **Moderar publicaciones**: pausarlas, volver a aprobarlas o eliminarlas.
- **Suspender o reactivar usuarios**.
- Consultar la **auditoría**: quién hizo cada acción, cuándo y por qué.

## Guía de Pruebas: Módulo de Reportes y Administración

Para probar correctamente el flujo completo del sistema de reportes en **HomeScope**, es necesario utilizar **dos cuentas con roles diferentes**. Esto te permitirá verificar tanto el envío de reportes desde la perspectiva de un usuario común como la gestión y visualización desde el panel de administración.

### Requisitos previos

* Tener la base de datos levantada y los contenedores de Docker activos.
* Tener registradas al menos dos cuentas de usuario en el sistema:
1. **Usuario normal** (ej. comprador o vendedor).
2. **Usuario administrador** (con el rol `administrador` asignado en la base de datos).



---

### Pasos para realizar la prueba

#### 1. Como Usuario Normal (Reportar una publicación)

1. Inicia sesión en tu aplicación o autentícate en **Swagger** con las credenciales de tu cuenta de usuario normal para obtener su token `Bearer`.
2. Dirígete al endpoint correspondiente para reportar una propiedad (por ejemplo, `POST /api/properties/{id}/reportes`).


3. Envía el reporte especificando el ID de una propiedad existente y el motivo (ej. `"fraude"`). Verás una respuesta exitosa (`201 Created`).



#### 2. Como Administrador (Revisar el panel)

1. Cierra sesión o cambia el token en **Swagger** por el de tu cuenta **administrador** (asegúrate de que tenga permisos en la tabla `usuario_rol`).
2. Dirígete a las rutas del panel de administración (ej. `GET /api/admin/reportes`).


3. Ejecuta la consulta para comprobar que el panel de administración te devuelve la lista de los reportes pendientes registrados por los usuarios sin ningún tipo de restricción de acceso.

---

¿Te gustaría agregar algún detalle extra a este README o prefieres que lo guardemos directamente en algún archivo del proyecto?

### Criterios de aceptación y cómo se cumplen

1. **Las rutas verifican explícitamente el rol desde el middleware JWT.** `admin.routes.js` aplica `router.use(authenticateToken, verificarAdministrador)` al inicio: primero el JWT y luego la verificación del rol. Como está a nivel de router, una ruta nueva no puede olvidarlo.
2. **Endpoints GET, PATCH y DELETE.** Son 8 endpoints (§5): 4 `GET`, 3 `PATCH` y 1 `DELETE`.
3. **Solo accesible por rol administrador.** Cualquier otro usuario recibe `403`, y sin token recibe `401`.
4. **Auditoría con timestamp y administrador responsable.** Cada acción escribe una fila en la tabla `accion_moderacion`, que ya existía (administrador, acción, motivo y `fecha_accion`). No se crearon tablas nuevas.

---

## 2. Seguridad y roles

El middleware `verificarAdministrador` (`src/middlewares/admin.middleware.js`) **consulta la base de datos en cada petición**: el usuario debe estar `activo` y tener el rol `administrador` en `usuario_rol`. No confía solo en lo que diga el JWT, por lo que:

- Si a un administrador le quitan el rol o lo suspenden, **pierde el acceso de inmediato**, sin esperar a que venza su token.
- Si la base de datos falla, el error pasa al manejador de errores y **no se concede acceso**.
- Asignar el rol por SQL no obliga a volver a iniciar sesión.

Respuestas de seguridad:

- Sin token: `401` (lo responde `authenticateToken`).
- Token inválido o vencido: `403` (lo responde `authenticateToken`).
- Usuario autenticado sin rol de administrador: `403` con `"Acceso restringido a administradores"`.

---

## 3. Datos que se usan

No hay tablas ni migraciones nuevas.

- `reporte`: estados `pendiente`, `en_revision`, `resuelto` y `descartado`. Los dos primeros se consideran **abiertos**.
- `accion_moderacion`: la tabla de auditoría. Cada acción guarda `administrador_id`, `accion`, `motivo` (obligatorio, máximo 300), `fecha_accion` y, según el caso, `reporte_id`, `propiedad_id` y `usuario_id`.
- `propiedad.estado`: `publicado`, `pausado` y `no_disponible`. Solo las `publicado` aparecen en el listado público.
- `usuario.estado`: `activo` y `suspendido`.
- `usuario_rol` y `rol`: para verificar el rol `administrador`.

Valores del campo `accion` en la auditoría:

- `revisar`, `resolver`, `descartar`: cambios de estado de un reporte.
- `pausar`, `aprobar`, `eliminar`: sobre publicaciones.
- `suspender`, `reactivar`: sobre usuarios.

---

## 4. Flujo de moderación

```
Un usuario reporta una publicación               POST /properties/{id}/reportes  (ya existente)
        │
        ▼
El administrador lista los reportes              GET   /admin/reportes?estado=pendiente
y abre el detalle                                GET   /admin/reportes/{id}
        │
        ▼
Decide, indicando siempre un motivo:
  ├─ pausar la publicación (y cerrar el reporte)       PATCH  /admin/propiedades/{id}/estado   (reporte_id)
  ├─ eliminar la publicación (y cerrar el reporte)     DELETE /admin/propiedades/{id}          (reporte_id)
  ├─ suspender al dueño (y cerrar el reporte)          PATCH  /admin/usuarios/{id}/estado      (reporte_id)
  └─ descartar o marcar en revisión                    PATCH  /admin/reportes/{id}
        │
        ▼
En UNA transacción: cambia el estado + cierra el reporte + escribe la fila de auditoría
        │
        ▼
Consulta de auditoría                            GET   /admin/acciones
```

Con `reporte_id`, el reporte queda `resuelto` en la misma transacción. Si algo falla, no se guarda nada.

---

## 5. Endpoints

Prefijo: `/api/admin`. Todos exigen `Authorization: Bearer <token>` de un administrador. Las respuestas usan el formato del proyecto: `{ "success", "message", "data" }` y, en errores, `{ "success": false, "message" }`.

### `GET /admin/reportes`

Lista paginada, de la más reciente a la más antigua. Filtros opcionales: `estado`, `tipo` (`propiedad`, `usuario` o `comentario`), `page` y `limit` (por defecto 20, máximo 50).

```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "tipo_objetivo": "propiedad",
      "motivo": "fraude",
      "descripcion": "El vendedor pide un depósito antes de mostrar la casa.",
      "estado": "pendiente",
      "fecha_creacion": "2026-10-20T20:00:00.000Z",
      "reportante": { "id": 3, "nombre": "Ana", "apellido": "López" },
      "propiedad": { "id": 5, "titulo": "Casa cerca de Estadio Las Flores", "estado": "publicado", "vendedor_id": 20 },
      "usuario_reportado": null,
      "comentario": null
    }
  ],
  "pagination": { "totalItems": 1, "totalPages": 1, "currentPage": 1, "limit": 20 }
}
```

- `400`: `estado` o `tipo` inválido.

### `GET /admin/reportes/{id}`

Detalle del reporte con el historial de acciones de moderación aplicadas (`acciones`, de la más reciente a la más antigua).

- `404`: no existe. `400`: id inválido.

### `PATCH /admin/reportes/{id}`

Cambia el estado del reporte. Un reporte cerrado (`resuelto` o `descartado`) ya no se puede modificar.

```json
{ "estado": "en_revision", "motivo": "Se revisará con el vendedor" }
```

- Estados permitidos: `en_revision`, `resuelto`, `descartado`.
- `400`: estado inválido o motivo vacío. `404`: no existe. `409`: ya está cerrado o ya tiene ese estado.

### `PATCH /admin/propiedades/{id}/estado`

Pausa o vuelve a aprobar una publicación.

```json
{ "accion": "pausar", "motivo": "Las fotos no corresponden a la propiedad", "reporte_id": 12 }
```

- `pausar`: solo si la propiedad está `publicado` (pasa a `pausado`). Acepta `reporte_id` y lo resuelve.
- `aprobar`: solo si está `pausado` (vuelve a `publicado`). **No** acepta `reporte_id`.
- `reporte_id`, si se envía, debe ser de un reporte **abierto** y de esa propiedad.
- `400`: acción inválida, motivo vacío, o reporte que no corresponde. `404`: propiedad o reporte inexistente. `409`: estado incompatible o reporte cerrado.

Respuesta de ejemplo (todas las acciones de moderación responden igual):

```json
{
  "success": true,
  "message": "Acción de moderación aplicada y registrada",
  "data": {
    "accion": {
      "id": 1,
      "accion": "pausar",
      "motivo": "Las fotos no corresponden a la propiedad",
      "fecha_accion": "2026-10-20T21:30:00.000Z",
      "administrador": { "id": 1 },
      "reporte_id": 12,
      "propiedad_id": 5,
      "usuario_id": null
    },
    "nuevo_estado": "pausado"
  }
}
```

### `DELETE /admin/propiedades/{id}`

Elimina una publicación con **borrado lógico**: pasa a `no_disponible`, igual que cuando la elimina su dueño. Los datos y las fotos se conservan.

```json
{ "motivo": "Estafa comprobada", "reporte_id": 12 }
```

- El cuerpo con `motivo` es obligatorio (`reporte_id` es opcional).
- `409`: la propiedad ya estaba eliminada.
- **No hay endpoint para restaurarla**: `aprobar` solo funciona desde `pausado`.

### `GET /admin/usuarios`

Lista paginada de usuarios para encontrar a quién moderar. Filtros: `estado` (`activo`, `suspendido`, `inhabilitado`), `q` (busca en nombre, apellido y correo), `page` y `limit`. **Nunca devuelve `password_hash`**; incluye los roles de cada usuario.

### `PATCH /admin/usuarios/{id}/estado`

Suspende o reactiva a un usuario.

```json
{ "accion": "suspender", "motivo": "Fraude reiterado", "reporte_id": 12 }
```

- `suspender`: solo usuarios `activo`. Acepta `reporte_id`.
- `reactivar`: solo usuarios `suspendido`. No acepta `reporte_id`.
- El reporte puede ser sobre el usuario o sobre una propiedad de ese usuario.
- `403`: intento de moderar la propia cuenta o a otro administrador.
- `404`, `400` y `409` igual que en propiedades.

### `GET /admin/acciones`

Auditoría de moderación, de solo lectura, de la más reciente a la más antigua. Filtros: `administrador_id`, `accion`, `reporte_id`, `propiedad_id`, `usuario_id`, `page` y `limit`. Aquí cada acción sí incluye el nombre y apellido del administrador.

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "accion": "pausar",
      "motivo": "Las fotos no corresponden a la propiedad",
      "fecha_accion": "2026-10-20T21:30:00.000Z",
      "administrador": { "id": 1, "nombre": "Admin", "apellido": "Uno" },
      "reporte_id": 12,
      "propiedad_id": 5,
      "usuario_id": null
    }
  ],
  "pagination": { "totalItems": 1, "totalPages": 1, "currentPage": 1, "limit": 20 }
}
```

No existe ningún endpoint para modificar o borrar filas de auditoría.

---

## 6. Reglas de negocio

- **Todo cambio exige un motivo** (1 a 300 caracteres, sin contar espacios al inicio y al final). Es obligatorio también en la base de datos (`motivo NOT NULL`).
- **Transacción única.** El cambio de estado del objetivo, el cierre del reporte y la fila de auditoría se guardan juntos o no se guarda nada.
- **Control de concurrencia.** Cada cambio exige el estado anterior. Si otro administrador lo cambió mientras tanto, responde `409` en lugar de pisar el cambio.
- **No se puede moderar la propia cuenta ni a otro administrador**, para evitar que la plataforma se quede sin administradores.
- **Un reporte cerrado no se puede reabrir ni modificar.**

---

## 7. Archivos de esta tarea

Organizados según la estructura por capas del proyecto:

- `src/middlewares/admin.middleware.js`: verificación explícita del rol administrador.
- `src/routes/admin.routes.js`: los 8 endpoints y su documentación Swagger (grupo **Admin**).
- `src/controllers/admin.controller.js`: traduce HTTP a casos de uso y da formato a las respuestas.
- `src/services/admin.service.js`: reglas de negocio, sin Express ni Prisma.
- `src/interfaces/IAdmin.repository.js`: contrato del repositorio.
- `src/repositories/admin.repository.js`: acceso a datos con Prisma y la transacción de moderación.
- `test/admin.service.test.js` y `test/admin.middleware.test.js`: 21 pruebas automáticas.
- `scripts/seed-admin-t33.sql`: asigna el rol de administrador a un usuario y crea un reporte de prueba.

---

## 8. Configuración

1. **Montar las rutas** en `src/app.js`, junto a las demás:
   ```js
   app.use('/api/admin', require('./routes/admin.routes'));
   ```
2. **Un usuario con rol `administrador`.** Editar el correo en `scripts/seed-admin-t33.sql` y ejecutarlo:
   ```bash
   docker cp scripts/seed-admin-t33.sql postgresDB:/tmp/admin.sql
   docker exec postgresDB psql -U <usuario> -d <base> -f /tmp/admin.sql
   ```
   El reporte de prueba del script solo se crea si ya existe una propiedad `publicado`.
3. **Reiniciar** el contenedor después de copiar los archivos (`docker restart backendApp`).

---

## 9. Pruebas automáticas

```bash
npx jest
```

21 pruebas con repositorio simulado (no necesitan base de datos):

- Middleware: sin usuario o con id inválido (`401`), usuario no administrador (`403`), administrador (continúa) y fallo de la BD (no concede acceso).
- Propiedades: pausar, aprobar, eliminar, vínculo con reporte (de otra propiedad, cerrado, inexistente), estados incompatibles, motivo obligatorio y límite de 300.
- Usuarios: suspender y reactivar, no moderar la propia cuenta ni a otro administrador, vínculo con reportes del usuario o de su propiedad.
- Reportes y auditoría: cambios de estado y sus acciones, reporte cerrado, paginación, y que nunca se exponga `password_hash`.

---

## 10. Pruebas manuales (Swagger o Postman)

Con un administrador autenticado (botón **Authorize** en Swagger). Marcar al completar:

- [ ] Sin token: `GET /admin/reportes` responde `401`.
- [ ] Con el token de un usuario que no es administrador: `403`.
- [ ] Con el token del administrador: `200`.
- [ ] `GET /admin/reportes?estado=pendiente` y `GET /admin/reportes/{id}` muestran el reporte de prueba. Un `estado` inválido da `400`; un id inexistente, `404`.
- [ ] `PATCH /admin/reportes/{id}` con `en_revision`: `200`. Repetirlo da `409`, y sin `motivo` da `400`.
- [ ] `PATCH /admin/propiedades/{id}/estado` con `pausar` y `reporte_id`: la propiedad sale del listado público y el reporte queda `resuelto`.
- [ ] Repetir `pausar` da `409`. Con `aprobar` la propiedad vuelve a publicarse.
- [ ] `PATCH /admin/usuarios/{id}/estado` con `suspender`: `200`. Repetirlo da `409`. Con `reactivar` vuelve a `activo`.
- [ ] Suspender la propia cuenta o a otro administrador da `403`.
- [ ] `DELETE /admin/propiedades/{id}` con `motivo`: la propiedad pasa a `no_disponible`. Repetirlo da `409`.
- [ ] `GET /admin/acciones` muestra cada acción con administrador, motivo y fecha, y los filtros funcionan.
- [ ] En la base de datos, `SELECT * FROM accion_moderacion ORDER BY id DESC;` coincide con las acciones hechas.

---

## 11. Decisiones y limitaciones conocidas

- **Suspender no corta la sesión que ya está abierta.** El middleware `authenticateToken` actual solo verifica el JWT y no consulta el estado del usuario. Un usuario suspendido con un token vigente podría seguir usando la API hasta que expire. Los endpoints de administración sí lo bloquean (consultan la BD). La corrección es que `authenticateToken` rechace usuarios que no estén `activo`; afecta a todo el proyecto, por lo que conviene acordarla con el equipo. Conviene también comprobar que el login rechace a los usuarios suspendidos.
- **Suspender un usuario no pausa sus publicaciones.** Siguen visibles hasta que se pausen o eliminen por separado.
- **El borrado es lógico y no tiene vuelta atrás desde la API.** No hay endpoint de restauración; se haría por SQL.
- **Reportes de tipo `comentario`:** solo se pueden revisar, resolver o descartar. No hay una acción para ocultar el comentario (`comentario_zona.estado = 'oculto'`).
- **Una consulta a la BD por cada petición de administración** para verificar el rol. Es lo que garantiza la revocación inmediata.
- **Auditoría inmutable solo desde la API.** Una mejora posible es un `trigger` en la BD que impida `UPDATE` y `DELETE` en `accion_moderacion`, como el que ya existe para `historial_precio`.
- **`aprobar` no recalcula el Índice de Conveniencia**: la propiedad ya tenía uno de cuando se publicó.

---

## 12. Pendiente antes del PR

- [ ] Montar `admin.routes` en `app.js` y confirmar que `GET /api/admin/reportes` responde `401` sin token (no `404`).
- [ ] Completar las pruebas manuales del §10.
- [ ] Decidir con el equipo la corrección del punto de sesiones suspendidas (§11).
- [ ] Verificar que `docker-compose.yml` y `package-lock.json` no se incluyan si solo se modificaron en local.