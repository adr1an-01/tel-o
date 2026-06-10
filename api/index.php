<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$dbPath = __DIR__ . '/../db/central.db';
$db = new SQLite3($dbPath);
$db->enableExceptions(true);

$db->exec("
    CREATE TABLE IF NOT EXISTS escalas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        operador TEXT NOT NULL,
        telefone TEXT,
        musicas TEXT,
        obs TEXT
    );
    CREATE TABLE IF NOT EXISTS tarefas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tarefa TEXT NOT NULL,
        prazo TEXT
    );
    CREATE TABLE IF NOT EXISTS servos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        telefone TEXT,
        funcao TEXT
    );
");

// Migração: adicionar coluna obs se não existir
try { $db->exec("ALTER TABLE escalas ADD COLUMN obs TEXT"); } catch (Exception $e) {}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) responder(['erro' => 'JSON inválido'], 400);

$acao = $input['acao'] ?? '';
$tipo = $input['tipo'] ?? '';

try {
    switch ($acao) {
        case 'listar':   listar($db); break;
        case 'salvar':   salvar($db, $tipo, $input['data'] ?? []); break;
        case 'excluir':  excluir($db, $tipo, $input); break;
        default: responder(['erro' => "Ação desconhecida: $acao"], 400);
    }
} catch (Exception $e) {
    responder(['erro' => $e->getMessage()], 500);
}

function listar($db) {
    $escalas = [];
    $res = $db->query("SELECT * FROM escalas ORDER BY data ASC");
    while ($row = $res->fetchArray(SQLITE3_ASSOC)) $escalas[] = $row;

    $tarefas = [];
    $res = $db->query("SELECT * FROM tarefas ORDER BY prazo ASC");
    while ($row = $res->fetchArray(SQLITE3_ASSOC)) $tarefas[] = $row;

    $servos = [];
    $res = $db->query("SELECT * FROM servos ORDER BY nome ASC");
    while ($row = $res->fetchArray(SQLITE3_ASSOC)) $servos[] = $row;

    responder(['escalas' => $escalas, 'tarefas' => $tarefas, 'servos' => $servos]);
}

function salvar($db, $tipo, $data) {
    switch ($tipo) {
        case 'escala':
            $stmt = $db->prepare("INSERT INTO escalas (data, operador, telefone, musicas, obs) VALUES (:data, :operador, :telefone, :musicas, :obs)");
            $stmt->bindValue(':data',     $data['data']     ?? '');
            $stmt->bindValue(':operador', $data['operador'] ?? '');
            $stmt->bindValue(':telefone', $data['telefone'] ?? '');
            $stmt->bindValue(':musicas',  $data['musicas']  ?? '');
            $stmt->bindValue(':obs',      $data['obs']      ?? '');
            $stmt->execute();
            responder(['sucesso' => true, 'id' => $db->lastInsertRowID()]);
            break;
        case 'tarefa':
            $stmt = $db->prepare("INSERT INTO tarefas (tarefa, prazo) VALUES (:tarefa, :prazo)");
            $stmt->bindValue(':tarefa', $data['tarefa'] ?? '');
            $stmt->bindValue(':prazo',  $data['prazo']  ?? '');
            $stmt->execute();
            responder(['sucesso' => true, 'id' => $db->lastInsertRowID()]);
            break;
        case 'servo':
            $stmt = $db->prepare("INSERT INTO servos (nome, telefone, funcao) VALUES (:nome, :telefone, :funcao)");
            $stmt->bindValue(':nome',     $data['nome']     ?? '');
            $stmt->bindValue(':telefone', $data['telefone'] ?? '');
            $stmt->bindValue(':funcao',   $data['funcao']   ?? '');
            $stmt->execute();
            responder(['sucesso' => true, 'id' => $db->lastInsertRowID()]);
            break;
        default: responder(['erro' => "Tipo desconhecido: $tipo"], 400);
    }
}

function excluir($db, $tipo, $input) {
    switch ($tipo) {
        case 'escala':
            $stmt = $db->prepare("DELETE FROM escalas WHERE data = :data AND operador = :operador");
            $stmt->bindValue(':data',     $input['data'] ?? '');
            $stmt->bindValue(':operador', $input['nome'] ?? '');
            $stmt->execute();
            responder(['sucesso' => true, 'removidos' => $db->changes()]);
            break;
        case 'tarefa':
            $stmt = $db->prepare("DELETE FROM tarefas WHERE tarefa = :tarefa AND prazo = :prazo");
            $stmt->bindValue(':tarefa', $input['tarefa'] ?? '');
            $stmt->bindValue(':prazo',  $input['dados']  ?? '');
            $stmt->execute();
            responder(['sucesso' => true, 'removidos' => $db->changes()]);
            break;
        case 'servo':
            $stmt = $db->prepare("DELETE FROM servos WHERE id = :id");
            $stmt->bindValue(':id', (int)($input['id'] ?? 0));
            $stmt->execute();
            responder(['sucesso' => true, 'removidos' => $db->changes()]);
            break;
        default: responder(['erro' => "Tipo desconhecido: $tipo"], 400);
    }
}

function responder($dados, $status = 200) {
    http_response_code($status);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit();
}
