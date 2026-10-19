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
      ]
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
          options: ['Menos de 1 año', 'De 1 a 3 años', 'De 3 a 5 años', 'Más de 5 años'] },
        { name: 'frecuencia', label: '¿Cada cuánto trae al perro?', type: 'radio',
          options: ['Cada 2 semanas', 'Cada mes', 'Cada 2 meses', 'De vez en cuando'] }
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
          hint: 'Si el cliente no sabe la fecha exacta, anota una aproximada.' }
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

  // ---------- Columnas del Excel (clave en la base → título) ----------
  const CITA_COLS = [
    ['creado', 'Registrada el'], ['fecha', 'Fecha de la cita'], ['hora', 'Hora'],
    ['perro', 'Perro'], ['cliente', 'Cliente'], ['whatsapp', 'WhatsApp'], ['servicios', 'Servicios'],
    ['canal', 'Agendó por'], ['tipo', 'Tipo de cliente'], ['estado', 'Estado'],
    ['llegada', 'Llegada'], ['salida', 'Salida'], ['novedades', 'Novedades']
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
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const stamp = iso => {
    const d = new Date(iso);
    if (isNaN(d)) return iso || '';
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

  // ---------- Supabase ----------
  const cfg = window.KATANA_CONFIG || {};
  const configured = cfg.supabaseUrl && !cfg.supabaseUrl.includes('TU-PROYECTO') && cfg.supabaseAnonKey && !cfg.supabaseAnonKey.includes('PEGA-AQUI');
  const sb = configured && window.supabase ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  let citas = [];
  let fichas = [];
  const findFicha = (wa, perro) => fichas.find(f => keyOf(f.whatsapp, f.perro) === keyOf(wa, perro));

  async function loadAll() {
    const [f, c] = await Promise.all([
      sb.from('fichas').select('*').order('perro'),
      sb.from('citas').select('*').order('fecha').order('hora')
    ]);
    if (f.error) throw f.error;
    if (c.error) throw c.error;
    fichas = f.data;
    citas = c.data.map(x => ({ ...x, hora: hhmm(x.hora) }));
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

  // ---------- Render de campos ----------
  const normOpt = o => typeof o === 'string' ? { v: o, l: o } : o;

  function fieldHTML(f) {
    const opt = f.req || f.type === 'consent' ? '' : '<span class="opt">opcional</span>';
    const hint = f.hint ? `<p class="hint" id="h-${f.name}">${f.hint}</p>` : '';
    const err = `<p class="err" id="e-${f.name}" hidden></p>`;
    const desc = `aria-describedby="${f.hint ? `h-${f.name} ` : ''}e-${f.name}"`;

    if (['text', 'tel', 'email', 'date', 'time'].includes(f.type)) {
      const extra = f.type === 'tel' ? 'inputmode="tel" autocomplete="off" placeholder="7123-4567"'
        : f.type === 'email' ? 'autocomplete="off" placeholder="nombre@gmail.com"'
        : f.type === 'text' ? 'autocomplete="off"' : '';
      return `<div class="field" data-field="${f.name}">
        <label for="f-${f.name}">${f.label}${opt}</label>${hint}
        <input id="f-${f.name}" name="${f.name}" type="${f.type}" ${extra} ${f.list ? `list="dl-${f.name}"` : ''} ${desc}>
        ${f.list ? `<datalist id="dl-${f.name}"></datalist>` : ''}${err}</div>`;
    }
    if (f.type === 'textarea') {
      return `<div class="field" data-field="${f.name}">
        <label for="f-${f.name}">${f.label}${opt}</label>${hint}
        <textarea id="f-${f.name}" name="${f.name}" rows="3" ${desc}></textarea>${err}</div>`;
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
        ${s.fields.map(fieldHTML).join('')}
        ${s.after || ''}
        ${(s.tail || []).map(fieldHTML).join('')}
      </section>`).join('');
  }

  // ---------- Valores y validación ----------
  const form = $('#form');
  const otherText = name => (form.querySelector(`[name="${name}__otro"]`)?.value || '').trim();

  function getVal(name) {
    const els = $$(`[name="${name}"]`, form);
    if (!els.length) return '';
    const first = els[0];
    if (first.type === 'radio') {
      const c = els.find(i => i.checked);
      if (!c) return '';
      return c.value === '__otro' ? otherText(name) : c.value;
    }
    if (first.type === 'checkbox') {
      return els.filter(i => i.checked)
        .map(i => i.value === '__otro' ? otherText(name) : i.value)
        .filter(Boolean);
    }
    return first.value.trim();
  }

  function checkField(f) {
    const v = getVal(f.name);
    const empty = Array.isArray(v) ? v.length === 0 : !v;
    if (f.other && form.querySelector(`[name="${f.name}"][value="__otro"]:checked`) && !otherText(f.name)) {
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

  function showErr(name, msg) {
    const p = $(`#e-${name}`);
    const field = form.querySelector(`[data-field="${name}"]`);
    if (!p || !field) return;
    p.textContent = msg;
    p.hidden = !msg;
    field.classList.toggle('invalid', !!msg);
  }

  function validateStep(id) {
    let first = null;
    for (const f of allFields(id)) {
      const msg = checkField(f);
      showErr(f.name, msg);
      if (msg && !first) first = f;
    }
    if (first) {
      const el = form.querySelector(`[name="${first.name}__otro"]:not([hidden])`) && !otherText(first.name)
        ? form.querySelector(`[name="${first.name}__otro"]`)
        : form.querySelector(`[name="${first.name}"]`);
      el?.focus();
      el?.closest('.field')?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
    return !first;
  }

  // ---------- Navegación ----------
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
    if (!validateStep(p[idx])) return;
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

  form.addEventListener('change', e => {
    const t = e.target;
    if (t.type !== 'radio' && t.type !== 'checkbox') return;
    const other = form.querySelector(`[name="${t.name}__otro"]`);
    if (other) {
      const on = !!form.querySelector(`[name="${t.name}"][value="__otro"]:checked`);
      other.hidden = !on;
      if (on && t.value === '__otro') other.focus();
    }
    showErr(t.name, '');
    if (t.name === 'tipo') show();
  });

  form.addEventListener('input', e => {
    const name = e.target.name.replace(/__otro$/, '');
    if ($(`#e-${name}`) && !$(`#e-${name}`).hidden) showErr(name, '');
    if (e.target.name === 'wa_b' || e.target.name === 'perro_b') updateMatch();
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
        frecuencia: tipo === 'antes' ? (getVal('frecuencia') || null) : null,
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
  }

  function showDone(c, note) {
    form.hidden = true;
    const done = $('#done');
    $('#doneSummary').textContent = `${c.perro} · ${fmtLong(c.fecha)}, ${c.hora}`;
    $('#doneNote').textContent = [asList(c.servicios).join(', '), note].filter(Boolean).join('. ');
    done.hidden = false;
    window.scrollTo({ top: 0 });
    $('h2', done).focus({ preventScroll: true });
  }

  function resetForm() {
    form.reset();
    $$('.other', form).forEach(o => { o.hidden = true; });
    $$('.err', form).forEach(p => { p.hidden = true; p.textContent = ''; });
    $$('.field.invalid', form).forEach(f => f.classList.remove('invalid'));
    idx = 0;
    $('#done').hidden = true;
    form.hidden = false;
    show(true);
  }

  $('#again').addEventListener('click', resetForm);
  $('#toRegistros').addEventListener('click', () => { resetForm(); switchTab('registros'); });

  // ---------- Pestañas ----------
  function switchTab(which) {
    const reg = which === 'registros';
    $('#tab-nueva').setAttribute('aria-selected', String(!reg));
    $('#tab-registros').setAttribute('aria-selected', String(reg));
    $('#view-nueva').hidden = reg;
    $('#view-registros').hidden = !reg;
    if (reg) refresh();
    window.scrollTo({ top: 0 });
  }
  $('#tab-nueva').addEventListener('click', () => switchTab('nueva'));
  $('#tab-registros').addEventListener('click', () => switchTab('registros'));

  // ---------- Registros ----------
  let listMode = 'citas';

  $$('.seg-btn').forEach(b => b.addEventListener('click', () => {
    listMode = b.dataset.list;
    $$('.seg-btn').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    renderList();
  }));

  function updateCount() { $('#count').textContent = citas.length; }

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

  function citaRow(c) {
    const f = c.ficha_id ? fichas.find(x => x.id === c.ficha_id) : findFicha(c.whatsapp, c.perro);
    const alerts = alertsFor(f).filter(a => !a.startsWith('Alergias'));
    const estado = c.estado && c.estado !== 'agendada' ? `<li class="tag">${esc(ESTADO_LABEL[c.estado] || c.estado)}</li>` : '';
    return `<li class="row">
      <div class="when"><span class="d">${esc(fmtDay(c.fecha))}</span><span class="h">${esc(c.hora)}</span></div>
      <div>
        <p class="name">${esc(c.perro)}</p>
        <p class="meta">${esc(c.cliente || 'Cliente sin ficha')} · ${esc(asList(c.servicios).join(', '))}</p>
        <ul class="tags"><li class="tag">${esc(TIPO_LABEL[c.tipo] || c.tipo)}</li>${estado}${alerts.map(a => `<li class="tag alert">${esc(a)}</li>`).join('')}</ul>
      </div>
      <button type="button" class="link-btn" data-del="${esc(c.id)}" aria-label="Eliminar la cita de ${esc(c.perro)}">Eliminar</button>
    </li>`;
  }

  function renderList() {
    const box = $('#list');
    if (listMode === 'citas') {
      if (!citas.length) {
        box.innerHTML = `<div class="empty"><p>Todavía no hay citas registradas.</p><button type="button" class="btn btn-primary" id="goNueva">Registrar una cita</button></div>`;
        $('#goNueva').addEventListener('click', () => switchTab('nueva'));
        return;
      }
      const t = today();
      const key = c => `${c.fecha} ${c.hora}`;
      const prox = citas.filter(c => c.fecha >= t).sort((a, b) => key(a).localeCompare(key(b)));
      const pas = citas.filter(c => c.fecha < t).sort((a, b) => key(b).localeCompare(key(a)));
      box.innerHTML =
        (prox.length ? `<h3 class="group-title">Próximas</h3><ul class="rows">${prox.map(citaRow).join('')}</ul>` : '') +
        (pas.length ? `<h3 class="group-title">Pasadas</h3><ul class="rows">${pas.map(citaRow).join('')}</ul>` : '');
      return;
    }
    if (!fichas.length) {
      box.innerHTML = `<div class="empty"><p>Las fichas se crean al registrar una cita de un cliente nuevo o de antes.</p></div>`;
      return;
    }
    const sorted = [...fichas].sort((a, b) => norm(a.perro).localeCompare(norm(b.perro)));
    box.innerHTML = `<ul class="rows">${sorted.map(f => {
      const visitas = citas.filter(c => c.ficha_id === f.id);
      const ultima = visitas.map(c => c.fecha).sort().pop();
      const alerts = alertsFor(f);
      return `<li class="row ficha"><div>
        <p class="name">${esc(f.perro)}</p>
        <p class="meta">${esc([f.raza, f.tamano].filter(Boolean).join(' · '))}</p>
        <p class="meta">${esc(f.nombre)} · ${esc(f.whatsapp)}</p>
        <p class="meta">${plural(visitas.length, 'cita', 'citas')}${ultima ? ` · última: ${esc(fmtDay(ultima))}` : ''}</p>
        ${alerts.length ? `<ul class="tags">${alerts.map(a => `<li class="tag alert">${esc(a)}</li>`).join('')}</ul>` : ''}
      </div></li>`;
    }).join('')}</ul>`;
  }

  $('#list').addEventListener('click', async e => {
    const id = e.target.closest('[data-del]')?.dataset.del;
    if (!id) return;
    const c = citas.find(x => x.id === id);
    if (!c) return;
    if (!confirm(`¿Eliminar la cita de ${c.perro} del ${fmtDay(c.fecha)}, ${c.hora}? No se puede deshacer.`)) return;
    const { error } = await sb.from('citas').delete().eq('id', id);
    if (error) { toast('No se pudo eliminar la cita. Revisa tu conexión e intenta de nuevo.'); return; }
    citas = citas.filter(x => x.id !== id);
    updateCount();
    renderRegistros();
    toast('Cita eliminada');
  });

  // ---------- Excel ----------
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

  function sheet(rows, cols) {
    const ws = XLSX.utils.aoa_to_sheet([cols.map(c => c[1]), ...rows.map(r => toRow(r, cols))]);
    ws['!cols'] = cols.map(([k, label]) => {
      const longest = Math.max(label.length, ...rows.map(r => String(toRow(r, [[k]])[0]).length));
      return { wch: Math.min(Math.max(longest + 2, 10), 48) };
    });
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: cols.length - 1 } }) };
    return ws;
  }

  $('#export').addEventListener('click', async () => {
    if (!window.XLSX) { toast('No se pudo cargar el generador de Excel. Revisa tu conexión e intenta de nuevo.'); return; }
    try { await loadAll(); } catch { toast('No se pudieron cargar los datos más recientes. Revisa tu conexión.'); return; }
    if (!citas.length && !fichas.length) { toast('Todavía no hay registros para descargar.'); return; }
    const sortedCitas = [...citas].sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
    const sortedFichas = [...fichas].sort((a, b) => norm(a.perro).localeCompare(norm(b.perro)));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet(sortedCitas, CITA_COLS), 'Citas');
    XLSX.utils.book_append_sheet(wb, sheet(sortedFichas, FICHA_COLS), 'Fichas');
    XLSX.writeFile(wb, `Katanas_Grooming_Citas_y_Clientes_${today()}.xlsx`);
    renderRegistros();
    toast('Excel descargado');
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

  // ---------- Sesión ----------
  function isAuthError(err) {
    const s = String(err?.code || '') + ' ' + String(err?.message || '');
    return /PGRST301|JWT|401|not authenticated/i.test(s);
  }

  function showView(which) {
    $('#loading').hidden = true;
    const logged = which === 'app';
    $('#view-login').hidden = logged;
    $('#tabs').hidden = !logged;
    $('#logout').hidden = !logged;
    if (logged) switchTab('nueva');
    else { $('#view-nueva').hidden = true; $('#view-registros').hidden = true; }
  }

  function loginError(msg) {
    const p = $('#loginErr');
    p.textContent = msg;
    p.hidden = !msg;
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

  $('#logout').addEventListener('click', async () => {
    await sb.auth.signOut();
  });

  let started = false;
  async function onSession(session) {
    if (!session) {
      started = false;
      citas = []; fichas = [];
      $('#loginPass').value = '';
      showView('login');
      return;
    }
    if (started) return;
    started = true;
    showView('app');
    resetForm();
    try { await loadAll(); } catch (err) {
      console.error(err);
      toast('No se pudieron cargar las fichas. Revisa tu conexión.');
    }
  }

  // ---------- Aviso ----------
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3600);
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
    sb.auth.onAuthStateChange((_event, session) => { onSession(session); });
  }
})();
