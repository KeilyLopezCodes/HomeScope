# HomeScope — Pruebas funcionales del Índice de Conveniencia con ubicaciones reales (T34)

| Campo | Valor |
|---|---|
| Tarea | T34 (HOM-43) — Pruebas funcionales del índice con ubicaciones reales |
| Responsable | Backend Developer 2 |
| Relacionado | T17 (HOM-40) — ver `HomeScope_Indice_Conveniencia_T17.md` |
| Fecha | 15 de octubre de 2026 |
| Estado | **Parcial**: falta registrar el resultado del índice de cada propiedad (§5 y §6) |

---

## 1. Objetivo

Probar el cálculo del Índice de Conveniencia con al menos 5 propiedades en ubicaciones reales y documentar si los resultados son coherentes con la zona. El resultado se presenta en la Sprint Review final.

---

## 2. Qué cubre este documento

Las pruebas registradas son las **consultas de lugares por categoría** (`GET /api/places/search`), que son los datos de entrada del índice: qué servicios hay cerca de cada propiedad y a qué distancia. Por cada ubicación se probaron 5 categorías: educación, salud, comercio, transporte y áreas verdes.

El **índice calculado** (puntaje total, semáforo y sub-puntajes) de cada propiedad todavía no está registrado; se completa en el §5 siguiendo los pasos del §6. Hasta entonces se puede afirmar la coherencia de los datos de entrada, pero no la del índice.

---

## 3. Ubicaciones de prueba

Cinco propiedades en el casco urbano de Jalapa, creadas con `scripts/seed-propiedades-reales-t34.sql` (estado `borrador`), más una de control sin coordenadas para validar el error `SIN_COORDENADAS`. Las referencias (estadio, cementerio, sanatorio, etc.) son las declaradas al elegir los puntos; no se contrastaron con un mapa.

```json

[
  {
    "ubicacion": 1,
    "referencia": "Cerca del Estadio Las Flores / Col. La Cañada",
    "latitud": 14.640831,
    "longitud": -89.992601,
    "propiedadId": null,
    "titulo": "[PRUEBA T34] Casa cerca de Estadio Las Flores"
  },
  {
    "ubicacion": 2,
    "referencia": "Sector Cementerio General / Campo Verde",
    "latitud": 14.637522,
    "longitud": -89.995118,
    "propiedadId": 7,
    "titulo": "[PRUEBA T34] Casa sector Cementerio General"
  },
  {
    "ubicacion": 3,
    "referencia": "Cerca del Sanatorio Santa Marta / Río Jalapa",
    "latitud": 14.630172,
    "longitud": -89.984293,
    "propiedadId": 8,
    "titulo": "[PRUEBA T34] Propiedad cerca de Sanatorio Santa Marta"
  },
  {
    "ubicacion": 4,
    "referencia": "5ta Avenida / Parque Los Columpios",
    "latitud": 14.634293,
    "longitud": -89.981664,
    "propiedadId": null,
    "titulo": "[PRUEBA T34] Apartamento en 5ta Avenida"
  },
  {
    "ubicacion": 5,
    "referencia": "Mercado Central / Consultorio IGSS",
    "latitud": 14.633743,
    "longitud": -89.9925,
    "propiedadId": null,
    "titulo": "[PRUEBA T34] Local comercial / casa cerca del Mercado Central"
  },
  {
    "ubicacion": "control",
    "referencia": "Casa sin coordenadas",
    "latitud": 0.0,
    "longitud": 0.0,
    "propiedadId": null,
    "titulo": "[PRUEBA T34] Casa SIN coordenadas (Jalapa)"
  }
]
```

---

## 4. Método

Por cada ubicación y categoría se ejecutó desde Swagger:

```
GET /api/places/search?category=<categoría>&lat=<lat>&lng=<lng>&radio=5000&propiedadId=<id>
```

- `radio` = 5000 m (excepto una consulta, ver incidencia 2 del §8).
- El endpoint busca en Google Places por categoría y devuelve **hasta 5 lugares**, en el orden en que los entrega Google (no ordenados por distancia).
- La distancia es en línea recta (Haversine) y el tiempo a pie se estima a 80 m por minuto.
- Las respuestas de la sección 5 se reproducen **tal como las devolvió el endpoint**.

> El índice usa otros parámetros: radio de 2000 m, búsqueda por tipo de lugar ordenada por distancia y sin el límite de 5 resultados (ver `HomeScope_Indice_Conveniencia_T17.md`). Por eso estas respuestas no son idénticas a lo que verá el índice; sirven para comprobar que los datos son coherentes con la zona.

**Verificación de distancias.** Se recalcularon con Haversine las 58 distancias registradas y los minutos a pie de cada una (coordenadas de la propiedad y del lugar). **Las 58 coinciden con lo que devolvió el endpoint** (diferencia máxima de 0.00 m).

---

## 5. Resultados por ubicación

Cada ubicación incluye las respuestas del endpoint por categoría y, al final, un bloque para registrar el resultado del índice (valores `null` = pendiente).


### Ubicación 1 — Cerca del Estadio Las Flores / Col. La Cañada

Coordenadas: `14.640831, -89.992601` · `propiedadId`: (completar)

**educación**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "educación": [
      {
        "google_place_id": "ChIJCwL47lx1Yo8RyEucErV1_c0",
        "nombre": "Instituto BASICO EXPERIMENTAL CON ORIENTACION VOCACIONAL DR.SILVANO ANTONIO CARIAS",
        "latitud": 14.6394707,
        "longitud": -89.99271379999999,
        "distancia_m": 151.74449894054186,
        "tiempo_estimado_min": 2,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJnQQF7lx1Yo8RFDb-efRHjCQ",
        "nombre": "Instituto Experimental Dr. Silvano Antonio Carías Recinos",
        "latitud": 14.6393869,
        "longitud": -89.992357,
        "distancia_m": 162.70814344794562,
        "tiempo_estimado_min": 2,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJ97uJwVx1Yo8RfzQS5HEFVJ0",
        "nombre": "UPANA",
        "latitud": 14.639468,
        "longitud": -89.9916511,
        "distancia_m": 182.79439191992918,
        "tiempo_estimado_min": 2,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJxxBpmMl1Yo8RU2LsObYCpnU",
        "nombre": "Ingrid Méndez",
        "latitud": 14.6437356,
        "longitud": -89.9931936,
        "distancia_m": 329.2090270291236,
        "tiempo_estimado_min": 4,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJO-dfq6V1Yo8RJD7m6IuUuI0",
        "nombre": "Colegio Rembrandt",
        "latitud": 14.6430899,
        "longitud": -89.9882205,
        "distancia_m": 534.0287222263563,
        "tiempo_estimado_min": 7,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**salud**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "salud": [
      {
        "google_place_id": "ChIJrcAlJUF1Yo8R9623JGKJI7o",
        "nombre": "FARMACIA SOCIAL LA SALUD",
        "latitud": 14.6403708,
        "longitud": -89.9841929,
        "distancia_m": 906.027144668369,
        "tiempo_estimado_min": 11,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJmTdT0T51Yo8RcGY_AqAz6nU",
        "nombre": "Dirección de Área de Salud de Jalapa",
        "latitud": 14.6325326,
        "longitud": -89.9930619,
        "distancia_m": 924.0713699074633,
        "tiempo_estimado_min": 12,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJ-1CLA2p1Yo8Rs2mkvQQJKqo",
        "nombre": "Hospital Nacional \"Nicolasa Cruz\" Jalapa",
        "latitud": 14.6350682,
        "longitud": -89.9855831,
        "distancia_m": 990.2936669520811,
        "tiempo_estimado_min": 12,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJud7bBWp1Yo8RAJICq7xb4tM",
        "nombre": "Hospital De Jalapa",
        "latitud": 14.6351684,
        "longitud": -89.9855417,
        "distancia_m": 986.5454864062194,
        "tiempo_estimado_min": 12,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJLRSjDOp1Yo8Rw86XdT5FHcg",
        "nombre": "Clínicas Integrales Guzmán",
        "latitud": 14.6359362,
        "longitud": -89.9848564,
        "distancia_m": 995.2242705789578,
        "tiempo_estimado_min": 12,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**comercio**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "comercio": [
      {
        "google_place_id": "ChIJV37Ql1x1Yo8RhCaGyn1QuPs",
        "nombre": "Despensa Familiar zona 2 Jalapa",
        "latitud": 14.6404262,
        "longitud": -89.9918672,
        "distancia_m": 90.87596269307774,
        "tiempo_estimado_min": 1,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJVRCdV5Z1Yo8RC87Q6yXCN1I",
        "nombre": "Tienda Elias 2",
        "latitud": 14.6408525,
        "longitud": -89.9983776,
        "distancia_m": 621.4763157038132,
        "tiempo_estimado_min": 8,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJKWEGrGx1Yo8RIvhUQb46zhs",
        "nombre": "Distribuidora El Jordan",
        "latitud": 14.646113,
        "longitud": -89.995328,
        "distancia_m": 656.5284764094159,
        "tiempo_estimado_min": 8,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJYequP0J1Yo8RztuFzW68YAE",
        "nombre": "Marmoleria y Variedades Nicole",
        "latitud": 14.6370993,
        "longitud": -89.9870639,
        "distancia_m": 725.9828579076589,
        "tiempo_estimado_min": 9,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJEVrjkEF1Yo8RK5NKnByBsuc",
        "nombre": "Comercial La Esperanza",
        "latitud": 14.6376557,
        "longitud": -89.9853037,
        "distancia_m": 860.8226542263848,
        "tiempo_estimado_min": 11,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**transporte**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "transporte": [
      {
        "google_place_id": "ChIJq5akk351Yo8RazlTCD4z2SU",
        "nombre": "Transportes J.R",
        "latitud": 14.638724,
        "longitud": -89.9903788,
        "distancia_m": 334.7351622161698,
        "tiempo_estimado_min": 4,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJJ3vE8Wh1Yo8RvyjvkFUOTQg",
        "nombre": "Transportes Unidos Jalapanecos",
        "latitud": 14.6318918,
        "longitud": -89.9890204,
        "distancia_m": 1066.0306118614865,
        "tiempo_estimado_min": 13,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJGRQiXGp1Yo8RK2U17FtVTYM",
        "nombre": "Guatex Jalapa",
        "latitud": 14.6336605,
        "longitud": -89.9840641,
        "distancia_m": 1216.2557688895636,
        "tiempo_estimado_min": 15,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJHZ4UM2p1Yo8Rbz1NPF2aNTw",
        "nombre": "Cargo Expres",
        "latitud": 14.6325424,
        "longitud": -89.9853236,
        "distancia_m": 1209.3173934172999,
        "tiempo_estimado_min": 15,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJ1citv2l1Yo8RDcKGcSlmang",
        "nombre": "Bus station",
        "latitud": 14.6338417,
        "longitud": -89.987292,
        "distancia_m": 964.4898742680911,
        "tiempo_estimado_min": 12,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**áreas verdes**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "áreas verdes": [
      {
        "google_place_id": "ChIJ9QzgTwB1Yo8Rv1oBP_B-oc0",
        "nombre": "El rincon del tun",
        "latitud": 14.6396214,
        "longitud": -89.9930883,
        "distancia_m": 144.35756761585617,
        "tiempo_estimado_min": 2,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJVQFVsQh1Yo8RYwMdOdgq0Jk",
        "nombre": "Eventos CASA JARDIN",
        "latitud": 14.6388678,
        "longitud": -89.98948879999999,
        "distancia_m": 399.70249594995704,
        "tiempo_estimado_min": 5,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJkzSXNll1Yo8RnjxQHS2zAzg",
        "nombre": "Campo max",
        "latitud": 14.6417092,
        "longitud": -89.99670359999999,
        "distancia_m": 452.0479925515368,
        "tiempo_estimado_min": 6,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJnwQVX1p1Yo8RrK7YtGdJbm4",
        "nombre": "Complejo Deportivo Jalapa",
        "latitud": 14.6449304,
        "longitud": -89.99244809999999,
        "distancia_m": 456.12918973952475,
        "tiempo_estimado_min": 6,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJB5lB41V1Yo8REYvNAp27sOM",
        "nombre": "Cancha San Francisco",
        "latitud": 14.6365263,
        "longitud": -89.99117559999999,
        "distancia_m": 502.6261734156429,
        "tiempo_estimado_min": 6,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**seguridad**: 

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "seguridad": [
      {
        "google_place_id": "ChIJC7yY1Kt1Yo8RjnWq7qUzbkE",
        "nombre": "Producciones Noticiero Soy T21 TV",
        "latitud": 14.6372945,
        "longitud": -89.9928062,
        "distancia_m": 393.86005599668795,
        "tiempo_estimado_min": 5,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJqfq34RN1Yo8RJ-tC8-ovmC8",
        "nombre": "Policía Nacional Civil Estacion 22-1",
        "latitud": 14.6408624,
        "longitud": -89.9981061,
        "distancia_m": 592.2728464314455,
        "tiempo_estimado_min": 7,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJ2dPn9PR1Yo8RbHN30d5nN9E",
        "nombre": "Radiacumuladores S&L",
        "latitud": 14.6368112,
        "longitud": -89.98831190000001,
        "distancia_m": 642.4353233365111,
        "tiempo_estimado_min": 8,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJcUluFGh1Yo8RCvsjOf8YuxA",
        "nombre": "44 Compañía de Bomberos Voluntarios",
        "latitud": 14.6342452,
        "longitud": -89.9896936,
        "distancia_m": 796.3135852653642,
        "tiempo_estimado_min": 10,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJvSx6cgB1Yo8R4FhJjm-OTew",
        "nombre": "Policía Municipal de Tránsito PMT",
        "latitud": 14.6390456,
        "longitud": -89.9852358,
        "distancia_m": 816.8749594592263,
        "tiempo_estimado_min": 10,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**Índice (pendiente de completar)**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "seguridad": [
      {
        "google_place_id": "ChIJqfq34RN1Yo8RJ-tC8-ovmC8",
        "nombre": "Policía Nacional Civil Estacion 22-1",
        "latitud": 14.6408624,
        "longitud": -89.9981061,
        "distancia_m": 592.2728464314455,
        "tiempo_estimado_min": 7,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJcUluFGh1Yo8RCvsjOf8YuxA",
        "nombre": "44 Compañía de Bomberos Voluntarios",
        "latitud": 14.6342452,
        "longitud": -89.9896936,
        "distancia_m": 796.3135852653642,
        "tiempo_estimado_min": 10,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJvSx6cgB1Yo8R4FhJjm-OTew",
        "nombre": "Policía Municipal de Tránsito PMT",
        "latitud": 14.6390456,
        "longitud": -89.9852358,
        "distancia_m": 816.8749594592263,
        "tiempo_estimado_min": 10,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJn2XCBO11Yo8RIpFimxlFpqc",
        "nombre": "Gas Express Azucenas",
        "latitud": 14.6392115,
        "longitud": -89.9849519,
        "distancia_m": 842.3994669889647,
        "tiempo_estimado_min": 11,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJRe6JRAB1Yo8RWjq1EXerpeo",
        "nombre": "Delegación Jalapa, División de Asuntos Internos, Inspectoria General, PNC",
        "latitud": 14.6341605,
        "longitud": -89.996438,
        "distancia_m": 848.8622196810906,
        "tiempo_estimado_min": 11,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```


### Ubicación 2 — Sector Cementerio General / Campo Verde

Coordenadas: `14.637522, -89.995118` · `propiedadId` = 7

**educación**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "educación": [
      {
        "google_place_id": "ChIJCwL47lx1Yo8RyEucErV1_c0",
        "nombre": "Instituto BASICO EXPERIMENTAL CON ORIENTACION VOCACIONAL DR.SILVANO ANTONIO CARIAS",
        "latitud": 14.6394707,
        "longitud": -89.99271379999999,
        "distancia_m": 337.4256888516271,
        "tiempo_estimado_min": 4,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJB4mMZWd1Yo8Rc8z8SZIk830",
        "nombre": "Escuela tipo Federación Luis Martínez Mont",
        "latitud": 14.6357176,
        "longitud": -89.9925851,
        "distancia_m": 338.40179864146114,
        "tiempo_estimado_min": 4,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJnQQF7lx1Yo8RFDb-efRHjCQ",
        "nombre": "Instituto Experimental Dr. Silvano Antonio Carías Recinos",
        "latitud": 14.6393869,
        "longitud": -89.992357,
        "distancia_m": 362.2653026532422,
        "tiempo_estimado_min": 5,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJ97uJwVx1Yo8RfzQS5HEFVJ0",
        "nombre": "UPANA",
        "latitud": 14.639468,
        "longitud": -89.9916511,
        "distancia_m": 431.21081870910655,
        "tiempo_estimado_min": 5,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJu4en62d1Yo8RMe_1pyXlOaA",
        "nombre": "Instituto Privado El Porvenir",
        "latitud": 14.6340762,
        "longitud": -89.9919312,
        "distancia_m": 514.1590221706974,
        "tiempo_estimado_min": 6,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**salud**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "salud": [
      {
        "google_place_id": "ChIJrcAlJUF1Yo8R9623JGKJI7o",
        "nombre": "FARMACIA SOCIAL LA SALUD",
        "latitud": 14.6403708,
        "longitud": -89.9841929,
        "distancia_m": 1217.317705379484,
        "tiempo_estimado_min": 15,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJmTdT0T51Yo8RcGY_AqAz6nU",
        "nombre": "Dirección de Área de Salud de Jalapa",
        "latitud": 14.6325326,
        "longitud": -89.9930619,
        "distancia_m": 597.2708288460218,
        "tiempo_estimado_min": 7,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJ-1CLA2p1Yo8Rs2mkvQQJKqo",
        "nombre": "Hospital Nacional \"Nicolasa Cruz\" Jalapa",
        "latitud": 14.6350682,
        "longitud": -89.9855831,
        "distancia_m": 1061.493599710679,
        "tiempo_estimado_min": 13,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJud7bBWp1Yo8RAJICq7xb4tM",
        "nombre": "Hospital De Jalapa",
        "latitud": 14.6351684,
        "longitud": -89.9855417,
        "distancia_m": 1063.0006352384767,
        "tiempo_estimado_min": 13,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJLRSjDOp1Yo8Rw86XdT5FHcg",
        "nombre": "Clínicas Integrales Guzmán",
        "latitud": 14.6359362,
        "longitud": -89.9848564,
        "distancia_m": 1118.001517561397,
        "tiempo_estimado_min": 14,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**comercio**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "comercio": [
      {
        "google_place_id": "ChIJV37Ql1x1Yo8RhCaGyn1QuPs",
        "nombre": "Despensa Familiar zona 2 Jalapa",
        "latitud": 14.6404262,
        "longitud": -89.9918672,
        "distancia_m": 476.0273685348634,
        "tiempo_estimado_min": 6,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJVRCdV5Z1Yo8RC87Q6yXCN1I",
        "nombre": "Tienda Elias 2",
        "latitud": 14.6408525,
        "longitud": -89.9983776,
        "distancia_m": 510.0269213180431,
        "tiempo_estimado_min": 6,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJUUG-9et1Yo8RZAOBMNPP8gQ",
        "nombre": "Super Market La Avenida",
        "latitud": 14.6321623,
        "longitud": -89.99886409999999,
        "distancia_m": 719.4562873027054,
        "tiempo_estimado_min": 9,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJOWJ6zdF1Yo8RX90E2UzsKeI",
        "nombre": "Distribuidora San Francisco",
        "latitud": 14.6382339,
        "longitud": -89.9941934,
        "distancia_m": 127.12708412722999,
        "tiempo_estimado_min": 2,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJTausWYt1Yo8RUtU-4jNM7Vg",
        "nombre": "INVERSIONES_ORANTES",
        "latitud": 14.632548,
        "longitud": -89.993005,
        "distancia_m": 597.9808923936596,
        "tiempo_estimado_min": 7,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**áreas verdes**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "áreas verdes": [
      {
        "google_place_id": "ChIJ_5TWBN91Yo8RGBkV0mEvn7U",
        "nombre": "Puesto de Salud Los Izotes",
        "latitud": 14.6356889,
        "longitud": -89.99539449999999,
        "distancia_m": 205.99070415956368,
        "tiempo_estimado_min": 3,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJw0Rke0F1Yo8R-4O_pLXZ5zw",
        "nombre": "Cancha Ferchos",
        "latitud": 14.636191,
        "longitud": -89.996736,
        "distancia_m": 228.48656250685295,
        "tiempo_estimado_min": 3,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJ9QzgTwB1Yo8Rv1oBP_B-oc0",
        "nombre": "El rincon del tun",
        "latitud": 14.6396214,
        "longitud": -89.9930883,
        "distancia_m": 319.65490612117725,
        "tiempo_estimado_min": 4,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJp5naAgB1Yo8R5eU-khBNPlU",
        "nombre": "Colonia la linda vista",
        "latitud": 14.636033,
        "longitud": -89.991588,
        "distancia_m": 414.30163850031363,
        "tiempo_estimado_min": 5,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJtSOTW2B1Yo8RRXCgxFvCLhU",
        "nombre": "El Jardín de Elena",
        "latitud": 14.6341991,
        "longitud": -89.99724909999999,
        "distancia_m": 434.84603449675745,
        "tiempo_estimado_min": 5,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**transporte**: 
```json
{
        "google_place_id": "ChIJq5akk351Yo8RazlTCD4z2SU",
        "nombre": "Transportes J.R",
        "latitud": 14.638724,
        "longitud": -89.9903788,
        "distancia_m": 527.0972056589686,
        "tiempo_estimado_min": 7,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJ6QW6A-B1Yo8R6uYO2zoRc48",
        "nombre": "Repuestos El Microbus",
        "latitud": 14.638874,
        "longitud": -89.9903849,
        "distancia_m": 530.9418592572878,
        "tiempo_estimado_min": 7,
        "radio_consulta_m": 5000
      }
```


**seguridad**: 

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "seguridad": [
      {
        "google_place_id": "ChIJC7yY1Kt1Yo8RjnWq7qUzbkE",
        "nombre": "Producciones Noticiero Soy T21 TV",
        "latitud": 14.6372945,
        "longitud": -89.9928062,
        "distancia_m": 250.0005290726428,
        "tiempo_estimado_min": 3,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJRe6JRAB1Yo8RWjq1EXerpeo",
        "nombre": "Delegación Jalapa, División de Asuntos Internos, Inspectoria General, PNC",
        "latitud": 14.6341605,
        "longitud": -89.996438,
        "distancia_m": 399.85113704129316,
        "tiempo_estimado_min": 5,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJqfq34RN1Yo8RJ-tC8-ovmC8",
        "nombre": "Policía Nacional Civil Estacion 22-1",
        "latitud": 14.6408624,
        "longitud": -89.9981061,
        "distancia_m": 491.23380930944114,
        "tiempo_estimado_min": 6,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJcUluFGh1Yo8RCvsjOf8YuxA",
        "nombre": "44 Compañía de Bomberos Voluntarios",
        "latitud": 14.6342452,
        "longitud": -89.9896936,
        "distancia_m": 687.9988339620924,
        "tiempo_estimado_min": 9,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJozIiPWZ1Yo8RqxcAZ5NPXZ0",
        "nombre": "Gasolinera y Servicentro La Montaña",
        "latitud": 14.6311481,
        "longitud": -89.9912141,
        "distancia_m": 823.8502171797855,
        "tiempo_estimado_min": 10,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

```json
{
  "propiedadId": 7,
  "puntajeTotal": null,
  "nivelSemaforo": null,
  "subPuntajes": {
    "educación": null,
    "salud": null,
    "comercio": null,
    "transporte": null,
    "áreas verdes": null,
    "seguridad": null
  },
  "coherenteConLaZona": null,
  "observaciones": null
}
```


### Ubicación 3 — Cerca del Sanatorio Santa Marta / Río Jalapa

Coordenadas: `14.630172, -89.984293` · `propiedadId` = 8

**educación**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "educación": [
      {
        "google_place_id": "ChIJqwGNh9J1Yo8RF7cjYyopsp0",
        "nombre": "Direccion Departamental de Educacion de Jalapa",
        "latitud": 14.646146,
        "longitud": -89.9955579,
        "distancia_m": 2150.2994446418425,
        "tiempo_estimado_min": 27,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJIWilaBV1Yo8RdWuXEamIpjY",
        "nombre": "Escuela Oficial Urbana para Niñas y Varones No. 1",
        "latitud": 14.6343853,
        "longitud": -89.9799257,
        "distancia_m": 663.527812916911,
        "tiempo_estimado_min": 8,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJw1fz_wR1Yo8R_T-XVGALBTM",
        "nombre": "Dirección General de Educación",
        "latitud": 14.6462189,
        "longitud": -89.99558329999999,
        "distancia_m": 2158.5366966378015,
        "tiempo_estimado_min": 27,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJMecso6d1Yo8RsSvmYXuDIqA",
        "nombre": "Instituto Adolfo V. Hall",
        "latitud": 14.6106889,
        "longitud": -89.9731798,
        "distancia_m": 2474.4947177755844,
        "tiempo_estimado_min": 31,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJw6Xx06B1Yo8RgqAK1JPHUV0",
        "nombre": "Colegio Preuniversitario \"Juan Pablo segundo II\"",
        "latitud": 14.6316593,
        "longitud": -89.98585729999999,
        "distancia_m": 235.95786065361762,
        "tiempo_estimado_min": 3,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**salud**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "salud": [
      {
        "google_place_id": "ChIJrcAlJUF1Yo8R9623JGKJI7o",
        "nombre": "FARMACIA SOCIAL LA SALUD",
        "latitud": 14.6403708,
        "longitud": -89.9841929,
        "distancia_m": 1134.1059524222574,
        "tiempo_estimado_min": 14,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJmTdT0T51Yo8RcGY_AqAz6nU",
        "nombre": "Dirección de Área de Salud de Jalapa",
        "latitud": 14.6325326,
        "longitud": -89.9930619,
        "distancia_m": 979.2716439401167,
        "tiempo_estimado_min": 12,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJ-1CLA2p1Yo8Rs2mkvQQJKqo",
        "nombre": "Hospital Nacional \"Nicolasa Cruz\" Jalapa",
        "latitud": 14.6350682,
        "longitud": -89.9855831,
        "distancia_m": 561.8471588528811,
        "tiempo_estimado_min": 7,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJud7bBWp1Yo8RAJICq7xb4tM",
        "nombre": "Hospital De Jalapa",
        "latitud": 14.6351684,
        "longitud": -89.9855417,
        "distancia_m": 571.5868883125519,
        "tiempo_estimado_min": 7,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJybDm0NF1Yo8RvTg1pod2ea4",
        "nombre": "Sanatorio Centro Médico Jalapaneco",
        "latitud": 14.6343792,
        "longitud": -89.9834659,
        "distancia_m": 476.20739977724895,
        "tiempo_estimado_min": 6,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**comercio**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "comercio": [
      {
        "google_place_id": "ChIJLcM7pml1Yo8RkBKRGp9XseA",
        "nombre": "SÚPER TIENDA LA POPULAR",
        "latitud": 14.6327024,
        "longitud": -89.98769949999999,
        "distancia_m": 462.05118938763354,
        "tiempo_estimado_min": 6,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJPzUYSml1Yo8Re-amuRJep0Y",
        "nombre": "Ferreteria La Bodega",
        "latitud": 14.6299146,
        "longitud": -89.9870799,
        "distancia_m": 301.2045111543588,
        "tiempo_estimado_min": 4,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJW68fZzV1Yo8RTOQddAFJbY0",
        "nombre": "Comercial Tobar",
        "latitud": 14.6323509,
        "longitud": -89.9866953,
        "distancia_m": 354.2640804692946,
        "tiempo_estimado_min": 4,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJMwJNLsR1Yo8RRZpxoJOIfh0",
        "nombre": "Super del Barrio Jalapa",
        "latitud": 14.6336046,
        "longitud": -89.985968,
        "distancia_m": 422.09188032524384,
        "tiempo_estimado_min": 5,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJhfMBslx1Yo8R_N8ygtN9dS0",
        "nombre": "LA CURACAO JALAPA",
        "latitud": 14.6320592,
        "longitud": -89.98552020000001,
        "distancia_m": 247.92861645372406,
        "tiempo_estimado_min": 3,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**transporte**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "transporte": [
      {
        "google_place_id": "ChIJJ3vE8Wh1Yo8RvyjvkFUOTQg",
        "nombre": "Transportes Unidos Jalapanecos",
        "latitud": 14.6318918,
        "longitud": -89.9890204,
        "distancia_m": 543.3795094193459,
        "tiempo_estimado_min": 7,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJq5akk351Yo8RazlTCD4z2SU",
        "nombre": "Transportes J.R",
        "latitud": 14.638724,
        "longitud": -89.9903788,
        "distancia_m": 1154.5519765737542,
        "tiempo_estimado_min": 14,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJHZ4UM2p1Yo8Rbz1NPF2aNTw",
        "nombre": "Cargo Expres",
        "latitud": 14.6325424,
        "longitud": -89.9853236,
        "distancia_m": 285.9496311699628,
        "tiempo_estimado_min": 4,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJGRQiXGp1Yo8RK2U17FtVTYM",
        "nombre": "Guatex Jalapa",
        "latitud": 14.6336605,
        "longitud": -89.9840641,
        "distancia_m": 388.6844717014314,
        "tiempo_estimado_min": 5,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJ1citv2l1Yo8RDcKGcSlmang",
        "nombre": "Bus station",
        "latitud": 14.6338417,
        "longitud": -89.987292,
        "distancia_m": 520.2066137656836,
        "tiempo_estimado_min": 7,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**áreas verdes**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "áreas verdes": [
      {
        "google_place_id": "ChIJW5H4UBV1Yo8RuPi4mxXnLJM",
        "nombre": "Central. Park",
        "latitud": 14.6350296,
        "longitud": -89.98049329999999,
        "distancia_m": 677.4009924337645,
        "tiempo_estimado_min": 8,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**seguridad**: 

```json

```

**Índice (pendiente de completar)**

```json
{
  "propiedadId": 8,
  "puntajeTotal": null,
  "nivelSemaforo": null,
  "subPuntajes": {
    "educación": null,
    "salud": null,
    "comercio": null,
    "transporte": null,
    "áreas verdes": null,
    "seguridad": null
  },
  "coherenteConLaZona": null,
  "observaciones": null
}
```


### Ubicación 4 — 5ta Avenida / Parque Los Columpios

Coordenadas: `14.634293, -89.981664` · `propiedadId`: (completar)

**educación**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "educación": [
      {
        "google_place_id": "ChIJCwL47lx1Yo8RyEucErV1_c0",
        "nombre": "Instituto BASICO EXPERIMENTAL CON ORIENTACION VOCACIONAL DR.SILVANO ANTONIO CARIAS",
        "latitud": 14.6394707,
        "longitud": -89.99271379999999,
        "distancia_m": 337.4256888516271,
        "tiempo_estimado_min": 4,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJB4mMZWd1Yo8Rc8z8SZIk830",
        "nombre": "Escuela tipo Federación Luis Martínez Mont",
        "latitud": 14.6357176,
        "longitud": -89.9925851,
        "distancia_m": 338.40179864146114,
        "tiempo_estimado_min": 4,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJnQQF7lx1Yo8RFDb-efRHjCQ",
        "nombre": "Instituto Experimental Dr. Silvano Antonio Carías Recinos",
        "latitud": 14.6393869,
        "longitud": -89.992357,
        "distancia_m": 362.2653026532422,
        "tiempo_estimado_min": 5,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJ97uJwVx1Yo8RfzQS5HEFVJ0",
        "nombre": "UPANA",
        "latitud": 14.639468,
        "longitud": -89.9916511,
        "distancia_m": 431.21081870910655,
        "tiempo_estimado_min": 5,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJu4en62d1Yo8RMe_1pyXlOaA",
        "nombre": "Instituto Privado El Porvenir",
        "latitud": 14.6340762,
        "longitud": -89.9919312,
        "distancia_m": 514.1590221706974,
        "tiempo_estimado_min": 6,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**salud**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "salud": [
      {
        "google_place_id": "ChIJrcAlJUF1Yo8R9623JGKJI7o",
        "nombre": "FARMACIA SOCIAL LA SALUD",
        "latitud": 14.6403708,
        "longitud": -89.9841929,
        "distancia_m": 1217.317705379484,
        "tiempo_estimado_min": 15,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJmTdT0T51Yo8RcGY_AqAz6nU",
        "nombre": "Dirección de Área de Salud de Jalapa",
        "latitud": 14.6325326,
        "longitud": -89.9930619,
        "distancia_m": 597.2708288460218,
        "tiempo_estimado_min": 7,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJ-1CLA2p1Yo8Rs2mkvQQJKqo",
        "nombre": "Hospital Nacional \"Nicolasa Cruz\" Jalapa",
        "latitud": 14.6350682,
        "longitud": -89.9855831,
        "distancia_m": 1061.493599710679,
        "tiempo_estimado_min": 13,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJud7bBWp1Yo8RAJICq7xb4tM",
        "nombre": "Hospital De Jalapa",
        "latitud": 14.6351684,
        "longitud": -89.9855417,
        "distancia_m": 1063.0006352384767,
        "tiempo_estimado_min": 13,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJLRSjDOp1Yo8Rw86XdT5FHcg",
        "nombre": "Clínicas Integrales Guzmán",
        "latitud": 14.6359362,
        "longitud": -89.9848564,
        "distancia_m": 1118.001517561397,
        "tiempo_estimado_min": 14,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**comercio**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "comercio": [
      {
        "google_place_id": "ChIJV37Ql1x1Yo8RhCaGyn1QuPs",
        "nombre": "Despensa Familiar zona 2 Jalapa",
        "latitud": 14.6404262,
        "longitud": -89.9918672,
        "distancia_m": 476.0273685348634,
        "tiempo_estimado_min": 6,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJVRCdV5Z1Yo8RC87Q6yXCN1I",
        "nombre": "Tienda Elias 2",
        "latitud": 14.6408525,
        "longitud": -89.9983776,
        "distancia_m": 510.0269213180431,
        "tiempo_estimado_min": 6,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJUUG-9et1Yo8RZAOBMNPP8gQ",
        "nombre": "Super Market La Avenida",
        "latitud": 14.6321623,
        "longitud": -89.99886409999999,
        "distancia_m": 719.4562873027054,
        "tiempo_estimado_min": 9,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJOWJ6zdF1Yo8RX90E2UzsKeI",
        "nombre": "Distribuidora San Francisco",
        "latitud": 14.6382339,
        "longitud": -89.9941934,
        "distancia_m": 127.12708412722999,
        "tiempo_estimado_min": 2,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJTausWYt1Yo8RUtU-4jNM7Vg",
        "nombre": "INVERSIONES_ORANTES",
        "latitud": 14.632548,
        "longitud": -89.993005,
        "distancia_m": 597.9808923936596,
        "tiempo_estimado_min": 7,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**áreas verdes**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "áreas verdes": [
      {
        "google_place_id": "ChIJ_5TWBN91Yo8RGBkV0mEvn7U",
        "nombre": "Puesto de Salud Los Izotes",
        "latitud": 14.6356889,
        "longitud": -89.99539449999999,
        "distancia_m": 205.99070415956368,
        "tiempo_estimado_min": 3,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJw0Rke0F1Yo8R-4O_pLXZ5zw",
        "nombre": "Cancha Ferchos",
        "latitud": 14.636191,
        "longitud": -89.996736,
        "distancia_m": 228.48656250685295,
        "tiempo_estimado_min": 3,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJ9QzgTwB1Yo8Rv1oBP_B-oc0",
        "nombre": "El rincon del tun",
        "latitud": 14.6396214,
        "longitud": -89.9930883,
        "distancia_m": 319.65490612117725,
        "tiempo_estimado_min": 4,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJp5naAgB1Yo8R5eU-khBNPlU",
        "nombre": "Colonia la linda vista",
        "latitud": 14.636033,
        "longitud": -89.991588,
        "distancia_m": 414.30163850031363,
        "tiempo_estimado_min": 5,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJtSOTW2B1Yo8RRXCgxFvCLhU",
        "nombre": "El Jardín de Elena",
        "latitud": 14.6341991,
        "longitud": -89.99724909999999,
        "distancia_m": 434.84603449675745,
        "tiempo_estimado_min": 5,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**transporte**: 
```json
{
        "google_place_id": "ChIJq5akk351Yo8RazlTCD4z2SU",
        "nombre": "Transportes J.R",
        "latitud": 14.638724,
        "longitud": -89.9903788,
        "distancia_m": 527.0972056589686,
        "tiempo_estimado_min": 7,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJ6QW6A-B1Yo8R6uYO2zoRc48",
        "nombre": "Repuestos El Microbus",
        "latitud": 14.638874,
        "longitud": -89.9903849,
        "distancia_m": 530.9418592572878,
        "tiempo_estimado_min": 7,
        "radio_consulta_m": 5000
      }
```


**seguridad**: 

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "seguridad": [
      {
        "google_place_id": "ChIJC7yY1Kt1Yo8RjnWq7qUzbkE",
        "nombre": "Producciones Noticiero Soy T21 TV",
        "latitud": 14.6372945,
        "longitud": -89.9928062,
        "distancia_m": 250.0005290726428,
        "tiempo_estimado_min": 3,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJRe6JRAB1Yo8RWjq1EXerpeo",
        "nombre": "Delegación Jalapa, División de Asuntos Internos, Inspectoria General, PNC",
        "latitud": 14.6341605,
        "longitud": -89.996438,
        "distancia_m": 399.85113704129316,
        "tiempo_estimado_min": 5,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJqfq34RN1Yo8RJ-tC8-ovmC8",
        "nombre": "Policía Nacional Civil Estacion 22-1",
        "latitud": 14.6408624,
        "longitud": -89.9981061,
        "distancia_m": 491.23380930944114,
        "tiempo_estimado_min": 6,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJcUluFGh1Yo8RCvsjOf8YuxA",
        "nombre": "44 Compañía de Bomberos Voluntarios",
        "latitud": 14.6342452,
        "longitud": -89.9896936,
        "distancia_m": 687.9988339620924,
        "tiempo_estimado_min": 9,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJozIiPWZ1Yo8RqxcAZ5NPXZ0",
        "nombre": "Gasolinera y Servicentro La Montaña",
        "latitud": 14.6311481,
        "longitud": -89.9912141,
        "distancia_m": 823.8502171797855,
        "tiempo_estimado_min": 10,
        "radio_consulta_m": 5000
      }
    ]
  }
}

**Índice (pendiente de completar)**

```json
{
  "propiedadId": null,
  "puntajeTotal": null,
  "nivelSemaforo": null,
  "subPuntajes": {
    "educación": null,
    "salud": null,
    "comercio": null,
    "transporte": null,
    "áreas verdes": null,
    "seguridad": null
  },
  "coherenteConLaZona": null,
  "observaciones": null
}
```


### Ubicación 5 — Mercado Central / Consultorio IGSS

Coordenadas: `14.633743, -89.992500` · `propiedadId`: (completar)

**educación**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "educación": [
      {
        "google_place_id": "ChIJCwL47lx1Yo8RyEucErV1_c0",
        "nombre": "Instituto BASICO EXPERIMENTAL CON ORIENTACION VOCACIONAL DR.SILVANO ANTONIO CARIAS",
        "latitud": 14.6394707,
        "longitud": -89.99271379999999,
        "distancia_m": 337.4256888516271,
        "tiempo_estimado_min": 4,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJB4mMZWd1Yo8Rc8z8SZIk830",
        "nombre": "Escuela tipo Federación Luis Martínez Mont",
        "latitud": 14.6357176,
        "longitud": -89.9925851,
        "distancia_m": 338.40179864146114,
        "tiempo_estimado_min": 4,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJnQQF7lx1Yo8RFDb-efRHjCQ",
        "nombre": "Instituto Experimental Dr. Silvano Antonio Carías Recinos",
        "latitud": 14.6393869,
        "longitud": -89.992357,
        "distancia_m": 362.2653026532422,
        "tiempo_estimado_min": 5,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJ97uJwVx1Yo8RfzQS5HEFVJ0",
        "nombre": "UPANA",
        "latitud": 14.639468,
        "longitud": -89.9916511,
        "distancia_m": 431.21081870910655,
        "tiempo_estimado_min": 5,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJu4en62d1Yo8RMe_1pyXlOaA",
        "nombre": "Instituto Privado El Porvenir",
        "latitud": 14.6340762,
        "longitud": -89.9919312,
        "distancia_m": 514.1590221706974,
        "tiempo_estimado_min": 6,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**salud**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "salud": [
      {
        "google_place_id": "ChIJrcAlJUF1Yo8R9623JGKJI7o",
        "nombre": "FARMACIA SOCIAL LA SALUD",
        "latitud": 14.6403708,
        "longitud": -89.9841929,
        "distancia_m": 1217.317705379484,
        "tiempo_estimado_min": 15,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJmTdT0T51Yo8RcGY_AqAz6nU",
        "nombre": "Dirección de Área de Salud de Jalapa",
        "latitud": 14.6325326,
        "longitud": -89.9930619,
        "distancia_m": 597.2708288460218,
        "tiempo_estimado_min": 7,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJ-1CLA2p1Yo8Rs2mkvQQJKqo",
        "nombre": "Hospital Nacional \"Nicolasa Cruz\" Jalapa",
        "latitud": 14.6350682,
        "longitud": -89.9855831,
        "distancia_m": 1061.493599710679,
        "tiempo_estimado_min": 13,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJud7bBWp1Yo8RAJICq7xb4tM",
        "nombre": "Hospital De Jalapa",
        "latitud": 14.6351684,
        "longitud": -89.9855417,
        "distancia_m": 1063.0006352384767,
        "tiempo_estimado_min": 13,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJLRSjDOp1Yo8Rw86XdT5FHcg",
        "nombre": "Clínicas Integrales Guzmán",
        "latitud": 14.6359362,
        "longitud": -89.9848564,
        "distancia_m": 1118.001517561397,
        "tiempo_estimado_min": 14,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**comercio**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "comercio": [
      {
        "google_place_id": "ChIJV37Ql1x1Yo8RhCaGyn1QuPs",
        "nombre": "Despensa Familiar zona 2 Jalapa",
        "latitud": 14.6404262,
        "longitud": -89.9918672,
        "distancia_m": 476.0273685348634,
        "tiempo_estimado_min": 6,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJVRCdV5Z1Yo8RC87Q6yXCN1I",
        "nombre": "Tienda Elias 2",
        "latitud": 14.6408525,
        "longitud": -89.9983776,
        "distancia_m": 510.0269213180431,
        "tiempo_estimado_min": 6,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJUUG-9et1Yo8RZAOBMNPP8gQ",
        "nombre": "Super Market La Avenida",
        "latitud": 14.6321623,
        "longitud": -89.99886409999999,
        "distancia_m": 719.4562873027054,
        "tiempo_estimado_min": 9,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJOWJ6zdF1Yo8RX90E2UzsKeI",
        "nombre": "Distribuidora San Francisco",
        "latitud": 14.6382339,
        "longitud": -89.9941934,
        "distancia_m": 127.12708412722999,
        "tiempo_estimado_min": 2,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJTausWYt1Yo8RUtU-4jNM7Vg",
        "nombre": "INVERSIONES_ORANTES",
        "latitud": 14.632548,
        "longitud": -89.993005,
        "distancia_m": 597.9808923936596,
        "tiempo_estimado_min": 7,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**áreas verdes**

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "áreas verdes": [
      {
        "google_place_id": "ChIJ_5TWBN91Yo8RGBkV0mEvn7U",
        "nombre": "Puesto de Salud Los Izotes",
        "latitud": 14.6356889,
        "longitud": -89.99539449999999,
        "distancia_m": 205.99070415956368,
        "tiempo_estimado_min": 3,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJw0Rke0F1Yo8R-4O_pLXZ5zw",
        "nombre": "Cancha Ferchos",
        "latitud": 14.636191,
        "longitud": -89.996736,
        "distancia_m": 228.48656250685295,
        "tiempo_estimado_min": 3,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJ9QzgTwB1Yo8Rv1oBP_B-oc0",
        "nombre": "El rincon del tun",
        "latitud": 14.6396214,
        "longitud": -89.9930883,
        "distancia_m": 319.65490612117725,
        "tiempo_estimado_min": 4,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJp5naAgB1Yo8R5eU-khBNPlU",
        "nombre": "Colonia la linda vista",
        "latitud": 14.636033,
        "longitud": -89.991588,
        "distancia_m": 414.30163850031363,
        "tiempo_estimado_min": 5,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJtSOTW2B1Yo8RRXCgxFvCLhU",
        "nombre": "El Jardín de Elena",
        "latitud": 14.6341991,
        "longitud": -89.99724909999999,
        "distancia_m": 434.84603449675745,
        "tiempo_estimado_min": 5,
        "radio_consulta_m": 5000
      }
    ]
  }
}
```

**transporte**: 
```json
{
        "google_place_id": "ChIJq5akk351Yo8RazlTCD4z2SU",
        "nombre": "Transportes J.R",
        "latitud": 14.638724,
        "longitud": -89.9903788,
        "distancia_m": 527.0972056589686,
        "tiempo_estimado_min": 7,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJ6QW6A-B1Yo8R6uYO2zoRc48",
        "nombre": "Repuestos El Microbus",
        "latitud": 14.638874,
        "longitud": -89.9903849,
        "distancia_m": 530.9418592572878,
        "tiempo_estimado_min": 7,
        "radio_consulta_m": 5000
      }
```


**seguridad**: 

```json
{
  "success": true,
  "message": "Lugares consultados y puntos de interés persistidos exitosamente.",
  "data": {
    "seguridad": [
      {
        "google_place_id": "ChIJC7yY1Kt1Yo8RjnWq7qUzbkE",
        "nombre": "Producciones Noticiero Soy T21 TV",
        "latitud": 14.6372945,
        "longitud": -89.9928062,
        "distancia_m": 250.0005290726428,
        "tiempo_estimado_min": 3,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJRe6JRAB1Yo8RWjq1EXerpeo",
        "nombre": "Delegación Jalapa, División de Asuntos Internos, Inspectoria General, PNC",
        "latitud": 14.6341605,
        "longitud": -89.996438,
        "distancia_m": 399.85113704129316,
        "tiempo_estimado_min": 5,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJqfq34RN1Yo8RJ-tC8-ovmC8",
        "nombre": "Policía Nacional Civil Estacion 22-1",
        "latitud": 14.6408624,
        "longitud": -89.9981061,
        "distancia_m": 491.23380930944114,
        "tiempo_estimado_min": 6,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJcUluFGh1Yo8RCvsjOf8YuxA",
        "nombre": "44 Compañía de Bomberos Voluntarios",
        "latitud": 14.6342452,
        "longitud": -89.9896936,
        "distancia_m": 687.9988339620924,
        "tiempo_estimado_min": 9,
        "radio_consulta_m": 5000
      },
      {
        "google_place_id": "ChIJozIiPWZ1Yo8RqxcAZ5NPXZ0",
        "nombre": "Gasolinera y Servicentro La Montaña",
        "latitud": 14.6311481,
        "longitud": -89.9912141,
        "distancia_m": 823.8502171797855,
        "tiempo_estimado_min": 10,
        "radio_consulta_m": 5000
      }
    ]
  }
}

**Índice (pendiente de completar)**

```json
{
  "propiedadId": null,
  "puntajeTotal": null,
  "nivelSemaforo": null,
  "subPuntajes": {
    "educación": null,
    "salud": null,
    "comercio": null,
    "transporte": null,
    "áreas verdes": null,
    "seguridad": null
  },
  "coherenteConLaZona": null,
  "observaciones": null
}
```


### Control — sin coordenadas

Resultado esperado del cálculo: `422 SIN_COORDENADAS`. Sin respuesta registrada.

```json
{
  "propiedadId": null,
  "respuestaEsperada": "422 SIN_COORDENADAS",
  "respuestaObtenida": null
}
```

---

## 6. Cómo registrar el resultado del índice

Para cada propiedad, con el servidor en desarrollo:

1. Calcular el índice: `POST /api/v1/propiedades/{id}/indice/recalcular` (endpoint de apoyo para pruebas), o publicar la propiedad con `PUT` y `{ "estado": "publicado" }` para probar el flujo real.
2. Consultar `GET /api/v1/propiedades/{id}/indice` y copiar `puntajeTotal`, `nivelSemaforo` y el `puntaje` de cada categoría en el bloque JSON de su ubicación (§5).
3. Dejar el cálculo del índice como **último paso** de cada propiedad: la búsqueda del §4 guarda lugares en `punto_interes` cada vez que se ejecuta con `propiedadId`, y el cálculo del índice los reemplaza por los suyos.
4. Completar `coherenteConLaZona` (`true` o `false`) y `observaciones` comparando cada sub-puntaje con lo que muestran las respuestas del §5. Por ejemplo, una zona con 5 escuelas a menos de 700 m debería tener educación alta, y una sin paradas de bus cercanas debería tener transporte bajo.

---

## 7. Análisis de coherencia con la zona (sobre los datos de entrada)

- **Distancias correctas.** Las 58 distancias coinciden con el cálculo independiente (§4).
- **Las diferencias entre ubicaciones siguen la geografía.** El Hospital Nacional "Nicolasa Cruz" aparece a 990 m desde la ubicación 1, 1061 m desde la 2 y 562 m desde la 3, y el parque "Central. Park" a 1454 m, 1598 m y 677 m respectivamente. La ubicación 3 es la más cercana a ambos, y eso es lo esperable por su posición.
- **La ubicación 1 es la de mayor densidad de servicios cercanos.** Tiene una escuela (IGER) a 75 m, un comercio (Despensa Familiar) a 91 m y un instituto a 163 m. Su punto débil es salud: el lugar más cercano está a 906 m.
- **La ubicación 3 es la mejor servida en salud** (el más cercano a 476 m y el hospital a 562 m), pero solo 2 de los 5 resultados de educación están dentro de 2000 m; los otros 3 están entre 2150 y 2474 m y el índice los descartaría.
- **Áreas verdes tiene un solo resultado** en las tres ubicaciones probadas (el mismo parque). Con la cantidad objetivo de 2 lugares, la densidad de esta categoría quedaría en 50 %. En otra propiedad del centro de Jalapa, el cálculo del índice (T17) encontró 7 lugares de áreas verdes, lo que sugiere que esta búsqueda por texto se queda corta; el resultado del índice lo confirmará.
- **Transporte mezcla empresas de carga con paradas.** En las ubicaciones 1 y 3, cuatro de los cinco resultados son empresas por su nombre (Transportes J.R, Transportes Unidos Jalapanecos, Guatex, Cargo Expres), y solo "Bus station" corresponde claramente a una parada o terminal. La categoría puede verse mejor de lo que es en la realidad.
- **Educación incluye oficinas administrativas.** En las ubicaciones 1, 2 y 3 aparecen la Dirección Departamental de Educación y la Dirección General de Educación, que no son centros educativos para las familias.

---

## 8. Incidencias y observaciones

1. **El script de datos tenía un filtro incorrecto.** El `SELECT` final buscaba `[PRUEBA T17]%` pero las propiedades se crearon como `[PRUEBA T34]`, por lo que no devolvía ninguna fila. Corregido en `seed-propiedades-reales-t34.sql`.
2. **Radio inconsistente.** La consulta de áreas verdes de la ubicación 1 se ejecutó con `radio=10000`; el resto con 5000. Conviene repetirla con 5000 para que las ubicaciones sean comparables.
3. **Ubicación 2 sin transporte** y **seguridad sin probar** en las tres ubicaciones con respuestas registradas.
4. **Ubicaciones 4 y 5 sin respuestas individuales.** Se registran como equivalentes a las vecinas según lo indicado. Como referencia, la ubicación 4 queda a 150 m del parque "Central. Park" (las ubicaciones 1 a 3 están a 677–1598 m), de modo que la categoría áreas verdes podría variar en esa propiedad.
5. **Posible efecto de coordenadas repetidas de Google.** En una prueba de T17, varios negocios cercanos a la ubicación 5 aparecieron con exactamente las mismas coordenadas (14.632533, -89.993062 y 14.632548, -89.993005), a unos 150 m de esa propiedad. Si Google geolocaliza varios comercios en un mismo punto aproximado, la densidad de comercio puede quedar inflada. Conviene revisarlo cuando se calcule el índice de la ubicación 5.
6. **Muestra concentrada.** Las 5 ubicaciones están a menos de 1.5 km entre sí, dentro del mismo casco urbano. Sirven para comprobar el cálculo, pero no muestran si el índice distingue zonas muy distintas. Sería conveniente agregar una o dos ubicaciones de contraste (por ejemplo, una zona rural y otra de la capital).
7. **La búsqueda del §4 escribe en `punto_interes`** sin borrar los resultados anteriores: ejecutarla varias veces con el mismo `propiedadId` duplica filas. El cálculo del índice los reemplaza, por eso debe ser el último paso.

---

## 9. Conclusiones (parciales)

- La búsqueda de lugares por categoría funciona con ubicaciones reales de Jalapa y devuelve lugares coherentes con la zona: nombres reconocibles y distancias correctas.
- Las diferencias entre ubicaciones siguen la geografía.
- La búsqueda por texto tiene limitaciones de calidad (áreas verdes con un solo resultado, transporte con empresas de carga, educación con oficinas administrativas) que el índice podría reproducir en parte. Se confirmará al comparar con el índice calculado.
- **Pendiente para cerrar T34:** registrar el índice de las 5 propiedades (§5), completar los ids de propiedad, la categoría de seguridad y el transporte de la ubicación 2, y decidir si se agregan ubicaciones de contraste.

---

## 10. Cómo reproducir

1. Cargar las categorías: `scripts/seed-categorias.sql`.
2. Cargar las propiedades de prueba (reemplazar `<usuario>` y `<base>` por los de `backend/.env`):
   ```bash
   docker cp scripts/seed-propiedades-reales-t34.sql postgresDB:/tmp/t34.sql
   docker exec postgresDB psql -U <usuario> -d <base> -f /tmp/t34.sql
   ```
   El script imprime los ids de las propiedades creadas.
3. Ejecutar la búsqueda por categoría (§4) y el cálculo del índice (§6).