const routeGroups = [
	{
		id: "rit",
		label: "Mi RIT",
		icon: "bi-person-vcard",
		items: [
			["rit-datos", "Datos personales"],
			["rit-impuestos", "Impuestos registrados"],
			["rit-agentes", "Agentes autorizados"],
			["rit-certificacion", "Certificado RIT"],
		],
	},
	{
		id: "impuestos",
		label: "Mis impuestos",
		icon: "bi-bank",
		items: [
			["impuestos-vehiculos", "Vehículos"],
			["impuestos-predial", "Predial"],
			["impuestos-ica", "ICA"],
			["impuestos-publicidad", "Publicidad exterior"],
			[fuelSurtaxRoute, fuelSurtaxName],
		],
	},
	{
		id: "obligaciones",
		label: "Mis obligaciones",
		icon: "bi-list-check",
		items: [
			["obligaciones-pendientes", "Obligaciones pendientes"],
			["obligaciones-cuenta", "Estado de cuenta"],
			["obligaciones-facilidades", "ROP Facilidades de pago"],
		],
	},
	{
		id: "declaraciones",
		label: "Declaraciones",
		icon: "bi-file-earmark-text",
		items: [
			[declarationRoute, declarationTitle],
			["declaraciones-blanco", "Generar declaración en blanco"],
			["declaraciones-presentadas", "Declaraciones presentadas"],
		],
	},
	{
		id: "pagos",
		label: "Pagos",
		icon: "bi-receipt",
		items: [
			["pagos-facturas", "Facturas"],
			["pagos-recibos", "Recibos de pago"],
			["pagos-facilidades", "Facilidades de pago"],
			["pagos-relacion", "Relación de pagos"],
		],
	},
	{
		id: "tramites",
		label: "Trámites",
		icon: "bi-clipboard2-check",
		items: [["tramites-seguimiento", "Consultar y hacer seguimiento"]],
	},
	{
		id: "documentos",
		label: "Documentos y certificaciones",
		icon: "bi-file-earmark-check",
		items: [
			["documentos-pago", "Certificaciones de pago"],
			["documentos-multipagos", "Certificación multipagos"],
			["documentos-declaracion", "Certificación de declaración"],
			["documentos-retenciones", "Retenciones practicadas"],
		],
	},
	{
		id: "notificaciones",
		label: "Notificaciones",
		icon: "bi-bell",
		items: [
			["notificaciones-todas", "Todas"],
			["notificaciones-no-leidas", "No leídas"],
			["notificaciones-notificaciones", "Notificaciones"],
			["notificaciones-mensajes", "Mensajes"],
		],
	},
];

const taxpayerMenuLabels = new Map([
	["rit-datos", "Mi RIT"],
	["rit-impuestos", "Gestionar mis Impuestos"],
	["rit-agentes", "Agentes Autorizados"],
	["rit-certificacion", "Certificación RIT"],
	["declaraciones-generar", "Generar declaración / Corrección Vigencia actual"],
	["pagos-facturas", "Descarga de factura"],
	["pagos-reexpedicion", "Reexpedición de factura"],
	["pagos-multipago", "Recibo multipago"],
	["obligaciones-cuenta", "Estado de cuenta"],
	["obligaciones-facilidades", "ROP Facilidades de pago"],
	["documentos-multipagos", "Certificaciones multiplago"],
	["documentos-declaracion", "Certificaciones de declaración"],
]);

// Ocultar temporalmente el contenido; conservar todas las opciones del menú.
const hiddenRouteGroups = new Set(['impuestos', 'obligaciones', 'declaraciones', 'pagos', 'tramites', 'documentos', 'notificaciones']);

const simpleRoutes = [
	{ id: "inicio", label: "Inicio", icon: "bi-house-door", group: null },
	{ id: "guia-visual", label: "Guía visual", icon: "bi-palette", group: null },
];
const pages = new Map(simpleRoutes.map((route) => [route.id, route]));
routeGroups.forEach((group) => group.items.forEach(([id, label]) => pages.set(id, { id, label, group })));
pages.set("pagos-multipago", { id: "pagos-multipago", label: "Recibo multipago", group: routeGroups.find(group => group.id === "pagos") });
pages.set("pagos-reexpedicion", { id: "pagos-reexpedicion", label: "Reexpedición de factura", group: routeGroups.find(group => group.id === "pagos") });
pages.set("rit-actualizacion", { id: "rit-actualizacion", label: "Actualización de datos", group: routeGroups.find(group => group.id === "rit") });
pages.set("rit-agentes-habilitar", { id: "rit-agentes-habilitar", label: "Habilitar agente autorizado", group: routeGroups[0] });

const contentRoot = document.getElementById("pageContent");
const breadcrumbRoot = document.getElementById("pageBreadcrumb");
const navigationRoot = document.getElementById("primaryNavigationItems");
const pageFooterRoot = document.getElementById("pageFooter");
const ritFormStorageKey = "hacienda-demo-rit-personal-data";
const notificationAddressSeedKey = "hacienda-notification-address-seed-demo-v2";
const currentEmailSeedKey = "hacienda-current-email-seed-demo-v3";
let activeAddressContext = "notification";
let notificationAddressDraft = null;
const contactAddressFieldMap = {
	"address-type": "contact-address-type",
	"notification-country": "contact-country",
	"notification-department": "contact-department",
	"notification-city": "contact-city",
	"notification-postal": "contact-postal",
	"address-street-type": "contact-street-type",
	"address-street-number": "contact-street-number",
	"address-street-letter": "contact-street-letter",
	"address-bis": "contact-bis",
	"address-bis-letter": "contact-bis-letter",
	"address-street-zone": "contact-street-zone",
	"address-number-1": "contact-number-1",
	"address-number-letter": "contact-number-letter",
	"address-number-2": "contact-number-2",
	"address-number-zone": "contact-number-zone",
	"address-complement-type": "contact-complement-type",
	"address-complement-value": "contact-complement-value",
	"address-complement-list": "contact-complement-list",
};
let ritFormValues = {};
try {
	ritFormValues = JSON.parse(window.localStorage.getItem(ritFormStorageKey) || "{}");
} catch (error) {
	console.error("No fue posible recuperar los datos guardados de Mi RIT.", error);
}
try {
	if (window.localStorage.getItem(notificationAddressSeedKey) !== "true") {
		const notificationAddressDefaults = {
			"notification-address": "CL 00 00 00 AP 000",
			"notification-country": "COLOMBIA",
			"notification-department": "BOGOTÁ",
			"notification-city": "BOGOTA, D.C.",
			"notification-postal": "000000",
			"address-type": "NOTIFICACIÓN",
			"address-street-type": "CL",
			"address-street-number": "00",
			"address-street-letter": "",
			"address-bis": "",
			"address-bis-letter": "",
			"address-street-zone": "",
			"address-number-1": "00",
			"address-number-letter": "",
			"address-number-2": "00",
			"address-number-zone": "",
			"address-complement-type": "",
			"address-complement-value": "",
			"address-complement-list": "AP 000",
		};
		Object.entries(notificationAddressDefaults).forEach(([id, value]) => { ritFormValues[id] = { value, checked: false }; });
		window.localStorage.setItem(ritFormStorageKey, JSON.stringify(ritFormValues));
		window.localStorage.setItem(notificationAddressSeedKey, "true");
	}
} catch (error) {
	console.error("No fue posible cargar la dirección de notificación registrada.", error);
}
try {
	if (window.localStorage.getItem(currentEmailSeedKey) !== "true") {
		ritFormValues["current-email"] = { value: "miguel.salazar@example.com", checked: false };
		window.localStorage.setItem(ritFormStorageKey, JSON.stringify(ritFormValues));
		window.localStorage.setItem(currentEmailSeedKey, "true");
	}
} catch (error) {
	console.error("No fue posible cargar el correo electrónico registrado.", error);
}

function restoreRitFormValues(root = contentRoot) {
	root.querySelectorAll("#socialNetworks [data-social-row]").forEach((row, index) => {
		if (index > 0) row.remove();
	});
	Object.keys(ritFormValues).forEach((id) => {
		const match = /^social-network-(\d+)$/.exec(id);
		if (match && !root.querySelector(`#${id}`)) addRitSocialRow(root, match[1]);
	});
	root.querySelectorAll("input[id], select[id], textarea[id]").forEach((field) => {
		const savedField = ritFormValues[field.id];
		if (!savedField) return;
		if (field.type === "checkbox" || field.type === "radio") field.checked = Boolean(savedField.checked);
		else if (field.type !== "password" && field.type !== "file") field.value = savedField.value ?? "";
	});
	const address = root.querySelector("#notification-address");
	const addressText = root.querySelector("#notificationAddressText");
	if (addressText) addressText.textContent = address?.value || "No hay una dirección registrada.";
	updateNotificationAddressMeta(root);
	syncContactAddressCard(root);
}

function addRitSocialRow(root = contentRoot, savedSuffix = null) {
	const list = root.querySelector("#socialNetworks");
	const original = list?.querySelector("[data-social-row]");
	if (!original) return null;
	let suffix = savedSuffix || 1;
	while (root.querySelector(`#social-network-${suffix}`)) suffix = Number(suffix) + 1;
	const row = original.cloneNode(true);
	row.querySelectorAll("select, input").forEach((field) => {
		const oldId = field.id;
		field.id = `${oldId}-${suffix}`;
		field.value = "";
		row.querySelector(`label[for="${oldId}"]`).htmlFor = field.id;
	});
	const actions = document.createElement("div");
	actions.className = "col-12 col-md-2";
	const remove = document.createElement("button");
	remove.type = "button";
	remove.className = "btn btn-outline-danger btn-sm";
	remove.dataset.socialRemove = "";
	remove.textContent = "Eliminar";
	remove.setAttribute("aria-label", `Eliminar red social adicional ${suffix}`);
	actions.append(remove);
	row.append(actions);
	list.append(row);
	return row;
}

function setAddressEditorContext(context) {
	const nextContext = context === "contact" ? "contact" : "notification";
	if (nextContext === "contact" && activeAddressContext !== "contact") {
		notificationAddressDraft = Object.keys(contactAddressFieldMap).reduce((draft, id) => {
			draft[id] = document.getElementById(id)?.value || "";
			return draft;
		}, {});
		Object.entries(contactAddressFieldMap).forEach(([editorId, contactId]) => {
			const editorField = document.getElementById(editorId);
			const savedField = document.getElementById(contactId);
			if (!editorField || !savedField) return;
			const savedValue = savedField.value || "";
			editorField.value = editorField.tagName === "SELECT" ? savedValue.toLocaleUpperCase("es") : savedValue;
		});
	} else if (nextContext === "notification" && activeAddressContext === "contact" && notificationAddressDraft) {
		Object.entries(notificationAddressDraft).forEach(([id, value]) => {
			const field = document.getElementById(id);
			if (field) field.value = value;
		});
		notificationAddressDraft = null;
	}
	activeAddressContext = nextContext;
	const addressType = document.getElementById("address-type");
	if (addressType) addressType.value = activeAddressContext === "contact" ? "CONTACTO" : "NOTIFICACIÓN";
	renderAddressComplements();
	const title = document.getElementById("notificationAddressEditorTitle");
	if (title) title.textContent = activeAddressContext === "contact" ? "Editar dirección de contacto" : "Editar dirección de notificación";
}

function saveContactAddressFromEditor() {
	Object.entries(contactAddressFieldMap).forEach(([editorId, contactId]) => {
		const editorField = document.getElementById(editorId);
		const savedField = document.getElementById(contactId);
		if (editorField && savedField) savedField.value = editorField.value;
	});
	const addressField = document.getElementById("contact-address");
	if (addressField) addressField.value = composeNotificationStreet();
	syncContactAddressCard();
}

// Update legacy placeholder values without replacing user-entered information.
Object.entries({ 'basic-first-name': ['PERSONA', 'MIGUEL'], 'basic-middle-name': ['DE', 'ANDRÉS'], 'basic-first-surname': ['PRUEBA', 'SALAZAR'], 'basic-second-surname': ['DEMO', 'RÍOS'], 'current-email': ['contribuyente.demo@example.com', 'miguel.salazar@example.com'] }).forEach(([id, [previous, current]]) => {
 if (ritFormValues[id]?.value === previous) ritFormValues[id].value = current;
});
restoreRitFormValues(contentRoot);
const existingRitPage = contentRoot.innerHTML;
const corporateTaxpayerIdentity = Object.freeze({
	fullName: 'CENTRO AUTOMOTOR DIESEL S A CENTRODIESEL', initials: 'CD',
	documentType: 'NIT', documentTypeLabel: 'Número de Identificación Tributaria', documentNumber: '860032115',
	checkDigit: '6', legalForm: 'Sociedad anónima', registration: '00000000', liquidationDate: '—',
	withholdingAgent: 'Agente retenedor', icClass: 'Persona jurídica',
});
let taxpayerIdentity = {
	firstName: "MIGUEL",
	middleName: "ANDRÉS",
	firstSurname: "SALAZAR",
	secondSurname: "RÍOS",
	documentType: "CC",
	documentNumber: "1000000001",
	documentIssueDate: "2000-01-01",
	withholdingAgent: "",
};
let filterControlIndex = 0;
let selectedAgentLookup = null;
let selectedAgentDocuments = [];
const agentDirectory = [
	{
		documentType: "CC",
		documentNumber: "1000000002",
		issueDate: "2020-01-01",
		taxpayerType: "Persona natural",
		firstName: "Valentina",
		middleName: "Isabel",
		lastName: "Morales",
		secondLastName: "Castro",
		address: "Carrera 24 # 63-18, Bogotá, D. C.",
		landline: "(601) 742 6813",
		mobile: "315 628 4917",
		email: "valentina.morales@example.com",
		socialNetwork: "Instagram",
		socialUser: "@valentina.morales",
	},
];

const vehicles = [
	...[
		['865NWX', 'Foton', '2026', 'Camioneta', 'Furgón', '02', 'No', '2499'],
		['866NWX', 'Foton', '2026', 'Camioneta', 'Furgón', '02', 'No', '2499'],
		['867NWX', 'Foton', '2026', 'Camioneta', 'Furgón', '02', 'No', '2499'],
		['ADH93', 'Honda', '1980', 'Motocicleta', 'Sin carrocería', '00', 'No', '100'],
		['AGI426', 'Viasa', '1971', 'Campero', 'Cabinado', '2', 'No', '2800'],
		['BCO276', 'Fiat', '1993', 'Automóvil', 'Cupé', '2', 'No', '1200'],
		['BEE625', 'Nissan', '1994', 'Automóvil', 'Sedán', '4', 'No', '1400'],
		['BFC507', 'Chevrolet', '1995', 'Camioneta', 'Cabinado', '02', 'No', '2300'],
		['BGC079', 'Peugeot', '1995', 'Automóvil', 'Sedán', '4', 'No', '2000'],
		['BHK271', 'Chevrolet', '1997', 'Campero', 'Cabinado', '4', 'Sí', '4300'],
	].map(([plate, brand, year, className, body, doors, armored, engine]) => ({ plate, brand, line: '', year, className, body, doors, armored, engine })),
	{"plate":"DEM001","brand":"Citroën","line":"","year":"2020","className":"Camioneta","body":"Wagon","doors":"5","armored":"No","engine":"1598"},
	{"plate":"DEM002","brand":"RAM","line":"","year":"2019","className":"Camioneta","body":"Doble cabina","doors":"4","armored":"No","engine":"3600"},
	{"plate":"DEM003","brand":"Ford","line":"","year":"2013","className":"Automóvil","body":"Hatchback","doors":"4","armored":"No","engine":"1597"},
	{"plate":"DEM004","brand":"Ford","line":"","year":"2013","className":"Automóvil","body":"Sedán","doors":"4","armored":"No","engine":"1597"},
	{"plate":"DEM005","brand":"Ford","line":"","year":"2014","className":"Campero","body":"Wagon","doors":"5","armored":"No","engine":"1999"},
	{"plate":"DEM006","brand":"Chevrolet","line":"","year":"2014","className":"Camioneta","body":"Wagon","doors":"5","armored":"No","engine":"1796"},
	{"plate":"DEM007","brand":"Nissan","line":"","year":"2014","className":"Automóvil","body":"Sedán","doors":"04","armored":"No","engine":"1598"},
	{"plate":"DEM008","brand":"Citroën","line":"","year":"2014","className":"Automóvil","body":"Sedán","doors":"5","armored":"No","engine":"1587"},
	{"plate":"DEM009","brand":"Volkswagen","line":"","year":"2016","className":"Camioneta","body":"Wagon","doors":"4","armored":"No","engine":"1598"},
	{"plate":"DEM010","brand":"Renault","line":"","year":"2016","className":"Automóvil","body":"Sedán","doors":"4","armored":"No","engine":"1598"},
	{"plate":"DEM011","brand":"Volkswagen","line":"","year":"2019","className":"Automóvil","body":"Hatchback","doors":"5","armored":"No","engine":"1599"},
	{"plate":"DEM012","brand":"Jeep","line":"","year":"2019","className":"Camioneta","body":"Wagon","doors":"5","armored":"No","engine":"1747"},
	{"plate":"DEM013","brand":"Jeep","line":"","year":"2019","className":"Camioneta","body":"Wagon","doors":"5","armored":"No","engine":"2359"},
	{"plate":"DEM014","brand":"Renault","line":"","year":"2019","className":"Automóvil","body":"Hatchback","doors":"5","armored":"No","engine":"1599"},
	{"plate":"DEM015","brand":"Ford","line":"","year":"2019","className":"Camioneta","body":"Wagon","doors":"5","armored":"No","engine":"1999"},
	{"plate":"DEM016","brand":"Kia","line":"","year":"2020","className":"Camioneta","body":"Wagon","doors":"5","armored":"No","engine":"1999"},
	{"plate":"DEM017","brand":"Peugeot","line":"","year":"2020","className":"Camioneta","body":"Wagon","doors":"5","armored":"No","engine":"1598"},
	{"plate":"DEM018","brand":"Peugeot","line":"","year":"2020","className":"Camioneta","body":"Wagon","doors":"5","armored":"No","engine":"1587"},
	{"plate":"DEM019","brand":"Renault","line":"","year":"2020","className":"Automóvil","body":"Hatchback","doors":"5","armored":"No","engine":"999"},
	{"plate":"DEM020","brand":"Suzuki","line":"","year":"2020","className":"Camioneta","body":"Wagon","doors":"5","armored":"No","engine":"1586"},
	{"plate":"DEM021","brand":"Suzuki","line":"","year":"2018","className":"Automóvil","body":"Hatchback","doors":"5","armored":"No","engine":"1197"},
	{"plate":"DEM022","brand":"Suzuki","line":"","year":"2018","className":"Automóvil","body":"Hatchback","doors":"5","armored":"No","engine":"1197"},
	{"plate":"DEM023","brand":"Renault","line":"","year":"2017","className":"Automóvil","body":"Hatchback","doors":"5","armored":"No","engine":"1599"},
	{"plate":"DEM024","brand":"Suzuki","line":"","year":"2018","className":"Automóvil","body":"Hatchback","doors":"5","armored":"No","engine":"1197"},
	{"plate":"DEM025","brand":"Kia","line":"","year":"2018","className":"Automóvil","body":"Hatchback","doors":"5","armored":"No","engine":"1248"},
	{"plate":"DEM026","brand":"Hyundai","line":"","year":"2017","className":"Automóvil","body":"Sedán","doors":"4","armored":"No","engine":"1591"},
	{"plate":"DEM027","brand":"Peugeot","line":"","year":"2018","className":"Automóvil","body":"Hatchback","doors":"5","armored":"No","engine":"1598"},
	{"plate":"DEM028","brand":"Jeep","line":"","year":"2018","className":"Camioneta","body":"Wagon","doors":"5","armored":"No","engine":"1747"},
	{"plate":"DEM029","brand":"Volkswagen","line":"","year":"2019","className":"Automóvil","body":"Sedán","doors":"4","armored":"No","engine":"1395"},
	{"plate":"DEM030","brand":"Volvo","line":"","year":"2019","className":"Camioneta","body":"Wagon","doors":"5","armored":"No","engine":"1969"},
	{ plate: "DEM031", brand: "Ducati", line: "", year: "2013", className: "Motocicleta", body: "Sin carrocería", doors: "0", armored: "No", engine: "1198" },
	{ plate: "DEM032", brand: "BMW", line: "", year: "2012", className: "Automóvil", body: "Sedán", doors: "4", armored: "No", engine: "1997" },
];

const predialProperties = [
	['AAA0000XPTO', '050S00712129', 'CL 13 SUR 6 34 ESTE GJ 14', '', '2026', '00000000000010283338'],
	['AAA0000XRYX', '050S00712203', 'CL 13 SUR 6 34 ESTE AP 802', '', '2026', '00000000000010232108'],
	['AAA0001ASYN', '050S40265453', 'CL 13 BIS SUR 5A 65 GJ 10', '', '2026', '00000000000010962652'],
	['AAA0001AUJZ', '050S40265422', 'CL 13 BIS SUR 5A 65 AP 403', '', '2026', '00000000000010962897'],
	['AAA0001EUOM', '050S40203487', 'KR 2A 17A 35 SUR IN 14 AP 101', '', '2026', '00000000000011234902'],
	['AAA0001EXAF', '050S40203531', 'KR 2A 17A 35 SUR IN 16 AP 201', '', '2026', '00000000000010098989'],
	['AAA0001MNUZ', '050S00904063', 'AC 11 SUR 10A 40 GJ 101', '', '2026', '00000000000010066629'],
	['AAA0001MODE', '050S00904071', 'AC 11 SUR 10A 50 AP 501', '', '2026', '00000000000010066662'],
	['AAA0001MPKL', '050S40005993', 'KR 11 8 16 SUR AP 201', '', '2026', '00000000000010032869'],
	['AAA0001YXJH', '050S40258176', 'CL 8B SUR 7 15 GJ 44', '', '2026', '00000000000011037750'],
	["AAA0248KJTR", "000C00000001", "CL 72 15 38", "", "2026", "00000000000000000001"],
	["AAA0193HFXP", "000C00000002", "KR 19 104 26", "", "2026", "00000000000000000002"],
	["AAA0316BNQL", "000C00000003", "CL 45 27 16", "", "2026", "00000000000000000003"],
	["AAA0274DMSV", "000C00000004", "KR 58 128 43", "", "2026", "00000000000000000004"],
];

const vehicleHeaders = ["Placa", "Marca", "Línea", "Modelo", "Clase", "Carrocería", "No. de puertas", "Blindaje", "Cilindraje"];

function linkTo(id, label, classes = "") {
	return `<a class="${classes}" href="#${id}">${label}</a>`;
}

function consultationProfile(role) {
	return [notaryRoute, dealerRoute].find((route) => route.role === role);
}

function renderNavigation(activeId) {
	if (activeId === notaryRoute.id || activeId === dealerRoute.id) {
		navigationRoot.replaceChildren();
		return;
	}
	const relatedMenuItems = { "rit-agentes-habilitar": "rit-agentes", "rit-actualizacion": "rit-datos" };
	const activeMenuId = activeId.startsWith("vehiculo-") ? "impuestos-vehiculos"
		: activeId.startsWith("objeto-publicidad-") ? "impuestos-publicidad" : relatedMenuItems[activeId] ?? activeId;
	const homeItem = `<li class="nav-item"><a class="nav-link d-flex align-items-center gap-2 ${activeMenuId === "inicio" ? "active" : "text-body"}" href="#inicio" ${activeMenuId === "inicio" ? 'aria-current="page"' : ""}><i class="bi bi-house-door" aria-hidden="true"></i><span>Inicio</span></a></li>`;
	const activeGroup = pages.get(activeMenuId)?.group;
	const groupItems = routeGroups.filter((group) => group.id !== "notificaciones").map((group) => {
		const groupActive = group === activeGroup;
		if (group.id === "tramites") return `<li class="nav-item"><a class="nav-link d-flex align-items-center gap-2 ${groupActive ? "active" : "text-body"}" ${groupActive ? 'aria-current="page"' : ""} href="#tramites-seguimiento"><i class="bi ${group.icon}" aria-hidden="true"></i>Trámites</a></li>`;
		const collapseId = `nav-${group.id}`;
		const visibleItems = group.items.filter(([id]) => id !== "pagos-facilidades" && (id !== "obligaciones-facilidades" || taxpayerSession));
		const menuItems = taxpayerSession && group.id === "pagos"
			? visibleItems.flatMap(([id, label]) => [
				...(id === "pagos-recibos" ? [] : [[id, label]]),
				...(id === "pagos-facturas" ? [["pagos-reexpedicion", "Reexpedición de factura"]] : []),
				...(id === "pagos-recibos" ? [["pagos-multipago", "Recibo multipago"]] : []),
			])
			: visibleItems;
		const items = menuItems.map(([id, label]) => {
			const current = groupActive && activeMenuId === id;
			const itemLabel = taxpayerSession ? taxpayerMenuLabels.get(id) ?? label : label;
			return id === "rit-certificacion"
				? `<li class="nav-item"><button class="nav-link small py-2 ps-5 w-100 text-start link-secondary" type="button" data-rit-certificate-open aria-haspopup="dialog"><i class="bi bi-download me-2" aria-hidden="true"></i>${itemLabel}</button></li>`
				: `<li class="nav-item"><a class="nav-link small py-2 ps-5 ${current ? "active" : "link-secondary"}" href="#${id}" ${current ? 'aria-current="page"' : ""}>${itemLabel}</a></li>`;
		}).join("");
		return `<li class="nav-item">
			<button class="nav-link w-100 d-flex align-items-center gap-2 text-start ${groupActive ? "bg-primary-subtle text-primary-emphasis" : "text-body"}" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="${groupActive}" aria-controls="${collapseId}" ${groupActive ? 'aria-current="page"' : ""}>
				<i class="bi ${group.icon}" aria-hidden="true"></i><span>${group.label}</span><i class="bi bi-chevron-down ms-auto" aria-hidden="true"></i>
			</button>
			<div class="collapse ${groupActive ? "show" : ""}" id="${collapseId}"><ul class="nav flex-column">${items}</ul></div>
		</li>`;
	}).join("");
	navigationRoot.innerHTML = homeItem + groupItems;
}

function renderBreadcrumb(route) {
	const crumbs = route.id === "inicio" ? [] : [`<li class="breadcrumb-item">${linkTo("inicio", "Inicio")}</li>`];
	if (route.id === notaryRoute.id) crumbs[0] = '<li class="breadcrumb-item">Terceros autorizados</li>';
	if (route.id === dealerRoute.id) crumbs[0] = '<li class="breadcrumb-item">Concesionarios</li>';
	const isObligationQuery = route.id === "obligaciones-pendientes";
	const isPaymentPlans = ["obligaciones-facilidades", "pagos-facilidades"].includes(route.id);
	const title = route.id === "tramites-seguimiento" ? "Trámites" : taxpayerSession ? route.label : isPaymentPlans ? "Facilidades de pago" : isObligationQuery ? "Consulta de obligaciones"
		: route.id === "declaraciones-generar" ? "Generar Declaración" : route.label;
	const taxBreadcrumb = route.id === fuelSurtaxRoute || route.id === 'impuestos-publicidad' || route.id.startsWith('objeto-publicidad-');
	if (route.group && route.id !== "tramites-seguimiento") crumbs.push(`<li class="breadcrumb-item">${taxBreadcrumb ? 'Impuestos' : !taxpayerSession && (isObligationQuery || isPaymentPlans) ? "Consultas" : route.group.label}</li>`);
	if (route.id.startsWith('objeto-publicidad-')) crumbs.push(`<li class="breadcrumb-item">${linkTo('impuestos-publicidad', 'Publicidad exterior')}</li>`);
	crumbs.push(`<li class="breadcrumb-item active" aria-current="page">${title}</li>`);
	breadcrumbRoot.innerHTML = crumbs.join("");
}

function pageTitle(title, description = "") {
	return `<header class="mb-4"><h1 class="h3 fw-semibold mb-2">${title}</h1>${description ? `<p class="text-secondary mb-0">${description}</p>` : ""}</header>`;
}

function section(title, content, extraClass = "") {
	return `<section class="bg-white border rounded-3 p-3 p-md-4 mb-4 ${extraClass}"><h2 class="h6 fw-semibold border-bottom pb-2 mb-3">${title}</h2>${content}</section>`;
}

function taxInformationSection(description, officialUrl) {
	return section('Información del impuesto', `<p class="mb-2">${description}</p>
		<a class="link-primary" href="${officialUrl}" target="_blank" rel="noopener noreferrer">Más información <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true"></i></a>`);
}

function emptyState(message = "No hay información disponible para mostrar en esta sección.") {
	return `<div class="alert alert-light border mb-0" role="status">${message}</div>`;
}

function statusAlert(type, message, role = "status") {
	return `<div class="alert alert-${type} mb-3" role="${role}">${message}</div>`;
}

function loadingState(message = "Cargando información…") {
	return `<div class="d-flex align-items-center gap-2 text-secondary" role="status" aria-live="polite"><span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span>${message}</span></div>`;
}

function errorState(message = "No fue posible cargar la información.") {
	return statusAlert("danger", message, "alert");
}

function successState(message = "La operación se completó correctamente.") {
	return statusAlert("success", message);
}

function closeAgentLookupAndContinue(modalElement) {
	const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
	const hideModal = () => {
		modalElement.addEventListener("hidden.bs.modal", () => {
			window.location.hash = "rit-agentes-habilitar";
		}, { once: true });
		modal.hide();
	};

	if (modal._isTransitioning) {
		modalElement.addEventListener("shown.bs.modal", hideModal, { once: true });
	} else if (modal._isShown) {
		hideModal();
	} else {
		window.location.hash = "rit-agentes-habilitar";
	}
}

function tableFrame(headerMarkup, bodyMarkup, { id = '', label = 'Tabla de resultados', tableClass = '', containerClass = 'mb-3', paginationManaged = false } = {}) {
	return `<div class="table-responsive app-table-container ${containerClass}" tabindex="0" role="region" aria-label="${label}"><table ${paginationManaged ? 'data-pagination-managed' : ''} ${id ? `id="${id}"` : ''} class="table app-table table-hover align-middle mb-0 ${tableClass}"><thead class="table-light"><tr>${headerMarkup}</tr></thead><tbody>${bodyMarkup}</tbody></table></div>`;
}

function table(headers, rows = [], options = {}) {
	const headerMarkup = headers.map((header, index) => `<th scope="col"${options.unsortable?.includes(index) ? ' data-table-sort-ready="true"' : ''}>${header}</th>`).join("");
	const bodyMarkup = rows.length
		? rows.map((row, index) => `<tr ${options.rowAttributes?.(index) ?? ''}>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")
		: `<tr data-pagination-empty><td class="text-center text-secondary py-4" colspan="${headers.length}">${options.empty ?? "No hay registros disponibles."}</td></tr>`;
	return tableFrame(headerMarkup, bodyMarkup, options);
}

function tableBadge(label, tone = 'secondary') {
	return `<span class="badge rounded-pill bg-${tone}-subtle text-${tone}-emphasis border border-${tone}-subtle text-wrap text-start px-3 py-2">${label}</span>`;
}

function showDetailModal({ title, body, trigger, size = '', titleId = 'detail-modal-title', actions = '<button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal">Cerrar</button>' }) {
	const modal = document.createElement('div');
	modal.className = 'modal fade';
	modal.tabIndex = -1;
	modal.setAttribute('aria-labelledby', titleId);
	modal.innerHTML = `<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable ${size}"><div class="modal-content">
		<div class="modal-header"><h2 class="modal-title h5" id="${titleId}">${title}</h2><button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>
		<div class="modal-body">${body}</div>
		<div class="modal-footer">${actions}</div>
	</div></div>`;
	document.body.append(modal);
	const instance = new bootstrap.Modal(modal);
	modal.addEventListener('hidden.bs.modal', () => {
		instance.dispose();
		modal.remove();
		if (trigger?.isConnected) trigger.focus();
	}, { once: true });
	instance.show();
	return { modal, instance };
}

function yearOptions(firstYear, lastYear) {
	return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => String(lastYear - index));
}

function renderSelect(id, options, { value = "", prompt = "Selecciona una opción", required = false, name, describedBy } = {}) {
	const placeholder = prompt ? `<option value=""${value ? "" : " selected"}${required ? " disabled" : ""}>${prompt}</option>` : "";
	const choices = options.map((option) => {
		const [key, label] = Array.isArray(option) ? option : [option, option];
		return `<option value="${icaEscape(key)}"${key === value ? " selected" : ""}>${icaEscape(label)}</option>`;
	}).join("");
	return `<select class="form-select" id="${id}"${name ? ` name="${name}"` : ""}${describedBy ? ` aria-describedby="${describedBy}"` : ""}${required ? " required" : ""}>${placeholder}${choices}</select>`;
}

function queryActions(buttonText = "Consultar", resetText = "Limpiar filtros") {
	return `<div class="d-flex flex-wrap justify-content-end gap-2"><button class="btn btn-outline-secondary" type="reset">${resetText}</button><button class="btn btn-primary" type="submit">${buttonText}</button></div>`;
}

function filterForm(fields, buttonText = "Consultar", { reset = true, feedback = "" } = {}) {
	const controls = fields.map((field) => {
		const id = `filter-${++filterControlIndex}`;
		const label = field.label.toLocaleLowerCase("es");
		const control = field.options
			? renderSelect(id, field.options, { ...field, prompt: field.prompt ?? (label.includes("año") ? "Selecciona un año" : "Selecciona una opción") })
			: `<input class="form-control" id="${id}" type="${field.type ?? "text"}"${field.required ? " required" : ""}>`;
		const feedback = field.required ? `<div class="invalid-feedback">${field.options ? "Selecciona" : "Ingresa"} ${label.includes("impuesto") ? "un impuesto" : label.includes("año") ? "un año" : label === "periodo" ? "un periodo" : "un valor"}.</div>` : "";
		return `<div class="col-12 col-md-${field.columns ?? 4}"><label class="form-label" for="${id}">${field.label}${field.required ? ' <span class="text-danger" aria-hidden="true">*</span>' : ""}</label>${control}${feedback}</div>`;
	}).join("");
	const actions = reset ? queryActions(buttonText)
		: `<div class="d-flex justify-content-end"><button class="btn btn-primary" type="submit">${buttonText}</button></div>`;
	return `<form data-query-feedback="${feedback}" novalidate><div class="row g-3 mb-3">${controls}</div>${actions}<div data-query-status role="status"></div></form>`;
}

function stepFlow(steps, fields = []) {
	const stepMarkup = steps.map((step) => `<li class="list-group-item">${step}</li>`).join("");
	return `<details class="mb-3"><summary class="link-primary">Ver pasos del trámite</summary><ol class="list-group list-group-numbered mt-2">${stepMarkup}</ol></details>${filterForm(fields.map(field => ({ ...field, required: true })), "Continuar")}`;
}

document.addEventListener("reset", (event) => {
	const form = event.target;
	if (!form.matches("[data-query-feedback]")) return;
	form.classList.remove("was-validated");
	const status = form.querySelector("[data-query-status]");
	status.className = "";
	status.textContent = "";
});

function vehicleRows() {
	return vehicles.map((vehicle) => [
		vehicle.plate, vehicle.brand, vehicle.line || "—", vehicle.year, vehicle.className, vehicle.body, vehicle.doors, vehicle.armored, vehicle.engine,
	]);
}

function getTaxpayerIdentity() {
	if (taxpayerSession?.requiresObject) return corporateTaxpayerIdentity;
	const readValue = (id, fallback) => {
		const field = document.getElementById(id);
		return field && !field.closest("[data-invoice-rit]") ? field.value.trim() : fallback;
	};
	const firstName = readValue("basic-first-name", taxpayerIdentity.firstName);
	const middleName = readValue("basic-middle-name", taxpayerIdentity.middleName);
	const firstSurname = readValue("basic-first-surname", taxpayerIdentity.firstSurname);
	const secondSurname = readValue("basic-second-surname", taxpayerIdentity.secondSurname);
	const documentType = readValue("basic-id-class", taxpayerIdentity.documentType);
	const documentTypeLabel = document.getElementById("basic-id-class")?.selectedOptions[0]?.textContent.trim() || "Cédula de ciudadanía";
	const documentNumber = readValue("basic-document-number", taxpayerIdentity.documentNumber);
	const documentIssueDate = readValue("basic-document-issue-date", taxpayerIdentity.documentIssueDate);
	const withholdingAgent = document.getElementById("basic-withholding-agent")?.value ?? taxpayerIdentity.withholdingAgent;
	const fullName = firstName === "MIGUEL" && firstSurname === "SALAZAR"
		? "Miguel Salazar"
		: [firstName, firstSurname].filter(Boolean).join(" ");
	const initials = `${firstName.charAt(0)}${firstSurname.charAt(0)}`.toLocaleUpperCase("es");
	return { firstName, middleName, firstSurname, secondSurname, fullName, initials, documentType, documentTypeLabel, documentNumber, documentIssueDate, withholdingAgent };
}

function syncTaxpayerProfile() {
	const identity = getTaxpayerIdentity();
	if (!taxpayerSession?.requiresObject) taxpayerIdentity = identity;
	const profileName = document.getElementById("profileName");
	const profileInitials = document.getElementById("profileInitials");
	const profileButton = document.getElementById("profileMenuButton");
	if (profileName) profileName.textContent = identity.fullName;
	if (profileInitials) profileInitials.textContent = identity.initials;
	if (profileButton) profileButton.setAttribute("aria-label", `Cuenta de ${identity.fullName}, ${document.querySelector(".profile-current-role")?.textContent.trim() || "Contribuyente"}`);
}

function restoreTaxpayerIdentityFields() {
	const fields = {
		"basic-first-name": taxpayerIdentity.firstName,
		"basic-middle-name": taxpayerIdentity.middleName,
		"basic-first-surname": taxpayerIdentity.firstSurname,
		"basic-second-surname": taxpayerIdentity.secondSurname,
		"basic-id-class": taxpayerIdentity.documentType,
		"basic-document-number": taxpayerIdentity.documentNumber,
		"basic-document-issue-date": taxpayerIdentity.documentIssueDate,
		"basic-withholding-agent": taxpayerIdentity.withholdingAgent,
	};
	Object.entries(fields).forEach(([id, value]) => {
		const field = document.getElementById(id);
		if (field) field.value = value;
	});
}

function persistRitFormValues(values) {
	window.localStorage.setItem(ritFormStorageKey, JSON.stringify(values));
	ritFormValues = values;
}

function readRitFormValues(root) {
	const values = {};
	root.querySelectorAll("input[id], select[id], textarea[id]").forEach(field => {
		if (field.type !== "password" && field.type !== "file") values[field.id] = { value: field.value, checked: field.checked };
	});
	return values;
}

function saveRitPersonalData() {
	const personalDataForm = contentRoot.querySelector('form[aria-label="Formulario Mi RIT"]');
	if (!personalDataForm) return;
	const nextValues = readRitFormValues(personalDataForm);
	const status = document.getElementById("ritSaveStatus");
	try {
		persistRitFormValues(nextValues);
		taxpayerIdentity = getTaxpayerIdentity();
		syncTaxpayerProfile();
		if (status) {
			status.textContent = "Cambios guardados en este navegador.";
			status.classList.remove("text-secondary", "text-danger");
			status.classList.add("text-success");
		}
	} catch (error) {
		if (status) {
			status.textContent = "No se pudieron guardar los cambios. Intenta nuevamente.";
			status.classList.remove("text-secondary", "text-success");
			status.classList.add("text-danger");
		}
		console.error("No fue posible guardar los datos de Mi RIT.", error);
	}
}

// Empresas de demostración; el selector solo dibuja diez resultados a la vez.
const representedCompanies = Array.from({ length: 1000 }, (_, index) => ({
	id: String(index + 1),
	name: index < 5 ? ["Cafés Altos del Roble S.A.S.", "Comercializadora Sierra Clara S.A.S.", "Inversiones Alameda Norte S.A.S.", "Soluciones Logísticas Arboleda S.A.S.", "Textiles Valle Azul S.A.S."][index] : `Grupo Empresarial Horizonte ${String(index + 1).padStart(4, "0")} S.A.S.`,
	nit: String(900000001 + index),
}));
let activeCompany = null;
let companySelection = null;
let companyPage = 1;
let pendingDeclarationsPage = 1;

function companySearchResults(query) {
	const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
	const term = normalize(query.trim());
	const nitTerm = term.replace(/[.\s-]/g, "");
	return representedCompanies.filter((company) => normalize(`${company.name} ${company.nit}`).includes(term) || (/^\d+$/.test(nitTerm) && company.nit.includes(nitTerm)));
}

function renderCompanyResults() {
	const results = companySearchResults(document.getElementById("companySearch").value);
	const pages = Math.max(1, Math.ceil(results.length / 10));
	companyPage = Math.min(companyPage, pages);
	const start = (companyPage - 1) * 10;
	document.getElementById("companyResults").innerHTML = results.slice(start, start + 10).map((company) => `<label class="list-group-item list-group-item-action d-flex gap-3 align-items-center py-3 company-result ${companySelection?.id === company.id ? 'company-result-selected' : ''}"><input class="form-check-input flex-shrink-0 mt-0" type="radio" name="representedCompany" value="${company.id}" ${companySelection?.id === company.id ? "checked" : ""}><span class="flex-grow-1 text-break"><strong class="d-block">${company.name}</strong><span class="small text-secondary">NIT ${company.nit}</span></span>${activeCompany?.id === company.id ? '<span class="badge text-bg-light border flex-shrink-0">Actual</span>' : ''}</label>`).join("") || '<div class="text-center p-4"><i class="bi bi-search fs-3 text-secondary" aria-hidden="true"></i><p class="fw-semibold mt-2 mb-1">No encontramos empresas</p><p class="small text-secondary mb-0">Revisa el nombre o NIT, o limpia la búsqueda para ver todas.</p></div>';
	document.getElementById("companyResultsSummary").textContent = results.length ? `${start + 1}–${Math.min(start + 10, results.length)} de ${results.length.toLocaleString("es-CO")} empresas · Página ${companyPage} de ${pages}` : "0 empresas";
	document.getElementById("companyPrevious").disabled = companyPage <= 1;
	document.getElementById("companyNext").disabled = companyPage >= pages;
	document.getElementById("companyContinue").disabled = !companySelection || companySelection.id === activeCompany?.id;
	document.getElementById("companyContinue").textContent = activeCompany ? "Cambiar a esta empresa" : "Continuar con esta empresa";
	document.getElementById("companySelectedSummary").textContent = companySelection ? (companySelection.id === activeCompany?.id ? "Esta es tu empresa actual. Selecciona otra para cambiar." : `Seleccionada: ${companySelection.name} · NIT ${companySelection.nit}`) : "Selecciona una empresa para continuar.";
	document.getElementById("companyClearSearch").disabled = !document.getElementById("companySearch").value;
	const pageInput = document.getElementById("companyPageNumber");
	pageInput.value = companyPage;
	pageInput.max = pages;
	pageInput.disabled = pages <= 1;
}

function openCompanySelector() {
	companySelection = activeCompany;
	companyPage = 1;
	document.getElementById("companySearch").value = "";
	document.getElementById("companySelectorTitle").textContent = activeCompany ? "Cambiar de empresa" : "Selecciona la empresa que representas";
	const currentContext = document.getElementById("companyCurrentContext");
	currentContext.classList.toggle("d-none", !activeCompany);
	currentContext.textContent = activeCompany ? `Empresa actual: ${activeCompany.name} · NIT ${activeCompany.nit}. El cambio se aplicará al confirmar.` : "";
	renderCompanyResults();
	bootstrap.Modal.getOrCreateInstance(document.getElementById("companySelectorModal")).show();
}

function renderStyleGuide() {
	const palette = [
		["Primary", "#0d6efd", "bg-primary"],
		["Secondary", "#6c757d", "bg-secondary"],
		["Success", "#198754", "bg-success"],
		["Danger", "#dc3545", "bg-danger"],
		["Warning", "#ffc107", "bg-warning"],
		["Info", "#0dcaf0", "bg-info"],
		["Light", "#f8f9fa", "bg-light"],
		["Dark", "#212529", "bg-dark"],
	];
	const colorTokens = palette.map(([name, value, utility]) => `<div class="col-6 col-md-3"><div class="card h-100"><div class="card-body"><span class="d-inline-block rounded border ${utility} p-3" aria-hidden="true"></span><h3 class="h6 mt-2 mb-1">${name}</h3><code>${value}</code><p class="small text-secondary mt-2 mb-0">Clase <code>${utility}</code></p></div></div></div>`).join("");
	const componentStates = `<div class="row g-4">
			<div class="col-12"><h3 class="h6 text-secondary">Botones</h3><div class="d-flex flex-wrap align-items-center gap-2"><button class="btn btn-primary" type="button">Principal</button><button class="btn btn-secondary" type="button">Secundario</button><button class="btn btn-success" type="button">Éxito</button><button class="btn btn-danger" type="button">Peligro</button><button class="btn btn-warning" type="button">Advertencia</button><button class="btn btn-info" type="button">Información</button><button class="btn btn-light" type="button">Claro</button><button class="btn btn-dark" type="button">Oscuro</button><button class="btn btn-link" type="button">Enlace</button></div><div class="d-flex flex-wrap align-items-center gap-2 mt-3"><button class="btn btn-outline-primary" type="button">Contorno</button><button class="btn btn-primary active" type="button" aria-pressed="true">Activo</button><button class="btn btn-primary" type="button" disabled>Deshabilitado</button><button class="btn btn-primary btn-sm" type="button">Pequeño</button><button class="btn btn-primary btn-lg" type="button">Grande</button><div class="btn-group" role="group" aria-label="Grupo de acciones"><button class="btn btn-outline-secondary" type="button">Anterior</button><button class="btn btn-outline-secondary" type="button">Siguiente</button></div></div><p class="small text-secondary mt-2 mb-0">Prueba hover y foco con el puntero o el teclado.</p></div>
			<div class="col-12 col-lg-6"><h3 class="h6 text-secondary">Campos y validación</h3><div class="mb-3"><label class="form-label" for="guideInputDefault">Normal</label><input class="form-control" id="guideInputDefault" placeholder="Escribe un dato"></div><div class="mb-3"><label class="form-label" for="guideInputValid">Válido</label><input class="form-control is-valid" id="guideInputValid" value="Dato verificado"><div class="valid-feedback">Se ve correcto.</div></div><div class="mb-3"><label class="form-label" for="guideInputInvalid">Inválido</label><input class="form-control is-invalid" id="guideInputInvalid" value="Dato incompleto"><div class="invalid-feedback">Revisa este campo.</div></div><div class="mb-3"><label class="form-label" for="guideInputDisabled">Deshabilitado</label><input class="form-control" id="guideInputDisabled" placeholder="No editable" disabled></div><div class="mb-3"><label class="form-label" for="guideInputReadonly">Solo lectura</label><input class="form-control" id="guideInputReadonly" value="Dato de consulta" readonly></div><label class="form-label" for="guideSelect">Lista de opciones</label><select class="form-select mb-3" id="guideSelect"><option selected>Selecciona una opción</option><option>Opción disponible</option></select><select class="form-select" aria-label="Lista deshabilitada" disabled><option>Lista deshabilitada</option></select></div>
			<div class="col-12 col-lg-6"><h3 class="h6 text-secondary">Controles de formulario</h3><fieldset class="mb-3"><legend class="fs-6">Casillas</legend><div class="form-check"><input class="form-check-input" type="checkbox" id="guideCheckOff"><label class="form-check-label" for="guideCheckOff">Sin seleccionar</label></div><div class="form-check"><input class="form-check-input" type="checkbox" id="guideCheckOn" checked><label class="form-check-label" for="guideCheckOn">Seleccionada</label></div><div class="form-check"><input class="form-check-input" type="checkbox" id="guideCheckDisabled" disabled><label class="form-check-label" for="guideCheckDisabled">Deshabilitada</label></div></fieldset><fieldset class="mb-3"><legend class="fs-6">Opciones únicas</legend><div class="form-check"><input class="form-check-input" type="radio" name="guideRadio" id="guideRadioOn" checked><label class="form-check-label" for="guideRadioOn">Seleccionada</label></div><div class="form-check"><input class="form-check-input" type="radio" name="guideRadio" id="guideRadioOff"><label class="form-check-label" for="guideRadioOff">Sin seleccionar</label></div><div class="form-check"><input class="form-check-input" type="radio" name="guideRadioDisabled" id="guideRadioDisabled" disabled><label class="form-check-label" for="guideRadioDisabled">Deshabilitada</label></div></fieldset><div class="form-check form-switch mb-3"><input class="form-check-input" type="checkbox" role="switch" id="guideSwitch"><label class="form-check-label" for="guideSwitch">Interruptor apagado</label></div><div class="form-check form-switch mb-3"><input class="form-check-input" type="checkbox" role="switch" id="guideSwitchOn" checked><label class="form-check-label" for="guideSwitchOn">Interruptor encendido</label></div><label class="form-label" for="guideRange">Rango</label><input type="range" class="form-range" id="guideRange"></div>
			<div class="col-12"><h3 class="h6 text-secondary">Grupo de entrada</h3><div class="input-group mb-3"><span class="input-group-text">$</span><input class="form-control" aria-label="Valor" placeholder="Valor"><span class="input-group-text">COP</span></div><div class="input-group"><span class="input-group-text">@</span><input class="form-control" aria-label="Usuario" placeholder="Correo o usuario" disabled></div></div>
			<div class="col-12 col-lg-6"><h3 class="h6 text-secondary">Navegación</h3><nav aria-label="Ruta"><ol class="breadcrumb"><li class="breadcrumb-item"><a href="#">Inicio</a></li><li class="breadcrumb-item"><a href="#">Mis impuestos</a></li><li class="breadcrumb-item active" aria-current="page">Detalle</li></ol></nav><ul class="nav nav-tabs mb-3" id="guideTabs" role="tablist"><li class="nav-item" role="presentation"><button class="nav-link active" id="guide-tab-one" data-bs-toggle="tab" data-bs-target="#guide-pane-one" type="button" role="tab" aria-controls="guide-pane-one" aria-selected="true">Activa</button></li><li class="nav-item" role="presentation"><button class="nav-link" id="guide-tab-two" data-bs-toggle="tab" data-bs-target="#guide-pane-two" type="button" role="tab" aria-controls="guide-pane-two" aria-selected="false">Disponible</button></li><li class="nav-item" role="presentation"><button class="nav-link" type="button" disabled>Deshabilitada</button></li></ul><div class="tab-content border rounded p-3 mb-3"><div class="tab-pane fade show active" id="guide-pane-one" role="tabpanel" aria-labelledby="guide-tab-one" tabindex="0">Contenido de la pestaña activa.</div><div class="tab-pane fade" id="guide-pane-two" role="tabpanel" aria-labelledby="guide-tab-two" tabindex="0">Contenido de la segunda pestaña.</div></div><ul class="nav nav-pills mb-3"><li class="nav-item"><a class="nav-link active" href="#">Activa</a></li><li class="nav-item"><a class="nav-link" href="#">Disponible</a></li><li class="nav-item"><a class="nav-link disabled" aria-disabled="true">Deshabilitada</a></li></ul><div class="dropdown"><button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">Menú desplegable</button><ul class="dropdown-menu"><li><a class="dropdown-item active" href="#">Opción activa</a></li><li><a class="dropdown-item" href="#">Opción disponible</a></li><li><a class="dropdown-item disabled" aria-disabled="true">Opción deshabilitada</a></li></ul></div></div>
			<div class="col-12 col-lg-6"><h3 class="h6 text-secondary">Paginación</h3><nav aria-label="Páginas de la guía visual"><ul class="pagination pagination-sm flex-wrap mb-0">${paginationControls(1, 2)}</ul></nav><h3 class="h6 text-secondary mt-4">Lista</h3><div class="list-group"><a href="#" class="list-group-item list-group-item-action active" aria-current="true">Elemento activo</a><a href="#" class="list-group-item list-group-item-action">Elemento disponible</a><button type="button" class="list-group-item list-group-item-action" disabled>Elemento deshabilitado</button></div></div>
			<div class="col-12"><h3 class="h6 text-secondary">Tarjetas y tabla</h3><div class="row g-3 mb-3"><div class="col-12 col-md-6"><div class="card"><div class="card-header">Encabezado</div><div class="card-body"><h4 class="h6 card-title">Tarjeta estándar</h4><p class="card-text">Superficie para agrupar información y acciones.</p><button class="btn btn-primary btn-sm" type="button">Acción</button></div><div class="card-footer text-secondary">Pie de tarjeta</div></div></div><div class="col-12 col-md-6"><div class="card text-bg-primary"><div class="card-body"><h4 class="h6 card-title">Variante destacada</h4><p class="card-text mb-0">Tarjeta con fondo contextual.</p></div></div></div></div><div class="table-responsive app-table-container mb-3"><table class="table app-table table-hover align-middle mb-0"><thead class="table-light"><tr><th scope="col">Estado</th><th scope="col">Descripción</th><th scope="col">Acción</th></tr></thead><tbody><tr><td>${tableBadge('Pagado', 'success')}</td><td>Fila normal</td><td><button class="btn btn-outline-primary btn-sm" type="button">Ver</button></td></tr><tr><td>${tableBadge('Pendiente', 'warning')}</td><td>Fila con hover al pasar el puntero</td><td><button class="btn btn-outline-secondary btn-sm" type="button" disabled>Sin acción</button></td></tr></tbody></table></div></div>
			<div class="col-12"><h3 class="h6 text-secondary">Insignias y alertas</h3><div class="d-flex flex-wrap gap-2 mb-3"><span class="badge text-bg-primary">Primaria</span><span class="badge text-bg-secondary">Secundaria</span><span class="badge text-bg-success">Completado</span><span class="badge text-bg-danger">Error</span><span class="badge text-bg-warning">Pendiente</span><span class="badge text-bg-info">Información</span><span class="badge text-bg-light">Neutra</span><span class="badge text-bg-dark">Oscura</span><span class="badge rounded-pill text-bg-primary">Píldora</span></div><div class="alert alert-primary" role="alert"><strong>Información.</strong> Mensaje informativo.</div><div class="alert alert-success" role="alert"><strong>Éxito.</strong> La acción se completó correctamente.</div><div class="alert alert-warning" role="alert"><strong>Atención.</strong> Revisa los datos antes de continuar.</div><div class="alert alert-danger" role="alert"><strong>Error.</strong> No fue posible completar la acción.</div><div class="alert alert-secondary alert-dismissible fade show" role="alert">Alerta descartable: usa el botón de cerrar para ocultarla.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button></div></div>
			<div class="col-12 col-lg-6"><h3 class="h6 text-secondary">Progreso y carga</h3><div class="progress mb-3" role="progressbar" aria-label="Progreso normal" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar" style="width: 25%">25%</div></div><div class="progress mb-3" role="progressbar" aria-label="Progreso completado" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar bg-success" style="width: 100%">Completado</div></div><div class="progress mb-3" role="progressbar" aria-label="Progreso activo" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 60%">En curso</div></div><div class="d-flex align-items-center gap-3"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div><div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div><div class="spinner-border spinner-border-sm text-success" role="status"><span class="visually-hidden">Cargando...</span></div><span class="small text-secondary">Cargando, crecimiento y tamaño pequeño.</span></div></div>
			<div class="col-12 col-lg-6"><h3 class="h6 text-secondary">Paneles expandibles</h3><p><button class="btn btn-outline-primary" type="button" data-bs-toggle="collapse" data-bs-target="#guideCollapse" aria-expanded="false" aria-controls="guideCollapse">Abrir o cerrar detalle</button></p><div class="collapse" id="guideCollapse"><div class="card card-body mb-3">Contenido colapsado: estado abierto.</div></div><div class="accordion" id="guideAccordion"><div class="accordion-item"><h4 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#guideAccordionOpen" aria-expanded="true" aria-controls="guideAccordionOpen">Sección expandida</button></h4><div id="guideAccordionOpen" class="accordion-collapse collapse show" data-bs-parent="#guideAccordion"><div class="accordion-body">Este panel está abierto; pulsa el encabezado para cerrarlo.</div></div></div><div class="accordion-item"><h4 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#guideAccordionClosed" aria-expanded="false" aria-controls="guideAccordionClosed">Sección contraída</button></h4><div id="guideAccordionClosed" class="accordion-collapse collapse" data-bs-parent="#guideAccordion"><div class="accordion-body">Este panel inicia cerrado.</div></div></div></div></div>
			<div class="col-12"><h3 class="h6 text-secondary">Ventana modal</h3><p class="mb-0"><button class="btn btn-primary" type="button" data-bs-toggle="modal" data-bs-target="#guideComponentModal">Abrir ventana modal</button></p><div class="modal fade" id="guideComponentModal" tabindex="-1" aria-labelledby="guideComponentModalLabel" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h4 class="modal-title fs-5" id="guideComponentModalLabel">Ventana modal</h4><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div><div class="modal-body">Estado abierto. Puedes cerrar esta ventana con el botón, con Escape o pulsando fuera del cuadro.</div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button><button type="button" class="btn btn-primary" data-bs-dismiss="modal">Aceptar</button></div></div></div></div></div>
		</div>`;
	return `${pageTitle("Guía visual", "Referencia de tokens Bootstrap, tipografía y variantes que utiliza la Oficina Virtual.")}
		${section("Colores y tokens", `<div class="row g-3">${colorTokens}</div><p class="small text-secondary mt-3 mb-0">Valores de la paleta predeterminada de Bootstrap 5.</p>`)}
		${section("Variantes de texto", `<div class="row g-4">
			<div class="col-12 col-lg-6"><h3 class="h6 text-secondary">Jerarquía de encabezados</h3><div class="border rounded p-3"><p class="h1 mb-2">Encabezado h1</p><p class="h2 mb-2">Encabezado h2</p><p class="h3 mb-2">Encabezado h3</p><p class="h4 mb-2">Encabezado h4</p><p class="h5 mb-2">Encabezado h5</p><p class="h6 mb-0">Encabezado h6</p></div></div>
			<div class="col-12 col-lg-6"><h3 class="h6 text-secondary">Tamaños y énfasis</h3><div class="border rounded p-3"><p class="display-6 mb-2">Texto display</p><p class="lead mb-2">Texto lead para introducciones.</p><p class="mb-2">Texto de cuerpo para información y formularios.</p><p class="small text-secondary mb-2">Texto auxiliar y descripciones secundarias.</p><p class="fw-semibold mb-2">Texto con énfasis semibold.</p><p class="text-primary mb-0">Texto de enlace o acción principal.</p></div></div>
		</div>`)}
		${section("Componentes y estados", componentStates)}
	`;
}

function dashboardDeclarations() {
	const rows = [
		{ declaration: "100000047309", tax: "Impuesto Predial", year: "2026", period: "—", status: "Pendiente por firmar" },
		{ declaration: "100000047428", tax: "Impuestos de Vehículos", year: "2026", period: "—", status: "Pendiente por presentar" },
		{ declaration: "100000047556", tax: "Impuestos de Vehículos", year: "2026", period: "—", status: "Pendiente por firmar" },
		{ declaration: "100000047681", tax: "Impuestos de Vehículos", year: "2026", period: "—", status: "Pendiente por presentar" },
		{ declaration: "100000047809", tax: "Impuestos de Delineación Urbana", year: "2017", period: "—", status: "Pendiente por presentar" },
		// Datos de ejemplo para completar 20 declaraciones y probar la paginación.
		...Array.from({ length: 15 }, (_, index) => ({
			declaration: String(100000000 + index).padStart(12, "0"),
			tax: ["Impuesto Predial", "Impuestos de Vehículos", "ICA", "Impuestos de Delineación Urbana"][index % 4],
			year: String(2026 - (index % 3)),
			period: index % 4 === 2 ? String((index % 6) + 1) : "—",
			status: index % 2 === 0 ? "Pendiente por firmar" : "Pendiente por presentar",
		})),
	];
	const taxByLabel = {
		'Impuesto Predial': 'predial', 'Impuestos de Vehículos': 'vehiculos',
		ICA: 'ica', 'Impuestos de Delineación Urbana': 'delineacion',
	};
	return rows.map((declaration, index) => {
		const tax = taxByLabel[declaration.tax];
		const object = tax === 'vehiculos' ? taxpayerHomeObjects.vehiculos[index % taxpayerHomeObjects.vehiculos.length]
			: tax === 'ica' ? getTaxpayerIdentity().documentNumber : taxpayerHomeObjects[tax];
		if (taxpayerSession && taxpayerObjectRules[tax] && !taxpayerCanConsult(taxpayerSession, tax, object)) return null;
		const reference = activeCompany ? String(300000000000 + Number(activeCompany.id) * 100 + index) : declaration.declaration;
		return { ...declaration, declaration: reference, taxId: tax, object };
	}).filter(Boolean);
}

function renderDashboard() {
	const identity = activeCompany ? { fullName: activeCompany.name, documentType: "NIT", documentTypeLabel: "Número de identificación tributaria", documentNumber: activeCompany.nit } : getTaxpayerIdentity();
	const pendingRows = dashboardDeclarations().map(declaration => {
		const statusColor = declaration.status === "Pendiente por firmar" ? "info" : "warning";
		const searchText = Object.values(declaration).join(" ").toLocaleLowerCase("es");
		const params = new URLSearchParams({ impuesto: declaration.tax, vigencia: declaration.year, declaracion: declaration.declaration, origen: 'inicio' });
		if (declaration.object) params.set('objeto', declaration.object);
		if (declaration.period !== '—') params.set('periodo', declaration.period);
		return `<tr data-pending-declaration-row data-search-text="${icaEscape(searchText)}">
			<td><span class="fw-semibold text-nowrap">${declaration.declaration}</span>${declaration.object ? `<span class="d-block small text-secondary">${icaEscape(declaration.object)}</span>` : ''}</td>
			<td>${declaration.tax}</td>
			<td class="text-center">${declaration.year}</td>
			<td class="text-center">${declaration.period}</td>
			<td>${tableBadge(declaration.status, statusColor)}</td>
			<td class="text-center"><a class="btn btn-outline-primary btn-sm px-3" href="?${icaEscape(params.toString())}#declaraciones-generar"><i class="bi bi-eye me-1" aria-hidden="true"></i>Ver</a></td>
		</tr>`;
	}).filter(Boolean);
	const rows = pendingRows.join('');
	const content = `${tableToolbar({ sizeId: "pendingDeclarationsPageSize", searchId: "pendingDeclarationsSearch", placeholder: "Número o impuesto", searchLabel: "Buscar declaraciones" })}
	<div class="table-responsive app-table-container mb-3" tabindex="0" role="region" aria-label="Declaraciones pendientes"><table class="table app-table table-hover align-middle mb-0" id="pending-declarations-table" data-pagination-managed>
		<caption class="visually-hidden">Declaraciones tributarias pendientes de firma o presentación</caption>
		<thead class="table-light"><tr><th scope="col">Declaración</th><th scope="col">Impuesto</th><th scope="col" class="text-center">Año gravable</th><th scope="col" class="text-center">Periodo</th><th scope="col">Estado</th><th scope="col" class="text-center">Acciones</th></tr></thead>
		<tbody>${rows}</tbody>
	</table></div>
	${tablePaginationFooter({ label: "declaraciones pendientes", summaryAttributes: 'id="pendingDeclarationsSummary"', paginationAttributes: 'id="pendingDeclarationsPagination"' })}`;
	return `${pageTitle(activeCompany ? `Inicio de ${identity.fullName}` : `Bienvenida, ${identity.fullName}.`)}<section class="bg-white border rounded-3 p-3 p-md-4 mb-4" id="dashboardWelcomeSection" aria-label="Datos del usuario">
		<h2 class="h6 fw-semibold mb-3">${activeCompany ? 'Datos de la empresa' : 'Datos de tu cuenta'}</h2>
		<dl class="row mb-0">
			<dt class="col-sm-4 col-md-3">Nombre del contribuyente</dt><dd class="col-sm-8 col-md-9">${identity.fullName}</dd>
			<dt class="col-sm-4 col-md-3">Tipo de documento</dt><dd class="col-sm-8 col-md-9">${identity.documentType} - ${identity.documentTypeLabel.replace(`${identity.documentType} - `, "")}</dd>
			<dt class="col-sm-4 col-md-3 mb-0">Número de documento</dt><dd class="col-sm-8 col-md-9 mb-0">${identity.documentNumber}</dd>
		</dl>
	</section>${pageTitle("Lista de declaraciones pendientes")}<section class="card border-0 shadow-sm mb-0" id="pendingDeclarationsSection" aria-label="Declaraciones pendientes"><div class="card-body p-3 p-md-4">${content}</div></section>`;
}

function filterPendingDeclarations(resetPage = false) {
	const tableElement = document.getElementById("pending-declarations-table");
	if (!tableElement) return;
	if (resetPage) pendingDeclarationsPage = 1;
	const query = document.getElementById("pendingDeclarationsSearch").value.trim().toLocaleLowerCase("es");
	const rows = [...tableElement.querySelectorAll("[data-pending-declaration-row]")];
	if (!rows.length) return;
	const matchingRows = rows.filter((row) => row.dataset.searchText.includes(query));
	const pageSize = Number(document.getElementById("pendingDeclarationsPageSize").value) || 10;
	const pageCount = Math.max(1, Math.ceil(matchingRows.length / pageSize));
	pendingDeclarationsPage = Math.min(pendingDeclarationsPage, pageCount);
	const firstIndex = (pendingDeclarationsPage - 1) * pageSize;

	rows.forEach((row) => {
		const matchIndex = matchingRows.indexOf(row);
		const isVisible = matchIndex >= firstIndex && matchIndex < firstIndex + pageSize;
		row.classList.toggle("d-none", !isVisible);
	});

	const tableBody = tableElement.querySelector("tbody");
	let emptyRow = tableBody.querySelector("[data-pending-declarations-empty]");
	if (matchingRows.length === 0 && !emptyRow) {
		tableBody.insertAdjacentHTML("beforeend", '<tr data-pending-declarations-empty><td class="text-center text-secondary py-4" colspan="6">No se encontraron declaraciones pendientes.</td></tr>');
		emptyRow = tableBody.querySelector("[data-pending-declarations-empty]");
	} else if (matchingRows.length > 0) {
		emptyRow?.remove();
	}
	if (emptyRow) emptyRow.classList.toggle("d-none", matchingRows.length > 0);

	document.getElementById("pendingDeclarationsSummary").textContent = tablePageSummary(matchingRows.length, firstIndex, pageSize);
	document.getElementById("pendingDeclarationsPagination").innerHTML = paginationControls(
		pendingDeclarationsPage, pageCount, page => `data-pending-page="${page}"`
	);
}

function renderRitSummary() {
	const content = `<div class="row g-3"><div class="col-12 col-md-6">${section("Datos de la persona", emptyState("La información personal del RIT se mostrará aquí."))}</div><div class="col-12 col-md-6">${section("Direcciones", emptyState("Las direcciones registradas se mostrarán aquí."))}</div><div class="col-12 col-md-6">${section("Impuestos registrados", emptyState("Los impuestos asociados al RIT se mostrarán aquí."))}</div><div class="col-12 col-md-6">${section("Autorizaciones y agentes", emptyState("Las autorizaciones y los agentes autorizados se mostrarán aquí."))}</div></div>`;
	return `${pageTitle("Resumen del RIT", "Consulta la información principal registrada en tu Registro de Información Tributaria.")}${content}`;
}

function corporateRitFields() {
	const identity = corporateTaxpayerIdentity;
	return [['Tipo de documento', `${identity.documentType} – ${identity.documentTypeLabel}`], ['Número de documento', identity.documentNumber],
		['DV', identity.checkDigit], ['Nombre o razón social', identity.fullName], ['Forma jurídica', identity.legalForm],
		['Número de matrícula mercantil', identity.registration], ['Fecha de liquidación', identity.liquidationDate],
		['Tipo de retenedor', identity.withholdingAgent], ['Clase IC', identity.icClass]];
}

function renderCorporateRit() {
	return pageTitle('Mi RIT', 'Consulta la información registrada de la persona jurídica.')
		+ section('Datos básicos de la persona jurídica', `<dl class="row g-3 mb-0">${corporateRitFields().map(([label, value]) =>
			`<div class="col-12 col-sm-6 col-xl-3"><dt class="small text-secondary fw-semibold">${label}</dt><dd class="mb-0 text-break">${icaEscape(value)}</dd></div>`).join('')}</dl>`)
		+ section('Datos de contacto', emptyState('No hay datos de contacto registrados para esta persona jurídica.'))
		+ section('Autorizaciones', linkTo('rit-agentes', 'Consultar agentes autorizados', 'btn btn-outline-primary btn-sm'))
		+ section('Mis roles tributarios', tableBadge('Gran contribuyente', 'primary') + ' ' + tableBadge('Agente retenedor', 'primary'));
}



const ritCertificateTaxes = [['vehiculos', 'Impuestos de Vehículos', 'vehicles'], ['ica', 'ICA', 'ica'], ['reteica', 'RETEICA', 'reteica']];

function renderRitCertification() {
	const availability = registeredTaxAvailability();
	const taxes = ritCertificateTaxes.filter(([, , key]) => availability[key]).map(([id, label]) => [id, label]);
	const button = '<i class="bi bi-download me-2" aria-hidden="true"></i>Descargar certificado';
	return pageTitle('Certificación RIT')
		+ section('Certificado de inscripción al RIT', `<p>Descargue el certificado que acredita su inscripción en el Registro de Información Tributaria (RIT).</p>
			<button class="btn btn-primary" type="button" data-rit-registration-download>${button}</button>`)
		+ section('Certificado por impuesto', `<p>Consulte y descargue el certificado correspondiente a uno de sus impuestos registrados.</p>
			<form id="ritCertificateForm" class="row g-3 align-items-end"><div class="col-12 col-md-5">
			<label class="form-label" for="ritCertificateTax">Tipo de impuesto</label>
			${renderSelect('ritCertificateTax', taxes, { prompt: 'Seleccione un impuesto', required: true })}
			</div><div class="col-12 col-md-auto"><button class="btn btn-primary" type="submit" disabled>${button}</button></div>
			<div class="col-12" id="ritVehicleCertificateOption" hidden><button type="button" class="btn btn-outline-primary btn-sm" data-rit-vehicle-list>Consultar certificado por vehículo</button></div></form>`)
		+ '<p class="small text-success d-none" id="ritCertificateDownloadStatus" role="status">El PDF se descargó correctamente.</p>';
}

document.addEventListener('click', event => {
	if (event.target.closest('[data-rit-certificate-open]')) location.hash = 'rit-certificacion';
	if (event.target.closest('[data-rit-vehicle-list]')) showRitCertificateList();
	if (event.target.closest('[data-rit-registration-download]')) downloadRitCertificate(undefined, true);
});

const myVehicle = { plate: 'BMM36', brand: 'Auteco Bajaj', line: 'Pulsar', year: '2008', className: 'Motocicleta', body: 'Sin carrocería', doors: '0', armored: 'No', engine: '180', hasOverdueInvoice: true };

const myVehicles = [
 myVehicle,
 { plate: 'JWT71D', brand: 'Ducati', line: '1199 ABS Panigale AW B', year: '2013', className: 'Motocicleta', body: 'Sin carrocería', doors: '0', armored: 'No', engine: '1198' },
 { plate: 'MCU235', brand: 'BMW', line: '328 i', year: '2012', className: 'Automóvil', body: 'Sedán', doors: '4', armored: 'No', engine: '1997' },
];

function showVehicleOverdueAlert(plate = myVehicle.plate) {
 if (document.getElementById('vehicleOverdueModal')) return;
 const modal = document.createElement('div');
 modal.className = 'modal fade';
 modal.id = 'vehicleOverdueModal';
 modal.tabIndex = -1;
 modal.setAttribute('aria-labelledby', 'vehicleOverdueModalTitle');
 modal.setAttribute('aria-describedby', 'vehicleOverdueModalDescription');
 modal.innerHTML = `<div class="modal-dialog modal-dialog-centered modal-sm"><div class="modal-content"><div class="modal-header"><h2 class="modal-title fs-5" id="vehicleOverdueModalTitle">Vehículos</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div><div class="modal-body"><div class="d-flex align-items-start gap-3"><i class="bi bi-exclamation-triangle text-warning fs-4" aria-hidden="true"></i><div><p class="small text-secondary mb-2">Placa ${plate}</p><p class="mb-0" id="vehicleOverdueModalDescription">Tienes una factura vencida para este periodo. Genera un Recibo Oficial de Pago (ROP) para pagarla.</p></div></div></div><div class="modal-footer"><button type="button" class="btn btn-primary" data-bs-dismiss="modal">Entendido</button></div></div></div>`;
 document.body.appendChild(modal);
 const instance = new bootstrap.Modal(modal);
 modal.addEventListener('hidden.bs.modal', () => { instance.dispose(); modal.remove(); document.querySelector('[data-vehicle-overdue-alert]')?.focus(); }, { once: true });
 instance.show();
}
document.addEventListener('click', event => { const trigger = event.target.closest('[data-vehicle-overdue-alert]'); if (trigger) showVehicleOverdueAlert(trigger.dataset.vehicleOverdueAlert || undefined); });

function renderMyVehicles() {
	const consultation = taxpayerSession ? taxpayerQueryForm('my-object', { tax: 'vehiculos' })
		: registeredTaxTable('my-vehicles', 'Mis vehículos', [...vehicleHeaders, 'Acciones'], myVehicleRows(), 'Consulta las características y el detalle de tu vehículo.');
	return `${pageTitle('Mis vehículos')}
		${section('Información del impuesto', `<p class="mb-2">Consulta los vehículos asociados y gestiona tu impuesto anual.</p><div class="collapse" id="vehicleTaxInformation"><div class="pt-2"><p>El impuesto sobre vehículos automotores grava la propiedad o posesión de los vehículos matriculados en Bogotá. Los propietarios y poseedores lo deben declarar y pagar una vez al año.</p><p>La información sobre las características que se presentan a continuación proviene de la Secretaría Distrital de Movilidad de Bogotá. Si encuentra alguna inconsistencia, por favor verifique directamente con esta entidad, a través del Consorcio Circulemos Digital.</p><a href="https://www.shd.gov.co/shd/vehiculos" target="_blank" rel="noopener noreferrer">Más información <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true"></i></a></div></div><button class="btn btn-link px-0 pb-0" type="button" data-bs-toggle="collapse" data-bs-target="#vehicleTaxInformation" aria-expanded="false" aria-controls="vehicleTaxInformation" id="vehicleTaxInformationToggle">Ver más <i class="bi bi-chevron-down ms-1" aria-hidden="true"></i></button>`)}
		<div class="bg-white border rounded-3 p-3 p-md-4 mb-4">${consultation}</div>
		<div class="alert alert-info" role="note"><h2 class="h6 fw-semibold">Nota</h2><p class="mb-0">Para generar una declaración de corrección o una declaración inicial de una vigencia diferente a la actual, ingresa a ${linkTo('declaraciones-generar', 'Declaraciones', 'alert-link')}.</p></div>`;
}

function renderTaxList(title, description = "") {
	const rows = vehicleRows();
	return `${pageTitle(title, description)}${section("Vehículos asociados", table(vehicleHeaders, rows, { label: "Vehículos asociados" }))}`;
}

function renderPredialTax() {
 return `${pageTitle('Impuesto predial', 'Consulta los predios asociados y su información tributaria.')}
 ${section('Información del impuesto', `<p class="mb-2">El Impuesto Predial Unificado lo pagan todos los propietarios, poseedores o usufructuarios de bienes inmuebles ubicados dentro del Distrito Capital.</p><div class="collapse" id="predialInformation"><p class="mt-3">La información que se presenta a continuación proviene de la Unidad Administrativa Especial de Catastro Distrital y la oficina de instrumentos públicos. Si encuentra alguna inconsistencia, verifique directamente con la entidad correspondiente.</p><a href="https://www.shd.gov.co/shd/predial" target="_blank" rel="noopener noreferrer">Más información <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true"></i></a></div><button class="btn btn-link px-0 pb-0" type="button" data-bs-toggle="collapse" data-bs-target="#predialInformation" aria-controls="predialInformation" aria-expanded="false" id="predialInformationToggle">Ver más <i class="bi bi-chevron-down ms-1" aria-hidden="true"></i></button>`)}
 ${section('Predios asociados', taxpayerSession ? taxpayerQueryForm('my-object', { tax: 'predial' }) : registeredTaxTable('my-properties', 'Mis predios', taxpayerPropertyHeaders, taxpayerPredialRows.slice(0, 1), 'Consulta el detalle de tu predio.'))}`;
}

function filterPredialProperties() {
	const tableElement = document.getElementById("predialPropertiesTable");
	if (!tableElement) return;
	const query = document.getElementById("predialSearch").value.trim().toLocaleLowerCase("es");
	const pageSize = Number(document.getElementById("predialPageSize").value);
	const rows = [...tableElement.querySelectorAll("[data-predial-row]")];
	let visibleCount = 0;
	rows.forEach((row) => {
		const matches = row.dataset.searchText.includes(query);
		const isVisible = matches && visibleCount < pageSize;
		row.classList.toggle("d-none", !isVisible);
		if (matches) visibleCount += 1;
	});
	const shownCount = Math.min(visibleCount, pageSize);
	document.getElementById("predialSummary").textContent = visibleCount
		? `Mostrando ${shownCount} de ${visibleCount} predios`
		: "No se encontraron predios.";
}

function renderPaymentPlans() {
	return renderPendingObligations({ multipleRop: true });
}

function renderDeclaration(id) {
	const configs = {
		"declaraciones-blanco": { title: "Generar declaración en blanco", steps: ["Seleccionar tipo de impuesto", "Seleccionar año gravable", "Generar declaración en blanco"], fields: [{ label: "Tipo de impuesto", options: ["Impuesto Predial", "Impuesto de Vehículos", "ICA"], columns: 6 }, { label: "Año gravable", options: yearOptions(2024, 2026), columns: 6 }] },
	};
	const context = new URLSearchParams(window.location.search);
	if (id === "declaraciones-generar") {
		if (context.get('origen') === 'inicio') {
			const record = dashboardDeclarations().find(row => row.declaration === context.get('declaracion'));
			if (!record) return pageTitle('Detalle de la declaración') + emptyState('No se encontró la declaración solicitada.');
			const detail = declarationDetailContext(new URLSearchParams({ impuesto: record.tax, vigencia: record.year, objeto: record.object }));
			if (detail) return renderUnifiedDeclaration({ ...detail, backToDashboard: true });
			const fields = [['Número de declaración', record.declaration], ['Impuesto', record.tax], ['Objeto tributario', record.object],
				['Año gravable', record.year], ...(record.period !== '—' ? [['Periodo', record.period]] : []), ['Estado', record.status]];
			return '<a href="?#inicio" class="btn btn-outline-secondary btn-sm mb-3">Volver a Inicio</a>'
				+ pageTitle('Detalle de la declaración') + taxDetailGroup('Datos de la declaración', fields);
		}
		const consultation = declarationSearchContext(context);
		if (taxpayerSession && (consultation.tax || !context.get('impuesto'))) {
			if (!context.has('objeto')) return renderDeclarationConsultation();
			const declaration = declarationDetailContext(context);
			return declaration ? renderUnifiedDeclaration(declaration)
				: pageTitle(declarationTitle) + emptyState('La declaración no está disponible para el objeto y la vigencia seleccionados.')
					+ `<a class="btn btn-outline-primary mt-3" href="${icaEscape(declarationUrl(consultation))}">Volver a la consulta</a>`;
		}
		const objectContext = taxObjectDeclarationContext(context);
		if (objectContext) return renderTaxObjectDeclarationEntry(objectContext);
		const selectedTax = context.get("impuesto");
		const selectedYear = context.get("vigencia");
		const selectedPeriod = context.get("periodo");
		const fuelSurtax = selectedTax === fuelSurtaxName;
		const fields = [
			{ label: "Tipo de impuesto", options: fuelSurtax ? [fuelSurtaxName] : ["Impuesto Predial", "Impuesto de Vehículos", "ICA", "Impuesto de Delineación Urbana"] },
			{ label: "Año gravable", options: yearOptions(2024, 2026) },
			{ label: "Periodo", options: fuelSurtax ? fuelSurtaxMonths.map(([, month]) => month) : ["Anual", "Primer periodo", "Segundo periodo"] },
		];
		const taxNames = { "Impuestos de Veh\u00edculos": "Impuesto de Veh\u00edculos", "Impuestos de Delineaci\u00f3n Urbana": "Impuesto de Delineaci\u00f3n Urbana" };
		const tax = taxNames[selectedTax] || selectedTax;
		if (fields[0].options.includes(tax)) {
			fields[0].value = tax;
		}
		if (/^\d{4}$/.test(selectedYear || "")) {
			if (!fields[1].options.includes(selectedYear)) fields[1].options.push(selectedYear);
			fields[1].value = selectedYear;
		}
		if (fuelSurtax && fields[2].options.includes(selectedPeriod)) {
			fields[2].value = selectedPeriod;
		} else if (!fuelSurtax && selectedPeriod) {
			fields[2].value = selectedPeriod === "\u2014" ? "Anual" : selectedPeriod;
			if (!fields[2].options.includes(fields[2].value)) fields[2].options.push(fields[2].value);
		}
		const form = filterForm(
			fields.map(field => ({ ...field, required: true, prompt: "Selecciona una opción" })),
			"Continuar",
			{ reset: false, feedback: "El diligenciamiento de la declaración todavía no está disponible en esta sección." }
		);
		return `${pageTitle("Generar declaración", "Selecciona el impuesto y la vigencia para continuar.")}
			<div class="card"><div class="card-body p-3 p-md-4">${form}</div></div>`;
	}
	const config = configs[id];
	if (!config) return `${pageTitle("Declaraciones presentadas", "Consulta el historial de declaraciones presentadas.")}${section("Filtros", `${filterForm([{ label: "Impuesto", options: ["Impuesto Predial", "Impuesto de Vehículos", "ICA"], prompt: "Todos los impuestos", columns: 6 }, { label: "Año gravable", options: yearOptions(2024, 2026), prompt: "Todos los años", columns: 3 }])}${table(["Impuesto", "Año gravable", "Periodo", "Fecha de presentación", "Estado"])}`)}`;
	return `${pageTitle(config.title, "Selecciona los datos de la declaración.")}${section("Pasos", stepFlow(config.steps, config.fields))}`;
}

function renderInvoices() {
	return `${pageTitle("Facturas", "Consulta, descarga o reexpide facturas por impuesto y año gravable.")}${section("Descargar factura", stepFlow(["Seleccionar tipo de impuesto", "Seleccionar año gravable", "Consultar y descargar factura"], [{ label: "Tipo de impuesto", options: ["Impuesto Predial", "Impuesto de Vehículos", "ICA"], columns: 6 }, { label: "Año gravable", options: yearOptions(2024, 2026), columns: 6 }]))}${section("Reexpedir factura", stepFlow(["Seleccionar tipo de impuesto", "Seleccionar año gravable", "Consultar y generar factura"], [{ label: "Tipo de impuesto", options: ["Impuesto Predial", "Impuesto de Vehículos", "ICA"], columns: 6 }, { label: "Año gravable", options: yearOptions(2024, 2026), columns: 6 }]))}`;
}

function renderReceipts() {
	return `${pageTitle("Recibos de pago", "Accede a la generación de recibos de pago.")}${section("Generar recibo multipago", stepFlow(["Seleccionar impuesto", "Seleccionar año gravable", "Seleccionar obligaciones", "Revisar obligaciones seleccionadas", "Generar recibo"], [{ label: "Impuesto", options: ["Impuesto Predial", "Impuesto de Vehículos", "ICA"], columns: 4 }, { label: "Año gravable", options: yearOptions(2024, 2026), columns: 4 }] ))}${section("Generar ROP", emptyState("La generación de recibos todavía no está disponible."))}`;
}

function renderPaymentHistory() { return renderPaymentHistoryPage(); }

function renderProcedures() { return renderProcedureTracking(); }

function paymentCertificationHeaders(tax) {
 const common = ["Periodo", "Referencia", "Valor pago", "Moneda", "Seleccionar"];
 if (tax === 'predial') return ["CHIP", "Matr\u00edcula inmobiliaria", "Referencia pago", "Direcci\u00f3n del predio", "A\u00f1o gravable", "Fecha pago", "Total pago", "Seleccionar"];
 if (tax === 'ica') return common;
 return (tax === 'delineacion' ? ["CDU", "Radicado"] : ["Placa", "Marca"]).concat(common);
}
function syncPaymentCertificationFields() {
 const taxInput = document.getElementById('payment-certification-tax');
 if (!taxInput) return;
 const tax = taxInput.value;
 taxInput.form.classList.remove('was-validated');
 const fields = document.getElementById('payment-certification-extra');
 const label = tax === 'predial' ? 'CHIP' : tax === 'delineacion' ? 'CDU' : 'Placa';
 fields.classList.toggle('d-none', tax === 'ica');
 document.getElementById('payment-certification-identifier-label').textContent = label;
 document.getElementById('payment-certification-identifier-error').textContent = `Ingresa ${label === 'Placa' ? 'la placa' : `el ${label}`}.`;
 document.getElementById('payment-certification-property-type').classList.toggle('d-none', tax !== 'predial');
 document.getElementById('payment-id-chip').checked = true;
 const input = document.getElementById('payment-certification-identifier');
 input.required = tax !== 'ica'; input.disabled = tax === 'ica'; input.value = '';
 document.getElementById('payment-certification-results').innerHTML = table(paymentCertificationHeaders(tax), [], {empty: 'Aún no hay resultados de pagos.'});
 const status = document.getElementById('payment-certification-status');
 status.textContent = ''; status.className = 'mt-3';
}
document.addEventListener('change', event => {
 if (event.target.id === 'payment-certification-tax') syncPaymentCertificationFields();
 if (event.target.name === 'payment-certification-property-type') {
  document.getElementById('payment-certification-identifier-label').textContent = event.target.value === 'chip' ? 'CHIP' : 'Matr\u00edcula inmobiliaria';
  const input = document.getElementById('payment-certification-identifier');
  input.value = '';
  input.form.classList.remove('was-validated');
  document.getElementById('payment-certification-identifier-error').textContent = event.target.value === 'chip' ? 'Ingresa el CHIP.' : 'Ingresa la matrícula inmobiliaria.';
 }
});

document.addEventListener('reset', event => {
	if (event.target.id !== 'payment-certification-form') return;
	const status = document.getElementById('payment-certification-status');
	status.className = 'mt-3';
	status.textContent = '';
	setTimeout(syncPaymentCertificationFields, 0);
});

function renderDocuments(id) {
	if (id === "documentos-declaracion") return pageTitle('<span id="declaration-certification-title" class="d-inline-block pe-3">Certificaciones de declaración</span>');
	if (id === "documentos-multipagos") return renderMultipaymentCertification();
	if (id === "documentos-pago") {
		return `${pageTitle('<span id="payment-certification-title" class="d-inline-block pe-3">Certificaciones de pago</span>', "Consulta los pagos para solicitar una certificación.")}
		
		<div class="alert alert-info">Si la descarga no se abre, permite las ventanas emergentes en tu navegador.</div>
		${section("Consultar pagos", `<form id="payment-certification-form" class="mb-0" data-query-feedback="La consulta de pagos todavía no está disponible." novalidate>
		<div class="row g-3 mb-3">
		<div class="col-12 col-lg-4"><label class="form-label" for="payment-certification-tax">Impuesto</label><select class="form-select" id="payment-certification-tax" required><option value="vehiculos">Impuesto de vehículos automotores</option><option value="predial">Impuesto Predial Unificado</option><option value="ica">Impuesto de Industria y Comercio</option><option value="delineacion">Impuesto de Delineaci\u00f3n Urbana</option></select></div>
		<div class="col-12 col-lg-4"><label class="form-label" for="payment-certification-year">Año del pago <span class="text-danger" aria-hidden="true">*</span></label>${renderSelect("payment-certification-year", yearOptions(2019, 2026), { prompt: "Selecciona un año", required: true })}<div class="invalid-feedback">Selecciona un año.</div></div>
        <div class="col-12 col-lg-4" id="payment-certification-extra">
        <fieldset id="payment-certification-property-type" class="d-none mb-2"><legend class="visually-hidden">Tipo de identificador del predio</legend><div class="form-check form-check-inline"><input class="form-check-input" type="radio" id="payment-id-chip" name="payment-certification-property-type" value="chip" checked><label class="form-check-label" for="payment-id-chip">CHIP</label></div><div class="form-check form-check-inline"><input class="form-check-input" type="radio" id="payment-id-matricula" name="payment-certification-property-type" value="matricula"><label class="form-check-label" for="payment-id-matricula">Matrícula inmobiliaria</label></div></fieldset>
        <label class="form-label" id="payment-certification-identifier-label" for="payment-certification-identifier">Placa</label><input class="form-control text-uppercase" id="payment-certification-identifier" required aria-describedby="payment-certification-identifier-error"><div class="invalid-feedback" id="payment-certification-identifier-error">Ingresa el identificador.</div></div>
		</div>${queryActions()}
		<div id="payment-certification-status" data-query-status role="status"></div></form>`)}
		${section("Resultados", `
        
        <div id="payment-certification-results">${table(paymentCertificationHeaders('vehiculos'), [], {empty: "Aún no hay resultados de pagos."})}</div>
        
		<div class="d-flex justify-content-end gap-2"><button class="btn btn-primary" type="button" disabled>Generar certificado</button></div>
		`)}`;
	}
	if (id === "documentos-retenciones") {
		return `${pageTitle('<span id="withholding-title" class="d-inline-block pe-3">Retenciones practicadas</span>', "Consulta las retenciones por año gravable.")}${section("Año gravable", `${filterForm([{ label: "Año gravable", options: yearOptions(2024, 2026), columns: 6, required: true }])}`)}`;
	}
	const config = {
		"documentos-rit": "Certificación RIT",
		"documentos-pago": "Certificaciones de pago",
		"documentos-multipagos": "Certificación multipagos",
		"documentos-declaracion": "Certificación de declaración",
	};
	return `${pageTitle(config[id], "Pantalla preparada para generar o descargar documentos oficiales.")}${section("Solicitud de certificación", `${filterForm([{ label: "Tipo de certificación", options: [config[id]], columns: 6 }, { label: "Año gravable", options: yearOptions(2024, 2026), columns: 6 }], "Generar certificación")}${emptyState("Selecciona los criterios para continuar.")}`)}`;
}

function notificationItems() {
	const manage = '<a class="btn btn-outline-primary btn-sm" href="https://accstorefront.cpc1y8ebrl-secretari1-s1-public.model-t.cc.commerce.ondemand.com/bogota/es/contribuyentes/presentar-declaracion?impuesto=1&amp;anioGravable=2026" target="_blank" rel="noopener noreferrer" aria-label="Gestionar comunicación en la oficina virtual">Ir <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true"></i></a>';
	const attachments = (names) => `<ul class="list-unstyled small mb-0">${names.map((name) => `<li class="d-flex flex-wrap align-items-center justify-content-between gap-2 border rounded-3 p-3 mb-2"><span><i class="bi bi-file-earmark-pdf text-danger me-2" aria-hidden="true"></i>${name}</span><span><a class="btn btn-outline-primary btn-sm" href="output/pdf/anexo-notificacion-prueba.pdf" download="${name}" aria-label="Descargar ${name}"><i class="bi bi-download me-1" aria-hidden="true"></i>Descargar PDF</a></span></li>`).join('')}</ul>`;
	const rows = [
		['', 'Oficina de Control Masivo', 'Auto de archivo', '24.10.2024 07:00:00', attachments(['Comunicaciones oficiales enviadas.pdf', 'Auto de archivo 105-f-77 puntual y masivo.pdf']), manage],
		['', 'Oficina de Cobro General', 'Resolución que resuelve las excepciones al mandamiento de pago', '29.08.2024 07:00:00', attachments(['Comunicaciones oficiales enviadas.pdf', 'Resolucion de excepciones tributario 110-F.27.pdf']), manage],
		['', 'Oficina de Control Masivo', 'Requerimiento especial', '29.04.2024 07:00:00', attachments(['Comunicaciones oficiales enviadas.pdf', 'Requerimiento Especial Vehicular.pdf']), manage],
		['', 'Oficina de Liquidación', 'Liquidación oficial de revisión', '12.04.2024 07:00:00', '', manage],
	];
	const messages = [
		['', 'Oficina de Control Masivo', 'Documentos disponibles: auto de archivo', '25.10.2024 09:15:00', '', '', 'Ya puedes consultar las comunicaciones y los documentos asociados al auto de archivo en la pestaña Notificaciones.'],
		['', 'Oficina de Cobro General', 'Respuesta a tu consulta sobre el mandamiento de pago', '30.08.2024 10:30:00', '', '', 'La respuesta a tu consulta está disponible. Revisa la resolución que resuelve las excepciones y sus anexos en la bandeja de notificaciones.'],
		['', 'Oficina de Control Masivo', 'Información sobre el requerimiento vehicular', '30.04.2024 08:45:00', '', '', 'Se encuentra disponible una comunicación relacionada con el requerimiento especial vehicular. Consulta el documento correspondiente en Notificaciones.'],
		['', 'Oficina de Liquidación', 'Confirmación de recepción de tu consulta', '15.04.2024 14:20:00', '', '', 'Recibimos tu consulta relacionada con la liquidación oficial de revisión. Las comunicaciones asociadas se publicarán en este buzón.'],
	];
	return [
		{ key: 'notice-demo-cobro-attachments', type: 'Notificación', unread: true, row: ['', 'Oficina de Cobro General', 'Documentos disponibles de tu solicitud de cobro', '05.11.2026 11:30:00', attachments(['Respuesta a solicitud de cobro.pdf', 'Relación de obligaciones.pdf']), '', 'Consulta la respuesta a tu solicitud y la relación de obligaciones en los documentos adjuntos.'] },
		{ key: 'notice-demo-liquidacion-attachments', type: 'Notificación', unread: true, row: ['', 'Oficina de Liquidación', 'Soportes de la liquidación del impuesto', '05.11.2026 10:45:00', attachments(['Detalle de liquidación.pdf', 'Soporte de cálculo.pdf', 'Comunicación de liquidación.pdf']), '', 'Están disponibles los soportes de la liquidación. Descarga los anexos para consultar el detalle.'] },
		{ key: 'notice-demo-new-20261105', type: 'Notificación', unread: true, row: ['', 'Oficina de Control Masivo', 'Nueva comunicación sobre tu impuesto vehicular', '05.11.2026 09:00:00', attachments(['Comunicación impuesto vehicular.pdf']), '', 'Tienes una nueva comunicación sobre tu impuesto vehicular. Consulta y descarga el documento adjunto.'] },
		{ key: 'message-demo-new-20261105', type: 'Mensaje', unread: true, row: ['', 'Oficina de Liquidación', 'Respuesta disponible a tu solicitud', '05.11.2026 08:30:00', '', '', 'La respuesta a tu solicitud sobre la liquidación del impuesto ya está disponible. Revisa tus comunicaciones en este buzón.'] },
		...rows.map((row, index) => ({ row, key: `notice-${index}`, type: "Notificación", unread: index < 2 })),
		...messages.map((row, index) => ({ row, key: `message-${index}`, type: "Mensaje", unread: index < 2 })),
	];
}

let notificationState = {};
try { notificationState = JSON.parse(localStorage.getItem('hacienda-inbox-v1') || '{}') || {}; } catch {}
let notificationPreviewFilter = 'all';
function currentNotificationItems() {
 return notificationItems().map(item => ({ ...item, read: notificationState[item.key]?.read ?? !item.unread, archived: false }));
}
function notificationList(items, compact = false) {
 if (!items.length) return '<div class="text-center p-5 text-secondary"><i class="bi bi-inbox fs-2" aria-hidden="true"></i><p class="mb-0 mt-2">No hay comunicaciones en esta bandeja.</p></div>';
 return items.map(item => {
 const row = item.row;
 const title = row[2];
 const detailId = `${compact ? 'preview' : 'page'}-${item.key}`;
 return `<article class="list-group-item border-start-0 border-end-0 p-3 p-md-4 ${!item.read ? 'bg-primary-subtle' : 'bg-body'}" data-inbox-item data-search="${title} ${row[1]} ${row[3]}">
 <div class="d-flex align-items-start gap-3"><span class="rounded-3 bg-body-secondary text-primary p-2 flex-shrink-0 d-inline-flex align-items-center justify-content-center lh-1"><i class="bi ${item.type === 'Mensaje' ? 'bi-chat-left-text' : 'bi-file-earmark-text'}" aria-hidden="true"></i></span>
 <div class="flex-grow-1"><div class="d-flex align-items-start justify-content-between gap-2"><button class="btn btn-link text-start text-body text-decoration-none p-0 ${!item.read ? 'fw-semibold' : ''}" type="button" data-bs-toggle="collapse" data-bs-target="#${detailId}" aria-expanded="false" aria-controls="${detailId}" data-notification-open="${item.key}">${title}</button>${!item.read ? '<span class="text-primary" aria-label="No leída">&bull;</span>' : ''}</div>
 <p class="small text-secondary mb-1 mt-1">${row[1]}</p><div class="d-flex flex-wrap align-items-center gap-2"><time class="small text-secondary">${row[3].replaceAll('.', '/')}</time><span class="badge rounded-pill text-bg-light border">${item.type}</span></div>
 ${!compact ? `<p class="small text-secondary mt-2 mb-0">${row[6] || 'Comunicación de la Administración Distrital'}</p>` : ''}
 ${row[4] ? `<div class="mt-3"><button class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2" type="button" data-bs-toggle="collapse" data-bs-target="#${detailId}-attachments" aria-expanded="false" aria-controls="${detailId}-attachments"><i class="bi bi-paperclip" aria-hidden="true"></i>Documentos adjuntos <span class="badge rounded-pill text-bg-secondary">${(row[4].match(/<li /g) || []).length}</span><i class="bi bi-chevron-down" aria-hidden="true"></i></button><div class="collapse" id="${detailId}-attachments"><div class="pt-3">${row[4]}</div></div></div>` : ''}
 <div class="collapse" id="${detailId}"><div class="border rounded-3 bg-body p-3 mt-3"><p class="small">${row[6] || 'Consulta los documentos asociados a esta comunicación.'}</p><div class="d-flex flex-wrap gap-2 mt-3">${row[5] || ''}</div></div></div></div></div></article>`;
 }).join('');
}
function notificationTable(items) {
 const headers = ['Oficina gestora', 'Asunto', 'Tipo', 'Estado de lectura', 'Fecha', 'Acciones'];
 const rows = items.map(({ row, type, read, key }) => [
  row[1],
  `<span data-inbox-subject class="${read ? '' : 'fw-semibold'}">${row[2]}</span>`,
  tableBadge(type),
  `<span data-inbox-read>${tableBadge(read ? 'Leída' : 'No leída', read ? 'secondary' : 'info')}</span>`,
  `<time class="text-nowrap">${row[3].replaceAll('.', '/')}</time>`,
  `<div class="d-inline-flex align-items-center flex-nowrap gap-2 text-nowrap">${row[4] ? `<button class="btn btn-outline-primary btn-sm px-3 text-nowrap" type="button" data-inbox-detail="${key}" data-inbox-attachments aria-haspopup="dialog"><i class="bi bi-paperclip me-1" aria-hidden="true"></i>Anexos (${(row[4].match(/<li /g) || []).length})</button>` : ''}<button class="btn btn-outline-primary btn-sm px-3 text-nowrap" type="button" data-inbox-detail="${key}" aria-haspopup="dialog"><i class="bi bi-eye me-1" aria-hidden="true"></i>Ver</button></div>`
 ]);
 return table(headers, rows, {
  id: 'notification-page-list', paginationManaged: true, label: 'Comunicaciones del buzón', containerClass: 'mx-3 mb-3',
  empty: 'No hay comunicaciones en esta bandeja.', unsortable: [5],
  rowAttributes: index => {
   const { row, read } = items[index];
   return `data-inbox-item class="${read ? '' : 'table-primary'}" data-search="${row[2]} ${row[1]} ${row[3].replaceAll('.', '/')} ${row[3]}"`;
  }
 });
}

document.addEventListener('click', event => {
 const trigger = event.target.closest('[data-inbox-detail]');
 if (!trigger) return;
 const item = currentNotificationItems().find(({ key }) => key === trigger.dataset.inboxDetail);
 if (!item) return;
 const { key, row } = item;
 const rowElement = trigger.closest('tr');
 notificationState[key] = { ...notificationState[key], read: true };
 try { localStorage.setItem('hacienda-inbox-v1', JSON.stringify(notificationState)); } catch {}
 rowElement.classList.remove('table-primary');
 rowElement.querySelector('[data-inbox-subject]').classList.remove('fw-semibold');
 const badge = rowElement.querySelector('[data-inbox-read]');
 badge.innerHTML = tableBadge('Leída');
 refreshNotificationPreview();
 showDetailModal({
  title: trigger.hasAttribute('data-inbox-attachments') ? 'Documentos adjuntos' : row[2],
  trigger,
  body: `<p class="small text-secondary">${row[1]} · ${row[3].replaceAll('.', '/')}</p><p>${row[6] || 'Consulta los documentos asociados a esta comunicación.'}</p>${row[4] || ''}${row[5] || ''}`
 });
});

function renderNotifications(id) {
 const all = currentNotificationItems();
 const unread = all.filter(item => !item.read && !item.archived).length;
 const emptyDemo = new URLSearchParams(window.location.search).get('demo') === 'empty';
 const items = emptyDemo ? [] : all.filter(item => (id !== 'notificaciones-no-leidas' || !item.read) && (id !== 'notificaciones-notificaciones' || item.type === 'Notificación') && (id !== 'notificaciones-mensajes' || item.type === 'Mensaje'));
 return `<section class="container-fluid py-3 px-0 notification-inbox"><div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3"><div><h1 class="h3 fw-semibold mb-1">Notificaciones <span class="badge rounded-pill text-bg-primary fs-6" data-notification-count>${unread}</span></h1><p class="text-secondary small mb-0">Consulta las comunicaciones y actos administrativos asociados a tu identificación.</p></div><button class="btn btn-outline-secondary btn-sm" type="button" data-notification-read-all>Marcar todas como leídas</button></div>
 <div class="card border-0 rounded-3 overflow-hidden"><div class="card-header bg-body px-3 pt-3 pb-0"><nav class="nav nav-tabs gap-1" aria-label="Filtrar notificaciones">${[['notificaciones-todas','Todas'],['notificaciones-no-leidas','No leídas'],['notificaciones-notificaciones','Notificaciones'],['notificaciones-mensajes','Mensajes']].map(([route,label]) => `<a class="nav-link ${id === route ? 'active' : 'text-secondary'}" href="#${route}" ${id === route ? 'aria-current="page"' : ''}>${label} <span class="badge rounded-pill bg-light text-body border ms-2" ${route === 'notificaciones-no-leidas' ? 'data-notification-count' : ''}>${route === 'notificaciones-todas' ? all.length : route === 'notificaciones-no-leidas' ? unread : all.filter(item => item.type === (route === 'notificaciones-mensajes' ? 'Mensaje' : 'Notificación')).length}</span></a>`).join('')}</nav></div>
 <div class="p-3 p-md-4">${tableToolbar({ sizeId: "notification-page-size", searchId: "notification-search", placeholder: "Buscar por asunto, oficina o fecha", searchLabel: "Buscar comunicaciones" })}</div>${notificationTable(items)}<p class="d-none p-4 text-center text-secondary mb-0" id="notification-no-results">No hay comunicaciones que coincidan con la búsqueda.</p><div class="card-footer bg-body p-4">${tablePaginationFooter({ label: "notificaciones", summaryAttributes: 'id="notification-page-summary"', paginationAttributes: 'id="notification-pagination"' })}</div></div></section>`;
}
function refreshNotificationPreview() {
 const items = currentNotificationItems().filter(item => !item.archived);
 const count = items.filter(item => !item.read).length;
 document.querySelectorAll('[data-notification-count]').forEach(node => { node.textContent = count; });
 const bell = document.getElementById('notificationMenuButton');
 if (bell) bell.setAttribute('aria-label', `Notificaciones, ${count} no leídas`);
 const list = document.getElementById('notification-preview-list');
 if (list) list.innerHTML = notificationList(items.filter(item => notificationPreviewFilter !== 'unread' || !item.read), true);
}
document.addEventListener('click', event => {
 const filter = event.target.closest('[data-notification-filter]');
 if (filter) {
 notificationPreviewFilter = filter.dataset.notificationFilter;
 document.querySelectorAll('[data-notification-filter]').forEach(button => { const active = button === filter; button.classList.toggle('active', active); button.setAttribute('aria-pressed', active); });
 refreshNotificationPreview();
 }
 const open = event.target.closest('[data-notification-open]');
 const archive = event.target.closest('[data-notification-archive]');
 const readAll = event.target.closest('[data-notification-read-all]');
 if (!open && !archive && !readAll) return;
 if (readAll) currentNotificationItems().filter(item => !item.archived).forEach(item => { notificationState[item.key] = { ...notificationState[item.key], read: true }; });
 else { const key = (open || archive).dataset[open ? 'notificationOpen' : 'notificationArchive']; notificationState[key] = { ...notificationState[key], ...(open ? {read: true} : {archived: !notificationState[key]?.archived}) }; }
 try { localStorage.setItem('hacienda-inbox-v1', JSON.stringify(notificationState)); } catch {}
 if (open) {
 const article = open.closest('article'); article.classList.remove('bg-primary-subtle'); article.classList.add('bg-body'); open.classList.remove('fw-semibold'); article.querySelector('[aria-label="No leída"]')?.remove();
 const count = currentNotificationItems().filter(item => !item.read && !item.archived).length;
 document.querySelectorAll('[data-notification-count]').forEach(node => { node.textContent = count; });
 document.getElementById('notificationMenuButton')?.setAttribute('aria-label', `Notificaciones, ${count} no leídas`);
 } else { if (location.hash.startsWith('#notificaciones-')) renderRoute(); refreshNotificationPreview(); }
});
let notificationPage = 1;
function paginateNotifications(reset = false) {
 const list = document.getElementById('notification-page-list');
 if (!list) return;
 if (reset) notificationPage = 1;
 const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
 const query = normalize(document.getElementById('notification-search').value.trim());
 const size = Number(document.getElementById('notification-page-size').value);
 const rows = [...list.querySelectorAll('[data-inbox-item]')];
 const matches = rows.filter(row => normalize(row.dataset.search).includes(query));
 const pages = Math.max(1, Math.ceil(matches.length / size));
 notificationPage = Math.max(1, Math.min(notificationPage, pages));
 const start = (notificationPage - 1) * size;
 const visible = new Set(matches.slice(start, start + size));
 rows.forEach(row => row.classList.toggle('d-none', !visible.has(row)));
 document.getElementById('notification-no-results').classList.toggle('d-none', matches.length > 0 || rows.length === 0);
 document.getElementById('notification-page-summary').textContent = tablePageSummary(matches.length, start, size);
 document.getElementById('notification-pagination').innerHTML = paginationControls(notificationPage, pages, target => `data-notification-page="${target}"`);
}
document.addEventListener('input', event => { if (event.target.id === 'notification-search') paginateNotifications(true); });
document.addEventListener('change', event => { if (event.target.id === 'notification-page-size') paginateNotifications(true); });
document.addEventListener('click', event => {
 const button = event.target.closest('[data-notification-page]');
 if (!button) return;
 notificationPage = Number(button.dataset.notificationPage);
 paginateNotifications();
 document.querySelector('#notification-pagination [aria-current="page"]')?.focus();
});
document.addEventListener('show.bs.offcanvas', event => { if (event.target.id === 'notificationPanel') refreshNotificationPreview(); });

function renderAgentEnablement() {
	return renderAgentWizard();
}

const registeredTaxPages = { vehicles: 1, properties: 1 };

function registeredTaxTable(key, title, headers, rows, description = '', { searchHint, noMatches } = {}) {
	const isVehicle = key === 'vehicles' || key === 'my-vehicles';
	const isProperty = key === 'properties';
	searchHint ??= !isVehicle && !isProperty ? 'Buscar en los registros' : isVehicle ? 'Placa, marca o modelo' : 'CHIP, matrícula o dirección';
	return `<section data-registered-tax="${key}" aria-labelledby="registered-${key}-title">
		<div class="mb-4"><h2 class="h5 mb-1" id="registered-${key}-title">${title}</h2><p class="small text-secondary mb-0">${description || (!isVehicle && !isProperty ? 'Consulta los registros asociados a este impuesto.' : isVehicle ? 'Consulta las características de tus vehículos.' : 'Consulta la identificación y ubicación de tus predios registrados.')}</p></div>
		${tableToolbar({ sizeId: `registered-${key}-size`, searchId: `registered-${key}-search`, placeholder: searchHint, sizes: [10, 20, 30, 50], sizeAttributes: 'data-registered-size', searchAttributes: `data-registered-search aria-controls="registered-${key}-table"` })}
		<p class="small text-secondary d-lg-none mb-2" id="registered-${key}-scroll"><i class="bi bi-arrow-left-right me-1" aria-hidden="true"></i>Desliza la tabla para consultar todas las columnas.</p>
		<div class="table-responsive app-table-container registered-tax-scroll mb-3" tabindex="0" role="region" aria-label="Tabla de ${title.toLocaleLowerCase('es')}"><table class="table app-table table-hover align-middle mb-0 registered-tax-table" id="registered-${key}-table" data-pagination-managed><caption class="visually-hidden">${title}</caption><thead class="table-light"><tr>${headers.map(header => `<th scope="col">${header}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr data-registered-row>${row.map((cell, index) => index === 0 ? `<th scope="row" class="fw-semibold text-nowrap">${cell || '—'}</th>` : `<td>${cell || '<span class="text-secondary" aria-label="Sin información">—</span>'}</td>`).join('')}</tr>`).join('')}<tr data-registered-empty class="${rows.length ? 'd-none' : ''}"><td colspan="${headers.length}" class="text-center text-secondary py-4">${rows.length && noMatches ? noMatches : 'No hay registros disponibles para mostrar.'}</td></tr></tbody></table></div>
		${tablePaginationFooter({ label: title.toLocaleLowerCase('es'), summaryAttributes: 'data-registered-summary', paginationAttributes: 'data-registered-pagination' })}
	</section>`;
}

function filterRegisteredTaxes(key, reset = false) {
	const root = document.querySelector(`[data-registered-tax="${key}"]`);
	if (!root) return;
	if (reset) registeredTaxPages[key] = 1;
	const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
	const query = normalize(root.querySelector('[data-registered-search]').value.trim());
	const size = Number(root.querySelector('[data-registered-size]').value);
	const rows = [...root.querySelectorAll('[data-registered-row]')];
	const matches = rows.filter((row) => normalize(row.textContent).includes(query));
	const pages = Math.max(1, Math.ceil(matches.length / size));
	const page = registeredTaxPages[key] = Math.max(1, Math.min(registeredTaxPages[key] || 1, pages));
	const start = (page - 1) * size;
	const shown = new Set(matches.slice(start, start + size));
	rows.forEach((row) => row.classList.toggle('d-none', !shown.has(row)));
	root.querySelector('[data-registered-empty]').classList.toggle('d-none', matches.length > 0);
	root.querySelector('[data-registered-summary]').textContent = tablePageSummary(matches.length, start, size);
	const visiblePages = [...new Set([1, ...Array.from({ length: 5 }, (_, index) => page - 2 + index).filter((item) => item > 1 && item < pages), pages])];
	root.querySelector('[data-registered-pagination]').innerHTML = paginationControls(page, pages, target => `data-registered-page="${target}"`, visiblePages);
}

function renderRegisteredIca() {
	return `<h2 class="h5 mb-4">Impuesto de Industria y Comercio ICA</h2>
		${taxpayerSession ? '<div class="mb-3">' + linkToTaxDetail('objeto-ica-' + encodeURIComponent(getTaxpayerIdentity().documentNumber), 'ica') + '</div>' : ''}
		${registeredTaxTable('ica-activities', 'Actividades económicas vigentes', ['Código CIIU', 'Nombre de la actividad económica', 'Tipo', 'Tarifa', 'Fecha de inicio de la actividad', 'Fecha de finalización de la actividad'], [
			['', '', '', '', '00000000', ''],
			['4732', 'Comercio al por menor de lubricantes (aceites, grasas), aditivos y productos de limpieza para vehículos automotores', '', '', '04/06/2026', '31/12/9999'],
		], 'Actividades económicas vigentes')}
		<hr class="my-4">
		${registeredTaxTable('ica-establishments', 'Establecimientos', ['Matrícula', 'Nombre', 'Dirección', 'Teléfono', 'Fecha de apertura', 'Fecha de cierre'], [
			['', '', '', '', '00000000', ''],
			['0', '', '', '', '//', '31/12/9999'],
		], 'Establecimientos activos')}`;
}

function registeredTaxAvailability() {
	const hasObjects = tax => taxpayerObjects[tax] && [...taxpayerObjects[tax].keys()].some(object => taxpayerCanConsult(taxpayerSession, tax, object));
	return {
		vehicles: !taxpayerSession || hasObjects('vehiculos'),
		properties: !taxpayerSession || hasObjects('predial'),
		delineacion: !taxpayerSession || hasObjects('delineacion'),
		sobretasa: Object.keys(fuelSurtaxProfile().periods).length > 0,
		publicidad: publicityElementsFor(taxpayerSession).length > 0,
		ica: Boolean(taxpayerSession && icaData.activities.length),
		reteica: Boolean(taxpayerSession?.requiresObject),
	};
}

function renderRegisteredTaxes() {
	const availability = registeredTaxAvailability();
	const listing = (key, tax, title, headers) => registeredTaxTable(key, title, headers,
		taxpayerPropertyRows(tax, key).filter(([object]) => taxpayerCanConsult(taxpayerSession, tax, object)));
	const tabs = [
		['vehicles', 'Vehículos', () => taxpayerSession ? listing('vehicles', 'vehiculos', 'Impuestos de vehículos', [...vehicleHeaders, 'Acciones']) : registeredTaxTable('vehicles', 'Impuestos de vehículos', vehicleHeaders, vehicleRows())],
		['properties', 'Predial Unificado', () => taxpayerSession ? listing('properties', 'predial', 'Impuesto predial', taxpayerPropertyHeaders) : registeredTaxTable('properties', 'Impuesto predial', ['CHIP', 'Matrícula inmobiliaria', 'Dirección', 'Contrato', 'Año gravable', 'Número de objeto'], predialProperties)],
		['delineacion', 'Delineación Urbana', () => registeredTaxTable('delineacion', 'Impuestos de Delineación Urbana', ['CDU', 'Acciones'],
			paymentHistoryExamples.delineacion.rows.filter(([object]) => taxpayerCanConsult(taxpayerSession, 'delineacion', object))
				.map(([object]) => [object, linkToTaxDetail('delineacion-' + object, 'delineacion')]))],
		['sobretasa', fuelSurtaxTitle, renderFuelSurtaxRegistration],
		['publicidad', 'Publicidad Exterior', () => registeredTaxTable('publicidad-rit', publicityTaxTitle, [...publicityHeaders, 'Acciones'],
			publicityElementsFor(taxpayerSession).map(element => [element.resolution, publicityTypeLabel(element), linkToTaxDetail('objeto-publicidad-' + element.resolution, 'publicidad')]))],
		['ica', 'ICA', renderRegisteredIca],
		['reteica', 'RETEICA', () => {
			const { documentType, documentNumber } = getTaxpayerIdentity();
			return registeredTaxTable('reteica', 'RETEICA', ['Tipo de identificación', 'Número de identificación', 'Acciones'],
				[[icaEscape(documentType), icaEscape(documentNumber), linkToTaxDetail('objeto-reteica-' + encodeURIComponent(documentNumber), 'reteica')]]);
		}],
	];
	const enabled = id => availability[id] || (id === 'sobretasa' && taxpayerSession?.requiresObject);
	const active = tabs.find(([id]) => enabled(id))?.[0];
	return pageTitle('Impuestos registrados', 'Consulta los impuestos asociados a tu Registro de Informaci?n Tributaria.')
		+ `<div class="card border-0 shadow-sm registered-taxes">
			<div class="card-header bg-white px-3 px-md-4 pt-3 pb-0"><ul class="nav nav-tabs card-header-tabs gap-2" role="tablist" aria-label="Tipo de impuesto">
			${tabs.map(([id, label]) => `<li class="nav-item" role="presentation"><button class="nav-link px-3 py-3${id === active ? ' active' : ''}" id="registered-${id}-tab"
				type="button" role="tab" data-bs-toggle="tab" data-bs-target="#registered-${id}-pane" aria-controls="registered-${id}-pane"
				aria-selected="${id === active}"${enabled(id) ? '' : ' disabled aria-disabled="true"'}>${label}${enabled(id) ? '' : ' <span class="small">(Sin registro)</span>'}</button></li>`).join('')}
			</ul></div><div class="card-body p-3 p-md-4 tab-content">
			${tabs.map(([id, , render]) => `<div class="tab-pane${id === active ? ' show active' : ''}" id="registered-${id}-pane" role="tabpanel" aria-labelledby="registered-${id}-tab" tabindex="0">${enabled(id) ? render() : ''}</div>`).join('')}
			</div></div>`;
}

document.addEventListener('input', (event) => {
	if (event.target.matches('[data-registered-search]')) filterRegisteredTaxes(event.target.closest('[data-registered-tax]').dataset.registeredTax, true);
});
document.addEventListener('change', (event) => {
	if (event.target.matches('[data-registered-size]')) filterRegisteredTaxes(event.target.closest('[data-registered-tax]').dataset.registeredTax, true);
});
document.addEventListener('click', (event) => {
	const clear = event.target.closest('[data-registered-clear]');
	if (clear) {
		const root = clear.closest('[data-registered-tax]');
		const search = root.querySelector('[data-registered-search]');
		search.value = '';
		filterRegisteredTaxes(root.dataset.registeredTax, true);
		search.focus();
		return;
	}
	const button = event.target.closest('[data-registered-page]');
	if (!button || button.disabled) return;
	const key = button.closest('[data-registered-tax]').dataset.registeredTax;
	registeredTaxPages[key] = Number(button.dataset.registeredPage);
	filterRegisteredTaxes(key);
});

const authorizedAgents = [
	{ id: '1', name: 'Camila Torres Mendoza', document: '1.000.000.011', quality: 'Representante Legal Suplente', start: '2019-06-27', end: '9999-12-31', taxes: ['Predial', 'Vehicular'], active: true },
	{ id: '2', name: 'Santiago Rojas Herrera', document: '1.000.000.012', quality: 'Revisor Fiscal Principal', start: '2021-01-14', end: '9999-12-31', taxes: [], active: true },
	{ id: '3', name: 'Valeria Duarte Molina', document: '1.000.000.013', quality: 'Revisor Fiscal Principal', start: '2019-06-27', end: '9999-12-31', taxes: [], active: true },
	{ id: '4', name: 'Andrés Cárdenas Ríos', document: '1.000.000.014', quality: 'Representante Legal Principal', start: '2018-02-22', end: '9999-12-31', taxes: ['Predial', 'Vehicular'], active: true },
	{ id: '5', name: 'Daniela Pardo Salcedo', document: '1.000.000.015', quality: 'Revisor Fiscal Suplente', start: '2019-06-27', end: '2021-12-29', taxes: [], active: false },
	{ id: '6', name: 'Daniela Pardo Salcedo', document: '1.000.000.015', quality: 'Revisor Fiscal Principal', start: '2019-09-19', end: '2021-12-29', taxes: [], active: false },
];
const authorizedAgentPages = { active: 1, inactive: 1 };
let authorizedAgentPageSize = 10;
let authorizedAgentSort = { key: 'name', direction: 1 };

function authorizedAgentsTable(historical = false, query = '') {
	const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
	const rows = authorizedAgents.filter((agent) => agent.active !== historical && normalize(`${agent.name} ${agent.document} ${agent.quality} ${agent.taxes.join(' ')}`).includes(normalize(query.trim())));
	rows.sort((a, b) => String(a[authorizedAgentSort.key]).localeCompare(String(b[authorizedAgentSort.key]), 'es') * authorizedAgentSort.direction);
	const key = historical ? 'inactive' : 'active';
 const total = rows.length;
 const pages = Math.max(1, Math.ceil(total / authorizedAgentPageSize));
 const page = authorizedAgentPages[key] = Math.min(authorizedAgentPages[key], pages);
 const start = (page - 1) * authorizedAgentPageSize;
 const pageRows = rows.slice(start, start + authorizedAgentPageSize);
 const pagination = paginationControls(page, pages, target => `data-agent-page="${target}" data-agent-page-group="${key}"`);
 const date = (value) => value.split('-').reverse().join('/');
	const headers = [['name', 'Nombre'], ['document', 'Tipo y número de documento'], ['quality', 'Calidades'], ['start', 'Vigencia'], ['taxes', 'Impuesto']];
	return `<div class="table-responsive app-table-container" tabindex="0" role="region" aria-label="Agentes autorizados"><table data-pagination-managed class="table app-table table-hover align-middle mb-0"><caption class="visually-hidden">Agentes autorizados ${historical ? 'inactivos' : 'activos'}</caption><thead class="table-light"><tr>${headers.map(([key, label]) => `<th scope="col" ${authorizedAgentSort.key === key ? `aria-sort="${authorizedAgentSort.direction === 1 ? 'ascending' : 'descending'}"` : ''}><button class="btn btn-link p-0 text-start text-body fw-semibold text-decoration-none d-flex align-items-center gap-2" type="button" data-agent-sort="${key}">${label}<i class="bi bi-${authorizedAgentSort.key === key && authorizedAgentSort.direction === -1 ? 'caret-down-fill' : 'caret-up-fill'} small ${authorizedAgentSort.key === key ? 'text-primary' : 'text-secondary opacity-50'}" aria-hidden="true"></i></button></th>`).join('')}<th scope="col">Estado</th>${historical ? '' : '<th scope="col" class="text-center">Acciones</th>'}</tr></thead><tbody>${pageRows.map((agent) => `<tr><th scope="row" class="fw-semibold">${agent.name}</th><td><span class="d-block">${agent.documentType || 'CC'}</span><span class="text-nowrap">${agent.document}</span></td><td>${agent.quality}</td><td><span class="text-nowrap">${date(agent.start)}</span><span class="d-block text-nowrap">– ${date(agent.end)}</span></td><td>${agent.taxes.join(', ') || '—'}</td><td>${tableBadge(agent.active ? 'Vigente' : 'Finalizado', agent.active ? 'success' : 'danger')}</td>${historical ? '' : `<td class="text-center"><button class="btn btn-outline-primary btn-sm px-3 text-nowrap" type="button" data-agent-edit="${agent.id}" aria-label="Editar agente ${agent.name}"><i class="bi bi-pencil me-1" aria-hidden="true"></i>Editar</button></td>`}</tr>`).join('') || `<tr><td colspan="${historical ? 6 : 7}" class="text-center text-secondary py-4">No se encontraron agentes para esta consulta.</td></tr>`}</tbody></table></div>
		<div class="mt-3">${tablePaginationFooter({ label: "agentes autorizados", summary: tablePageSummary(total, start, authorizedAgentPageSize), controls: pagination })}</div>`;
}

function renderAuthorizedAgents() {
	const activeCount = authorizedAgents.filter((agent) => agent.active).length;
	const inactiveCount = authorizedAgents.length - activeCount;
	const notice = agentWizardNotice;
	agentWizardNotice = '';
	return `<header class="d-flex flex-column flex-md-row align-items-start justify-content-between gap-3 mb-4"><div><h1 class="h3 fw-semibold mb-2">Agentes autorizados</h1><p class="text-secondary mb-0">Consulta y gestiona las personas autorizadas para realizar trámites en tu nombre.</p></div><button class="btn btn-primary flex-shrink-0" type="button" data-bs-toggle="modal" data-bs-target="#agentLookupModal"><i class="bi bi-plus-lg me-2" aria-hidden="true"></i>Agregar agente</button></header>
		${notice ? `<div class="alert alert-success" role="status">${agentEscape(notice)}</div>` : ''}
		<section class="card border-0 shadow-sm registered-taxes" aria-label="Gestión de agentes autorizados">
			<div class="card-header bg-white px-3 px-md-4 pt-3 pb-0">
				<ul class="nav nav-tabs card-header-tabs gap-2" role="tablist" aria-label="Estado de los agentes">
					<li class="nav-item" role="presentation"><button class="nav-link active d-flex align-items-center gap-2" id="agents-active-tab" data-bs-toggle="tab" data-bs-target="#agents-active-pane" type="button" role="tab" aria-controls="agents-active-pane" aria-selected="true">Activos<span class="badge rounded-pill text-bg-light border">${activeCount}</span></button></li>
					<li class="nav-item" role="presentation"><button class="nav-link d-flex align-items-center gap-2" id="agents-inactive-tab" data-bs-toggle="tab" data-bs-target="#agents-inactive-pane" type="button" role="tab" aria-controls="agents-inactive-pane" aria-selected="false">Inactivos<span class="badge rounded-pill text-bg-light border">${inactiveCount}</span></button></li>
				</ul>
			</div>
			<div class="card-body p-3 p-md-4">
			${tableToolbar({ sizeId: "authorizedAgentPageSize", searchId: "authorizedAgentSearch", placeholder: "Nombre, documento o calidad", selected: authorizedAgentPageSize, sizes: [10, 20, 30, 50], searchAttributes: 'aria-controls="authorizedAgentsResults"' })}
			<p class="small text-success d-none" id="authorizedAgentSaveStatus" role="status">Cambios guardados.</p>
			<div class="tab-content" id="authorizedAgentsResults">
				<div class="tab-pane show active" id="agents-active-pane" role="tabpanel" aria-labelledby="agents-active-tab" tabindex="0">${authorizedAgentsTable()}</div>
				<div class="tab-pane" id="agents-inactive-pane" role="tabpanel" aria-labelledby="agents-inactive-tab" tabindex="0">${authorizedAgentsTable(true)}</div>
			</div>
		</div></section>`;
}

function refreshAuthorizedAgents() {
	const activePane = document.getElementById('agents-active-pane');
	const inactivePane = document.getElementById('agents-inactive-pane');
	if (!activePane || !inactivePane) return;
	const query = document.getElementById('authorizedAgentSearch').value;
	activePane.innerHTML = authorizedAgentsTable(false, query);
	inactivePane.innerHTML = '' + authorizedAgentsTable(true, query);
}

document.addEventListener('input', (event) => {
	if (event.target.id === 'authorizedAgentSearch') { authorizedAgentPages.active = authorizedAgentPages.inactive = 1; refreshAuthorizedAgents(); }
});
document.addEventListener('change', (event) => {
 if (event.target.id !== 'authorizedAgentPageSize') return;
 authorizedAgentPageSize = Number(event.target.value);
 authorizedAgentPages.active = authorizedAgentPages.inactive = 1;
 refreshAuthorizedAgents();
});
document.addEventListener('click', (event) => {
 const button = event.target.closest('[data-agent-page]');
 if (!button || button.disabled) return;
 authorizedAgentPages[button.dataset.agentPageGroup] = Number(button.dataset.agentPage);
 refreshAuthorizedAgents();
});
document.addEventListener('click', (event) => {
	const sort = event.target.closest('[data-agent-sort]');
	if (sort) {
		const paneId = sort.closest('.tab-pane').id;
		const key = sort.dataset.agentSort;
		authorizedAgentSort = { key, direction: authorizedAgentSort.key === key ? -authorizedAgentSort.direction : 1 };
		refreshAuthorizedAgents();
		document.querySelector(`#${paneId} [data-agent-sort="${key}"]`)?.focus();
	}
	const edit = event.target.closest('[data-agent-edit]');
	if (!edit || document.getElementById('authorizedAgentEditModal')) return;
	const agent = authorizedAgents.find((item) => item.id === edit.dataset.agentEdit);
	if (!agent?.active) return;
	startAgentEdit(agent);
});

function renderRitPage(id) {
	if (id === "rit-actualizacion") return renderInvoiceRit();
	if (id === "rit-datos") return taxpayerSession?.requiresObject ? renderCorporateRit() : existingRitPage;
	if (id === "rit-resumen") return renderRitSummary();
	if (id === "rit-impuestos") return renderRegisteredTaxes();
	if (id === "rit-agentes") return renderAuthorizedAgents() + renderAgentLookupModal();
	if (id === "rit-agentes-habilitar") return renderAgentEnablement();
	return renderRitCertification();
}

function renderPayments(id) {
	if (id === "pagos-facturas") return renderInvoices();
	if (id === "pagos-recibos") return renderReceipts();
	if (id === "pagos-facilidades") return renderPaymentPlans();
	return renderPaymentHistory();
}

function renderPage(id) {
	if (taxpayerSession && Object.hasOwn(taxpayerDocumentRoutes, id)) return renderTaxpayerDocuments(id);
	if (id.startsWith("predio-")) return renderPredialObjectDetail(id.slice("predio-".length));
	if (id === "predial-rop") return renderPredialRop();
	if (id.startsWith("delineacion-")) return renderDelineationObjectDetail(id.slice("delineacion-".length));
	if (id.startsWith("objeto-")) return renderAccountTaxObjectShell();
	if (id === "predial-declaracion") return renderPredialDeclaration();
	if (isPageContentHidden(id)) return pageTitle(getRouteDetails(id).label) + emptyState("Esta sección todavía no está disponible.");
	if (id === "inicio") return renderDashboard();
	if (id === "guia-visual") return renderStyleGuide();
	if (id.startsWith("rit-")) return renderRitPage(id);
	if (id === "impuestos-todos") return renderTaxList("Mis impuestos", "Consulta los impuestos asociados al ciudadano.");
	if (id === "impuestos-vehiculos") return renderMyVehicles();
	if (id === "impuestos-predial") return renderPredialTax();
	if (id === "impuestos-ica") return renderIca();
	if (id === "impuestos-publicidad") return renderPublicityTax();
	if (id === fuelSurtaxRoute) return renderFuelSurtaxTax();
	if (id === "impuestos-otros") return `${pageTitle("Otros impuestos", "Consulta otros impuestos asociados al ciudadano.")}${section("Impuestos", emptyState())}`;
	if (id.startsWith("vehiculo-")) return renderVehicleDetail(id.replace("vehiculo-", ""));
	if (id === "obligaciones-pendientes") return renderObligations();
	if (id === "obligaciones-cuenta") return renderAccountStatement();
	if (id === "obligaciones-facilidades") return renderPaymentPlanRop();
	if (id.startsWith("declaraciones-")) return renderDeclaration(id);
	if (id.startsWith("pagos-")) return renderPayments(id);
	if (id === "tramites-seguimiento") return renderProcedures();
	if (id.startsWith("documentos-")) return renderDocuments(id);
	if (id.startsWith("notificaciones-")) return renderNotifications(id);
	return `${pageTitle("Página no disponible")}${errorState("No encontramos esa sección. Selecciona una opción del menú principal.")}`;
}

function getCurrentRoute() {
	const hash = window.location.hash.replace(/^#/, "");
	if (hash === "documentos-rit") return "rit-certificacion";
	if (pages.has(hash)) return hash;
	if (/^(vehiculo|predio|delineacion|objeto-ica|objeto-reteica|objeto-publicidad)-/.test(hash) || ["predial-declaracion", "predial-rop"].includes(hash)) return hash;
	return "inicio";
}

const demoStates = [
	{ id: "empty", label: "Sin resultados", icon: "bi-inbox" },
	{ id: "loading", label: "Cargando", icon: "bi-arrow-repeat" },
	{ id: "error", label: "Error", icon: "bi-exclamation-triangle" },
	{ id: "validation", label: "Errores de campos", icon: "bi-clipboard-check" },
	{ id: "success", label: "Éxito", icon: "bi-check-circle" },
];

function getRouteDetails(routeId) {
	if (taxpayerSession && taxpayerMenuLabels.has(routeId)) return { ...pages.get(routeId), label: taxpayerMenuLabels.get(routeId) };
	if (taxpayerSession && routeId === "pagos-recibos") return { ...pages.get(routeId), label: taxpayerDocumentRoutes[routeId].title };
	if (routeId === notaryRoute.id) return notaryRoute;
	if (routeId === dealerRoute.id) return dealerRoute;
	if (routeId.startsWith("predio-")) return taxObjectRouteDetails(routeId, "Detalle del predio");
	if (routeId.startsWith("delineacion-")) return taxObjectRouteDetails(routeId, "Detalle de Delineación Urbana", true);
	if (routeId.startsWith("objeto-publicidad-")) return { id: routeId, label: "Detalle", group: pages.get('impuestos-publicidad').group };
	if (routeId.startsWith("objeto-")) return taxObjectRouteDetails(routeId, "Detalle del objeto tributario");
	if (routeId === "predial-rop") return { id: routeId, label: "Generar ROP", group: routeGroups.find(group => group.id === "impuestos") };
	if (routeId === "predial-declaracion") return { id: routeId, label: "Declaraci\u00f3n Predial", group: routeGroups.find(group => group.id === "impuestos") };
	return pages.get(routeId) ?? (routeId.startsWith("vehiculo-")
		? taxObjectRouteDetails(routeId, "Detalle del vehículo")
		: pages.get("inicio"));
}

function insertPageStateMessage(message, type, role = "status") {
	const alert = document.createElement("div");
	alert.className = `alert alert-${type} d-flex align-items-center gap-2 mb-4`;
	alert.setAttribute("role", role);
	alert.innerHTML = message;
	const firstSection = contentRoot.querySelector("section");
	if (firstSection) firstSection.before(alert);
	else contentRoot.prepend(alert);
}

function renderFieldErrors() {
	const fields = [...contentRoot.querySelectorAll("input, select, textarea")].filter((field) =>
		!["hidden", "checkbox", "radio", "file", "button", "submit", "reset"].includes(field.type));

	if (!fields.length) {
		insertPageStateMessage("Esta página no tiene campos para validar. Revisa el estado y las opciones disponibles.", "warning", "alert");
		return;
	}

	fields.forEach((field, index) => {
		let message = "Verifica el valor ingresado.";
		if (field.tagName === "SELECT") message = "Selecciona una opción válida.";
		else if (field.type === "email") message = "Ingresa un correo electrónico con formato válido.";
		else if (field.type === "date") message = "Selecciona una fecha válida.";
		else if (field.type === "password" && field.id === "confirm-password") message = "Las contraseñas no coinciden.";
		else if (field.type === "password") message = "La contraseña ingresada no es válida.";
		else if (field.required) message = "Completa este campo obligatorio.";
		else if (/tel|phone|postal|extension/.test(field.id)) message = "Ingresa un número válido para este campo.";

		field.classList.add("is-invalid");
		field.setAttribute("aria-invalid", "true");
		const errorId = `${field.id || `field-${index}`}-state-error`;
		field.setAttribute("aria-describedby", [...new Set([field.getAttribute("aria-describedby"), errorId].filter(Boolean))].join(" "));
		const fieldWrapper = field.closest('[class*="col-"]') ?? field.parentElement;
		const error = fieldWrapper.querySelector(".invalid-feedback") ?? document.createElement("div");
		error.classList.add("invalid-feedback", "d-block");
		error.id = errorId;
		error.textContent = `${message}`;
		const inputGroup = field.closest(".input-group");
		if (!error.isConnected) (inputGroup ?? fieldWrapper).append(error);
	});
}

function applyPageState(routeId, stateId) {
	if (!stateId) return;
	if (routeId.startsWith('notificaciones-') && stateId === 'empty') return;

	if (stateId === "empty") {
		const tables = [...contentRoot.querySelectorAll("table")];
		tables.forEach((tableElement) => {
			const body = tableElement.tBodies[0];
			if (!body) return;
			const columns = tableElement.tHead?.rows[0]?.cells.length ?? 1;
			body.replaceChildren();
			const row = body.insertRow();
			const cell = row.insertCell();
			cell.colSpan = columns;
			cell.className = "text-center text-secondary py-4";
			cell.textContent = routeId === "inicio"
				? "No hay declaraciones pendientes para mostrar."
				: "No hay registros disponibles para mostrar.";
		});
		const summary = document.getElementById("pendingDeclarationsSummary");
		if (summary) summary.textContent = tablePageSummary(0, 0, 10);
		if (!tables.length) insertPageStateMessage("No hay registros disponibles para mostrar en esta sección.", "secondary");
		return;
	}

	if (stateId === "validation") {
		renderFieldErrors();
		return;
	}

	if (stateId === "loading") {
		insertPageStateMessage('<span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span>Estamos consultando la información.</span>', "info");
		return;
	}

	if (stateId === "error") {
		insertPageStateMessage("<strong>No fue posible completar la consulta.</strong> Intenta nuevamente o revisa las opciones relacionadas.", "danger", "alert");
		return;
	}

	if (stateId === "success") {
		insertPageStateMessage("<strong>La solicitud se completó correctamente.</strong>", "success");
	}
}

function getRelatedRoutes(route) {
	if (route.group) {
		return route.group.items
			.filter(([id]) => id !== route.id)
			.map(([id, label]) => ({ id, label }));
	}
	return [
		{ id: "declaraciones-presentadas", label: "Declaraciones presentadas" },
		{ id: "obligaciones-pendientes", label: "Obligaciones pendientes" },
		{ id: "rit-datos", label: "Datos personales" },
		{ id: "rit-agentes", label: "Agentes autorizados" },
	];
}

function isPageContentHidden(id) {
	if (taxpayerSession && id === "obligaciones-cuenta") return false;
	if (taxpayerSession && id === "declaraciones-blanco") return false;
	if (taxpayerSession && Object.hasOwn(taxpayerDocumentRoutes, id)) return false;
	if (id === "declaraciones-generar") return false;
	if (id === "pagos-relacion") return false;
	if (id === "documentos-declaracion") return false;
	if (id === "documentos-multipagos") return false;
	if (id === "tramites-seguimiento") return false;
	if (["obligaciones-pendientes", "obligaciones-facilidades", "pagos-facilidades"].includes(id)) return false;
	if (id === "documentos-pago") return false;
	if (id === "documentos-retenciones") return false;
	if (/^(predio|delineacion|objeto)-/.test(id)) return false;
	if (id === "predial-rop") return false;
	if (id === "predial-declaracion") return false;
	if (id.startsWith('notificaciones-')) return false;
	if (['impuestos-predial', 'impuestos-ica', 'impuestos-vehiculos', 'impuestos-publicidad', fuelSurtaxRoute].includes(id) || id.startsWith('vehiculo-')) return false;
	return hiddenRouteGroups.has(getRouteDetails(id).group?.id);
}

let lastRenderedUrl;

function renderRoute() {
	const consultation = consultationProfile(profileCurrentRole.textContent);
	const requestedRoute = getCurrentRoute();
	const localRoute = taxpayerSession && requestedRoute === "pagos-facilidades" ? "obligaciones-facilidades" : requestedRoute;
	const routeId = consultation?.id ?? (activeCompany && localRoute !== "declaraciones-generar" ? "inicio" : localRoute);
	if (window.location.hash !== `#${routeId}`) {
		const normalizedUrl = new URL(window.location.href);
		normalizedUrl.hash = routeId;
		window.history.replaceState(null, "", normalizedUrl);
	}
	lastRenderedUrl = window.location.href;
	const route = getRouteDetails(routeId);
	const requestedDemoState = new URLSearchParams(window.location.search).get("demo");
	const activeDemoState = demoStates.some((state) => state.id === requestedDemoState) ? requestedDemoState : null;
	renderNavigation(routeId);
	renderBreadcrumb(route);
	if (consultation) {
		pageFooterRoot.innerHTML = '';
		bootstrap.Offcanvas.getInstance(document.getElementById("primaryNavigation"))?.hide();
		if (contentRoot.firstElementChild?.dataset.consultationRoute !== routeId) {
			const renderModule = routeId === notaryRoute.id ? renderNotaryModule : renderDealerModule;
			renderModule(contentRoot, requestedDemoState);
			contentRoot.firstElementChild.dataset.consultationRoute = routeId;
		}
		document.title = `${route.label} | Oficina Virtual de Bogotá`;
		return;
	}
	contentRoot.innerHTML = renderPage(routeId);
	if (routeId === declarationRoute && taxpayerSession) mountDeclarationConsultation();
	if (routeId === "pagos-facilidades") mountLegacyRopSelection(contentRoot);
	if (routeId === "impuestos-publicidad") mountPublicityList(contentRoot.querySelector('[data-publicity-list]'));
	if (routeId === fuelSurtaxRoute) mountFuelSurtax();
	if (routeId.startsWith('objeto-publicidad-')) mountPublicityDetail(routeId.slice('objeto-publicidad-'.length));
	else if (routeId.startsWith("objeto-")) mountAccountTaxObjectDetail(routeId);
	if (routeId === "rit-impuestos") {
		restoreTaxDetailTab();
	}
	if (routeId === "obligaciones-cuenta") mountAccountStatement(requestedDemoState);
	if (routeId === "obligaciones-facilidades") mountPaymentPlanRop(requestedDemoState);
	mountTaxpayerPage(routeId);
	if (routeId.startsWith('notificaciones-')) paginateNotifications(true);
	if (routeId === "rit-impuestos" || routeId === "impuestos-ica" || routeId.startsWith('notificaciones-')) {
		contentRoot.querySelectorAll('[data-registered-tax]').forEach((table) => filterRegisteredTaxes(table.dataset.registeredTax, true));
	}
	if (routeId === "impuestos-vehiculos") filterRegisteredTaxes('my-vehicles', true);
	if (routeId === 'impuestos-predial') filterRegisteredTaxes('my-properties', true);
	restoreRitFormValues(contentRoot);
	restoreTaxpayerIdentityFields();
	if (routeId === "rit-actualizacion") mountInvoiceRit();
	if (activeDemoState && !isPageContentHidden(routeId)) applyPageState(routeId, activeDemoState);
	if (routeId === "inicio") filterPendingDeclarations(true);
	pageFooterRoot.innerHTML = '';
	if (routeId === "rit-agentes-habilitar" && !activeDemoState) initializeAgentWizard();
	document.title = `${route.label} | Oficina Virtual de Bogotá`;
	if (window.innerWidth < 992) {
		const mobileNavigation = document.getElementById("primaryNavigation");
		bootstrap.Offcanvas.getInstance(mobileNavigation)?.hide();
	}
}

function renderChangedRoute() {
	if (window.location.href !== lastRenderedUrl) renderRoute();
}

window.addEventListener("hashchange", renderChangedRoute);
window.addEventListener("popstate", renderChangedRoute);

document.addEventListener("click", (event) => {
	const stateLink = event.target.closest("[data-demo-state]");
	const resetLink = event.target.closest("[data-demo-reset]");
	if (!stateLink && !resetLink) return;
	event.preventDefault();

	const nextUrl = new URL(window.location.href);
	const routeId = getCurrentRoute();
	if (stateLink) nextUrl.searchParams.set("demo", stateLink.dataset.demoState);
	else nextUrl.searchParams.delete("demo");
	nextUrl.hash = routeId;
	window.history.pushState(null, "", nextUrl);
	renderRoute();
});

document.addEventListener("click", (event) => {
	const routeLink = event.target.closest('a[href^="#"]');
	if (!routeLink || routeLink.matches("[data-demo-state], [data-demo-reset]")) return;
	const nextUrl = new URL(window.location.href);
	if (!nextUrl.searchParams.has("demo")) return;
	nextUrl.searchParams.delete("demo");
	window.history.replaceState(null, "", nextUrl);
});

const profileButton = document.getElementById("profileMenuButton");
const profileRoleButtons = document.querySelectorAll("[data-profile-role]");
const profileActiveBadge = profileButton?.querySelector(".profile-active-badge");
const profileCurrentRole = document.querySelector(".profile-current-role");

function setActiveProfile(role, persist = false) {
	if (!profileButton || !profileActiveBadge || !profileCurrentRole) return;
	const selectedButton = [...profileRoleButtons].find((button) => button.dataset.profileRole === role);
	if (!selectedButton) return;
	if (role === "Agente autorizado" && !activeCompany) return;
	taxpayerSession = Object.hasOwn(taxpayerSessions, role) ? taxpayerSessions[role] : undefined;
	selectIcaProfile();
	if (role !== "Agente autorizado") {
		activeCompany = null;
		sessionStorage.removeItem("demo-active-company");
	}
	const isConsultation = Boolean(consultationProfile(role));
	document.body.classList.toggle("consultation-profile", isConsultation);
	const notificationButton = document.getElementById("notificationMenuButton");
	notificationButton.classList.toggle("d-none", isConsultation);
	notificationButton.classList.toggle("d-inline-flex", !isConsultation);
	document.body.classList.toggle("representing-company", Boolean(activeCompany));
	document.getElementById("companySwitcher").classList.toggle("d-none", !activeCompany);
	if (activeCompany) {
		document.getElementById("companyMenuName").textContent = activeCompany.name;
		document.getElementById("companyMenuNit").textContent = `NIT ${activeCompany.nit}`;
		document.getElementById("changeCompanyButton").setAttribute("aria-label", `Cambiar empresa. Empresa actual: ${activeCompany.name}, NIT ${activeCompany.nit}`);
		bootstrap.Offcanvas.getInstance(document.getElementById("primaryNavigation"))?.hide();
	}

	profileActiveBadge.textContent = role;
	profileCurrentRole.textContent = role;
	syncTaxpayerProfile();

	profileRoleButtons.forEach((button) => {
		const isActive = button === selectedButton;
		button.classList.toggle("profile-role-option-current", isActive);
		button.setAttribute("aria-pressed", String(isActive));
		button.querySelector("[data-profile-active-badge]")?.classList.toggle("d-none", !isActive);
	});

	if (persist) sessionStorage.setItem("demo-active-profile-role", role);
}

if (profileRoleButtons.length) {
	const savedRole = sessionStorage.getItem("demo-active-profile-role")?.replace("Agentes Autorizados", "Agente autorizado");
	if (savedRole === "Agente autorizado") activeCompany = representedCompanies.find((company) => company.id === sessionStorage.getItem("demo-active-company")) || null;
	const restoredRole = Object.hasOwn(taxpayerSessions, savedRole) ? savedRole : consultationProfile(savedRole)?.role;
	setActiveProfile(activeCompany ? "Agente autorizado" : restoredRole ?? "Contribuyente");

	profileRoleButtons.forEach((button) => {
		button.addEventListener("click", () => {
			bootstrap.Dropdown.getOrCreateInstance(profileButton).hide();
			if (button.dataset.profileRole === "Agente autorizado") openCompanySelector();
			else {
				setActiveProfile(button.dataset.profileRole, true);
				renderRoute();
				if (consultationProfile(button.dataset.profileRole)) profileButton.focus();
			}
		});
	});
}

document.getElementById("companySearch").addEventListener("input", () => {
	companyPage = 1;
	renderCompanyResults();
});
document.getElementById("companyResults").addEventListener("change", (event) => {
	companySelection = representedCompanies.find((company) => company.id === event.target.value) || null;
	renderCompanyResults();
	if (companySelection) document.querySelector(`#companyResults input[value="${companySelection.id}"]`)?.focus();
});
document.getElementById("companyPrevious").addEventListener("click", () => { companyPage = Math.max(1, companyPage - 1); renderCompanyResults(); });
document.getElementById("companyNext").addEventListener("click", () => { companyPage += 1; renderCompanyResults(); });
document.getElementById("companyPageNumber").addEventListener("change", (event) => {
	companyPage = Math.max(1, Math.floor(Number(event.target.value) || 1));
	renderCompanyResults();
});
document.getElementById("companyClearSearch").addEventListener("click", () => {
	document.getElementById("companySearch").value = "";
	companyPage = 1;
	renderCompanyResults();
	document.getElementById("companySearch").focus();
});
document.getElementById("changeCompanyButton").addEventListener("click", openCompanySelector);
document.getElementById("companySelectorModal").addEventListener("shown.bs.modal", () => document.getElementById("companySearch").focus());
document.getElementById("companySelectorModal").addEventListener("hidden.bs.modal", () => (activeCompany ? document.getElementById("changeCompanyButton") : profileButton).focus());
document.getElementById("companyContinue").addEventListener("click", () => {
	if (!companySelection) return;
	activeCompany = companySelection;
	sessionStorage.setItem("demo-active-company", activeCompany.id);
	setActiveProfile("Agente autorizado", true);
	const nextUrl = new URL(window.location.href);
	nextUrl.searchParams.delete("demo");
	nextUrl.hash = "inicio";
	window.history.replaceState(null, "", nextUrl);
	renderRoute();
	bootstrap.Modal.getOrCreateInstance(document.getElementById("companySelectorModal")).hide();
});

document.addEventListener("click", (event) => {
	const removeAgentFileButton = event.target.closest("[data-agent-remove-file]");
	if (removeAgentFileButton) {
		selectedAgentDocuments.splice(Number(removeAgentFileButton.dataset.agentRemoveFile), 1);
		renderAgentDocumentList();
	}

	const toggle = event.target.closest("[data-password-toggle]");
	if (!toggle) return;
	const passwordInput = document.getElementById(toggle.dataset.passwordToggle);
	const isPassword = passwordInput.type === "password";
	passwordInput.type = isPassword ? "text" : "password";
	toggle.textContent = isPassword ? "Ocultar" : "Mostrar";
	toggle.setAttribute("aria-label", `${isPassword ? "Ocultar" : "Mostrar"} ${passwordInput.labels[0].textContent.replace("*", "").trim().toLowerCase()}`);
});

function showRitCertificateList() {
	const selectedTax = document.getElementById("ritCertificateTax").value;
	if (selectedTax !== "vehiculos") {
		downloadRitCertificate();
		return;
	}
	document.getElementById("ritCertificateDownloadStatus").classList.add("d-none");
	const modal = document.createElement("div");
	modal.className = "modal fade";
	modal.tabIndex = -1;
	modal.setAttribute("aria-labelledby", "ritVehicleListTitle");
	const vehicleList = `
			${tableToolbar({ sizeId: "rit-vehicle-size", searchId: "rit-vehicle-search", placeholder: "Buscar por placa", searchAttributes: "data-vehicle-search" })}
			<div class="table-responsive app-table-container mb-3" tabindex="0" role="region" aria-label="Certificados de vehículos"><table data-pagination-managed class="table app-table table-hover align-middle mb-0"><thead class="table-light"><tr><th scope="col">Placa</th><th scope="col">Marca</th><th scope="col">Acciones</th></tr></thead><tbody><tr data-vehicle-row><td>DEM033</td><td></td><td class="text-center"><button type="button" class="btn btn-outline-primary btn-sm px-3" data-vehicle-download aria-label="Descargar certificado del vehículo DEM033">Descargar certificado</button></td></tr><tr data-vehicle-empty hidden><td colspan="3" class="text-center text-secondary">No se encontraron resultados.</td></tr></tbody></table></div>
			${tablePaginationFooter({ label: "vehículos", summary: tablePageSummary(1, 0, 10), controls: paginationControls(1, 1), summaryAttributes: "data-vehicle-summary" })}
			<button type="button" class="btn btn-light w-100 mt-3" data-vehicle-download>Generar</button>`;
	modal.innerHTML = `<div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"><div class="modal-content">
		<div class="modal-header bg-light"><h2 class="modal-title fs-5" id="ritVehicleListTitle">Impuestos de Vehículos</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>
		<div class="modal-body p-4">
			${taxpayerSession ? taxpayerQueryForm('rit-vehicle-certificate', { tax: 'vehiculos' }) : vehicleList}
		</div></div></div>`;
	document.body.appendChild(modal);
	if (taxpayerSession) {
		mountTaxpayerQuery('rit-vehicle-certificate', query =>
			myVehicles.filter(vehicle => taxpayerHomeObjects.vehiculos.includes(vehicle.plate) && matchesTaxpayerQuery(query, 'vehiculos', vehicle.plate)), (target, vehicles) => {
			renderQueryResults(target, {
				id: 'rit-vehicle-results', title: 'Certificados de vehículos', headers: ['Placa', 'Marca', 'Acciones'],
				rows: vehicles.map(vehicle => [vehicle.plate, vehicle.brand, vehicle.plate]), unsortable: [2],
				formatCell: (cell, index) => index === 2
					? `<button type="button" class="btn btn-outline-primary btn-sm" data-vehicle-download="${cell}" aria-label="Descargar certificado del vehículo ${cell}">Descargar certificado</button>`
					: cell,
			});
		}, { initial: true });
	}
	const instance = new bootstrap.Modal(modal);
	modal.addEventListener("input", (event) => {
		if (!event.target.matches("[data-vehicle-search]")) return;
		const matches = "dem033".includes(event.target.value.trim().toLowerCase());
		modal.querySelector("[data-vehicle-row]").hidden = !matches;
		modal.querySelector("[data-vehicle-empty]").hidden = matches;
		modal.querySelector("[data-vehicle-summary]").textContent = tablePageSummary(matches ? 1 : 0, 0, 10);
		modal.querySelector(".btn-light").disabled = !matches;
	});
	modal.addEventListener("click", (event) => {
		const action = event.target.closest("[data-vehicle-download]");
		if (!action) return;
		downloadRitCertificate(action.dataset.vehicleDownload || "DEM033");
		instance.hide();
	});
	modal.addEventListener("hidden.bs.modal", () => { instance.dispose(); modal.remove(); }, { once: true });
	instance.show();
}

function downloadRitCertificate(vehiclePlate, registration = false) {
	const selectedTax = document.getElementById('ritCertificateTax')?.value;
	const tax = ritCertificateTaxes.find(([id, , key]) => id === selectedTax && registeredTaxAvailability()[key]);
	if (!registration && !tax) return;
	const identity = getTaxpayerIdentity();
	const fields = taxpayerSession?.requiresObject ? corporateRitFields() : [
		['Tipo de documento', identity.documentType], ['Número de documento', identity.documentNumber], ['Nombre', identity.fullName],
	];
	const pdfText = [
		registration ? 'Certificado de inscripción al RIT' : 'Certificado RIT por impuesto',
		"Documento sin validez oficial",
		...fields.map(([label, value]) => `${label}: ${value === '—' ? 'Sin información' : value}`),
		...(!registration ? [`Impuesto: ${tax[1]}`] : []),
		...(vehiclePlate ? [`Placa: ${vehiclePlate}`] : []),
		`Fecha de generacion: ${new Date().toLocaleDateString("es-CO")}`,
	];
	downloadLocalPdf(registration ? 'inscripcion-rit.pdf' : `certificado-rit-${selectedTax}.pdf`, pdfText);
	document.getElementById("ritCertificateDownloadStatus").classList.remove("d-none");
}

function downloadLocalPdf(filename, pdfText) {
	downloadLocalDocument(filename, createLocalPdf(pdfText));
}

function createLocalPdf(pdfText) {
	const escapePdfText = (text) => text.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^\x20-\x7E]/g, "")
		.replace(/[\\()]/g, "\\$&");
	const commands = ["BT", "/F1 16 Tf", "50 790 Td"];
	pdfText.forEach((line, index) => {
		if (index > 0) commands.push("0 -28 Td", "/F1 11 Tf");
		commands.push(`(${escapePdfText(line)}) Tj`);
	});
	commands.push("ET");
	const stream = commands.join("\n");
	const objects = [
		"<< /Type /Catalog /Pages 2 0 R >>",
		"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
		"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
		"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
		`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
	];
	let pdf = "%PDF-1.4\n";
	const offsets = [0];
	objects.forEach((object, index) => {
		offsets.push(pdf.length);
		pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
	});
	const xrefOffset = pdf.length;
	pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	offsets.slice(1).forEach((offset) => {
		pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
	});
	pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

	return new Blob([pdf], { type: "application/pdf" });
}

function downloadLocalDocument(filename, documentBlob) {
	const pdfUrl = URL.createObjectURL(documentBlob);
	const downloadLink = document.createElement("a");
	downloadLink.href = pdfUrl;
	downloadLink.download = filename;
	try {
		downloadLink.click();
	} finally {
		window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
	}
}

document.addEventListener("submit", (event) => {
	if (event.target.matches("#ritCertificateForm")) {
		event.preventDefault();
		const form = event.target;
		form.classList.add("was-validated");
		if (!form.checkValidity()) return;
		downloadRitCertificate();
		return;
	}

	if (event.target.matches("[data-query-feedback]")) {
		event.preventDefault();
		const form = event.target;
		const status = form.querySelector("[data-query-status]");
		form.classList.add("was-validated");
		const valid = form.checkValidity();
		status.className = valid ? "alert alert-info mt-3 mb-0" : "";
		status.textContent = valid ? form.dataset.queryFeedback || "Esta consulta todavía no está disponible." : "";
		if (!valid) form.querySelector(":invalid")?.focus();
	}
	if (event.target.matches("[data-agent-search-form]")) {
		event.preventDefault();
		searchAgentForWizard(event.target);
	}

});

document.addEventListener("change", (event) => {
	if (event.target.id === "ritCertificateTax") {
		event.target.form.querySelector('[type="submit"]').disabled = !event.target.checkValidity();
		document.getElementById('ritVehicleCertificateOption').hidden = event.target.value !== 'vehiculos';
		document.getElementById("ritCertificateDownloadStatus")?.classList.add("d-none");
	}
	if (event.target.matches("[name='documentNumber']")) {
		event.target.setCustomValidity("");
		event.target.nextElementSibling.textContent = "Ingresa el número de documento.";
	}
});

document.addEventListener("input", (event) => {
	if (event.target.id === "predialSearch") {
		filterPredialProperties();
		return;
	}
	if (event.target.id === "pendingDeclarationsSearch") {
		filterPendingDeclarations(true);
		return;
	}
	if (!event.target.matches("[name='documentNumber']")) return;
	event.target.setCustomValidity("");
	event.target.nextElementSibling.textContent = "Ingresa el número de documento.";
});

document.addEventListener("change", (event) => {
	if (event.target.id === "pendingDeclarationsPageSize") filterPendingDeclarations(true);
	if (event.target.id === "predialPageSize") filterPredialProperties();
});

document.addEventListener("click", (event) => {
	const pageButton = event.target.closest("[data-pending-page]");
	if (!pageButton || pageButton.disabled) return;
	pendingDeclarationsPage = Number(pageButton.dataset.pendingPage);
	filterPendingDeclarations();
});

function formatFileSize(bytes) {
	return bytes < 1024 * 1024
		? `${Math.max(1, Math.round(bytes / 1024))} KB`
		: `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderAgentDocumentList() {
	const fileInput = document.getElementById("agentDocumentFile");
	const fileList = document.getElementById("agentSelectedFiles");
	const summary = document.getElementById("agentFilesSummary");
	const error = document.getElementById("agentDocumentError");
	if (!fileInput || !fileList || !summary || !error) return;

	fileList.replaceChildren();
	selectedAgentDocuments.forEach((file, index) => {
		const item = document.createElement("li");
		item.className = "list-group-item d-flex flex-wrap justify-content-between align-items-center gap-2";
		const details = document.createElement("span");
		details.className = "d-flex flex-wrap align-items-center gap-2 text-break";
		const badge = document.createElement("span");
		badge.className = "badge text-bg-secondary";
		badge.textContent = "PDF";
		const name = document.createElement("span");
		name.className = "text-break";
		name.textContent = file.name;
		const size = document.createElement("small");
		size.className = "text-secondary";
		size.textContent = formatFileSize(file.size);
		details.append(badge, name, size);
		const removeButton = document.createElement("button");
		removeButton.className = "btn btn-outline-secondary btn-sm";
		removeButton.type = "button";
		removeButton.dataset.agentRemoveFile = String(index);
		removeButton.setAttribute("aria-label", `Eliminar ${file.name}`);
		removeButton.textContent = "Eliminar";
		item.append(details, removeButton);
		fileList.append(item);
	});

	fileList.classList.toggle("d-none", selectedAgentDocuments.length === 0);
	const totalSize = selectedAgentDocuments.reduce((total, file) => total + file.size, 0);
	summary.textContent = selectedAgentDocuments.length
		? `${selectedAgentDocuments.length} ${selectedAgentDocuments.length === 1 ? "archivo seleccionado" : "archivos seleccionados"} · ${formatFileSize(totalSize)} en total`
		: "";
	fileInput.classList.remove("is-valid", "is-invalid");
	fileInput.removeAttribute("aria-invalid");
	if (!error.classList.contains("d-none")) {
		fileInput.classList.add("is-invalid");
		fileInput.setAttribute("aria-invalid", "true");
	} else if (selectedAgentDocuments.length > 0) {
		fileInput.classList.add("is-valid");
	}
}

function addAgentDocuments(files) {
	const fileInput = document.getElementById("agentDocumentFile");
	const error = document.getElementById("agentDocumentError");
	if (!fileInput || !error) return;

	const messages = [];
	for (const file of files) {
		const isPdf = file.name.toLowerCase().endsWith(".pdf") && (!file.type || file.type === "application/pdf");
		if (!isPdf) {
			messages.push(`${file.name}: el formato debe ser PDF.`);
			continue;
		}
		if (file.size > 20 * 1024 * 1024) {
			messages.push(`${file.name}: supera el tamaño máximo de 20 MB.`);
			continue;
		}
		const alreadyAdded = selectedAgentDocuments.some((selected) => selected.name === file.name && selected.size === file.size && selected.lastModified === file.lastModified);
		if (!alreadyAdded) selectedAgentDocuments.push(file);
	}

	if (messages.length) {
		fileInput.classList.add("is-invalid");
		fileInput.classList.remove("is-valid");
		fileInput.setAttribute("aria-invalid", "true");
		error.textContent = messages.join(" ");
		error.classList.remove("d-none");
	} else {
		fileInput.classList.remove("is-invalid");
		fileInput.removeAttribute("aria-invalid");
		if (selectedAgentDocuments.length > 0) fileInput.classList.add("is-valid");
		error.textContent = "";
		error.classList.add("d-none");
	}
	fileInput.value = "";
	renderAgentDocumentList();
}

document.addEventListener("change", (event) => {
	if (event.target.id === "agentDocumentFile" && event.target.files?.length) {
		addAgentDocuments([...event.target.files]);
	}
});

document.addEventListener("dragover", (event) => {
	const dropZone = event.target.closest("#agentDocumentDropZone");
	if (!dropZone) return;
	event.preventDefault();
	dropZone.classList.add("bg-light", "border-primary");
	dropZone.classList.remove("border-secondary");
});

document.addEventListener("dragleave", (event) => {
	const dropZone = event.target.closest("#agentDocumentDropZone");
	if (!dropZone || dropZone.contains(event.relatedTarget)) return;
	dropZone.classList.remove("bg-light", "border-primary");
	dropZone.classList.add("border-secondary");
});

document.addEventListener("drop", (event) => {
	const dropZone = event.target.closest("#agentDocumentDropZone");
	if (!dropZone) return;
	event.preventDefault();
	dropZone.classList.remove("bg-light", "border-primary");
	dropZone.classList.add("border-secondary");
	const files = event.dataTransfer?.files;
	if (files?.length) addAgentDocuments([...files]);
});

document.addEventListener("click", (event) => {
	if (event.target.closest("[data-social-add]")) {
		const row = addRitSocialRow();
		row?.querySelector("select")?.focus();
		const status = document.getElementById("socialNetworkStatus");
		if (status) status.textContent = "Red social agregada. Selecciona la red e ingresa tu usuario. Guarda los cambios para conservarla.";
		return;
	}
	if (event.target.closest("[data-social-remove]")) {
		event.target.closest("[data-social-row]")?.remove();
		contentRoot.querySelector("[data-social-add]")?.focus();
		const status = document.getElementById("socialNetworkStatus");
		if (status) status.textContent = "Red social eliminada. Guarda los cambios para conservar esta modificación.";
		return;
	}
	const openAddressButton = event.target.closest("[data-address-open]");
	if (openAddressButton) {
		const editor = document.getElementById("notificationAddressEditor");
		if (!editor) return;
		setAddressEditorContext(openAddressButton.dataset.addressContext);
		updateAddressPreview();
		return;
	}
	if (event.target.closest("[data-address-add-complement]")) {
		const type = document.getElementById("address-complement-type");
		const value = document.getElementById("address-complement-value");
		const list = document.getElementById("address-complement-list");
		type.classList.toggle('is-invalid', !type.value);
		value.classList.toggle('is-invalid', !value.value.trim());
		if (!type.value || !value.value.trim()) {
			(!type.value ? type : value).focus();
			return;
		}
		if (type?.value && value?.value.trim() && list) {
			list.value = [list.value, `${type.value} ${value.value.trim()}`].filter(Boolean).join(", ");
			renderAddressComplements();
			value.value = "";
			type.value = "";
			type.focus();
			updateAddressPreview();
		}
		return;
	}
	if (event.target.closest("[data-address-confirm]")) {
		const streetType = document.getElementById("address-street-type");
		const streetNumber = document.getElementById("address-street-number");
		const error = document.getElementById("address-editor-error");
		if (!streetType?.value || !streetNumber?.value.trim()) {
			error?.classList.remove("d-none");
			streetType?.focus();
			return;
		}
		if (error) error.classList.add("d-none");
		const confirmedContext = activeAddressContext;
		if (confirmedContext === "contact") {
			saveContactAddressFromEditor();
			Object.entries(notificationAddressDraft || {}).forEach(([id, value]) => {
				const field = document.getElementById(id);
				if (field) field.value = value;
			});
			notificationAddressDraft = null;
			activeAddressContext = "notification";
			const title = document.getElementById("notificationAddressEditorTitle");
			if (title) title.textContent = "Editar dirección de notificación";
		} else {
			const address = composeNotificationStreet();
			const addressField = document.getElementById("notification-address");
			if (addressField) addressField.value = address;
			const addressText = document.getElementById("notificationAddressText");
			if (addressText) addressText.textContent = address || "No hay una dirección registrada.";
			updateNotificationAddressMeta();
		}
		closeAddressEditor();
		const status = document.getElementById("ritSaveStatus");
		if (status) {
			const addressName = confirmedContext === "contact" ? "Dirección de contacto" : "Dirección de notificación";
			status.textContent = `${addressName} actualizada. Selecciona Guardar cambios para conservarla.`;
			status.classList.remove("text-success", "text-danger");
			status.classList.add("text-secondary");
		}
		return;
	}
	if (event.target.closest("[data-rit-save]")) saveRitPersonalData();
});

function composeNotificationStreet() {
	const value = (id) => document.getElementById(id)?.value?.trim() || "";
	return ["address-street-type", "address-street-number", "address-street-letter", "address-bis", "address-bis-letter", "address-street-zone", "address-number-1", "address-number-letter", "address-number-2", "address-number-zone"]
		.map(value).filter(Boolean).join(" ") + (value("address-complement-list") ? ` ${value("address-complement-list")}` : "");
}

function composeNotificationAddress() {
	const value = (id) => document.getElementById(id)?.value?.trim() || "";
	const street = composeNotificationStreet();
	return [street, value("notification-city"), value("notification-department"), value("notification-country"), value("notification-postal")].filter(Boolean).join(", ");
}

function updateNotificationAddressMeta(root = document) {
	const meta = root.querySelector("#notificationAddressMeta");
	if (!meta) return;
	const text = (id) => {
		const field = root.querySelector(`#${id}`);
		return field?.selectedOptions?.[0]?.textContent.trim() || field?.value?.trim() || "";
	};
	const city = text("notification-city");
	const department = text("notification-department");
	const country = text("notification-country");
	const postal = root.querySelector("#notification-postal")?.value?.trim();
	meta.textContent = [city, department, country, postal ? `Código postal ${postal}` : ""].filter(Boolean).join(" · ");
}

function syncContactAddressCard(root = document) {
	const address = root.querySelector("#contact-address")?.value?.trim() || "";
	const addressText = root.querySelector("#contactAddressText");
	const meta = root.querySelector("#contactAddressMeta");
	if (addressText) addressText.textContent = address || "No hay una dirección registrada.";
	if (!meta) return;
	const details = ["contact-city", "contact-department", "contact-country"].map((id) => {
		const field = root.querySelector(`#${id}`);
		const value = field?.selectedOptions?.[0]?.textContent.trim() || field?.value?.trim() || "";
		return value && value.toLocaleLowerCase("es") !== "seleccione" ? value : "";
	});
	const postal = root.querySelector("#contact-postal")?.value?.trim();
	if (postal) details.push(`Código postal ${postal}`);
	meta.textContent = details.filter(Boolean).join(" · ");
}

function updateAddressPreview() {
	const preview = document.getElementById("notificationAddressPreview");
	if (!preview) return;
	const composed = composeNotificationAddress();
	const savedAddressId = activeAddressContext === "contact" ? "contact-address" : "notification-address";
	preview.textContent = composed || document.getElementById(savedAddressId)?.value || "La dirección aparecerá aquí.";
}

function getAddressComplements() {
	return (document.getElementById('address-complement-list')?.value || '').split(',').map((value) => value.trim()).filter(Boolean);
}

function renderAddressComplements() {
	const container = document.getElementById('address-complement-items');
	if (!container) return;
	container.replaceChildren();
	const items = getAddressComplements();
	items.forEach((value, index) => {
		const row = document.createElement('div');
		row.className = 'd-flex gap-2 align-items-center';
		const input = document.createElement('input');
		input.className = 'form-control form-control-sm';
		input.value = value;
		input.setAttribute('aria-label', `Editar complemento ${index + 1}`);
		input.addEventListener('input', () => {
			const values = [...container.querySelectorAll('input')].map((field) => field.value.trim().replace(/,/g, ' '));
			document.getElementById('address-complement-list').value = values.filter(Boolean).join(', ');
			updateAddressPreview();
		});
		const remove = document.createElement('button');
		remove.type = 'button';
		remove.className = 'btn btn-outline-danger btn-sm flex-shrink-0';
		remove.textContent = 'Eliminar';
		remove.setAttribute('aria-label', `Eliminar complemento ${value}`);
		remove.addEventListener('click', () => {
			row.remove();
			document.getElementById('address-complement-list').value = [...container.querySelectorAll('input')].map((field) => field.value.trim().replace(/,/g, ' ')).filter(Boolean).join(', ');
			renderAddressComplements();
			updateAddressPreview();
			document.getElementById('address-complement-type').focus();
		});
		row.append(input, remove);
		container.append(row);
	});
	document.getElementById('address-complement-summary').textContent = items.length ? 'Puedes ajustar cada complemento en su campo o eliminarlo.' : 'No hay complementos agregados.';
}

function closeAddressEditor() {
	const editor = document.getElementById("notificationAddressEditor");
	if (editor) bootstrap.Modal.getOrCreateInstance(editor).hide();
	const error = document.getElementById("address-editor-error");
	if (error) error.classList.add("d-none");
}

document.addEventListener("shown.bs.modal", (event) => {
	if (event.target.id !== "notificationAddressEditor") return;
	document.querySelectorAll("[data-address-open]").forEach((button) => button.setAttribute("aria-expanded", String(button.dataset.addressContext === activeAddressContext)));
	renderAddressComplements();
	document.getElementById("address-type")?.focus();
});
document.addEventListener("hidden.bs.modal", (event) => {
	if (event.target.id !== "notificationAddressEditor") return;
	if (activeAddressContext === "contact") {
		Object.entries(notificationAddressDraft || {}).forEach(([id, value]) => {
			const field = document.getElementById(id);
			if (field) field.value = value;
		});
		notificationAddressDraft = null;
		activeAddressContext = "notification";
		const title = document.getElementById("notificationAddressEditorTitle");
		if (title) title.textContent = "Editar dirección de notificación";
	}
	document.querySelectorAll("[data-address-open]").forEach((button) => button.setAttribute("aria-expanded", "false"));
	document.getElementById("address-editor-error")?.classList.add("d-none");
});

document.addEventListener("input", (event) => {
	if (event.target.closest("#notificationAddressEditor")) updateAddressPreview();
	if (event.target.matches("#basic-first-name, #basic-middle-name, #basic-first-surname, #basic-second-surname, #basic-document-number, #basic-document-issue-date")) syncTaxpayerProfile();
});
document.addEventListener("change", (event) => {
	if (event.target.closest("#notificationAddressEditor")) updateAddressPreview();
	if (event.target.matches("#basic-id-class, #basic-withholding-agent")) syncTaxpayerProfile();
});
syncTaxpayerProfile();
if (!window.location.hash) window.location.hash = "inicio";
renderRoute();
observeTablePagination();

refreshNotificationPreview();

document.addEventListener("click", event => { if (event.target.closest("[data-notification-view-all]")) bootstrap.Offcanvas.getInstance(document.getElementById("notificationPanel"))?.hide(); });

document.addEventListener('show.bs.collapse', event => {
 if (event.target.id === 'vehicleTaxInformation') document.getElementById('vehicleTaxInformationToggle').innerHTML = 'Ver menos <i class="bi bi-chevron-up ms-1" aria-hidden="true"></i>';
});
document.addEventListener('hide.bs.collapse', event => {
 if (event.target.id === 'vehicleTaxInformation') document.getElementById('vehicleTaxInformationToggle').innerHTML = 'Ver más <i class="bi bi-chevron-down ms-1" aria-hidden="true"></i>';
});

// Reuse the RIT address editor and its field/preview/complement behavior.
function openSharedAddressEditor({ parentModal, title, state, onConfirm }) {
 const template = document.createElement('template'); template.innerHTML = existingRitPage;
 const editor = template.content.querySelector('#notificationAddressEditor').cloneNode(true);
 const launch = () => {
  document.body.appendChild(editor);
  editor.querySelector('#notificationAddressEditorTitle').textContent = title;
  editor.querySelectorAll('input, select').forEach(field => {
   if (state && Object.hasOwn(state, field.id)) field.value = state[field.id];
   else if (field.id.startsWith('address-') && field.id !== 'address-type') field.value = '';
  });
  const instance = new bootstrap.Modal(editor);
  const confirm = event => {
   if (!event.target.closest('[data-address-confirm]')) return;
   event.stopImmediatePropagation();
   const type = editor.querySelector('#address-street-type'); const number = editor.querySelector('#address-street-number');
   if (!type.value || !number.value.trim()) { editor.querySelector('#address-editor-error').classList.remove('d-none'); (!type.value ? type : number).focus(); return; }
   const values = Object.fromEntries([...editor.querySelectorAll('input, select')].map(field => [field.id, field.value]));
   onConfirm(composeNotificationStreet(), values); instance.hide();
  };
  editor.addEventListener('click', confirm);
  editor.addEventListener('hidden.bs.modal', () => {
   instance.dispose(); editor.remove();
   if (parentModal?.isConnected) { delete parentModal.dataset.addressSuspended; bootstrap.Modal.getOrCreateInstance(parentModal).show(); }
  }, { once: true });
  renderAddressComplements(); updateAddressPreview(); instance.show();
 };
 if (parentModal?.classList.contains('show')) {
  parentModal.dataset.addressSuspended = 'true';
  parentModal.addEventListener('hidden.bs.modal', launch, { once: true });
  bootstrap.Modal.getOrCreateInstance(parentModal).hide();
 } else launch();
}

document.addEventListener('show.bs.collapse', event => {
 if (event.target.id === 'predialInformation') document.getElementById('predialInformationToggle').innerHTML = 'Ver menos <i class="bi bi-chevron-up ms-1" aria-hidden="true"></i>';
});
document.addEventListener('hide.bs.collapse', event => {
 if (event.target.id === 'predialInformation') document.getElementById('predialInformationToggle').innerHTML = 'Ver más <i class="bi bi-chevron-down ms-1" aria-hidden="true"></i>';
});
