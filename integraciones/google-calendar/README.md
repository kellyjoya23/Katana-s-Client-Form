# Citas del CRM → Google Calendar de Katana's

Cada vez que una cita se crea, se mueve, cambia de servicio, se cancela o se elimina en el CRM,
el horario queda bloqueado (o se libera) en el calendario de **katanagrooming@gmail.com**.

Cómo funciona: Supabase avisa a un pequeño script de Google (Apps Script) que vive en la cuenta de
Katana's; el script crea, mueve o borra el evento. No hace falta Google Cloud ni pagar nada.

## Instalación (una sola vez, con la sesión de katanagrooming@gmail.com)

1. Entra a <https://script.google.com> y toca **Nuevo proyecto**. Ponle de nombre *Katana's · Calendario*.
2. Borra lo que trae y pega todo el contenido de `Code.gs`. Guarda.
3. En **Configuración del proyecto** (el engranaje):
   - Zona horaria: **(GMT-06:00) Central America Time – El Salvador**.
   - En **Propiedades del script**, agrega una propiedad: nombre `CLAVE`, valor: la clave secreta que te dimos.
4. Vuelve al editor, elige la función **probar** y toca **Ejecutar**. Google pide permiso para usar el
   calendario: acéptalo. En el registro debe decir "Todo funciona".
5. Toca **Implementar → Nueva implementación** → tipo **Aplicación web**:
   - Ejecutar como: **Yo (katanagrooming@gmail.com)**
   - Quién tiene acceso: **Cualquier persona**
   - Toca **Implementar** y copia la URL (termina en `/exec`).
6. Esa URL y la clave se guardan en Supabase (Vault) y se activa `supabase/google_calendar.sql`.

"Cualquier persona" solo significa que Supabase puede llamar al script; sin la clave secreta el script
no hace nada.

## Duración de las citas en el calendario

Se ajusta al inicio de `Code.gs` (`DURACIONES`): grooming completo 2 h, hand stripping 2 h 30 min,
baño 1 h 30 min. Si se cambia, hay que volver a **Implementar → Administrar implementaciones → Editar →
Nueva versión**.
