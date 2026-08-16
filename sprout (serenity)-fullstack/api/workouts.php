<?php
require_once __DIR__ . '/../config.php';
$userId = require_login();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT id, log_date, type, duration FROM workouts
         WHERE user_id = ? ORDER BY id DESC LIMIT 20'
    );
    $stmt->execute([$userId]);
    json_response(['workouts' => $stmt->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_input();
    $type = trim($body['type'] ?? 'Other');
    $duration = (int) ($body['duration'] ?? 0);

    if ($duration <= 0) {
        json_response(['error' => 'Enter a valid duration'], 422);
    }

    $pdo->prepare('INSERT INTO workouts (user_id, log_date, type, duration) VALUES (?, ?, ?, ?)')
        ->execute([$userId, today(), $type, $duration]);
    add_points($pdo, $userId, 15);

    json_response(['ok' => true, 'points' => 15]);
}

json_response(['error' => 'Method not allowed'], 405);
