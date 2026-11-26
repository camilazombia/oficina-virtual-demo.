const invoiceExamples = [
	{ tax: 'vehiculos', object: taxpayerHomeObjects.vehiculos[0], detail: 'DUCATI', year: '2026' },
	{ tax: 'vehiculos', object: taxpayerHomeObjects.vehiculos[1], detail: 'BMW', year: '2026' },
	{ tax: 'predial', object: taxpayerHomeObjects.predial, detail: 'CL 18 SUR 29B 61', year: '2026' },
];
const paymentCertificationExamples = [
	{ tax: 'vehiculos', object: taxpayerHomeObjects.vehiculos[1], brand: 'BMW', year: '2026', reference: '0000026031822608', amount: 1072000 },
	...taxpayerDocumentExamples.filter(record => record.tax === 'predial' || record.object === taxpayerHomeObjects.vehiculos[0]).map(record => ({
		...record, amount: Number(record.total.replace(/\D/g, '')),
	})),
];
const demoBenefits = new Set();
const invoiceBenefitLimit = 5;
let invoiceReturn;
const billingAmount = new Intl.NumberFormat('es-CO');

function multiplagoInitialState() {
	return emptyState('<strong class="d-block">Consulta tus certificaciones multiplago</strong>Selecciona el impuesto y el año de pago para realizar la consulta.');
}

function renderInvoiceDownload({ title, description }) {
	const id = 'invoice-download';
	const year = `<div class="col-12 col-md-4"><label class="form-label" for="${id}-year">Año gravable <span class="text-danger" aria-hidden="true">*</span></label>
		${renderSelect(`${id}-year`, [], { prompt: 'Selecciona el año', name: 'year', required: true })}
		<div class="invalid-feedback">Selecciona el año.</div></div>`;
	return pageTitle(title, description)
		+ section('Consultar facturas', taxpayerQueryForm(id, { year, taxPrompt: 'Selecciona el impuesto', resetText: 'Limpiar' }));
}

function mountInvoiceDownload({ reissue = false }) {
	const saved = !reissue && invoiceReturn?.query.session === taxpayerSession ? invoiceReturn : null;
	if (!reissue) invoiceReturn = null;
	mountTaxpayerQuery('invoice-download', query => invoiceExamples.filter(invoice =>
		invoice.year === query.year && matchesTaxpayerQuery(query, invoice.tax, invoice.object)
	), (target, invoices, query) => renderInvoiceResults(target, invoices, query,
		query === saved?.query ? saved.selection : [], query === saved?.query ? saved.view : {}, { reissue }), {
		yearsForTax: tax => [...new Set(invoiceExamples.filter(invoice => invoice.tax === tax).map(invoice => invoice.year))],
		restored: saved?.query,
	});
}

function invoiceIdentity(invoice) {
	return `${invoice.object} – ${invoice.detail}`;
}

function taxDisplayName(tax) {
	return taxpayerTaxes.find(([id]) => id === tax)?.[1] || '';
}

function renderInvoiceResults(target, invoices, query, savedSelection, view = {}, { reissue = false } = {}) {
	const benefitKey = invoice => `${query.session.id}:${invoice.tax}:${invoice.object}:${invoice.year}`;
	const applied = invoice => demoBenefits.has(benefitKey(invoice));
	const selected = new Set(savedSelection.filter(index => invoices[index] && !applied(invoices[index])));
	const headers = [...(!reissue ? ['Seleccionar'] : []), query.tax === 'predial' ? 'CHIP' : 'Placa',
		query.tax === 'predial' ? 'Dirección del predio' : 'Marca', 'Acciones'];
	const rowActions = ['download', ...(!reissue ? ['update', 'benefit'] : []), 'pay'];
	const refreshTable = renderQueryResults(target, {
		id: 'invoice-results', title: 'Facturas', view,
		headers,
		rows: invoices.map((invoice, index) => [...(!reissue ? [index] : []), invoice.object, invoice.detail, index]),
		unsortable: [...(!reissue ? [0] : []), headers.length - 1],
		formatCell(cell, column) {
			const invoice = invoices[cell];
			if (!reissue && column === 0) return `<input type="checkbox" class="form-check-input" data-invoice-selection="${cell}" aria-label="Seleccionar factura ${invoice.object}"${selected.has(cell) ? ' checked' : ''}${applied(invoice) || (selected.size >= invoiceBenefitLimit && !selected.has(cell)) ? ' disabled' : ''}>`;
			if (column !== headers.length - 1) return cell;
			return `<div class="d-inline-flex align-items-center flex-nowrap gap-2 text-nowrap">${rowActions.map(action => {
				if (action === 'update') return `<a href="#rit-actualizacion" class="btn btn-outline-primary btn-sm text-nowrap" data-invoice-update aria-label="Actualizar datos · ${invoice.object}">Actualizar</a>`;
				if (action === 'benefit' && applied(invoice)) return tableBadge('Beneficio aplicado', 'success');
				const [label, style] = { download: ['Descargar', 'outline-primary'], benefit: ['Obtener descuento', 'outline-primary'], pay: ['Pagar', 'primary'] }[action];
				return `<button type="button" class="btn btn-${style} btn-sm text-nowrap" data-invoice-action="${action}" data-invoice-index="${cell}" ${action === 'download' ? '' : 'aria-haspopup="dialog" ' }aria-label="${label} · ${invoice.object}">${label}</button>`;
			}).join('')}</div>`;
		},
	});
	const resultSection = target.lastElementChild;
	if (!reissue) resultSection.insertAdjacentHTML('beforeend', '<p class="small text-secondary mb-2 mt-3">Puedes solicitar el beneficio del 1 % para un máximo de 5 facturas por solicitud.</p>');
	resultSection.insertAdjacentHTML('beforeend', '<div class="mt-3" data-invoice-status aria-live="polite"></div>');
	const status = resultSection.querySelector('[data-invoice-status]');
	let busy = false;
	const bar = !reissue && mountSelectionActionBar(resultSection, {
		primaryLabel: 'Solicitar beneficio del 1 %', opensDialog: true,
		onClear() {
			selected.clear();
			refreshTable();
			syncSelection();
			resultSection.querySelector('input[type="search"]')?.focus();
		},
		onPrimary: button => requestBenefit([...selected].map(index => invoices[index]), button),
	});
	function syncSelection() {
		const limitReached = selected.size >= invoiceBenefitLimit;
		resultSection.querySelectorAll('[data-invoice-selection]').forEach(input => {
			const index = Number(input.dataset.invoiceSelection);
			input.disabled = busy || applied(invoices[index]) || (limitReached && !selected.has(index));
		});
		bar.update({
			count: selected.size, countText: selected.size === 1 ? '1 factura seleccionada' : `${selected.size} facturas seleccionadas`,
			infoText: limitReached ? 'Has seleccionado el máximo de 5 facturas permitidas por solicitud.' : '',
			disabled: !selected.size, busy, loadingLabel: 'Solicitando beneficio…',
		});
	}
	function requestBenefit(invoicesToApply, button) {
		const chosen = invoicesToApply.filter(item => !applied(item));
		if (!chosen.length || busy) return;
		showInvoiceBenefit(chosen, button, () => {
			chosen.forEach(item => demoBenefits.add(benefitKey(item)));
			selected.clear();
			refreshTable();
			syncSelection();
			status.innerHTML = statusAlert('success', chosen.length === 1
				? 'El beneficio del 1 % se aplicó correctamente a tu factura.'
				: 'El beneficio del 1 % se aplicó correctamente a las facturas seleccionadas.');
		}, value => {
			busy = value;
			syncSelection();
		});
	}
	if (!reissue) {
		syncSelection();
		resultSection.addEventListener('change', event => {
			if (!event.target.matches('[data-invoice-selection]')) return;
			const index = Number(event.target.dataset.invoiceSelection);
			if (!event.target.checked) selected.delete(index);
			else if (selected.size < invoiceBenefitLimit && !applied(invoices[index])) selected.add(index);
			else event.target.checked = false;
			syncSelection();
		});
	}
	resultSection.addEventListener('click', event => {
		const button = event.target.closest('[data-invoice-action], [data-invoice-update]');
		if (!button) return;
		const invoice = invoices[Number(button.dataset.invoiceIndex)];
		if (!reissue && button.hasAttribute('data-invoice-update')) {
			invoiceReturn = { query, selection: [...selected], view: { ...view } };
		} else if (!reissue && button.dataset.invoiceAction === 'benefit') {
			requestBenefit([invoice], button);
		} else if (button.dataset.invoiceAction === 'pay') {
			showInvoicePayment(invoice, button);
		} else if (button.dataset.invoiceAction === 'download') {
			runBillingDownload(button, status, {
				loading: 'Generando factura…', success: 'La factura se generó correctamente.',
				error: 'No fue posible descargar la factura. Inténtalo nuevamente.',
				download: () => downloadTaxpayerInvoice(invoice, query.session, reissue),
			});
		}
	});
}

function downloadTaxpayerInvoice(invoice, session, reissue = false) {
	const benefited = demoBenefits.has(`${session.id}:${invoice.tax}:${invoice.object}:${invoice.year}`);
	downloadLocalPdf(`${reissue ? 'factura-reexpedida' : 'factura'}-prueba-${invoice.object}-${invoice.year}.pdf`, [
		reissue ? 'Factura reexpedida de prueba' : 'Factura de prueba', 'Documento sin validez oficial. No apto para pago.',
		taxDisplayName(invoice.tax), invoiceIdentity(invoice), `Año gravable: ${invoice.year}`,
		...(!reissue && benefited ? ['Beneficio del 1 % aplicado en la simulación.'] : []),
	]);
}

function billingModalActions(label) {
	return `<button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal">Cancelar</button><button type="button" class="btn btn-primary" data-billing-confirm disabled>${label}</button>`;
}

function showInvoiceBenefit(invoices, trigger, onSuccess, onBusy = () => {}) {
	const authorizationIds = ['electronic-mailbox', 'institutional-information'];
	const pending = authorizationIds.filter(id => !ritFormValues[id]?.checked);
	const rit = document.createElement('template');
	rit.innerHTML = existingRitPage;
	const { modal, instance } = showDetailModal({
		title: 'Solicita el beneficio del 1 %', titleId: 'invoice-benefit-title', trigger,
		body: `${pending.length ? '<p>Registra las autorizaciones requeridas para acceder al beneficio del 1 % en tus facturas.</p>' : ''}
			<ul class="mb-3">${invoices.map(invoice => `<li>${invoiceIdentity(invoice)}</li>`).join('')}</ul>
			<fieldset><legend class="h6">Autorizaciones de Mi RIT</legend>
			<p class="small text-secondary">${pending.length ? 'Selecciona las autorizaciones pendientes para solicitar el beneficio.' : 'Estas autorizaciones ya están registradas en Mi RIT.'}</p>
			${authorizationIds.map(id => {
				const recorded = !pending.includes(id);
				const label = rit.content.querySelector(`label[for="${id}"]`).textContent;
				return `<div class="form-check mb-2"><input class="form-check-input" type="checkbox" id="benefit-${id}" value="${id}"${recorded ? ' checked disabled' : ''}><label class="form-check-label" for="benefit-${id}">${label}</label></div>`;
			}).join('')}</fieldset>
			<div data-benefit-status aria-live="polite"></div>`,
		actions: billingModalActions('Solicitar beneficio'),
	});
	const confirm = modal.querySelector('[data-billing-confirm]');
	const choices = [...modal.querySelectorAll('input[type="checkbox"]:enabled')];
	const status = modal.querySelector('[data-benefit-status]');
	const dismissButtons = [...modal.querySelectorAll('[data-bs-dismiss]')];
	let pendingRequest = false;
	let completed = false;
	const validate = () => { confirm.disabled = pendingRequest || completed || choices.some(input => !input.checked); };
	modal.addEventListener('change', validate);
	modal.addEventListener('hide.bs.modal', event => { if (pendingRequest) event.preventDefault(); });
	validate();
	confirm.addEventListener('click', () => {
		if (confirm.disabled) return;
		pendingRequest = true;
		confirm.disabled = true;
		onBusy(true);
		const label = confirm.textContent;
		confirm.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Solicitando beneficio…';
		dismissButtons.forEach(button => { button.disabled = true; });
		choices.forEach(input => { input.disabled = true; });
		status.innerHTML = loadingState('Procesando solicitud…');
		window.setTimeout(() => {
			try {
				if (!modal.isConnected || !trigger.closest('#pageContent')) return;
				if (pending.length) {
					const values = { ...ritFormValues };
					pending.forEach(id => { values[id] = { value: 'on', checked: true }; });
					persistRitFormValues(values);
				}
				onSuccess();
				document.querySelector('#invoice-results-title')?.setAttribute('tabindex', '-1');
				modal.addEventListener('hidden.bs.modal', () => document.querySelector('#invoice-results-title')?.focus(), { once: true });
				completed = true;
				pendingRequest = false;
				instance.hide();
			} catch {
				status.innerHTML = statusAlert('danger', 'No fue posible solicitar el beneficio. Inténtalo nuevamente.', 'alert');
				choices.forEach(input => { input.disabled = false; });
			} finally {
				pendingRequest = false;
				dismissButtons.forEach(button => { button.disabled = false; });
				confirm.textContent = label;
				validate();
				onBusy(false);
			}
		}, 180);
	});
}

function showInvoicePayment(invoice, trigger) {
	const options = ['Pago con aporte voluntario', 'Pago sin aporte voluntario'];
	showDetailModal({
		title: 'Realiza el pago de tu factura', titleId: 'invoice-payment-title', trigger,
		body: `<p>Selecciona la opción con la que deseas realizar el pago.</p>
			<p class="small text-secondary">${taxDisplayName(invoice.tax)} · ${invoice.object} · Año gravable ${invoice.year}</p>
			<fieldset><legend class="visually-hidden">Opciones de pago</legend>
			${options.map((label, index) => `<div class="border rounded-3 p-3 mb-2"><div class="form-check">
			<input type="radio" class="form-check-input" id="invoice-payment-${index}" name="invoice-payment-option" disabled>
			<label class="form-check-label fw-semibold" for="invoice-payment-${index}">${label}</label></div>
			<p class="small text-secondary mb-0">Referencia y total a pagar no disponibles.</p></div>`).join('')}</fieldset>
			${statusAlert('danger', 'No fue posible obtener la información de pago. Inténtalo nuevamente.', 'alert')}`,
		actions: billingModalActions('Continuar al pago'),
	});
}

function runBillingDownload(button, status, { loading, success, error, download, after = () => {} }) {
	if (button.disabled || status.dataset.downloadPending) return;
	status.dataset.downloadPending = 'true';
	button.disabled = true;
	status.innerHTML = loadingState(loading);
	window.setTimeout(() => {
		if (!status.isConnected) return;
		try {
			download();
			if (success) status.innerHTML = statusAlert('success', success);
		} catch {
			status.innerHTML = statusAlert('danger', error, 'alert');
		} finally {
			delete status.dataset.downloadPending;
			button.disabled = false;
			after();
		}
	}, 180);
}

function renderPaymentCertificationResults(target, records, tax) {
	const identity = getTaxpayerIdentity();
	const headers = ['Tipo de documento', 'Número de documento', 'Periodo', 'Referencia', 'Importe', 'Moneda', 'Acciones'];
	const rows = records.map(record => [
		icaEscape(record.documentType || identity.documentType || '—'), icaEscape(record.documentNumber || identity.documentNumber || '—'), record.period || record.year,
		record.reference, record.amount, 'COP', record.reference,
	]);
	renderQueryResults(target, {
		id: 'payment-certification-table', title: 'Resultados',
		headers, rows, alignRight: 4, unsortable: [6],
		formatCell(cell, index) {
			if (index === 6) return `<button type="button" class="btn btn-outline-primary btn-sm px-3 text-nowrap" data-cert-payment="${cell}" aria-label="Descargar certificación del pago ${cell}"><i class="bi bi-download me-1" aria-hidden="true"></i>Descargar</button>`;
			return index === 4 ? billingAmount.format(cell) : cell;
		},
	});
	const results = target.lastElementChild;
	results.insertAdjacentHTML('beforeend', '<div class="mt-3" data-cert-status aria-live="polite"></div>');
	const status = results.querySelector('[data-cert-status]');
	results.addEventListener('click', event => {
		const button = event.target.closest('[data-cert-payment]');
		if (!button) return;
		const record = records.find(item => item.reference === button.dataset.certPayment);
		if (!record) return;
		runBillingDownload(button, status, {
			loading: 'Generando certificación de pago…', success: 'La certificación de pago se generó correctamente.',
			error: 'No fue posible generar la certificación de pago. Inténtalo nuevamente.',
			download: () => downloadLocalPdf(`certificacion-pago-prueba-${record.reference}.pdf`, [
				'Certificación de pago de prueba', 'Documento sin validez oficial.',
				`${identity.fullName} · ${record.documentType || identity.documentType} ${record.documentNumber || identity.documentNumber}`,
				taxDisplayName(tax), record.object, `Periodo: ${record.period || record.year}`,
				`Referencia: ${record.reference}`, `Valor del pago: ${billingAmount.format(record.amount)} COP`,
			]),
		});
	});
}
