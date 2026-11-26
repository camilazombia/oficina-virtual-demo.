// Comentarios de revisión asociados al punto concreto de cada flujo.
const reviewNoteRules = [
  { id: "payment-history-source", section: "Relación de pagos", route: /^pagos-relacion$/, selector: "#payment-history-title", text: "Vista basada en las capturas compartidas. Se incluyen solo los registros visibles, no los totales completos de 15.490 predios, 644 veh\u00edculos y 77 CDU. Se necesitan los datos completos para validar b\u00fasqueda, paginaci\u00f3n y diferencias por usuario." },
  { id: "payment-history-details", section: "Relación de pagos", route: /^pagos-relacion$/, selector: "#payment-history-detail-title", text: "Los detalles disponibles corresponden al primer predio y al veh\u00edculo FNX843. Las referencias y n\u00fameros de formulario no se distinguen completos y quedan pendientes. Se necesitan registros para los dem\u00e1s objetos y casos con pagos de ICA y Delineaci\u00f3n; confirmar el detalle por radicado y el significado del aporte voluntario." },
  { id: "payment-history-pdf", section: "Relación de pagos", route: /^pagos-relacion$/, selector: "#payment-history-pdf-note", text: "Falta el PDF original de Relaci\u00f3n de pagos para revisar contenido, formato, alcance por objeto y comportamiento de descarga, incluso cuando no hay registros. Facilitar un ejemplo por impuesto para completar el flujo." },
  { id: "declaration-certification-empty", section: "Certificaciones de declaración", route: /^documentos-declaracion$/, selector: "#declaration-certification-title", text: "La pantalla de Certificaciones de declaraci\u00f3n no muestra contenido: no aparecen campos, registros ni acciones. Se necesita confirmar qu\u00e9 deber\u00eda mostrarse y facilitar un usuario o escenario con informaci\u00f3n para revisar y completar el flujo." },
  { id: "multipayment-query-data", section: "Certificación multipagos", route: /^documentos-multipagos$/, selector: "#multipayment-certification-title", text: "Faltan datos para realizar y validar la consulta. Se necesita un usuario con pagos de ROP multipago registrados, el impuesto y el a\u00f1o del pago. En la referencia aparece Sin registros: No se encontraron registros para el impuesto y a\u00f1o seleccionados. Facilitar un caso con resultados para revisar la selecci\u00f3n y descarga de la certificaci\u00f3n. Confirmar tambi\u00e9n los dem\u00e1s impuestos disponibles." },
  { id: "procedure-tracking-data", section: "Seguimiento de trámites", route: /^tramites-seguimiento$/, selector: "#procedure-tracking-title", text: "Confirmar: \u00bfpara consultar se necesita solo el n\u00famero de caso, solo el n\u00famero de radicado o ambos? No se dispone de estos datos para validar el comportamiento. Se necesita un usuario con una solicitud registrada e identificadores v\u00e1lidos para revisar resultados, estados, historial y documentos disponibles. Confirmar tambi\u00e9n el formato de cada identificador y los mensajes para solicitudes inexistentes o sin acceso." },
  { id: "obligation-scenarios", section: "Consulta de obligaciones", route: /^obligaciones-pendientes$/, selector: "#obligations-title", text: "Confirmar los impuestos disponibles y las diferencias por rol: en algunas capturas Predial pide CHIP o matr\u00edcula y en otras no. Facilitar usuarios y escenarios para completar todos los flujos." },
  { id: "obligation-report", section: "Consulta de obligaciones", route: /^obligaciones-pendientes$/, selector: "#obligation-report", text: "El bot\u00f3n descarga un PDF. Confirmar si el reporte es total o por impuesto/objeto: el ejemplo encabeza JWT71D pero incluye MCU235. Aclarar por qu\u00e9 los saldos del PDF (661.000, 552.000 y 1.051.000) difieren de la tabla (661.000, 596.000 y 1.147.000), si incluyen intereses y fecha de corte. Confirmar la nota sobre obligaciones en determinaci\u00f3n y retirar el texto test. Faltan reportes de los dem\u00e1s impuestos." },
  { id: "obligation-coupons", section: "Consulta de obligaciones", route: /^obligaciones-pendientes$/, selector: "#obligation-results th", match: /^Cupones$/, text: "Pendiente: agregar un usuario con cupones y revisar c\u00f3mo se crean, consultan, descargan y utilizan para pagar. Confirmar la diferencia entre ROP y cup\u00f3n, vigencia, estados y cu\u00e1ndo deja de mostrarse Sin Cupones." },
  { id: "obligation-pay", section: "Consulta de obligaciones", route: /^obligaciones-pendientes$/, selector: "#obligation-results th", match: /^Pagar$/, text: "Antes de pagar aparece Debe generar un ROP o Cup\u00f3n. Facilitar un caso con ROP o cup\u00f3n vigente para validar el desbloqueo de Pagar, la pasarela, la confirmaci\u00f3n, el comprobante y los estados de error o cancelaci\u00f3n." },
  { id: "obligation-rop", section: "Consulta de obligaciones", route: /^obligaciones-pendientes$/, selector: "#obligation-results th", match: /^Generar ROP$/, text: "Generar ROP abre la pantalla de generaci\u00f3n. Se necesitan capturas y datos del flujo por impuesto, importes, intereses, pagos parciales, vigencia, descarga y continuaci\u00f3n al pago." },
  { id: "obligation-identifier", section: "Consulta de obligaciones", route: /^obligaciones-pendientes$/, selector: "#obligation-identifier-title", text: "Confirmar las reglas del CHIP, CDU y matr\u00edcula. El error recibido exige 12 caracteres: 050N, 050S o 050C m\u00e1s ocho d\u00edgitos con ceros a la izquierda. Facilitar matr\u00edculas v\u00e1lidas y confirmar si existen otras zonas y si el sistema completa los ceros." },
  { id: "obligation-ica", section: "Consulta de obligaciones", route: /^obligaciones-pendientes$/, selector: "#obligation-results-title", match: /^ICA$/, text: "El usuario disponible no tiene obligaciones pendientes de ICA. Se necesita un usuario con obligaciones para conocer las columnas, estados, reporte, generaci\u00f3n de ROP y pago." },
  { id: "obligation-rop-screen", section: "Consulta de obligaciones", route: /^obligaciones-pendientes$/, selector: "#obligation-rop-pending", text: "Pendiente: facilitar la pantalla y un ejemplo completo de generaci\u00f3n de ROP para cada impuesto. Confirmar campos, c\u00e1lculos, descarga del recibo y continuidad al pago." },
  { id: 'payment-certificate-currency', section: "Certificaciones de pago", route: /^documentos-pago$/, selector: '#payment-certification-results th', match: /^Moneda$/, text: "\u00bfEs necesaria la columna Moneda? Confirmar si todos los pagos se realizan en pesos colombianos (COP) y por qu\u00e9 se muestra este dato. \u00bfExisten pagos en otras monedas?" },
  { id: 'payment-certificate-table', section: "Certificaciones de pago", route: /^documentos-pago$/, selector: '#payment-certification-title', text: 'No hay datos disponibles para la tabla. Se necesita un usuario con pagos registrados para revisar los resultados, la selecci\u00f3n de pagos y c\u00f3mo funciona la generaci\u00f3n de la certificaci\u00f3n.' },
  { id: 'payment-certificate-roles', section: "Certificaciones de pago", route: /^documentos-pago$/, selector: 'label[for="payment-certification-tax"]', text: "Confirmar si la solicitud de placa, CHIP o matr\u00edcula y CDU cambia seg\u00fan el rol o tipo de usuario. \u00bfPor qu\u00e9 se solicitan estos datos a algunos contribuyentes y a otros no? Validar en qu\u00e9 casos aplica cada comportamiento." },
  { id: "withholding-certificate-data", section: "Retenciones practicadas", route: /^documentos-retenciones$/, selector: "#withholding-title", text: "El error \u00abError al consultar la informaci\u00f3n del contribuyente\u00bb solo aparece cuando se intenta consultar las retenciones practicadas. Para validar la consulta, se necesita un usuario con retenciones practicadas." },
  { id: 'notary', section: "Roles del perfil", selector: '.profile-menu-heading h2', text: 'Pendiente: habilitar el rol Notaría y Registro, actualmente no disponible.' },
  { id: 'agent-role', section: "Roles del perfil", selector: '[data-profile-role="Agente autorizado"]', text: 'Confirmar si existen otros tipos de agentes autorizados. Actualmente se vuelve a solicitar «Agente autorizado de un contribuyente», aunque es la única opción.' },
  { id: 'period', section: "Inicio", route: /^inicio$/, selector: '#pendingDeclarationsSection th', match: /^Per[ií]odo$/i, text: 'Pendiente: proporcionar el dato que debe mostrarse en Período.' },
  { id: 'status', section: "Inicio", route: /^inicio$/, selector: '#pendingDeclarationsSection th', match: /Estado/i, text: 'Confirmar si existen otros estados además de Pendiente por firmar y Pendiente por presentar.' },
  { id: 'pending-view', section: "Inicio", route: /^inicio$/, selector: '#pendingDeclarationsSection a, #pendingDeclarationsSection button', match: /^Ver$/i, all: true, text: 'Pendiente: habilitar la vista de esta declaración para su estado, tanto Pendiente por firmar como Pendiente por presentar.' },
  { id: 'agent-tax-examples', section: "Inicio", route: /^inicio$/, selector: '#pendingDeclarationsSection th', match: /Impuesto/i, text: 'Pendiente para el rol de agente autorizado: agregar ejemplos de cada tipo de impuesto y sus estados, con acceso a la pantalla correspondiente desde Ver. Actualmente solo se dispone de Delineación Urbana.' },
  { id: 'identity', section: "Datos personales", route: /^rit-datos$/, selector: 'label', match: /Tipo de (identificaci[oó]n|documento)/i, text: 'Confirmar si los datos personales cambian únicamente para NIT o si existen otras variaciones según el tipo de identificación.' },
  { id: 'dcu', section: "Impuestos registrados", route: /^rit-impuestos$/, selector: '#registered-delineacion-table th', match: /C\.D\.U|DCU|CDU/i, text: 'Confirmar si Delineación Urbana debe mostrar información adicional al código DCU/CDU.' },
  { id: 'gas-users', section: "Impuestos registrados", route: /^rit-impuestos$/, selector: '#registered-sobretasa-tab', text: 'Pendiente: facilitar usuarios de prueba con Gasolina Motor y ACPM registrado para revisar esta sección.' },
  { id: 'advertising-users', section: "Impuestos registrados", route: /^rit-impuestos$/, selector: '#registered-publicidad-tab', text: 'Pendiente: facilitar usuarios de prueba con Publicidad Exterior registrada para revisar esta sección.' },
  { id: 'certificate', section: "Certificación RIT", selector: '[data-rit-certificate-open]', all: true, text: 'Confirmar si se permite descargar un certificado por obligación o si debe mantenerse un único certificado que incluya todas las obligaciones.' },
  { id: 'certificate-tax', section: "Certificación RIT", selector: 'label[for="ritCertificateTax"]', text: 'Confirmar si el certificado se descarga por cada obligación o si debe incluir todas en un único documento.' },
  { id: 'new-declaration', section: "Declaraciones y pagos", route: /^(impuestos-|vehiculo-|predio-|predial-|declaraciones-)/, selector: '.alert', match: /ROP|factura vencida/i, all: true, text: 'Pendiente: habilitar un escenario por cada impuesto sin ROP pendiente ni bloqueo, para revisar la creación de una declaración desde cero.' },
  { id: 'new-declaration-action', section: "Declaraciones y pagos", route: /^(impuestos-|vehiculo-|predio-|predial-|declaraciones-)/, selector: 'a, button', match: /^Generar declaraci[oó]n|^Crear declaraci[oó]n/i, text: 'Pendiente: disponer de un escenario de este impuesto sin ROP pendiente, para revisar el flujo completo desde el inicio.' },
  { id: 'ica-main', section: "ICA", route: /^impuestos-ica$/, selector: 'h2, h3', match: /Actividades econ[oó]micas/i, text: 'Confirmar por qué no se puede eliminar la actividad económica principal y cuál es el procedimiento para cambiarla. Si solo puede existir una principal, aclarar cómo reemplazar la actual.' },
  { id: 'ica-locked', section: "ICA", route: /^impuestos-ica$/, selector: '#ica-activities td span', match: /No se puede eliminar/i, text: 'Confirmar por qué no se puede eliminar la actividad económica principal y cuál es el procedimiento para reemplazarla.' },
  { id: 'ica-type', section: "ICA", route: /^impuestos-ica$/, selector: 'label[for="ica-type"]', text: 'Confirmar cómo reemplazar la actividad principal al agregar una actividad: solo puede existir una principal y la actual no se puede eliminar.' },
  { id: 'vehicle-info', section: "Vehículos", route: /^(impuestos-vehiculos|vehiculo-)/, selector: 'th', match: /^Placa$/i, text: 'Confirmar por qué algunas placas no tienen información asociada.' },
  { id: 'vehicle-nit', section: "Vehículos", route: /^impuestos-vehiculos$/, selector: 'label', match: /placa|Buscar/i, text: 'Confirmar por qué el usuario identificado con NIT debe buscar la placa.' },
  { id: 'vehicle-nit-title', section: "Vehículos", route: /^impuestos-vehiculos$/, selector: 'h1', text: 'Confirmar por qué el usuario identificado con NIT debe buscar la placa y por qué algunas placas no tienen información asociada.' },
  { id: 'payment', section: "Declaraciones y pagos", route: /^(impuestos-|vehiculo-|predio-|predial-|declaraciones-|pagos-)/, selector: 'button, a', match: /^(Pagar en l[ií]nea|Generar ROP)/i, all: true, text: 'Confirmar por qué, después de presentar la declaración, Pagar en línea cambia a Generar ROP y en qué casos aplica este comportamiento.' },
  { id: 'tax-access', section: "Impuestos registrados", selector: '#primaryNavigationItems a[href="#impuestos-otros"]', text: 'Confirmar qué impuestos están disponibles según el usuario o rol, además de Predial, Vehículos e ICA. Para Delineación Urbana, Gasolina Motor y ACPM y Publicidad Exterior, facilitar accesos o usuarios de prueba y escenarios sin bloqueo por ROP.' },
];

document.addEventListener("DOMContentLoaded", () => {
 const assigned = new WeakMap();
 const pins = new Map();
 const layer = document.createElement('div');
 layer.className = 'review-note-layer';
 document.body.append(layer);
 let positionFrame;
 function positionPins() {
  positionFrame = null;
  for (const [button, target] of pins) {
   if (!target.isConnected) {
    bootstrap.Tooltip.getInstance(button)?.dispose();
    button.remove(); pins.delete(button); continue;
   }
   const rect = target.getBoundingClientRect();
   let visible = target.getClientRects().length > 0 && rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
   for (let parent = target; visible && parent; parent = parent.parentElement) {
    const style = getComputedStyle(parent);
    if (style.visibility === 'hidden' || style.display === 'none') visible = false;
    if (parent !== target && /(hidden|auto|scroll|clip)/.test(style.overflow + style.overflowY + style.overflowX)) {
     const clip = parent.getBoundingClientRect();
     if (rect.top >= clip.bottom || rect.bottom <= clip.top || rect.left >= clip.right || rect.right <= clip.left) visible = false;
    }
   }
   button.hidden = !visible;
   if (!visible) { bootstrap.Tooltip.getInstance(button)?.hide(); continue; }
   button.style.left = `${Math.max(0, Math.min(innerWidth - 20, rect.right - 10))}px`;
   button.style.top = `${Math.max(0, rect.top - 7)}px`;
  }
 }
 function schedulePosition() {
  if (!positionFrame) positionFrame = requestAnimationFrame(positionPins);
 }
 let observer;
 function annotate() {
  observer?.disconnect();
  const route = location.hash.slice(1) || 'inicio';
  for (const rule of reviewNoteRules) {
   if (rule.route && !rule.route.test(route)) continue;
   const targets = [...document.querySelectorAll(rule.selector)].filter(node => !node.closest('.tooltip') && (!rule.match || rule.match.test(node.textContent.trim())));
   for (const target of rule.all ? targets : targets.slice(0, 1)) {
    const ids = assigned.get(target) || new Set();
    if (ids.has(rule.id)) continue;
    ids.add(rule.id); assigned.set(target, ids);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-link review-note p-0';
    button.dataset.reviewNote = rule.id;
    button.setAttribute('aria-label', `Comentario de revisión: ${rule.text}`);
    button.innerHTML = '<i class="bi bi-pin-angle-fill" aria-hidden="true"></i>';
    layer.append(button);
    pins.set(button, target);
    new bootstrap.Tooltip(button, { title: rule.text, trigger: 'hover focus', placement: 'auto', container: 'body', customClass: 'review-note-tooltip' });
   }
  }
  schedulePosition();
  observer.observe(document.body, { childList: true, subtree: true });
 }
 document.addEventListener('click', event => {
  document.querySelectorAll('[data-review-note]').forEach(button => {
   if (!button.contains(event.target)) bootstrap.Tooltip.getInstance(button)?.hide();
  });
 });
 document.addEventListener('keydown', event => {
  if (event.key === 'Escape') document.querySelectorAll('[data-review-note]').forEach(button => bootstrap.Tooltip.getInstance(button)?.hide());
 });
 observer = new MutationObserver(records => {
  if (records.some(record => [...record.addedNodes].some(node => node.nodeType === 1 && !node.matches('.tooltip, [data-review-note]')))) annotate();
 });
 window.addEventListener('hashchange', annotate);
 window.addEventListener('resize', schedulePosition);
 document.addEventListener('scroll', schedulePosition, true);
 for (const event of ['shown.bs.dropdown', 'hidden.bs.dropdown', 'shown.bs.modal', 'hidden.bs.modal', 'shown.bs.tab', 'shown.bs.collapse', 'hidden.bs.collapse', 'shown.bs.offcanvas', 'hidden.bs.offcanvas']) document.addEventListener(event, schedulePosition);
 new ResizeObserver(schedulePosition).observe(document.body);
 annotate();
}, { once: true });
