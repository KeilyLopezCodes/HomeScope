const BORRADOR_KEY = 'borrador_propiedad_homescope';

export const guardarBorradorLocal = (datos) => {
  try {
    // Excluimos las previsualizaciones de fotos locales antes de guardar
    const { fotos, ...datosSinFotos } = datos;
    localStorage.setItem(BORRADOR_KEY, JSON.stringify(datosSinFotos));
    return true;
  } catch (error) {
    return false;
  }
};

export const obtenerBorradorLocal = () => {
  try {
    const borrador = localStorage.getItem(BORRADOR_KEY);
    return borrador ? JSON.parse(borrador) : null;
  } catch (error) {
    return null;
  }
};

export const limpiarBorradorLocal = () => {
  localStorage.removeItem(BORRADOR_KEY);
};