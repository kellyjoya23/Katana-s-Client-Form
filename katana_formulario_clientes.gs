/**
 * Katana's Grooming — Registro de citas y fichas de clientes (uso interno)
 * Crea el Google Form y lo conecta a una hoja de cálculo (agenda + base de datos).
 *
 * Cómo usarlo:
 * 1. Entra a script.google.com con la cuenta de Katana > Nuevo proyecto.
 * 2. Borra lo que aparezca, pega todo este archivo y guarda.
 * 3. Arriba elige la función "crearFormularioKatana" y dale a Ejecutar.
 * 4. Acepta los permisos. Los enlaces aparecen en el "Registro de ejecución".
 */
function crearFormularioKatana() {
  const form = FormApp.create("Registro de citas · Katana's Grooming");

  form
    .setDescription(
      'Llénalo cada vez que agendes una cita.\n\n' +
      'Si el perro ya tiene ficha, solo toma un minuto. ' +
      'Si es nuevo o todavía no tiene ficha, completa sus datos con el cliente.\n\n' +
      'Un registro por perro: si el cliente trae dos, llénalo dos veces.'
    )
    .setProgressBar(true)
    .setAllowResponseEdits(true)
    .setConfirmationMessage('Cita registrada');

  // ---------- Validaciones ----------
  const valTelefono = FormApp.createTextValidation()
    .requireTextMatchesPattern('^(\\+?503[ -]?)?[267]\\d{3}[ -]?\\d{4}$')
    .setHelpText('Número de 8 dígitos, por ejemplo 7123-4567.')
    .build();

  const valCorreo = FormApp.createTextValidation()
    .requireTextIsEmail()
    .setHelpText('Revisa el correo, por ejemplo nombre@gmail.com.')
    .build();

  // ---------- Sección 1: La cita ----------
  form.addSectionHeaderItem().setTitle('La cita');

  form.addDateItem()
    .setTitle('Fecha de la cita')
    .setRequired(true);

  form.addTimeItem()
    .setTitle('Hora de la cita')
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('Servicios agendados')
    .setChoiceValues([
      'Baño', 'Baño y corte', 'Corte de uñas',
      'Limpieza de oídos', 'Deslanado'
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Por dónde agendó?')
    .setChoiceValues(['WhatsApp', 'Llamada', 'Instagram', 'Facebook', 'TikTok', 'En el local'])
    .showOtherOption(true)
    .setRequired(true);

  const preguntaFicha = form.addMultipleChoiceItem()
    .setTitle("¿El perro ya tiene ficha en Katana's?")
    .setHelpText('Elige "Cliente de antes, sin ficha" para quienes ya venían antes de este registro.')
    .setRequired(true);

  // ---------- Sección 2: Ya tiene ficha (ruta corta) ----------
  const pagRegistrado = form.addPageBreakItem()
    .setTitle('Perro con ficha')
    .setHelpText('Solo lo necesario para encontrarlo en la base.');

  form.addTextItem()
    .setTitle('WhatsApp del cliente')
    .setValidation(valTelefono)
    .setRequired(true);

  form.addTextItem()
    .setTitle('Nombre del perro')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('¿Hay algo nuevo que anotar?')
    .setHelpText('Cambio de número, alergia nueva, otro estilo de corte. Si no, déjalo en blanco.');

  // ---------- Sección 3a: Cliente nuevo ----------
  const pagNuevo = form.addPageBreakItem()
    .setTitle('Cliente nuevo');

  form.addMultipleChoiceItem()
    .setTitle("¿Cómo conoció Katana's?")
    .setChoiceValues([
      'Instagram', 'TikTok', 'Facebook', 'Google',
      'Se lo recomendó alguien', 'Pasó por el local'
    ])
    .showOtherOption(true)
    .setRequired(true);

  // ---------- Sección 3b: Cliente de antes, sin ficha ----------
  const pagAntes = form.addPageBreakItem()
    .setTitle('Cliente de antes');

  form.addMultipleChoiceItem()
    .setTitle("¿Desde cuándo viene a Katana's?")
    .setChoiceValues(['Menos de 1 año', 'De 1 a 3 años', 'De 3 a 5 años', 'Más de 5 años'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Cada cuánto lo trae?')
    .setChoiceValues(['Cada 2 semanas', 'Cada mes', 'Cada 2 meses', 'De vez en cuando']);

  // ---------- Sección 4: Datos del cliente ----------
  const pagCliente = form.addPageBreakItem()
    .setTitle('Datos del cliente');

  form.addTextItem()
    .setTitle('Nombre completo del cliente')
    .setRequired(true);

  form.addTextItem()
    .setTitle('WhatsApp del cliente')
    .setValidation(valTelefono)
    .setRequired(true);

  form.addTextItem()
    .setTitle('Correo del cliente')
    .setHelpText('Opcional.')
    .setValidation(valCorreo);

  form.addTextItem()
    .setTitle('Municipio o colonia')
    .setHelpText('Por ejemplo: San Salvador Centro, colonia Escalón.');

  form.addMultipleChoiceItem()
    .setTitle('¿Cómo prefiere que lo contactemos?')
    .setChoiceValues(['WhatsApp', 'Llamada', 'Correo'])
    .setRequired(true);

  // ---------- Sección 5: El perro ----------
  form.addPageBreakItem()
    .setTitle('El perro');

  form.addTextItem()
    .setTitle('Nombre del perro')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Raza')
    .setHelpText('Si es mestizo, escribe "mestizo".')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Tamaño')
    .setChoiceValues([
      'Mini (menos de 5 kg)',
      'Pequeño (5 a 10 kg)',
      'Mediano (10 a 25 kg)',
      'Grande (25 a 40 kg)',
      'Gigante (más de 40 kg)'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Tipo de pelo')
    .setChoiceValues(['Corto', 'Largo', 'Rizado', 'Doble capa', 'Duro'])
    .showOtherOption(true)
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Sexo')
    .setChoiceValues(['Macho', 'Hembra'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Está esterilizado?')
    .setChoiceValues(['Sí', 'No', 'No sabe']);

  form.addDateItem()
    .setTitle('Cumpleaños del perro')
    .setHelpText('Si el cliente no sabe la fecha exacta, anota una aproximada.')
    .setIncludesYear(true);

  // ---------- Sección 6: Salud y carácter ----------
  form.addPageBreakItem()
    .setTitle('Salud y carácter');

  form.addMultipleChoiceItem()
    .setTitle('¿Tiene las vacunas al día?')
    .setChoiceValues(['Sí', 'No', 'No sabe'])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Alergias, problemas de piel o medicamentos')
    .setHelpText('Si no tiene, déjalo en blanco.');

  form.addCheckboxItem()
    .setTitle('Durante el baño o el corte, el perro…')
    .setChoiceValues([
      'Es tranquilo',
      'Se pone nervioso',
      'No le gusta la secadora',
      'Es sensible en las patas',
      'Es sensible en las orejas',
      'Puede morder si se asusta'
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Notas del cliente')
    .setHelpText('Mañas, lo que le gusta, cómo prefiere el corte.');

  // ---------- Sección 7: Permisos ----------
  form.addPageBreakItem()
    .setTitle('Permisos')
    .setHelpText('Pregúntale al cliente antes de marcar.');

  form.addCheckboxItem()
    .setTitle('Uso de datos')
    .setChoiceValues([
      "El cliente autoriza a Katana's Grooming a guardar estos datos para agendar citas y cuidar a su perro."
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Autoriza publicar fotos del perro en redes?')
    .setChoiceValues(['Sí', 'No'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Acepta recordatorios por WhatsApp (citas y cumpleaños del perro)?')
    .setChoiceValues(['Sí', 'No'])
    .setRequired(true);

  // ---------- Ramificación ----------
  preguntaFicha.setChoices([
    preguntaFicha.createChoice('Sí, ya tiene ficha', pagRegistrado),
    preguntaFicha.createChoice('No, es cliente nuevo', pagNuevo),
    preguntaFicha.createChoice('Cliente de antes, sin ficha', pagAntes)
  ]);
  // Perro con ficha: al terminar su sección, se envía el registro.
  pagNuevo.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  // Cliente nuevo: al terminar su sección, salta a "Datos del cliente".
  pagAntes.setGoToPage(pagCliente);

  // ---------- Base de datos ----------
  const hoja = SpreadsheetApp.create("Katana's Grooming · Citas y clientes");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, hoja.getId());

  Logger.log('Enlace para Tere: ' + form.getPublishedUrl());
  Logger.log('Editar el formulario: ' + form.getEditUrl());
  Logger.log('Hoja de citas y clientes: ' + hoja.getUrl());
}
