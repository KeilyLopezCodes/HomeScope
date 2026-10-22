'use strict';

const HORAS = Number(process.env.REMINDER_HORAS || 24);
const INTERVALO_SEG = Number(process.env.REMINDER_INTERVALO_SEG || 60);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const ENVIAR_CORREO = process.env.RECORDATORIO_CORREO !== 'false';

const textoFecha = (f) =>
  f.toLocaleString('es-GT', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Guatemala' });

const escapar = (t) =>
  String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Correo del recordatorio: solo título, fecha y enlace; sin teléfonos ni datos de la otra persona
function correoRecordatorio({ para, nombrePersona, tituloPropiedad, propiedadId, cuando }) {
  const link = `${FRONTEND_URL}/propiedades/${propiedadId}`;
  return {
    para,
    asunto: `Recordatorio de visita: ${tituloPropiedad}`,
    link,
    html: `<p>Hola ${escapar(nombrePersona)},</p>
<p>Te recordamos que tienes una visita programada a <strong>${escapar(tituloPropiedad)}</strong>.</p>
<p><strong>Fecha y hora:</strong> ${escapar(cuando)}</p>
<p><a href="${link}">Ver la propiedad en HomeScope</a></p>
<p>Si ya no puedes asistir, cancela la visita desde la plataforma para avisar a la otra persona.</p>`,
  };
}

function crearRecordatorioService({ repo, notificar, ahora = () => new Date(), horas = HORAS, enviarCorreos = ENVIAR_CORREO }) {
  async function ejecutarUnaVez() {
    const desde = ahora();
    const hasta = new Date(desde.getTime() + horas * 3600000);
    const visitas = await repo.buscarVisitasPorRecordar(desde, hasta);
    let enviados = 0;
    for (const v of visitas) {
      if (!(await repo.reclamarRecordatorio(v.id))) continue; // otro proceso ya lo envió
      const cuando = textoFecha(v.fecha_hora_confirmada);
      const vendedor = v.propiedad.usuario;
      const comprador = v.usuario;
      const nombreComprador = `${comprador.nombre} ${comprador.apellido}`.trim();
      const datosCorreo = (persona) => (enviarCorreos && persona?.correo
        ? { correo: correoRecordatorio({
            para: persona.correo, nombrePersona: persona.nombre,
            tituloPropiedad: v.propiedad.titulo, propiedadId: v.propiedad.id, cuando,
          }) }
        : {});

      await notificar(v.comprador_id, {
        tipo: 'recordatorio_visita', titulo: `Recordatorio: visita a ${v.propiedad.titulo}`,
        contenido: `Tu visita es el ${cuando}.`, referencia_tipo: 'visita', referencia_id: v.id,
      }, datosCorreo(comprador));
      await notificar(v.propiedad.vendedor_id, {
        tipo: 'recordatorio_visita', titulo: `Recordatorio: visita a ${v.propiedad.titulo}`,
        contenido: `${nombreComprador} visitará la propiedad el ${cuando}.`, referencia_tipo: 'visita', referencia_id: v.id,
      }, datosCorreo(vendedor));
      enviados += 1;
    }
    return enviados;
  }
  return { ejecutarUnaVez };
}

let temporizador = null;
function iniciarRecordatorios() {
  if (temporizador || process.env.NODE_ENV === 'test') return;
  const servicio = crearRecordatorioService({
    repo: require('../repositories/agenda.repository'),
    notificar: require('./notificacion.service').notificar,
  });
  let corriendo = false;
  const tick = async () => {
    if (corriendo) return; // si la pasada anterior sigue, se salta esta
    corriendo = true;
    try {
      const n = await servicio.ejecutarUnaVez();
      if (n) console.log(`[recordatorios] ${n} recordatorio(s) de visita enviados`);
    } catch (error) {
      console.error('[recordatorios]', error.message);
    } finally {
      corriendo = false;
    }
  };
  temporizador = setInterval(tick, INTERVALO_SEG * 1000);
  temporizador.unref(); // no impide que el proceso termine
  tick();
}

module.exports = { crearRecordatorioService, iniciarRecordatorios };