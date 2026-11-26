const dealerService = (() => {
	const records = [
		{ generated: '2026-07-01', reference: '26033129170', plate: 'QQY740', year: 2026, due: '2026-07-24', paid: true, amount: 711000 },
		{ generated: '2026-07-01', reference: '26033129193', plate: 'QRM976', year: 2026, due: '2026-07-24', paid: true, amount: 5179000 },
		{ generated: '2026-07-01', reference: '26033129229', plate: 'QQV731', year: 2026, due: '2026-07-24', paid: true, amount: 5473000 },
		...Array.from({ length: 12 }, (_, index) => ({
			generated: '2026-07-02',
			reference: String(26033129300 + index),
			plate: `DEQ${510 + index}`,
			year: 2026,
			due: `2026-08-${String(3 + index).padStart(2, '0')}`,
			paid: false,
			amount: 550000 + index * 175000,
		})),
	];

	return {
		async query({ start, end, paid }, { simulateError = false } = {}) {
			await new Promise((resolve) => setTimeout(resolve, 450));
			if (simulateError) throw new Error('No fue posible consultar las referencias');
			return records.filter((record) => record.paid === paid && start <= record.generated && record.generated <= end)
				.map(({ reference, plate, year, due, paid: isPaid, amount }) => [reference, plate, year, due, isPaid ? 'Pagada' : 'No pagada', amount]);
		},
	};
})();
