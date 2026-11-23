/* Katana's Grooming · Registro de citas
 * Guarda citas y fichas en Supabase. Solo el equipo con sesión iniciada ve los datos.
 */
(() => {
  'use strict';

  // ---------- Opciones ----------
  // Servicios con los nombres que Katana's usa con sus clientes
  // Íconos de las opciones (trazo simple)
  const SVG = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    tijera: SVG('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/>'),
    cepillo: SVG('<path d="M4 14h16v3a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/><path d="M7 14V9M10.5 14V7M14 14V9M17.5 14V7"/>'),
    peine: SVG('<rect x="3" y="5" width="18" height="5" rx="2"/><path d="M6 10v8M9 10v6M12 10v8M15 10v6M18 10v8"/>'),
    gota: SVG('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>'),
    mano: SVG('<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11.5V4a1.5 1.5 0 0 1 3 0v8M14 11.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 5 18.5L3.5 15a1.5 1.5 0 0 1 2.6-1.5L8 16"/>'),
    diente: SVG('<path d="M7 3c-2.5 0-4 2-4 4.5 0 3 1.5 4 2 7S6 21 7.5 21s1.5-4 3-6.5c.5-.8 2.5-.8 3 0C15 17 15 21 16.5 21S18.5 17.5 19 14.5s2-4 2-7C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z"/>'),
    nudo: SVG('<path d="M4 12c4-6 8 6 12 0s4-4 4-4M4 16c4-6 8 6 12 0"/>'),
    pastilla: SVG('<rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-45 12 12)"/><path d="M8.5 8.5l7 7"/>'),
    chispa: SVG('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>'),
    chat: SVG('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12z"/>'),
    tel: SVG('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
    camara: SVG('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5v.01"/>'),
    fb: SVG('<path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V10H6v4h3v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h2z"/>'),
    nota: SVG('<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c0 3 2.5 5 5 5"/>'),
    tienda: SVG('<path d="M4 9l1.5-5h13L20 9M4 9h16v11H4zM4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9M9 20v-6h6v6"/>'),
    ficha: SVG('<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.5-1.5 1.7-2 3-2s2.5.5 3 2M14 10h4M14 13h3"/>'),
    nuevo: SVG('<circle cx="10" cy="8" r="4"/><path d="M3 20c.8-3.5 3.6-5 7-5s4 .5 5 1.5M19 14v6M16 17h6"/>'),
    reloj: SVG('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    mas: SVG('<path d="M12 5v14M5 12h14"/>')
  };
  // Servicios con los nombres que Katana's usa con sus clientes
  const PRINCIPALES = [
    { v: 'Grooming completo', l: 'Grooming completo', d: 'Corte, baño, uñas, orejas', ico: 'tijera' },
    { v: 'Grooming completo de deslanado', l: 'Deslanado', d: 'Grooming sin corte, saca el pelo muerto', ico: 'cepillo' },
    { v: 'Grooming completo pelo corto', l: 'Pelo corto', d: 'Grooming para perros de pelo corto', ico: 'peine' },
    { v: 'Baño completo', l: 'Baño completo', d: 'Baño y corte de uñas', ico: 'gota' },
    { v: 'Hand stripping', l: 'Hand stripping', d: 'Arrancado a mano', ico: 'mano' }
  ];
  const ADICIONALES = [
    { v: 'Limpieza de dientes', l: 'Dientes', ico: 'diente' },
    { v: 'Tratamiento de nudos', l: 'Nudos', ico: 'nudo' },
    { v: 'Baño medicado', l: 'Baño medicado', ico: 'pastilla' },
    { v: 'Ozonoterapia', l: 'Ozonoterapia', ico: 'chispa' }
  ];
  const CANALES = [
    { v: 'WhatsApp', l: 'WhatsApp', ico: 'chat' }, { v: 'Llamada', l: 'Llamada', ico: 'tel' },
    { v: 'Instagram', l: 'Instagram', ico: 'camara' }, { v: 'Facebook', l: 'Facebook', ico: 'fb' },
    { v: 'TikTok', l: 'TikTok', ico: 'nota' }, { v: 'En el local', l: 'En el local', ico: 'tienda' }
  ];
  const TIPOS = [
    { v: 'ficha', l: 'Ya tiene ficha', d: 'Lo buscamos por WhatsApp', ico: 'ficha' },
    { v: 'nuevo', l: 'Cliente nuevo', d: 'Primera vez en Katana\'s', ico: 'nuevo' },
    { v: 'antes', l: 'Cliente de antes', d: 'Ya venía, pero sin ficha', ico: 'reloj' }
  ];
  // Horarios que más se agendan (también se puede escribir otra hora)
  const HORARIOS = ['08:00', '09:00', '10:00', '11:00', '12:00', '12:30', '13:00', '14:00', '15:00', '16:00'];
  const TIPO_LABEL = { ficha: 'Con ficha', nuevo: 'Cliente nuevo', antes: 'Cliente de antes' };
  const ESTADO_LABEL = { agendada: 'Agendada', en_katana: "En Katana's", entregada: 'Entregada', cancelada: 'Cancelada' };
  const TRANQUILO = 'Es tranquilo';
  const FRECUENCIAS = ['Cada 2 semanas', 'Cada mes', 'Cada 2 meses', 'De vez en cuando'];

  // Programa de lealtad Katana's VIP (las reglas de cálculo viven en supabase/amigo_vip.sql)
  const VIP_LANZAMIENTO = '2026-11-23';
  const VIP_DIAS = 30;
  const VIP_HITOS = [3, 5, 7, 10];
  const VIP_PREMIOS = {
    3: 'Regalito sorpresa',
    5: '10% de descuento en el grooming completo',
    7: 'Tratamiento hidratante de manto gratis',
    10: 'Experiencia Spa gratis'
  };

  // ---------- Pasos ----------
  const STEPS = {
    cita: {
      title: '¿Quién viene y qué se hará?',
      fields: [
        { name: 'tipo', label: '¿El perro ya tiene ficha?', type: 'radio', options: TIPOS, cards: true, req: true },
        { name: 'principal', label: 'Servicio', type: 'radio', options: PRINCIPALES, other: true, cards: true, req: true },
        { name: 'adicionales', label: 'Adicionales', type: 'check', options: ADICIONALES, other: true, icons: true }
      ]
    },
    cuando: {
      title: '¿Cuándo?',
      fields: [
        { name: 'fecha', label: 'Día', type: 'date', ui: 'dias', req: true },
        { name: 'hora', label: 'Hora', type: 'time', ui: 'horas', req: true },
        { name: 'canal', label: '¿Por dónde agendó?', type: 'radio', options: CANALES, other: true, icons: true, req: true }
      ],
      after: '<div id="conflicto" class="warn" role="alert" hidden></div>'
    },
    buscar: {
      title: 'Perro con ficha',
      intro: 'Solo lo necesario para encontrarlo.',
      fields: [
        { name: 'wa_b', label: 'WhatsApp del cliente', type: 'tel', req: true },
        { name: 'perro_b', label: 'Nombre del perro', type: 'text', req: true, list: true,
          hint: 'Si el número ya está registrado, aquí te salen sus perros.' }
      ],
      after: '<div id="match" aria-live="polite"></div>',
      tail: [
        { name: 'novedades', label: '¿Hay algo nuevo que anotar?', type: 'textarea',
          hint: 'Cambio de número, alergia nueva, otro estilo de corte. Si no, déjalo en blanco.' }
      ]
    },
    nuevo: {
      title: 'Cliente nuevo',
      fields: [
        { name: 'como_conocio', label: "¿Cómo conoció Katana's?", type: 'radio', other: true,
          options: ['Instagram', 'TikTok', 'Facebook', 'Google', 'Se lo recomendó alguien', 'Pasó por el local'] }
      ]
    },
    antes: {
      title: 'Cliente de antes',
      fields: [
        { name: 'desde_cuando', label: "¿Desde cuándo viene a Katana's?", type: 'radio',
          options: ['Menos de 1 año', 'De 1 a 3 años', 'De 3 a 5 años', 'Más de 5 años'] }
      ]
    },
    cliente: {
      title: 'Datos del cliente',
      fields: [
        { name: 'nombre', label: 'Nombre de la persona encargada', type: 'text', req: true },
        { name: 'whatsapp', label: 'WhatsApp', type: 'tel', req: true },
        { name: 'colonia', label: 'Municipio o colonia', type: 'text', hint: 'Por ejemplo: San Salvador Centro, colonia Escalón.' },
        { name: 'contacto', label: '¿Cómo prefiere que lo contactemos?', type: 'radio',
          options: ['WhatsApp', 'Llamada'] }
      ]
    },
    perro: {
      title: 'El perro',
      fields: [
        { name: 'perro', label: 'Nombre del perro', type: 'text', req: true },
        { name: 'raza', label: 'Raza', type: 'text', hint: 'Si es mestizo, escribe "mestizo".' },
        { name: 'tamano', label: 'Tamaño', type: 'radio',
          options: ['Mini (menos de 5 kg)', 'Pequeño (5 a 10 kg)', 'Mediano (10 a 25 kg)', 'Grande (25 a 40 kg)', 'Gigante (más de 40 kg)'] },
        { name: 'pelo', label: 'Tipo de pelo', type: 'radio', other: true,
          options: ['Corto', 'Largo', 'Rizado', 'Doble capa', 'Duro'] },
        { name: 'sexo', label: 'Sexo', type: 'radio', req: true, options: ['Macho', 'Hembra'] },
        { name: 'esterilizado', label: '¿Está castrado o esterilizado?', type: 'radio', options: ['Sí', 'No', 'No sabe'] },
        { name: 'cumple', label: 'Fecha de nacimiento', type: 'date',
          hint: 'Si el cliente solo sabe la edad, anota una fecha aproximada.' },
        { name: 'frecuencia', label: '¿Cada cuánto debería venir?', type: 'radio', options: FRECUENCIAS,
          hint: 'Con esto le recordamos al cliente cuando le toque volver.' }
      ]
    },
    salud: {
      title: 'Salud y carácter',
      fields: [
        { name: 'vacunas', label: '¿Tiene las vacunas al día?', type: 'radio', options: ['Sí', 'No', 'No sabe'] },
        { name: 'alergias', label: 'Alergias, problemas de piel o medicamentos', type: 'textarea',
          hint: 'Si no tiene, déjalo en blanco.' },
        { name: 'caracter', label: 'Comportamiento durante el baño o el corte', type: 'check', other: true,
          hint: 'Si todavía no lo sabes, déjalo en blanco y complétalo después en "Editar ficha".',
          options: [TRANQUILO, 'Se pone nervioso', 'No le gusta la secadora', 'Es sensible en las patas',
            'Es sensible en las orejas', 'Puede morder si se asusta'] },
        { name: 'notas', label: 'Notas del cliente', type: 'textarea', hint: 'Mañas, lo que le gusta, cómo prefiere el corte.' }
      ]
    }
  };
  const FICHA_STEPS = ['cliente', 'perro', 'salud'];

  // La autorización va en el mensaje de confirmación; si el cliente responde que no, se cambia aquí
  const PERMISOS = [
    { name: 'fotos', label: 'Fotos del perro en redes', type: 'radio', req: true, options: ['Sí', 'No'],
      hint: 'Ponlo en "No" si el cliente respondió que no a la confirmación.' },
    { name: 'recordatorios', label: 'Recordatorios por WhatsApp', type: 'radio', req: true, options: ['Sí', 'No'] }
  ];

  // Campos que se pueden editar en una ficha (todo menos el permiso de uso de datos)
  const EDIT_FICHA = [...STEPS.cliente.fields, ...STEPS.perro.fields, ...STEPS.salud.fields, ...PERMISOS];
  const EDIT_CITA = [...STEPS.cuando.fields, ...STEPS.cita.fields].filter(f => ['fecha', 'hora', 'principal', 'adicionales'].includes(f.name));
  const servicioPrincipal = serv => asList(serv).find(x => PRINCIPALES.some(p => p.v === x)) || asList(serv)[0] || '';
  const serviciosAdicionales = serv => { const p = servicioPrincipal(serv); return asList(serv).filter(x => x !== p); };

  // ---------- Columnas del Excel (clave en la base → título) ----------
  const CITA_COLS = [
    ['creado', 'Registrada el'], ['fecha', 'Fecha de la cita'], ['hora', 'Hora'],
    ['perro', 'Perro'], ['cliente', 'Cliente'], ['whatsapp', 'WhatsApp'], ['servicios', 'Servicios'],
    ['canal', 'Agendó por'], ['tipo', 'Tipo de cliente'], ['estado', 'Estado'],
    ['llegada', 'Llegada'], ['nota_llegada', 'Nota de llegada'], ['salida', 'Salida'], ['nota_salida', 'Nota de entrega'],
    ['novedades', 'Novedades']
  ];
  const FICHA_COLS = [
    ['creada', 'Creada el'], ['actualizada', 'Actualizada el'], ['origen', 'Origen'],
    ['perro', 'Perro'], ['raza', 'Raza'], ['tamano', 'Tamaño'], ['pelo', 'Tipo de pelo'], ['sexo', 'Sexo'],
    ['esterilizado', 'Esterilizado'], ['cumple', 'Cumpleaños'], ['vacunas', 'Vacunas al día'],
    ['alergias', 'Alergias, piel o medicamentos'], ['caracter', 'Carácter en grooming'], ['notas', 'Notas del cliente'],
    ['novedades', 'Novedades'], ['nombre', 'Cliente'], ['whatsapp', 'WhatsApp'],
    ['colonia', 'Municipio o colonia'], ['contacto', 'Contacto preferido'], ['como_conocio', "Cómo conoció Katana's"],
    ['desde_cuando', 'Cliente desde'], ['frecuencia', 'Frecuencia'], ['autoriza', 'Autoriza uso de datos'],
    ['fotos', 'Fotos en redes'], ['recordatorios', 'Recordatorios por WhatsApp']
  ];
  const LIST_KEYS = ['servicios', 'caracter'];
  const STAMP_KEYS = ['creado', 'creada', 'actualizada', 'llegada', 'salida'];
  const BOOL_KEYS = ['autoriza', 'fotos', 'recordatorios'];

  // ---------- Utilidades ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const TEL = /^(\+?503[ -]?)?[267]\d{3}[ -]?\d{4}$/;
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const normWa = s => String(s || '').replace(/\D/g, '').slice(-8);
  const fmtWa = s => { const d = normWa(s); return d.length === 8 ? d.slice(0, 4) + '-' + d.slice(4) : String(s || '').trim(); };
  const norm = s => String(s || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const keyOf = (wa, perro) => normWa(wa) + '|' + norm(perro);
  const asList = v => Array.isArray(v) ? v : String(v || '').split(',').map(s => s.trim()).filter(Boolean);
  const siNo = v => v === true ? 'Sí' : v === false ? 'No' : '';
  const toBool = v => v === 'Sí' ? true : v === 'No' ? false : null;
  const pad = n => String(n).padStart(2, '0');
  const isoLocal = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => isoLocal(new Date());
  const addDays = (iso, n) => { const d = new Date(iso + 'T12:00'); d.setDate(d.getDate() + n); return isoLocal(d); };
  const localDate = ts => isoLocal(new Date(ts));
  const ahoraHHMM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const stamp = iso => {
    const d = new Date(iso);
    if (isNaN(d)) return iso || '';
    return `${isoLocal(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const fmtDay = iso => {
    const d = new Date(iso + 'T12:00');
    return isNaN(d) ? (iso || '') : d.toLocaleDateString('es-SV', { weekday: 'short', day: 'numeric', month: 'short' });
  };
  const fmtLong = iso => {
    const d = new Date(iso + 'T12:00');
    return isNaN(d) ? (iso || '') : d.toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long' });
  };
  const hhmm = t => String(t || '').slice(0, 5);
  const hora12 = h => { const [H, M] = String(h || '').split(':').map(Number); if (isNaN(H)) return h || ''; return new Date(2000, 0, 1, H, M || 0).toLocaleTimeString('es-SV', { hour: 'numeric', minute: '2-digit' }); };
  const horaDe = ts => ts ? new Date(ts).toLocaleTimeString('es-SV', { hour: 'numeric', minute: '2-digit' }) : '';
  const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
  const primerNombre = n => String(n || '').trim().split(/\s+/)[0] || '';
  const listaTxt = arr => { const l = asList(arr).map(x => x.toLowerCase()); return l.length < 2 ? (l[0] || '') : l.slice(0, -1).join(', ') + ' y ' + l[l.length - 1]; };
  const waLink = (num, texto) => `https://wa.me/503${normWa(num)}?text=${encodeURIComponent(texto)}`;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const diaRelativo = f => f === today() ? 'Hoy' : f === addDays(today(), 1) ? 'Mañana' : cap(fmtLong(f));

  const scripts = {};
  const loadScript = src => scripts[src] || (scripts[src] = new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = src; s.onload = ok;
    s.onerror = () => { delete scripts[src]; fail(new Error('No se cargó ' + src)); };
    document.head.appendChild(s);
  }));

  // ---------- Supabase ----------
  const cfg = window.KATANA_CONFIG || {};
  const configured = cfg.supabaseUrl && !cfg.supabaseUrl.includes('TU-PROYECTO') && cfg.supabaseAnonKey && !cfg.supabaseAnonKey.includes('PEGA-AQUI');
  const sb = configured && window.supabase ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  let citas = [];
  let fichas = [];
  let avisos = [];
  let vip = {};      // estado Katana's VIP por ficha_id (vista amigo_vip)
  let canjes = [];   // premios entregados
  const findFicha = (wa, perro) => fichas.find(f => keyOf(f.whatsapp, f.perro) === keyOf(wa, perro));
  const fichaDe = c => (c.ficha_id ? fichas.find(x => x.id === c.ficha_id) : null) || findFicha(c.whatsapp, c.perro) || null;
  const conflictos = (fecha, hora, exceptoId, wa) => citas.filter(c =>
    c.id !== exceptoId && c.estado !== 'cancelada' && c.fecha === fecha && c.hora === hhmm(hora)
    && !(wa && normWa(c.whatsapp) === normWa(wa)));

  async function loadAll() {
    const desde = new Date(Date.now() - 180 * 864e5).toISOString();
    const [f, c, a, v, k] = await Promise.all([
      sb.from('fichas').select('*').order('perro'),
      sb.from('citas').select('*').order('fecha').order('hora'),
      sb.from('avisos').select('*').or(`creado.gte."${desde}",tipo.eq.amigo_vip`),
      sb.from('amigo_vip').select('*'),
      sb.from('canjes').select('*')
    ]);
    for (const r of [f, c, a]) if (r.error) throw r.error;
    fichas = f.data;
    citas = c.data.map(x => ({ ...x, hora: hhmm(x.hora) }));
    avisos = a.data;
    // Si Katana's VIP falla, la agenda sigue funcionando: solo se avisa
    if (v.error || k.error) {
      console.error(v.error || k.error);
      if (isAuthError(v.error || k.error)) throw v.error || k.error;
      toast('No se pudieron cargar los sellos Katana\'s VIP. La agenda funciona igual; toca Actualizar más tarde.');
    } else {
      vip = Object.fromEntries(v.data.map(x => [x.ficha_id, x]));
      canjes = k.data;
    }
    updateCount();
  }

  // Solo recarga los sellos y premios (después de entregar un perro o marcar un premio)
  async function loadVip() {
    const [v, k] = await Promise.all([sb.from('amigo_vip').select('*'), sb.from('canjes').select('*')]);
    if (v.error) throw v.error;
    if (k.error) throw k.error;
    vip = Object.fromEntries(v.data.map(x => [x.ficha_id, x]));
    canjes = k.data;
  }

  // ---------- Katana's VIP ----------
  const VIP_VACIO = { sellos_total: 0, ronda: 1, sellos: 0, ultima_visita: null, vence: null, ultima_sumo: false };
  const vipDe = f => (f && vip[f.id]) || VIP_VACIO;
  const esGroomingCompleto = serv => asList(serv).some(s => norm(s).startsWith('grooming completo'));
  const diasEntre = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);
  // Siempre el dominio publicado: si el equipo abre una vista de prueba de Vercel, el cliente igual recibe un enlace que abre
  const SITIO = 'https://katana-s-client-form.vercel.app';
  const tarjetaUrl = f => `${SITIO}/tarjeta.html?c=${encodeURIComponent(f.codigo)}`;
  const premioTxt = h => VIP_PREMIOS[h];

  // Premios ganados que todavía no se marcan como entregados
  function premiosPendientes(f) {
    if (!f) return [];
    const v = vipDe(f), out = [];
    for (let r = 1; r <= v.ronda; r++) {
      const hasta = r < v.ronda ? 10 : v.sellos;
      for (const h of VIP_HITOS) {
        if (h <= hasta && !canjes.some(k => k.ficha_id === f.id && k.ronda === r && k.hito === h)) out.push({ ronda: r, hito: h });
      }
    }
    return out;
  }

  // Qué va a pasar con la tarjeta cuando se entregue esta cita
  function vipPrevision(c) {
    const f = fichaDe(c);
    if (!f || c.estado === 'entregada' || c.estado === 'cancelada' || c.fecha < VIP_LANZAMIENTO) return null;
    const v = vipDe(f);
    if (!esGroomingCompleto(c.servicios)) return { suma: false, motivo: 'No suma sello: solo cuenta el grooming completo' };
    if (v.ultima_visita === c.fecha && v.ultima_sumo) return { suma: false, motivo: 'Ya sumó su sello de hoy' };
    if (v.ultima_visita && diasEntre(v.ultima_visita, c.fecha) > VIP_DIAS) {
      return { suma: false, motivo: `No suma sello: pasaron ${diasEntre(v.ultima_visita, c.fecha)} días desde su última visita (conserva sus ${v.sellos})` };
    }
    const total = v.sellos_total + 1;
    const sello = (total - 1) % 10 + 1;
    return { suma: true, ronda: Math.floor((total - 1) / 10) + 1, sello, premio: VIP_PREMIOS[sello] ? sello : null };
  }

  // Resumen de la tarjeta para mostrar en la ficha
  function vipResumen(f) {
    const v = vipDe(f);
    if (!v.sellos_total) return 'Katana\'s VIP: sin sellos todavía';
    const ronda = v.ronda > 1 ? ` (tarjeta ${v.ronda})` : '';
    const plazo = v.sellos === 10 ? 'tarjeta completa'
      : v.vence >= today() ? `suma si vuelve antes del ${fmtDay(v.vence)}`
      : 'pasó la fecha: la próxima visita no suma, pero conserva sus sellos';
    return `Katana's VIP: ${v.sellos} de 10 sellos${ronda} · ${plazo}`;
  }

  // Versión corta para listas
  function vipCorto(f) {
    const v = vipDe(f);
    if (v.sellos === 10) return 'tarjeta completa';
    if (!v.vence) return 'sin sellos';
    return v.vence >= today() ? `vuelve antes del ${fmtDay(v.vence)}` : 'pasó su plazo';
  }

  async function marcarPremio(f, p, citaId = null) {
    const { data, error } = await sb.from('canjes').insert({ ficha_id: f.id, ronda: p.ronda, hito: p.hito, cita_id: citaId }).select().single();
    if (error && error.code !== '23505') return false;
    if (data) canjes.push(data);
    return true;
  }

  async function upsertFicha(data) {
    const ex = findFicha(data.whatsapp, data.perro);
    if (ex) {
      // Solo se actualiza lo que se llenó; se conservan el nombre, el origen y lo que ya estaba
      const patch = {};
      for (const [k, v] of Object.entries(data)) {
        if (['perro', 'origen', 'creada', 'autoriza', 'fotos', 'recordatorios'].includes(k)) continue;
        if (v === null || v === '' || (Array.isArray(v) && !v.length)) continue;
        patch[k] = v;
      }
      const { data: row, error } = await sb.from('fichas').update(patch).eq('id', ex.id).select().single();
      if (error) throw error;
      Object.assign(ex, row);
      return { row: ex, existed: true };
    }
    const { data: row, error } = await sb.from('fichas').insert(data).select().single();
    if (error && error.code === '23505') {
      // Alguien la creó desde otro dispositivo: recargamos y actualizamos
      await loadAll();
      return upsertFicha(data);
    }
    if (error) throw error;
    fichas.push(row);
    return { row, existed: false };
  }

  async function insertCita(cita) {
    const { data: row, error } = await sb.from('citas').insert(cita).select().single();
    if (error) throw error;
    row.hora = hhmm(row.hora);
    citas.push(row);
    return row;
  }

  // ---------- Campos (sirven para el formulario y para las ventanas de edición) ----------
  const normOpt = o => typeof o === 'string' ? { v: o, l: o } : o;

  function fieldHTML(f, px = '') {
    const id = `${px}f-${f.name}`;
    const opt = f.req || f.type === 'consent' ? '' : '<span class="opt">opcional</span>';
    const hint = f.hint ? `<p class="hint" id="${px}h-${f.name}">${f.hint}</p>` : '';
    const err = `<p class="err" id="${px}e-${f.name}" hidden></p>`;
    const desc = `aria-describedby="${f.hint ? `${px}h-${f.name} ` : ''}${px}e-${f.name}"`;

    // Día en botones (próximas 2 semanas) u hora en cuadrícula, con campo para escribir otra
    if (f.ui === 'dias' || f.ui === 'horas') {
      const dias = f.ui === 'dias';
      return `<fieldset class="field" data-field="${f.name}" ${desc}>
        <legend>${f.label}</legend>
        <div class="${dias ? 'dias' : 'horas'}" data-${dias ? 'dias' : 'horas'}></div>
        <div class="otra">
          <label for="${id}">${dias ? 'Otra fecha' : 'Otra hora'}</label>
          <input id="${id}" name="${f.name}" type="${f.type}">
        </div>${err}</fieldset>`;
    }
    if (['text', 'tel', 'email', 'date', 'time'].includes(f.type)) {
      const extra = f.type === 'tel' ? 'inputmode="tel" autocomplete="off" placeholder="7123-4567"'
        : f.type === 'email' ? 'autocomplete="off" placeholder="nombre@gmail.com"'
        : f.type === 'text' ? 'autocomplete="off"' : '';
      return `<div class="field" data-field="${f.name}">
        <label for="${id}">${f.label}${opt}</label>${hint}
        <input id="${id}" name="${f.name}" type="${f.type}" ${extra} ${f.list ? `list="${px}dl-${f.name}"` : ''} ${desc}>
        ${f.list ? `<datalist id="${px}dl-${f.name}"></datalist>` : ''}${err}</div>`;
    }
    if (f.type === 'textarea') {
      return `<div class="field" data-field="${f.name}">
        <label for="${id}">${f.label}${opt}</label>${hint}
        <textarea id="${id}" name="${f.name}" rows="3" ${desc}></textarea>${err}</div>`;
    }
    if (f.type === 'consent') {
      return `<fieldset class="field" data-field="${f.name}" ${desc}>
        <legend>${f.label}</legend>
        <label class="consent"><input type="checkbox" name="${f.name}" value="Sí"><span>${f.text}</span></label>${err}</fieldset>`;
    }
    const t = f.type === 'radio' ? 'radio' : 'checkbox';
    if (f.cards) {
      const card = o => `<label class="opt-card"><input type="${t}" name="${f.name}" value="${esc(o.v)}">
        <span class="oc-ico">${IC[o.ico] || IC.mas}</span><span class="oc-txt"><span class="oc-l">${esc(o.l)}</span>${o.d ? `<span class="oc-d">${esc(o.d)}</span>` : ''}</span>
        <span class="oc-check" aria-hidden="true"></span></label>`;
      const otroCard = f.other ? card({ v: '__otro', l: 'Otro', d: 'Escribe cuál', ico: 'mas' }) : '';
      const otroInput = f.other ? `<input class="other" type="text" name="${f.name}__otro" placeholder="¿Cuál?" aria-label="${f.label}: otro" autocomplete="off" hidden>` : '';
      return `<fieldset class="field" data-field="${f.name}" ${desc}>
        <legend>${f.label}${opt}</legend>${hint}
        <div class="cards">${f.options.map(normOpt).map(card).join('')}${otroCard}</div>${otroInput}${err}</fieldset>`;
    }
    const icono = o => f.icons ? `<span class="chip-ico">${IC[o.ico] || IC.mas}</span>` : '';
    const chips = f.options.map(normOpt).map(o =>
      `<label class="chip${f.icons ? ' chip-i' : ''}"><input type="${t}" name="${f.name}" value="${esc(o.v)}"><span>${icono(o)}${esc(o.l)}</span></label>`).join('');
    const other = f.other
      ? `<label class="chip${f.icons ? ' chip-i' : ''}"><input type="${t}" name="${f.name}" value="__otro"><span>${f.icons ? `<span class="chip-ico">${IC.mas}</span>` : ''}Otro</span></label>` : '';
    const otherInput = f.other
      ? `<input class="other" type="text" name="${f.name}__otro" placeholder="¿Cuál?" aria-label="${f.label}: otro" autocomplete="off" hidden>` : '';
    return `<fieldset class="field" data-field="${f.name}" ${desc}>
      <legend>${f.label}${opt}</legend>${hint}
      <div class="chips${f.stack ? ' stack' : ''}">${chips}${other}</div>${otherInput}${err}</fieldset>`;
  }

  const allFields = id => [...STEPS[id].fields, ...(STEPS[id].tail || [])];

  // Botones de día y hora: muestran cuántas citas hay para no chocar
  const citasEn = (fecha, hora) => citas.filter(c => c.estado !== 'cancelada' && c.fecha === fecha && (!hora || c.hora === hora)).length;

  function pintarDias(root = form) {
    const box = root.querySelector('[data-dias]');
    if (!box) return;
    const elegido = getVal('fecha', root);
    const t = today();
    box.innerHTML = Array.from({ length: 14 }, (_, i) => {
      const iso = addDays(t, i);
      const d = new Date(iso + 'T12:00');
      const sem = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : cap(d.toLocaleDateString('es-SV', { weekday: 'short' }).replace('.', ''));
      const n = citasEn(iso);
      const mes = d.toLocaleDateString('es-SV', { month: 'short' }).replace('.', '');
      return `<button type="button" class="dia" data-dia="${iso}" aria-pressed="${iso === elegido}" aria-label="${esc(fmtLong(iso))}${n ? `, ${plural(n, 'cita', 'citas')}` : ''}">
        <span class="dia-sem">${esc(sem)}</span><span class="dia-num">${d.getDate()}</span><span class="dia-mes">${esc(mes)}</span>
        <span class="dia-n" aria-hidden="true">${n ? '•'.repeat(Math.min(n, 4)) : ''}</span></button>`;
    }).join('');
  }

  function pintarHoras(root = form) {
    const box = root.querySelector('[data-horas]');
    if (!box) return;
    const fecha = getVal('fecha', root);
    const elegida = hhmm(getVal('hora', root));
    const ahora = ahoraHHMM();
    box.innerHTML = HORARIOS.map(h => {
      const n = fecha ? citasEn(fecha, h) : 0;
      const paso = fecha === today() && h < ahora;
      return `<button type="button" class="hora${n ? ' ocupada' : ''}${paso ? ' pasada' : ''}" data-hora="${h}" aria-pressed="${h === elegida}" aria-label="${esc(hora12(h))}${n ? `, ya hay ${plural(n, 'cita', 'citas')}` : ''}">
        <span>${esc(hora12(h))}</span>${n ? `<span class="hora-n">${plural(n, 'cita', 'citas')}</span>` : ''}</button>`;
    }).join('');
  }

  // Tocar un día o una hora llena el campo de verdad (el que se guarda)
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-dia], [data-hora]');
    if (!b) return;
    const root = b.closest('form');
    const name = b.dataset.dia ? 'fecha' : 'hora';
    const input = root.querySelector(`[name="${name}"]`);
    input.value = b.dataset.dia || b.dataset.hora;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    pintarDias(root); pintarHoras(root);
    root.querySelector(`[data-${name === 'fecha' ? 'dia' : 'hora'}="${input.value}"]`)?.focus();
  });

  function renderSteps() {
    $('#steps').innerHTML = Object.entries(STEPS).map(([id, s]) => `
      <section class="step" data-step="${id}" hidden>
        <h2 tabindex="-1">${s.title}</h2>
        ${s.intro ? `<p class="intro">${s.intro}</p>` : ''}
        ${s.fields.map(f => fieldHTML(f)).join('')}
        ${s.after || ''}
        ${(s.tail || []).map(f => fieldHTML(f)).join('')}
      </section>`).join('');
  }

  // ---------- Valores y validación ----------
  const form = $('#form');
  const otherText = (name, root = form) => (root.querySelector(`[name="${name}__otro"]`)?.value || '').trim();

  function getVal(name, root = form) {
    const els = $$(`[name="${name}"]`, root);
    if (!els.length) return '';
    const first = els[0];
    if (first.type === 'radio') {
      const c = els.find(i => i.checked);
      if (!c) return '';
      return c.value === '__otro' ? otherText(name, root) : c.value;
    }
    if (first.type === 'checkbox') {
      return els.filter(i => i.checked)
        .map(i => i.value === '__otro' ? otherText(name, root) : i.value)
        .filter(Boolean);
    }
    return first.value.trim();
  }

  function setVal(name, value, root) {
    const els = $$(`[name="${name}"]`, root);
    if (!els.length) return;
    const first = els[0];
    const other = root.querySelector(`[name="${name}__otro"]`);
    if (first.type === 'radio' || first.type === 'checkbox') {
      const wanted = first.type === 'radio' ? (value ? [String(value)] : []) : asList(value);
      const known = els.map(e => e.value);
      els.forEach(e => { e.checked = wanted.includes(e.value); });
      const extra = wanted.filter(v => !known.includes(v));
      if (extra.length && other) {
        els.find(e => e.value === '__otro').checked = true;
        other.value = extra.join(', ');
        other.hidden = false;
      } else if (other) {
        other.value = ''; other.hidden = true;
      }
      return;
    }
    first.value = value ?? '';
  }

  function checkField(f, root = form) {
    const v = getVal(f.name, root);
    const empty = Array.isArray(v) ? v.length === 0 : !v;
    if (f.other && root.querySelector(`[name="${f.name}"][value="__otro"]:checked`) && !otherText(f.name, root)) {
      return 'Escribe cuál es la otra opción.';
    }
    if (f.req && empty) {
      if (f.type === 'radio') return 'Elige una opción.';
      if (f.type === 'check') return 'Elige al menos una opción.';
      if (f.type === 'consent') return 'Para guardar la ficha, el cliente tiene que autorizar el uso de sus datos.';
      return 'Completa este dato.';
    }
    if (f.type === 'tel' && v && !TEL.test(v)) return 'Escribe un número de 8 dígitos, por ejemplo 7123-4567.';
    if (f.type === 'email' && v && !EMAIL.test(v)) return 'Revisa el correo, por ejemplo nombre@gmail.com.';
    return '';
  }

  function showErr(name, msg, root = form, px = '') {
    const p = $(`#${px}e-${name}`);
    const field = root.querySelector(`[data-field="${name}"]`);
    if (!p || !field) return;
    p.textContent = msg;
    p.hidden = !msg;
    field.classList.toggle('invalid', !!msg);
  }

  function validateFields(fields, root = form, px = '') {
    let first = null;
    for (const f of fields) {
      const msg = checkField(f, root);
      showErr(f.name, msg, root, px);
      if (msg && !first) first = f;
    }
    if (first) {
      const el = root.querySelector(`[name="${first.name}__otro"]:not([hidden])`) && !otherText(first.name, root)
        ? root.querySelector(`[name="${first.name}__otro"]`)
        : root.querySelector(`[name="${first.name}"]`);
      el?.focus();
      el?.closest('.field')?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
    return !first;
  }

  function bindFieldEvents(root, px = '', onInput) {
    root.addEventListener('change', e => {
      const t = e.target;
      if (t.type !== 'radio' && t.type !== 'checkbox') return;
      const other = root.querySelector(`[name="${t.name}__otro"]`);
      if (other) {
        const on = !!root.querySelector(`[name="${t.name}"][value="__otro"]:checked`);
        other.hidden = !on;
        if (on && t.value === '__otro') other.focus();
      }
      showErr(t.name, '', root, px);
      onInput?.(t);
    });
    root.addEventListener('input', e => {
      const name = (e.target.name || '').replace(/__otro$/, '');
      const p = $(`#${px}e-${name}`);
      if (p && !p.hidden) showErr(name, '', root, px);
      onInput?.(e.target);
    });
  }

  // Aviso de choque de horario: se muestra una vez; si se vuelve a confirmar, se agenda igual
  let conflictoVisto = '';
  function avisarConflicto(box, fecha, hora, exceptoId, wa) {
    const cf = conflictos(fecha, hora, exceptoId, wa);
    const clave = `${fecha} ${hora}`;
    if (!cf.length || conflictoVisto === clave) { box.hidden = true; return false; }
    conflictoVisto = clave;
    box.textContent = `Ya hay ${cf.length === 1 ? 'otra cita' : cf.length + ' citas'} el ${fmtLong(fecha)} a las ${hora12(hora)}: `
      + cf.map(c => `${c.perro}${c.cliente ? ' (' + c.cliente + ')' : ''}`).join(', ')
      + '. Si igual quieres agendarla a esa hora, vuelve a tocar el botón.';
    box.hidden = false;
    box.scrollIntoView({ block: 'center' });
    return true;
  }

  // ---------- Navegación del formulario ----------
  let idx = 0;

  function path() {
    const t = getVal('tipo');
    if (t === 'ficha') return ['cita', 'cuando', 'buscar'];
    if (t === 'antes') return ['cita', 'cuando', 'antes', ...FICHA_STEPS];
    return ['cita', 'cuando', 'nuevo', ...FICHA_STEPS];
  }

  function show(focus = false) {
    const p = path();
    if (idx > p.length - 1) idx = p.length - 1;
    const id = p[idx];
    $$('.step', form).forEach(s => { s.hidden = s.dataset.step !== id; });
    $('#dots').innerHTML = p.map((_, i) => `<li class="${i < idx ? 'done' : i === idx ? 'now' : ''}"></li>`).join('');
    $('#stepLabel').textContent = `Paso ${idx + 1} de ${p.length}`;
    $('#back').hidden = idx === 0;
    const last = idx === p.length - 1 && !!getVal('tipo');
    $('#next').textContent = last ? 'Guardar cita' : 'Siguiente';
    $('#saveErr').hidden = true;
    if (id === 'buscar') updateMatch();
    if (id === 'cuando') { pintarDias(); pintarHoras(); }
    if (focus) {
      form.scrollIntoView({ block: 'start', behavior: 'auto' });
      $(`.step[data-step="${id}"] h2`).focus({ preventScroll: true });
    }
  }

  let saving = false;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (saving) return;
    const p = path();
    if (!validateFields(allFields(p[idx]))) return;
    if (p[idx] === 'cuando' && avisarConflicto($('#conflicto'), getVal('fecha'), getVal('hora'))) return;
    if (idx < p.length - 1) { idx++; show(true); return; }

    saving = true;
    const btn = $('#next');
    btn.disabled = true;
    btn.textContent = 'Guardando…';
    $('#saveErr').hidden = true;
    try {
      await save();
    } catch (err) {
      console.error(err);
      const box = $('#saveErr');
      box.textContent = isAuthError(err)
        ? 'Tu sesión se cerró. Vuelve a iniciar sesión; lo que llenaste sigue aquí.'
        : 'No se pudo guardar la cita. Revisa tu conexión a internet y vuelve a tocar "Guardar cita".';
      box.hidden = false;
      box.scrollIntoView({ block: 'center' });
    } finally {
      saving = false;
      btn.disabled = false;
      if (!form.hidden) btn.textContent = 'Guardar cita';
    }
  });

  $('#back').addEventListener('click', () => { if (idx > 0) { idx--; show(true); } });

  bindFieldEvents(form, '', t => {
    if (t.name === 'tipo') show();
    if (t.name === 'fecha' || t.name === 'hora') { conflictoVisto = ''; $('#conflicto').hidden = true; pintarDias(); pintarHoras(); }
    if (t.name === 'wa_b' || t.name === 'perro_b') updateMatch();
  });

  // ---------- Buscar ficha ----------
  function alertsFor(f) {
    if (!f) return [];
    const list = asList(f.caracter).filter(c => c !== TRANQUILO);
    if (f.fotos === false) list.push('No publicar fotos');
    if (f.alergias) list.push('Alergias: ' + f.alergias);
    return list;
  }

  function updateMatch() {
    const box = $('#match');
    if (!box) return;
    const wa = normWa(getVal('wa_b'));
    const perros = wa.length === 8 ? fichas.filter(f => normWa(f.whatsapp) === wa) : [];
    $('#dl-perro_b').innerHTML = perros.map(f => `<option value="${esc(f.perro)}">`).join('');

    const perroInput = $('#f-perro_b');
    if (perros.length === 1 && !perroInput.value && document.activeElement !== perroInput && !perroInput.dataset.sinAuto) {
      perroInput.value = perros[0].perro;
    }
    const perro = getVal('perro_b');
    const f = wa.length === 8 && perro ? findFicha(wa, perro) : null;

    if (f) {
      const alerts = alertsFor(f);
      box.innerHTML = `<div class="match">
        <p class="match-label">Ficha encontrada</p>
        <p class="match-name">${esc(f.perro)}</p>
        <p>${esc([f.raza, f.tamano, f.pelo].filter(Boolean).join(' · '))}</p>
        <p>Cliente: ${esc(f.nombre)}</p>
        ${alerts.length ? `<ul class="tags">${alerts.map(a => `<li class="tag alert">${esc(a)}</li>`).join('')}</ul>` : ''}
      </div>`;
    } else if (wa.length === 8 && perro) {
      box.innerHTML = `<p class="match-miss">No encontramos a ${esc(perro)} con ese número. Si nunca se registró, vuelve atrás y elige "Cliente de antes, sin ficha".</p>`;
    } else {
      box.innerHTML = '';
    }
  }

  // ---------- Guardar ----------
  async function save() {
    const tipo = getVal('tipo');
    const base = {
      fecha: getVal('fecha'), hora: getVal('hora'),
      servicios: [getVal('principal'), ...getVal('adicionales')].filter(Boolean), canal: getVal('canal'), tipo
    };
    let note = '';
    let cita;

    if (tipo === 'ficha') {
      const wa = fmtWa(getVal('wa_b'));
      const perro = getVal('perro_b');
      const nov = getVal('novedades');
      const f = findFicha(wa, perro);
      if (f && nov) {
        const novedades = [f.novedades, `${base.fecha}: ${nov}`].filter(Boolean).join('\n');
        const { data: row, error } = await sb.from('fichas').update({ novedades }).eq('id', f.id).select().single();
        if (error) throw error;
        Object.assign(f, row);
        note = 'Las novedades quedaron anotadas en su ficha.';
      }
      if (!f) note = 'Este perro no tiene ficha. La cita quedó guardada igual.';
      cita = await insertCita({
        ...base, ficha_id: f ? f.id : null, whatsapp: wa,
        perro: f ? f.perro : perro, cliente: f ? f.nombre : null, novedades: nov || null
      });
    } else {
      const data = {
        origen: TIPO_LABEL[tipo],
        como_conocio: tipo === 'nuevo' ? getVal('como_conocio') : null,
        desde_cuando: tipo === 'antes' ? getVal('desde_cuando') : null,
        frecuencia: getVal('frecuencia') || null,
        nombre: getVal('nombre'), whatsapp: fmtWa(getVal('whatsapp')),
        colonia: getVal('colonia') || null, contacto: getVal('contacto') || null,
        perro: getVal('perro'), raza: getVal('raza') || null, tamano: getVal('tamano') || null, pelo: getVal('pelo') || null,
        sexo: getVal('sexo'), esterilizado: getVal('esterilizado') || null, cumple: getVal('cumple') || null,
        vacunas: getVal('vacunas') || null, alergias: getVal('alergias') || null, caracter: getVal('caracter'),
        notas: getVal('notas') || null,
        // El uso de datos, las fotos y los recordatorios se aceptan con el mensaje de confirmación
        autoriza: true, fotos: true, recordatorios: true
      };
      const { row, existed } = await upsertFicha(data);
      note = existed ? `${row.perro} ya tenía ficha con ese número: la actualizamos.` : `Ficha de ${row.perro} creada.`;
      cita = await insertCita({ ...base, ficha_id: row.id, whatsapp: row.whatsapp, perro: row.perro, cliente: row.nombre });
    }

    ultimo = {
      tipo, fecha: base.fecha, hora: base.hora, principal: getVal('principal'), adicionales: getVal('adicionales'), canal: getVal('canal'),
      wa_b: tipo === 'ficha' ? getVal('wa_b') : '',
      nombre: getVal('nombre'), whatsapp: getVal('whatsapp'), colonia: getVal('colonia'),
      contacto: getVal('contacto'), como_conocio: getVal('como_conocio'), desde_cuando: getVal('desde_cuando')
    };
    updateCount();
    showDone(cita, note);
  }

  function showDone(c, note) {
    form.hidden = true;
    const done = $('#done');
    $('#doneSummary').textContent = `${c.perro} · ${fmtLong(c.fecha)}, ${hora12(c.hora)}`;
    $('#doneNote').textContent = [asList(c.servicios).join(', '), note].filter(Boolean).join('. ');
    const grupo = pendientes().find(it => it.tipo === 'confirmacion' && (it.citas || []).some(x => x.id === c.id));
    const item = grupo || { tipo: 'confirmacion', cita: c, ficha: fichaDe(c) };
    const wa = c.fecha >= today() && normWa(c.whatsapp).length === 8;
    $('#doneConfirm').hidden = !wa;
    if (wa) {
      const a = $('#doneWa');
      a.href = waLink(c.whatsapp, mensaje(item));
      a.onclick = () => { registrarAviso(item, 'whatsapp', false, false); a.textContent = 'Confirmación enviada'; };
      a.textContent = item.citas?.length > 1 ? `Enviar confirmación de ${perrosDe(item)} por WhatsApp` : 'Enviar confirmación por WhatsApp';
    }
    done.hidden = false;
    window.scrollTo({ top: 0 });
    $('h2', done).focus({ preventScroll: true });
  }

  let ultimo = null;   // cliente de la última cita, para agregar otro perro sin repetir datos

  function resetForm() {
    form.reset();
    delete $('#f-perro_b').dataset.sinAuto;
    $$('.other', form).forEach(o => { o.hidden = true; });
    $$('.err', form).forEach(p => { p.hidden = true; p.textContent = ''; });
    $$('.field.invalid', form).forEach(f => f.classList.remove('invalid'));
    $('#conflicto').hidden = true;
    conflictoVisto = '';
    idx = 0;
    $('#done').hidden = true;
    form.hidden = false;
    show(true);
  }

  $('#again').addEventListener('click', resetForm);
  $('#otroPerro').addEventListener('click', () => {
    if (!ultimo) return;
    const u = ultimo;
    resetForm();
    for (const k of ['fecha', 'hora', 'principal', 'adicionales', 'canal', 'tipo', 'wa_b', 'nombre', 'whatsapp', 'colonia', 'contacto', 'como_conocio', 'desde_cuando']) {
      if (u[k]) setVal(k, u[k], form);
    }
    conflictoVisto = `${u.fecha} ${u.hora}`;
    idx = path().indexOf(u.tipo === 'ficha' ? 'buscar' : 'perro');
    show(true);
    if (u.tipo === 'ficha') { $('#f-perro_b').value = ''; $('#f-perro_b').dataset.sinAuto = '1'; updateMatch(); }
    toast('Copiamos la cita y los datos del cliente. Llena los datos del otro perro; con "Atrás" puedes cambiar el servicio.');
  });
  $('#toRegistros').addEventListener('click', () => { resetForm(); switchTab('registros'); });

  // ---------- Pestañas (con flechas del teclado) ----------
  function teclasPestanas(lista, activar) {
    lista.addEventListener('keydown', e => {
      const tabs = $$('[role="tab"]', lista);
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (n === undefined) return;
      e.preventDefault();
      const t = tabs[(n + tabs.length) % tabs.length];
      t.focus();
      activar(t);
    });
  }

  function marcarPestana(tabs, activa) {
    tabs.forEach(t => {
      const on = t === activa;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
  }

  // ---------- Menú lateral ----------
  const VISTAS = ['hoy', 'mensajes', 'nueva', 'registros', 'vip'];
  const movil = () => matchMedia('(max-width: 899px)').matches;

  function abrirMenu(abrir) {
    const side = $('#side');
    const estaba = side.classList.contains('open');
    if (!abrir && !estaba) return;
    side.classList.toggle('open', abrir);
    $('#scrim').hidden = !abrir;
    // Con el cajón abierto, el resto de la página no recibe foco ni toques
    for (const el of [$('#main'), $('#mbar')]) el.inert = abrir;
    $('#menuBtn').setAttribute('aria-expanded', String(abrir));
    if (abrir) $('.nav-item[aria-current="page"]', side)?.focus();
    else if (movil()) $('#menuBtn').focus({ preventScroll: true });
  }
  $('#menuBtn').addEventListener('click', () => abrirMenu(true));
  $('#sideClose').addEventListener('click', () => abrirMenu(false));
  $('#scrim').addEventListener('click', () => abrirMenu(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#side').classList.contains('open')) abrirMenu(false); });

  function switchTab(which) {
    $$('.nav-item').forEach(b => { if (b.dataset.view === which) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    for (const t of VISTAS) $(`#view-${t}`).hidden = t !== which;
    if (which === 'registros') refresh();
    if (which === 'hoy' || which === 'mensajes') refreshHoy();
    if (which === 'vip') refreshVip();
    if ($('#side').classList.contains('open')) abrirMenu(false);
    window.scrollTo({ top: 0 });
  }
  $('#tabs').addEventListener('click', e => { const b = e.target.closest('[data-view]'); if (b) switchTab(b.dataset.view); });
  document.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) switchTab(b.dataset.go); });

  // ---------- Registros ----------
  let listMode = 'fichas';
  let soloSinFrecuencia = false;

  function elegirLista(b) {
    listMode = b.dataset.list;
    marcarPestana($$('#view-registros .seg-btn'), b);
    renderList();
  }
  $$('#view-registros .seg-btn').forEach(b => b.addEventListener('click', () => elegirLista(b)));
  teclasPestanas($('#view-registros .seg'), elegirLista);

  $('#buscar').addEventListener('input', () => renderList());
  $('#quitarFiltro').addEventListener('click', () => { soloSinFrecuencia = false; renderList(); });

  function updateCount() {
    const n = pendientes().length;
    for (const id of ['#countHoy', '#countMenu']) { $(id).textContent = n; $(id).hidden = n === 0; }
    $('#tab-mensajes').setAttribute('aria-label', n ? `Mensajes, ${plural(n, 'mensaje', 'mensajes')} por enviar` : 'Mensajes');
    $('#menuBtn').setAttribute('aria-label', n ? `Abrir menú (${plural(n, 'mensaje', 'mensajes')} por enviar)` : 'Abrir menú');
  }

  async function refresh() {
    renderRegistros();
    try {
      await loadAll();
      renderRegistros();
    } catch (err) {
      console.error(err);
      toast(isAuthError(err) ? 'Tu sesión se cerró. Vuelve a iniciar sesión.' : 'No se pudieron cargar los registros. Revisa tu conexión y toca "Actualizar".');
    }
  }
  $('#refresh').addEventListener('click', refresh);

  function renderRegistros() {
    $('#regStats').textContent = `${plural(fichas.length, 'perrito', 'perritos')} · ${plural(citas.length, 'cita', 'citas')}`;
    renderMigrate();
    renderList();
    if ($('#perfil').open) renderPerfil();
  }

  function coincide(q, ...campos) {
    if (!q) return true;
    const digitos = q.replace(/\D/g, '');
    return campos.some(c => norm(c).includes(q) || (digitos.length >= 3 && String(c || '').replace(/\D/g, '').includes(digitos)));
  }

  function accionesCita(c) {
    const t = today();
    const b = [];
    if (c.estado === 'agendada' && c.fecha >= t) {
      b.push(`<button type="button" class="link-btn" data-cita="reprogramar" data-id="${esc(c.id)}">Reprogramar</button>`);
      b.push(`<button type="button" class="link-btn" data-cita="cancelar" data-id="${esc(c.id)}">${c.fecha === t ? 'No vino' : 'Cancelar'}</button>`);
      b.push(`<button type="button" class="link-btn danger" data-cita="eliminar" data-id="${esc(c.id)}">Eliminar</button>`);
    }
    if (c.estado === 'cancelada' && c.fecha >= t) {
      b.push(`<button type="button" class="link-btn" data-cita="reactivar" data-id="${esc(c.id)}">Reactivar</button>`);
    }
    // Ya está en Katana's: todavía se puede corregir el servicio antes de entregar
    if (c.estado === 'en_katana') {
      b.push(`<button type="button" class="link-btn" data-cita="reprogramar" data-id="${esc(c.id)}">Cambiar servicio</button>`);
    }
    // Citas que ya pasaron y nadie cerró: sin esto no suman sello Katana's VIP
    if ((c.estado === 'agendada' || c.estado === 'en_katana') && c.fecha < t) {
      b.push(`<button type="button" class="link-btn" data-cita="atendida" data-id="${esc(c.id)}">Sí vino: marcar entregada</button>`);
      b.push(`<button type="button" class="link-btn" data-cita="cancelar" data-id="${esc(c.id)}">No vino</button>`);
    }
    return b.length ? `<div class="row-links">${b.join('')}</div>` : '';
  }

  // Color del cuadro con la inicial: siempre el mismo para cada perrito
  const TONOS = ['t-lila', 't-amarillo', 't-naranja', 't-fondo'];
  const tono = f => TONOS[[...String(f?.id || f?.perro || '')].reduce((n, ch) => n + ch.charCodeAt(0), 0) % TONOS.length];
  const ICO_ALERTA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.01"/></svg>';
  const ICO_FLECHA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';

  // Fondo rojo que aparece al deslizar a la derecha para eliminar
  const ICO_BASURA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';
  const swBg = `<span class="sw-bg" aria-hidden="true">${ICO_BASURA}<span>Eliminar</span></span>`;

  function citaRow(c, { conFecha = false, extra = '' } = {}) {
    const f = fichaDe(c);
    const est = c.estado === 'agendada' ? '' : `<span class="chip-s estado-${esc(c.estado)}">${esc(ESTADO_LABEL[c.estado] || c.estado)}</span>`;
    const cuando = conFecha ? fmtDay(c.fecha) : hora12(c.hora);
    const cuerpo = `<span class="avatar ${tono(f || c)}" aria-hidden="true">${esc(inicial(c.perro))}</span>
      <span class="cita-info">
        <span class="cita-name">${esc(c.perro)}</span>
        <span class="cita-meta">${esc(cuando)} · ${esc(servicioPrincipal(c.servicios))}${c.cliente ? ` · ${esc(primerNombre(c.cliente))}` : ''}</span>
      </span>
      ${est}`;
    const cls = `fila sw-front${c.estado === 'cancelada' ? ' cancelada' : ''}`;
    const frente = f
      ? `<button type="button" class="${cls}" data-perfil="${esc(f.id)}" aria-label="Ver perfil de ${esc(c.perro)}, cita ${esc(fmtDay(c.fecha))} ${esc(hora12(c.hora))}">${cuerpo}<span class="fila-ir">${ICO_FLECHA}</span></button>`
      : `<div class="${cls} sin-ficha">${cuerpo}</div>`;
    return `<li class="sw${extra || !f ? ' sin-cerrar-li' : ''}" data-sw="cita" data-id="${esc(c.id)}"><div class="sw-track">${swBg}${frente}</div>${extra || (!f ? accionesCita(c) : '')}</li>`;
  }

  function perroCard(f) {
    const v = vipDe(f);
    const alerts = alertsFor(f);
    const t = today();
    const prox = citas.filter(c => c.ficha_id === f.id && c.estado === 'agendada' && c.fecha >= t).sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`))[0];
    const ult = citas.filter(c => c.ficha_id === f.id && c.estado === 'entregada').map(c => c.fecha).sort().pop();
    const linea = prox ? `Próxima: ${diaRelativo(prox.fecha) === 'Hoy' || diaRelativo(prox.fecha) === 'Mañana' ? diaRelativo(prox.fecha).toLowerCase() : fmtDay(prox.fecha)}, ${hora12(prox.hora)}`
      : ult ? `Última visita: ${fmtDay(ult)}` : 'Sin visitas todavía';
    return `<li class="sw" data-sw="ficha" data-id="${esc(f.id)}"><div class="sw-track">${swBg}<button type="button" class="perro-card sw-front" data-perfil="${esc(f.id)}" aria-label="Ver perfil de ${esc(f.perro)}">
      <span class="avatar avatar-lg ${tono(f)}" aria-hidden="true">${esc(inicial(f.perro))}</span>
      <span class="perro-info">
        <span class="perro-name">${esc(f.perro)}${alerts.length ? `<span class="alerta-ico" title="${esc(alerts.join(' · '))}">${ICO_ALERTA}</span>` : ''}</span>
        <span class="perro-meta">${esc(f.raza || 'Sin raza')} · ${esc(primerNombre(f.nombre))}</span>
        <span class="perro-meta">${esc(linea)}</span>
        ${v.sellos_total ? `<span class="vip-mini sm">${sellosMini(v.sellos)}</span>` : ''}
      </span>
      ${premiosPendientes(f).length ? '<span class="chip-s premio perro-premio">Premio</span>' : ''}
    </button></div></li>`;
  }

  function renderList() {
    const box = $('#list');
    const q = norm($('#buscar').value);
    $('#filtro').hidden = !(soloSinFrecuencia && listMode === 'fichas');
    if (listMode === 'citas') {
      if (!citas.length) {
        box.innerHTML = `<div class="empty"><p>Todavía no hay citas registradas.</p><button type="button" class="btn btn-primary" data-go="nueva">Registrar una cita</button></div>`;
        return;
      }
      const t = today();
      const key = c => `${c.fecha} ${c.hora}`;
      const lista = citas.filter(c => coincide(q, c.perro, c.cliente, c.whatsapp));
      if (!lista.length) { box.innerHTML = `<div class="empty"><p>Ninguna cita coincide con "${esc($('#buscar').value)}".</p></div>`; return; }
      const prox = lista.filter(c => c.fecha >= t).sort((a, b) => key(a).localeCompare(key(b)));
      const sinCerrar = lista.filter(c => c.fecha < t && (c.estado === 'agendada' || c.estado === 'en_katana')).sort((a, b) => key(b).localeCompare(key(a)));
      const pas = lista.filter(c => c.fecha < t && !sinCerrar.includes(c)).sort((a, b) => key(b).localeCompare(key(a)));
      const dias = [...new Set(prox.map(c => c.fecha))];
      const pasRow = c => citaRow(c, { conFecha: true });
      box.innerHTML =
        (sinCerrar.length ? `<h3 class="group-title alerta-title">Sin cerrar · no suman sello hasta marcarlas</h3><ul class="filas sin-cerrar">${sinCerrar.map(c => citaRow(c, { conFecha: true, extra: fichaDe(c) ? accionesCita(c) : '' })).join('')}</ul>` : '') +
        dias.map(d => `<h3 class="group-title">${esc(diaRelativo(d))}${d > addDays(t, 1) ? '' : ` · <span class="sub-date">${esc(fmtDay(d))}</span>`}</h3>
          <ul class="filas">${prox.filter(c => c.fecha === d).map(c => citaRow(c)).join('')}</ul>`).join('') +
        (pas.length ? `<h3 class="group-title">Pasadas</h3><ul class="filas">${pas.slice(0, 60).map(pasRow).join('')}</ul>` : '');
      return;
    }
    if (!fichas.length) {
      box.innerHTML = `<div class="empty"><p>Los perritos aparecen aquí al registrar su primera cita.</p><button type="button" class="btn btn-primary" data-go="nueva">Registrar una cita</button></div>`;
      return;
    }
    const sorted = [...fichas]
      .filter(f => !soloSinFrecuencia || !f.frecuencia)
      .filter(f => coincide(q, f.perro, f.nombre, f.whatsapp, f.raza))
      .sort((a, b) => norm(a.perro).localeCompare(norm(b.perro)));
    if (!sorted.length) { box.innerHTML = `<div class="empty"><p>Ningún perrito coincide${q ? ` con "${esc($('#buscar').value)}"` : ''}.</p></div>`; return; }
    box.innerHTML = `<ul class="perros">${sorted.map(perroCard).join('')}</ul>`;
  }

  // ---------- Deslizar a la derecha para eliminar ----------
  // Solo se puede eliminar lo que no tiene historial: citas que todavía no pasan (agendadas)
  // y perritos sin citas. Lo demás se cancela o se marca "No vino", para no perder sellos.
  let arrastre = null;
  let anularClic = false;

  function puedeEliminar(tipo, id) {
    if (tipo !== 'cita') return '';
    const c = citas.find(x => x.id === id);
    if (!c) return 'No se encontró la cita.';
    if (c.estado === 'cancelada' || (c.estado === 'agendada' && c.fecha >= today())) return '';
    return 'Esta cita ya pasó o ya se atendió: se guarda en el historial y cuenta para los sellos. Si fue un error, márcala como "No vino". Si es una prueba, elimina al perrito completo.';
  }

  async function eliminarRegistro(tipo, id) {
    const motivo = puedeEliminar(tipo, id);
    if (motivo) { toast(motivo); return false; }
    if (tipo === 'cita') {
      const c = citas.find(x => x.id === id);
      if (!confirm(`¿Eliminar la cita de ${c.perro} del ${fmtDay(c.fecha)}? No se puede deshacer.`)) return false;
      const { data, error } = await sb.from('citas').delete().eq('id', id).select('id');
      if (error || !data?.length) { toast('No se pudo eliminar la cita. Revisa tu conexión.'); return false; }
      citas = citas.filter(x => x.id !== id);
      avisos = avisos.filter(a => a.cita_id !== id);
      try { await loadVip(); } catch { /* se actualiza al recargar */ }
      updateCount(); renderRegistros(); renderHoy();
      toast('Cita eliminada');
      return true;
    }
    const f = fichas.find(x => x.id === id);
    const n = citas.filter(c => c.ficha_id === id).length;
    if (!n) {
      if (!confirm(`¿Eliminar la ficha de ${f.perro}? No se puede deshacer.`)) return false;
    } else {
      // Con historial: confirmación fuerte, escribiendo el nombre
      const escrito = prompt(`${f.perro} tiene ${plural(n, 'cita', 'citas')}. Se borrará con todo su historial y sus sellos, y no se puede deshacer.\n\nPara confirmar, escribe el nombre del perrito: ${f.perro}`);
      if (escrito === null) return false;
      if (norm(escrito) !== norm(f.perro)) { toast('El nombre no coincide. No se eliminó nada.'); return false; }
    }
    const { error } = n
      ? await sb.rpc('eliminar_ficha_completa', { p_ficha: id })
      : await sb.from('fichas').delete().eq('id', id).select('id').then(r => (r.error || !r.data?.length ? { error: r.error || new Error('no borrada') } : r));
    if (error) { toast('No se pudo eliminar. Revisa tu conexión e inténtalo de nuevo.'); return false; }
    fichas = fichas.filter(x => x.id !== id);
    citas = citas.filter(c => c.ficha_id !== id);
    avisos = avisos.filter(a => a.ficha_id !== id);
    canjes = canjes.filter(k => k.ficha_id !== id);
    updateCount(); renderRegistros(); renderHoy();
    toast(n ? `${f.perro} y ${plural(n, 'su cita', 'sus citas')} eliminados` : `Ficha de ${f.perro} eliminada`);
    return true;
  }

  const listaEl = $('#list');
  listaEl.addEventListener('pointerdown', e => {
    const front = e.target.closest('.sw-front');
    if (!front || e.button !== 0 || e.target.closest('.row-links')) return;
    const li = front.closest('.sw');
    arrastre = { li, front, x: e.clientX, y: e.clientY, dx: 0, activo: false, id: e.pointerId };
  });
  listaEl.addEventListener('pointermove', e => {
    if (!arrastre || e.pointerId !== arrastre.id) return;
    const dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y;
    if (!arrastre.activo) {
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { arrastre = null; return; }  // está bajando la lista
      if (dx < 12 || Math.abs(dx) < Math.abs(dy)) return;
      arrastre.activo = true;
      arrastre.front.setPointerCapture(e.pointerId);
      arrastre.li.classList.add('sw-moviendo');
    }
    arrastre.dx = Math.max(0, dx);
    const w = arrastre.front.offsetWidth;
    arrastre.front.style.transform = `translateX(${Math.min(arrastre.dx, w)}px)`;
    arrastre.li.classList.toggle('sw-listo', arrastre.dx > w * 0.35);
  });
  async function soltar(e) {
    if (!arrastre || e.pointerId !== arrastre.id) return;
    const { li, front, dx, activo } = arrastre;
    arrastre = null;
    if (!activo) return;
    anularClic = true;                    // el toque no debe abrir el perfil
    setTimeout(() => { anularClic = false; }, 350);
    li.classList.remove('sw-moviendo');
    const w = front.offsetWidth;
    if (dx > w * 0.35) {
      front.style.transform = `translateX(${w}px)`;
      const ok = await eliminarRegistro(li.dataset.sw, li.dataset.id);
      if (ok) return;                     // la lista ya se volvió a dibujar
    }
    front.style.transform = '';
    li.classList.remove('sw-listo');
  }
  listaEl.addEventListener('pointerup', soltar);
  listaEl.addEventListener('pointercancel', soltar);
  listaEl.addEventListener('click', e => { if (anularClic) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);

  // ---------- Perfil de cada perrito ----------
  let perfilId = null;
  const perfil = $('#perfil');

  function abrirPerfil(id) {
    perfilId = id;
    renderPerfil();
    if (!perfil.open) perfil.showModal();
    perfil.querySelector('.perfil-close')?.focus();
  }

  const dato = (k, v) => v ? `<div class="dato"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>` : '';
  const ICO = {
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M12 11v6M9 14h6"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12z"/></svg>',
    vip: '<svg viewBox="0 0 34 34" fill="currentColor" aria-hidden="true"><ellipse cx="17" cy="22.5" rx="7.5" ry="6.5"/><circle cx="8" cy="14" r="3.3"/><circle cx="13.5" cy="8.5" r="3.3"/><circle cx="20.5" cy="8.5" r="3.3"/><circle cx="26" cy="14" r="3.3"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  function renderPerfil() {
    const f = fichas.find(x => x.id === perfilId);
    const body = $('#perfilBody');
    if (!f) { body.innerHTML = ''; if (perfil.open) perfil.close(); return; }
    const t = today();
    const v = vipDe(f);
    const alerts = alertsFor(f);
    const suyas = citas.filter(c => c.ficha_id === f.id).sort((a, b) => `${b.fecha}${b.hora}`.localeCompare(`${a.fecha}${a.hora}`));
    const futuras = suyas.filter(c => c.fecha >= t && c.estado !== 'cancelada' && c.estado !== 'entregada').reverse();
    const pasadas = suyas.filter(c => !futuras.includes(c));
    const pend = premiosPendientes(f);
    const wa = normWa(f.whatsapp).length === 8;
    const citaItem = c => `<li class="hist">
        <span class="hist-fecha"><span class="hist-dia">${esc(new Date(c.fecha + 'T12:00').getDate())}</span><span class="hist-mes">${esc(new Date(c.fecha + 'T12:00').toLocaleDateString('es-SV', { month: 'short' }).replace('.', ''))}</span></span>
        <span class="hist-info"><span class="hist-serv">${esc(asList(c.servicios).join(', ') || 'Sin servicio')}</span>
          <span class="hist-meta">${esc(hora12(c.hora))} · ${esc(ESTADO_LABEL[c.estado] || c.estado)}${c.nota_salida ? ` · ${esc(c.nota_salida)}` : ''}</span>
          ${accionesCita(c)}</span>
      </li>`;

    body.innerHTML = `
      <div class="perfil-top">
        <button type="button" class="perfil-close" data-p="cerrar" aria-label="Cerrar perfil">${ICO.x}</button>
        <span class="avatar avatar-xl ${tono(f)}" aria-hidden="true">${esc(inicial(f.perro))}</span>
        <h2 id="perfilNombre" class="perfil-nombre">${esc(f.perro)}</h2>
        <p class="perfil-sub">${esc([f.raza, f.tamano, f.sexo].filter(Boolean).join(' · ') || 'Sin datos del perro')}</p>
        ${alerts.length ? `<ul class="perfil-alertas">${alerts.map(a => `<li>${ICO_ALERTA}${esc(a)}</li>`).join('')}</ul>` : ''}
      </div>

      <div class="acciones-ico">
        <button type="button" data-p="nueva">${ICO.cal}<span>Nueva cita</span></button>
        ${wa ? `<a href="${esc(`https://wa.me/503${normWa(f.whatsapp)}`)}" target="_blank" rel="noopener">${ICO.wa}<span>WhatsApp</span></a>` : ''}
        ${wa ? `<a href="${esc(waLink(f.whatsapp, mensaje({ tipo: 'amigo_vip', ficha: f })))}" target="_blank" rel="noopener" data-tarjeta="${esc(f.id)}">${ICO.vip}<span>Tarjeta VIP</span></a>` : ''}
        <button type="button" data-p="editar">${ICO.edit}<span>Editar</span></button>
      </div>

      <section class="perfil-card vip-card" aria-label="Katana's VIP">
        <div class="vip-card-head"><h3>Katana's VIP</h3><p class="vip-count">${v.sellos}<span>/10</span></p></div>
        <div class="vip-mini lg">${sellosMini(v.sellos)}</div>
        <p class="vip-card-txt">${esc(vipCorto(f) === 'sin sellos' ? 'Su tarjeta empieza con su próximo grooming completo.' : cap(vipCorto(f)) + '.')}</p>
        ${pend.map(p => `<div class="premio-pend"><span>${esc(premioTxt(p.hito))}</span><button type="button" class="btn btn-sm btn-primary" data-premio="${esc(f.id)}" data-ronda="${p.ronda}" data-hito="${p.hito}">Marcar entregado</button></div>`).join('')}
      </section>

      ${futuras.length ? `<section class="perfil-sec"><h3>Próximas citas</h3><ul class="hist-list">${futuras.map(citaItem).join('')}</ul></section>` : ''}

      <section class="perfil-sec"><h3>Dueño</h3>
        <dl class="datos">
          ${dato('Nombre', f.nombre)}${dato('WhatsApp', f.whatsapp)}${dato('Colonia', f.colonia)}${dato('Prefiere', f.contacto)}
          ${dato('Viene', f.frecuencia)}${dato('Fotos en redes', siNo(f.fotos))}${dato('Recordatorios', siNo(f.recordatorios))}
        </dl>
      </section>

      <section class="perfil-sec"><h3>Salud y carácter</h3>
        <dl class="datos">
          ${dato('Vacunas al día', f.vacunas)}${dato('Castrado', f.esterilizado)}${dato('Pelo', f.pelo)}${dato('Cumpleaños', f.cumple ? new Date(f.cumple + 'T12:00').toLocaleDateString('es-SV', { day: 'numeric', month: 'long', year: 'numeric' }) : '')}
          ${dato('Alergias', f.alergias)}${dato('Carácter', asList(f.caracter).join(', '))}${dato('Notas', f.notas)}
        </dl>
        ${f.novedades ? `<p class="novedades">${esc(f.novedades)}</p>` : ''}
      </section>

      <section class="perfil-sec"><h3>Historial</h3>
        ${pasadas.length ? `<ul class="hist-list">${pasadas.map(citaItem).join('')}</ul>` : '<p class="mini-empty">Todavía no tiene visitas.</p>'}
      </section>
      <div class="perfil-borrar"><button type="button" class="link-btn danger" data-p="borrar">${suyas.length ? 'Eliminar perrito y su historial' : 'Eliminar ficha'}</button></div>`;
  }

  perfil.addEventListener('click', e => {
    if (e.target === perfil) { perfil.close(); return; }   // toque fuera de la ventana
    const p = e.target.closest('[data-p]');
    const f = fichas.find(x => x.id === perfilId);
    if (p && p.dataset.p === 'cerrar') { perfil.close(); return; }
    if (p && p.dataset.p === 'editar') { abrirEditarFicha(f); return; }
    if (p && p.dataset.p === 'nueva') { perfil.close(); nuevaCitaPara(f); return; }
    if (p && p.dataset.p === 'borrar') { eliminarRegistro('ficha', f.id).then(ok => { if (ok && perfil.open) perfil.close(); }); return; }
    const b = e.target.closest('[data-cita]');
    if (b) { accionCita(b.dataset.cita, b.dataset.id); return; }
    const pr = e.target.closest('[data-premio]');
    if (pr) { accionPremio(pr); return; }
    const tj = e.target.closest('[data-tarjeta]');
    if (tj) tarjetaEnviada(tj.dataset.tarjeta);
  });
  perfil.addEventListener('close', () => { perfilId = null; });

  // Nueva cita ya con el perro elegido (cliente con ficha)
  function nuevaCitaPara(f) {
    if (!f) return;
    switchTab('nueva');
    resetForm();
    setVal('tipo', 'ficha', form);
    setVal('wa_b', f.whatsapp, form);
    $('#f-perro_b').value = f.perro;
    show();
    toast(`Cita para ${f.perro}: elige día, hora y servicio`);
  }

  // Acciones sobre citas (en Registros y en Hoy)
  async function accionCita(act, id) {
    const c = citas.find(x => x.id === id);
    if (!c) return;
    if (act === 'reprogramar') { abrirReprogramar(c); return; }
    if (act === 'cancelar') {
      const pasada = c.fecha <= today();
      if (!confirm(pasada
        ? `¿Marcar que ${c.perro} no vino el ${fmtDay(c.fecha)}? Queda en el historial como cancelada.`
        : `¿Cancelar la cita de ${c.perro} del ${fmtDay(c.fecha)}, ${hora12(c.hora)}? Queda en el historial como cancelada.`)) return;
      await actualizarCita(id, { estado: 'cancelada' }, `Cita de ${c.perro} cancelada`);
      return;
    }
    if (act === 'atendida') {
      if (!confirm(`¿${c.perro} sí vino el ${fmtDay(c.fecha)}? La cita queda como entregada y, si fue grooming completo, cuenta para Katana's VIP.`)) return;
      // Sin hora de salida: así no aparece un "Listo para recoger" atrasado
      const ok = await actualizarCita(id, { estado: 'entregada' }, null);
      if (!ok) return;
      try { await loadVip(); } catch { /* se actualiza al recargar */ }
      updateCount(); renderRegistros(); renderHoy();
      toast(`Cita de ${c.perro} del ${fmtDay(c.fecha)} marcada como entregada`);
      return;
    }
    if (act === 'reactivar') {
      await actualizarCita(id, { estado: 'agendada' }, `Cita de ${c.perro} reactivada`);
      return;
    }
    if (act === 'eliminar') {
      if (!confirm(`¿Eliminar la cita de ${c.perro} del ${fmtDay(c.fecha)}, ${hora12(c.hora)}? Úsalo solo si fue un error al registrarla; no se puede deshacer.`)) return;
      const { data, error } = await sb.from('citas').delete().eq('id', id).select('id');
      if (error || !data?.length) { toast('No se pudo eliminar la cita. Si ya pasó, cancélala en lugar de eliminarla.'); return; }
      citas = citas.filter(x => x.id !== id);
      avisos = avisos.filter(a => a.cita_id !== id);
      updateCount(); renderRegistros(); renderHoy();
      toast('Cita eliminada');
    }
  }

  // Huellitas de la tarjeta en miniatura (10 círculos)
  const sellosMini = n => Array.from({ length: 10 }, (_, i) =>
    `<span class="vip-dot${i < n ? ' on' : ''}${VIP_HITOS.includes(i + 1) ? ' hito' : ''}" aria-hidden="true"></span>`).join('');

  async function accionPremio(b) {
    const f = fichas.find(x => x.id === b.dataset.premio);
    if (!f) return;
    const p = { ronda: Number(b.dataset.ronda), hito: Number(b.dataset.hito) };
    if (!confirm(`¿Ya se le dio a ${f.perro} el premio del sello ${p.hito}: ${premioTxt(p.hito)}?`)) return;
    b.disabled = true;
    const ok = await marcarPremio(f, p);
    b.disabled = false;
    if (!ok) { toast('No se pudo marcar el premio. Revisa tu conexión.'); return; }
    renderRegistros(); renderHoy();
    toast(`Premio de ${f.perro} marcado como entregado`);
  }

  // "Enviar tarjeta" desde la ficha también cuenta como bienvenida enviada
  function tarjetaEnviada(id) {
    const f = fichas.find(x => x.id === id);
    if (f && !avisoDe('amigo_vip', 'whatsapp', { ficha: f })) setTimeout(() => registrarAviso({ tipo: 'amigo_vip', ficha: f }, 'whatsapp', false, false), 300);
  }

  $('#list').addEventListener('click', e => {
    const b = e.target.closest('[data-cita]');
    if (b) { accionCita(b.dataset.cita, b.dataset.id); return; }
    const pr = e.target.closest('[data-premio]');
    if (pr) { accionPremio(pr); return; }
    const tj = e.target.closest('[data-tarjeta]');
    if (tj) { tarjetaEnviada(tj.dataset.tarjeta); return; }
    const pf = e.target.closest('[data-perfil]');
    if (pf) abrirPerfil(pf.dataset.perfil);
  });

  // ---------- Ventana para reprogramar citas y editar fichas ----------
  const sheet = $('#sheet');
  const sheetForm = $('#sheetForm');
  let sheetModo = null;   // { tipo: 'cita' | 'ficha', obj }

  function abrirSheet(titulo, campos, valores, modo) {
    sheetModo = { ...modo, campos };
    $('#sheetTitle').textContent = titulo;
    $('#sheetBody').innerHTML = campos.map(f => fieldHTML(f, 'x')).join('')
      + (modo.tipo === 'cita' ? '<div id="xconflicto" class="warn" role="alert" hidden></div>' : '');
    for (const f of campos) setVal(f.name, valores[f.name], sheetForm);
    pintarDias(sheetForm); pintarHoras(sheetForm);
    $('#sheetErr').hidden = true;
    conflictoVisto = '';
    const sinCitas = modo.tipo === 'ficha' && !citas.some(c => c.ficha_id === modo.obj.id);
    $('#sheetDelete').hidden = !sinCitas;
    $('#sheetSave').disabled = false;
    $('#sheetSave').textContent = 'Guardar cambios';
    sheet.showModal();
    sheet.querySelector('input, textarea')?.focus();
  }

  bindFieldEvents(sheetForm, 'x', t => {
    if (t.name === 'fecha' || t.name === 'hora') { conflictoVisto = ''; const b = $('#xconflicto'); if (b) b.hidden = true; pintarDias(sheetForm); pintarHoras(sheetForm); }
  });
  $('#sheetClose').addEventListener('click', () => sheet.close());
  $('#sheetCancel').addEventListener('click', () => sheet.close());

  function abrirReprogramar(c) {
    abrirSheet(`Reprogramar la cita de ${c.perro}`, EDIT_CITA,
      { fecha: c.fecha, hora: c.hora, principal: servicioPrincipal(c.servicios), adicionales: serviciosAdicionales(c.servicios) }, { tipo: 'cita', obj: c });
  }

  function abrirEditarFicha(f) {
    if (!f) return;
    const valores = { ...f, fotos: siNo(f.fotos), recordatorios: siNo(f.recordatorios) };
    abrirSheet(`Ficha de ${f.perro}`, EDIT_FICHA, valores, { tipo: 'ficha', obj: f });
  }

  function sheetError(msg) {
    const p = $('#sheetErr');
    p.textContent = msg;
    p.hidden = !msg;
    if (msg) p.scrollIntoView({ block: 'center' });
  }

  sheetForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!sheetModo || !validateFields(sheetModo.campos, sheetForm, 'x')) return;
    const btn = $('#sheetSave');
    sheetError('');
    if (sheetModo.tipo === 'cita') {
      const c = sheetModo.obj;
      const fecha = getVal('fecha', sheetForm), hora = getVal('hora', sheetForm);
      if (avisarConflicto($('#xconflicto'), fecha, hora, c.id, c.whatsapp)) return;
      btn.disabled = true; btn.textContent = 'Guardando…';
      const cambioHorario = fecha !== c.fecha || hora !== c.hora;
      const servicios = [getVal('principal', sheetForm), ...getVal('adicionales', sheetForm)].filter(Boolean);
      const ok = await actualizarCita(c.id, { fecha, hora, servicios }, null);
      if (!ok) { btn.disabled = false; btn.textContent = 'Guardar cambios'; sheetError('No se pudo guardar el cambio. Revisa tu conexión e intenta de nuevo.'); return; }
      sheet.close();
      if (cambioHorario) {
        // La confirmación anterior ya no sirve: se borra para que aparezca de nuevo en Hoy
        await sb.from('avisos').delete().eq('cita_id', c.id).in('tipo', ['confirmacion', 'dia_antes']);
        avisos = avisos.filter(a => !(a.cita_id === c.id && ['confirmacion', 'dia_antes'].includes(a.tipo)));
        updateCount(); renderRegistros(); renderHoy();
        toast(`Cita reprogramada (${fmtDay(fecha)}, ${hora12(hora)}). Envía la nueva confirmación desde Hoy.`);
      } else {
        toast('Cita actualizada');
      }
      return;
    }
    // Ficha
    const f = sheetModo.obj;
    const v = n => getVal(n, sheetForm);
    const data = {
      nombre: v('nombre'), whatsapp: fmtWa(v('whatsapp')), colonia: v('colonia') || null,
      contacto: v('contacto') || null, perro: v('perro'), raza: v('raza') || null, tamano: v('tamano') || null, pelo: v('pelo') || null, sexo: v('sexo'),
      esterilizado: v('esterilizado') || null, cumple: v('cumple') || null, frecuencia: v('frecuencia') || null,
      vacunas: v('vacunas') || null, alergias: v('alergias') || null, caracter: v('caracter'), notas: v('notas') || null,
      fotos: toBool(v('fotos')), recordatorios: toBool(v('recordatorios'))
    };
    btn.disabled = true; btn.textContent = 'Guardando…';
    const { data: row, error } = await sb.from('fichas').update(data).eq('id', f.id).select().single();
    if (error) {
      btn.disabled = false; btn.textContent = 'Guardar cambios';
      sheetError(error.code === '23505'
        ? `Ya hay otro perro llamado ${data.perro} con el WhatsApp ${data.whatsapp}.`
        : 'No se pudo guardar la ficha. Revisa tu conexión e intenta de nuevo.');
      return;
    }
    Object.assign(f, row);
    // Las citas guardan una copia del nombre y el número: se actualizan para que todo coincida
    await sb.from('citas').update({ perro: row.perro, cliente: row.nombre, whatsapp: row.whatsapp }).eq('ficha_id', f.id);
    citas.filter(c => c.ficha_id === f.id).forEach(c => Object.assign(c, { perro: row.perro, cliente: row.nombre, whatsapp: row.whatsapp }));
    sheet.close();
    updateCount(); renderRegistros(); renderHoy();
    toast(`Ficha de ${row.perro} guardada`);
  });

  $('#sheetDelete').addEventListener('click', async () => {
    const f = sheetModo?.obj;
    if (!f || !confirm(`¿Eliminar la ficha de ${f.perro}? Solo se puede porque no tiene citas. No se puede deshacer.`)) return;
    const { data, error } = await sb.from('fichas').delete().eq('id', f.id).select('id');
    if (error || !data?.length) { sheetError('No se pudo eliminar. Si la ficha ya tiene citas, no se puede borrar.'); return; }
    fichas = fichas.filter(x => x.id !== f.id);
    sheet.close();
    updateCount(); renderRegistros(); renderHoy();
    toast(`Ficha de ${f.perro} eliminada`);
  });

  // ---------- Excel (la librería se carga solo al exportar) ----------
  function toRow(obj, cols) {
    return cols.map(([k]) => {
      let v = obj[k];
      if (LIST_KEYS.includes(k)) v = asList(v).join(', ');
      if (BOOL_KEYS.includes(k)) v = siNo(v);
      if (k === 'tipo') v = TIPO_LABEL[v] || v;
      if (k === 'estado') v = ESTADO_LABEL[v] || v;
      if (STAMP_KEYS.includes(k)) v = v ? stamp(v) : '';
      return v ?? '';
    });
  }

  function sheetXlsx(rows, cols) {
    const ws = XLSX.utils.aoa_to_sheet([cols.map(c => c[1]), ...rows.map(r => toRow(r, cols))]);
    ws['!cols'] = cols.map(([k, label]) => {
      const longest = Math.max(label.length, ...rows.map(r => String(toRow(r, [[k]])[0]).length));
      return { wch: Math.min(Math.max(longest + 2, 10), 48) };
    });
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: cols.length - 1 } }) };
    return ws;
  }

  // Hoja "Katana's VIP": una fila por perro, armada con los datos reales (nadie la llena a mano)
  const VIP_COLS = [
    ['perro', 'Perro'], ['nombre', 'Tutor'], ['whatsapp', 'WhatsApp'], ['vip_tarjeta', 'Tarjeta n.º'],
    ['vip_sellos', 'Sellos (de 10)'], ['vip_total', 'Sellos acumulados'], ['vip_ultima', 'Última visita que cuenta'],
    ['vip_vence', 'Suma si vuelve antes del'], ['vip_proximo', 'Próximo premio'], ['vip_pendientes', 'Premios por entregar'],
    ['vip_entregados', 'Premios entregados'], ['vip_sin_sello', 'Visitas que no sumaron'], ['vip_enlace', 'Enlace de la tarjeta']
  ];
  function filaVip(f) {
    const v = vipDe(f);
    const prox = VIP_HITOS.find(h => h > v.sellos);
    return {
      perro: f.perro, nombre: f.nombre, whatsapp: f.whatsapp,
      vip_tarjeta: v.ronda, vip_sellos: v.sellos, vip_total: v.sellos_total,
      vip_ultima: v.ultima_visita || '', vip_vence: v.vence || '',
      vip_proximo: prox ? `Sello ${prox}: ${premioTxt(prox)}` : 'Tarjeta completa',
      vip_pendientes: premiosPendientes(f).map(p => premioTxt(p.hito)).join(', '),
      vip_entregados: canjes.filter(k => k.ficha_id === f.id).length,
      vip_sin_sello: v.visitas_sin_sello || 0,
      vip_enlace: tarjetaUrl(f)
    };
  }

  $('#export').addEventListener('click', async () => {
    const btn = $('#export');
    btn.disabled = true; btn.textContent = 'Preparando…';
    try {
      try { await loadScript('vendor/xlsx-mini-0.18.5.min.js'); } catch { toast('No se pudo preparar el Excel. Revisa tu conexión e intenta de nuevo.'); return; }
      try { await loadAll(); } catch { toast('No se pudieron cargar los datos más recientes. Revisa tu conexión.'); return; }
      if (!citas.length && !fichas.length) { toast('Todavía no hay registros para descargar.'); return; }
      const sortedCitas = [...citas].sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
      const sortedFichas = [...fichas].sort((a, b) => norm(a.perro).localeCompare(norm(b.perro)));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, sheetXlsx(sortedCitas, CITA_COLS), 'Citas');
      XLSX.utils.book_append_sheet(wb, sheetXlsx(sortedFichas, FICHA_COLS), 'Fichas');
      XLSX.utils.book_append_sheet(wb, sheetXlsx(sortedFichas.map(filaVip), VIP_COLS), 'Katana\'s VIP');
      XLSX.writeFile(wb, `Katanas_Grooming_Citas_y_Clientes_${today()}.xlsx`);
      renderRegistros();
      toast('Excel descargado');
    } finally {
      btn.disabled = false; btn.textContent = 'Descargar Excel';
    }
  });

  // ---------- Registros guardados solo en este dispositivo (versión anterior) ----------
  const OLD = { citas: 'katana.citas.v1', fichas: 'katana.fichas.v1' };
  const readOld = k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };

  function renderMigrate() {
    const oc = readOld(OLD.citas), of = readOld(OLD.fichas);
    const box = $('#migrate');
    if (!oc.length && !of.length) { box.hidden = true; return; }
    $('#migrateText').textContent = `Este dispositivo tiene ${plural(oc.length, 'cita', 'citas')} y ${plural(of.length, 'ficha', 'fichas')} de la versión anterior que todavía no están en la base de datos.`;
    box.hidden = false;
  }

  $('#migrateBtn').addEventListener('click', async () => {
    const btn = $('#migrateBtn');
    btn.disabled = true;
    btn.textContent = 'Subiendo…';
    try {
      await loadAll();
      const byKey = {};
      for (const o of readOld(OLD.fichas)) {
        const data = {
          origen: o.origen || null, perro: o.perro, raza: o.raza || null, tamano: o.tamano || null, pelo: o.pelo || null,
          sexo: o.sexo || null, esterilizado: o.esterilizado || null, cumple: o.cumple || null, vacunas: o.vacunas || null,
          alergias: o.alergias || null, caracter: asList(o.caracter), notas: o.notas || null, novedades: o.novedades || null,
          nombre: o.nombre, whatsapp: fmtWa(o.whatsapp), correo: o.correo || null, colonia: o.colonia || null,
          contacto: o.contacto || null, como_conocio: o.comoConocio || null, desde_cuando: o.desdeCuando || null,
          frecuencia: o.frecuencia || null, autoriza: o.autoriza === 'Sí', fotos: toBool(o.fotos), recordatorios: toBool(o.recordatorios)
        };
        if (o.creada) data.creada = o.creada;
        const existing = findFicha(data.whatsapp, data.perro);
        const { row } = existing ? { row: existing } : await upsertFicha(data);
        byKey[keyOf(row.whatsapp, row.perro)] = row;
      }
      const oldCitas = readOld(OLD.citas);
      const rows = oldCitas.map(o => {
        const f = byKey[keyOf(o.whatsapp, o.perro)] || findFicha(o.whatsapp, o.perro);
        return {
          creado: o.creado || undefined, fecha: o.fecha, hora: o.hora, perro: o.perro,
          cliente: o.cliente || (f ? f.nombre : null), whatsapp: fmtWa(o.whatsapp), servicios: asList(o.servicios),
          canal: o.canal || null, tipo: o.tipo, novedades: o.novedades || null, ficha_id: f ? f.id : null
        };
      });
      if (rows.length) {
        const { error } = await sb.from('citas').insert(rows);
        if (error) throw error;
      }
      try {
        localStorage.setItem('katana.respaldo.v1', JSON.stringify({ citas: oldCitas, fichas: readOld(OLD.fichas) }));
        localStorage.removeItem(OLD.citas);
        localStorage.removeItem(OLD.fichas);
      } catch { /* sin almacenamiento */ }
      await loadAll();
      renderRegistros();
      toast('Registros subidos a la base de datos');
    } catch (err) {
      console.error(err);
      toast('No se pudieron subir los registros. Revisa tu conexión e intenta de nuevo.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Subir a la base de datos';
    }
  });

  // ---------- Hoy: check-in, check-out y mensajes ----------
  const FREC_DIAS = { 'Cada 2 semanas': 14, 'Cada mes': 30, 'Cada 2 meses': 60 };
  const TIEMPO_TXT = { 14: 'pasaron dos semanas', 30: 'pasó un mes', 60: 'pasaron dos meses' };
  const TIPO_AVISO = { listo: 'Listo para recoger', dia_antes: 'Cita de mañana', confirmacion: 'Confirmación de cita', toca_volver: 'Le toca volver', amigo_vip: 'Bienvenida Katana\'s VIP' };
  const ORDEN_AVISO = { listo: 0, dia_antes: 1, confirmacion: 2, toca_volver: 3, amigo_vip: 4 };

  const listaPerros = fs => { const l = fs.map(x => x.perro); return l.length < 2 ? l[0] : l.slice(0, -1).join(', ') + ' y ' + l[l.length - 1]; };
  const perrosDe = item => { const l = (item.citas || [item.cita]).map(c => c.perro); return l.length < 2 ? l[0] : l.slice(0, -1).join(', ') + ' y ' + l[l.length - 1]; };
  const conPunto = t => t.endsWith('.') ? t : t + '.';
  const esPrimeraVez = item => (item.citas || [item.cita]).some(c => c.tipo === 'nuevo' || c.tipo === 'antes');

  // Textos para el cliente. *texto* sale en negrita en WhatsApp.
  function mensaje(item) {
    const c = item.cita, f = item.ficha;
    const nombre = primerNombre(c?.cliente || f?.nombre);
    const hola = nombre ? `¡Hola, ${nombre}!` : '¡Hola!';
    if (item.tipo === 'confirmacion') {
      const lineas = [
        conPunto(`Será un placer atender a ${perrosDe(item)} el ${fmtLong(c.fecha)} a las ${hora12(c.hora)}`),
        'El servicio de grooming tiene una duración aproximada de 2 a 3 horas, dependiendo del comportamiento de su mascota.',
        '*Le informamos que no se permite esperar a su mascota en nuestro local.*',
        'Si desea cancelar su cita, por favor háganoslo saber con al menos 1 hora de anticipación para permitir la liberación del espacio.',
        '*En caso de no presentarse a la cita después de 15 minutos, lamentablemente no podremos recibir a su mascota.*',
        '*Si no recoge a su mascota dentro de 1 hora después de notificarle que está lista, se aplicará un recargo de $1 por hora.*'
      ];
      if (esPrimeraVez(item)) {
        lineas.push("Al confirmar su cita, nos autoriza a compartir fotos de su mascota en nuestras redes sociales, a guardar sus datos para agendar sus citas y a enviarle recordatorios por WhatsApp. Si no está de acuerdo con alguno, háganoslo saber por aquí.");
      }
      return lineas.join('\n\n');
    }
    if (item.tipo === 'dia_antes') {
      const cuando = item.atrasado ? `hoy a las ${hora12(c.hora)}` : `mañana, ${fmtLong(c.fecha)}, a las ${hora12(c.hora)}`;
      return `${hola} Le recordamos que ${cuando} esperamos a ${perrosDe(item)} en Katana's Grooming. Si no puede asistir, por favor háganoslo saber con al menos 1 hora de anticipación.`;
    }
    if (item.tipo === 'listo') {
      const varios = (item.citas || []).length > 1;
      const base = `${hola} ${perrosDe(item)} ya ${varios ? 'están listos y le esperan' : 'está listo y le espera'} en Katana's Grooming. Le recordamos que, pasada 1 hora, se aplica un recargo de $1 por hora.`;
      const vipLineas = (item.citas || [c]).map(lineaVipListo).filter(Boolean);
      return [base, ...vipLineas].join('\n\n');
    }
    if (item.tipo === 'amigo_vip' && item.fichas?.length > 1) {
      const nombres = listaPerros(item.fichas);
      const lineas = [
        `${hola} ${nombres} ya son parte de *Katana's VIP*, nuestro programa de lealtad. Cada uno tiene su propia tarjeta.`,
        'Cada grooming completo suma un sello si vuelve dentro de los 30 días después de su visita anterior. En la visita 3 recibe un regalito sorpresa; en la 5, un 10% de descuento; en la 7, un tratamiento hidratante de manto gratis, y en la 10, una experiencia spa gratis.',
        ...item.fichas.map(x => {
          const v = vipDe(x);
          const regalo = v.sellos_total === 1 && v.ultima_visita && v.ultima_visita < VIP_LANZAMIENTO ? ' (de regalo por su visita de noviembre)' : '';
          const plazo = v.vence && v.vence >= today() && v.sellos < 10 ? ` Para que su próxima visita sume, reserve antes del ${fmtLong(v.vence)}.` : '';
          return `*${x.perro}*: ${plural(v.sellos, 'sello', 'sellos')}${regalo}.${plazo} Su tarjeta: ${tarjetaUrl(x)}`;
        })
      ];
      return lineas.join('\n\n');
    }
    if (item.tipo === 'amigo_vip') {
      const v = vipDe(f);
      const inicio = v.sellos_total === 1 && v.ultima_visita && v.ultima_visita < VIP_LANZAMIENTO
        ? `${f.perro} ya es parte de *Katana's VIP*, nuestro programa de lealtad. Por su visita de noviembre, le regalamos su primer sello.`
        : v.sellos_total
          ? `${f.perro} es parte de *Katana's VIP*, nuestro programa de lealtad, y lleva ${plural(v.sellos, 'sello', 'sellos')} de 10.`
          : `${f.perro} ya es parte de *Katana's VIP*, nuestro programa de lealtad. Su tarjeta empieza a llenarse con su próximo grooming completo.`;
      const lineas = [
        `${hola} ${inicio}`,
        'Cada grooming completo suma un sello si vuelve dentro de los 30 días después de su visita anterior. En la visita 3 recibe un regalito sorpresa; en la 5, un 10% de descuento; en la 7, un tratamiento hidratante de manto gratis, y en la 10, una experiencia spa gratis.',
        `Aquí puede ver su tarjeta: ${tarjetaUrl(f)}`
      ];
      if (v.vence && v.vence >= today() && v.sellos < 10) lineas.push(`Para que su próxima visita sume, reserve antes del ${fmtLong(v.vence)}.`);
      return lineas.join('\n\n');
    }
    return `${hola} Ya ${TIEMPO_TXT[item.dias] || 'pasó un tiempo'} desde la última visita de ${f.perro} a Katana's Grooming. ¿Le agendamos la próxima? Respóndanos con el día y la hora que le quedan mejor.`;
  }

  // Línea de Katana's VIP en el mensaje "Listo para recoger" (después de entregar, con los sellos ya sumados)
  function lineaVipListo(c) {
    const f = fichaDe(c);
    if (!f || c.fecha < VIP_LANZAMIENTO || !esGroomingCompleto(c.servicios)) return '';
    const v = vipDe(f);
    if (v.ultima_visita !== c.fecha) return '';
    const enlace = `Vea su tarjeta: ${tarjetaUrl(f)}`;
    if (!v.ultima_sumo) {
      return `Esta visita no sumó sello Katana's VIP porque pasaron más de 30 días desde la anterior, pero ${f.perro} conserva sus ${plural(v.sellos, 'sello', 'sellos')}. Si vuelve antes del ${fmtLong(v.vence)}, suma. ${enlace}`;
    }
    const premio = VIP_PREMIOS[v.sellos] ? ` Con este sello ganó: *${premioTxt(v.sellos).toLowerCase()}*.` : '';
    const sigue = v.sellos === 10
      ? ` ¡Completó su tarjeta! Con su próximo grooming completo empieza una nueva.`
      : ` Su próxima visita suma si es antes del ${fmtLong(v.vence)}.`;
    return `Con esta visita, ${f.perro} lleva *${v.sellos} de 10 sellos Katana's VIP*.${premio}${sigue} ${enlace}`;
  }

  // Vista previa: las negritas de WhatsApp se muestran como negritas
  const vistaPrevia = texto => esc(texto).replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>');

  const avisoDe = (tipo, canal, item) => avisos.find(a => a.tipo === tipo && a.canal === canal && (
    tipo === 'toca_volver' ? a.ficha_id === item.ficha.id && a.ref_fecha === item.ref
    : tipo === 'amigo_vip' ? a.ficha_id === item.ficha.id
    : a.cita_id === item.cita.id));

  // Junta en un solo mensaje los perros del mismo cliente con cita a la misma hora
  function agrupar(items) {
    const out = [], grupos = {};
    for (const it of items) {
      if (!it.cita) { out.push(it); continue; }
      const k = [it.tipo, normWa(it.cita.whatsapp), it.cita.fecha, it.cita.hora, it.atrasado ? 1 : 0].join('|');
      if (grupos[k]) { grupos[k].citas.push(it.cita); continue; }
      grupos[k] = { ...it, citas: [it.cita] };
      out.push(grupos[k]);
    }
    return out;
  }

  function pendientes() {
    const t = today(), manana = addDays(t, 1), ahora = ahoraHHMM();
    const out = [];
    for (const c of citas) {
      if (c.estado === 'cancelada' || normWa(c.whatsapp).length !== 8) continue;
      const f = fichaDe(c);
      const item = (tipo, extra) => ({ tipo, cita: c, ficha: f, ...extra });
      if (c.estado === 'agendada' && c.fecha >= t && !avisoDe('confirmacion', 'whatsapp', { cita: c })) out.push(item('confirmacion'));
      const pideRecordatorio = c.estado === 'agendada' && localDate(c.creado) < t && f?.recordatorios !== false
        && !avisoDe('dia_antes', 'whatsapp', { cita: c });
      if (pideRecordatorio && c.fecha === manana) out.push(item('dia_antes'));
      // Si ayer no se envió el recordatorio y la cita es hoy más tarde, todavía sirve
      if (pideRecordatorio && c.fecha === t && localDate(c.creado) < addDays(t, -1) && c.hora > ahora) out.push(item('dia_antes', { atrasado: true }));
      if (c.estado === 'entregada' && c.salida && localDate(c.salida) === t && !avisoDe('listo', 'whatsapp', { cita: c })) out.push(item('listo'));
    }
    for (const f of fichas) {
      const dias = FREC_DIAS[f.frecuencia];
      if (!dias || f.recordatorios !== true || normWa(f.whatsapp).length !== 8) continue;
      const suyas = citas.filter(c => c.ficha_id === f.id && c.estado !== 'cancelada');
      if (suyas.some(c => c.fecha > t || (c.fecha === t && c.estado !== 'entregada'))) continue;
      const ult = suyas.map(c => c.fecha).filter(d => d <= t).sort().pop();
      if (!ult || addDays(ult, dias) > t) continue;
      const item = { tipo: 'toca_volver', ficha: f, ref: ult, dias };
      if (!avisoDe('toca_volver', 'whatsapp', item)) out.push(item);
    }
    // Bienvenida a Katana's VIP: una sola vez por perro, cuando ya tiene al menos un sello.
    // Los perros del mismo dueño (mismo WhatsApp) van juntos en un solo mensaje.
    const porDueno = {};
    for (const f of fichas) {
      if (f.recordatorios === false || normWa(f.whatsapp).length !== 8 || !vipDe(f).sellos_total) continue;
      if (avisoDe('amigo_vip', 'whatsapp', { ficha: f })) continue;
      const k = normWa(f.whatsapp);
      if (porDueno[k]) { porDueno[k].fichas.push(f); continue; }
      porDueno[k] = { tipo: 'amigo_vip', ficha: f, fichas: [f] };
      out.push(porDueno[k]);
    }
    return agrupar(out).sort((a, b) => ORDEN_AVISO[a.tipo] - ORDEN_AVISO[b.tipo]);
  }

  async function registrarAviso(item, canal, omitido, conDeshacer = true) {
    const lista = item.citas || (item.cita ? [item.cita] : [null]);
    // Bienvenida de varios perros: un registro por perro, para que ninguno vuelva a salir
    const rows = item.fichas ? item.fichas.map(f => ({
      tipo: item.tipo, canal, omitido, cita_id: null, ficha_id: f.id, ref_fecha: null,
      destino: canal === 'whatsapp' ? fmtWa(f.whatsapp) : null
    })) : lista.map(c => ({
      tipo: item.tipo, canal, omitido,
      cita_id: c?.id || null,
      ficha_id: (c ? fichaDe(c)?.id : item.ficha?.id) || null,
      ref_fecha: item.tipo === 'toca_volver' ? item.ref : null,
      destino: canal === 'whatsapp' ? fmtWa(c?.whatsapp || item.ficha?.whatsapp) : null
    }));
    const locales = rows.map(r => ({ ...r, creado: new Date().toISOString() }));
    avisos.push(...locales);
    updateCount();
    renderHoy();
    const data = [];
    let error = null, repetido = false;
    for (const r of rows) {
      const res = await sb.from('avisos').insert(r).select().single();
      if (res.error?.code === '23505') { repetido = true; continue; }   // ya lo marcó otro dispositivo
      if (res.error) { error = res.error; break; }
      data.push(res.data);
    }
    avisos = avisos.filter(a => !locales.includes(a));
    if (error) {
      if (data.length) await sb.from('avisos').delete().in('id', data.map(d => d.id));
      toast('No se pudo marcar el mensaje. Revisa tu conexión.');
    } else {
      avisos.push(...data);
      if (repetido) { try { await loadAll(); } catch { /* sin conexión */ } }
      if (conDeshacer && data?.length) {
        const perro = item.fichas ? listaPerros(item.fichas) : item.citas ? perrosDe(item) : (item.cita?.perro || item.ficha?.perro);
        toast(omitido ? `${TIPO_AVISO[item.tipo]} de ${perro}: no se enviará` : `${TIPO_AVISO[item.tipo]} de ${perro}: marcado como enviado`,
          { accion: 'Deshacer', fn: () => deshacerAviso(data) });
      }
    }
    updateCount();
    renderHoy();
  }

  async function deshacerAviso(rows) {
    const ids = rows.map(r => r.id);
    const { error } = await sb.from('avisos').delete().in('id', ids);
    if (error) { toast('No se pudo deshacer. Revisa tu conexión.'); return; }
    avisos = avisos.filter(a => !ids.includes(a.id));
    updateCount();
    renderHoy();
    toast('Listo: el mensaje volvió a la lista');
  }

  let abierto = null;   // { id, act } del formulario de llegada/entrega abierto

  async function refreshHoy() {
    renderHoy();
    try { await loadAll(); renderHoy(); } catch (err) {
      console.error(err);
      toast(isAuthError(err) ? 'Tu sesión se cerró. Vuelve a iniciar sesión.' : 'No se pudieron cargar las citas de hoy. Revisa tu conexión.');
    }
  }

  // Indicador de 3 pasos: por llegar → en Katana's → entregado
  const PASOS = [['agendada', 'Por llegar'], ['en_katana', "En Katana's"], ['entregada', 'Entregado']];
  function pasos(estado) {
    const i = PASOS.findIndex(([k]) => k === estado);
    return `<span class="pasos" aria-label="Estado: ${esc(PASOS[i]?.[1] || '')}">
      ${PASOS.map((_, j) => `<span class="paso${j <= i ? ' on' : ''}" aria-hidden="true"></span>`).join('')}
      <span class="paso-txt">${esc(PASOS[i]?.[1] || '')}</span></span>`;
  }

  const inicial = n => (String(n || '?').trim()[0] || '?').toUpperCase();
  const PREMIO_CORTO = { 3: 'Regalito', 5: '10% desc.', 7: 'Hidratante', 10: 'Spa' };

  function hoyRow(c) {
    const f = fichaDe(c);
    const alerts = alertsFor(f);
    let cta = '', form = '';
    if (abierto?.id === c.id) {
      const llegada = abierto.act === 'recibir';
      const premios = llegada ? [] : premiosAlEntregar(c);
      form = `<div class="inline-form">
        <label for="nota-${esc(c.id)}">${llegada ? '¿Cómo llegó y qué dejó?' : '¿Algo que contarle al dueño?'} <span class="opt">opcional</span></label>
        <textarea id="nota-${esc(c.id)}" rows="2" placeholder="${llegada ? 'Nudos, heridas, collar, juguete…' : 'Se portó muy bien…'}"></textarea>
        ${premios.length ? `<fieldset class="vip-premios"><legend>Premios Katana's VIP</legend>
          ${premios.map((p, i) => `<label class="consent"><input type="checkbox" name="premio-${esc(c.id)}" value="${i}" checked><span>Se le dio: ${esc(premioTxt(p.hito))}</span></label>`).join('')}
        </fieldset>` : ''}
        <div class="row-actions">
          <button type="button" class="btn btn-primary btn-sm" data-act="${llegada ? 'ok-recibir' : 'ok-entregar'}" data-id="${esc(c.id)}">${llegada ? 'Confirmar llegada' : 'Confirmar entrega'}</button>
          <button type="button" class="link-btn" data-act="cerrar" data-id="${esc(c.id)}">Cancelar</button>
        </div></div>`;
    } else if (c.estado === 'agendada') {
      cta = `<button type="button" class="btn btn-primary btn-sm" data-act="recibir" data-id="${esc(c.id)}">Recibir</button>`;
    } else if (c.estado === 'en_katana') {
      cta = `<button type="button" class="btn btn-primary btn-sm" data-act="entregar" data-id="${esc(c.id)}">Entregar</button>`;
    } else if (c.estado === 'entregada') {
      cta = `<span class="listo-ico" title="Entregado"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span class="sr-only">Entregado</span></span>`;
    }

    // Solo lo indispensable: Katana's VIP y cuidados como íconos pequeños
    const marcas = [];
    const vc = vipChip(c, f);
    if (vc) marcas.push(vc);
    if (alerts.length) marcas.push(`<span class="chip-s alerta" title="${esc(alerts.join(' · '))}">${ICO_ALERTA}<span class="sr-only">Cuidado: </span>${esc(alerts[0])}${alerts.length > 1 ? ` +${alerts.length - 1}` : ''}</span>`);

    const info = `<span class="avatar ${tono(f || c)}" aria-hidden="true">${esc(inicial(c.perro))}</span>
        <span class="cita-info">
          <span class="cita-name">${esc(c.perro)}</span>
          <span class="cita-meta">${esc(hora12(c.hora))}${c.fecha !== today() ? ` (${esc(fmtDay(c.fecha))})` : ''} · ${esc(servicioPrincipal(c.servicios) || 'Sin servicio')}</span>
          ${marcas.length ? `<span class="cita-chips">${marcas.join('')}</span>` : ''}
        </span>`;
    const abrir = f ? `<button type="button" class="cita-abrir" data-perfil="${esc(f.id)}" aria-label="Ver perfil de ${esc(c.perro)}">${info}</button>` : `<div class="cita-abrir">${info}</div>`;

    return `<li class="cita estado-${esc(c.estado)}">
      <div class="cita-main">${abrir}<div class="cita-cta">${cta}</div></div>
      ${form}
    </li>`;
  }

  // Premios que se pueden marcar al entregar: el de esta visita (si toca) y los que quedaron pendientes
  function premiosAlEntregar(c) {
    const f = fichaDe(c);
    if (!f) return [];
    const out = premiosPendientes(f);
    const pv = vipPrevision(c);
    if (pv?.suma && pv.premio) out.push({ ronda: pv.ronda, hito: pv.premio, ahora: true });
    return out;
  }

  // Katana's VIP en la agenda: un chip corto y el detalle escondido
  function vipChip(c, f) {
    if (!f || c.estado === 'cancelada') return '';
    const v = vipDe(f);
    let sello = '', premios = premiosPendientes(f).length;
    if (c.estado === 'entregada') {
      if (c.fecha >= VIP_LANZAMIENTO && esGroomingCompleto(c.servicios) && v.ultima_visita === c.fecha && v.ultima_sumo) sello = `Sello ${v.sellos}/10`;
    } else {
      const pv = vipPrevision(c);
      if (pv?.suma) { sello = `Sello ${pv.sello}/10`; if (pv.premio) premios++; }
    }
    return (sello ? `<span class="chip-s vip">${esc(sello)}</span>` : '')
      + (premios ? `<span class="chip-s premio">${premios > 1 ? `${premios} premios` : 'Premio'}</span>` : '');
  }

  function vipDetalle(c, f) {
    if (!f || c.estado === 'cancelada') return [];
    const out = [];
    if (c.estado !== 'entregada') {
      const pv = vipPrevision(c);
      if (pv?.suma) out.push(`Katana's VIP: esta visita es el sello ${pv.sello} de 10${pv.premio ? `. Premio de hoy: ${premioTxt(pv.premio)}` : ''}`);
      else if (pv) out.push(pv.motivo);
    } else if (c.fecha >= VIP_LANZAMIENTO && esGroomingCompleto(c.servicios) && vipDe(f).ultima_visita === c.fecha && !vipDe(f).ultima_sumo) {
      out.push('Katana\'s VIP: esta visita no sumó sello (más de 30 días)');
    }
    for (const p of premiosPendientes(f)) out.push(`Premio por entregar: ${premioTxt(p.hito)}`);
    return out;
  }

  let pendLista = [];
  let msgFiltro = 'todos';
  const FILTROS_MSG = [
    ['todos', 'Todos'], ['listo', 'Listos para recoger'], ['confirmacion', 'Confirmaciones'],
    ['dia_antes', 'Cita de mañana'], ['toca_volver', 'Le toca volver'], ['amigo_vip', 'Katana\'s VIP']
  ];

  const ICONOS = {
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
    tijera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12z"/></svg>',
    regalo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>',
    reloj: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    listo: '<svg viewBox="0 0 34 34" fill="currentColor" aria-hidden="true"><ellipse cx="17" cy="22.5" rx="7.5" ry="6.5"/><circle cx="8" cy="14" r="3.3"/><circle cx="13.5" cy="8.5" r="3.3"/><circle cx="20.5" cy="8.5" r="3.3"/><circle cx="26" cy="14" r="3.3"/></svg>'
  };

  const ICONO_MSG = { listo: 'listo', confirmacion: 'cal', dia_antes: 'reloj', toca_volver: 'chat', amigo_vip: 'regalo' };

  // Perros que pierden el plazo de 30 días en la próxima semana y no tienen cita
  function vipPorVencer() {
    const t = today(), limite = addDays(t, 7);
    return fichas.filter(f => {
      const v = vipDe(f);
      if (!v.sellos || v.sellos >= 10 || !v.vence || v.vence < t || v.vence > limite) return false;
      return !citas.some(c => c.ficha_id === f.id && c.estado === 'agendada' && c.fecha >= t);
    }).sort((a, b) => vipDe(a).vence.localeCompare(vipDe(b).vence));
  }

  function mensajeVence(f) {
    const v = vipDe(f);
    const nombre = primerNombre(f.nombre);
    return `${nombre ? `¡Hola, ${nombre}!` : '¡Hola!'} ${f.perro} lleva ${v.sellos} de 10 sellos Katana's VIP. Si su próximo grooming completo es antes del ${fmtLong(v.vence)}, suma su sello ${v.sellos + 1}${VIP_PREMIOS[v.sellos + 1] ? ` y gana: ${premioTxt(v.sellos + 1).toLowerCase()}` : ''}. ¿Le agendamos? Respóndanos con el día y la hora que le quedan mejor.`;
  }

  function renderDashboard(deHoy) {
    const h = new Date().getHours();
    $('#saludo').textContent = h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches';
    const deHoyReal = deHoy.filter(c => c.fecha === today());
    const n = e => (e === 'en_katana' ? deHoy : deHoyReal).filter(c => c.estado === e).length;
    const listos = pendLista.filter(it => it.tipo === 'listo').length;
    const premios = [];
    for (const c of deHoyReal) {
      const f = fichaDe(c);
      const pv = vipPrevision(c);
      if (pv?.premio) premios.push({ perro: c.perro, txt: premioTxt(pv.premio), hora: c.hora });
      if (f) for (const p of premiosPendientes(f)) premios.push({ perro: c.perro, txt: premioTxt(p.hito), hora: c.hora, pendiente: true });
    }
    const premiosHoy = premios.length;
    const suman = deHoyReal.filter(c => vipPrevision(c)?.suma).length;
    const sub = [n('agendada') && `${n('agendada')} por llegar`, n('entregada') && `${plural(n('entregada'), 'entregado', 'entregados')}`].filter(Boolean).join(' · ');
    $('#stats').innerHTML = `
      <div class="stat stat-lila"><span class="stat-ico">${ICONOS.cal}</span><p class="stat-label">Citas de hoy</p><p class="stat-num">${deHoyReal.length}</p><p class="stat-sub">${esc(sub || 'Sin citas')}</p></div>
      <div class="stat stat-amarillo"><span class="stat-ico">${ICONOS.tijera}</span><p class="stat-label">En Katana's ahora</p><p class="stat-num">${n('en_katana')}</p><p class="stat-sub">${n('en_katana') === 1 ? 'perrito en grooming' : 'perritos en grooming'}</p></div>
      <button type="button" class="stat stat-naranja" data-go="mensajes"><span class="stat-ico">${ICONOS.chat}</span><span class="stat-label">Mensajes por enviar</span><span class="stat-num">${pendLista.length}</span><span class="stat-sub">${listos ? `${plural(listos, 'listo', 'listos')} para recoger` : 'Ver mensajes'}</span></button>
      <button type="button" class="stat stat-morado" data-go="vip"><span class="stat-ico">${ICONOS.regalo}</span><span class="stat-label">Premios VIP de hoy</span><span class="stat-num">${premiosHoy}</span><span class="stat-sub">${suman ? `${plural(suman, 'perrito suma', 'perritos suman')} sello hoy` : 'Ver programa VIP'}</span></button>`;

    // Panel Katana's VIP del tablero
    const vencen = vipPorVencer();
    $('#vipHoy').innerHTML = `
      <p class="mini-title">Pierden su plazo esta semana</p>
      ${vencen.length ? `<ul class="mini-list">${vencen.slice(0, 5).map(f => `<li><span class="mini-name">${esc(f.perro)}</span><span class="mini-meta">${vipDe(f).sellos} de 10 · hasta el ${esc(fmtDay(vipDe(f).vence))}</span>
          ${normWa(f.whatsapp).length === 8 ? `<a class="link-btn" href="${esc(waLink(f.whatsapp, mensajeVence(f)))}" target="_blank" rel="noopener" aria-label="Escribir a ${esc(f.nombre)} por ${esc(f.perro)}">Escribir</a>` : ''}</li>`).join('')}</ul>
          ${vencen.length > 5 ? `<button type="button" class="link-btn" data-go="vip">Ver los ${vencen.length}</button>` : ''}`
        : '<p class="mini-empty">Nadie pierde su plazo en los próximos 7 días.</p>'}`;
  }

  function renderHoy() {
    if (!$('#hoyFecha')) return;
    const t = today(), manana = addDays(t, 1);
    $('#hoyFecha').textContent = cap(fmtLong(t));

    const sinCerrar = citas.filter(c => (c.estado === 'agendada' || c.estado === 'en_katana') && c.fecha < t).length;
    $('#sinCerrar').hidden = sinCerrar === 0;
    $('#sinCerrarText').textContent = `${plural(sinCerrar, 'cita pasada sin cerrar', 'citas pasadas sin cerrar')}: no suman sello hasta que las marques.`;

    const sinFrec = fichas.filter(f => !f.frecuencia).length;
    $('#sinFrec').hidden = sinFrec === 0;
    $('#sinFrecText').textContent = `${plural(sinFrec, 'perro no tiene', 'perros no tienen')} frecuencia de visita, así que no ${sinFrec === 1 ? 'recibirá' : 'recibirán'} "Le toca volver".`;

    const deHoy = citas.filter(c => c.estado !== 'cancelada' && (c.fecha === t || c.estado === 'en_katana'))
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
    $('#hoyCitas').innerHTML = deHoy.length
      ? `<ul class="citas">${deHoy.map(hoyRow).join('')}</ul>`
      : `<div class="empty"><p>No hay citas para hoy.</p><button type="button" class="btn btn-primary" data-go="nueva">Registrar una cita</button></div>`;

    pendLista = pendientes();
    renderDashboard(deHoy);

    // Mensajes: filtros con su cantidad
    const cuenta = k => k === 'todos' ? pendLista.length : pendLista.filter(it => it.tipo === k).length;
    if (msgFiltro !== 'todos' && !cuenta(msgFiltro)) msgFiltro = 'todos';
    $('#msgStats').textContent = plural(pendLista.length, 'pendiente', 'pendientes');
    $('#msgFiltros').innerHTML = FILTROS_MSG.filter(([k]) => k === 'todos' || cuenta(k))
      .map(([k, l]) => `<button type="button" class="seg-btn" data-filtro="${k}" aria-pressed="${k === msgFiltro}">${esc(l)} <span class="seg-n">${cuenta(k)}</span></button>`).join('');
    const visibles = pendLista.map((it, i) => [it, i]).filter(([it]) => msgFiltro === 'todos' || it.tipo === msgFiltro);

    $('#hoyMensajes').innerHTML = visibles.length
      ? `<ul class="citas">${visibles.map(([it, i]) => {
          const c = it.cita, f = it.ficha;
          const perro = it.fichas ? listaPerros(it.fichas) : it.citas ? perrosDe(it) : (c?.perro || f?.perro);
          const cliente = primerNombre(c?.cliente || f?.nombre) || 'Cliente sin ficha';
          const num = c?.whatsapp || f?.whatsapp;
          const extra = it.tipo === 'toca_volver' ? `última visita ${fmtDay(it.ref)}`
            : it.tipo === 'amigo_vip' ? 'tarjeta y sellos'
            : `${fmtDay(c.fecha)}, ${hora12(c.hora)}`;
          const etiqueta = it.atrasado ? 'Recordatorio atrasado' : TIPO_AVISO[it.tipo];
          return `<li class="cita msg2 tipo-${it.tipo}${it.atrasado ? ' atrasado' : ''}">
            <div class="cita-main">
              <span class="avatar msg-av" aria-hidden="true">${ICONOS[ICONO_MSG[it.tipo]] || ICONOS.chat}</span>
              <div class="cita-info">
                <p class="msg-type">${esc(etiqueta)}</p>
                <p class="cita-name">${esc(perro)}</p>
                <p class="cita-meta">${esc(cliente)} · ${esc(extra)}</p>
              </div>
              <div class="cita-cta msg-cta">
                <a class="btn btn-wa btn-sm" href="${esc(waLink(num, mensaje(it)))}" target="_blank" rel="noopener" data-send="${i}" aria-label="Enviar por WhatsApp a ${esc(cliente)}: ${esc(etiqueta)} de ${esc(perro)}">Enviar</a>
                <button type="button" class="link-btn" data-skip="${i}" aria-label="No enviar: ${esc(etiqueta)} de ${esc(perro)}">No enviar</button>
              </div>
            </div>
            <details class="cita-more"><summary>Ver mensaje</summary><p class="msg-text">${vistaPrevia(mensaje(it))}</p></details>
          </li>`;
        }).join('')}</ul>`
      : `<div class="empty"><p>No hay mensajes pendientes.</p></div>`;

    const deManana = citas.filter(c => c.fecha === manana && c.estado !== 'cancelada').sort((a, b) => a.hora.localeCompare(b.hora));
    $('#hoyManana').innerHTML = deManana.length
      ? `<ul class="mini-list">${deManana.map(c => `<li><span class="mini-name">${esc(c.perro)}</span><span class="mini-meta">${esc(hora12(c.hora))} · ${esc(servicioPrincipal(c.servicios))}</span>
          <button type="button" class="link-btn" data-act="reprogramar" data-id="${esc(c.id)}" aria-label="Reprogramar la cita de ${esc(c.perro)}">Reprogramar</button></li>`).join('')}</ul>`
      : `<p class="mini-empty">No hay citas para mañana.</p>`;

    if ($('#perfil').open) renderPerfil();
    if (abierto) $(`#nota-${CSS.escape(abierto.id)}`)?.focus();
  }

  async function actualizarCita(id, cambios, ok) {
    const c = citas.find(x => x.id === id);
    const { data, error } = await sb.from('citas').update(cambios).eq('id', id).select().single();
    if (error) { toast('No se pudo guardar el cambio. Revisa tu conexión e intenta de nuevo.'); return false; }
    Object.assign(c, data, { hora: hhmm(data.hora) });
    abierto = null;
    updateCount();
    renderHoy();
    if (!$('#view-registros').hidden) renderRegistros();
    if (ok) toast(ok);
    return true;
  }

  $('#sinFrecBtn').addEventListener('click', () => {
    soloSinFrecuencia = true;
    switchTab('registros');
    elegirLista($('.seg-btn[data-list="fichas"]'));
  });

  $('#view-hoy').addEventListener('click', async e => {
    const pf = e.target.closest('[data-perfil]');
    if (pf) { abrirPerfil(pf.dataset.perfil); return; }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const id = b.dataset.id, act = b.dataset.act;
    const c = citas.find(x => x.id === id);
    if (!c) return;
    if (act === 'reprogramar') { abrirReprogramar(c); return; }
    if (act === 'recibir' || act === 'entregar') { abierto = { id, act }; renderHoy(); return; }
    if (act === 'cerrar') { abierto = null; renderHoy(); return; }
    if (act === 'novino') {
      if (!confirm(`¿Marcar que ${c.perro} no vino a su cita de las ${hora12(c.hora)}?`)) return;
      await actualizarCita(id, { estado: 'cancelada' }, `${c.perro}: marcada como que no vino`);
      return;
    }
    const nota = ($(`#nota-${CSS.escape(id)}`)?.value || '').trim() || null;
    b.disabled = true;
    if (act === 'ok-recibir') await actualizarCita(id, { estado: 'en_katana', llegada: new Date().toISOString(), nota_llegada: nota }, `${c.perro} llegó`);
    if (act === 'ok-entregar') {
      // Premios marcados en el formulario de entrega (se calculan antes de entregar)
      const posibles = premiosAlEntregar(c);
      const marcados = $$(`[name="premio-${CSS.escape(id)}"]:checked`).map(i => posibles[Number(i.value)]).filter(Boolean);
      const ok = await actualizarCita(id, { estado: 'entregada', salida: new Date().toISOString(), nota_salida: nota }, null);
      if (ok) {
        const f = fichaDe(c);
        let fallo = false;
        for (const p of marcados) if (!(await marcarPremio(f, p, p.ahora ? id : null))) fallo = true;
        try { await loadVip(); } catch { /* sin conexión: se actualiza al recargar */ }
        updateCount(); renderHoy();
        toast(fallo
          ? `${c.perro} entregado, pero no se pudo marcar el premio. Márcalo desde su ficha.`
          : `${c.perro} entregado. Avísale al dueño en "Mensajes por enviar".`);
      }
    }
    b.disabled = false;
  });

  // ---------- Sección Katana's VIP ----------
  async function refreshVip() {
    renderVip();
    try { await loadAll(); renderVip(); } catch (err) {
      console.error(err);
      toast(isAuthError(err) ? 'Tu sesión se cerró. Vuelve a iniciar sesión.' : 'No se pudo cargar Katana\'s VIP. Revisa tu conexión.');
    }
  }

  // Tarjeta de un perrito en la sección VIP: tocarla abre su perfil; un solo botón según la lista
  function vipFila(f, accion = '') {
    const v = vipDe(f);
    return `<li class="vip-item">
      <button type="button" class="vip-abrir" data-perfil="${esc(f.id)}" aria-label="Ver perfil de ${esc(f.perro)}">
        <span class="avatar ${tono(f)}" aria-hidden="true">${esc(inicial(f.perro))}</span>
        <span class="vip-item-info">
          <span class="cita-name">${esc(f.perro)}</span>
          <span class="vip-mini sm">${sellosMini(v.sellos)}</span>
          <span class="cita-meta">${esc(primerNombre(f.nombre))} · ${esc(vipCorto(f))}</span>
        </span>
        <span class="vip-count">${v.sellos}<span>/10</span></span>
      </button>
      ${accion ? `<div class="vip-accion">${accion}</div>` : ''}
    </li>`;
  }

  function renderVip() {
    const box = $('#vipLista');
    if (!box) return;
    const conSellos = fichas.filter(f => vipDe(f).sellos_total > 0);
    const conPremio = fichas.filter(f => premiosPendientes(f).length);
    const vencen = vipPorVencer().filter(f => !conPremio.includes(f));
    const yaVistos = new Set([...conPremio, ...vencen]);
    const resto = conSellos.filter(f => !yaVistos.has(f))
      .sort((a, b) => vipDe(b).sellos_total - vipDe(a).sellos_total || norm(a.perro).localeCompare(norm(b.perro)));
    $('#vipStats').textContent = `${plural(conSellos.length, 'perrito con sellos', 'perritos con sellos')} · ${plural(canjes.length, 'premio entregado', 'premios entregados')}`;
    const premiosBtn = f => premiosPendientes(f).map(p => `<button type="button" class="btn btn-sm btn-primary" data-premio="${esc(f.id)}" data-ronda="${p.ronda}" data-hito="${p.hito}">Entregar: ${esc(PREMIO_CORTO[p.hito])}</button>`).join('');
    const recordar = f => normWa(f.whatsapp).length === 8 ? `<a class="btn btn-sm btn-wa" href="${esc(waLink(f.whatsapp, mensajeVence(f)))}" target="_blank" rel="noopener">Recordarle</a>` : '';
    const premiosLeyenda = VIP_HITOS.map(h => `<li><span class="hito-n">${h}</span><span>${esc(PREMIO_CORTO[h])}</span></li>`).join('');
    box.innerHTML = `
      <ul class="hitos" aria-label="Premios por sello">${premiosLeyenda}</ul>
      ${conPremio.length ? `<h3 class="group-title">Premios por entregar</h3><ul class="vip-list">${conPremio.map(f => vipFila(f, premiosBtn(f))).join('')}</ul>` : ''}
      ${vencen.length ? `<h3 class="group-title">Pierden su plazo esta semana</h3><ul class="vip-list">${vencen.map(f => vipFila(f, recordar(f))).join('')}</ul>` : ''}
      ${resto.length ? `<h3 class="group-title">${conPremio.length || vencen.length ? 'Los demás' : 'Perritos con sellos'}</h3><ul class="vip-list">${resto.map(f => vipFila(f)).join('')}</ul>` : ''}
      ${!conSellos.length ? '<div class="empty"><p>Todavía ningún perrito tiene sellos. Se suman solos al entregar un grooming completo.</p></div>' : ''}`;
  }

  $('#vipLista').addEventListener('click', e => {
    const pf = e.target.closest('[data-perfil]');
    if (pf) { abrirPerfil(pf.dataset.perfil); return; }
    const pr = e.target.closest('[data-premio]');
    if (pr) { accionPremio(pr).then(renderVip); return; }
    const tj = e.target.closest('[data-tarjeta]');
    if (tj) tarjetaEnviada(tj.dataset.tarjeta);
  });

  $('#msgFiltros').addEventListener('click', e => {
    const b = e.target.closest('[data-filtro]');
    if (!b) return;
    msgFiltro = b.dataset.filtro;
    renderHoy();
    $(`#msgFiltros [data-filtro="${msgFiltro}"]`)?.focus();
  });

  $('#hoyMensajes').addEventListener('click', e => {
    const send = e.target.closest('[data-send]');
    const skip = e.target.closest('[data-skip]');
    if (send) { const it = pendLista[Number(send.dataset.send)]; if (it) setTimeout(() => registrarAviso(it, 'whatsapp', false), 300); }
    if (skip) { const it = pendLista[Number(skip.dataset.skip)]; if (it) registrarAviso(it, 'whatsapp', true); }
  });

  // ---------- Sesión ----------
  function isAuthError(err) {
    const s = String(err?.code || '') + ' ' + String(err?.message || '');
    return /PGRST301|JWT|401|not authenticated/i.test(s);
  }

  function showView(which) {
    $('#loading').hidden = true;
    const logged = which === 'app';
    $('#view-login').hidden = which !== 'login';
    $('#view-reset').hidden = which !== 'reset';
    $('#side').hidden = !logged;
    $('#mbar').hidden = !logged;
    $('#topLogin').hidden = logged;
    document.body.classList.toggle('logged', logged);
    if (logged) switchTab('hoy');
    else { VISTAS.forEach(t => { $(`#view-${t}`).hidden = true; }); abrirMenu(false); }
  }

  function loginError(msg) {
    const p = $('#loginErr');
    p.textContent = msg;
    p.hidden = !msg;
    if (msg) $('#loginOk').hidden = true;
  }

  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    if (!sb) return;
    const email = $('#loginEmail').value.trim();
    const password = $('#loginPass').value;
    if (!email || !password) { loginError('Escribe tu correo y tu contraseña.'); return; }
    const btn = $('#loginBtn');
    btn.disabled = true;
    btn.textContent = 'Entrando…';
    loginError('');
    const { error } = await sb.auth.signInWithPassword({ email, password });
    btn.disabled = false;
    btn.textContent = 'Iniciar sesión';
    if (error) {
      loginError(/invalid/i.test(error.message)
        ? 'El correo o la contraseña no coinciden. Revísalos e intenta de nuevo.'
        : 'No se pudo iniciar sesión. Revisa tu conexión e intenta de nuevo.');
    }
  });

  $('#forgot').addEventListener('click', async () => {
    if (!sb) return;
    const email = $('#loginEmail').value.trim();
    if (!EMAIL.test(email)) { loginError('Escribe tu correo arriba y vuelve a tocar "Olvidé mi contraseña".'); $('#loginEmail').focus(); return; }
    loginError('');
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    if (error && !/rate|seconds/i.test(error.message)) { loginError('No se pudo enviar el correo. Revisa tu conexión e intenta de nuevo.'); return; }
    const ok = $('#loginOk');
    ok.textContent = error
      ? 'Ya te enviamos un enlace hace poco. Espera un minuto antes de pedir otro.'
      : `Si ${email} tiene cuenta, te llegará un correo con un enlace para crear una contraseña nueva. Revisa también la carpeta de spam.`;
    ok.hidden = false;
  });

  $('#resetForm').addEventListener('submit', async e => {
    e.preventDefault();
    const p1 = $('#newPass').value, p2 = $('#newPass2').value;
    const err = $('#resetErr');
    const fail = m => { err.textContent = m; err.hidden = false; };
    if (p1.length < 8) return fail('La contraseña debe tener al menos 8 caracteres.');
    if (p1 !== p2) return fail('Las contraseñas no coinciden. Escríbelas de nuevo.');
    err.hidden = true;
    const btn = $('#resetBtn');
    btn.disabled = true; btn.textContent = 'Guardando…';
    const { data, error } = await sb.auth.updateUser({ password: p1 });
    btn.disabled = false; btn.textContent = 'Guardar contraseña';
    if (error) return fail(/same|different/i.test(error.message)
      ? 'Usa una contraseña distinta a la anterior.'
      : 'No se pudo guardar. El enlace puede haber vencido: pide otro desde "Olvidé mi contraseña".');
    recuperando = false;
    history.replaceState(null, '', location.pathname);
    $('#newPass').value = ''; $('#newPass2').value = '';
    toast('Contraseña actualizada');
    started = false;
    onSession(data?.user ? (await sb.auth.getSession()).data.session : null);
  });

  $('#logout').addEventListener('click', async () => {
    await sb.auth.signOut();
  });

  let started = false;
  let recuperando = /type=recovery/.test(location.hash);
  async function onSession(session) {
    if (!session) {
      started = false;
      citas = []; fichas = []; avisos = []; vip = {}; canjes = [];
      $('#loginPass').value = '';
      showView('login');
      return;
    }
    if (started) return;
    started = true;
    $('#userEmail').textContent = session.user?.email || '';
    showView('app');
    resetForm();
    try { await loadAll(); renderHoy(); } catch (err) {
      console.error(err);
      toast('No se pudieron cargar las fichas. Revisa tu conexión.');
    }
  }

  // ---------- Aviso (con acción opcional, como "Deshacer") ----------
  let toastTimer;
  function toast(msg, opts = {}) {
    const t = $('#toast');
    const btn = $('#toastBtn');
    $('#toastText').textContent = msg;
    btn.hidden = !opts.accion;
    btn.textContent = opts.accion || '';
    btn.onclick = opts.fn ? () => { t.classList.remove('show'); opts.fn(); } : null;
    t.classList.toggle('has-action', !!opts.accion);
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), opts.accion ? 8000 : 3600);
  }

  // ---------- Inicio ----------
  renderSteps();
  if (!sb) {
    showView('login');
    $('#loginBtn').disabled = true;
    loginError(configured
      ? 'No se pudo conectar con la base de datos. Revisa tu conexión y recarga la página.'
      : 'Falta conectar la base de datos: completa config.js con los datos de Supabase.');
  } else {
    sb.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') { recuperando = true; showView('reset'); $('#newPass').focus(); return; }
      if (recuperando && session) { showView('reset'); return; }
      onSession(session);
    });
  }
})();
