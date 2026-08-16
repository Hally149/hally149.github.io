<?php
require_once __DIR__ . '/../config.php';
$userId = require_login();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT entry_date, value, note FROM mood_entries
         WHERE user_id = ? AND entry_date >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
         ORDER BY entry_date'
    );
    $stmt->execute([$userId]);
    json_response(['entries' => $stmt->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_input();
    $value = (int) ($body['value'] ?? 0);
    $note = trim($body['note'] ?? '');

    if ($value < 1 || $value > 5) {
        json_response(['error' => 'Mood value must be between 1 and 5'], 422);
    }

    $date = today();
    $stmt = $pdo->prepare('SELECT id FROM mood_entries WHERE user_id = ? AND entry_date = ?');
    $stmt->execute([$userId, $date]);

    if ($stmt->fetch()) {
        $pdo->prepare('UPDATE mood_entries SET value = ?, note = ? WHERE user_id = ? AND entry_date = ?')
            ->execute([$value, $note, $userId, $date]);
    } else {
        $pdo->prepare('INSERT INTO mood_entries (user_id, entry_date, value, note) VALUES (?, ?, ?, ?)')
            ->execute([$userId, $date, $value, $note]);
    }

    $awarded = false;
    if (mark_awarded_once($pdo, $userId, 'mood')) {
        add_points($pdo, $userId, 5);
        $awarded = true;
    }

    json_response(['ok' => true, 'awarded' => $awarded]);
}

json_response(['error' => 'Method not allowed'], 405);
