-- Katana's Grooming · Avisar a Google Calendar cuando cambia una cita
-- Se ejecuta después de schema.sql. Requiere las extensiones pg_net y supabase_vault (vienen en Supabase).
--
-- La dirección del script y la clave secreta se guardan en el Vault de Supabase (cifradas):
--   select vault.create_secret('https://script.google.com/macros/s/…/exec', 'gcal_url');
--   select vault.create_secret('<clave secreta>', 'gcal_clave');
-- Mientras no existan, el aviso no hace nada y las citas se guardan igual.

create or replace function public.avisar_calendario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url   text;
  v_clave text;
  v_cita  public.citas;
  v_accion text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'gcal_url';
  select decrypted_secret into v_clave from vault.decrypted_secrets where name = 'gcal_clave';
  if v_url is null or v_clave is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    v_cita := old; v_accion := 'borrar';
  else
    v_cita := new; v_accion := 'guardar';
  end if;

  perform net.http_post(
    url := v_url,
    body := jsonb_build_object(
      'clave', v_clave,
      'accion', v_accion,
      'cita', jsonb_build_object(
        'id', v_cita.id, 'fecha', v_cita.fecha, 'hora', v_cita.hora, 'estado', v_cita.estado,
        'perro', v_cita.perro, 'cliente', v_cita.cliente, 'whatsapp', v_cita.whatsapp,
        'servicios', to_jsonb(v_cita.servicios))),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 10000
  );
  return coalesce(new, old);
end;
$$;

revoke all on function public.avisar_calendario() from public, anon, authenticated;

drop trigger if exists citas_calendario on public.citas;
create trigger citas_calendario
  after insert or delete or update of fecha, hora, estado, servicios, perro, cliente, whatsapp
  on public.citas
  for each row execute function public.avisar_calendario();

-- Para pasar al calendario las citas que ya estaban agendadas (una sola vez, después de configurar):
--   update public.citas set fecha = fecha where estado in ('agendada', 'en_katana') and fecha >= current_date;
