<?php
require_once __DIR__ . '/../config.php';
$userId = require_login();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT id, log_date, name, type FROM meals
         WHERE user_id = ? ORDER BY id DESC LIMIT 20'
    );
    $stmt->execute([$userId]);
    json_response(['meals' => $stmt->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_input();
    $name = trim($body['name'] ?? '');
    $type = in_array($body['type'] ?? '', ['Breakfast', 'Lunch', 'Dinner', 'Snack'], true) ? $body['type'] : 'Snack';

    if ($name === '') {
        json_response(['error' => 'Enter what you ate'], 422);
    }

    $pdo->prepare('INSERT INTO meals (user_id, log_date, name, type) VALUES (?, ?, ?, ?)')
        ->execute([$userId, today(), $name, $type]);
    add_points($pdo, $userId, 5);

    json_response(['ok' => true, 'points' => 5]);
}

json_response(['error' => 'Method not allowed'], 405);
