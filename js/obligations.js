const pendingObligations = [
    ['2023', 'CHIP 50N-12345', 'Omiso', 'IMP + SN', 'N/A', 'N/A', 'N/A', 'N/A', '$2.100.000', '$2.050.000', '$2.100.000', 'Predio urbano', 'N/A', 'N/A'],
    ['2022', 'Placa ABC123', 'Omiso', 'IMP + SN (acto)', '80012345', '998877', 'Acto administrativo', 'EE-2022-4589', '$3.400.000', '$3.350.000', '$3.400.000', 'Vehículo particular', 'N/A', 'N/A'],
    ['2021', 'CHIP 70M-88991', 'Moroso', 'IMP + SN (Decl.)', '70099811', '554433', 'Declaración', '2021-DECL-3344', '$4.200.000', '$4.100.000', '$4.200.000', 'Predio rural', 'ROP-77881', 'N/A'],
    ['2020', 'Placa XYZ789', 'Moroso', 'IMP + SN (Decl.)', '66554433', '112299', 'Declaración', '2020-DECL-9988', '$5.600.000', '$5.550.000', '$5.600.000', 'Vehículo oficial', 'N/A', 'ROPM-1002'],
    ['2019', 'CHIP 88K-33221', 'Moroso', 'IMP + SN (acto)', '44556677', '889900', 'Acto firme', 'EE-2019-1122', '$6.800.000', '$6.750.000', '$6.800.000', 'Predio comercial', 'N/A', 'ROPM-1002']
];

function pendingObligationAction(label, index) {
    return `<button class="btn btn-outline-primary btn-sm px-3 text-nowrap" type="button" data-obligation-action="${label}" data-obligation-index="${index}">${label}</button>`;
}

function renderPendingObligations({ multipleRop = false, matches, resultsOnly = false } = {}) {
    const fields = [
        'Año gravable', 'Objeto', 'Estado de obligación', 'Obligación', 'Factura', 'Referencia',
        'Tipo de documento', 'Número de documento', 'Total con aporte', 'Total sin aporte',
        'Total a pagar', 'Objeto contrato', 'ROP Individual', 'ROP Multipago'
    ];
    const headers = fields.map(label => `<th scope="col">${label}</th>`).join('');
    const actionHeader = '<th scope="col" data-table-sort-ready="true">Acciones</th>';
    const rows = pendingObligations.map((row, index) => {
        if (matches && !matches.includes(index)) return '';
        const [year, , status] = row;
        const object = pendingObligationObject(index);
        const omitted = status === 'Omiso';
        const selectable = !multipleRop || !omitted;
        const cells = [year, object, tableBadge(status, omitted ? 'info' : 'danger'), ...row.slice(3)];
        const actions = [pendingObligationAction(omitted ? 'Declarar' : 'Generar ROP', index),
            ...(row[12] === 'N/A' ? [] : [pendingObligationAction('Pagar', index)])];
        return `<tr>
            <td class="position-sticky start-0 z-1 bg-white border-end px-3">${selectable ? `<input class="form-check-input m-0" type="checkbox" ${multipleRop ? `data-rop-selection="${index}"` : ''} aria-label="Seleccionar obligación de ${object}, año ${year}">` : ''}</td>
            ${cells.map(cell => `<td>${cell}</td>`).join('')}
            <td><div class="d-inline-flex align-items-center flex-nowrap gap-2 text-nowrap">${actions.join('')}</div></td>
        </tr>`;
    }).join('');

    const title = multipleRop ? 'Facilidades de pago' : 'Consulta de obligaciones';
    const tableHeaders = `<th class="position-sticky start-0 z-1 border-end px-3" scope="col" data-table-sort-ready="true"><span class="visually-hidden">Seleccionar</span></th>${headers}${actionHeader}`;
    const results = tableFrame(tableHeaders, rows, { label: multipleRop ? title : 'Obligaciones pendientes', tableClass: 'text-nowrap' });
    const content = `
        <section class="bg-white border rounded-3 p-3 p-md-4 mb-4" aria-labelledby="obligation-results-title">
            <h2 class="h5 mb-4" id="obligation-results-title">${multipleRop ? 'Obligaciones para ROP múltiple' : 'Obligaciones pendientes'}</h2>
            ${results}
        </section>`;
    const resultsContent = `<div id="obligation-feedback" role="status"></div>${content}
        ${multipleRop ? '<div data-legacy-rop-selection></div>' : ''}`;
    if (resultsOnly) return resultsContent;
    return `${pageTitle(`<span id="obligations-title">${title}</span>`, 'Consulta el detalle de tus obligaciones pendientes y realiza las acciones disponibles según el tipo de caso.')}
        ${taxpayerSession ? section('Consultar obligaciones', taxpayerQueryForm('taxpayer-obligations', {
            taxes: taxpayerSession.requiresObject ? taxpayerTaxes : [['todos', 'Todos los impuestos'], ...taxpayerTaxes],
        })) : resultsContent}`;
}

const taxpayerObligationObjects = [
    ['predial', taxpayerHomeObjects.predial], ['vehiculos', taxpayerHomeObjects.vehiculos[0]],
    ['predial', taxpayerHomeObjects.predial], ['vehiculos', taxpayerHomeObjects.vehiculos[0]],
    ['predial', 'AAA0000XRYX']
];

function pendingObligationObject(index) {
    const [tax, identifier] = taxpayerObligationObjects[index];
    return taxpayerSession ? `${tax === 'predial' ? 'CHIP' : 'Placa'} ${identifier}` : pendingObligations[index][1];
}

function mountTaxpayerObligations(multipleRop) {
    mountTaxpayerQuery('taxpayer-obligations', query => taxpayerObligationObjects.flatMap(([tax, object], index) =>
        matchesTaxpayerQuery(query, tax, object) ? [index] : []
    ), (target, matches) => {
        target.innerHTML = renderPendingObligations({ multipleRop, matches, resultsOnly: true });
        mountLegacyRopSelection(target);
    }, { initial: true });
}

function mountLegacyRopSelection(root) {
    const host = root.querySelector('[data-legacy-rop-selection]');
    if (!host) return;
    const selected = () => [...root.querySelectorAll('[data-rop-selection]:checked')];
    const bar = mountSelectionActionBar(host, {
        singular: 'obligación seleccionada', plural: 'obligaciones seleccionadas',
        primaryLabel: 'Generar ROP m?ltiple', opensDialog: true,
        onClear() {
            const inputs = selected();
            inputs.forEach(input => { input.checked = false; });
            update();
            inputs[0]?.focus();
        },
        onPrimary: trigger => showRopReview(trigger, selected()),
    });
    function update() {
        const rows = selected();
        const total = rows.reduce((sum, input) => sum + Number(pendingObligations[input.dataset.ropSelection][10].replace(/\D/g, '')), 0);
        bar.update({ count: rows.length, disabled: rows.length < 2, totalText: 'Total seleccionado: $' + billingAmount.format(total) });
    }
    root.querySelectorAll('[data-rop-selection]').forEach(input => input.addEventListener('change', update));
}

function showRopReview(trigger, selected) {
    const rows = selected
        .map(input => {
            const index = Number(input.dataset.ropSelection);
            const row = [...pendingObligations[index]];
            row[1] = pendingObligationObject(index);
            return row;
        });
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
        modal.querySelector('.modal-body').innerHTML = '<p class="alert alert-info mb-0" role="status">La generación del ROP múltiple y el pago en línea todavía no están disponibles.</p>';
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

document.addEventListener('click', event => {
    const button = event.target.closest('[data-obligation-action]');
    if (!button) return;

    const index = Number(button.dataset.obligationIndex);
    const [year] = pendingObligations[index];
    const object = pendingObligationObject(index);
    const feedback = document.getElementById('obligation-feedback');
    feedback.className = 'alert alert-info';
    feedback.textContent = `${button.dataset.obligationAction} · ${object} · Año ${year}. Esta acción todavía no está disponible.`;
    feedback.scrollIntoView({ block: 'nearest' });
});
