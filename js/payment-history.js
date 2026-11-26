const paymentHistoryExamples = {
 predial: {title:'Predial unificado',headers:['CHIP','Matrícula','Dirección','Acciones'],rows:[
 ['AAA0000XPT0','050S00712129','CL 13 SUR 6 34 ESTE GJ 14'],['AAA0000XRYX','050S00712203','CL 13 SUR 6 34 ESTE AP 802'],['AAA0001ASYN','050S40265453','CL 13 BIS SUR 5A 65 GJ 10'],['AAA0001AUJZ','050S40265422','CL 13 BIS SUR 5A 65 AP 403'],['AAA0001EUOM','050S40203487','KR 2A 17A 35 SUR IN 14 AP 101'],['AAA0001EXAF','050S40203531','KR 2A 17A 35 SUR IN 16 AP 201'],['AAA0001MNUZ','050S00904063','AC 11 SUR 10A 40 GJ 101'],['AAA0001MUOE','050S00904071','AC 11 SUR 10A 50 AP 501'],['AAA0001MPKL','050S40005993','KR 11 8 16 SUR AP 201'],['AAA0001YXJH','050S40258176','CL 8B SUR 7 15 GJ 44']]},
 vehiculos:{title:'Vehículos',headers:['Placa','Modelo','Marca','Línea','Acciones'],rows:[['DXM579','2017','Toyota','Hilux'],['DZS117','2017','Mercedes-Benz','GLS 500 4MATIC'],['EBM244','2017','Dodge','Journey SE'],['EBV441','2019','Nissan','NP300 FRONTIER'],['ELU742','2019','Changan','CS15'],['EMP924','2019','Toyota','4 RUNNER'],['EMR492','2019','MINI','Cooper S Countryman'],['FNX843','2018','Ford','Explorer'],['FOO401','2019','Volkswagen','Amarok Highline'],['FOW428','2019','BMW','120 I']]},
 ica:{title:'ICA',headers:['Número de objeto','Acciones'],rows:[['00110000000000009651']]},
 delineacion:{title:'Impuestos de Delineación Urbana',headers:['CDU','Licencia de construcción','Acciones'],rows:[['CDU1121621','110012120099'],['CDU1121703','110012120531'],['CDU1133023','110013120334'],['CDU1150939','110015110641'],['CDU1152068','110015120428'],['CDU1211767','—'],['CDU1220428','110121130164'],['CDU1232481','110131121355'],['CDU1242784','110014111470'],['CDU1310143','—']]}
};
let paymentHistoryTax='predial', paymentHistoryQuery='', paymentHistorySize=10, paymentHistoryPage=1;
let taxpayerPaymentHistoryMatches = [];
function paymentHistoryRows(tax) {
 const rows = paymentHistoryExamples[tax].rows;
 if (!taxpayerSession) return rows;
 if (tax === 'predial') return [...rows, taxpayerPredialRows[0].slice(0, 3)];
 if (tax === 'vehiculos') return [...rows, ...myVehicles
  .filter(vehicle => taxpayerHomeObjects.vehiculos.includes(vehicle.plate))
  .map(vehicle => [vehicle.plate, vehicle.year, vehicle.brand, vehicle.line])];
 return rows;
}
function paymentHistoryDetail(tax,index) {
 const item=paymentHistoryRows(tax)[index];
 const tail=['Tipo de documento','Número de referencia de recaudo','Número de formulario','Fecha de presentación','Total pagado','Total del aporte voluntario'];
 let headers=tax==='ica'?['Año gravable','Periodo',...tail]:[tax==='predial'?'CHIP':'Placa','Año gravable',...tail];
 if(tax==='delineacion')headers=['CDU','Radicados','Tipo','Modalidad','Tipo de documento','Número de referencia de recaudo','Número de formulario','Fecha de presentación','Total pagado'];
 let rows=[];
 if(tax==='predial'&&index===0)rows=[['2022','01/06/2022','40.000'],['2023','29/05/2023','53.000'],['2024','29/03/2024','56.000'],['2025','21/04/2025','63.000']].map(([year,date,total])=>[item[0],year,'Factura','—','—',date,total,total]);
 if(tax==='vehiculos'&&item[0]==='FNX843')rows=[['2022','30/05/2022','2.358.000'],['2023','12/04/2023','2.366.000'],['2024','06/03/2024','2.464.000'],['2025','14/05/2025','2.596.000']].map(([year,date,total])=>[item[0],year,'Factura','—','—',date,total,total]);
 if (taxpayerSession && !rows.length && ['predial', 'vehiculos'].includes(tax)) {
  rows = paymentCertificationExamples.filter(record => record.tax === tax && record.object === item[0])
   .map(record => [record.object, record.year, record.paymentDocumentType || '—', record.reference, record.formNumber || '—',
    record.date || '—', billingAmount.format(record.amount), '—']);
 }
 return `${table(headers,rows,{empty:'No se encontraron registros en la referencia disponible.'})}<span id="payment-history-pdf-note" class="d-inline-block pe-3"><button class="btn btn-outline-primary" type="button" disabled>Descargar PDF</button></span>`;
}
function paymentHistoryList() {
 const config=paymentHistoryExamples[paymentHistoryTax];
 const filtered=paymentHistoryRows(paymentHistoryTax).map((row,index)=>({row,index})).filter(({row,index})=>
  (!taxpayerSession || taxpayerPaymentHistoryMatches.includes(index)) &&
  row.join(' ').toLocaleLowerCase('es').includes(paymentHistoryQuery.toLocaleLowerCase('es')));
 const pages=Math.max(1,Math.ceil(filtered.length/paymentHistorySize));paymentHistoryPage=Math.min(paymentHistoryPage,pages);
 const start=(paymentHistoryPage-1)*paymentHistorySize;
 const rows=filtered.slice(start,start+paymentHistorySize).map(({row,index})=>[...row,`<button class="btn btn-outline-primary btn-sm px-3 text-nowrap" type="button" aria-haspopup="dialog" data-payment-history-detail="${index}"><i class="bi bi-eye me-1" aria-hidden="true"></i>Ver detalle</button>`]);
 return `${table(config.headers,rows,{empty:'No se encontraron registros.',paginationManaged:true})}${tablePaginationFooter({
  label:'pagos', summary:tablePageSummary(filtered.length,start,paymentHistorySize),
  controls:paginationControls(paymentHistoryPage,pages,target=>`data-payment-history-page="${target}"`),
 })}`;
}
function renderPaymentHistoryPage() {
 if (taxpayerSession) return `${pageTitle('<span id="payment-history-title">Relación de pagos</span>', 'Consulta tus declaraciones presentadas y pagos por impuesto.')}
 ${section('Consultar pagos', taxpayerQueryForm('taxpayer-payment-history', { taxes: Object.entries(paymentHistoryExamples).map(([id, config]) => [id, config.title]) }))}`;
 return `${pageTitle('<span id="payment-history-title" class="d-inline-block pe-3">Relación de pagos</span>','Consulta tus declaraciones presentadas y pagos por impuesto.')}<div class="alert alert-info">Si la descarga no se abre, permite las ventanas emergentes en tu navegador.</div>
 ${section('Consultar pagos',`<form id="payment-history-form"><label class="form-label" for="payment-history-tax">Impuesto</label><select id="payment-history-tax" class="form-select mb-3">${Object.entries(paymentHistoryExamples).map(([id,c])=>`<option value="${id}" ${id===paymentHistoryTax?'selected':''}>${c.title}</option>`).join('')}</select>${queryActions()}</form>`)}
 ${section(paymentHistoryExamples[paymentHistoryTax].title,`${tableToolbar({ sizeId:"payment-history-size", searchId:"payment-history-search", selected:paymentHistorySize })}<div id="payment-history-list">${paymentHistoryList()}</div>${paymentHistoryTax==='delineacion'?'<p class="small text-secondary mt-3">Para visualizar la relación de pagos de tus retenciones por radicados, selecciona el CDU correspondiente.</p>':''}`)}`;
}
function mountTaxpayerPaymentHistory() {
 mountTaxpayerQuery('taxpayer-payment-history', query => paymentHistoryRows(query.tax).flatMap(([object], index) =>
  !taxpayerObjectRules[query.tax] || matchesTaxpayerQuery(query, query.tax, object) ? [index] : []
 ), (target, matches, query) => {
  paymentHistoryTax = query.tax;
  taxpayerPaymentHistoryMatches = matches;
  paymentHistoryQuery = '';
  paymentHistoryPage = 1;
  target.innerHTML = section(paymentHistoryExamples[query.tax].title, `${tableToolbar({ sizeId: 'payment-history-size', searchId: 'payment-history-search', selected: paymentHistorySize })}
   <div id="payment-history-list">${paymentHistoryList()}</div>
   ${query.tax === 'delineacion' ? '<p class="small text-secondary mt-3">Para visualizar la relación de pagos de tus retenciones por radicados, selecciona el CDU correspondiente.</p>' : ''}`);
 }, { initial: true });
}
document.addEventListener('submit',event=>{
 if(event.target.id!=='payment-history-form')return;event.preventDefault();
 paymentHistoryTax=document.getElementById('payment-history-tax').value;paymentHistoryQuery='';paymentHistoryPage=1;renderRoute();
});
document.addEventListener('change',event=>{
 if(event.target.id==='payment-history-size'){paymentHistorySize=Number(event.target.value);paymentHistoryPage=1;document.getElementById('payment-history-list').innerHTML=paymentHistoryList();}
});
document.addEventListener('input',event=>{
 if(event.target.id!=='payment-history-search')return;paymentHistoryQuery=event.target.value;paymentHistoryPage=1;document.getElementById('payment-history-list').innerHTML=paymentHistoryList();
});
document.addEventListener('reset',event=>{
 if(event.target.id!=='payment-history-form')return;event.preventDefault();paymentHistoryTax='predial';paymentHistoryQuery='';paymentHistoryPage=1;renderRoute();
});
document.addEventListener('click',event=>{
 const detail=event.target.closest('[data-payment-history-detail]');
 if (detail) {
  const index = Number(detail.dataset.paymentHistoryDetail);
  const [object] = paymentHistoryRows(paymentHistoryTax)[index];
  showDetailModal({
   title: `Detalle · ${object}`, body: paymentHistoryDetail(paymentHistoryTax, index),
   trigger: detail, size: 'modal-xl', titleId: 'payment-history-detail-title'
  });
 }
 const page = event.target.closest('[data-payment-history-page]');
 if (page) {
  paymentHistoryPage = Number(page.dataset.paymentHistoryPage);
  const list = document.getElementById('payment-history-list');
  list.innerHTML = paymentHistoryList();
  list.querySelector('[aria-current="page"]')?.focus();
 }
});
