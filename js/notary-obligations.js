const notaryRoute = {
	id: 'consulta-notarias',
	role: 'Notarías y sucesiones',
	label: 'Consulta de obligaciones tributarias',
};

const notaryTaxes = {
	vehiculos: { name: 'sobre vehículos automotores', columns: ['Placa', 'Modelo', 'Marca', 'Línea'] },
	predial: { name: 'predial', columns: ['CHIP', 'Matrícula inmobiliaria', 'Dirección'] },
	delineacion: { name: 'de delineación urbana', columns: ['CDU', 'CHIP', 'Dirección'] },
	ica: { name: 'Impuesto de industria y comercio (ICA)', pending: true },
	reteica: { name: 'Retención de ICA', pending: true },
	sobretasa: { name: 'Sobretasa a la gasolina', pending: true },
	publicidad: { name: 'Impuesto de publicidad exterior visual', pending: true },
};

function notaryTaxLabel(tax) {
	return tax.pending ? tax.name : `Impuesto ${tax.name}`;
}

const notaryPlateMessages = {
	'plate-not-registered': { tone: 'warning', text: 'La Placa consultada no se encuentra registrada en Bogotá' },
	'plate-no-obligations': { tone: 'info', text: 'La Placa no cuenta con obligaciones pendientes' },
};

function renderNotaryModule(root, demoState) {
	const modes = { sujeto: 'Por sujeto', objeto: 'Por objeto' };
	const required = '<span class="text-danger" aria-hidden="true">*</span>';
	const field = (id, name, control, error, help = '') => `<div class="col-12 col-md-6 col-xl-${id === 'object' ? 6 : 4}">
		<label class="form-label" for="notary-${id}">${name} ${required}</label>${control}
		<div class="invalid-feedback" id="notary-${id}-error">${error}</div>
		${help ? `<div class="form-text" id="notary-${id}-help">${help}</div>` : ''}
	</div>`;
	const select = (id, placeholder, options) => `<select class="form-select" required id="notary-${id}" name="${id}" aria-describedby="notary-${id}-error"><option value="">${placeholder}</option>${options}</select>`;
	const input = (id, placeholder, help = '') => `<input type="text" class="form-control" required id="notary-${id}" name="identifier" placeholder="${placeholder}" autocomplete="off" aria-describedby="notary-${id}-error ${help}">`;
	const tabs = Object.entries(modes).map(([mode, label], index) => `<li class="nav-item" role="presentation">
		<button class="nav-link ${index ? '' : 'active'}" id="notary-tab-${mode}" type="button" role="tab" data-bs-toggle="tab"
			data-bs-target="#notary-panel-${mode}" aria-controls="notary-panel-${mode}" aria-selected="${!index}">${label}</button>
	</li>`).join('');
	const panels = Object.keys(modes).map((mode, index) => `<section class="tab-pane ${index ? '' : 'show active'}" id="notary-panel-${mode}" role="tabpanel" aria-labelledby="notary-tab-${mode}" tabindex="0">
		<h2 class="h6 fw-semibold">Consulta por ${mode}</h2>
		${index ? '<p class="text-secondary">Ingresa la identificación del objeto para consultar sus obligaciones tributarias.</p>' : ''}
		<form novalidate aria-label="Consulta por ${mode}">
			<div class="row g-3">
			${index ? field('object', 'CHIP, matrícula o ID del objeto', input('object', 'Ingresa la identificación del objeto.', 'notary-object-help'), 'Ingresa la identificación del objeto.', 'Puedes ingresar el CHIP, la matrícula o el ID que aparece en la parte superior izquierda del reporte.') :
				field('type', 'Tipo de documento', select('type', 'Selecciona el tipo de documento', identificationOptions()), 'Selecciona el tipo de documento.') +
				field('number', 'Número de documento', input('number', 'Ingresa el número de documento.'), 'Ingresa el número de documento.') +
				field('tax', 'Impuesto', select('tax', 'Selecciona el impuesto', Object.entries(notaryTaxes).map(([key, tax]) => `<option value="${key}">${notaryTaxLabel(tax)}</option>`).join('')), 'Selecciona el impuesto.')}
			</div>
			<div class="d-flex flex-wrap justify-content-end gap-2 mt-3">
				<button class="btn btn-outline-secondary" type="reset">Limpiar</button>
				<button class="btn btn-primary" type="submit" disabled>Consultar</button>
			</div>
		</form>
		<div class="mt-4" data-notary-result></div>
	</section>`).join('');
	root.innerHTML = `<div data-notary-module>
		${pageTitle(notaryRoute.label, 'Consulta las obligaciones tributarias pendientes de una persona o de un objeto asociado a un impuesto distrital.')}
		<div class="bg-white border rounded-3 p-3 p-md-4 mb-4">
			<ul class="nav nav-tabs mb-4" role="tablist" aria-label="Tipo de consulta">${tabs}</ul>
			<div class="tab-content">${panels}</div>
		</div>
	</div>`;
	root.querySelectorAll('[data-bs-toggle="tab"]').forEach((tab) => bootstrap.Tab.getOrCreateInstance(tab));
	let simulateError = demoState === 'error';
	const request = { pending: false, updateForms: [] };
	Object.keys(modes).forEach((mode) => {
		const panel = root.querySelector(`#notary-panel-${mode}`);
		bindNotaryForm(panel, mode, request, () => {
			const shouldFail = simulateError;
			simulateError = false;
			return shouldFail;
		});
	});
}

function bindNotaryForm(panel, mode, request, shouldFail) {
	const form = panel.querySelector('form');
	const target = panel.querySelector('[data-notary-result]');
	const submit = form.querySelector('[type="submit"]');
	const fields = [...form.querySelectorAll('[required]')];
	const { identifier, type, tax } = form.elements;
	const touched = new Set();
	let revision = 0;
	let displayed = false;
	function initial() {
		displayed = false;
		target.innerHTML = emptyState('<strong class="d-block">Consulta las obligaciones tributarias</strong>Completa los campos requeridos y selecciona Consultar para visualizar los resultados.');
	}
	function validate() {
		const value = identifier.value.trim();
		const documentType = type?.value;
		const numeric = ['CC', 'CE', 'TI', 'PPT', 'NUIP'].includes(documentType);
		identifier.inputMode = numeric ? 'numeric' : 'text';
		let error = '';
		if (!value) error = type ? 'Ingresa el número de documento.' : 'Ingresa la identificación del objeto.';
		else if (numeric && !/^\d+$/.test(value)) error = 'Ingresa solo números para este tipo de documento.';
		else if (documentType === 'NIT' && !/^\d+(?:-\d)?$/.test(value)) error = 'Ingresa el NIT con números. Si incluyes el dígito de verificación, sepáralo con un guion.';
		else if (documentType && !numeric && documentType !== 'NIT' && !/^[a-z0-9]+(?:[ -][a-z0-9]+)*$/i.test(value)) error = 'Ingresa un documento válido con letras o números.';
		identifier.setCustomValidity(error);
		identifier.nextElementSibling.textContent = error;
		fields.forEach((field) => {
			const invalid = touched.has(field) && !field.validity.valid;
			field.classList.toggle('is-invalid', invalid);
			field.setAttribute('aria-invalid', String(invalid));
		});
		submit.disabled = request.pending || !form.checkValidity();
	}
	request.updateForms.push(validate);
	form.addEventListener('focusout', (event) => {
		if (fields.includes(event.target)) touched.add(event.target);
		validate();
	});
	form.addEventListener('input', () => {
		revision++;
		if (displayed) initial();
		validate();
	});
	form.addEventListener('reset', () => {
		revision++;
		touched.clear();
		initial();
		queueMicrotask(validate);
	});
	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		fields.forEach((field) => touched.add(field));
		validate();
		if (submit.disabled) return;
		const criteria = { mode, identifier: identifier.value.trim(), type: type?.value, tax: tax?.value };
		const callRevision = revision;
		request.pending = true;
		displayed = true;
		request.updateForms.forEach((update) => update());
		target.innerHTML = loadingState('Consultando obligaciones tributarias…');
		try {
			const { groups, status } = await notaryService.query(criteria, { simulateError: shouldFail() });
			if (revision !== callRevision || !panel.isConnected) return;
			target.innerHTML = '';
			const summary = document.createElement('p');
			summary.className = 'small text-secondary';
			summary.textContent = type
				? `Consulta por sujeto · ${criteria.type} ${criteria.identifier} · ${notaryTaxLabel(notaryTaxes[criteria.tax])}`
				: `Consulta por objeto · ${criteria.identifier}`;
			target.append(summary);
			const plateMessage = notaryPlateMessages[status];
			if (type && notaryTaxes[criteria.tax].pending) target.insertAdjacentHTML('beforeend', statusAlert('info', 'La consulta para este impuesto está pendiente de integración.'));
			else if (groups.length) groups.forEach((group) => renderNotaryResults(target, mode, group));
			else if (plateMessage) target.insertAdjacentHTML('beforeend', statusAlert(plateMessage.tone, plateMessage.text));
			else target.insertAdjacentHTML('beforeend', emptyState('<strong class="d-block">No se encontraron obligaciones tributarias</strong>No encontramos obligaciones asociadas a la información ingresada. Verifica los datos e inténtalo nuevamente.'));
		} catch {
			if (revision !== callRevision || !panel.isConnected) return;
			target.innerHTML = errorState('<strong class="d-block">No pudimos realizar la consulta</strong>Ocurrió un error al consultar las obligaciones tributarias. Inténtalo nuevamente.<div class="mt-2"><button class="btn btn-outline-primary btn-sm" type="button">Reintentar</button></div>');
			target.querySelector('button').addEventListener('click', () => {
				form.requestSubmit();
				identifier.focus();
			});
		} finally {
			request.pending = false;
			request.updateForms.forEach((update) => update());
		}
	});
	initial();
	validate();
}

function renderNotaryResults(target, mode, { tax, rows }) {
	const { name, columns } = notaryTaxes[tax];
	renderQueryResults(target, {
		id: `notary-${mode}-${tax}`,
		title: `Obligaciones del impuesto ${name}`,
		headers: ['Año gravable', ...columns, 'Estado de la obligación'],
		rows,
		formatCell: (cell, index) => index === columns.length + 1
			? tableBadge(agentEscape(cell), cell === 'Moroso' ? 'danger' : 'warning')
			: agentEscape(cell ?? '—'),
	});
}
