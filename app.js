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
const READING_TARGET=120;
let contextoCache={};

if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});

// ── Prefs ──────────────────────────────────────────────────────────────────
function setTheme(t){document.documentElement.setAttribute('data-theme',t);localStorage.setItem('central_theme',t);document.querySelectorAll('.theme-btn').forEach(b=>b.classList.toggle('active',b.id==='btn-'+t));}
function setAccent(a){document.documentElement.setAttribute('data-accent',a);localStorage.setItem('central_accent',a);document.querySelectorAll('.accent-swatch').forEach(s=>{const ok=s.dataset.accent===a;s.classList.toggle('active',ok);s.textContent=ok?'✓':''});}
function ajustarFonte(v){document.documentElement.style.setProperty('--verse-size',v+'px');localStorage.setItem('central_font_size',v);}
function setFontFamily(f){const s=f==='serif';document.documentElement.style.setProperty('--verse-font',s?'\'Lora\',serif':'\'Inter\',sans-serif');localStorage.setItem('central_font_family',f);document.getElementById('btnSerif').classList.toggle('active',s);document.getElementById('btnSans').classList.toggle('active',!s);}
function setReadingBg(b){const m={dark:{bg:'#07090f',text:'#dde3f5'},black:{bg:'#000',text:'#e0e0e0'},sepia:{bg:'#f5efe0',text:'#3b2e1a'},white:{bg:'#fff',text:'#1a1a1a'}};const c=m[b]||m.dark;document.documentElement.style.setProperty('--read-bg',c.bg);document.documentElement.style.setProperty('--read-text',c.text);localStorage.setItem('central_read_bg',b);['bgDark','bgBlack','bgSepia','bgWhite'].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.toggle('active',id==='bg'+b.charAt(0).toUpperCase()+b.slice(1));});}
function aplicarPreferencias(){
  setTheme(localStorage.getItem('central_theme')||'dark');
  setAccent(localStorage.getItem('central_accent')||'indigo');
  const fs=localStorage.getItem('central_font_size')||'16';
  document.documentElement.style.setProperty('--verse-size',fs+'px');
  const sl=document.getElementById('fontSizeSlider');if(sl)sl.value=fs;
  setFontFamily(localStorage.getItem('central_font_family')||'serif');
  setReadingBg(localStorage.getItem('central_read_bg')||'dark');
  atualizarBotaoNotif();
}
function carregarGrifos(){try{grifos=JSON.parse(localStorage.getItem('central_grifos')||'{}');}catch{grifos={};}}
function salvarGrifos(){localStorage.setItem('central_grifos',JSON.stringify(grifos));}
function chaveGrifo(slug,cap,verse){return`${slug}-${cap}-${verse}`;}

// ── Notificações ─────────────────────────────────────────────────────────
function atualizarBotaoNotif(){
  const btn=document.getElementById('toggleNotif');if(!btn)return;
  const on=localStorage.getItem('central_notif')==='on';
  btn.textContent=on?'Ativado ✓':'Ativar';
  btn.classList.toggle('on',on);
}
async function toggleNotificacoes(){
  if(!('Notification'in window)){toast('Notificações não suportadas neste browser.','err');return;}
  const on=localStorage.getItem('central_notif')==='on';
  if(on){localStorage.setItem('central_notif','off');atualizarBotaoNotif();toast('Lembrete desativado','ok');return;}
  const perm=await Notification.requestPermission();
  if(perm==='granted'){localStorage.setItem('central_notif','on');atualizarBotaoNotif();toast('Lembrete ativado! Você será avisado às 20h 🔔','ok');agendarLembrete();}
  else{toast('Permissão negada. Ative nas configurações do browser.','err');}
}
function agendarLembrete(){
  // Verifica a cada minuto se é hora de lembrar (20h e não leu hoje)
  setInterval(()=>{
    const on=localStorage.getItem('central_notif')==='on';
    if(!on)return;
    const s=getStreak();
    if(s.lastDate===hoje())return;
    const h=new Date().getHours(),m=new Date().getMinutes();
    if(h===20&&m===0){new Notification('Central de Controle 🌱',{body:'Você ainda não leu a Bíblia hoje. Mantenha sua sequência!',icon:'/icon-192.png'});}
  },60000);
}

// ── Streak & Semente ──────────────────────────────────────────────────────
function getStreak(){try{return JSON.parse(localStorage.getItem('central_streak')||'{"days":0,"lastDate":"","maxDays":0}');}catch{return{days:0,lastDate:'',maxDays:0};}}
function salvarStreak(s){localStorage.setItem('central_streak',JSON.stringify(s));}
function hoje(){return new Date().toISOString().split('T')[0];}
function ontem(){const d=new Date();d.setDate(d.getDate()-1);return d.toISOString().split('T')[0];}

function marcarLeituraHoje(){
  const s=getStreak(),h=hoje();
  if(s.lastDate===h){toast('Você já registrou a leitura de hoje! 🌱','ok');return;}
  if(s.lastDate===ontem())s.days+=1;
  else if(s.lastDate!==h)s.days=1;
  s.lastDate=h;
  if(!s.maxDays||s.days>s.maxDays)s.maxDays=s.days;
  salvarStreak(s);
  animarPlanta();
  verificarConquistas(s.days);
  renderizarHome();
  const msg=s.days===1?'Sequência iniciada! 🌱':`${s.days} dias seguidos! ${s.days>=7?'🌿':''} `;
  toast(msg,'ok');
  // Celebração em marcos
  if([7,21,60,120].includes(s.days)){
    const e=getEstagio(s.days);
    mostrarCelebracao(`${e.emoji} ${e.nome}!`,`Você chegou ao estágio ${e.nome} com ${s.days} dias!`);
  }
}
function iniciarTimerLeitura(){
  if(readingTimer)return;
  const s=getStreak();if(s.lastDate===hoje())return;
  readingSeconds=0;
  readingTimer=setInterval(()=>{readingSeconds++;if(readingSeconds>=READING_TARGET){clearInterval(readingTimer);readingTimer=null;marcarLeituraHoje();}},1000);
}
function pararTimerLeitura(){if(readingTimer){clearInterval(readingTimer);readingTimer=null;}}

function mostrarCelebracao(titulo,sub){
  const w=document.getElementById('confeteWrap'),m=document.getElementById('confeteMsg');
  if(!w||!m)return;
  const e=titulo.split(' ')[0];
  m.innerHTML=`<div class="confete-emoji">${e}</div><div class="confete-title">${titulo}</div><div class="confete-sub">${sub}</div><div style="margin-top:16px;font-size:12px;color:var(--text-3)">Toque para fechar</div>`;
  w.style.display='flex';
}

// ── Estágios ──────────────────────────────────────────────────────────────
function getEstagio(days){
  if(days>=120)return{nome:'Árvore com Frutos',emoji:'🌳',idx:4,next:null,prox:120};
  if(days>=60) return{nome:'Árvore',emoji:'🌲',idx:3,next:120,prox:60};
  if(days>=21) return{nome:'Planta',emoji:'🌿',idx:2,next:60,prox:21};
  if(days>=7)  return{nome:'Broto',emoji:'🌱',idx:1,next:21,prox:7};
  return{nome:'Semente',emoji:'🌾',idx:0,next:7,prox:0};
}

function animarPlanta(){
  const el=document.getElementById('plantEmoji');
  if(!el)return;
  el.classList.remove('grow');
  requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('grow')));
  setTimeout(()=>el.classList.remove('grow'),700);
}

// ── Conquistas ────────────────────────────────────────────────────────────
const CONQUISTAS=[
  {id:'primeiro_dia',nome:'Primeiro dia',emoji:'🌾',desc:'Leu pela primeira vez',req:s=>s.days>=1},
  {id:'broto',nome:'Broto',emoji:'🌱',desc:'7 dias seguidos',req:s=>s.days>=7},
  {id:'planta',nome:'Planta',emoji:'🌿',desc:'21 dias seguidos',req:s=>s.days>=21},
  {id:'arvore',nome:'Árvore',emoji:'🌲',desc:'60 dias seguidos',req:s=>s.days>=60},
  {id:'frutos',nome:'Frutos',emoji:'🌳',desc:'120 dias seguidos',req:s=>s.days>=120},
  {id:'estudioso',nome:'Estudioso',emoji:'📝',desc:'Primeiro estudo criado',req:()=>!!localStorage.getItem('central_tem_estudo')},
  {id:'favorito',nome:'Favorito',emoji:'⭐',desc:'Primeiro versículo favorito',req:()=>!!localStorage.getItem('central_tem_favorito')},
];
function verificarConquistas(days){
  const s=getStreak();
  CONQUISTAS.forEach(c=>{const earned=c.req(s);if(earned&&!localStorage.getItem('conquista_'+c.id)){localStorage.setItem('conquista_'+c.id,'1');}});
}
function renderizarConquistas(){
  const el=document.getElementById('conquistasGrid');if(!el)return;
  const s=getStreak();
  el.innerHTML=CONQUISTAS.map(c=>{
    const earned=c.req(s)||!!localStorage.getItem('conquista_'+c.id);
    return`<div class="conquista-item ${earned?'earned':'locked'}" title="${c.desc}">
      <div class="conquista-emoji">${c.emoji}</div>
      <div class="conquista-nome">${c.nome}</div>
    </div>`;
  }).join('');
}

// (Versículo do dia foi substituído pelo módulo devocional.js / Palavra do Dia)

// ── Render Home Layout C ──────────────────────────────────────────────────
function renderizarHome(usuario){
  // Data
  const d=new Date();
  const semanas=['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
  const meses=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const el_d=document.getElementById('homeDate');
  if(el_d)el_d.textContent=`${semanas[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]}`;
  // Saudação
  const h=d.getHours();
  const saud=h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
  const nome=usuario||(localStorage.getItem('central_usuario')||'');
  const el_g=document.getElementById('homeGreeting');
  if(el_g)el_g.textContent=`${saud}${nome?', '+nome.split(' ')[0]:''} 👋`;
  // Streak pill
  const s=getStreak();
  const leuHoje=s.lastDate===hoje();
  const pill=document.getElementById('streakPill');
  if(pill){
    pill.textContent=s.days>0?`🔥 ${s.days} ${s.days===1?'dia':'dias'} seguido${s.days===1?'':'s'}`:'Comece sua sequência hoje';
    pill.className=s.days>0?'streak-pill':'streak-pill sem-streak';
  }
  // VOD
  renderizarDevocional();
  // Planta
  const e=getEstagio(s.days);
  const el_em=document.getElementById('plantEmoji');
  if(el_em)el_em.textContent=e.emoji;
  const el_sn=document.getElementById('plantStageName');
  if(el_sn)el_sn.textContent=e.nome;
  const el_dl=document.getElementById('plantDaysLabel');
  if(el_dl)el_dl.textContent=e.next?`faltam ${e.next-s.days} dias`:'estágio máximo 🎉';
  const el_mf=document.getElementById('plantMiniFill');
  if(el_mf){
    let pct=0;
    if(e.next){const prev=e.prox;pct=Math.min(100,Math.round((s.days-prev)/(e.next-prev)*100));}
    else pct=100;
    el_mf.style.width=pct+'%';
  }
  const btn=document.getElementById('plantRegBtn');
  if(btn){
    if(leuHoje){btn.textContent='✓ Lido hoje';btn.className='plant-reg-btn done';}
    else{btn.textContent='Registrar leitura';btn.className='plant-reg-btn';}
  }
  // Conquistas
  renderizarConquistas();
  renderizarPlanoHome();
}

// ── Palavra do Dia ─────────────────────────────────────────────────────────
function devocionalDeHoje(){
  const d=new Date(),start=new Date(d.getFullYear(),0,0);
  const dia=Math.floor((d-start)/86400000);
  return DEVOCIONAIS[dia%DEVOCIONAIS.length];
}
function renderizarDevocional(){
  const dv=devocionalDeHoje(),set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set('devTema',dv.tema);set('vodText',`"${dv.versiculo}"`);set('vodRef',`— ${dv.referencia}`);
  set('devReflexao',dv.reflexao);set('devOracao',dv.oracao);
}
function toggleDevocional(){
  const b=document.getElementById('devBody'),t=document.getElementById('devToggle'),open=b.style.display==='block';
  b.style.display=open?'none':'block';t.textContent=open?'Ler reflexão ▾':'Recolher ▴';
}
function _textoDevocional(){
  const dv=devocionalDeHoje();
  return `📖 Palavra do Dia — ${dv.tema}\n\n"${dv.versiculo}"\n— ${dv.referencia}\n\n${dv.reflexao}\n\n🙏 ${dv.oracao}`;
}
async function copiarDevocional(){const t=_textoDevocional();try{await navigator.clipboard.writeText(t);toast('Copiado! 📋','ok');}catch{copiarFallback(t);}}
async function compartilharDevocional(){const t=_textoDevocional();if(navigator.share){try{await navigator.share({title:'Palavra do Dia',text:t});}catch{}}else{try{await navigator.clipboard.writeText(t);toast('Copiado! 📋','ok');}catch{copiarFallback(t);}}}

// ── Init ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',async()=>{
  aplicarPreferencias();carregarGrifos();
  document.querySelectorAll('.accent-swatch').forEach(s=>s.addEventListener('click',()=>setAccent(s.dataset.accent)));
  const token=localStorage.getItem(TOKEN_KEY);
  if(token){
    const auth=await postPublic({acao:'checar_auth'},token).catch(()=>({autenticado:false}));
    if(auth.autenticado){mostrarApp(auth.usuario,auth.nome);return;}
    localStorage.removeItem(TOKEN_KEY);
  }
  mostrarPainel('login');
  document.getElementById('loginScreen').style.display='flex';
  // Enter key support
  ['loginPass','loginUser'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener('keydown',e=>{if(e.key==='Enter')fazerLogin();});});
  ['regSenha','regSenha2','regNome','regUsuario','regEmail'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener('keydown',e=>{if(e.key==='Enter')fazerCadastro();});});
});

// ── Auth UI helpers ────────────────────────────────────────────────────────
function mostrarPainel(painel){
  const isLogin=painel==='login';
  document.getElementById('painelLogin').style.display=isLogin?'flex':'none';
  document.getElementById('painelCadastro').style.display=isLogin?'none':'flex';
  document.getElementById('tabLoginBtn').classList.toggle('active',isLogin);
  document.getElementById('tabRegisterBtn').classList.toggle('active',!isLogin);
  const ind=document.getElementById('authTabIndicator');
  if(ind)ind.classList.toggle('right',!isLogin);
  // Clear errors
  ['loginError','regError'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='';});
}
function toggleSenha(inputId,btn){
  const inp=document.getElementById(inputId);
  if(!inp)return;
  const show=inp.type==='password';
  inp.type=show?'text':'password';
  btn.textContent=show?'🙈':'👁';
}
function validarUsername(inp){
  const v=inp.value.trim();
  const hint=document.getElementById('regUsernameHint');
  if(!hint)return;
  if(!v){hint.textContent='';hint.className='auth-field-hint';return;}
  if(v.length<3){hint.textContent='Mín. 3 caracteres';hint.className='auth-field-hint err';return;}
  if(!/^[a-zA-Z0-9._-]+$/.test(v)){hint.textContent='Só letras, números, . _ -';hint.className='auth-field-hint err';return;}
  hint.textContent='✓ Usuário válido';hint.className='auth-field-hint ok';
}
function avaliarSenha(v){
  const fill=document.getElementById('senhaBarFill'),lbl=document.getElementById('senhaLabel');
  if(!fill||!lbl)return;
  let score=0;
  if(v.length>=6)score++;
  if(v.length>=10)score++;
  if(/[A-Z]/.test(v))score++;
  if(/[0-9]/.test(v))score++;
  if(/[^A-Za-z0-9]/.test(v))score++;
  const levels=[
    {pct:'20%',color:'#f25f5c',label:'Muito fraca'},
    {pct:'40%',color:'#ff8c3b',label:'Fraca'},
    {pct:'60%',color:'#f5a623',label:'Razoável'},
    {pct:'80%',color:'#22c47a',label:'Boa'},
    {pct:'100%',color:'#2dd4a0',label:'Excelente'},
  ];
  const lvl=levels[Math.max(0,score-1)]||levels[0];
  fill.style.width=v.length?lvl.pct:'0%';
  fill.style.background=lvl.color;
  lbl.textContent=v.length?lvl.label:'';
}

// ── Auth ──────────────────────────────────────────────────────────────────
async function fazerLogin(){
  const usuario=document.getElementById('loginUser').value.trim();
  const senha=document.getElementById('loginPass').value;
  const errEl=document.getElementById('loginError');
  errEl.textContent='';
  const btn=document.getElementById('loginSubmitBtn');
  btn.classList.add('loading');btn.querySelector('.auth-submit-text').textContent='Entrando…';
  try{
    const res=await postPublic({acao:'login',usuario,senha});
    if(res.sucesso){
      localStorage.setItem(TOKEN_KEY,res.token);
      mostrarApp(res.usuario,res.nome);
    } else {
      errEl.textContent=res.erro||'Usuário ou senha incorretos';
    }
  } catch{
    errEl.textContent='Erro de conexão. Tente novamente.';
  } finally{
    btn.classList.remove('loading');btn.querySelector('.auth-submit-text').textContent='Entrar';
  }
}
async function fazerCadastro(){
  const nome=document.getElementById('regNome').value.trim();
  const usuario=document.getElementById('regUsuario').value.trim();
  const email=document.getElementById('regEmail').value.trim();
  const senha=document.getElementById('regSenha').value;
  const senha2=document.getElementById('regSenha2').value;
  const errEl=document.getElementById('regError');
  errEl.textContent='';
  if(!nome){errEl.textContent='Informe seu nome.';return;}
  if(usuario.length<3){errEl.textContent='Usuário precisa ter ao menos 3 caracteres.';return;}
  if(senha.length<6){errEl.textContent='Senha precisa ter ao menos 6 caracteres.';return;}
  if(senha!==senha2){errEl.textContent='As senhas não coincidem.';return;}
  const btn=document.getElementById('regSubmitBtn');
  btn.classList.add('loading');btn.querySelector('.auth-submit-text').textContent='Criando conta…';
  try{
    const res=await postPublic({acao:'registrar',nome,usuario,email:email||null,senha});
    if(res.sucesso){
      localStorage.setItem(TOKEN_KEY,res.token);
      mostrarApp(res.usuario,res.nome);
      toast('Conta criada! Bem-vindo(a), '+res.nome.split(' ')[0]+' 🎉','ok');
    } else {
      errEl.textContent=res.erro||'Erro ao criar conta.';
    }
  } catch{
    errEl.textContent='Erro de conexão. Tente novamente.';
  } finally{
    btn.classList.remove('loading');btn.querySelector('.auth-submit-text').textContent='Criar minha conta';
  }
}
async function fazerLogout(){
  const token=localStorage.getItem(TOKEN_KEY);
  if(token)await postPublic({acao:'logout'},token).catch(()=>{});
  localStorage.removeItem(TOKEN_KEY);localStorage.removeItem('central_usuario');
  pararTimerLeitura();
  document.getElementById('appLayout').style.display='none';
  document.getElementById('bottomNav').style.display='none';
  mostrarPainel('login');
  document.getElementById('loginScreen').style.display='flex';
  document.getElementById('loginPass').value='';
}
function mostrarApp(usuario,nome){
  const displayNome=nome||usuario;
  localStorage.setItem('central_usuario',usuario);
  localStorage.setItem('central_nome',displayNome);
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('appLayout').style.display='flex';
  document.getElementById('bottomNav').style.display='flex';
  const su=document.getElementById('sidebarUser');
  if(su){const ini=displayNome.charAt(0).toUpperCase();su.innerHTML=`<span style="width:26px;height:26px;border-radius:50%;background:var(--accent);display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;margin-right:6px">${ini}</span>${displayNome.split(' ')[0]}`;}
  setupEventos();iniciarNavegacao();renderizarLivros();
  renderizarHome(displayNome);
  carregarPerfil();
  if(localStorage.getItem('swipe_hint_seen')){const h=document.getElementById('swipeHint');if(h)h.style.display='none';}
  if(localStorage.getItem('central_notif')==='on')agendarLembrete();
  verificarConquistas(getStreak().days);
}

// ── Perfil ────────────────────────────────────────────────────────────────
async function carregarPerfil(){
  try{
    const res=await post({acao:'meu_perfil'});
    const nome=res.nome||res.usuario||'';
    const usuario=res.usuario||'';
    const email=res.email||'';
    const av=document.getElementById('perfilAvatar');if(av)av.textContent=nome.charAt(0).toUpperCase()||'?';
    const pn=document.getElementById('perfilNome');if(pn)pn.textContent=nome;
    const pu=document.getElementById('perfilUsuarioLabel');if(pu)pu.textContent='@'+usuario;
    const pe=document.getElementById('perfilEmail');if(pe)pe.textContent=email||'Sem e-mail cadastrado';
    const ps=document.getElementById('perfilSince');if(ps&&res.criado_em)ps.textContent='Membro desde '+fmt(res.criado_em?.split('T')[0]);
    // Pre-fill edit form
    const en=document.getElementById('editNome');if(en)en.value=nome;
    const ee=document.getElementById('editEmail');if(ee)ee.value=email;
    // Update sidebar
    localStorage.setItem('central_nome',nome);
    const su=document.getElementById('sidebarUser');
    if(su){const ini=nome.charAt(0).toUpperCase();su.innerHTML=`<span style="width:26px;height:26px;border-radius:50%;background:var(--accent);display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;margin-right:6px">${ini}</span>${nome.split(' ')[0]}`;}
  } catch{}
}
async function salvarPerfil(){
  const nome=document.getElementById('editNome').value.trim();
  const email=document.getElementById('editEmail').value.trim();
  const errEl=document.getElementById('editPerfilError');
  errEl.textContent='';
  if(!nome){errEl.textContent='Nome não pode estar vazio.';return;}
  try{
    const res=await post({acao:'atualizar_perfil',nome,email:email||null});
    if(res.sucesso){fecharModal('modal-editar-perfil');await carregarPerfil();toast('Perfil atualizado! ✓','ok');}
    else errEl.textContent=res.erro||'Erro ao salvar.';
  }catch{errEl.textContent='Erro de conexão.';}
}
async function trocarSenhaUsuario(){
  const atual=document.getElementById('senhaAtual').value;
  const nova=document.getElementById('senhaNova').value;
  const nova2=document.getElementById('senhaNova2').value;
  const errEl=document.getElementById('trocarSenhaError');
  errEl.textContent='';
  if(nova.length<6){errEl.textContent='Nova senha precisa ter ao menos 6 caracteres.';return;}
  if(nova!==nova2){errEl.textContent='As senhas não coincidem.';return;}
  try{
    const res=await post({acao:'trocar_senha',senha_atual:atual,senha_nova:nova});
    if(res.sucesso){
      fecharModal('modal-trocar-senha');
      ['senhaAtual','senhaNova','senhaNova2'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
      toast('Senha alterada com sucesso! 🔒','ok');
    } else errEl.textContent=res.erro||'Erro ao alterar senha.';
  }catch{errEl.textContent='Erro de conexão.';}
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
  // Garante nivel-livros visível, outros escondidos
  const nl=document.getElementById('nivel-livros');if(nl)nl.style.display='block';
  const nc=document.getElementById('nivel-capitulos');if(nc)nc.style.display='none';
  const nv=document.getElementById('nivel-versiculos');if(nv)nv.style.display='none';
  // Ativa painel correto
  document.querySelectorAll('.bible-panel').forEach(p=>p.classList.remove('active'));
  const panel=document.getElementById('btab-'+tab);if(panel)panel.classList.add('active');
  // Botão voltar visível só nos secundários
  const bb=document.getElementById('bibliaBackBar');
  const labels={favoritos:'Favoritos',estudos:'Estudos',busca:'Busca avançada'};
  if(bb){
    bb.style.display=(tab==='livros')?'none':'flex';
    const lbl=document.getElementById('bibliaBackLabel');
    if(lbl)lbl.textContent=labels[tab]||'';
  }
}
function voltarParaLivros(){ativarTab('livros');}

// ── Setup Eventos ──────────────────────────────────────────────────────────
function setupEventos(){
  document.getElementById('bibliaRef')?.addEventListener('keydown',e=>{if(e.key==='Enter')buscarPorReferencia();});
  document.getElementById('bibliaPalavra')?.addEventListener('keydown',e=>{if(e.key==='Enter')buscarPorPalavra();});
  document.getElementById('buscaRapidaInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')executarBuscaRapida();});
  document.getElementById('bibliaRefQuick')?.addEventListener('keydown',e=>{if(e.key==='Enter')buscarRapido();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.modal-overlay.open').forEach(o=>fecharModal(o.id));});
}

// ── API ───────────────────────────────────────────────────────────────────
async function postPublic(payload,token=null){const h={'Content-Type':'application/json'};if(token)h['X-Auth-Token']=token;return(await fetch(API,{method:'POST',headers:h,body:JSON.stringify(payload)})).json();}
async function post(payload){const token=localStorage.getItem(TOKEN_KEY);const h={'Content-Type':'application/json'};if(token)h['X-Auth-Token']=token;const res=await fetch(API,{method:'POST',headers:h,body:JSON.stringify(payload)});const data=await res.json();if(data.auth===false){fazerLogout();throw new Error('Não autenticado');}return data;}
async function carregarBibliaJSON(){if(BIBLIA_DATA)return BIBLIA_DATA;BIBLIA_DATA=await(await fetch('/biblia.json')).json();return BIBLIA_DATA;}

// ── Contexto Histórico — banco local ─────────────────────────────────────
function abrirContexto(){
  const panel=document.getElementById('contextoPanel');
  if(!panel)return;
  if(panel.style.display==='block'){fecharContexto();return;}
  panel.style.display='block';
  const body=document.getElementById('contextoBody');
  const chave=`${livroAtual?.slug}-${capAtual}`;
  // Cache em memória para não reprocessar
  if(contextoCache[chave]){body.innerHTML=contextoCache[chave];return;}
  // Busca no banco local
  const ctx = typeof buscarContextoLocal==='function'
    ? buscarContextoLocal(livroAtual?.slug, capAtual)
    : null;
  if(!ctx){
    body.innerHTML=`<div class="contexto-section">
      <div class="contexto-section-title">📖 ${esc(livroAtual?.nome||'')}</div>
      <div class="contexto-section-text" style="color:var(--text-2)">Contexto histórico não disponível para este livro ainda. Em breve mais livros serão adicionados.</div>
    </div>`;
    contextoCache[chave]=body.innerHTML;
    return;
  }
  const icons={historico:'⚔️',geografico:'🗺️',cultural:'🏺',texto:'📜'};
  const labels={historico:'Contexto histórico',geografico:'Contexto geográfico',cultural:'Contexto cultural',texto:'Sobre o texto'};
  // Badge de capítulo específico
  const badge = ctx.temCapEspecifico
    ? `<div style="display:inline-flex;align-items:center;gap:5px;background:var(--warning-dim);border:1px solid rgba(245,166,35,.3);border-radius:10px;padding:3px 10px;font-size:11px;font-weight:600;color:var(--warning);margin-bottom:14px">✦ Contexto específico do capítulo ${capAtual}</div>`
    : `<div style="font-size:11px;color:var(--text-3);margin-bottom:14px">Contexto geral do livro de ${esc(livroAtual?.nome||'')}</div>`;
  const html = badge + ['historico','geografico','cultural','texto'].map(k=>`
    <div class="contexto-section">
      <div class="contexto-section-title">${icons[k]} ${labels[k]}</div>
      <div class="contexto-section-text">${esc(ctx[k]||'')}</div>
    </div>`).join('');
  body.innerHTML=html;
  contextoCache[chave]=html;
}
function fecharContexto(){const p=document.getElementById('contextoPanel');if(p)p.style.display='none';}

// ══ BÍBLIA ════════════════════════════════════════════════════════════════
const BIBLIA={
  at:[{nome:'Gênesis',slug:'genesis',caps:50},{nome:'Êxodo',slug:'exodus',caps:40},{nome:'Levítico',slug:'leviticus',caps:27},{nome:'Números',slug:'numbers',caps:36},{nome:'Deuteronômio',slug:'deuteronomy',caps:34},{nome:'Josué',slug:'joshua',caps:24},{nome:'Juízes',slug:'judges',caps:21},{nome:'Rute',slug:'ruth',caps:4},{nome:'1 Samuel',slug:'1samuel',caps:31},{nome:'2 Samuel',slug:'2samuel',caps:24},{nome:'1 Reis',slug:'1kings',caps:22},{nome:'2 Reis',slug:'2kings',caps:25},{nome:'1 Crônicas',slug:'1chronicles',caps:29},{nome:'2 Crônicas',slug:'2chronicles',caps:36},{nome:'Esdras',slug:'ezra',caps:10},{nome:'Neemias',slug:'nehemiah',caps:13},{nome:'Ester',slug:'esther',caps:10},{nome:'Jó',slug:'job',caps:42},{nome:'Salmos',slug:'psalms',caps:150},{nome:'Provérbios',slug:'proverbs',caps:31},{nome:'Eclesiastes',slug:'ecclesiastes',caps:12},{nome:'Cantares',slug:'song of solomon',caps:8},{nome:'Isaías',slug:'isaiah',caps:66},{nome:'Jeremias',slug:'jeremiah',caps:52},{nome:'Lamentações',slug:'lamentations',caps:5},{nome:'Ezequiel',slug:'ezekiel',caps:48},{nome:'Daniel',slug:'daniel',caps:12},{nome:'Oséias',slug:'hosea',caps:14},{nome:'Joel',slug:'joel',caps:3},{nome:'Amós',slug:'amos',caps:9},{nome:'Obadias',slug:'obadiah',caps:1},{nome:'Jonas',slug:'jonah',caps:4},{nome:'Miquéias',slug:'micah',caps:7},{nome:'Naum',slug:'nahum',caps:3},{nome:'Habacuque',slug:'habakkuk',caps:3},{nome:'Sofonias',slug:'zephaniah',caps:3},{nome:'Ageu',slug:'haggai',caps:2},{nome:'Zacarias',slug:'zechariah',caps:14},{nome:'Malaquias',slug:'malachi',caps:4}],
  nt:[{nome:'Mateus',slug:'matthew',caps:28},{nome:'Marcos',slug:'mark',caps:16},{nome:'Lucas',slug:'luke',caps:24},{nome:'João',slug:'john',caps:21},{nome:'Atos',slug:'acts',caps:28},{nome:'Romanos',slug:'romans',caps:16},{nome:'1 Coríntios',slug:'1corinthians',caps:16},{nome:'2 Coríntios',slug:'2corinthians',caps:13},{nome:'Gálatas',slug:'galatians',caps:6},{nome:'Efésios',slug:'ephesians',caps:6},{nome:'Filipenses',slug:'philippians',caps:4},{nome:'Colossenses',slug:'colossians',caps:4},{nome:'1 Tessalonicenses',slug:'1thessalonians',caps:5},{nome:'2 Tessalonicenses',slug:'2thessalonians',caps:3},{nome:'1 Timóteo',slug:'1timothy',caps:6},{nome:'2 Timóteo',slug:'2timothy',caps:4},{nome:'Tito',slug:'titus',caps:3},{nome:'Filemom',slug:'philemon',caps:1},{nome:'Hebreus',slug:'hebrews',caps:13},{nome:'Tiago',slug:'james',caps:5},{nome:'1 Pedro',slug:'1peter',caps:5},{nome:'2 Pedro',slug:'2peter',caps:3},{nome:'1 João',slug:'1john',caps:5},{nome:'2 João',slug:'2john',caps:1},{nome:'3 João',slug:'3john',caps:1},{nome:'Judas',slug:'jude',caps:1},{nome:'Apocalipse',slug:'revelation',caps:22}]
};
function renderizarLivros(){const r=(l,id)=>{document.getElementById(id).innerHTML=l.map(x=>`<button class="book-btn" onclick="abrirLivro('${x.slug}','${esc(x.nome)}',${x.caps})"><span>${esc(x.nome)}</span><span class="book-abbr">${x.caps} cap${x.caps>1?'s':''}</span></button>`).join('');};r(BIBLIA.at,'booksAT');r(BIBLIA.nt,'booksNT');}

async function abrirLivro(slug,nome,totalCaps){
  livroAtual={slug,nome,totalCaps};totalCapsAtual=totalCaps;contextoCache={};
  document.getElementById('livroAtualTitulo').textContent=nome;
  document.getElementById('nivel-livros').style.display='none';document.getElementById('nivel-capitulos').style.display='block';document.getElementById('nivel-versiculos').style.display='none';
  try{const res=await post({acao:'listar_anotacoes_livro',livro:slug});anotacoesLivro=res;}catch{anotacoesLivro={versiculos:[],capitulos:[]};}
  try{const res=await post({acao:'buscar_anotacao_capitulo',livro:slug,capitulo:0});document.getElementById('capNotaTexto').value=res.texto||'';}catch{document.getElementById('capNotaTexto').value='';}
  const grid=document.getElementById('chaptersGrid');grid.innerHTML='';
  for(let c=1;c<=totalCaps;c++){const btn=document.createElement('button');btn.className='chap-btn';btn.textContent=c;if(anotacoesLivro.capitulos.includes(String(c))||anotacoesLivro.capitulos.includes(c))btn.classList.add('has-nota');else if(anotacoesLivro.versiculos.some(v=>v.capitulo==c))btn.classList.add('has-verso-nota');btn.addEventListener('click',()=>abrirCapitulo(c));grid.appendChild(btn);}
}
function voltarLivros(){document.getElementById('nivel-livros').style.display='block';document.getElementById('nivel-capitulos').style.display='none';fecharContexto();}

async function abrirCapitulo(cap){
  capAtual=cap;fecharContexto();
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
function voltarCapitulos(){document.getElementById('nivel-versiculos').style.display='none';document.getElementById('nivel-capitulos').style.display='block';fecharContexto();}
function irCapAnterior(){if(capAtual>1)abrirCapitulo(capAtual-1);}
function irCapProximo(){if(capAtual<totalCapsAtual)abrirCapitulo(capAtual+1);}

// ── Versículos swipe ──────────────────────────────────────────────────────
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

function acaoVerso(tipo){
  if(!versoAtual)return;
  const ref=`${livroAtual.nome} ${capAtual}:${versoAtual.verse}`,texto=versoAtual.texto;
  if(tipo==='anotar'){fecharModal('modal-verso-acao');document.getElementById('anotacaoVersoPreview').textContent=`${ref} — "${texto.substring(0,100)}${texto.length>100?'…':''}"`;post({acao:'buscar_anotacao_versiculo',livro:livroAtual.slug,capitulo:capAtual,versiculo:versoAtual.verse}).then(r=>{document.getElementById('anotacaoVersoTexto').value=r.texto||'';}).catch(()=>{document.getElementById('anotacaoVersoTexto').value='';});anotacaoVersoTemp=versoAtual;abrirModal('modal-anotacao-verso');}
  else if(tipo==='favoritar'){fecharModal('modal-verso-acao');favoritoTemp={ref,livro:livroAtual.slug,cap:capAtual,vers:versoAtual.verse,texto};document.getElementById('favoritoPreview').textContent=`${ref} — "${texto.substring(0,100)}"`;document.getElementById('favoritoAnotacao').value='';abrirModal('modal-favorito');localStorage.setItem('central_tem_favorito','1');verificarConquistas(getStreak().days);renderizarConquistas();}
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
async function salvarEstudo(){const titulo=document.getElementById('est-titulo').value.trim();if(!titulo){toast('Título obrigatório.','err');return;}const data={titulo,conteudo:document.getElementById('est-conteudo').value,versiculo_base:document.getElementById('est-versiculo').value,texto_base:document.getElementById('est-texto-base').value,categoria:document.getElementById('est-categoria').value};try{if(estudoEditandoId)await post({acao:'atualizar_estudo',id:estudoEditandoId,data});else await post({acao:'salvar_estudo',data});fecharModal('modal-estudo');limpar(['est-titulo','est-versiculo','est-texto-base','est-conteudo']);estudoEditandoId=null;document.getElementById('modalEstudoTitulo').textContent='Novo Estudo';toast('Estudo salvo!','ok');carregarEstudos();localStorage.setItem('central_tem_estudo','1');verificarConquistas(getStreak().days);renderizarConquistas();}catch{toast('Erro.','err');}}
function editarEstudo(id){post({acao:'listar_estudos'}).then(res=>{const e=(res.estudos||[]).find(x=>x.id===id);if(!e)return;estudoEditandoId=id;document.getElementById('modalEstudoTitulo').textContent='Editar Estudo';document.getElementById('est-titulo').value=e.titulo||'';document.getElementById('est-versiculo').value=e.versiculo_base||'';document.getElementById('est-texto-base').value=e.texto_base||'';document.getElementById('est-categoria').value=e.categoria||'geral';document.getElementById('est-conteudo').value=e.conteudo||'';abrirModal('modal-estudo');});}
async function excluirEstudo(id,titulo){if(!confirm(`Excluir "${titulo}"?`))return;try{await post({acao:'excluir_estudo',id});toast('Removido.','ok');carregarEstudos();}catch{toast('Erro.','err');}}

// Plano de leitura
const BIBLIA_CAPS={genesis:50,exodus:40,leviticus:27,numbers:36,deuteronomy:34,joshua:24,judges:21,ruth:4,'1samuel':31,'2samuel':24,'1kings':22,'2kings':25,'1chronicles':29,'2chronicles':36,ezra:10,nehemiah:13,esther:10,job:42,psalms:150,proverbs:31,ecclesiastes:12,'song of solomon':8,isaiah:66,jeremiah:52,lamentations:5,ezekiel:48,daniel:12,hosea:14,joel:3,amos:9,obadiah:1,jonah:4,micah:7,nahum:3,habakkuk:3,zephaniah:3,haggai:2,zechariah:14,malachi:4,matthew:28,mark:16,luke:24,john:21,acts:28,romans:16,'1corinthians':16,'2corinthians':13,galatians:6,ephesians:6,philippians:4,colossians:4,'1thessalonians':5,'2thessalonians':3,'1timothy':6,'2timothy':4,titus:3,philemon:1,hebrews:13,james:5,'1peter':5,'2peter':3,'1john':5,'2john':1,'3john':1,jude:1,revelation:22};
const BIBLIA_NOMES={genesis:'Gênesis',exodus:'Êxodo',leviticus:'Levítico',numbers:'Números',deuteronomy:'Deuteronômio',joshua:'Josué',judges:'Juízes',ruth:'Rute','1samuel':'1 Samuel','2samuel':'2 Samuel','1kings':'1 Reis','2kings':'2 Reis','1chronicles':'1 Crônicas','2chronicles':'2 Crônicas',ezra:'Esdras',nehemiah:'Neemias',esther:'Ester',job:'Jó',psalms:'Salmos',proverbs:'Provérbios',ecclesiastes:'Eclesiastes','song of solomon':'Cantares',isaiah:'Isaías',jeremiah:'Jeremias',lamentations:'Lamentações',ezekiel:'Ezequiel',daniel:'Daniel',hosea:'Oséias',joel:'Joel',amos:'Amós',obadiah:'Obadias',jonah:'Jonas',micah:'Miquéias',nahum:'Naum',habakkuk:'Habacuque',zephaniah:'Sofonias',haggai:'Ageu',zechariah:'Zacarias',malachi:'Malaquias',matthew:'Mateus',mark:'Marcos',luke:'Lucas',john:'João',acts:'Atos',romans:'Romanos','1corinthians':'1 Coríntios','2corinthians':'2 Coríntios',galatians:'Gálatas',ephesians:'Efésios',philippians:'Filipenses',colossians:'Colossenses','1thessalonians':'1 Tessalonicenses','2thessalonians':'2 Tessalonicenses','1timothy':'1 Timóteo','2timothy':'2 Timóteo',titus:'Tito',philemon:'Filemom',hebrews:'Hebreus',james:'Tiago','1peter':'1 Pedro','2peter':'2 Pedro','1john':'1 João','2john':'2 João','3john':'3 João',jude:'Judas',revelation:'Apocalipse'};
function getPlano(){try{return JSON.parse(localStorage.getItem('central_plano')||'null');}catch{return null;}}
function salvarPlanoLocal(p){localStorage.setItem('central_plano',JSON.stringify(p));}
function calcularRitmoSugerido(){const sel=document.getElementById('planoLivro');if(!sel)return;const slug=sel.value,caps=BIBLIA_CAPS[slug]||1;let s=1;if(caps>80)s=3;else if(caps>30)s=2;const info=document.getElementById('planoRitmoInfo');if(info)info.textContent=`${BIBLIA_NOMES[slug]||slug} tem ${caps} capítulos. Sugestão: ${s} cap/dia → termina em ${Math.ceil(caps/s)} dias.`;const inp=document.getElementById('planoCapsPerDay');if(inp)inp.value=s;}
function preencherSelectLivros(){const sel=document.getElementById('planoLivro');if(!sel)return;sel.innerHTML=Object.entries(BIBLIA_NOMES).map(([slug,nome])=>`<option value="${slug}">${nome}</option>`).join('');calcularRitmoSugerido();}
function salvarPlano(){const slug=document.getElementById('planoLivro').value;const cpd=parseInt(document.getElementById('planoCapsPerDay').value)||1;const p={slug,nome:BIBLIA_NOMES[slug]||slug,totalCaps:BIBLIA_CAPS[slug]||1,capsPerDay:cpd,capAtual:1,startDate:hoje()};salvarPlanoLocal(p);fecharModal('modal-plano');renderizarPlanoHome();toast('Plano iniciado! 📖','ok');}
function abrirModalPlano(){preencherSelectLivros();abrirModal('modal-plano');}
function renderizarPlanoHome(){
  const el=document.getElementById('planContent');if(!el)return;
  const p=getPlano();
  if(!p){el.innerHTML=`<div class="plan-empty">Nenhum plano ativo.<br><button class="btn btn--primary" style="margin-top:12px" onclick="abrirModalPlano()">Iniciar plano</button></div>`;return;}
  const pct=Math.round(((p.capAtual-1)/p.totalCaps)*100);
  const leuHoje=p.lastRead===hoje();
  const proxCaps=[];for(let i=0;i<p.capsPerDay;i++){const c=p.capAtual+i;if(c<=p.totalCaps)proxCaps.push(c);}
  el.innerHTML=`<div class="plan-card"><div class="plan-book">📖 ${p.nome}</div><div class="plan-bar-row"><div class="plan-bar"><div class="plan-bar-fill" style="width:${pct}%"></div></div><span class="plan-pct">${pct}%</span></div><div class="plan-today-row"><span class="plan-today-txt">${p.capAtual>p.totalCaps?'Livro concluído! 🎉':'Hoje: Cap. '+proxCaps.join(', ')}</span>${p.capAtual<=p.totalCaps?`<button class="plan-today-btn ${leuHoje?'done':''}" onclick="avancarPlano()">${leuHoje?'✓ Lido':'Marcar como lido'}</button>`:''}</div></div>`;
}
function avancarPlano(){const p=getPlano();if(!p)return;if(p.lastRead===hoje()){toast('Já marcado hoje!','ok');return;}p.capAtual=Math.min(p.capAtual+p.capsPerDay,p.totalCaps+1);p.lastRead=hoje();salvarPlanoLocal(p);renderizarPlanoHome();marcarLeituraHoje();if(p.capAtual>p.totalCaps)toast(`Você concluiu ${p.nome}! 🎉`,'ok');else toast(`Avançado para o capítulo ${p.capAtual}! 📖`,'ok');}

// Busca
const NOMES_SLUG={},SLUGS_NOMES={};
async function iniciarMapaNomes(){const biblia=await carregarBibliaJSON();Object.entries(biblia).forEach(([slug,livro])=>{SLUGS_NOMES[slug]=livro.nome;NOMES_SLUG[livro.nome.toLowerCase()]=slug;const abrev=livro.abbr?.toLowerCase();if(abrev)NOMES_SLUG[abrev]=slug;});}
function parsearRefLocal(ref){const m=ref.trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i);if(!m)return null;const[,livroStr,cap,vers,versEnd]=m;const slug=NOMES_SLUG[livroStr.trim().toLowerCase()];if(!slug)return null;return{slug,cap:parseInt(cap),vers:vers?parseInt(vers):null,versEnd:versEnd?parseInt(versEnd):null};}
async function _buscarRef(ref,elId){const el=document.getElementById(elId);if(!el)return;el.innerHTML='<div class="bible-loading">Buscando…</div>';await iniciarMapaNomes();const parsed=parsearRefLocal(ref);if(!parsed){el.innerHTML='<div class="bible-error">Não reconhecido. Ex: João 3:16</div>';return;}try{const biblia=await carregarBibliaJSON(),ld=biblia[parsed.slug];if(!ld){el.innerHTML='<div class="bible-error">Livro não encontrado.</div>';return;}const cap=ld.caps[parsed.cap-1];if(!cap){el.innerHTML='<div class="bible-error">Capítulo não encontrado.</div>';return;}let verses;if(parsed.vers){const fim=parsed.versEnd||parsed.vers;verses=cap.slice(parsed.vers-1,fim).map((t,i)=>({verse:parsed.vers+i,text:t,slug:parsed.slug,cap:parsed.cap,nome:ld.nome}));}else verses=cap.map((t,i)=>({verse:i+1,text:t,slug:parsed.slug,cap:parsed.cap,nome:ld.nome}));renderizarResultadoBiblia(verses,`${ld.nome} ${parsed.cap}${parsed.vers?':'+parsed.vers:''}${parsed.versEnd?'-'+parsed.versEnd:''}`,elId);}catch{el.innerHTML='<div class="bible-error">Erro ao buscar.</div>';}}
async function _buscarPalavra(palavra,elId){const el=document.getElementById(elId);if(!el||!palavra)return;el.innerHTML='<div class="bible-loading">Buscando…</div>';try{const biblia=await carregarBibliaJSON(),resultados=[];for(const[slug,livro]of Object.entries(biblia)){for(let ci=0;ci<livro.caps.length;ci++){for(let vi=0;vi<livro.caps[ci].length;vi++){if(livro.caps[ci][vi].toLowerCase().includes(palavra)){resultados.push({verse:vi+1,text:livro.caps[ci][vi],slug,cap:ci+1,nome:livro.nome});if(resultados.length>=30)break;}}if(resultados.length>=30)break;}if(resultados.length>=30)break;}if(!resultados.length){el.innerHTML='<div class="bible-error">Nenhum resultado.</div>';return;}renderizarResultadoBiblia(resultados,`"${palavra}" — ${resultados.length} resultado${resultados.length>1?'s':''}`,elId);}catch{el.innerHTML='<div class="bible-error">Erro ao buscar.</div>';}}
async function buscarPorReferencia(){const ref=document.getElementById('bibliaRef').value.trim();if(ref)await _buscarRef(ref,'bibliaResultado');}
async function buscarPorPalavra(){const p=document.getElementById('bibliaPalavra').value.trim().toLowerCase();if(p)await _buscarPalavra(p,'bibliaResultado');}
async function buscarRapido(){const inp=document.getElementById('bibliaRefQuick');if(!inp||!inp.value.trim())return;const ref=inp.value.trim();await iniciarMapaNomes();const parsed=parsearRefLocal(ref);if(parsed)await _buscarRef(ref,'bibliaResultadoQuick');else await _buscarPalavra(ref.toLowerCase(),'bibliaResultadoQuick');}
async function executarBuscaRapida(){const inp=document.getElementById('buscaRapidaInput');if(!inp||!inp.value.trim())return;const ref=inp.value.trim();await iniciarMapaNomes();const parsed=parsearRefLocal(ref);if(parsed)await _buscarRef(ref,'buscaRapidaResultado');else await _buscarPalavra(ref.toLowerCase(),'buscaRapidaResultado');}
function renderizarResultadoBiblia(verses,refLabel,elId='bibliaResultado'){
  const el=document.getElementById(elId);if(!el||!verses.length){if(el)el.innerHTML='<div class="bible-error">Sem resultados.</div>';return;}
  el.innerHTML=`<div class="bible-result">
    <div class="bible-result-ref">📖 ${esc(refLabel)}</div>
    ${verses.map(v=>`
    <div class="bible-verse" onclick="irParaCapituloVersículo('${v.slug||''}','${esc(v.nome||'')}',${v.cap},${v.verse})">
      <span class="bible-verse-num">
        ${v.nome?`<span style="font-size:9px;display:block;color:var(--accent)">${esc(v.nome)} ${v.cap}</span>`:''}
        ${v.verse}
      </span>
      <span class="bible-verse-text">${esc(v.text)}</span>
      <span style="font-size:11px;color:var(--accent);flex-shrink:0;padding-top:4px">›</span>
    </div>`).join('')}
  </div>`;
}

// Ao clicar em resultado de busca: abre o livro → capítulo → rola até o versículo
async function irParaCapituloVersículo(slug,nome,cap,verse){
  // Fecha modal de busca rápida se estiver aberto
  fecharModal('modal-busca-rapida');
  // Vai para a aba Bíblia
  document.querySelectorAll('.nav-item,.bottom-nav-item').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('[data-tab="biblia"]').forEach(b=>b.classList.add('active'));
  document.getElementById('tab-biblia').classList.add('active');
  iniciarTimerLeitura();
  // Abre o livro e capítulo
  const totalCaps=BIBLIA_CAPS[slug]||1;
  await abrirLivro(slug,nome,totalCaps);
  await abrirCapitulo(cap);
  // Rola até o versículo específico e destaca
  setTimeout(()=>{
    const el=document.getElementById(`verse-${verse}`);
    if(el){
      el.scrollIntoView({behavior:'smooth',block:'center'});
      el.style.transition='background .3s';
      el.style.background='var(--accent-dim)';
      setTimeout(()=>el.style.background='',2000);
    }
  },400);
}

function abrirModalVersoBusca(verse,texto,nomeL,cap,slug){
  if(!livroAtual||livroAtual.slug!==slug)livroAtual={slug,nome:nomeL,totalCaps:BIBLIA_CAPS[slug]||0};
  capAtual=cap;versoAtual={verse,texto};
  const ref=`${nomeL} ${cap}:${verse}`;
  document.getElementById('versoAcaoRef').textContent=ref;
  document.getElementById('versoAcaoTexto').textContent=texto;
  document.querySelectorAll('.grifo-swatch').forEach(s=>s.classList.remove('active'));
  abrirModal('modal-verso-acao');
}

// Modais
function abrirModal(id){document.getElementById(id).classList.add('open');}
function fecharModal(id){document.getElementById(id).classList.remove('open');}
document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)fecharModal(o.id);}));

// Utils
function esc(str){return String(str??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function fmt(d){if(!d)return'';const[y,m,dd]=String(d).split('-');return dd&&m&&y?`${dd}/${m}/${y}`:d;}
function limpar(ids){ids.forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});}
let toastTimer;
function toast(msg,tipo='ok'){const el=document.getElementById('toast');el.textContent=msg;el.className=`toast ${tipo} show`;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3500);}
