const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = readFileSync(resolve(__dirname, '../js/taxpayer-queries.js'), 'utf8');
const fuelSource = readFileSync(resolve(__dirname, '../js/fuel-surtax.js'), 'utf8');

function mountQuery(role, search = '', fuel = false) {
 const classes = () => {
  const values = new Set();
  return {
   contains: key => values.has(key),
   remove: key => values.delete(key),
   toggle: (key, enabled) => enabled ? values.add(key) : values.delete(key),
  };
 };
 const status = { innerHTML: '' };
 const results = { rows: [], innerHTML: '', replaceChildren() { this.rows = []; this.innerHTML = ''; } };
 if (fuel) status.parentElement = { nextElementSibling: results };
 else status.nextElementSibling = results;
 const handlers = {};
 const object = {
  value: '', classList: classes(), validity: { valid: true },
  setCustomValidity(message) { this.validationMessage = message; this.validity.valid = !message; },
  setSelectionRange() {}, removeAttribute() {},
  addEventListener(name, handle) { handlers[name] = handle; },
 };
 const tax = { value: fuel ? 'sobretasa' : 'predial' };
 const year = { value: '' };
 const period = { value: '', options: [{}], parentElement: { classList: classes() }, add(option) { this.options.push(option); } };
 const button = {};
 const elements = {
  '.invalid-feedback': {}, '[data-taxpayer-label]': {}, '.form-text': {},
 };
 const field = { querySelector: selector => elements[selector], classList: classes() };
 const form = {
  isConnected: true, elements: { tax, object, year, period }, classList: classes(), nextElementSibling: status,
  querySelector: selector => selector === '[data-taxpayer-field]' ? field : button,
  checkValidity: () => object.validity.valid && (!fuel || Boolean(year.value && period.value)),
  addEventListener(name, handle) { handlers[name] = handle; },
 };
 const timers = new Map();
 let nextTimer = 0;
 const window = {
  location: { search },
  setTimeout(callback) { timers.set(++nextTimer, callback); return nextTimer; },
  clearTimeout: id => timers.delete(id),
 };
 const context = vm.createContext({
  window, URLSearchParams, document: { getElementById: id => id === 'fuel-surtax-year' ? year : form }, role,
  location: window.location, Option: function Option(label, value) { this.label = label; this.value = value; },
  getTaxpayerIdentity: () => ({ documentType: 'CC', documentNumber: '123' }),
  taxDetailGroup: (title, fields) => JSON.stringify({ title, fields }),
  renderQueryResults: (target, { rows }) => { target.rows = rows; },
  paymentHistoryExamples: { predial: { rows: [] } },
  emptyState: message => message, statusAlert: (_, message) => message, loadingState: message => message,
 });
 vm.runInContext(fuel ? source + fuelSource + 'taxpayerSession = taxpayerSessions[role]; mountFuelSurtax();' : source + `
  taxpayerSession = taxpayerSessions[role];
  mountTaxpayerQuery('test', query => [
   ['predial', 'AAA0012MOYN'], ['predial', 'AAA0000XRYX'], ['vehiculos', 'JWT71D'],
   ['delineacion', 'CDU1121621'], ['delineacion', 'CDU1121703']
  ].filter(([tax, object]) => matchesTaxpayerQuery(query, tax, object)),
  (target, rows) => { target.rows = rows; });
 `, context);
 return {
  field, button, object, status, results, year, period,
  changeYear(value) { year.value = value; handlers.input({ target: year }); },
  changePeriod(value) { period.value = value; handlers.input({ target: period }); },
  type(value) { object.value = value; handlers.input({ target: object }); },
  changeTax(value) { tax.value = value; handlers.input({ target: tax }); },
  submit() { handlers.submit({ preventDefault() {} }); },
  flush() {
   for (const [id, callback] of timers) {
    timers.delete(id);
    callback();
   }
  },
 };
}

test('Sobretasa inicia en octubre de 2026 y descarta resultados al cambiar la vigencia', () => {
 const query = mountQuery('Gran contribuyente', '?perfil=sobretasa', true);
 assert.equal(query.year.value, '2026');
 assert.equal(query.period.value, '10');
 assert.equal(query.period.options.length, 13);
 query.flush();
 assert.equal(query.results.rows.length, 15);
 assert.match(query.results.innerHTML, /"Número de tanques",0/);
 query.changeYear('2025');
 assert.equal(query.results.rows.length, 0);
 assert.equal(query.results.innerHTML, '');
 assert.equal(query.period.value, '');
 assert.equal(query.period.options.length, 5);
 assert.equal(query.button.disabled, true);
 query.changePeriod('09');
 query.submit();
 query.flush();
 assert.match(query.status.innerHTML, /No se encontró información tributaria/);
});

test('Sobretasa conserva aislados los registros del escenario de consulta', () => {
 const query = mountQuery('Contribuyente', '', true);
 assert.equal(query.year.value, '');
 assert.equal(query.period.disabled, true);
 assert.equal(query.button.disabled, true);
 assert.match(query.status.innerHTML, /No hay vigencias disponibles/);
 assert.equal(query.results.rows.length, 0);
});

test('Contribuyente consulta todos sus predios coincidentes sin ingresar un CHIP', () => {
 const query = mountQuery('Contribuyente');
 assert.equal(query.field.classList.contains('d-none'), true);
 assert.equal(query.button.disabled, false);
 query.submit();
 assert.match(query.status.innerHTML, /Consultando/);
 query.flush();
 assert.equal(query.results.rows.map(row => row[1]).join(','), 'AAA0012MOYN,AAA0000XRYX');
});

test('Gran contribuyente normaliza la identificación, filtra por objeto y limpia al cambiar el impuesto', () => {
 const query = mountQuery('Gran contribuyente');
 assert.equal(query.object.placeholder, 'Ingresa el chip del predio.');
 assert.equal(query.button.disabled, true);
 query.type('abc');
 assert.equal(query.object.validationMessage, 'Ingresa un CHIP válido.');
 query.type(' aaa0012moyn ');
 assert.equal(query.button.disabled, false);
 assert.equal(query.results.rows.length, 0);
 query.submit();
 assert.equal(query.object.value, 'AAA0012MOYN');
 query.flush();
 assert.equal(query.results.rows.map(row => row[1]).join(','), 'AAA0012MOYN');
 query.changeTax('vehiculos');
 assert.equal(query.object.placeholder, 'Ingresa la placa del vehículo.');
 assert.equal(query.object.value, '');
 assert.equal(query.results.rows.length, 0);
 assert.equal(query.button.disabled, true);
 query.type('jwt71d');
 query.submit();
 query.flush();
 assert.equal(query.results.rows.map(row => row[1]).join(','), 'JWT71D');
 query.changeTax('ica');
 assert.equal(query.object.disabled, true);
 assert.equal(query.button.disabled, false);
});

test('la consulta diferencia falta de autorización, ausencia de resultados y error recuperable', () => {
 const query = mountQuery('Gran contribuyente', '?demo=error');
 query.type('aaa0000xryx');
 query.submit();
 query.flush();
 assert.match(query.status.innerHTML, /No fue posible realizar la consulta/);
 query.submit();
 query.flush();
 assert.match(query.status.innerHTML, /No encontramos un objeto disponible/);
 query.type('aaa0000xpt0');
 query.submit();
 query.flush();
 assert.match(query.status.innerHTML, /No se encontraron resultados/);
});

test('Delineación usa el CDU autorizado y solo Gran contribuyente debe ingresarlo', () => {
 const contributor = mountQuery('Contribuyente');
 contributor.changeTax('delineacion');
 assert.equal(contributor.object.disabled, true);
 contributor.submit();
 contributor.flush();
 assert.equal(contributor.results.rows.map(row => row[1]).join(','), 'CDU1121621,CDU1121703');
 const large = mountQuery('Gran contribuyente');
 large.changeTax('delineacion');
 assert.equal(large.object.placeholder, 'Ingresa el CDU de la obra.');
 large.type('cdu12');
 assert.equal(large.object.validationMessage, 'Ingresa un CDU válido.');
 large.type(' cdu1121621 ');
 large.submit();
 large.flush();
 assert.equal(large.results.rows.map(row => row[1]).join(','), 'CDU1121621');
 large.type('CDU1121703');
 large.submit();
 large.flush();
 assert.match(large.status.innerHTML, /No encontramos un objeto disponible/);
});
