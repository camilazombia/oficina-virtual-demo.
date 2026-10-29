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
			["impuestos-todos", "Todos"],
			["impuestos-vehiculos", "Vehículos"],
			["impuestos-predial", "Predial"],
			["impuestos-ica", "ICA"],
			["impuestos-otros", "Otros impuestos"],
		],
	},
	{
		id: "obligaciones",
		label: "Mis obligaciones",
		icon: "bi-list-check",
		items: [
			["obligaciones-pendientes", "Obligaciones pendientes"],
			["obligaciones-cuenta", "Estados de cuenta"],
			["obligaciones-facilidades", "Facilidades de pago"],
		],
	},
	{
		id: "declaraciones",
		label: "Declaraciones",
		icon: "bi-file-earmark-text",
		items: [
			["declaraciones-generar", "Generar declaración"],
			["declaraciones-corregir", "Corregir declaración"],
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
			["notificaciones-archivo", "Archivo"],
		],
	},
];

// Ocultar temporalmente el contenido; conservar todas las opciones del menú.
const hiddenRouteGroups = new Set(['impuestos', 'obligaciones', 'declaraciones', 'pagos', 'tramites', 'documentos', 'notificaciones']);

const simpleRoutes = [
	{ id: "inicio", label: "Inicio", icon: "bi-house-door", group: null },
	{ id: "guia-visual", label: "Guía visual", icon: "bi-palette", group: null },
];
const pages = new Map(simpleRoutes.map((route) => [route.id, route]));
routeGroups.forEach((group) => group.items.forEach(([id, label]) => pages.set(id, { id, label, group })));
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
		ritFormValues["current-email"] = { value: "contribuyente.demo@example.com", checked: false };
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

restoreRitFormValues(contentRoot);
const existingRitPage = contentRoot.innerHTML;
let taxpayerIdentity = {
	firstName: "PERSONA",
	middleName: "DE",
	firstSurname: "PRUEBA",
	secondSurname: "DEMO",
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
		firstName: "Agente",
		middleName: "De",
		lastName: "Prueba",
		secondLastName: "Demo",
		address: "Calle 00 # 00-00, Bogotá, D. C.",
		landline: "(601) 000 0000",
		mobile: "300 000 0000",
		email: "agente.demo@example.com",
		socialNetwork: "Instagram",
		socialUser: "@agente_demo",
	},
];

const vehicles = [
	{"plate":"DEM001","brand":"CITROEN","line":"","year":"2020","className":"CAMIONETA","body":"WAGON","doors":"5","armored":"NO","engine":"1598"},
	{"plate":"DEM002","brand":"RAM","line":"","year":"2019","className":"CAMIONETA","body":"DOBLE CABINA","doors":"4","armored":"NO","engine":"3600"},
	{"plate":"DEM003","brand":"FORD","line":"","year":"2013","className":"AUTOMOVIL","body":"HATCH BACK","doors":"4","armored":"NO","engine":"1597"},
	{"plate":"DEM004","brand":"FORD","line":"","year":"2013","className":"AUTOMOVIL","body":"SEDAN","doors":"4","armored":"NO","engine":"1597"},
	{"plate":"DEM005","brand":"FORD","line":"","year":"2014","className":"CAMPERO","body":"WAGON","doors":"5","armored":"NO","engine":"1999"},
	{"plate":"DEM006","brand":"CHEVROLET","line":"","year":"2014","className":"CAMIONETA","body":"WAGON","doors":"5","armored":"NO","engine":"1796"},
	{"plate":"DEM007","brand":"NISSAN","line":"","year":"2014","className":"AUTOMOVIL","body":"SEDAN","doors":"04","armored":"NO","engine":"1598"},
	{"plate":"DEM008","brand":"CITROEN","line":"","year":"2014","className":"AUTOMOVIL","body":"SEDAN","doors":"5","armored":"NO","engine":"1587"},
	{"plate":"DEM009","brand":"VOLKSWAGEN","line":"","year":"2016","className":"CAMIONETA","body":"WAGON","doors":"4","armored":"NO","engine":"1598"},
	{"plate":"DEM010","brand":"RENAULT","line":"","year":"2016","className":"AUTOMOVIL","body":"SEDAN","doors":"4","armored":"NO","engine":"1598"},
	{"plate":"DEM011","brand":"VOLKSWAGEN","line":"","year":"2019","className":"AUTOMOVIL","body":"HATCH BACK","doors":"5","armored":"NO","engine":"1599"},
	{"plate":"DEM012","brand":"JEEP","line":"","year":"2019","className":"CAMIONETA","body":"WAGON","doors":"5","armored":"NO","engine":"1747"},
	{"plate":"DEM013","brand":"JEEP","line":"","year":"2019","className":"CAMIONETA","body":"WAGON","doors":"5","armored":"NO","engine":"2359"},
	{"plate":"DEM014","brand":"RENAULT","line":"","year":"2019","className":"AUTOMOVIL","body":"HATCH BACK","doors":"5","armored":"NO","engine":"1599"},
	{"plate":"DEM015","brand":"FORD","line":"","year":"2019","className":"CAMIONETA","body":"WAGON","doors":"5","armored":"NO","engine":"1999"},
	{"plate":"DEM016","brand":"KIA","line":"","year":"2020","className":"CAMIONETA","body":"WAGON","doors":"5","armored":"NO","engine":"1999"},
	{"plate":"DEM017","brand":"PEUGEOT","line":"","year":"2020","className":"CAMIONETA","body":"WAGON","doors":"5","armored":"NO","engine":"1598"},
	{"plate":"DEM018","brand":"PEUGEOT","line":"","year":"2020","className":"CAMIONETA","body":"WAGON","doors":"5","armored":"NO","engine":"1587"},
	{"plate":"DEM019","brand":"RENAULT","line":"","year":"2020","className":"AUTOMOVIL","body":"HATCH BACK","doors":"5","armored":"NO","engine":"999"},
	{"plate":"DEM020","brand":"SUZUKI","line":"","year":"2020","className":"CAMIONETA","body":"WAGON","doors":"5","armored":"NO","engine":"1586"},
	{"plate":"DEM021","brand":"SUZUKI","line":"","year":"2018","className":"AUTOMOVIL","body":"HATCH BACK","doors":"5","armored":"NO","engine":"1197"},
	{"plate":"DEM022","brand":"SUZUKI","line":"","year":"2018","className":"AUTOMOVIL","body":"HATCH BACK","doors":"5","armored":"NO","engine":"1197"},
	{"plate":"DEM023","brand":"RENAULT","line":"","year":"2017","className":"AUTOMOVIL","body":"HATCH BACK","doors":"5","armored":"NO","engine":"1599"},
	{"plate":"DEM024","brand":"SUZUKI","line":"","year":"2018","className":"AUTOMOVIL","body":"HATCH BACK","doors":"5","armored":"NO","engine":"1197"},
	{"plate":"DEM025","brand":"KIA","line":"","year":"2018","className":"AUTOMOVIL","body":"HATCH BACK","doors":"5","armored":"NO","engine":"1248"},
	{"plate":"DEM026","brand":"HYUNDAI","line":"","year":"2017","className":"AUTOMOVIL","body":"SEDAN","doors":"4","armored":"NO","engine":"1591"},
	{"plate":"DEM027","brand":"PEUGEOT","line":"","year":"2018","className":"AUTOMOVIL","body":"HATCH BACK","doors":"5","armored":"NO","engine":"1598"},
	{"plate":"DEM028","brand":"JEEP","line":"","year":"2018","className":"CAMIONETA","body":"WAGON","doors":"5","armored":"NO","engine":"1747"},
	{"plate":"DEM029","brand":"VOLKSWAGEN","line":"","year":"2019","className":"AUTOMOVIL","body":"SEDAN","doors":"4","armored":"NO","engine":"1395"},
	{"plate":"DEM030","brand":"VOLVO","line":"","year":"2019","className":"CAMIONETA","body":"WAGON","doors":"5","armored":"NO","engine":"1969"},
	{ plate: "DEM031", brand: "Ducati", line: "", year: "2013", className: "Motocicleta", body: "Sin carrocería", doors: "0", armored: "No", engine: "1198" },
	{ plate: "DEM032", brand: "BMW", line: "", year: "2012", className: "Automóvil", body: "Sedán", doors: "4", armored: "No", engine: "1997" },
];

const predialProperties = [
	["DEMO0000001", "000C00000001", "CL 00 00 01", "", "2026", "00000000000000000001"],
	["DEMO0000002", "000C00000002", "CL 00 00 02", "", "2026", "00000000000000000002"],
	["DEMO0000003", "000C00000003", "CL 00 00 03", "", "2026", "00000000000000000003"],
	["DEMO0000004", "000C00000004", "CL 00 00 04", "", "2026", "00000000000000000004"],
];

const vehicleHeaders = ["Placa", "Marca", "Línea", "Modelo", "Clase", "Carrocería", "No. de puertas", "Blindaje", "Cilindraje"];

function linkTo(id, label, classes = "") {
	return `<a class="${classes}" href="#${id}">${label}</a>`;
}

function renderNavigation(activeId) {
	const activeMenuId = activeId.startsWith("vehiculo-") ? "impuestos-vehiculos" : activeId === "rit-agentes-habilitar" ? "rit-agentes" : activeId;
	const homeItem = `<li class="nav-item"><a class="nav-link d-flex align-items-center gap-2 ${activeMenuId === "inicio" ? "active" : "text-body"}" href="#inicio" ${activeMenuId === "inicio" ? 'aria-current="page"' : ""}><i class="bi bi-house-door" aria-hidden="true"></i><span>Inicio</span></a></li>`;
	const groupItems = routeGroups.map((group) => {
		const groupActive = group.items.some(([id]) => id === activeMenuId);
		const collapseId = `nav-${group.id}`;
		const items = group.items.map(([id, label]) => id === "rit-certificacion" ? `<li class="nav-item"><button class="nav-link small py-2 ps-5 w-100 text-start link-secondary" type="button" data-rit-certificate-open aria-haspopup="dialog"><i class="bi bi-download me-2" aria-hidden="true"></i>${label}</button></li>` : `<li class="nav-item"><a class="nav-link small py-2 ps-5 ${activeMenuId === id ? "active" : "link-secondary"}" href="#${id}" ${activeMenuId === id ? 'aria-current="page"' : ""}>${label}</a></li>`).join("");
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
	if (route.group) crumbs.push(`<li class="breadcrumb-item">${route.group.label}</li>`);
	crumbs.push(`<li class="breadcrumb-item active" aria-current="page">${route.label}</li>`);
	breadcrumbRoot.innerHTML = crumbs.join("");
}

function pageTitle(title, description = "") {
	return `<header class="mb-4"><h1 class="h3 fw-semibold mb-2">${title}</h1>${description ? `<p class="text-secondary mb-0">${description}</p>` : ""}</header>`;
}

function section(title, content, extraClass = "") {
	return `<section class="bg-white border rounded-3 p-3 p-md-4 mb-4 ${extraClass}"><h2 class="h6 fw-semibold border-bottom pb-2 mb-3">${title}</h2>${content}</section>`;
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

function table(headers, rows = [], options = {}) {
	const headerMarkup = headers.map((header) => `<th scope="col">${header}</th>`).join("");
	const bodyMarkup = rows.length
		? rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")
		: `<tr><td class="text-center text-secondary py-4" colspan="${headers.length}">${options.empty ?? "No hay registros disponibles."}</td></tr>`;
	return `<div class="table-responsive app-table-container mb-3"><table class="table app-table table-hover align-middle mb-0"><thead class="table-light"><tr>${headerMarkup}</tr></thead><tbody>${bodyMarkup}</tbody></table></div>`;
}

function filterForm(fields, buttonText = "Consultar") {
	const controls = fields.map((field, index) => {
		const id = `filter-${++filterControlIndex}-${index}`;
		const options = field.options ? `<select class="form-select" id="${id}"><option ${field.value ? "" : "selected"} value="">Seleccione</option>${field.options.map((option) => `<option${option === field.value ? " selected" : ""}>${option}</option>`).join("")}</select>` : `<input class="form-control" id="${id}" type="${field.type ?? "text"}" placeholder="${field.placeholder ?? ""}">`;
		return `<div class="col-12 col-md-${field.columns ?? 4}"><label class="form-label" for="${id}">${field.label}</label>${options}</div>`;
	}).join("");
	return `<form class="row g-3 align-items-end mb-4" data-placeholder-form>${controls}<div class="col-12"><button class="btn btn-primary" type="submit">${buttonText}</button></div></form>`;
}

function stepFlow(steps, fields = []) {
	const stepMarkup = steps.map((step, index) => `<li class="list-group-item d-flex align-items-center gap-3"><span class="badge ${index === 0 ? "text-bg-primary" : "text-bg-secondary"} rounded-pill">${index + 1}</span><span>${step}</span></li>`).join("");
	return `<ol class="list-group list-group-numbered mb-4">${stepMarkup}</ol>${fields.length ? filterForm(fields, "Continuar") : ""}${emptyState("El flujo está preparado. Los pasos se habilitarán cuando se conecte el servicio correspondiente.")}`;
}

function vehicleRows() {
	return vehicles.map((vehicle) => [
		vehicle.plate, vehicle.brand, vehicle.line || "—", vehicle.year, vehicle.className, vehicle.body, vehicle.doors, vehicle.armored, vehicle.engine,
	]);
}

function getTaxpayerIdentity() {
	const readValue = (id, fallback) => {
		const field = document.getElementById(id);
		return field ? field.value.trim() : fallback;
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
	const fullName = [firstName, firstSurname].filter(Boolean).join(" ");
	const initials = `${firstName.charAt(0)}${firstSurname.charAt(0)}`.toLocaleUpperCase("es");
	return { firstName, middleName, firstSurname, secondSurname, fullName, initials, documentType, documentTypeLabel, documentNumber, documentIssueDate, withholdingAgent };
}

function syncTaxpayerProfile() {
	taxpayerIdentity = getTaxpayerIdentity();
	const identity = taxpayerIdentity;
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

function saveRitPersonalData() {
	const personalDataForm = contentRoot.querySelector('form[aria-label="Formulario Mi RIT"]');
	if (!personalDataForm) return;
	const nextValues = {};
	personalDataForm.querySelectorAll("input[id], select[id], textarea[id]").forEach((field) => {
		if (field.type === "password" || field.type === "file") return;
		nextValues[field.id] = { value: field.value, checked: field.checked };
	});
	const status = document.getElementById("ritSaveStatus");
	try {
		window.localStorage.setItem(ritFormStorageKey, JSON.stringify(nextValues));
		ritFormValues = nextValues;
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
	name: index < 5 ? ["Empresa Demo Uno S.A.S.", "Empresa Demo Dos S.A.S.", "Empresa Demo Tres S.A.S.", "Empresa Demo Cuatro S.A.S.", "Empresa Demo Cinco S.A.S."][index] : `Empresa Demo ${String(index + 1).padStart(4, "0")} S.A.S.`,
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
			<div class="col-12 col-lg-6"><h3 class="h6 text-secondary">Paginación</h3><nav aria-label="Páginas de ejemplo"><ul class="pagination"><li class="page-item disabled"><a class="page-link" href="#" tabindex="-1" aria-disabled="true">Anterior</a></li><li class="page-item active" aria-current="page"><a class="page-link" href="#">1</a></li><li class="page-item"><a class="page-link" href="#">2</a></li><li class="page-item"><a class="page-link" href="#">Siguiente</a></li></ul></nav><h3 class="h6 text-secondary mt-4">Lista</h3><div class="list-group"><a href="#" class="list-group-item list-group-item-action active" aria-current="true">Elemento activo</a><a href="#" class="list-group-item list-group-item-action">Elemento disponible</a><button type="button" class="list-group-item list-group-item-action" disabled>Elemento deshabilitado</button></div></div>
			<div class="col-12"><h3 class="h6 text-secondary">Tarjetas y tabla</h3><div class="row g-3 mb-3"><div class="col-12 col-md-6"><div class="card"><div class="card-header">Encabezado</div><div class="card-body"><h4 class="h6 card-title">Tarjeta estándar</h4><p class="card-text">Superficie para agrupar información y acciones.</p><button class="btn btn-primary btn-sm" type="button">Acción</button></div><div class="card-footer text-secondary">Pie de tarjeta</div></div></div><div class="col-12 col-md-6"><div class="card text-bg-primary"><div class="card-body"><h4 class="h6 card-title">Variante destacada</h4><p class="card-text mb-0">Tarjeta con fondo contextual.</p></div></div></div></div><div class="table-responsive app-table-container mb-3"><table class="table app-table table-hover align-middle mb-0"><thead class="table-light"><tr><th scope="col">Estado</th><th scope="col">Descripción</th><th scope="col">Acción</th></tr></thead><tbody><tr><td><span class="badge text-bg-success">Pagado</span></td><td>Fila normal</td><td><button class="btn btn-outline-primary btn-sm" type="button">Ver</button></td></tr><tr><td><span class="badge text-bg-warning">Pendiente</span></td><td>Fila con hover al pasar el puntero</td><td><button class="btn btn-outline-secondary btn-sm" type="button" disabled>Sin acción</button></td></tr></tbody></table></div></div>
			<div class="col-12"><h3 class="h6 text-secondary">Insignias y alertas</h3><div class="d-flex flex-wrap gap-2 mb-3"><span class="badge text-bg-primary">Primaria</span><span class="badge text-bg-secondary">Secundaria</span><span class="badge text-bg-success">Completado</span><span class="badge text-bg-danger">Error</span><span class="badge text-bg-warning">Pendiente</span><span class="badge text-bg-info">Información</span><span class="badge text-bg-light">Neutra</span><span class="badge text-bg-dark">Oscura</span><span class="badge rounded-pill text-bg-primary">Píldora</span></div><div class="alert alert-primary" role="alert"><strong>Información.</strong> Mensaje informativo.</div><div class="alert alert-success" role="alert"><strong>Éxito.</strong> La acción se completó correctamente.</div><div class="alert alert-warning" role="alert"><strong>Atención.</strong> Revisa los datos antes de continuar.</div><div class="alert alert-danger" role="alert"><strong>Error.</strong> No fue posible completar la acción.</div><div class="alert alert-secondary alert-dismissible fade show" role="alert">Alerta descartable: usa el botón de cerrar para ocultarla.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button></div></div>
			<div class="col-12 col-lg-6"><h3 class="h6 text-secondary">Progreso y carga</h3><div class="progress mb-3" role="progressbar" aria-label="Progreso normal" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar" style="width: 25%">25%</div></div><div class="progress mb-3" role="progressbar" aria-label="Progreso completado" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar bg-success" style="width: 100%">Completado</div></div><div class="progress mb-3" role="progressbar" aria-label="Progreso activo" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 60%">En curso</div></div><div class="d-flex align-items-center gap-3"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div><div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Cargando...</span></div><div class="spinner-border spinner-border-sm text-success" role="status"><span class="visually-hidden">Cargando...</span></div><span class="small text-secondary">Cargando, crecimiento y tamaño pequeño.</span></div></div>
			<div class="col-12 col-lg-6"><h3 class="h6 text-secondary">Paneles expandibles</h3><p><button class="btn btn-outline-primary" type="button" data-bs-toggle="collapse" data-bs-target="#guideCollapse" aria-expanded="false" aria-controls="guideCollapse">Abrir o cerrar detalle</button></p><div class="collapse" id="guideCollapse"><div class="card card-body mb-3">Contenido colapsado: estado abierto.</div></div><div class="accordion" id="guideAccordion"><div class="accordion-item"><h4 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#guideAccordionOpen" aria-expanded="true" aria-controls="guideAccordionOpen">Sección expandida</button></h4><div id="guideAccordionOpen" class="accordion-collapse collapse show" data-bs-parent="#guideAccordion"><div class="accordion-body">Este panel está abierto; pulsa el encabezado para cerrarlo.</div></div></div><div class="accordion-item"><h4 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#guideAccordionClosed" aria-expanded="false" aria-controls="guideAccordionClosed">Sección contraída</button></h4><div id="guideAccordionClosed" class="accordion-collapse collapse" data-bs-parent="#guideAccordion"><div class="accordion-body">Este panel inicia cerrado.</div></div></div></div></div>
			<div class="col-12"><h3 class="h6 text-secondary">Ventana modal</h3><p class="mb-0"><button class="btn btn-primary" type="button" data-bs-toggle="modal" data-bs-target="#guideComponentModal">Abrir modal de ejemplo</button></p><div class="modal fade" id="guideComponentModal" tabindex="-1" aria-labelledby="guideComponentModalLabel" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h4 class="modal-title fs-5" id="guideComponentModalLabel">Modal de ejemplo</h4><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div><div class="modal-body">Estado abierto. Puedes cerrar esta ventana con el botón, con Escape o pulsando fuera del cuadro.</div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button><button type="button" class="btn btn-primary" data-bs-dismiss="modal">Aceptar</button></div></div></div></div></div>
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

function renderDashboard() {
	const identity = activeCompany ? { fullName: activeCompany.name, documentType: "NIT", documentTypeLabel: "Número de identificación tributaria", documentNumber: activeCompany.nit } : getTaxpayerIdentity();
	const declarationRows = [
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
	const rows = declarationRows.map((declaration, index) => {
		if (activeCompany) declaration.declaration = String(300000000000 + Number(activeCompany.id) * 100 + index);
		const statusColor = declaration.status === "Pendiente por firmar" ? "info" : "warning";
		const searchText = Object.values(declaration).join(" ").toLocaleLowerCase("es");
		return `<tr data-pending-declaration-row data-search-text="${searchText}">
			<td><span class="fw-semibold text-nowrap">${declaration.declaration}</span></td>
			<td>${declaration.tax}</td>
			<td class="text-center">${declaration.year}</td>
			<td class="text-center">${declaration.period}</td>
			<td><span class="badge rounded-pill bg-${statusColor}-subtle text-${statusColor}-emphasis border border-${statusColor}-subtle text-wrap text-start px-3 py-2">${declaration.status}</span></td>
			<td class="text-center"><a class="btn btn-outline-primary btn-sm px-3" href="?${new URLSearchParams({ impuesto: declaration.tax, vigencia: declaration.year, periodo: declaration.period, declaracion: declaration.declaration })}#declaraciones-generar"><i class="bi bi-eye me-1" aria-hidden="true"></i>Ver</a></td>
		</tr>`;
	}).join("");
	const content = `<div class="row g-3 align-items-center mb-4">
		<div class="col-12 col-md-auto d-flex align-items-center gap-2">
			<label class="form-label small fw-semibold text-secondary mb-0" for="pendingDeclarationsPageSize">Mostrar</label>
			<select class="form-select form-select-sm w-auto" id="pendingDeclarationsPageSize" aria-label="Datos por página"><option>10</option><option>20</option><option>30</option></select>
			<span class="small text-secondary">registros por página</span>
		</div>
		<div class="col-12 col-md-5 ms-md-auto d-flex align-items-center gap-2">
			<label class="form-label small fw-semibold text-secondary mb-0" for="pendingDeclarationsSearch">Buscar</label>
			<div class="input-group input-group-sm">
				<span class="input-group-text bg-white"><i class="bi bi-search" aria-hidden="true"></i></span>
				<input class="form-control" type="search" id="pendingDeclarationsSearch" aria-label="Buscar declaraciones" placeholder="Número o impuesto">
			</div>
		</div>
	</div>
	<div class="table-responsive app-table-container mb-3"><table class="table app-table table-hover align-middle mb-0" id="pending-declarations-table">
		<caption class="visually-hidden">Declaraciones tributarias pendientes de firma o presentación</caption>
		<thead class="table-light"><tr><th scope="col">Declaración</th><th scope="col">Impuesto</th><th scope="col" class="text-center">Año gravable</th><th scope="col" class="text-center">Periodo</th><th scope="col">Estatus</th><th scope="col" class="text-center">Seleccionar</th></tr></thead>
		<tbody>${rows}</tbody>
	</table></div>
	<div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2">
		<p class="small text-secondary mb-0" id="pendingDeclarationsSummary" aria-live="polite"></p>
		<nav aria-label="Paginación de declaraciones pendientes">
			<ul class="pagination pagination-sm mb-0" id="pendingDeclarationsPagination"></ul>
		</nav>
	</div>`;
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

	const firstResult = matchingRows.length ? firstIndex + 1 : 0;
	const lastResult = Math.min(firstIndex + pageSize, matchingRows.length);
	document.getElementById("pendingDeclarationsSummary").textContent = `Mostrando del ${firstResult} al ${lastResult} (Total: ${matchingRows.length} resultados)`;
	document.getElementById("pendingDeclarationsPagination").innerHTML = [
		`<li class="page-item${pendingDeclarationsPage === 1 ? " disabled" : ""}"><button class="page-link" type="button" data-pending-page="${pendingDeclarationsPage - 1}" ${pendingDeclarationsPage === 1 ? "disabled" : ""}>Anterior</button></li>`,
		...Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => `<li class="page-item${page === pendingDeclarationsPage ? " active" : ""}"${page === pendingDeclarationsPage ? ' aria-current="page"' : ""}><button class="page-link" type="button" data-pending-page="${page}"${page === pendingDeclarationsPage ? ' aria-current="page"' : ""}>${page}</button></li>`),
		`<li class="page-item${pendingDeclarationsPage === pageCount ? " disabled" : ""}"><button class="page-link" type="button" data-pending-page="${pendingDeclarationsPage + 1}" ${pendingDeclarationsPage === pageCount ? "disabled" : ""}>Siguiente</button></li>`,
	].join("");
}

function renderRitSummary() {
	const content = `<div class="row g-3"><div class="col-12 col-md-6">${section("Datos de la persona", emptyState("La información personal del RIT se mostrará aquí."))}</div><div class="col-12 col-md-6">${section("Direcciones", emptyState("Las direcciones registradas se mostrarán aquí."))}</div><div class="col-12 col-md-6">${section("Impuestos registrados", emptyState("Los impuestos asociados al RIT se mostrarán aquí."))}</div><div class="col-12 col-md-6">${section("Autorizaciones y agentes", emptyState("Las autorizaciones y los agentes autorizados se mostrarán aquí."))}</div></div>`;
	return `${pageTitle("Resumen del RIT", "Consulta la información principal registrada en tu Registro de Información Tributaria.")}${content}`;
}

function renderRitCertificateForm() {
	return `<form id="ritCertificateForm" class="row g-3 align-items-end" novalidate>
		<div class="col-12">
			<label class="form-label" for="ritCertificateType">Tipo de certificación <span class="text-danger">*</span></label>
			<select class="form-select" id="ritCertificateType" required>
				<option value="Impuesto" selected>Impuesto</option>
			</select>
			<div class="invalid-feedback">Selecciona el tipo de certificación.</div>
		</div>
		<div class="col-12">
			<label class="form-label" for="ritCertificateTax">Impuesto <span class="text-danger">*</span></label>
			<select class="form-select" id="ritCertificateTax" required>
				<option value="" selected disabled>Selecciona un impuesto</option>
				<option value="vehiculos">Impuestos de Vehículos</option>
				<option value="ica">Impuestos de ICA</option>
			</select>
			<div class="invalid-feedback">Selecciona un impuesto.</div>
		</div>
		<div class="col-12 d-flex justify-content-end gap-2"><button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal">Cancelar</button><button class="btn btn-primary" type="submit">Descargar certificado</button></div>
	</form><p class="small text-success mt-3 mb-0 d-none" id="ritCertificateDownloadStatus" role="status">El PDF se descargó correctamente.</p>`;
}

function renderRitCertification() {
	return `${pageTitle("Certificado RIT", "Descarga la certificación de tu Registro de Información Tributaria.")}<button class="btn btn-primary" type="button" data-rit-certificate-open aria-haspopup="dialog"><i class="bi bi-download me-2" aria-hidden="true"></i>Descargar certificado RIT</button>`;
}

document.addEventListener("click", (event) => {
	const trigger = event.target.closest("[data-rit-certificate-open]");
	if (!trigger || document.getElementById("ritCertificateModal")) return;
	const open = () => {
		const modal = document.createElement("div");
		modal.className = "modal fade";
		modal.id = "ritCertificateModal";
		modal.tabIndex = -1;
		modal.setAttribute("aria-labelledby", "ritCertificateModalTitle");
		modal.setAttribute("aria-describedby", "ritCertificateModalDescription");
		modal.innerHTML = `<div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h2 class="modal-title fs-5" id="ritCertificateModalTitle">Descargar certificado RIT</h2><button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Cerrar"></button></div><div class="modal-body p-4"><p class="text-secondary" id="ritCertificateModalDescription">Selecciona el tipo de certificación y el impuesto que necesitas incluir.</p>${renderRitCertificateForm()}</div></div></div>`;
		document.body.appendChild(modal);
		const instance = new bootstrap.Modal(modal);
		modal.addEventListener("shown.bs.modal", () => document.getElementById("ritCertificateType").focus());
		modal.addEventListener("hidden.bs.modal", () => {
			instance.dispose();
			modal.remove();
			if (trigger.isConnected) trigger.focus();
		}, { once: true });
		instance.show();
	};
	const navigation = document.getElementById("primaryNavigation");
	const offcanvas = bootstrap.Offcanvas.getInstance(navigation);
	if (window.innerWidth < 992 && navigation.classList.contains("show")) {
		navigation.addEventListener("hidden.bs.offcanvas", open, { once: true });
		offcanvas?.hide();
	} else open();
});

function renderTaxList(title, description = "") {
	const rows = vehicleRows();
	return `${pageTitle(title, description)}${section("Vehículos asociados", `<div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3"><label class="small d-flex align-items-center gap-2">Mostrar <select class="form-select form-select-sm w-auto"><option>10</option><option>25</option></select> registros</label><label class="small d-flex align-items-center gap-2">Buscar <input class="form-control form-control-sm" type="search" aria-label="Buscar impuestos"></label></div>${table(vehicleHeaders, rows)}`)}`;
}

function renderPredialTax() {
	const rows = predialProperties.map((property) => `<tr data-predial-row data-search-text="${property.join(" ").toLocaleLowerCase("es")}">${property.map((value) => `<td>${value}</td>`).join("")}</tr>`).join("");
	const headers = ["CHIP", "Matrícula inmobiliaria", "Dirección del predio", "Número de contrato de arrendamiento", "Año gravable", "Número de objeto"];
	return `${pageTitle("Impuesto predial", "Predios asociados al contribuyente.")}${section("Predios", `<div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
		<label class="d-flex align-items-center gap-2 small mb-0" for="predialPageSize">Mostrar
			<select class="form-select form-select-sm w-auto" id="predialPageSize"><option selected>10</option><option>20</option><option>30</option></select>
			datos por página
		</label>
		<div class="d-flex align-items-center gap-2"><label class="small mb-0" for="predialSearch">Buscar:</label><input class="form-control form-control-sm" id="predialSearch" type="search"></div>
	</div>
	<div class="table-responsive app-table-container mb-3"><table class="table app-table table-hover align-middle mb-0" id="predialPropertiesTable">
		<thead class="table-light"><tr>${headers.map((header) => `<th scope="col">${header}</th>`).join("")}</tr></thead>
		<tbody>${rows}</tbody>
	</table></div>
	<p class="small text-secondary mb-0" id="predialSummary" aria-live="polite">Mostrando 4 predios</p>`)}`;
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

function renderVehicleDetail(plate) {
	const vehicle = vehicles.find((item) => item.plate === plate);
	if (!vehicle) return `${pageTitle("Detalle del vehículo")}${emptyState("No se encontró el vehículo solicitado.")}`;
	const details = `<dl class="row mb-0"><dt class="col-sm-4">Placa</dt><dd class="col-sm-8">${vehicle.plate}</dd><dt class="col-sm-4">Marca</dt><dd class="col-sm-8">${vehicle.brand}</dd><dt class="col-sm-4">Línea</dt><dd class="col-sm-8">${vehicle.line || "—"}</dd><dt class="col-sm-4">Modelo</dt><dd class="col-sm-8">${vehicle.year}</dd><dt class="col-sm-4">Clase</dt><dd class="col-sm-8">${vehicle.className}</dd><dt class="col-sm-4">Carrocería</dt><dd class="col-sm-8">${vehicle.body}</dd><dt class="col-sm-4">Número de puertas</dt><dd class="col-sm-8">${vehicle.doors}</dd><dt class="col-sm-4">Blindaje</dt><dd class="col-sm-8">${vehicle.armored}</dd><dt class="col-sm-4">Cilindraje</dt><dd class="col-sm-8">${vehicle.engine}</dd></dl>`;
	return `${pageTitle(`Vehículo ${vehicle.plate}`, "Información del vehículo asociado al ciudadano.")}${section("Datos del vehículo", details)}${section("Información tributaria", emptyState("La información tributaria del vehículo se consultará cuando esté disponible."))}${section("Obligaciones asociadas", emptyState("No hay obligaciones asociadas para mostrar."))}${linkTo("impuestos-vehiculos", "Volver a vehículos", "btn btn-outline-primary btn-sm")}`;
}

function renderObligations() {
	const headers = ["Impuesto", "Vigencia", "Periodo", "Fecha de vencimiento", "Valor", "Estado"];
	return `${pageTitle("Obligaciones pendientes", "Consulta las obligaciones agrupadas por impuesto.")}${section("Obligaciones", table(headers))}`;
}

function renderAccountStatement() {
	const fields = [{ label: "Nombre", placeholder: "Nombre del contribuyente", columns: 6 }, { label: "Tipo de identificación", options: ["Cédula de ciudadanía", "Cédula de extranjería", "NIT"], columns: 3 }, { label: "Fecha de generación", type: "date", columns: 3 }];
	return `${pageTitle("Estados de cuenta", "Consulta la situación de cuenta tributaria.")}${section("Datos de consulta", `${filterForm(fields)}<p class="small text-secondary">Tasas de interés e información del estado de cuenta.</p>${emptyState("Ingresa los criterios y consulta para ver el estado de cuenta.")}`)}`;
}

function renderPaymentPlans() {
	return `${pageTitle("Facilidades de pago", "Consulta facilidades vigentes, obligaciones asociadas y recibos oficiales de pago.")}${section("Facilidades vigentes", `${table(["Acuerdo", "Fecha", "Estado", "Obligaciones asociadas", "Acción"])}${emptyState("No hay facilidades de pago vigentes para mostrar.")}<button class="btn btn-outline-primary btn-sm mt-3" type="button">Generar recibo oficial de pago</button>`)}`;
}

function renderDeclaration(id) {
	const configs = {
		"declaraciones-generar": { title: "Generar declaración", steps: ["Seleccionar impuesto", "Seleccionar año gravable", "Seleccionar periodo", "Diligenciar declaración", "Revisar", "Generar declaración"], fields: [{ label: "Impuesto", options: ["Impuesto Predial", "Impuesto de Vehículos", "ICA"], columns: 4 }, { label: "Año gravable", options: ["2026", "2025", "2024"], columns: 4 }, { label: "Periodo", options: ["Anual", "Primer periodo", "Segundo periodo"], columns: 4 }] },
		"declaraciones-corregir": { title: "Corregir declaración", steps: ["Seleccionar impuesto", "Seleccionar declaración", "Seleccionar año y periodo", "Realizar corrección", "Revisar", "Generar"], fields: [{ label: "Impuesto", options: ["Impuesto Predial", "Impuesto de Vehículos", "ICA"], columns: 4 }, { label: "Declaración", options: ["Declaraciones disponibles"], columns: 4 }, { label: "Año y periodo", options: ["Seleccione"], columns: 4 }] },
		"declaraciones-blanco": { title: "Generar declaración en blanco", steps: ["Seleccionar tipo de impuesto", "Seleccionar año gravable", "Generar declaración en blanco"], fields: [{ label: "Tipo de impuesto", options: ["Impuesto Predial", "Impuesto de Vehículos", "ICA"], columns: 6 }, { label: "Año gravable", options: ["2026", "2025", "2024"], columns: 6 }] },
	};
	const context = new URLSearchParams(window.location.search);
	if (id === "declaraciones-generar") {
		const selectedTax = context.get("impuesto");
		const selectedYear = context.get("vigencia");
		const selectedPeriod = context.get("periodo");
		const fields = configs[id].fields;
		const taxNames = { "Impuestos de Veh\u00edculos": "Impuesto de Veh\u00edculos", "Impuestos de Delineaci\u00f3n Urbana": "Impuesto de Delineaci\u00f3n Urbana" };
		const tax = taxNames[selectedTax] || selectedTax;
		if (!fields[0].options.includes("Impuesto de Delineaci\u00f3n Urbana")) fields[0].options.push("Impuesto de Delineaci\u00f3n Urbana");
		if (fields[0].options.includes(tax)) {
			fields[0].value = tax;
			configs[id].title += ` de ${tax.replace(/^Impuesto(?: de)? /, "")}`;
		}
		if (/^\d{4}$/.test(selectedYear || "")) {
			if (!fields[1].options.includes(selectedYear)) fields[1].options.push(selectedYear);
			fields[1].value = selectedYear;
		}
		if (selectedPeriod) {
			fields[2].value = selectedPeriod === "\u2014" ? "Anual" : selectedPeriod;
			if (!fields[2].options.includes(fields[2].value)) fields[2].options.push(fields[2].value);
		}
	}
	const config = configs[id];
	if (!config) return `${pageTitle("Declaraciones presentadas", "Consulta el historial de declaraciones presentadas.")}${section("Filtros", `${filterForm([{ label: "Impuesto", options: ["Todos", "Impuesto Predial", "Impuesto de Vehículos", "ICA"], columns: 6 }, { label: "Año gravable", options: ["Todos", "2026", "2025", "2024"], columns: 3 }])}${table(["Impuesto", "Año gravable", "Periodo", "Fecha de presentación", "Estado"])}`)}`;
	return `${pageTitle(config.title, "Flujo preparado para completar en etapas.")}${section("Pasos", stepFlow(config.steps, config.fields))}`;
}

function renderInvoices() {
	return `${pageTitle("Facturas", "Consulta, descarga o reexpide facturas por impuesto y año gravable.")}${section("Descargar factura", stepFlow(["Seleccionar tipo de impuesto", "Seleccionar año gravable", "Consultar y descargar factura"], [{ label: "Tipo de impuesto", options: ["Impuesto Predial", "Impuesto de Vehículos", "ICA"], columns: 6 }, { label: "Año gravable", options: ["2026", "2025", "2024"], columns: 6 }]))}${section("Reexpedir factura", stepFlow(["Seleccionar tipo de impuesto", "Seleccionar año gravable", "Consultar y generar factura"], [{ label: "Tipo de impuesto", options: ["Impuesto Predial", "Impuesto de Vehículos", "ICA"], columns: 6 }, { label: "Año gravable", options: ["2026", "2025", "2024"], columns: 6 }]))}`;
}

function renderReceipts() {
	return `${pageTitle("Recibos de pago", "Accede a la generación de recibos de pago.")}${section("Generar recibo multipago", stepFlow(["Seleccionar impuesto", "Seleccionar periodo de la obligación", "Seleccionar obligaciones", "Revisar obligaciones seleccionadas", "Generar recibo"], [{ label: "Impuesto", options: ["Impuesto Predial", "Impuesto de Vehículos", "ICA"], columns: 4 }, { label: "Periodo de la obligación", options: ["Seleccione"], columns: 4 }] ))}${section("Generar ROP", emptyState("El flujo de generación del recibo oficial de pago estará disponible al conectar el servicio correspondiente."))}`;
}

function renderPaymentHistory() {
	return `${pageTitle("Relación de pagos", "Consulta el historial de pagos realizados, declaraciones presentadas y pagos de años anteriores.")}${section("Filtros", `${filterForm([{ label: "Impuesto", options: ["Todos", "Impuesto Predial", "Impuesto de Vehículos", "ICA"], columns: 4 }, { label: "Año", options: ["Todos", "2026", "2025", "2024"], columns: 4 }])}${table(["Fecha", "Impuesto", "Vigencia", "Referencia", "Valor", "Estado"])}`)}`;
}

function renderProcedures() {
	const resultFields = `<dl class="row mb-0"><dt class="col-sm-4">Información del trámite</dt><dd class="col-sm-8">Pendiente de consulta</dd><dt class="col-sm-4">Estado</dt><dd class="col-sm-8">—</dd><dt class="col-sm-4">Fecha de radicación</dt><dd class="col-sm-8">—</dd><dt class="col-sm-4">Última actualización</dt><dd class="col-sm-8">—</dd></dl>`;
	return `${pageTitle("Trámites", "Consulta y haz seguimiento a tus trámites.")}${section("Buscar trámite", `${filterForm([{ label: "Número de caso", placeholder: "Ingresa el número de caso", columns: 5 }, { label: "Número de radicado", placeholder: "Ingresa el número de radicado", columns: 5 }], "Buscar")}${emptyState("Ingresa un número de caso o de radicado para consultar la información del trámite.")}`)}${section("Resultado de búsqueda", `${resultFields}<h3 class="h6 mt-3">Historial</h3>${emptyState("El historial se mostrará después de realizar una búsqueda.")}<h3 class="h6 mt-3">Documentos asociados</h3>${emptyState("No hay documentos asociados para mostrar.")}`)}`;
}

function renderDocuments(id) {
	if (id === "documentos-retenciones") {
		return `${pageTitle("Retenciones practicadas", "Selecciona el año gravable para consultar la información.")}${section("Año gravable", `${filterForm([{ label: "Año gravable", options: ["2026", "2025", "2024"], columns: 6 }])}${emptyState("Selecciona un año gravable para consultar las retenciones practicadas.")}`)}`;
	}
	const config = {
		"documentos-rit": "Certificación RIT",
		"documentos-pago": "Certificaciones de pago",
		"documentos-multipagos": "Certificación multipagos",
		"documentos-declaracion": "Certificación de declaración",
	};
	return `${pageTitle(config[id], "Pantalla preparada para generar o descargar documentos oficiales.")}${section("Solicitud de certificación", `${filterForm([{ label: "Tipo de certificación", options: [config[id]], columns: 6 }, { label: "Año gravable", options: ["2026", "2025", "2024"], columns: 6 }], "Generar certificación")}${emptyState("Selecciona los criterios para continuar.")}`)}`;
}

function renderNotifications(id) {
	const label = pages.get(id).label;
	return `${pageTitle("Notificaciones", "Consulta las comunicaciones recibidas.")}${section(label, `<div class="btn-group mb-3" role="group" aria-label="Filtrar notificaciones">${linkTo("notificaciones-todas", "Todas", `btn btn-sm ${id === "notificaciones-todas" ? "btn-primary" : "btn-outline-primary"}`)}${linkTo("notificaciones-no-leidas", "No leídas", `btn btn-sm ${id === "notificaciones-no-leidas" ? "btn-primary" : "btn-outline-primary"}`)}${linkTo("notificaciones-archivo", "Archivo", `btn btn-sm ${id === "notificaciones-archivo" ? "btn-primary" : "btn-outline-primary"}`)}</div>${table(["Tipo", "Fecha", "Asunto", "Remitente", "Contenido", "Adjuntos"])}${emptyState("No hay notificaciones para mostrar en esta bandeja.")}`)}`;
}

function renderAgentEnablement() {
	return renderAgentWizard();
}

const registeredTaxPages = { vehicles: 1, properties: 1 };

function registeredTaxTable(key, title, headers, rows) {
	const isVehicle = key === 'vehicles';
	const isProperty = key === 'properties';
	const searchHint = !isVehicle && !isProperty ? 'Buscar en los registros' : isVehicle ? 'Placa, marca o modelo' : 'CHIP, matrícula o dirección';
	return `<section data-registered-tax="${key}" aria-labelledby="registered-${key}-title">
		<div class="mb-4"><h2 class="h5 mb-1" id="registered-${key}-title">${title}</h2><p class="small text-secondary mb-0">${!isVehicle && !isProperty ? 'Consulta los registros asociados a este impuesto.' : isVehicle ? 'Consulta las características de tus vehículos.' : 'Consulta la identificación y ubicación de tus predios registrados.'}</p></div>
		<div class="row g-3 align-items-end mb-3">
			<div class="col-12 col-md-7 col-xl-6"><label class="form-label small fw-semibold" for="registered-${key}-search">${!isVehicle && !isProperty ? 'Buscar registro' : isVehicle ? 'Buscar vehículo' : 'Buscar predio'}</label><div class="input-group"><span class="input-group-text bg-white"><i class="bi bi-search" aria-hidden="true"></i></span><input class="form-control" id="registered-${key}-search" type="search" data-registered-search placeholder="${searchHint}" aria-controls="registered-${key}-table"></div></div>
			<div class="col-12 col-md-auto ms-md-auto"><label class="form-label small" for="registered-${key}-size">Registros por página</label><select class="form-select" id="registered-${key}-size" data-registered-size><option>10</option><option>20</option><option>30</option><option>50</option></select></div>
		</div>
		<p class="small text-secondary d-lg-none mb-2" id="registered-${key}-scroll"><i class="bi bi-arrow-left-right me-1" aria-hidden="true"></i>Desliza la tabla para consultar todas las columnas.</p>
		<div class="table-responsive app-table-container registered-tax-scroll mb-3" tabindex="0" role="region" aria-label="Tabla de ${title.toLocaleLowerCase('es')}"><table class="table app-table table-hover align-middle mb-0 registered-tax-table" id="registered-${key}-table"><caption class="visually-hidden">${title}</caption><thead class="table-light"><tr>${headers.map((header) => `<th scope="col">${header}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr data-registered-row>${row.map((cell, index) => index === 0 ? `<th scope="row" class="fw-semibold text-nowrap">${cell || '—'}</th>` : `<td>${cell || '<span class="text-secondary" aria-label="Sin información">—</span>'}</td>`).join('')}</tr>`).join('')}<tr data-registered-empty class="${rows.length ? 'd-none' : ''}"><td colspan="${headers.length}" class="text-center text-secondary py-4">No hay registros disponibles para mostrar.</td></tr></tbody></table></div>
		<div class="d-flex flex-wrap justify-content-between align-items-center gap-3"><p class="small text-secondary mb-0" data-registered-summary aria-live="polite"></p><nav aria-label="Paginación de ${title.toLocaleLowerCase('es')}"><ul class="pagination pagination-sm mb-0" data-registered-pagination></ul></nav></div>
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
	root.querySelector('[data-registered-summary]').textContent = matches.length ? `Mostrando del ${start + 1} al ${Math.min(start + size, matches.length)} (Total: ${matches.length} resultados)` : 'Mostrando 0 resultados';
	const button = (label, target, disabled = false, active = false) => `<li class="page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}"><button class="page-link" type="button" data-registered-page="${target}" ${disabled ? 'disabled' : ''} ${active ? 'aria-current="page"' : ''}>${label}</button></li>`;
	const visiblePages = [...new Set([1, ...Array.from({ length: 5 }, (_, index) => page - 2 + index).filter((item) => item > 1 && item < pages), pages])];
	root.querySelector('[data-registered-pagination]').innerHTML = button('Anterior', page - 1, page === 1) + visiblePages.map((item, index) => `${index && item - visiblePages[index - 1] > 1 ? '<li class="page-item disabled"><span class="page-link">…</span></li>' : ''}${button(item, item, false, item === page)}`).join('') + button('Siguiente', page + 1, page === pages);
}

function renderRegisteredTaxes() {
	const additionalTaxes = [
		{ id: 'delineacion', label: 'Delineación Urbana' },
		{ id: 'sobretasa', label: 'Gasolina Motor y ACPM' },
		{ id: 'publicidad', label: 'Publicidad Exterior' },
		{ id: 'ica', label: 'ICA' },
		{ id: 'reteica', label: 'RETEICA' },
	];
	return `${pageTitle('Impuestos registrados', 'Consulta los impuestos asociados a tu Registro de Información Tributaria.')}
		<div class="card border-0 shadow-sm registered-taxes">
			<div class="card-header bg-white px-3 px-md-4 pt-3 pb-0"><ul class="nav nav-tabs card-header-tabs gap-2" role="tablist" aria-label="Tipo de impuesto">
				<li class="nav-item" role="presentation"><button class="nav-link active d-flex align-items-center gap-2 px-3 py-3" id="registered-vehicles-tab" data-bs-toggle="tab" data-bs-target="#registered-vehicles-pane" type="button" role="tab" aria-controls="registered-vehicles-pane" aria-selected="true">Vehículos<span class="badge rounded-pill text-bg-light border">${vehicles.length}<span class="visually-hidden"> vehículos registrados</span></span></button></li>
				<li class="nav-item" role="presentation"><button class="nav-link d-flex align-items-center gap-2 px-3 py-3" id="registered-properties-tab" data-bs-toggle="tab" data-bs-target="#registered-properties-pane" type="button" role="tab" aria-controls="registered-properties-pane" aria-selected="false">Predial Unificado<span class="badge rounded-pill text-bg-light border">${predialProperties.length}<span class="visually-hidden"> predios registrados</span></span></button></li>
				${additionalTaxes.map(({ id, label }) => `<li class="nav-item" role="presentation"><button class="nav-link px-3 py-3" id="registered-${id}-tab" data-bs-toggle="tab" data-bs-target="#registered-${id}-pane" type="button" role="tab" aria-controls="registered-${id}-pane" aria-selected="false">${label}</button></li>`).join('')}
			</ul></div>
			<div class="card-body p-3 p-md-4 tab-content">
				<div class="tab-pane show active" id="registered-vehicles-pane" role="tabpanel" aria-labelledby="registered-vehicles-tab" tabindex="0">${registeredTaxTable('vehicles', 'Impuestos de vehículos', vehicleHeaders, vehicleRows())}</div>
				<div class="tab-pane" id="registered-properties-pane" role="tabpanel" aria-labelledby="registered-properties-tab" tabindex="0">${registeredTaxTable('properties', 'Impuesto predial', ['CHIP', 'Matrícula inmobiliaria', 'Dirección del predio', 'Contrato de arrendamiento', 'Año gravable', 'Número de objeto'], predialProperties)}</div>
				${additionalTaxes.map(({ id, label }) => `<div class="tab-pane" id="registered-${id}-pane" role="tabpanel" aria-labelledby="registered-${id}-tab" tabindex="0">${registeredTaxTable(id, label, ['Registro', 'Año gravable', 'Periodo', 'Estado'], [])}</div>`).join('')}
			</div>
		</div>`;
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
	{ id: '1', name: 'Agente Demo Uno', document: '1.000.000.011', quality: 'Representante Legal Suplente', start: '2019-06-27', end: '9999-12-31', taxes: ['Predial', 'Vehicular'], active: true },
	{ id: '2', name: 'Agente Demo Dos', document: '1.000.000.012', quality: 'Revisor Fiscal Principal', start: '2021-01-14', end: '9999-12-31', taxes: [], active: true },
	{ id: '3', name: 'Agente Demo Tres', document: '1.000.000.013', quality: 'Revisor Fiscal Principal', start: '2019-06-27', end: '9999-12-31', taxes: [], active: true },
	{ id: '4', name: 'Agente Demo Cuatro', document: '1.000.000.014', quality: 'Representante Legal Principal', start: '2018-02-22', end: '9999-12-31', taxes: ['Predial', 'Vehicular'], active: true },
	{ id: '5', name: 'Agente Demo Cinco', document: '1.000.000.015', quality: 'Revisor Fiscal Suplente', start: '2019-06-27', end: '2021-12-29', taxes: [], active: false },
	{ id: '6', name: 'Agente Demo Cinco', document: '1.000.000.015', quality: 'Revisor Fiscal Principal', start: '2019-09-19', end: '2021-12-29', taxes: [], active: false },
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
 const pageButton = (label, target, disabled = false, active = false) => `<li class="page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}"><button class="page-link" type="button" data-agent-page="${target}" data-agent-page-group="${key}" ${disabled ? 'disabled' : ''} ${active ? 'aria-current="page"' : ''}>${label}</button></li>`;
 const pagination = pageButton('Anterior', page - 1, page === 1) + Array.from({ length: pages }, (_, i) => pageButton(i + 1, i + 1, false, page === i + 1)).join('') + pageButton('Siguiente', page + 1, page === pages);
 const date = (value) => value.split('-').reverse().join('/');
	const headers = [['name', 'Nombre'], ['document', 'Tipo / N.º de documento'], ['quality', 'Calidades'], ['start', 'Vigencia'], ['taxes', 'Impuesto']];
	return `<div class="table-responsive app-table-container"><table class="table app-table table-hover align-middle mb-0"><caption class="visually-hidden">Agentes autorizados ${historical ? 'inactivos' : 'activos'}</caption><thead class="table-light"><tr>${headers.map(([key, label]) => `<th scope="col" ${authorizedAgentSort.key === key ? `aria-sort="${authorizedAgentSort.direction === 1 ? 'ascending' : 'descending'}"` : ''}><button class="btn btn-link p-0 text-start text-body fw-semibold text-decoration-none d-flex align-items-center gap-2" type="button" data-agent-sort="${key}">${label}<i class="bi bi-${authorizedAgentSort.key === key && authorizedAgentSort.direction === -1 ? 'caret-down-fill' : 'caret-up-fill'} small ${authorizedAgentSort.key === key ? 'text-primary' : 'text-secondary opacity-50'}" aria-hidden="true"></i></button></th>`).join('')}<th scope="col">Estado</th>${historical ? '' : '<th scope="col" class="text-center">Acciones</th>'}</tr></thead><tbody>${pageRows.map((agent) => `<tr><th scope="row" class="fw-semibold">${agent.name}</th><td><span class="d-block">${agent.documentType || 'CC'}</span><span class="text-nowrap">${agent.document}</span></td><td>${agent.quality}</td><td><span class="text-nowrap">${date(agent.start)}</span><span class="d-block text-nowrap">– ${date(agent.end)}</span></td><td>${agent.taxes.join(', ') || '—'}</td><td><span class="badge rounded-pill ${agent.active ? 'bg-success-subtle text-success-emphasis border border-success-subtle' : 'bg-danger-subtle text-danger-emphasis border border-danger-subtle'} text-wrap px-3 py-2">${agent.active ? 'Vigente' : 'Finalizado'}</span></td>${historical ? '' : `<td class="text-center"><button class="btn btn-outline-primary btn-sm" type="button" data-agent-edit="${agent.id}" aria-label="Editar agente ${agent.name}"><i class="bi bi-pencil me-1" aria-hidden="true"></i>Editar</button></td>`}</tr>`).join('') || `<tr><td colspan="${historical ? 6 : 7}" class="text-center text-secondary py-4">No se encontraron agentes para esta consulta.</td></tr>`}</tbody></table></div>
		<div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-3"><p class="small text-secondary mb-0" role="status">${total ? `Mostrando del ${start + 1} al ${Math.min(start + authorizedAgentPageSize, total)} (Total: ${total} resultados)` : 'Mostrando 0 resultados'}</p><nav aria-label="Paginación de agentes autorizados"><ul class="pagination pagination-sm mb-0">${pagination}</ul></nav></div>`;
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
			<div class="row g-3 align-items-end mb-3">
 <div class="col-12 col-md-7 col-xl-6"><label class="form-label small fw-semibold" for="authorizedAgentSearch">Buscar agente</label><div class="input-group"><span class="input-group-text bg-white"><i class="bi bi-search" aria-hidden="true"></i></span><input class="form-control" id="authorizedAgentSearch" type="search" placeholder="Nombre, documento o calidad" aria-controls="authorizedAgentsResults"></div></div>
 <div class="col-12 col-md-auto ms-md-auto"><label class="form-label small" for="authorizedAgentPageSize">Registros por página</label><select class="form-select" id="authorizedAgentPageSize">${[10, 20, 30, 50].map((size) => `<option ${size === authorizedAgentPageSize ? 'selected' : ''}>${size}</option>`).join('')}</select></div>
 </div>
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
	if (id === "rit-datos") return existingRitPage;
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
	if (isPageContentHidden(id)) return pageTitle(getRouteDetails(id).label);
	if (id === "inicio") return renderDashboard();
	if (id === "guia-visual") return renderStyleGuide();
	if (id.startsWith("rit-")) return renderRitPage(id);
	if (id === "impuestos-todos") return renderTaxList("Mis impuestos", "Consulta los impuestos asociados al ciudadano.");
	if (id === "impuestos-vehiculos") return renderTaxList("Vehículos", "Vehículos asociados al ciudadano.");
	if (id === "impuestos-predial") return renderPredialTax();
	if (id === "impuestos-ica") return `${pageTitle("ICA", "Información del impuesto de Industria y Comercio asociado al ciudadano.")}${section("Impuesto de Industria y Comercio", emptyState("No hay registros de ICA disponibles para mostrar."))}`;
	if (id === "impuestos-otros") return `${pageTitle("Otros impuestos", "Consulta otros impuestos asociados al ciudadano.")}${section("Impuestos", emptyState())}`;
	if (id.startsWith("vehiculo-")) return renderVehicleDetail(id.replace("vehiculo-", ""));
	if (id === "obligaciones-pendientes") return renderObligations();
	if (id === "obligaciones-cuenta") return renderAccountStatement();
	if (id === "obligaciones-facilidades") return renderPaymentPlans();
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
	if (hash.startsWith("vehiculo-")) return hash;
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
	return pages.get(routeId) ?? (routeId.startsWith("vehiculo-")
		? { id: routeId, label: `Vehículo ${routeId.replace("vehiculo-", "")}`, group: routeGroups.find((group) => group.id === "impuestos") }
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
		if (summary) summary.textContent = "Mostrando del 0 al 0 (Total: 0 resultados)";
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
	return hiddenRouteGroups.has(getRouteDetails(id).group?.id);
}

function renderRoute() {
	const routeId = activeCompany && getCurrentRoute() !== "declaraciones-generar" ? "inicio" : getCurrentRoute();
	if (window.location.hash !== `#${routeId}`) {
		const normalizedUrl = new URL(window.location.href);
		normalizedUrl.hash = routeId;
		window.history.replaceState(null, "", normalizedUrl);
	}
	const route = getRouteDetails(routeId);
	const requestedDemoState = new URLSearchParams(window.location.search).get("demo");
	const activeDemoState = demoStates.some((state) => state.id === requestedDemoState) ? requestedDemoState : null;
	renderNavigation(routeId);
	renderBreadcrumb(route);
	contentRoot.innerHTML = renderPage(routeId);
	if (routeId === "rit-impuestos") {
		filterRegisteredTaxes('vehicles', true);
		filterRegisteredTaxes('properties', true);
	}
	restoreRitFormValues(contentRoot);
	restoreTaxpayerIdentityFields();
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

window.addEventListener("hashchange", () => {
	renderRoute();
});
window.addEventListener("popstate", () => {
	renderRoute();
});

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
	if (role === "Contribuyente") {
		activeCompany = null;
		sessionStorage.removeItem("demo-active-company");
	}
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
	profileButton.setAttribute("aria-label", `Cuenta de ${getTaxpayerIdentity().fullName}, ${role}`);

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
	setActiveProfile(activeCompany ? "Agente autorizado" : "Contribuyente");

	profileRoleButtons.forEach((button) => {
		button.addEventListener("click", () => {
			bootstrap.Dropdown.getOrCreateInstance(profileButton).hide();
			if (button.dataset.profileRole === "Agente autorizado") openCompanySelector();
			else {
				setActiveProfile(button.dataset.profileRole, true);
				renderRoute();
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
	modal.innerHTML = `<div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"><div class="modal-content">
		<div class="modal-header bg-light"><h2 class="modal-title fs-5" id="ritVehicleListTitle">Impuestos de Vehículos</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>
		<div class="modal-body p-4">
			<div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
				<label class="d-flex align-items-center gap-2 small">MOSTRANDO <select class="form-select form-select-sm w-auto" aria-label="Datos por página"><option>10</option><option>25</option><option>50</option></select> DATOS POR PÁGINA</label>
				<label class="d-flex align-items-center gap-2 small">BUSCAR: <input type="search" class="form-control form-control-sm" data-vehicle-search></label>
			</div>
			<div class="table-responsive"><table class="table table-borderless align-middle"><thead class="table-light text-center"><tr><th scope="col">Placa</th><th scope="col">Marca</th><th scope="col">Imprimir</th></tr></thead><tbody><tr data-vehicle-row><td>DEM033</td><td></td><td class="text-center"><button type="button" class="btn btn-link py-0" data-vehicle-download aria-label="Descargar certificado del vehículo DEM033"><i class="bi bi-download" aria-hidden="true"></i></button></td></tr><tr data-vehicle-empty hidden><td colspan="3" class="text-center text-secondary">No se encontraron resultados.</td></tr></tbody></table></div>
			<div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3"><p class="mb-0 small" data-vehicle-summary>Mostrando del 1 al 1 (Total: 1 resultados)</p><nav aria-label="Paginación de vehículos"><ul class="pagination pagination-sm mb-0"><li class="page-item disabled"><button class="page-link" disabled>Anterior</button></li><li class="page-item active" aria-current="page"><span class="page-link">1</span></li><li class="page-item disabled"><button class="page-link" disabled>Siguiente</button></li></ul></nav></div>
			<button type="button" class="btn btn-light w-100 mt-3" data-vehicle-download>Generar</button>
		</div></div></div>`;
	document.body.appendChild(modal);
	const instance = new bootstrap.Modal(modal);
	modal.addEventListener("input", (event) => {
		if (!event.target.matches("[data-vehicle-search]")) return;
		const matches = "dem033".includes(event.target.value.trim().toLowerCase());
		modal.querySelector("[data-vehicle-row]").hidden = !matches;
		modal.querySelector("[data-vehicle-empty]").hidden = matches;
		modal.querySelector("[data-vehicle-summary]").textContent = matches ? "Mostrando del 1 al 1 (Total: 1 resultados)" : "Mostrando del 0 al 0 (Total: 0 resultados)";
		modal.querySelector(".btn-light").disabled = !matches;
	});
	modal.addEventListener("click", (event) => {
		if (!event.target.closest("[data-vehicle-download]")) return;
		downloadRitCertificate("DEM033");
		instance.hide();
	});
	modal.addEventListener("hidden.bs.modal", () => { instance.dispose(); modal.remove(); }, { once: true });
	instance.show();
}

function downloadRitCertificate(vehiclePlate) {
	const certificateType = document.getElementById("ritCertificateType").value;
	const selectedTax = document.getElementById("ritCertificateTax").value;
	const taxLabels = {
		vehiculos: "Impuestos de Vehiculos",
		ica: "Impuestos de ICA",
	};
	const pdfText = [
		"CERTIFICACION MI RIT",
		"DOCUMENTO DE PRUEBA - NO ES UN CERTIFICADO OFICIAL",
		`Tipo de certificacion: ${certificateType}`,
		"Contribuyente: PERSONA PRUEBA",
		"Tipo de documento: CC",
		"Numero de documento: 1000000001",
		"Impuesto incluido:",
		`- ${taxLabels[selectedTax]}`,
		...(vehiclePlate ? [`Placa: ${vehiclePlate}`] : []),
		`Fecha de generacion: ${new Date().toLocaleDateString("es-CO")}`,
	];
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

	const pdfUrl = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
	const downloadLink = document.createElement("a");
	downloadLink.href = pdfUrl;
	downloadLink.download = "certificacion-mi-rit-ejemplo.pdf";
	downloadLink.click();
	window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
	document.getElementById("ritCertificateDownloadStatus").classList.remove("d-none");
}

document.addEventListener("submit", (event) => {
	if (event.target.matches("#ritCertificateForm")) {
		event.preventDefault();
		const form = event.target;
		form.classList.add("was-validated");
		if (!form.checkValidity()) return;
		if (form.closest("#ritCertificateModal")) downloadRitCertificate();
		else showRitCertificateList();
		return;
	}

	if (event.target.matches("[data-placeholder-form]")) {
		event.preventDefault();
	}
	if (event.target.matches("[data-agent-search-form]")) {
		event.preventDefault();
		searchAgentForWizard(event.target);
	}

});

document.addEventListener("change", (event) => {
	if (event.target.id === "ritCertificateType" || event.target.id === "ritCertificateTax") {
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
