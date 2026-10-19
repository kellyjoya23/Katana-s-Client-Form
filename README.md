# Registro de citas · Katana Grooming

App web para que Tere registre cada cita y, de paso, arme la base de clientes de Katana. Descarga todo en un Excel con dos hojas: **Citas** (una fila por cita) y **Fichas** (una fila por perro).

## Archivos

| Archivo | Qué es |
| --- | --- |
| `index.html` | La página |
| `styles.css` | Estilos con la paleta y tipografías de Katana |
| `app.js` | Formulario, registros y Excel |

No necesita instalar nada ni compilar. El Excel se genera con SheetJS, que se carga desde su CDN oficial.

## Publicar en Vercel

1. Crea un repositorio en GitHub (por ejemplo `katana-registro`) y sube los 4 archivos a la raíz.
2. En vercel.com, **Add New → Project** e importa el repositorio.
3. En *Framework Preset* elige **Other**. Deja vacíos el comando de build y la carpeta de salida.
4. **Deploy.** Comparte el enlace con Tere y pídele que lo agregue a la pantalla de inicio del teléfono o la tablet.

## Cómo funciona

- **Nueva cita:** fecha, hora, servicios, canal y si el perro ya tiene ficha.
  - *Ya tiene ficha:* WhatsApp + nombre del perro. La app muestra su ficha y avisos de carácter (por ejemplo, "Puede morder si se asusta").
  - *Cliente nuevo* o *de antes, sin ficha:* ficha completa del cliente y del perro, salud, carácter y permisos.
- **Registros:** citas próximas y pasadas, fichas por perro, **Descargar Excel** y **Cargar Excel**.

## Importante: dónde quedan los datos

- Los registros se guardan **solo en el navegador del dispositivo donde se llenan**. No viajan a ningún servidor, así que el enlace público no expone datos de clientes.
- Si se borra el historial del navegador, se pierden. Por eso: **descargar el Excel al cerrar cada día.**
- Para usar otro dispositivo, abre la app ahí y usa **Cargar Excel** con el último archivo descargado.
- Si un día necesitan que varias personas vean los mismos datos en tiempo real, el siguiente paso sería conectar una base de datos (por ejemplo, Google Sheets o Supabase).
