function renderMultipaymentCertification() {
	return `${pageTitle('<span id="multipayment-certification-title" class="d-inline-block pe-3">Certificaciones multipago</span>', 'Consulta las certificaciones de los pagos que hiciste con un Recibo Oficial de Pago (ROP) multipago.')}
	${section('Consultar certificación', `<form id="multipayment-certification-form" data-query-feedback="La consulta de certificaciones multipago todavía no está disponible." novalidate>
		<div class="row g-3 mb-3">
			<div class="col-12 col-md-6">
				<label class="form-label" for="multipayment-tax">Impuesto</label>
				${renderSelect('multipayment-tax', [['predial', 'Impuesto predial']], { value: 'predial', prompt: '', required: true })}
			</div>
			<div class="col-12 col-md-6">
				<label class="form-label" for="multipayment-year">Año del pago <span class="text-danger" aria-hidden="true">*</span></label>
				${renderSelect('multipayment-year', yearOptions(2024, 2026), { prompt: 'Selecciona un año', required: true })}
				<div class="invalid-feedback">Selecciona un año.</div>
			</div>
		</div>
		${queryActions()}
		<div id="multipayment-feedback" data-query-status role="status"></div>
	</form>`)}`;
}
