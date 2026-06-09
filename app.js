// ── Configuração ─────────────────────────────────────────────────────────────
const API = '/api';

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  iniciarNavegacao();
  carregarDados();
});

// ── Navegação por abas ────────────────────────────────────────────────────────
function iniciarNavegacao() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + tab).classList.add('active');
    });
  });
}

// ── API Helper ────────────────────────────────────────────────────────────────
async function post(payload) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Carregar todos os dados ───────────────────────────────────────────────────
async function carregarDados() {
  try {
    const dados = await post({ acao: 'listar' });
    renderizarEscalas(dados.escalas  || []);
    renderizarTarefas(dados.tarefas  || []);
    renderizarServos(dados.servos    || []);
    setStatus(true);
  } catch (e) {
    console.error(e);
    setStatus(false);
    toast('Erro ao conectar com o servidor.', 'err');
  }
}

// ── Renderização ──────────────────────────────────────────────────────────────
function renderizarEscalas(lista) {
  const el = document.getElementById('lista-escalas');
  if (!lista.length) { el.innerHTML = '<div class="empty-state">Nenhuma escala cadastrada.</div>'; return; }
  el.innerHTML = lista.map(e => `
    <div class="card">
      <button class="card-del" title="Excluir" onclick="excluirEscala('${esc(e.data)}','${esc(e.operador)}')">✕</button>
      <div class="card-title">${fmt(e.data)}</div>
      <div class="card-row"><span>Operador</span><span>${esc(e.operador)}</span></div>
      ${e.telefone ? `<div class="card-row"><span>Telefone</span><span>${esc(e.telefone)}</span></div>` : ''}
      ${e.musicas  ? `<div class="card-row"><span>Músicas</span><span>${esc(e.musicas)}</span></div>`  : ''}
    </div>`).join('');
}

function renderizarTarefas(lista) {
  const el = document.getElementById('lista-tarefas');
  if (!lista.length) { el.innerHTML = '<div class="empty-state">Nenhuma tarefa cadastrada.</div>'; return; }
  el.innerHTML = lista.map(t => `
    <div class="task-item">
      <div class="task-check" title="Concluída"></div>
      <span class="task-text">${esc(t.tarefa)}</span>
      ${t.prazo ? `<span class="task-prazo">${fmt(t.prazo)}</span>` : ''}
      <button class="task-del" title="Excluir" onclick="excluirTarefa('${esc(t.tarefa)}','${esc(t.prazo)}')">✕</button>
    </div>`).join('');
}

function renderizarServos(lista) {
  const el = document.getElementById('lista-servos');
  if (!lista.length) { el.innerHTML = '<div class="empty-state">Nenhum servo cadastrado.</div>'; return; }
  el.innerHTML = lista.map(s => `
    <div class="card">
      <button class="card-del" title="Excluir" onclick="excluirServo(${s.id})">✕</button>
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
    await post({
      acao: 'salvar', tipo: 'escala',
      data: { data, operador,
        telefone: document.getElementById('esc-telefone').value.trim(),
        musicas:  document.getElementById('esc-musicas').value.trim() },
    });
    fecharModal('modal-escala');
    limparCampos(['esc-data','esc-operador','esc-telefone','esc-musicas']);
    toast('Escala salva!', 'ok');
    carregarDados();
  } catch { toast('Erro ao salvar escala.', 'err'); }
}

async function salvarTarefa() {
  const tarefa = document.getElementById('tar-tarefa').value.trim();
  if (!tarefa) { toast('Descrição é obrigatória.', 'err'); return; }

  try {
    await post({
      acao: 'salvar', tipo: 'tarefa',
      data: { tarefa, prazo: document.getElementById('tar-prazo').value.trim() },
    });
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
    await post({
      acao: 'salvar', tipo: 'servo',
      data: { nome,
        telefone: document.getElementById('srv-telefone').value.trim(),
        funcao:   document.getElementById('srv-funcao').value.trim() },
    });
    fecharModal('modal-servo');
    limparCampos(['srv-nome','srv-telefone','srv-funcao']);
    toast('Servo salvo!', 'ok');
    carregarDados();
  } catch { toast('Erro ao salvar servo.', 'err'); }
}

// ── Excluir ───────────────────────────────────────────────────────────────────
async function excluirEscala(data, nome) {
  if (!confirm(`Excluir escala de ${nome} em ${fmt(data)}?`)) return;
  try {
    await post({ acao: 'excluir', tipo: 'escala', data, nome });
    toast('Escala removida.', 'ok');
    carregarDados();
  } catch { toast('Erro ao excluir.', 'err'); }
}

async function excluirTarefa(tarefa, dados) {
  if (!confirm(`Excluir tarefa "${tarefa}"?`)) return;
  try {
    await post({ acao: 'excluir', tipo: 'tarefa', tarefa, dados });
    toast('Tarefa removida.', 'ok');
    carregarDados();
  } catch { toast('Erro ao excluir.', 'err'); }
}

async function excluirServo(id) {
  if (!confirm('Excluir este servo?')) return;
  try {
    await post({ acao: 'excluir', tipo: 'servo', id });
    toast('Servo removido.', 'ok');
    carregarDados();
  } catch { toast('Erro ao excluir.', 'err'); }
}

// ── Modais ────────────────────────────────────────────────────────────────────
function abrirModal(id)  { document.getElementById(id).classList.add('open'); }
function fecharModal(id) { document.getElementById(id).classList.remove('open'); }

// Fechar clicando no overlay
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) fecharModal(overlay.id); });
});

// ── Utilitários ───────────────────────────────────────────────────────────────
function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmt(dataStr) {
  if (!dataStr) return '';
  // Formato ISO yyyy-mm-dd → dd/mm/yyyy
  const [y, m, d] = String(dataStr).split('-');
  return d && m && y ? `${d}/${m}/${y}` : dataStr;
}

function limparCampos(ids) {
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

function setStatus(ok) {
  const el = document.getElementById('statusDot');
  el.innerHTML = ok
    ? '<span class="dot dot--ok"></span> Online'
    : '<span class="dot dot--err"></span> Offline';
}

let toastTimer;
function toast(msg, tipo = 'ok') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${tipo} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}
