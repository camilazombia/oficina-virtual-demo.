let predialDraft = { blank: false, calculated: false, signed: false, submitted: false };
const predialPrivateLabels = ['Valor impuesto a cargo','Descuento por incremento diferencial','Valor del impuesto ajustado actual','Sanción','Total saldo a cargo','Valor a pagar','Descuento por pronto pago','Descuento adicional del 1%','Intereses','Total a pagar','Valor aporte voluntario','Total con pago voluntario'];
const predialExampleAmounts = [5707000,0,5707000,0,5707000,5707000,0,0,482000,6189000,0,6189000];
function renderPredialDeclaration() {
 const escape = icaEscape;
 const field = (id, label, value, editable = false) => `<div class="col-12 col-md-6 col-xl-4"><label class="form-label small" for="pd-${id}">${label}</label><input class="form-control ${editable ? '' : 'bg-body-tertiary'}" id="pd-${id}" value="${escape(predialDraft.values?.[id] ?? value)}" ${editable ? 'type="number" min="0" required' : 'readonly'}></div>`;
 return `${pageTitle('Declaración Predial', 'CHIP AAA0012MOYN · Año gravable 2026')}<a class="btn btn-outline-secondary btn-sm mb-4" href="#impuestos-predial"><i class="bi bi-arrow-left me-2" aria-hidden="true"></i>Volver a Predial</a>
 <div class="alert alert-info small" role="note">Verifica que las ventanas emergentes estén desbloqueadas para navegar y descargar los documentos.</div>
 <details class="mb-4 border rounded-3 p-3"><summary class="fw-semibold">Información del Impuesto Predial</summary><p class="small mt-3">El Impuesto Predial Unificado lo pagan los propietarios, poseedores o usufructuarios de inmuebles ubicados en el Distrito Capital. La información proviene de Catastro Distrital y de la oficina de Instrumentos Públicos. Verifica las inconsistencias con la entidad correspondiente.</p><a href="https://www.shd.gov.co/shd/predial" target="_blank" rel="noopener noreferrer">Más información</a></details>
 ${section('Contribuyente', table(['Tipo de documento','Número de documento','Nombre'], [['CC','19440356','LUIS FELIPE CRUZ GIL']]))}
 <nav class="mb-4" aria-label="Progreso de la declaración"><ol class="row g-3 list-unstyled mb-0">${[['Revisar datos',true],['Calcular',predialDraft.calculated],['Firmar',predialDraft.signed],['Presentar',predialDraft.submitted]].map(([label,done], index) => {
 const current = predialDraft.submitted ? 3 : predialDraft.signed ? 3 : predialDraft.calculated ? 2 : 0;
 const complete = predialDraft.submitted || index < current || (index === 1 && predialDraft.calculated);
 const active = index === current && !predialDraft.submitted;
 const status = complete ? 'Completado' : active ? 'En curso' : 'Pendiente';
 return `<li class="col-12 col-sm-6 col-xl-3"><div class="d-flex align-items-center gap-3 border rounded-3 p-3 h-100 ${active ? 'border-primary bg-primary-subtle' : 'bg-body'}" ${active ? 'aria-current="step"' : ''}><span class="badge rounded-pill p-2 ${complete ? 'text-bg-success' : active ? 'text-bg-primary' : 'text-bg-light border'}">${complete ? '<i class="bi bi-check-lg" aria-hidden="true"></i><span class="visually-hidden">Paso completado</span>' : index + 1}</span><div><span class="d-block fw-semibold small">${label}</span><span class="small ${complete ? 'text-success' : 'text-secondary'}">${status}</span></div></div></li>`;
 }).join('')}</ol></nav>
 ${section('Datos generales', `<div class="row g-3">${[['year','Año gravable','2026'],['use','Opción de uso',''],['registration','Matrícula inmobiliaria','050S40156590'],['chip','CHIP','AAA0012MOYN'],['cadastral','Cédula catastral','18AS 31 18'],['address','Dirección','CL 18 SUR 29B 61'],['quality','Calidad sujeción','Usufructuario']].map(args => field(...args)).join('')}</div>`)}
 ${section('Datos de liquidación', `<div class="row g-3">${[['ownership','Porcentaje de propiedad %','100'],['exemption','Porcentaje de exención %',''],['exclusion','Porcentaje de exclusión %',''],['rate','Tarifa liquidación',''],['destination','Destino hacendario','-'],['base','Base gravable',predialDraft.base ?? '600741000']].map(args => field(...args, predialDraft.blank && ['ownership','exemption','exclusion','rate','base'].includes(args[0]) && !predialDraft.submitted)).join('')}</div>`)}
 ${section('Liquidación privada', `<div class="row g-3">${predialPrivateLabels.map((label,index) => field(`amount-${index}`,label,predialDraft.calculated ? new Intl.NumberFormat('es-CO').format(predialExampleAmounts[index]) : '')).join('')}</div><div class="d-flex flex-wrap align-items-center gap-3 mt-4"><button class="btn btn-primary" type="button" data-pd-action="calculate" ${predialDraft.submitted ? 'disabled' : ''}>Calcular</button><div class="form-check"><input class="form-check-input" type="checkbox" id="pd-disagree" ${predialDraft.blank ? 'checked' : ''} ${predialDraft.submitted ? 'disabled' : ''}><label class="form-check-label small" for="pd-disagree">No estoy de acuerdo con la información registrada.</label></div></div>`)}
 ${section('Firmas', `<p class="small text-secondary">Primero calcula la declaración y luego selecciona una opción de firma.</p><div class="row g-3">${field('sign-name','Nombre','LUIS FELIPE CRUZ GIL')}${field('sign-type','Tipo de identificación','CC')}${field('sign-document','No. identificación','19440356')}${field('sign-card','No. tarjeta profesional','')}</div><div class="d-flex flex-wrap gap-2 mt-4"><button class="btn btn-outline-primary" type="button" data-pd-action="sign" ${!predialDraft.calculated || predialDraft.signed ? 'disabled' : ''}>Solo firmar</button><button class="btn btn-outline-primary" type="button" data-pd-action="add-signers" ${!predialDraft.calculated || predialDraft.signed ? 'disabled' : ''}>Firmar y agregar</button><span class="badge align-self-center ${predialDraft.signed ? 'text-bg-success' : 'text-bg-light border'}">${predialDraft.signed ? 'Firmada' : 'Pendiente de firma'}</span></div>`)}
 <div class="d-flex flex-wrap justify-content-end gap-2 mb-4"><a class="btn btn-outline-secondary" href="#impuestos-predial">${predialDraft.submitted ? 'Regresar' : 'Cancelar'}</a><button class="btn btn-primary" type="button" data-pd-action="submit" ${!predialDraft.signed || predialDraft.submitted ? 'disabled' : ''}>Presentar declaración</button>${predialDraft.submitted ? '<button class="btn btn-outline-primary" type="button" data-pd-action="download">Descargar declaración PDF</button><button class="btn btn-primary" type="button" data-pd-action="rop">Generar ROP</button>' : '<button class="btn btn-primary" type="button" disabled>Pagar en l\u00ednea</button>'}</div>`;
}
function predialMessage(title, message, confirm, onCancel, continueOnly = false) {
 const modal = document.createElement('div'); modal.className = 'modal fade'; modal.tabIndex = -1; modal.setAttribute('aria-labelledby','pd-modal-title');
 modal.innerHTML = `<div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h2 class="modal-title fs-5" id="pd-modal-title">${title}</h2><button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Cerrar"></button></div><div class="modal-body"><p class="mb-0">${message}</p></div><div class="modal-footer">${confirm ? '<button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal">Cancelar</button>' : ''}<button class="btn btn-primary" type="button" data-pd-confirm>${confirm ? 'Continuar' : 'Ok'}</button></div></div></div>`;
 if (continueOnly) { modal.querySelector('[data-bs-dismiss="modal"]:not(.btn-close)')?.remove(); modal.querySelector('[data-pd-confirm]').textContent = 'Continuar'; }
 document.body.appendChild(modal); const instance = new bootstrap.Modal(modal); let accepted = false;
 modal.querySelector('[data-pd-confirm]').addEventListener('click', () => { accepted = true; instance.hide(); });
 modal.addEventListener('hidden.bs.modal', () => { instance.dispose(); modal.remove(); if (accepted) confirm?.(); else onCancel?.(); },{once:true}); instance.show();
}
function downloadPredialExample(kind = 'declaracion') {
 const lines = [kind === 'rop' ? 'RECIBO OFICIAL DE PAGO - EJEMPLO LOCAL' : 'DECLARACION PREDIAL - EJEMPLO LOCAL', 'Sin validez tributaria. No presentada ante la entidad.', 'Vigencia: 2026 - CHIP: AAA0012MOYN', 'CC 19440356 - LUIS FELIPE CRUZ GIL', 'Direccion: CL 18 SUR 29B 61', 'Base gravable: 600.741.000', ...predialPrivateLabels.map((label,index) => `${label.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}: ${new Intl.NumberFormat('es-CO').format(predialExampleAmounts[index])}`)];
 if (kind === 'rop') lines.splice(5, lines.length - 5, 'Valor de la obligacion: 571.000', 'Total a pagar: 590.000', `Valor del recibo: ${new Intl.NumberFormat('es-CO').format(predialRopAmount)}`, predialRopAmount < 590000 ? 'Pago parcial. No aplica alivio tributario.' : 'Pago total de la obligacion.');
 const content = `BT /F1 11 Tf 50 780 Td ${lines.map((line,index) => `${index ? '0 -23 Td ' : ''}(${line.replace(/[()\\]/g,'\\$&')}) Tj`).join('\n')} ET`;
 const objects = ['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${content.length} >>\nstream\n${content}\nendstream`];
 let pdf = '%PDF-1.4\n'; const offsets = [0]; objects.forEach((object,index) => { offsets.push(pdf.length); pdf += `${index+1} 0 obj\n${object}\nendobj\n`; }); const xref = pdf.length;
 pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
 const url = URL.createObjectURL(new Blob([pdf],{type:'application/pdf'})); const link = document.createElement('a'); link.href = url; link.download = `${kind}-predial-2026-ejemplo.pdf`; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
}
document.addEventListener('change', event => {
 if (event.target.id !== 'pd-disagree') return;
 if (!event.target.checked) { predialDraft.blank = false; predialDraft.calculated = false; predialDraft.signed = false; renderRoute(); return; }
 predialMessage('Declaración en blanco','A continuación, procederás a presentar una declaración en blanco.', () => { predialDraft.blank = true; predialDraft.calculated = false; predialDraft.signed = false; renderRoute(); predialMessage('Firmas', 'Sigue los siguientes pasos: da clic en Calcular; luego selecciona Firmar, si eres persona natural, o Agregar firmantes, si eres persona jurídica. Posteriormente escoge SPAC y Presentar declaración.'); }, () => { event.target.checked = false; });
});
document.addEventListener('input', event => {
 if (location.hash !== '#predial-declaracion' || !predialDraft.blank || event.target.readOnly) return;
 predialDraft.values ||= {}; predialDraft.values[event.target.id.replace('pd-','')] = event.target.value;
 predialDraft.calculated = false; predialDraft.signed = false;
 document.querySelectorAll('[data-pd-action="sign"],[data-pd-action="add-signers"],[data-pd-action="submit"]').forEach(button => { button.disabled = true; });
});
document.addEventListener('click', event => {
 const button = event.target.closest('[data-pd-action]'); if (!button || button.disabled) return;
 const action = button.dataset.pdAction;
 if (action === 'calculate') {
  const fields = [...document.querySelectorAll('#pd-base,#pd-ownership,#pd-exemption,#pd-exclusion,#pd-rate')];
  if (predialDraft.blank && fields.some(field => !field.reportValidity())) return;
  if (predialDraft.blank && fields.some(field => field.id !== 'pd-base' && field.id !== 'pd-rate' && Number(field.value) > 100)) { predialMessage('Predial','Los porcentajes deben estar entre 0 y 100.'); return; }
  predialDraft.base = document.getElementById('pd-base').value; predialDraft.calculated = true; predialDraft.signed = false; renderRoute(); predialMessage('Predial','El cálculo se ha realizado exitosamente.');
 }
 if (action === 'sign' && predialDraft.calculated) { predialDraft.signed = true; renderRoute(); predialMessage('Firmas','La declaración ha sido firmada.'); }
 if (action === 'add-signers' && predialDraft.calculated) predialMessage('Firmas','Se presentó un problema al enviar los correos de notificación. Intenta nuevamente o selecciona Solo firmar.');
 if (action === 'submit' && predialDraft.signed && !predialDraft.submitted) { predialDraft.submitted = true; renderRoute(); downloadPredialExample(); predialMessage('Beneficio Tributario','La Declaración se ha presentado correctamente. Para aplicar el alivio tributario, es necesario que generes un ROP (Recibo Oficial de Pago) para que se refleje el valor de los descuentos y puedas efectuar el pago total de tu obligación. Obtén el recibo desde el botón Generar ROP o ingresando al menú Consultas → Obligaciones pendientes → Generar ROP.'); }
 if (action === 'download' && predialDraft.submitted) downloadPredialExample();
 if (action === 'rop' && predialDraft.submitted) {
  predialMessage('Generar recibo de pago', 'La obligación sobre la que generas Recibo Oficial de Pago tiene alivio tributario según el Acuerdo 1084 1084. Ten en cuenta que, para acceder a este descuento, debes generar el pago total de la obligación. No aplica, si realizas pagos parciales de la deuda.', () => { location.hash = 'predial-rop'; }, undefined, true);
 }
});

let predialRopAmount = 590000;
const predialRopHelp = [
 'Valor de la obligación: es el valor neto de tu deuda sin intereses.',
 'Total a pagar: es el valor total de tu deuda con intereses.',
 'Parcial a pagar: diligencia solo si haces un pago parcial abonando a tu deuda. Este pago elimina los descuentos, salvo que tengas facilidad de pago aprobada.',
];
function renderPredialRop() {
 if (!predialDraft.submitted) return `${pageTitle('Generar ROP', 'Recibo Oficial de Pago')}<div class="alert alert-info">Primero debes presentar la declaración predial.</div><a class="btn btn-primary" href="#predial-declaracion">Ir a la declaración</a>`;
 const info = index => `<button class="btn btn-link p-0 ms-1" type="button" data-rop-help="${index}" aria-label="Ayuda sobre ${['valor de la obligación','total a pagar','parcial a pagar'][index]}"><i class="bi bi-info-circle-fill" aria-hidden="true"></i></button>`;
 return `${pageTitle('Generar ROP', 'Recibo Oficial de Pago · Predial · CHIP AAA0012MOYN')}<div class="card border-0 shadow-sm"><div class="card-body p-3 p-md-4"><form id="predial-rop-form"><div class="row g-4"><div class="col-12 col-md-4"><label class="form-label" for="rop-obligation">Valor de la obligación</label>${info(0)}<div class="input-group"><span class="input-group-text">$</span><input class="form-control bg-body-tertiary" id="rop-obligation" value="571.000" readonly></div></div><div class="col-12 col-md-4"><label class="form-label" for="rop-total">Total a pagar</label>${info(1)}<div class="input-group"><span class="input-group-text">$</span><input class="form-control bg-body-tertiary" id="rop-total" value="590.000" readonly></div></div><div class="col-12 col-md-4"><label class="form-label" for="rop-partial">Parcial a pagar</label>${info(2)}<div class="input-group"><span class="input-group-text">$</span><input class="form-control" id="rop-partial" type="text" inputmode="numeric" placeholder="Opcional" aria-describedby="rop-partial-help rop-error"></div><div class="form-text" id="rop-partial-help">Déjalo vacío para pagar el total de la obligación.</div></div></div><div class="alert alert-warning small mt-4 mb-0">El alivio tributario requiere el pago total. Los pagos parciales no aplican al descuento.</div><div class="alert alert-danger d-none mt-3" id="rop-error" role="alert">Ingresa un valor entero mayor que cero y menor o igual a $590.000.</div><div class="d-flex flex-wrap justify-content-end gap-2 mt-4"><a class="btn btn-outline-secondary" href="#predial-declaracion">Regresar</a><button class="btn btn-primary" type="submit">Generar recibo de pago</button></div></form></div></div>`;
}
function parsePredialRopAmount(value) {
 if (!value.trim()) return 590000;
 if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(value.trim())) return null;
 const amount = Number(value.replaceAll('.', ''));
 return Number.isSafeInteger(amount) && amount > 0 && amount <= 590000 ? amount : null;
}
document.addEventListener('click', event => {
 const help = event.target.closest('[data-rop-help]');
 if (help) predialMessage('Ayuda', predialRopHelp[Number(help.dataset.ropHelp)], undefined, undefined, true);
});
document.addEventListener('submit', event => {
 if (event.target.id !== 'predial-rop-form') return;
 event.preventDefault(); if (!predialDraft.submitted) return;
 const amount = parsePredialRopAmount(document.getElementById('rop-partial').value);
 document.getElementById('rop-error').classList.toggle('d-none', amount !== null);
 if (amount === null) { document.getElementById('rop-partial').focus(); return; }
 predialRopAmount = amount;
 downloadPredialExample('rop'); predialMessage('Generar recibo de pago', 'ROP generado exitosamente.');
});
