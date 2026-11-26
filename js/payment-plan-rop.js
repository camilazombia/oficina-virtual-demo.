const paymentPlanRopTitle = 'ROP Facilidades de pago';
const paymentPlanRecalculation = 'Cuota en recálculo.<br>Intenta más tarde.';
const paymentPlanUnavailable = 'El valor de esta cuota está en proceso de recálculo. Intenta generar el ROP más adelante.';
const paymentPlanCop = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
const paymentPlanAmount = amount => '$' + paymentPlanCop.format(amount);

function paymentPlanDate(date) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) return 'No disponible';
	const parsed = new Date(date + 'T00:00:00Z');
	if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return 'No disponible';
	return date.split('-').reverse().join('/');
}

// Servicio simulado. La sesión del prototipo solo da acceso a sus propios datos de prueba.
function createPaymentPlanRopDemo(session, scenario) {
	const owner = 'demo-contribuyente';
	const examples = [
		['01', 550000, '2026-01-01', ['001'], 'available', true],
		['02', 550000, '2026-02-01', ['002'], 'available', true],
		['03', 1250000, '2026-03-01', ['003', '004', '005'], 'available', true],
		['04', 550000, '2026-04-01', ['006'], 'available', true],
		['05', null, '2026-07-01', ['007'], 'recalculating', true],
		['06', 550000, '2026-08-01', ['008'], 'paid', true],
		['01', 550000, '2025-12-01', ['009'], 'available', false],
	].map(([number, amount, due, obligations, status, current], index) => ({
		id: String(index), owner, reference: 'FP-2025-001234', number, total: 6, amount, due, obligations, status, current,
	}));
	const wait = () => new Promise(resolve => setTimeout(resolve, 250));
	let queryFailed = false;
	let generationFailed = false;
	let consulted = false;
	const authorized = () => session === taxpayerSession && Boolean(session);
	const visible = () => examples.filter(row => row.owner === session.id && row.current && row.status !== 'paid');
	return {
		async list() {
			await wait();
			if (!authorized()) throw new Error('Sesión no disponible');
			if (scenario === 'rop-error-consulta' && !queryFailed) {
				queryFailed = true;
				throw new Error('Consulta simulada');
			}
			if (consulted && scenario === 'rop-recalculo') {
				Object.assign(examples[4], { status: 'available', amount: 550000 });
			}
			consulted = true;
			return scenario === 'rop-vacio' ? [] : visible().map(row => ({ ...row }));
		},
		async generate(id, requested) {
			await wait();
			if (!authorized()) throw new Error('Sesión no disponible');
			const row = visible().find(candidate => candidate.id === id);
			if (!row) return { unavailable: 'La cuota ya no está disponible.' };
			if (row.status === 'recalculating') return { unavailable: paymentPlanUnavailable };
			if (!paymentPlanReady(row)) throw new Error('Información de cuota incompleta');
			const fail = !generationFailed && ['rop-error-generacion', 'rop-error-parcial'].includes(scenario);
			if (fail) generationFailed = true;
			const documents = [];
			requested.forEach((obligation, index) => {
				if (!row.obligations.includes(obligation)) return;
				if (fail && (scenario === 'rop-error-generacion' || index === requested.length - 1)) return;
				const blob = createLocalPdf([
					'Recibo Oficial de Pago (ROP) - PRUEBA',
					'Documento sin validez oficial. No usar para pagar.',
					'Facilidad de pago: ' + row.reference,
					'Cuota: ' + row.number,
					'Obligacion: ' + obligation,
					'Vencimiento de la cuota: ' + paymentPlanDate(row.due),
				]);
				documents.push({ obligation, blob, filename: 'rop-prueba-' + row.reference + '-' + row.number + '-' + obligation + '.pdf' });
			});
			return { documents };
		},
	};
}

function paymentPlanReady(row) {
	return row.status === 'available' && Number.isFinite(row.amount) && row.obligations?.length > 0;
}

function renderPaymentPlanRop() {
	return pageTitle(paymentPlanRopTitle, 'Consulta las cuotas vigentes de tus facilidades de pago y genera el Recibo Oficial de Pago (ROP) para realizar el pago a través de los canales habilitados.')
		+ statusAlert('info', 'Solo se muestran las cuotas vigentes pendientes de pago. Las cuotas que ya pagaste no se incluyen en este listado.')
		+ section('Cuotas de facilidades de pago', '<p class="small text-secondary">Datos de prueba. Los recibos de este prototipo carecen de validez oficial.</p><div id="payment-plan-feedback" aria-live="polite"></div><div id="payment-plan-results" tabindex="-1"></div>');
}

function mountPaymentPlanRop(scenario) {
	const results = document.getElementById('payment-plan-results');
	const feedback = document.getElementById('payment-plan-feedback');
	const service = createPaymentPlanRopDemo(taxpayerSession, scenario);
	const view = {};
	let rows = [];
	async function load() {
		results.innerHTML = loadingState('Consultando facilidades de pago…');
		try {
			rows = await service.list();
			if (!results.isConnected) return;
			results.innerHTML = '';
			if (!rows.length) {
				results.innerHTML = emptyState('<strong class="d-block">No tienes cuotas pendientes de pago</strong>Actualmente no tienes cuotas vigentes pendientes de pago asociadas a tus facilidades de pago.');
				return;
			}
			renderQueryResults(results, {
				id: 'payment-plan-table', title: 'Cuotas vigentes pendientes de pago', view,
				headers: ['Referencia de facilidad de pago', 'N.º de cuota', 'Valor de la cuota', 'Fecha de vencimiento', 'Acciones'],
				rows: rows.map(row => [row.reference, row.number, row, row.due, row]),
				unsortable: [1, 4], alignRight: 2,
				sortValue: (cell, column) => column === 2 ? cell.amount ?? Infinity : cell,
				formatCell: paymentPlanCell,
			});
			if (rows.some(row => row.status === 'recalculating')) {
				results.insertAdjacentHTML('beforeend', '<button type="button" class="btn btn-outline-primary btn-sm" data-payment-plan-retry>Actualizar cuotas</button>');
			}
		} catch {
			results.innerHTML = errorState('<strong class="d-block">No fue posible consultar tus facilidades de pago</strong>Ocurrió un error al cargar la información. Inténtalo nuevamente.<div class="mt-2"><button type="button" class="btn btn-outline-primary btn-sm" data-payment-plan-retry>Reintentar</button></div>');
		}
	}
	results.addEventListener('click', event => {
		if (event.target.closest('[data-payment-plan-retry]')) {
			void load();
			results.focus();
		}
		const trigger = event.target.closest('[data-payment-plan-rop]');
		if (!trigger) return;
		const row = rows.find(item => item.id === trigger.dataset.paymentPlanRop);
		if (row && paymentPlanReady(row)) showPaymentPlanRopModal(row, trigger, service, feedback, load);
	});
	void load();
}

function paymentPlanCell(cell, column) {
	if (column === 2) {
		if (cell.status === 'recalculating') return tableBadge('En recálculo', 'info');
		return Number.isFinite(cell.amount) ? paymentPlanAmount(cell.amount) : 'No disponible';
	}
	if (column === 3) return paymentPlanDate(cell);
	if (column !== 4) return cell;
	const label = 'Descargar ROP';
	const style = 'btn btn-outline-primary btn-sm px-3 text-nowrap';
	if (paymentPlanReady(cell)) {
		return '<button type="button" class="' + style + '" data-payment-plan-rop="' + cell.id + '" aria-haspopup="dialog" aria-label="' + label + ' de la cuota ' + cell.number + ' de ' + cell.reference + '">' + label + '</button>';
	}
	const reason = cell.status === 'recalculating' ? paymentPlanRecalculation : 'No fue posible confirmar la información de esta cuota.';
	const reasonId = 'payment-plan-reason-' + cell.id;
	return '<button type="button" class="' + style + '" aria-describedby="' + reasonId + '" disabled>' + label + '</button>'
		+ '<p id="' + reasonId + '" class="table-action-description small text-secondary mt-1 mb-0">' + reason + '</p>';
}

function showPaymentPlanRopModal(row, trigger, service, feedback, reload) {
	const multiple = row.obligations.length > 1;
	const title = multiple ? 'Generar Recibos Oficiales de Pago (ROP)' : 'Generar Recibo Oficial de Pago (ROP)';
	const description = multiple
		? 'Esta cuota tiene varias obligaciones asociadas. Se generará un Recibo Oficial de Pago (ROP) por cada obligación.'
		: 'Confirma si deseas generar el Recibo Oficial de Pago (ROP) correspondiente a esta cuota.';
	const summary = [
		['Referencia de facilidad de pago', row.reference],
		['Número de cuota', row.total ? Number(row.number) + ' de ' + row.total : row.number],
		[multiple ? 'Valor total de la cuota' : 'Valor de la cuota', paymentPlanAmount(row.amount)],
		['Fecha de vencimiento', paymentPlanDate(row.due)],
	];
	if (multiple) summary.push(['Recibos que se generarán', row.obligations.length]);
	const { modal, instance } = showDetailModal({
		title, titleId: 'payment-plan-modal-title', trigger,
		body: '<p>' + description + '</p><dl class="row mb-0">'
			+ summary.map(([label, value]) => '<dt class="col-sm-6">' + label + '</dt><dd class="col-sm-6">' + value + '</dd>').join('')
			+ '</dl><div data-payment-plan-status class="mt-3" aria-live="polite"></div>',
		actions: '<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button><button type="button" class="btn btn-primary" data-payment-plan-confirm disabled>Generar ROP</button>',
	});
	const confirm = modal.querySelector('[data-payment-plan-confirm]');
	const status = modal.querySelector('[data-payment-plan-status]');
	const generated = new Map();
	const delivered = new Set();
	let pending = false;
	let unavailable = false;
	const generationError = '<strong class="d-block">No fue posible generar el ROP</strong>Inténtalo nuevamente.';
	const downloadError = 'El ROP se generó correctamente, pero no fue posible descargarlo. Inténtalo nuevamente.';
	modal.addEventListener('shown.bs.modal', () => { confirm.disabled = false; }, { once: true });
	modal.addEventListener('hide.bs.modal', event => { if (pending) event.preventDefault(); });
	confirm.addEventListener('click', async () => {
		if (pending || unavailable) return;
		pending = true;
		confirm.disabled = true;
		modal.querySelectorAll('[data-bs-dismiss]').forEach(button => { button.disabled = true; });
		status.innerHTML = loadingState(multiple ? 'Generando Recibos Oficiales de Pago…' : 'Generando Recibo Oficial de Pago…');
		try {
			const remaining = row.obligations.filter(obligation => !generated.has(obligation));
			if (remaining.length) {
				const response = await service.generate(row.id, remaining);
				if (!feedback.isConnected) {
					pending = false;
					instance.hide();
					return;
				}
				if (response.unavailable) {
					unavailable = true;
					status.innerHTML = errorState(response.unavailable);
					modal.addEventListener('hidden.bs.modal', () => { void reload(); }, { once: true });
					return;
				}
				response.documents.forEach(document => generated.set(document.obligation, document));
			}

			for (const [obligation, document] of generated) {
				if (delivered.has(obligation)) continue;
				try {
					downloadLocalDocument(document.filename, document.blob);
					delivered.add(obligation);
				} catch {
					// Se conserva el PDF para reintentar la entrega sin regenerarlo.
				}
			}

			if (generated.size < row.obligations.length) {
				const partial = '<strong class="d-block">Algunos ROP no pudieron generarse</strong>Se generaron '
					+ generated.size + ' de ' + row.obligations.length + ' recibos. Intenta generar nuevamente los documentos pendientes.';
				status.innerHTML = errorState(generated.size ? partial : generationError);
				if (delivered.size < generated.size) status.insertAdjacentHTML('beforeend', errorState(downloadError));
				return;
			}
			if (delivered.size < generated.size) {
				status.innerHTML = errorState(downloadError);
				confirm.textContent = 'Reintentar descarga';
				return;
			}

			const message = multiple
				? '<strong class="d-block">ROP generados correctamente</strong>Se generaron correctamente los ' + generated.size + ' Recibos Oficiales de Pago (ROP). Consulta los documentos en las descargas de tu navegador.'
				: '<strong class="d-block">ROP generado correctamente</strong>Consulta el documento en las descargas de tu navegador.';
			feedback.innerHTML = statusAlert('success', message);
			if (multiple) {
				// Los navegadores pueden bloquear descargas automáticas adicionales sin notificar a la página.
				const alternatives = document.createElement('details');
				alternatives.className = 'mb-3';
				alternatives.innerHTML = '<summary>Descargar cada recibo por separado</summary>';
				for (const receipt of generated.values()) {
					const button = document.createElement('button');
					button.type = 'button';
					button.className = 'btn btn-outline-primary btn-sm me-2 mt-2';
					button.textContent = 'Descargar ROP ' + receipt.obligation;
					button.addEventListener('click', () => {
						try {
							downloadLocalDocument(receipt.filename, receipt.blob);
						} catch {
							alternatives.append(Object.assign(document.createElement('p'), { textContent: downloadError, role: 'alert' }));
						}
					});
					alternatives.append(button);
				}
				feedback.append(alternatives);
			}
			pending = false;
			instance.hide();
		} catch {
			status.innerHTML = errorState(generationError);
		} finally {
			pending = false;
			confirm.disabled = unavailable;
			modal.querySelectorAll('[data-bs-dismiss]').forEach(button => { button.disabled = false; });
		}
	});
}
