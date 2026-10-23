// Nombres de respaldo por id de la tabla categoria_interes (normalmente el backend ya manda el nombre)
export const NOMBRE_CATEGORIA = {
  1: "Educación",
  2: "Salud",
  3: "Comercio",
  4: "Transporte",
  5: "Áreas verdes",
  6: "Seguridad",
};

const capitalizar = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

export const nombreCategoria = (id, nombreApi) =>
  capitalizar(nombreApi) || NOMBRE_CATEGORIA[id] || `Categoría ${id}`;