<?php
// Router para o servidor built-in do PHP
// Railway usa: php -S 0.0.0.0:$PORT -t /app router.php

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Rotear chamadas de API
if (str_starts_with($uri, '/api')) {
    require __DIR__ . '/api/index.php';
    return true;
}

// Servir arquivos estáticos (css, js, imagens)
if ($uri !== '/' && file_exists(__DIR__ . $uri)) {
    return false; // Deixa o servidor built-in servir o arquivo
}

// Tudo o mais → index.html (SPA)
require __DIR__ . '/index.html';
