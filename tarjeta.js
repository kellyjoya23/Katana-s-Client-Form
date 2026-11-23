/* Katana's Grooming · Tarjeta Katana's VIP (página pública para el cliente)
 * Lee el código del enlace (?c=…) y pide a Supabase solo lo que se ve en la tarjeta.
 */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const PREMIOS = {
    3: 'Regalito sorpresa para tu mascota',
    5: '10% de descuento en grooming completo',
    7: 'Tratamiento hidratante de manto gratis',
    10: 'Experiencia Spa gratis'
  };
  const HUELLA = '<svg viewBox="0 0 34 34" aria-hidden="true"><ellipse cx="17" cy="22.5" rx="7.5" ry="6.5"/><circle cx="8" cy="14" r="3.3"/><circle cx="13.5" cy="8.5" r="3.3"/><circle cx="20.5" cy="8.5" r="3.3"/><circle cx="26" cy="14" r="3.3"/></svg>';
  const REGALO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>';

  const pad = n => String(n).padStart(2, '0');
  const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const fechaLarga = iso => new Date(iso + 'T12:00').toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long' });

  function error() {
    $('#cargando').hidden = true;
    $('#error').hidden = false;
  }

  function pintar(t) {
    document.title = `${t.perro} · Katana's VIP · Katana's Grooming`;
    $('#perro').textContent = t.perro;
    $('#tutor').textContent = t.tutor ? `Tutor: ${t.tutor}` : '';
    if (t.ronda > 1) $('#tutor').textContent += ` · Tarjeta n.º ${t.ronda}`;

    const ol = $('#sellos');
    ol.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
      const li = document.createElement('li');
      const lleno = i <= t.sellos;
      li.className = 'sello' + (lleno ? ' lleno' : '') + (PREMIOS[i] ? ' hito' : '');
      li.innerHTML = (lleno ? HUELLA : PREMIOS[i] ? REGALO : HUELLA) + `<span class="num">${i}</span>`;
      li.setAttribute('aria-label', `Sello ${i}: ${lleno ? 'ganado' : 'pendiente'}${PREMIOS[i] ? ` · premio: ${PREMIOS[i]}` : ''}`);
      ol.appendChild(li);
    }

    $('#cuenta').textContent = t.sellos === 10
      ? '¡Completaste la tarjeta! Con tu próximo grooming completo empieza una nueva.'
      : t.sellos === 0
        ? 'Tu tarjeta empieza con tu próximo grooming completo.'
        : `Llevas ${t.sellos} de 10 sellos.`;

    const plazo = $('#plazo');
    if (t.vence && t.sellos < 10) {
      plazo.textContent = t.vence >= hoy()
        ? `Para que tu próxima visita sume, reserva antes del ${fechaLarga(t.vence)}.`
        : 'Pasaron más de 30 días desde tu última visita: la próxima no suma sello, pero conservas los que tienes y desde ahí vuelve a contar el plazo.';
      plazo.classList.toggle('vencido', t.vence < hoy());
    } else {
      plazo.hidden = true;
    }

    $('#reservar').href = `https://wa.me/50371616881?text=${encodeURIComponent(`¡Hola! Quiero reservar un grooming para ${t.perro}.`)}`;

    $('#premios').innerHTML = Object.entries(PREMIOS).map(([h, txt]) => {
      const n = Number(h), ganado = t.sellos >= n, faltan = n - t.sellos;
      return `<li class="premio${ganado ? ' ganado' : ''}"><span class="visita">Visita ${n}</span><span class="ptxt">${txt}</span><span class="pestado">${ganado ? 'Ganado' : `Faltan ${faltan}`}</span></li>`;
    }).join('');

    $('#cargando').hidden = true;
    $('#pase').hidden = false;
    $('#premiosBloque').hidden = false;
    $('#condiciones').hidden = false;
  }

  async function iniciar() {
    const codigo = new URLSearchParams(location.search).get('c') || '';
    const cfg = window.KATANA_CONFIG || {};
    if (!/^[0-9a-f]{12}$/.test(codigo) || !window.supabase || !cfg.supabaseUrl) return error();
    const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { persistSession: false } });
    const { data, error: err } = await sb.rpc('tarjeta_amigo_vip', { p_codigo: codigo });
    if (err || !data || !data.length) return error();
    pintar(data[0]);
  }

  iniciar().catch(error);
})();
