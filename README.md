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
| `supabase/amigo_vip.sql` | Programa de lealtad Katana's VIP (se ejecuta después de `schema.sql`) |
| `tarjeta.html`, `tarjeta.css`, `tarjeta.js` | Tarjeta Katana's VIP que ve el cliente |

No hay que instalar nada ni compilar.

## 1. Base de datos en Supabase

Proyecto: **katanas-grooming** (cuenta katanagrooming@gmail.com).

Las tablas `fichas`, `citas` y `avisos` ya están creadas, con sus reglas de seguridad. `supabase/schema.sql` es la copia de esa estructura: sirve para revisarla o para recrearla en otro proyecto (en **SQL Editor → New query → Run**). Se puede volver a ejecutar sin perder datos.

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

- **Menú lateral:** Inicio, Mensajes, Nueva cita, Citas y fichas, y Katana's VIP. En la computadora queda fijo a la izquierda; en el teléfono se abre con el botón de menú (arriba a la izquierda), que también muestra cuántos mensajes hay por enviar.
- **Inicio (tablero):** saludo, cuatro tarjetas (citas de hoy, perros en Katana's, mensajes por enviar y premios Katana's VIP del día), la agenda de hoy con Recibir y Entregar, el resumen Katana's VIP (premios de hoy y perros que pierden su plazo esta semana) y las citas de mañana.
- **Mensajes:** todos los mensajes por enviar, con filtros por tipo.
- **Perritos y citas:** al deslizar un registro a la derecha se elimina (pide confirmación). Solo se pueden eliminar las citas que todavía no pasan y los perritos sin citas; lo que tiene historial se cancela o se marca "No vino", para no perder sellos.

- **Hoy** (se abre al iniciar sesión):
  - **Citas de hoy:** **Recibir** guarda la hora de llegada y cómo llegó el perro; **Entregar**, la hora de salida y lo que se le hizo; **Reprogramar** cambia fecha u hora; **No vino** la marca como cancelada.
  - **Mensajes por enviar:** la app arma cada mensaje y abre el WhatsApp del cliente con el texto listo. Al tocar **Enviar por WhatsApp** o **No enviar** aparece **Deshacer** por unos segundos, por si no se llegó a mandar.
  - **Mañana:** las citas del día siguiente, para preparar la agenda.
  - Si hay perros sin frecuencia de visita, un aviso lleva directo a completar sus fichas.
- **Mensajes que se preparan solos:**
  | Mensaje | Cuándo | A quién |
  | --- | --- | --- |
  | Confirmación de cita (texto de Katana's: duración, no esperar en el local, cancelación, 15 minutos de tolerancia y recargo de $1 por hora; a clientes nuevos, también el aviso de autorización de fotos en redes, datos y recordatorios) | Al agendar y al reprogramar | Todos |
  | Cita de mañana | La víspera; si no se envió, aparece como "atrasado" el mismo día antes de la cita | Quien no dijo "No" a recordatorios |
  | Le toca volver | Cuando pasan 15 días, 1 mes o 2 meses (según la frecuencia del perro) desde su última visita y no tiene otra cita | Solo quien aceptó recordatorios |
  | Listo para recoger | Al entregar el perro | Todos |
- **Todo sale por WhatsApp.** La app no pide ni usa correos de clientes.
- **Nueva cita:**
  - Servicios con los nombres de Katana's: **Grooming completo**, **Grooming completo de deslanado**, **Grooming completo pelo corto**, **Baño completo** y **Hand stripping**, más los adicionales (limpieza de dientes, tratamiento de nudos, baño medicado, ozonoterapia).
  - Solo son obligatorios el nombre de la persona encargada, el WhatsApp, el nombre y el sexo del perro. Lo demás se completa después en **Editar ficha**.
  - El formulario no pregunta permisos: la autorización de fotos en redes y recordatorios va en el mensaje de confirmación. Si el cliente responde que no, se cambia en **Editar ficha**, y sus citas muestran la etiqueta "No publicar fotos".
  - **Agregar otro perro de este cliente** copia la cita y los datos del dueño; cada perro queda con su propia ficha y la confirmación sale en un solo mensaje para todos.
  - Si ya hay otra cita a la misma hora (de otro cliente), la app avisa; para agendarla igual, se vuelve a tocar el botón.
- **Registros:**
  - Buscador por perro, cliente o WhatsApp.
  - Citas agrupadas por día. Las que aún no ocurren se pueden **Reprogramar**, **Cancelar** (queda en el historial) o **Eliminar** (solo si fue un error). Las canceladas se pueden **Reactivar**.
  - **Editar ficha** en cada perro; si la ficha no tiene citas, también se puede eliminar.
  - **Descargar Excel** con citas (incluye llegada, salida y notas) y fichas.

## Katana's VIP (programa de lealtad)

Los sellos se calculan solos a partir de las citas: Tere no tiene que anotar puntos en ningún lado.

- **Reglas:**
  - Cada perro tiene su propia tarjeta de 10 sellos.
  - Suma un sello cada cita **entregada** con un grooming completo (normal, de deslanado o pelo corto). El baño solo y el hand stripping no suman.
  - Para sumar, el perro tiene que volver en un máximo de **30 días** desde su visita anterior. Si pasa más tiempo, esa visita no suma, pero conserva sus sellos y desde ahí vuelve a contar el plazo.
  - Premios: sello 3, regalito sorpresa; sello 5, 10 % de descuento; sello 7, tratamiento hidratante de manto; sello 10, experiencia spa. Al llenar los 10 empieza otra tarjeta.
  - **Bienvenida:** los perros con al menos una cita entregada entre el 1 y el 22 de noviembre de 2026 empiezan con 1 sello. El programa arranca el 23 de noviembre de 2026.
- **En Hoy:** cada cita muestra qué sello será ("esta visita es el sello 5 de 10") y si ese día le toca premio, para aplicarlo al cobrar. Si no va a sumar, también lo dice y por qué.
- **Al entregar:** el formulario trae marcados los premios del día; al confirmar quedan registrados como entregados. Si alguno no se dio, se desmarca.
- **Mensajes:** "Listo para recoger" incluye cuántos sellos lleva, el premio que ganó y hasta qué día tiene para volver. Además aparece una **Bienvenida Katana's VIP** por perro (una sola vez) con el enlace de su tarjeta.
- **En Fichas:** las 10 huellitas de cada perro, hasta cuándo puede volver, **Enviar tarjeta** y **Marcar premio entregado** para los premios pendientes.
- **Tarjeta del cliente:** `tarjeta.html?c=código` muestra los sellos, los premios y las condiciones. El cliente la abre desde WhatsApp y la puede guardar en la pantalla de inicio; se actualiza sola. Solo muestra el nombre del perro, el primer nombre del tutor y los sellos.
- **Excel:** la hoja **Katana's VIP** trae sellos, plazo, próximo premio, premios por entregar y el enlace de cada tarjeta.
- **Base de datos:** `supabase/amigo_vip.sql` (tabla `canjes`, columna `fichas.codigo`, vista `amigo_vip`, función pública `tarjeta_amigo_vip`). Para cambiar las reglas (fechas, días o premios), se edita la función `amigo_vip_calcular` ahí y las constantes `VIP_*` al inicio de `app.js`.

## Tipografía

Los títulos usan **Days One** (Google Fonts). Gilroy es una fuente de pago, así que la página la usa si está instalada en el dispositivo y, si no, muestra **Outfit**, la alternativa gratuita más parecida. Para que Gilroy se vea en todos los dispositivos, sube sus archivos `.woff2` al repositorio y agrega su `@font-face` al inicio de `styles.css`.

## Logo

El encabezado muestra un monograma provisional. Para usar el logo oficial, sube `logo.svg` al repositorio y sigue el comentario en `index.html`.

## Bueno saber

- En el plan gratuito de Supabase, un proyecto que pasa **una semana sin uso** se pausa y hay que reactivarlo desde el panel. Con el uso diario de la agenda no debería pasar.
- Para no perder historial, la base solo deja eliminar fichas sin citas y citas que todavía no ocurren. Lo demás se cancela.
- Descargar el Excel de vez en cuando sirve como respaldo propio.
- Los correos automáticos están desactivados (la tarea diaria se quitó). La función `avisos-correo` sigue en Supabase sin uso; se puede borrar en **Edge Functions**.
