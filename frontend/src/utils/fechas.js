// Fechas en hora de Guatemala (igual que el backend). Los "días" del calendario son cadenas YYYY-MM-DD.
const TZ = 'America/Guatemala';

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const DIAS_CORTOS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']; // lunes primero

export const formatoHora = (iso) =>
  new Date(iso).toLocaleTimeString('es-GT', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });

export const formatoFechaHora = (iso) =>
  new Date(iso).toLocaleString('es-GT', {
    timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });

// Un día YYYY-MM-DD se interpreta a mediodía UTC para que ningún huso lo corra de fecha
const aFechaUtc = (dia) => new Date(`${dia}T12:00:00Z`);

export const formatoDiaLargo = (dia) =>
  aFechaUtc(dia).toLocaleDateString('es-GT', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' });

export const formatoDiaCorto = (dia) =>
  aFechaUtc(dia).toLocaleDateString('es-GT', { timeZone: 'UTC', day: 'numeric', month: 'short' }).replace('.', '');

// Día (YYYY-MM-DD) de un instante, en hora de Guatemala
export const claveDia = (fecha) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(fecha);

export function sumarDias(dia, n) {
  const f = aFechaUtc(dia);
  f.setUTCDate(f.getUTCDate() + n);
  return f.toISOString().slice(0, 10);
}

// Todos los días desde `desde` hasta `hasta` (ambos YYYY-MM-DD, inclusive)
export function rangoDeDias(desde, hasta) {
  const dias = [];
  for (let d = desde; d <= hasta; d = sumarDias(d, 1)) dias.push(d);
  return dias;
}

// Cuadrícula de un mes con el lunes como primer día: arreglo de semanas; cada celda es YYYY-MM-DD o null
export function cuadriculaDelMes(anio, mes) {
  const primero = new Date(Date.UTC(anio, mes, 1, 12));
  const huecos = (primero.getUTCDay() + 6) % 7; // 0 = lunes
  const total = new Date(Date.UTC(anio, mes + 1, 0, 12)).getUTCDate();
  const celdas = [...Array(huecos).fill(null)];
  for (let d = 1; d <= total; d++) celdas.push(`${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  while (celdas.length % 7) celdas.push(null);
  const semanas = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));
  return semanas;
}