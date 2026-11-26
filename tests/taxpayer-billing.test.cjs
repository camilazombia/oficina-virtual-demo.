const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const load = name => readFileSync(resolve(__dirname, '../js', name), 'utf8');

function createContext(overrides = {}) {
 const context = vm.createContext({
  paymentHistoryExamples: { predial: { rows: [] } },
  getTaxpayerIdentity: () => ({ fullName: 'Miguel Salazar', documentType: 'CC', documentNumber: '1000000001' }),
  icaEscape: value => String(value),
  statusAlert: (_, text) => text,
  ...overrides,
 });
 vm.runInContext(load('taxpayer-queries.js') + '\n' + load('taxpayer-billing.js'), context);
 return context;
}

test('facturación filtra objetos por sesión y año antes de dibujar resultados', () => {
 const context = createContext();
 const plates = (role, identifier, year) => vm.runInContext(`
  invoiceExamples.filter(invoice => invoice.year === '${year}' && matchesTaxpayerQuery({
   session: taxpayerSessions['${role}'], tax: 'vehiculos', identifier: '${identifier}'
  }, invoice.tax, invoice.object)).map(invoice => invoice.object).join(',')
 `, context);
 assert.equal(plates('Contribuyente', '', '2026'), 'JWT71D,MCU235');
 assert.equal(plates('Gran contribuyente', 'JWT71D', '2026'), 'JWT71D');
 assert.equal(plates('Gran contribuyente', 'MCU235', '2026'), '');
 assert.equal(plates('Contribuyente', '', '2025'), '');
});

test('reexpedición conserva las acciones de descarga y pago sin controles de beneficio', () => {
 const events = {};
 const status = { dataset: {}, isConnected: true };
 const markup = [];
 let config;
 let filename;
 let dialog;
 const target = { lastElementChild: {
  insertAdjacentHTML: (_, text) => markup.push(text),
  querySelector: selector => selector === '[data-invoice-status]' ? status : null,
  addEventListener: (type, handler) => { events[type] = handler; },
 } };
 const context = createContext({
  target,
  renderQueryResults: (_, options) => { config = options; },
  downloadLocalPdf: name => { filename = name; },
  showDetailModal: options => { dialog = options; },
  loadingState: message => message,
  window: { setTimeout: callback => callback() },
 });
 vm.runInContext(`renderInvoiceResults(target, invoiceExamples.slice(0, 2),
  { tax: 'vehiculos', session: taxpayerSessions.Contribuyente }, [], {}, { reissue: true });`, context);
 assert.deepEqual(Array.from(config.headers), ['Placa', 'Marca', 'Acciones']);
 assert.match(config.formatCell(0, 2), /data-invoice-action="download"[^>]*>Descargar.*data-invoice-action="pay"[^>]*>Pagar/);
 assert.doesNotMatch(markup.join(''), /beneficio|data-invoice-bulk/);
 assert.equal(events.change, undefined);
 for (const action of ['download', 'pay']) {
  const button = { dataset: { invoiceAction: action, invoiceIndex: '0' } };
  events.click({ target: { closest: () => button } });
 }
 assert.equal(filename, 'factura-reexpedida-prueba-JWT71D-2026.pdf');
 assert.equal(dialog.title, 'Realiza el pago de tu factura');
});

test('opciones de pago sin proveedor muestran ambas alternativas deshabilitadas', () => {
 let dialog;
 const context = createContext({ showDetailModal: options => { dialog = options; } });
 vm.runInContext('showInvoicePayment(invoiceExamples[0], null)', context);
 assert.match(dialog.body, /Pago con aporte voluntario/);
 assert.match(dialog.body, /Pago sin aporte voluntario/);
 assert.equal((dialog.body.match(/type="radio"[^>]+disabled/g) || []).length, 2);
 assert.doesNotMatch(dialog.body, /undefined|null|\schecked\b/);
 assert.match(dialog.actions, /disabled>Continuar al pago/);
});

test('beneficio conserva cinco selecciones y permite liberar un cupo', () => {
 const handlers = {};
 let barState;
 const inputs = Array.from({ length: 6 }, (_, index) => ({
  matches: () => true, dataset: { invoiceSelection: String(index) },
 }));
 const view = {
  insertAdjacentHTML() {},
  querySelector: () => null,
  querySelectorAll: () => inputs,
  addEventListener: (event, handler) => { handlers[event] = handler; },
 };
 const context = createContext({
  target: { lastElementChild: view },
  renderQueryResults: () => {},
  mountSelectionActionBar: () => ({ update: state => { barState = state; } }),
 });
 vm.runInContext(`
  const invoices = Array.from({ length: 6 }, (_, index) => ({ ...invoiceExamples[0], object: String(index) }));
  renderInvoiceResults(target, invoices, { tax: 'vehiculos', session: taxpayerSessions.Contribuyente }, []);
 `, context);
 assert.equal(barState.disabled, true);
 const toggle = (index, checked) => {
  inputs[index].checked = checked;
  handlers.change({ target: inputs[index] });
 };
 for (let index = 0; index < 5; index++) toggle(index, true);
 assert.equal(barState.countText, '5 facturas seleccionadas');
 assert.match(barState.infoText, /máximo de 5 facturas/);
 assert.equal(inputs[5].disabled, true);
 toggle(5, true);
 assert.equal(inputs[5].checked, false);
 toggle(0, false);
 assert.equal(inputs[5].disabled, false);
 assert.equal(barState.countText, '4 facturas seleccionadas');
});

test('cada factura y la acción múltiple abren el modal del beneficio', () => {
 let dialog;
 const events = {};
 const bulk = {};
 let requestBulk;
 const apply = { addEventListener() {} };
 const view = {
  insertAdjacentHTML() {},
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: (event, handler) => { events[event] = handler; },
 };
 const context = createContext({
  target: { lastElementChild: view },
  renderQueryResults: () => {},
  mountSelectionActionBar: (_, options) => {
   requestBulk = options.onPrimary;
   return { update() {} };
  },
  ritFormValues: { 'electronic-mailbox': { checked: true }, 'institutional-information': { checked: true } },
  existingRitPage: '',
  document: { createElement: () => ({ content: { querySelector: selector => ({ textContent: selector.includes('electronic-mailbox')
   ? 'Autorizo el uso del buzón electrónico para recibir notificaciones.'
   : 'Autorizo uso de la anterior información para fines institucionales.' }) } }) },
  showDetailModal: options => {
   dialog = options;
   return { modal: { querySelector: () => apply, querySelectorAll: () => [], addEventListener() {} } };
  },
 });
 vm.runInContext("renderInvoiceResults(target, invoiceExamples.slice(0, 2), { tax: 'vehiculos', session: taxpayerSessions.Contribuyente }, [0, 1]);", context);
 const individual = { hasAttribute: () => false, dataset: { invoiceAction: 'benefit', invoiceIndex: '0' } };
 events.click({ target: { closest: () => individual } });
 assert.equal(dialog.title, 'Solicita el beneficio del 1 %');
 assert.match(dialog.body, /JWT71D/);
 assert.match(dialog.body, /Autorizaciones de Mi RIT/);
 assert.match(dialog.body, /Autorizo el uso del buzón electrónico/);
 assert.match(dialog.body, /información para fines institucionales/);
 assert.equal((dialog.body.match(/checked disabled/g) || []).length, 2);
 assert.doesNotMatch(dialog.body, /MCU235|Solicitud de prueba/);
 requestBulk(bulk);
 assert.match(dialog.body, /JWT71D/);
 assert.match(dialog.body, /MCU235/);
 assert.equal(apply.disabled, false);
});

test('certificaciones conserva la referencia completa y limita la descarga a una solicitud en curso', () => {
 let config;
 let downloads = 0;
 const queue = [];
 const status = { dataset: {}, isConnected: true };
 const button = { disabled: false };
 const view = {
  insertAdjacentHTML() {},
  querySelector: selector => selector === '[data-cert-status]' ? status : button,
  addEventListener() {},
 };
 button.addEventListener = () => {};
 const context = createContext({
  target: { lastElementChild: view }, button, status, download: () => { downloads++; },
  renderQueryResults: (_, options) => { config = options; },
  loadingState: text => text,
  window: { setTimeout: callback => queue.push(callback) },
 });
 vm.runInContext(`renderPaymentCertificationResults(target, [paymentCertificationExamples[0]], 'vehiculos');
  const options = { loading: 'Generando', success: 'Correcto', download };
  runBillingDownload(button, status, options);
  runBillingDownload(button, status, options);`, context);
 assert.equal(config.rows[0][3], '0000026031822608');
 assert.deepEqual(Array.from(config.rows[0].slice(0, 2)), ['CC', '1000000001']);
 assert.equal(config.alignRight, 4);
 assert.equal(config.formatCell(1072000, 4), '1.072.000');
 assert.match(config.formatCell(config.rows[0][6], 6), /data-cert-payment="0000026031822608".*>Descargar<\/button>/);
 assert.equal(queue.length, 1);
 queue[0]();
 assert.equal(downloads, 1);
 assert.equal(button.disabled, false);
 assert.equal(status.innerHTML, 'Correcto');
});

test('Notarías conserva las tres estructuras conocidas y marca cuatro impuestos pendientes', () => {
 const context = vm.createContext({});
 const taxes = vm.runInContext(load('notary-obligations.js') + '\nnotaryTaxes', context);
 assert.equal(Object.keys(taxes).length, 7);
 for (const key of ['predial', 'vehiculos', 'delineacion']) assert.equal(taxes[key].columns.length > 0, true);
 for (const key of ['ica', 'reteica', 'sobretasa', 'publicidad']) {
  assert.equal(taxes[key].pending, true);
  assert.equal(taxes[key].columns, undefined);
 }
});
