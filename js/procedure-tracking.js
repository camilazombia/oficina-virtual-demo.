function renderProcedureTracking() {
 return `${pageTitle('<span id="procedure-tracking-title" class="d-inline-block pe-3">Seguimiento de trámite</span>', 'Consulta el estado de un trámite con su número de caso o de radicado.')}
 ${section('Consultar solicitud', `<p class="text-secondary">Completa uno de los dos campos.</p>
 <form id="procedure-tracking-form" novalidate>
 <div class="row g-3 mb-3"><div class="col-12 col-md-5 col-lg-4"><label class="form-label" for="procedure-case-number">Número de caso</label><input class="form-control" id="procedure-case-number" name="caso" type="text" aria-describedby="procedure-tracking-feedback"></div><div class="col-12 col-md-5 col-lg-4"><label class="form-label" for="procedure-filing-number">Número de radicado</label><input class="form-control" id="procedure-filing-number" name="radicado" type="text" aria-describedby="procedure-tracking-feedback"></div></div>
 ${queryActions()}
 <div id="procedure-tracking-feedback" class="mt-3 mb-0" role="status" aria-live="polite"></div></form>`)}`;
}
document.addEventListener('submit', event => {
 if (event.target.id !== 'procedure-tracking-form') return;
 event.preventDefault();
 const fields = ['procedure-case-number', 'procedure-filing-number'].map(id => document.getElementById(id));
 const missing = fields.every(field => !field.value.trim());
 fields.forEach(field => {
  field.classList.toggle('is-invalid', missing);
  field.setAttribute('aria-invalid', String(missing));
 });
 const feedback = document.getElementById('procedure-tracking-feedback');
 feedback.className = `alert alert-${missing ? 'warning' : 'info'} mt-3 mb-0`;
 feedback.textContent = missing ? 'Ingresa un número de caso o de radicado para consultar.' : 'La consulta del estado del trámite todavía no está disponible.';
 if (missing) fields[0].focus();
});
document.addEventListener('reset', event => {
 if (event.target.id !== 'procedure-tracking-form') return;
 for (const id of ['procedure-case-number', 'procedure-filing-number']) {
  const field = document.getElementById(id);
  field.classList.remove('is-invalid');
  field.removeAttribute('aria-invalid');
 }
 const feedback = document.getElementById('procedure-tracking-feedback');
 feedback.className = 'mt-3 mb-0'; feedback.textContent = '';
});
