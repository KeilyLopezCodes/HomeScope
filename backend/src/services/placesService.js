const prisma = require('../config/db');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY ? process.env.GOOGLE_MAPS_API_KEY.trim() : '';

const NEARBY_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const MAX_CONCURRENCIA = 4;   
const MAX_REINTENTOS = 3;
const TIMEOUT_MS = 8000;

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizar = (texto) =>
    (texto || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Esta función permite calcular la distancia a pie en minutos
function calcularDistanciaTiempo(lat1, lon1, lat2, lon2) {
    const radioTierra = 6371000;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanciaMetros = radioTierra * c;

    const tiempoMinutos = Math.max(1, Math.round(distanciaMetros / 80));
    return { distancia_m: distanciaMetros, tiempo_estimado_min: tiempoMinutos };
}

const CONFIG_CATEGORIAS = {
    1: { 
        sinonimos: ['colegio', 'escuela', 'instituto', 'universidad', 'academia'],
        excluirTipos: []
    },
    2: { 
        sinonimos: ['hospital', 'sanatorio', 'puesto de salud', 'centro de salud', 'clinica', 'farmacia', 'dispensario', 'medico'],
        excluirTipos: [],
        prioridad: [
            { nivel: 1, tipos: ['hospital'], nombres: ['hospital', 'sanatorio', 'puesto de salud', 'centro de salud'] },
            { nivel: 2, tipos: ['doctor'], nombres: ['clinica', 'dispensario', 'medico'] }
        ]
    },
    3: {
        sinonimos: ['supermercado', 'tienda', 'mercado', 'banco', 'centro comercial'],
        excluirTipos: []
    },
    4: { 
        sinonimos: ['terminal de buses', 'parada de bus', 'parada de buses', 'estacion de buses', 'microbus'],
        nombres: ['terminal', 'parada', 'estacion de bus', 'buses', 'microbus', 'pullman', 'transportes'],
        excluirNombres: ['carga', 'cargo', 'flete', 'mudanza', 'parqueo', 'guatex', 'paqueteria', 'envios', 'taller'],
        excluirTipos: [],

        exigirNombre: true,
        prioridad: [
            { nivel: 1, tipos: ['bus_station'], nombres: ['terminal de bus', 'parada de bus', 'estacion de bus'] },
            { nivel: 2, tipos: ['transit_station'], nombres: ['microbus'] }
        ]
    },
    5: { 
        sinonimos: ['parque', 'plaza', 'plazuela', 'cancha', 'polideportivo', 'jardin', 'area verde'],
        excluirTipos: ['shopping_mall', 'store', 'supermarket', 'lodging', 'restaurant', 'gas_station', 'bank']
    },
    6: { 
        sinonimos: ['policia', 'pnc', 'subestacion', 'sub estacion', 'comisaria', 'bomberos', 'cbv', 'cbm'],
        excluirTipos: ['gas_station', 'store', 'lodging', 'restaurant'],

        exigirNombre: true
    }
};

function nivelPrioridad(place, config) {
    const niveles = config.prioridad || [];
    const tiposPlace = place.types || [];
    const nombre = normalizar(place.name);
    let mejor = 99;
    for (const n of niveles) {
        const coincide =
            tiposPlace.some((t) => n.tipos.includes(t)) ||
            n.nombres.some((palabra) => nombre.includes(normalizar(palabra)));
        if (coincide && n.nivel < mejor) mejor = n.nivel;
    }
    return mejor;
}

async function consultarGoogle(parametros, etiqueta) {
    const query = new URLSearchParams({ ...parametros, key: GOOGLE_MAPS_API_KEY });
    const url = `${NEARBY_URL}?${query.toString()}`;
    let ultimoError;

    for (let intento = 1; intento <= MAX_REINTENTOS; intento++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
            const response = await fetch(url, { signal: controller.signal });
            const data = await response.json();

            if (data.status === 'OK') return data.results || [];
            if (data.status === 'ZERO_RESULTS') return [];

            const detalle = `Google Places (${etiqueta}) respondió ${data.status}: ${data.error_message || ''}`;

            if (data.status === 'OVER_QUERY_LIMIT' || data.status === 'UNKNOWN_ERROR') {
                ultimoError = new Error(detalle);
                await esperar(500 * 2 ** (intento - 1));
                continue;
            }

            const fatal = new Error(detalle);
            fatal.fatal = true;
            throw fatal;
        } catch (err) {
            if (err.fatal) throw err;
            ultimoError = err; 
            await esperar(500 * 2 ** (intento - 1));
        } finally {
            clearTimeout(timer);
        }
    }
    throw ultimoError || new Error(`Google Places (${etiqueta}) falló sin detalle`);
}


async function ejecutarConLimite(tareas, limite) {
    const resultados = new Array(tareas.length);
    let siguiente = 0;
    async function worker() {
        while (siguiente < tareas.length) {
            const idx = siguiente++;
            try {
                resultados[idx] = { ok: true, valor: await tareas[idx]() };
            } catch (error) {
                resultados[idx] = { ok: false, error };
            }
        }
    }
    await Promise.all(Array.from({ length: Math.min(limite, tareas.length) }, worker));
    return resultados;
}

function esRelevante(place, tiposValidos, sinonimosNorm, config) {
    if (place.business_status === 'CLOSED_PERMANENTLY') return false;
    const tiposPlace = place.types || [];
    const nombre = normalizar(place.name);
    const coincideNombre = sinonimosNorm.some((s) => nombre.includes(s));
    if ((config.excluirNombres || []).some((x) => nombre.includes(x))) return false;

    if (config.exigirNombre) return coincideNombre;                      

    if (tiposPlace.some((t) => tiposValidos.has(t))) return true;         
    if (tiposPlace.some((t) => config.excluirTipos.includes(t))) return false; 
    return coincideNombre;                                                
}

// Función principal
async function obtenerLugaresPorCategoria({ lat, lng, category, radio = 5000, propiedadId }) {
    if (!category || lat === undefined || lat === null || lng === undefined || lng === null) {
        throw new Error('Parámetros incompletos: "category", "lat" y "lng" son obligatorios para realizar la búsqueda.');
    }

    const numLat = Number(lat);
    const numLng = Number(lng);
    if (isNaN(numLat) || isNaN(numLng) || (numLat === 0 && numLng === 0)) {
        throw new Error('Coordenadas inválidas: La latitud y longitud no pueden estar vacías ni ser 0.000000 (propiedad sin ubicación válida).');
    }

    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Configuración incompleta: La clave de Google Maps API (GOOGLE_MAPS_API_KEY) no está configurada en el servidor.');
    }

    const categorias = await prisma.categoria_interes.findMany({
        where: {
            activa: true,
            nombre: {
                contains: category,
                mode: 'insensitive'
            }
        }
    });

    if (!categorias || categorias.length === 0) {
        throw new Error(`No se encontró ninguna categoría activa que coincida con "${category}". Verifique el nombre.`);
    }

    const resultadoPorCategoria = {};
    const location = `${numLat},${numLng}`;

    for (const cat of categorias) {
        const tiposArray = cat.google_place_types
            ? cat.google_place_types.split(',').map((t) => t.trim()).filter(Boolean)
            : [];
        const config = CONFIG_CATEGORIAS[cat.id] || { sinonimos: [], excluirTipos: [] };
        const tiposValidos = new Set(tiposArray);
        const sinonimosNorm = (config.nombres || config.sinonimos).map(normalizar);

        const consultas = [
            ...tiposArray.map((tipo) => ({
                etiqueta: `tipo:${tipo}`,
                params: { location, rankby: 'distance', type: tipo }
            })),
            ...config.sinonimos.map((palabra) => ({
                etiqueta: `keyword:${palabra}`,
                params: { location, rankby: 'distance', keyword: palabra }
            }))
        ];

        const resultados = await ejecutarConLimite(
            consultas.map((c) => () => consultarGoogle(c.params, c.etiqueta)),
            MAX_CONCURRENCIA
        );

        const fallos = resultados.filter((r) => !r.ok);
        const fatal = fallos.find((f) => f.error && f.error.fatal);
        if (fatal) throw fatal.error;
        if (fallos.length === consultas.length) throw fallos[0].error;
        if (fallos.length > 0) {
            console.warn(`[placesService] ${cat.nombre}: ${fallos.length}/${consultas.length} consultas fallaron:`,
                fallos.map((f) => f.error.message));
        }

        const todosLosLugares = resultados.filter((r) => r.ok).flatMap((r) => r.valor);

        const vistos = new Set();
        const lugaresConDistancia = [];

        for (const place of todosLosLugares) {
            if (!place.place_id || !place.geometry || !place.geometry.location || vistos.has(place.place_id)) continue;
            vistos.add(place.place_id);

            if (!esRelevante(place, tiposValidos, sinonimosNorm, config)) continue;

            if (process.env.DEBUG_PLACES === '1') {
                console.log(`[placesService][${cat.nombre}] aceptado: "${place.name}" types=${(place.types || []).join(',')}`);
            }

            const pLat = place.geometry.location.lat;
            const pLng = place.geometry.location.lng;
            const { distancia_m, tiempo_estimado_min } = calcularDistanciaTiempo(numLat, numLng, pLat, pLng);

            if (distancia_m <= radio) {
                lugaresConDistancia.push({
                    google_place_id: place.place_id,
                    nombre: place.name,
                    latitud: pLat,
                    longitud: pLng,
                    distancia_m,
                    tiempo_estimado_min,
                    radio_consulta_m: radio,
                    nivel: nivelPrioridad(place, config) 
                });
            }
        }

        lugaresConDistancia.sort((a, b) =>
            a.nivel - b.nivel ||
            a.distancia_m - b.distancia_m ||
            a.google_place_id.localeCompare(b.google_place_id));
        const topLugares = lugaresConDistancia.slice(0, 5).map(({ nivel, ...resto }) => resto);

        resultadoPorCategoria[cat.nombre.toLowerCase()] = topLugares;

        if (propiedadId && fallos.length === 0) {
            const propId = Number(propiedadId);
            const operaciones = [
                prisma.punto_interes.deleteMany({
                    where: { propiedad_id: propId, categoria_id: cat.id }
                })
            ];
            if (topLugares.length > 0) {
                operaciones.push(
                    prisma.punto_interes.createMany({
                        data: topLugares.map((l) => ({
                            propiedad_id: propId,
                            categoria_id: cat.id,
                            google_place_id: l.google_place_id,
                            nombre: l.nombre,
                            latitud: l.latitud,
                            longitud: l.longitud,
                            distancia_m: l.distancia_m,
                            tiempo_estimado_min: l.tiempo_estimado_min,
                            radio_consulta_m: l.radio_consulta_m
                        })),
                        skipDuplicates: true
                    })
                );
            }
            await prisma.$transaction(operaciones);
        }
    }

    return resultadoPorCategoria;
}

async function buscarLugaresCercanos({ lat, lng, tipos }) {
    if (!GOOGLE_MAPS_API_KEY) throw new Error('GOOGLE_MAPS_API_KEY no configurada');

    const numLat = Number(lat);
    const numLng = Number(lng);
    if (isNaN(numLat) || isNaN(numLng) || (numLat === 0 && numLng === 0)) {
        throw new Error('Coordenadas inválidas para la búsqueda cercana.');
    }

    const location = `${numLat},${numLng}`;
    const unicos = [...new Set(tipos)];

    const resultados = await ejecutarConLimite(
        unicos.map((tipo) => () => consultarGoogle({ location, rankby: 'distance', type: tipo }, `tipo:${tipo}`)),
        MAX_CONCURRENCIA
    );

    const fallo = resultados.find((r) => !r.ok);
    if (fallo) throw fallo.error;

    const vistos = new Set();
    const lugares = [];
    for (const p of resultados.flatMap((r) => r.valor)) {
        if (!p.place_id || !p.geometry || !p.geometry.location || vistos.has(p.place_id)) continue;
        vistos.add(p.place_id);
        lugares.push({
            googlePlaceId: p.place_id,
            nombre: p.name,
            latitud: p.geometry.location.lat,
            longitud: p.geometry.location.lng
        });
    }
    return lugares;
}

module.exports = { obtenerLugaresPorCategoria, buscarLugaresCercanos };