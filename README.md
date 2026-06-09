# Central de Controle

Sistema de gestão de voluntários, escalas de telão e tarefas.

## Stack
- **Frontend**: HTML5, CSS3, JavaScript Vanilla
- **Backend**: PHP 8.3 (built-in server)
- **Banco de Dados**: SQLite (arquivo `db/central.db`, criado automaticamente)
- **Hospedagem**: Railway

## Estrutura de Ficheiros
```
/
├── index.html          ← Interface principal
├── style.css           ← Estilos
├── app.js              ← Lógica do frontend (fetch → /api)
├── router.php          ← Roteador PHP (Railway usa este como entry point)
├── nixpacks.toml       ← Configuração de build para o Railway
├── api/
│   └── index.php       ← API REST (listar / salvar / excluir)
└── db/
    └── central.db      ← SQLite (criado automaticamente no primeiro boot)
```

## Deploy no Railway

1. Faz push deste repositório para o GitHub
2. No Railway: **New Project → Deploy from GitHub Repo**
3. Seleciona o repositório
4. O Railway detecta o `nixpacks.toml` e configura PHP + SQLite automaticamente
5. Em **Settings → Start Command**, confirma que está:
   ```
   php -S 0.0.0.0:$PORT -t /app router.php
   ```
6. Pronto ✦

## API — Referência

Todos os pedidos são `POST /api` com `Content-Type: application/json`.

### Listar tudo
```json
{ "acao": "listar" }
```
Retorna: `{ escalas: [...], tarefas: [...], servos: [...] }`

### Salvar Escala
```json
{ "acao": "salvar", "tipo": "escala", "data": { "data": "2025-06-15", "operador": "João", "telefone": "...", "musicas": "..." } }
```

### Salvar Tarefa
```json
{ "acao": "salvar", "tipo": "tarefa", "data": { "tarefa": "Descrição", "prazo": "2025-06-20" } }
```

### Salvar Servo
```json
{ "acao": "salvar", "tipo": "servo", "data": { "nome": "Maria", "telefone": "...", "funcao": "Operadora" } }
```

### Excluir Escala
```json
{ "acao": "excluir", "tipo": "escala", "data": "2025-06-15", "nome": "João" }
```

### Excluir Tarefa
```json
{ "acao": "excluir", "tipo": "tarefa", "tarefa": "Descrição", "dados": "2025-06-20" }
```

### Excluir Servo
```json
{ "acao": "excluir", "tipo": "servo", "id": 3 }
```
