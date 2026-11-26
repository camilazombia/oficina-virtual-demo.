// Shared presentation for row actions, including tables rendered after a query.
(() => {
	const actions = [
		[/^ver\b/, 'eye', 'outline-primary'],
		[/^(editar|modificar|actualizar)\b/, 'pencil', 'outline-primary'],
		[/^descargar\b/, 'download', 'outline-primary'],
		[/^eliminar\b/, 'trash', 'outline-danger'],
		[/^finalizar\b/, 'calendar-check', 'outline-primary'],
		[/^agregar\b/, 'plus-lg', 'primary'],
		[/^imprimir\b/, 'printer', 'outline-primary'],
		[/^pagar\b/, 'currency-dollar', 'primary'],
		[/^(generar|declarar)\b/, 'file-earmark-text', 'primary'],
		[/^consultar\b/, 'search', 'outline-primary'],
		[/^(solicitar beneficio|obtener descuento)\b/, 'percent', 'outline-primary'],
		[/^limpiar seleccion\b/, 'arrow-counterclockwise', 'outline-secondary'],
		[/^cancelar\b/, 'x-lg', 'outline-secondary'],
		[/^anexos\b/, 'paperclip', 'outline-primary'],
		[/^sin accion\b/, 'dash-circle', 'outline-secondary'],
	];

	function styleAction(control) {
		const label = (control.dataset.tableAction || control.textContent.trim())
			.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
		const match = actions.find(([pattern]) => pattern.test(label));
		control.classList.remove('btn-lg', 'px-3', 'p-0', 'border-0', 'w-100', 'flex-grow-1');
		control.classList.add('table-action', 'btn-sm', 'd-inline-flex', 'align-items-center', 'flex-nowrap', 'text-nowrap', 'flex-shrink-0');
		if (match) {
			for (const name of [...control.classList]) {
				if (/^btn-(?:outline-)?(?:primary|secondary|danger|dark|light|link|success|warning|info)$/.test(name)) {
					control.classList.remove(name);
				}
			}
			control.classList.add('btn-' + match[2]);
		}

		const existing = control.querySelector(':scope > .bi');
		const spinner = control.querySelector(':scope > .spinner-border');
		if (spinner) {
			existing?.remove();
			spinner.classList.remove('me-1', 'me-2');
			return;
		}
		const icon = existing || document.createElement('i');
		icon.className = match ? 'bi bi-' + match[1] : [...icon.classList].filter(name => /^bi(?:-|$)/.test(name)).join(' ') || 'bi bi-arrow-right';
		icon.setAttribute('aria-hidden', 'true');
		if (icon !== control.firstChild) control.prepend(icon);
	}

	function enhance(table) {
		const headers = table.tHead?.rows[0]?.cells || [];
		for (const header of headers) {
			if (/^(acción|acciones|imprimir|presentar declaración)$/i.test(header.textContent.trim())) {
				header.classList.add('table-actions-column');
			}
		}
		for (const body of table.tBodies) {
			for (const row of body.rows) {
				for (const cell of row.cells) {
					if (cell.colSpan === 1 && headers[cell.cellIndex]?.classList.contains('table-actions-column')) {
						cell.classList.add('table-actions-column');
					}
					for (const control of cell.querySelectorAll('button.btn, a.btn')) {
						if (control.closest('td, th') === cell) styleAction(control);
					}
				}
			}
		}
	}

	document.querySelectorAll('table').forEach(enhance);
	new MutationObserver(records => {
		const tables = new Set();
		for (const { target, addedNodes } of records) {
			const parent = target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;
			const table = parent?.closest('table');
			if (table) tables.add(table);
			for (const node of addedNodes) {
				if (node.nodeType !== Node.ELEMENT_NODE) continue;
				if (node.matches('table')) tables.add(node);
				node.querySelectorAll('table').forEach(item => tables.add(item));
			}
		}
		tables.forEach(table => { if (table.isConnected) enhance(table); });
	}).observe(document.body, { childList: true, characterData: true, subtree: true });
})();
