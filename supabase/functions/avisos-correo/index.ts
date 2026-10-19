// Katana's Grooming · avisos-correo
// Envía por correo (desde katanagrooming@gmail.com) los avisos a clientes que dejaron su correo:
//   - confirmacion: al agendar (la app la llama al guardar) y, si falló, en la revisión diaria
//   - dia_antes:    la víspera de la cita
//   - toca_volver:  cuando ya pasó la frecuencia del perro desde su última visita
// La revisión diaria la dispara pg_cron todos los días a las 8:00 a. m. (hora de El Salvador).
//
// Secretos (Supabase > Edge Functions > Secrets):
//   GMAIL_APP_PASSWORD  contraseña de aplicación de Gmail de katanagrooming@gmail.com
//   GMAIL_USER          opcional; por defecto katanagrooming@gmail.com
import postgres from 'npm:postgres@3.4.5'
import nodemailer from 'npm:nodemailer@6.9.16'

const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { prepare: false, max: 2 })
const SB_URL = Deno.env.get('SUPABASE_URL')!
const ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const GMAIL_USER = Deno.env.get('GMAIL_USER') ?? 'katanagrooming@gmail.com'
const GMAIL_PASS = (Deno.env.get('GMAIL_APP_PASSWORD') ?? '').replace(/\s+/g, '')
const TZ = 'America/El_Salvador'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

// ---------- Fechas y textos ----------
const FREC_DIAS: Record<string, number> = { 'Cada 2 semanas': 14, 'Cada mes': 30, 'Cada 2 meses': 60 }
const TIEMPO_TXT: Record<number, string> = { 14: 'pasaron dos semanas', 30: 'pasó un mes', 60: 'pasaron dos meses' }
const hoySV = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date())
const fechaSV = (ts: Date | string) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(ts))
const iso = (d: Date | string) => typeof d === 'string' ? d.slice(0, 10) : d.toISOString().slice(0, 10)
const addDays = (d: string, n: number) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return iso(x) }
const fechaLarga = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('es-SV', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' })
const hora12 = (h: string) => { const [H, M] = String(h).split(':').map(Number); return new Date(Date.UTC(2000, 0, 1, H, M || 0)).toLocaleTimeString('es-SV', { timeZone: 'UTC', hour: 'numeric', minute: '2-digit' }) }
const primerNombre = (n?: string | null) => String(n ?? '').trim().split(/\s+/)[0] ?? ''
const listaTxt = (arr: string[] | null) => { const l = (arr ?? []).map(x => x.toLowerCase()); return l.length < 2 ? (l[0] ?? '') : l.slice(0, -1).join(', ') + ' y ' + l[l.length - 1] }
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

type Aviso = { tipo: string; cita_id?: string | null; ficha_id: string; ref_fecha?: string | null; para: string; asunto: string; texto: string }

function armar(tipo: string, d: Record<string, any>): Omit<Aviso, 'tipo' | 'cita_id' | 'ficha_id' | 'ref_fecha' | 'para'> {
  const n = primerNombre(d.nombre)
  const hola = n ? `¡Hola, ${n}!` : '¡Hola!'
  if (tipo === 'confirmacion') return {
    asunto: `Cita confirmada: ${d.perro}, ${fechaLarga(iso(d.fecha))}`,
    texto: `${hola} Te confirmamos la cita de ${d.perro} en Katana's Grooming: ${fechaLarga(iso(d.fecha))} a las ${hora12(d.hora)}, para ${listaTxt(d.servicios)}. Si necesitas cambiarla, respóndenos este correo o escríbenos por WhatsApp. ¡Nos vemos!`
  }
  if (tipo === 'dia_antes') return {
    asunto: `Mañana te esperamos con ${d.perro}`,
    texto: `${hola} Te recordamos que mañana, ${fechaLarga(iso(d.fecha))}, a las ${hora12(d.hora)} esperamos a ${d.perro} en Katana's Grooming. Si no pueden venir, avísanos para darle el espacio a otro peludo.`
  }
  return {
    asunto: `${d.perro} ya está para su próxima visita`,
    texto: `${hola} Ya ${TIEMPO_TXT[d.dias] ?? 'pasó un tiempo'} desde la última visita de ${d.perro} a Katana's Grooming. ¿Le agendamos la próxima? Respóndenos con el día y la hora que te quedan mejor.`
  }
}

function html(texto: string) {
  return `<!doctype html><html lang="es"><body style="margin:0;padding:24px 12px;background:#F2EFFF;font-family:Arial,Helvetica,sans-serif;color:#1F1747">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
  <table role="presentation" width="100%" style="max-width:520px;background:#FDFDFD;border-radius:20px;overflow:hidden" cellspacing="0" cellpadding="0">
    <tr><td style="background:#664EFC;padding:18px 24px;color:#FDFDFD;font-size:22px;font-weight:bold;letter-spacing:.5px">Katana's <span style="font-size:11px;letter-spacing:3px;color:#BAAEFF">GROOMING</span></td></tr>
    <tr><td style="padding:26px 24px;font-size:16px;line-height:1.55">${esc(texto)}</td></tr>
    <tr><td style="padding:0 24px 22px;font-size:13px;color:#5b5480">Katana's Grooming · Peluquería canina · San Salvador</td></tr>
  </table></td></tr></table></body></html>`
}

// ---------- Qué hay que enviar ----------
async function pendientes(modo: string, citaId?: string): Promise<Aviso[]> {
  const t = hoySV(), manana = addDays(t, 1)
  const out: Aviso[] = []
  const yaEnviado = async (tipo: string, citaId: string | null, fichaId: string, ref: string | null) => {
    const r = tipo === 'toca_volver'
      ? await sql`select 1 from public.avisos where tipo = ${tipo} and canal = 'correo' and ficha_id = ${fichaId} and ref_fecha = ${ref}`
      : await sql`select 1 from public.avisos where tipo = ${tipo} and canal = 'correo' and cita_id = ${citaId}`
    return r.length > 0
  }

  const citas = await sql`
    select c.id, c.fecha, to_char(c.hora, 'HH24:MI') as hora, c.perro, c.servicios, c.estado, c.creado,
           f.id as ficha_id, f.nombre, f.correo, f.recordatorios
    from public.citas c join public.fichas f on f.id = c.ficha_id
    where c.estado = 'agendada' and c.fecha >= ${t}::date
      and coalesce(trim(f.correo), '') <> ''
      ${citaId ? sql`and c.id = ${citaId}` : sql``}`

  for (const c of citas) {
    const fecha = iso(c.fecha)
    if (!(await yaEnviado('confirmacion', c.id, c.ficha_id, null))) {
      out.push({ tipo: 'confirmacion', cita_id: c.id, ficha_id: c.ficha_id, para: c.correo.trim(), ...armar('confirmacion', c) })
    }
    if (modo === 'diario' && fecha === manana && fechaSV(c.creado) < t && c.recordatorios !== false
      && !(await yaEnviado('dia_antes', c.id, c.ficha_id, null))) {
      out.push({ tipo: 'dia_antes', cita_id: c.id, ficha_id: c.ficha_id, para: c.correo.trim(), ...armar('dia_antes', c) })
    }
  }

  if (modo === 'diario') {
    const fichas = await sql`
      select f.id, f.perro, f.nombre, f.correo, f.frecuencia,
        (select max(c.fecha) from public.citas c where c.ficha_id = f.id and c.estado <> 'cancelada' and c.fecha <= ${t}::date) as ultima,
        exists (select 1 from public.citas c where c.ficha_id = f.id and c.estado <> 'cancelada'
                and (c.fecha > ${t}::date or (c.fecha = ${t}::date and c.estado <> 'entregada'))) as tiene_proxima
      from public.fichas f
      where f.recordatorios is true and coalesce(trim(f.correo), '') <> ''`
    for (const f of fichas) {
      const dias = FREC_DIAS[f.frecuencia]
      if (!dias || !f.ultima || f.tiene_proxima) continue
      const ult = iso(f.ultima)
      if (addDays(ult, dias) > t) continue
      if (await yaEnviado('toca_volver', null, f.id, ult)) continue
      out.push({ tipo: 'toca_volver', ficha_id: f.id, ref_fecha: ult, para: f.correo.trim(), ...armar('toca_volver', { ...f, dias }) })
    }
  }
  return out
}

// ---------- Quién puede llamar ----------
async function autorizado(req: Request) {
  const cron = req.headers.get('x-cron-secret')
  if (cron) {
    const r = await sql`select decrypted_secret from vault.decrypted_secrets where name = 'avisos_cron_secret'`
    return r.length > 0 && r[0].decrypted_secret === cron
  }
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return false
  const res = await fetch(`${SB_URL}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: ANON } })
  if (!res.ok) return false
  const user = await res.json()
  return user?.app_metadata?.rol === 'equipo'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Usa POST' }, 405)
  try {
    if (!(await autorizado(req))) return json({ error: 'No autorizado' }, 401)
    const body = await req.json().catch(() => ({}))
    const modo = body.modo === 'confirmacion' ? 'confirmacion' : 'diario'
    if (modo === 'confirmacion' && !body.cita_id) return json({ error: 'Falta cita_id' }, 400)

    const lista = await pendientes(modo, body.cita_id)
    if (body.simulacion) return json({ simulacion: true, hoy: hoySV(), pendientes: lista.map(({ texto: _t, ...a }) => a) })
    if (!GMAIL_PASS) return json({ enviados: 0, pendientes: lista.length, motivo: 'Falta configurar GMAIL_APP_PASSWORD' })

    const mail = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: GMAIL_USER, pass: GMAIL_PASS } })
    let enviados = 0
    const errores: string[] = []
    for (const a of lista) {
      // Se registra primero: si dos revisiones corren a la vez, la regla única evita el doble envío
      const ins = await sql`
        insert into public.avisos (tipo, canal, cita_id, ficha_id, ref_fecha, destino)
        values (${a.tipo}, 'correo', ${a.cita_id ?? null}, ${a.ficha_id}, ${a.ref_fecha ?? null}, ${a.para})
        on conflict do nothing returning id`
      if (ins.length === 0) continue
      try {
        await mail.sendMail({ from: `"Katana's Grooming" <${GMAIL_USER}>`, to: a.para, subject: a.asunto, text: a.texto, html: html(a.texto) })
        enviados++
      } catch (e) {
        await sql`delete from public.avisos where id = ${ins[0].id}`
        errores.push(`${a.tipo} → ${a.para}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    if (errores.length) console.error('avisos-correo errores', errores)
    return json({ enviados, errores: errores.length })
  } catch (e) {
    console.error(e)
    return json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
