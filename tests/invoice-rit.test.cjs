const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = readFileSync(resolve(__dirname, '../js/invoice-rit.js'), 'utf8');

function mount(service) {
 const control = (value = '') => ({
  value, handlers: {}, checkValidity: () => true,
  replaceChildren() { this.innerHTML = ''; },
  setCustomValidity() {},
  addEventListener(type, callback) { this.handlers[type] = callback; },
 });
 const name = control('MIGUEL');
 const update = control();
 const validate = control();
 const notice = control();
 notice.querySelector = () => notice.innerHTML?.includes('<strong') ? {} : null;
 const controls = {
  '#basic-first-name': name, '#basic-middle-name': control(), '#basic-first-surname': control('SALAZAR'),
  '#basic-second-surname': control(), '#basic-document-issue-date': control('2000-01-01'),
  '[data-rit-name-update]': update, '[data-rit-name-validate]': validate, '[data-rit-name-status]': notice,
 };
 const personal = Object.assign(control(), { querySelector: selector => controls[selector] });
 const contactUpdate = control();
 const contactNotice = control();
 const contactControls = {
  '#new-email': control(), '#confirm-email': control(), '#current-email': control('original@example.com'),
  '[data-rit-contact-update]': contactUpdate, '[data-rit-contact-status]': contactNotice,
 };
 const contact = Object.assign(control(), {
  querySelector: selector => contactControls[selector],
  querySelectorAll: () => Object.values(contactControls),
 });
 const form = Object.assign(control(), { isConnected: true, querySelector: selector => ({
  '[aria-labelledby="basic-personal-data"]': personal, '[aria-labelledby="contact-data"]': contact,
  '#basic-id-class': control('CC'), '#basic-document-number': control('1000000001'),
 }[selector]) });
 const identity = {};
 const saved = [];
 const back = control();
 const context = vm.createContext({
  window: { ritNameService: service },
  document: { querySelector: selector => selector === '[data-invoice-rit]' ? form : back },
  statusAlert: (_, body) => body,
  readRitFormValues: () => ({ 'current-email': { value: contactControls['#current-email'].value } }),
  taxpayerIdentity: identity,
  ritFormValues: { 'basic-first-name': { value: 'MIGUEL' } },
  persistRitFormValues: values => saved.push(values),
  syncTaxpayerProfile() {},
 });
 vm.runInContext(source + '\nmountInvoiceRit();', context);
 return {
  validate, update, name, notice, saved, contactUpdate, contactNotice, contactControls,
  nameFields: controls,
  edit(value) { name.value = value; personal.handlers.input({ target: name }); },
 };
}

test('el servicio controla el umbral del 90 % y la edición invalida el resultado', async () => {
 let percentage = 79;
 const form = mount({ validate: async () => ({ percentage }), update: async () => ({ updated: true }) });
 assert.equal(form.update.disabled, true);
 await form.validate.handlers.click();
 assert.match(form.notice.innerHTML, /79 %/);
 assert.equal(form.update.disabled, true);
 percentage = 90;
 await form.validate.handlers.click();
 assert.match(form.notice.innerHTML, /Nombre validado/);
 assert.equal(form.update.disabled, false);
 form.edit('MIGUEL ÁNGEL');
 assert.equal(form.update.disabled, true);
 assert.match(form.notice.innerHTML, /Valida nuevamente/);
});

test('el nombre solo se guarda tras confirmar la actualización y el contacto se guarda por separado', async () => {
 let updated = false;
 const form = mount({ validate: async () => ({ percentage: 90 }), update: async () => ({ updated }) });
 form.edit('MIGUEL ÁNGEL');
 form.contactControls['#current-email'].value = 'contacto@example.com';
 form.contactUpdate.handlers.click();
 assert.equal(form.saved[0]['current-email'].value, 'contacto@example.com');
 assert.equal(form.saved[0]['basic-first-name'].value, 'MIGUEL');
 await form.validate.handlers.click();
 await form.update.handlers.click();
 assert.match(form.notice.innerHTML, /No fue posible actualizar/);
 assert.equal(form.update.disabled, false);
 updated = true;
 await form.update.handlers.click();
 assert.match(form.notice.innerHTML, /Nombre actualizado/);
 assert.equal(form.saved[1]['basic-first-name'].value, 'MIGUEL ÁNGEL');
});

test('la demostración acepta solo Miguel y guarda localmente tras confirmar', async () => {
 const form = mount();
 form.edit('Andrés');
 await form.validate.handlers.click();
 assert.match(form.notice.innerHTML, /No pudimos validar tu nombre/);
 assert.match(form.notice.innerHTML, /79 %/);
 assert.doesNotMatch(form.notice.innerHTML, /Resultado simulado/);
 assert.equal(form.update.disabled, true);
 assert.equal(form.saved.length, 0);
 form.edit(' miGUel ');
 await form.validate.handlers.click();
 assert.match(form.notice.innerHTML, /Nombre validado/);
 assert.equal(form.update.disabled, false);
 assert.equal(form.saved.length, 0);
 await form.update.handlers.click();
 assert.equal(form.saved[0]['basic-first-name'].value, 'miGUel');
 assert.match(form.notice.innerHTML, /Los cambios se guardaron correctamente/);
});

test('la demostración verifica los otros nombres y apellidos', async () => {
 const form = mount();
 const fields = form.nameFields;
 for (const [id, incorrect, correct] of [
  ['#basic-middle-name', 'David', 'ANDRES'],
  ['#basic-first-surname', 'Gómez', 'salazar'],
  ['#basic-second-surname', 'Pérez', 'Ríos'],
 ]) {
  fields[id].value = incorrect;
  await form.validate.handlers.click();
  assert.match(form.notice.innerHTML, /79 %/);
  assert.equal(form.update.disabled, true);
  fields[id].value = correct;
 }
 await form.validate.handlers.click();
 assert.match(form.notice.innerHTML, /Nombre validado/);
 assert.equal(form.update.disabled, false);
});
