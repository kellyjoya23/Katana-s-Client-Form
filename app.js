/* Katana's Grooming · Registro de citas
 * Guarda citas y fichas en Supabase. Solo el equipo con sesión iniciada ve los datos.
 */
(() => {
  'use strict';

  // ---------- Opciones ----------
  const SERVICIOS = ['Baño', 'Baño y corte', 'Corte de uñas', 'Limpieza de oídos', 'Deslanado'];
  const CANALES = ['WhatsApp', 'Llamada', 'Instagram', 'Facebook', 'TikTok', 'En el local'];
  const TIPOS = [
    { v: 'ficha', l: 'Sí, ya tiene ficha' },
    { v: 'nuevo', l: 'No, es cliente nuevo' },
    { v: 'antes', l: 'Cliente de antes, sin ficha' }
  ];
  const TIPO_LABEL = { ficha: 'Con ficha', nuevo: 'Cliente nuevo', antes: 'Cliente de antes' };
  const ESTADO_LABEL = { agendada: 'Agendada', en_katana: "En Katana's", entregada: 'Entregada', cancelada: 'Cancelada' };
  const TRANQUILO = 'Es tranquilo';
  const FRECUENCIAS = ['Cada 2 semanas', 'Cada mes', 'Cada 2 meses', 'De vez en cuando'];

  // ---------- Pasos ----------
  const STEPS = {
    cita: {
      title: 'La cita',
      fields: [
        { name: 'fecha', label: 'Fecha de la cita', type: 'date', req: true },
        { name: 'hora', label: 'Hora', type: 'time', req: true },
        { name: 'servicios', label: 'Servicios agendados', type: 'check', options: SERVICIOS, other: true, req: true },
        { name: 'canal', label: '¿Por dónde agendó?', type: 'radio', options: CANALES, other: true, req: true },
        { name: 'tipo', label: "¿El perro ya tiene ficha en Katana's?", type: 'radio', options: TIPOS, stack: true, req: true,
          hint: 'Elige "Cliente de antes, sin ficha" para quienes ya venían antes de este registro.' }
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
        { name: 'como_conocio', label: "¿Cómo conoció Katana's?", type: 'radio', other: true, req: true,
          options: ['Instagram', 'TikTok', 'Facebook', 'Google', 'Se lo recomendó alguien', 'Pasó por el local'] }
      ]
    },
    antes: {
      title: 'Cliente de antes',
      fields: [
        { name: 'desde_cuando', label: "¿Desde cuándo viene a Katana's?", type: 'radio', req: true,
          options: ['Menos de 1 año', 'De 1 a 3 años', 'De 3 a 5 años', 'Más de 5 años'] }
      ]
    },
    cliente: {
      title: 'Datos del cliente',
      fields: [
        { name: 'nombre', label: 'Nombre completo', type: 'text', req: true },
        { name: 'whatsapp', label: 'WhatsApp', type: 'tel', req: true },
        { name: 'correo', label: 'Correo', type: 'email' },
        { name: 'colonia', label: 'Municipio o colonia', type: 'text', hint: 'Por ejemplo: San Salvador Centro, colonia Escalón.' },
        { name: 'contacto', label: '¿Cómo prefiere que lo contactemos?', type: 'radio', req: true,
          options: ['WhatsApp', 'Llamada', 'Correo'] }
      ]
    },
    perro: {
      title: 'El perro',
      fields: [
        { name: 'perro', label: 'Nombre del perro', type: 'text', req: true },
        { name: 'raza', label: 'Raza', type: 'text', req: true, hint: 'Si es mestizo, escribe "mestizo".' },
        { name: 'tamano', label: 'Tamaño', type: 'radio', req: true,
          options: ['Mini (menos de 5 kg)', 'Pequeño (5 a 10 kg)', 'Mediano (10 a 25 kg)', 'Grande (25 a 40 kg)', 'Gigante (más de 40 kg)'] },
        { name: 'pelo', label: 'Tipo de pelo', type: 'radio', other: true, req: true,
          options: ['Corto', 'Largo', 'Rizado', 'Doble capa', 'Duro'] },
        { name: 'sexo', label: 'Sexo', type: 'radio', req: true, options: ['Macho', 'Hembra'] },
        { name: 'esterilizado', label: '¿Está esterilizado?', type: 'radio', options: ['Sí', 'No', 'No sabe'] },
        { name: 'cumple', label: 'Cumpleaños del perro', type: 'date',
          hint: 'Si el cliente no sabe la fecha exacta, anota una aproximada.' },
        { name: 'frecuencia', label: '¿Cada cuánto debería venir?', type: 'radio', req: true, options: FRECUENCIAS,
          hint: 'Con esto le recordamos al cliente cuando le toque volver.' }
      ]
    },
    salud: {
      title: 'Salud y carácter',
      fields: [
        { name: 'vacunas', label: '¿Tiene las vacunas al día?', type: 'radio', req: true, options: ['Sí', 'No', 'No sabe'] },
        { name: 'alergias', label: 'Alergias, problemas de piel o medicamentos', type: 'textarea',
          hint: 'Si no tiene, déjalo en blanco.' },
        { name: 'caracter', label: 'Durante el baño o el corte, el perro…', type: 'check', other: true, req: true,
          options: [TRANQUILO, 'Se pone nervioso', 'No le gusta la secadora', 'Es sensible en las patas',
            'Es sensible en las orejas', 'Puede morder si se asusta'] },
        { name: 'notas', label: 'Notas del cliente', type: 'textarea', hint: 'Mañas, lo que le gusta, cómo prefiere el corte.' }
      ]
    },
    permisos: {
      title: 'Permisos',
      intro: 'Pregúntale al cliente antes de marcar.',
      fields: [
        { name: 'autoriza', label: 'Uso de datos', type: 'consent', req: true,
          text: "El cliente autoriza a Katana's Grooming a guardar estos datos para agendar citas y cuidar a su perro." },
        { name: 'fotos', label: '¿Autoriza publicar fotos del perro en redes?', type: 'radio', req: true, options: ['Sí', 'No'] },
        { name: 'recordatorios', label: '¿Acepta recordatorios por WhatsApp (citas y cumpleaños del perro)?', type: 'radio', req: true, options: ['Sí', 'No'] }
      ]
    }
  };
  const FICHA_STEPS = ['cliente', 'perro', 'salud', 'permisos'];

  // Campos que se pueden editar en una ficha (todo menos el permiso de uso de datos)
  const EDIT_FICHA = [...STEPS.cliente.fields, ...STEPS.perro.fields, ...STEPS.salud.fields,
    ...STEPS.permisos.fields.filter(f => f.name !== 'autoriza')];
  const EDIT_CITA = [STEPS.cita.fields[0], STEPS.cita.fields[1], STEPS.cita.fields[2]];

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
    ['novedades', 'Novedades'], ['nombre', 'Cliente'], ['whatsapp', 'WhatsApp'], ['correo', 'Correo'],
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
  const findFicha = (wa, perro) => fichas.find(f => keyOf(f.whatsapp, f.perro) === keyOf(wa, perro));
  const fichaDe = c => (c.ficha_id ? fichas.find(x => x.id === c.ficha_id) : null) || findFicha(c.whatsapp, c.perro) || null;
  const conflictos = (fecha, hora, exceptoId) => citas.filter(c =>
    c.id !== exceptoId && c.estado !== 'cancelada' && c.fecha === fecha && c.hora === hhmm(hora));

  async function loadAll() {
    const desde = new Date(Date.now() - 180 * 864e5).toISOString();
    const [f, c, a] = await Promise.all([
      sb.from('fichas').select('*').order('perro'),
      sb.from('citas').select('*').order('fecha').order('hora'),
      sb.from('avisos').select('*').gte('creado', desde)
    ]);
    if (f.error) throw f.error;
    if (c.error) throw c.error;
    if (a.error) throw a.error;
    fichas = f.data;
    citas = c.data.map(x => ({ ...x, hora: hhmm(x.hora) }));
    avisos = a.data;
    updateCount();
  }

  async function upsertFicha(data) {
    const ex = findFicha(data.whatsapp, data.perro);
    if (ex) {
      // Solo se actualiza lo que se llenó; se conservan el nombre, el origen y lo que ya estaba
      const patch = {};
      for (const [k, v] of Object.entries(data)) {
        if (['perro', 'origen', 'creada'].includes(k)) continue;
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
    const chips = f.options.map(normOpt).map(o =>
      `<label class="chip"><input type="${t}" name="${f.name}" value="${esc(o.v)}"><span>${esc(o.l)}</span></label>`).join('');
    const other = f.other
      ? `<label class="chip"><input type="${t}" name="${f.name}" value="__otro"><span>Otro</span></label>` : '';
    const otherInput = f.other
      ? `<input class="other" type="text" name="${f.name}__otro" placeholder="¿Cuál?" aria-label="${f.label}: otro" autocomplete="off" hidden>` : '';
    return `<fieldset class="field" data-field="${f.name}" ${desc}>
      <legend>${f.label}${opt}</legend>${hint}
      <div class="chips${f.stack ? ' stack' : ''}">${chips}${other}</div>${otherInput}${err}</fieldset>`;
  }

  const allFields = id => [...STEPS[id].fields, ...(STEPS[id].tail || [])];

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
  function avisarConflicto(box, fecha, hora, exceptoId) {
    const cf = conflictos(fecha, hora, exceptoId);
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
    if (t === 'ficha') return ['cita', 'buscar'];
    if (t === 'antes') return ['cita', 'antes', ...FICHA_STEPS];
    return ['cita', 'nuevo', ...FICHA_STEPS];
  }

  function show(focus = false) {
    const p = path();
    if (idx > p.length - 1) idx = p.length - 1;
    const id = p[idx];
    $$('.step', form).forEach(s => { s.hidden = s.dataset.step !== id; });
    $('#dots').innerHTML = p.map((_, i) => `<li class="${i < idx ? 'done' : i === idx ? 'now' : ''}"></li>`).join('');
    $('#stepLabel').textContent = `Paso ${idx + 1} de ${p.length} · ${STEPS[id].title}`;
    $('#back').hidden = idx === 0;
    const last = idx === p.length - 1 && !!getVal('tipo');
    $('#next').textContent = last ? 'Guardar cita' : 'Siguiente';
    $('#saveErr').hidden = true;
    if (id === 'buscar') updateMatch();
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
    if (p[idx] === 'cita' && avisarConflicto($('#conflicto'), getVal('fecha'), getVal('hora'))) return;
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
    if (t.name === 'fecha' || t.name === 'hora') { conflictoVisto = ''; $('#conflicto').hidden = true; }
    if (t.name === 'wa_b' || t.name === 'perro_b') updateMatch();
  });

  // ---------- Buscar ficha ----------
  function alertsFor(f) {
    if (!f) return [];
    const list = asList(f.caracter).filter(c => c !== TRANQUILO);
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
    if (perros.length === 1 && !perroInput.value && document.activeElement !== perroInput) {
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
      servicios: getVal('servicios'), canal: getVal('canal'), tipo
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
        nombre: getVal('nombre'), whatsapp: fmtWa(getVal('whatsapp')), correo: getVal('correo') || null,
        colonia: getVal('colonia') || null, contacto: getVal('contacto'),
        perro: getVal('perro'), raza: getVal('raza'), tamano: getVal('tamano'), pelo: getVal('pelo'),
        sexo: getVal('sexo'), esterilizado: getVal('esterilizado') || null, cumple: getVal('cumple') || null,
        vacunas: getVal('vacunas'), alergias: getVal('alergias') || null, caracter: getVal('caracter'),
        notas: getVal('notas') || null,
        autoriza: getVal('autoriza').length > 0, fotos: toBool(getVal('fotos')), recordatorios: toBool(getVal('recordatorios'))
      };
      const { row, existed } = await upsertFicha(data);
      note = existed ? `${row.perro} ya tenía ficha con ese número: la actualizamos.` : `Ficha de ${row.perro} creada.`;
      cita = await insertCita({ ...base, ficha_id: row.id, whatsapp: row.whatsapp, perro: row.perro, cliente: row.nombre });
    }

    updateCount();
    showDone(cita, note);
    const enviado = await enviarCorreoConfirmacion(cita);
    if (enviado) $('#doneMail').textContent = enviado;
  }

  function showDone(c, note) {
    form.hidden = true;
    const done = $('#done');
    $('#doneSummary').textContent = `${c.perro} · ${fmtLong(c.fecha)}, ${hora12(c.hora)}`;
    $('#doneNote').textContent = [asList(c.servicios).join(', '), note].filter(Boolean).join('. ');
    const item = { tipo: 'confirmacion', cita: c, ficha: fichaDe(c) };
    const wa = c.fecha >= today() && normWa(c.whatsapp).length === 8;
    $('#doneConfirm').hidden = !wa;
    if (wa) {
      const a = $('#doneWa');
      a.href = waLink(c.whatsapp, mensaje(item));
      a.onclick = () => { registrarAviso(item, 'whatsapp', false, false); a.textContent = 'Confirmación enviada'; };
      a.textContent = 'Enviar confirmación por WhatsApp';
    }
    $('#doneMail').textContent = '';
    done.hidden = false;
    window.scrollTo({ top: 0 });
    $('h2', done).focus({ preventScroll: true });
  }

  function resetForm() {
    form.reset();
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

  function switchTab(which) {
    marcarPestana($$('#tabs [role="tab"]'), $(`#tab-${which}`));
    for (const t of ['hoy', 'nueva', 'registros']) $(`#view-${t}`).hidden = t !== which;
    if (which === 'registros') refresh();
    if (which === 'hoy') refreshHoy();
    window.scrollTo({ top: 0 });
  }
  $('#tab-hoy').addEventListener('click', () => switchTab('hoy'));
  $('#tab-nueva').addEventListener('click', () => switchTab('nueva'));
  $('#tab-registros').addEventListener('click', () => switchTab('registros'));
  teclasPestanas($('#tabs'), t => switchTab(t.id.replace('tab-', '')));

  // ---------- Registros ----------
  let listMode = 'citas';
  let soloSinFrecuencia = false;

  function elegirLista(b) {
    listMode = b.dataset.list;
    marcarPestana($$('.seg-btn'), b);
    renderList();
  }
  $$('.seg-btn').forEach(b => b.addEventListener('click', () => elegirLista(b)));
  teclasPestanas($('.seg'), elegirLista);

  $('#buscar').addEventListener('input', () => renderList());
  $('#quitarFiltro').addEventListener('click', () => { soloSinFrecuencia = false; renderList(); });

  function updateCount() {
    const n = pendientes().length;
    $('#countHoy').textContent = n;
    $('#countHoy').hidden = n === 0;
    $('#tab-hoy').setAttribute('aria-label', n ? `Hoy, ${plural(n, 'mensaje', 'mensajes')} por enviar` : 'Hoy');
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
    $('#regStats').textContent = `${plural(citas.length, 'cita', 'citas')} · ${plural(fichas.length, 'ficha', 'fichas')}`;
    renderMigrate();
    renderList();
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
      b.push(`<button type="button" class="link-btn" data-cita="cancelar" data-id="${esc(c.id)}">Cancelar</button>`);
      b.push(`<button type="button" class="link-btn danger" data-cita="eliminar" data-id="${esc(c.id)}">Eliminar</button>`);
    }
    if (c.estado === 'cancelada' && c.fecha >= t) {
      b.push(`<button type="button" class="link-btn" data-cita="reactivar" data-id="${esc(c.id)}">Reactivar</button>`);
    }
    return b.length ? `<div class="row-links">${b.join('')}</div>` : '';
  }

  function citaRow(c) {
    const f = fichaDe(c);
    const alerts = alertsFor(f).filter(a => !a.startsWith('Alergias'));
    const estado = c.estado && c.estado !== 'agendada' ? `<li class="tag estado">${esc(ESTADO_LABEL[c.estado] || c.estado)}</li>` : '';
    return `<li class="row reg-row${c.estado === 'cancelada' ? ' cancelada' : ''}">
      <div class="when"><span class="h">${esc(hora12(c.hora))}</span></div>
      <div>
        <p class="name">${esc(c.perro)}</p>
        <p class="meta">${esc(c.cliente || 'Cliente sin ficha')} · ${esc(asList(c.servicios).join(', '))}</p>
        <ul class="tags"><li class="tag">${esc(TIPO_LABEL[c.tipo] || c.tipo)}</li>${estado}${alerts.map(a => `<li class="tag alert">${esc(a)}</li>`).join('')}</ul>
        ${accionesCita(c)}
      </div>
    </li>`;
  }

  function renderList() {
    const box = $('#list');
    const q = norm($('#buscar').value);
    $('#filtro').hidden = !(soloSinFrecuencia && listMode === 'fichas');
    if (listMode === 'citas') {
      if (!citas.length) {
        box.innerHTML = `<div class="empty"><p>Todavía no hay citas registradas.</p><button type="button" class="btn btn-primary" id="goNueva">Registrar una cita</button></div>`;
        $('#goNueva').addEventListener('click', () => switchTab('nueva'));
        return;
      }
      const t = today();
      const key = c => `${c.fecha} ${c.hora}`;
      const lista = citas.filter(c => coincide(q, c.perro, c.cliente, c.whatsapp));
      if (!lista.length) { box.innerHTML = `<div class="empty"><p>Ninguna cita coincide con "${esc($('#buscar').value)}".</p></div>`; return; }
      const prox = lista.filter(c => c.fecha >= t).sort((a, b) => key(a).localeCompare(key(b)));
      const pas = lista.filter(c => c.fecha < t).sort((a, b) => key(b).localeCompare(key(a)));
      const dias = [...new Set(prox.map(c => c.fecha))];
      box.innerHTML =
        dias.map(d => `<h3 class="group-title">${esc(diaRelativo(d))}${d > addDays(t, 1) ? '' : ` · <span class="sub-date">${esc(fmtDay(d))}</span>`}</h3>
          <ul class="rows">${prox.filter(c => c.fecha === d).map(citaRow).join('')}</ul>`).join('') +
        (pas.length ? `<h3 class="group-title">Pasadas</h3><ul class="rows">${pas.map(c => citaRow(c).replace('<span class="h">', `<span class="d">${esc(fmtDay(c.fecha))}</span><span class="h">`)).join('')}</ul>` : '');
      return;
    }
    if (!fichas.length) {
      box.innerHTML = `<div class="empty"><p>Las fichas se crean al registrar una cita de un cliente nuevo o de antes.</p></div>`;
      return;
    }
    const sorted = [...fichas]
      .filter(f => !soloSinFrecuencia || !f.frecuencia)
      .filter(f => coincide(q, f.perro, f.nombre, f.whatsapp))
      .sort((a, b) => norm(a.perro).localeCompare(norm(b.perro)));
    if (!sorted.length) { box.innerHTML = `<div class="empty"><p>Ninguna ficha coincide${q ? ` con "${esc($('#buscar').value)}"` : ''}.</p></div>`; return; }
    box.innerHTML = `<ul class="rows">${sorted.map(f => {
      const visitas = citas.filter(c => c.ficha_id === f.id && c.estado !== 'cancelada');
      const ultima = visitas.map(c => c.fecha).filter(d => d <= today()).sort().pop();
      const alerts = alertsFor(f);
      return `<li class="row ficha"><div>
        <p class="name">${esc(f.perro)}</p>
        <p class="meta">${esc([f.raza, f.tamano].filter(Boolean).join(' · '))}</p>
        <p class="meta">${esc(f.nombre)} · ${esc(f.whatsapp)}</p>
        <p class="meta">${plural(visitas.length, 'cita', 'citas')}${ultima ? ` · última: ${esc(fmtDay(ultima))}` : ''} · ${f.frecuencia ? esc(f.frecuencia.toLowerCase()) : '<strong>sin frecuencia</strong>'}</p>
        ${alerts.length ? `<ul class="tags">${alerts.map(a => `<li class="tag alert">${esc(a)}</li>`).join('')}</ul>` : ''}
        <div class="row-links"><button type="button" class="link-btn" data-ficha="${esc(f.id)}">Editar ficha</button></div>
      </div></li>`;
    }).join('')}</ul>`;
  }

  // Acciones sobre citas (en Registros y en Hoy)
  async function accionCita(act, id) {
    const c = citas.find(x => x.id === id);
    if (!c) return;
    if (act === 'reprogramar') { abrirReprogramar(c); return; }
    if (act === 'cancelar') {
      if (!confirm(`¿Cancelar la cita de ${c.perro} del ${fmtDay(c.fecha)}, ${hora12(c.hora)}? Queda en el historial como cancelada.`)) return;
      await actualizarCita(id, { estado: 'cancelada' }, `Cita de ${c.perro} cancelada`);
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

  $('#list').addEventListener('click', e => {
    const b = e.target.closest('[data-cita]');
    if (b) { accionCita(b.dataset.cita, b.dataset.id); return; }
    const f = e.target.closest('[data-ficha]');
    if (f) abrirEditarFicha(fichas.find(x => x.id === f.dataset.ficha));
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
    if (t.name === 'fecha' || t.name === 'hora') { conflictoVisto = ''; const b = $('#xconflicto'); if (b) b.hidden = true; }
  });
  $('#sheetClose').addEventListener('click', () => sheet.close());
  $('#sheetCancel').addEventListener('click', () => sheet.close());

  function abrirReprogramar(c) {
    abrirSheet(`Reprogramar la cita de ${c.perro}`, EDIT_CITA, { fecha: c.fecha, hora: c.hora, servicios: c.servicios }, { tipo: 'cita', obj: c });
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
      if (avisarConflicto($('#xconflicto'), fecha, hora, c.id)) return;
      btn.disabled = true; btn.textContent = 'Guardando…';
      const cambioHorario = fecha !== c.fecha || hora !== c.hora;
      const ok = await actualizarCita(c.id, { fecha, hora, servicios: getVal('servicios', sheetForm) }, null);
      if (!ok) { btn.disabled = false; btn.textContent = 'Guardar cambios'; sheetError('No se pudo guardar el cambio. Revisa tu conexión e intenta de nuevo.'); return; }
      sheet.close();
      if (cambioHorario) {
        // La confirmación anterior ya no sirve: se borra para que aparezca de nuevo en Hoy y salga otro correo
        await sb.from('avisos').delete().eq('cita_id', c.id).in('tipo', ['confirmacion', 'dia_antes']);
        avisos = avisos.filter(a => !(a.cita_id === c.id && ['confirmacion', 'dia_antes'].includes(a.tipo)));
        updateCount(); renderRegistros(); renderHoy();
        const correo = await enviarCorreoConfirmacion(c);
        toast(`Cita reprogramada (${fmtDay(fecha)}, ${hora12(hora)}). Envía la nueva confirmación desde Hoy.${correo ? ' El correo ya salió.' : ''}`);
      } else {
        toast('Cita actualizada');
      }
      return;
    }
    // Ficha
    const f = sheetModo.obj;
    const v = n => getVal(n, sheetForm);
    const data = {
      nombre: v('nombre'), whatsapp: fmtWa(v('whatsapp')), correo: v('correo') || null, colonia: v('colonia') || null,
      contacto: v('contacto'), perro: v('perro'), raza: v('raza'), tamano: v('tamano'), pelo: v('pelo'), sexo: v('sexo'),
      esterilizado: v('esterilizado') || null, cumple: v('cumple') || null, frecuencia: v('frecuencia') || null,
      vacunas: v('vacunas'), alergias: v('alergias') || null, caracter: v('caracter'), notas: v('notas') || null,
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
  const TIPO_AVISO = { listo: 'Listo para recoger', dia_antes: 'Cita de mañana', confirmacion: 'Confirmación de cita', toca_volver: 'Le toca volver' };
  const ORDEN_AVISO = { listo: 0, dia_antes: 1, confirmacion: 2, toca_volver: 3 };

  function mensaje(item) {
    const c = item.cita, f = item.ficha;
    const nombre = primerNombre(c?.cliente || f?.nombre);
    const hola = nombre ? `¡Hola, ${nombre}!` : '¡Hola!';
    if (item.tipo === 'confirmacion') {
      return `${hola} Te confirmamos la cita de ${c.perro} en Katana's Grooming: ${fmtLong(c.fecha)} a las ${hora12(c.hora)}, para ${listaTxt(c.servicios)}. Si necesitas cambiarla, escríbenos por aquí. ¡Nos vemos!`;
    }
    if (item.tipo === 'dia_antes') {
      return item.atrasado
        ? `${hola} Te recordamos que hoy a las ${hora12(c.hora)} esperamos a ${c.perro} en Katana's Grooming. Si no pueden venir, avísanos por aquí para darle el espacio a otro peludo.`
        : `${hola} Te recordamos que mañana, ${fmtLong(c.fecha)}, a las ${hora12(c.hora)} esperamos a ${c.perro} en Katana's Grooming. Si no pueden venir, avísanos por aquí para darle el espacio a otro peludo.`;
    }
    if (item.tipo === 'listo') {
      return `${hola} ${c.perro} ya está listo y te espera en Katana's Grooming.`;
    }
    return `${hola} Ya ${TIEMPO_TXT[item.dias] || 'pasó un tiempo'} desde la última visita de ${f.perro} a Katana's Grooming. ¿Le agendamos la próxima? Respóndenos con el día y la hora que te quedan mejor.`;
  }

  const avisoDe = (tipo, canal, item) => avisos.find(a => a.tipo === tipo && a.canal === canal && (
    tipo === 'toca_volver' ? a.ficha_id === item.ficha.id && a.ref_fecha === item.ref : a.cita_id === item.cita.id));

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
    return out.sort((a, b) => ORDEN_AVISO[a.tipo] - ORDEN_AVISO[b.tipo]);
  }

  async function registrarAviso(item, canal, omitido, conDeshacer = true) {
    const row = {
      tipo: item.tipo, canal, omitido,
      cita_id: item.cita?.id || null,
      ficha_id: item.ficha?.id || null,
      ref_fecha: item.tipo === 'toca_volver' ? item.ref : null,
      destino: canal === 'whatsapp' ? fmtWa(item.cita?.whatsapp || item.ficha?.whatsapp) : null
    };
    const local = { ...row, creado: new Date().toISOString() };
    avisos.push(local);
    updateCount();
    if (!$('#view-hoy').hidden) renderHoy();
    const { data, error } = await sb.from('avisos').insert(row).select().single();
    if (error && error.code !== '23505') {
      avisos = avisos.filter(a => a !== local);
      toast('No se pudo marcar el mensaje. Revisa tu conexión.');
    } else if (data) {
      avisos[avisos.indexOf(local)] = data;
      if (conDeshacer) {
        const perro = item.cita?.perro || item.ficha?.perro;
        toast(omitido ? `${TIPO_AVISO[item.tipo]} de ${perro}: no se enviará` : `${TIPO_AVISO[item.tipo]} de ${perro}: marcado como enviado`,
          { accion: 'Deshacer', fn: () => deshacerAviso(data) });
      }
    }
    updateCount();
    if (!$('#view-hoy').hidden) renderHoy();
  }

  async function deshacerAviso(row) {
    const { error } = await sb.from('avisos').delete().eq('id', row.id);
    if (error) { toast('No se pudo deshacer. Revisa tu conexión.'); return; }
    avisos = avisos.filter(a => a.id !== row.id);
    updateCount();
    renderHoy();
    toast('Listo: el mensaje volvió a la lista');
  }

  // Devuelve un texto para mostrar si el correo salió, o '' si no aplica
  async function enviarCorreoConfirmacion(cita) {
    const f = fichaDe(cita);
    if (!f?.correo || cita.fecha < today()) return '';
    try {
      const { data, error } = await sb.functions.invoke('avisos-correo', { body: { modo: 'confirmacion', cita_id: cita.id } });
      if (error) throw error;
      if (data?.enviados > 0) {
        avisos.push({ tipo: 'confirmacion', canal: 'correo', cita_id: cita.id, creado: new Date().toISOString() });
        return `También le enviamos la confirmación a ${f.correo}.`;
      }
      return '';
    } catch (err) {
      console.error(err);
      return 'El correo de confirmación no salió ahora; se intentará de nuevo mañana a las 8:00 a. m.';
    }
  }

  let abierto = null;   // { id, act } del formulario de llegada/entrega abierto

  async function refreshHoy() {
    renderHoy();
    try { await loadAll(); renderHoy(); } catch (err) {
      console.error(err);
      toast(isAuthError(err) ? 'Tu sesión se cerró. Vuelve a iniciar sesión.' : 'No se pudieron cargar las citas de hoy. Revisa tu conexión.');
    }
  }

  function hoyRow(c) {
    const f = fichaDe(c);
    const alerts = alertsFor(f);
    const est = { agendada: 'Por llegar', en_katana: "En Katana's", entregada: 'Entregado' }[c.estado] || ESTADO_LABEL[c.estado];
    let acciones = '';
    if (abierto?.id === c.id) {
      const llegada = abierto.act === 'recibir';
      acciones = `<div class="inline-form">
        <label for="nota-${esc(c.id)}">${llegada ? '¿Cómo llegó y qué dejó?' : '¿Qué se le hizo? ¿Algo que contarle al dueño?'} <span class="opt">opcional</span></label>
        <p class="hint">${llegada ? 'Nudos, heridas, pulgas o garrapatas; collar, correa o juguete.' : 'Por ejemplo: se le encontró una herida, se portó muy bien.'}</p>
        <textarea id="nota-${esc(c.id)}" rows="2"></textarea>
        <div class="row-actions">
          <button type="button" class="btn btn-primary btn-sm" data-act="${llegada ? 'ok-recibir' : 'ok-entregar'}" data-id="${esc(c.id)}">${llegada ? 'Confirmar llegada' : 'Confirmar entrega'}</button>
          <button type="button" class="link-btn" data-act="cerrar" data-id="${esc(c.id)}">Cancelar</button>
        </div></div>`;
    } else if (c.estado === 'agendada') {
      acciones = `<div class="row-actions">
        <button type="button" class="btn btn-primary btn-sm" data-act="recibir" data-id="${esc(c.id)}">Recibir</button>
        <button type="button" class="link-btn" data-act="reprogramar" data-id="${esc(c.id)}">Reprogramar</button>
        <button type="button" class="link-btn" data-act="novino" data-id="${esc(c.id)}">No vino</button></div>`;
    } else if (c.estado === 'en_katana') {
      acciones = `<div class="row-actions"><button type="button" class="btn btn-primary btn-sm" data-act="entregar" data-id="${esc(c.id)}">Entregar</button></div>`;
    }
    const notas = [
      c.llegada ? `Llegó a las ${horaDe(c.llegada)}${c.nota_llegada ? ': ' + c.nota_llegada : ''}` : '',
      c.salida ? `Entregado a las ${horaDe(c.salida)}${c.nota_salida ? ': ' + c.nota_salida : ''}` : ''
    ].filter(Boolean).map(t => `<p class="meta">${esc(t)}</p>`).join('');
    return `<li class="row hoy-row estado-${esc(c.estado)}">
      <div class="when"><span class="h">${esc(hora12(c.hora))}</span>${c.fecha !== today() ? `<span class="d">${esc(fmtDay(c.fecha))}</span>` : ''}</div>
      <div>
        <p class="name">${esc(c.perro)}</p>
        <p class="meta">${esc(c.cliente || 'Cliente sin ficha')} · ${esc(asList(c.servicios).join(', '))}</p>
        <ul class="tags"><li class="tag estado">${esc(est)}</li>${alerts.map(a => `<li class="tag alert">${esc(a)}</li>`).join('')}</ul>
        ${notas}${acciones}
      </div>
    </li>`;
  }

  let pendLista = [];

  function renderHoy() {
    if (!$('#hoyFecha')) return;
    const t = today(), manana = addDays(t, 1);
    $('#hoyFecha').textContent = fmtLong(t);

    const sinFrec = fichas.filter(f => !f.frecuencia).length;
    $('#sinFrec').hidden = sinFrec === 0;
    $('#sinFrecText').textContent = `${plural(sinFrec, 'perro no tiene', 'perros no tienen')} frecuencia de visita, así que no ${sinFrec === 1 ? 'recibirá' : 'recibirán'} "Le toca volver".`;

    const deHoy = citas.filter(c => c.estado !== 'cancelada' && (c.fecha === t || c.estado === 'en_katana'))
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
    $('#hoyCitas').innerHTML = deHoy.length
      ? `<ul class="rows">${deHoy.map(hoyRow).join('')}</ul>`
      : `<div class="empty"><p>No hay citas para hoy.</p></div>`;

    pendLista = pendientes();
    $('#hoyMensajes').innerHTML = pendLista.length
      ? `<ul class="rows">${pendLista.map((it, i) => {
          const c = it.cita, f = it.ficha;
          const perro = c?.perro || f?.perro;
          const cliente = c?.cliente || f?.nombre || 'Cliente sin ficha';
          const num = c?.whatsapp || f?.whatsapp;
          const extra = it.tipo === 'toca_volver' ? `Última visita: ${fmtDay(it.ref)}` : `${fmtDay(c.fecha)}, ${hora12(c.hora)}`;
          const etiqueta = it.atrasado ? 'Recordatorio atrasado · la cita es hoy' : TIPO_AVISO[it.tipo];
          const correo = avisoDe(it.tipo, 'correo', it) ? '<p class="note">El correo ya salió.</p>' : '';
          return `<li class="row msg tipo-${it.tipo}${it.atrasado ? ' atrasado' : ''}"><div>
            <p class="msg-type">${esc(etiqueta)}</p>
            <p class="name">${esc(perro)}</p>
            <p class="meta">${esc(cliente)} · ${esc(fmtWa(num))} · ${esc(extra)}</p>
            <p class="msg-text">${esc(mensaje(it))}</p>
            ${correo}
            <div class="row-actions">
              <a class="btn btn-wa btn-sm" href="${esc(waLink(num, mensaje(it)))}" target="_blank" rel="noopener" data-send="${i}">Enviar por WhatsApp</a>
              <button type="button" class="link-btn" data-skip="${i}">No enviar</button>
            </div></div></li>`;
        }).join('')}</ul>`
      : `<div class="empty"><p>No hay mensajes pendientes. Aquí aparecen las confirmaciones, los avisos de la víspera, los perros que ya deben volver y los que están listos para recoger.</p></div>`;

    const deManana = citas.filter(c => c.fecha === manana && c.estado !== 'cancelada').sort((a, b) => a.hora.localeCompare(b.hora));
    $('#hoyManana').innerHTML = deManana.length
      ? `<ul class="rows compact">${deManana.map(c => `<li class="row"><div class="when"><span class="h">${esc(hora12(c.hora))}</span></div>
          <div><p class="name">${esc(c.perro)}</p><p class="meta">${esc(c.cliente || 'Cliente sin ficha')} · ${esc(asList(c.servicios).join(', '))}</p>
          <div class="row-links"><button type="button" class="link-btn" data-act="reprogramar" data-id="${esc(c.id)}">Reprogramar</button></div></div></li>`).join('')}</ul>`
      : `<div class="empty"><p>No hay citas para mañana.</p></div>`;

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
    if (act === 'ok-entregar') await actualizarCita(id, { estado: 'entregada', salida: new Date().toISOString(), nota_salida: nota }, `${c.perro} entregado. Avísale al dueño en "Mensajes por enviar".`);
    b.disabled = false;
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
    $('#tabs').hidden = !logged;
    $('#logout').hidden = !logged;
    if (logged) switchTab('hoy');
    else { $('#view-hoy').hidden = true; $('#view-nueva').hidden = true; $('#view-registros').hidden = true; }
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
      citas = []; fichas = []; avisos = [];
      $('#loginPass').value = '';
      showView('login');
      return;
    }
    if (started) return;
    started = true;
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
