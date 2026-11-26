const accountStatementTaxes = [
	{ id: 'vehiculos', label: 'Vehículos', columns: ['Placa', 'Marca'], search: 'Buscar por placa' },
	{ id: 'predial', label: 'Predial Unificado', columns: ['CHIP', 'Matrícula inmobiliaria'], search: 'Buscar por CHIP o matrícula inmobiliaria' },
	{ id: 'publicidad', label: 'Publicidad Exterior', columns: ['Número de resolución', 'Tipo de valla'], search: 'Buscar por número de resolución' },
	{ id: 'ica', label: 'ICA', columns: ['Tipo de identificación', 'Número de identificación'], search: 'Buscar por número de identificación', identityObject: true },
	{ id: 'reteica', label: 'RETEICA', columns: ['Tipo de identificación', 'Número de identificación'], search: 'Buscar por número de identificación', identityObject: true },
];
const accountStatementCop = new Intl.NumberFormat('es-CO');
const accountStatementAmount = amount => Number.isFinite(amount) ? '$' + accountStatementCop.format(amount) : 'No disponible';
const accountStatementDate = new Intl.DateTimeFormat('es-CO', {
	day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Bogota',
});
const accountStatementHtml = value => String(value ?? 'No disponible').replace(/[&<>"']/g, character =>
	({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]
);

function createAccountStatementDemo(session, identity, scenario) {
	const [firstPlate, secondPlate] = taxpayerHomeObjects.vehiculos;
	const vehicle = (plate, debt, credit) => {
		const brand = myVehicles.find(item => item.plate === plate)?.brand
			?? paymentHistoryExamples.vehiculos.rows.find(row => row[0] === plate)?.[2];
		return [[plate, brand], debt, credit];
	};
	const large = session?.id === 'demo-gran-contribuyente';
	const owner = session?.id;
	// Saldos simulados sobre objetos que ya existen en los catálogos del prototipo.
	const fleet = vehicles.slice(0, 32).map(({ plate, brand }, index) => [
		[plate, brand], index % 4 === 0 ? 248000 + index * 17000 : 0, index % 5 === 0 ? 31000 + index * 3000 : 0,
	]);
	const property = (chip, debt, credit) => {
		const record = paymentHistoryExamples.predial.rows.find(row => row[0] === chip);
		return [record.slice(0, 2), debt, credit];
	};
	const groups = {
		vehiculos: [
			vehicle(firstPlate, 1267000, 86000),
			...(large
				? [vehicle('FNX843', 0, 0), vehicle('DZS117', 125000, 0), ...fleet]
				: [vehicle(secondPlate, 0, 0)]),
		],
		predial: [
			[[taxpayerHomeObjects.predial, '050S40156590'], 0, 777000],
			property('AAA0000XPT0', 0, 0),
			...(large ? [
				property('AAA0001ASYN', 395000, 0),
				property('AAA0001AUJZ', 0, 125000),
				property('AAA0001EUOM', 820000, 64000),
				property('AAA0001EXAF', 1104000, 0),
			] : []),
		],
		...(large ? {
			ica: [[[identity.documentType, identity.documentNumber], 2918000, 0]],
			reteica: [[[identity.documentType, identity.documentNumber], 0, 10425000]],
		} : {}),
	};
	const publicity = publicityElementsFor(session);
	if (publicity.length) groups.publicidad = publicity.map(element => [
		[element.resolution, publicityTypeLabel(element)], element.debt, element.credit,
	]);
	const wait = () => new Promise(resolve => setTimeout(resolve, 220));
	let queryFailed = false;
	let reportFailed = false;
	function checkSession() {
		if (!owner || session !== taxpayerSession) throw new Error('Sesión no disponible');
	}
	function records(tax) {
		checkSession();
		if (!Object.hasOwn(groups, tax)) throw new Error('Impuesto no autorizado');
		if (scenario === 'cuenta-vacia' && tax === 'vehiculos') return [];
		return groups[tax].map(([fields, debt, credit], index) => ({ id: String(index), fields, debt, credit }));
	}
	return {
		async overview() {
			await wait();
			checkSession();
			return { identity, generatedAt: new Date(), interestRate: null, taxes: Object.keys(groups) };
		},
		async list(tax) {
			await wait();
			const rows = records(tax);
			if (scenario === 'cuenta-error-consulta' && !queryFailed) {
				queryFailed = true;
				throw new Error('Error de consulta simulado');
			}
			return { rows, complete: true };
		},
		async report(taxId, id, generatedAt) {
			await wait();
			const row = records(taxId).find(item => item.id === id);
			if (!row) throw new Error('Objeto no autorizado');
			const tax = accountStatementTaxes.find(item => item.id === taxId);
			if (scenario === 'cuenta-error-reporte' && !reportFailed) {
				reportFailed = true;
				throw new Error('Error de generación simulado');
			}
			return {
				filename: 'estado-de-cuenta-prueba-' + tax.id + '-' + String(row.fields[tax.identityObject ? 1 : 0]).replace(/[^a-z0-9]/gi, '') + '-' + row.id + '.pdf',
				blob: createLocalPdf([
					'Reporte de Estado de cuenta - PRUEBA',
					'Documento sin validez oficial',
					'Contribuyente: ' + identity.fullName,
					'Identificacion: ' + identity.documentType + ' ' + identity.documentNumber,
					'Fecha de generacion: ' + accountStatementDate.format(generatedAt),
					'Impuesto: ' + tax.label,
					...tax.columns.map((column, index) => column + ': ' + (row.fields[index] ?? 'No disponible')),
					'Deuda: ' + accountStatementAmount(row.debt),
					'Saldo a favor: ' + accountStatementAmount(row.credit),
				]),
			};
		},
	};
}

function renderAccountStatement() {
	return pageTitle('Estado de cuenta', 'Consulta tus deudas y saldos a favor asociados a los impuestos distritales y descarga los reportes de tu estado de cuenta.')
		+ '<div id="account-statement" tabindex="-1"></div>';
}

function accountStatementSummary(fields) {
	return '<dl class="row mb-0">'
		+ fields.map(([label, value]) => `<dt class="col-sm-4 col-md-3">${label}</dt><dd class="col-sm-8 col-md-9">${accountStatementHtml(value)}</dd>`).join('')
		+ '</dl>';
}

function accountStatementTabs(taxes, initialTax) {
	return '<div class="card border-0 shadow-sm registered-taxes">'
		+ '<div class="card-header bg-white px-3 px-md-4 pt-3 pb-0"><ul class="nav nav-tabs card-header-tabs gap-2" role="tablist" aria-label="Tipo de impuesto">'
		+ taxes.map(({ id, label }) => {
			const selected = id === initialTax;
			const tabId = 'account-' + id;
			return `<li class="nav-item" role="presentation"><button class="nav-link px-3 py-3 ${selected ? 'active' : ''}" id="${tabId}-tab" data-bs-toggle="tab" data-bs-target="#${tabId}-pane" type="button" role="tab" aria-controls="${tabId}-pane" aria-selected="${selected}" ${selected ? '' : 'tabindex="-1"'}>${label}</button></li>`;
		}).join('')
		+ '</ul></div><div class="card-body p-3 p-md-4 tab-content">'
		+ taxes.map(({ id }) => `<div class="tab-pane ${id === initialTax ? 'show active' : ''}" id="account-${id}-pane" role="tabpanel" aria-labelledby="account-${id}-tab" tabindex="0"></div>`).join('')
		+ '</div></div>';
}

function accountStatementQueryError() {
	return errorState('<strong class="d-block">No fue posible consultar tu estado de cuenta.</strong>Ocurrió un error al cargar la información. Inténtalo nuevamente.<div class="mt-2"><button class="btn btn-outline-primary btn-sm" type="button" data-account-retry>Reintentar</button></div>');
}

function mountAccountStatement(scenario) {
	const root = document.getElementById('account-statement');
	const session = taxpayerSession;
	if (!session) {
		root.innerHTML = emptyState('Selecciona un perfil de contribuyente para consultar tu estado de cuenta.');
		return;
	}
	const service = createAccountStatementDemo(session, getTaxpayerIdentity(), scenario);
	const tabStates = new Map();
	let overview;
	let selected;
	async function initialize() {
		root.innerHTML = loadingState('Consultando estado de cuenta…');
		try {
			overview = await service.overview();
			if (!root.isConnected) return;
			const { identity, generatedAt, interestRate } = overview;
			const taxes = accountStatementTaxes.filter(tax => overview.taxes.includes(tax.id));
			const preferredTax = new URLSearchParams(location.search).get('impuestoCuenta');
			const initialTax = taxes.find(tax => tax.id === preferredTax)?.id ?? taxes[0]?.id;
			root.innerHTML = section('Datos del contribuyente', accountStatementSummary([
				['Nombre o razón social', identity.fullName],
				['Tipo de identificación', identity.documentType],
				['Número de identificación', identity.documentNumber],
				['Fecha de generación', accountStatementDate.format(generatedAt)],
				['Tasa de interés', interestRate],
			])) + (taxes.length ? accountStatementTabs(taxes, initialTax) : emptyState('No tienes impuestos asociados para esta consulta.'));
			for (const tax of taxes) {
				const tab = root.querySelector('#account-' + tax.id + '-tab');
				const pane = root.querySelector('#account-' + tax.id + '-pane');
				const state = { tax, pane, view: {}, reports: new Map(), pending: new Set(), feedback: '' };
				tabStates.set(tax.id, state);
				bootstrap.Tab.getOrCreateInstance(tab);
				tab.addEventListener('shown.bs.tab', () => select(state));
			}
			if (initialTax) select(tabStates.get(initialTax));
		} catch {
			if (root.isConnected) root.innerHTML = accountStatementQueryError();
		}
	}
	async function select(state) {
		if (selected && selected !== state) selected.pane.replaceChildren();
		selected = state;
		if (!state.data) {
			state.pane.innerHTML = loadingState('Consultando ' + state.tax.label + '…');
			state.request ??= service.list(state.tax.id).finally(() => { state.request = null; });
			try {
				state.data = await state.request;
			} catch {
				if (root.isConnected && selected === state) state.pane.innerHTML = accountStatementQueryError();
				return;
			}
		}
		if (root.isConnected && selected === state) renderResults(state);
	}
	function renderResults(state) {
		const { tax, pane, data, view } = state;
		const { rows, totals, complete } = data;
		if (!rows.length) {
			pane.innerHTML = emptyState('<strong class="d-block">No tienes registros asociados a este impuesto.</strong>Actualmente no se encontraron registros de estado de cuenta para este impuesto.');
			return;
		}
		const financial = ['debt', 'credit'].map(key => {
			if (Number.isFinite(totals?.[key])) return totals[key];
			return complete && rows.every(row => Number.isFinite(row[key]))
				? rows.reduce((total, row) => total + row[key], 0) : null;
		});
		pane.innerHTML = (financial.some(Number.isFinite)
			? section('Resumen del impuesto', accountStatementSummary([
				['Deuda total', accountStatementAmount(financial[0])],
				['Saldo a favor', accountStatementAmount(financial[1])],
			])) : '') + '<div data-account-feedback aria-live="polite">' + state.feedback + '</div>';
		pane.insertAdjacentHTML('beforeend', '<div data-account-results></div>');
		const debtColumn = tax.columns.length;
		renderQueryResults(pane.querySelector('[data-account-results]'), {
			id: 'account-results-' + tax.id, title: 'Objetos tributarios', headingLevel: 'h2', view,
			headers: [...tax.columns, 'Deuda', 'Saldo a favor', 'Acciones'],
			rows: rows.map(row => [...row.fields, row.debt, row.credit, row]),
			alignRight: [debtColumn, debtColumn + 1], unsortable: [debtColumn + 2],
			tableClass: 'text-nowrap',
			searchPlaceholder: tax.search,
			noMatches: '<strong class="d-block">No encontramos resultados.</strong>Verifica la información ingresada o modifica tu búsqueda.',
			sortValue: (cell, column) => column >= debtColumn ? cell ?? -Infinity : cell,
			formatCell: (cell, column) => {
				if (tax.id === 'publicidad' && column === 0) {
					return `<a href="?origenPublicidad=cuenta#objeto-publicidad-${encodeURIComponent(cell)}">${accountStatementHtml(cell)}</a>`;
				}
				if (tax.identityObject && column === 1) {
					return `<a href="#objeto-${tax.id}-${encodeURIComponent(cell)}">${accountStatementHtml(cell)}</a>`;
				}
				if (column < debtColumn) return accountStatementHtml(cell);
				if (column < debtColumn + 2) return accountStatementAmount(cell);
				const busy = state.pending.has(cell.id);
				const identifier = accountStatementHtml(tax.identityObject ? cell.fields.join(' ') : cell.fields[0]);
				return `<button class="btn btn-outline-primary btn-sm px-3 text-nowrap" type="button" data-table-action="Descargar" data-account-report="${cell.id}" aria-label="Descargar reporte de ${identifier}" ${busy ? 'disabled aria-busy="true"' : ''}>${accountStatementReportLabel(busy)}</button>`;
			},
		});
	}
	async function download(state, id) {
		if (state.pending.has(id)) return;
		state.pending.add(id);
		const updateButton = busy => {
			const button = state.pane.querySelector('[data-account-report="' + id + '"]');
			if (!button) return;
			button.disabled = busy;
			button.setAttribute('aria-busy', String(busy));
			button.innerHTML = accountStatementReportLabel(busy);
		};
		updateButton(true);
		let report = state.reports.get(id);
		try {
			if (!report) {
				report = await service.report(state.tax.id, id, overview.generatedAt);
				state.reports.set(id, report);
			}
			if (!root.isConnected || session !== taxpayerSession) return;
			downloadLocalDocument(report.filename, report.blob);
			state.reports.delete(id);
			state.feedback = statusAlert('success', '<strong class="d-block">Reporte generado correctamente.</strong>Consulta el documento en las descargas de tu navegador.');
		} catch {
			state.feedback = errorState('<strong class="d-block">No fue posible ' + (report ? 'descargar' : 'generar') + ' el reporte.</strong>Inténtalo nuevamente.');
		} finally {
			state.pending.delete(id);
			updateButton(false);
			const feedback = state.pane.querySelector('[data-account-feedback]');
			if (feedback) feedback.innerHTML = state.feedback;
		}
	}
	root.addEventListener('click', event => {
		const retry = event.target.closest('[data-account-retry]');
		if (retry) {
			if (selected) {
				void select(selected);
				selected.pane.focus();
			} else {
				void initialize();
				root.focus();
			}
			return;
		}
		const action = event.target.closest('[data-account-report]');
		if (action && selected) void download(selected, action.dataset.accountReport);
	});
	void initialize();
}

function accountStatementReportLabel(busy) {
	return busy
		? '<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>Generando reporte…'
		: '<i class="bi bi-download me-1" aria-hidden="true"></i>Descargar reporte';
}
