function renderQueryResults(target, { id, title, headers, rows, formatCell, sortValue = (cell) => cell, alignRight, unsortable = [], description = '', headingLevel = 'h3', standalone = false, view = {}, searchPlaceholder, tableClass, searchText, noMatches = '<strong class="d-block">No se encontraron coincidencias</strong>Intenta realizar la búsqueda con otros términos.' }) {
	const rightColumns = [alignRight].flat();
	const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });
	const normalize = (text) => String(text ?? '—').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
	let page = view.page ?? 1;
	let sortColumn = view.sortColumn ?? -1;
	let direction = view.direction ?? 1;
	const contentMarkup = `${description ? `<p class="small text-secondary mb-2">${description}</p>` : ''}
		${tableToolbar({ sizeId: `${id}-size`, searchId: `${id}-search`, placeholder: searchPlaceholder, searchAttributes: `aria-controls="${id}-rows"` })}
		<div id="${id}-rows"></div>`;
	target.insertAdjacentHTML('beforeend', standalone ? section(title, contentMarkup) :
		`<section class="border-top pt-3 mb-4" aria-labelledby="${id}-title">
			<${headingLevel} class="h6 fw-semibold" id="${id}-title">${title}</${headingLevel}>
			${contentMarkup}
		</section>`);
	const result = target.lastElementChild;
	if (standalone) {
		result.firstElementChild.id = `${id}-title`;
		result.setAttribute('aria-labelledby', `${id}-title`);
	}
	const search = result.querySelector('input');
	const size = result.querySelector('select');
	search.value = view.search ?? '';
	if (view.size) size.value = view.size;
	const content = result.lastElementChild;
	const searchCell = document.createElement('template');
	const searchable = searchText ? null : new Map(rows.map((row) => [row, normalize(row.map((cell, index) => {
		searchCell.innerHTML = formatCell(cell, index);
		return searchCell.content.textContent;
	}).join(' '))]));
	function update() {
		const query = normalize(search.value.trim());
		const matches = query ? rows.filter(row => (searchable ? searchable.get(row) : normalize(searchText(row))).includes(query)) : [...rows];
		if (sortColumn >= 0) matches.sort((a, b) => {
			const first = sortValue(a[sortColumn], sortColumn) ?? '—';
			const second = sortValue(b[sortColumn], sortColumn) ?? '—';
			const comparison = typeof first === 'number' && typeof second === 'number'
				? first - second
				: collator.compare(first, second);
			return comparison * direction;
		});
		const pageSize = Number(size.value);
		Object.assign(view, { page, sortColumn, direction, search: search.value, size: pageSize });
		const offset = (page - 1) * pageSize;
		const pages = Math.max(1, Math.ceil(matches.length / pageSize));
		const footer = tablePaginationFooter({
			label: title.toLowerCase(),
			summary: tablePageSummary(matches.length, offset, pageSize),
			controls: paginationControls(page, pages, (number) => `data-query-page="${number}"`),
		});
		if (!matches.length) {
			content.innerHTML = emptyState(noMatches + '<div class="mt-2"><button class="btn btn-outline-primary btn-sm" type="button" data-query-clear-search>Limpiar búsqueda</button></div>') + `<div class="mt-3">${footer}</div>`;
			return;
		}
		const heading = headers.map((label, index) => {
			if (unsortable.includes(index)) return `<th scope="col">${label}</th>`;
			const active = sortColumn === index;
			return `<th scope="col" class="${rightColumns.includes(index) ? 'text-end' : ''}" ${active ? `aria-sort="${direction === 1 ? 'ascending' : 'descending'}"` : ''}>
				<button type="button" data-query-sort="${index}" class="btn btn-link p-0 text-start text-body fw-semibold text-decoration-none d-flex align-items-center gap-2 ${rightColumns.includes(index) ? 'ms-auto' : ''}">${label}
				<i class="bi bi-caret-${active && direction === -1 ? 'down' : 'up'}-fill small ${active ? 'text-primary' : 'text-secondary opacity-50'}" aria-hidden="true"></i></button>
			</th>`;
		}).join('');
		const body = matches.slice(offset, offset + pageSize).map((row) => `<tr>${row.map((cell, index) =>
			`<td class="${rightColumns.includes(index) ? 'text-end text-nowrap' : ''}">${formatCell(cell, index)}</td>`).join('')}</tr>`).join('');
		content.innerHTML = tableFrame(heading, body, { label: title, tableClass, paginationManaged: true }) + footer;
	}
	function resetPage() {
		page = 1;
		update();
	}
	search.addEventListener('input', resetPage);
	size.addEventListener('change', resetPage);
	content.addEventListener('click', (event) => {
		const button = event.target.closest('button');
		if (!button) return;
		if (button.hasAttribute('data-query-clear-search')) {
			search.value = '';
			resetPage();
			search.focus();
		} else if (button.hasAttribute('data-query-sort')) {
			const column = Number(button.dataset.querySort);
			direction = sortColumn === column ? -direction : 1;
			sortColumn = column;
			resetPage();
			content.querySelector(`[data-query-sort="${column}"]`).focus();
		} else if (button.hasAttribute('data-query-page')) {
			page = Number(button.dataset.queryPage);
			update();
			content.querySelector('[aria-current="page"]').focus();
		}
	});
	update();
	return update;
}
