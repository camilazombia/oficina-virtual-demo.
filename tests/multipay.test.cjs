const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function setup(overrides = {}) {
 const context = vm.createContext({
  paymentHistoryExamples: { predial: { rows: [] } },
  ...overrides,
 });
 for (const file of ['taxpayer-queries.js', 'multipay.js']) {
  vm.runInContext(readFileSync(resolve(__dirname, '../js', file), 'utf8'), context, { filename: file });
 }
 return context;
}

test('multipago admite buscar por impuesto y aplica filtros opcionales y permisos', () => {
 const context = setup();
 assert.equal(vm.runInContext(`
  const base = { session: taxpayerSessions.Contribuyente, tax: 'vehiculos' };
  multipayPendingRows(base).length
 `, context), 3);
 assert.equal(vm.runInContext("multipayPendingRows({ ...base, identifier: 'JWT71D', year: '2025' }).length", context), 1);
 assert.equal(vm.runInContext("multipayPendingRows({ ...base, session: taxpayerSessions['Gran contribuyente'] }).length", context), 2);
 assert.equal(vm.runInContext("multipayPendingRows({ ...base, session: taxpayerSessions['Gran contribuyente'], identifier: 'MCU235' }).length", context), 0);
 assert.equal(vm.runInContext('multipayObjectFilters.vehiculos.optional && multipayObjectFilters.predial.optional', context), true);
 assert.equal(vm.runInContext("['ABC', 'ABCD', 'ABC12345', 'ABC123456'].map(value => new RegExp('^' + multipayObjectFilters.vehiculos.pattern + '$').test(value)).join(',')", context), 'false,true,true,false');
});

test('agregar al listado exige dos referencias nuevas, evita duplicados y respeta el máximo', () => {
 const context = setup();
 const result = vm.runInContext(`
  const rows = Array.from({ length: 52 }, (_, index) => ({ reference: String(index), total: 10 }));
  const list = new Map();
  [
   addMultipayObligations(list, [rows[0], rows[0]]),
   addMultipayObligations(list, rows.slice(0, 49)),
   addMultipayObligations(list, rows.slice(48, 51)),
   list.size,
   addMultipayObligations(list, [rows[0], rows[49]]),
   list.delete('0'),
   addMultipayObligations(list, rows.slice(49, 51)),
   list.size,
   multipayTotal([...list.values()]),
  ].join(',')
 `, context);
 assert.equal(result, 'minimum,added,limit,49,minimum,true,added,50,500');
});

test('el PDF del ROP incluye las 50 referencias y se identifica sin validez oficial', () => {
 let document;
 const context = setup({
  billingAmount: new Intl.NumberFormat('es-CO'),
  downloadLocalPdf: (name, lines) => { document = { name, lines }; },
 });
 vm.runInContext(`
  const references = Array.from({ length: 50 }, (_, index) => 'REF-' + String(index + 1).padStart(3, '0'));
  downloadMultipayRop({ id: 'ROP-MP-0001', total: 1250000, references });
 `, context);
 assert.equal(document.name, 'rop-mp-0001-prueba.pdf');
 assert.match(document.lines.join('\n'), /sin validez oficial/);
 assert.match(document.lines.join('\n'), /\$1\.250\.000 COP/);
 assert.equal((document.lines.join(' ').match(/REF-\d{3}/g) || []).length, 50);
 assert.ok(document.lines.length <= 20);
});
