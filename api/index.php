<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $url = getenv('DATABASE_URL');
    if (!$url) die(json_encode(['erro' => 'DATABASE_URL não configurada']));
    $p = parse_url($url);
    $dsn = "pgsql:host={$p['host']};port={$p['port']};dbname=" . ltrim($p['path'], '/');
    $pdo = new PDO($dsn, $p['user'], $p['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    criarTabelas($pdo);
    return $pdo;
}

function criarTabelas(PDO $db) {
    $db->exec("
        CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            usuario TEXT NOT NULL UNIQUE,
            nome TEXT NOT NULL DEFAULT '',
            email TEXT UNIQUE,
            senha TEXT NOT NULL,
            criado_em TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS tokens (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
            usuario TEXT NOT NULL,
            token TEXT NOT NULL UNIQUE,
            criado_em TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS favoritos (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER NOT NULL DEFAULT 0,
            referencia TEXT NOT NULL,
            livro TEXT NOT NULL,
            capitulo INTEGER NOT NULL,
            versiculo INTEGER NOT NULL,
            texto TEXT NOT NULL,
            anotacao TEXT,
            categoria TEXT DEFAULT 'geral',
            criado_em TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS anotacoes_versiculo (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER NOT NULL DEFAULT 0,
            livro TEXT NOT NULL,
            capitulo INTEGER NOT NULL,
            versiculo INTEGER NOT NULL,
            texto TEXT NOT NULL,
            atualizado_em TIMESTAMP DEFAULT NOW(),
            UNIQUE(usuario_id, livro, capitulo, versiculo)
        );
        CREATE TABLE IF NOT EXISTS anotacoes_capitulo (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER NOT NULL DEFAULT 0,
            livro TEXT NOT NULL,
            capitulo INTEGER NOT NULL,
            texto TEXT NOT NULL,
            atualizado_em TIMESTAMP DEFAULT NOW(),
            UNIQUE(usuario_id, livro, capitulo)
        );
        CREATE TABLE IF NOT EXISTS estudos (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER NOT NULL DEFAULT 0,
            titulo TEXT NOT NULL,
            conteudo TEXT,
            versiculo_base TEXT,
            texto_base TEXT,
            categoria TEXT DEFAULT 'geral',
            criado_em TIMESTAMP DEFAULT NOW(),
            atualizado_em TIMESTAMP DEFAULT NOW()
        );
    ");

    // Migração segura: adicionar colunas que possam faltar
    $cols = ['nome TEXT NOT NULL DEFAULT \'\'', 'email TEXT'];
    foreach ($cols as $col) {
        $name = explode(' ', $col)[0];
        try { $db->exec("ALTER TABLE usuarios ADD COLUMN $col"); } catch (Exception $e) {}
    }
    try { $db->exec("ALTER TABLE tokens ADD COLUMN usuario_id INTEGER"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE favoritos ADD COLUMN usuario_id INTEGER NOT NULL DEFAULT 0"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE anotacoes_versiculo ADD COLUMN usuario_id INTEGER NOT NULL DEFAULT 0"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE anotacoes_capitulo ADD COLUMN usuario_id INTEGER NOT NULL DEFAULT 0"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE estudos ADD COLUMN usuario_id INTEGER NOT NULL DEFAULT 0"); } catch (Exception $e) {}
    // Adicionar constraint única nova para anotacoes
    try { $db->exec("ALTER TABLE anotacoes_versiculo DROP CONSTRAINT IF EXISTS anotacoes_versiculo_livro_capitulo_versiculo_key"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE anotacoes_capitulo DROP CONSTRAINT IF EXISTS anotacoes_capitulo_livro_capitulo_key"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE anotacoes_versiculo ADD CONSTRAINT anot_verso_unique UNIQUE(usuario_id, livro, capitulo, versiculo)"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE anotacoes_capitulo ADD CONSTRAINT anot_cap_unique UNIQUE(usuario_id, livro, capitulo)"); } catch (Exception $e) {}
}

// ── Auth via token ─────────────────────────────────────────────────────────────
function getToken(): ?string {
    return $_SERVER['HTTP_X_AUTH_TOKEN'] ?? null;
}
function verificarToken(PDO $db): ?array {
    $token = getToken();
    if (!$token) return null;
    $st = $db->prepare("SELECT t.usuario_id, t.usuario FROM tokens t WHERE t.token = ?");
    $st->execute([$token]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$acao  = $input['acao'] ?? '';

// ── Rotas públicas ──────────────────────────────────────────────────────────
if ($acao === 'registrar') {
    $db = db();
    $usuario = trim($input['usuario'] ?? '');
    $nome    = trim($input['nome'] ?? $usuario);
    $email   = trim($input['email'] ?? '') ?: null;
    $senha   = $input['senha'] ?? '';

    if (strlen($usuario) < 3)  responder(['erro' => 'Usuário precisa ter ao menos 3 caracteres'], 400);
    if (!preg_match('/^[a-zA-Z0-9._@\-]+$/', $usuario)) responder(['erro' => 'Usuário só pode ter letras, números e . _ @ -'], 400);
    if (strlen($senha) < 6)    responder(['erro' => 'Senha precisa ter ao menos 6 caracteres'], 400);

    $st = $db->prepare("SELECT id FROM usuarios WHERE usuario = ? OR (email IS NOT NULL AND email = ?)");
    $st->execute([$usuario, $email]);
    if ($st->fetch()) responder(['erro' => 'Usuário ou e-mail já cadastrado'], 409);

    $db->prepare("INSERT INTO usuarios (usuario, nome, email, senha) VALUES (?, ?, ?, ?)")
       ->execute([$usuario, $nome, $email, password_hash($senha, PASSWORD_DEFAULT)]);
    $uid = $db->lastInsertId();

    $token = bin2hex(random_bytes(32));
    $db->prepare("INSERT INTO tokens (usuario_id, usuario, token) VALUES (?, ?, ?)")->execute([$uid, $usuario, $token]);
    responder(['sucesso' => true, 'usuario' => $usuario, 'nome' => $nome, 'token' => $token]);
}

if ($acao === 'login') {
    $db = db();
    $login = trim($input['usuario'] ?? '');
    $st = $db->prepare("SELECT * FROM usuarios WHERE usuario = ? OR (email IS NOT NULL AND email = ?)");
    $st->execute([$login, $login]);
    $user = $st->fetch(PDO::FETCH_ASSOC);
    if ($user && password_verify($input['senha'] ?? '', $user['senha'])) {
        $token = bin2hex(random_bytes(32));
        $uid = $user['id'];
        // Garante coluna usuario_id no token
        try {
            $db->prepare("INSERT INTO tokens (usuario_id, usuario, token) VALUES (?, ?, ?)")->execute([$uid, $user['usuario'], $token]);
        } catch (Exception $e) {
            $db->prepare("INSERT INTO tokens (usuario, token) VALUES (?, ?)")->execute([$user['usuario'], $token]);
        }
        responder(['sucesso' => true, 'usuario' => $user['usuario'], 'nome' => $user['nome'] ?? $user['usuario'], 'token' => $token]);
    }
    responder(['erro' => 'Usuário ou senha incorretos'], 401);
}

if ($acao === 'logout') {
    $db = db();
    $token = getToken();
    if ($token) $db->prepare("DELETE FROM tokens WHERE token = ?")->execute([$token]);
    responder(['sucesso' => true]);
}

if ($acao === 'checar_auth') {
    $db = db();
    $token = getToken();
    if (!$token) { responder(['autenticado' => false]); }
    $st = $db->prepare("SELECT t.usuario, u.nome FROM tokens t LEFT JOIN usuarios u ON u.usuario = t.usuario WHERE t.token = ?");
    $st->execute([$token]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    responder(['autenticado' => (bool)$row, 'usuario' => $row['usuario'] ?? null, 'nome' => $row['nome'] ?? null]);
}

// ── Rotas autenticadas ──────────────────────────────────────────────────────
$db = db();
$auth = verificarToken($db);
if (!$auth) { responder(['erro' => 'Não autenticado', 'auth' => false], 401); }
$usuario_id  = (int)($auth['usuario_id'] ?? 0);
$usuario_str = $auth['usuario'];

try {
    switch ($acao) {
        case 'listar_favoritos':          listarFavoritos($db, $input, $usuario_id); break;
        case 'salvar_favorito':           salvarFavorito($db, $input['data']??[], $usuario_id); break;
        case 'excluir_favorito':          excluirFavorito($db, $input['id'], $usuario_id); break;
        case 'salvar_anotacao_versiculo': salvarAnotacaoVersiculo($db, $input, $usuario_id); break;
        case 'buscar_anotacao_versiculo': buscarAnotacaoVersiculo($db, $input, $usuario_id); break;
        case 'salvar_anotacao_capitulo':  salvarAnotacaoCapitulo($db, $input, $usuario_id); break;
        case 'buscar_anotacao_capitulo':  buscarAnotacaoCapitulo($db, $input, $usuario_id); break;
        case 'listar_anotacoes_livro':    listarAnotacoesLivro($db, $input, $usuario_id); break;
        case 'listar_estudos':            listarEstudos($db, $usuario_id); break;
        case 'salvar_estudo':             salvarEstudo($db, $input['data']??[], $usuario_id); break;
        case 'excluir_estudo':            excluirEstudo($db, $input['id'], $usuario_id); break;
        case 'atualizar_estudo':          atualizarEstudo($db, $input, $usuario_id); break;
        case 'trocar_senha':              trocarSenha($db, $input, $usuario_str); break;
        case 'meu_perfil':                meuPerfil($db, $usuario_str); break;
        case 'atualizar_perfil':          atualizarPerfil($db, $input, $usuario_str); break;
        default: responder(['erro' => "Ação desconhecida: $acao"], 400);
    }
} catch (Exception $e) { responder(['erro' => $e->getMessage()], 500); }

// ── Funções ─────────────────────────────────────────────────────────────────
function listarFavoritos(PDO $db, array $input, int $uid) {
    $cat=$input['categoria']??null;
    if($cat&&$cat!=='todas') { $st=$db->prepare("SELECT * FROM favoritos WHERE usuario_id=? AND categoria=? ORDER BY criado_em DESC"); $st->execute([$uid,$cat]); }
    else { $st=$db->prepare("SELECT * FROM favoritos WHERE usuario_id=? ORDER BY criado_em DESC"); $st->execute([$uid]); }
    $sc=$db->prepare("SELECT DISTINCT categoria FROM favoritos WHERE usuario_id=? ORDER BY categoria"); $sc->execute([$uid]);
    $cats=$sc->fetchAll(PDO::FETCH_COLUMN);
    responder(['favoritos'=>$st->fetchAll(PDO::FETCH_ASSOC),'categorias'=>$cats]);
}
function salvarFavorito(PDO $db, array $d, int $uid) {
    $st=$db->prepare("SELECT id FROM favoritos WHERE usuario_id=? AND livro=? AND capitulo=? AND versiculo=?");
    $st->execute([$uid,$d['livro'],$d['capitulo'],$d['versiculo']]);
    if($st->fetch()) responder(['erro'=>'Versículo já está nos favoritos'],400);
    $db->prepare("INSERT INTO favoritos (usuario_id,referencia,livro,capitulo,versiculo,texto,anotacao,categoria) VALUES (?,?,?,?,?,?,?,?)")
       ->execute([$uid,$d['referencia'],$d['livro'],$d['capitulo'],$d['versiculo'],$d['texto'],$d['anotacao']??null,$d['categoria']??'geral']);
    responder(['sucesso'=>true,'id'=>$db->lastInsertId()]);
}
function excluirFavorito(PDO $db, $id, int $uid) {
    $db->prepare("DELETE FROM favoritos WHERE id=? AND usuario_id=?")->execute([$id,$uid]);
    responder(['sucesso'=>true]);
}
function salvarAnotacaoVersiculo(PDO $db, array $input, int $uid) {
    $db->prepare("INSERT INTO anotacoes_versiculo (usuario_id,livro,capitulo,versiculo,texto) VALUES (?,?,?,?,?) ON CONFLICT (usuario_id,livro,capitulo,versiculo) DO UPDATE SET texto=EXCLUDED.texto, atualizado_em=NOW()")
       ->execute([$uid,$input['livro'],$input['capitulo'],$input['versiculo'],$input['texto']]);
    responder(['sucesso'=>true]);
}
function buscarAnotacaoVersiculo(PDO $db, array $input, int $uid) {
    $st=$db->prepare("SELECT texto FROM anotacoes_versiculo WHERE usuario_id=? AND livro=? AND capitulo=? AND versiculo=?");
    $st->execute([$uid,$input['livro'],$input['capitulo'],$input['versiculo']]);
    $row=$st->fetch(PDO::FETCH_ASSOC);
    responder(['texto'=>$row['texto']??'']);
}
function salvarAnotacaoCapitulo(PDO $db, array $input, int $uid) {
    $db->prepare("INSERT INTO anotacoes_capitulo (usuario_id,livro,capitulo,texto) VALUES (?,?,?,?) ON CONFLICT (usuario_id,livro,capitulo) DO UPDATE SET texto=EXCLUDED.texto, atualizado_em=NOW()")
       ->execute([$uid,$input['livro'],$input['capitulo'],$input['texto']]);
    responder(['sucesso'=>true]);
}
function buscarAnotacaoCapitulo(PDO $db, array $input, int $uid) {
    $st=$db->prepare("SELECT texto FROM anotacoes_capitulo WHERE usuario_id=? AND livro=? AND capitulo=?");
    $st->execute([$uid,$input['livro'],$input['capitulo']]);
    $row=$st->fetch(PDO::FETCH_ASSOC);
    responder(['texto'=>$row['texto']??'']);
}
function listarAnotacoesLivro(PDO $db, array $input, int $uid) {
    $st=$db->prepare("SELECT capitulo, versiculo FROM anotacoes_versiculo WHERE usuario_id=? AND livro=?");
    $st->execute([$uid,$input['livro']]);
    $versinhos=$st->fetchAll(PDO::FETCH_ASSOC);
    $st2=$db->prepare("SELECT capitulo FROM anotacoes_capitulo WHERE usuario_id=? AND livro=?");
    $st2->execute([$uid,$input['livro']]);
    $caps=$st2->fetchAll(PDO::FETCH_COLUMN);
    responder(['versiculos'=>$versinhos,'capitulos'=>$caps]);
}
function listarEstudos(PDO $db, int $uid) {
    $st=$db->prepare("SELECT * FROM estudos WHERE usuario_id=? ORDER BY atualizado_em DESC");
    $st->execute([$uid]);
    responder(['estudos'=>$st->fetchAll(PDO::FETCH_ASSOC)]);
}
function salvarEstudo(PDO $db, array $d, int $uid) {
    $db->prepare("INSERT INTO estudos (usuario_id,titulo,conteudo,versiculo_base,texto_base,categoria) VALUES (?,?,?,?,?,?)")
       ->execute([$uid,$d['titulo'],$d['conteudo']??null,$d['versiculo_base']??null,$d['texto_base']??null,$d['categoria']??'geral']);
    responder(['sucesso'=>true,'id'=>$db->lastInsertId()]);
}
function excluirEstudo(PDO $db, $id, int $uid) {
    $db->prepare("DELETE FROM estudos WHERE id=? AND usuario_id=?")->execute([$id,$uid]);
    responder(['sucesso'=>true]);
}
function atualizarEstudo(PDO $db, array $input, int $uid) {
    $d=$input['data']??[];
    $db->prepare("UPDATE estudos SET titulo=?,conteudo=?,versiculo_base=?,texto_base=?,categoria=?,atualizado_em=NOW() WHERE id=? AND usuario_id=?")
       ->execute([$d['titulo'],$d['conteudo']??null,$d['versiculo_base']??null,$d['texto_base']??null,$d['categoria']??'geral',$input['id'],$uid]);
    responder(['sucesso'=>true]);
}
function trocarSenha(PDO $db, array $input, string $usuario) {
    $st=$db->prepare("SELECT senha FROM usuarios WHERE usuario=?"); $st->execute([$usuario]);
    $user=$st->fetch(PDO::FETCH_ASSOC);
    if(!$user||!password_verify($input['senha_atual']??'',$user['senha'])) responder(['erro'=>'Senha atual incorreta'],400);
    if(strlen($input['senha_nova']??'')<6) responder(['erro'=>'Nova senha precisa ter ao menos 6 caracteres'],400);
    $db->prepare("UPDATE usuarios SET senha=? WHERE usuario=?")->execute([password_hash($input['senha_nova'],PASSWORD_DEFAULT),$usuario]);
    responder(['sucesso'=>true]);
}
function meuPerfil(PDO $db, string $usuario) {
    $st=$db->prepare("SELECT usuario, nome, email, criado_em FROM usuarios WHERE usuario=?");
    $st->execute([$usuario]);
    $row=$st->fetch(PDO::FETCH_ASSOC);
    responder($row ?: ['erro'=>'Não encontrado']);
}
function atualizarPerfil(PDO $db, array $input, string $usuario) {
    $nome  = trim($input['nome'] ?? '');
    $email = trim($input['email'] ?? '') ?: null;
    if($nome) $db->prepare("UPDATE usuarios SET nome=? WHERE usuario=?")->execute([$nome,$usuario]);
    if($email !== null) {
        $chk=$db->prepare("SELECT id FROM usuarios WHERE email=? AND usuario != ?");
        $chk->execute([$email,$usuario]);
        if($chk->fetch()) responder(['erro'=>'E-mail já usado por outra conta'],409);
        $db->prepare("UPDATE usuarios SET email=? WHERE usuario=?")->execute([$email,$usuario]);
    }
    responder(['sucesso'=>true]);
}
function responder(array $dados, int $status=200) { http_response_code($status); echo json_encode($dados,JSON_UNESCAPED_UNICODE); exit(); }
