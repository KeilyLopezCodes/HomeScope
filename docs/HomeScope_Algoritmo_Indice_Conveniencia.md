# HomeScope — Algoritmo del Índice de Conveniencia

| Campo | Valor |
| --- | --- |
| Versión del algoritmo | `v1.0` (se guarda en `indice_conveniencia.version_algoritmo`) |
| Tarea | T11 — Definir pesos y fórmula final |
| Implementa | Backend Developer 2 (T17), módulo `geo-indice` |
| Referencias | Arquitectura §3 (RNF-01, RNF-10, RNF-13), §9, §10.1, ADR-08; modelo ER (módulo "Índice y puntos de interés") |
| Estado | **Borrador para validación del grupo** (ver sección 10) |

> Toda colaboración sobre este documento se realiza mediante Git (rama + PR). No se comparte por correo ni otros medios.

---

## 1. Objetivo y principios

El Índice de Conveniencia resume en un número de 0 a 100 y un semáforo qué tan bien servida está una propiedad por su entorno. Principios que fija este documento:

1. **Mismo criterio para todas las propiedades (RNF-13):** los pesos viven en `categoria_interes.peso`; los parámetros de la fórmula son constantes versionadas con `version_algoritmo`. Nada se ajusta por propiedad.
2. **Explicable (RNF-10):** cada índice guarda su desglose en `sub_puntaje_categoria` y los puntos usados en `punto_interes`.
3. **Determinista y barato:** misma entrada, mismo resultado. Una sola consulta a Google Places por categoría (radio 2 km); el resto es cálculo local.
4. **Comparable en el tiempo:** si cambian pesos o parámetros, cambia la versión y se recalculan todas las propiedades.

---

## 2. Categorías, tipos de Google Places y pesos

Los pesos suman exactamente **1.00**. Caben en `NUMERIC(4,2)`.

| id | Categoría (`nombre`) | `google_place_types` | Peso |
| --- | --- | --- | --- |
| 1 | educación | `school`, `primary_school`, `secondary_school`, `university` | **0.20** |
| 2 | salud | `hospital`, `doctor`, `dentist`, `pharmacy` | **0.20** |
| 3 | comercio | `supermarket`, `convenience_store`, `shopping_mall`, `bank` | **0.20** |
| 4 | transporte | `bus_station`, `transit_station` | **0.15** |
| 5 | áreas verdes | `park` | **0.15** |
| 6 | seguridad | `police`, `fire_station` | **0.10** |
| | | **Suma** | **1.00** |

**Justificación de los pesos**

- **Educación, salud y comercio (0.20 c/u):** son las necesidades cotidianas de mayor impacto en la decisión de compra o alquiler de una vivienda.
- **Transporte y áreas verdes (0.15 c/u):** importantes pero más dependientes del perfil del comprador (quien tiene vehículo propio valora menos el transporte).
- **Seguridad (0.10):** Google Places solo ofrece estaciones de policía y bomberos, un indicador parcial de la seguridad real. Un peso menor evita que un dato incompleto distorsione el resultado.

---

## 3. Parámetros de la fórmula (constantes de `v1.0`)

Se definen en `src/modules/geo-indice/indice.config.js`, junto con `VERSION_ALGORITMO = 'v1.0'`.

| Parámetro | Símbolo | Valor | Significado |
| --- | --- | --- | --- |
| Radio de análisis | `R` | 2000 m | Radio de la consulta a Places. Se guarda en `indice_conveniencia.radio_m` |
| Distancia óptima | `D0` | 500 m | Hasta esta distancia la cercanía vale 100 % |
| Peso de cercanía | `α` | 0.60 | Importancia del punto más cercano dentro de la categoría |
| Peso de densidad | `β` | 0.40 | Importancia de la cantidad de opciones (`α + β = 1`) |
| Cantidad objetivo | `N_c` | ver tabla | Puntos necesarios para considerar la categoría "bien cubierta" |

| Categoría | `N_c` |
| --- | --- |
| educación | 3 |
| salud | 2 |
| comercio | 5 |
| transporte | 3 |
| áreas verdes | 2 |
| seguridad | 1 |

**Umbrales del semáforo (`nivel_semaforo`)**

| Nivel | Condición sobre `puntaje_total` |
| --- | --- |
| `verde` | ≥ 70.00 |
| `amarillo` | ≥ 40.00 y < 70.00 |
| `rojo` | < 40.00 |

---

## 4. Fórmula final

### 4.1 Preparación de los datos

- **Distancia:** línea recta (Haversine) entre `propiedad.latitud/longitud` y el punto de interés. No se usa la API de rutas (costo y cuota).
- Se consideran solo los puntos con `distancia_m ≤ R`.
- Un `google_place_id` cuenta una sola vez por categoría.
- `tiempo_estimado_min = ceil(distancia_m / 80)` (caminata a 4.8 km/h). Es informativo: **no entra en la fórmula**.

### 4.2 Sub-puntaje por categoría `c` (0 a 100)

Sea `d_min` la distancia al punto más cercano de la categoría y `n` la cantidad de puntos dentro de `R`.

```
Cercanía  P_c = 1                         si d_min ≤ D0
                (R − d_min) / (R − D0)    si D0 < d_min ≤ R
                0                         si no hay puntos (n = 0)

Densidad  D_c = min(1, n / N_c)

Sub-puntaje  S_c = 100 × ( α · P_c + β · D_c )        → redondeo a 2 decimales
```

Si la categoría no tiene puntos en `R`: `S_c = 0`, `cantidad_puntos = 0` y `distancia_minima_m = NULL`.

### 4.3 Puntaje total (0 a 100)

Sea `A` el conjunto de categorías con `activa = TRUE` y `w_c` su peso:

```
I = ( Σ_{c∈A} w_c · S_c ) / ( Σ_{c∈A} w_c )        → redondeo a 2 decimales
```

- Con las seis categorías activas, `Σ w_c = 1.00` y la fórmula se reduce a `I = Σ w_c · S_c`.
- Si una categoría se desactiva, el divisor reescala los pesos restantes para que `I` siga en 0–100.
- Una categoría sin puntos **aporta 0 y no se excluye**: así una propiedad sin cobertura no queda favorecida frente a otra.
- El semáforo se calcula sobre el valor **ya redondeado**.

---

## 5. Ejemplo calculado

| Categoría | Peso | `d_min` | `n` | `P_c` | `D_c` | `S_c` | `w·S` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| educación | 0.20 | 300 | 5 | 1.0000 | 1.0000 | 100.00 | 20.00 |
| salud | 0.20 | 900 | 1 | 0.7333 | 0.5000 | 64.00 | 12.80 |
| comercio | 0.20 | 450 | 3 | 1.0000 | 0.6000 | 84.00 | 16.80 |
| transporte | 0.15 | 1200 | 2 | 0.5333 | 0.6667 | 58.67 | 8.80 |
| áreas verdes | 0.15 | 1700 | 1 | 0.2000 | 0.5000 | 32.00 | 4.80 |
| seguridad | 0.10 | — | 0 | 0 | 0 | 0.00 | 0.00 |
| | | | | | | **Total** | **63.20 → amarillo** |

Cálculo de salud: `100 × (0.6 × 0.7333 + 0.4 × 0.5) = 100 × (0.44 + 0.20) = 64.00`.

---

## 6. Contrato de la función (interfaz para T17)

La función es **pura**: no importa Express, Prisma ni SDK externos (regla 1 de §6.2 de la arquitectura). Recibe los puntos ya obtenidos por el `MapsPort`.

```js
// src/modules/geo-indice/indice.calculator.js
/**
 * @param {Array<{categoriaId:number, peso:number, activa:boolean}>} categorias
 * @param {Array<{categoriaId:number, googlePlaceId:string, distanciaM:number}>} puntos
 * @returns {{
 *   puntajeTotal: number,          // 0-100, 2 decimales
 *   nivelSemaforo: 'verde'|'amarillo'|'rojo',
 *   radioM: 2000,
 *   versionAlgoritmo: 'v1.0',
 *   subPuntajes: Array<{categoriaId:number, puntaje:number,
 *                       cantidadPuntos:number, distanciaMinimaM:number|null}>
 * }}
 */
export function calcularIndice(categorias, puntos) { /* ... */ }
```

Mapeo a la base de datos (una sola transacción, §10.1 de la arquitectura):

| Salida | Tabla.columna |
| --- | --- |
| `puntajeTotal`, `nivelSemaforo`, `radioM`, `versionAlgoritmo` | `indice_conveniencia` (nuevo registro con `es_vigente = TRUE`; el anterior pasa a `FALSE`) |
| `subPuntajes[]` | `sub_puntaje_categoria` (`puntaje`, `cantidad_puntos`, `distancia_minima_m`) |
| Puntos de Google | `punto_interes` (`radio_consulta_m = 2000`) |

---

## 7. Datos iniciales (`prisma/seed.ts`)

```sql
INSERT INTO categoria_interes (id, nombre, google_place_types, icono, peso, activa) VALUES
 (1, 'educación',    'school,primary_school,secondary_school,university', 'school',     0.20, TRUE),
 (2, 'salud',        'hospital,doctor,dentist,pharmacy',                  'heart-pulse', 0.20, TRUE),
 (3, 'comercio',     'supermarket,convenience_store,shopping_mall,bank',  'shopping-cart', 0.20, TRUE),
 (4, 'transporte',   'bus_station,transit_station',                       'bus',         0.15, TRUE),
 (5, 'áreas verdes', 'park',                                              'trees',       0.15, TRUE),
 (6, 'seguridad',    'police,fire_station',                               'shield',      0.10, TRUE);
```

**Validación obligatoria:** al arrancar, un chequeo verifica que la suma de pesos activos sea `1.00`; si no, el servicio registra una advertencia y el cálculo usa el divisor `Σ w_c` (sección 4.3).

---

## 8. Casos de prueba (Jest)

| # | Escenario | Resultado esperado |
| --- | --- | --- |
| 1 | Todas las categorías con `d_min ≤ 500` y `n ≥ N_c` | `puntajeTotal = 100.00`, `verde` |
| 2 | Ningún punto en ninguna categoría | `0.00`, `rojo`; `distanciaMinimaM = null` en todas |
| 3 | Todas con `d_min = 2000` y `n ≥ N_c` (`P=0`, `D=1`) | `S_c = 40` en todas → `40.00`, `amarillo` (límite inferior) |
| 4 | Un punto a 2001 m | Se ignora (cuenta como sin puntos) |
| 5 | Mismo `google_place_id` repetido en una categoría | Cuenta una vez |
| 6 | Ejemplo de la sección 5 | `63.20`, `amarillo` |
| 7 | Categoría `seguridad` con `activa = FALSE` | `I = Σ(w·S) / 0.90`; resultado sigue en 0–100 |
| 8 | Puntaje exacto 70.00 | `verde` |
| 9 | Mismas entradas calculadas dos veces | Resultado idéntico (determinismo) |

**Prueba de fórmula en Excel (opcional):** hoja con columnas `categoría | peso | d_min | n | N_c | P | D | S | w·S`; fórmulas

```
P = SI(n=0; 0; SI(d_min<=500; 1; MAX(0; (2000-d_min)/1500)))
D = MIN(1; n/N_c)
S = 100*(0,6*P + 0,4*D)
Total = SUMA(w·S) / SUMA(pesos activos)
```

---

## 9. Cambio de pesos o parámetros (gobernanza)

1. Proponer el cambio mediante PR con la justificación y validación del grupo.
2. Actualizar `categoria_interes.peso` (migración o seed) y/o las constantes de `indice.config.js`.
3. Incrementar la versión (`v1.0` → `v1.1`).
4. Encolar un trabajo `recalcular-indices-masivo` en pg-boss que procese todas las propiedades publicadas por lotes y genere nuevos registros vigentes (el historial se conserva).
5. Hasta que termine el recálculo, las fichas muestran el último índice vigente (nunca valores mezclados sin versión).

---

## 10. Validación del grupo

Este documento debe aprobarse antes de que se implemente T17.

| Decisión a validar | Propuesta | Aprobada |
| --- | --- | --- |
| Pesos por categoría (sección 2) | 0.20 / 0.20 / 0.20 / 0.15 / 0.15 / 0.10 | ☐ |
| Radio de análisis y distancia óptima | 2000 m / 500 m | ☐ |
| Mezcla cercanía/densidad | 60 % / 40 % | ☐ |
| Cantidades objetivo `N_c` | ver sección 3 | ☐ |
| Umbrales del semáforo | ≥ 70 verde, ≥ 40 amarillo | ☐ |
| Categoría sin puntos aporta 0 | Sí | ☐ |
| Parámetros (`D0`, `α`, `β`, `N_c`) como constantes en código versionadas, no en BD | Sí | ☐ |

**Puntos abiertos**

- Si el grupo prefiere ajustar `N_c` o `D0` sin desplegar código, habría que agregar columnas a `categoria_interes` (cambio al modelo ER y a `init.sql`). La propuesta evita ese cambio para no tocar el esquema en el Sprint 1.
- Calibrar los umbrales del semáforo con propiedades reales de la zona (Jalapa y Ciudad de Guatemala) tras el primer cálculo de prueba; cualquier ajuste implica nueva versión.

| Integrante | Rol | Fecha de aprobación |
| --- | --- | --- |
| Keily López | Arquitectura / Backend Lead | |
| | Backend Developer 1 | |
| | Backend Developer 2 | |
| | Frontend 1 | |
| | Frontend 2 | |
| | Fullstack / DevOps | |
