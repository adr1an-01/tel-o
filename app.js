const API = '/api';
const BIBLE_API = 'https://bible-api.com';

let dadosEscalas=[], dadosServos=[], dadosTarefas=[];
let calAno=new Date().getFullYear(), calMes=new Date().getMonth();
let filtroTarefa='todos';
let favoritoTemp=null, estudoEditandoId=null;

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const auth = await post({acao:'checar_auth'}).catch(()=>({autenticado:false}));
  if (auth.autenticado) mostrarApp(auth.usuario);
  else document.getElementById('loginScreen').style.display='flex';

  document.getElementById('loginPass').addEventListener('keydown', e=>{ if(e.key==='Enter') fazerLogin(); });
  document.getElementById('loginUser').addEventListener('keydown', e=>{ if(e.key==='Enter') fazerLogin(); });
  document.getElementById('calPrev').addEventListener('click', ()=>{ calMes--; if(calMes<0){calMes=11;calAno--;} renderizarCalendario(); });
  document.getElementById('calNext').addEventListener('click', ()=>{ calMes++; if(calMes>11){calMes=0;calAno++;} renderizarCalendario(); });
  document.getElementById('esc-operador').addEventListener('change', function(){ const s=dadosServos.find(s=>s.nome===this.value); document.getElementById('esc-telefone').value=s?.telefone||''; });
  document.getElementById('bibliaRef').addEventListener('keydown', e=>{ if(e.key==='Enter') buscarPorReferencia(); });
  document.getElementById('bibliaPalavra').addEventListener('keydown', e=>{ if(e.key==='Enter') buscarPorPalavra(); });

  document.querySelectorAll('.filter-btn').forEach(btn=>{ btn.addEventListener('click',()=>{ document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); filtroTarefa=btn.dataset.filter; renderizarTarefas(dadosTarefas); }); });
  document.querySelectorAll('.bible-tab').forEach(btn=>{ btn.addEventListener('click',()=>{ document.querySelectorAll('.bible-tab').forEach(b=>b.classList.remove('active')); document.querySelectorAll('.bible-panel').forEach(p=>p.classList.remove('active')); btn.classList.add('active'); document.getElementById('btab-'+btn.dataset.btab).classList.add('active'); if(btn.dataset.btab==='favoritos') carregarFavoritos(); if(btn.dataset.btab==='estudos') carregarEstudos(); }); });
});

// ── Auth ──────────────────────────────────────────────────────────────────────
async function fazerLogin() {
  const usuario=document.getElementById('loginUser').value.trim();
  const senha=document.getElementById('loginPass').value;
  const errEl=document.getElementById('loginError');
  errEl.textContent='';
  try { const res=await post({acao:'login',usuario,senha}); if(res.sucesso) mostrarApp(res.usuario); else errEl.textContent=res.erro||'Erro ao entrar'; }
  catch { errEl.textContent='Erro de conexão'; }
}
async function fazerLogout() {
  await post({acao:'logout'}).catch(()=>{});
  document.getElementById('appLayout').style.display='none';
  document.getElementById('bottomNav').style.display='none';
  document.getElementById('loginScreen').style.display='flex';
  document.getElementById('loginPass').value='';
}
function mostrarApp(usuario) {
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('appLayout').style.display='flex';
  document.getElementById('sidebarUser').textContent='👤 '+usuario;
  iniciarNavegacao();
  carregarDados();
}

// ── Navegação ─────────────────────────────────────────────────────────────────
function iniciarNavegacao() {
  const todos=[...document.querySelectorAll('.nav-item'),...document.querySelectorAll('.bottom-nav-item')];
  todos.forEach(btn=>{ btn.addEventListener('click',()=>{ const tab=btn.dataset.tab; todos.forEach(b=>b.classList.remove('active')); document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active')); document.querySelectorAll(`[data-tab="${tab}"]`).forEach(b=>b.classList.add('active')); document.getElementById('tab-'+tab).classList.add('active'); }); });
}

// ── API ───────────────────────────────────────────────────────────────────────
async function post(payload) {
  const res=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const data=await res.json();
  if(data.auth===false){fazerLogout();throw new Error('Não autenticado');}
  return data;
}

// ── Carregar dados ────────────────────────────────────────────────────────────
async function carregarDados() {
  try {
    const dados=await post({acao:'listar'});
    dadosEscalas=dados.escalas||[]; dadosTarefas=dados.tarefas||[]; dadosServos=dados.servos||[];
    renderizarDashboard(); renderizarCalendario();
    renderizarEscalas(dadosEscalas); renderizarTarefas(dadosTarefas); renderizarServos(dadosServos);
    preencherDropdownServos();
  } catch(e){ if(e.message!=='Não autenticado') toast('Erro ao carregar dados.','err'); }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function renderizarDashboard() {
  const hoje=new Date(); hoje.setHours(0,0,0,0);
  const proximas=dadosEscalas.filter(e=>new Date(e.data+'T12:00:00')>=hoje).slice(0,5);
  const pendentes=dadosTarefas.filter(t=>t.status!=='concluida');
  const atrasadas=dadosTarefas.filter(t=>t.prazo&&new Date(t.prazo+'T12:00:00')<hoje&&t.status!=='concluida');
  const anivHoje=dadosServos.filter(s=>{ if(!s.aniversario)return false; const d=new Date(s.aniversario+'T12:00:00'); return d.getDate()===hoje.getDate()&&d.getMonth()===hoje.getMonth(); });
  document.getElementById('dashCards').innerHTML=`
    <div class="dash-card accent"><div class="dash-card-icon">📅</div><div class="dash-card-val">${dadosEscalas.length}</div><div class="dash-card-label">Escalas totais</div></div>
    <div class="dash-card success"><div class="dash-card-icon">👥</div><div class="dash-card-val">${dadosServos.filter(s=>s.ativo).length}</div><div class="dash-card-label">Servos ativos</div></div>
    <div class="dash-card warning"><div class="dash-card-icon">✅</div><div class="dash-card-val">${pendentes.length}</div><div class="dash-card-label">Tarefas pendentes</div></div>
    <div class="dash-card ${atrasadas.length>0?'danger':''}"><div class="dash-card-icon">⚠️</div><div class="dash-card-val">${atrasadas.length}</div><div class="dash-card-label">Tarefas atrasadas</div></div>`;
  document.getElementById('dashProximas').innerHTML=proximas.length
    ? proximas.map(e=>`<div class="dash-item"><div class="dash-item-dot"></div><div class="dash-item-text">${esc(e.operador)}</div><div class="dash-item-date">${fmt(e.data)}</div></div>`).join('')
    : '<div class="empty-state" style="padding:16px">Nenhuma escala futura.</div>';
  document.getElementById('dashTarefas').innerHTML=pendentes.slice(0,5).length
    ? pendentes.slice(0,5).map(t=>`<div class="dash-item"><div class="dash-item-dot ${atrasadas.find(a=>a.id===t.id)?'warning':''}"></div><div class="dash-item-text">${esc(t.tarefa)}</div>${t.prazo?`<div class="dash-item-date">${fmt(t.prazo)}</div>`:''}</div>`).join('')
    : '<div class="empty-state" style="padding:16px">Sem tarefas pendentes!</div>';
  if(anivHoje.length) toast(`🎂 Aniversário hoje: ${anivHoje.map(s=>s.nome).join(', ')}`, 'ok');
}

// ── Calendário ────────────────────────────────────────────────────────────────
const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
function renderizarCalendario() {
  document.getElementById('calTitulo').textContent=`${MESES[calMes]} ${calAno}`;
  const grid=document.getElementById('calendarGrid'); grid.innerHTML='';
  DIAS.forEach(d=>{ const el=document.createElement('div'); el.className='cal-weekday'; el.textContent=d; grid.appendChild(el); });
  const primeiroDia=new Date(calAno,calMes,1).getDay(), totalDias=new Date(calAno,calMes+1,0).getDate(), hoje=new Date();
  for(let i=0;i<primeiroDia;i++){ const el=document.createElement('div'); el.className='cal-day empty'; grid.appendChild(el); }
  for(let d=1;d<=totalDias;d++){
    const dataStr=`${calAno}-${String(calMes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const esc2=dadosEscalas.filter(e=>e.data===dataStr);
    const el=document.createElement('div'); el.className='cal-day';
    if(d===hoje.getDate()&&calMes===hoje.getMonth()&&calAno===hoje.getFullYear()) el.classList.add('today');
    if(esc2.length) el.classList.add('has-escala');
    const num=document.createElement('div'); num.className='cal-day-num'; num.textContent=d; el.appendChild(num);
    esc2.forEach(e=>{ const chip=document.createElement('div'); chip.className='cal-escala-chip'; chip.textContent=e.operador; el.appendChild(chip); });
    if(esc2.some(e=>e.obs?.trim())){ const dot=document.createElement('div'); dot.className='cal-obs-dot'; el.appendChild(dot); }
    el.addEventListener('click',()=>abrirDetalhe(dataStr,esc2,d));
    grid.appendChild(el);
  }
}
function abrirDetalhe(dataStr,escalas,dia) {
  document.getElementById('dayDetailTitle').textContent=`${dia} de ${MESES[calMes]} de ${calAno}`;
  document.getElementById('dayDetailBody').innerHTML=escalas.length
    ? escalas.map(e=>`<div class="detail-escala"><div class="detail-row"><span>Operador</span><span>${esc(e.operador)}</span></div>${e.telefone?`<div class="detail-row"><span>Telefone</span><span>${esc(e.telefone)}</span></div>`:''} ${e.musicas?`<div class="detail-row"><span>Músicas</span><span>${esc(e.musicas)}</span></div>`:''} ${e.obs?`<div class="detail-obs">📝 ${esc(e.obs)}</div>`:''}<div style="margin-top:10px"><button class="btn btn--danger" style="font-size:11px;padding:5px 10px" onclick="excluirEscala(${e.id},'${esc(e.operador)}')">Remover</button></div></div>`).join('')
    : `<div class="empty-state" style="padding:16px">Dia livre.<br><button class="btn btn--primary" style="margin-top:12px" onclick="abrirModal('modal-escala')">+ Escalar</button></div>`;
  const d=document.getElementById('dayDetail'); d.style.display='block'; d.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function fecharDetalhe(){ document.getElementById('dayDetail').style.display='none'; }

// ── Dropdown servos ───────────────────────────────────────────────────────────
function preencherDropdownServos() {
  const sel=document.getElementById('esc-operador'), val=sel.value;
  sel.innerHTML='<option value="">Selecionar servo…</option>';
  dadosServos.filter(s=>s.ativo).forEach(s=>{ const opt=document.createElement('option'); opt.value=s.nome; opt.textContent=s.nome+(s.funcao?` — ${s.funcao}`:''); sel.appendChild(opt); });
  sel.value=val;
}

// ── Render listas ─────────────────────────────────────────────────────────────
function renderizarEscalas(lista) {
  const el=document.getElementById('lista-escalas');
  if(!lista.length){el.innerHTML='<div class="empty-state">Nenhuma escala cadastrada.</div>';return;}
  el.innerHTML=lista.map(e=>`<div class="card"><button class="card-del" onclick="excluirEscala(${e.id},'${esc(e.operador)}')">✕</button><div class="card-title">${fmt(e.data)}</div><div class="card-row"><span>Operador</span><span>${esc(e.operador)}</span></div>${e.telefone?`<div class="card-row"><span>Telefone</span><span>${esc(e.telefone)}</span></div>`:''}${e.musicas?`<div class="card-row"><span>Músicas</span><span>${esc(e.musicas)}</span></div>`:''}${e.obs?`<div class="card-obs">📝 ${esc(e.obs)}</div>`:''}</div>`).join('');
}
function renderizarTarefas(lista) {
  const el=document.getElementById('lista-tarefas');
  const hoje=new Date(); hoje.setHours(0,0,0,0);
  const filtrada=filtroTarefa==='todos'?lista:lista.filter(t=>t.status===filtroTarefa);
  if(!filtrada.length){el.innerHTML='<div class="empty-state">Nenhuma tarefa aqui.</div>';return;}
  el.innerHTML=filtrada.map(t=>{ const atrasada=t.prazo&&new Date(t.prazo+'T12:00:00')<hoje&&t.status!=='concluida'; return `<div class="task-item ${t.status==='concluida'?'concluida':''}"><span class="status-badge ${t.status}" onclick="ciclarStatus(${t.id},'${t.status}')">${labelStatus(t.status)}</span><span class="task-text">${esc(t.tarefa)}</span>${t.prazo?`<span class="task-prazo ${atrasada?'atrasada':''}">${fmt(t.prazo)}</span>`:''}<button class="task-del" onclick="excluirTarefa(${t.id},'${esc(t.tarefa)}')">✕</button></div>`; }).join('');
}
function renderizarServos(lista) {
  const el=document.getElementById('lista-servos');
  if(!lista.length){el.innerHTML='<div class="empty-state">Nenhum servo cadastrado.</div>';return;}
  const hoje=new Date();
  el.innerHTML=lista.map(s=>{ const iniciais=s.nome.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase(); const anivHoje=s.aniversario&&(()=>{ const d=new Date(s.aniversario+'T12:00:00'); return d.getDate()===hoje.getDate()&&d.getMonth()===hoje.getMonth(); })(); return `<div class="card ${s.ativo?'':'servo-inactive'}"><button class="card-del" onclick="excluirServo(${s.id},'${esc(s.nome)}')">✕</button><div class="servo-card-avatar">${iniciais}</div><div class="card-title" style="margin-bottom:6px">${esc(s.nome)}</div>${s.telefone?`<div class="card-row"><span>Telefone</span><span>${esc(s.telefone)}</span></div>`:''}${s.email?`<div class="card-row"><span>E-mail</span><span>${esc(s.email)}</span></div>`:''}<div style="margin-top:8px">${s.funcao?`<span class="servo-badge funcao">${esc(s.funcao)}</span>`:''} ${anivHoje?`<span class="servo-badge aniversario">🎂 Hoje!</span>`:(s.aniversario?`<span class="servo-badge aniversario">🎂 ${fmtAniv(s.aniversario)}</span>`:'')}</div></div>`; }).join('');
}
function filtrarServos(){ const q=document.getElementById('buscarServo').value.toLowerCase(); renderizarServos(dadosServos.filter(s=>s.nome.toLowerCase().includes(q)||(s.funcao||'').toLowerCase().includes(q))); }

// ── Status tarefas ────────────────────────────────────────────────────────────
const CICLO={pendente:'em_andamento',em_andamento:'concluida',concluida:'pendente'};
function labelStatus(s){return {pendente:'Pendente',em_andamento:'Em andamento',concluida:'✓ Concluída'}[s]||s;}
async function ciclarStatus(id,statusAtual){
  try{ await post({acao:'atualizar',tipo:'tarefa_status',id,status:CICLO[statusAtual]||'pendente'}); carregarDados(); }
  catch{ toast('Erro ao atualizar status.','err'); }
}

// ── Salvar ────────────────────────────────────────────────────────────────────
async function salvarEscala(){
  const data=document.getElementById('esc-data').value, operador=document.getElementById('esc-operador').value;
  if(!data||!operador){toast('Data e Operador são obrigatórios.','err');return;}
  try{ await post({acao:'salvar',tipo:'escala',data:{data,operador,telefone:document.getElementById('esc-telefone').value,musicas:document.getElementById('esc-musicas').value,obs:document.getElementById('esc-obs').value}}); fecharModal('modal-escala'); limpar(['esc-data','esc-operador','esc-telefone','esc-musicas','esc-obs']); toast('Escala salva!','ok'); carregarDados(); }
  catch{ toast('Erro ao salvar.','err'); }
}
async function salvarTarefa(){
  const tarefa=document.getElementById('tar-tarefa').value.trim();
  if(!tarefa){toast('Descrição é obrigatória.','err');return;}
  try{ await post({acao:'salvar',tipo:'tarefa',data:{tarefa,prazo:document.getElementById('tar-prazo').value,status:document.getElementById('tar-status').value}}); fecharModal('modal-tarefa'); limpar(['tar-tarefa','tar-prazo']); toast('Tarefa salva!','ok'); carregarDados(); }
  catch{ toast('Erro ao salvar.','err'); }
}
async function salvarServo(){
  const nome=document.getElementById('srv-nome').value.trim();
  if(!nome){toast('Nome é obrigatório.','err');return;}
  try{ await post({acao:'salvar',tipo:'servo',data:{nome,telefone:document.getElementById('srv-telefone').value,funcao:document.getElementById('srv-funcao').value,email:document.getElementById('srv-email').value,aniversario:document.getElementById('srv-aniversario').value}}); fecharModal('modal-servo'); limpar(['srv-nome','srv-telefone','srv-funcao','srv-email','srv-aniversario']); toast('Servo salvo!','ok'); carregarDados(); }
  catch{ toast('Erro ao salvar.','err'); }
}

// ── Excluir ───────────────────────────────────────────────────────────────────
async function excluirEscala(id,nome){ if(!confirm(`Excluir escala de ${nome}?`))return; try{await post({acao:'excluir',tipo:'escala',id});toast('Escala removida.','ok');fecharDetalhe();carregarDados();}catch{toast('Erro.','err');} }
async function excluirTarefa(id,tarefa){ if(!confirm(`Excluir "${tarefa}"?`))return; try{await post({acao:'excluir',tipo:'tarefa',id});toast('Removida.','ok');carregarDados();}catch{toast('Erro.','err');} }
async function excluirServo(id,nome){ if(!confirm(`Excluir ${nome}?`))return; try{await post({acao:'excluir',tipo:'servo',id});toast('Servo removido.','ok');carregarDados();}catch{toast('Erro.','err');} }

// ══ BÍBLIA ════════════════════════════════════════════════════════════════════

// Mapeamento livros PT → slug API
const LIVROS_MAP = {
  'gênesis':'genesis','genesis':'genesis','gn':'genesis',
  'êxodo':'exodus','exodo':'exodus','ex':'exodus',
  'levítico':'leviticus','levitico':'leviticus','lv':'leviticus',
  'números':'numbers','numeros':'numbers','nm':'numbers',
  'deuteronômio':'deuteronomy','deuteronomio':'deuteronomy','dt':'deuteronomy',
  'josué':'joshua','josue':'joshua','js':'joshua',
  'juízes':'judges','juizes':'judges','jz':'judges',
  'rute':'ruth','rt':'ruth',
  '1 samuel':'1samuel','1samuel':'1samuel','1sm':'1samuel',
  '2 samuel':'2samuel','2samuel':'2samuel','2sm':'2samuel',
  '1 reis':'1kings','1reis':'1kings','1rs':'1kings',
  '2 reis':'2kings','2reis':'2kings','2rs':'2kings',
  '1 crônicas':'1chronicles','1cronicas':'1chronicles','1cr':'1chronicles',
  '2 crônicas':'2chronicles','2cronicas':'2chronicles','2cr':'2chronicles',
  'esdras':'ezra','ed':'ezra',
  'neemias':'nehemiah','ne':'nehemiah',
  'ester':'esther','et':'esther',
  'jó':'job','jo':'job','jó':'job',
  'salmos':'psalms','sl':'psalms','ps':'psalms',
  'provérbios':'proverbs','proverbios':'proverbs','pv':'proverbs',
  'eclesiastes':'ecclesiastes','ec':'ecclesiastes',
  'cantares':'song of solomon','ct':'song of solomon',
  'isaías':'isaiah','isaias':'isaiah','is':'isaiah',
  'jeremias':'jeremiah','jr':'jeremiah',
  'lamentações':'lamentations','lamentacoes':'lamentations','lm':'lamentations',
  'ezequiel':'ezekiel','ez':'ezekiel',
  'daniel':'daniel','dn':'daniel',
  'oséias':'hosea','oseias':'hosea','os':'hosea',
  'joel':'joel','jl':'joel',
  'amós':'amos','amos':'amos','am':'amos',
  'obadias':'obadiah','ob':'obadiah',
  'jonas':'jonah','jn':'jonah',
  'miquéias':'micah','miqueias':'micah','mq':'micah',
  'naum':'nahum','na':'nahum',
  'habacuque':'habakkuk','hc':'habakkuk',
  'sofonias':'zephaniah','sf':'zephaniah',
  'ageu':'haggai','ag':'haggai',
  'zacarias':'zechariah','zc':'zechariah',
  'malaquias':'malachi','ml':'malachi',
  'mateus':'matthew','mt':'matthew',
  'marcos':'mark','mc':'mark',
  'lucas':'luke','lc':'luke',
  'joão':'john','joao':'john',
  'atos':'acts','at':'acts',
  'romanos':'romans','rm':'romans',
  '1 coríntios':'1corinthians','1corintios':'1corinthians','1co':'1corinthians',
  '2 coríntios':'2corinthians','2corintios':'2corinthians','2co':'2corinthians',
  'gálatas':'galatians','galatas':'galatians','gl':'galatians',
  'efésios':'ephesians','efesios':'ephesians','ef':'ephesians',
  'filipenses':'philippians','fp':'philippians',
  'colossenses':'colossians','cl':'colossians',
  '1 tessalonicenses':'1thessalonians','1ts':'1thessalonians',
  '2 tessalonicenses':'2thessalonians','2ts':'2thessalonians',
  '1 timóteo':'1timothy','1timoteo':'1timothy','1tm':'1timothy',
  '2 timóteo':'2timothy','2timoteo':'2timothy','2tm':'2timothy',
  'tito':'titus','tt':'titus',
  'filemom':'philemon','fm':'philemon',
  'hebreus':'hebrews','hb':'hebrews',
  'tiago':'james','tg':'james',
  '1 pedro':'1peter','1pedro':'1peter','1pe':'1peter',
  '2 pedro':'2peter','2pedro':'2peter','2pe':'2peter',
  '1 joão':'1john','1joao':'1john','1jo':'1john',
  '2 joão':'2john','2joao':'2john','2jo':'2john',
  '3 joão':'3john','3joao':'3john','3jo':'3john',
  'judas':'jude','jd':'jude',
  'apocalipse':'revelation','ap':'revelation'
};

function parsearReferencia(ref) {
  // Ex: "João 3:16", "1Co 2:1-5", "Sl 23"
  const clean = ref.trim().toLowerCase().normalize('NFC');
  const match = clean.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
  if (!match) return null;
  const [, livroRaw, cap, vers, versEnd] = match;
  const slug = LIVROS_MAP[livroRaw.trim()];
  if (!slug) return null;
  let query = `${slug}+${cap}`;
  if (vers) query += `:${vers}`;
  if (versEnd) query += `-${versEnd}`;
  return { slug, cap, vers, versEnd, query, livroOriginal: livroRaw.trim() };
}

async function buscarPorReferencia() {
  const ref = document.getElementById('bibliaRef').value.trim();
  if (!ref) return;
  const el = document.getElementById('bibliaResultado');
  el.innerHTML = '<div class="bible-loading">Buscando…</div>';
  const parsed = parsearReferencia(ref);
  if (!parsed) { el.innerHTML = '<div class="bible-error">Referência não reconhecida. Tente: João 3:16 ou Sl 23</div>'; return; }
  try {
    const res = await fetch(`${BIBLE_API}/${encodeURIComponent(parsed.query)}?translation=almeida`);
    const data = await res.json();
    if (data.error) { el.innerHTML = `<div class="bible-error">Versículo não encontrado.</div>`; return; }
    renderizarResultadoBiblia(data, ref);
  } catch { el.innerHTML = '<div class="bible-error">Erro ao buscar. Verifique sua conexão.</div>'; }
}

async function buscarPorPalavra() {
  const palavra = document.getElementById('bibliaPalavra').value.trim();
  if (!palavra) return;
  const el = document.getElementById('bibliaResultado');
  el.innerHTML = '<div class="bible-loading">Buscando…</div>';
  try {
    const res = await fetch(`${BIBLE_API}/?q=${encodeURIComponent(palavra)}&translation=almeida`);
    const data = await res.json();
    if (!data.verses?.length) { el.innerHTML = '<div class="bible-error">Nenhum resultado encontrado.</div>'; return; }
    renderizarResultadoBiblia(data, `"${palavra}"`);
  } catch { el.innerHTML = '<div class="bible-error">Erro ao buscar. Verifique sua conexão.</div>'; }
}

function renderizarResultadoBiblia(data, refOriginal) {
  const verses = data.verses || [];
  if (!verses.length) { document.getElementById('bibliaResultado').innerHTML = '<div class="bible-error">Nenhum versículo encontrado.</div>'; return; }
  const ref = data.reference || refOriginal;
  const html = `
    <div class="bible-result">
      <div class="bible-result-ref">📖 ${ref} — NVI (Almeida)</div>
      ${verses.map(v => `
        <div class="bible-verse">
          <span class="bible-verse-num">${v.verse}</span>
          <span class="bible-verse-text">${esc(v.text.trim())}</span>
          <div class="bible-verse-actions">
            <button class="bible-verse-btn" onclick="prepararFavorito(${JSON.stringify({ref: ref+':'+v.verse, livro: v.book_name, cap: v.chapter, vers: v.verse, texto: v.text.trim()}).replace(/"/g,'&quot;')})">⭐</button>
          </div>
        </div>`).join('')}
    </div>`;
  document.getElementById('bibliaResultado').innerHTML = html;
}

// ── Favoritos ─────────────────────────────────────────────────────────────────
function prepararFavorito(dados) {
  favoritoTemp = dados;
  document.getElementById('anotacaoVersiculo').textContent = `${dados.ref} — "${dados.texto}"`;
  document.getElementById('anotacaoTexto').value = '';
  abrirModal('modal-anotacao');
}

async function confirmarFavorito() {
  if (!favoritoTemp) return;
  try {
    await post({ acao: 'salvar_favorito', data: {
      referencia: favoritoTemp.ref,
      livro: favoritoTemp.livro,
      capitulo: favoritoTemp.cap,
      versiculo: favoritoTemp.vers,
      texto: favoritoTemp.texto,
      anotacao: document.getElementById('anotacaoTexto').value,
      categoria: document.getElementById('anotacaoCategoria').value,
    }});
    fecharModal('modal-anotacao');
    favoritoTemp = null;
    toast('Versículo salvo nos favoritos! ⭐', 'ok');
  } catch(e) { toast(e.message || 'Erro ao salvar.', 'err'); }
}

async function carregarFavoritos() {
  const cat = document.getElementById('favCategoria').value || 'todas';
  try {
    const res = await post({ acao: 'listar_favoritos', categoria: cat });
    // Atualizar select de categorias
    const sel = document.getElementById('favCategoria');
    const valAtual = sel.value;
    sel.innerHTML = '<option value="todas">Todas as categorias</option>';
    (res.categorias || []).forEach(c => { const opt = document.createElement('option'); opt.value = c; opt.textContent = c.charAt(0).toUpperCase()+c.slice(1); sel.appendChild(opt); });
    sel.value = valAtual;
    renderizarFavoritos(res.favoritos || []);
  } catch { toast('Erro ao carregar favoritos.', 'err'); }
}

function renderizarFavoritos(lista) {
  const el = document.getElementById('listaFavoritos');
  if (!lista.length) { el.innerHTML = '<div class="empty-state">Nenhum versículo favorito ainda.<br>Busca um versículo e clica em ⭐</div>'; return; }
  el.innerHTML = lista.map(f => `
    <div class="fav-card">
      <div class="fav-ref">
        <span>📖 ${esc(f.referencia)}</span>
      </div>
      <div class="fav-text">${esc(f.texto)}</div>
      ${f.anotacao ? `<div class="fav-anotacao">📝 ${esc(f.anotacao)}</div>` : ''}
      <div class="fav-footer">
        <span class="fav-cat">${esc(f.categoria)}</span>
        <button class="fav-del" onclick="excluirFavorito(${f.id})">🗑️ Remover</button>
      </div>
    </div>`).join('');
}

async function excluirFavorito(id) {
  if (!confirm('Remover dos favoritos?')) return;
  try { await post({ acao: 'excluir_favorito', id }); toast('Removido.', 'ok'); carregarFavoritos(); }
  catch { toast('Erro.', 'err'); }
}

// ── Estudos ───────────────────────────────────────────────────────────────────
async function carregarEstudos() {
  try {
    const res = await post({ acao: 'listar_estudos' });
    renderizarEstudos(res.estudos || []);
  } catch { toast('Erro ao carregar estudos.', 'err'); }
}

function renderizarEstudos(lista) {
  const el = document.getElementById('listaEstudos');
  if (!lista.length) { el.innerHTML = '<div class="empty-state">Nenhum estudo criado ainda.</div>'; return; }
  const catLabel = { geral:'Geral', pregacao:'Pregação', estudo:'Estudo Bíblico', devocional:'Devocional', celula:'Célula' };
  el.innerHTML = lista.map(e => `
    <div class="estudo-card">
      <div class="estudo-titulo">${esc(e.titulo)}</div>
      ${e.versiculo_base ? `<div class="estudo-versiculo">📖 ${esc(e.versiculo_base)}</div>` : ''}
      ${e.texto_base ? `<div class="fav-text" style="font-size:13px;margin-bottom:8px;color:var(--text-2)">${esc(e.texto_base)}</div>` : ''}
      ${e.conteudo ? `<div class="estudo-preview">${esc(e.conteudo)}</div>` : ''}
      <div class="estudo-footer">
        <span class="estudo-cat">${catLabel[e.categoria]||e.categoria}</span>
        <div class="estudo-acoes">
          <span class="estudo-data">${fmt(e.atualizado_em?.split('T')[0])}</span>
          <button class="bible-verse-btn" onclick="editarEstudo(${e.id})">✏️</button>
          <button class="bible-verse-btn" style="color:var(--danger)" onclick="excluirEstudo(${e.id},'${esc(e.titulo)}')">🗑️</button>
        </div>
      </div>
    </div>`).join('');
}

async function salvarEstudo() {
  const titulo = document.getElementById('est-titulo').value.trim();
  if (!titulo) { toast('Título é obrigatório.', 'err'); return; }
  const data = { titulo, conteudo: document.getElementById('est-conteudo').value, versiculo_base: document.getElementById('est-versiculo').value, texto_base: document.getElementById('est-texto-base').value, categoria: document.getElementById('est-categoria').value };
  try {
    if (estudoEditandoId) {
      await post({ acao: 'atualizar_estudo', id: estudoEditandoId, data });
      toast('Estudo atualizado!', 'ok');
    } else {
      await post({ acao: 'salvar_estudo', data });
      toast('Estudo salvo!', 'ok');
    }
    fecharModal('modal-estudo');
    limpar(['est-titulo','est-versiculo','est-texto-base','est-conteudo']);
    estudoEditandoId = null;
    document.getElementById('modalEstudoTitulo').textContent = 'Novo Estudo';
    carregarEstudos();
  } catch { toast('Erro ao salvar.', 'err'); }
}

function editarEstudo(id) {
  // Busca os dados do estudo na lista renderizada — mais simples que uma query extra
  post({ acao: 'listar_estudos' }).then(res => {
    const e = (res.estudos||[]).find(x=>x.id===id);
    if (!e) return;
    estudoEditandoId = id;
    document.getElementById('modalEstudoTitulo').textContent = 'Editar Estudo';
    document.getElementById('est-titulo').value = e.titulo||'';
    document.getElementById('est-versiculo').value = e.versiculo_base||'';
    document.getElementById('est-texto-base').value = e.texto_base||'';
    document.getElementById('est-categoria').value = e.categoria||'geral';
    document.getElementById('est-conteudo').value = e.conteudo||'';
    abrirModal('modal-estudo');
  });
}

async function excluirEstudo(id, titulo) {
  if (!confirm(`Excluir estudo "${titulo}"?`)) return;
  try { await post({ acao: 'excluir_estudo', id }); toast('Estudo removido.', 'ok'); carregarEstudos(); }
  catch { toast('Erro.', 'err'); }
}

// ── Modais ────────────────────────────────────────────────────────────────────
function abrirModal(id){ document.getElementById(id).classList.add('open'); }
function fecharModal(id){ document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(o=>{ o.addEventListener('click',e=>{ if(e.target===o) fecharModal(o.id); }); });

// ── Utils ─────────────────────────────────────────────────────────────────────
function esc(str){ return String(str??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmt(d){ if(!d)return''; const[y,m,dd]=String(d).split('-'); return dd&&m&&y?`${dd}/${m}/${y}`:d; }
function fmtAniv(d){ if(!d)return''; const[,m,dd]=String(d).split('-'); return`${dd}/${m}`; }
function limpar(ids){ ids.forEach(id=>{ const el=document.getElementById(id); if(el)el.value=''; }); }
let toastTimer;
function toast(msg,tipo='ok'){ const el=document.getElementById('toast'); el.textContent=msg; el.className=`toast ${tipo} show`; clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),3500); }
