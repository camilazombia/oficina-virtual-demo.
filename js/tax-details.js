const taxDetailNumbers = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const taxDetailCurrency = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0, useGrouping: 'always' });
const detailMoney = amount => '$' + taxDetailCurrency.format(amount);
const detailUnit = (amount, unit) => taxDetailNumbers.format(amount) + ' ' + unit;
const detailValue = value => icaEscape(value == null || value === '' || value === '—' ? 'Sin información' : value);

function taxDetailGroup(title, fields, columns = 'col-12 col-sm-6 col-xl-3') {
	return section(title, `<dl class="row g-3 mb-0">${fields.map(([label, value, options = {}]) =>
		`<div class="${options.columns ?? columns}"><dt class="small text-secondary fw-semibold">${label}</dt><dd class="mb-0 text-break${options.emphasis ? ' fw-semibold fs-5' : ''}">${detailValue(value)}</dd></div>`).join('')}</dl>`);
}

function taxDetailRecords(title, headers, rows, message, { alwaysTable = false, alignRight = [] } = {}) {
	if (!rows.length) return section(title, emptyState(message));
	if (rows.length === 1 && !alwaysTable) return taxDetailGroup(title, headers.map((label, index) => [label, rows[0][index]]));
	return section(title, tableFrame(
		headers.map((label, index) => `<th scope="col" class="${alignRight.includes(index) ? 'text-end' : ''}">${label}</th>`).join(''),
		rows.map(row => `<tr>${row.map((value, index) => `<td class="${alignRight.includes(index) ? 'text-end text-nowrap' : ''}">${detailValue(value)}</td>`).join('')}</tr>`).join(''),
		{ label: title, paginationManaged: true },
	));
}

function taxDetailUrl(route, tab) {
	return (tab ? '?' + new URLSearchParams({ detalleRit: tab }) : '') + '#' + route;
}

function taxDetailHeader({ title, identification, list, backLabel, tax, object, declaration, overdue = false, account = false }) {
	const year = currentTaxYear();
	const source = new URLSearchParams(location.search).get('detalleRit');
	const back = source ? '?' + new URLSearchParams({ tab: source }) + '#rit-impuestos'
		: account ? '?' + new URLSearchParams({ impuestoCuenta: tax }) + '#obligaciones-cuenta' : '#' + list;
	const canInvoice = Boolean(findTaxDetailInvoice(tax, object));
	const showInvoiceExplanation = !canInvoice;
	const explanation = (id, message) => `<small class="d-block text-secondary mt-1" id="${id}">${message}</small>`;
	const downloadLabel = '<i class="bi bi-download me-2" aria-hidden="true"></i>Descargar factura vigencia actual';
	const declareLabel = 'Generar declaración / Corrección vigencia actual';
	return `<a class="btn btn-outline-secondary btn-sm mb-3" href="${back}"><i class="bi bi-arrow-left me-2" aria-hidden="true"></i>${source ? 'Volver a Gestionar mis impuestos' : backLabel}</a>
		${pageTitle(title, identification + ' · Vigencia ' + year)}
		<div class="d-flex flex-wrap align-items-start gap-3 mb-4" aria-label="Acciones de la vigencia actual">
			<div><button class="btn btn-outline-primary" type="button" data-tax-detail-invoice="${tax}" data-tax-detail-object="${icaEscape(object)}" ${canInvoice ? '' : 'disabled'}${showInvoiceExplanation ? ' aria-describedby="tax-detail-invoice-info"' : ''}>${downloadLabel}</button>
			${showInvoiceExplanation ? explanation('tax-detail-invoice-info', 'Factura no disponible.') : ''}</div>
			<div>${declaration
				? `<a class="btn btn-primary" href="${declaration}">${declareLabel}</a>`
				: `<button class="btn btn-primary" type="button" disabled aria-describedby="tax-detail-declaration-info">${declareLabel}</button>
					${explanation('tax-detail-declaration-info', overdue ? 'Consulta el aviso de factura vencida.' : 'Declaración no disponible para este objeto.')}`}</div>
		</div><div id="tax-detail-feedback" aria-live="polite"></div>`;
}

function findTaxDetailInvoice(tax, object) {
	const year = currentTaxYear();
	return taxpayerCanConsult(taxpayerSession, tax, object)
		? invoiceExamples.find(invoice => invoice.tax === tax && invoice.object === object && invoice.year === year)
		: undefined;
}

document.addEventListener('click', event => {
	const button = event.target.closest('[data-tax-detail-invoice]:enabled');
	if (!button) return;
	const session = taxpayerSession;
	const status = document.getElementById('tax-detail-feedback');
	const lookup = () => findTaxDetailInvoice(button.dataset.taxDetailInvoice, button.dataset.taxDetailObject);
	if (!lookup()) {
		status.innerHTML = errorState('La factura no está disponible para la vigencia actual.');
		return;
	}
	runBillingDownload(button, status, {
		loading: 'Generando factura…', success: 'La factura se generó correctamente. Consulta las descargas de tu navegador.',
		error: 'No fue posible descargar la factura. Inténtalo nuevamente.',
		download() {
			const invoice = lookup();
			if (!invoice || taxpayerSession !== session) throw new Error('Factura no disponible');
			downloadTaxpayerInvoice(invoice, session);
		},
	});
});

// Atributos de demostración para los objetos existentes en los catálogos del prototipo.
function renderPredialObjectDetail(chip) {
	const record = taxpayerPredialRows.find(row => row[0] === chip);
	if (!record || !taxpayerCanConsult(taxpayerSession, 'predial', chip)) {
		return pageTitle('Detalle del predio') + emptyState(unavailableTaxpayerObject);
	}
	const [object, registration, address, contract] = record;
	const home = object === taxpayerHomeObjects.predial;
	const garage = object === 'AAA0000XPT0';
	const value = home ? 600741000 : garage ? 12736000 : null;
	const base = value == null ? null : detailMoney(value);
	const identity = getTaxpayerIdentity();
	const owners = home ? [[identity.documentType, identity.fullName, detailUnit(100, '%'),
		identity.documentNumber, 'Usufructuario', null]] : [];
	const marks = garage ? [['Conservación', 'Informativa', detailUnit(0, '%'), detailMoney(0), 'Sí']] : [];
	return `<div id="predialDetail">${taxDetailHeader({
		title: 'Detalle del predio', identification: 'CHIP ' + icaEscape(object), list: 'impuestos-predial', backLabel: 'Volver a mis predios',
		tax: 'predial', object, declaration: home ? declarationUrl({ tax: 'predial', year }, object) : null,
	})}
	${taxDetailGroup('Información general', [['CHIP', object], ['Matrícula inmobiliaria', registration], ['Dirección del predio', address], ['No. contrato de arrendamiento', contract]])}
	${taxDetailRecords('Datos jurídicos', ['Tipo de documento', 'Nombre completo', 'Porcentaje de propiedad', 'Número de documento', 'Calidad de sujeción', 'Otros'], owners, 'No se encontraron datos jurídicos asociados.')}
	${taxDetailGroup('Datos económicos', [['Base gravable', base], ['Avalúo catastral', base],
		['Avalúo contrato de arrendamiento', value == null ? null : detailMoney(0)], ['Avalúo mejora de construcción', value == null ? null : detailMoney(0)]])}
	${taxDetailGroup('Datos físicos', [['Área construida catastro', value == null ? null : detailUnit(garage ? 12.5 : 84.6, 'm²')],
		['Área terreno catastro', value == null ? null : detailUnit(garage ? 3.4 : 127.2, 'm²')], ['Código de estrato', value == null ? null : 'E3'],
		...['Área terreno mejora contribuyente', 'Área terreno matriz mejora', 'Área terreno mejora catastro'].map(label => [label, value == null ? null : detailUnit(0, 'm²')])], 'col-12 col-sm-6 col-xl-4')}
	${value == null ? section('Liquidación', emptyState('No hay liquidaciones disponibles.')) : taxDetailGroup('Liquidación', [['Base gravable', base],
		['Destino hacendario', garage ? 'Depósitos y parqueaderos' : 'Residencial'], ['Tarifa de liquidación', detailUnit(garage ? 8 : 9.5, '‰')],
		['Valor del impuesto', detailMoney(garage ? 101888 : 5707000), { emphasis: true }]])}
	${taxDetailRecords('Marcas', ['Marca', 'Tipo de marca', 'Porcentaje de marca', 'Valor de exención', 'Conservación histórica'],
		marks, 'No se registran marcas asociadas a este predio.', { alwaysTable: true, alignRight: [2, 3] })}</div>`;
}

function taxVehicleCatalog() {
	const known = [...myVehicles, ...vehicles];
	const extra = paymentHistoryExamples.vehiculos.rows.filter(([plate]) => !known.some(vehicle => vehicle.plate === plate))
		.map(([plate, year, brand, line]) => ({ plate, year, brand, line }));
	return [...known, ...extra];
}

function renderVehicleDetail(plate) {
	if (!taxpayerCanConsult(taxpayerSession, 'vehiculos', plate)) return pageTitle('Detalle del vehículo') + emptyState(unavailableTaxpayerObject);
	const vehicle = taxVehicleCatalog().find(item => item.plate === plate);
	if (!vehicle) return pageTitle('Detalle del vehículo') + emptyState('No se encontró el vehículo solicitado.');
	const { brand, line, year, className, body, doors, armored, engine, hasOverdueInvoice } = vehicle;
	const motorcycle = className === 'Motocicleta';
	const date = ({ BMM36: '25/03/2014', JWT71D: '14/06/2022', MCU235: '01/01/2025' })[plate];
	const juridical = date ? [['Propietario', detailUnit(plate === 'MCU235' ? 60 : 100, '%'), date, '31/12/9999']] : [];
	if (plate === 'MCU235') juridical.push(['Copropietario', detailUnit(40, '%'), date, '31/12/9999']);
	const marks = plate === 'MCU235' ? [['VEH-01', 'Marca informativa', detailUnit(0, '%'), detailMoney(0), date, null]] : [];
	const values = ({ BMM36: [1694000, 1610000, 1530000, 1460000, 1390000],
		JWT71D: [26108000, 24817000, 23590000, 21490000, 19280000], MCU235: [48500000] })[plate] ?? [];
	const history = values.map((amount, index) => [String(2026 - index), detailMoney(amount), detailUnit(plate === 'MCU235' || index === 4 ? 1.5 : 1.7, '%')]);
	const declaration = !hasOverdueInvoice ? taxObjectDeclarationUrl('vehiculos', plate) : null;
	return taxDetailHeader({ title: 'Detalle del vehículo', identification: 'Placa ' + icaEscape(plate),
		list: 'impuestos-vehiculos', backLabel: 'Volver a mis vehículos', tax: 'vehiculos', object: plate, declaration, overdue: hasOverdueInvoice })
		+ (hasOverdueInvoice ? `<div class="alert alert-warning d-flex flex-wrap align-items-center justify-content-between gap-3" role="note">
			<p class="mb-0"><i class="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>Tienes una factura vencida para este periodo. Genera un Recibo Oficial de Pago (ROP) para pagarla.</p>
			<button class="btn btn-outline-dark btn-sm" type="button" data-vehicle-overdue-alert="${plate}">Ver aviso</button></div>` : '')
		+ taxDetailGroup('Información general', [['Placa', plate], ['Marca', brand], ['Línea', line], ['Modelo', year], ['Clase', className],
			['Carrocería', body], ['Número de puertas', doors], ['Blindaje', armored], ['Cilindraje', engine]])
		+ taxDetailGroup('Datos adicionales del vehículo', [['Servicio (ID)', date ? 'Particular (1)' : null], ['Estado (ID)', date ? 'Activo (1)' : null],
			['Watts', plate === 'MCU235' ? 0 : null], ['Clásico o antiguo', motorcycle ? 'No aplica' : date ? 'No' : null],
			['Tipo de vehículo', motorcycle ? 'Motos y motocicletas' : className], ['Capacidad de pasajeros', date ? motorcycle ? 2 : 5 : null],
			['Capacidad de toneladas', date ? 0 : null], ['Fecha de estado', date], ['Fecha de cambio de servicio', null]])
		+ taxDetailRecords('Datos jurídicos', ['Calidad del sujeto', 'Porcentaje de propiedad', 'Fecha desde', 'Fecha hasta'], juridical,
			'No se encontraron datos jurídicos asociados.', { alignRight: [1] })
		+ taxDetailRecords('Marcas', ['Código de marca', 'Descripción', 'Porcentaje de exención', 'Valor de exención', 'Fecha desde', 'Fecha hasta'],
			marks, 'No se registran marcas asociadas a este vehículo.', { alwaysTable: true, alignRight: [2, 3] })
		+ taxDetailRecords('Liquidación', ['Año', 'Avalúo', 'Tarifa'], history, 'No hay liquidaciones disponibles.', { alignRight: [1, 2] });
}

const taxDetailDeclarationNames = { vehiculos: 'Impuesto de Vehículos', ica: 'ICA', publicidad: 'Publicidad Exterior' };

function taxObjectDeclarationUrl(tax, object) {
	const params = new URLSearchParams({ impuesto: taxDetailDeclarationNames[tax], objeto: object, vigencia: currentTaxYear() });
	const origin = new URLSearchParams(location.search);
	if (origin.has('detalleRit')) params.set('detalleRit', origin.get('detalleRit'));
	if (tax === 'publicidad' && origin.get('origenPublicidad') === 'cuenta') params.set('origenPublicidad', 'cuenta');
	return '?' + params + '#declaraciones-generar';
}

function taxObjectDeclarationContext(params) {
	const object = params.get('objeto');
	const tax = Object.keys(taxDetailDeclarationNames).find(key => taxDetailDeclarationNames[key] === params.get('impuesto'));
	if (!object || params.get('vigencia') !== currentTaxYear()) return null;
	if (tax === 'vehiculos' && taxpayerCanConsult(taxpayerSession, tax, object) && !taxVehicleCatalog().find(item => item.plate === object)?.hasOverdueInvoice) return { tax, object, label: 'Placa' };
	if (tax === 'ica' && taxpayerSession && getTaxpayerIdentity().documentNumber === object) return { tax, object, label: 'Número de identificación' };
	if (tax === 'publicidad') {
		const element = publicityElementsFor(taxpayerSession).find(item => item.resolution === object);
		if (element) return { tax, object, label: 'Número de resolución', notifiedOn: element.notifiedOn };
	}
	return null;
}
function linkToTaxDetail(route, tab) {
	return `<a class="btn btn-outline-primary btn-sm px-3 text-nowrap" href="${taxDetailUrl(route, tab)}">Ver detalle</a>`;
}

function taxObjectRouteDetails(id, label, inRit = false) {
	const source = new URLSearchParams(location.search).get('detalleRit');
	const groupId = source || inRit ? 'rit' : id.startsWith('objeto-') ? 'obligaciones' : 'impuestos';
	return { id, label, group: routeGroups.find(group => group.id === groupId) };
}

function restoreTaxDetailTab() {
	const tab = new URLSearchParams(location.search).get('tab');
	if (!['vehicles', 'properties', 'delineacion', 'ica', 'publicidad', 'reteica', 'sobretasa'].includes(tab)) return;
	const button = document.getElementById('registered-' + tab + '-tab');
	if (button && !button.disabled) bootstrap.Tab.getOrCreateInstance(button).show();
}

function renderDelineationObjectDetail(object) {
	const record = paymentHistoryExamples.delineacion.rows.find(row => row[0] === object);
	if (!record || !taxpayerCanConsult(taxpayerSession, 'delineacion', object)) {
		return pageTitle('Detalle de Delineación Urbana') + emptyState(unavailableTaxpayerObject);
	}
	return taxDetailHeader({ title: 'Detalle de Delineación Urbana', identification: 'CDU ' + icaEscape(object),
		list: 'rit-impuestos', backLabel: 'Volver a Gestionar mis impuestos', tax: 'delineacion', object })
		+ taxDetailGroup('Información de la obra', [['Código de delineación urbana', object], ['Licencia de construcción', record[1]]]);
}

function renderAccountTaxObjectShell() {
	return '<div id="tax-account-object">' + loadingState('Consultando el objeto tributario…') + '</div>';
}

function mountRitTaxObjectDetails(root) {
	const session = taxpayerSession;
	const targets = root.querySelectorAll('[data-rit-tax-objects]');
	if (!targets.length) return;
	const service = createAccountStatementDemo(session, getTaxpayerIdentity());
	for (const target of targets) {
		const { ritTaxObjects: tax } = target.dataset;
		const config = accountStatementTaxes.find(item => item.id === tax);
		const tab = root.querySelector('#registered-' + tax + '-tab');
		tab.addEventListener('shown.bs.tab', async () => {
			if (target.firstElementChild) return;
			target.innerHTML = loadingState('Consultando objetos tributarios…');
			try {
				const { rows } = await service.list(tax);
				if (!target.isConnected || taxpayerSession !== session) return;
				if (!rows.length) {
					target.innerHTML = emptyState('No se encontraron objetos tributarios asociados.');
					return;
				}
				target.innerHTML = registeredTaxTable(tax, config.label, [...config.columns, 'Acciones'], rows.map(row => [
					...row.fields.map(detailValue), linkToTaxDetail('objeto-' + tax + '-' + encodeURIComponent(row.fields[config.identityObject ? 1 : 0]), tax),
				]));
				filterRegisteredTaxes(tax, true);
			} catch {
				if (target.isConnected) target.innerHTML = errorState('No fue posible consultar los objetos tributarios.');
			}
		});
	}
}

async function mountAccountTaxObjectDetail(route) {
	const root = document.getElementById('tax-account-object');
	const session = taxpayerSession;
	const match = /^objeto-(ica|reteica)-([a-zA-Z0-9-]+)$/.exec(route);
	const unavailable = () => { root.innerHTML = pageTitle('Detalle del objeto tributario') + emptyState(unavailableTaxpayerObject); };
	if (!match || !session) return unavailable();
	const [, tax, object] = match;
	const identity = getTaxpayerIdentity();
	const config = accountStatementTaxes.find(item => item.id === tax);
	if (config.identityObject && identity.documentNumber !== object) return unavailable();
	try {
		const registry = tax === 'ica';
		const record = session.requiresObject
			? (await createAccountStatementDemo(session, identity).list(tax)).rows.find(row => row.fields[config.identityObject ? 1 : 0] === object)
			: null;
		if (!root.isConnected || taxpayerSession !== session) return;
		if (!record && !registry) return unavailable();
		const attributes = record?.fields ?? [identity.documentType, identity.documentNumber];
		root.innerHTML = taxDetailHeader({
			title: 'Detalle de ' + config.label, identification: identity.documentType + ' ' + icaEscape(object),
			tax, object, account: true, backLabel: 'Volver a Estado de cuenta',
			declaration: registry ? taxObjectDeclarationUrl(tax, object) : null,
		}) + taxDetailGroup('Información del contribuyente',
			config.columns.map((label, index) => [label, attributes[index]]), 'col-12 col-sm-6')
			+ (record ? taxDetailGroup('Estado de cuenta', [['Deuda', detailMoney(record.debt)], ['Saldo a favor', detailMoney(record.credit)]], 'col-12 col-sm-6') : '');
		if (registry) {
			root.insertAdjacentHTML('beforeend', taxDetailRecords('Actividades económicas vigentes',
				['Código CIIU', 'Actividad económica', 'Tipo', 'Fecha de inicio'], icaData.activities.filter(item => !item.end)
					.map(item => [item.code, item.name, item.type === 'P' ? 'Principal' : 'Secundaria', item.start ? icaDate(item.start) : null]),
				'No hay actividades vigentes.'));
			root.insertAdjacentHTML('beforeend', taxDetailRecords('Establecimientos activos',
				['Matrícula', 'Nombre', 'Dirección', 'Teléfono', 'Fecha de apertura'], icaData.establishments.filter(item => !item.end)
					.map(item => [item.registration, item.name, item.address, item.phone, item.start ? icaDate(item.start) : null]),
				'No hay establecimientos activos.'));
		}
	} catch {
		if (root.isConnected) root.innerHTML = pageTitle('Detalle del objeto tributario') + errorState('No fue posible consultar el objeto tributario.');
	}
}

function renderTaxObjectDeclarationEntry({ tax, object, label, notifiedOn }) {
	const route = tax === 'vehiculos' ? 'vehiculo-' + object : 'objeto-' + tax + '-' + object;
	const vehicle = tax === 'vehiculos';
	const fields = [['Impuesto', taxDetailDeclarationNames[tax]], [label, object], ['Año gravable', currentTaxYear()]];
	if (vehicle) fields.push(['Periodo', 'Anual']);
	if (tax === 'publicidad') fields.push(['Fecha de notificación', notifiedOn]);
	return pageTitle('Generar declaración', 'Revisa los datos del objeto tributario y la vigencia para continuar.')
		+ linkTo(route, '<i class="bi bi-arrow-left me-2" aria-hidden="true"></i>Volver al detalle', 'btn btn-outline-secondary btn-sm mb-3')
		+ taxDetailGroup('Datos de la declaración', fields)
		+ section('Continuar con la declaración', filterForm(tax !== 'ica' ? [] : [
			{ label: 'Periodo', options: ['Anual', 'Primer periodo', 'Segundo periodo'], columns: 4, required: true },
		], 'Continuar', { reset: false, feedback: 'El diligenciamiento de la declaración todavía no está disponible en esta sección.' }));
}
