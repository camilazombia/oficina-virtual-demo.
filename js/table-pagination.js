function paginationControls(page, pages, attributes = () => '', visiblePages = [...new Set([1, page - 1, page, page + 1, pages])].filter((number) => number >= 1 && number <= pages).sort((a, b) => a - b)) {
	const button = (label, target, disabled = false, active = false) =>
		`<li class="page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}"><button class="page-link" type="button" ${attributes(target)} ${disabled ? 'disabled' : ''} ${active ? 'aria-current="page"' : ''}>${label}</button></li>`;
	const numbers = visiblePages.map((number, index) => {
		const gap = index > 0 && number - visiblePages[index - 1] > 1;
		return `${gap ? '<li class="page-item disabled"><span class="page-link">…</span></li>' : ''}${button(number, number, false, number === page)}`;
	}).join('');
	return button('Anterior', page - 1, page === 1) + numbers + button('Siguiente', page + 1, page === pages);
}

function tableToolbar({ sizeId, searchId, placeholder = 'Buscar en los resultados.', searchLabel = 'Buscar en los resultados', selected = 10, sizes = [10, 20, 30], sizeAttributes = '', searchAttributes = '' }) {
	return `<div class="row g-3 align-items-center mb-4">
		<div class="col-12 col-md-auto d-flex align-items-center gap-2">
			<label class="form-label small fw-semibold text-secondary mb-0" for="${sizeId}">Mostrar</label>
			<select class="form-select form-select-sm w-auto" id="${sizeId}" aria-label="Datos por página" ${sizeAttributes}>${sizes.map((value) => `<option ${value === selected ? 'selected' : ''}>${value}</option>`).join('')}</select>
			<span class="small text-secondary">registros por página</span>
		</div>
		<div class="col-12 col-md-5 ms-md-auto d-flex align-items-center gap-2">
			<label class="form-label small fw-semibold text-secondary mb-0" for="${searchId}">Buscar</label>
			<div class="input-group input-group-sm">
				<span class="input-group-text bg-white"><i class="bi bi-search" aria-hidden="true"></i></span>
				<input class="form-control" type="search" id="${searchId}" aria-label="${searchLabel}" placeholder="${placeholder}" ${searchAttributes}>
			</div>
		</div>
	</div>`;
}

function tablePaginationFooter({ label, summary = '', controls = '', summaryAttributes = '', paginationAttributes = '' }) {
	return `<div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2">
		<p class="small text-secondary mb-0" aria-live="polite" ${summaryAttributes}>${summary}</p>
		<nav aria-label="Paginación de ${label}">
			<ul class="pagination pagination-sm flex-wrap mb-0" ${paginationAttributes}>${controls}</ul>
		</nav>
	</div>`;
}

function tablePageSummary(total, start, size) {
	return total ? `Mostrando ${start + 1}–${Math.min(start + size, total)} de ${total} resultados.` : '0 resultados.';
}

function observeTablePagination() {
	const enhanced = new WeakSet();
	let nextId = 0;
	const selector = 'table.app-table:not([data-pagination-managed])';
	const normalize = (value) => value.toLocaleLowerCase('es').normalize('NFD').replace(/\p{M}/gu, '');

	function enhance(table) {
		if (enhanced.has(table)) return;
		const frame = table.parentElement;
		if (!frame?.classList.contains('app-table-container') || !table.tBodies.length) return;
		const id = `table-pagination-${++nextId}`;
		const label = frame.getAttribute('aria-label') || table.caption?.textContent.trim() || 'resultados';
		frame.insertAdjacentHTML('beforebegin', tableToolbar({ sizeId: `${id}-size`, searchId: `${id}-search` }));
		const size = document.getElementById(`${id}-size`);
		const search = document.getElementById(`${id}-search`);
		frame.insertAdjacentHTML('afterend', tablePaginationFooter({ label: 'resultados', summaryAttributes: `id="${id}-summary"`, paginationAttributes: `id="${id}-pages"` }));
		const summary = document.getElementById(`${id}-summary`);
		const pagination = document.getElementById(`${id}-pages`);
		pagination.parentElement.setAttribute('aria-label', `Paginación de ${label.toLocaleLowerCase('es')}`);
		const columns = table.tHead?.rows[0]?.cells.length || 1;
		const empty = table.tBodies[0].insertRow();
		empty.dataset.paginationEmpty = '';
		const cell = empty.insertCell();
		cell.colSpan = columns;
		cell.className = 'text-center text-secondary py-4';
		cell.textContent = 'No se encontraron coincidencias.';
		let page = 1;

		function render(reset = false) {
			const query = normalize(search.value.trim());
			const rows = [...table.tBodies].flatMap((body) => [...body.rows]).filter((row) =>
				!row.matches('[data-pagination-empty]') && (row.cells.length > 1 || (columns === 1 && !row.cells[0]?.hasAttribute('colspan'))));
			const matches = rows.filter((row) => normalize(row.textContent).includes(query));
			const pageSize = Number(size.value);
			const totalPages = Math.max(1, Math.ceil(matches.length / pageSize));
			page = reset ? 1 : Math.min(page, totalPages);
			const first = (page - 1) * pageSize;
			const visible = new Set(matches.slice(first, first + pageSize));
			rows.forEach((row) => { row.hidden = !visible.has(row); });
			empty.hidden = !rows.length || matches.length > 0;
			summary.textContent = tablePageSummary(matches.length, first, pageSize);
			pagination.innerHTML = paginationControls(page, totalPages, (number) => `data-table-page="${number}"`);
		}

		enhanced.add(table);
		size.addEventListener('change', () => render(true));
		search.addEventListener('input', () => render(true));
		table.addEventListener('table-sorted', () => render(true));
		pagination.addEventListener('click', (event) => {
			const button = event.target.closest('[data-table-page]');
			if (!button || button.disabled) return;
			page = Number(button.dataset.tablePage);
			render();
			pagination.querySelector('[aria-current="page"]')?.focus();
		});
		render();
	}

	document.querySelectorAll(selector).forEach(enhance);
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (node.nodeType !== Node.ELEMENT_NODE || !node.isConnected) continue;
				if (node.matches(selector)) enhance(node);
				node.querySelectorAll(selector).forEach(enhance);
			}
		}
	}).observe(document.body, { childList: true, subtree: true });
}

