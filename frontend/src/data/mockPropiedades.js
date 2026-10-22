// Datos de prueba para el catálogo (T23). Cuando exista el endpoint real
// de búsqueda (HU-20), esto se reemplaza por la respuesta de la API.

const zonas = [
  { zona: "Zona 1", municipio: "Jalapa" },
  { zona: "Zona 2", municipio: "Jalapa" },
  { zona: "Zona 3", municipio: "Jalapa" },
  { zona: "Zona 4", municipio: "Jalapa" },
  { zona: "Centro", municipio: "Jalapa" },
  { zona: "Barrio El Calvario", municipio: "Jalapa" },
  { zona: "Colonia Las Flores", municipio: "Jalapa" },
  { zona: "Zona 1", municipio: "San Pedro Pinula" },
  { zona: "Centro", municipio: "Monjas" },
  { zona: "Zona 2", municipio: "San Luis Jilotepeque" },
];

// Fotos reales de propiedades (Unsplash), unas cuantas por tipo para que
// se vean variadas sin depender de imágenes aleatorias en cada carga.
const fotosPorTipo = {
  Casa: [
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400&h=300&fit=crop",
  ],
  Apartamento: [
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop",
  ],
  Terreno: [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1500829243541-74b677fecc30?w=400&h=300&fit=crop",
  ],
};

const tipos = ["Casa", "Apartamento", "Terreno"];

// Desglosa el índice general en las 4 categorías que pide el comparador
// (T24). Son valores de prueba derivados del índice general, con algo de
// variación para que no se vean todos idénticos.
function desglosarIndice(indice, semilla) {
  const variar = (base, delta) =>
    Math.max(0, Math.min(100, base + (((semilla * 7) % 11) - 5) + delta));

  return {
    ubicacion: variar(indice, 4),
    seguridad: variar(indice, -6),
    servicios: variar(indice, 2),
    transporte: variar(indice, -3),
  };
}

export const mockPropiedades = Array.from({ length: 23 }).map((_, i) => {
  const ubicacion = zonas[i % zonas.length];
  const tipo = tipos[i % tipos.length];
  const fotosDelTipo = fotosPorTipo[tipo];
  const indice = [92, 78, 55, 40, 88, 63][i % 6];

  return {
    id: i + 1,
    titulo: `${tipo} en ${ubicacion.zona}`,
    precio: 350000 + (i % 7) * 65000,
    moneda: "Q",
    zona: ubicacion.zona,
    municipio: ubicacion.municipio,
    indice,
    indiceDesglose: desglosarIndice(indice, i),
    foto: fotosDelTipo[i % fotosDelTipo.length],
  };
});