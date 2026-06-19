const API = '/api';
let BIBLIA_DATA = null;
const TOKEN_KEY = 'central_token';
let dadosEscalas = [], dadosServos = [];
let calAno = new Date().getFullYear(), calMes = new Date().getMonth();
let favoritoTemp = null, anotacaoVersoTemp = null, estudoEditandoId = null;
let livroAtual = null, capAtual = null, totalCapsAtual = 0;
let anotacoesLivro = { versiculos: [], capitulos: [] };
let versoAtual = null;
let grifos = {};
const GRIFO_HEX = { amarelo:'#fbbf24', verde:'#2dd4a0', rosa:'#f472b6', azul:'#38bdf8', laranja:'#fb923c' };
let _versesCache = [];

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
  setTheme(localStorage.getItem('central_theme') || 'dark');
  setAccent(localStorage.getItem('central_accent') || 'indigo');
}
function carregarGrifos() { try { grifos = JSON.parse(localStorage.getItem('central_grifos') || '{}'); } catch { grifos = {}; } }
function salvarGrifos() { localStorage.setItem('central_grifos', JSON.stringify(grifos)); }
function chaveGrifo(slug, cap, verse) { return `${slug}-${cap}-${verse}`; }

// ── Init ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  aplicarPreferencias();
  carregarGrifos();
  document.querySelectorAll('.accent-swatch').forEach(s => s.addEventListener('click', () => setAccent(s.dataset.accent)));
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    const auth = await postPublic({ acao:'checar_auth' }, token).catch(() => ({ autenticado:false }));
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
  document.getElementById('appLayout').style.display  = 'none';
  document.getElementById('bottomNav').style.display  = 'none';
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
  // Esconder dica de swipe após 1ª visita
  if (localStorage.getItem('swipe_hint_seen')) {
    const h = document.getElementById('swipeHint'); if (h) h.style.display = 'none';
  }
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
  document.getElementById('calPrev')?.addEventListener('click', () => { calMes--; if(calMes<0){calMes=11;calAno--;} });
  document.getElementById('calNext')?.addEventListener('click', () => { calMes++; if(calMes>11){calMes=0;calAno++;} });
  document.getElementById('bibliaRef').addEventListener('keydown', e => { if(e.key==='Enter') buscarPorReferencia(); });
  document.getElementById('bibliaPalavra').addEventListener('keydown', e => { if(e.key==='Enter') buscarPorPalavra(); });
  document.querySelectorAll('.bible-tab').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.bible-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.bible-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('btab-' + btn.dataset.btab).classList.add('active');
    if (btn.dataset.btab==='favoritos') carregarFavoritos();
    if (btn.dataset.btab==='estudos')   carregarEstudos();
  }));
  document.addEventListener('keydown', e => { if(e.key==='Escape') document.querySelectorAll('.modal-overlay.open').forEach(o => fecharModal(o.id)); });
}

// ── API ───────────────────────────────────────────────────────────────────
async function postPublic(payload, token=null) {
  const h = {'Content-Type':'application/json'}; if(token) h['X-Auth-Token']=token;
  return (await fetch(API, {method:'POST',headers:h,body:JSON.stringify(payload)})).json();
}
async function post(payload) {
  const token = localStorage.getItem(TOKEN_KEY);
  const h = {'Content-Type':'application/json'}; if(token) h['X-Auth-Token']=token;
  const res  = await fetch(API, {method:'POST',headers:h,body:JSON.stringify(payload)});
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
    dadosEscalas = dados.escalas || [];
    dadosServos  = dados.servos  || [];
    renderizarDashboard();
  } catch(e) { if(e.message!=='Não autenticado') toast('Erro ao carregar dados.','err'); }
}

// ── Dashboard ─────────────────────────────────────────────────────────────
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
function renderizarDashboard() {
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const proximas = dadosEscalas.filter(e => new Date(e.data+'T12:00:00')>=hoje).slice(0,5);
  const anivHoje = dadosServos.filter(s => { if(!s.aniversario) return false; const d=new Date(s.aniversario+'T12:00:00'); return d.getDate()===hoje.getDate()&&d.getMonth()===hoje.getMonth(); });
  const anivMes  = dadosServos.filter(s => { if(!s.aniversario) return false; return new Date(s.aniversario+'T12:00:00').getMonth()===hoje.getMonth(); }).sort((a,b)=>new Date(a.aniversario+'T12:00:00').getDate()-new Date(b.aniversario+'T12:00:00').getDate());
  const dc = document.getElementById('dashCards');
  if (dc) dc.innerHTML = `
    <div class="dash-card accent"><div class="dash-card-icon">📅</div><div class="dash-card-val">${dadosEscalas.length}</div><div class="dash-card-label">Escalas</div></div>
    <div class="dash-card success"><div class="dash-card-icon">👥</div><div class="dash-card-val">${dadosServos.filter(s=>s.ativo).length}</div><div class="dash-card-label">Servos ativos</div></div>
    <div class="dash-card warning"><div class="dash-card-icon">🎛️</div><div class="dash-card-val">${proximas.length}</div><div class="dash-card-label">Próximas escalas</div></div>
    <div class="dash-card"><div class="dash-card-icon">🎂</div><div class="dash-card-val">${anivMes.length}</div><div class="dash-card-label">Aniversários no mês</div></div>`;
  const dp = document.getElementById('dashProximas');
  if (dp) dp.innerHTML = proximas.length ? proximas.map(e=>`<div class="dash-item"><div class="dash-item-dot"></div><div class="dash-item-text">${esc(e.operador)}</div><div class="dash-item-date">${fmt(e.data)}</div></div>`).join('') : '<div class="empty-state" style="padding:16px 0">Nenhuma escala futura.</div>';
  const da = document.getElementById('dashAniversarios');
  if (da) da.innerHTML = anivMes.length ? anivMes.map(s=>{const d=new Date(s.aniversario+'T12:00:00');const eh=d.getDate()===hoje.getDate();return`<div class="dash-item"><div class="dash-item-dot ${eh?'warning':''}"></div><div class="dash-item-text">${esc(s.nome)}${eh?' 🎉':''}</div><div class="dash-item-date">${fmtAniv(s.aniversario)}</div></div>`;}).join('') : '<div class="empty-state" style="padding:16px 0">Nenhum aniversário este mês.</div>';
  if (anivHoje.length) toast(`🎂 Aniversário hoje: ${anivHoje.map(s=>s.nome).join(', ')}`, 'ok');
}

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
  const prev=document.getElementById('btnCapPrev'), next=document.getElementById('btnCapNext');
  if(prev) prev.disabled=cap<=1; if(next) next.disabled=cap>=totalCapsAtual;
  try{const res=await post({acao:'buscar_anotacao_capitulo',livro:livroAtual.slug,capitulo:cap});document.getElementById('verseCapNotaTexto').value=res.texto||'';}catch{document.getElementById('verseCapNotaTexto').value='';}
  const lista=document.getElementById('versiculosList');
  lista.innerHTML='<div class="bible-loading">Carregando…</div>';
  try{
    const biblia=await carregarBibliaJSON(),ld=biblia[livroAtual.slug];
    if(!ld||!ld.caps[cap-1]){lista.innerHTML='<div class="bible-error">Capítulo não encontrado.</div>';return;}
    _versesCache=ld.caps[cap-1].map((texto,i)=>({verse:i+1,text:texto}));
    renderizarVersiculos(_versesCache);
    lista.scrollTo({top:0});
    document.getElementById('nivel-versiculos').scrollIntoView({behavior:'smooth',block:'start'});
  }catch{lista.innerHTML='<div class="bible-error">Erro ao carregar.</div>';}
}
function voltarCapitulos(){document.getElementById('nivel-versiculos').style.display='none';document.getElementById('nivel-capitulos').style.display='block';}
function irCapAnterior(){if(capAtual>1) abrirCapitulo(capAtual-1);}
function irCapProximo(){if(capAtual<totalCapsAtual) abrirCapitulo(capAtual+1);}

// ── Renderizar versículos com SWIPE ───────────────────────────────────────
function renderizarVersiculos(verses) {
  const lista = document.getElementById('versiculosList');
  lista.innerHTML = verses.map(v => {
    const temNota = anotacoesLivro.versiculos.some(a => a.capitulo==capAtual && a.versiculo==v.verse);
    const cor = grifos[chaveGrifo(livroAtual.slug, capAtual, v.verse)] || '';
    const badges = [];
    if (temNota) badges.push(`<span class="verse-nota-badge">📝 Anotado</span>`);
    if (cor) badges.push(`<span class="verse-grifo-badge" style="background:${GRIFO_HEX[cor]}22;color:${GRIFO_HEX[cor]}">● ${cor}</span>`);
    return `
    <div class="verse-row" id="vrow-${v.verse}" data-verse="${v.verse}">
      <div class="verse-row-actions" id="vactions-${v.verse}">
        <button class="verse-row-action-btn vra-nota"  onclick="swipeAcao(${v.verse},'anotar')"><span class="vra-icon">📝</span>Anotar</button>
        <button class="verse-row-action-btn vra-fav"   onclick="swipeAcao(${v.verse},'favoritar')"><span class="vra-icon">⭐</span>Favoritar</button>
        <button class="verse-row-action-btn vra-mais"  onclick="swipeAcao(${v.verse},'mais')"><span class="vra-icon">•••</span>Mais</button>
      </div>
      <div class="verse-item ${temNota?'has-nota':''} ${cor?'grifo-'+cor:''}" id="verse-${v.verse}" data-verse="${v.verse}">
        <span class="verse-num">${v.verse}</span>
        <div class="verse-body">
          <div class="verse-text">${esc(v.text.trim())}</div>
          ${badges.length?`<div class="verse-badges">${badges.join('')}</div>`:''}
        </div>
      </div>
    </div>`;
  }).join('');

  // Inicializar swipe em cada verse-item
  lista.querySelectorAll('.verse-item').forEach(initSwipe);

  // Preview de notas
  anotacoesLivro.versiculos.filter(a=>a.capitulo==capAtual).forEach(async a=>{
    try{
      const res=await post({acao:'buscar_anotacao_versiculo',livro:livroAtual.slug,capitulo:capAtual,versiculo:a.versiculo});
      const badge=document.querySelector(`#verse-${a.versiculo} .verse-nota-badge`);
      if(badge&&res.texto) badge.textContent='📝 '+res.texto.substring(0,50)+(res.texto.length>50?'…':'');
    }catch{}
  });

  // Esconder dica após 1ª vez
  const hint = document.getElementById('swipeHint');
  if (hint && !localStorage.getItem('swipe_hint_seen')) {
    setTimeout(()=>{ hint.style.opacity='0'; hint.style.transition='opacity .5s'; setTimeout(()=>hint.style.display='none',500); }, 4000);
  }
}

// ── Swipe logic ────────────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 60; // px para mostrar ações
const SWIPE_COMMIT   = 140; // px para confirmar ação principal (Anotar)
let activeSwipeItem = null;

function initSwipe(el) {
  let startX=0, startY=0, curX=0, isSwipe=false, settled=false;
  const row = el.closest('.verse-row');
  const actionsEl = row.querySelector('.verse-row-actions');

  el.addEventListener('touchstart', e => {
    // Fechar qualquer outro swipe aberto
    if (activeSwipeItem && activeSwipeItem !== el) resetSwipe(activeSwipeItem);
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    curX = 0; isSwipe = false; settled = false;
    el.classList.add('swiping');
  }, {passive:true});

  el.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    // Só captura se for movimento horizontal maior que vertical
    if (!isSwipe && Math.abs(dx) < Math.abs(dy) * 0.8) { el.classList.remove('swiping'); return; }
    isSwipe = true;
    // Só aceita swipe pra ESQUERDA (negativo)
    curX = Math.min(0, dx);
    const show = Math.min(Math.abs(curX), 200);
    el.style.transform = `translateX(${curX}px)`;
    actionsEl.style.width = show + 'px';
    actionsEl.style.pointerEvents = show > SWIPE_THRESHOLD ? 'auto' : 'none';
    if (show > 10) e.preventDefault(); // evita scroll ao swipear
  }, {passive:false});

  el.addEventListener('touchend', () => {
    el.classList.remove('swiping');
    const dist = Math.abs(curX);
    if (!isSwipe || dist < 10) { resetSwipe(el); return; }
    if (dist >= SWIPE_COMMIT) {
      // Ação rápida: Anotar
      resetSwipe(el);
      const verse = parseInt(el.dataset.verse);
      const v = _versesCache.find(x=>x.verse===verse);
      if (v) abrirParaAcao(verse, v.text.trim(), 'anotar');
      esconderDica();
    } else if (dist >= SWIPE_THRESHOLD) {
      // Manter aberto para escolher
      el.style.transition = 'transform .2s ease';
      const btnW = actionsEl.scrollWidth;
      el.style.transform = `translateX(-${btnW}px)`;
      actionsEl.style.width = btnW + 'px';
      actionsEl.style.pointerEvents = 'auto';
      activeSwipeItem = el;
      esconderDica();
    } else {
      resetSwipe(el);
    }
  }, {passive:true});
}

function resetSwipe(el) {
  el.style.transition = 'transform .2s ease';
  el.style.transform  = 'translateX(0)';
  const row = el.closest('.verse-row');
  if (row) {
    const act = row.querySelector('.verse-row-actions');
    if (act) { act.style.width='0'; act.style.pointerEvents='none'; }
  }
  if (activeSwipeItem===el) activeSwipeItem=null;
}

function swipeAcao(verse, tipo) {
  const el = document.getElementById(`verse-${verse}`);
  if (el) resetSwipe(el);
  const v = _versesCache.find(x=>x.verse===verse);
  if (v) abrirParaAcao(verse, v.text.trim(), tipo);
}

function abrirParaAcao(verse, texto, tipoImediato) {
  const v = _versesCache.find(x=>x.verse===verse);
  if (!v) return;
  versoAtual = { verse, texto };
  if (tipoImediato && tipoImediato !== 'mais') {
    acaoVerso(tipoImediato);
  } else {
    // Abrir modal completo
    const ref = `${livroAtual.nome} ${capAtual}:${verse}`;
    document.getElementById('versoAcaoRef').textContent   = ref;
    document.getElementById('versoAcaoTexto').textContent = texto;
    const corAtual = grifos[chaveGrifo(livroAtual.slug, capAtual, verse)] || '';
    document.querySelectorAll('.grifo-swatch').forEach(s => s.classList.toggle('active', s.dataset.cor===corAtual));
    abrirModal('modal-verso-acao');
  }
}

function esconderDica() {
  if (!localStorage.getItem('swipe_hint_seen')) {
    localStorage.setItem('swipe_hint_seen', '1');
    const h = document.getElementById('swipeHint'); if (h) h.style.display='none';
  }
}

// ── Modal de ação ─────────────────────────────────────────────────────────
function acaoVerso(tipo) {
  if (!versoAtual) return;
  const ref   = `${livroAtual.nome} ${capAtual}:${versoAtual.verse}`;
  const texto = versoAtual.texto;
  if (tipo==='anotar') {
    fecharModal('modal-verso-acao');
    document.getElementById('anotacaoVersoPreview').textContent = `${ref} — "${texto.substring(0,100)}${texto.length>100?'…':''}"`;
    post({acao:'buscar_anotacao_versiculo',livro:livroAtual.slug,capitulo:capAtual,versiculo:versoAtual.verse})
      .then(r=>{ document.getElementById('anotacaoVersoTexto').value=r.texto||''; })
      .catch(()=>{ document.getElementById('anotacaoVersoTexto').value=''; });
    anotacaoVersoTemp = versoAtual;
    abrirModal('modal-anotacao-verso');
  } else if (tipo==='favoritar') {
    fecharModal('modal-verso-acao');
    favoritoTemp = {ref, livro:livroAtual.slug, cap:capAtual, vers:versoAtual.verse, texto};
    document.getElementById('favoritoPreview').textContent = `${ref} — "${texto.substring(0,100)}"`;
    document.getElementById('favoritoAnotacao').value = '';
    abrirModal('modal-favorito');
  } else if (tipo==='copiar') {
    fecharModal('modal-verso-acao');
    const c = `"${texto}" — ${ref} (NVI)`;
    if (navigator.clipboard) navigator.clipboard.writeText(c).then(()=>toast('Copiado! 📋','ok')).catch(()=>copiarFallback(c));
    else copiarFallback(c);
  } else if (tipo==='compartilhar') {
    fecharModal('modal-verso-acao');
    const c = `"${texto}" — ${ref} (NVI)`;
    if (navigator.share) navigator.share({title:ref,text:c}).catch(()=>{});
    else if (navigator.clipboard) navigator.clipboard.writeText(c).then(()=>toast('Texto copiado 🔗','ok'));
  }
}
function copiarFallback(txt){
  const ta=document.createElement('textarea');ta.value=txt;ta.style.cssText='position:fixed;opacity:0';
  document.body.appendChild(ta);ta.focus();ta.select();
  try{document.execCommand('copy');toast('Copiado! 📋','ok');}catch{}
  document.body.removeChild(ta);
}
function aplicarGrifo(cor) {
  if (!versoAtual) return;
  const chave = chaveGrifo(livroAtual.slug, capAtual, versoAtual.verse);
  if (cor==='remover') delete grifos[chave]; else grifos[chave]=cor;
  salvarGrifos(); fecharModal('modal-verso-acao');
  const item = document.getElementById(`verse-${versoAtual.verse}`);
  if (item) {
    ['amarelo','verde','rosa','azul','laranja'].forEach(c=>item.classList.remove('grifo-'+c));
    if (cor&&cor!=='remover') item.classList.add('grifo-'+cor);
    let badge = item.querySelector('.verse-grifo-badge');
    if (cor&&cor!=='remover'){
      if (!badge){badge=document.createElement('span');badge.className='verse-grifo-badge';let bd=item.querySelector('.verse-badges');if(!bd){bd=document.createElement('div');bd.className='verse-badges';item.querySelector('.verse-body').appendChild(bd);}bd.appendChild(badge);}
      badge.style.background=GRIFO_HEX[cor]+'22';badge.style.color=GRIFO_HEX[cor];badge.textContent=`● ${cor}`;
    } else if(badge) badge.remove();
    const num=item.querySelector('.verse-num');
    if(num) num.style.color=cor&&cor!=='remover'?GRIFO_HEX[cor]:'';
  }
  toast(cor==='remover'?'Grifo removido':'Grifo aplicado ✨','ok');
}

// Versículos na busca (clique normal — são resultados pontuais, não leitura)
function abrirModalVersoBusca(verse,texto,nomeL,cap,slug){
  if (!livroAtual||livroAtual.slug!==slug) livroAtual={slug,nome:nomeL,totalCaps:0};
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

// Notas
function toggleNotaCapitulo(){const f=document.getElementById('capNotaForm'),i=document.getElementById('capNotaToggleIcon'),o=f.style.display==='block';f.style.display=o?'none':'block';i.textContent=o?'▼':'▲';}
function toggleNotaCapituloVerses(){const f=document.getElementById('verseCapNotaForm'),i=document.getElementById('verseCapNotaIcon'),o=f.style.display==='block';f.style.display=o?'none':'block';i.textContent=o?'▼':'▲';}
async function salvarNotaCapituloAtual(){try{await post({acao:'salvar_anotacao_capitulo',livro:livroAtual.slug,capitulo:0,texto:document.getElementById('capNotaTexto').value});toast('Nota salva!','ok');}catch{toast('Erro.','err');}}
async function salvarNotaCapituloVerses(){try{await post({acao:'salvar_anotacao_capitulo',livro:livroAtual.slug,capitulo:capAtual,texto:document.getElementById('verseCapNotaTexto').value});toast('Nota salva!','ok');}catch{toast('Erro.','err');}}
async function salvarAnotacaoVerso(){
  if(!anotacaoVersoTemp) return;
  const texto=document.getElementById('anotacaoVersoTexto').value;
  try{await post({acao:'salvar_anotacao_versiculo',livro:livroAtual.slug,capitulo:capAtual,versiculo:anotacaoVersoTemp.verse,texto});fecharModal('modal-anotacao-verso');toast('Anotação salva!','ok');const res=await post({acao:'listar_anotacoes_livro',livro:livroAtual.slug});anotacoesLivro=res;abrirCapitulo(capAtual);}catch{toast('Erro.','err');}
}

// Favoritos
async function confirmarFavorito(){if(!favoritoTemp)return;try{await post({acao:'salvar_favorito',data:{referencia:favoritoTemp.ref,livro:favoritoTemp.livro,capitulo:favoritoTemp.cap,versiculo:favoritoTemp.vers,texto:favoritoTemp.texto,anotacao:document.getElementById('favoritoAnotacao').value,categoria:document.getElementById('favoritoCategoria').value}});fecharModal('modal-favorito');favoritoTemp=null;toast('Favorito salvo! ⭐','ok');}catch(e){toast(e.message||'Erro.','err');}}
async function carregarFavoritos(){
  const cat=document.getElementById('favCategoria').value||'todas';
  try{const res=await post({acao:'listar_favoritos',categoria:cat});const sel=document.getElementById('favCategoria'),val=sel.value;sel.innerHTML='<option value="todas">Todas as categorias</option>';(res.categorias||[]).forEach(c=>{const opt=document.createElement('option');opt.value=c;opt.textContent=c.charAt(0).toUpperCase()+c.slice(1);sel.appendChild(opt);});sel.value=val;const el=document.getElementById('listaFavoritos'),lista=res.favoritos||[];if(!lista.length){el.innerHTML='<div class="empty-state">Nenhum favorito ainda.</div>';return;}el.innerHTML=lista.map(f=>`<div class="fav-card"><div class="fav-ref">📖 ${esc(f.referencia)}</div><div class="fav-text">${esc(f.texto)}</div>${f.anotacao?`<div class="fav-anotacao">📝 ${esc(f.anotacao)}</div>`:''}<div class="fav-footer"><span class="fav-cat">${esc(f.categoria)}</span><button class="fav-del" onclick="excluirFavorito(${f.id})">🗑️</button></div></div>`).join('');}catch{toast('Erro ao carregar favoritos.','err');}
}
async function excluirFavorito(id){if(!confirm('Remover favorito?'))return;try{await post({acao:'excluir_favorito',id});toast('Removido.','ok');carregarFavoritos();}catch{toast('Erro.','err');}}

// Estudos
async function carregarEstudos(){try{const res=await post({acao:'listar_estudos'});renderizarEstudos(res.estudos||[]);}catch{toast('Erro.','err');}}
function renderizarEstudos(lista){const el=document.getElementById('listaEstudos');if(!lista.length){el.innerHTML='<div class="empty-state">Nenhum estudo ainda.</div>';return;}const catL={geral:'Geral',pregacao:'Pregação',estudo:'Estudo Bíblico',devocional:'Devocional',celula:'Célula'};el.innerHTML=lista.map(e=>`<div class="estudo-card"><div class="estudo-titulo">${esc(e.titulo)}</div>${e.versiculo_base?`<div class="estudo-versiculo">📖 ${esc(e.versiculo_base)}</div>`:''} ${e.conteudo?`<div class="estudo-preview">${esc(e.conteudo)}</div>`:''}<div class="estudo-footer"><span class="estudo-cat">${catL[e.categoria]||e.categoria}</span><div class="estudo-acoes"><span class="estudo-data">${fmt(e.atualizado_em?.split('T')[0])}</span><button class="bible-verse-btn" onclick="editarEstudo(${e.id})">✏️</button><button class="bible-verse-btn" style="color:var(--danger)" onclick="excluirEstudo(${e.id},'${esc(e.titulo)}')">🗑️</button></div></div></div>`).join('');}
async function salvarEstudo(){const titulo=document.getElementById('est-titulo').value.trim();if(!titulo){toast('Título obrigatório.','err');return;}const data={titulo,conteudo:document.getElementById('est-conteudo').value,versiculo_base:document.getElementById('est-versiculo').value,texto_base:document.getElementById('est-texto-base').value,categoria:document.getElementById('est-categoria').value};try{if(estudoEditandoId)await post({acao:'atualizar_estudo',id:estudoEditandoId,data});else await post({acao:'salvar_estudo',data});fecharModal('modal-estudo');limpar(['est-titulo','est-versiculo','est-texto-base','est-conteudo']);estudoEditandoId=null;document.getElementById('modalEstudoTitulo').textContent='Novo Estudo';toast('Estudo salvo!','ok');carregarEstudos();}catch{toast('Erro.','err');}}
function editarEstudo(id){post({acao:'listar_estudos'}).then(res=>{const e=(res.estudos||[]).find(x=>x.id===id);if(!e)return;estudoEditandoId=id;document.getElementById('modalEstudoTitulo').textContent='Editar Estudo';document.getElementById('est-titulo').value=e.titulo||'';document.getElementById('est-versiculo').value=e.versiculo_base||'';document.getElementById('est-texto-base').value=e.texto_base||'';document.getElementById('est-categoria').value=e.categoria||'geral';document.getElementById('est-conteudo').value=e.conteudo||'';abrirModal('modal-estudo');});}
async function excluirEstudo(id,titulo){if(!confirm(`Excluir "${titulo}"?`))return;try{await post({acao:'excluir_estudo',id});toast('Removido.','ok');carregarEstudos();}catch{toast('Erro.','err');}}

// Busca
const NOMES_SLUG={},SLUGS_NOMES={};
async function iniciarMapaNomes(){const biblia=await carregarBibliaJSON();Object.entries(biblia).forEach(([slug,livro])=>{SLUGS_NOMES[slug]=livro.nome;NOMES_SLUG[livro.nome.toLowerCase()]=slug;const abrev=livro.abbr?.toLowerCase();if(abrev)NOMES_SLUG[abrev]=slug;});}
function parsearRefLocal(ref){const m=ref.trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i);if(!m)return null;const[,livroStr,cap,vers,versEnd]=m;const slug=NOMES_SLUG[livroStr.trim().toLowerCase()];if(!slug)return null;return{slug,cap:parseInt(cap),vers:vers?parseInt(vers):null,versEnd:versEnd?parseInt(versEnd):null};}
async function buscarPorReferencia(){const ref=document.getElementById('bibliaRef').value.trim();if(!ref)return;const el=document.getElementById('bibliaResultado');el.innerHTML='<div class="bible-loading">Buscando…</div>';await iniciarMapaNomes();const parsed=parsearRefLocal(ref);if(!parsed){el.innerHTML='<div class="bible-error">Referência não reconhecida. Ex: João 3:16</div>';return;}try{const biblia=await carregarBibliaJSON(),ld=biblia[parsed.slug];if(!ld){el.innerHTML='<div class="bible-error">Livro não encontrado.</div>';return;}const cap=ld.caps[parsed.cap-1];if(!cap){el.innerHTML='<div class="bible-error">Capítulo não encontrado.</div>';return;}let verses;if(parsed.vers){const fim=parsed.versEnd||parsed.vers;verses=cap.slice(parsed.vers-1,fim).map((t,i)=>({verse:parsed.vers+i,text:t,slug:parsed.slug,cap:parsed.cap,nome:ld.nome}));}else verses=cap.map((t,i)=>({verse:i+1,text:t,slug:parsed.slug,cap:parsed.cap,nome:ld.nome}));renderizarResultadoBiblia(verses,`${ld.nome} ${parsed.cap}${parsed.vers?':'+parsed.vers:''}${parsed.versEnd?'-'+parsed.versEnd:''}`);}catch{el.innerHTML='<div class="bible-error">Erro ao buscar.</div>';}}
async function buscarPorPalavra(){const palavra=document.getElementById('bibliaPalavra').value.trim().toLowerCase();if(!palavra)return;const el=document.getElementById('bibliaResultado');el.innerHTML='<div class="bible-loading">Buscando…</div>';try{const biblia=await carregarBibliaJSON(),resultados=[];for(const[slug,livro]of Object.entries(biblia)){for(let ci=0;ci<livro.caps.length;ci++){for(let vi=0;vi<livro.caps[ci].length;vi++){if(livro.caps[ci][vi].toLowerCase().includes(palavra)){resultados.push({verse:vi+1,text:livro.caps[ci][vi],slug,cap:ci+1,nome:livro.nome});if(resultados.length>=30)break;}}if(resultados.length>=30)break;}if(resultados.length>=30)break;}if(!resultados.length){el.innerHTML='<div class="bible-error">Nenhum resultado encontrado.</div>';return;}renderizarResultadoBiblia(resultados,`"${palavra}" — ${resultados.length} resultado${resultados.length>1?'s':''}`);}catch{el.innerHTML='<div class="bible-error">Erro ao buscar.</div>';}}

// ── Modais ────────────────────────────────────────────────────────────────
function abrirModal(id){document.getElementById(id).classList.add('open');}
function fecharModal(id){document.getElementById(id).classList.remove('open');}
document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)fecharModal(o.id);}));

// ── Utils ─────────────────────────────────────────────────────────────────
function esc(str){return String(str??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function fmt(d){if(!d)return'';const[y,m,dd]=String(d).split('-');return dd&&m&&y?`${dd}/${m}/${y}`:d;}
function fmtAniv(d){if(!d)return'';const[,m,dd]=String(d).split('-');return`${dd}/${m}`;}
function limpar(ids){ids.forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});}
let toastTimer;
function toast(msg,tipo='ok'){const el=document.getElementById('toast');el.textContent=msg;el.className=`toast ${tipo} show`;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3500);}
