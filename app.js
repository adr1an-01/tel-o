const API = '/api';
let BIBLIA_DATA = null;

async function carregarBibliaJSON() {
  if (BIBLIA_DATA) return BIBLIA_DATA;
  const res = await fetch('/biblia.json');
  BIBLIA_DATA = await res.json();
  return BIBLIA_DATA;
}
const TOKEN_KEY = 'central_token';

// ── Estado ────────────────────────────────────────────────────────────────
let dadosEscalas = [], dadosServos = [];
let calAno = new Date().getFullYear(), calMes = new Date().getMonth();
let favoritoTemp = null, anotacaoVersoTemp = null, estudoEditandoId = null;
let livroAtual = null, capAtual = null;
let anotacoesLivro = { versiculos: [], capitulos: [] };

// ── PWA ───────────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ── Init ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    const auth = await postPublic({ acao: 'checar_auth' }, token).catch(() => ({ autenticado: false }));
    if (auth.autenticado) { mostrarApp(auth.usuario); return; }
    localStorage.removeItem(TOKEN_KEY);
  }
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginPass').addEventListener('keydown', e => { if (e.key === 'Enter') fazerLogin(); });
  document.getElementById('loginUser').addEventListener('keydown', e => { if (e.key === 'Enter') fazerLogin(); });
});

function setupEventos() {
  document.getElementById('calPrev').addEventListener('click', () => {
    calMes--; if (calMes < 0) { calMes = 11; calAno--; } renderizarCalendario();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    calMes++; if (calMes > 11) { calMes = 0; calAno++; } renderizarCalendario();
  });
  document.getElementById('bibliaRef').addEventListener('keydown', e => { if (e.key === 'Enter') buscarPorReferencia(); });
  document.getElementById('bibliaPalavra').addEventListener('keydown', e => { if (e.key === 'Enter') buscarPorPalavra(); });
  document.querySelectorAll('.bible-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bible-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.bible-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('btab-' + btn.dataset.btab).classList.add('active');
      if (btn.dataset.btab === 'favoritos') carregarFavoritos();
      if (btn.dataset.btab === 'estudos') carregarEstudos();
    });
  });
}

// ── Auth ──────────────────────────────────────────────────────────────────
async function fazerLogin() {
  const usuario = document.getElementById('loginUser').value.trim();
  const senha   = document.getElementById('loginPass').value;
  const errEl   = document.getElementById('loginError');
  errEl.textContent = '';
  try {
    const res = await postPublic({ acao: 'login', usuario, senha });
    if (res.sucesso) {
      localStorage.setItem(TOKEN_KEY, res.token);
      mostrarApp(res.usuario);
    } else errEl.textContent = res.erro || 'Erro ao entrar';
  } catch { errEl.textContent = 'Erro de conexão'; }
}
async function fazerLogout() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) await postPublic({ acao: 'logout' }, token).catch(() => {});
  localStorage.removeItem(TOKEN_KEY);
  document.getElementById('appLayout').style.display = 'none';
  document.getElementById('bottomNav').style.display  = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginPass').value = '';
}
function mostrarApp(usuario) {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appLayout').style.display   = 'flex';
  document.getElementById('bottomNav').style.display   = 'flex';
  document.getElementById('sidebarUser').textContent   = '👤 ' + usuario;
  setupEventos();
  iniciarNavegacao();
  renderizarLivros();
  carregarDados();
}

// ── Navegação ─────────────────────────────────────────────────────────────
function iniciarNavegacao() {
  const todos = [...document.querySelectorAll('.nav-item'), ...document.querySelectorAll('.bottom-nav-item')];
  todos.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      todos.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll(`[data-tab="${tab}"]`).forEach(b => b.classList.add('active'));
      document.getElementById('tab-' + tab).classList.add('active');
    });
  });
}

// ── API ───────────────────────────────────────────────────────────────────
async function postPublic(payload, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['X-Auth-Token'] = token;
  const res = await fetch(API, { method: 'POST', headers, body: JSON.stringify(payload) });
  return res.json();
}
async function post(payload) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['X-Auth-Token'] = token;
  const res  = await fetch(API, { method: 'POST', headers, body: JSON.stringify(payload) });
  const data = await res.json();
  if (data.auth === false) { fazerLogout(); throw new Error('Não autenticado'); }
  return data;
}

// ── Dados ─────────────────────────────────────────────────────────────────
async function carregarDados() {
  try {
    const dados = await post({ acao: 'listar' });
    dadosEscalas = dados.escalas || [];
    dadosServos  = dados.servos  || [];
    renderizarDashboard();
    renderizarCalendario();
    renderizarEscalas(dadosEscalas);
    renderizarServos(dadosServos);
    preencherDropdownServos();
  } catch (e) { if (e.message !== 'Não autenticado') toast('Erro ao carregar dados.', 'err'); }
}

// ── Dashboard ─────────────────────────────────────────────────────────────
function renderizarDashboard() {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);

  const proximas  = dadosEscalas.filter(e => new Date(e.data + 'T12:00:00') >= hoje).slice(0, 5);
  const anivHoje  = dadosServos.filter(s => {
    if (!s.aniversario) return false;
    const d = new Date(s.aniversario + 'T12:00:00');
    return d.getDate() === hoje.getDate() && d.getMonth() === hoje.getMonth();
  });
  const anivMes = dadosServos.filter(s => {
    if (!s.aniversario) return false;
    const d = new Date(s.aniversario + 'T12:00:00');
    return d.getMonth() === hoje.getMonth();
  }).sort((a, b) => {
    const da = new Date(a.aniversario + 'T12:00:00').getDate();
    const db = new Date(b.aniversario + 'T12:00:00').getDate();
    return da - db;
  });

  document.getElementById('dashCards').innerHTML = `
    <div class="dash-card accent">
      <div class="dash-card-icon">📅</div>
      <div class="dash-card-val">${dadosEscalas.length}</div>
      <div class="dash-card-label">Escalas totais</div>
    </div>
    <div class="dash-card success">
      <div class="dash-card-icon">👥</div>
      <div class="dash-card-val">${dadosServos.filter(s => s.ativo).length}</div>
      <div class="dash-card-label">Servos ativos</div>
    </div>
    <div class="dash-card warning">
      <div class="dash-card-icon">🎛️</div>
      <div class="dash-card-val">${proximas.length}</div>
      <div class="dash-card-label">Próximas escalas</div>
    </div>
    <div class="dash-card ${anivHoje.length > 0 ? 'danger' : ''}">
      <div class="dash-card-icon">🎂</div>
      <div class="dash-card-val">${anivMes.length}</div>
      <div class="dash-card-label">Aniversários no mês</div>
    </div>`;

  document.getElementById('dashProximas').innerHTML = proximas.length
    ? proximas.map(e => `
        <div class="dash-item">
          <div class="dash-item-dot"></div>
          <div class="dash-item-text">${esc(e.operador)}</div>
          <div class="dash-item-date">${fmt(e.data)}</div>
        </div>`).join('')
    : '<div class="empty-state" style="padding:16px">Nenhuma escala futura.</div>';

  const anivEl = document.getElementById('dashAniversarios');
  if (anivEl) {
    anivEl.innerHTML = anivMes.length
      ? anivMes.map(s => {
          const d = new Date(s.aniversario + 'T12:00:00');
          const ehHoje = d.getDate() === hoje.getDate();
          return `
            <div class="dash-item">
              <div class="dash-item-dot ${ehHoje ? 'warning' : ''}"></div>
              <div class="dash-item-text">${esc(s.nome)}${ehHoje ? ' 🎉' : ''}</div>
              <div class="dash-item-date">${fmtAniv(s.aniversario)}</div>
            </div>`;
        }).join('')
      : '<div class="empty-state" style="padding:16px">Nenhum aniversário este mês.</div>';
  }

  if (anivHoje.length) toast(`🎂 Aniversário hoje: ${anivHoje.map(s => s.nome).join(', ')}`, 'ok');
}

// ── Calendário ────────────────────────────────────────────────────────────
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function renderizarCalendario() {
  document.getElementById('calTitulo').textContent = `${MESES[calMes]} ${calAno}`;
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';
  DIAS.forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-weekday'; el.textContent = d; grid.appendChild(el);
  });
  const primeiroDia = new Date(calAno, calMes, 1).getDay();
  const totalDias   = new Date(calAno, calMes + 1, 0).getDate();
  const hoje        = new Date();
  for (let i = 0; i < primeiroDia; i++) {
    const el = document.createElement('div'); el.className = 'cal-day empty'; grid.appendChild(el);
  }
  for (let d = 1; d <= totalDias; d++) {
    const dataStr = `${calAno}-${String(calMes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const esc2    = dadosEscalas.filter(e => e.data === dataStr);
    const el      = document.createElement('div'); el.className = 'cal-day';
    if (d === hoje.getDate() && calMes === hoje.getMonth() && calAno === hoje.getFullYear()) el.classList.add('today');
    if (esc2.length) el.classList.add('has-escala');
    const num = document.createElement('div'); num.className = 'cal-day-num'; num.textContent = d; el.appendChild(num);
    esc2.forEach(e => {
      const chip = document.createElement('div'); chip.className = 'cal-escala-chip'; chip.textContent = e.operador; el.appendChild(chip);
    });
    if (esc2.some(e => e.obs?.trim())) {
      const dot = document.createElement('div'); dot.className = 'cal-obs-dot'; el.appendChild(dot);
    }
    el.addEventListener('click', () => abrirDetalhe(dataStr, esc2, d));
    grid.appendChild(el);
  }
}

function abrirDetalhe(dataStr, escalas, dia) {
  document.getElementById('dayDetailTitle').textContent = `${dia} de ${MESES[calMes]} de ${calAno}`;
  document.getElementById('dayDetailBody').innerHTML = escalas.length
    ? escalas.map(e => `
        <div class="detail-escala">
          <div class="detail-row"><span>Operador</span><span>${esc(e.operador)}</span></div>
          ${e.telefone ? `<div class="detail-row"><span>Telefone</span><span>${esc(e.telefone)}</span></div>` : ''}
          ${e.musicas  ? `<div class="detail-row"><span>Músicas</span><span>${esc(e.musicas)}</span></div>`  : ''}
          ${e.obs      ? `<div class="detail-obs">📝 ${esc(e.obs)}</div>` : ''}
          <div style="margin-top:10px">
            <button class="btn btn--danger" style="font-size:12px;padding:6px 12px" onclick="excluirEscala(${e.id},'${esc(e.operador)}')">Remover escala</button>
          </div>
        </div>`).join('')
    : `<div class="empty-state" style="padding:16px">Dia livre.<br>
       <button class="btn btn--primary" style="margin-top:12px" onclick="abrirModal('modal-escala')">+ Escalar</button></div>`;
  const d = document.getElementById('dayDetail');
  d.style.display = 'block';
  d.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function fecharDetalhe() { document.getElementById('dayDetail').style.display = 'none'; }

// ── Escalas ───────────────────────────────────────────────────────────────
function preencherDropdownServos() {
  const sel = document.getElementById('esc-operador'), val = sel.value;
  sel.innerHTML = '<option value="">Selecionar servo…</option>';
  dadosServos.filter(s => s.ativo).forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.nome; opt.textContent = s.nome + (s.funcao ? ` — ${s.funcao}` : ''); sel.appendChild(opt);
  });
  sel.value = val;
}
function renderizarEscalas(lista) {
  const el = document.getElementById('lista-escalas');
  if (!lista.length) { el.innerHTML = '<div class="empty-state">Nenhuma escala cadastrada.</div>'; return; }
  el.innerHTML = lista.map(e => `
    <div class="card">
      <button class="card-del" onclick="excluirEscala(${e.id},'${esc(e.operador)}')">✕</button>
      <div class="card-title">${fmt(e.data)}</div>
      <div class="card-row"><span>Operador</span><span>${esc(e.operador)}</span></div>
      ${e.musicas ? `<div class="card-row"><span>Músicas</span><span>${esc(e.musicas)}</span></div>` : ''}
      ${e.obs     ? `<div class="card-obs">📝 ${esc(e.obs)}</div>` : ''}
    </div>`).join('');
}
async function salvarEscala() {
  const data     = document.getElementById('esc-data').value;
  const operador = document.getElementById('esc-operador').value;
  if (!data || !operador) { toast('Data e Operador são obrigatórios.', 'err'); return; }
  const servo = dadosServos.find(s => s.nome === operador);
  try {
    await post({ acao: 'salvar', tipo: 'escala', data: {
      data, operador, telefone: servo?.telefone || '',
      musicas: document.getElementById('esc-musicas').value,
      obs:     document.getElementById('esc-obs').value,
    }});
    fecharModal('modal-escala');
    limpar(['esc-data', 'esc-operador', 'esc-musicas', 'esc-obs']);
    toast('Escala salva!', 'ok');
    carregarDados();
  } catch { toast('Erro ao salvar.', 'err'); }
}
async function excluirEscala(id, nome) {
  if (!confirm(`Excluir escala de ${nome}?`)) return;
  try { await post({ acao: 'excluir', tipo: 'escala', id }); toast('Removida.', 'ok'); fecharDetalhe(); carregarDados(); }
  catch { toast('Erro.', 'err'); }
}

// ── Servos ────────────────────────────────────────────────────────────────
function renderizarServos(lista) {
  const el   = document.getElementById('lista-servos');
  if (!lista.length) { el.innerHTML = '<div class="empty-state">Nenhum servo cadastrado.</div>'; return; }
  const hoje = new Date();
  el.innerHTML = lista.map(s => {
    const iniciais = s.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const ehAnivHoje = s.aniversario && (() => {
      const d = new Date(s.aniversario + 'T12:00:00');
      return d.getDate() === hoje.getDate() && d.getMonth() === hoje.getMonth();
    })();
    return `
      <div class="card ${s.ativo ? '' : 'servo-inactive'}">
        <button class="card-del" onclick="excluirServo(${s.id},'${esc(s.nome)}')">✕</button>
        <div class="servo-card-avatar">${iniciais}</div>
        <div class="card-title" style="margin-bottom:6px">${esc(s.nome)}</div>
        ${s.telefone ? `<div class="card-row"><span>Telefone</span><span>${esc(s.telefone)}</span></div>` : ''}
        ${s.email    ? `<div class="card-row"><span>E-mail</span><span>${esc(s.email)}</span></div>`    : ''}
        <div style="margin-top:8px">
          ${s.funcao ? `<span class="servo-badge funcao">${esc(s.funcao)}</span>` : ''}
          ${ehAnivHoje ? `<span class="servo-badge aniversario">🎂 Hoje!</span>`
            : (s.aniversario ? `<span class="servo-badge aniversario">🎂 ${fmtAniv(s.aniversario)}</span>` : '')}
        </div>
      </div>`;
  }).join('');
}
function filtrarServos() {
  const q = document.getElementById('buscarServo').value.toLowerCase();
  renderizarServos(dadosServos.filter(s =>
    s.nome.toLowerCase().includes(q) || (s.funcao || '').toLowerCase().includes(q)
  ));
}
async function salvarServo() {
  const nome = document.getElementById('srv-nome').value.trim();
  if (!nome) { toast('Nome é obrigatório.', 'err'); return; }
  try {
    await post({ acao: 'salvar', tipo: 'servo', data: {
      nome,
      telefone:    document.getElementById('srv-telefone').value,
      funcao:      document.getElementById('srv-funcao').value,
      email:       document.getElementById('srv-email').value,
      aniversario: document.getElementById('srv-aniversario').value,
    }});
    fecharModal('modal-servo');
    limpar(['srv-nome', 'srv-telefone', 'srv-funcao', 'srv-email', 'srv-aniversario']);
    toast('Servo salvo!', 'ok');
    carregarDados();
  } catch { toast('Erro.', 'err'); }
}
async function excluirServo(id, nome) {
  if (!confirm(`Excluir ${nome}?`)) return;
  try { await post({ acao: 'excluir', tipo: 'servo', id }); toast('Removido.', 'ok'); carregarDados(); }
  catch { toast('Erro.', 'err'); }
}

// ══ BÍBLIA ════════════════════════════════════════════════════════════════
const BIBLIA = {
  at: [
    {nome:'Gênesis',slug:'genesis',caps:50},      {nome:'Êxodo',slug:'exodus',caps:40},
    {nome:'Levítico',slug:'leviticus',caps:27},    {nome:'Números',slug:'numbers',caps:36},
    {nome:'Deuteronômio',slug:'deuteronomy',caps:34},{nome:'Josué',slug:'joshua',caps:24},
    {nome:'Juízes',slug:'judges',caps:21},          {nome:'Rute',slug:'ruth',caps:4},
    {nome:'1 Samuel',slug:'1samuel',caps:31},       {nome:'2 Samuel',slug:'2samuel',caps:24},
    {nome:'1 Reis',slug:'1kings',caps:22},          {nome:'2 Reis',slug:'2kings',caps:25},
    {nome:'1 Crônicas',slug:'1chronicles',caps:29}, {nome:'2 Crônicas',slug:'2chronicles',caps:36},
    {nome:'Esdras',slug:'ezra',caps:10},            {nome:'Neemias',slug:'nehemiah',caps:13},
    {nome:'Ester',slug:'esther',caps:10},           {nome:'Jó',slug:'job',caps:42},
    {nome:'Salmos',slug:'psalms',caps:150},         {nome:'Provérbios',slug:'proverbs',caps:31},
    {nome:'Eclesiastes',slug:'ecclesiastes',caps:12},{nome:'Cantares',slug:'song of solomon',caps:8},
    {nome:'Isaías',slug:'isaiah',caps:66},          {nome:'Jeremias',slug:'jeremiah',caps:52},
    {nome:'Lamentações',slug:'lamentations',caps:5},{nome:'Ezequiel',slug:'ezekiel',caps:48},
    {nome:'Daniel',slug:'daniel',caps:12},          {nome:'Oséias',slug:'hosea',caps:14},
    {nome:'Joel',slug:'joel',caps:3},               {nome:'Amós',slug:'amos',caps:9},
    {nome:'Obadias',slug:'obadiah',caps:1},         {nome:'Jonas',slug:'jonah',caps:4},
    {nome:'Miquéias',slug:'micah',caps:7},          {nome:'Naum',slug:'nahum',caps:3},
    {nome:'Habacuque',slug:'habakkuk',caps:3},      {nome:'Sofonias',slug:'zephaniah',caps:3},
    {nome:'Ageu',slug:'haggai',caps:2},             {nome:'Zacarias',slug:'zechariah',caps:14},
    {nome:'Malaquias',slug:'malachi',caps:4},
  ],
  nt: [
    {nome:'Mateus',slug:'matthew',caps:28},         {nome:'Marcos',slug:'mark',caps:16},
    {nome:'Lucas',slug:'luke',caps:24},             {nome:'João',slug:'john',caps:21},
    {nome:'Atos',slug:'acts',caps:28},              {nome:'Romanos',slug:'romans',caps:16},
    {nome:'1 Coríntios',slug:'1corinthians',caps:16},{nome:'2 Coríntios',slug:'2corinthians',caps:13},
    {nome:'Gálatas',slug:'galatians',caps:6},       {nome:'Efésios',slug:'ephesians',caps:6},
    {nome:'Filipenses',slug:'philippians',caps:4},  {nome:'Colossenses',slug:'colossians',caps:4},
    {nome:'1 Tessalonicenses',slug:'1thessalonians',caps:5},{nome:'2 Tessalonicenses',slug:'2thessalonians',caps:3},
    {nome:'1 Timóteo',slug:'1timothy',caps:6},      {nome:'2 Timóteo',slug:'2timothy',caps:4},
    {nome:'Tito',slug:'titus',caps:3},              {nome:'Filemom',slug:'philemon',caps:1},
    {nome:'Hebreus',slug:'hebrews',caps:13},        {nome:'Tiago',slug:'james',caps:5},
    {nome:'1 Pedro',slug:'1peter',caps:5},          {nome:'2 Pedro',slug:'2peter',caps:3},
    {nome:'1 João',slug:'1john',caps:5},            {nome:'2 João',slug:'2john',caps:1},
    {nome:'3 João',slug:'3john',caps:1},            {nome:'Judas',slug:'jude',caps:1},
    {nome:'Apocalipse',slug:'revelation',caps:22},
  ]
};

function renderizarLivros() {
  const render = (lista, elId) => {
    const el = document.getElementById(elId);
    el.innerHTML = lista.map(l => `
      <button class="book-btn" onclick="abrirLivro('${l.slug}','${esc(l.nome)}',${l.caps})">
        <span>${esc(l.nome)}</span>
        <span class="book-abbr">${l.caps} cap${l.caps > 1 ? 's' : ''}</span>
      </button>`).join('');
  };
  render(BIBLIA.at, 'booksAT');
  render(BIBLIA.nt, 'booksNT');
}

async function abrirLivro(slug, nome, totalCaps) {
  livroAtual = { slug, nome, totalCaps };
  document.getElementById('livroAtualTitulo').textContent = nome;
  document.getElementById('nivel-livros').style.display     = 'none';
  document.getElementById('nivel-capitulos').style.display  = 'block';
  document.getElementById('nivel-versiculos').style.display = 'none';
  try {
    const res = await post({ acao: 'listar_anotacoes_livro', livro: slug });
    anotacoesLivro = res;
  } catch { anotacoesLivro = { versiculos: [], capitulos: [] }; }
  try {
    const res = await post({ acao: 'buscar_anotacao_capitulo', livro: slug, capitulo: 0 });
    document.getElementById('capNotaTexto').value = res.texto || '';
  } catch { document.getElementById('capNotaTexto').value = ''; }
  const grid = document.getElementById('chaptersGrid');
  grid.innerHTML = '';
  for (let c = 1; c <= totalCaps; c++) {
    const btn = document.createElement('button');
    btn.className  = 'chap-btn'; btn.textContent = c;
    const temNotaCap   = anotacoesLivro.capitulos.includes(String(c)) || anotacoesLivro.capitulos.includes(c);
    const temNotaVerso = anotacoesLivro.versiculos.some(v => v.capitulo == c);
    if (temNotaCap)   btn.classList.add('has-nota');
    else if (temNotaVerso) btn.classList.add('has-verso-nota');
    btn.addEventListener('click', () => abrirCapitulo(c));
    grid.appendChild(btn);
  }
}
function voltarLivros() {
  document.getElementById('nivel-livros').style.display    = 'block';
  document.getElementById('nivel-capitulos').style.display = 'none';
}
async function abrirCapitulo(cap) {
  capAtual = cap;
  document.getElementById('capAtualTitulo').textContent     = `${livroAtual.nome} ${cap}`;
  document.getElementById('nivel-capitulos').style.display  = 'none';
  document.getElementById('nivel-versiculos').style.display = 'block';
  try {
    const res = await post({ acao: 'buscar_anotacao_capitulo', livro: livroAtual.slug, capitulo: cap });
    document.getElementById('verseCapNotaTexto').value = res.texto || '';
  } catch { document.getElementById('verseCapNotaTexto').value = ''; }
  const lista = document.getElementById('versiculosList');
  lista.innerHTML = '<div class="bible-loading">Carregando…</div>';
  try {
    const biblia    = await carregarBibliaJSON();
    const livroData = biblia[livroAtual.slug];
    if (!livroData || !livroData.caps[cap - 1]) { lista.innerHTML = '<div class="bible-error">Capítulo não encontrado.</div>'; return; }
    const verses = livroData.caps[cap - 1].map((texto, i) => ({ verse: i + 1, text: texto }));
    renderizarVersiculos(verses);
  } catch { lista.innerHTML = '<div class="bible-error">Erro ao carregar.</div>'; }
}
function voltarCapitulos() {
  document.getElementById('nivel-versiculos').style.display = 'none';
  document.getElementById('nivel-capitulos').style.display  = 'block';
}
function renderizarVersiculos(verses) {
  const lista = document.getElementById('versiculosList');
  lista.innerHTML = verses.map(v => {
    const temNota = anotacoesLivro.versiculos.some(a => a.capitulo == capAtual && a.versiculo == v.verse);
    return `
    <div class="verse-item ${temNota ? 'has-nota' : ''}" id="verse-${v.verse}">
      <span class="verse-num">${v.verse}</span>
      <div class="verse-body">
        <div class="verse-text">${esc(v.text.trim())}</div>
        ${temNota ? `<div class="verse-nota-preview" id="nota-preview-${v.verse}">📝 carregando…</div>` : ''}
        <div class="verse-actions">
          <button class="verse-action-btn nota" onclick="abrirAnotacaoVerso(${v.verse},'${esc(v.text.trim())}')">📝 Anotar</button>
          <button class="verse-action-btn fav"  onclick="prepararFavorito({ref:'${esc(livroAtual.nome)} ${capAtual}:${v.verse}',livro:'${livroAtual.slug}',cap:${capAtual},vers:${v.verse},texto:'${esc(v.text.trim())}'})">⭐ Favorito</button>
        </div>
      </div>
    </div>`;
  }).join('');
  // Carregar previews das notas
  anotacoesLivro.versiculos.filter(a => a.capitulo == capAtual).forEach(async a => {
    try {
      const res = await post({ acao: 'buscar_anotacao_versiculo', livro: livroAtual.slug, capitulo: capAtual, versiculo: a.versiculo });
      const el  = document.getElementById(`nota-preview-${a.versiculo}`);
      if (el && res.texto) el.textContent = '📝 ' + res.texto.substring(0, 80) + (res.texto.length > 80 ? '…' : '');
    } catch {}
  });
}

// Notas de capítulo
function toggleNotaCapitulo() {
  const form = document.getElementById('capNotaForm'), icon = document.getElementById('capNotaToggleIcon');
  const open = form.style.display === 'block';
  form.style.display = open ? 'none' : 'block'; icon.textContent = open ? '▼' : '▲';
}
function toggleNotaCapituloVerses() {
  const form = document.getElementById('verseCapNotaForm'), icon = document.getElementById('verseCapNotaIcon');
  const open = form.style.display === 'block';
  form.style.display = open ? 'none' : 'block'; icon.textContent = open ? '▼' : '▲';
}
async function salvarNotaCapituloAtual() {
  const texto = document.getElementById('capNotaTexto').value;
  try { await post({ acao: 'salvar_anotacao_capitulo', livro: livroAtual.slug, capitulo: 0, texto }); toast('Nota salva!', 'ok'); }
  catch { toast('Erro ao salvar.', 'err'); }
}
async function salvarNotaCapituloVerses() {
  const texto = document.getElementById('verseCapNotaTexto').value;
  try { await post({ acao: 'salvar_anotacao_capitulo', livro: livroAtual.slug, capitulo: capAtual, texto }); toast('Nota salva!', 'ok'); }
  catch { toast('Erro ao salvar.', 'err'); }
}

// Anotação por versículo
function abrirAnotacaoVerso(verso, texto) {
  anotacaoVersoTemp = { verso, texto };
  document.getElementById('anotacaoVersoPreview').textContent =
    `${livroAtual.nome} ${capAtual}:${verso} — "${texto.substring(0, 100)}${texto.length > 100 ? '…' : ''}"`;
  post({ acao: 'buscar_anotacao_versiculo', livro: livroAtual.slug, capitulo: capAtual, versiculo: verso })
    .then(res => { document.getElementById('anotacaoVersoTexto').value = res.texto || ''; })
    .catch(() => { document.getElementById('anotacaoVersoTexto').value = ''; });
  abrirModal('modal-anotacao-verso');
}
async function salvarAnotacaoVerso() {
  if (!anotacaoVersoTemp) return;
  const texto = document.getElementById('anotacaoVersoTexto').value;
  try {
    await post({ acao: 'salvar_anotacao_versiculo', livro: livroAtual.slug, capitulo: capAtual, versiculo: anotacaoVersoTemp.verso, texto });
    fecharModal('modal-anotacao-verso'); toast('Anotação salva!', 'ok');
    const res = await post({ acao: 'listar_anotacoes_livro', livro: livroAtual.slug });
    anotacoesLivro = res; abrirCapitulo(capAtual);
  } catch { toast('Erro ao salvar.', 'err'); }
}

// Favoritos
function prepararFavorito(dados) {
  favoritoTemp = dados;
  document.getElementById('favoritoPreview').textContent = `${dados.ref} — "${dados.texto.substring(0, 100)}"`;
  document.getElementById('favoritoAnotacao').value = '';
  abrirModal('modal-favorito');
}
async function confirmarFavorito() {
  if (!favoritoTemp) return;
  try {
    await post({ acao: 'salvar_favorito', data: {
      referencia: favoritoTemp.ref, livro: favoritoTemp.livro,
      capitulo: favoritoTemp.cap, versiculo: favoritoTemp.vers,
      texto: favoritoTemp.texto,
      anotacao:  document.getElementById('favoritoAnotacao').value,
      categoria: document.getElementById('favoritoCategoria').value,
    }});
    fecharModal('modal-favorito'); favoritoTemp = null; toast('Versículo salvo! ⭐', 'ok');
  } catch (e) { toast(e.message || 'Erro.', 'err'); }
}
async function carregarFavoritos() {
  const cat = document.getElementById('favCategoria').value || 'todas';
  try {
    const res = await post({ acao: 'listar_favoritos', categoria: cat });
    const sel = document.getElementById('favCategoria'), val = sel.value;
    sel.innerHTML = '<option value="todas">Todas as categorias</option>';
    (res.categorias || []).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c.charAt(0).toUpperCase() + c.slice(1); sel.appendChild(opt);
    });
    sel.value = val;
    const el    = document.getElementById('listaFavoritos');
    const lista = res.favoritos || [];
    if (!lista.length) { el.innerHTML = '<div class="empty-state">Nenhum favorito ainda.</div>'; return; }
    el.innerHTML = lista.map(f => `
      <div class="fav-card">
        <div class="fav-ref">📖 ${esc(f.referencia)}</div>
        <div class="fav-text">${esc(f.texto)}</div>
        ${f.anotacao ? `<div class="fav-anotacao">📝 ${esc(f.anotacao)}</div>` : ''}
        <div class="fav-footer">
          <span class="fav-cat">${esc(f.categoria)}</span>
          <button class="fav-del" onclick="excluirFavorito(${f.id})">🗑️</button>
        </div>
      </div>`).join('');
  } catch { toast('Erro ao carregar favoritos.', 'err'); }
}
async function excluirFavorito(id) {
  if (!confirm('Remover favorito?')) return;
  try { await post({ acao: 'excluir_favorito', id }); toast('Removido.', 'ok'); carregarFavoritos(); }
  catch { toast('Erro.', 'err'); }
}

// Estudos
async function carregarEstudos() {
  try { const res = await post({ acao: 'listar_estudos' }); renderizarEstudos(res.estudos || []); }
  catch { toast('Erro ao carregar estudos.', 'err'); }
}
function renderizarEstudos(lista) {
  const el = document.getElementById('listaEstudos');
  if (!lista.length) { el.innerHTML = '<div class="empty-state">Nenhum estudo ainda.</div>'; return; }
  const catL = { geral: 'Geral', pregacao: 'Pregação', estudo: 'Estudo Bíblico', devocional: 'Devocional', celula: 'Célula' };
  el.innerHTML = lista.map(e => `
    <div class="estudo-card">
      <div class="estudo-titulo">${esc(e.titulo)}</div>
      ${e.versiculo_base ? `<div class="estudo-versiculo">📖 ${esc(e.versiculo_base)}</div>` : ''}
      ${e.conteudo       ? `<div class="estudo-preview">${esc(e.conteudo)}</div>` : ''}
      <div class="estudo-footer">
        <span class="estudo-cat">${catL[e.categoria] || e.categoria}</span>
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
  if (!titulo) { toast('Título obrigatório.', 'err'); return; }
  const data = {
    titulo, conteudo: document.getElementById('est-conteudo').value,
    versiculo_base: document.getElementById('est-versiculo').value,
    texto_base:     document.getElementById('est-texto-base').value,
    categoria:      document.getElementById('est-categoria').value,
  };
  try {
    if (estudoEditandoId) await post({ acao: 'atualizar_estudo', id: estudoEditandoId, data });
    else                   await post({ acao: 'salvar_estudo', data });
    fecharModal('modal-estudo');
    limpar(['est-titulo', 'est-versiculo', 'est-texto-base', 'est-conteudo']);
    estudoEditandoId = null;
    document.getElementById('modalEstudoTitulo').textContent = 'Novo Estudo';
    toast('Estudo salvo!', 'ok'); carregarEstudos();
  } catch { toast('Erro.', 'err'); }
}
function editarEstudo(id) {
  post({ acao: 'listar_estudos' }).then(res => {
    const e = (res.estudos || []).find(x => x.id === id); if (!e) return;
    estudoEditandoId = id;
    document.getElementById('modalEstudoTitulo').textContent = 'Editar Estudo';
    document.getElementById('est-titulo').value      = e.titulo || '';
    document.getElementById('est-versiculo').value   = e.versiculo_base || '';
    document.getElementById('est-texto-base').value  = e.texto_base || '';
    document.getElementById('est-categoria').value   = e.categoria || 'geral';
    document.getElementById('est-conteudo').value    = e.conteudo || '';
    abrirModal('modal-estudo');
  });
}
async function excluirEstudo(id, titulo) {
  if (!confirm(`Excluir "${titulo}"?`)) return;
  try { await post({ acao: 'excluir_estudo', id }); toast('Removido.', 'ok'); carregarEstudos(); }
  catch { toast('Erro.', 'err'); }
}

// Mapa nomes → slug para busca por referência
const NOMES_SLUG = {};
const SLUGS_NOMES = {};
async function iniciarMapaNomes() {
  const biblia = await carregarBibliaJSON();
  Object.entries(biblia).forEach(([slug, livro]) => {
    SLUGS_NOMES[slug] = livro.nome;
    NOMES_SLUG[livro.nome.toLowerCase()] = slug;
    const abrev = livro.abbr?.toLowerCase();
    if (abrev) NOMES_SLUG[abrev] = slug;
  });
}
function parsearRefLocal(ref) {
  const m = ref.trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i);
  if (!m) return null;
  const [, livroStr, cap, vers, versEnd] = m;
  const slug = NOMES_SLUG[livroStr.trim().toLowerCase()];
  if (!slug) return null;
  return { slug, cap: parseInt(cap), vers: vers ? parseInt(vers) : null, versEnd: versEnd ? parseInt(versEnd) : null };
}
async function buscarPorReferencia() {
  const ref = document.getElementById('bibliaRef').value.trim(); if (!ref) return;
  const el  = document.getElementById('bibliaResultado');
  el.innerHTML = '<div class="bible-loading">Buscando…</div>';
  await iniciarMapaNomes();
  const parsed = parsearRefLocal(ref);
  if (!parsed) { el.innerHTML = '<div class="bible-error">Referência não reconhecida. Ex: João 3:16 ou Sl 23</div>'; return; }
  try {
    const biblia    = await carregarBibliaJSON();
    const livroData = biblia[parsed.slug];
    if (!livroData) { el.innerHTML = '<div class="bible-error">Livro não encontrado.</div>'; return; }
    const cap = livroData.caps[parsed.cap - 1];
    if (!cap)  { el.innerHTML = '<div class="bible-error">Capítulo não encontrado.</div>'; return; }
    let verses;
    if (parsed.vers) {
      const fim = parsed.versEnd || parsed.vers;
      verses = cap.slice(parsed.vers - 1, fim).map((t, i) => ({ verse: parsed.vers + i, text: t, slug: parsed.slug, cap: parsed.cap, nome: livroData.nome }));
    } else {
      verses = cap.map((t, i) => ({ verse: i + 1, text: t, slug: parsed.slug, cap: parsed.cap, nome: livroData.nome }));
    }
    const refLabel = `${livroData.nome} ${parsed.cap}${parsed.vers ? ':' + parsed.vers : ''}${parsed.versEnd ? '-' + parsed.versEnd : ''}`;
    renderizarResultadoBiblia(verses, refLabel);
  } catch { el.innerHTML = '<div class="bible-error">Erro ao buscar.</div>'; }
}
async function buscarPorPalavra() {
  const palavra = document.getElementById('bibliaPalavra').value.trim().toLowerCase(); if (!palavra) return;
  const el = document.getElementById('bibliaResultado');
  el.innerHTML = '<div class="bible-loading">Buscando em todos os livros…</div>';
  try {
    const biblia     = await carregarBibliaJSON();
    const resultados = [];
    for (const [slug, livro] of Object.entries(biblia)) {
      for (let ci = 0; ci < livro.caps.length; ci++) {
        for (let vi = 0; vi < livro.caps[ci].length; vi++) {
          if (livro.caps[ci][vi].toLowerCase().includes(palavra)) {
            resultados.push({ verse: vi + 1, text: livro.caps[ci][vi], slug, cap: ci + 1, nome: livro.nome });
            if (resultados.length >= 30) break;
          }
        }
        if (resultados.length >= 30) break;
      }
      if (resultados.length >= 30) break;
    }
    if (!resultados.length) { el.innerHTML = '<div class="bible-error">Nenhum resultado encontrado.</div>'; return; }
    renderizarResultadoBiblia(resultados, `"${palavra}" — ${resultados.length} resultado${resultados.length > 1 ? 's' : ''}`);
  } catch { el.innerHTML = '<div class="bible-error">Erro ao buscar.</div>'; }
}
function renderizarResultadoBiblia(verses, refLabel) {
  if (!verses.length) { document.getElementById('bibliaResultado').innerHTML = '<div class="bible-error">Sem resultados.</div>'; return; }
  document.getElementById('bibliaResultado').innerHTML = `
    <div class="bible-result">
      <div class="bible-result-ref">📖 ${esc(refLabel)}</div>
      ${verses.map(v => `
        <div class="bible-verse">
          <span class="bible-verse-num">
            ${v.nome ? `<span style="font-size:9px;display:block;color:var(--accent)">${esc(v.nome)} ${v.cap}</span>` : ''}
            ${v.verse}
          </span>
          <span class="bible-verse-text">${esc(v.text)}</span>
          <div class="bible-verse-actions">
            <button class="bible-verse-btn" onclick="prepararFavorito({ref:'${esc((v.nome || '') + ' ' + v.cap + ':' + v.verse)}',livro:'${v.slug || ''}',cap:${v.cap},vers:${v.verse},texto:'${esc(v.text)}'})">⭐</button>
          </div>
        </div>`).join('')}
    </div>`;
}

// ── Modais ────────────────────────────────────────────────────────────────
function abrirModal(id) { document.getElementById(id).classList.add('open'); }
function fecharModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) fecharModal(o.id); });
});
// Fechar com Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(o => fecharModal(o.id));
  }
});

// ── Utils ─────────────────────────────────────────────────────────────────
function esc(str) { return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmt(d) { if (!d) return ''; const [y, m, dd] = String(d).split('-'); return dd && m && y ? `${dd}/${m}/${y}` : d; }
function fmtAniv(d) { if (!d) return ''; const [, m, dd] = String(d).split('-'); return `${dd}/${m}`; }
function limpar(ids) { ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); }
let toastTimer;
function toast(msg, tipo = 'ok') {
  const el = document.getElementById('toast');
  el.textContent = msg; el.className = `toast ${tipo} show`;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}
