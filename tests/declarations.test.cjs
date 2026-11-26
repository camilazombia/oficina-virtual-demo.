const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const source = readFileSync(require('node:path').join(__dirname, '../js/declarations.js'), 'utf8');

function run(expression) {
	const session = { requiresObject: true };
	const context = vm.createContext({
		URLSearchParams, taxpayerSession: session, currentTaxYear: () => '2026',
		yearOptions: (first, last) => Array.from({ length: last - first + 1 }, (_, index) => String(last - index)),
		publicityElementsFor: active => active === session ? [{ resolution: 'RES202101843', kind: 'tubular' }] : [],
		document: { addEventListener() {} },
	});
	vm.runInContext(source, context);
	return vm.runInContext(expression, context);
}

test('la consulta diferencia la placa requerida de los filtros de predial y preserva la selección en la URL', () => {
	assert.equal(run(`declarationSearchContext(new URLSearchParams('impuesto=predial&vigencia=2026&placa=961QQR')).identifier`), '');
	assert.equal(run(`declarationSearchContext(new URLSearchParams('impuesto=vehiculos&vigencia=2026&placa=961QQR')).identifier`), '961QQR');
	assert.equal(run(`declarationSearchContext(new URLSearchParams('impuesto=vehiculos&placa=961QQR'), {}).identifier`), '');
	assert.equal(run(`declarationUrl({ tax: 'vehiculos', year: '2026', identifier: '961QQR' }, '961QQR')`),
		'?impuesto=vehiculos&vigencia=2026&placa=961QQR&objeto=961QQR#declaraciones-generar');
	assert.equal(run(`declarationDetailContext(new URLSearchParams('impuesto=predial&vigencia=2026&objeto=AAA0148KZWF'))`), null);
	assert.equal(run(`declarationDetailContext(new URLSearchParams('impuesto=vehiculos&vigencia=2026&placa=961QQR&objeto=JWT71D'))`), null);
});

test('las tres liquidaciones calculan el total y publicidad actualiza el subtotal', () => {
	const values = run(`JSON.stringify(['predial', 'vehiculos', 'publicidad'].map((tax, index) => {
		const record = declarationRecords(taxpayerSession, tax)[index === 0 ? 2 : 0];
		const draft = declarationDraftFor({ tax, session: taxpayerSession, year: '2026', object: record.cells[0], record });
		const result = calculateDeclaration(tax, draft, record);
		return [result.charge, result.subtotal, result.total];
	}))`);
	assert.deepEqual(JSON.parse(values), [[5707000, 5707000, 6189000], [2125000, 2125000, 2225000], [8755000, 8755000, 8755000]]);
	assert.equal(run(`calculateDeclaration('vehiculos', { base: '', rate: 2.5, traffic: 100000, voluntary: 0 }, {})`), null);
});

test('se puede firmar sin agregar personas y el pago se habilita después de presentar', () => {
	const states = run(`(() => {
		const draft = { result: null, signed: false, submitted: false, paid: false, signers: [] };
		const allowed = action => declarationActionAllowed(action, draft);
		const states = [allowed('sign'), allowed('add'), allowed('submit'), allowed('pay')];
		draft.result = { total: 100 };
		states.push(allowed('sign'), allowed('add'), allowed('submit'));
		draft.signed = true;
		states.push(allowed('submit'), allowed('pay'));
		draft.submitted = true;
		states.push(allowed('pay'));
		draft.paid = true;
		states.push(allowed('pay'));
		return states.join(',');
	})()`);
	assert.equal(states, 'false,false,false,false,true,true,false,true,false,true,false');
});
