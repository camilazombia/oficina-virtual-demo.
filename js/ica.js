const icaCatalog = [
 { code: '1061', name: 'TRILLA DE CAFÉ' },
 { code: '128', name: 'CULTIVO DE ESPECIAS Y DE PLANTAS AROMÁTICAS Y MEDICINALES' },
 { code: '129', name: 'OTROS CULTIVOS PERMANENTES N.C.P.' },
];
let icaData = { activities: [{ code: '1061', name: 'TRILLA DE CAFÉ', type: 'P', start: '2022-01-01', fixed: true }], establishments: [] };
try { const saved = JSON.parse(localStorage.getItem('hacienda-ica-v1')); if (saved && Array.isArray(saved.activities) && Array.isArray(saved.establishments)) icaData = saved; } catch {}
try {
 if (localStorage.getItem('hacienda-ica-establishment-seed-v1') !== 'true') {
  if (!icaData.establishments.some(item => item.registration === 'ABCD')) icaData.establishments.push({ registration: 'ABCD', name: 'Café Alameda', address: 'AC 8 # 1 1', phone: '6012771317', start: '2025-01-01' });
  localStorage.setItem('hacienda-ica-v1', JSON.stringify(icaData));
  localStorage.setItem('hacienda-ica-establishment-seed-v1', 'true');
 }
} catch { if (!icaData.establishments.length) icaData.establishments.push({ registration: 'ABCD', name: 'Café Alameda', address: 'AC 8 # 1 1', phone: '6012771317', start: '2025-01-01' }); }
icaData.establishments.forEach(item => {
 if (item.name === 'PRUEBA') item.name = 'Café Alameda';
});
let icaTab = 'activities';
const icaEscape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const icaDate = value => value.split('-').reverse().join('/');
function renderIca() {
 const activities = icaData.activities.map((item, index) => item.end ? null : [icaEscape(item.code), icaEscape(item.name), `<span class="badge ${item.type === 'P' ? 'text-bg-primary' : 'text-bg-light border'}">${item.type === 'P' ? 'Principal' : 'Secundaria'}</span>`, '', icaDate(item.start), '31/12/9999', item.type === 'P' ? '<span class="small text-secondary text-nowrap"><i class="bi bi-lock me-1" aria-hidden="true"></i>No se puede eliminar</span>' : `<button type="button" class="btn btn-outline-primary btn-sm text-nowrap" data-ica-delete="activities" data-index="${index}" aria-label="Eliminar actividad ${icaEscape(item.code)}"><i class="bi bi-trash me-1" aria-hidden="true"></i>Eliminar</button>`]).filter(Boolean);
 const establishments = icaData.establishments.map((item, index) => item.end ? null : [icaEscape(item.registration), icaEscape(item.name), icaEscape(item.address), icaEscape(item.phone), icaDate(item.start), '31/12/9999', `<button type="button" class="btn btn-outline-primary btn-sm text-nowrap" data-ica-delete="establishments" data-index="${index}" aria-label="Eliminar establecimiento ${icaEscape(item.name)}"><i class="bi bi-trash me-1" aria-hidden="true"></i>Eliminar</button>`]).filter(Boolean);
 const panel = (key, title, description, headers, rows, button) => `<div class="tab-pane fade ${icaTab === key ? 'show active' : ''}" id="ica-${key}" role="tabpanel" aria-labelledby="ica-${key}-tab" tabindex="0"><div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4"><div><h2 class="h5 mb-1">${title}</h2><p class="small text-secondary mb-0">${description}</p></div><button class="btn btn-primary flex-shrink-0" type="button" data-ica-add="${key}"><i class="bi bi-plus-lg me-2" aria-hidden="true"></i>${button}</button></div>${!rows.length && key === 'establishments' ? '<div class="text-center border rounded-3 bg-body-tertiary py-5"><i class="bi bi-shop fs-1 text-secondary" aria-hidden="true"></i><h3 class="h6 mt-3">No existen datos actuales de establecimientos.</h3><p class="small text-secondary mb-0">Agrega tu primer establecimiento para consultar sus datos aquí.</p></div>' : registeredTaxTable(`ica-${key}`, title, headers, rows).replace(/<div class="mb-4">[\s\S]*?<\/div>/, '')}</div>`;
 return `${pageTitle('Impuesto de Industria y Comercio ICA', 'Consulta y administra tus actividades económicas y establecimientos.')}<div id="ica-status" class="alert alert-success d-none" role="status"></div><div class="card border-0 shadow-sm registered-taxes"><div class="card-header bg-white px-3 px-md-4 pt-3 pb-0"><ul class="nav nav-tabs card-header-tabs gap-2" role="tablist" aria-label="Información de ICA">${[['activities','Actividades económicas','bi-briefcase',icaData.activities.filter(item => !item.end).length],['establishments','Establecimientos','bi-shop',icaData.establishments.filter(item => !item.end).length]].map(([key,label,icon,count]) => `<li class="nav-item" role="presentation"><button class="nav-link d-flex align-items-center gap-2 px-3 py-3 ${icaTab === key ? 'active' : ''}" id="ica-${key}-tab" type="button" role="tab" data-ica-tab="${key}" data-bs-toggle="tab" data-bs-target="#ica-${key}" aria-controls="ica-${key}" aria-selected="${icaTab === key}">${label}<span class="badge rounded-pill text-bg-light border">${count}</span></button></li>`).join('')}</ul></div><div class="card-body p-3 p-md-4 tab-content">${panel('activities','Actividades económicas vigentes','Actividades registradas y su fecha de inicio.', ['Código CIIU','Nombre actividad económica','Tipo','Tarifa','Fecha inicio actividad','Fecha fin actividad','Acciones'], activities,'Agregar actividad')}${panel('establishments','Establecimientos activos','Información de los establecimientos asociados a tu registro.', ['Matrícula','Nombre','Dirección','Teléfono','Fecha de apertura','Fecha de cierre','Acciones'], establishments,'Agregar establecimiento')}</div></div>`;
}
function icaRefresh(message) {
 try { localStorage.setItem('hacienda-ica-v1', JSON.stringify(icaData)); } catch {}
 renderRoute();
 if (message) { const status = document.getElementById('ica-status'); status.textContent = message; status.classList.remove('d-none'); }
}
function icaModal(title, content, onReady) {
 const modal = document.createElement('div'); modal.className = 'modal fade'; modal.tabIndex = -1;
 modal.setAttribute('aria-labelledby', 'ica-modal-title');
 modal.innerHTML = `<div class="modal-dialog modal-dialog-centered modal-lg"><div class="modal-content"><div class="modal-header"><h2 class="modal-title fs-5" id="ica-modal-title">${title}</h2><button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Cerrar"></button></div><div class="modal-body p-4">${content}</div></div></div>`;
 document.body.appendChild(modal); const instance = new bootstrap.Modal(modal);
 modal.addEventListener('hidden.bs.modal', () => { if (modal.dataset.addressSuspended) return; instance.dispose(); modal.remove(); document.querySelector(`[data-ica-add="${icaTab}"]`)?.focus(); });
 onReady(modal, instance); instance.show();
}
function icaAdd(key) {
 const field = (name, label, type = 'text', extra = '') => `<div class="col-12 col-md-6"><label class="form-label" for="ica-${name}">${label} <span class="text-danger" aria-hidden="true">*</span></label><input class="form-control" id="ica-${name}" name="${name}" type="${type}" required ${extra}></div>`;
 const activityFields = `<div class="col-md-4"><label class="form-label" for="ica-code">Código CIIU</label><select class="form-select" id="ica-code" name="code" required><option value="">Seleccionar</option>${icaCatalog.map(item => `<option value="${item.code}">${item.code}</option>`).join('')}</select></div><div class="col-md-8"><label class="form-label" for="ica-activity-name">Nombre actividad económica</label><select class="form-select" id="ica-activity-name" required><option value="">Seleccionar</option>${icaCatalog.map(item => `<option value="${item.code}">${item.name}</option>`).join('')}</select></div><div class="col-md-6"><label class="form-label" for="ica-type">Tipo</label><select class="form-select" id="ica-type" name="type" required><option value="">Seleccionar</option><option value="P">Principal</option><option value="S">Secundaria</option></select></div>${field('start','Fecha inicio actividad','date')}`;
 const establishmentFields = `${field('registration','Matrícula')}${field('name','Nombre')}<div class="col-12"><label class="form-label" for="ica-address">Dirección</label><div class="input-group"><input class="form-control bg-body-tertiary" id="ica-address" name="address" placeholder="Haz clic en Editar dirección para agregar" readonly required><button class="btn btn-outline-primary" type="button" data-ica-address>Editar dirección</button></div></div>${field('phone','Teléfono','tel','pattern="[0-9 +()-]{7,20}" maxlength="20"')}${field('start','Fecha de apertura','date')}`;
 icaModal(key === 'activities' ? 'Agregar actividad económica' : 'Agregar establecimiento', `<form id="ica-add-form"><p class="small text-secondary">Completa los datos y revisa la información antes de confirmar.</p><div class="row g-3">${key === 'activities' ? activityFields : establishmentFields}</div><div class="alert alert-danger d-none mt-3" role="alert" data-ica-error></div><div class="d-none border rounded-3 bg-primary-subtle p-3 mt-4" data-ica-confirm><h3 class="h6">Confirmar registro</h3><p class="small mb-0">Confirma que deseas agregar los datos ingresados.</p></div><div class="d-flex justify-content-end gap-2 mt-4"><button class="btn btn-outline-secondary" type="reset">Deshacer</button><button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal">Cancelar</button><button class="btn btn-primary" type="submit">Revisar y agregar</button></div></form>`, (modal, instance) => {
  const form = modal.querySelector('form'); let pending = false;
  const error = message => { const node = form.querySelector('[data-ica-error]'); node.textContent = message; node.classList.remove('d-none'); };
  form.addEventListener('change', event => {
   if (event.target.id === 'ica-code') modal.querySelector('#ica-activity-name').value = event.target.value;
   if (event.target.id === 'ica-activity-name') modal.querySelector('#ica-code').value = event.target.value;
  });
  const clearReview = () => { pending = false; form.querySelector('[data-ica-confirm]').classList.add('d-none'); form.querySelector('[type="submit"]').textContent = 'Revisar y agregar'; form.querySelector('[data-ica-error]').classList.add('d-none'); };
  form.addEventListener('input', clearReview); form.addEventListener('change', clearReview); form.addEventListener('reset', clearReview);
  modal.addEventListener('click', event => {
   if (event.target.closest('[data-ica-address]')) {
    openSharedAddressEditor({ parentModal: modal, title: 'Editar dirección del establecimiento', state: form.icaAddressState, onConfirm: (address, state) => {
     modal.querySelector('#ica-address').value = address; form.icaAddressState = state; clearReview();
    } });
   }
  });
  form.addEventListener('submit', event => {
   event.preventDefault(); if (!form.reportValidity()) return;
   const values = Object.fromEntries(new FormData(form));
   Object.keys(values).forEach(name => { values[name] = values[name].trim(); });
   if (key === 'activities' && icaData.activities.some(item => !item.end && item.code === values.code)) return error('Esta actividad económica ya está registrada.');
   if (key === 'activities' && values.type === 'P' && icaData.activities.some(item => !item.end && item.type === 'P')) return error('Ya tienes una actividad principal. Selecciona Secundaria para agregar otra actividad.');
   if (key === 'establishments' && !values.address) return error('Agrega la dirección del establecimiento antes de continuar.');
   if (key === 'establishments' && (!values.name || !values.registration)) return error('Completa la matrícula y el nombre.');
   if (key === 'establishments' && icaData.establishments.some(item => !item.end && item.registration.toLowerCase() === values.registration.toLowerCase())) return error('Ya existe un establecimiento con esta matrícula.');
   if (!pending) { pending = true; form.querySelector('[data-ica-confirm]').classList.remove('d-none'); form.querySelector('[type="submit"]').textContent = 'Confirmar y agregar'; return; }
   if (key === 'activities') values.name = icaCatalog.find(item => !item.end && item.code === values.code).name;
   icaData[key].push(values); icaTab = key;
   modal.addEventListener('hidden.bs.modal', () => icaRefresh(key === 'activities' ? 'Actividad económica agregada.' : 'Establecimiento agregado.'), { once: true }); instance.hide();
  });
 });
}
document.addEventListener('click', event => {
 const tab = event.target.closest('[data-ica-tab]'); if (tab) icaTab = tab.dataset.icaTab;
 const add = event.target.closest('[data-ica-add]'); if (add) icaAdd(add.dataset.icaAdd);
 const remove = event.target.closest('[data-ica-delete]');
 if (remove) {
  const key = remove.dataset.icaDelete; const index = Number(remove.dataset.index); const item = icaData[key][index];
  if (!item || item.end || (key === 'activities' && item.type === 'P')) return;
  const isActivity = key === 'activities';
  const label = isActivity ? 'Fecha de finalización' : 'Fecha de cierre';
  const selected = isActivity ? `${item.code} - ${item.name}` : item.registration;
  icaModal('Eliminar registro', `<form data-ica-end-form><p>Ingresa la ${label.toLocaleLowerCase('es')} para ${isActivity ? 'la actividad económica seleccionada' : 'el establecimiento seleccionado'}.</p><p class="fw-semibold">${icaEscape(selected)}</p><label class="form-label" for="ica-end-date">${label} <span class="text-danger" aria-hidden="true">*</span></label><input class="form-control" type="date" id="ica-end-date" required min="${icaEscape(item.start)}"><div class="form-text">La fecha debe ser igual o posterior a ${icaDate(item.start)}.</div><div class="d-flex justify-content-end gap-2 mt-4"><button class="btn btn-outline-secondary" data-bs-dismiss="modal" type="button">Cancelar</button><button class="btn btn-primary" type="submit" disabled>Aceptar</button></div></form>`, (modal, instance) => {
   const form = modal.querySelector('form'); const date = modal.querySelector('#ica-end-date'); const accept = form.querySelector('[type="submit"]');
   date.addEventListener('input', () => { accept.disabled = !date.checkValidity(); });
   form.addEventListener('submit', event => {
    event.preventDefault(); if (!form.reportValidity() || (key === 'activities' && item.type === 'P')) return;
    item.end = date.value; icaTab = key;
    modal.addEventListener('hidden.bs.modal', () => icaRefresh(isActivity ? 'Actividad económica finalizada.' : 'Establecimiento cerrado.'), { once: true }); instance.hide();
   });
  });
 }
});
