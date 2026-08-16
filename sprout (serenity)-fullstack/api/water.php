<?php
require_once __DIR__ . '/../config.php';
$userId = require_login();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT log_date, cups FROM water_log
         WHERE user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
         ORDER BY log_date'
    );
    $stmt->execute([$userId]);
    json_response(['history' => $stmt->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_input();
    $delta = isset($body['delta']) ? (int) $body['delta'] : 0;
    $date = today();

    $stmt = $pdo->prepare('SELECT cups FROM water_log WHERE user_id = ? AND log_date = ?');
    $stmt->execute([$userId, $date]);
    $row = $stmt->fetch();
    $current = $row ? (int) $row['cups'] : 0;
    $next = max(0, $current + $delta);

    if ($row) {
        $pdo->prepare('UPDATE water_log SET cups = ? WHERE user_id = ? AND log_date = ?')
            ->execute([$next, $userId, $date]);
    } else {
        $pdo->prepare('INSERT INTO water_log (user_id, log_date, cups) VALUES (?, ?, ?)')
            ->execute([$userId, $date, $next]);
    }

    $stmt = $pdo->prepare('SELECT water_goal FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $goal = (int) $stmt->fetchColumn();

    $awarded = false;
    $bowlUnlocked = false;
    if ($delta > 0 && $next >= $goal) {
        if (mark_awarded_once($pdo, $userId, 'water')) {
            add_points($pdo, $userId, 10);
            $awarded = true;
            $bowlUnlocked = unlock_bowl_if_needed($pdo, $userId);
        }
    }

    json_response([
        'cups' => $next,
        'goal' => $goal,
        'awarded' => $awarded,
        'bowlUnlocked' => $bowlUnlocked,
    ]);
}

json_response(['error' => 'Method not allowed'], 405);
