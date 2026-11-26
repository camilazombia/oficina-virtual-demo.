const declarationRoute = 'declaraciones-generar';
const declarationTitle = 'Generar declaración / Corrección Vigencia actual';
const declarationTaxes = [
	['predial', 'Impuesto predial unificado'],
	['vehiculos', 'Impuesto de vehículos automotores'],
	['publicidad', 'Publicidad exterior'],
];
const declarationYears = () => yearOptions(Number(currentTaxYear()) - 2, Number(currentTaxYear()));
const declarationProperties = [
	{ cells: ['AAA0148KZWF', '050C01253024', 'AK 86 11 40', '—'], blocked: 'Factura pagada' },
	{ cells: ['AAA0212FDCN', '050C01686000', 'KR 68B 12B 67', '—'], blocked: 'Factura vencida' },
	{ cells: ['AAA0012MOYN', '050S40156590', 'CL 18 SUR 29B 61', '—'], base: 600741000, rate: 9.5, interest: 482000, cadastral: '18AS 31 18', quality: 'Usufructuario' },
	{ cells: ['AAA0000XPT0', '050S40156591', 'CL 18 SUR 29B 61 GJ 2', '—'], base: 12736000, rate: 9.5, interest: 0, quality: 'Propietario' },
];
const declarationVehicles = [
	{ cells: ['961QQR', 'Mazda', 'CX-5', '2022', 'Camioneta', 'SUV', 5, 'No', '2.488 cc'], base: 85000000, rate: 2.5, date: '15/03/2022', passengers: 5 },
	{ cells: ['JWT71D', 'Renault', 'Duster', '2021', 'Camioneta', 'SUV', 5, 'No', '1.598 cc'], base: 68000000, rate: 2.5, date: '22/04/2021', passengers: 5 },
	{ cells: ['MCU235', 'Chevrolet', 'Onix', '2023', 'Automóvil', 'Sedán', 4, 'No', '1.000 cc'], base: 52000000, rate: 1.5, date: '11/05/2023', passengers: 5 },
];
const declarationHeaders = {
	predial: ['CHIP', 'Matrícula inmobiliaria', 'Dirección del predio', 'No. contrato de arrendamiento', 'Presentar declaración'],
	vehiculos: ['Placa', 'Marca', 'Línea', 'Modelo', 'Clase', 'Carrocería', 'No. puertas', 'Blindado', 'Cilindraje', 'Acciones'],
	publicidad: ['Número de resolución', 'Tipo de valla', 'Acciones'],
};
const declarationDrafts = new WeakMap();
const declarationViews = new WeakMap();

function declarationRecords(session, tax) {
	if (!session) return [];
	if (tax === 'predial') return declarationProperties;
	if (tax === 'vehiculos') return declarationVehicles;
	if (tax === 'publicidad') return publicityElementsFor(session).slice(0, 4).map(element => ({
		...element, cells: [element.resolution, element.kind === 'tubular' ? 'Valla tubular comercial' : 'Valla vehículos'],
	}));
	return [];
}

function declarationSearchContext(params, session = taxpayerSession) {
	const name = params.get('impuesto')?.toLocaleLowerCase('es');
	const tax = declarationTaxes.find(([id, label]) => name === id || name === label.toLocaleLowerCase('es'))?.[0]
		?? ({ 'impuesto predial': 'predial', 'impuesto de vehículos': 'vehiculos', 'impuestos de vehículos': 'vehiculos',
			'impuesto de publicidad exterior visual': 'publicidad' })[name];
	const year = params.get('vigencia') || '';
	const identifier = tax === 'vehiculos' && session?.requiresObject ? params.get('placa') || params.get('objeto') || '' : '';
	return { session, tax: tax || '', year: declarationYears().includes(year) ? year : '', identifier };
}

function declarationUrl(query, object) {
	const params = new URLSearchParams({ impuesto: query.tax, vigencia: query.year });
	if (query.identifier) params.set('placa', query.identifier);
	if (object) params.set('objeto', object);
	return '?' + params + '#' + declarationRoute;
}

function renderDeclarationConsultation() {
	const query = declarationSearchContext(new URLSearchParams(location.search));
	const year = `<div class="col-12 col-md-4"><label class="form-label" for="declaration-year">Año gravable <span class="text-danger" aria-hidden="true">*</span></label>
		${renderSelect('declaration-year', declarationYears(), { name: 'year', required: true, prompt: 'Selecciona el año gravable', value: query.year })}
		<div class="invalid-feedback">Selecciona el año gravable.</div></div>`;
	return pageTitle(declarationTitle, 'Consulta tus objetos tributarios para generar o corregir una declaración.')
		+ taxpayerQueryForm('declaration-query', { taxes: declarationTaxes, year, taxPrompt: 'Selecciona el impuesto', sectionTitle: 'Consultar información' });
}

function mountDeclarationConsultation() {
	const query = declarationSearchContext(new URLSearchParams(location.search));
	const form = document.getElementById('declaration-query');
	if (!form) return;
	form.elements.tax.value = query.tax;
	const canConsult = (session, tax, object) => declarationRecords(session, tax).some(record => record.cells[0] === object);
	const restored = query.tax && query.year && (query.tax !== 'vehiculos' || !query.session.requiresObject || canConsult(query.session, query.tax, query.identifier)) ? query : undefined;
	mountTaxpayerQuery(form.id, ({ session, tax, identifier }) => declarationRecords(session, tax).filter(record => !identifier || record.cells[0] === identifier),
		(target, records, criteria) => {
			const headers = declarationHeaders[criteria.tax];
			const views = declarationViews.get(criteria.session) || new Map();
			declarationViews.set(criteria.session, views);
			const key = declarationUrl(criteria);
			const view = views.get(key) || {};
			views.set(key, view);
			renderQueryResults(target, {
				id: 'declaration-results', title: 'Resultados de la consulta', standalone: true, headers, view,
				rows: records.map(record => [...record.cells, record]), unsortable: [headers.length - 1],
				formatCell(cell, column) {
					if (column !== headers.length - 1) return icaEscape(cell ?? '—');
					return cell.blocked ? tableBadge(cell.blocked, 'secondary')
						: `<a class="btn btn-primary btn-sm" data-declaration-navigation href="${icaEscape(declarationUrl(criteria, cell.cells[0]))}">Generar declaración</a>`;
				},
			});
		}, {
			canConsult, restored, objectFilters: taxpayerSession.requiresObject ? { vehiculos: taxpayerObjectRules.vehiculos } : {},
			loadingMessage: 'Consultando objetos tributarios…',
		});
}

function declarationDetailContext(params) {
	const query = declarationSearchContext(params);
	const object = params.get('objeto');
	if (!query.session || !object || !query.tax || !query.year) return null;
	if (query.tax === 'vehiculos' && query.session.requiresObject && query.identifier !== object) return null;
	const record = declarationRecords(query.session, query.tax).find(item => item.cells[0] === object);
	return record && !record.blocked ? { ...query, object, record } : null;
}

function declarationDraftFor({ session, tax, year, object, record }) {
	const drafts = declarationDrafts.get(session) || new Map();
	declarationDrafts.set(session, drafts);
	const key = [tax, year, object].join(':');
	if (!drafts.has(key)) drafts.set(key, {
		use: 'initial', base: record.base, rate: record.rate, ownership: 100, exemption: 0, exclusion: 0,
		voluntary: 0, traffic: 100000, disagree: false, result: null, signers: [], signed: false,
		submitted: false, paid: false, feedback: '',
	});
	return drafts.get(key);
}

function calculateDeclaration(tax, draft, record) {
	const numeric = (value, max = Number.MAX_SAFE_INTEGER) => value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= max;
	if (tax === 'predial') {
		if (!numeric(draft.base, 1e12) || !numeric(draft.rate, 1000) || !numeric(draft.ownership, 100)
			|| !numeric(draft.exemption, 100) || !numeric(draft.exclusion, 100) || Number(draft.exemption) + Number(draft.exclusion) > 100) return null;
		const charge = Math.round(draft.base * draft.rate / 1000 * (draft.ownership / 100) * (1 - (Number(draft.exemption) + Number(draft.exclusion)) / 100) / 1000) * 1000;
		const total = charge + record.interest;
		return { charge, subtotal: charge, interest: record.interest, total, voluntary: 0, withVoluntary: total };
	}
	if (tax === 'vehiculos') {
		if (!numeric(draft.base, 1e12) || !numeric(draft.traffic, 1e9) || !numeric(draft.voluntary, 1e9)) return null;
		const charge = Math.round(draft.base * draft.rate / 100);
		const traffic = Math.round(draft.traffic);
		const total = charge + traffic;
		return { charge, subtotal: charge, traffic, interest: 0, total, withVoluntary: total + Math.round(draft.voluntary) };
	}
	if (tax === 'publicidad' && ['initial', 'correction'].includes(draft.use)) {
		return { charge: 8755000, subtotal: 8755000, interest: 0, total: 8755000 };
	}
	return null;
}

function declarationControls(draft, fields) {
	return `<div class="row g-3 mb-3">${fields.map(([key, label, max, step = '1']) => `<div class="col-12 col-md-6 col-xl-4">
		<label class="form-label" for="declaration-${key}">${label}</label>
		<input class="form-control" type="number" id="declaration-${key}" data-declaration-value="${key}" value="${icaEscape(draft[key])}" min="0" max="${max}" step="${step}" required${draft.submitted ? ' readonly' : ''}>
	</div>`).join('')}</div>`;
}

function declarationDisagreement(draft, text) {
	return `<div class="form-check mb-3"><input type="checkbox" class="form-check-input" id="declaration-disagree" data-declaration-value="disagree"${draft.disagree ? ' checked' : ''}${draft.submitted ? ' disabled' : ''}>
		<label class="form-check-label" for="declaration-disagree">${text}</label></div>`;
}

function declarationDetails(context, draft) {
	const { tax, year, record } = context;
	const result = draft.result;
	const money = value => value == null ? null : detailMoney(value);
	const total = ['Total a pagar', money(result?.total), { emphasis: true }];
	if (tax === 'predial') {
		const [chip, registration, address] = record.cells;
		const editable = [['ownership', 'Porcentaje de propiedad (%)', 100, 'any'], ['exemption', 'Porcentaje de exención (%)', 100, 'any'],
			['exclusion', 'Porcentaje de exclusión (%)', 100, 'any'], ['rate', 'Tarifa de liquidación', 1000, 'any'], ['base', 'Base gravable', 1e12]];
		const labels = ['Valor impuesto a cargo', 'Descuento por incremento diferencial', 'Valor del impuesto ajustado actual', 'Sanción',
			'Total saldo a cargo', 'Valor a pagar', 'Descuento por pronto pago', 'Descuento adicional del 1%', 'Intereses'];
		const values = result && [result.charge, 0, result.charge, 0, result.subtotal, result.subtotal, 0, 0, result.interest];
		return taxDetailGroup('Datos generales', [['Año gravable', year], ['Opción de uso', draft.use === 'initial' ? 'Declaración' : 'Corrección'], ['CHIP', chip],
			['Matrícula inmobiliaria', registration], ['Cédula catastral', record.cadastral], ['Dirección', address], ['Calidad de sujeción', record.quality]])
			+ (draft.disagree ? section('Datos de liquidación', declarationControls(draft, editable)) :
				taxDetailGroup('Datos de liquidación', [...editable.map(([key, label]) => [label, key === 'base' ? money(draft[key]) : draft[key]]), ['Destino hacendario', 'Residencial']]))
			+ section('Revisión de la información', declarationDisagreement(draft, 'No estoy de acuerdo con la información registrada.'))
			+ taxDetailGroup('Liquidación privada', [...labels.map((label, index) => [label, money(values?.[index])]),
				total, ['Valor aporte voluntario', money(result?.voluntary)], ['Total con pago voluntario', money(result?.withVoluntary)]]);
	}
	if (tax === 'vehiculos') {
		const [plate, brand, line, model, type, body, , armored, engine] = record.cells;
		const display = result || calculateDeclaration(tax, { ...draft, base: record.base, traffic: 100000, voluntary: 0 }, record);
		return taxDetailGroup('Datos generales', [['Año gravable', year], ['Placa', plate], ['Opción de uso', draft.use === 'initial' ? 'Declaración' : 'Corrección'],
			['ID acto', '—'], ['Fecha de notificación', '—'], ['Descripción del acto', '—'], ['Número de expediente', '—']])
			+ taxDetailGroup('Información del vehículo', [['Objeto contrato', plate], ['Clase', type], ['Carrocería', body], ['Marca', brand],
				['Tipo de vehículo', 'Particular'], ['Modelo', model], ['Blindado', armored], ['Clásico o antiguo', 'No'], ['ID servicio', '—'],
				['Fecha de factura', record.date], ['Watts', 'No aplica']])
			+ section('Revisión de la información', declarationDisagreement(draft, 'No estoy de acuerdo con la información asociada con mi vehículo y/o el cobro por semaforización.')
				+ declarationControls(draft, [...(draft.disagree ? [['base', 'Avalúo informado', 1e12], ['traffic', 'Valor semaforización informado', 1e9]] : []),
					['voluntary', 'Valor del aporte voluntario', 1e9]]))
			+ taxDetailGroup('Liquidación del impuesto', [['Línea', line], ['Capacidad de toneladas', 0], ['Cilindraje', engine],
				['Capacidad de pasajeros', record.passengers], ['Avalúo actual', money(draft.base)], ['Tarifa actual', `${String(draft.rate).replace('.', ',')} %`],
				['Valor impuesto a cargo', money(display.charge)], ['Sanción', money(0)], ['Valor a pagar', money(display.subtotal)],
				['Valor semaforización', money(display.traffic)], ['Descuento por combustible', money(0)], ['Descuento adicional', money(0)],
				['Descuento por pronto pago', money(0)], ['Intereses', money(0)], ['Total a pagar', money(display.total), { emphasis: true }],
				['Total con pago voluntario', money(result?.withVoluntary)]]);
	}
	const use = draft.use === 'initial' ? '01 - Declaración inicial' : 'Corrección';
	return taxDetailGroup('Datos generales', [['Año gravable', year], ['Opciones de uso', use], ['Número de resolución', record.resolution], ['Fecha de notificación', record.notifiedOn]])
		+ taxDetailGroup('Información de la valla', [['Lugar de instalación', record.kind === 'vehicle' ? 'Vehículo' : record.site === 'Predio privado' ? 'Predio' : record.resolution === 'RES202101843' ? 'Predio' : record.site],
			['Orientación de la valla', record.kind === 'vehicle' ? record.orientation : record.orientation || 'Horizontal'],
			['Tamaño de la valla', record.area > 8 && record.area <= 24 ? 'Vallas de más de 8 m² hasta 24 m²' : null]])
		+ taxDetailGroup('Liquidación del impuesto', [['Impuesto a cargo', money(result?.charge ?? 8755000)], ['Valor sanción', money(0)],
			['Valor a pagar', money(result?.subtotal ?? 0)], ['Interés de mora', money(0)], ['Total a pagar', money(result?.total ?? 8755000), { emphasis: true }]]);
}

function renderUnifiedDeclaration(context) {
	const { tax, object, year } = context;
	const draft = declarationDraftFor(context);
	const identity = getTaxpayerIdentity();
	const title = { predial: 'Declaración Predial', vehiculos: 'Declaración del impuesto de vehículos', publicidad: 'Declaración de Publicidad Exterior' }[tax];
	const detail = tax === 'vehiculos' ? section('Información del impuesto', '<p>El impuesto sobre vehículos automotores grava la propiedad o posesión de los vehículos matriculados en Bogotá.</p><p class="mb-0">Los propietarios y poseedores lo deben declarar y pagar una vez al año. La información que se presenta proviene de la Secretaría Distrital de Movilidad de Bogotá. Si encuentra alguna inconsistencia, verifique directamente con esta entidad, a través del Consorcio Circulemos Digital.</p>') : '';
	const signers = [[identity.fullName || 'Información del declarante', identity.documentType, identity.documentNumber, '—'], ...draft.signers];
	const enabled = (action) => declarationActionAllowed(action, draft);
	const button = (action, label, icon, variant = 'primary') => `<button class="btn btn-${variant} flex-shrink-0" type="button" data-declaration-action="${action}"${enabled(action) ? '' : ' disabled'}><i class="bi bi-${icon} me-2" aria-hidden="true"></i>${label}</button>`;
	const tableMarkup = table(['Nombre', 'Tipo de identificación', 'No. identificación', 'No. tarjeta profesional'],
		signers.map(row => row.map(value => icaEscape(value || '—'))), { label: 'Firmantes de la declaración', paginationManaged: true });
	const actions = `<div class="d-flex flex-nowrap gap-2 overflow-auto pb-2">${button('add', 'Agregar firmante', 'plus-lg', 'outline-primary')}${button('sign', 'Firmar declaración', 'pen', 'outline-primary')}</div>`;
	const use = section('Tipo de trámite', `<div class="row"><div class="col-12 col-md-4"><label class="form-label" for="declaration-use">Opción de uso</label>
		<select class="form-select" id="declaration-use" data-declaration-value="use"${draft.submitted ? ' disabled' : ''}>
		<option value="initial"${draft.use === 'initial' ? ' selected' : ''}>${tax === 'publicidad' ? '01 - ' : ''}Declaración inicial</option>
		<option value="correction"${draft.use === 'correction' ? ' selected' : ''}>Corrección</option></select></div></div>`);
	const back = context.backToDashboard ? '?#inicio' : declarationUrl(context);
	return `<div data-unified-declaration><a class="btn btn-outline-secondary btn-sm mb-3" data-declaration-navigation href="${icaEscape(back)}"><i class="bi bi-arrow-left me-2" aria-hidden="true"></i>${context.backToDashboard ? 'Volver a Inicio' : 'Volver a la consulta'}</a>`
		+ pageTitle(title, `${icaEscape(object)} · Año gravable ${icaEscape(year)}`)
		+ detail + taxDetailGroup('Información del contribuyente', [['Tipo de documento', identity.documentType], ['Número de documento', identity.documentNumber], ['Nombre o razón social', identity.fullName]])
		+ use + declarationDetails(context, draft)
		+ `<div class="mb-4">${button('calculate', 'Calcular', 'calculator')}</div>`
		+ section('Firmas', tableMarkup + `<p class="small text-secondary mt-3 mb-2">${draft.signed ? 'Declaración firmada' : 'Puedes firmar con los firmantes existentes o agregar otro después del cálculo.'}</p>` + actions)
		+ `<div class="d-flex flex-nowrap gap-2 overflow-auto pb-2 mb-3">${button('submit', 'Presentar declaración', 'file-earmark-text')}${button('pay', 'Pagar en línea', 'currency-dollar')}</div>
			<div data-declaration-feedback aria-live="polite">${draft.feedback}</div></div>`;
}

function declarationActionAllowed(action, draft) {
	if (action === 'pay') return draft.submitted && !draft.paid;
	if (draft.submitted) return false;
	if (action === 'calculate') return true;
	if (action === 'submit') return draft.signed;
	return Boolean(draft.result && !draft.signed);
}

function declarationNotice(draft, message, error = false) {
	draft.feedback = statusAlert(error ? 'danger' : 'success', message, error ? 'alert' : 'status');
}

function refreshUnifiedDeclaration() {
	const container = document.querySelector('[data-unified-declaration]');
	const context = declarationDetailContext(new URLSearchParams(location.search));
	if (!container || !context) return;
	container.outerHTML = renderUnifiedDeclaration({ ...context, backToDashboard: new URLSearchParams(location.search).get('origen') === 'inicio' });
	const feedback = document.querySelector('[data-declaration-feedback]');
	if (feedback?.firstElementChild) feedback.scrollIntoView({ block: 'nearest' });
}

function addDeclarationSigner(draft, trigger) {
	const fields = [['name', 'Nombre'], ['document', 'No. identificación'], ['card', 'No. tarjeta profesional']];
	const body = `<form id="declaration-signer-form" class="row g-3">
		<div class="col-12"><label class="form-label" for="signer-type">Tipo de identificación</label>
		${renderSelect('signer-type', ['CC', 'CE', 'NIT', 'PP'], { name: 'type', required: true, prompt: 'Selecciona el tipo' })}</div>
		${fields.map(([name, label]) => `<div class="col-12"><label class="form-label" for="signer-${name}">${label}</label>
		<input class="form-control" id="signer-${name}" name="${name}" maxlength="100"${name === 'card' ? '' : ' required'}></div>`).join('')}
		<div class="col-12 text-danger" data-signer-error role="alert"></div></form>`;
	const { modal, instance } = showDetailModal({ title: 'Agregar firmante', body, trigger, actions: '<button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal">Cancelar</button><button class="btn btn-primary" type="submit" form="declaration-signer-form">Agregar firmante</button>' });
	modal.querySelector('form').addEventListener('submit', event => {
		event.preventDefault();
		if (!trigger.isConnected || !declarationActionAllowed('add', draft)) return;
		const data = new FormData(event.target);
		const signer = ['name', 'type', 'document', 'card'].map(key => String(data.get(key)).trim());
		const identity = getTaxpayerIdentity();
		const duplicate = [[identity.fullName, identity.documentType, identity.documentNumber], ...draft.signers].some(row => row[1] === signer[1] && row[2] === signer[2]);
		if (!signer[0] || !/^[a-z\d-]+$/i.test(signer[2]) || duplicate) {
			modal.querySelector('[data-signer-error]').textContent = duplicate ? 'Esta persona ya está registrada como firmante.' : 'Ingresa el nombre y un número de identificación válido.';
			return;
		}
		draft.signers.push(signer);
		declarationNotice(draft, 'El firmante se agregó correctamente.');
		modal.addEventListener('hidden.bs.modal', refreshUnifiedDeclaration, { once: true });
		instance.hide();
	});
}

document.addEventListener('input', event => {
	const field = event.target.closest('[data-declaration-value]');
	if (!field) return;
	const context = declarationDetailContext(new URLSearchParams(location.search));
	if (!context) return;
	const draft = declarationDraftFor(context);
	if (draft.submitted) return;
	const key = field.dataset.declarationValue;
	if (key === 'disagree') {
		draft.disagree = field.checked;
		if (!draft.disagree) Object.assign(draft, { base: context.record.base, rate: context.record.rate, ownership: 100, exemption: 0, exclusion: 0, traffic: 100000 });
	} else draft[key] = field.value;
	const hadResult = draft.result;
	draft.result = null;
	draft.signed = false;
	if (hadResult) draft.feedback = statusAlert('info', 'Los datos cambiaron. Calcula nuevamente la declaración para continuar.');
	if (field.type === 'number') {
		const valid = Boolean(calculateDeclaration(context.tax, draft, context.record)) && [...document.querySelectorAll('[data-declaration-value][type="number"]')].every(input => input.validity.valid);
		document.querySelectorAll('[data-declaration-action]').forEach(button => {
			const action = button.dataset.declarationAction;
			button.disabled = action === 'calculate' ? !valid : !declarationActionAllowed(action, draft);
		});
		document.querySelector('[data-declaration-feedback]').innerHTML = draft.feedback;
	} else refreshUnifiedDeclaration();
});

document.addEventListener('click', event => {
	const navigation = event.target.closest('[data-declaration-navigation]');
	if (navigation && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
		event.preventDefault();
		history.pushState(null, '', navigation.href);
		renderRoute();
		document.getElementById('pageContent').scrollIntoView({ block: 'start' });
		return;
	}
	const trigger = event.target.closest('[data-declaration-action]');
	if (!trigger || trigger.disabled) return;
	const context = declarationDetailContext(new URLSearchParams(location.search));
	if (!context) return;
	const draft = declarationDraftFor(context);
	const action = trigger.dataset.declarationAction;
	if (!declarationActionAllowed(action, draft)) return;
	const scenario = new URLSearchParams(location.search).get('demo');
	if (action === 'add') return addDeclarationSigner(draft, trigger);
	if (action === 'calculate') {
		const valid = [...document.querySelectorAll('[data-declaration-value][type="number"]')].every(input => input.reportValidity());
		draft.result = valid && scenario !== 'declaracion-error-calculo' ? calculateDeclaration(context.tax, draft, context.record) : null;
		draft.signed = false;
		declarationNotice(draft, draft.result ? 'La declaración se calculó correctamente.' : 'No fue posible calcular la declaración. Intente nuevamente.', !draft.result);
	} else if (action === 'sign') {
		draft.signed = true;
		declarationNotice(draft, 'La declaración se firmó correctamente.');
	} else if (action === 'submit' || action === 'pay') {
		const payment = action === 'pay';
		predialMessage(payment ? 'Pagar en línea' : 'Presentar declaración', payment
			? `Confirma el pago simulado de ${detailMoney(draft.result.withVoluntary ?? draft.result.total)}. No se realizará ningún cobro.`
			: 'Confirma la presentación de la declaración en el prototipo.', () => {
			if (!trigger.isConnected || !declarationActionAllowed(action, draft)) return;
			const error = scenario === (payment ? 'declaracion-error-pago' : 'declaracion-error-presentacion');
			if (!error) draft[payment ? 'paid' : 'submitted'] = true;
			declarationNotice(draft, payment
				? error ? 'No fue posible completar el pago. Intente nuevamente.' : 'El pago se realizó correctamente.'
				: error ? 'No fue posible presentar la declaración. Intente nuevamente.' : 'La declaración se presentó correctamente.', error);
			refreshUnifiedDeclaration();
		});
		return;
	}
	refreshUnifiedDeclaration();
});
