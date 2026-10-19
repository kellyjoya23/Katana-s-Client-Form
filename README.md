# Registro de citas · Katana's Grooming

App web para que el equipo de Katana's registre cada cita y, de paso, arme la base de clientes. Los datos se guardan en **Supabase**, así que se ven igual desde cualquier teléfono o computadora, y se pueden descargar en Excel (hojas **Citas** y **Fichas**).

## Archivos

| Archivo | Qué es |
| --- | --- |
| `index.html` | La página |
| `styles.css` | Estilos con el design system v3 (paleta y tipografías) |
| `app.js` | Inicio de sesión, formulario, registros y Excel |
| `config.js` | Conexión con Supabase (aquí van la URL y la clave pública) |
| `supabase/schema.sql` | Tablas y reglas de seguridad de la base de datos |
| `supabase/functions/avisos-correo/index.ts` | Función que envía los correos automáticos |
| `supabase/revision_diaria.sql` | Tarea diaria (8:00 a. m.) que dispara los correos |

No hay que instalar nada ni compilar.

## 1. Base de datos en Supabase

Proyecto: **katanas-grooming** (cuenta katanagrooming@gmail.com).

Las tablas `fichas` y `citas` ya están creadas, con sus reglas de seguridad. `supabase/schema.sql` es la copia de esa estructura: sirve para revisarla o para recrearla en otro proyecto (en **SQL Editor → New query → Run**). Se puede volver a ejecutar sin perder datos.

## 2. Crear las cuentas del equipo

La app pide iniciar sesión porque el enlace es público y la base tiene datos personales de clientes. Además, solo las cuentas **marcadas como equipo** ven los datos: aunque alguien lograra crearse una cuenta, sin esa marca no ve nada.

1. En **Authentication → Sign In / Providers**, desactiva **Allow new users to sign up**.
2. En **Authentication → Users → Add user → Create new user**, crea una cuenta por persona (por ejemplo, la de Tere) con su correo y una contraseña. Marca **Auto Confirm User**.
3. Marca la cuenta como equipo en **SQL Editor** (cambia el correo):

   ```sql
   update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"rol":"equipo"}'
   where email = 'correo-de-tere@gmail.com';
   ```

   Si la persona ya había iniciado sesión antes de marcarla, que cierre sesión y vuelva a entrar.

Para quitarle el acceso a alguien, borra su usuario en **Authentication → Users**.

## 3. Conexión de la app

`config.js` ya tiene la URL y la clave pública del proyecto. La clave *anon* puede ir en el código porque la seguridad la ponen las reglas de la base. **Nunca** pongas ahí la clave *service_role* ni una clave *secret*.

## 4. Publicar en Vercel

1. Crea un repositorio en GitHub (por ejemplo `katana-registro`) y sube los archivos, con la carpeta `supabase`.
2. En vercel.com, **Add New → Project** e importa el repositorio.
3. En *Framework Preset* elige **Other**. Deja vacíos el comando de build y la carpeta de salida.
4. **Deploy.** Comparte el enlace con Tere para que inicie sesión y agregue la página a la pantalla de inicio del teléfono.

## Cómo funciona

- **Hoy** (se abre al iniciar sesión):
  - **Citas de hoy:** cada perro con su estado. **Recibir** guarda la hora de llegada y una nota de cómo llegó y qué dejó (nudos, heridas, pulgas; collar, correa). **Entregar** guarda la hora de salida y lo que se le hizo. **No vino** marca la cita como cancelada.
  - **Mensajes por enviar:** la app arma cada mensaje y abre el WhatsApp del cliente con el texto listo; quien atiende solo toca enviar. **No enviar** lo quita de la lista. Cada mensaje queda registrado para no repetirlo.
- **Mensajes que se preparan solos:**
  | Mensaje | Cuándo | A quién |
  | --- | --- | --- |
  | Confirmación de cita | Al agendar | Todos |
  | Cita de mañana | La víspera, si la cita se agendó antes de ese día | Quien no dijo "No" a recordatorios |
  | Le toca volver | Cuando pasan 15 días, 1 mes o 2 meses (según la frecuencia del perro) desde su última visita y no tiene otra cita | Solo quien aceptó recordatorios |
  | Listo para recoger | Al entregar el perro | Todos |
- **Correo automático:** la confirmación, el aviso de la víspera y "le toca volver" también salen por correo desde katanagrooming@gmail.com a quien dejó su correo (la confirmación, al guardar la cita; lo demás, todos los días a las 8:00 a. m.). "Listo para recoger" va solo por WhatsApp.
- **Nueva cita:** fecha, hora, servicios, canal y si el perro ya tiene ficha. La ficha incluye **cada cuánto debería venir**, que es lo que activa "le toca volver".
- **Registros:** citas y fichas, **Descargar Excel** (con estado, llegada y salida) y **Actualizar**.

## Activar los correos (una sola vez)

Los correos salen de katanagrooming@gmail.com con una **contraseña de aplicación** de Google (no es la contraseña normal):

1. Entra a myaccount.google.com con katanagrooming@gmail.com → **Seguridad** → activa la **Verificación en dos pasos** si no está activa.
2. Busca **Contraseñas de aplicaciones**, crea una llamada `Katana app` y copia las 16 letras.
3. En Supabase → **Edge Functions → Secrets**, agrega `GMAIL_APP_PASSWORD` con esas 16 letras.

Mientras no esté, todo lo demás funciona; solo no salen correos.

## Tipografía

Los títulos usan **Days One** (Google Fonts). Gilroy es una fuente de pago, así que la página la usa si está instalada en el dispositivo y, si no, muestra **Outfit**, la alternativa gratuita más parecida. Para que Gilroy se vea en todos los dispositivos, sube sus archivos `.woff2` al repositorio y agrega su `@font-face` al inicio de `styles.css`.

## Logo

El encabezado muestra un monograma provisional. Para usar el logo oficial, sube `logo.svg` al repositorio y sigue el comentario en `index.html`.

## Bueno saber

- En el plan gratuito de Supabase, un proyecto que pasa **una semana sin uso** se pausa y hay que reactivarlo desde el panel. Con el uso diario de la agenda no debería pasar.
- Las fichas no se pueden borrar desde la app, para no perder historial. Si hace falta, se borran en **Table Editor** de Supabase.
- Descargar el Excel de vez en cuando sirve como respaldo propio.
