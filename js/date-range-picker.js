function formatQueryDate(value) {
	return value.split('-').reverse().join('/');
}

function bindDateRangePicker(root, onChange) {
	const toggle = root.querySelector('[data-range-toggle]');
	const calendar = root.querySelector('[data-range-calendar]');
	const days = root.querySelector('[data-range-days]');
	const month = root.querySelector('[data-range-month]');
	const hint = root.querySelector('[data-range-hint]');
	const error = root.querySelector('[data-range-error]');
	const monthFormat = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' });
	const dayFormat = new Intl.DateTimeFormat('es-CO', { dateStyle: 'full', timeZone: 'UTC' });
	const today = new Date();
	const initialDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
	const toISO = (date) => date.toISOString().slice(0, 10);
	let active = initialDay;
	let start = '';
	let end = '';

	function refresh() {
		toggle.querySelector('[data-range-value]').textContent = end
			? `${formatQueryDate(start)} – ${formatQueryDate(end)}`
			: start ? `${formatQueryDate(start)} – …` : 'Selecciona un rango de fechas';
		hint.textContent = start && !end ? 'Selecciona la fecha final.' : 'Selecciona la fecha inicial.';
	}

	function renderDays(focus = false) {
		const year = active.getUTCFullYear();
		const index = active.getUTCMonth();
		const first = new Date(Date.UTC(year, index, 1));
		const length = new Date(Date.UTC(year, index + 1, 0)).getUTCDate();
		month.textContent = monthFormat.format(active);
		days.innerHTML = '<span aria-hidden="true"></span>'.repeat((first.getUTCDay() + 6) % 7);
		for (let day = 1; day <= length; day++) {
			const date = new Date(Date.UTC(year, index, day));
			const value = toISO(date);
			const edge = value === start || value === end;
			const inRange = edge || Boolean(end && start < value && value < end);
			const tone = edge ? 'btn-primary' : inRange ? 'bg-primary-subtle text-primary-emphasis' : 'btn-light';
			days.insertAdjacentHTML('beforeend', `<button type="button" class="btn btn-sm p-1 ${tone}" data-range-day="${value}" tabindex="${day === active.getUTCDate() ? '0' : '-1'}" aria-label="${dayFormat.format(date)}" aria-pressed="${inRange}" ${value === toISO(initialDay) ? 'aria-current="date"' : ''}>${day}</button>`);
		}
		if (focus) days.querySelector('[tabindex="0"]')?.focus();
	}

	function show(open, focus = true) {
		calendar.hidden = !open;
		toggle.setAttribute('aria-expanded', String(open));
		if (open) renderDays(focus);
		else if (focus) toggle.focus();
	}

	function setError(message = '') {
		error.textContent = message;
		error.classList.toggle('d-block', Boolean(message));
		toggle.setAttribute('aria-invalid', String(Boolean(message)));
	}

	function clear() {
		start = end = '';
		active = initialDay;
		setError();
		refresh();
		onChange();
	}

	toggle.addEventListener('click', () => show(calendar.hidden));
	root.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && !calendar.hidden) {
			event.preventDefault();
			show(false);
		}
		const button = event.target.closest('[data-range-day]');
		const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
		if (!button || !Object.hasOwn(steps, event.key)) return;
		event.preventDefault();
		active = new Date(`${button.dataset.rangeDay}T00:00:00Z`);
		active.setUTCDate(active.getUTCDate() + steps[event.key]);
		renderDays(true);
	});
	calendar.addEventListener('click', (event) => {
		const button = event.target.closest('button');
		if (!button) return;
		if (button.hasAttribute('data-range-clear')) {
			clear();
			show(false);
		} else if (button.hasAttribute('data-range-step')) {
			active = new Date(Date.UTC(active.getUTCFullYear(), active.getUTCMonth() + Number(button.dataset.rangeStep), 1));
			renderDays();
		} else if (button.hasAttribute('data-range-day')) {
			const value = button.dataset.rangeDay;
			active = new Date(`${value}T00:00:00Z`);
			if (start && !end && value < start) {
				setError('La fecha final no puede ser anterior a la fecha inicial.');
				return;
			}
			setError();
			if (start && !end) end = value;
			else {
				start = value;
				end = '';
			}
			refresh();
			onChange();
			show(!end);
		}
	});
	refresh();
	return {
		get value() { return { start, end }; },
		reset() { clear(); show(false, false); },
	};
}
