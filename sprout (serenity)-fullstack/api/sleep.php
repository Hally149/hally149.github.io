<?php
require_once __DIR__ . '/../config.php';
$userId = require_login();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT log_date, hours, quality FROM sleep_log
         WHERE user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
         ORDER BY log_date'
    );
    $stmt->execute([$userId]);
    json_response(['history' => $stmt->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_input();
    $hours = isset($body['hours']) ? (float) $body['hours'] : -1;
    $quality = in_array($body['quality'] ?? '', ['Poor', 'Okay', 'Great'], true) ? $body['quality'] : 'Okay';

    if ($hours < 0 || $hours > 24) {
        json_response(['error' => 'Enter a valid number of hours'], 422);
    }

    $date = yesterday();
    $stmt = $pdo->prepare('SELECT id FROM sleep_log WHERE user_id = ? AND log_date = ?');
    $stmt->execute([$userId, $date]);

    if ($stmt->fetch()) {
        $pdo->prepare('UPDATE sleep_log SET hours = ?, quality = ? WHERE user_id = ? AND log_date = ?')
            ->execute([$hours, $quality, $userId, $date]);
    } else {
        $pdo->prepare('INSERT INTO sleep_log (user_id, log_date, hours, quality) VALUES (?, ?, ?, ?)')
            ->execute([$userId, $date, $hours, $quality]);
    }

    $awarded = false;
    $pts = $hours >= 7 ? 10 : 5;
    if (mark_awarded_once($pdo, $userId, 'sleep')) {
        add_points($pdo, $userId, $pts);
        $awarded = true;
    }

    json_response(['ok' => true, 'awarded' => $awarded, 'points' => $awarded ? $pts : 0]);
}

json_response(['error' => 'Method not allowed'], 405);
