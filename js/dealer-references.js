const dealerRoute = {
	id: 'consulta-concesionarios',
	role: 'Concesionarios',
	label: 'Consulta de referencias de pago',
};

function renderDealerModule(root, demoState) {
	root.innerHTML = `<div data-dealer-module>
		${pageTitle(dealerRoute.label, 'Consulta las referencias de pago de vehículos según un rango de fechas y su estado de pago.')}
		<section class="bg-white border rounded-3 p-3 p-md-4 mb-4" aria-labelledby="dealer-form-title">
			<h2 class="visually-hidden" id="dealer-form-title">Criterios de consulta</h2>
			<form class="row g-3 align-items-start" aria-labelledby="dealer-form-title">
				<div class="col-12 col-md-6 col-xl-4" data-dealer-range>
					<span class="form-label d-block" id="dealer-range-label">Rango de fechas <span class="text-danger" aria-hidden="true">*</span></span>
					<button type="button" class="form-select text-start" data-range-toggle aria-labelledby="dealer-range-label dealer-range-value" aria-describedby="dealer-range-help dealer-range-error" aria-controls="dealer-range-calendar" aria-expanded="false"><span data-range-value id="dealer-range-value"></span></button>
					<div class="invalid-feedback" id="dealer-range-error" data-range-error role="alert"></div>
					<div class="form-text" id="dealer-range-help">Selecciona las fechas de generación de las referencias.</div>
					<div class="date-range-calendar border rounded-3 p-2 mt-2" data-range-calendar id="dealer-range-calendar" hidden>
						<div class="d-flex align-items-center justify-content-between gap-2 mb-2">
							<button type="button" class="btn btn-outline-secondary btn-sm" data-range-step="-1" aria-label="Mes anterior">‹</button>
							<span class="small fw-semibold text-capitalize" data-range-month aria-live="polite"></span>
							<button type="button" class="btn btn-outline-secondary btn-sm" data-range-step="1" aria-label="Mes siguiente">›</button>
						</div>
						<p class="small text-secondary mb-2" data-range-hint aria-live="polite"></p>
						<div class="date-range-days d-grid gap-1 text-center small text-secondary mb-1" aria-hidden="true">
							<span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sá</span><span>Do</span>
						</div>
						<div class="date-range-days d-grid gap-1" data-range-days role="group" aria-label="Días del mes"></div>
						<button type="button" class="btn btn-link btn-sm mt-2" data-range-clear>Limpiar rango</button>
					</div>
				</div>
				<fieldset class="col-12 col-md-6 col-xl-auto">
					<legend class="float-none w-auto fs-6 form-label">Estado de la referencia <span class="text-danger" aria-hidden="true">*</span></legend>
					<div class="d-flex flex-wrap align-items-center gap-3 py-2">
						<div class="form-check mb-0"><input class="form-check-input" type="radio" name="referenceStatus" value="paid" id="dealer-paid" required><label class="form-check-label" for="dealer-paid">Pagadas</label></div>
						<div class="form-check mb-0"><input class="form-check-input" type="radio" name="referenceStatus" value="unpaid" id="dealer-unpaid" required><label class="form-check-label" for="dealer-unpaid">No pagadas</label></div>
					</div>
				</fieldset>
				<div class="col-12 col-xl d-flex flex-wrap justify-content-end gap-2 mt-xl-5">
					<button type="reset" class="btn btn-outline-secondary">Limpiar</button>
					<button type="submit" class="btn btn-primary" disabled>Consultar</button>
				</div>
			</form>
			<div class="mt-4" data-dealer-result></div>
		</section>
	</div>`;

	const form = root.querySelector('form');
	const submit = form.querySelector('[type="submit"]');
	const target = root.querySelector('[data-dealer-result]');
	const status = form.elements.referenceStatus;
	const money = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
	let pending = false;
	let revision = 0;
	let simulateError = demoState === 'error';
	const range = bindDateRangePicker(form.querySelector('[data-dealer-range]'), criteriaChanged);

	function initial() {
		target.innerHTML = emptyState('<strong class="d-block">Consulta las referencias de pago</strong>Selecciona un rango de fechas y el estado de las referencias que deseas consultar.');
	}

	function updateSubmit() {
		submit.disabled = pending || !range.value.end || !status.value;
	}

	function criteriaChanged() {
		revision++;
		initial();
		updateSubmit();
	}

	form.addEventListener('change', criteriaChanged);
	form.addEventListener('reset', () => queueMicrotask(() => {
		if (form.isConnected) range.reset();
	}));
	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		if (submit.disabled) return;
		const criteria = { ...range.value, paid: status.value === 'paid' };
		const callRevision = revision;
		const shouldFail = simulateError;
		simulateError = false;
		pending = true;
		updateSubmit();
		target.innerHTML = loadingState('Consultando referencias de pago…');
		try {
			const rows = await dealerService.query(criteria, { simulateError: shouldFail });
			if (revision !== callRevision || !form.isConnected) return;
			target.innerHTML = `<p class="small text-secondary mb-2">Fecha de generación · ${formatQueryDate(criteria.start)} – ${formatQueryDate(criteria.end)} · ${criteria.paid ? 'Pagadas' : 'No pagadas'}</p>`;
			if (!rows.length) {
				target.insertAdjacentHTML('beforeend', emptyState('<strong class="d-block">No se encontraron referencias de pago</strong>No encontramos referencias que coincidan con los criterios seleccionados. Modifica el rango de fechas o el estado e inténtalo nuevamente.'));
				return;
			}
			renderQueryResults(target, {
				id: 'dealer-references',
				title: 'Referencias de pago',
				description: rows.length === 1 ? 'Se encontró 1 referencia de pago.' : `Se encontraron ${rows.length} referencias de pago.`,
				headingLevel: 'h2',
				headers: ['Referencia', 'Placa', 'Vigencia', 'Vencimiento', 'Estado de la referencia', 'Valor de la referencia'],
				rows,
				alignRight: 5,
				sortValue: (cell, index) => index === 3 ? Date.parse(cell) : cell,
				formatCell(cell, index) {
					if (index === 3) return agentEscape(formatQueryDate(cell));
					if (index === 4) return tableBadge(agentEscape(cell), cell === 'Pagada' ? 'success' : 'warning');
					if (index === 5) return `$${money.format(cell)}`;
					return agentEscape(cell);
				},
			});
		} catch {
			if (revision !== callRevision || !form.isConnected) return;
			target.innerHTML = errorState('<strong class="d-block">No pudimos realizar la consulta</strong>Ocurrió un error al consultar las referencias de pago. Inténtalo nuevamente.<div class="mt-2"><button class="btn btn-outline-primary btn-sm" type="button">Reintentar</button></div>');
			target.querySelector('button').addEventListener('click', () => {
				form.querySelector('[data-range-toggle]').focus();
				form.requestSubmit();
			});
		} finally {
			pending = false;
			updateSubmit();
		}
	});
	initial();
}
