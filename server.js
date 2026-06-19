const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 8080;
const DB_FILE = path.join(__dirname, 'db.json');

// Initialize database
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = {
      usuarios: [],
      tokens: [],
      favoritos: [],
      anotacoes_versiculo: [],
      anotacoes_capitulo: [],
      estudos: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    console.error('Erro ao carregar o banco local db.json. Reiniciando banco.', e);
    return {
      usuarios: [],
      tokens: [],
      favoritos: [],
      anotacoes_versiculo: [],
      anotacoes_capitulo: [],
      estudos: []
    };
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function hashPassword(pwd) {
  return crypto.createHash('sha256').update(pwd).digest('hex');
}

const db = loadDB();

// Helper to send JSON responses
function responder(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

// Static files handler
function serveStatic(req, res) {
  let urlPath = req.url === '/' ? '/index.html' : req.url;
  // Clean query strings if any
  urlPath = urlPath.split('?')[0];

  const filePath = path.join(__dirname, urlPath);

  // Safe check to prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Acesso proibido');
  }

  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'text/plain; charset=utf-8';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Serve index.html for SPA routing fallback or send 404
        if (ext === '') {
          fs.readFile(path.join(__dirname, 'index.html'), (e, fallbackContent) => {
            if (e) {
              res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
              res.end('Arquivo não encontrado');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(fallbackContent);
            }
          });
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Arquivo não encontrado');
        }
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Erro no servidor: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

// API handler
function handleAPI(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Auth-Token');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ erro: 'Método não permitido' }));
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', () => {
    let input = {};
    try {
      input = JSON.parse(body || '{}');
    } catch (e) {
      return responder(res, { erro: 'JSON inválido' }, 400);
    }

    const acao = input.acao;
    const token = req.headers['x-auth-token'] || null;

    // --- PUBLIC ROUTES ---
    if (acao === 'registrar') {
      const usuario = (input.usuario || '').trim();
      const nome = (input.nome || usuario || '').trim();
      const email = (input.email || '').trim() || null;
      const senha = input.senha || '';

      if (usuario.length < 3) {
        return responder(res, { erro: 'Usuário precisa ter ao menos 3 caracteres' }, 400);
      }
      if (!/^[a-zA-Z0-9._@\-]+$/.test(usuario)) {
        return responder(res, { erro: 'Usuário só pode ter letras, números e . _ @ -' }, 400);
      }
      if (senha.length < 6) {
        return responder(res, { erro: 'Senha precisa ter ao menos 6 caracteres' }, 400);
      }

      // Check if user already exists
      const existingUser = db.usuarios.find(
        u => u.usuario.toLowerCase() === usuario.toLowerCase() || (email && u.email && u.email.toLowerCase() === email.toLowerCase())
      );
      if (existingUser) {
        return responder(res, { erro: 'Usuário ou e-mail já cadastrado' }, 409);
      }

      const uid = db.usuarios.length + 1;
      const newUser = {
        id: uid,
        usuario,
        nome,
        email,
        senha: hashPassword(senha),
        criado_em: new Date().toISOString()
      };
      db.usuarios.push(newUser);

      const generatedToken = crypto.randomBytes(32).toString('hex');
      db.tokens.push({
        id: db.tokens.length + 1,
        usuario_id: uid,
        usuario,
        token: generatedToken,
        criado_em: new Date().toISOString()
      });

      saveDB(db);
      return responder(res, { sucesso: true, usuario, nome, token: generatedToken });
    }

    if (acao === 'login') {
      const login = (input.usuario || '').trim();
      const senha = input.senha || '';

      const user = db.usuarios.find(
        u => u.usuario.toLowerCase() === login.toLowerCase() || (u.email && u.email.toLowerCase() === login.toLowerCase())
      );

      if (user && user.senha === hashPassword(senha)) {
        const generatedToken = crypto.randomBytes(32).toString('hex');
        db.tokens.push({
          id: db.tokens.length + 1,
          usuario_id: user.id,
          usuario: user.usuario,
          token: generatedToken,
          criado_em: new Date().toISOString()
        });
        saveDB(db);
        return responder(res, { sucesso: true, usuario: user.usuario, nome: user.nome || user.usuario, token: generatedToken });
      }

      return responder(res, { erro: 'Usuário ou senha incorretos' }, 401);
    }

    if (acao === 'logout') {
      if (token) {
        db.tokens = db.tokens.filter(t => t.token !== token);
        saveDB(db);
      }
      return responder(res, { sucesso: true });
    }

    if (acao === 'checar_auth') {
      if (!token) {
        return responder(res, { autenticado: false });
      }
      const activeToken = db.tokens.find(t => t.token === token);
      if (!activeToken) {
        return responder(res, { autenticado: false });
      }
      const user = db.usuarios.find(u => u.id === activeToken.usuario_id);
      return responder(res, {
        autenticado: true,
        usuario: activeToken.usuario,
        nome: user ? user.nome : activeToken.usuario
      });
    }

    // --- AUTHENTICATED ROUTES ---
    if (!token) {
      return responder(res, { erro: 'Não autenticado', auth: false }, 401);
    }

    const session = db.tokens.find(t => t.token === token);
    if (!session) {
      return responder(res, { erro: 'Não autenticado', auth: false }, 401);
    }

    const usuario_id = session.usuario_id;
    const usuario_str = session.usuario;

    try {
      switch (acao) {
        case 'meu_perfil': {
          const user = db.usuarios.find(u => u.usuario === usuario_str);
          if (!user) {
            return responder(res, { erro: 'Não encontrado' }, 404);
          }
          return responder(res, {
            usuario: user.usuario,
            nome: user.nome,
            email: user.email,
            criado_em: user.criado_em
          });
        }

        case 'atualizar_perfil': {
          const nome = (input.nome || '').trim();
          const email = (input.email || '').trim() || null;

          const user = db.usuarios.find(u => u.usuario === usuario_str);
          if (!user) return responder(res, { erro: 'Usuário não encontrado' }, 404);

          if (nome) user.nome = nome;
          if (email !== null) {
            const conflict = db.usuarios.find(u => u.email && u.email.toLowerCase() === email.toLowerCase() && u.id !== user.id);
            if (conflict) {
              return responder(res, { erro: 'E-mail já usado por outra conta' }, 409);
            }
            user.email = email;
          }

          saveDB(db);
          return responder(res, { sucesso: true });
        }

        case 'trocar_senha': {
          const user = db.usuarios.find(u => u.usuario === usuario_str);
          if (!user) return responder(res, { erro: 'Usuário não encontrado' }, 404);

          const senha_atual = input.senha_atual || '';
          const senha_nova = input.senha_nova || '';

          if (user.senha !== hashPassword(senha_atual)) {
            return responder(res, { erro: 'Senha atual incorreta' }, 400);
          }
          if (senha_nova.length < 6) {
            return responder(res, { erro: 'Nova senha precisa ter ao menos 6 caracteres' }, 400);
          }

          user.senha = hashPassword(senha_nova);
          saveDB(db);
          return responder(res, { sucesso: true });
        }

        case 'listar_favoritos': {
          const cat = input.categoria || null;
          let list = db.favoritos.filter(f => f.usuario_id === usuario_id);
          if (cat && cat !== 'todas') {
            list = list.filter(f => f.categoria === cat);
          }
          // Sort by criado_em desc
          list.sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));

          // Distinct categories
          const userFavs = db.favoritos.filter(f => f.usuario_id === usuario_id);
          const cats = [...new Set(userFavs.map(f => f.categoria))].filter(Boolean).sort();

          return responder(res, { favoritos: list, categorias: cats });
        }

        case 'salvar_favorito': {
          const d = input.data || {};
          // Check if already favorited
          const exists = db.favoritos.some(
            f => f.usuario_id === usuario_id && f.livro === d.livro && f.capitulo === d.capitulo && f.versiculo === d.versiculo
          );
          if (exists) {
            return responder(res, { erro: 'Versículo já está nos favoritos' }, 400);
          }

          const newId = db.favoritos.length + 1;
          const newFav = {
            id: newId,
            usuario_id,
            referencia: d.referencia,
            livro: d.livro,
            capitulo: parseInt(d.capitulo),
            versiculo: parseInt(d.versiculo),
            texto: d.texto,
            anotacao: d.anotacao || null,
            categoria: d.categoria || 'geral',
            criado_em: new Date().toISOString()
          };
          db.favoritos.push(newFav);
          saveDB(db);
          return responder(res, { sucesso: true, id: newId });
        }

        case 'excluir_favorito': {
          const favId = parseInt(input.id);
          db.favoritos = db.favoritos.filter(f => !(f.id === favId && f.usuario_id === usuario_id));
          saveDB(db);
          return responder(res, { sucesso: true });
        }

        case 'salvar_anotacao_versiculo': {
          const livro = input.livro;
          const cap = parseInt(input.capitulo);
          const vers = parseInt(input.versiculo);
          const texto = input.texto;

          const idx = db.anotacoes_versiculo.findIndex(
            a => a.usuario_id === usuario_id && a.livro === livro && a.capitulo === cap && a.versiculo === vers
          );

          if (idx >= 0) {
            db.anotacoes_versiculo[idx].texto = texto;
            db.anotacoes_versiculo[idx].atualizado_em = new Date().toISOString();
          } else {
            db.anotacoes_versiculo.push({
              id: db.anotacoes_versiculo.length + 1,
              usuario_id,
              livro,
              capitulo: cap,
              versiculo: vers,
              texto,
              atualizado_em: new Date().toISOString()
            });
          }
          saveDB(db);
          return responder(res, { sucesso: true });
        }

        case 'buscar_anotacao_versiculo': {
          const livro = input.livro;
          const cap = parseInt(input.capitulo);
          const vers = parseInt(input.versiculo);

          const row = db.anotacoes_versiculo.find(
            a => a.usuario_id === usuario_id && a.livro === livro && a.capitulo === cap && a.versiculo === vers
          );
          return responder(res, { texto: row ? row.texto : '' });
        }

        case 'salvar_anotacao_capitulo': {
          const livro = input.livro;
          const cap = parseInt(input.capitulo);
          const texto = input.texto;

          const idx = db.anotacoes_capitulo.findIndex(
            a => a.usuario_id === usuario_id && a.livro === livro && a.capitulo === cap
          );

          if (idx >= 0) {
            db.anotacoes_capitulo[idx].texto = texto;
            db.anotacoes_capitulo[idx].atualizado_em = new Date().toISOString();
          } else {
            db.anotacoes_capitulo.push({
              id: db.anotacoes_capitulo.length + 1,
              usuario_id,
              livro,
              capitulo: cap,
              texto,
              atualizado_em: new Date().toISOString()
            });
          }
          saveDB(db);
          return responder(res, { sucesso: true });
        }

        case 'buscar_anotacao_capitulo': {
          const livro = input.livro;
          const cap = parseInt(input.capitulo);

          const row = db.anotacoes_capitulo.find(
            a => a.usuario_id === usuario_id && a.livro === livro && a.capitulo === cap
          );
          return responder(res, { texto: row ? row.texto : '' });
        }

        case 'listar_anotacoes_livro': {
          const livro = input.livro;

          const versinhos = db.anotacoes_versiculo
            .filter(a => a.usuario_id === usuario_id && a.livro === livro)
            .map(a => ({ capitulo: a.capitulo, versiculo: a.versiculo }));

          const caps = db.anotacoes_capitulo
            .filter(a => a.usuario_id === usuario_id && a.livro === livro)
            .map(a => String(a.capitulo));

          return responder(res, { versiculos: versinhos, capitulos: caps });
        }

        case 'listar_estudos': {
          const list = db.estudos.filter(e => e.usuario_id === usuario_id);
          list.sort((a, b) => new Date(b.atualizado_em) - new Date(a.atualizado_em));
          return responder(res, { estudos: list });
        }

        case 'salvar_estudo': {
          const d = input.data || {};
          const newId = db.estudos.length + 1;
          const newStudy = {
            id: newId,
            usuario_id,
            titulo: d.titulo,
            conteudo: d.conteudo || null,
            versiculo_base: d.versiculo_base || null,
            texto_base: d.texto_base || null,
            categoria: d.categoria || 'geral',
            criado_em: new Date().toISOString(),
            atualizado_em: new Date().toISOString()
          };
          db.estudos.push(newStudy);
          saveDB(db);
          return responder(res, { sucesso: true, id: newId });
        }

        case 'atualizar_estudo': {
          const studyId = parseInt(input.id);
          const d = input.data || {};

          const study = db.estudos.find(e => e.id === studyId && e.usuario_id === usuario_id);
          if (!study) {
            return responder(res, { erro: 'Estudo não encontrado ou permissão negada' }, 404);
          }

          study.titulo = d.titulo;
          study.conteudo = d.conteudo || null;
          study.versiculo_base = d.versiculo_base || null;
          study.texto_base = d.texto_base || null;
          study.categoria = d.categoria || 'geral';
          study.atualizado_em = new Date().toISOString();

          saveDB(db);
          return responder(res, { sucesso: true });
        }

        case 'excluir_estudo': {
          const studyId = parseInt(input.id);
          db.estudos = db.estudos.filter(e => !(e.id === studyId && e.usuario_id === usuario_id));
          saveDB(db);
          return responder(res, { sucesso: true });
        }

        default:
          return responder(res, { erro: `Ação desconhecida: ${acao}` }, 400);
      }
    } catch (e) {
      console.error('Erro na API:', e);
      return responder(res, { erro: e.message }, 500);
    }
  });
}

// Request router
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api')) {
    handleAPI(req, res);
  } else {
    serveStatic(req, res);
  }
});

server.listen(PORT, () => {
  console.log(`\x1b[32m[OK]\x1b[0m Servidor local iniciado em http://localhost:${PORT}`);
});
