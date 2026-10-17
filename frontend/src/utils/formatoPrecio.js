// El backend devuelve los Decimal como string ("150000"); se formatean según la moneda de la propiedad
export const formatearPrecio = (valor, moneda = 'GTQ') => {
  try {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: moneda }).format(Number(valor));
  } catch {
    return `${moneda} ${Number(valor).toLocaleString('es-GT')}`;
  }
};
