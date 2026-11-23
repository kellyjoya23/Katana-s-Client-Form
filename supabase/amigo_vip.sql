-- Katana's Grooming · Programa de lealtad "Katana's VIP"
-- Se ejecuta después de schema.sql. Se puede volver a ejecutar sin perder datos
-- (la vista y las funciones se borran y se vuelven a crear; las tablas no se tocan).
--
-- Reglas (las mismas de la tarjeta impresa):
--   · Cada perro tiene su propia tarjeta de 10 sellos.
--   · Suma un sello cada cita ENTREGADA con un grooming completo
--     (Grooming completo, de deslanado o pelo corto).
--   · Para sumar, el perro tiene que volver a más tardar 30 días después de su visita anterior.
--     Si pasan más de 30 días, esa visita no suma, pero conserva los sellos que ya tenía
--     y desde ahí vuelven a contar los 30 días.
--   · Premios: sello 3 regalito sorpresa · sello 5 10 % de descuento · sello 7 tratamiento
--     hidratante · sello 10 experiencia spa. Al llenar los 10, empieza una tarjeta nueva.
--   · Bienvenida: los perros con al menos una cita entregada entre el 1 de noviembre de 2026
--     y el día del lanzamiento empiezan con 1 sello (sin importar cuántas citas tuvieron).

-- ============================================================
-- Código de la tarjeta digital (va en el enlace que recibe el cliente)
-- ============================================================
alter table public.fichas
  add column if not exists codigo text not null
  default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
create unique index if not exists fichas_codigo_unico on public.fichas (codigo);

-- ============================================================
-- Canjes: cada premio entregado
-- ============================================================
create table if not exists public.canjes (
  id          uuid primary key default gen_random_uuid(),
  creado      timestamptz not null default now(),
  creado_por  uuid default auth.uid() references auth.users (id) on delete set null,
  ficha_id    uuid not null references public.fichas (id) on delete cascade,
  ronda       int  not null check (ronda >= 1),          -- número de tarjeta (1, 2, 3…)
  hito        int  not null check (hito in (3, 5, 7, 10)), -- sello que dio el premio
  cita_id     uuid references public.citas (id) on delete set null,
  unique (ficha_id, ronda, hito)
);
create index if not exists canjes_cita_idx on public.canjes (cita_id);
create index if not exists canjes_creado_por_idx on public.canjes (creado_por);

revoke all on public.canjes from anon, authenticated;
grant select, insert, delete on public.canjes to authenticated;
alter table public.canjes enable row level security;

drop policy if exists "Equipo ve canjes"      on public.canjes;
drop policy if exists "Equipo crea canjes"    on public.canjes;
drop policy if exists "Equipo elimina canjes" on public.canjes;
create policy "Equipo ve canjes" on public.canjes for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'equipo');
create policy "Equipo crea canjes" on public.canjes for insert to authenticated
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'equipo');
create policy "Equipo elimina canjes" on public.canjes for delete to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'equipo');

-- ============================================================
-- Cálculo de sellos de un perro
-- ============================================================
drop view if exists public.amigo_vip;
drop function if exists public.tarjeta_amigo_vip(text);
drop function if exists public.amigo_vip_calcular(uuid);
create or replace function public.amigo_vip_calcular(p_ficha uuid)
returns table (
  sellos_total   int,   -- sellos acumulados desde el inicio (todas las tarjetas)
  ronda          int,   -- tarjeta actual
  sellos         int,   -- sellos en la tarjeta actual (0 a 10)
  ultima_visita  date,  -- última visita que cuenta para los 30 días
  vence          date,  -- fecha límite para que la próxima visita sume
  visitas_sin_sello int, -- visitas que no sumaron por pasar de 30 días
  ultima_sumo    boolean -- si la última visita sumó sello
)
language plpgsql
stable
set search_path = ''
as $$
declare
  inicio_bono constant date := date '2026-11-01';
  lanzamiento constant date := date '2026-11-23';
  v_total int := 0;
  v_ult   date;
  v_sin   int := 0;
  v_sumo  boolean := false;
  r record;
begin
  -- Sello de bienvenida
  select max(c.fecha) into v_ult
  from public.citas c
  where c.ficha_id = p_ficha and c.estado = 'entregada'
    and c.fecha >= inicio_bono and c.fecha < lanzamiento;
  if v_ult is not null then v_total := 1; v_sumo := true; end if;

  -- Visitas desde el lanzamiento
  for r in
    select distinct c.fecha
    from public.citas c
    where c.ficha_id = p_ficha and c.estado = 'entregada' and c.fecha >= lanzamiento
      and exists (select 1 from unnest(c.servicios) s where s ilike 'grooming completo%')
    order by c.fecha
  loop
    if v_ult is null or r.fecha - v_ult <= 30 then
      v_total := v_total + 1;
      v_sumo := true;
    else
      v_sin := v_sin + 1;
      v_sumo := false;
    end if;
    v_ult := r.fecha;
  end loop;

  sellos_total := v_total;
  ronda := case when v_total = 0 then 1 else (v_total - 1) / 10 + 1 end;
  sellos := case when v_total = 0 then 0 else (v_total - 1) % 10 + 1 end;
  ultima_visita := v_ult;
  vence := v_ult + 30;
  visitas_sin_sello := v_sin;
  ultima_sumo := v_sumo;
  return next;
end;
$$;

revoke all on function public.amigo_vip_calcular(uuid) from public, anon;
grant execute on function public.amigo_vip_calcular(uuid) to authenticated;

-- Vista para el equipo (respeta las reglas de seguridad de fichas y citas)
create or replace view public.amigo_vip
with (security_invoker = true) as
  select f.id as ficha_id, e.*
  from public.fichas f
  cross join lateral public.amigo_vip_calcular(f.id) e;

revoke all on public.amigo_vip from anon, authenticated;
grant select on public.amigo_vip to authenticated;

-- ============================================================
-- Tarjeta pública: con el código del enlace devuelve solo lo que se ve en la tarjeta
-- (nombre del perro, primer nombre del tutor y sellos). Nada más de la ficha.
-- ============================================================
create or replace function public.tarjeta_amigo_vip(p_codigo text)
returns table (perro text, tutor text, ronda int, sellos int, ultima_visita date, vence date)
language sql
stable
security definer
set search_path = ''
as $$
  select f.perro, split_part(trim(f.nombre), ' ', 1), e.ronda, e.sellos, e.ultima_visita, e.vence
  from public.fichas f
  cross join lateral public.amigo_vip_calcular(f.id) e
  where length(p_codigo) = 12 and f.codigo = p_codigo;
$$;

revoke all on function public.tarjeta_amigo_vip(text) from public;
grant execute on function public.tarjeta_amigo_vip(text) to anon, authenticated;

-- ============================================================
-- Aviso de bienvenida al programa (un mensaje por perro)
-- ============================================================
alter table public.avisos drop constraint if exists avisos_tipo_check;
alter table public.avisos add constraint avisos_tipo_check
  check (tipo in ('confirmacion', 'dia_antes', 'toca_volver', 'listo', 'amigo_vip'));
create unique index if not exists avisos_vip_unico
  on public.avisos (tipo, canal, ficha_id) where tipo = 'amigo_vip';

-- ============================================================
-- Depurar registros de prueba
-- ============================================================
-- Citas: se pueden eliminar las que todavía no pasan (agendadas) y las canceladas (no cuentan para nada)
drop policy if exists "Equipo elimina citas" on public.citas;
create policy "Equipo elimina citas" on public.citas for delete to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'equipo'
         and (estado = 'cancelada'
              or (estado = 'agendada' and fecha >= (now() at time zone 'America/El_Salvador')::date)));

-- Eliminar un perrito con todo su historial (pruebas o duplicados). Solo el equipo;
-- la app pide escribir el nombre del perrito antes de llamarla.
create or replace function public.eliminar_ficha_completa(p_ficha uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
begin
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'rol', '') <> 'equipo' then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  delete from public.citas where ficha_id = p_ficha;   -- sus avisos se borran en cascada
  get diagnostics n = row_count;
  delete from public.fichas where id = p_ficha;        -- avisos y canjes de la ficha, en cascada
  if not found then
    raise exception 'No existe la ficha' using errcode = 'P0002';
  end if;
  return n;
end;
$$;

revoke all on function public.eliminar_ficha_completa(uuid) from public, anon;
grant execute on function public.eliminar_ficha_completa(uuid) to authenticated;
