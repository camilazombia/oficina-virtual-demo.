const publicityTaxTitle = 'Impuesto de Publicidad Exterior';
const publicityOfficialUrl = 'https://www.haciendabogota.gov.co/es/impuestos/impuesto-de-publicidad-exterior-visual';
const publicityHeaders = ['Número de resolución', 'Tipo de valla'];
const publicityMissing = '<strong class="d-block">No tienes elementos de publicidad exterior asociados.</strong>Actualmente no se encontraron registros de publicidad exterior asociados a tu identificación.';

// Catálogo simulado compartido entre Impuestos, Mi RIT, Estado de cuenta y Obligaciones pendientes.
const publicityExampleElements = [
	{ resolution: 'RES202101843', kind: 'tubular', resolvedOn: '28/10/2021', notifiedOn: '28/10/2021', request: 'Registro nuevo',
		address: 'CL 13 68 B 11', district: 'Kennedy', area: 16, illuminated: 'No', site: 'Espacio público',
		debt: 14589000, credit: 0, outstanding: { year: '2023', status: 'Moroso', documentType: 'Acto administrativo', total: 942000 } },
	{ resolution: 'RES202102353', kind: 'tubular', resolvedOn: '16/12/2021', notifiedOn: '20/12/2021', request: 'Registro nuevo',
		address: 'AC 80 69 50', district: 'Engativá', postalCode: '111021', area: 24, orientation: 'Frontal', illuminated: 'Sí', site: 'Predio privado',
		chip: 'AAA0012MOYN', registration: '050S40156590', debt: 14299000, credit: 0 },
	{ resolution: 'RES202201593A', kind: 'vehicle', resolvedOn: '07/09/2022', notifiedOn: '07/09/2022', request: 'Registro nuevo',
		model: '000000', adType: 'Comercial', plate: 'WFI508', orientation: 'Izquierda', debt: 13422000, credit: 0 },
	{ resolution: 'RES202201593B', kind: 'vehicle', resolvedOn: '08/09/2022', notifiedOn: '12/09/2022', request: 'Registro nuevo',
		model: '2020', adType: 'Comercial', plate: 'WFI508', vehicleType: 'Camión', service: 'Particular', orientation: 'Derecha', debt: 13422000, credit: 0 },
	{ resolution: 'RES202301764', kind: 'tubular', resolvedOn: '11/10/2023', notifiedOn: '17/10/2023', request: 'Registro nuevo',
		district: 'Fontibón', area: 18.5, illuminated: 'No', site: 'Predio privado', debt: 0, credit: 216000 },
];

const publicityKinds = {
	tubular: {
		label: 'Valla Tubular Comercial', section: 'Datos del elemento publicitario',
		fields: [['Dirección', 'address'], ['Localidad', 'district'], ['Código postal', 'postalCode'],
			['Área del elemento', 'area', area => detailUnit(area, 'm²')], ['Orientación visual', 'orientation'],
			['Aviso luminoso', 'illuminated'], ['CHIP', 'chip'], ['Ubicación del elemento publicitario', 'site'],
			['Matrícula inmobiliaria', 'registration']],
	},
	vehicle: {
		label: 'Valla Vehículos', section: 'Datos del vehículo y del elemento publicitario',
		fields: [['Modelo', 'model'], ['Tipo de publicidad', 'adType'], ['Placa', 'plate'], ['Tipo de vehículo', 'vehicleType'],
			['Número de licencia de tránsito', 'license'], ['Tipo de servicio', 'service'], ['Orientación visual', 'orientation']],
	},
};

function publicityElementsFor(session) {
	return session === taxpayerSession && session?.id === 'demo-gran-contribuyente' ? publicityExampleElements : [];
}

function publicityTypeLabel(element) {
	return publicityKinds[element.kind].label;
}

function renderPublicityTax() {
	return pageTitle(publicityTaxTitle, 'Consulta los elementos de publicidad exterior asociados a tu identificación y accede a su información tributaria.')
		+ taxInformationSection('El Impuesto de Publicidad Exterior se causa al momento de la notificación del acto administrativo mediante el cual la Secretaría Distrital de Ambiente otorga el registro de una valla con una dimensión igual o superior a ocho (8) metros cuadrados, con vigencia de un año.', publicityOfficialUrl)
		+ '<section class="bg-white border rounded-3 p-3 p-md-4 mb-4"><div data-publicity-list></div></section>';
}

function mountPublicityList(target, { rit = false } = {}) {
	const session = taxpayerSession;
	const scenario = new URLSearchParams(location.search).get('demo');
	let simulateError = scenario === 'publicidad-error-consulta';
	const title = rit ? publicityTaxTitle : 'Elementos de publicidad exterior';
	async function load() {
		target.innerHTML = loadingState('Consultando elementos de publicidad exterior…');
		await new Promise(resolve => setTimeout(resolve, 220));
		if (!target.isConnected || taxpayerSession !== session) return;
		try {
			if (simulateError) {
				simulateError = false;
				throw new Error('Consulta simulada');
			}
			const elements = publicityElementsFor(session);
			if (!elements.length) {
				target.innerHTML = `<h2 class="h5 mb-3">${title}</h2>` + emptyState(publicityMissing);
				return;
			}
			const key = rit ? 'publicidad-rit' : 'publicidad-impuestos';
			const headers = rit ? publicityHeaders : [...publicityHeaders, 'Acciones'];
			target.innerHTML = registeredTaxTable(key, title, headers, elements.map(element => {
				const values = [element.resolution, publicityTypeLabel(element)];
				return rit ? values : [...values, linkToTaxDetail('objeto-publicidad-' + element.resolution)];
			}), 'Consulta los elementos asociados a este impuesto.', {
				searchHint: 'Número de resolución o tipo de valla',
				noMatches: '<strong class="d-block">No encontramos resultados.</strong>Verifica el número de resolución o modifica tu búsqueda.',
			});
			filterRegisteredTaxes(key, true);
		} catch {
			target.innerHTML = errorState('No fue posible consultar la información de publicidad exterior. Inténtalo nuevamente.'
				+ '<div class="mt-2"><button class="btn btn-outline-primary btn-sm" type="button" data-publicity-retry>Reintentar</button></div>');
		}
	}
	target.addEventListener('click', event => {
		if (event.target.closest('[data-publicity-retry]')) void load();
	});
	void load();
}

function mountRitPublicity(root) {
	const pane = root.querySelector('#registered-publicidad-pane [data-publicity-list]');
	const tab = root.querySelector('#registered-publicidad-tab');
	if (pane && tab) tab.addEventListener('shown.bs.tab', () => mountPublicityList(pane, { rit: true }), { once: true });
}

async function mountPublicityDetail(object) {
	const root = document.getElementById('tax-account-object');
	const session = taxpayerSession;
	const params = new URLSearchParams(location.search);
	const account = params.get('origenPublicidad') === 'cuenta';
	const back = account ? '?impuestoCuenta=publicidad#obligaciones-cuenta' : '?#impuestos-publicidad';
	const backLabel = account ? 'Volver a Estado de cuenta' : 'Volver a Publicidad exterior';
	const error = () => {
		root.innerHTML = `<a class="btn btn-outline-secondary btn-sm mb-3" href="${back}">${backLabel}</a>`
			+ pageTitle('Detalle del elemento publicitario') + errorState('No fue posible cargar la información del elemento publicitario. Inténtalo nuevamente.');
	};
	await new Promise(resolve => setTimeout(resolve, 220));
	if (!root.isConnected || taxpayerSession !== session) return;
	const element = publicityElementsFor(session).find(item => item.resolution === object);
	if (!element || params.get('demo') === 'publicidad-error-detalle') {
		error();
		return;
	}
	const type = publicityKinds[element.kind];
	root.innerHTML = taxDetailHeader({
		title: 'Detalle del elemento publicitario',
		identification: 'Resolución ' + icaEscape(element.resolution) + ' · ' + type.label,
		list: 'impuestos-publicidad', backLabel, tax: 'publicidad', object, account,
		declaration: taxObjectDeclarationUrl('publicidad', object),
	}) + taxDetailGroup('Datos básicos', [['Fecha de resolución', element.resolvedOn],
		['Tipo de solicitud', element.request], ['Fecha de notificación', element.notifiedOn]], 'col-12 col-sm-6 col-lg-4')
		+ taxDetailGroup(type.section, type.fields.map(([label, key, format]) => {
			const value = element[key];
			return [label, format && value != null ? format(value) : value];
		}))
		+ (account ? taxDetailGroup('Estado de cuenta', [['Deuda', detailMoney(element.debt)], ['Saldo a favor', detailMoney(element.credit)]], 'col-12 col-sm-6') : '');
}
