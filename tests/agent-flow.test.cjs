const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function setup() {
	const fields = new Map();
	const listeners = new Map();
	function field(id) {
		if (!fields.has(id)) fields.set(id, {
			id, value: '', textContent: '', innerHTML: '', disabled: false, required: false, style: {},
			classList: { values: new Set(), add(...names) { names.forEach((n) => this.values.add(n)); }, remove(...names) { names.forEach((n) => this.values.delete(n)); }, contains(n) { return this.values.has(n); }, toggle(n, force) { force ? this.values.add(n) : this.values.delete(n); } },
			focus() { this.focused = true; },
			setCustomValidity(message) { this.validationMessage = message; },
			setAttribute(name, value) { this[name] = value; },
			removeAttribute(name) { delete this[name]; },
			querySelector(selector) { return field(`${id}:${selector}`); },
			closest(selector) { return selector === `#${id}` ? this : null; },
		});
		return fields.get(id);
	}
	const document = {
		getElementById: field,
		querySelector(selector) { return selector === '[name="agentPropertyType"]:checked' ? { value: 'CHIP' } : field(selector); },
		addEventListener(type, callback) {
			if (!listeners.has(type)) listeners.set(type, []);
			listeners.get(type).push(callback);
		},
	};
	function emit(type, target) {
		const event = { target, preventDefault() { this.prevented = true; } };
		for (const callback of listeners.get(type) || []) callback(event);
		return event;
	}
	const context = vm.createContext({ document, console, window: { location: { hash: '' } }, pageTitle: (title) => `<h1>${title}</h1>`, bootstrap: {
		Tab: { getOrCreateInstance: (tab) => ({ show() {
			const number = tab.id.split('-').pop();
			tab.dataset = { wizardTab: number };
			if (!emit('show.bs.tab', tab).prevented) emit('shown.bs.tab', tab);
		} }) },
	} });
	const run = (code) => vm.runInContext(code, context);
	const main = fs.readFileSync(path.join(__dirname, '../js/script.js'), 'utf8');
	run(fs.readFileSync(path.join(__dirname, '../js/agent-flow.js'), 'utf8'));
	run(main.slice(main.indexOf('let selectedAgentLookup ='), main.indexOf('const vehicles =')));
	run(main.slice(main.indexOf('const authorizedAgents ='), main.indexOf('function renderRitPage(')));
	field('agentQualityForm').reportValidity = () => Boolean(field('agentQuality').value && field('agentValidityStart').value && (!field('agentValidityEnd').value || field('agentValidityEnd').value >= field('agentValidityStart').value));
	return { run, field, emit, context };
}

test('editing opens step two and saves the existing agent without creating a duplicate', () => {
	const { run, field, emit, context } = setup();
	const count = run('authorizedAgents.length');
	run('startAgentEdit(authorizedAgents[0])');
	assert.equal(run('agentWizardDraft.step'), 2);
	assert.equal(context.window.location.hash, 'rit-agentes-habilitar');
	assert.equal(run('agentWizardDraft.quality'), run('authorizedAgents[0].quality'));
	assert(run('renderAgentWizard()').includes('Guardar cambios'));
	field('agentQuality').value = 'Tutor';
	field('agentValidityStart').value = '2026-01-01';
	field('agentValidityEnd').value = '';
	emit('click', field('agentWizardFinish'));
	assert.equal(run('authorizedAgents.length'), count);
	assert.equal(run('authorizedAgents[0].quality'), 'Tutor');
	assert.equal(run('authorizedAgents[0].taxes.join(",")'), 'Predial,Vehicular');
	assert.equal(context.window.location.hash, 'rit-agentes');
});

test('lookup finds a formatted document and asks for confirmation before continuing', () => {
	const { run, field, context } = setup();
	const form = field('search');
	form.reportValidity = () => true;
	form.elements = { documentType: { value: 'CC' }, documentNumber: { value: '1.000.000.002', nextElementSibling: {}, setCustomValidity(message) { this.validationMessage = message; } } };
	field('agentLookupConfirmation').classList.add('d-none');
	context.searchForm = form;
	run('searchAgentForWizard(searchForm)');
	assert(field('agentLookupConfirmation').innerHTML.includes('Agente De Prueba Demo'));
	assert(field('agentLookupConfirmation').innerHTML.includes('data-agent-confirm-person'));
	assert(form.classList.contains('d-none'));
	assert.equal(context.window.location.hash, '');
	form.elements.documentNumber.value = '000000';
	run('searchAgentForWizard(searchForm)');
	assert.match(form.elements.documentNumber.validationMessage, /No encontramos/);
});

test('wizard renders three Bootstrap steps with disabled identity fields and unique IDs', () => {
	const { run } = setup();
	run('selectedAgentLookup = agentDirectory[0]');
	const html = run('renderAgentWizard()');
	for (const step of [1, 2, 3]) {
		assert(html.includes(`aria-controls="agent-pane-${step}"`));
		assert(html.includes(`aria-labelledby="agent-step-${step}"`));
	}
	assert.match(html, /id="agentReadFirst"[^>]+disabled/);
	assert(html.includes('agentAuthObject') && html.includes('agentSelectedFiles'));
	const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
	assert.equal(ids.length, new Set(ids).size);
	assert(run('renderAgentLookupModal()').includes('data-agent-search-form'));
});

test('quality validation blocks missing documents and inverted dates; permits advancing with a PDF', () => {
	const { run, field } = setup();
	run('selectedAgentLookup = agentDirectory[0]');
	field('agentQuality').value = 'Tutor';
	field('agentValidityStart').value = '2026-10-27';
	field('agentValidityEnd').value = '2026-10-26';
	assert.equal(run('validateAgentQuality()'), false);
	field('agentValidityEnd').value = '2026-10-31';
	assert.equal(run('validateAgentQuality()'), false);
	assert.match(field('agentDocumentError').textContent, /Adjunta/);
	run('selectedAgentDocuments = [{name:"soporte.pdf",size:1024}]');
	run('navigateAgentWizard(3)');
	assert.equal(run('agentWizardDraft.step'), 3);
	assert.equal(run('agentWizardDraft.quality'), 'Tutor');
	run('updateAgentQualityDocuments()');
	assert(field('agentRequiredDocuments').innerHTML.includes('Tarjeta de identidad del menor'));
	run('navigateAgentWizard(2)');
	assert.equal(run('agentWizardDraft.step'), 2);
	assert.equal(run('selectedAgentDocuments.length'), 1);
});

test('authorizations use tax-specific periods, prevent duplicates, and finish adds an agent', () => {
	const { run, field, emit, context } = setup();
	run('selectedAgentLookup = agentDirectory[0]; selectedAgentDocuments = [{name:"soporte.pdf",size:1024}]');
	field('agentQuality').value = 'Tutor';
	field('agentValidityStart').value = '2026-10-27';
	field('agentAuthTax').value = 'predial';
	field('agentAuthYear').value = '2026';
	run('updateAgentAuthorizationFields()');
	assert.equal(field('agentAuthObject').required, true);
	assert.equal(field('agentAuthPeriod').value, 'Anual');
	field('agentAuthObject').value = 'DEMO0000001';
	const form = field('agentAuthorizationForm');
	form.reportValidity = () => true;
	form.reset = () => {};
	emit('submit', form);
	assert.equal(run('agentWizardDraft.authorizations.length'), 1);
	emit('submit', form);
	assert.equal(run('agentWizardDraft.authorizations.length'), 1);
	assert.match(field('agentAuthorizationError').textContent, /ya está agregada/);
	field('agentAuthTax').value = 'ica';
	run('updateAgentAuthorizationFields()');
	assert.equal(field('agentAuthObject').disabled, true);
	assert(field('agentAuthPeriod').innerHTML.includes('Enero – Febrero'));
	assert(!field('agentAuthPeriod').innerHTML.includes('Anual'));
	const previousCount = run('authorizedAgents.length');
	emit('click', field('agentWizardFinish'));
	assert.equal(run('authorizedAgents.length'), previousCount + 1);
	assert.equal(run('authorizedAgents.at(-1).name'), 'Agente De Prueba Demo');
	assert.equal(run('authorizedAgents.at(-1).authorizations.length'), 1);
	assert.equal(context.window.location.hash, 'rit-agentes');
	assert(run('renderAuthorizedAgents()').includes('Se agregó a Agente De'));
});

test('document upload rejects non-PDF and oversized files and avoids duplicates', () => {
	const { run, field } = setup();
	const source = fs.readFileSync(path.join(__dirname, '../js/script.js'), 'utf8');
	const start = source.indexOf('function addAgentDocuments(files)');
	const end = source.indexOf('document.addEventListener("change"', start);
	run('function renderAgentDocumentList() {}');
	run(source.slice(start, end));
	run(`addAgentDocuments([
		{name:'image.png', type:'image/png',size:10,lastModified:1},
		{name:'large.pdf', type:'application/pdf',size:21*1024*1024,lastModified:1},
		{name:'valid.pdf', type:'application/pdf',size:1024,lastModified:1}
	])`);
	assert.equal(run('selectedAgentDocuments.length'), 1);
	assert(field('agentDocumentError').textContent.includes('image.png'));
	assert(field('agentDocumentError').textContent.includes('large.pdf'));
	run("addAgentDocuments([{name:'valid.pdf',type:'application/pdf',size:1024,lastModified:1}])");
	assert.equal(run('selectedAgentDocuments.length'), 1);
	assert(field('agentDocumentError').classList.contains('d-none'));
});
