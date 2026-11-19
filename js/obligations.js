const pendingObligations = [
    ['2023', 'CHIP REF-DEMO-124', 'Omiso', 'IMP + SN', 'N/A', 'N/A', 'N/A', 'N/A', '$2.100.000', '$2.050.000', '$2.100.000', 'Predio urbano', 'N/A', 'N/A'],
    ['2022', 'Placa DEM354', 'Omiso', 'IMP + SN (acto)', '00000147', '000149', 'Acto administrativo', 'REF-DEMO-128', '$3.400.000', '$3.350.000', '$3.400.000', 'Vehículo particular', 'N/A', 'N/A'],
    ['2021', 'CHIP REF-DEMO-125', 'Moroso', 'IMP + SN (Decl.)', '00000146', '000141', 'Declaración', 'REF-DEMO-123', '$4.200.000', '$4.100.000', '$4.200.000', 'Predio rural', 'REF-DEMO-129', 'N/A'],
    ['2020', 'Placa DEM375', 'Moroso', 'IMP + SN (Decl.)', '00000145', '000139', 'Declaración', 'REF-DEMO-122', '$5.600.000', '$5.550.000', '$5.600.000', 'Vehículo oficial', 'N/A', 'REF-DEMO-130'],
    ['2019', 'CHIP REF-DEMO-126', 'Moroso', 'IMP + SN (acto)', '00000140', '000148', 'Acto firme', 'REF-DEMO-127', '$6.800.000', '$6.750.000', '$6.800.000', 'Predio comercial', 'N/A', 'REF-DEMO-130']
];

function pendingObligationAction(label, index) {
    return `<button class="btn btn-outline-primary btn-sm px-3 text-nowrap" type="button" data-obligation-action="${label}" data-obligation-index="${index}">${label}</button>`;
}

function renderPendingObligations({ multipleRop = false } = {}) {
    const fields = [
        'Año gravable', 'Objeto', 'Estado de obligación', 'Obligación', 'Factura', 'Referencia',
        'Tipo de documento', 'Número de documento', 'Total con aporte', 'Total sin aporte',
        'Total a pagar', 'Objeto contrato', 'ROP Individual', 'ROP Multipago'
    ];
    const headers = fields.map(label => `<th scope="col">${label}</th>`).join('');
    const actionHeaders = ['Declarar', 'Generar ROP', 'Pagar', 'Cupones']
        .map(label => `<th scope="col" data-table-sort-ready="true">${label}</th>`).join('');
    const rows = pendingObligations.map((row, index) => {
        const [year, object, status] = row;
        const omitted = status === 'Omiso';
        const selectable = !multipleRop || !omitted;
        const cells = [
            year, object, tableBadge(status, omitted ? 'info' : 'danger'), ...row.slice(3),
            omitted ? pendingObligationAction('Declarar', index) : '—',
            omitted ? '—' : pendingObligationAction('Generar ROP', index),
            row[12] === 'N/A' ? '—' : pendingObligationAction('Pagar', index),
            'N/A'
        ];
        return `<tr>
            <td class="position-sticky start-0 z-1 bg-white border-end px-3">${selectable ? `<input class="form-check-input m-0" type="checkbox" ${multipleRop ? `data-rop-selection="${index}"` : ''} aria-label="Seleccionar obligación de ${object}, año ${year}">` : ''}</td>
            ${cells.map(cell => `<td>${cell}</td>`).join('')}
        </tr>`;
    }).join('');

    const title = multipleRop ? 'Facilidades de pago' : 'Consulta de obligaciones';
    const tableHeaders = `<th class="position-sticky start-0 z-1 border-end px-3" scope="col" data-table-sort-ready="true"><span class="visually-hidden">Seleccionar</span></th>${headers}${actionHeaders}`;
    const results = tableFrame(tableHeaders, rows, { label: multipleRop ? title : 'Obligaciones pendientes', tableClass: 'text-nowrap' });
    const pagination = `<nav aria-label="Paginación de obligaciones">
            <ul class="pagination pagination-sm flex-wrap justify-content-center mb-0">${paginationControls(1, 1)}</ul>
        </nav>`;
    const content = `
        <section class="bg-white border rounded-3 p-3 p-md-4 mb-4" aria-labelledby="obligation-results-title">
            <h2 class="h5 mb-4" id="obligation-results-title">${multipleRop ? 'Obligaciones para ROP múltiple' : 'Obligaciones pendientes'}</h2>
            ${results}
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <p class="small text-secondary mb-0">Total: ${pendingObligations.length} obligaciones</p>
                ${pagination}
            </div>
        </section>`;
    return `${pageTitle(`<span id="obligations-title">${title}</span>`, 'Consulta el detalle de tus obligaciones pendientes y realiza las acciones disponibles según el tipo de caso.')}
        <div id="obligation-feedback" role="status"></div>
        ${content}
        ${multipleRop ? `<div id="rop-selection-actions" class="sticky-bottom d-none flex-wrap align-items-center justify-content-between gap-3 bg-body border-top p-3 mt-4">
            <span id="rop-selection-count" class="fw-semibold" role="status"></span>
            <div class="d-flex flex-wrap gap-2">
                <button class="btn btn-outline-primary rounded-pill" type="button" data-rop-clear>Limpiar selección</button>
                <button class="btn btn-primary rounded-pill" type="button" data-rop-review aria-haspopup="dialog" disabled>Generar ROP múltiple</button>
            </div>
        </div>` : ''}`;
}

function updateRopSelection() {
    const actions = document.getElementById('rop-selection-actions');
    const count = document.querySelectorAll('[data-rop-selection]:checked').length;
    actions.classList.toggle('d-none', count === 0);
    actions.classList.toggle('d-flex', count > 0);
    actions.querySelector('#rop-selection-count').textContent = count === 1
        ? '1 obligación seleccionada' : `${count} obligaciones seleccionadas`;
    actions.querySelector('[data-rop-review]').disabled = count < 2;
}

function showRopReview(trigger) {
    const rows = [...document.querySelectorAll('[data-rop-selection]:checked')]
        .map(input => pendingObligations[Number(input.dataset.ropSelection)]);
    if (rows.length < 2) return;

    const headers = ['Año', 'Impuesto', 'Objeto', 'Tipo de documento', 'Número de documento', 'Total a pagar'];
    const summary = rows.map(([year, object, , , , , type, number, , , amount]) =>
        [year, object.startsWith('CHIP') ? 'Predial' : 'Vehicular', object, type, number, amount]
    );
    const total = rows.reduce((sum, row) => sum + Number(row[10].replace(/\D/g, '')), 0);
    const formattedTotal = '$' + new Intl.NumberFormat('es-CO').format(total);
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.tabIndex = -1;
    modal.setAttribute('aria-labelledby', 'rop-review-title');
    modal.innerHTML = `<div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title h5 text-primary" id="rop-review-title">Generar ROP múltiple</h2>
                <button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
                <p>Se creará una orden de pago única que agrupa las obligaciones seleccionadas. Verifica la información antes de continuar.</p>
                <div class="table-responsive app-table-container mb-3" tabindex="0" role="region" aria-label="Obligaciones seleccionadas">
                    <table class="table app-table table-hover align-middle text-nowrap mb-0">
                        <thead class="table-light"><tr>${headers.map(label => `<th scope="col" data-table-sort-ready="true">${label}</th>`).join('')}</tr></thead>
                        <tbody>${summary.map(row => `<tr>${row.map(value => `<td>${value}</td>`).join('')}</tr>`).join('')}</tbody>
                    </table>
                </div>
                <div class="alert alert-primary d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <span>Total consolidado a pagar</span><strong class="fs-4">${formattedTotal}</strong>
                </div>
                <p class="fw-semibold mb-0">Al confirmar, se generará un ROP múltiple (ROP padre) asociado a estas obligaciones. Luego podrás realizar el pago en línea.</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline-primary rounded-pill" type="button" data-bs-dismiss="modal">Cancelar</button>
                <button class="btn btn-primary rounded-pill" type="button" data-rop-confirm>Generar ROP múltiple</button>
            </div>
        </div>
    </div>`;
    document.body.append(modal);
    const instance = new bootstrap.Modal(modal);
    modal.querySelector('[data-rop-confirm]').addEventListener('click', () => {
        modal.querySelector('.modal-body').innerHTML = '<p class="alert alert-info mb-0" role="status">La generación del ROP múltiple y el pago en línea todavía no están disponibles en la consulta de ejemplo.</p>';
        modal.querySelector('.modal-footer').innerHTML = '<button class="btn btn-primary rounded-pill" type="button" data-bs-dismiss="modal">Cerrar</button>';
        modal.querySelector('.modal-footer button').focus();
    });
    modal.addEventListener('hidden.bs.modal', () => {
        instance.dispose();
        modal.remove();
        if (trigger.isConnected) trigger.focus();
    }, { once: true });
    instance.show();
}

document.addEventListener('change', event => {
    if (event.target.matches('[data-rop-selection]')) updateRopSelection();
});

document.addEventListener('click', event => {
    if (event.target.closest('[data-rop-clear]')) {
        const selections = document.querySelectorAll('[data-rop-selection]:checked');
        selections.forEach(input => { input.checked = false; });
        updateRopSelection();
        selections[0]?.focus();
        return;
    }
    const review = event.target.closest('[data-rop-review]');
    if (review) {
        showRopReview(review);
        return;
    }

    const button = event.target.closest('[data-obligation-action]');
    if (!button) return;

    const [year, object] = pendingObligations[Number(button.dataset.obligationIndex)];
    const feedback = document.getElementById('obligation-feedback');
    feedback.className = 'alert alert-info';
    feedback.textContent = `${button.dataset.obligationAction} · ${object} · Año ${year}. Esta acción todavía no está disponible en la consulta de ejemplo.`;
    feedback.scrollIntoView({ block: 'nearest' });
});
