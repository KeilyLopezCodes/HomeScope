# HomeScope — Implementación del Índice de Conveniencia (T17)

| Campo | Valor |
|---|---|
| Tarea | T17 (HOM-40) — Cálculo del Índice de Conveniencia y sub-puntajes por categoría |
| Responsable | Backend Developer 2 |
| Algoritmo | v1.0 — ver `HomeScope_Algoritmo_Indice.md` (T11) |
| Arquitectura | Ver documento desarrollado por Keily de arquitectura §3 (RNF-01, RNF-10, RNF-13), §10.1 y ADR-08 |
| Módulo | Geo e índice |

---

## 1. Qué hace

Cuando un vendedor **publica una propiedad**, el sistema calcula un puntaje de **0 a 100** y un **semáforo** que resumen qué tan bien servida está la zona. Guarda el puntaje, el desglose por categoría y los lugares usados. Si la ubicación de una propiedad publicada cambia, el índice se recalcula.

Requisito de la tarea: *"El índice y sus sub-puntajes se calculan y guardan al publicar. Editar la ubicación dispara un recálculo automático."*

---

## 2. Cómo se calcula (resumen del algoritmo v1.0)

Se evalúan 6 categorías, cada una con un peso:

| id | Categoría | Peso | Cantidad objetivo (N_c) |
|---|---|---|---|
| 1 | educación | 0.20 | 3 |
| 2 | salud | 0.20 | 2 |
| 3 | comercio | 0.20 | 5 |
| 4 | transporte | 0.15 | 3 |
| 5 | áreas verdes | 0.15 | 2 |
| 6 | seguridad | 0.10 | 1 |

**Parámetros:** radio de análisis R = 2000 m, distancia óptima D0 = 500 m, α = 0.60 (cercanía), β = 0.40 (densidad).

**Sub-puntaje de cada categoría (0 a 100):**

```
Cercanía  P = 1                          si d_min ≤ 500 m
              (2000 − d_min) / 1500      si 500 m < d_min ≤ 2000 m
              0                          si no hay lugares
Densidad  D = min(1, n / N_c)
Sub-puntaje S = 100 × (0.6 · P + 0.4 · D)        (2 decimales)
```

`d_min` es la distancia al lugar más cercano de la categoría y `n` la cantidad de lugares dentro de 2000 m.

**Puntaje total:** `I = Σ(peso · S) / Σ(pesos activos)`, redondeado a 2 decimales. Una categoría sin lugares aporta 0 y no se excluye.

**Semáforo (sobre el valor ya redondeado):**

| Nivel | Condición |
|---|---|
| verde | ≥ 70.00 |
| amarillo | ≥ 40.00 y < 70.00 |
| rojo | < 40.00 |

**Reglas de datos:**
- Distancia en línea recta (Haversine), sin usar la API de rutas.
- Solo cuentan los lugares a 2000 m o menos.
- Un mismo `google_place_id` cuenta una sola vez por categoría.
- `tiempo_estimado_min = ceil(distancia_m / 80)` (caminata a 4.8 km/h). Es informativo y no entra en la fórmula.

**Ejemplo (salud):** lugar más cercano a 900 m y 1 lugar de 2 ideales → P = 0.7333, D = 0.5 → S = 100 × (0.6 × 0.7333 + 0.4 × 0.5) = **64.00**.

---

## 3. Flujo completo

### 3.1 Dos momentos distintos

| Momento | Qué ocurre | ¿Consulta Google? |
|---|---|---|
| **Calcular** (al publicar o al cambiar la ubicación) | Pide a Google los lugares cercanos por categoría, calcula y guarda en la BD | Sí, una consulta por tipo de Google (unas 17 en total) |
| **Consultar** (`GET .../indice`) | Lee el índice ya guardado | No |

Esto cumple ADR-08 y RNF-01: la ficha de la propiedad carga rápido y no se paga una consulta a Google por cada visita.

### 3.2 De punta a punta

```
1. El vendedor crea la propiedad            → nace en estado "borrador" (sin índice)
2. El vendedor la publica                   → PUT de actualización con { "estado": "publicado" }
3. property.service detecta que pasó a      → geoIndiceService.encolarCalculo(id)
   "publicado" y lanza el cálculo             (sin await: publicar responde de inmediato)
4. En segundo plano, geo-indice.service:
     a. lee latitud/longitud y las categorías activas
     b. por cada tipo de Google: Nearby Search ordenado por distancia
     c. calcula distancias (Haversine) y descarta lo que esté a más de 2000 m
     d. calcularIndice(...) → puntaje, semáforo y sub-puntajes
     e. guarda todo en una sola transacción (ver §6)
5. La ficha pide GET /propiedades/:id/indice
     - mientras se calcula  → { "estado": "en_calculo" }
     - cuando termina       → el índice completo
6. Si el vendedor cambia latitud/longitud   → PUT con las nuevas coordenadas
   de una propiedad ya publicada              → se repite desde el paso 3; el índice anterior
                                                queda como no vigente (historial) y el nuevo es el vigente
```

Si Google falla, **no se guarda nada** (no se registra un índice falso en 0) y el cálculo se reintenta hasta 3 veces con espera creciente (2 s, 4 s). Si el error es de datos (propiedad inexistente o sin coordenadas), no se reintenta.

### 3.3 Por qué el cálculo se engancha en el `PUT`

No se creó un endpoint nuevo para "publicar" ni para "calcular". En el backend ya existe una ruta `PUT` para actualizar propiedades (`property.controller.update` → `propertyService.updateProperty`), y **publicar una propiedad y cambiar su ubicación son actualizaciones**: el primero cambia el campo `estado` y el segundo cambia `latitud`/`longitud`. Por eso el enganche está dentro de ese servicio, y el frontend no necesita llamar a nada extra: al guardar la propiedad, el índice se calcula solo.

Cuerpos de ejemplo para esa ruta (la URL exacta está en `src/routes/property.routes.js`; aquí se escribe como `<RUTA_PROPIEDADES>/:id`):

| Para… | `PUT <RUTA_PROPIEDADES>/:id` con body `raw` → JSON |
|---|---|
| Publicar | `{ "estado": "publicado" }` |
| Cambiar la ubicación (propiedad ya publicada) | `{ "latitud": 14.6350, "longitud": -89.9890 }` |

`updatePropertyStatus` también tiene el enganche, aunque hoy el controlador no expone esa función.

---

## 4. Archivos de esta tarea

Organizados según la estructura por capas del proyecto:

| Archivo | Responsabilidad |
|---|---|
| `src/config/indice.config.js` | Constantes versionadas: versión, radio, D0, α, β, N_c, umbrales. También `MAX_PUNTOS_POR_CATEGORIA_RESPUESTA` (solo presentación) |
| `src/services/indice.calculator.js` | `calcularIndice(categorias, puntos)`: función pura, sin Express, Prisma ni SDK externos |
| `src/services/haversine.js` | Distancia en metros entre dos coordenadas |
| `src/services/geo-indice.service.js` | Caso de uso: orquesta Google, cálculo y guardado. Expone `calcularYGuardar`, `encolarCalculo` y `obtenerVigente` |
| `src/services/placesService.js` | Se agregó `buscarLugaresCercanos` (Nearby Search por tipo, sin tocar la BD y sin ocultar errores). La función existente no se modificó |
| `src/interfaces/IGeoIndice.repository.js` | Contrato del repositorio, igual que las demás interfaces |
| `src/repositories/geo-indice.repository.js` | Acceso a datos con Prisma; única capa que conoce las tablas |
| `src/controllers/geo-indice.controller.js` | Traduce HTTP a casos de uso |
| `src/routes/geo-indice.routes.js` | Declara los endpoints |
| `src/services/property.service.js` | Se agregó la llamada a `encolarCalculo` (ver §7) |
| `src/app.js` | Montaje de las rutas bajo `/api/v1` |
| `scripts/seed-categorias.sql` | Carga las 6 categorías con ids 1 a 6 y sus pesos |
| `scripts/seed-propiedades-prueba.sql` | Propiedades de prueba (ver §10) |
| `scripts/seed-propiedad-jalapa-centro.sql` | Propiedad de prueba cerca del Parque Central de Jalapa |
| `test/indice.calculator.test.js` | Casos de prueba de la fórmula (§8 del documento del algoritmo) |
| `test/geo-indice.service.test.js` | Pruebas del servicio con dobles de BD y de Google |

---

## 5. Cómo se guarda un recálculo

Los índices no se sobrescriben: cada cálculo crea un registro nuevo y el anterior pasa a `es_vigente = false`, de modo que el historial se conserva.

---

## 6. Datos que se guardan (una sola transacción)

| Tabla | Qué se escribe |
|---|---|
| `punto_interes` | Se reemplazan los lugares de la propiedad (sin repetir categoría + `google_place_id`) |
| `indice_conveniencia` | El índice anterior pasa a `es_vigente = false` y se inserta uno nuevo vigente, con `puntaje_total`, `nivel_semaforo`, `radio_m` y `version_algoritmo` |
| `sub_puntaje_categoria` | Un registro por categoría: `puntaje`, `cantidad_puntos`, `distancia_minima_m` |

Las llamadas a Google se hacen **antes** de abrir la transacción, así que esta solo toca la base de datos.

---

## 7. Cuándo se dispara el cálculo

La llamada está en `property.service.js` y se ejecuta sin `await`:

| Situación | ¿Calcula? |
|---|---|
| Se publica con `updatePropertyStatus` (de otro estado a `publicado`) | Sí |
| Se publica con `updateProperty` enviando `estado: 'publicado'` | Sí |
| Propiedad **ya publicada** cambia `latitud` o `longitud` | Sí |
| Propiedad publicada cambia solo precio, título u otros campos | No |
| Propiedad publicada recibe las mismas coordenadas que ya tenía | No |
| Propiedad en `borrador` cambia la ubicación | No (se calcula al publicar) |
| Se crea una propiedad (siempre nace en `borrador`) | No |

Una propiedad con coordenadas `0,0` (valor por defecto de `createProperty` cuando no se envían) **no se calcula**: el servicio devuelve el error `SIN_COORDENADAS`.

Las propiedades que ya estaban publicadas antes de esta tarea no tienen índice hasta que se les cambie la ubicación o se ejecute el recálculo masivo (fuera del alcance de T17).

---

## 8. Endpoints

Prefijo: `/api/v1`.

### `GET /propiedades/:id/indice`

Devuelve el índice vigente, leído de la base de datos. **Solo recibe el id en la URL**: las coordenadas y todo lo demás salen de la BD. Es público (no requiere sesión), porque en la arquitectura hasta el visitante puede ver el índice.

- `200` con `{ "estado": "en_calculo" }` si aún no hay índice.
- `200` con el índice completo cuando existe (ejemplo ilustrativo):

```json
{
  "puntajeTotal": 63.2,
  "nivelSemaforo": "amarillo",
  "radioM": 2000,
  "versionAlgoritmo": "v1.0",
  "fechaCalculo": "2026-10-13T16:00:00.000Z",
  "subPuntajes": [
    { "categoriaId": 2, "categoria": "salud", "icono": "heart-pulse", "peso": 0.2,
      "puntaje": 64, "cantidadPuntos": 1, "distanciaMinimaM": 900 }
  ],
  "puntosInteres": [
    { "categoriaId": 2, "googlePlaceId": "...", "nombre": "...", "latitud": 14.63,
      "longitud": -89.98, "distanciaM": 900, "tiempoEstimadoMin": 12 }
  ]
}
```

- `400 ID_INVALIDO` si el id no es un entero positivo.

**Tamaño de la respuesta.** Un cálculo guarda muchos lugares por propiedad (en pruebas, más de 150), pero `puntosInteres` devuelve **solo los 5 más cercanos de cada categoría**, ordenados por distancia, que bastan para dibujar la ficha y mantienen la respuesta pequeña (RNF-01). `subPuntajes[].cantidadPuntos` sigue mostrando el total real encontrado. El límite es `MAX_PUNTOS_POR_CATEGORIA_RESPUESTA` en `indice.config.js`; solo afecta a la respuesta, no al puntaje ni a la BD.

### `POST /propiedades/:id/indice/recalcular` — de apoyo para pruebas

Fuerza el cálculo de una propiedad **sin pasar por el flujo de publicación**, y devuelve el resultado en la misma respuesta (espera a que termine, unos segundos).

**Para qué se deja.** Para que el resto del equipo pueda probar el cálculo (Google, fórmula, guardado) sin tener que armar antes sesión de vendedor, publicar una propiedad completa y esperar el proceso en segundo plano. Es una herramienta de desarrollo, no parte del producto.

**Cuándo se retira.** Cuando el flujo de publicación del frontend esté en uso, o al pasar a producción. Para retirarlo, se borra la función `recalcular` de `geo-indice.controller.js` y el bloque `if` que la registra en `geo-indice.routes.js`.

**Cuidados:**
- No tiene autenticación y **cada llamada consume cuota de Google** (unas 17 consultas): usarlo con moderación.
- Solo se registra cuando `NODE_ENV` **no** es `production`. Hay que asegurarse de que en producción esa variable valga `production`; si no, el endpoint quedaría abierto.

| Respuesta | Causa |
|---|---|
| `200` con el índice | Cálculo guardado |
| `404 PROPIEDAD_NO_ENCONTRADA` | No existe una propiedad con ese id |
| `422 SIN_COORDENADAS` | Latitud y longitud en 0 |
| `400 ID_INVALIDO` | Id inválido |
| `502 LUGARES_FORMATO_INVALIDO` | Google devolvió lugares con un formato que no se reconoce |
| `500` | Fallo de Google u otro error (ver logs) |

---

## 9. Configuración necesaria

1. **Categorías en la BD.** Ejecutar `scripts/seed-categorias.sql` (se puede repetir sin duplicar). Los ids deben ser 1 a 6, porque `indice.config.js` asocia la cantidad objetivo a cada id. Los pesos activos deben sumar 1.00.
2. **Variable de entorno** `GOOGLE_MAPS_API_KEY` en `backend/.env`, con la **Places API** habilitada en Google Cloud. Si cambias el `.env`, recrea el contenedor (`docker compose up -d --force-recreate backend`).
3. **Rutas montadas** en `app.js`:
   ```js
   app.use('/api/v1', require('./routes/geo-indice.routes'));
   ```
4. **Node 18 o superior** (se usa `fetch` nativo).
5. Tras copiar código nuevo al contenedor, reiniciarlo (`docker restart backendApp`): Node no recarga solo los archivos ya cargados.

---

## 10. Datos de prueba

Para probar sin crear propiedades a mano hay tres scripts en `scripts/`:

| Script | Qué crea |
|---|---|
| `seed-categorias.sql` | Las 6 categorías con sus pesos (obligatorio) |
| `seed-propiedades-prueba.sql` | Tipos de propiedad y un vendedor de prueba (solo si no existen), y 4 propiedades `[PRUEBA T17]`: centro de Jalapa, zona 10 de la capital, zona rural y una sin coordenadas |
| `seed-propiedad-jalapa-centro.sql` | Una propiedad cerca del Parque Central de Jalapa |

Todas nacen en `borrador` y se pueden ejecutar varias veces sin duplicar. Para ejecutar un script (reemplazar `<usuario>` y `<base>` por los valores de `backend/.env`):

```bash
docker cp scripts/seed-propiedades-prueba.sql postgresDB:/tmp/seed.sql
docker exec postgresDB psql -U <usuario> -d <base> -f /tmp/seed.sql
```

Al final imprimen los ids de las propiedades creadas. Se usa `docker cp` y `-f` (en vez de redirigir el archivo) para que las tildes no se dañen en Windows. Cada script trae al final, comentada, la limpieza de sus datos.

---

## 11. Pruebas

### Automáticas (Jest)

```bash
npx jest
```

20 pruebas:

- `indice.calculator.test.js`: los 9 casos del documento del algoritmo (100 puntos, sin lugares, límite de 40, punto a 2001 m, `google_place_id` repetido, ejemplo de 63.20, categoría inactiva, exactamente 70.00 y determinismo), más el cálculo del tiempo estimado.
- `geo-indice.service.test.js`: guarda con lugares dentro del radio, descarta lugares a más de 2 km, no guarda si Google falla, acepta el id como texto, rechaza coordenadas 0,0, acepta el formato crudo de Google, falla con un formato irreconocible, y limita la respuesta del `GET` a 5 lugares por categoría conservando el total real.

### Manuales con Postman

Reemplazar `{id}` por el id de una propiedad con coordenadas reales (ver §10). En Postman se escribe solo la URL (el método va en el selector).

**A. Probar el cálculo directamente (con el `POST` de apoyo)**

| # | Petición | Resultado esperado |
|---|---|---|
| 1 | `GET http://localhost:3000/api/v1/propiedades/{id}/indice` | `200` con `{"estado":"en_calculo"}` |
| 2 | `POST http://localhost:3000/api/v1/propiedades/{id}/indice/recalcular` | `200` con puntaje, semáforo y sub-puntajes |
| 3 | `GET` del paso 1 | `200` con el índice completo y máximo 5 lugares por categoría |
| 4 | `POST` del paso 2 otra vez | En BD, una fila `es_vigente = true` y la anterior en `false` |
| 5 | `POST` con un id inexistente | `404 PROPIEDAD_NO_ENCONTRADA` |
| 6 | `POST` sobre la propiedad sin coordenadas | `422 SIN_COORDENADAS` |
| 7 | `GET .../propiedades/abc/indice` | `400 ID_INVALIDO` |

Para comprobar que el cálculo es correcto, aplicar la fórmula de la sección 2 a una categoría de la respuesta y comparar con su `puntaje`.

**B. Probar el flujo real (publicar → índice automático)**

1. Tomar una propiedad en `borrador` con coordenadas reales.
2. `PUT <RUTA_PROPIEDADES>/{id}` con body `raw` → JSON: `{ "estado": "publicado" }`.
3. Esperar unos 10 segundos y hacer `GET .../propiedades/{id}/indice`: debe devolver el índice **sin haber llamado al `POST`**.
4. Cambiar la ubicación con `PUT` y `{ "latitud": 14.6350, "longitud": -89.9890 }`, esperar y repetir el `GET`: la `fechaCalculo` debe ser nueva.

Si el cálculo en segundo plano falla, el motivo aparece en los logs del backend con el prefijo `[geo-indice]` (`docker logs backendApp --tail 30`).

**Verificar lo guardado en la BD**

```sql
SELECT id, puntaje_total, nivel_semaforo, es_vigente, fecha_calculo
FROM indice_conveniencia WHERE propiedad_id = {id} ORDER BY id;

SELECT categoria_id, count(*) AS lugares, min(distancia_m) AS mas_cercano
FROM punto_interes WHERE propiedad_id = {id} GROUP BY categoria_id ORDER BY categoria_id;
```

---

## 12. Problemas comunes

| Síntoma | Causa probable |
|---|---|
| `404 PROPIEDAD_NO_ENCONTRADA` | El id no existe en la tabla `propiedad` |
| `422 SIN_COORDENADAS` | La propiedad tiene latitud y longitud en 0 |
| `500` con `REQUEST_DENIED` | Key inválida o Places API sin habilitar |
| `500` con `GOOGLE_MAPS_API_KEY no configurada` | Falta la variable en `.env`, o el contenedor no se recreó |
| `502 LUGARES_FORMATO_INVALIDO` | Google devolvió lugares con un formato que no se reconoce |
| `puntajeTotal: 0` y `subPuntajes: []` | La tabla `categoria_interes` está vacía: falta el seed |
| Categorías en 0 aunque haya lugares cerca | El contenedor corre código viejo: copiar los archivos y `docker restart backendApp` |
| El `GET` sigue en `en_calculo` tras publicar | El cálculo en segundo plano falló: revisar los logs (`[geo-indice]`) |
| `404` al llamar al `POST` en producción | Es lo esperado: el endpoint de apoyo no se registra con `NODE_ENV=production` |

---

## 13. Decisiones y limitaciones conocidas

- **Cola de trabajos provisional.** `encolarCalculo` usa `setImmediate` con 3 reintentos. Si el servidor se reinicia a mitad del cálculo, el trabajo se pierde. Cuando el equipo adopte `pg-boss` (ADR-05), solo cambia esa función, sin tocar la lógica.
- **Búsqueda en Google.** Se usa Nearby Search con `rankby=distance` y **una consulta por tipo** de Google (por ejemplo, educación hace 4: `school`, `primary_school`, `secondary_school` y `university`), uniendo los resultados por `place_id`. Un cálculo completo hace unas 17 consultas, y cada una devuelve hasta 20 lugares, los más cercanos primero. Se descartó Text Search con los tipos unidos por `OR` porque buscaba texto libre: en una prueba real devolvió 0 lugares de educación, salud y transporte, cuando Nearby Search con `type=school` devolvió 20 escuelas. El servicio descarta después lo que quede a más de 2000 m. **Costo:** esto consume más cuota de Google que una consulta por categoría; revisar los precios vigentes y fijar una alerta de presupuesto en Google Cloud.
- **Calidad de los datos de Google.** El algoritmo confía en la clasificación de Google. En pruebas aparecieron lugares mal etiquetados (por ejemplo, una barbería o una armería dentro de comercio, o un spa dentro de salud). Con cantidades objetivo pequeñas el efecto es limitado, pero el "lugar más cercano" de una categoría puede no ser del tipo esperado. Además, transporte tiene pocos lugares mapeados en Jalapa (en una prueba, uno solo), lo que baja el puntaje de esa categoría.
- **Lugares guardados por propiedad.** Se guardan todos los encontrados dentro de 2000 m (más de 150 en zonas urbanas). La respuesta del `GET` se limita a 5 por categoría, pero la BD conserva todos. Si el almacenamiento de la BD gratuita preocupa (RNF-02), se puede limitar también lo que se guarda, sin cambiar la fórmula.
- **Puntos de interés como foto del momento.** Los lugares guardados reflejan el momento del cálculo. Un negocio nuevo no aparece hasta que se recalcula, es decir, al cambiar la ubicación o los pesos.
- **Parámetros como constantes en código**, no en la BD (decisión del documento del algoritmo, pendiente de validación del grupo). Ajustar N_c, D0 o el radio implica nueva versión y recálculo masivo. En zonas rurales, 2000 m puede dejar categorías enteras en 0; un radio por categoría sería una mejora para una v1.1.
- **Recálculo masivo** (`recalcular-indices-masivo`, §9 del documento del algoritmo): no forma parte de esta tarea.

---

## 14. Pendiente antes del PR

- [ ] Probar el flujo real (§11-B): publicar una propiedad y verificar el índice sin llamar al `POST`, y completar `<RUTA_PROPIEDADES>` en este README con la ruta real de `property.routes.js`.
- [ ] Confirmar que `NODE_ENV` vale `production` en el entorno desplegado (para que el `POST` de apoyo no se registre).
- [ ] Verificar que `docker-compose.yml` y `package-lock.json` no se incluyan si solo se modificaron en local.
- [ ] Confirmar con el grupo la aprobación de los parámetros del algoritmo (sección 10 del documento T11).
- [ ] Cuando el flujo de publicación esté en uso, retirar el `POST` de apoyo (ver §8).