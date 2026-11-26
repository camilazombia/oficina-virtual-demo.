const invoiceRitNameFields = {
	firstName: 'basic-first-name', middleName: 'basic-middle-name',
	firstSurname: 'basic-first-surname', secondSurname: 'basic-second-surname',
	documentIssueDate: 'basic-document-issue-date',
};

function matchesInvoiceDemoName({ firstName, middleName, firstSurname, secondSurname }) {
	const normalize = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es');
	return normalize(firstName) === 'miguel'
		&& (!middleName || normalize(middleName) === 'andres')
		&& normalize(firstSurname) === 'salazar'
		&& (!secondSurname || normalize(secondSurname) === 'rios');
}

function renderInvoiceRit() {
	const back = linkTo('pagos-facturas', '<i class="bi bi-arrow-left me-2" aria-hidden="true"></i>Volver a facturación', 'btn btn-outline-secondary btn-sm');
	const title = pageTitle('Actualización de datos', 'Verifica y actualiza tus datos personales y de contacto registrados en el Registro de Información Tributaria (RIT).');
	if (!taxpayerSession || taxpayerIdentity.documentType === 'NIT') return title + back;
	const template = document.createElement('template');
	template.innerHTML = existingRitPage;
	const source = template.content;
	const personal = source.querySelector('[aria-labelledby="basic-personal-data"]');
	const contact = source.querySelector('[aria-labelledby="contact-data"]');
	const email = source.querySelector('[aria-labelledby="change-email"]');
	const form = source.querySelector('form');
	form.dataset.invoiceRit = '';
	personal.querySelector('#basic-personal-data').textContent = 'Datos personales';
	personal.querySelector('#basic-personal-data').insertAdjacentHTML('afterend', '<p class="small text-secondary">Verifica que tus nombres y apellidos coincidan con los registrados en tu documento de identidad.</p>');
	personal.querySelector('#basic-withholding-agent').parentElement.remove();
	personal.querySelector('label[for="basic-id-class"]').textContent = 'Tipo de documento';
	const number = personal.querySelector('#basic-document-number');
	number.disabled = false;
	number.readOnly = true;
	number.classList.add('bg-body-tertiary');
	number.setAttribute('aria-describedby', 'invoice-rit-id-help');
	personal.querySelector('#basic-id-class').setAttribute('aria-describedby', 'invoice-rit-id-help');
	for (const [key, id] of Object.entries(invoiceRitNameFields)) {
		const field = personal.querySelector('#' + id);
		field.disabled = false;
		field.required = ['firstName', 'firstSurname', 'documentIssueDate'].includes(key);
		if (field.required) {
			const label = personal.querySelector(`label[for="${id}"]`);
			label.insertAdjacentHTML('beforeend', ' <span class="text-danger" aria-hidden="true">*</span>');
			field.setAttribute('aria-describedby', `${id}-error`);
			field.insertAdjacentHTML('afterend', `<div class="invalid-feedback" id="${id}-error">${key === 'documentIssueDate' ? 'Selecciona la fecha de expedición.' : `Ingresa el ${label.firstChild.textContent.trim().toLocaleLowerCase('es')}.`}</div>`);
		}
	}
	personal.insertAdjacentHTML('beforeend', `
		<p id="invoice-rit-id-help" class="form-text">Los datos de identificación no pueden modificarse desde esta sección.</p>
		<p class="small text-secondary mb-2">Ingresa tus nombres y apellidos tal como aparecen en tu documento de identidad.</p>
		<p class="small text-secondary">Para actualizar tu nombre, primero debes validar que los datos ingresados coincidan con tu documento de identidad.</p>
		<div data-rit-name-status aria-live="polite"></div>
		<div class="d-flex flex-wrap justify-content-end gap-2"><button type="button" class="btn btn-outline-primary" data-rit-name-validate disabled>Validar nombre</button>
		<button type="button" class="btn btn-primary" data-rit-name-update disabled>Actualizar nombre</button></div>`);
	contact.querySelector('#contact-data').insertAdjacentHTML('afterend', '<p class="small text-secondary">Mantén actualizada tu información de contacto registrada en el RIT.</p>');
	contact.querySelector('#socialNetworkStatus').textContent = 'Agrega tus redes y selecciona Actualizar datos de contacto para conservarlas.';
	email.className = 'border-top mt-4 pt-3';
	email.querySelector('h2').className = 'h6 fw-semibold mb-3';
	contact.append(email);
	contact.insertAdjacentHTML('beforeend', '<div class="mt-3" data-rit-contact-status aria-live="polite"></div><div class="d-flex justify-content-end mt-3"><button type="button" class="btn btn-primary" data-rit-contact-update>Actualizar datos de contacto</button></div>');
	form.replaceChildren(personal, contact);
	return `<div class="mb-3" data-invoice-rit-return>${back}</div>${title}${form.outerHTML}`;
}

function mountInvoiceRit() {
	const form = document.querySelector('[data-invoice-rit]');
	if (!form) return;
	const personal = form.querySelector('[aria-labelledby="basic-personal-data"]');
	const contact = form.querySelector('[aria-labelledby="contact-data"]');
	const fields = Object.fromEntries(Object.entries(invoiceRitNameFields).map(([key, id]) => [key, personal.querySelector('#' + id)]));
	const validate = personal.querySelector('[data-rit-name-validate]');
	const update = personal.querySelector('[data-rit-name-update]');
	const nameStatus = personal.querySelector('[data-rit-name-status]');
	const contactStatus = contact.querySelector('[data-rit-contact-status]');
	const readName = () => Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value.trim()]));
	const nameKey = () => JSON.stringify(readName());
	const contactKey = () => JSON.stringify(readRitFormValues(contact));
	let savedName = nameKey();
	let savedContact = contactKey();
	let approved;
	let pending = '';
	const nameIsComplete = () => Object.values(fields).every(field => field.checkValidity() && (!field.required || field.value.trim()));

	function refreshButtons() {
		validate.disabled = Boolean(pending) || !nameIsComplete();
		update.disabled = Boolean(pending) || approved?.key !== nameKey();
		validate.textContent = pending === 'validate' ? 'Validando nombre…' : 'Validar nombre';
		update.textContent = pending === 'update' ? 'Actualizando nombre…' : 'Actualizar nombre';
	}

	function nameMessage(tone, title, text) {
		nameStatus.innerHTML = statusAlert(tone, `<strong class="d-block">${title}</strong>${text}`);
	}

	form.addEventListener('submit', event => event.preventDefault());
	personal.addEventListener('focusout', event => {
		if (!Object.values(fields).includes(event.target)) return;
		const field = event.target;
		if (field.required) field.classList.toggle('is-invalid', !field.checkValidity() || !field.value.trim());
	});
	personal.addEventListener('input', event => {
		if (event.target.required && event.target.checkValidity() && event.target.value.trim()) event.target.classList.remove('is-invalid');
		if (approved && approved.key !== nameKey()) {
			approved = undefined;
			nameStatus.innerHTML = statusAlert('warning', 'Modificaste tus datos personales. Valida nuevamente tu nombre antes de guardar los cambios.');
		} else if (!approved && nameStatus.querySelector('strong')) {
			nameStatus.replaceChildren();
		}
		refreshButtons();
	});

	validate.addEventListener('click', async () => {
		if (validate.disabled) return;
		const data = { ...readName(), documentType: form.querySelector('#basic-id-class').value, documentNumber: form.querySelector('#basic-document-number').value };
		const key = nameKey();
		pending = 'validate';
		approved = undefined;
		nameStatus.replaceChildren();
		refreshButtons();
		try {
			const service = window.ritNameService;
			const demo = !service;
			const response = demo
				? { percentage: matchesInvoiceDemoName(data) ? 90 : 79 }
				: await service.validate(data);
			if (!form.isConnected || key !== nameKey()) return;
			const score = response?.percentage;
			if (!Number.isFinite(score) || score < 0 || score > 100) throw new Error('Respuesta de validación incompleta');
			if (score >= 90) {
				approved = { key, data, validationId: response.validationId, demo };
				nameMessage('success', 'Nombre validado', 'Los datos ingresados cumplen con el porcentaje mínimo de coincidencia. Selecciona Actualizar nombre para guardar los cambios.');
			} else {
				nameMessage('warning', 'No pudimos validar tu nombre', `Los datos ingresados tienen una coincidencia del ${new Intl.NumberFormat('es-CO').format(score)} %. Para actualizar tu nombre, se requiere una coincidencia mínima del 90 %. Verifica que tus nombres, apellidos y fecha de expedición coincidan con tu documento e inténtalo nuevamente.`);
			}
		} catch {
			if (form.isConnected && key === nameKey()) nameMessage('danger', 'No fue posible validar tu nombre', 'Ocurrió un error durante la validación. Inténtalo nuevamente.');
		} finally {
			pending = '';
			refreshButtons();
		}
	});

	update.addEventListener('click', async () => {
		if (update.disabled || !approved) return;
		pending = 'update';
		Object.values(fields).forEach(field => { field.readOnly = true; });
		refreshButtons();
		try {
			if (!approved.demo) {
				const response = await window.ritNameService.update(approved.data, approved.validationId);
				if (response?.updated !== true) throw new Error('Actualización sin confirmar');
			}
			const values = { ...ritFormValues };
			for (const [key, id] of Object.entries(invoiceRitNameFields)) values[id] = { value: approved.data[key] };
			persistRitFormValues(values);
			for (const key of Object.keys(fields)) taxpayerIdentity[key] = approved.data[key];
			if (form.isConnected) {
				syncTaxpayerProfile();
				savedName = nameKey();
				nameMessage('success', 'Nombre actualizado', approved.demo
					? 'Los cambios se guardaron correctamente.'
					: 'Tu nombre se actualizó correctamente en el Registro de Información Tributaria (RIT).');
			}
			approved = undefined;
		} catch {
			if (form.isConnected) nameMessage('danger', 'No fue posible actualizar tu nombre', 'Inténtalo nuevamente.');
		} finally {
			Object.values(fields).forEach(field => { field.readOnly = false; });
			pending = '';
			refreshButtons();
		}
	});

	const newEmail = contact.querySelector('#new-email');
	const confirmEmail = contact.querySelector('#confirm-email');
	const currentEmail = contact.querySelector('#current-email');
	contact.addEventListener('input', () => confirmEmail.setCustomValidity(''));
	contact.querySelector('[data-rit-contact-update]').addEventListener('click', () => {
		const changingEmail = Boolean(newEmail.value || confirmEmail.value);
		newEmail.required = confirmEmail.required = changingEmail;
		confirmEmail.setCustomValidity(changingEmail && newEmail.value !== confirmEmail.value ? 'Los correos electrónicos deben coincidir.' : '');
		const invalid = [...contact.querySelectorAll('input, select, textarea')].find(field => !field.checkValidity());
		if (invalid) {
			invalid.reportValidity();
			return;
		}
		try {
			const values = { ...ritFormValues };
			const inputs = readRitFormValues(contact);
			for (const id of Object.keys(values)) {
				if (/^social-(network|user)(-\d+)?$/.test(id) && !Object.hasOwn(inputs, id)) delete values[id];
			}
			if (changingEmail) {
				inputs['current-email'].value = newEmail.value;
				inputs['new-email'].value = inputs['confirm-email'].value = '';
			}
			persistRitFormValues({ ...values, ...inputs });
			if (changingEmail) {
				currentEmail.value = newEmail.value;
				newEmail.value = confirmEmail.value = '';
				newEmail.required = confirmEmail.required = false;
			}
			savedContact = contactKey();
			contactStatus.innerHTML = statusAlert('success', 'Tus datos de contacto se actualizaron correctamente.');
		} catch {
			contactStatus.innerHTML = statusAlert('danger', 'No fue posible actualizar tus datos de contacto. Inténtalo nuevamente.', 'alert');
		}
	});

	document.querySelector('[data-invoice-rit-return] a').addEventListener('click', event => {
		if (pending === 'update') {
			event.preventDefault();
			return;
		}
		if (savedName === nameKey() && savedContact === contactKey()) return;
		event.preventDefault();
		const { modal, instance } = showDetailModal({
			title: 'Cambios sin guardar', trigger: event.currentTarget,
			body: '<p class="mb-0">Si vuelves a facturación, se descartarán los cambios que no guardaste.</p>',
			actions: '<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Seguir editando</button><button type="button" class="btn btn-primary" data-discard-rit>Volver a facturación</button>',
		});
		modal.querySelector('[data-discard-rit]').addEventListener('click', () => {
			modal.addEventListener('hidden.bs.modal', () => { window.location.hash = 'pagos-facturas'; }, { once: true });
			instance.hide();
		});
	});
	refreshButtons();
}
