// Flujo de alta de agentes: componentes Bootstrap y estado conservado entre pasos.
let agentWizardDraft = { step: 1, reached: 1, quality: '', start: '', end: '', authorizations: [] };
let agentWizardNotice = '';
let editingAgentId = null;
function startAgentEdit(agent) {
 editingAgentId = agent.id;
 const normalize = (value) => value.replace(/\D/g, '');
 selectedAgentLookup = agentDirectory.find((person) => normalize(person.documentNumber) === normalize(agent.document)) || { firstName: agent.name, lastName: '', documentType: agent.documentType || 'CC', documentNumber: agent.document };
 selectedAgentDocuments = (agent.documents || []).map((file) => ({ ...file }));
 agentWizardDraft = { step: 2, reached: 2, quality: agent.quality, start: agent.start, end: agent.end, authorizations: (agent.authorizations || []).map((auth) => ({ ...auth })) };
 window.location.hash = 'rit-agentes-habilitar';
}

const agentQualityDocuments = {
	'Tutor': ['Sentencia judicial', 'Testamento', 'Tarjeta de identidad del menor'],
	'Administrador adjunto': ['Testamento', 'Sentencia judicial', 'Documento de nombramiento'],
	'Representante Legal Principal': ['Documento de nombramiento'],
	'Representante Legal Suplente': ['Documento de nombramiento'],
	'Revisor Fiscal Principal': ['Documento de nombramiento'],
	'Revisor Fiscal Suplente': ['Documento de nombramiento'],
};
const agentTaxNames = { predial: 'Predial', vehiculos: 'Vehicular', ica: 'ICA' };
const agentBimesters = ['Enero – Febrero', 'Marzo – Abril', 'Mayo – Junio', 'Julio – Agosto', 'Septiembre – Octubre', 'Noviembre – Diciembre'];
const agentEscape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const agentFullName = (agent) => [agent.firstName, agent.middleName, agent.lastName, agent.secondLastName].filter(Boolean).join(' ');

function renderAgentLookupModal() {
	return `<div class="modal fade" id="agentLookupModal" tabindex="-1" aria-labelledby="agentLookupTitle" aria-describedby="agentLookupDescription" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content">
		<div class="modal-header"><h2 class="modal-title fs-5" id="agentLookupTitle">Buscar agente autorizado</h2><button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>
		<div class="modal-body p-4"><p class="text-secondary small" id="agentLookupDescription">Busca a la persona por su documento y confirma sus datos antes de agregarla.</p>
		<form data-agent-search-form novalidate><div class="mb-3"><label class="form-label" for="agentDocumentType">Tipo de documento <span class="text-danger">*</span></label><select class="form-select" id="agentDocumentType" name="documentType" required><option value="" selected disabled>Selecciona el tipo de documento</option>${['CC', 'CE', 'PA', 'TI', 'PPT', 'NIT', 'CD', 'NUIP', 'TIE', 'NITE'].map((type) => `<option value="${type}">${{ CC: 'CC – Cédula de ciudadanía', CE: 'CE – Cédula de extranjería', PA: 'PA – Pasaporte', TI: 'TI – Tarjeta de identidad', PPT: 'PPT – Permiso por protección temporal', NIT: 'NIT – Identificación tributaria' }[type] || type}</option>`).join('')}</select><div class="invalid-feedback">Selecciona el tipo de documento.</div></div>
		<div class="mb-4"><label class="form-label" for="agentDocumentNumber">Número de documento <span class="text-danger">*</span></label><input class="form-control" id="agentDocumentNumber" name="documentNumber" placeholder="Ej.: 1000000002" autocomplete="off" required><div class="invalid-feedback">Ingresa el número de documento.</div></div>
		<div class="mb-4 d-none" id="agentDocumentIssueGroup"><label class="form-label" for="agentDocumentIssueDate">Fecha de expedición del documento <span class="text-danger">*</span></label><input class="form-control" type="date" id="agentDocumentIssueDate" name="issueDate" aria-describedby="agentDocumentIssueHelp" disabled><div class="form-text" id="agentDocumentIssueHelp">Selecciona la fecha que aparece en tu documento.</div><div class="invalid-feedback">Ingresa la fecha de expedición del documento.</div></div>
		<div class="d-flex justify-content-end gap-2"><button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal">Cancelar</button><button class="btn btn-primary" type="submit">Buscar agente</button></div></form><div id="agentLookupConfirmation" class="d-none"></div></div>
	</div></div></div>`;
}

function updateAgentIssueDate() {
	const isCedula = document.getElementById('agentDocumentType').value === 'CC';
	const input = document.getElementById('agentDocumentIssueDate');
	document.getElementById('agentDocumentIssueGroup').classList.toggle('d-none', !isCedula);
	input.disabled = !isCedula;
	input.required = isCedula;
	const today = new Date();
	input.max = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
	if (!isCedula) input.value = '';
}

function searchAgentForWizard(form) {
	form.classList.add('was-validated');
	if (!form.reportValidity()) return;
	const normalize = (value) => value.replace(/[.\s-]/g, '').toLocaleUpperCase('es');
	const match = agentDirectory.find((agent) => agent.documentType === form.elements.documentType.value && normalize(agent.documentNumber) === normalize(form.elements.documentNumber.value));
	if (!match) {
		const input = form.elements.documentNumber;
		input.setCustomValidity('No encontramos una persona con ese documento. Revisa los datos e intenta de nuevo.');
		input.nextElementSibling.textContent = input.validationMessage;
		form.reportValidity();
		return;
	}
	selectedAgentLookup = { ...match, ...(form.elements.documentType.value === 'CC' && form.elements.issueDate?.value ? { issueDate: form.elements.issueDate.value } : {}) };
	const target = document.getElementById('agentLookupConfirmation');
	const initials = `${match.firstName.charAt(0)}${match.lastName.charAt(0)}`;
	target.innerHTML = `<p class="small text-success"><i class="bi bi-check-circle me-1" aria-hidden="true"></i>Persona encontrada</p><div class="card border-primary-subtle bg-primary-subtle mb-4"><div class="card-body d-flex align-items-center gap-3"><span class="rounded-circle bg-primary text-white p-3 fw-semibold" aria-hidden="true">${agentEscape(initials)}</span><div><h3 class="h6 mb-1">${agentEscape(agentFullName(match))}</h3><p class="small mb-0">${agentEscape(match.documentType)} ${agentEscape(match.documentNumber)}</p></div></div></div><p class="small text-secondary">Confirma que esta es la persona que quieres autorizar.</p><div class="d-flex flex-wrap justify-content-end gap-2"><button class="btn btn-outline-secondary" type="button" data-agent-search-again>Buscar otra persona</button><button class="btn btn-primary" type="button" data-agent-confirm-person>Continuar</button></div>`;
	form.classList.add('d-none');
	target.classList.remove('d-none');
	target.querySelector('[data-agent-confirm-person]').focus();
}

function renderAgentWizard() {
	if (!selectedAgentLookup) return `${pageTitle('Agregar agente autorizado', 'Busca y confirma a la persona antes de definir sus autorizaciones.')}<a class="btn btn-primary" href="#rit-agentes">Volver a agentes autorizados</a>`;
	const person = selectedAgentLookup;
	const field = (id, label, value, width = 6) => `<div class="col-12 col-md-${width}"><label class="form-label small" for="${id}">${label}</label><input class="form-control" id="${id}" value="${agentEscape(value || 'Sin información')}" disabled></div>`;
	const steps = ['Datos del agente', 'Calidad y documentos', 'Autorizaciones'];
	const controls = (step, next) => `<div class="d-flex flex-wrap justify-content-between gap-2 border-top pt-4 mt-4">${step === 1 ? '<a class="btn btn-outline-secondary" href="#rit-agentes">Cancelar</a>' : `<button class="btn btn-outline-secondary" type="button" data-wizard-step="${step - 1}">Anterior</button>`}<button class="btn btn-primary" type="button" data-wizard-next="${step}">${next}</button></div>`;
	return `${pageTitle(editingAgentId ? 'Editar agente autorizado' : 'Agregar agente autorizado', 'Revisa sus datos y define el alcance de la autorización.')}
		<div class="card border-0 shadow-sm"><div class="card-body p-3 p-md-4">
			<div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><p class="small text-secondary mb-0" id="agentWizardProgressText" role="status">Paso ${agentWizardDraft.step} de 3</p><span class="small fw-semibold">${agentEscape(agentFullName(person))}</span></div>
			<div class="progress mb-4" role="progressbar" aria-label="Avance del registro" aria-valuemin="0" aria-valuemax="3" aria-valuenow="${agentWizardDraft.step}" id="agentWizardProgress" style="height: 4px"><div class="progress-bar" style="width: ${agentWizardDraft.step / 3 * 100}%"></div></div>
			<ul class="nav nav-pills nav-fill flex-column flex-sm-row gap-2 mb-4" id="agentWizardSteps" role="tablist">${steps.map((label, index) => `<li class="nav-item" role="presentation"><button class="nav-link ${index + 1 === agentWizardDraft.step ? 'active' : ''} w-100" id="agent-step-${index + 1}" data-bs-toggle="tab" data-bs-target="#agent-pane-${index + 1}" data-wizard-tab="${index + 1}" type="button" role="tab" aria-controls="agent-pane-${index + 1}" aria-selected="${index + 1 === agentWizardDraft.step}" ${index + 1 > agentWizardDraft.reached ? 'disabled' : ''}>${index + 1}. ${label}</button></li>`).join('')}</ul>
			<div class="tab-content">
				<div class="tab-pane ${agentWizardDraft.step === 1 ? 'show active' : ''}" id="agent-pane-1" role="tabpanel" aria-labelledby="agent-step-1" tabindex="0"><h2 class="h5">Revisa los datos del agente</h2><p class="small text-secondary mb-4">Estos datos corresponden al documento consultado.</p><div class="row g-3 mb-4">${field('agentReadType', 'Tipo de documento', person.documentType, 3)}${field('agentReadDocument', 'Número de documento', person.documentNumber, 3)}${field('agentReadIssue', 'Fecha de expedición', person.issueDate?.split('-').reverse().join('/'), 3)}${field('agentReadPerson', 'Tipo de contribuyente', person.taxpayerType, 3)}</div><h3 class="h6">Información personal</h3><div class="row g-3 mb-4">${field('agentReadFirst', 'Primer nombre', person.firstName)}${field('agentReadMiddle', 'Segundo nombre', person.middleName)}${field('agentReadSurname', 'Primer apellido', person.lastName)}${field('agentReadSecond', 'Segundo apellido', person.secondLastName)}</div><h3 class="h6">Contacto y notificación</h3><div class="row g-3 mb-4">${field('agentReadAddress', 'Dirección de notificación', person.address, 12)}${field('agentReadPhone', 'Teléfono fijo', person.landline)}${field('agentReadMobile', 'Celular', person.mobile)}${field('agentReadEmail', 'Correo electrónico', person.email, 12)}${field('agentReadSocial', 'Red social', person.socialNetwork)}${field('agentReadSocialUser', 'Usuario de red social', person.socialUser)}</div>${controls(1, 'Continuar a calidad y documentos')}</div>
				<div class="tab-pane ${agentWizardDraft.step === 2 ? 'show active' : ''}" id="agent-pane-2" role="tabpanel" aria-labelledby="agent-step-2" tabindex="0"><h2 class="h5">Define la calidad y vigencia</h2><p class="small text-secondary mb-4">Indica en qué calidad actuará el agente y adjunta los documentos de soporte.</p>
				<form id="agentQualityForm" novalidate><div class="row g-4"><div class="col-12 col-lg-6"><label class="form-label" for="agentQuality">Calidad del agente <span class="text-danger">*</span></label><select class="form-select" id="agentQuality" required><option value="">Selecciona una calidad</option>${Object.keys(agentQualityDocuments).map((quality) => `<option ${quality === agentWizardDraft.quality ? 'selected' : ''}>${quality}</option>`).join('')}</select><div class="invalid-feedback">Selecciona la calidad del agente.</div><div class="row g-3 mt-1"><div class="col-sm-6"><label class="form-label" for="agentValidityStart">Vigencia desde <span class="text-danger">*</span></label><input class="form-control" type="date" id="agentValidityStart" value="${agentEscape(agentWizardDraft.start)}" required><div class="invalid-feedback">Ingresa la fecha inicial.</div></div><div class="col-sm-6"><label class="form-label" for="agentValidityEnd">Vigencia hasta</label><input class="form-control" type="date" id="agentValidityEnd" value="${agentEscape(agentWizardDraft.end)}" ${agentWizardDraft.start ? `min="${agentEscape(agentWizardDraft.start)}"` : ''}><div class="invalid-feedback">La fecha final debe ser igual o posterior a la inicial.</div><div class="form-text">Opcional, si no tiene fecha de finalización.</div></div></div></div><div class="col-12 col-lg-6"><div class="card bg-body-tertiary border-0 h-100"><div class="card-body"><h3 class="h6">Documentos de soporte</h3><div id="agentRequiredDocuments" aria-live="polite"></div></div></div></div></div>
				<div class="border rounded p-3 p-md-4 mt-4" id="agentDocumentDropZone" role="group" aria-label="Adjuntar documentos PDF"><h3 class="h6">Adjunta los documentos</h3><p class="small text-secondary" id="agentDocumentHelp">Arrastra los archivos aquí o selecciónalos. PDF, máximo 20 MB por archivo.</p><input class="form-control" type="file" id="agentDocumentFile" accept=".pdf,application/pdf" multiple aria-describedby="agentDocumentHelp agentDocumentError"><div class="alert alert-danger d-none mt-3 mb-0" id="agentDocumentError" role="alert"></div><ul class="list-group mt-3 d-none" id="agentSelectedFiles" aria-label="Documentos adjuntos"></ul><p class="small text-secondary mt-2 mb-0" id="agentFilesSummary" role="status"></p></div></form>${controls(2, 'Continuar a autorizaciones')}</div>
				<div class="tab-pane ${agentWizardDraft.step === 3 ? 'show active' : ''}" id="agent-pane-3" role="tabpanel" aria-labelledby="agent-step-3" tabindex="0"><h2 class="h5">Agrega las autorizaciones</h2><p class="small text-secondary">Selecciona el impuesto, año gravable y periodo. Puedes agregar más de una autorización.</p>
				<form id="agentAuthorizationForm" class="row g-3" novalidate><div class="col-12 col-md-4"><label class="form-label" for="agentAuthTax">Impuesto <span class="text-danger">*</span></label><select class="form-select" id="agentAuthTax" required><option value="">Selecciona un impuesto</option>${Object.entries(agentTaxNames).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select><div class="invalid-feedback">Selecciona el impuesto.</div></div><div class="col-12 col-md-4"><label class="form-label" for="agentAuthYear">Año gravable <span class="text-danger">*</span></label><select class="form-select" id="agentAuthYear" required disabled><option value="">Selecciona el año</option>${Array.from({ length: 11 }, (_, i) => `<option>${2026 - i}</option>`).join('')}</select><div class="invalid-feedback">Selecciona el año gravable.</div></div><div class="col-12 col-md-4"><label class="form-label" for="agentAuthPeriod">Periodo <span class="text-danger">*</span></label><select class="form-select" id="agentAuthPeriod" required disabled><option value="">Selecciona el periodo</option></select><div class="invalid-feedback">Selecciona el periodo.</div></div>
                <div class="col-12 d-none" id="agentAuthObjectField"><div class="bg-body-tertiary border rounded p-3 p-md-4"><h3 class="h6 mb-3" id="agentAuthObjectHeading">Identifica el predio</h3><div class="row g-3 align-items-start">
 <fieldset class="col-12 col-md-5 d-none" id="agentAuthProperty"><legend class="form-label fs-6 mb-2">Tipo de identificación</legend><div class="d-flex flex-wrap gap-3 pt-2"><div class="form-check"><input class="form-check-input" type="radio" name="agentPropertyType" id="agentPropertyChip" value="CHIP" checked><label class="form-check-label" for="agentPropertyChip">CHIP</label></div><div class="form-check"><input class="form-check-input" type="radio" name="agentPropertyType" id="agentPropertyRegistration" value="Matrícula"><label class="form-check-label" for="agentPropertyRegistration">Matrícula inmobiliaria</label></div></div></fieldset>
 <div class="col-12 col-md-7" id="agentAuthObjectInputColumn"><label class="form-label" for="agentAuthObject" id="agentAuthObjectLabel">CHIP <span class="text-danger">*</span></label><input class="form-control text-uppercase" id="agentAuthObject" autocomplete="off" aria-describedby="agentAuthObjectHelp"><div class="invalid-feedback">Ingresa la identificación del predio o la placa.</div><div class="form-text" id="agentAuthObjectHelp"></div></div>
 </div></div></div>
				<div class="col-12 text-end"><button class="btn btn-outline-primary" type="submit"><i class="bi bi-plus-lg me-1" aria-hidden="true"></i>Agregar autorización</button></div></form><p class="small text-danger mt-3 d-none" id="agentAuthorizationError" role="alert"></p>
				<div class="mt-4" id="agentAuthorizationResults"></div><div class="card bg-body-tertiary border-0 mt-4"><div class="card-body"><h3 class="h6">Resumen de la autorización</h3><p class="small mb-0" id="agentWizardSummary"></p></div></div>
				<div class="d-flex flex-wrap justify-content-between gap-2 border-top pt-4 mt-4"><button class="btn btn-outline-secondary" type="button" data-wizard-step="2">Anterior</button><button class="btn btn-primary" type="button" id="agentWizardFinish" disabled>${editingAgentId ? 'Guardar cambios' : 'Finalizar y agregar agente'}</button></div></div>
			</div>
		</div></div>`;
}

function initializeAgentWizard() {
	if (!selectedAgentLookup || !document.getElementById('agentQualityForm')) return;
	updateAgentQualityDocuments();
	renderAgentDocumentList();
	renderAgentAuthorizationList();
}

function updateAgentQualityDocuments() {
	const target = document.getElementById('agentRequiredDocuments');
	if (!target) return;
	const documents = agentQualityDocuments[document.getElementById('agentQuality').value];
	target.innerHTML = documents ? `<ul class="list-group list-group-flush">${documents.map((name) => `<li class="list-group-item bg-transparent px-0 small">${name}</li>`).join('')}</ul>` : '<p class="small text-secondary mb-0">Selecciona una calidad para consultar los documentos de soporte.</p>';
}

function captureAgentQuality() {
	agentWizardDraft.quality = document.getElementById('agentQuality').value;
	agentWizardDraft.start = document.getElementById('agentValidityStart').value;
	agentWizardDraft.end = document.getElementById('agentValidityEnd').value;
}

function validateAgentQuality() {
	const form = document.getElementById('agentQualityForm');
	const end = document.getElementById('agentValidityEnd');
	end.min = document.getElementById('agentValidityStart').value;
	form.classList.add('was-validated');
	if (!form.reportValidity()) return false;
	if (!selectedAgentDocuments.length && !editingAgentId) {
		const error = document.getElementById('agentDocumentError');
		error.textContent = 'Adjunta al menos un documento de soporte en PDF para continuar.';
		error.classList.remove('d-none');
		document.getElementById('agentDocumentFile').focus();
		return false;
	}
	captureAgentQuality();
	return true;
}

function navigateAgentWizard(step) {
	if (step < 1 || step > 3) return;
	if (step === 3 && !validateAgentQuality()) return;
	if (step > agentWizardDraft.reached) agentWizardDraft.reached = step;
	document.getElementById(`agent-step-${step}`).disabled = false;
	bootstrap.Tab.getOrCreateInstance(document.getElementById(`agent-step-${step}`)).show();
}

function renderAgentAuthorizationList() {
	const target = document.getElementById('agentAuthorizationResults');
	if (!target) return;
	const authorizations = agentWizardDraft.authorizations;
	target.innerHTML = authorizations.length ? `<div class="table-responsive app-table-container"><table class="table app-table table-hover align-middle mb-0"><caption class="visually-hidden">Autorizaciones que se agregarán al agente</caption><thead class="table-light"><tr><th scope="col">Impuesto</th><th scope="col">Año gravable</th><th scope="col">Periodo</th><th scope="col">Objeto</th><th scope="col" class="text-end">Acciones</th></tr></thead><tbody>${authorizations.map((auth, index) => `<tr><th scope="row">${agentTaxNames[auth.tax]}</th><td>${auth.year}</td><td>${agentEscape(auth.period)}</td><td>${agentEscape(auth.object)}</td><td class="text-end"><button class="btn btn-outline-secondary btn-sm" type="button" data-agent-auth-remove="${index}" aria-label="Eliminar autorización de ${agentTaxNames[auth.tax]} ${auth.year}">Eliminar</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="border rounded bg-body-tertiary text-center p-4"><h3 class="h6">Aún no has agregado autorizaciones</h3><p class="small text-secondary mb-0">Completa los datos y selecciona «Agregar autorización» para continuar.</p></div>';
	document.getElementById('agentWizardFinish').disabled = !authorizations.length && !editingAgentId;
	document.getElementById('agentWizardSummary').textContent = `${agentWizardDraft.quality || 'Sin calidad seleccionada'} · Desde ${agentWizardDraft.start || '—'}${agentWizardDraft.end ? ` hasta ${agentWizardDraft.end}` : ' · Sin fecha de finalización'} · ${selectedAgentDocuments.length} documentos · ${authorizations.length} autorizaciones`;
}

function updateAgentAuthorizationFields() {
	const tax = document.getElementById('agentAuthTax').value;
	const year = document.getElementById('agentAuthYear');
	const period = document.getElementById('agentAuthPeriod');
	year.disabled = !tax;
	period.disabled = !tax || !year.value;
	const options = tax === 'ica' ? agentBimesters : ['Anual'];
	const previous = period.value;
	period.innerHTML = '<option value="">Selecciona el periodo</option>' + options.map((label) => `<option>${label}</option>`).join('');
	if (options.includes(previous)) period.value = previous;
	if (tax && tax !== 'ica') period.value = 'Anual';
	document.getElementById('agentAuthProperty').classList.toggle('d-none', tax !== 'predial');
	document.getElementById('agentAuthObjectField').classList.toggle('d-none', !tax || tax === 'ica');
	document.getElementById('agentAuthObjectHeading').textContent = tax === 'vehiculos' ? 'Identifica el vehículo' : 'Identifica el predio';
 document.getElementById('agentAuthObjectInputColumn').classList.toggle('col-md-7', tax === 'predial');
 document.getElementById('agentAuthObjectInputColumn').classList.toggle('col-md-6', tax === 'vehiculos');
 const object = document.getElementById('agentAuthObject');
	object.required = tax === 'predial' || tax === 'vehiculos';
	object.disabled = !object.required;
	const label = tax === 'vehiculos' ? 'Placa' : document.querySelector('[name="agentPropertyType"]:checked').value;
	document.getElementById('agentAuthObjectLabel').innerHTML = `${tax === 'vehiculos' ? 'Placa del veh\u00edculo' : label === 'CHIP' ? 'CHIP del predio' : 'Matr\u00edcula inmobiliaria'} <span class="text-danger">*</span>`;
	object.placeholder = tax === 'vehiculos' ? 'Ej.: ABC123' : label === 'CHIP' ? 'Ej.: DEMO0000001' : 'Ej.: 000C00000001';
 document.getElementById('agentAuthObjectHelp').textContent = tax === 'vehiculos' ? 'Escribe la placa sin espacios ni guiones.' : label === 'CHIP' ? 'Encuentra el CHIP en tu factura de impuesto predial.' : 'Encuentra este número en el certificado de tradición y libertad.';
 object.setCustomValidity('');
}

document.addEventListener('shown.bs.modal', (event) => {
	if (event.target.id !== 'agentLookupModal') return;
	const form = event.target.querySelector('form');
	form.reset(); form.classList.remove('d-none', 'was-validated');
	updateAgentIssueDate();
	form.elements.documentNumber.setCustomValidity('');
	document.getElementById('agentLookupConfirmation').classList.add('d-none');
	form.elements.documentType.focus();
});
document.addEventListener('click', (event) => {
	if (event.target.closest('[data-agent-search-again]')) {
		document.querySelector('[data-agent-search-form]').classList.remove('d-none');
		document.getElementById('agentLookupConfirmation').classList.add('d-none');
		document.getElementById('agentDocumentNumber').focus();
	}
	if (event.target.closest('[data-agent-confirm-person]')) {
		editingAgentId = null;
		agentWizardDraft = { step: 1, reached: 1, quality: '', start: '', end: '', authorizations: [] };
		selectedAgentDocuments = [];
		closeAgentLookupAndContinue(document.getElementById('agentLookupModal'));
	}
	const step = event.target.closest('[data-wizard-step]');
	if (step) navigateAgentWizard(Number(step.dataset.wizardStep));
	const next = event.target.closest('[data-wizard-next]');
	if (next) navigateAgentWizard(Number(next.dataset.wizardNext) + 1);
	const remove = event.target.closest('[data-agent-auth-remove]');
	if (remove) {
		agentWizardDraft.authorizations.splice(Number(remove.dataset.agentAuthRemove), 1);
		renderAgentAuthorizationList();
	}
	if (event.target.closest('#agentWizardFinish')) {
		if ((!agentWizardDraft.authorizations.length && !editingAgentId) || !selectedAgentLookup || !validateAgentQuality()) return;
		const person = selectedAgentLookup;
		if (authorizedAgents.some((agent) => agent.id !== editingAgentId && agent.active && agent.document.replace(/\D/g, '') === person.documentNumber.replace(/\D/g, '') && agent.quality === agentWizardDraft.quality)) {
			const error = document.getElementById('agentAuthorizationError');
			error.textContent = 'Esta persona ya tiene una autorización activa con la misma calidad. Puedes editarla desde el listado de agentes.';
			error.classList.remove('d-none'); return;
		}
		const existing = authorizedAgents.find((agent) => agent.id === editingAgentId);
 const updated = { id: existing?.id || `added-${Date.now()}`, name: existing?.name || agentFullName(person), document: person.documentNumber, documentType: person.documentType, quality: agentWizardDraft.quality, start: agentWizardDraft.start, end: agentWizardDraft.end || '9999-12-31', taxes: existing && !existing.authorizations && !agentWizardDraft.authorizations.length ? [...existing.taxes] : [...new Set(agentWizardDraft.authorizations.map((auth) => agentTaxNames[auth.tax]))], active: true, authorizations: agentWizardDraft.authorizations.map((auth) => ({ ...auth })), documents: selectedAgentDocuments.map((file) => ({ name: file.name, size: file.size })) };
 if (existing) Object.assign(existing, updated); else authorizedAgents.push(updated);
 agentWizardNotice = existing ? 'Cambios guardados en el agente autorizado.' : `Se agregó a ${agentFullName(person)} como agente autorizado.`;
 editingAgentId = null;
		selectedAgentLookup = null; selectedAgentDocuments = [];
		window.location.hash = 'rit-agentes';
	}
});
document.addEventListener('change', (event) => {
	if (event.target.id === 'agentDocumentType') {
		document.getElementById('agentDocumentNumber').setCustomValidity('');
		updateAgentIssueDate();
	}
	if (['agentQuality', 'agentValidityStart', 'agentValidityEnd'].includes(event.target.id)) {
		captureAgentQuality(); updateAgentQualityDocuments();
		document.getElementById('agentValidityEnd').min = agentWizardDraft.start;
	}
	if (event.target.id === 'agentAuthTax' || event.target.name === 'agentPropertyType') document.getElementById('agentAuthObject').value = '';
	if (['agentAuthTax', 'agentAuthYear'].includes(event.target.id) || event.target.name === 'agentPropertyType') updateAgentAuthorizationFields();
});
document.addEventListener('input', (event) => {
	if (event.target.id === 'agentAuthObject') event.target.setCustomValidity('');
});
// Impedir saltar al último paso sin validar calidad, fechas y archivos.
document.addEventListener('show.bs.tab', (event) => {
	const step = Number(event.target.dataset.wizardTab);
	if (step === 3 && !validateAgentQuality()) event.preventDefault();
});
document.addEventListener('shown.bs.tab', (event) => {
	const step = Number(event.target.dataset.wizardTab);
	if (!step) return;
	agentWizardDraft.step = step;
	document.getElementById('agentWizardProgressText').textContent = `Paso ${step} de 3`;
	const progress = document.getElementById('agentWizardProgress');
	progress.setAttribute('aria-valuenow', step);
	progress.querySelector('.progress-bar').style.width = `${step / 3 * 100}%`;
	renderAgentAuthorizationList();
	document.getElementById(`agent-pane-${step}`).focus();
});
document.addEventListener('submit', (event) => {
	if (event.target.id === 'agentQualityForm') { event.preventDefault(); navigateAgentWizard(3); }
	if (event.target.id !== 'agentAuthorizationForm') return;
	event.preventDefault();
	const form = event.target;
	form.classList.add('was-validated');
	if (!form.reportValidity()) return;
	const tax = document.getElementById('agentAuthTax').value;
	const year = document.getElementById('agentAuthYear').value;
	const period = document.getElementById('agentAuthPeriod').value;
	if (!tax || !year || !period) return;
	const value = document.getElementById('agentAuthObject').value.trim().toLocaleUpperCase('es');
	if (tax !== 'ica' && !value) {
		const input = document.getElementById('agentAuthObject');
		input.setCustomValidity('Ingresa la identificación del predio o la placa.');
		form.reportValidity(); return;
	}
	const object = tax === 'ica' ? 'Contribuyente' : `${tax === 'vehiculos' ? 'Placa' : document.querySelector('[name="agentPropertyType"]:checked').value}: ${value}`;
	const error = document.getElementById('agentAuthorizationError');
	if (agentWizardDraft.authorizations.some((auth) => auth.tax === tax && auth.year === year && auth.period === period && auth.object === object)) {
		error.textContent = 'Esta autorización ya está agregada. Revisa la lista o selecciona otros datos.';
		error.classList.remove('d-none'); return;
	}
	agentWizardDraft.authorizations.push({ tax, year, period, object });
	error.classList.add('d-none');
	renderAgentAuthorizationList();
	form.reset(); form.classList.remove('was-validated'); updateAgentAuthorizationFields();
	document.getElementById('agentAuthTax').focus();
});
