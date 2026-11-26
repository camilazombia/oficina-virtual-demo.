const multipayLimit = 50;
const multipayAccounts = new Map();
const multipayFixtures = [
	['predial', taxpayerHomeObjects.predial, '2025', '100000047309', 571000, 590000, 590000, 620000],
	['predial', taxpayerHomeObjects.predial, '2024', '100000047310', 482000, 505000, 505000, 530000],
	['predial', taxpayerHomeObjects.predial, '2023', '100000047311', 451000, 478000, 478000, 500000],
	['vehiculos', taxpayerHomeObjects.vehiculos[0], '2025', '100000047428', 2366000, 2596000, 2596000, 2710000],
	['vehiculos', taxpayerHomeObjects.vehiculos[0], '2024', '100000047429', 2150000, 2370000, 2370000, 2480000],
	['vehiculos', taxpayerHomeObjects.vehiculos[1], '2025', '100000047430', 1072000, 1120000, 1120000, 1170000],
].map(([tax, object, year, reference, amount, total, withoutContribution, withContribution]) => ({
	tax, object, year, reference, amount, total, withoutContribution, withContribution,
}));

const multipayObjectFilters = {
	vehiculos: { ...taxpayerObjectRules.vehiculos, optional: true, pattern: '[A-Z0-9]{4,8}', invalid: 'Revisa la placa ingresada. Recuerda que debe contener entre 4 y 8 caracteres.' },
	predial: { ...taxpayerObjectRules.predial, optional: true },
};

function multipayPendingRows(query) {
	return multipayFixtures.filter(row => matchesTaxpayerQuery(query, row.tax, row.object)
		&& (!query.year || row.year === query.year));
}

function multipayTotal(rows) {
	return rows.reduce((total, row) => total + row.total, 0);
}

function addMultipayObligations(list, selected) {
	const unique = new Map(selected.filter(row => !list.has(row.reference)).map(row => [row.reference, row]));
	if (unique.size < 2) return 'minimum';
	if (list.size + unique.size > multipayLimit) return 'limit';
	unique.forEach((row, reference) => list.set(reference, row));
	return 'added';
}

function renderMultipay() {
	const year = `<div class="col-12 col-md-4"><label class="form-label" for="multipay-year">Año de la obligación</label>
		${renderSelect('multipay-year', [...new Set(multipayFixtures.map(row => row.year))].sort().reverse(), { prompt: 'Todos los años', name: 'year' })}</div>`;
	return `${pageTitle('Recibo multipago')}
		<div id="multipay-feedback" aria-live="polite"></div>
		<div id="multipay-search-view">
			<div class="d-flex justify-content-end mb-3"><button type="button" class="btn btn-outline-primary" data-multipay-list>Listado para pagar (0/50)</button></div>
			${section('Consulta de obligaciones', taxpayerQueryForm('multipay-search', { year, taxPrompt: 'Selecciona el impuesto', buttonText: 'Buscar' }))}
		</div>
		<div id="multipay-list-view" hidden>
			<button type="button" class="btn btn-outline-secondary btn-sm mb-3" data-multipay-back><i class="bi bi-arrow-left me-2" aria-hidden="true"></i>Regresar a la consulta</button>
			${section('Listado de obligaciones por pagar', `<div id="multipay-listed"></div>
				<div class="alert alert-primary d-flex justify-content-between gap-2 mt-3"><span>Total a pagar</span><strong data-multipay-total aria-live="polite"></strong></div>
				<div class="d-flex flex-wrap justify-content-end gap-2">
					<button type="button" class="btn btn-outline-danger" data-multipay-clear aria-haspopup="dialog">Eliminar listado de obligaciones por pagar</button>
					<button type="button" class="btn btn-primary" data-multipay-generate aria-haspopup="dialog">Generar ROP multipago</button>
					<button type="button" class="btn btn-primary" data-multipay-pay-current aria-haspopup="dialog">Pagar ROP multipago</button>
				</div>`)}
		</div>
		${section('Multipagos activos', '<div id="multipay-active"></div>')}`;
}

function renderMultipayObligations(target, rows, { title, objectLabel, checkbox, selection }) {
	const headers = [...(checkbox ? ['Seleccionar'] : []), 'Año gravable', objectLabel, 'Estado', 'Referencia', 'Monto de la obligación',
		'Monto de pago total', 'Monto facturado sin aporte voluntario', 'Monto facturado con aporte voluntario',
		...(!checkbox ? ['Acciones'] : [])];
	renderQueryResults(target, {
		id: checkbox ? 'multipay-results-table' : 'multipay-list-table', title,
		headers,
		rows: rows.map(row => [...(checkbox ? [row.reference] : []), row.year, row.object, 'Moroso', row.reference,
			row.amount, row.total, row.withoutContribution, row.withContribution, ...(!checkbox ? [row.reference] : [])]),
		alignRight: checkbox ? [5, 6, 7, 8] : [4, 5, 6, 7], unsortable: [checkbox ? 0 : 8],
		formatCell(cell, index) {
			if (index === 0 && checkbox) return `<input type="checkbox" class="form-check-input" aria-label="Seleccionar obligación ${cell}" data-multipay-select="${cell}"${selection.has(cell) ? ' checked' : ''}>`;
			if (!checkbox && index === 8) return `<button type="button" class="btn btn-outline-danger btn-sm text-nowrap" data-multipay-remove="${cell}" aria-label="Eliminar obligación ${cell}">Eliminar</button>`;
			if (index === (checkbox ? 3 : 2)) return tableBadge(cell, 'danger');
			return index >= (checkbox ? 5 : 4) ? `$${billingAmount.format(cell)}` : cell;
		},
	});
}

function downloadMultipayRop(rop) {
	const references = [];
	for (let index = 0; index < rop.references.length; index += 4) references.push(rop.references.slice(index, index + 4).join(' · '));
	downloadLocalPdf(`${rop.id.toLowerCase()}-prueba.pdf`, [
		'ROP multipago de prueba', 'Documento sin validez oficial. No apto para pago.',
		`Recibo: ${rop.id}`, `Total a pagar: $${billingAmount.format(rop.total)} COP`,
		'Referencias incluidas:', ...references,
	]);
}

function multipayConfirmation(trigger, { title, body, label, onConfirm }) {
	const { modal, instance } = showDetailModal({
		title, body: `${body}<div data-multipay-modal-status aria-live="polite"></div>`, trigger,
		actions: billingModalActions(label),
	});
	const confirm = modal.querySelector('[data-billing-confirm]');
	confirm.disabled = false;
	confirm.addEventListener('click', () => onConfirm({ modal, instance, confirm }));
}

function confirmMultipayPayment(rop, trigger) {
	if (!rop) return;
	const label = rop.multiple === false ? 'ROP' : 'ROP multipago';
	multipayConfirmation(trigger, {
		title: 'Confirmar pago', label: 'Sí, pagar',
		body: `<p>¿Deseas continuar con el pago del ${label} generado?</p>`,
		onConfirm({ modal }) {
			modal.querySelector('[data-multipay-modal-status]').innerHTML = statusAlert('info', 'El servicio de pago en línea todavía no está disponible.');
		},
	});
}

function mountMultipay() {
	const session = taxpayerSession;
	if (!multipayAccounts.has(session.id)) multipayAccounts.set(session.id, { list: new Map(), active: [], current: null });
	const account = multipayAccounts.get(session.id);
	const { list, active } = account;
	const feedback = document.getElementById('multipay-feedback');
	const searchView = document.getElementById('multipay-search-view');
	const listView = document.getElementById('multipay-list-view');
	const listButton = searchView.querySelector('[data-multipay-list]');
	const back = listView.querySelector('[data-multipay-back]');
	const generate = listView.querySelector('[data-multipay-generate]');
	const clear = listView.querySelector('[data-multipay-clear]');
	const payCurrent = listView.querySelector('[data-multipay-pay-current]');
	const listed = document.getElementById('multipay-listed');
	const activeTarget = document.getElementById('multipay-active');
	let syncResultSelection;

	function syncList() {
		const rows = [...list.values()];
		listButton.textContent = `Listado para pagar (${rows.length}/50)`;
		listView.querySelector('[data-multipay-total]').textContent = `$${billingAmount.format(multipayTotal(rows))}`;
		generate.disabled = rows.length < 2 || Boolean(account.current);
		generate.setAttribute('aria-label', rows.length < 2 ? 'Generar ROP multipago. Selecciona mínimo dos obligaciones para continuar.' : 'Generar ROP multipago');
		clear.disabled = !rows.length;
		payCurrent.disabled = !account.current;
		listed.replaceChildren();
		if (rows.length) renderMultipayObligations(listed, rows, { title: 'Obligaciones agregadas', objectLabel: 'Placa o CHIP' });
		else listed.innerHTML = emptyState('Aún no tienes obligaciones agregadas al listado por pagar.');
	}

	function syncActive() {
		activeTarget.replaceChildren();
		if (!active.length) {
			activeTarget.innerHTML = emptyState('Actualmente no tienes ROP multipago activos.');
			return;
		}
		renderQueryResults(activeTarget, {
			id: 'multipay-active-table', title: 'Recibos activos', headers: ['ROP multipago', 'Total a pagar', 'Acciones'],
			rows: active.map(rop => [rop.id, rop.total, rop.id]), alignRight: 1, unsortable: [2],
			formatCell(cell, index) {
				if (index === 0) return cell;
				if (index === 1) return `$${billingAmount.format(cell)}`;
				return `<div class="d-inline-flex align-items-center flex-nowrap gap-2 text-nowrap"><button type="button" class="btn btn-outline-primary btn-sm" data-multipay-download="${cell}">Descargar ROP multipago</button>
					<button type="button" class="btn btn-primary btn-sm" data-multipay-pay="${cell}" aria-haspopup="dialog">Pagar ROP multipago</button></div>`;
			},
		});
	}

	function updateList() {
		account.current = null;
		syncList();
		syncResultSelection?.();
	}

	listButton.addEventListener('click', () => {
		searchView.hidden = true;
		listView.hidden = false;
		syncList();
		back.focus();
	});
	back.addEventListener('click', () => {
		listView.hidden = true;
		searchView.hidden = false;
		listButton.focus();
	});
	listed.addEventListener('click', event => {
		const button = event.target.closest('[data-multipay-remove]');
		if (!button) return;
		list.delete(button.dataset.multipayRemove);
		updateList();
		(listed.querySelector('[data-multipay-remove]') || back).focus();
	});
	clear.addEventListener('click', () => multipayConfirmation(clear, {
		title: 'Eliminar listado de obligaciones por pagar', label: 'Sí, eliminar',
		body: '<p>¿Deseas eliminar el listado actual de obligaciones por pagar?</p>',
		onConfirm({ modal, instance }) {
			list.clear();
			updateList();
			feedback.innerHTML = statusAlert('success', 'El listado de obligaciones por pagar se eliminó correctamente.');
			modal.addEventListener('hidden.bs.modal', () => back.focus(), { once: true });
			instance.hide();
		},
	}));
	generate.addEventListener('click', () => {
		const rows = [...list.values()];
		if (rows.length < 2 || account.current) return;
		const total = multipayTotal(rows);
		multipayConfirmation(generate, {
			title: 'Confirmación de pago', label: 'Sí, continuar',
			body: `<p>Este es el valor total a pagar:</p><p class="h5">$${billingAmount.format(total)}</p><p>¿Deseas continuar con la generación del ROP multipago?</p>`,
			onConfirm({ modal, instance, confirm }) {
				const rop = { id: `ROP-MP-${String(active.length + 1).padStart(4, '0')}`, total, references: rows.map(row => row.reference) };
				runBillingDownload(confirm, modal.querySelector('[data-multipay-modal-status]'), {
					loading: 'Generando ROP multipago…',
					error: 'No fue posible generar el ROP multipago. Intenta nuevamente.',
					download() {
						downloadMultipayRop(rop);
						active.unshift(rop);
						account.current = rop;
						syncList();
						syncActive();
						feedback.innerHTML = statusAlert('success', '<strong class="d-block">ROP multipago generado</strong>El ROP multipago se ha generado exitosamente.');
						modal.addEventListener('hidden.bs.modal', () => payCurrent.focus(), { once: true });
						instance.hide();
					},
				});
			},
		});
	});
	payCurrent.addEventListener('click', () => confirmMultipayPayment(account.current, payCurrent));
	activeTarget.addEventListener('click', event => {
		const button = event.target.closest('[data-multipay-download], [data-multipay-pay]');
		if (!button) return;
		const rop = active.find(item => item.id === (button.dataset.multipayDownload || button.dataset.multipayPay));
		if (!rop) return;
		if (button.dataset.multipayPay) confirmMultipayPayment(rop, button);
		else runBillingDownload(button, feedback, {
			loading: 'Descargando ROP multipago…', success: 'El ROP multipago se descargó correctamente.',
			error: 'No fue posible descargar el ROP multipago. Intenta nuevamente.',
			download: () => downloadMultipayRop(rop),
		});
	});
	syncList();
	syncActive();

	mountTaxpayerQuery('multipay-search', multipayPendingRows, (target, rows, query) => {
		const selection = new Set();
		target.insertAdjacentHTML('beforeend', `<div data-multipay-results>
			<p class="small text-secondary">Selecciona mínimo dos obligaciones para continuar.</p><div data-multipay-add-status aria-live="polite"></div>
			<div data-multipay-table></div></div>`);
		const results = target.lastElementChild;
		const status = results.querySelector('[data-multipay-add-status]');
		const bar = mountSelectionActionBar(results, {
			singular: 'obligación seleccionada', plural: 'obligaciones seleccionadas',
			primaryLabel: 'Agregar obligaciones al listado',
			onClear() {
				clearSelection();
				results.querySelector('input[type="search"]')?.focus();
			},
			onPrimary: addSelection,
		});
		syncResultSelection = () => {
			const candidates = [...selection].filter(reference => !list.has(reference));
			bar.update({
				count: selection.size,
				totalText: selection.size ? 'Total seleccionado: $' + billingAmount.format(multipayTotal(rows.filter(row => selection.has(row.reference)))) : '',
				infoText: candidates.length < 2 ? 'Selecciona mínimo dos obligaciones que aún no estén en el listado.' : '',
				disabled: candidates.length < 2,
			});
		};
		renderMultipayObligations(results.querySelector('[data-multipay-table]'), rows, {
			title: 'Obligaciones pendientes', objectLabel: query.tax === 'predial' ? 'CHIP' : 'Placa', checkbox: true, selection,
		});
		results.addEventListener('change', event => {
			if (!event.target.matches('[data-multipay-select]')) return;
			const reference = event.target.dataset.multipaySelect;
			if (event.target.checked) selection.add(reference);
			else selection.delete(reference);
			syncResultSelection();
			status.replaceChildren();
		});
		function clearSelection() {
			selection.clear();
			results.querySelectorAll('[data-multipay-select]').forEach(input => { input.checked = false; });
			syncResultSelection();
		}
		function addSelection() {
			const outcome = addMultipayObligations(list, rows.filter(row => selection.has(row.reference)));
			if (outcome === 'limit') {
				status.innerHTML = statusAlert('warning', 'Has alcanzado el máximo de 50 obligaciones permitidas por listado.');
			} else if (outcome === 'minimum') {
				status.innerHTML = statusAlert('warning', 'Selecciona mínimo dos obligaciones que aún no estén en el listado.');
			} else {
				clearSelection();
				updateList();
				status.innerHTML = statusAlert('success', '<strong class="d-block">Obligaciones agregadas</strong>Las obligaciones seleccionadas fueron agregadas al listado de obligaciones por pagar.');
				listButton.focus();
			}
		}
	}, {
		objectFilters: multipayObjectFilters,
		emptyMessage: 'No se encontraron obligaciones pendientes con los criterios de búsqueda seleccionados.',
		errorMessage: 'No fue posible consultar las obligaciones. Intenta nuevamente.',
	});
}
