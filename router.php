<?php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (str_starts_with($uri, '/api')) {
    require __DIR__ . '/api/index.php';
    return true;
}
if ($uri !== '/' && file_exists(__DIR__ . $uri)) return false;
require __DIR__ . '/index.html';
