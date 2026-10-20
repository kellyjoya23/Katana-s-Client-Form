// Katana's Grooming · avisos-correo
// Envía por correo (desde katanagrooming@gmail.com) los avisos a clientes que dejaron su correo:
//   - confirmacion: al agendar o reprogramar (la app la llama al guardar) y, si falló, en la revisión diaria
//   - dia_antes:    la víspera de la cita
//   - toca_volver:  cuando ya pasó la frecuencia del perro desde su última visita
// Los perros del mismo cliente con cita a la misma hora van en un solo correo.
// La revisión diaria la dispara pg_cron todos los días a las 8:00 a. m. (hora de El Salvador).
//
// Secretos (Supabase > Edge Functions > Secrets):
//   GMAIL_APP_PASSWORD  contraseña de aplicación de Gmail de katanagrooming@gmail.com (16 letras)
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
const conPunto = (t: string) => t.endsWith('.') ? t : t + '.'
const unir = (l: string[]) => l.length < 2 ? (l[0] ?? '') : l.slice(0, -1).join(', ') + ' y ' + l[l.length - 1]
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

type Cita = { id: string; ficha_id: string; perro: string; fecha: string; hora: string; tipo: string }
type Grupo = { tipo: string; para: string; nombre: string; citas: Cita[]; ficha_id?: string; ref_fecha?: string; perro?: string; dias?: number }

// *texto* va en negrita (igual que en WhatsApp)
function armar(g: Grupo, citas: Cita[]) {
  const n = primerNombre(g.nombre)
  const hola = n ? `¡Hola, ${n}!` : '¡Hola!'
  const perros = unir(citas.map(c => c.perro))
  const c = citas[0]
  if (g.tipo === 'confirmacion') {
    const lineas = [
      `${hola}`,
      conPunto(`Será un placer atender a ${perros} el ${fechaLarga(c.fecha)} a las ${hora12(c.hora)}`),
      'El servicio de grooming tiene una duración aproximada de 2 a 3 horas, dependiendo del comportamiento de su mascota.',
      '*Le informamos que no se permite esperar a su mascota en nuestro local.*',
      'Si desea cancelar su cita, por favor háganoslo saber con al menos 1 hora de anticipación para permitir la liberación del espacio.',
      '*En caso de no presentarse a la cita después de 15 minutos, lamentablemente no podremos recibir a su mascota.*',
      '*Si no recoge a su mascota dentro de 1 hora después de notificarle que está lista, se aplicará un recargo de $1 por hora.*'
    ]
    if (citas.some(x => x.tipo === 'nuevo' || x.tipo === 'antes')) {
      lineas.push('Al confirmar su cita, nos autoriza a guardar sus datos para agendar sus citas, a enviarle recordatorios por WhatsApp y correo, y a compartir fotos de su mascota en nuestras redes. Si no está de acuerdo con alguno, háganoslo saber respondiendo este correo.')
    }
    return { asunto: `Cita confirmada: ${perros}, ${fechaLarga(c.fecha)}`, texto: lineas.join('\n\n') }
  }
  if (g.tipo === 'dia_antes') return {
    asunto: `Mañana le esperamos con ${perros}`,
    texto: `${hola} Le recordamos que mañana, ${fechaLarga(c.fecha)}, a las ${hora12(c.hora)} esperamos a ${perros} en Katana's Grooming. Si no puede asistir, por favor háganoslo saber con al menos 1 hora de anticipación.`
  }
  return {
    asunto: `${g.perro} ya está para su próxima visita`,
    texto: `${hola} Ya ${TIEMPO_TXT[g.dias!] ?? 'pasó un tiempo'} desde la última visita de ${g.perro} a Katana's Grooming. ¿Le agendamos la próxima? Respóndanos con el día y la hora que le quedan mejor.`
  }
}

const textoPlano = (t: string) => t.replace(/\*([^*\n]+)\*/g, '$1')
function html(texto: string) {
  const cuerpo = texto.split('\n\n').map(p => `<p style="margin:0 0 14px">${esc(p).replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')}</p>`).join('')
  return `<!doctype html><html lang="es"><body style="margin:0;padding:24px 12px;background:#F2EFFF;font-family:Arial,Helvetica,sans-serif;color:#1F1747">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
  <table role="presentation" width="100%" style="max-width:520px;background:#FDFDFD;border-radius:20px;overflow:hidden" cellspacing="0" cellpadding="0">
    <tr><td style="background:#664EFC;padding:18px 24px;color:#FDFDFD;font-size:22px;font-weight:bold;letter-spacing:.5px">Katana's <span style="font-size:11px;letter-spacing:3px;color:#F2EFFF">GROOMING</span></td></tr>
    <tr><td style="padding:26px 24px 12px;font-size:16px;line-height:1.55">${cuerpo}</td></tr>
    <tr><td style="padding:0 24px 22px;font-size:13px;color:#5b5480">Katana's Grooming · Peluquería canina · San Salvador</td></tr>
  </table></td></tr></table></body></html>`
}

// ---------- Qué hay que enviar ----------
async function pendientes(modo: string, citaId?: string): Promise<Grupo[]> {
  const t = hoySV(), manana = addDays(t, 1)
  const enviados = new Set((await sql`select tipo, cita_id, ficha_id, ref_fecha from public.avisos where canal = 'correo'`)
    .map(a => a.tipo === 'toca_volver' ? `${a.tipo}|${a.ficha_id}|${iso(a.ref_fecha)}` : `${a.tipo}|${a.cita_id}`))

  // Si se pide la confirmación de una cita, también van los otros perros del mismo cliente a la misma hora
  const citas = await sql`
    select c.id, c.fecha, to_char(c.hora, 'HH24:MI') as hora, c.perro, c.tipo, c.creado,
           f.id as ficha_id, f.nombre, lower(trim(f.correo)) as correo, f.recordatorios
    from public.citas c join public.fichas f on f.id = c.ficha_id
    where c.estado = 'agendada' and c.fecha >= ${t}::date
      and coalesce(trim(f.correo), '') <> ''
      ${citaId ? sql`and (c.id = ${citaId} or (c.fecha, c.hora, lower(trim(f.correo))) in (
            select c2.fecha, c2.hora, lower(trim(f2.correo)) from public.citas c2 join public.fichas f2 on f2.id = c2.ficha_id where c2.id = ${citaId}))` : sql``}
    order by c.fecha, c.hora, c.perro`

  const grupos = new Map<string, Grupo>()
  const sumar = (tipo: string, c: Record<string, any>) => {
    const k = [tipo, c.correo, iso(c.fecha), c.hora].join('|')
    if (!grupos.has(k)) grupos.set(k, { tipo, para: c.correo, nombre: c.nombre, citas: [] })
    grupos.get(k)!.citas.push({ id: c.id, ficha_id: c.ficha_id, perro: c.perro, fecha: iso(c.fecha), hora: c.hora, tipo: c.tipo })
  }
  for (const c of citas) {
    if (!enviados.has(`confirmacion|${c.id}`)) sumar('confirmacion', c)
    if (modo === 'diario' && iso(c.fecha) === manana && fechaSV(c.creado) < t && c.recordatorios !== false
      && !enviados.has(`dia_antes|${c.id}`)) sumar('dia_antes', c)
  }
  const out = [...grupos.values()]

  if (modo === 'diario') {
    const fichas = await sql`
      select f.id, f.perro, f.nombre, lower(trim(f.correo)) as correo, f.frecuencia,
        (select max(c.fecha) from public.citas c where c.ficha_id = f.id and c.estado <> 'cancelada' and c.fecha <= ${t}::date) as ultima,
        exists (select 1 from public.citas c where c.ficha_id = f.id and c.estado <> 'cancelada'
                and (c.fecha > ${t}::date or (c.fecha = ${t}::date and c.estado <> 'entregada'))) as tiene_proxima
      from public.fichas f
      where f.recordatorios is true and coalesce(trim(f.correo), '') <> ''`
    for (const f of fichas) {
      const dias = FREC_DIAS[f.frecuencia]
      if (!dias || !f.ultima || f.tiene_proxima) continue
      const ult = iso(f.ultima)
      if (addDays(ult, dias) > t || enviados.has(`toca_volver|${f.id}|${ult}`)) continue
      out.push({ tipo: 'toca_volver', para: f.correo, nombre: f.nombre, citas: [], ficha_id: f.id, ref_fecha: ult, perro: f.perro, dias })
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
    if (body.simulacion) {
      return json({ simulacion: true, hoy: hoySV(), pendientes: lista.map(g => ({ tipo: g.tipo, para: g.para, perros: g.citas.length ? g.citas.map(c => c.perro) : [g.perro], asunto: armar(g, g.citas).asunto })) })
    }
    if (!GMAIL_PASS) return json({ enviados: 0, pendientes: lista.length, motivo: 'Falta configurar GMAIL_APP_PASSWORD' })

    const mail = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: GMAIL_USER, pass: GMAIL_PASS } })
    let enviados = 0
    const errores: string[] = []
    for (const g of lista) {
      // Se registra primero: si dos revisiones corren a la vez, la regla única evita el doble envío
      const ids: string[] = []
      const propias: Cita[] = []
      if (g.tipo === 'toca_volver') {
        const r = await sql`insert into public.avisos (tipo, canal, ficha_id, ref_fecha, destino)
          values ('toca_volver', 'correo', ${g.ficha_id!}, ${g.ref_fecha!}, ${g.para}) on conflict do nothing returning id`
        ids.push(...r.map(x => x.id))
      } else {
        for (const c of g.citas) {
          const r = await sql`insert into public.avisos (tipo, canal, cita_id, ficha_id, destino)
            values (${g.tipo}, 'correo', ${c.id}, ${c.ficha_id}, ${g.para}) on conflict do nothing returning id`
          if (r.length) { ids.push(r[0].id); propias.push(c) }
        }
      }
      if (!ids.length) continue
      const { asunto, texto } = armar(g, propias)
      try {
        await mail.sendMail({ from: `"Katana's Grooming" <${GMAIL_USER}>`, to: g.para, subject: asunto, text: textoPlano(texto), html: html(texto) })
        enviados++
      } catch (e) {
        await sql`delete from public.avisos where id = any(${ids})`
        errores.push(`${g.tipo} → ${g.para}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    if (errores.length) console.error('avisos-correo errores', errores)
    return json({ enviados, errores: errores.length })
  } catch (e) {
    console.error(e)
    return json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
