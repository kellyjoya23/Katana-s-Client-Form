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

- **Nueva cita:** fecha, hora, servicios, canal y si el perro ya tiene ficha.
  - *Ya tiene ficha:* WhatsApp + nombre del perro. La app muestra su ficha y avisos de carácter (por ejemplo, "Puede morder si se asusta").
  - *Cliente nuevo* o *de antes, sin ficha:* ficha completa del cliente y del perro, salud, carácter y permisos. Si el perro ya existía con ese número, se actualiza su ficha en lugar de duplicarla, conservando lo que no se volvió a llenar.
- **Registros:** citas próximas y pasadas, fichas por perro, **Descargar Excel** y **Actualizar** (trae lo que otras personas registraron).
- **Registros de la versión anterior:** si un dispositivo usó la versión que guardaba en el navegador, en *Registros* aparece **Subir a la base de datos** para pasarlos a Supabase una sola vez.
- La base ya tiene columnas para el **check-in y check-out** (estado, llegada, salida y notas), listas para el siguiente paso.

## Tipografía

Los títulos usan **Days One** (Google Fonts). Gilroy es una fuente de pago, así que la página la usa si está instalada en el dispositivo y, si no, muestra **Outfit**, la alternativa gratuita más parecida. Para que Gilroy se vea en todos los dispositivos, sube sus archivos `.woff2` al repositorio y agrega su `@font-face` al inicio de `styles.css`.

## Logo

El encabezado muestra un monograma provisional. Para usar el logo oficial, sube `logo.svg` al repositorio y sigue el comentario en `index.html`.

## Bueno saber

- En el plan gratuito de Supabase, un proyecto que pasa **una semana sin uso** se pausa y hay que reactivarlo desde el panel. Con el uso diario de la agenda no debería pasar.
- Las fichas no se pueden borrar desde la app, para no perder historial. Si hace falta, se borran en **Table Editor** de Supabase.
- Descargar el Excel de vez en cuando sirve como respaldo propio.
