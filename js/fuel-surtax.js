const fuelSurtaxRoute = 'impuestos-sobretasa';
const fuelSurtaxName = 'Sobretasa a la gasolina';
const fuelSurtaxTitle = 'Gasolina Motor y ACPM';
const fuelSurtaxMonths = Array.from({ length: 12 }, (_, index) => {
	const label = new Intl.DateTimeFormat('es-CO', { month: 'long', timeZone: 'UTC' }).format(Date.UTC(2026, index));
	return [String(index + 1).padStart(2, '0'), label[0].toUpperCase() + label.slice(1)];
});
const fuelSurtaxEmpty = 'No se encontró información tributaria para el año y periodo seleccionados.';
const fuelSurtaxNoYears = 'No hay vigencias disponibles para tu identificación.';

// Escenario aislado del prototipo, compartido por Impuestos y Mi RIT.
const fuelSurtaxExample = {
	identity: { documentType: 'NIT', documentNumber: '900047822', fullName: 'Distribuidora Nacional de Combustibles S.A.S.' },
	years: { '2026': fuelSurtaxMonths, '2025': fuelSurtaxMonths.slice(8) },
	periods: {
		'2025-12': {
			basic: { address: 'CL 13 68 B 11', postalCode: '110831', municipality: 'Bogotá D.C.', responsibility: 'Distribuidor mayorista' },
			representatives: [],
		},
		'2026-10': {
			basic: {
				address: 'CL 13 68 B 11', postalCode: '110831', municipality: 'Bogotá D.C.',
				responsibility: 'Distribuidor mayorista', productStorage: 0, tanks: 0, tankStorage: 0,
			},
			representatives: [
				['CC', '1000000001', 'Laura Martínez García', 'ZRE170', '07/03/2022'],
				['CE', '1000000002', 'Alejandro Torres Silva', 'ZRE030', '01/10/2021'],
				['CC', '1000000003', 'Juan Rodríguez Castro', 'ZRE030', '18/11/2019'],
				['CC', '1000000004', 'Óscar Ramírez López', 'ZRE030', '14/09/2023'],
				['CC', '1000000005', 'Orlando Pérez Díaz', 'ZRE160', '13/03/2017'],
				['CC', '1000000006', 'Diana Ocampo Ruiz', 'ZRE170', '03/05/2019'],
				['CC', '1000000007', 'Sandra Santana Gómez', 'ZRE110', '10/08/2020'],
				['CC', '1000000008', 'Jennifer Quiñones Vargas', 'ZRE110', '06/10/2025'],
				['CC', '1000000009', 'Angie Chávez Moreno', 'ZRE110', '23/10/2025'],
				['CC', '1000000010', 'Marcela Acosta León', 'ZRE110', '15/10/2025'],
				['CE', '1000000011', 'Andrés Vargas Mora', 'ZRE030', '12/04/2024'],
				['CC', '1000000012', 'Paula Moreno Rojas', 'ZRE170', '24/01/2022'],
				['CC', '1000000013', 'Carlos Gómez Ruiz', 'ZRE160', '19/02/2024'],
				['CC', '1000000014', 'Natalia León Torres', 'ZRE110', '08/06/2024'],
				['CC', '1000000015', 'Felipe Díaz Suárez', 'ZRE030', '11/12/2020'],
			],
		},
	},
};

function fuelSurtaxProfile() {
	const identity = getTaxpayerIdentity();
	const example = taxpayerSession && new URLSearchParams(location.search).get('perfil') === 'sobretasa';
	if (example || (taxpayerSession && identity.documentType === 'NIT'
		&& identity.documentNumber === fuelSurtaxExample.identity.documentNumber)) return fuelSurtaxExample;
	return { identity, years: {}, periods: {} };
}

function renderFuelSurtaxRegistration() {
	if (!Object.keys(fuelSurtaxProfile().periods).length) {
		return section(fuelSurtaxTitle, emptyState('No se encontraron registros de Sobretasa a la gasolina asociados a tu identificación.'));
	}
	return section(fuelSurtaxTitle, '<p>Consulta los datos de la planta de abasto y sus representantes por periodo tributario.</p>'
		+ linkTo(fuelSurtaxRoute, '<i class="bi bi-search me-2" aria-hidden="true"></i>Consultar', 'btn btn-outline-primary'));
}

function renderFuelSurtaxTax() {
	const { identity, years } = fuelSurtaxProfile();
	const yearOptions = Object.keys(years).reverse();
	const selectField = (name, label, prompt, choices) => `<div class="col-12 col-md-4"><label class="form-label" for="fuel-surtax-${name}">${label} <span class="text-danger" aria-hidden="true">*</span></label>
		${renderSelect('fuel-surtax-' + name, choices, { name, prompt, required: true })}
		<div class="invalid-feedback">${prompt}.</div></div>`;
	return pageTitle(fuelSurtaxTitle, 'Sobretasa a la gasolina motor')
		+ taxInformationSection('Este impuesto está constituido por el consumo de gasolina motor extra o corriente, nacional o importada, en la jurisdicción de Bogotá.',
			'https://www.haciendabogota.gov.co/es/impuestos/impuesto-de-sobretasa-la-gasolina')
		+ taxDetailGroup('Información del contribuyente', [
			['Tipo de documento', identity.documentType],
			['Número de documento', identity.documentNumber],
			['Nombre o razón social', identity.fullName, { columns: 'col-12 col-lg-6' }],
		])
		+ `<div class="d-flex flex-wrap align-items-start gap-3 mb-4"><a class="btn btn-primary" id="fuel-surtax-declaration" href="${fuelSurtaxDeclarationUrl()}">Generar declaración / Corrección vigencia actual</a></div>`
		+ taxpayerQueryForm('fuel-surtax-query', {
			sectionTitle: 'Consultar periodo tributario',
			tax: 'sobretasa', year: selectField('year', 'Año gravable', 'Selecciona el año gravable', yearOptions),
			extra: selectField('period', 'Periodo', 'Selecciona el periodo', []),
		})
		+ `<div class="alert alert-info" role="note"><h2 class="h6 fw-semibold">Facturación y declaraciones</h2>
			<p class="mb-0">La descarga de factura no está disponible para este impuesto. La declaración y su corrección requieren un periodo mensual.</p></div>`;
}

function fuelSurtaxDeclarationUrl(year, period) {
	const params = new URLSearchParams({ impuesto: fuelSurtaxName });
	const origin = new URLSearchParams(location.search);
	if (origin.get('perfil') === 'sobretasa') params.set('perfil', 'sobretasa');
	if (year) params.set('vigencia', year);
	const month = fuelSurtaxMonths.find(([value]) => value === period);
	if (year && month) params.set('periodo', month[1]);
	return '?' + params + '#declaraciones-generar';
}

function mountFuelSurtax() {
	const profile = fuelSurtaxProfile();
	const hasInitialPeriod = Boolean(profile.periods['2026-10']);
	if (hasInitialPeriod) document.getElementById('fuel-surtax-year').value = '2026';
	mountTaxpayerQuery('fuel-surtax-query', ({ year, period }) => {
		const record = profile.periods[year + '-' + period];
		return record ? [record] : [];
	}, (target, [record]) => {
		const basic = record.basic;
		target.innerHTML = taxDetailGroup('Datos básicos', [
			['Ubicación de la planta de abasto', basic.address],
			['Código postal', basic.postalCode],
			['Municipio', basic.municipality],
			['Calidad del responsable', basic.responsibility],
			['Capacidad de almacenaje de producto', basic.productStorage],
			['Número de tanques', basic.tanks],
			['Capacidad de almacenaje de tanques', basic.tankStorage],
		]);
		if (!record.representatives.length) {
			target.insertAdjacentHTML('beforeend', section('Representantes', emptyState('No se registran representantes asociados.')));
			return;
		}
		renderQueryResults(target, {
			id: 'fuel-surtax-representatives', title: 'Representantes', standalone: true,
			headers: ['Tipo de identificación', 'Número de identificación', 'Nombre', 'Tipo de relación', 'Fecha desde', 'Fecha hasta'],
			rows: record.representatives.map(row => [...row.slice(0, 5), row[5] || '—']),
			formatCell: cell => icaEscape(cell),
			sortValue: (cell, index) => index >= 4 && cell !== '—' ? cell.split('/').reverse().join('-') : cell,
			searchPlaceholder: 'Nombre, identificación o tipo de relación',
			noMatches: 'No encontramos representantes que coincidan con tu búsqueda.',
		});
	}, {
		initial: hasInitialPeriod,
		alternateField: { name: 'period', taxes: ['sobretasa'], optionsForYear: year => profile.years[year] || [], initialValue: hasInitialPeriod ? '10' : '' },
		initialStatus: Object.keys(profile.years).length ? '' : emptyState(fuelSurtaxNoYears),
		loadingMessage: 'Consultando información del impuesto…',
		emptyMessage: fuelSurtaxEmpty,
		errorMessage: 'No fue posible consultar la información del impuesto. Inténtalo nuevamente.',
	});
	const link = document.getElementById('fuel-surtax-declaration');
	if (link?.tagName === 'A') {
		const form = document.getElementById('fuel-surtax-query');
		const syncDeclaration = () => {
			link.href = fuelSurtaxDeclarationUrl(form.elements.year.value, form.elements.period.value);
		};
		form.addEventListener('input', syncDeclaration);
		form.addEventListener('reset', () => setTimeout(syncDeclaration, 0));
		syncDeclaration();
	}
}
