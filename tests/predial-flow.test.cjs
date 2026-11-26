const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup() {
 const handlers = {};
 const context = vm.createContext({
  document: { addEventListener(name, fn) { (handlers[name] ||= []).push(fn); }, querySelectorAll: () => [], getElementById: () => ({ value: '600741000' }) },
  icaEscape: value => String(value ?? ''), pageTitle: title => title, section: (title, content) => title + content, table: () => '',
  getTaxpayerIdentity: () => ({ documentType: 'CC', documentNumber: '1000000001', fullName: 'Miguel Salazar' }),
  renderRoute() {}, Intl, location: { hash: '#predial-declaracion' },
 });
 vm.runInContext(fs.readFileSync('js/predial-declaration.js', 'utf8'), context);
 vm.runInContext('predialMessage = () => {}; downloadPredialExample = () => {};', context);
 return { context, click(action) { handlers.click.forEach(fn => fn({ target: { closest: selector => selector === '[data-pd-action]' ? ({ dataset: { pdAction: action }, disabled: false }) : null } })); }, state() { return vm.runInContext('({...predialDraft})', context); } };
}
test('predial requires calculation then signature before submission', () => {
 const app = setup();
 app.click('submit'); assert.equal(app.state().submitted, false);
 app.click('sign'); assert.equal(app.state().signed, false);
 app.click('calculate'); assert.equal(app.state().calculated, true);
 app.click('add-signers'); assert.equal(app.state().signed, false);
 app.click('sign'); assert.equal(app.state().signed, true);
 app.click('submit'); assert.equal(app.state().submitted, true);
});
test('predial displays reference values after calculating and enables download after submission', () => {
 const app = setup();
 let html = vm.runInContext('renderPredialDeclaration()', app.context);
 assert.match(html, /data-pd-action="submit" disabled/);
 app.click('calculate'); html = vm.runInContext('renderPredialDeclaration()', app.context);
 assert.match(html, /6\.189\.000/);
 app.click('sign'); app.click('submit'); html = vm.runInContext('renderPredialDeclaration()', app.context);
 assert.match(html, /Generar ROP/); assert.match(html, /Descargar declaración PDF/);
});

test('ROP validates formatted partial amounts and preserves full payment default', () => {
 const app = setup();
 for (const [input, expected] of [['',590000],['500.000',500000],['590000',590000],['0',null],['590001',null],['abc',null],['50.00',null]]) {
  assert.equal(vm.runInContext(`parsePredialRopAmount(${JSON.stringify(input)})`,app.context),expected);
 }
 app.click('calculate'); app.click('sign'); app.click('submit');
 assert.match(vm.runInContext('renderPredialRop()',app.context),/571\.000/);
 assert.match(vm.runInContext('renderPredialRop()',app.context),/590\.000/);
});
