// Comentarios de revisión asociados al punto concreto de cada flujo.
(() => {
 const rules = [
  { id: 'notary', selector: '.profile-menu-heading h2', text: 'Pendiente: habilitar el rol Notaría y Registro, actualmente no disponible.' },
  { id: 'agent-role', selector: '[data-profile-role="Agente autorizado"]', text: 'Confirmar si existen otros tipos de agentes autorizados. Actualmente se vuelve a solicitar «Agente autorizado de un contribuyente», aunque es la única opción.' },
  { id: 'period', route: /^inicio$/, selector: '#pendingDeclarationsSection th', match: /^Per[ií]odo$/i, text: 'Pendiente: proporcionar el dato que debe mostrarse en Período.' },
  { id: 'status', route: /^inicio$/, selector: '#pendingDeclarationsSection th', match: /Estado/i, text: 'Confirmar si existen otros estados además de Pendiente por firmar y Pendiente por presentar.' },
  { id: 'pending-view', route: /^inicio$/, selector: '#pendingDeclarationsSection a, #pendingDeclarationsSection button', match: /^Ver$/i, all: true, text: 'Pendiente: habilitar la vista de esta declaración para su estado, tanto Pendiente por firmar como Pendiente por presentar.' },
  { id: 'agent-tax-examples', route: /^inicio$/, selector: '#pendingDeclarationsSection th', match: /Impuesto/i, text: 'Pendiente para el rol de agente autorizado: agregar ejemplos de cada tipo de impuesto y sus estados, con acceso a la pantalla correspondiente desde Ver. Actualmente solo se dispone de Delineación Urbana.' },
  { id: 'identity', route: /^rit-datos$/, selector: 'label', match: /Tipo de (identificaci[oó]n|documento)/i, text: 'Confirmar si los datos personales cambian únicamente para NIT o si existen otras variaciones según el tipo de identificación.' },
  { id: 'dcu', route: /^rit-impuestos$/, selector: '#registered-delineacion-table th', match: /C\.D\.U|DCU|CDU/i, text: 'Confirmar si Delineación Urbana debe mostrar información adicional al código DCU/CDU.' },
  { id: 'gas-users', route: /^rit-impuestos$/, selector: '#registered-sobretasa-tab', text: 'Pendiente: facilitar usuarios de prueba con Gasolina Motor y ACPM registrado para revisar esta sección.' },
  { id: 'advertising-users', route: /^rit-impuestos$/, selector: '#registered-publicidad-tab', text: 'Pendiente: facilitar usuarios de prueba con Publicidad Exterior registrada para revisar esta sección.' },
  { id: 'certificate', selector: '[data-rit-certificate-open]', all: true, text: 'Confirmar si se permite descargar un certificado por obligación o si debe mantenerse un único certificado que incluya todas las obligaciones.' },
  { id: 'certificate-tax', selector: 'label[for="ritCertificateTax"]', text: 'Confirmar si el certificado se descarga por cada obligación o si debe incluir todas en un único documento.' },
  { id: 'new-declaration', route: /^(impuestos-|vehiculo-|predio-|predial-|declaraciones-)/, selector: '.alert', match: /ROP|factura vencida/i, all: true, text: 'Pendiente: habilitar un escenario por cada impuesto sin ROP pendiente ni bloqueo, para revisar la creación de una declaración desde cero.' },
  { id: 'new-declaration-action', route: /^(impuestos-|vehiculo-|predio-|predial-|declaraciones-)/, selector: 'a, button', match: /^Generar declaraci[oó]n|^Crear declaraci[oó]n/i, text: 'Pendiente: disponer de un escenario de este impuesto sin ROP pendiente, para revisar el flujo completo desde el inicio.' },
  { id: 'ica-main', route: /^impuestos-ica$/, selector: 'h2, h3', match: /Actividades econ[oó]micas/i, text: 'Confirmar por qué no se puede eliminar la actividad económica principal y cuál es el procedimiento para cambiarla. Si solo puede existir una principal, aclarar cómo reemplazar la actual.' },
  { id: 'ica-locked', route: /^impuestos-ica$/, selector: '#ica-activities td span', match: /No se puede eliminar/i, text: 'Confirmar por qué no se puede eliminar la actividad económica principal y cuál es el procedimiento para reemplazarla.' },
  { id: 'ica-type', route: /^impuestos-ica$/, selector: 'label[for="ica-type"]', text: 'Confirmar cómo reemplazar la actividad principal al agregar una actividad: solo puede existir una principal y la actual no se puede eliminar.' },
  { id: 'vehicle-info', route: /^(impuestos-vehiculos|vehiculo-)/, selector: 'th', match: /^Placa$/i, text: 'Confirmar por qué algunas placas no tienen información asociada.' },
  { id: 'vehicle-nit', route: /^impuestos-vehiculos$/, selector: 'label', match: /placa|Buscar/i, text: 'Confirmar por qué el usuario identificado con NIT debe buscar la placa.' },
  { id: 'vehicle-nit-title', route: /^impuestos-vehiculos$/, selector: 'h1', text: 'Confirmar por qué el usuario identificado con NIT debe buscar la placa y por qué algunas placas no tienen información asociada.' },
  { id: 'payment', route: /^(impuestos-|vehiculo-|predio-|predial-|declaraciones-|pagos-)/, selector: 'button, a', match: /^(Pagar en l[ií]nea|Generar ROP)/i, all: true, text: 'Confirmar por qué, después de presentar la declaración, Pagar en línea cambia a Generar ROP y en qué casos aplica este comportamiento.' },
  { id: 'tax-access', selector: '#primaryNavigationItems a[href="#impuestos-otros"]', text: 'Confirmar qué impuestos están disponibles según el usuario o rol, además de Predial, Vehículos e ICA. Para Delineación Urbana, Gasolina Motor y ACPM y Publicidad Exterior, facilitar accesos o usuarios de prueba y escenarios sin bloqueo por ROP.' },
 ];
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
  for (const rule of rules) {
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
})();
