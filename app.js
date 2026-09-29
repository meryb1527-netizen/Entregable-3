
const DATA = window.WORKBOOK_DATA;
let active = 0;
let query = "";
let filters = {};

const $ = s => document.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const val = cell => cell?.value ?? "";
const textOf = row => row.map(val).filter(v => v !== "").join(" ").toLowerCase();

function sheetStats(s){
  let nonempty=0;
  s.rows.forEach(r=>r.forEach(c=>{if(c?.value!==undefined && c?.value!==null && c?.value!=="") nonempty++}));
  return {rows:s.rows.length, nonempty};
}

function init(){
  $("#sheetCount").textContent = DATA.sheets.length;
  renderDashboard();
  renderTabs();
  render();
  $("#searchInput").addEventListener("input", e=>{query=e.target.value.toLowerCase();render()});
  $("#clearBtn").addEventListener("click",()=>{query="";filters={};$("#searchInput").value="";render()});
  $("#exportBtn").addEventListener("click", exportJSON);
}

function renderDashboard(){
  const totalRows=DATA.sheets.reduce((a,s)=>a+s.rows.length,0);
  const totalCells=DATA.sheets.reduce((a,s)=>a+sheetStats(s).nonempty,0);
  $("#dashboard").innerHTML = [
    ["5","Hojas del Excel"],
    [totalRows.toLocaleString("es-CO"),"Filas con contenido"],
    [totalCells.toLocaleString("es-CO"),"Celdas con información"],
    [DATA.images.length,"Piezas/imágenes incorporadas"]
  ].map(([n,l])=>`<div class="metric"><div class="num">${n}</div><div class="label">${l}</div></div>`).join("");
}

function renderTabs(){
  $("#tabs").innerHTML = DATA.sheets.map((s,i)=>
    `<button class="tab ${i===active?'active':''}" data-i="${i}">${esc(shortName(s.name))}</button>`
  ).join("");
  document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{active=+b.dataset.i;query="";filters={};$("#searchInput").value="";renderTabs();render()});
}
function shortName(n){
  const map={
    "EVIDENCIA Y DIAGNÓSTICO":"Evidencia y diagnóstico",
    "PLAN COMERCIAL Y DE CONTENIDO":"Plan comercial",
    "PIEZAS GRÁFICAS CREADAS":"Piezas gráficas",
    "CAMPANA_INSTAGRAM_B2C":"Campaña Instagram B2C",
    "BITACORA USO IA":"Bitácora IA"
  };
  return map[n]||n;
}
function cleanRows(sheet){
  return sheet.rows.filter(r=>!query || textOf(r).includes(query));
}
function render(){
  renderFilters();
  const s=DATA.sheets[active];
  if(s.name==="EVIDENCIA Y DIAGNÓSTICO") renderEvidence(s);
  else if(s.name==="PLAN COMERCIAL Y DE CONTENIDO") renderPlan(s);
  else if(s.name==="PIEZAS GRÁFICAS CREADAS") renderPieces(s);
  else if(s.name==="CAMPANA_INSTAGRAM_B2C") renderCampaign(s);
  else if(s.name==="BITACORA USO IA") renderBitacora(s);
  else renderGeneric(s);
}
function renderFilters(){
  const s=DATA.sheets[active];
  let html="";
  if(s.name==="PLAN COMERCIAL Y DE CONTENIDO"){
    html+=selectFilter("segmento","Segmento",["B2B","B2C"]);
    html+=selectFilter("embudo","Embudo",["TOFU","MOFU","BOFU"]);
    html+=selectFilter("estado","Estado",["Planificado","Publicado"]);
  }
  if(s.name==="BITACORA USO IA"){
    html+=selectFilter("decision","Decisión",["Aceptado","Corregido","Descartado"]);
  }
  $("#filters").innerHTML=html;
  $("#filters").querySelectorAll("select").forEach(sel=>sel.onchange=e=>{filters[e.target.dataset.filter]=e.target.value;render()});
}
function selectFilter(key,label,opts){
  return `<select data-filter="${key}"><option value="">${label}</option>${opts.map(o=>`<option ${filters[key]===o?'selected':''}>${o}</option>`).join("")}</select>`;
}
function matchesRow(row, headers, mapping={}){
  for(const [filter,headerName] of Object.entries(mapping)){
    if(!filters[filter]) continue;
    const i=headers.findIndex(h=>h.toLowerCase().includes(headerName.toLowerCase()));
    if(i>=0 && String(val(row[i])).toLowerCase()!==filters[filter].toLowerCase()) return false;
  }
  return true;
}
function tableFrom(rows, headers, opts={}){
  const filtered=rows.filter(r=>!query || textOf(r).includes(query)).filter(r=>opts.mapping?matchesRow(r,headers,opts.mapping):true);
  if(!filtered.length) return `<div class="empty">No hay resultados para la búsqueda o filtros actuales.</div>`;
  return `<div class="table-wrap"><table class="data-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${filtered.map(r=>`<tr>${headers.map((_,i)=>`<td>${formatCell(r[i])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
function formatCell(c){
  if(!c) return "";
  let v=String(c.value??"");
  if(c.type==="date") v=new Date(v).toLocaleDateString("es-CO",{year:"numeric",month:"short",day:"numeric"});
  if(c.formula) v=`${esc(v)} <span class="badge">fórmula</span>`;
  if(["Planificado","Aceptado","Corregido","Descartado"].includes(v)) return `<span class="badge ${v.toLowerCase()}">${esc(v)}</span>`;
  if(/^https?:\/\//.test(v)) return `<a href="${esc(v)}" target="_blank" rel="noopener">${esc(v)}</a>`;
  return highlight(esc(v));
}
function highlight(s){
  if(!query) return s;
  const q=query.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  return s.replace(new RegExp(`(${q})`,"ig"),"<mark>$1</mark>");
}

function renderEvidence(s){
  const rows=s.rows;
  const intro=rows[0]?.[0]?.value||"";
  const decisionHeaders=rows[24]?.slice(0,4).map(val)||[];
  const decisionRows=rows.slice(25,31);
  const cards=rows.slice(2,9);
  const prose=rows.filter((r,i)=>[10,12,17,18,19,20,21,22,32,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50].includes(i));
  let html=`<div class="prose"><h3>Punto de partida</h3><p>${highlight(esc(intro))}</p></div><br>`;
  html+=`<div class="section-title"><h2>Decisiones estratégicas que sostienen el plan</h2><p>Conclusiones, aplicación y referencia del diagnóstico.</p></div><div class="grid" style="margin-top:14px">${cards.map(r=>`<article class="info-card"><h3>${highlight(esc(val(r[0])))}</h3><p>${highlight(esc(val(r[1])))}</p><div class="ref">${highlight(esc(val(r[2])))}</div></article>`).join("")}</div><br>`;
  html+=`<div class="card"><div class="section-title"><h2>Contraste de alternativas y justificación</h2></div>${tableFrom(decisionRows,decisionHeaders)}</div><br>`;
  html+=`<div class="prose-stack">${prose.map(r=>{const t=val(r[0]); if(!t) return ""; return `<article class="prose"><h3>${highlight(esc(t))}</h3>${r[1]?.value?`<p>${highlight(esc(val(r[1])))}</p>`:""}</article>`}).join("")}</div>`;
  $("#content").innerHTML=html;
}

function renderPlan(s){
  const headerIndex=3;
  const headers=s.rows[headerIndex].map(val);
  let rows=s.rows.slice(headerIndex+1);
  rows=rows.filter(r=>matchesRow(r,headers,{segmento:"segmento",embudo:"embudo",estado:"estado"}));
  const intro=s.rows.slice(0,3).map(r=>r[0]?.value).filter(Boolean);
  $("#content").innerHTML=`<div class="card"><div class="section-title"><h2>${esc(intro[0]||"Plan comercial y de contenidos")}</h2><p>${esc(intro.slice(1).join(" · "))}</p></div>${tableFrom(rows,headers)}</div>`;
}

function renderPieces(s){
  const imgs=DATA.images.filter(x=>x.sheet===s.name);
  const notes=s.rows.map(r=>r.filter(Boolean).map(val).join(" · ")).filter(Boolean);
  $("#content").innerHTML=`<div class="card"><div class="section-title"><h2>Piezas gráficas creadas</h2><p>Los recursos gráficos embebidos en el Excel se muestran aquí sin alterar el archivo original.</p></div><div class="media-grid" style="padding:16px">${imgs.map((im,i)=>`<article class="media-card"><img src="${im.file}" alt="Pieza gráfica ${i+1}" loading="lazy"><div class="media-meta"><strong>Pieza ${i+1}</strong><small>Hoja: ${esc(im.sheet)} · posición original aproximada: fila ${im.row}</small></div></article>`).join("")}</div><div class="section-title"><h2>Notas registradas en la hoja</h2></div><div class="prose-stack" style="padding:16px">${notes.map(n=>`<div class="prose"><p>${highlight(esc(n))}</p></div>`).join("")}</div></div>`;
}

function renderCampaign(s){
  const rows=s.rows;
  let sections=[], current=null;
  rows.forEach(r=>{
    const a=val(r[0]), b=val(r[1]);
    if(typeof a==="string" && /^\d+\.\s/.test(a) || (typeof a==="string" && a===a.toUpperCase() && a.length>8 && !b)){
      current={title:a,items:[]};sections.push(current);
    }else if(a||b){
      if(!current){current={title:"Información general",items:[]};sections.push(current)}
      current.items.push([a,b,r]);
    }
  });
  let html=sections.map(sec=>{
    let items=sec.items.filter(([a,b,r])=>!query || textOf(r).includes(query));
    if(!items.length) return "";
    return `<div class="card campaign-section"><div class="section-title"><h2>${highlight(esc(sec.title))}</h2></div><div class="kv">${items.map(([a,b,r])=>`<div class="key">${highlight(esc(a))}</div><div class="value">${highlight(esc(b))}</div>`).join("")}</div></div>`;
  }).join("");
  const imgs=DATA.images.filter(x=>x.sheet===s.name);
  if(imgs.length) html+=`<div class="card campaign-section"><div class="section-title"><h2>Evidencias visuales</h2></div><div class="media-grid" style="padding:16px">${imgs.map((im,i)=>`<article class="media-card"><img src="${im.file}" alt="Evidencia de campaña ${i+1}" loading="lazy"><div class="media-meta"><strong>Evidencia ${i+1}</strong><small>Posición aproximada: fila ${im.row}</small></div></article>`).join("")}</div></div>`;
  $("#content").innerHTML=html||`<div class="empty">No hay coincidencias.</div>`;
}

function renderBitacora(s){
  const headers=s.rows[0].map(val);
  let rows=s.rows.slice(1).filter(r=>matchesRow(r,headers,{decision:"decisión"}));
  $("#content").innerHTML=`<div class="card"><div class="section-title"><h2>Bitácora de uso de IA</h2><p>Registro de propuestas, decisiones, correcciones y criterios humanos aplicados.</p></div>${tableFrom(rows,headers)}</div>`;
}
function renderGeneric(s){
  const headers=s.rows[0].map((c,i)=>val(c)||`Columna ${i+1}`);
  $("#content").innerHTML=`<div class="card"><div class="section-title"><h2>${esc(s.name)}</h2></div>${tableFrom(s.rows.slice(1),headers)}</div>`;
}
function exportJSON(){
  const blob=new Blob([JSON.stringify(DATA,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="ayj_datos_visualizador.json";a.click();URL.revokeObjectURL(a.href);
}
document.addEventListener("DOMContentLoaded",init);
