const paymentHistoryExamples = {
 predial: {title:'Predial unificado',headers:['CHIP','Matrícula','Dirección','Acciones'],rows:[
 ['CHIP-DEMO-023','050S00000040','CL 00 00 081'],['CHIP-DEMO-025','050S00000041','CL 00 00 080'],['CHIP-DEMO-026','050S00000050','CL 00 00 079'],['CHIP-DEMO-027','050S00000049','CL 00 00 078'],['CHIP-DEMO-028','050S00000046','CL 00 00 088'],['CHIP-DEMO-029','050S00000047','CL 00 00 089'],['CHIP-DEMO-030','050S00000042','CL 00 00 076'],['CHIP-DEMO-033','050S00000043','CL 00 00 077'],['CHIP-DEMO-032','050S00000044','CL 00 00 086'],['CHIP-DEMO-034','050S00000048','CL 00 00 085']]},
 vehiculos:{title:'Vehículos',headers:['Placa','Modelo','Marca','Línea','Acciones'],rows:[['DEM363','2017','Toyota','Hilux'],['DEM364','2017','Mercedes-Benz','GLS 500 4MATIC'],['DEM365','2017','Dodge','Journey SE'],['DEM366','2019','Nissan','NP300 FRONTIER'],['DEM367','2019','Changan','CS15'],['DEM368','2019','Toyota','4 RUNNER'],['DEM369','2019','MINI','Cooper S Countryman'],['DEM370','2018','Ford','Explorer'],['DEM371','2019','Volkswagen','Amarok Highline'],['DEM372','2019','BMW','120 I']]},
 ica:{title:'ICA',headers:['Número de objeto','Acciones'],rows:[['00000000000000000121']]},
 delineacion:{title:'Impuestos de Delineación Urbana',headers:['CDU','Licencia de construcción','Acciones'],rows:[['CDU-DEMO-101','000000000131'],['CDU-DEMO-102','000000000132'],['CDU-DEMO-103','000000000133'],['CDU-DEMO-104','000000000135'],['CDU-DEMO-105','000000000136'],['CDU-DEMO-106','—'],['CDU-DEMO-107','000000000137'],['CDU-DEMO-108','000000000138'],['CDU-DEMO-109','000000000134'],['CDU-DEMO-110','—']]}
};
let paymentHistoryTax='predial', paymentHistoryQuery='', paymentHistorySize=10, paymentHistoryPage=1;
function paymentHistoryDetail(tax,index) {
 const item=paymentHistoryExamples[tax].rows[index];
 const tail=['Tipo de documento','Número de referencia de recaudo','Número de formulario','Fecha de presentación','Total pagado','Total del aporte voluntario'];
 let headers=tax==='ica'?['Año gravable','Periodo',...tail]:[tax==='predial'?'CHIP':'Placa','Año gravable',...tail];
 if(tax==='delineacion')headers=['CDU','Radicados','Tipo','Modalidad','Tipo de documento','Número de referencia de recaudo','Número de formulario','Fecha de presentación','Total pagado'];
 let rows=[];
 if(tax==='predial'&&index===0)rows=[['2022','01/06/2022','40.000'],['2023','29/05/2023','53.000'],['2024','29/03/2024','56.000'],['2025','21/04/2025','63.000']].map(([year,date,total])=>[item[0],year,'Factura','—','—',date,total,total]);
 if(tax==='vehiculos'&&item[0]==='DEM370')rows=[['2022','30/05/2022','2.358.000'],['2023','12/04/2023','2.366.000'],['2024','06/03/2024','2.464.000'],['2025','14/05/2025','2.596.000']].map(([year,date,total])=>[item[0],year,'Factura','—','—',date,total,total]);
 return `${table(headers,rows,{empty:'No se encontraron registros en la referencia disponible.'})}<span id="payment-history-pdf-note" class="d-inline-block pe-3"><button class="btn btn-outline-primary" type="button" disabled>Descargar PDF</button></span>`;
}
function paymentHistoryList() {
 const config=paymentHistoryExamples[paymentHistoryTax];
 const filtered=config.rows.map((row,index)=>({row,index})).filter(({row})=>row.join(' ').toLocaleLowerCase('es').includes(paymentHistoryQuery.toLocaleLowerCase('es')));
 const pages=Math.max(1,Math.ceil(filtered.length/paymentHistorySize));paymentHistoryPage=Math.min(paymentHistoryPage,pages);
 const start=(paymentHistoryPage-1)*paymentHistorySize;
 const rows=filtered.slice(start,start+paymentHistorySize).map(({row,index})=>[...row,`<button class="btn btn-outline-primary btn-sm px-3 text-nowrap" type="button" aria-haspopup="dialog" data-payment-history-detail="${index}"><i class="bi bi-eye me-1" aria-hidden="true"></i>Ver detalle</button>`]);
 return `${table(config.headers,rows,{empty:'No se encontraron registros.'})}<div class="d-flex flex-wrap justify-content-between align-items-center gap-2"><p class="small text-secondary mb-0">Mostrando ${filtered.length?start+1:0} a ${Math.min(start+paymentHistorySize,filtered.length)} de ${filtered.length} registros de ejemplo</p><nav aria-label="Paginación de pagos"><ul class="pagination pagination-sm flex-wrap mb-0">${paginationControls(paymentHistoryPage, pages, target => `data-payment-history-page="${target}"`)}</ul></nav></div>`;
}
function renderPaymentHistoryPage() {
 return `${pageTitle('<span id="payment-history-title" class="d-inline-block pe-3">Relación de pagos</span>','Consulta tus declaraciones presentadas y pagos por impuesto.')}<div class="alert alert-info">Si la descarga no se abre, permite las ventanas emergentes en tu navegador.</div>
 ${section('Consultar pagos',`<form id="payment-history-form"><label class="form-label" for="payment-history-tax">Impuesto</label><select id="payment-history-tax" class="form-select mb-3">${Object.entries(paymentHistoryExamples).map(([id,c])=>`<option value="${id}" ${id===paymentHistoryTax?'selected':''}>${c.title}</option>`).join('')}</select>${queryActions()}</form>`)}
 ${section(paymentHistoryExamples[paymentHistoryTax].title,`<div class="d-flex flex-wrap justify-content-between gap-3 mb-3"><label>Registros por página <select id="payment-history-size" class="form-select form-select-sm w-auto d-inline-block">${[5,10,25,50].map(n=>`<option ${n===paymentHistorySize?'selected':''}>${n}</option>`).join('')}</select></label><label>Buscar en la tabla <input id="payment-history-search" type="search" class="form-control form-control-sm" value=""></label></div><div id="payment-history-list">${paymentHistoryList()}</div>${paymentHistoryTax==='delineacion'?'<p class="small text-secondary mt-3">Para visualizar la relación de pagos de tus retenciones por radicados, selecciona el CDU correspondiente.</p>':''}`)}`;
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
  const [object] = paymentHistoryExamples[paymentHistoryTax].rows[index];
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
