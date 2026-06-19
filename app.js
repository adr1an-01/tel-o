const API='/api';
let BIBLIA_DATA=null;
const TOKEN_KEY='central_token';
let favoritoTemp=null,anotacaoVersoTemp=null,estudoEditandoId=null;
let livroAtual=null,capAtual=null,totalCapsAtual=0;
let anotacoesLivro={versiculos:[],capitulos:[]};
let versoAtual=null,_versesCache=[];
let grifos={};
const GRIFO_HEX={amarelo:'#fbbf24',verde:'#2dd4a0',rosa:'#f472b6',azul:'#38bdf8',laranja:'#fb923c'};
let readingTimer=null,readingSeconds=0;
const READING_TARGET=120; // 2 minutos

if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});

// ── Prefs ─────────────────────────────────────────────────────────────────
function setTheme(t){document.documentElement.setAttribute('data-theme',t);localStorage.setItem('central_theme',t);document.querySelectorAll('.theme-btn').forEach(b=>b.classList.toggle('active',b.id==='btn-'+t));}
function setAccent(a){document.documentElement.setAttribute('data-accent',a);localStorage.setItem('central_accent',a);document.querySelectorAll('.accent-swatch').forEach(s=>{const ok=s.dataset.accent===a;s.classList.toggle('active',ok);s.textContent=ok?'✓':''});}
function ajustarFonte(v){document.documentElement.style.setProperty('--verse-size',v+'px');localStorage.setItem('central_font_size',v);}
function setFontFamily(f){const isSerif=f==='serif';document.documentElement.style.setProperty('--verse-font',isSerif?'\'Lora\',serif':'\'Inter\',sans-serif');localStorage.setItem('central_font_family',f);document.getElementById('btnSerif').classList.toggle('active',isSerif);document.getElementById('btnSans').classList.toggle('active',!isSerif);}
function setReadingBg(b){const map={dark:{bg:'#07090f',text:'#dde3f5'},black:{bg:'#000000',text:'#e0e0e0'},sepia:{bg:'#f5efe0',text:'#3b2e1a'},white:{bg:'#ffffff',text:'#1a1a1a'}};const c=map[b]||map.dark;document.documentElement.style.setProperty('--read-bg',c.bg);document.documentElement.style.setProperty('--read-text',c.text);localStorage.setItem('central_read_bg',b);['bgDark','bgBlack','bgSepia','bgWhite'].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.toggle('active',id==='bg'+b.charAt(0).toUpperCase()+b.slice(1));});}
function aplicarPreferencias(){
  setTheme(localStorage.getItem('central_theme')||'dark');
  setAccent(localStorage.getItem('central_accent')||'indigo');
  const fs=localStorage.getItem('central_font_size')||'16';
  document.documentElement.style.setProperty('--verse-size',fs+'px');
  const sl=document.getElementById('fontSizeSlider');if(sl)sl.value=fs;
  setFontFamily(localStorage.getItem('central_font_family')||'serif');
  setReadingBg(localStorage.getItem('central_read_bg')||'dark');
}
function carregarGrifos(){try{grifos=JSON.parse(localStorage.getItem('central_grifos')||'{}');}catch{grifos={};}}
function salvarGrifos(){localStorage.setItem('central_grifos',JSON.stringify(grifos));}
function chaveGrifo(slug,cap,verse){return`${slug}-${cap}-${verse}`;}

// ── Streak & Semente ──────────────────────────────────────────────────────
function getStreak(){try{return JSON.parse(localStorage.getItem('central_streak')||'{"days":0,"lastDate":""}');}catch{return{days:0,lastDate:''};}}
function salvarStreak(s){localStorage.setItem('central_streak',JSON.stringify(s));}
function hoje(){return new Date().toISOString().split('T')[0];}
function ontem(){const d=new Date();d.setDate(d.getDate()-1);return d.toISOString().split('T')[0];}
function marcarLeituraHoje(){
  const s=getStreak(),h=hoje();
  if(s.lastDate===h){toast('Você já registrou a leitura de hoje! 🌱','ok');return;}
  if(s.lastDate===ontem()){s.days+=1;}else if(s.lastDate!==h){s.days=1;}
  s.lastDate=h;
  salvarStreak(s);
  renderizarPlanta();
  toast(s.days===1?'Leitura registrada! Sequência iniciada 🌱':`${s.days} dias seguidos! 🌿`,'ok');
}
function iniciarTimerLeitura(){
  if(readingTimer)return;
  const s=getStreak();
  if(s.lastDate===hoje())return; // já marcou hoje
  readingSeconds=0;
  readingTimer=setInterval(()=>{
    readingSeconds++;
    if(readingSeconds>=READING_TARGET){
      clearInterval(readingTimer);readingTimer=null;
      marcarLeituraHoje();
    }
  },1000);
}
function pararTimerLeitura(){if(readingTimer){clearInterval(readingTimer);readingTimer=null;}}

function getEstagio(days){
  if(days>=120)return{nome:'Árvore com Frutos',idx:4,next:null,prox:120};
  if(days>=60) return{nome:'Árvore',idx:3,next:120,prox:60};
  if(days>=21) return{nome:'Planta',idx:2,next:60,prox:21};
  if(days>=7)  return{nome:'Broto',idx:1,next:21,prox:7};
  return{nome:'Semente',idx:0,next:7,prox:0};
}
function svgPlanta(idx){
  const svgs=[
    // 0 Semente
    `<svg width="60" height="90" viewBox="0 0 60 90"><ellipse cx="30" cy="78" rx="20" ry="6" fill="rgba(34,197,94,.15)"/><ellipse cx="30" cy="68" rx="10" ry="14" fill="#854d0e" opacity=".8"/><ellipse cx="30" cy="58" rx="7" ry="10" fill="#713f12" opacity=".6"/></svg>`,
    // 1 Broto
    `<svg width="70" height="100" viewBox="0 0 70 100"><ellipse cx="35" cy="90" rx="22" ry="7" fill="rgba(34,197,94,.15)"/><rect x="33" y="55" width="4" height="32" rx="2" fill="#65a30d"/><ellipse cx="35" cy="52" rx="14" ry="10" fill="#84cc16"/><ellipse cx="22" cy="62" rx="10" ry="7" fill="#86efac" transform="rotate(-20,22,62)"/><ellipse cx="48" cy="62" rx="10" ry="7" fill="#86efac" transform="rotate(20,48,62)"/></svg>`,
    // 2 Planta
    `<svg width="80" height="110" viewBox="0 0 80 110"><ellipse cx="40" cy="100" rx="26" ry="8" fill="rgba(34,197,94,.15)"/><rect x="38" y="45" width="4" height="52" rx="2" fill="#65a30d"/><ellipse cx="40" cy="40" rx="18" ry="13" fill="#84cc16"/><ellipse cx="22" cy="55" rx="14" ry="9" fill="#86efac" transform="rotate(-25,22,55)"/><ellipse cx="58" cy="55" rx="14" ry="9" fill="#86efac" transform="rotate(25,58,55)"/><ellipse cx="28" cy="70" rx="12" ry="8" fill="#bbf7d0" transform="rotate(-15,28,70)"/><ellipse cx="52" cy="70" rx="12" ry="8" fill="#bbf7d0" transform="rotate(15,52,70)"/></svg>`,
    // 3 Árvore
    `<svg width="100" height="120" viewBox="0 0 100 120"><ellipse cx="50" cy="112" rx="32" ry="9" fill="rgba(34,197,94,.15)"/><rect x="47" y="50" width="6" height="60" rx="3" fill="#92400e"/><ellipse cx="50" cy="42" rx="26" ry="20" fill="#22c55e"/><ellipse cx="30" cy="58" rx="18" ry="13" fill="#4ade80"/><ellipse cx="70" cy="58" rx="18" ry="13" fill="#4ade80"/><ellipse cx="50" cy="28" rx="20" ry="16" fill="#16a34a"/><ellipse cx="32" cy="42" rx="14" ry="10" fill="#86efac" opacity=".7"/><ellipse cx="68" cy="42" rx="14" ry="10" fill="#86efac" opacity=".7"/></svg>`,
    // 4 Árvore com Frutos
    `<svg width="110" height="120" viewBox="0 0 110 120"><ellipse cx="55" cy="112" rx="36" ry="9" fill="rgba(34,197,94,.15)"/><rect x="52" y="50" width="6" height="60" rx="3" fill="#92400e"/><ellipse cx="55" cy="40" rx="30" ry="22" fill="#16a34a"/><ellipse cx="34" cy="56" rx="20" ry="14" fill="#22c55e"/><ellipse cx="76" cy="56" rx="20" ry="14" fill="#22c55e"/><ellipse cx="55" cy="26" rx="22" ry="18" fill="#15803d"/><circle cx="40" cy="50" r="6" fill="#ef4444"/><circle cx="62" cy="44" r="5" fill="#f97316"/><circle cx="72" cy="58" r="6" fill="#ef4444"/><circle cx="46" cy="62" r="5" fill="#fbbf24"/><circle cx="34" cy="52" r="4" fill="#f97316"/><circle cx="55" cy="32" r="5" fill="#ef4444"/></svg>`
  ];
  return svgs[Math.min(idx,4)];
}
function renderizarPlanta(){
  const s=getStreak(),e=getEstagio(s.days);
  const label=document.getElementById('plantStageLabel');
  const wrap=document.getElementById('plantSvgWrap');
  const fill=document.getElementById('plantProgressFill');
  const txt=document.getElementById('plantProgressText');
  const btn=document.getElementById('plantReadBtn');
  if(!label)return;
  label.textContent=e.nome;
  if(wrap)wrap.innerHTML=svgPlanta(e.idx);
  const leuHoje=s.lastDate===hoje();
  if(fill){
    let pct=0;
    if(e.next){const prev=e.prox;pct=Math.min(100,Math.round((s.days-prev)/(e.next-prev)*100));}else pct=100;
    fill.style.width=pct+'%';
  }
  if(txt){
    if(e.next)txt.textContent=`${s.days} dias — faltam ${e.next-s.days} para ${['Broto','Planta','Árvore','Árvore com Frutos'][e.idx]}`;
    else txt.textContent=`${s.days} dias — estágio máximo! 🎉`;
  }
  if(btn){
    if(leuHoje){btn.textContent='✓ Leitura registrada hoje';btn.className='plant-read-btn done';}
    else{btn.textContent='Registrar leitura de hoje';btn.className='plant-read-btn';}
  }
  // Streak badge
  const badge=document.getElementById('homeStreakBadge');
  if(badge)badge.textContent=`🔥 ${s.days} ${s.days===1?'dia':'dias'}`;
  const st=document.getElementById('homeStreak');
  if(st)st.textContent=leuHoje?'Você leu hoje ✓':'Leia hoje para manter a sequência';
}

// ── Versículo do dia ──────────────────────────────────────────────────────
const VERSICULOS_DIA=[
  {ref:'João 3:16',texto:'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.'},
  {ref:'Filipenses 4:13',texto:'Tudo posso naquele que me fortalece.'},
  {ref:'Salmos 23:1',texto:'O Senhor é o meu pastor; nada me faltará.'},
  {ref:'Romanos 8:28',texto:'Sabemos que Deus age em todas as coisas para o bem daqueles que o amam, dos que foram chamados de acordo com o seu propósito.'},
  {ref:'Jeremias 29:11',texto:'Porque eu bem sei os planos que tenho a vosso respeito, diz o Senhor; planos de paz e não de mal, para vos dar um futuro e uma esperança.'},
  {ref:'Isaías 40:31',texto:'Mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias; correrão e não se cansarão; caminharão e não se fatigarão.'},
  {ref:'Mateus 11:28',texto:'Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.'},
  {ref:'Salmos 46:1',texto:'Deus é o nosso refúgio e fortaleza, socorro bem presente nas tribulações.'},
  {ref:'Provérbios 3:5-6',texto:'Confia no Senhor de todo o teu coração e não te apoies no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.'},
  {ref:'2 Coríntios 5:7',texto:'Porque andamos por fé e não por vista.'},
  {ref:'Efésios 2:8',texto:'Porque pela graça sois salvos, por meio da fé; e isso não vem de vós; é dom de Deus.'},
  {ref:'Salmos 119:105',texto:'Lâmpada para os meus pés é a tua palavra e luz para o meu caminho.'},
  {ref:'Gálatas 5:22-23',texto:'Mas o fruto do Espírito é: amor, alegria, paz, longanimidade, benignidade, bondade, fidelidade, mansidão, domínio próprio.'},
  {ref:'1 João 4:8',texto:'Aquele que não ama não conheceu a Deus, porque Deus é amor.'},
];
function renderizarVOD(){
  const dia=new Date().getDate();
  const v=VERSICULOS_DIA[dia%VERSICULOS_DIA.length];
  const t=document.getElementById('vodText'),r=document.getElementById('vodRef');
  if(t)t.textContent=v.texto;
  if(r)r.textContent='— '+v.ref;
}

// ── Saudação ──────────────────────────────────────────────────────────────
function renderizarSaudacao(usuario){
  const h=new Date().getHours();
  const saud=h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
  const el=document.getElementById('homeGreeting');
  if(el)el.textContent=`${saud}, ${usuario.split(' ')[0]} 👋`;
}

// ── Plano de leitura ──────────────────────────────────────────────────────
const BIBLIA_CAPS={genesis:50,exodus:40,leviticus:27,numbers:36,deuteronomy:34,joshua:24,judges:21,ruth:4,'1samuel':31,'2samuel':24,'1kings':22,'2kings':25,'1chronicles':29,'2chronicles':36,ezra:10,nehemiah:13,esther:10,job:42,psalms:150,proverbs:31,ecclesiastes:12,'song of solomon':8,isaiah:66,jeremiah:52,lamentations:5,ezekiel:48,daniel:12,hosea:14,joel:3,amos:9,obadiah:1,jonah:4,micah:7,nahum:3,habakkuk:3,zephaniah:3,haggai:2,zechariah:14,malachi:4,matthew:28,mark:16,luke:24,john:21,acts:28,romans:16,'1corinthians':16,'2corinthians':13,galatians:6,ephesians:6,philippians:4,colossians:4,'1thessalonians':5,'2thessalonians':3,'1timothy':6,'2timothy':4,titus:3,philemon:1,hebrews:13,james:5,'1peter':5,'2peter':3,'1john':5,'2john':1,'3john':1,jude:1,revelation:22};
const BIBLIA_NOMES={'genesis':'Gênesis','exodus':'Êxodo','leviticus':'Levítico','numbers':'Números','deuteronomy':'Deuteronômio','joshua':'Josué','judges':'Juízes','ruth':'Rute','1samuel':'1 Samuel','2samuel':'2 Samuel','1kings':'1 Reis','2kings':'2 Reis','1chronicles':'1 Crônicas','2chronicles':'2 Crônicas','ezra':'Esdras','nehemiah':'Neemias','esther':'Ester','job':'Jó','psalms':'Salmos','proverbs':'Provérbios','ecclesiastes':'Eclesiastes','song of solomon':'Cantares','isaiah':'Isaías','jeremiah':'Jeremias','lamentations':'Lamentações','ezekiel':'Ezequiel','daniel':'Daniel','hosea':'Oséias','joel':'Joel','amos':'Amós','obadiah':'Obadias','jonah':'Jonas','micah':'Miquéias','nahum':'Naum','habakkuk':'Habacuque','zephaniah':'Sofonias','haggai':'Ageu','zechariah':'Zacarias','malachi':'Malaquias','matthew':'Mateus','mark':'Marcos','luke':'Lucas','john':'João','acts':'Atos','romans':'Romanos','1corinthians':'1 Coríntios','2corinthians':'2 Coríntios','galatians':'Gálatas','ephesians':'Efésios','philippians':'Filipenses','colossians':'Colossenses','1thessalonians':'1 Tessalonicenses','2thessalonians':'2 Tessalonicenses','1timothy':'1 Timóteo','2timothy':'2 Timóteo','titus':'Tito','philemon':'Filemom','hebrews':'Hebreus','james':'Tiago','1peter':'1 Pedro','2peter':'2 Pedro','1john':'1 João','2john':'2 João','3john':'3 João','jude':'Judas','revelation':'Apocalipse'};

function getPlano(){try{return JSON.parse(localStorage.getItem('central_plano')||'null');}catch{return null;}}
function salvarPlanoLocal(p){localStorage.setItem('central_plano',JSON.stringify(p));}

function calcularRitmoSugerido(){
  const sel=document.getElementById('planoLivro');
  if(!sel)return;
  const slug=sel.value,caps=BIBLIA_CAPS[slug]||1;
  let sugerido=1;
  if(caps>80)sugerido=3;
  else if(caps>30)sugerido=2;
  const info=document.getElementById('planoRitmoInfo');
  if(info)info.textContent=`${BIBLIA_NOMES[slug]||slug} tem ${caps} capítulos. Sugestão: ${sugerido} cap/dia → ${Math.ceil(caps/sugerido)} dias para terminar.`;
  const inp=document.getElementById('planoCapsPerDay');
  if(inp)inp.value=sugerido;
}
function preencherSelectLivros(){
  const sel=document.getElementById('planoLivro');
  if(!sel)return;
  sel.innerHTML=Object.entries(BIBLIA_NOMES).map(([slug,nome])=>`<option value="${slug}">${nome}</option>`).join('');
  calcularRitmoSugerido();
}
function salvarPlano(){
  const slug=document.getElementById('planoLivro').value;
  const cpd=parseInt(document.getElementById('planoCapsPerDay').value)||1;
  const p={slug,nome:BIBLIA_NOMES[slug]||slug,totalCaps:BIBLIA_CAPS[slug]||1,capsPerDay:cpd,capAtual:1,startDate:hoje()};
  salvarPlanoLocal(p);fecharModal('modal-plano');renderizarPlanoHome();toast('Plano iniciado! 📖','ok');
}
function abrirModalPlano(){preencherSelectLivros();abrirModal('modal-plano');}
function renderizarPlanoHome(){
  const el=document.getElementById('planContent');if(!el)return;
  const p=getPlano();
  if(!p){el.innerHTML=`<div class="plan-empty">Nenhum plano ativo.<br><button class="btn btn--primary" style="margin-top:12px" onclick="abrirModalPlano()">Iniciar plano</button></div>`;return;}
  const pct=Math.round(((p.capAtual-1)/p.totalCaps)*100);
  const leuHoje=p.lastRead===hoje();
  const proxCaps=[];for(let i=0;i<p.capsPerDay;i++){const c=p.capAtual+i;if(c<=p.totalCaps)proxCaps.push(c);}
  el.innerHTML=`<div class="plan-card">
    <div class="plan-book">📖 ${p.nome}</div>
    <div class="plan-progress-row"><div class="plan-progress-bar"><div class="plan-progress-fill" style="width:${pct}%"></div></div><span class="plan-pct">${pct}%</span></div>
    <div class="plan-today">
      <span class="plan-today-text">${p.capAtual>p.totalCaps?'Livro concluído! 🎉':'Hoje: Cap. '+proxCaps.join(', ')}</span>
      ${p.capAtual<=p.totalCaps?`<button class="plan-today-btn ${leuHoje?'done':''}" onclick="avancarPlano()">${leuHoje?'✓ Lido':'Marcar como lido'}</button>`:''}
    </div>
  </div>`;
}
function avancarPlano(){
  const p=getPlano();if(!p)return;
  if(p.lastRead===hoje()){toast('Já marcado hoje!','ok');return;}
  p.capAtual=Math.min(p.capAtual+p.capsPerDay,p.totalCaps+1);
  p.lastRead=hoje();
  salvarPlanoLocal(p);renderizarPlanoHome();
  marcarLeituraHoje();
  if(p.capAtual>p.totalCaps)toast(`Você concluiu ${p.nome}! 🎉`,'ok');
  else toast(`Leitura avançada para o capítulo ${p.capAtual}! 📖`,'ok');
}

// ── Init ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',async()=>{
  aplicarPreferencias();carregarGrifos();
  document.querySelectorAll('.accent-swatch').forEach(s=>s.addEventListener('click',()=>setAccent(s.dataset.accent)));
  const token=localStorage.getItem(TOKEN_KEY);
  if(token){const auth=await postPublic({acao:'checar_auth'},token).catch(()=>({autenticado:false}));if(auth.autenticado){mostrarApp(auth.usuario);return;}localStorage.removeItem(TOKEN_KEY);}
  document.getElementById('loginScreen').style.display='flex';
  ['loginPass','loginUser'].forEach(id=>document.getElementById(id).addEventListener('keydown',e=>{if(e.key==='Enter')fazerLogin();}));
});

// ── Auth ──────────────────────────────────────────────────────────────────
async function fazerLogin(){
  const usuario=document.getElementById('loginUser').value.trim(),senha=document.getElementById('loginPass').value,errEl=document.getElementById('loginError');
  errEl.textContent='';
  try{const res=await postPublic({acao:'login',usuario,senha});if(res.sucesso){localStorage.setItem(TOKEN_KEY,res.token);mostrarApp(res.usuario);}else errEl.textContent=res.erro||'Erro ao entrar';}catch{errEl.textContent='Erro de conexão';}
}
async function fazerLogout(){
  const token=localStorage.getItem(TOKEN_KEY);if(token)await postPublic({acao:'logout'},token).catch(()=>{});
  localStorage.removeItem(TOKEN_KEY);pararTimerLeitura();
  document.getElementById('appLayout').style.display='none';document.getElementById('bottomNav').style.display='none';document.getElementById('loginScreen').style.display='flex';document.getElementById('loginPass').value='';
}
function mostrarApp(usuario){
  document.getElementById('loginScreen').style.display='none';document.getElementById('appLayout').style.display='flex';document.getElementById('bottomNav').style.display='flex';
  document.getElementById('sidebarUser').textContent='👤 '+usuario;
  const cu=document.getElementById('configUsuario');if(cu)cu.textContent=usuario;
  setupEventos();iniciarNavegacao();renderizarLivros();
  renderizarSaudacao(usuario);renderizarVOD();renderizarPlanta();renderizarPlanoHome();
  if(localStorage.getItem('swipe_hint_seen')){const h=document.getElementById('swipeHint');if(h)h.style.display='none';}
}

// ── Navegação ─────────────────────────────────────────────────────────────
function iniciarNavegacao(){
  const todos=[...document.querySelectorAll('.nav-item'),...document.querySelectorAll('.bottom-nav-item')];
  todos.forEach(btn=>btn.addEventListener('click',()=>{
    const tab=btn.dataset.tab;
    todos.forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll(`[data-tab="${tab}"]`).forEach(b=>b.classList.add('active'));
    document.getElementById('tab-'+tab).classList.add('active');
    if(tab==='biblia')iniciarTimerLeitura();else pararTimerLeitura();
  }));
}
function irParaBiblia(){
  document.querySelectorAll('.nav-item,.bottom-nav-item').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('[data-tab="biblia"]').forEach(b=>b.classList.add('active'));
  document.getElementById('tab-biblia').classList.add('active');
  iniciarTimerLeitura();
}
function irParaEstudos(){irParaBiblia();ativarTab('estudos');carregarEstudos();}
function irParaFavoritos(){irParaBiblia();ativarTab('favoritos');carregarFavoritos();}
function abrirBuscaRapida(){abrirModal('modal-busca-rapida');setTimeout(()=>document.getElementById('buscaRapidaInput')?.focus(),100);}
function ativarTab(tab){
  document.querySelectorAll('.bible-tab').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.bible-panel').forEach(p=>p.classList.remove('active'));
  const btn=document.querySelector(`.bible-tab[data-btab="${tab}"]`);if(btn)btn.classList.add('active');
  const panel=document.getElementById('btab-'+tab);if(panel)panel.classList.add('active');
  // mostrar tabs ao clicar atalhos
  const tabsRow=document.querySelector('.bible-tabs');if(tabsRow)tabsRow.style.display='flex';
}

// ── Setup Eventos ─────────────────────────────────────────────────────────
function setupEventos(){
  document.getElementById('bibliaRef')?.addEventListener('keydown',e=>{if(e.key==='Enter')buscarPorReferencia();});
  document.getElementById('bibliaPalavra')?.addEventListener('keydown',e=>{if(e.key==='Enter')buscarPorPalavra();});
  document.getElementById('buscaRapidaInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')executarBuscaRapida();});
  document.getElementById('bibliaRefQuick')?.addEventListener('keydown',e=>{if(e.key==='Enter')buscarRapido();});
  document.querySelectorAll('.bible-tab').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.bible-tab').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.bible-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');document.getElementById('btab-'+btn.dataset.btab).classList.add('active');
    if(btn.dataset.btab==='favoritos')carregarFavoritos();
    if(btn.dataset.btab==='estudos')carregarEstudos();
  }));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.modal-overlay.open').forEach(o=>fecharModal(o.id));});
}

// ── API ───────────────────────────────────────────────────────────────────
async function postPublic(payload,token=null){const h={'Content-Type':'application/json'};if(token)h['X-Auth-Token']=token;return(await fetch(API,{method:'POST',headers:h,body:JSON.stringify(payload)})).json();}
async function post(payload){const token=localStorage.getItem(TOKEN_KEY);const h={'Content-Type':'application/json'};if(token)h['X-Auth-Token']=token;const res=await fetch(API,{method:'POST',headers:h,body:JSON.stringify(payload)});const data=await res.json();if(data.auth===false){fazerLogout();throw new Error('Não autenticado');}return data;}
async function carregarBibliaJSON(){if(BIBLIA_DATA)return BIBLIA_DATA;BIBLIA_DATA=await(await fetch('/biblia.json')).json();return BIBLIA_DATA;}

// ══ BÍBLIA ════════════════════════════════════════════════════════════════
const BIBLIA={
  at:[{nome:'Gênesis',slug:'genesis',caps:50},{nome:'Êxodo',slug:'exodus',caps:40},{nome:'Levítico',slug:'leviticus',caps:27},{nome:'Números',slug:'numbers',caps:36},{nome:'Deuteronômio',slug:'deuteronomy',caps:34},{nome:'Josué',slug:'joshua',caps:24},{nome:'Juízes',slug:'judges',caps:21},{nome:'Rute',slug:'ruth',caps:4},{nome:'1 Samuel',slug:'1samuel',caps:31},{nome:'2 Samuel',slug:'2samuel',caps:24},{nome:'1 Reis',slug:'1kings',caps:22},{nome:'2 Reis',slug:'2kings',caps:25},{nome:'1 Crônicas',slug:'1chronicles',caps:29},{nome:'2 Crônicas',slug:'2chronicles',caps:36},{nome:'Esdras',slug:'ezra',caps:10},{nome:'Neemias',slug:'nehemiah',caps:13},{nome:'Ester',slug:'esther',caps:10},{nome:'Jó',slug:'job',caps:42},{nome:'Salmos',slug:'psalms',caps:150},{nome:'Provérbios',slug:'proverbs',caps:31},{nome:'Eclesiastes',slug:'ecclesiastes',caps:12},{nome:'Cantares',slug:'song of solomon',caps:8},{nome:'Isaías',slug:'isaiah',caps:66},{nome:'Jeremias',slug:'jeremiah',caps:52},{nome:'Lamentações',slug:'lamentations',caps:5},{nome:'Ezequiel',slug:'ezekiel',caps:48},{nome:'Daniel',slug:'daniel',caps:12},{nome:'Oséias',slug:'hosea',caps:14},{nome:'Joel',slug:'joel',caps:3},{nome:'Amós',slug:'amos',caps:9},{nome:'Obadias',slug:'obadiah',caps:1},{nome:'Jonas',slug:'jonah',caps:4},{nome:'Miquéias',slug:'micah',caps:7},{nome:'Naum',slug:'nahum',caps:3},{nome:'Habacuque',slug:'habakkuk',caps:3},{nome:'Sofonias',slug:'zephaniah',caps:3},{nome:'Ageu',slug:'haggai',caps:2},{nome:'Zacarias',slug:'zechariah',caps:14},{nome:'Malaquias',slug:'malachi',caps:4}],
  nt:[{nome:'Mateus',slug:'matthew',caps:28},{nome:'Marcos',slug:'mark',caps:16},{nome:'Lucas',slug:'luke',caps:24},{nome:'João',slug:'john',caps:21},{nome:'Atos',slug:'acts',caps:28},{nome:'Romanos',slug:'romans',caps:16},{nome:'1 Coríntios',slug:'1corinthians',caps:16},{nome:'2 Coríntios',slug:'2corinthians',caps:13},{nome:'Gálatas',slug:'galatians',caps:6},{nome:'Efésios',slug:'ephesians',caps:6},{nome:'Filipenses',slug:'philippians',caps:4},{nome:'Colossenses',slug:'colossians',caps:4},{nome:'1 Tessalonicenses',slug:'1thessalonians',caps:5},{nome:'2 Tessalonicenses',slug:'2thessalonians',caps:3},{nome:'1 Timóteo',slug:'1timothy',caps:6},{nome:'2 Timóteo',slug:'2timothy',caps:4},{nome:'Tito',slug:'titus',caps:3},{nome:'Filemom',slug:'philemon',caps:1},{nome:'Hebreus',slug:'hebrews',caps:13},{nome:'Tiago',slug:'james',caps:5},{nome:'1 Pedro',slug:'1peter',caps:5},{nome:'2 Pedro',slug:'2peter',caps:3},{nome:'1 João',slug:'1john',caps:5},{nome:'2 João',slug:'2john',caps:1},{nome:'3 João',slug:'3john',caps:1},{nome:'Judas',slug:'jude',caps:1},{nome:'Apocalipse',slug:'revelation',caps:22}]
};
function renderizarLivros(){const r=(lista,id)=>{document.getElementById(id).innerHTML=lista.map(l=>`<button class="book-btn" onclick="abrirLivro('${l.slug}','${esc(l.nome)}',${l.caps})"><span>${esc(l.nome)}</span><span class="book-abbr">${l.caps} cap${l.caps>1?'s':''}</span></button>`).join('');};r(BIBLIA.at,'booksAT');r(BIBLIA.nt,'booksNT');}

async function abrirLivro(slug,nome,totalCaps){
  livroAtual={slug,nome,totalCaps};totalCapsAtual=totalCaps;
  document.getElementById('livroAtualTitulo').textContent=nome;
  document.getElementById('nivel-livros').style.display='none';document.getElementById('nivel-capitulos').style.display='block';document.getElementById('nivel-versiculos').style.display='none';
  try{const res=await post({acao:'listar_anotacoes_livro',livro:slug});anotacoesLivro=res;}catch{anotacoesLivro={versiculos:[],capitulos:[]};}
  try{const res=await post({acao:'buscar_anotacao_capitulo',livro:slug,capitulo:0});document.getElementById('capNotaTexto').value=res.texto||'';}catch{document.getElementById('capNotaTexto').value='';}
  const grid=document.getElementById('chaptersGrid');grid.innerHTML='';
  for(let c=1;c<=totalCaps;c++){const btn=document.createElement('button');btn.className='chap-btn';btn.textContent=c;if(anotacoesLivro.capitulos.includes(String(c))||anotacoesLivro.capitulos.includes(c))btn.classList.add('has-nota');else if(anotacoesLivro.versiculos.some(v=>v.capitulo==c))btn.classList.add('has-verso-nota');btn.addEventListener('click',()=>abrirCapitulo(c));grid.appendChild(btn);}
}
function voltarLivros(){document.getElementById('nivel-livros').style.display='block';document.getElementById('nivel-capitulos').style.display='none';}
async function abrirCapitulo(cap){
  capAtual=cap;
  document.getElementById('capAtualTitulo').textContent=`${livroAtual.nome} ${cap}`;
  document.getElementById('nivel-capitulos').style.display='none';document.getElementById('nivel-versiculos').style.display='block';
  const prev=document.getElementById('btnCapPrev'),next=document.getElementById('btnCapNext');
  if(prev)prev.disabled=cap<=1;if(next)next.disabled=cap>=totalCapsAtual;
  try{const res=await post({acao:'buscar_anotacao_capitulo',livro:livroAtual.slug,capitulo:cap});document.getElementById('verseCapNotaTexto').value=res.texto||'';}catch{document.getElementById('verseCapNotaTexto').value='';}
  const lista=document.getElementById('versiculosList');lista.innerHTML='<div class="bible-loading">Carregando…</div>';
  try{
    const biblia=await carregarBibliaJSON(),ld=biblia[livroAtual.slug];
    if(!ld||!ld.caps[cap-1]){lista.innerHTML='<div class="bible-error">Capítulo não encontrado.</div>';return;}
    _versesCache=ld.caps[cap-1].map((texto,i)=>({verse:i+1,text:texto}));
    renderizarVersiculos(_versesCache);
    lista.scrollTo({top:0});document.getElementById('nivel-versiculos').scrollIntoView({behavior:'smooth',block:'start'});
  }catch{lista.innerHTML='<div class="bible-error">Erro ao carregar.</div>';}
}
function voltarCapitulos(){document.getElementById('nivel-versiculos').style.display='none';document.getElementById('nivel-capitulos').style.display='block';}
function irCapAnterior(){if(capAtual>1)abrirCapitulo(capAtual-1);}
function irCapProximo(){if(capAtual<totalCapsAtual)abrirCapitulo(capAtual+1);}

// ── Swipe versículos ──────────────────────────────────────────────────────
function renderizarVersiculos(verses){
  const lista=document.getElementById('versiculosList');
  lista.innerHTML=verses.map(v=>{
    const temNota=anotacoesLivro.versiculos.some(a=>a.capitulo==capAtual&&a.versiculo==v.verse);
    const cor=grifos[chaveGrifo(livroAtual.slug,capAtual,v.verse)]||'';
    const badges=[];
    if(temNota)badges.push(`<span class="verse-nota-badge">📝 Anotado</span>`);
    if(cor)badges.push(`<span class="verse-grifo-badge" style="background:${GRIFO_HEX[cor]}22;color:${GRIFO_HEX[cor]}">● ${cor}</span>`);
    return`<div class="verse-row" data-verse="${v.verse}"><div class="verse-row-actions"><button class="verse-row-action-btn vra-nota" onclick="swipeAcao(${v.verse},'anotar')"><span class="vra-icon">📝</span>Anotar</button><button class="verse-row-action-btn vra-fav" onclick="swipeAcao(${v.verse},'favoritar')"><span class="vra-icon">⭐</span>Favoritar</button><button class="verse-row-action-btn vra-mais" onclick="swipeAcao(${v.verse},'mais')"><span class="vra-icon">•••</span>Mais</button></div><div class="verse-item ${temNota?'has-nota':''} ${cor?'grifo-'+cor:''}" id="verse-${v.verse}" data-verse="${v.verse}"><span class="verse-num">${v.verse}</span><div class="verse-body"><div class="verse-text">${esc(v.text.trim())}</div>${badges.length?`<div class="verse-badges">${badges.join('')}</div>`:''}</div></div></div>`;
  }).join('');
  lista.querySelectorAll('.verse-item').forEach(initSwipe);
  anotacoesLivro.versiculos.filter(a=>a.capitulo==capAtual).forEach(async a=>{try{const res=await post({acao:'buscar_anotacao_versiculo',livro:livroAtual.slug,capitulo:capAtual,versiculo:a.versiculo});const badge=document.querySelector(`#verse-${a.versiculo} .verse-nota-badge`);if(badge&&res.texto)badge.textContent='📝 '+res.texto.substring(0,50)+(res.texto.length>50?'…':'');}catch{}});
  const hint=document.getElementById('swipeHint');if(hint&&!localStorage.getItem('swipe_hint_seen')){setTimeout(()=>{hint.style.opacity='0';hint.style.transition='opacity .5s';setTimeout(()=>hint.style.display='none',500);},4000);}
}
let activeSwipeItem=null;
function initSwipe(el){
  let startX=0,startY=0,curX=0,isSwipe=false;
  const row=el.closest('.verse-row'),act=row.querySelector('.verse-row-actions');
  el.addEventListener('touchstart',e=>{if(activeSwipeItem&&activeSwipeItem!==el)resetSwipe(activeSwipeItem);startX=e.touches[0].clientX;startY=e.touches[0].clientY;curX=0;isSwipe=false;el.classList.add('swiping');},{passive:true});
  el.addEventListener('touchmove',e=>{const dx=e.touches[0].clientX-startX,dy=e.touches[0].clientY-startY;if(!isSwipe&&Math.abs(dx)<Math.abs(dy)*.8){el.classList.remove('swiping');return;}isSwipe=true;curX=Math.min(0,dx);const show=Math.min(Math.abs(curX),200);el.style.transform=`translateX(${curX}px)`;act.style.width=show+'px';act.style.pointerEvents=show>60?'auto':'none';if(show>10)e.preventDefault();},{passive:false});
  el.addEventListener('touchend',()=>{el.classList.remove('swiping');const dist=Math.abs(curX);if(!isSwipe||dist<10){resetSwipe(el);return;}if(dist>=140){resetSwipe(el);const verse=parseInt(el.dataset.verse);const v=_versesCache.find(x=>x.verse===verse);if(v)abrirParaAcao(verse,v.text.trim(),'anotar');esconderDica();}else if(dist>=60){el.style.transition='transform .2s ease';const bW=act.scrollWidth;el.style.transform=`translateX(-${bW}px)`;act.style.width=bW+'px';act.style.pointerEvents='auto';activeSwipeItem=el;esconderDica();}else resetSwipe(el);},{passive:true});
}
function resetSwipe(el){el.style.transition='transform .2s ease';el.style.transform='translateX(0)';const row=el.closest('.verse-row');if(row){const a=row.querySelector('.verse-row-actions');if(a){a.style.width='0';a.style.pointerEvents='none';}}if(activeSwipeItem===el)activeSwipeItem=null;}
function swipeAcao(verse,tipo){const el=document.getElementById(`verse-${verse}`);if(el)resetSwipe(el);const v=_versesCache.find(x=>x.verse===verse);if(v)abrirParaAcao(verse,v.text.trim(),tipo);}
function abrirParaAcao(verse,texto,tipoImediato){versoAtual={verse,texto};if(tipoImediato&&tipoImediato!=='mais'){acaoVerso(tipoImediato);}else{const ref=`${livroAtual.nome} ${capAtual}:${verse}`;document.getElementById('versoAcaoRef').textContent=ref;document.getElementById('versoAcaoTexto').textContent=texto;const corAtual=grifos[chaveGrifo(livroAtual.slug,capAtual,verse)]||'';document.querySelectorAll('.grifo-swatch').forEach(s=>s.classList.toggle('active',s.dataset.cor===corAtual));abrirModal('modal-verso-acao');}}
function esconderDica(){if(!localStorage.getItem('swipe_hint_seen')){localStorage.setItem('swipe_hint_seen','1');const h=document.getElementById('swipeHint');if(h)h.style.display='none';}}

// ── Ações versículo ───────────────────────────────────────────────────────
function acaoVerso(tipo){
  if(!versoAtual)return;
  const ref=`${livroAtual.nome} ${capAtual}:${versoAtual.verse}`,texto=versoAtual.texto;
  if(tipo==='anotar'){fecharModal('modal-verso-acao');document.getElementById('anotacaoVersoPreview').textContent=`${ref} — "${texto.substring(0,100)}${texto.length>100?'…':''}"`;post({acao:'buscar_anotacao_versiculo',livro:livroAtual.slug,capitulo:capAtual,versiculo:versoAtual.verse}).then(r=>{document.getElementById('anotacaoVersoTexto').value=r.texto||'';}).catch(()=>{document.getElementById('anotacaoVersoTexto').value='';});anotacaoVersoTemp=versoAtual;abrirModal('modal-anotacao-verso');}
  else if(tipo==='favoritar'){fecharModal('modal-verso-acao');favoritoTemp={ref,livro:livroAtual.slug,cap:capAtual,vers:versoAtual.verse,texto};document.getElementById('favoritoPreview').textContent=`${ref} — "${texto.substring(0,100)}"`;document.getElementById('favoritoAnotacao').value='';abrirModal('modal-favorito');}
  else if(tipo==='copiar'){fecharModal('modal-verso-acao');const c=`"${texto}" — ${ref} (NVI)`;if(navigator.clipboard)navigator.clipboard.writeText(c).then(()=>toast('Copiado! 📋','ok')).catch(()=>copiarFallback(c));else copiarFallback(c);}
  else if(tipo==='compartilhar'){fecharModal('modal-verso-acao');const c=`"${texto}" — ${ref} (NVI)`;if(navigator.share)navigator.share({title:ref,text:c}).catch(()=>{});else if(navigator.clipboard)navigator.clipboard.writeText(c).then(()=>toast('Texto copiado 🔗','ok'));}
}
function copiarFallback(txt){const ta=document.createElement('textarea');ta.value=txt;ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.focus();ta.select();try{document.execCommand('copy');toast('Copiado! 📋','ok');}catch{}document.body.removeChild(ta);}
function aplicarGrifo(cor){
  if(!versoAtual)return;
  const chave=chaveGrifo(livroAtual.slug,capAtual,versoAtual.verse);
  if(cor==='remover')delete grifos[chave];else grifos[chave]=cor;
  salvarGrifos();fecharModal('modal-verso-acao');
  const item=document.getElementById(`verse-${versoAtual.verse}`);
  if(item){['amarelo','verde','rosa','azul','laranja'].forEach(c=>item.classList.remove('grifo-'+c));if(cor&&cor!=='remover')item.classList.add('grifo-'+cor);let badge=item.querySelector('.verse-grifo-badge');if(cor&&cor!=='remover'){if(!badge){badge=document.createElement('span');badge.className='verse-grifo-badge';let bd=item.querySelector('.verse-badges');if(!bd){bd=document.createElement('div');bd.className='verse-badges';item.querySelector('.verse-body').appendChild(bd);}bd.appendChild(badge);}badge.style.background=GRIFO_HEX[cor]+'22';badge.style.color=GRIFO_HEX[cor];badge.textContent=`● ${cor}`;}else if(badge)badge.remove();const num=item.querySelector('.verse-num');if(num)num.style.color=cor&&cor!=='remover'?GRIFO_HEX[cor]:'';}
  toast(cor==='remover'?'Grifo removido':'Grifo aplicado ✨','ok');
}

// ── Busca ─────────────────────────────────────────────────────────────────
const NOMES_SLUG={},SLUGS_NOMES={};
async function iniciarMapaNomes(){const biblia=await carregarBibliaJSON();Object.entries(biblia).forEach(([slug,livro])=>{SLUGS_NOMES[slug]=livro.nome;NOMES_SLUG[livro.nome.toLowerCase()]=slug;const abrev=livro.abbr?.toLowerCase();if(abrev)NOMES_SLUG[abrev]=slug;});}
function parsearRefLocal(ref){const m=ref.trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i);if(!m)return null;const[,livroStr,cap,vers,versEnd]=m;const slug=NOMES_SLUG[livroStr.trim().toLowerCase()];if(!slug)return null;return{slug,cap:parseInt(cap),vers:vers?parseInt(vers):null,versEnd:versEnd?parseInt(versEnd):null};}
async function _buscarRef(ref,elId){
  const el=document.getElementById(elId);if(!el)return;
  el.innerHTML='<div class="bible-loading">Buscando…</div>';
  await iniciarMapaNomes();const parsed=parsearRefLocal(ref);
  if(!parsed){el.innerHTML='<div class="bible-error">Não reconhecido. Ex: João 3:16</div>';return;}
  try{const biblia=await carregarBibliaJSON(),ld=biblia[parsed.slug];if(!ld){el.innerHTML='<div class="bible-error">Livro não encontrado.</div>';return;}const cap=ld.caps[parsed.cap-1];if(!cap){el.innerHTML='<div class="bible-error">Capítulo não encontrado.</div>';return;}let verses;if(parsed.vers){const fim=parsed.versEnd||parsed.vers;verses=cap.slice(parsed.vers-1,fim).map((t,i)=>({verse:parsed.vers+i,text:t,slug:parsed.slug,cap:parsed.cap,nome:ld.nome}));}else verses=cap.map((t,i)=>({verse:i+1,text:t,slug:parsed.slug,cap:parsed.cap,nome:ld.nome}));renderizarResultadoBiblia(verses,`${ld.nome} ${parsed.cap}${parsed.vers?':'+parsed.vers:''}${parsed.versEnd?'-'+parsed.versEnd:''}`,elId);}catch{el.innerHTML='<div class="bible-error">Erro ao buscar.</div>';}
}
async function _buscarPalavra(palavra,elId){
  const el=document.getElementById(elId);if(!el||!palavra)return;
  el.innerHTML='<div class="bible-loading">Buscando…</div>';
  try{const biblia=await carregarBibliaJSON(),resultados=[];for(const[slug,livro]of Object.entries(biblia)){for(let ci=0;ci<livro.caps.length;ci++){for(let vi=0;vi<livro.caps[ci].length;vi++){if(livro.caps[ci][vi].toLowerCase().includes(palavra)){resultados.push({verse:vi+1,text:livro.caps[ci][vi],slug,cap:ci+1,nome:livro.nome});if(resultados.length>=30)break;}}if(resultados.length>=30)break;}if(resultados.length>=30)break;}if(!resultados.length){el.innerHTML='<div class="bible-error">Nenhum resultado.</div>';return;}renderizarResultadoBiblia(resultados,`"${palavra}" — ${resultados.length} resultado${resultados.length>1?'s':''}`,elId);}catch{el.innerHTML='<div class="bible-error">Erro ao buscar.</div>';}
}
async function buscarPorReferencia(){const ref=document.getElementById('bibliaRef').value.trim();if(ref)await _buscarRef(ref,'bibliaResultado');}
async function buscarPorPalavra(){const p=document.getElementById('bibliaPalavra').value.trim().toLowerCase();if(p)await _buscarPalavra(p,'bibliaResultado');}
async function buscarRapido(){
  const inp=document.getElementById('bibliaRefQuick');if(!inp||!inp.value.trim())return;
  const ref=inp.value.trim();await iniciarMapaNomes();
  const parsed=parsearRefLocal(ref);
  if(parsed)await _buscarRef(ref,'bibliaResultadoQuick');
  else await _buscarPalavra(ref.toLowerCase(),'bibliaResultadoQuick');
}
async function executarBuscaRapida(){
  const inp=document.getElementById('buscaRapidaInput');if(!inp||!inp.value.trim())return;
  const ref=inp.value.trim();await iniciarMapaNomes();
  const parsed=parsearRefLocal(ref);
  if(parsed)await _buscarRef(ref,'buscaRapidaResultado');
  else await _buscarPalavra(ref.toLowerCase(),'buscaRapidaResultado');
}
function renderizarResultadoBiblia(verses,refLabel,elId='bibliaResultado'){
  const el=document.getElementById(elId);if(!el||!verses.length){if(el)el.innerHTML='<div class="bible-error">Sem resultados.</div>';return;}
  el.innerHTML=`<div class="bible-result"><div class="bible-result-ref">📖 ${esc(refLabel)}</div>${verses.map(v=>`<div class="bible-verse" onclick="abrirModalVersoBusca(${v.verse},${JSON.stringify(v.text)},'${esc(v.nome||'')}',${v.cap},'${v.slug||''}')"><span class="bible-verse-num">${v.nome?`<span style="font-size:9px;display:block;color:var(--accent)">${esc(v.nome)} ${v.cap}</span>`:''}${v.verse}</span><span class="bible-verse-text">${esc(v.text)}</span></div>`).join('')}</div>`;
}
function abrirModalVersoBusca(verse,texto,nomeL,cap,slug){
  if(!livroAtual||livroAtual.slug!==slug)livroAtual={slug,nome:nomeL,totalCaps:0};
  capAtual=cap;versoAtual={verse,texto};
  const ref=`${nomeL} ${cap}:${verse}`;
  document.getElementById('versoAcaoRef').textContent=ref;document.getElementById('versoAcaoTexto').textContent=texto;
  document.querySelectorAll('.grifo-swatch').forEach(s=>s.classList.remove('active'));
  abrirModal('modal-verso-acao');
}

// Notas
function toggleNotaCapitulo(){const f=document.getElementById('capNotaForm'),i=document.getElementById('capNotaToggleIcon'),o=f.style.display==='block';f.style.display=o?'none':'block';i.textContent=o?'▼':'▲';}
function toggleNotaCapituloVerses(){const f=document.getElementById('verseCapNotaForm'),i=document.getElementById('verseCapNotaIcon'),o=f.style.display==='block';f.style.display=o?'none':'block';i.textContent=o?'▼':'▲';}
async function salvarNotaCapituloAtual(){try{await post({acao:'salvar_anotacao_capitulo',livro:livroAtual.slug,capitulo:0,texto:document.getElementById('capNotaTexto').value});toast('Nota salva!','ok');}catch{toast('Erro.','err');}}
async function salvarNotaCapituloVerses(){try{await post({acao:'salvar_anotacao_capitulo',livro:livroAtual.slug,capitulo:capAtual,texto:document.getElementById('verseCapNotaTexto').value});toast('Nota salva!','ok');}catch{toast('Erro.','err');}}
async function salvarAnotacaoVerso(){if(!anotacaoVersoTemp)return;const texto=document.getElementById('anotacaoVersoTexto').value;try{await post({acao:'salvar_anotacao_versiculo',livro:livroAtual.slug,capitulo:capAtual,versiculo:anotacaoVersoTemp.verse,texto});fecharModal('modal-anotacao-verso');toast('Anotação salva!','ok');const res=await post({acao:'listar_anotacoes_livro',livro:livroAtual.slug});anotacoesLivro=res;abrirCapitulo(capAtual);}catch{toast('Erro.','err');}}
async function confirmarFavorito(){if(!favoritoTemp)return;try{await post({acao:'salvar_favorito',data:{referencia:favoritoTemp.ref,livro:favoritoTemp.livro,capitulo:favoritoTemp.cap,versiculo:favoritoTemp.vers,texto:favoritoTemp.texto,anotacao:document.getElementById('favoritoAnotacao').value,categoria:document.getElementById('favoritoCategoria').value}});fecharModal('modal-favorito');favoritoTemp=null;toast('Favorito salvo! ⭐','ok');}catch(e){toast(e.message||'Erro.','err');}}
async function carregarFavoritos(){const cat=document.getElementById('favCategoria').value||'todas';try{const res=await post({acao:'listar_favoritos',categoria:cat});const sel=document.getElementById('favCategoria'),val=sel.value;sel.innerHTML='<option value="todas">Todas as categorias</option>';(res.categorias||[]).forEach(c=>{const opt=document.createElement('option');opt.value=c;opt.textContent=c.charAt(0).toUpperCase()+c.slice(1);sel.appendChild(opt);});sel.value=val;const el=document.getElementById('listaFavoritos'),lista=res.favoritos||[];if(!lista.length){el.innerHTML='<div class="empty-state">Nenhum favorito ainda.</div>';return;}el.innerHTML=lista.map(f=>`<div class="fav-card"><div class="fav-ref">📖 ${esc(f.referencia)}</div><div class="fav-text">${esc(f.texto)}</div>${f.anotacao?`<div class="fav-anotacao">📝 ${esc(f.anotacao)}</div>`:''}<div class="fav-footer"><span class="fav-cat">${esc(f.categoria)}</span><button class="fav-del" onclick="excluirFavorito(${f.id})">🗑️</button></div></div>`).join('');}catch{toast('Erro ao carregar favoritos.','err');}}
async function excluirFavorito(id){if(!confirm('Remover favorito?'))return;try{await post({acao:'excluir_favorito',id});toast('Removido.','ok');carregarFavoritos();}catch{toast('Erro.','err');}}
async function carregarEstudos(){try{const res=await post({acao:'listar_estudos'});renderizarEstudos(res.estudos||[]);}catch{toast('Erro.','err');}}
function renderizarEstudos(lista){const el=document.getElementById('listaEstudos');if(!lista.length){el.innerHTML='<div class="empty-state">Nenhum estudo ainda.</div>';return;}const catL={geral:'Geral',pregacao:'Pregação',estudo:'Estudo Bíblico',devocional:'Devocional',celula:'Célula'};el.innerHTML=lista.map(e=>`<div class="estudo-card"><div class="estudo-titulo">${esc(e.titulo)}</div>${e.versiculo_base?`<div class="estudo-versiculo">📖 ${esc(e.versiculo_base)}</div>`:''} ${e.conteudo?`<div class="estudo-preview">${esc(e.conteudo)}</div>`:''}<div class="estudo-footer"><span class="estudo-cat">${catL[e.categoria]||e.categoria}</span><div class="estudo-acoes"><span class="estudo-data">${fmt(e.atualizado_em?.split('T')[0])}</span><button class="bible-verse-btn" onclick="editarEstudo(${e.id})">✏️</button><button class="bible-verse-btn" style="color:var(--danger)" onclick="excluirEstudo(${e.id},'${esc(e.titulo)}')">🗑️</button></div></div></div>`).join('');}
async function salvarEstudo(){const titulo=document.getElementById('est-titulo').value.trim();if(!titulo){toast('Título obrigatório.','err');return;}const data={titulo,conteudo:document.getElementById('est-conteudo').value,versiculo_base:document.getElementById('est-versiculo').value,texto_base:document.getElementById('est-texto-base').value,categoria:document.getElementById('est-categoria').value};try{if(estudoEditandoId)await post({acao:'atualizar_estudo',id:estudoEditandoId,data});else await post({acao:'salvar_estudo',data});fecharModal('modal-estudo');limpar(['est-titulo','est-versiculo','est-texto-base','est-conteudo']);estudoEditandoId=null;document.getElementById('modalEstudoTitulo').textContent='Novo Estudo';toast('Estudo salvo!','ok');carregarEstudos();}catch{toast('Erro.','err');}}
function editarEstudo(id){post({acao:'listar_estudos'}).then(res=>{const e=(res.estudos||[]).find(x=>x.id===id);if(!e)return;estudoEditandoId=id;document.getElementById('modalEstudoTitulo').textContent='Editar Estudo';document.getElementById('est-titulo').value=e.titulo||'';document.getElementById('est-versiculo').value=e.versiculo_base||'';document.getElementById('est-texto-base').value=e.texto_base||'';document.getElementById('est-categoria').value=e.categoria||'geral';document.getElementById('est-conteudo').value=e.conteudo||'';abrirModal('modal-estudo');});}
async function excluirEstudo(id,titulo){if(!confirm(`Excluir "${titulo}"?`))return;try{await post({acao:'excluir_estudo',id});toast('Removido.','ok');carregarEstudos();}catch{toast('Erro.','err');}}

// ── Modais ────────────────────────────────────────────────────────────────
function abrirModal(id){document.getElementById(id).classList.add('open');}
function fecharModal(id){document.getElementById(id).classList.remove('open');}
document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)fecharModal(o.id);}));

// ── Utils ─────────────────────────────────────────────────────────────────
function esc(str){return String(str??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function fmt(d){if(!d)return'';const[y,m,dd]=String(d).split('-');return dd&&m&&y?`${dd}/${m}/${y}`:d;}
function limpar(ids){ids.forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});}
let toastTimer;
function toast(msg,tipo='ok'){const el=document.getElementById('toast');el.textContent=msg;el.className=`toast ${tipo} show`;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3500);}
