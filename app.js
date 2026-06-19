const API = '/api';
let BIBLIA_DATA = null;
const TOKEN_KEY = 'central_token';
let dadosEscalas = [], dadosServos = [];
let calAno = new Date().getFullYear(), calMes = new Date().getMonth();
let favoritoTemp = null, anotacaoVersoTemp = null, estudoEditandoId = null;
let livroAtual = null, capAtual = null, totalCapsAtual = 0;
let anotacoesLivro = { versiculos: [], capitulos: [] };
let versoAtual = null;
// Grifos: { 'genesis-3-16': 'amarelo', ... }
let grifos = {};
const GRIFO_CORES = ['amarelo','verde','rosa','azul','laranja'];
const GRIFO_HEX   = { amarelo:'#fbbf24', verde:'#2dd4a0', rosa:'#f472b6', azul:'#38bdf8', laranja:'#fb923c' };

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});

// ── Tema & Accent ──────────────────────────────────────────────────────────
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('central_theme', t);
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.id === 'btn-' + t));
}
function setAccent(a) {
  document.documentElement.setAttribute('data-accent', a);
  localStorage.setItem('central_accent', a);
  document.querySelectorAll('.accent-swatch').forEach(s => {
    const ok = s.dataset.accent === a;
    s.classList.toggle('active', ok);
    s.textContent = ok ? '✓' : '';
  });
}
function aplicarPreferencias() {
  setTheme(localStorage.getItem('central_theme')  || 'dark');
  setAccent(localStorage.getItem('central_accent') || 'indigo');
}
// Grifos persistem no localStorage
function carregarGrifos() {
  try { grifos = JSON.parse(localStorage.getItem('central_grifos') || '{}'); } catch { grifos = {}; }
}
function salvarGrifos() { localStorage.setItem('central_grifos', JSON.stringify(grifos)); }
function chaveGrifo(slug, cap, verse) { return `${slug}-${cap}-${verse}`; }

// ── Init ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  aplicarPreferencias();
  carregarGrifos();
  document.querySelectorAll('.accent-swatch').forEach(s => s.addEventListener('click', () => setAccent(s.dataset.accent)));
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    const auth = await postPublic({ acao: 'checar_auth' }, token).catch(() => ({ autenticado: false }));
    if (auth.autenticado) { mostrarApp(auth.usuario); return; }
    localStorage.removeItem(TOKEN_KEY);
  }
  document.getElementById('loginScreen').style.display = 'flex';
  ['loginPass','loginUser'].forEach(id => document.getElementById(id).addEventListener('keydown', e => { if (e.key==='Enter') fazerLogin(); }));
});

// ── Auth ──────────────────────────────────────────────────────────────────
async function fazerLogin() {
  const usuario = document.getElementById('loginUser').value.trim();
  const senha   = document.getElementById('loginPass').value;
  const errEl   = document.getElementById('loginError');
  errEl.textContent = '';
  try {
    const res = await postPublic({ acao:'login', usuario, senha });
    if (res.sucesso) { localStorage.setItem(TOKEN_KEY, res.token); mostrarApp(res.usuario); }
    else errEl.textContent = res.erro || 'Erro ao entrar';
  } catch { errEl.textContent = 'Erro de conexão'; }
}
async function fazerLogout() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) await postPublic({ acao:'logout' }, token).catch(()=>{});
  localStorage.removeItem(TOKEN_KEY);
  document.getElementById('appLayout').style.display   = 'none';
  document.getElementById('bottomNav').style.display   = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginPass').value = '';
}
function mostrarApp(usuario) {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appLayout').style.display   = 'flex';
  document.getElementById('bottomNav').style.display   = 'flex';
  document.getElementById('sidebarUser').textContent   = '👤 ' + usuario;
  const cu = document.getElementById('configUsuario'); if (cu) cu.textContent = usuario;
  setupEventos(); iniciarNavegacao(); renderizarLivros(); carregarDados();
}

// ── Navegação ─────────────────────────────────────────────────────────────
function iniciarNavegacao() {
  const todos = [...document.querySelectorAll('.nav-item'), ...document.querySelectorAll('.bottom-nav-item')];
  todos.forEach(btn => btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    todos.forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll(`[data-tab="${tab}"]`).forEach(b => b.classList.add('active'));
    document.getElementById('tab-' + tab).classList.add('active');
  }));
}
function irParaBiblia() {
  document.querySelectorAll('.nav-item,.bottom-nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('[data-tab="biblia"]').forEach(b => b.classList.add('active'));
  document.getElementById('tab-biblia').classList.add('active');
}

// ── Setup Eventos ─────────────────────────────────────────────────────────
function setupEventos() {
  document.getElementById('calPrev').addEventListener('click', () => { calMes--; if(calMes<0){calMes=11;calAno--;} renderizarCalendario(); });
  document.getElementById('calNext').addEventListener('click', () => { calMes++; if(calMes>11){calMes=0;calAno++;} renderizarCalendario(); });
  document.getElementById('bibliaRef').addEventListener('keydown', e => { if(e.key==='Enter') buscarPorReferencia(); });
  document.getElementById('bibliaPalavra').addEventListener('keydown', e => { if(e.key==='Enter') buscarPorPalavra(); });
  document.querySelectorAll('.bible-tab').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.bible-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.bible-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('btab-' + btn.dataset.btab).classList.add('active');
    if (btn.dataset.btab === 'favoritos') carregarFavoritos();
    if (btn.dataset.btab === 'estudos')   carregarEstudos();
  }));
  document.addEventListener('keydown', e => { if(e.key==='Escape') document.querySelectorAll('.modal-overlay.open').forEach(o => fecharModal(o.id)); });
}

// ── API ───────────────────────────────────────────────────────────────────
async function postPublic(payload, token=null) {
  const h = {'Content-Type':'application/json'}; if(token) h['X-Auth-Token']=token;
  return (await fetch(API, {method:'POST', headers:h, body:JSON.stringify(payload)})).json();
}
async function post(payload) {
  const token = localStorage.getItem(TOKEN_KEY);
  const h = {'Content-Type':'application/json'}; if(token) h['X-Auth-Token']=token;
  const res = await fetch(API, {method:'POST', headers:h, body:JSON.stringify(payload)});
  const data = await res.json();
  if (data.auth===false) { fazerLogout(); throw new Error('Não autenticado'); }
  return data;
}
async function carregarBibliaJSON() {
  if (BIBLIA_DATA) return BIBLIA_DATA;
  BIBLIA_DATA = await (await fetch('/biblia.json')).json();
  return BIBLIA_DATA;
}

// ── Dados ─────────────────────────────────────────────────────────────────
async function carregarDados() {
  try {
    const dados = await post({ acao:'listar' });
    dadosEscalas = dados.escalas||[]; dadosServos = dados.servos||[];
    renderizarDashboard(); renderizarCalendario(); renderizarServos(dadosServos); preencherDropdownServos();
  } catch(e) { if(e.message!=='Não autenticado') toast('Erro ao carregar dados.','err'); }
}

// ── Dashboard ─────────────────────────────────────────────────────────────
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
function renderizarDashboard() {
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const proximas = dadosEscalas.filter(e => new Date(e.data+'T12:00:00')>=hoje).slice(0,5);
  const anivHoje = dadosServos.filter(s => { if(!s.aniversario) return false; const d=new Date(s.aniversario+'T12:00:00'); return d.getDate()===hoje.getDate()&&d.getMonth()===hoje.getMonth(); });
  const anivMes  = dadosServos.filter(s => { if(!s.aniversario) return false; return new Date(s.aniversario+'T12:00:00').getMonth()===hoje.getMonth(); }).sort((a,b)=>new Date(a.aniversario+'T12:00:00').getDate()-new Date(b.aniversario+'T12:00:00').getDate());
  document.getElementById('dashCards').innerHTML = `
    <div class="dash-card accent"><div class="dash-card-icon">📅</div><div class="dash-card-val">${dadosEscalas.length}</div><div class="dash-card-label">Escalas totais</div></div>
    <div class="dash-card success"><div class="dash-card-icon">👥</div><div class="dash-card-val">${dadosServos.filter(s=>s.ativo).length}</div><div class="dash-card-label">Servos ativos</div></div>
    <div class="dash-card warning"><div class="dash-card-icon">🎛️</div><div class="dash-card-val">${proximas.length}</div><div class="dash-card-label">Próximas escalas</div></div>
    <div class="dash-card ${anivHoje.length>0?'accent':''}"><div class="dash-card-icon">🎂</div><div class="dash-card-val">${anivMes.length}</div><div class="dash-card-label">Aniversários no mês</div></div>`;
  document.getElementById('dashProximas').innerHTML = proximas.length ? proximas.map(e=>`<div class="dash-item"><div class="dash-item-dot"></div><div class="dash-item-text">${esc(e.operador)}</div><div class="dash-item-date">${fmt(e.data)}</div></div>`).join('') : '<div class="empty-state" style="padding:16px 0">Nenhuma escala futura.</div>';
  document.getElementById('dashAniversarios').innerHTML = anivMes.length ? anivMes.map(s=>{const d=new Date(s.aniversario+'T12:00:00');const eh=d.getDate()===hoje.getDate();return`<div class="dash-item"><div class="dash-item-dot ${eh?'warning':''}"></div><div class="dash-item-text">${esc(s.nome)}${eh?' 🎉':''}</div><div class="dash-item-date">${fmtAniv(s.aniversario)}</div></div>`;}).join('') : '<div class="empty-state" style="padding:16px 0">Nenhum aniversário este mês.</div>';
  if (anivHoje.length) toast(`🎂 Aniversário hoje: ${anivHoje.map(s=>s.nome).join(', ')}`, 'ok');
}

// ── Calendário ────────────────────────────────────────────────────────────
function renderizarCalendario() {
  document.getElementById('calTitulo').textContent = `${MESES[calMes]} ${calAno}`;
  const grid = document.getElementById('calendarGrid'); grid.innerHTML = '';
  DIAS.forEach(d => { const el=document.createElement('div'); el.className='cal-weekday'; el.textContent=d; grid.appendChild(el); });
  const primeiroDia=new Date(calAno,calMes,1).getDay(), totalDias=new Date(calAno,calMes+1,0).getDate(), hoje=new Date();
  for(let i=0;i<primeiroDia;i++){ const el=document.createElement('div'); el.className='cal-day empty'; grid.appendChild(el); }
  for(let d=1;d<=totalDias;d++){
    const dataStr=`${calAno}-${String(calMes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const esc2=dadosEscalas.filter(e=>e.data===dataStr);
    const el=document.createElement('div'); el.className='cal-day';
    if(d===hoje.getDate()&&calMes===hoje.getMonth()&&calAno===hoje.getFullYear()) el.classList.add('today');
    if(esc2.length) el.classList.add('has-escala');
    const num=document.createElement('div'); num.className='cal-day-num'; num.textContent=d; el.appendChild(num);
    esc2.forEach(e=>{const chip=document.createElement('div');chip.className='cal-escala-chip';chip.textContent=e.operador;el.appendChild(chip);});
    if(esc2.some(e=>e.obs?.trim())){const dot=document.createElement('div');dot.className='cal-obs-dot';el.appendChild(dot);}
    el.addEventListener('click',()=>abrirDetalhe(dataStr,esc2,d)); grid.appendChild(el);
  }
}
function abrirDetalhe(dataStr,escalas,dia) {
  document.getElementById('dayDetailTitle').textContent=`${dia} de ${MESES[calMes]} de ${calAno}`;
  document.getElementById('dayDetailBody').innerHTML=escalas.length?escalas.map(e=>`<div class="detail-escala"><div class="detail-row"><span>Operador</span><span>${esc(e.operador)}</span></div>${e.telefone?`<div class="detail-row"><span>Telefone</span><span>${esc(e.telefone)}</span></div>`:''} ${e.musicas?`<div class="detail-row"><span>Músicas</span><span>${esc(e.musicas)}</span></div>`:''} ${e.obs?`<div class="detail-obs">📝 ${esc(e.obs)}</div>`:''}<div style="margin-top:10px"><button class="btn btn--danger" style="font-size:12px;padding:6px 12px" onclick="excluirEscala(${e.id},'${esc(e.operador)}')">Remover</button></div></div>`).join(''):`<div class="empty-state" style="padding:16px 0">Dia livre.<br><button class="btn btn--primary" style="margin-top:12px" onclick="abrirModal('modal-escala')">+ Escalar</button></div>`;
  const d=document.getElementById('dayDetail'); d.style.display='block'; d.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function fecharDetalhe() { document.getElementById('dayDetail').style.display='none'; }

// ── Escalas ───────────────────────────────────────────────────────────────
function preencherDropdownServos() {
  const sel=document.getElementById('esc-operador'), val=sel.value;
  sel.innerHTML='<option value="">Selecionar servo…</option>';
  dadosServos.filter(s=>s.ativo).forEach(s=>{const opt=document.createElement('option');opt.value=s.nome;opt.textContent=s.nome+(s.funcao?` — ${s.funcao}`:'');sel.appendChild(opt);});
  sel.value=val;
}
async function salvarEscala() {
  const data=document.getElementById('esc-data').value, operador=document.getElementById('esc-operador').value;
  if(!data||!operador){toast('Data e Operador são obrigatórios.','err');return;}
  const servo=dadosServos.find(s=>s.nome===operador);
  try{ await post({acao:'salvar',tipo:'escala',data:{data,operador,telefone:servo?.telefone||'',musicas:document.getElementById('esc-musicas').value,obs:document.getElementById('esc-obs').value}}); fecharModal('modal-escala'); limpar(['esc-data','esc-operador','esc-musicas','esc-obs']); toast('Escala salva!','ok'); carregarDados(); }catch{toast('Erro ao salvar.','err');}
}
async function excluirEscala(id,nome){if(!confirm(`Excluir escala de ${nome}?`))return;try{await post({acao:'excluir',tipo:'escala',id});toast('Removida.','ok');fecharDetalhe();carregarDados();}catch{toast('Erro.','err');}}

// ── Servos ────────────────────────────────────────────────────────────────
function renderizarServos(lista) {
  const el=document.getElementById('lista-servos');
  if(!lista.length){el.innerHTML='<div class="empty-state">Nenhum servo cadastrado.</div>';return;}
  const hoje=new Date();
  el.innerHTML=lista.map(s=>{
    const ini=s.nome.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();
    const eh=s.aniversario&&(()=>{const d=new Date(s.aniversario+'T12:00:00');return d.getDate()===hoje.getDate()&&d.getMonth()===hoje.getMonth();})();
    return `<div class="servo-card ${s.ativo?'':'servo-inactive'}">
      <button class="servo-card-del" onclick="excluirServo(${s.id},'${esc(s.nome)}')">✕</button>
      <div class="servo-card-top"><div class="servo-card-avatar">${ini}</div><div><div class="servo-card-name">${esc(s.nome)}</div><div class="servo-card-funcao">${s.funcao?esc(s.funcao):'—'}</div></div></div>
      <div class="servo-card-body">
        ${s.telefone?`<div class="servo-card-row"><span class="servo-card-row-icon">📞</span><span class="servo-card-row-val">${esc(s.telefone)}</span></div>`:''}
        ${s.email   ?`<div class="servo-card-row"><span class="servo-card-row-icon">✉️</span><span class="servo-card-row-val">${esc(s.email)}</span></div>`:''}
        ${s.aniversario?`<div class="servo-card-row"><span class="servo-card-row-icon">🎂</span><span class="servo-card-row-val">${fmtAniv(s.aniversario)}</span></div>`:''}
      </div>
      <div class="servo-card-footer">${eh?`<span class="servo-badge aniversario">🎉 Hoje!</span>`:''} ${!s.ativo?`<span class="servo-badge inativo">Inativo</span>`:''}</div>
    </div>`;
  }).join('');
}
function filtrarServos(){const q=document.getElementById('buscarServo').value.toLowerCase();renderizarServos(dadosServos.filter(s=>s.nome.toLowerCase().includes(q)||(s.funcao||'').toLowerCase().includes(q)));}
async function salvarServo(){const nome=document.getElementById('srv-nome').value.trim();if(!nome){toast('Nome é obrigatório.','err');return;}try{await post({acao:'salvar',tipo:'servo',data:{nome,telefone:document.getElementById('srv-telefone').value,funcao:document.getElementById('srv-funcao').value,email:document.getElementById('srv-email').value,aniversario:document.getElementById('srv-aniversario').value}});fecharModal('modal-servo');limpar(['srv-nome','srv-telefone','srv-funcao','srv-email','srv-aniversario']);toast('Servo salvo!','ok');carregarDados();}catch{toast('Erro.','err');}}
async function excluirServo(id,nome){if(!confirm(`Excluir ${nome}?`))return;try{await post({acao:'excluir',tipo:'servo',id});toast('Removido.','ok');carregarDados();}catch{toast('Erro.','err');}}

// ══ BÍBLIA ════════════════════════════════════════════════════════════════
const BIBLIA = {
  at:[{nome:'Gênesis',slug:'genesis',caps:50},{nome:'Êxodo',slug:'exodus',caps:40},{nome:'Levítico',slug:'leviticus',caps:27},{nome:'Números',slug:'numbers',caps:36},{nome:'Deuteronômio',slug:'deuteronomy',caps:34},{nome:'Josué',slug:'joshua',caps:24},{nome:'Juízes',slug:'judges',caps:21},{nome:'Rute',slug:'ruth',caps:4},{nome:'1 Samuel',slug:'1samuel',caps:31},{nome:'2 Samuel',slug:'2samuel',caps:24},{nome:'1 Reis',slug:'1kings',caps:22},{nome:'2 Reis',slug:'2kings',caps:25},{nome:'1 Crônicas',slug:'1chronicles',caps:29},{nome:'2 Crônicas',slug:'2chronicles',caps:36},{nome:'Esdras',slug:'ezra',caps:10},{nome:'Neemias',slug:'nehemiah',caps:13},{nome:'Ester',slug:'esther',caps:10},{nome:'Jó',slug:'job',caps:42},{nome:'Salmos',slug:'psalms',caps:150},{nome:'Provérbios',slug:'proverbs',caps:31},{nome:'Eclesiastes',slug:'ecclesiastes',caps:12},{nome:'Cantares',slug:'song of solomon',caps:8},{nome:'Isaías',slug:'isaiah',caps:66},{nome:'Jeremias',slug:'jeremiah',caps:52},{nome:'Lamentações',slug:'lamentations',caps:5},{nome:'Ezequiel',slug:'ezekiel',caps:48},{nome:'Daniel',slug:'daniel',caps:12},{nome:'Oséias',slug:'hosea',caps:14},{nome:'Joel',slug:'joel',caps:3},{nome:'Amós',slug:'amos',caps:9},{nome:'Obadias',slug:'obadiah',caps:1},{nome:'Jonas',slug:'jonah',caps:4},{nome:'Miquéias',slug:'micah',caps:7},{nome:'Naum',slug:'nahum',caps:3},{nome:'Habacuque',slug:'habakkuk',caps:3},{nome:'Sofonias',slug:'zephaniah',caps:3},{nome:'Ageu',slug:'haggai',caps:2},{nome:'Zacarias',slug:'zechariah',caps:14},{nome:'Malaquias',slug:'malachi',caps:4}],
  nt:[{nome:'Mateus',slug:'matthew',caps:28},{nome:'Marcos',slug:'mark',caps:16},{nome:'Lucas',slug:'luke',caps:24},{nome:'João',slug:'john',caps:21},{nome:'Atos',slug:'acts',caps:28},{nome:'Romanos',slug:'romans',caps:16},{nome:'1 Coríntios',slug:'1corinthians',caps:16},{nome:'2 Coríntios',slug:'2corinthians',caps:13},{nome:'Gálatas',slug:'galatians',caps:6},{nome:'Efésios',slug:'ephesians',caps:6},{nome:'Filipenses',slug:'philippians',caps:4},{nome:'Colossenses',slug:'colossians',caps:4},{nome:'1 Tessalonicenses',slug:'1thessalonians',caps:5},{nome:'2 Tessalonicenses',slug:'2thessalonians',caps:3},{nome:'1 Timóteo',slug:'1timothy',caps:6},{nome:'2 Timóteo',slug:'2timothy',caps:4},{nome:'Tito',slug:'titus',caps:3},{nome:'Filemom',slug:'philemon',caps:1},{nome:'Hebreus',slug:'hebrews',caps:13},{nome:'Tiago',slug:'james',caps:5},{nome:'1 Pedro',slug:'1peter',caps:5},{nome:'2 Pedro',slug:'2peter',caps:3},{nome:'1 João',slug:'1john',caps:5},{nome:'2 João',slug:'2john',caps:1},{nome:'3 João',slug:'3john',caps:1},{nome:'Judas',slug:'jude',caps:1},{nome:'Apocalipse',slug:'revelation',caps:22}]
};

function renderizarLivros() {
  const r=(lista,id)=>{document.getElementById(id).innerHTML=lista.map(l=>`<button class="book-btn" onclick="abrirLivro('${l.slug}','${esc(l.nome)}',${l.caps})"><span>${esc(l.nome)}</span><span class="book-abbr">${l.caps} cap${l.caps>1?'s':''}</span></button>`).join('');};
  r(BIBLIA.at,'booksAT'); r(BIBLIA.nt,'booksNT');
}
async function abrirLivro(slug,nome,totalCaps) {
  livroAtual={slug,nome,totalCaps}; totalCapsAtual=totalCaps;
  document.getElementById('livroAtualTitulo').textContent=nome;
  document.getElementById('nivel-livros').style.display='none';
  document.getElementById('nivel-capitulos').style.display='block';
  document.getElementById('nivel-versiculos').style.display='none';
  try{const res=await post({acao:'listar_anotacoes_livro',livro:slug});anotacoesLivro=res;}catch{anotacoesLivro={versiculos:[],capitulos:[]};}
  try{const res=await post({acao:'buscar_anotacao_capitulo',livro:slug,capitulo:0});document.getElementById('capNotaTexto').value=res.texto||'';}catch{document.getElementById('capNotaTexto').value='';}
  const grid=document.getElementById('chaptersGrid'); grid.innerHTML='';
  for(let c=1;c<=totalCaps;c++){
    const btn=document.createElement('button'); btn.className='chap-btn'; btn.textContent=c;
    if(anotacoesLivro.capitulos.includes(String(c))||anotacoesLivro.capitulos.includes(c)) btn.classList.add('has-nota');
    else if(anotacoesLivro.versiculos.some(v=>v.capitulo==c)) btn.classList.add('has-verso-nota');
    btn.addEventListener('click',()=>abrirCapitulo(c)); grid.appendChild(btn);
  }
}
function voltarLivros(){document.getElementById('nivel-livros').style.display='block';document.getElementById('nivel-capitulos').style.display='none';}

async function abrirCapitulo(cap) {
  capAtual=cap;
  document.getElementById('capAtualTitulo').textContent=`${livroAtual.nome} ${cap}`;
  document.getElementById('nivel-capitulos').style.display='none';
  document.getElementById('nivel-versiculos').style.display='block';
  // Setas de capítulo
  document.getElementById('btnCapPrev').disabled = cap <= 1;
  document.getElementById('btnCapNext').disabled = cap >= totalCapsAtual;
  try{const res=await post({acao:'buscar_anotacao_capitulo',livro:livroAtual.slug,capitulo:cap});document.getElementById('verseCapNotaTexto').value=res.texto||'';}catch{document.getElementById('verseCapNotaTexto').value='';}
  const lista=document.getElementById('versiculosList');
  lista.innerHTML='<div class="bible-loading">Carregando…</div>';
  try{
    const biblia=await carregarBibliaJSON(), ld=biblia[livroAtual.slug];
    if(!ld||!ld.caps[cap-1]){lista.innerHTML='<div class="bible-error">Capítulo não encontrado.</div>';return;}
    renderizarVersiculos(ld.caps[cap-1].map((texto,i)=>({verse:i+1,text:texto})));
    lista.scrollTo({top:0}); document.getElementById('nivel-versiculos').scrollIntoView({behavior:'smooth',block:'start'});
  }catch{lista.innerHTML='<div class="bible-error">Erro ao carregar.</div>';}
}
function voltarCapitulos(){document.getElementById('nivel-versiculos').style.display='none';document.getElementById('nivel-capitulos').style.display='block';}
function irCapAnterior(){if(capAtual>1) abrirCapitulo(capAtual-1);}
function irCapProximo(){if(capAtual<totalCapsAtual) abrirCapitulo(capAtual+1);}

// ── Renderizar versículos ─────────────────────────────────────────────────
// Usa data-verse e data-text em vez de onclick inline — compatível com Safari iOS
let _versesCache = []; // cache dos verses para o handler de delegação

function renderizarVersiculos(verses) {
  _versesCache = verses;
  const lista = document.getElementById('versiculosList');
  lista.innerHTML = verses.map(v => {
    const temNota = anotacoesLivro.versiculos.some(a => a.capitulo == capAtual && a.versiculo == v.verse);
    const cor = grifos[chaveGrifo(livroAtual.slug, capAtual, v.verse)] || '';
    const badges = [];
    if (temNota) badges.push(`<span class="verse-nota-badge">📝 Anotado</span>`);
    if (cor) badges.push(`<span class="verse-grifo-badge" style="background:${GRIFO_HEX[cor]}22;color:${GRIFO_HEX[cor]}">● ${cor}</span>`);
    // Guarda o número do versículo em data-verse; o texto é buscado do cache
    return `<div class="verse-item ${temNota ? 'has-nota' : ''} ${cor ? 'grifo-' + cor : ''}" id="verse-${v.verse}" data-verse="${v.verse}">
      <span class="verse-num">${v.verse}</span>
      <div class="verse-body">
        <div class="verse-text">${esc(v.text.trim())}</div>
        ${badges.length ? `<div class="verse-badges">${badges.join('')}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  // Delegação de evento no container — funciona em qualquer browser/iOS
  lista.ontouchend = null;
  lista.onclick = null;
  const handler = (e) => {
    const item = e.target.closest('.verse-item[data-verse]');
    if (!item) return;
    e.preventDefault();
    const verseNum = parseInt(item.dataset.verse);
    const verseObj = _versesCache.find(v => v.verse === verseNum);
    if (verseObj) abrirModalVerso(verseNum, verseObj.text.trim());
  };
  lista.addEventListener('click', handler);
  lista.addEventListener('touchend', handler, { passive: false });

  // Preview de notas
  anotacoesLivro.versiculos.filter(a => a.capitulo == capAtual).forEach(async a => {
    try {
      const res = await post({ acao: 'buscar_anotacao_versiculo', livro: livroAtual.slug, capitulo: capAtual, versiculo: a.versiculo });
      const badge = document.querySelector(`#verse-${a.versiculo} .verse-nota-badge`);
      if (badge && res.texto) badge.textContent = '📝 ' + res.texto.substring(0, 50) + (res.texto.length > 50 ? '…' : '');
    } catch {}
  });
}

// ── Modal de ação do versículo ────────────────────────────────────────────
function abrirModalVerso(verse,texto) {
  versoAtual={verse,texto};
  const ref=`${livroAtual.nome} ${capAtual}:${verse}`;
  document.getElementById('versoAcaoRef').textContent  = ref;
  document.getElementById('versoAcaoTexto').textContent= texto;
  // Grifo seletor
  const corAtual=grifos[chaveGrifo(livroAtual.slug,capAtual,verse)]||'';
  document.querySelectorAll('.grifo-swatch').forEach(s=>{
    s.classList.toggle('active', s.dataset.cor===corAtual);
  });
  abrirModal('modal-verso-acao');
}
function acaoVerso(tipo) {
  if(!versoAtual) return;
  const ref  =`${livroAtual.nome} ${capAtual}:${versoAtual.verse}`;
  const texto=versoAtual.texto;
  if(tipo==='anotar'){
    fecharModal('modal-verso-acao');
    document.getElementById('anotacaoVersoPreview').textContent=`${ref} — "${texto.substring(0,100)}${texto.length>100?'…':''}"`;
    post({acao:'buscar_anotacao_versiculo',livro:livroAtual.slug,capitulo:capAtual,versiculo:versoAtual.verse})
      .then(r=>{document.getElementById('anotacaoVersoTexto').value=r.texto||'';})
      .catch(()=>{document.getElementById('anotacaoVersoTexto').value='';});
    anotacaoVersoTemp=versoAtual;
    abrirModal('modal-anotacao-verso');
  } else if(tipo==='favoritar'){
    fecharModal('modal-verso-acao');
    favoritoTemp={ref,livro:livroAtual.slug,cap:capAtual,vers:versoAtual.verse,texto};
    document.getElementById('favoritoPreview').textContent=`${ref} — "${texto.substring(0,100)}"`;
    document.getElementById('favoritoAnotacao').value='';
    abrirModal('modal-favorito');
  } else if(tipo==='copiar'){
    fecharModal('modal-verso-acao');
    const c=`"${texto}" — ${ref} (NVI)`;
    if(navigator.clipboard){navigator.clipboard.writeText(c).then(()=>toast('Copiado! 📋','ok')).catch(()=>copiarFallback(c));}
    else copiarFallback(c);
  } else if(tipo==='compartilhar'){
    fecharModal('modal-verso-acao');
    const c=`"${texto}" — ${ref} (NVI)`;
    if(navigator.share){navigator.share({title:ref,text:c}).catch(()=>{});}
    else if(navigator.clipboard){navigator.clipboard.writeText(c).then(()=>toast('Texto copiado 🔗','ok'));}
  }
}
function copiarFallback(txt){
  const ta=document.createElement('textarea'); ta.value=txt; ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta); ta.focus(); ta.select();
  try{document.execCommand('copy');toast('Copiado! 📋','ok');}catch{}
  document.body.removeChild(ta);
}
function aplicarGrifo(cor) {
  if(!versoAtual) return;
  const chave=chaveGrifo(livroAtual.slug,capAtual,versoAtual.verse);
  if(cor==='remover') delete grifos[chave]; else grifos[chave]=cor;
  salvarGrifos(); fecharModal('modal-verso-acao');
  // Re-renderizar sem re-buscar API
  const item=document.getElementById(`verse-${versoAtual.verse}`);
  if(item){
    GRIFO_CORES.forEach(c=>item.classList.remove('grifo-'+c));
    if(cor&&cor!=='remover') item.classList.add('grifo-'+cor);
    // atualizar badge
    let badge=item.querySelector('.verse-grifo-badge');
    if(cor&&cor!=='remover'){
      if(!badge){badge=document.createElement('span');badge.className='verse-grifo-badge';let bd=item.querySelector('.verse-badges');if(!bd){bd=document.createElement('div');bd.className='verse-badges';item.querySelector('.verse-body').appendChild(bd);}bd.appendChild(badge);}
      badge.style.background=GRIFO_HEX[cor]+'22'; badge.style.color=GRIFO_HEX[cor]; badge.textContent=`● ${cor}`;
    } else if(badge) badge.remove();
    // atualizar num color
    const num=item.querySelector('.verse-num');
    if(num) num.style.color = cor&&cor!=='remover' ? GRIFO_HEX[cor] : '';
  }
  toast(cor==='remover'?'Grifo removido':'Grifo aplicado ✨','ok');
}

// Versículos na busca
function abrirModalVersoBusca(verse,texto,nomeL,cap,slug){
  livroAtual=livroAtual||{slug,nome:nomeL}; if(!livroAtual.slug) livroAtual={slug,nome:nomeL};
  capAtual=cap; versoAtual={verse,texto};
  const ref=`${nomeL} ${cap}:${verse}`;
  document.getElementById('versoAcaoRef').textContent  =ref;
  document.getElementById('versoAcaoTexto').textContent=texto;
  document.querySelectorAll('.grifo-swatch').forEach(s=>s.classList.remove('active'));
  abrirModal('modal-verso-acao');
}
function renderizarResultadoBiblia(verses,refLabel){
  if(!verses.length){document.getElementById('bibliaResultado').innerHTML='<div class="bible-error">Sem resultados.</div>';return;}
  document.getElementById('bibliaResultado').innerHTML=`<div class="bible-result"><div class="bible-result-ref">📖 ${esc(refLabel)}</div>${verses.map(v=>`<div class="bible-verse" onclick="abrirModalVersoBusca(${v.verse},${JSON.stringify(v.text)},'${esc(v.nome||'')}',${v.cap},'${v.slug||''}')"><span class="bible-verse-num">${v.nome?`<span style="font-size:9px;display:block;color:var(--accent)">${esc(v.nome)} ${v.cap}</span>`:''}${v.verse}</span><span class="bible-verse-text">${esc(v.text)}</span></div>`).join('')}</div>`;
}

// Notas de capítulo
function toggleNotaCapitulo(){const f=document.getElementById('capNotaForm'),i=document.getElementById('capNotaToggleIcon'),o=f.style.display==='block';f.style.display=o?'none':'block';i.textContent=o?'▼':'▲';}
function toggleNotaCapituloVerses(){const f=document.getElementById('verseCapNotaForm'),i=document.getElementById('verseCapNotaIcon'),o=f.style.display==='block';f.style.display=o?'none':'block';i.textContent=o?'▼':'▲';}
async function salvarNotaCapituloAtual(){try{await post({acao:'salvar_anotacao_capitulo',livro:livroAtual.slug,capitulo:0,texto:document.getElementById('capNotaTexto').value});toast('Nota salva!','ok');}catch{toast('Erro.','err');}}
async function salvarNotaCapituloVerses(){try{await post({acao:'salvar_anotacao_capitulo',livro:livroAtual.slug,capitulo:capAtual,texto:document.getElementById('verseCapNotaTexto').value});toast('Nota salva!','ok');}catch{toast('Erro.','err');}}

async function salvarAnotacaoVerso(){
  if(!anotacaoVersoTemp) return;
  const texto=document.getElementById('anotacaoVersoTexto').value;
  try{
    await post({acao:'salvar_anotacao_versiculo',livro:livroAtual.slug,capitulo:capAtual,versiculo:anotacaoVersoTemp.verse,texto});
    fecharModal('modal-anotacao-verso'); toast('Anotação salva!','ok');
    const res=await post({acao:'listar_anotacoes_livro',livro:livroAtual.slug}); anotacoesLivro=res; abrirCapitulo(capAtual);
  }catch{toast('Erro.','err');}
}

// Favoritos
async function confirmarFavorito(){
  if(!favoritoTemp) return;
  try{await post({acao:'salvar_favorito',data:{referencia:favoritoTemp.ref,livro:favoritoTemp.livro,capitulo:favoritoTemp.cap,versiculo:favoritoTemp.vers,texto:favoritoTemp.texto,anotacao:document.getElementById('favoritoAnotacao').value,categoria:document.getElementById('favoritoCategoria').value}});fecharModal('modal-favorito');favoritoTemp=null;toast('Favorito salvo! ⭐','ok');}catch(e){toast(e.message||'Erro.','err');}
}
async function carregarFavoritos(){
  const cat=document.getElementById('favCategoria').value||'todas';
  try{
    const res=await post({acao:'listar_favoritos',categoria:cat});
    const sel=document.getElementById('favCategoria'),val=sel.value;
    sel.innerHTML='<option value="todas">Todas as categorias</option>';
    (res.categorias||[]).forEach(c=>{const opt=document.createElement('option');opt.value=c;opt.textContent=c.charAt(0).toUpperCase()+c.slice(1);sel.appendChild(opt);});
    sel.value=val;
    const el=document.getElementById('listaFavoritos'),lista=res.favoritos||[];
    if(!lista.length){el.innerHTML='<div class="empty-state">Nenhum favorito ainda.</div>';return;}
    el.innerHTML=lista.map(f=>`<div class="fav-card"><div class="fav-ref">📖 ${esc(f.referencia)}</div><div class="fav-text">${esc(f.texto)}</div>${f.anotacao?`<div class="fav-anotacao">📝 ${esc(f.anotacao)}</div>`:''}<div class="fav-footer"><span class="fav-cat">${esc(f.categoria)}</span><button class="fav-del" onclick="excluirFavorito(${f.id})">🗑️</button></div></div>`).join('');
  }catch{toast('Erro ao carregar favoritos.','err');}
}
async function excluirFavorito(id){if(!confirm('Remover favorito?'))return;try{await post({acao:'excluir_favorito',id});toast('Removido.','ok');carregarFavoritos();}catch{toast('Erro.','err');}}

// Estudos
async function carregarEstudos(){try{const res=await post({acao:'listar_estudos'});renderizarEstudos(res.estudos||[]);}catch{toast('Erro.','err');}}
function renderizarEstudos(lista){
  const el=document.getElementById('listaEstudos');
  if(!lista.length){el.innerHTML='<div class="empty-state">Nenhum estudo ainda.</div>';return;}
  const catL={geral:'Geral',pregacao:'Pregação',estudo:'Estudo Bíblico',devocional:'Devocional',celula:'Célula'};
  el.innerHTML=lista.map(e=>`<div class="estudo-card"><div class="estudo-titulo">${esc(e.titulo)}</div>${e.versiculo_base?`<div class="estudo-versiculo">📖 ${esc(e.versiculo_base)}</div>`:''} ${e.conteudo?`<div class="estudo-preview">${esc(e.conteudo)}</div>`:''}<div class="estudo-footer"><span class="estudo-cat">${catL[e.categoria]||e.categoria}</span><div class="estudo-acoes"><span class="estudo-data">${fmt(e.atualizado_em?.split('T')[0])}</span><button class="bible-verse-btn" onclick="editarEstudo(${e.id})">✏️</button><button class="bible-verse-btn" style="color:var(--danger)" onclick="excluirEstudo(${e.id},'${esc(e.titulo)}')">🗑️</button></div></div></div>`).join('');
}
async function salvarEstudo(){
  const titulo=document.getElementById('est-titulo').value.trim();if(!titulo){toast('Título obrigatório.','err');return;}
  const data={titulo,conteudo:document.getElementById('est-conteudo').value,versiculo_base:document.getElementById('est-versiculo').value,texto_base:document.getElementById('est-texto-base').value,categoria:document.getElementById('est-categoria').value};
  try{if(estudoEditandoId)await post({acao:'atualizar_estudo',id:estudoEditandoId,data});else await post({acao:'salvar_estudo',data});fecharModal('modal-estudo');limpar(['est-titulo','est-versiculo','est-texto-base','est-conteudo']);estudoEditandoId=null;document.getElementById('modalEstudoTitulo').textContent='Novo Estudo';toast('Estudo salvo!','ok');carregarEstudos();}catch{toast('Erro.','err');}
}
function editarEstudo(id){post({acao:'listar_estudos'}).then(res=>{const e=(res.estudos||[]).find(x=>x.id===id);if(!e)return;estudoEditandoId=id;document.getElementById('modalEstudoTitulo').textContent='Editar Estudo';document.getElementById('est-titulo').value=e.titulo||'';document.getElementById('est-versiculo').value=e.versiculo_base||'';document.getElementById('est-texto-base').value=e.texto_base||'';document.getElementById('est-categoria').value=e.categoria||'geral';document.getElementById('est-conteudo').value=e.conteudo||'';abrirModal('modal-estudo');});}
async function excluirEstudo(id,titulo){if(!confirm(`Excluir "${titulo}"?`))return;try{await post({acao:'excluir_estudo',id});toast('Removido.','ok');carregarEstudos();}catch{toast('Erro.','err');}}

// Busca
const NOMES_SLUG={},SLUGS_NOMES={};
async function iniciarMapaNomes(){const biblia=await carregarBibliaJSON();Object.entries(biblia).forEach(([slug,livro])=>{SLUGS_NOMES[slug]=livro.nome;NOMES_SLUG[livro.nome.toLowerCase()]=slug;const abrev=livro.abbr?.toLowerCase();if(abrev)NOMES_SLUG[abrev]=slug;});}
function parsearRefLocal(ref){const m=ref.trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i);if(!m)return null;const[,livroStr,cap,vers,versEnd]=m;const slug=NOMES_SLUG[livroStr.trim().toLowerCase()];if(!slug)return null;return{slug,cap:parseInt(cap),vers:vers?parseInt(vers):null,versEnd:versEnd?parseInt(versEnd):null};}
async function buscarPorReferencia(){
  const ref=document.getElementById('bibliaRef').value.trim();if(!ref)return;
  const el=document.getElementById('bibliaResultado');el.innerHTML='<div class="bible-loading">Buscando…</div>';
  await iniciarMapaNomes();const parsed=parsearRefLocal(ref);
  if(!parsed){el.innerHTML='<div class="bible-error">Referência não reconhecida. Ex: João 3:16</div>';return;}
  try{
    const biblia=await carregarBibliaJSON(),ld=biblia[parsed.slug];
    if(!ld){el.innerHTML='<div class="bible-error">Livro não encontrado.</div>';return;}
    const cap=ld.caps[parsed.cap-1];if(!cap){el.innerHTML='<div class="bible-error">Capítulo não encontrado.</div>';return;}
    let verses;
    if(parsed.vers){const fim=parsed.versEnd||parsed.vers;verses=cap.slice(parsed.vers-1,fim).map((t,i)=>({verse:parsed.vers+i,text:t,slug:parsed.slug,cap:parsed.cap,nome:ld.nome}));}
    else verses=cap.map((t,i)=>({verse:i+1,text:t,slug:parsed.slug,cap:parsed.cap,nome:ld.nome}));
    renderizarResultadoBiblia(verses,`${ld.nome} ${parsed.cap}${parsed.vers?':'+parsed.vers:''}${parsed.versEnd?'-'+parsed.versEnd:''}`);
  }catch{el.innerHTML='<div class="bible-error">Erro ao buscar.</div>';}
}
async function buscarPorPalavra(){
  const palavra=document.getElementById('bibliaPalavra').value.trim().toLowerCase();if(!palavra)return;
  const el=document.getElementById('bibliaResultado');el.innerHTML='<div class="bible-loading">Buscando em todos os livros…</div>';
  try{
    const biblia=await carregarBibliaJSON(),resultados=[];
    for(const[slug,livro]of Object.entries(biblia)){for(let ci=0;ci<livro.caps.length;ci++){for(let vi=0;vi<livro.caps[ci].length;vi++){if(livro.caps[ci][vi].toLowerCase().includes(palavra)){resultados.push({verse:vi+1,text:livro.caps[ci][vi],slug,cap:ci+1,nome:livro.nome});if(resultados.length>=30)break;}}if(resultados.length>=30)break;}if(resultados.length>=30)break;}
    if(!resultados.length){el.innerHTML='<div class="bible-error">Nenhum resultado encontrado.</div>';return;}
    renderizarResultadoBiblia(resultados,`"${palavra}" — ${resultados.length} resultado${resultados.length>1?'s':''}`);
  }catch{el.innerHTML='<div class="bible-error">Erro ao buscar.</div>';}
}

// ── Modais ────────────────────────────────────────────────────────────────
function abrirModal(id){document.getElementById(id).classList.add('open');}
function fecharModal(id){document.getElementById(id).classList.remove('open');}
document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)fecharModal(o.id);}));

// ── Utils ─────────────────────────────────────────────────────────────────
function esc(str){return String(str??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function fmt(d){if(!d)return'';const[y,m,dd]=String(d).split('-');return dd&&m&&y?`${dd}/${m}/${y}`:d;}
function fmtAniv(d){if(!d)return'';const[,m,dd]=String(d).split('-');return`${dd}/${m}`;}
function limpar(ids){ids.forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});}
let toastTimer;
function toast(msg,tipo='ok'){const el=document.getElementById('toast');el.textContent=msg;el.className=`toast ${tipo} show`;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3500);}
