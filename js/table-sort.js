// Ordenamiento compartido para tablas, incluidas las cargadas en pestañas y modales.
(() => {
	const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });
	function enhanceTables() {
		document.querySelectorAll('table thead th').forEach((header) => {
			if (header.querySelector('button, a, input') || header.dataset.tableSortReady) return;
			header.dataset.tableSortReady = 'true';
			if (/^(acciones|seleccionar|imprimir)$/i.test(header.textContent.trim())) return;
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'btn btn-link p-0 text-start text-body fw-semibold text-decoration-none d-flex align-items-center gap-2';
			button.dataset.tableSort = '';
			button.append(...header.childNodes);
			const icon = document.createElement('i');
			icon.className = 'bi bi-caret-up-fill small text-secondary opacity-50';
			icon.setAttribute('aria-hidden', 'true');
			button.append(icon);
			header.append(button);
		});
	}
	document.addEventListener('click', (event) => {
		const button = event.target.closest('[data-table-sort]');
		if (!button) return;
		const header = button.closest('th');
		const table = header.closest('table');
		const direction = header.getAttribute('aria-sort') === 'ascending' ? -1 : 1;
		const value = (row) => {
			const text = row.cells[header.cellIndex]?.textContent.trim() || '';
			const date = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
			return date ? `${date[3]}-${date[2]}-${date[1]}` : text;
		};
		[...table.tBodies].forEach((body) => {
			const groups = [];
			const emptyRows = [];
			[...body.rows].forEach((row) => {
				if (row.hasAttribute('data-pending-declaration-details')) {
					groups.at(-1)?.push(row);
				} else if (row.cells.length === 1 && row.cells[0].colSpan > 1) {
					emptyRows.push(row);
				} else groups.push([row]);
			});
			groups.sort((a, b) => collator.compare(value(a[0]), value(b[0])) * direction);
			body.append(...groups.flat(), ...emptyRows);
		});
		table.querySelectorAll('thead th').forEach((item) => {
			if (item.closest('table') !== table) return;
			item.removeAttribute('aria-sort');
			const icon = item.querySelector('[data-table-sort] i');
			if (icon) icon.className = 'bi bi-caret-up-fill small text-secondary opacity-50';
		});
		header.setAttribute('aria-sort', direction === 1 ? 'ascending' : 'descending');
		button.querySelector('i').className = `bi bi-caret-${direction === 1 ? 'up' : 'down'}-fill small text-primary`;
		const registered = table.closest('[data-registered-tax]');
		if (registered) filterRegisteredTaxes(registered.dataset.registeredTax, true);
		if (table.id === 'pending-declarations-table') filterPendingDeclarations(true);
		if (table.id === 'predialPropertiesTable') filterPredialProperties();
	});
	new MutationObserver(enhanceTables).observe(document.body, { childList: true, subtree: true });
	enhanceTables();
})();
