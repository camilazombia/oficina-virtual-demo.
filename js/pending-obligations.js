const pendingObligationReceipts = new Map();
const pendingObligationTaxes = [
	...taxpayerTaxes,
	['ica', 'ICA'], ['reteica', 'Retención ICA'], ['publicidad', 'Publicidad exterior'],
];
const pendingObligationMoney = value => Number.isFinite(value) ? '$' + billingAmount.format(value) : '—';

// Fixture de Obligaciones pendientes. Los recibos de este servicio solo son documentos de prueba.
function createPendingObligationService(session, identity, scenario) {
	const large = session.requiresObject;
	const authorized = row => session === taxpayerSession && (taxpayerObjectRules[row.tax]
		? taxpayerCanConsult(session, row.tax, row.object) : large && row.owner === session.id);
	const commercial = large ? [
		{ tax: 'ica', object: identity.documentNumber, year: '2025', status: 'Omiso', documentType: identity.documentType, document: identity.documentNumber, canDeclare: true },
		{ tax: 'reteica', object: identity.documentNumber, year: '2024', status: 'Moroso', documentType: identity.documentType, document: identity.documentNumber, total: 415000 },
		...publicityElementsFor(session).filter(element => element.outstanding).map(element => ({
			...element.outstanding, tax: 'publicidad', object: element.resolution, document: element.resolution,
		})),
	] : [];
	const demoObjects = large
		? taxpayerTaxes.flatMap(([tax]) => [...taxpayerObjects[tax].keys()].filter(object => taxpayerCanConsult(session, tax, object)).map(object => [tax, object]))
		: taxpayerTaxes.map(([tax]) => [tax, tax === 'predial' ? taxpayerHomeObjects.predial : taxpayerHomeObjects.vehiculos[0]]);
	const records = [
		...multipayFixtures.map(row => ({
			...row, status: 'Moroso', amountWith: row.withContribution, amountWithout: row.withoutContribution,
			invoice: row.reference, documentType: 'Factura', document: row.reference,
			canGenerate: true, canConsolidate: true, canPay: true,
		})),
		...demoObjects.flatMap(([tax, object], objectIndex) => Array.from({ length: large ? 12 : 2 }, (_, index) => {
			const isOmitted = index % 5 === 0;
			const reference = 'OP-' + String(objectIndex + 1).padStart(2, '0') + '-' + String(index + 1).padStart(2, '0');
			const year = String(2022 - index);
			const total = isOmitted ? undefined : 340000 + objectIndex * 130000 + index * 57000;
			return {
				tax, object, year, status: isOmitted ? 'Omiso' : 'Moroso', total, reference,
				assessment: isOmitted ? 'IMP + SN' : 'IMP',
				documentType: isOmitted ? undefined : index % 2 ? 'Declaración' : 'Acto administrativo',
				document: isOmitted ? undefined : year + '-DOC-' + reference.slice(3),
				contractObject: tax === 'predial' ? 'Predio urbano' : 'Vehículo particular',
				canDeclare: isOmitted,
				canGenerate: !isOmitted,
				canConsolidate: !isOmitted && index !== 4,
				coupons: objectIndex === 0 && index === 1 ? [{ reference: 'CP-0001', amount: total }] : [],
			};
		})),
		...commercial,
	].map((row, index) => ({ ...row, owner: session.id, id: String(index) }));
	if (!pendingObligationReceipts.has(session.id)) {
		const account = { links: new Map(), receipts: new Map() };
		if (large) {
			const existing = records.filter(row => authorized(row) && row.canConsolidate && row.year === '2019');
			const seeded = [[existing[0]], existing.slice(1, 3)].filter(rows => rows.length && rows.every(Boolean));
			for (const rows of seeded) {
				const multiple = rows.length > 1;
				const id = multiple ? 'ROP-MP-OP-0002' : 'ROP-OP-0001';
				account.receipts.set(id, { id, multiple, row: rows[0], total: multipayTotal(rows), references: rows.map(row => row.reference) });
				rows.forEach(row => account.links.set(row.id, { [multiple ? 'multiple' : 'single']: id }));
			}
		}
		pendingObligationReceipts.set(session.id, account);
	}
	const { links, receipts } = pendingObligationReceipts.get(session.id);
	const lookup = id => records.find(row => row.id === id && authorized(row));
	const receiptFor = (id, kind) => receipts.get(links.get(id)?.[kind]);
	const canSelect = row => Boolean(row?.canConsolidate && Number.isFinite(row.total) && row.total > 0 && row.reference
		&& !receiptFor(row.id, 'multiple') && !receiptFor(row.id, 'single'));
	const canGenerate = row => Boolean(row?.canGenerate && Number.isFinite(row.total) && row.total > 0 && row.reference
		&& !receiptFor(row.id, 'multiple') && !receiptFor(row.id, 'single'));
	let generationFailed = false;
	let queryFailed = false;
	return {
		lookup, canSelect, canGenerate, receiptFor,
		query(query, status) {
			if (scenario === 'obligaciones-error-consulta' && !queryFailed) {
				queryFailed = true;
				throw new Error('Error de consulta simulado');
			}
			return records.filter(row => authorized(row) && (query.tax === 'todos' || query.tax === row.tax)
				&& (!query.identifier || query.identifier === row.object) && (!query.year || query.year === row.year)
				&& (!status || status === row.status));
		},
		async generate(ids, multiple, expectedTotal) {
			await new Promise(resolve => setTimeout(resolve, 250));
			const rows = [...new Set(ids)].map(lookup);
			if (rows.length !== ids.length || (multiple ? rows.length < 2 || rows.length > multipayLimit || !rows.every(canSelect) : rows.length !== 1 || !canGenerate(rows[0]))) {
				throw new Error('Obligación no disponible');
			}
			const total = multipayTotal(rows);
			if (total !== expectedTotal) throw new Error('El total cambió');
			if (scenario === 'obligaciones-error-rop' && !generationFailed) {
				generationFailed = true;
				throw new Error('Error de generación simulado');
			}
			const id = (multiple ? 'ROP-MP-OP-' : 'ROP-OP-') + String(receipts.size + 1).padStart(4, '0');
			const receipt = { id, total, multiple, references: rows.map(row => row.reference), row: rows[0] };
			// Se emite un documento por recibo. Una obligación consolidada solo admite el pago del recibo agrupado.
			receipts.set(id, receipt);
			for (const row of rows) {
				links.set(row.id, { ...links.get(row.id), [multiple ? 'multiple' : 'single']: id });
			}
			return receipt;
		},
	};
}

function renderObligations() {
	const heading = pageTitle('Obligaciones pendientes', 'Consulta tus obligaciones tributarias pendientes y realiza las acciones disponibles según el estado de cada obligación.');
	if (!taxpayerSession) return heading + emptyState('Selecciona un perfil de contribuyente para consultar tus obligaciones.');
	const id = 'pending-obligation-query';
	const year = `<div class="col-12 col-md-4"><label class="form-label" for="${id}-year">Año gravable</label>
		${renderSelect(id + '-year', yearOptions(2011, 2025), { prompt: 'Todos los años', name: 'year' })}</div>
		<div class="col-12 col-md-4"><label class="form-label" for="${id}-state">Estado de la obligación</label>
		${renderSelect(id + '-state', ['Omiso', 'Moroso'], { prompt: 'Todos', name: 'obligationState' })}</div>`;
	return heading + '<div id="pending-obligation-feedback" tabindex="-1" aria-live="polite"></div>'
		+ section('Consultar obligaciones', taxpayerQueryForm(id, {
			taxes: [['todos', 'Todos los impuestos'], ...(taxpayerSession.requiresObject ? pendingObligationTaxes : taxpayerTaxes)],
			year,
		}));
}

function pendingTaxLabel(tax) {
	return pendingObligationTaxes.find(([id]) => id === tax)?.[1] ?? '—';
}

function pendingObligationFields(fields) {
	return `<dl class="row mb-0">${fields.map(([label, value]) => `<dt class="col-sm-4">${label}</dt><dd class="col-sm-8">${accountStatementHtml(value ?? '—')}</dd>`).join('')}</dl>`;
}

function pendingObligationActions(row, service) {
	const multiple = service.receiptFor(row.id, 'multiple');
	const single = service.receiptFor(row.id, 'single');
	return [
		['detail', 'Ver detalle'],
		...(row.canDeclare ? [['declare', 'Declarar']] : []),
		...(service.canGenerate(row) ? [['generate', 'Generar ROP']] : []),
		...(multiple || single ? [['download', multiple ? 'Descargar ROP múltiple' : 'Descargar ROP']] : []),
		...(multiple || single || row.canPay ? [['pay', multiple ? 'Pagar ROP múltiple' : 'Pagar']] : []),
	];
}

function downloadPendingObligationReceipt(receipt) {
	if (receipt.multiple) return downloadMultipayRop(receipt);
	const row = receipt.row;
	downloadLocalPdf(receipt.id.toLowerCase() + '-prueba.pdf', [
		'Recibo Oficial de Pago (ROP) - PRUEBA', 'Documento sin validez oficial. No apto para pago.',
		'Recibo: ' + receipt.id, 'Impuesto: ' + pendingTaxLabel(row.tax), 'Año gravable: ' + row.year,
		'Objeto tributario: ' + row.object, 'Referencia: ' + row.reference, 'Total a pagar: ' + pendingObligationMoney(receipt.total),
	]);
}

function mountPendingObligations() {
	const form = document.getElementById('pending-obligation-query');
	const feedback = document.getElementById('pending-obligation-feedback');
	const scenario = new URLSearchParams(location.search).get('demo');
	const service = createPendingObligationService(taxpayerSession, getTaxpayerIdentity(), scenario);
	const selected = new Set();
	let generating = false;
	let refreshTable;
	const selectedRows = () => [...selected].map(service.lookup).filter(service.canSelect);
	const results = form.nextElementSibling.nextElementSibling;
	const selectionBar = mountSelectionActionBar(form.closest('#pageContent'), {
		singular: 'obligación seleccionada', plural: 'obligaciones seleccionadas',
		primaryLabel: 'Generar ROP múltiple', opensDialog: true,
		onClear() {
			selected.clear();
			syncSelection();
			refreshTable?.();
			(results.querySelector('input[type="search"]') ?? form.elements.tax).focus();
		},
		onPrimary(trigger) {
			const rows = selectedRows();
			if (rows.length >= 2) showGeneration(rows, trigger, true);
		},
	});

	function syncSelection() {
		const rows = selectedRows();
		selectionBar.update({
			count: rows.length, totalText: 'Total seleccionado: ' + pendingObligationMoney(multipayTotal(rows)),
			infoText: rows.length === 1 ? 'Selecciona al menos dos obligaciones para generar un ROP múltiple.' : '',
			disabled: rows.length < 2, busy: generating, loadingLabel: 'Generando ROP múltiple…',
		});
	}

	function renderResults(target, records) {
		refreshTable = renderQueryResults(target, {
			id: 'pending-obligation-table', title: 'Resultados de obligaciones pendientes',
			headers: ['Seleccionar', 'Año gravable', 'Impuesto', 'Objeto tributario', 'Estado', '<span class="text-nowrap">Total a pagar</span>', 'Cupones', 'Acciones'],
			rows: records.map(row => [row, row.year, pendingTaxLabel(row.tax), row, row.status, row.total,
				row.coupons?.map(coupon => coupon.reference).join(', ') || '—', row]),
			alignRight: 5, unsortable: [0, 7],
			searchPlaceholder: 'Buscar por objeto, referencia o documento',
			noMatches: '<strong class="d-block">No encontramos resultados.</strong>Verifica la información ingresada o modifica los filtros de búsqueda.',
			searchText: ([row, year, tax, , status, total, coupons]) => [year, tax, row.object, status, pendingObligationMoney(total), coupons,
				row.reference, row.document, row.invoice, service.receiptFor(row.id, 'single')?.id, service.receiptFor(row.id, 'multiple')?.id].join(' '),
			sortValue: (cell, index) => index === 3 ? cell.object : index === 5 ? cell ?? -Infinity : cell,
			formatCell(cell, index) {
				if (index === 0) return service.canSelect(cell)
					? `<input type="checkbox" class="form-check-input m-0" data-pending-select="${cell.id}" aria-label="Seleccionar obligación ${cell.reference} de ${cell.object}" ${selected.has(cell.id) ? 'checked' : ''}>` : '';
				if (index === 3) return accountStatementHtml(cell.object);
				if (index === 4) return tableBadge(cell, cell === 'Omiso' ? 'info' : 'danger');
				if (index === 5) return pendingObligationMoney(cell);
				if (index !== 7) return accountStatementHtml(cell);
				return `<div class="d-inline-flex align-items-center flex-nowrap gap-2 text-nowrap">${pendingObligationActions(cell, service).map(([action, label]) =>
					`<button class="btn btn-sm btn-${['generate', 'pay', 'declare'].includes(action) ? 'primary' : 'outline-primary'} text-nowrap" type="button" data-pending-action="${action}" data-pending-row="${cell.id}" aria-label="${label} · ${accountStatementHtml(cell.object)} · ${cell.year}" ${action !== 'declare' && action !== 'download' ? 'aria-haspopup="dialog"' : ''}>${action === 'detail' ? 'Ver' : label}</button>`).join('')}</div>`;
			},
		});
	}
	mountTaxpayerQuery(form.id, query => service.query(query, form.elements.obligationState.value), renderResults, {
		initial: true, loadingMessage: 'Consultando obligaciones pendientes…',
		emptyMessage: '<strong class="d-block">No tienes obligaciones pendientes.</strong>Actualmente no se encontraron obligaciones tributarias pendientes asociadas a tu identificación.',
		errorMessage: 'No fue posible consultar tus obligaciones pendientes. Inténtalo nuevamente.',
	});
	results.addEventListener('change', event => {
		const checkbox = event.target.closest('[data-pending-select]');
		if (!checkbox) return;
		const id = checkbox.dataset.pendingSelect;
		if (checkbox.checked && service.canSelect(service.lookup(id)) && selected.size < multipayLimit) selected.add(id);
		else {
			if (checkbox.checked && selected.size >= multipayLimit) {
				feedback.innerHTML = statusAlert('warning', 'Puedes seleccionar hasta ' + multipayLimit + ' obligaciones.');
			}
			selected.delete(id);
			checkbox.checked = false;
		}
		syncSelection();
	});

	function showGeneration(rows, trigger, multiple) {
		const count = rows.length;
		const total = multipayTotal(rows);
		const title = multiple ? 'Generar ROP múltiple' : 'Generar Recibo Oficial de Pago (ROP)';
		const headers = ['Año gravable', 'Impuesto', 'Objeto tributario', 'Tipo de documento', 'Número de documento', 'Total a pagar'];
		const body = multiple
			? '<p>Se generará un Recibo Oficial de Pago que agrupa las obligaciones seleccionadas. Verifica la información antes de continuar.</p>'
				+ tableFrame(headers.map((header, index) => `<th scope="col"${index === headers.length - 1 ? ' class="text-end text-nowrap"' : ''}>${header}</th>`).join(''), rows.map(row =>
					`<tr>${[row.year, pendingTaxLabel(row.tax), row.object, row.documentType, row.document].map(value =>
						`<td>${accountStatementHtml(value ?? '—')}</td>`).join('')}<td class="text-end text-nowrap">${pendingObligationMoney(row.total)}</td></tr>`).join(''),
					{ label: 'Obligaciones seleccionadas', paginationManaged: true })
				+ '<p>El ROP múltiple se asociará a las obligaciones seleccionadas para realizar el pago a través de los canales habilitados.</p>'
			: pendingObligationFields([['Impuesto', pendingTaxLabel(rows[0].tax)], ['Año gravable', rows[0].year], ['Objeto tributario', rows[0].object], ['Total a pagar', pendingObligationMoney(total)]]);
		const { modal, instance } = showDetailModal({
			title, trigger, size: multiple ? 'modal-xl' : '',
			body: body + '<div data-pending-generation-status aria-live="polite"></div>',
			actions: (multiple ? `<div class="me-auto"><strong>Obligaciones seleccionadas ${count}</strong><div>Total a pagar ${pendingObligationMoney(total)}</div></div>` : '')
				+ billingModalActions(multiple ? 'Generar ROP múltiple' : 'Generar ROP'),
		});
		const confirm = modal.querySelector('[data-billing-confirm]');
		const status = modal.querySelector('[data-pending-generation-status]');
		let busy = false;
		modal.addEventListener('shown.bs.modal', () => { confirm.disabled = false; }, { once: true });
		modal.addEventListener('hide.bs.modal', event => { if (busy) event.preventDefault(); });
		confirm.addEventListener('click', async () => {
			if (busy) return;
			busy = true;
			if (multiple) {
				generating = true;
				syncSelection();
			}
			confirm.disabled = true;
			const confirmLabel = confirm.textContent;
			confirm.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Generando ROP…';
			modal.querySelectorAll('[data-bs-dismiss]').forEach(button => { button.disabled = true; });
			status.innerHTML = loadingState(multiple ? 'Generando ROP múltiple…' : 'Generando Recibo Oficial de Pago…');
			try {
				const receipt = await service.generate(rows.map(row => row.id), multiple, total);
				if (!form.isConnected) {
					busy = false;
					instance.hide();
					return;
				}
				if (multiple) selected.clear();
				else selected.delete(rows[0].id);
				syncSelection();
				refreshTable?.();
				const success = multiple
					? '<strong class="d-block">ROP múltiple generado correctamente.</strong>El Recibo Oficial de Pago fue generado y asociado a las obligaciones seleccionadas.'
					: 'El Recibo Oficial de Pago (ROP) se generó correctamente.';
				feedback.innerHTML = statusAlert('success', success);
				try {
					downloadPendingObligationReceipt(receipt);
				} catch {
					feedback.insertAdjacentHTML('beforeend', errorState('No fue posible descargar el ROP. Vuelve a intentarlo desde Acciones.'));
				}
				modal.addEventListener('hidden.bs.modal', () => feedback.focus(), { once: true });
				busy = false;
				instance.hide();
			} catch {
				const unavailable = rows.some(row => multiple ? !service.canSelect(service.lookup(row.id)) : !service.canGenerate(service.lookup(row.id)));
				status.innerHTML = errorState(unavailable && multiple ? 'Esta obligación no está disponible para incluirse en un ROP múltiple.'
					: multiple ? 'No fue posible generar el ROP múltiple. Inténtalo nuevamente.' : 'No fue posible generar el Recibo Oficial de Pago. Inténtalo nuevamente.');
			} finally {
				busy = false;
				if (multiple) {
					generating = false;
					syncSelection();
				}
				confirm.disabled = false;
				confirm.textContent = confirmLabel;
				modal.querySelectorAll('[data-bs-dismiss]').forEach(button => { button.disabled = false; });
			}
		});
	}

	function runAction(action, row, trigger) {
		const multiple = service.receiptFor(row.id, 'multiple');
		const single = service.receiptFor(row.id, 'single');
		if (action === 'generate') return showGeneration([row], trigger, false);
		if (action === 'declare') {
			const tax = { predial: 'Impuesto Predial Unificado', vehiculos: 'Impuesto de Vehículos', ica: 'ICA' }[row.tax];
			location.href = '?' + new URLSearchParams({ impuesto: tax, vigencia: row.year }) + '#declaraciones-generar';
			return;
		}
		if (action === 'download') {
			try {
				downloadPendingObligationReceipt(multiple ?? single);
			} catch {
				feedback.innerHTML = errorState('No fue posible descargar el ROP. Inténtalo nuevamente.');
			}
			return;
		}
		if (action === 'pay') {
			if (multiple || single) return confirmMultipayPayment(multiple ?? single, trigger);
			return showInvoicePayment(row, trigger);
		}
		const groups = [
			['Información tributaria', [['Impuesto', pendingTaxLabel(row.tax)], ['Año gravable', row.year], ['Objeto tributario', row.object], ['Objeto contrato', row.contractObject], ['Estado', row.status], ['Obligación', row.assessment ?? pendingObligationMoney(row.amount)]]],
			['Información del documento', [['Factura', row.invoice], ['Referencia', row.reference], ['Tipo de documento', row.documentType], ['Número de documento', row.document]]],
			['Información de pago', [['Total con aporte', Number.isFinite(row.amountWith) ? pendingObligationMoney(row.amountWith) : undefined], ['Total sin aporte', Number.isFinite(row.amountWithout) ? pendingObligationMoney(row.amountWithout) : undefined],
				['Total a pagar', pendingObligationMoney(row.total)], ['ROP individual', single?.id], ['ROP multipago', multiple?.id],
				['Cupones', row.coupons?.map(coupon => coupon.reference + ' · ' + pendingObligationMoney(coupon.amount)).join(', ') || undefined]]],
		];
		const body = groups.map(([heading, fields]) => `<h3 class="h6 border-bottom pb-2">${heading}</h3>${pendingObligationFields(fields)}`).join('');
		const available = pendingObligationActions(row, service).filter(([id]) => id !== 'detail');
		const detail = showDetailModal({
			title: 'Detalle de la obligación', body, trigger, size: 'modal-lg',
			actions: '<button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal">Cerrar</button>'
				+ available.map(([id, label]) => `<button class="btn btn-outline-primary" type="button" data-pending-detail-action="${id}">${label}</button>`).join(''),
		});
		detail.modal.addEventListener('click', event => {
			const button = event.target.closest('[data-pending-detail-action]');
			if (!button) return;
			detail.modal.addEventListener('hidden.bs.modal', () => runAction(button.dataset.pendingDetailAction, row, trigger), { once: true });
			detail.instance.hide();
		});
	}
	results.addEventListener('click', event => {
		const button = event.target.closest('[data-pending-action]');
		if (!button) return;
		const row = service.lookup(button.dataset.pendingRow);
		if (!row || !pendingObligationActions(row, service).some(([action]) => action === button.dataset.pendingAction)) return;
		runAction(button.dataset.pendingAction, row, button);
	});
}
