/**
 * Katana's Grooming · Citas del CRM → Google Calendar
 *
 * Se instala en la cuenta katanagrooming@gmail.com (script.google.com).
 * Supabase llama a este script cada vez que una cita se crea, cambia de día u hora,
 * cambia de servicio, se cancela o se elimina. El script bloquea ese horario
 * en el calendario principal de la cuenta.
 *
 * Configuración (una sola vez): Configuración del proyecto → Propiedades del script →
 *   CLAVE = la misma clave secreta que se guarda en Supabase (ver README.md).
 */

// Cuánto dura cada cita en el calendario (minutos). El primero que coincida gana.
const DURACIONES = [
  ['hand stripping', 150],
  ['grooming completo', 120],
  ['baño', 90],
];
const DURACION_POR_DEFECTO = 120;
const ZONA = 'America/El_Salvador';

function doPost(e) {
  let datos;
  try {
    datos = JSON.parse(e.postData.contents);
  } catch (err) {
    return respuesta({ ok: false, error: 'json' });
  }
  const clave = PropertiesService.getScriptProperties().getProperty('CLAVE');
  if (!clave || datos.clave !== clave) return respuesta({ ok: false, error: 'clave' });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const cita = datos.cita || {};
    if (!cita.id) return respuesta({ ok: false, error: 'sin cita' });
    if (datos.accion === 'borrar' || cita.estado === 'cancelada') {
      borrarEvento(cita.id);
      return respuesta({ ok: true, accion: 'borrado' });
    }
    const id = guardarEvento(cita);
    return respuesta({ ok: true, accion: 'guardado', evento: id });
  } finally {
    lock.releaseLock();
  }
}

function guardarEvento(cita) {
  const cal = CalendarApp.getDefaultCalendar();
  const props = PropertiesService.getScriptProperties();
  const inicio = fechaHora(cita.fecha, cita.hora);
  const fin = new Date(inicio.getTime() + duracion(cita.servicios) * 60000);
  const servicios = (cita.servicios || []).join(', ') || 'Cita';
  const domicilio = cita.lugar === 'domicilio';
  const titulo = `${domicilio ? 'A domicilio · ' : ''}${cita.perro} · ${servicios}`;
  const notas = [
    cita.cliente ? `Cliente: ${cita.cliente}` : '',
    cita.whatsapp ? `WhatsApp: ${cita.whatsapp}` : '',
    `Servicios: ${servicios}`,
    domicilio ? `A domicilio${cita.direccion ? ': ' + cita.direccion : ''}` : 'En el local',
    cita.estado === 'en_katana' ? 'Estado: en Katana\'s' : cita.estado === 'entregada' ? 'Estado: entregado' : '',
    '',
    'Agendada desde el CRM de Katana\'s. Si cambia la cita en el CRM, este evento se actualiza solo.',
  ].filter((l, i, a) => l !== '' || (i > 0 && a[i - 1] !== '')).join('\n');

  let evento = null;
  const idGuardado = props.getProperty('cita_' + cita.id);
  if (idGuardado) {
    try { evento = cal.getEventById(idGuardado); } catch (err) { evento = null; }
  }
  if (evento) {
    evento.setTime(inicio, fin);
    evento.setTitle(titulo);
    evento.setDescription(notas);
    evento.setLocation(domicilio ? (cita.direccion || '') : '');
  } else {
    evento = cal.createEvent(titulo, inicio, fin, { description: notas, location: domicilio ? (cita.direccion || '') : '' });
    evento.setTag('cita_id', cita.id);
    props.setProperty('cita_' + cita.id, evento.getId());
  }
  // Colores de Google Calendar: '3' = morado (uva), '8' = gris (ya entregado)
  evento.setColor(cita.estado === 'entregada' ? '8' : '3');
  return evento.getId();
}

function borrarEvento(citaId) {
  const props = PropertiesService.getScriptProperties();
  const idGuardado = props.getProperty('cita_' + citaId);
  if (!idGuardado) return;
  try {
    const evento = CalendarApp.getDefaultCalendar().getEventById(idGuardado);
    if (evento) evento.deleteEvent();
  } catch (err) { /* ya no existía */ }
  props.deleteProperty('cita_' + citaId);
}

function duracion(servicios) {
  const texto = (servicios || []).join(' ').toLowerCase();
  for (const [clave, min] of DURACIONES) if (texto.includes(clave)) return min;
  return DURACION_POR_DEFECTO;
}

// "2026-11-28" + "11:00:00" → fecha en la hora de El Salvador
function fechaHora(fecha, hora) {
  const [y, m, d] = String(fecha).split('-').map(Number);
  const [hh, mm] = String(hora || '09:00').split(':').map(Number);
  return Utilities.parseDate(
    `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
    ZONA, 'yyyy-MM-dd HH:mm');
}

function respuesta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Para probar desde el editor: crea un evento de prueba mañana a las 10:00 y lo borra
function probar() {
  const manana = Utilities.formatDate(new Date(Date.now() + 864e5), ZONA, 'yyyy-MM-dd');
  const id = guardarEvento({ id: 'prueba', fecha: manana, hora: '10:00', perro: 'Prueba', servicios: ['Grooming completo'] });
  Logger.log('Evento creado: ' + id);
  borrarEvento('prueba');
  Logger.log('Evento de prueba borrado. Todo funciona.');
}
