const API = '/api';

// ── Estado global ─────────────────────────────────────────────────────────────
let dadosEscalas = [];
let dadosServos  = [];
let calAno  = new Date().getFullYear();
let calMes  = new Date().getMonth(); // 0-11

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  iniciarNavegacao();
  carregarDados();

  document.getElementById('calPrev').addEventListener('click', () => { calMes--; if (calMes < 0) { calMes = 11; calAno--; } renderizarCalendario(); });
  document.getElementById('calNext').addEventListener('click', () => { calMes++; if (calMes > 11) { calMes = 0; calAno++; } renderizarCalendario(); });

  // Preenche telefone automaticamente ao selecionar servo
  document.getElementById('esc-operador').addEventListener('change', function() {
    const servo = dadosServos.find(s => s.nome === this.value);
    document.getElementById('esc-telefone').value = servo ? (servo.telefone || '') : '';
  });
});

// ── Navegação ─────────────────────────────────────────────────────────────────
function iniciarNavegacao() {
  const todos = [...document.querySelectorAll('.nav-item'), ...document.querySelectorAll('.bottom-nav-item')];
  todos.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll(`[data-tab="${tab}"]`).forEach(b => b.classList.add('active'));
      document.getElementById('tab-' + tab).classList.add('active');
    });
  });
}

// ── API ───────────────────────────────────────────────────────────────────────
async function post(payload) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Carregar dados ────────────────────────────────────────────────────────────
async function carregarDados() {
  try {
    const dados = await post({ acao: 'listar' });
    dadosEscalas = dados.escalas || [];
    dadosServos  = dados.servos  || [];
    renderizarEscalas(dadosEscalas);
    renderizarTarefas(dados.tarefas || []);
    renderizarServos(dadosServos);
    renderizarCalendario();
    preencherDropdownServos();
    setStatus(true);
  } catch (e) {
    console.error(e);
    setStatus(false);
    toast('Erro ao conectar com o servidor.', 'err');
  }
}

// ── Dropdown de servos ────────────────────────────────────────────────────────
function preencherDropdownServos() {
  const sel = document.getElementById('esc-operador');
  const val = sel.value;
  sel.innerHTML = '<option value="">Selecionar servo…</option>';
  dadosServos.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.nome;
    opt.textContent = s.nome + (s.funcao ? ` — ${s.funcao}` : '');
    sel.appendChild(opt);
  });
  sel.value = val;
}

// ── Calendário ────────────────────────────────────────────────────────────────
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function renderizarCalendario() {
  document.getElementById('calTitulo').textContent = `${MESES[calMes]} ${calAno}`;
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  // Cabeçalho dias da semana
  DIAS.forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-weekday';
    el.textContent = d;
    grid.appendChild(el);
  });

  const primeiroDia = new Date(calAno, calMes, 1).getDay();
  const totalDias   = new Date(calAno, calMes + 1, 0).getDate();
  const hoje = new Date();

  // Células vazias
  for (let i = 0; i < primeiroDia; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day empty';
    grid.appendChild(el);
  }

  // Dias
  for (let d = 1; d <= totalDias; d++) {
    const dataStr = `${calAno}-${String(calMes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const escalasHoje = dadosEscalas.filter(e => e.data === dataStr);
    const temObs = escalasHoje.some(e => e.obs && e.obs.trim());

    const el = document.createElement('div');
    el.className = 'cal-day';
    if (d === hoje.getDate() && calMes === hoje.getMonth() && calAno === hoje.getFullYear()) el.classList.add('today');
    if (escalasHoje.length > 0) el.classList.add('has-escala');

    const num = document.createElement('div');
    num.className = 'cal-day-num';
    num.textContent = d;
    el.appendChild(num);

    escalasHoje.forEach(e => {
      const chip = document.createElement('div');
      chip.className = 'cal-escala-chip';
      chip.textContent = e.operador;
      el.appendChild(chip);
    });

    if (temObs) {
      const dot = document.createElement('div');
      dot.className = 'cal-obs-dot';
      dot.title = 'Tem observação';
      el.appendChild(dot);
    }

    el.addEventListener('click', () => abrirDetalhe(dataStr, escalasHoje, d));
    grid.appendChild(el);
  }
}

function abrirDetalhe(dataStr, escalas, dia) {
  const detail = document.getElementById('dayDetail');
  document.getElementById('dayDetailTitle').textContent = `${dia} de ${MESES[calMes]} de ${calAno}`;

  const body = document.getElementById('dayDetailBody');
  if (!escalas.length) {
    body.innerHTML = `<div class="empty-state" style="padding:20px">Nenhuma escala neste dia. <button class="btn btn--primary" style="margin-top:10px;display:block" onclick="abrirModal('modal-escala')">+ Adicionar</button></div>`;
  } else {
    body.innerHTML = escalas.map(e => `
      <div class="detail-escala">
        <div class="detail-row"><span>Operador</span><span>${esc(e.operador)}</span></div>
        ${e.telefone ? `<div class="detail-row"><span>Telefone</span><span>${esc(e.telefone)}</span></div>` : ''}
        ${e.musicas  ? `<div class="detail-row"><span>Músicas</span><span>${esc(e.musicas)}</span></div>`  : ''}
        ${e.obs      ? `<div class="detail-obs">📝 ${esc(e.obs)}</div>` : ''}
      </div>`).join('');
  }

  detail.style.display = 'block';
  detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function fecharDetalhe() {
  document.getElementById('dayDetail').style.display = 'none';
}

// ── Renderização ──────────────────────────────────────────────────────────────
function renderizarEscalas(lista) {
  const el = document.getElementById('lista-escalas');
  if (!lista.length) { el.innerHTML = '<div class="empty-state">Nenhuma escala cadastrada.</div>'; return; }
  el.innerHTML = lista.map(e => `
    <div class="card">
      <button class="card-del" onclick="excluirEscala('${esc(e.data)}','${esc(e.operador)}')">✕</button>
      <div class="card-title">${fmt(e.data)}</div>
      <div class="card-row"><span>Operador</span><span>${esc(e.operador)}</span></div>
      ${e.telefone ? `<div class="card-row"><span>Telefone</span><span>${esc(e.telefone)}</span></div>` : ''}
      ${e.musicas  ? `<div class="card-row"><span>Músicas</span><span>${esc(e.musicas)}</span></div>`  : ''}
      ${e.obs      ? `<div class="card-obs">📝 ${esc(e.obs)}</div>` : ''}
    </div>`).join('');
}

function renderizarTarefas(lista) {
  const el = document.getElementById('lista-tarefas');
  if (!lista.length) { el.innerHTML = '<div class="empty-state">Nenhuma tarefa cadastrada.</div>'; return; }
  el.innerHTML = lista.map(t => `
    <div class="task-item">
      <div class="task-check"></div>
      <span class="task-text">${esc(t.tarefa)}</span>
      ${t.prazo ? `<span class="task-prazo">${fmt(t.prazo)}</span>` : ''}
      <button class="task-del" onclick="excluirTarefa('${esc(t.tarefa)}','${esc(t.prazo)}')">✕</button>
    </div>`).join('');
}

function renderizarServos(lista) {
  const el = document.getElementById('lista-servos');
  if (!lista.length) { el.innerHTML = '<div class="empty-state">Nenhum servo cadastrado.</div>'; return; }
  el.innerHTML = lista.map(s => `
    <div class="card">
      <button class="card-del" onclick="excluirServo(${s.id})">✕</button>
      <div class="card-title">${esc(s.nome)}</div>
      ${s.funcao   ? `<div class="card-row"><span>Função</span><span>${esc(s.funcao)}</span></div>`   : ''}
      ${s.telefone ? `<div class="card-row"><span>Telefone</span><span>${esc(s.telefone)}</span></div>` : ''}
    </div>`).join('');
}

// ── Salvar ────────────────────────────────────────────────────────────────────
async function salvarEscala() {
  const data     = document.getElementById('esc-data').value.trim();
  const operador = document.getElementById('esc-operador').value.trim();
  if (!data || !operador) { toast('Data e Operador são obrigatórios.', 'err'); return; }
  try {
    await post({ acao: 'salvar', tipo: 'escala', data: {
      data, operador,
      telefone: document.getElementById('esc-telefone').value.trim(),
      musicas:  document.getElementById('esc-musicas').value.trim(),
      obs:      document.getElementById('esc-obs').value.trim(),
    }});
    fecharModal('modal-escala');
    limparCampos(['esc-data','esc-operador','esc-telefone','esc-musicas','esc-obs']);
    toast('Escala salva!', 'ok');
    carregarDados();
  } catch { toast('Erro ao salvar escala.', 'err'); }
}

async function salvarTarefa() {
  const tarefa = document.getElementById('tar-tarefa').value.trim();
  if (!tarefa) { toast('Descrição é obrigatória.', 'err'); return; }
  try {
    await post({ acao: 'salvar', tipo: 'tarefa', data: { tarefa, prazo: document.getElementById('tar-prazo').value.trim() }});
    fecharModal('modal-tarefa');
    limparCampos(['tar-tarefa','tar-prazo']);
    toast('Tarefa salva!', 'ok');
    carregarDados();
  } catch { toast('Erro ao salvar tarefa.', 'err'); }
}

async function salvarServo() {
  const nome = document.getElementById('srv-nome').value.trim();
  if (!nome) { toast('Nome é obrigatório.', 'err'); return; }
  try {
    await post({ acao: 'salvar', tipo: 'servo', data: {
      nome,
      telefone: document.getElementById('srv-telefone').value.trim(),
      funcao:   document.getElementById('srv-funcao').value.trim(),
    }});
    fecharModal('modal-servo');
    limparCampos(['srv-nome','srv-telefone','srv-funcao']);
    toast('Servo salvo!', 'ok');
    carregarDados();
  } catch { toast('Erro ao salvar servo.', 'err'); }
}

// ── Excluir ───────────────────────────────────────────────────────────────────
async function excluirEscala(data, nome) {
  if (!confirm(`Excluir escala de ${nome} em ${fmt(data)}?`)) return;
  try { await post({ acao: 'excluir', tipo: 'escala', data, nome }); toast('Escala removida.', 'ok'); carregarDados(); }
  catch { toast('Erro ao excluir.', 'err'); }
}

async function excluirTarefa(tarefa, dados) {
  if (!confirm(`Excluir tarefa "${tarefa}"?`)) return;
  try { await post({ acao: 'excluir', tipo: 'tarefa', tarefa, dados }); toast('Tarefa removida.', 'ok'); carregarDados(); }
  catch { toast('Erro ao excluir.', 'err'); }
}

async function excluirServo(id) {
  if (!confirm('Excluir este servo?')) return;
  try { await post({ acao: 'excluir', tipo: 'servo', id }); toast('Servo removido.', 'ok'); carregarDados(); }
  catch { toast('Erro ao excluir.', 'err'); }
}

// ── Modais ────────────────────────────────────────────────────────────────────
function abrirModal(id) { document.getElementById(id).classList.add('open'); }
function fecharModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) fecharModal(o.id); });
});

// ── Utils ─────────────────────────────────────────────────────────────────────
function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmt(d) {
  if (!d) return '';
  const [y,m,dd] = String(d).split('-');
  return dd && m && y ? `${dd}/${m}/${y}` : d;
}
function limparCampos(ids) { ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); }
function setStatus(ok) {
  document.getElementById('statusDot').innerHTML = ok
    ? '<span class="dot dot--ok"></span><span class="nav-label"> Online</span>'
    : '<span class="dot dot--err"></span><span class="nav-label"> Offline</span>';
}
let toastTimer;
function toast(msg, tipo = 'ok') {
  const el = document.getElementById('toast');
  el.textContent = msg; el.className = `toast ${tipo} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}
