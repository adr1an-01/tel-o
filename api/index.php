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
            senha TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS tokens (
            id SERIAL PRIMARY KEY,
            usuario TEXT NOT NULL,
            token TEXT NOT NULL UNIQUE,
            criado_em TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS servos (
            id SERIAL PRIMARY KEY,
            nome TEXT NOT NULL,
            telefone TEXT,
            funcao TEXT,
            email TEXT,
            aniversario DATE,
            ativo BOOLEAN DEFAULT TRUE
        );
        CREATE TABLE IF NOT EXISTS escalas (
            id SERIAL PRIMARY KEY,
            data DATE NOT NULL,
            operador TEXT NOT NULL,
            telefone TEXT,
            musicas TEXT,
            obs TEXT
        );
        CREATE TABLE IF NOT EXISTS tarefas (
            id SERIAL PRIMARY KEY,
            tarefa TEXT NOT NULL,
            prazo DATE,
            status TEXT DEFAULT 'pendente'
        );
        CREATE TABLE IF NOT EXISTS favoritos (
            id SERIAL PRIMARY KEY,
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
            livro TEXT NOT NULL,
            capitulo INTEGER NOT NULL,
            versiculo INTEGER NOT NULL,
            texto TEXT NOT NULL,
            atualizado_em TIMESTAMP DEFAULT NOW(),
            UNIQUE(livro, capitulo, versiculo)
        );
        CREATE TABLE IF NOT EXISTS anotacoes_capitulo (
            id SERIAL PRIMARY KEY,
            livro TEXT NOT NULL,
            capitulo INTEGER NOT NULL,
            texto TEXT NOT NULL,
            atualizado_em TIMESTAMP DEFAULT NOW(),
            UNIQUE(livro, capitulo)
        );
        CREATE TABLE IF NOT EXISTS estudos (
            id SERIAL PRIMARY KEY,
            titulo TEXT NOT NULL,
            conteudo TEXT,
            versiculo_base TEXT,
            texto_base TEXT,
            categoria TEXT DEFAULT 'geral',
            criado_em TIMESTAMP DEFAULT NOW(),
            atualizado_em TIMESTAMP DEFAULT NOW()
        );
    ");
    $st = $db->query("SELECT COUNT(*) FROM usuarios");
    if ($st->fetchColumn() == 0) {
        $db->prepare("INSERT INTO usuarios (usuario, senha) VALUES ('admin', ?)")->execute([password_hash('admin123', PASSWORD_DEFAULT)]);
    }
}

// ── Auth via token ─────────────────────────────────────────────────────────────
function getToken(): ?string {
    return $_SERVER['HTTP_X_AUTH_TOKEN'] ?? null;
}
function verificarToken(PDO $db): bool {
    $token = getToken();
    if (!$token) return false;
    $st = $db->prepare("SELECT id FROM tokens WHERE token = ?");
    $st->execute([$token]);
    return (bool)$st->fetch();
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$acao  = $input['acao'] ?? '';

// Rotas públicas
if ($acao === 'login') {
    $db = db();
    $st = $db->prepare("SELECT * FROM usuarios WHERE usuario = ?");
    $st->execute([$input['usuario'] ?? '']);
    $user = $st->fetch(PDO::FETCH_ASSOC);
    if ($user && password_verify($input['senha'] ?? '', $user['senha'])) {
        $token = bin2hex(random_bytes(32));
        $db->prepare("INSERT INTO tokens (usuario, token) VALUES (?, ?)")->execute([$user['usuario'], $token]);
        responder(['sucesso' => true, 'usuario' => $user['usuario'], 'token' => $token]);
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
    $st = $db->prepare("SELECT usuario FROM tokens WHERE token = ?");
    $st->execute([$token]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    responder(['autenticado' => (bool)$row, 'usuario' => $row['usuario'] ?? null]);
}

$db = db();
if (!verificarToken($db)) { responder(['erro' => 'Não autenticado', 'auth' => false], 401); }

try {
    switch ($acao) {
        case 'listar':                  listar($db); break;
        case 'salvar':                  salvar($db, $input['tipo']??'', $input['data']??[]); break;
        case 'excluir':                 excluir($db, $input['tipo']??'', $input); break;
        case 'atualizar':               atualizar($db, $input['tipo']??'', $input); break;
        case 'listar_favoritos':        listarFavoritos($db, $input); break;
        case 'salvar_favorito':         salvarFavorito($db, $input['data']??[]); break;
        case 'excluir_favorito':        excluirFavorito($db, $input['id']); break;
        case 'salvar_anotacao_versiculo': salvarAnotacaoVersiculo($db, $input); break;
        case 'buscar_anotacao_versiculo': buscarAnotacaoVersiculo($db, $input); break;
        case 'salvar_anotacao_capitulo':  salvarAnotacaoCapitulo($db, $input); break;
        case 'buscar_anotacao_capitulo':  buscarAnotacaoCapitulo($db, $input); break;
        case 'listar_anotacoes_livro':    listarAnotacoesLivro($db, $input); break;
        case 'listar_estudos':          listarEstudos($db); break;
        case 'salvar_estudo':           salvarEstudo($db, $input['data']??[]); break;
        case 'excluir_estudo':          excluirEstudo($db, $input['id']); break;
        case 'atualizar_estudo':        atualizarEstudo($db, $input); break;
        case 'trocar_senha':            trocarSenha($db, $input); break;
        default: responder(['erro' => "Ação desconhecida: $acao"], 400);
    }
} catch (Exception $e) { responder(['erro' => $e->getMessage()], 500); }

function listar(PDO $db) {
    $escalas = $db->query("SELECT * FROM escalas ORDER BY data ASC")->fetchAll(PDO::FETCH_ASSOC);
    $tarefas = $db->query("SELECT * FROM tarefas ORDER BY prazo ASC NULLS LAST")->fetchAll(PDO::FETCH_ASSOC);
    $servos  = $db->query("SELECT * FROM servos ORDER BY nome ASC")->fetchAll(PDO::FETCH_ASSOC);
    responder(['escalas'=>$escalas,'tarefas'=>$tarefas,'servos'=>$servos]);
}
function salvar(PDO $db, string $tipo, array $d) {
    switch ($tipo) {
        case 'escala':
            $db->prepare("INSERT INTO escalas (data,operador,telefone,musicas,obs) VALUES (?,?,?,?,?)")
               ->execute([$d['data'],$d['operador'],$d['telefone']??null,$d['musicas']??null,$d['obs']??null]);
            break;
        case 'tarefa':
            $db->prepare("INSERT INTO tarefas (tarefa,prazo,status) VALUES (?,?,?)")
               ->execute([$d['tarefa'],$d['prazo']?:null,$d['status']??'pendente']);
            break;
        case 'servo':
            $db->prepare("INSERT INTO servos (nome,telefone,funcao,email,aniversario) VALUES (?,?,?,?,?)")
               ->execute([$d['nome'],$d['telefone']??null,$d['funcao']??null,$d['email']??null,$d['aniversario']?:null]);
            break;
        default: responder(['erro'=>"Tipo desconhecido: $tipo"],400);
    }
    responder(['sucesso'=>true,'id'=>$db->lastInsertId()]);
}
function excluir(PDO $db, string $tipo, array $input) {
    $tabela=['escala'=>'escalas','tarefa'=>'tarefas','servo'=>'servos'][$tipo]??null;
    if(!$tabela) responder(['erro'=>"Tipo inválido"],400);
    $db->prepare("DELETE FROM $tabela WHERE id=?")->execute([$input['id']]);
    responder(['sucesso'=>true]);
}
function atualizar(PDO $db, string $tipo, array $input) {
    if($tipo==='tarefa_status') $db->prepare("UPDATE tarefas SET status=? WHERE id=?")->execute([$input['status'],$input['id']]);
    responder(['sucesso'=>true]);
}
function listarFavoritos(PDO $db, array $input) {
    $cat=$input['categoria']??null;
    if($cat&&$cat!=='todas') { $st=$db->prepare("SELECT * FROM favoritos WHERE categoria=? ORDER BY criado_em DESC"); $st->execute([$cat]); }
    else $st=$db->query("SELECT * FROM favoritos ORDER BY criado_em DESC");
    $cats=$db->query("SELECT DISTINCT categoria FROM favoritos ORDER BY categoria")->fetchAll(PDO::FETCH_COLUMN);
    responder(['favoritos'=>$st->fetchAll(PDO::FETCH_ASSOC),'categorias'=>$cats]);
}
function salvarFavorito(PDO $db, array $d) {
    $st=$db->prepare("SELECT id FROM favoritos WHERE livro=? AND capitulo=? AND versiculo=?");
    $st->execute([$d['livro'],$d['capitulo'],$d['versiculo']]);
    if($st->fetch()) responder(['erro'=>'Versículo já está nos favoritos'],400);
    $db->prepare("INSERT INTO favoritos (referencia,livro,capitulo,versiculo,texto,anotacao,categoria) VALUES (?,?,?,?,?,?,?)")
       ->execute([$d['referencia'],$d['livro'],$d['capitulo'],$d['versiculo'],$d['texto'],$d['anotacao']??null,$d['categoria']??'geral']);
    responder(['sucesso'=>true,'id'=>$db->lastInsertId()]);
}
function excluirFavorito(PDO $db, $id) { $db->prepare("DELETE FROM favoritos WHERE id=?")->execute([$id]); responder(['sucesso'=>true]); }

function salvarAnotacaoVersiculo(PDO $db, array $input) {
    $db->prepare("INSERT INTO anotacoes_versiculo (livro,capitulo,versiculo,texto) VALUES (?,?,?,?) ON CONFLICT (livro,capitulo,versiculo) DO UPDATE SET texto=EXCLUDED.texto, atualizado_em=NOW()")
       ->execute([$input['livro'],$input['capitulo'],$input['versiculo'],$input['texto']]);
    responder(['sucesso'=>true]);
}
function buscarAnotacaoVersiculo(PDO $db, array $input) {
    $st=$db->prepare("SELECT texto FROM anotacoes_versiculo WHERE livro=? AND capitulo=? AND versiculo=?");
    $st->execute([$input['livro'],$input['capitulo'],$input['versiculo']]);
    $row=$st->fetch(PDO::FETCH_ASSOC);
    responder(['texto'=>$row['texto']??'']);
}
function salvarAnotacaoCapitulo(PDO $db, array $input) {
    $db->prepare("INSERT INTO anotacoes_capitulo (livro,capitulo,texto) VALUES (?,?,?) ON CONFLICT (livro,capitulo) DO UPDATE SET texto=EXCLUDED.texto, atualizado_em=NOW()")
       ->execute([$input['livro'],$input['capitulo'],$input['texto']]);
    responder(['sucesso'=>true]);
}
function buscarAnotacaoCapitulo(PDO $db, array $input) {
    $st=$db->prepare("SELECT texto FROM anotacoes_capitulo WHERE livro=? AND capitulo=?");
    $st->execute([$input['livro'],$input['capitulo']]);
    $row=$st->fetch(PDO::FETCH_ASSOC);
    responder(['texto'=>$row['texto']??'']);
}
function listarAnotacoesLivro(PDO $db, array $input) {
    $st=$db->prepare("SELECT capitulo, versiculo FROM anotacoes_versiculo WHERE livro=?");
    $st->execute([$input['livro']]);
    $versinhos=$st->fetchAll(PDO::FETCH_ASSOC);
    $st2=$db->prepare("SELECT capitulo FROM anotacoes_capitulo WHERE livro=?");
    $st2->execute([$input['livro']]);
    $caps=$st2->fetchAll(PDO::FETCH_COLUMN);
    responder(['versiculos'=>$versinhos,'capitulos'=>$caps]);
}
function listarEstudos(PDO $db) { responder(['estudos'=>$db->query("SELECT * FROM estudos ORDER BY atualizado_em DESC")->fetchAll(PDO::FETCH_ASSOC)]); }
function salvarEstudo(PDO $db, array $d) {
    $db->prepare("INSERT INTO estudos (titulo,conteudo,versiculo_base,texto_base,categoria) VALUES (?,?,?,?,?)")
       ->execute([$d['titulo'],$d['conteudo']??null,$d['versiculo_base']??null,$d['texto_base']??null,$d['categoria']??'geral']);
    responder(['sucesso'=>true,'id'=>$db->lastInsertId()]);
}
function excluirEstudo(PDO $db, $id) { $db->prepare("DELETE FROM estudos WHERE id=?")->execute([$id]); responder(['sucesso'=>true]); }
function atualizarEstudo(PDO $db, array $input) {
    $d=$input['data']??[];
    $db->prepare("UPDATE estudos SET titulo=?,conteudo=?,versiculo_base=?,texto_base=?,categoria=?,atualizado_em=NOW() WHERE id=?")
       ->execute([$d['titulo'],$d['conteudo']??null,$d['versiculo_base']??null,$d['texto_base']??null,$d['categoria']??'geral',$input['id']]);
    responder(['sucesso'=>true]);
}
function trocarSenha(PDO $db, array $input) {
    $token=getToken();
    $st=$db->prepare("SELECT usuario FROM tokens WHERE token=?"); $st->execute([$token]);
    $usuario=$st->fetchColumn();
    $st2=$db->prepare("SELECT senha FROM usuarios WHERE usuario=?"); $st2->execute([$usuario]);
    $user=$st2->fetch(PDO::FETCH_ASSOC);
    if(!$user||!password_verify($input['senha_atual']??'',$user['senha'])) responder(['erro'=>'Senha atual incorreta'],400);
    $db->prepare("UPDATE usuarios SET senha=? WHERE usuario=?")->execute([password_hash($input['senha_nova']??'',PASSWORD_DEFAULT),$usuario]);
    responder(['sucesso'=>true]);
}
function responder(array $dados, int $status=200) { http_response_code($status); echo json_encode($dados,JSON_UNESCAPED_UNICODE); exit(); }
