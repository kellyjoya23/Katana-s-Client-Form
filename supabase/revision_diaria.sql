-- Katana's Grooming · Revisión diaria de avisos por correo (ya aplicada en katanas-grooming)
-- Corre todos los días a las 8:00 a. m. de El Salvador (14:00 UTC) y llama a la función avisos-correo.
-- La clave avisos_cron_secret se genera dentro de la base y nunca sale de ella.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select vault.create_secret('https://pbdidopwajxcciaidlal.supabase.co', 'project_url', 'URL del proyecto para tareas programadas')
where not exists (select 1 from vault.secrets where name = 'project_url');

select vault.create_secret(encode(extensions.gen_random_bytes(24), 'hex'), 'avisos_cron_secret', 'Clave de la revisión diaria de avisos-correo')
where not exists (select 1 from vault.secrets where name = 'avisos_cron_secret');

select cron.schedule(
  'katana-avisos-diarios',
  '0 14 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/avisos-correo',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'avisos_cron_secret')
    ),
    body := '{"modo":"diario"}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- Para ver qué enviaría hoy sin enviar nada, ejecuta esto y luego mira net._http_response:
-- select net.http_post(
--   url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/avisos-correo',
--   headers := jsonb_build_object('Content-Type', 'application/json',
--     'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'avisos_cron_secret')),
--   body := '{"modo":"diario","simulacion":true}'::jsonb);
