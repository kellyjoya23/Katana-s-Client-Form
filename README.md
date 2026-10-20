# Registro de citas · Katana's Grooming

App web para que el equipo de Katana's registre cada cita y, de paso, arme la base de clientes. Los datos se guardan en **Supabase**, así que se ven igual desde cualquier teléfono o computadora, y se pueden descargar en Excel (hojas **Citas** y **Fichas**).

## Archivos

| Archivo | Qué es |
| --- | --- |
| `index.html` | La página |
| `styles.css` | Estilos con el design system v3 (paleta y tipografías) |
| `app.js` | Inicio de sesión, formulario, registros y Excel |
| `config.js` | Conexión con Supabase (aquí van la URL y la clave pública) |
| `vendor/` | Librerías incluidas en el sitio: supabase-js 2.118.0 y SheetJS 0.18.5 (versión mini, solo para crear el Excel) |
| `icons/`, `manifest.webmanifest` | Ícono y nombre de la app al agregarla a la pantalla de inicio |
| `vercel.json` | Encabezados de seguridad (política de contenido, bloqueo de iframes) |
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

## 3. Recuperar contraseña (una sola vez)

Para que el enlace de "Olvidé mi contraseña" lleve a la app, en Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://katana-s-client-form.vercel.app`
- **Redirect URLs:** agrega `https://katana-s-client-form.vercel.app/**`

## 4. Conexión de la app

`config.js` ya tiene la URL y la clave pública del proyecto. La clave *anon* puede ir en el código porque la seguridad la ponen las reglas de la base. **Nunca** pongas ahí la clave *service_role* ni una clave *secret*.

## 5. Publicar en Vercel

1. Crea un repositorio en GitHub (por ejemplo `katana-registro`) y sube los archivos, con la carpeta `supabase`.
2. En vercel.com, **Add New → Project** e importa el repositorio.
3. En *Framework Preset* elige **Other**. Deja vacíos el comando de build y la carpeta de salida.
4. **Deploy.** Comparte el enlace con Tere para que inicie sesión y agregue la página a la pantalla de inicio del teléfono.

## Cómo funciona

- **Hoy** (se abre al iniciar sesión):
  - **Citas de hoy:** **Recibir** guarda la hora de llegada y cómo llegó el perro; **Entregar**, la hora de salida y lo que se le hizo; **Reprogramar** cambia fecha u hora; **No vino** la marca como cancelada.
  - **Mensajes por enviar:** la app arma cada mensaje y abre el WhatsApp del cliente con el texto listo. Al tocar **Enviar por WhatsApp** o **No enviar** aparece **Deshacer** por unos segundos, por si no se llegó a mandar.
  - **Mañana:** las citas del día siguiente, para preparar la agenda.
  - Si hay perros sin frecuencia de visita, un aviso lleva directo a completar sus fichas.
- **Mensajes que se preparan solos:**
  | Mensaje | Cuándo | A quién |
  | --- | --- | --- |
  | Confirmación de cita (texto de Katana's: duración, no esperar en el local, cancelación, 15 minutos de tolerancia y recargo de $1 por hora; a clientes nuevos, también la autorización de datos, fotos y recordatorios) | Al agendar y al reprogramar | Todos |
  | Cita de mañana | La víspera; si no se envió, aparece como "atrasado" el mismo día antes de la cita | Quien no dijo "No" a recordatorios |
  | Le toca volver | Cuando pasan 15 días, 1 mes o 2 meses (según la frecuencia del perro) desde su última visita y no tiene otra cita | Solo quien aceptó recordatorios |
  | Listo para recoger | Al entregar el perro | Todos |
- **Correo automático:** la confirmación, el aviso de la víspera y "le toca volver" también salen por correo desde katanagrooming@gmail.com a quien dejó su correo (la confirmación, al guardar o reprogramar; lo demás, todos los días a las 8:00 a. m.).
- **Nueva cita:**
  - Servicios con los nombres de Katana's: **Grooming completo**, **Grooming completo de deslanado**, **Grooming completo pelo corto**, **Baño completo** y **Hand stripping**, más los adicionales (limpieza de dientes, tratamiento de nudos, baño medicado, ozonoterapia).
  - Solo son obligatorios el nombre de la persona encargada, el WhatsApp, el nombre y el sexo del perro. Lo demás se completa después en **Editar ficha**.
  - Las fotos en redes y los recordatorios quedan en "Sí", porque la autorización va en el mensaje de confirmación. Se cambian a "No" solo si el cliente lo pide.
  - **Agregar otro perro de este cliente** copia la cita y los datos del dueño; cada perro queda con su propia ficha y la confirmación sale en un solo mensaje para todos.
  - Si ya hay otra cita a la misma hora (de otro cliente), la app avisa; para agendarla igual, se vuelve a tocar el botón.
- **Registros:**
  - Buscador por perro, cliente o WhatsApp.
  - Citas agrupadas por día. Las que aún no ocurren se pueden **Reprogramar**, **Cancelar** (queda en el historial) o **Eliminar** (solo si fue un error). Las canceladas se pueden **Reactivar**.
  - **Editar ficha** en cada perro; si la ficha no tiene citas, también se puede eliminar.
  - **Descargar Excel** con citas (incluye llegada, salida y notas) y fichas.

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
- Para no perder historial, la base solo deja eliminar fichas sin citas y citas que todavía no ocurren. Lo demás se cancela.
- Descargar el Excel de vez en cuando sirve como respaldo propio.
