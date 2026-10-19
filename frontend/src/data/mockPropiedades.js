// Datos de prueba para el catálogo (T23). Cuando exista el endpoint real
// de búsqueda (HU-20), esto se reemplaza por la respuesta de la API.

const zonas = [
  { zona: "Zona 10", municipio: "Guatemala" },
  { zona: "Zona 15", municipio: "Guatemala" },
  { zona: "Zona 4", municipio: "Jalapa" },
  { zona: "Centro", municipio: "Antigua Guatemala" },
  { zona: "Zona 1", municipio: "Jalapa" },
  { zona: "Zona 16", municipio: "Guatemala" },
];

const tipos = ["Casa", "Apartamento", "Terreno"];

export const mockPropiedades = Array.from({ length: 23 }).map((_, i) => {
  const ubicacion = zonas[i % zonas.length];
  return {
    id: i + 1,
    titulo: `${tipos[i % tipos.length]} en ${ubicacion.zona}`,
    precio: 450000 + (i % 7) * 85000,
    moneda: "Q",
    zona: ubicacion.zona,
    municipio: ubicacion.municipio,
    indice: [92, 78, 55, 40, 88, 63][i % 6],
    foto: `https://picsum.photos/seed/homescope${i + 1}/400/300`,
  };
});