const notaryService = (() => {
	const fixtures = {
		vehiculos: [
			['2025', 'JWT71D', '2013', 'Ducati', '1199 ABS Panigale AW B', 'Moroso'],
			['2026', 'JWT71D', '2013', 'Ducati', '1199 ABS Panigale AW B', 'Moroso'],
		],
		predial: [
			['2020', 'AAA0012MOYN', '050S40156590', 'CL 18 SUR 29B 61', 'Moroso'],
			['2021', 'AAA0012MOYN', '050S40156590', 'CL 18 SUR 29B 61', 'Por pagar'],
			['2022', 'AAA0204AAHY', '050S40501568', 'KR 1 27B 64 SUR AP 201', 'Moroso'],
			['2024', 'AAA0204AAHY', '050S40501568', 'KR 1 27B 64 SUR AP 201', 'Moroso'],
			['2024', 'AAA0012MOYN', '050S40156590', 'CL 18 SUR 29B 61', 'Moroso'],
			['2025', 'AAA0204AAHY', '050S40501568', 'KR 1 27B 64 SUR AP 201', 'Moroso'],
		],
		delineacion: [
			['2017', 'CDU1451257', null, null, 'Moroso'],
			['2018', 'CDU1631236', 'AAA0078ALAF', 'CL 25D BIS A 99 65', 'Por pagar'],
			['2018', 'CDU1525085', 'AAA0035OEJH', 'CL 5A 19 43', 'Por pagar'],
			['2019', 'CDU1622840', 'AAA0125MFBS', 'CL 128A 70G 39', 'Moroso'],
			['2019', 'CDU1720076', 'AAA0013AJTD', 'CL 33 SUR 23A 34', 'Moroso'],
			['2020', 'CDU1731622', 'AAA0085MZCX', 'KR 20 71 27', 'Moroso'],
			['2021', 'CDU1532688', null, null, 'Por pagar'],
			['2022', 'CDU2212032', 'AAA0123BOCN', 'AK 52 131 34', 'Por pagar'],
		],
	};
	const objectColumns = { vehiculos: [1], predial: [1, 2], delineacion: [1, 2] };
	const demoSubjects = { CC: '1000000002', NIT: '900000002' };
	const demoPlateStatuses = { ZZZ999: 'plate-not-registered', DEM123: 'plate-no-obligations' };
	return {
		async query(criteria, { simulateError = false } = {}) {
			await new Promise((resolve) => setTimeout(resolve, 450));
			if (simulateError) throw new Error('Error simulado');
			const objectId = criteria.identifier.toUpperCase();
			const groups = criteria.mode === 'sujeto'
				? [[criteria.tax, demoSubjects[criteria.type] === criteria.identifier ? fixtures[criteria.tax] : []]]
				: Object.entries(fixtures).map(([tax, rows]) => [
					tax,
					rows.filter((row) => objectColumns[tax].some((column) => row[column] === objectId)),
				]);
			const results = groups.filter(([, rows]) => rows?.length).map(([tax, rows]) => ({
				tax,
				rows: rows.map((row) => [...row]),
			}));
			const status = criteria.mode === 'objeto' && Object.hasOwn(demoPlateStatuses, objectId)
				? demoPlateStatuses[objectId]
				: null;
			return { groups: results, status };
		},
	};
})();
