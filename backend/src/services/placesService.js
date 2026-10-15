const prisma = require('../config/db');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY ? process.env.GOOGLE_MAPS_API_KEY.trim() : '';

//esta funcion permite calcular la distancia a pie en minutos
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

//funcion para obtener los lugares por las categorias 
async function obtenerLugaresPorCategoria({lat, lng, category, radio=5000, propiedadId}) {
    const categorias = await prisma.categoria_interes.findMany({
        where: {
            activa: true,
            nombre: {
                contains: category,
                mode: 'insensitive'
            }
        }
    });
    console.log("Lo que encontró Prisma para la categoría:", category, "-->", categorias);

    const resultadoPorCategoria = {};

    for (const cat of categorias) {
        const keyword = cat.google_place_types.replace(/\|/g, ' OR ');
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?location=${lat},${lng}&radius=${radio}&query=${encodeURIComponent(keyword)}&key=${GOOGLE_MAPS_API_KEY}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            resultadoPorCategoria[cat.nombre.toLowerCase()] = [];

            if (data.results && data.results.length > 0) {
                const topLugares = data.results.slice(0, 5);

                for (const place of topLugares) {
                    const pLat = place.geometry.location.lat;
                    const pLng = place.geometry.location.lng; // CORREGIDO: pLng uniforme
                    const { distancia_m, tiempo_estimado_min } = calcularDistanciaTiempo(Number(lat), Number(lng), pLat, pLng);

                    const lugaresDatos = {
                        google_place_id: place.place_id || 'N/A',
                        nombre: place.name,
                        latitud: pLat,
                        longitud: pLng,
                        distancia_m,
                        tiempo_estimado_min,
                        radio_consulta_m: radio
                    };

                    resultadoPorCategoria[cat.nombre.toLowerCase()].push(lugaresDatos);

                    //si el usuario proporciona una propiedad, guarda en la tabla punto_interes
                    if (propiedadId) {
                        await prisma.punto_interes.create({
                            data: {
                                propiedad_id: Number(propiedadId),
                                categoria_id: cat.id, 
                                google_place_id: lugaresDatos.google_place_id, // CORREGIDO: era lugaresDatos con 's'
                                nombre: lugaresDatos.nombre,
                                latitud: lugaresDatos.latitud,
                                longitud: lugaresDatos.longitud,
                                distancia_m: lugaresDatos.distancia_m,
                                tiempo_estimado_min: lugaresDatos.tiempo_estimado_min,
                                radio_consulta_m: lugaresDatos.radio_consulta_m
                            }
                        }).catch((err) => {
                            console.log(`Aviso al insertar punto de interés para cat ${cat.id}:`, err.message);
                        });
                    }
                }
            }
        } catch (error) {
            console.error(`Error consultando Google Places para categoría ${cat.nombre}:`, error);
        }
    }

    return resultadoPorCategoria;
}

module.exports = { obtenerLugaresPorCategoria };