const taxpayerSessions = {
	Contribuyente: { id: 'demo-contribuyente' },
	'Gran contribuyente': { id: 'demo-gran-contribuyente', requiresObject: true },
};
let taxpayerSession;

const taxpayerTaxes = [
	['predial', 'Impuesto predial unificado'],
	['vehiculos', 'Impuesto de vehículos automotores'],
];
const taxpayerHomeObjects = {
	predial: 'AAA0012MOYN',
	vehiculos: ['JWT71D', 'MCU235'],
	delineacion: 'CDU1121621',
};
const taxpayerObjectRules = {
	predial: { label: 'CHIP', subject: 'el chip del predio', invalid: 'Ingresa un CHIP válido.', pattern: '[A-Z]{3}[0-9]{4}[A-Z0-9]{4}' },
	vehiculos: { label: 'Placa', subject: 'la placa del vehículo', invalid: 'Ingresa una placa válida.', pattern: '[A-Z]{3}(?:[0-9]{3}|[0-9]{2}[A-Z]?)' },
	delineacion: { label: 'CDU', subject: 'el CDU de la obra', invalid: 'Ingresa un CDU válido.', pattern: 'CDU[0-9]{7}' },
};
const taxpayerObjects = {
	predial: new Map([
		[taxpayerHomeObjects.predial, ['demo-contribuyente', 'demo-gran-contribuyente']],
		['AAA0000XPT0', ['demo-contribuyente', 'demo-gran-contribuyente']],
		['AAA0000XRYX', ['demo-contribuyente']],
		['AAA0001ASYN', ['demo-gran-contribuyente']],
	]),
	vehiculos: new Map([
		['BMM36', ['demo-contribuyente']],
		[taxpayerHomeObjects.vehiculos[0], ['demo-contribuyente', 'demo-gran-contribuyente']],
		[taxpayerHomeObjects.vehiculos[1], ['demo-contribuyente']],
		['FNX843', ['demo-contribuyente', 'demo-gran-contribuyente']],
		['DXM579', ['demo-contribuyente']],
		['DZS117', ['demo-gran-contribuyente']],
	]),
	delineacion: new Map([
		[taxpayerHomeObjects.delineacion, ['demo-contribuyente', 'demo-gran-contribuyente']],
		['CDU1121703', ['demo-contribuyente']],
	]),
};
const unavailableTaxpayerObject = 'No encontramos un objeto disponible para consulta con la identificación ingresada. Verifica la información e inténtalo nuevamente.';

function taxpayerCanConsult(session, tax, identifier) {
	return Boolean(session && taxpayerObjects[tax]?.get(identifier)?.includes(session.id));
}

function matchesTaxpayerQuery(query, tax, identifier) {
	return (query.tax === tax || query.tax === 'todos') && (!query.identifier || query.identifier === identifier)
		&& taxpayerCanConsult(query.session, tax, identifier);
}

function taxpayerQueryForm(id, { taxes = taxpayerTaxes, tax, year = '', extra = '', taxPrompt = '', resetText, initialStatus = '', buttonText = 'Consultar', sectionTitle } = {}) {
	const taxControl = tax
		? `<input type="hidden" name="tax" value="${tax}">`
		: `<div class="col-12 col-md-4"><label class="form-label" for="${id}-tax">Impuesto${taxPrompt ? ' <span class="text-danger" aria-hidden="true">*</span>' : ''}</label>${renderSelect(`${id}-tax`, taxes, { value: taxPrompt ? '' : taxes[0][0], prompt: taxPrompt, required: true, name: 'tax' })}</div>`;
	const filters = `<form id="${id}" novalidate>
		<div class="row g-3 mb-3">${taxControl}${year}${extra}
			<div data-taxpayer-field class="col-12 col-md-4 d-none">
				<label class="form-label" for="${id}-object"><span data-taxpayer-label></span> <span class="text-danger" aria-hidden="true">*</span></label>
				<input class="form-control" id="${id}-object" name="object" autocomplete="off" aria-describedby="${id}-help ${id}-error" disabled>
				<div id="${id}-error" class="invalid-feedback"></div>
				<div id="${id}-help" class="form-text"></div>
			</div>
		</div>
		${queryActions(buttonText, resetText)}
	</form><div data-taxpayer-status class="mt-3" aria-live="polite" aria-atomic="true">${initialStatus}</div>`;
	return (sectionTitle ? section(sectionTitle, filters) : filters) + '<div data-taxpayer-results></div>';
}

function mountTaxpayerQuery(id, findRows, renderResults, { initial = false, alternateField, yearsForTax, initialStatus = '', loadingMessage, pendingIntegration, restored, objectFilters, canConsult = taxpayerCanConsult, emptyMessage, errorMessage } = {}) {
	const form = document.getElementById(id);
	if (!form) return;
	const session = taxpayerSession;
	const tax = form.elements.tax;
	const object = form.elements.object;
	const field = form.querySelector('[data-taxpayer-field]');
	const feedback = field.querySelector('.invalid-feedback');
	const button = form.querySelector('[type="submit"]');
	const status = form.nextElementSibling;
	const results = status.nextElementSibling ?? status.parentElement.nextElementSibling;
	let rule;
	let pending = 0;
	let simulateError = new URLSearchParams(window.location.search).get('demo') === 'error';

	function validate() {
		if (alternateField) {
			const input = form.elements[alternateField.name];
			const needed = alternateField.taxes.includes(tax.value);
			input.required = needed;
			input.disabled = !needed || !form.elements.year.value || Boolean(alternateField.optionsForYear && input.options.length === 1);
			input.parentElement.classList.toggle('d-none', !needed);
		}
		const identifier = object.value.trim().toUpperCase();
		const invalid = rule && (identifier || !rule.optional) && !new RegExp(`^(?:${rule.pattern})$`).test(identifier);
		object.setCustomValidity(invalid ? (identifier ? rule.invalid : object.placeholder) : '');
		feedback.textContent = object.validationMessage;
		button.disabled = Boolean(pending) || !form.checkValidity();
	}

	function clearResults() {
		window.clearTimeout(pending);
		pending = 0;
		status.innerHTML = initialStatus;
		results.replaceChildren();
	}

	function syncPeriod() {
		if (!alternateField) return;
		const input = form.elements[alternateField.name];
		if (alternateField.optionsForYear) {
			const periods = alternateField.optionsForYear(form.elements.year.value);
			input.options.length = 1;
			for (const [value, label] of periods) input.add(new Option(label, value));
		}
		input.value = '';
	}

	function syncFields() {
		clearResults();
		form.classList.remove('was-validated');
		object.classList.remove('is-invalid');
		object.removeAttribute('aria-invalid');
		rule = objectFilters ? objectFilters[tax.value] : session.requiresObject ? taxpayerObjectRules[tax.value] : undefined;
		field.classList.toggle('d-none', !rule);
		object.value = '';
		object.required = Boolean(rule && !rule.optional);
		object.disabled = !rule;
		const requiredMark = field.querySelector('[aria-hidden="true"]');
		if (requiredMark) requiredMark.hidden = !object.required;
		if (yearsForTax) {
			const year = form.elements.year;
			const years = yearsForTax(tax.value);
			year.innerHTML = '<option value="" selected disabled>Selecciona el año</option>' + years.map(value => `<option value="${value}">${value}</option>`).join('');
			year.disabled = !years.length;
		}
		if (rule) {
			field.querySelector('[data-taxpayer-label]').textContent = rule.label;
			object.placeholder = `Ingresa ${rule.subject}.`;
			field.querySelector('.form-text').textContent = `Ingresa ${rule.subject} que deseas consultar.`;
		}
		syncPeriod();
		validate();
	}

	function submit() {
		object.value = object.value.trim().toUpperCase();
		validate();
		if (!form.checkValidity()) {
			form.classList.add('was-validated');
			form.querySelector(':invalid')?.focus();
			return;
		}
		clearResults();
		const query = {
			session, tax: tax.value, identifier: object.value,
			year: form.elements.year?.value || '', period: form.elements.period?.value || '',
		};
		status.innerHTML = loadingState(loadingMessage || 'Consultando información…');
		pending = window.setTimeout(() => {
			pending = 0;
			if (!form.isConnected || taxpayerSession !== session) return;
			validate();
			try {
				if (simulateError) {
					simulateError = false;
					throw new Error('Consulta simulada');
				}
				if (query.identifier && !canConsult(session, query.tax, query.identifier)) {
					status.innerHTML = emptyMessage ? emptyState(emptyMessage) : statusAlert('warning', unavailableTaxpayerObject);
					return;
				}
				const integrationMessage = typeof pendingIntegration === 'function' ? pendingIntegration(query) : pendingIntegration;
				if (integrationMessage) {
					status.innerHTML = statusAlert('info', integrationMessage);
					return;
				}
				const rows = findRows(query);
				status.innerHTML = rows.length
					? '<span class="visually-hidden">Resultados disponibles.</span>'
					: emptyState(emptyMessage || '<strong class="d-block">No se encontraron resultados</strong>Verifica la información ingresada e inténtalo nuevamente.');
				if (rows.length) renderResults(results, rows, query);
			} catch {
				results.replaceChildren();
				status.innerHTML = statusAlert('danger', errorMessage || 'No fue posible realizar la consulta. Inténtalo nuevamente.', 'alert');
			}
		}, 180);
		validate();
	}

	form.addEventListener('submit', event => {
		event.preventDefault();
		submit();
	});
	form.addEventListener('input', event => {
		if (event.target === object) {
			const start = object.selectionStart;
			const end = object.selectionEnd;
			object.value = object.value.toUpperCase();
			object.setSelectionRange(start, end);
		}
		if (event.target === tax) syncFields();
		else {
			if (alternateField && event.target === form.elements.year) syncPeriod();
			clearResults();
			validate();
			if (object.classList.contains('is-invalid') && object.validity.valid) {
				object.classList.remove('is-invalid');
				object.removeAttribute('aria-invalid');
			}
		}
	});
	object.addEventListener('blur', () => {
		object.value = object.value.trim();
		validate();
		object.classList.toggle('is-invalid', !object.validity.valid);
		if (object.validity.valid) object.removeAttribute('aria-invalid');
		else object.setAttribute('aria-invalid', 'true');
	});
	form.addEventListener('reset', () => {
		clearResults();
		window.setTimeout(syncFields, 0);
	});
	if (restored) tax.value = restored.tax;
	syncFields();
	if (alternateField?.initialValue) {
		form.elements[alternateField.name].value = alternateField.initialValue;
		validate();
	}
	if (restored) {
		form.elements.year.value = restored.year;
		object.value = restored.identifier;
		renderResults(results, findRows(restored), restored);
		status.innerHTML = '<span class="visually-hidden">Resultados disponibles.</span>';
		validate();
	} else if (initial && !rule) submit();
}

const taxpayerPredialRows = [
	['AAA0012MOYN', '050S40156590', 'CL 18 SUR 29B 61', '', '<a class="btn btn-outline-primary btn-sm px-3 text-nowrap" href="#predio-AAA0012MOYN">Ver detalle</a>'],
	...paymentHistoryExamples.predial.rows.slice(0, 4).map(row => [...row, '', '']),
];

function myVehicleRows() {
	return myVehicles.map(vehicle => [
		vehicle.plate, vehicle.brand, vehicle.line, vehicle.year, vehicle.className, vehicle.body, vehicle.doors, vehicle.armored, vehicle.engine,
		linkTo(`vehiculo-${vehicle.plate}`, '<i class="bi bi-eye me-1" aria-hidden="true"></i>Ver', 'btn btn-outline-primary btn-sm text-nowrap'),
	]);
}

const taxpayerPropertyHeaders = ['CHIP', 'Matrícula inmobiliaria', 'Dirección del predio', 'No. contrato arrendamiento', 'Acciones'];

function taxpayerPropertyRows(tax, tab = '') {
	const vehiclesQuery = tax === 'vehiculos';
	const detail = object => linkToTaxDetail((vehiclesQuery ? 'vehiculo-' : 'predio-') + object, tab);
	return vehiclesQuery
		? taxVehicleCatalog().map(vehicle => [vehicle.plate, vehicle.brand, vehicle.line, vehicle.year, vehicle.className,
			vehicle.body, vehicle.doors, vehicle.armored, vehicle.engine, detail(vehicle.plate)])
		: taxpayerPredialRows.map(row => [...row.slice(0, 4), detail(row[0])]);
}

function mountTaxpayerPropertyQuery(id, tax) {
	const vehiclesQuery = tax === 'vehiculos';
	const key = id === 'my-object' ? (vehiclesQuery ? 'my-vehicles' : 'my-properties') : (vehiclesQuery ? 'vehicles' : 'properties');
	const headers = vehiclesQuery ? [...vehicleHeaders, 'Acciones'] : taxpayerPropertyHeaders;
	const tab = id === 'my-object' ? '' : vehiclesQuery ? 'vehicles' : 'properties';
	mountTaxpayerQuery(id, query => taxpayerPropertyRows(tax, tab)
		.filter(([object]) => matchesTaxpayerQuery(query, tax, object)), (target, rows) => {
		target.innerHTML = registeredTaxTable(key, vehiclesQuery ? 'Mis vehículos' : 'Mis predios', headers, rows);
		filterRegisteredTaxes(key, true);
	}, { initial: true });
}

const taxpayerDocumentRoutes = {
	'declaraciones-presentadas': { title: 'Declaraciones presentadas', description: 'Consulta el historial de declaraciones presentadas.', kind: 'declaration' },
	'documentos-pago': { title: 'Certificaciones de pago', description: 'Consulta los pagos realizados y genera las certificaciones correspondientes.', kind: 'payment', requiredYear: true },
	'documentos-multipagos': { title: 'Certificaciones multiplago', description: 'Consulta y genera las certificaciones correspondientes a los pagos realizados mediante ROP multiplago.', kind: 'payment', requiredYear: true },
	'pagos-facturas': { title: 'Descarga de factura', description: 'Consulta, descarga y paga tus facturas de impuestos distritales.', kind: 'invoice' },
	'pagos-reexpedicion': { title: 'Reexpedición de factura', description: 'Consulta, descarga y paga tus facturas reexpedidas de impuestos distritales.', kind: 'invoice', reissue: true },
	'pagos-recibos': { title: 'Recibo oficial de pago (ROP)', description: 'Consulta los recibos individuales por impuesto y año gravable.', kind: 'receipt', requiredYear: true },
	'pagos-multipago': { kind: 'multipay' },
};

const taxpayerDocumentExamples = [
	{ tax: 'predial', object: taxpayerHomeObjects.predial, year: '2026', date: '21/04/2026', reference: '100000047309', total: '$ 571.000', registration: '050S40156590', description: 'CL 18 SUR 29B 61', multipayment: true },
	{ tax: 'predial', object: 'AAA0000XRYX', year: '2025', date: '19/05/2025', reference: '100000047562', total: '$ 63.000', registration: '050S00712203', description: 'CL 13 SUR 6 34 ESTE AP 802' },
	{ tax: 'vehiculos', object: taxpayerHomeObjects.vehiculos[0], year: '2026', date: '14/06/2026', reference: '100000047428', total: '$ 2.596.000', brand: 'Ducati' },
	{ tax: 'vehiculos', object: 'BMM36', year: '2025', date: '10/06/2025', reference: '100000047556', total: '$ 95.000', brand: 'Auteco Bajaj' },
];

function renderTaxpayerDocuments(route) {
	const config = taxpayerDocumentRoutes[route];
	if (config.kind === 'invoice') return renderInvoiceDownload(config);
	if (config.kind === 'multipay') return renderMultipay();
	const payment = config.kind === 'payment';
	const multi = route === 'documentos-multipagos';
	const id = 'taxpayer-documents';
	const year = `<div class="col-12 col-md-4"><label class="form-label" for="${id}-year">${multi ? 'Año de pago' : payment ? 'Año de presentación del pago' : 'Año gravable'}${config.requiredYear ? ' <span class="text-danger" aria-hidden="true">*</span>' : ''}</label>
		${renderSelect(`${id}-year`, yearOptions(payment && !multi ? 2019 : 2024, 2026), { prompt: config.requiredYear ? 'Selecciona el año' : 'Todos los años', required: config.requiredYear, name: 'year', describedBy: payment ? `${id}-year-help` : undefined })}
		<div class="invalid-feedback">Selecciona un año.</div>
		${payment ? `<div class="form-text" id="${id}-year-help">Selecciona el año en el que realizaste el pago${multi ? ' del ROP multiplago' : ''}.</div>` : ''}</div>`;
	let extra = '';
	if (route === 'documentos-pago') {
		const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
			.map((month, index) => [String(index + 1).padStart(2, '0'), month]);
		extra = `<div class="col-12 col-md-4 d-none"><label class="form-label" for="${id}-period">Periodo <span class="text-danger" aria-hidden="true">*</span></label>
			${renderSelect(`${id}-period`, months, { prompt: 'Selecciona el mes', required: true, name: 'period', describedBy: `${id}-period-error` })}
			<div class="invalid-feedback" id="${id}-period-error">Selecciona el mes.</div></div>`;
	}
	const taxes = route === 'documentos-pago'
		? [...taxpayerTaxes, ['sobretasa', 'Sobretasa a la gasolina'], ['delineacion', 'Impuesto de delineación urbana'], ['publicidad', 'Impuesto de publicidad exterior visual'], ['ica', 'Impuesto de industria y comercio (ICA)']]
		: multi ? taxpayerTaxes : [...taxpayerTaxes, ['ica', 'ICA']];
	if (route === 'declaraciones-presentadas' && !taxpayerSession.requiresObject) taxes.unshift(['todos', 'Todos los impuestos']);
	return pageTitle(config.title, config.description) + section('Consultar información', taxpayerQueryForm(id, {
		taxes, year, extra, taxPrompt: payment ? 'Selecciona el impuesto' : '', resetText: payment ? 'Limpiar' : undefined,
		initialStatus: multi ? multiplagoInitialState() : '',
	}));
}

function mountTaxpayerDocuments(route) {
	const config = taxpayerDocumentRoutes[route];
	if (config.kind === 'invoice') return mountInvoiceDownload(config);
	if (config.kind === 'multipay') return mountMultipay();
	if (route === 'documentos-multipagos') {
		mountTaxpayerQuery('taxpayer-documents', () => [], () => {}, {
			initialStatus: multiplagoInitialState(),
			loadingMessage: 'Consultando pagos multiplago…',
			pendingIntegration: 'La consulta de pagos multiplago está pendiente de integración.',
		});
		return;
	}
	mountTaxpayerQuery('taxpayer-documents', query => (route === 'documentos-pago' ? paymentCertificationExamples : taxpayerDocumentExamples).filter(record =>
		matchesTaxpayerQuery(query, record.tax, record.object) &&
		(!query.year || query.year === record.year) && (!query.period || query.period === 'Anual') &&
		(config.kind !== 'receipt' || Boolean(record.multipayment) === Boolean(config.multipayment))
	), (target, records, query) => {
		let rows;
		let headers;
		if (config.kind === 'payment') {
			renderPaymentCertificationResults(target, records, query.tax);
			return;
		} else if (config.kind === 'declaration') {
			headers = ['Impuesto', { predial: 'CHIP', vehiculos: 'Placa' }[query.tax] || 'Objeto', 'Año gravable', 'Periodo', 'Fecha de presentación', 'Estado'];
			rows = records.map(record => [taxpayerTaxes.find(([tax]) => tax === record.tax)[1], record.object, record.year, 'Anual', record.date, tableBadge('Presentada', 'success')]);
		} else {
			headers = [query.tax === 'predial' ? 'CHIP' : 'Placa', 'Año gravable', 'Referencia', 'Valor'];
			rows = records.map(record => [record.object, record.year, record.reference, record.total]);
		}
		renderQueryResults(target, { id: 'taxpayer-documents-table', title: 'Resultados', headers, rows, formatCell: cell => cell });
	}, route === 'documentos-pago' ? {
		alternateField: { name: 'period', taxes: ['sobretasa', 'ica'] },
		yearsForTax: tax => tax ? yearOptions(2019, 2026) : [],
		pendingIntegration: query => !['predial', 'vehiculos'].includes(query.tax) ? 'La consulta de certificaciones para este impuesto está pendiente de integración.' : '',
	} : {});
}

function mountTaxpayerPage(route) {
	if (!taxpayerSession) return;
	if (Object.hasOwn(taxpayerDocumentRoutes, route)) mountTaxpayerDocuments(route);
	if (route === 'pagos-relacion') mountTaxpayerPaymentHistory();
	if (route === 'impuestos-predial') mountTaxpayerPropertyQuery('my-object', 'predial');
	if (route === 'impuestos-vehiculos') mountTaxpayerPropertyQuery('my-object', 'vehiculos');
	if (route === 'obligaciones-pendientes') mountPendingObligations();
	if (route === 'pagos-facilidades') mountTaxpayerObligations(true);
}
