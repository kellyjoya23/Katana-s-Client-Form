-- Katana's Grooming · Base de datos de citas y fichas
-- Pega todo este archivo en Supabase > SQL Editor > New query y dale a "Run".
-- Se puede volver a ejecutar sin perder datos.

-- ============================================================
-- Fichas: una fila por perro (con los datos de su dueño)
-- ============================================================
create table if not exists public.fichas (
  id            uuid primary key default gen_random_uuid(),
  creada        timestamptz not null default now(),
  actualizada   timestamptz not null default now(),
  origen        text,                       -- Cliente nuevo / Cliente de antes

  -- El perro
  perro         text not null,
  raza          text,
  tamano        text,
  pelo          text,
  sexo          text,
  esterilizado  text,
  cumple        date,
  vacunas       text,
  alergias      text,
  caracter      text[] not null default '{}',
  notas         text,
  novedades     text,                       -- se va sumando en cada cita

  -- El cliente
  nombre        text not null,
  whatsapp      text not null,              -- formato 7123-4567
  correo        text,
  colonia       text,
  contacto      text,
  como_conocio  text,
  desde_cuando  text,
  frecuencia    text,

  -- Permisos
  autoriza      boolean not null default false,
  fotos         boolean,
  recordatorios boolean
);

-- Un mismo número no puede tener dos perros con el mismo nombre
create unique index if not exists fichas_whatsapp_perro_unico
  on public.fichas (whatsapp, lower(perro));

-- ============================================================
-- Citas: una fila por cita
-- ============================================================
create table if not exists public.citas (
  id            uuid primary key default gen_random_uuid(),
  creado        timestamptz not null default now(),
  creado_por    uuid default auth.uid() references auth.users (id) on delete set null,
  ficha_id      uuid references public.fichas (id) on delete set null,

  fecha         date not null,
  hora          time not null,
  perro         text not null,
  cliente       text,
  whatsapp      text,
  servicios     text[] not null default '{}',
  canal         text,
  tipo          text not null check (tipo in ('ficha', 'nuevo', 'antes')),
  novedades     text,

  -- Listo para el check-in y check-out (siguiente paso)
  estado        text not null default 'agendada'
                check (estado in ('agendada', 'en_katana', 'entregada', 'cancelada')),
  llegada       timestamptz,
  salida        timestamptz,
  nota_llegada  text,
  nota_salida   text
);

create index if not exists citas_fecha_idx on public.citas (fecha, hora);
create index if not exists citas_ficha_idx on public.citas (ficha_id);
create index if not exists citas_creado_por_idx on public.citas (creado_por);

-- ============================================================
-- Fecha de actualización automática en las fichas
-- ============================================================
create or replace function public.marcar_actualizada()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizada := now();
  return new;
end;
$$;

drop trigger if exists fichas_actualizada on public.fichas;
create trigger fichas_actualizada
  before update on public.fichas
  for each row execute function public.marcar_actualizada();

-- ============================================================
-- Seguridad
-- El enlace de la app es público, así que solo pueden ver y editar datos
-- las cuentas marcadas como "equipo" (app_metadata.rol = 'equipo').
-- Aunque alguien lograra crearse una cuenta, sin esa marca no ve nada.
-- Para marcar una cuenta, ejecuta (cambiando el correo):
--   update auth.users
--   set raw_app_meta_data = raw_app_meta_data || '{"rol":"equipo"}'
--   where email = 'correo@ejemplo.com';
-- ============================================================
revoke all on public.fichas, public.citas from anon, authenticated;
grant select, insert, update         on public.fichas to authenticated;
grant select, insert, update, delete on public.citas  to authenticated;

alter table public.fichas enable row level security;
alter table public.citas  enable row level security;

drop policy if exists "Equipo ve fichas"       on public.fichas;
drop policy if exists "Equipo crea fichas"     on public.fichas;
drop policy if exists "Equipo edita fichas"    on public.fichas;
drop policy if exists "Equipo ve citas"        on public.citas;
drop policy if exists "Equipo crea citas"      on public.citas;
drop policy if exists "Equipo edita citas"     on public.citas;
drop policy if exists "Equipo elimina citas"   on public.citas;

create policy "Equipo ve fichas" on public.fichas for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'equipo');
create policy "Equipo crea fichas" on public.fichas for insert to authenticated
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'equipo');
create policy "Equipo edita fichas" on public.fichas for update to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'equipo')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'equipo');

create policy "Equipo ve citas" on public.citas for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'equipo');
create policy "Equipo crea citas" on public.citas for insert to authenticated
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'equipo');
create policy "Equipo edita citas" on public.citas for update to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'equipo')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'equipo');
create policy "Equipo elimina citas" on public.citas for delete to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'equipo');

-- Las fichas no se pueden borrar desde la app (para no perder historial).
-- Si alguna vez hace falta, se borran desde Table Editor en Supabase.

-- ============================================================
-- Avisos: registro de cada mensaje enviado (o que se decidió no enviar)
-- Evita mandar dos veces el mismo mensaje por el mismo canal.
--   tipo:  confirmacion · dia_antes · toca_volver · listo
--   canal: whatsapp (lo envía el equipo con un toque) · correo (automático)
-- ============================================================
create table if not exists public.avisos (
  id         uuid primary key default gen_random_uuid(),
  creado     timestamptz not null default now(),
  creado_por uuid default auth.uid() references auth.users (id) on delete set null,
  tipo       text not null check (tipo in ('confirmacion', 'dia_antes', 'toca_volver', 'listo')),
  canal      text not null check (canal in ('whatsapp', 'correo')),
  omitido    boolean not null default false,   -- se decidió no enviarlo
  cita_id    uuid references public.citas (id) on delete cascade,
  ficha_id   uuid references public.fichas (id) on delete cascade,
  ref_fecha  date,                             -- para "toca volver": fecha de la última visita
  destino    text,                             -- número o correo al que se envió
  check (cita_id is not null or ficha_id is not null)
);

create unique index if not exists avisos_cita_unico
  on public.avisos (tipo, canal, cita_id) where cita_id is not null;
create unique index if not exists avisos_volver_unico
  on public.avisos (tipo, canal, ficha_id, ref_fecha) where tipo = 'toca_volver';
create index if not exists avisos_ficha_idx      on public.avisos (ficha_id);
create index if not exists avisos_creado_por_idx on public.avisos (creado_por);

revoke all on public.avisos from anon, authenticated;
grant select, insert on public.avisos to authenticated;
alter table public.avisos enable row level security;

drop policy if exists "Equipo ve avisos"   on public.avisos;
drop policy if exists "Equipo crea avisos" on public.avisos;
create policy "Equipo ve avisos" on public.avisos for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'equipo');
create policy "Equipo crea avisos" on public.avisos for insert to authenticated
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'equipo');
