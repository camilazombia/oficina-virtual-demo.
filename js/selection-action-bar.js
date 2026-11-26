function mountSelectionActionBar(target, {
	singular, plural, primaryLabel, secondaryLabel = 'Limpiar selección', onClear, onPrimary, opensDialog = false,
}) {
	target.insertAdjacentHTML('beforeend', `<div data-selection-actions hidden>
		<section class="selection-action-bar fixed-bottom" role="region" aria-label="Acciones de selección">
			<div class="container d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 px-3 py-3">
				<div aria-live="polite" aria-atomic="true">
					<p class="fw-semibold mb-0" data-selection-count></p>
					<p class="small mb-0" data-selection-total hidden></p>
					<p class="small text-secondary mb-0" data-selection-info hidden></p>
				</div>
				<div class="d-flex flex-wrap justify-content-sm-end gap-2">
					<button class="btn btn-outline-primary" type="button" data-selection-clear>${secondaryLabel}</button>
					<button class="btn btn-primary px-sm-4" type="button" data-selection-primary${opensDialog ? ' aria-haspopup="dialog"' : ''}>${primaryLabel}</button>
				</div>
			</div>
		</section>
		<div aria-hidden="true" data-selection-spacer></div>
	</div>`);
	const element = target.lastElementChild;
	const bar = element.querySelector('section');
	const spacer = element.querySelector('[data-selection-spacer]');
	const counter = element.querySelector('[data-selection-count]');
	const total = element.querySelector('[data-selection-total]');
	const info = element.querySelector('[data-selection-info]');
	const clear = element.querySelector('[data-selection-clear]');
	const primary = element.querySelector('[data-selection-primary]');
	const main = target.closest('main');
	function syncLayout() {
		if (main) {
			const { left, width } = main.getBoundingClientRect();
			bar.style.left = left + 'px';
			bar.style.width = width + 'px';
		}
		spacer.style.height = bar.offsetHeight + 'px';
	}
	const sizeObserver = new ResizeObserver(() => {
		if (!element.isConnected) {
			sizeObserver.disconnect();
			return;
		}
		syncLayout();
	});
	clear.addEventListener('click', onClear);
	primary.addEventListener('click', () => onPrimary(primary));

	function update({
		count, countText = count + ' ' + (count === 1 ? singular : plural), totalText = '', infoText = '',
		disabled = false, clearDisabled = false, busy = false, loadingLabel = 'Procesando…',
	}) {
		element.hidden = count === 0;
		counter.textContent = countText;
		total.textContent = totalText;
		total.hidden = !totalText;
		info.textContent = infoText;
		info.hidden = !infoText;
		primary.disabled = disabled || busy;
		clear.disabled = clearDisabled || busy;
		primary.setAttribute('aria-busy', String(busy));
		primary.innerHTML = busy ? '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>' + loadingLabel : primaryLabel;
		syncLayout();
		if (element.hidden) {
			sizeObserver.disconnect();
		} else {
			sizeObserver.observe(bar);
			if (main) sizeObserver.observe(main);
		}
	}

	return { update };
}
