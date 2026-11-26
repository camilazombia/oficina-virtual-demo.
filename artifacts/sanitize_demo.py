from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
paths = [root / 'index.html', *list((root / 'js').glob('*.js')), *list((root / 'tests').glob('*.cjs'))]
replacements = {
    'MARIA': 'PERSONA', 'CRISTINA': 'DE', 'VARGAS': 'PRUEBA', 'SALAS': 'DEMO',
    '41618060': '1000000001', '1975-06-23': '2000-01-01',
    '1013669192': '1000000002', '1.013.669.192': '1.000.000.002',
    '2014-09-03': '2020-01-01',
    'Laura': 'Agente', 'Camila': 'De', 'Gómez': 'Prueba', 'Quintero': 'Demo',
    'Andrés Ortiz': 'Agente Demo Uno', 'Anyi Bibiana Marín': 'Agente Demo Dos',
    'Diego Alexander Cubillos': 'Agente Demo Tres', 'Sergio Ignacio Valderrama': 'Agente Demo Cuatro',
    'Rafael Enrique Cantillo': 'Agente Demo Cinco',
    '79.782.591': '1.000.000.011', '1.024.512.269': '1.000.000.012',
    '1.018.424.293': '1.000.000.013', '79.285.379': '1.000.000.014',
    '1.016.006.640': '1.000.000.015',
    'info@alfonsocarrizosa.com': 'contribuyente.demo@example.com',
    'KR 12 79 43 AP 204': 'CL 00 00 00 AP 000', 'AP 204': 'AP 000',
    '110221': '000000',
    'AAA0088TYBS': 'DEMO0000001', 'AAA0096WRTO': 'DEMO0000002',
    'AAA0096WRYX': 'DEMO0000003', 'AAA0096WWFZ': 'DEMO0000004',
    '050C00162907': '000C00000001', '050C00615395': '000C00000002',
    '050C00615399': '000C00000003', '050C00664063': '000C00000004',
    'CL 70A 8 33': 'CL 00 00 01', 'KR 9 85 80 AP 802': 'CL 00 00 02',
    'KR 9 85 78 GJ 2': 'CL 00 00 03', 'KR 9 85 78 GJ 20': 'CL 00 00 04',
    '00000000000011012710': '00000000000000000001', '00000000000010386625': '00000000000000000002',
    '00000000000010386664': '00000000000000000003', '00000000000010386549': '00000000000000000004',
}
# Substitute longer values first, preserving consistent fixtures and references.
for p in paths:
    text = p.read_text(encoding='utf-8')
    for original, demo in sorted(replacements.items(), key=lambda item: -len(item[0])):
        text = text.replace(original, demo)
    p.write_text(text, encoding='utf-8')

p = root / 'js/script.js'
s = p.read_text(encoding='utf-8')
plates = re.findall(r'(?:"plate"\s*:\s*"|plate:\s*")([^"]+)', s)
for i, plate in enumerate(plates, 1):
    s = s.replace('"' + plate + '"', '"DEM' + str(i).zfill(3) + '"')
s = re.sub(r'declaration: "\d{12}"', lambda m: 'declaration: "' + str(100000000001 + int(m.start())).zfill(12) + '"', s)
s = s.replace('10053003600 + index', '100000000 + index')
s = s.replace('900100001 + index', '900000001 + index')
s = re.sub(r'name: index < 5 \? \[.*?\]\[index\] : `Empresa Bogotá', 'name: index < 5 ? ["Empresa Demo Uno S.A.S.", "Empresa Demo Dos S.A.S.", "Empresa Demo Tres S.A.S.", "Empresa Demo Cuatro S.A.S.", "Empresa Demo Cinco S.A.S."][index] : `Empresa Demo', s)
s = s.replace('hacienda-mi-rit', 'demo-mi-rit').replace('seed-v1', 'seed-demo-v2')
for key in ['address-street-number', 'address-number-1', 'address-number-2']:
    s = re.sub(r'("' + key + r'": ")\d+(" أ?)', r'\g<1>00\2', s)
s = s.replace('"address-street-type": "KR"', '"address-street-type": "CL"')
p.write_text(s, encoding='utf-8')

p = root / 'index.html'
s = p.read_text(encoding='utf-8')
for field in ['address-street-number', 'address-number-1', 'address-number-2']:
    s = re.sub(r'(id="' + field + r'"[^>]*value=")\d+', r'\g<1>00', s)
s = s.replace('<option>CL</option><option selected>KR</option>', '<option selected>CL</option><option>KR</option>')
s = s.replace('<body class="bg-body">', '<body class="bg-body">\n    <div class="bg-warning-subtle text-warning-emphasis text-center small py-2 px-3" role="note">Demo de prueba · Datos ficticios · No realiza trámites ni pagos reales.</div>')
p.write_text(s, encoding='utf-8')
print('Demo sanitized: identity, agents, contact, addresses, vehicles, properties, declarations and companies.')
