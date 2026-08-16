<?php
require_once __DIR__ . '/../config.php';
$userId = require_login();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

function habit_streak($pdo, $habitId) {
    $stmt = $pdo->prepare('SELECT completed_date FROM habit_completions WHERE habit_id = ?');
    $stmt->execute([$habitId]);
    $dates = array_column($stmt->fetchAll(), 'completed_date');
    $set = array_flip($dates);

    $cursor = new DateTime();
    if (!isset($set[$cursor->format('Y-m-d')])) {
        $cursor->modify('-1 day');
    }
    $streak = 0;
    while (isset($set[$cursor->format('Y-m-d')])) {
        $streak++;
        $cursor->modify('-1 day');
    }
    return $streak;
}

if ($method === 'GET') {
    $stmt = $pdo->prepare('SELECT id, name FROM habits WHERE user_id = ? ORDER BY id');
    $stmt->execute([$userId]);
    $habits = $stmt->fetchAll();
    $today = today();

    foreach ($habits as &$h) {
        $c = $pdo->prepare('SELECT 1 FROM habit_completions WHERE habit_id = ? AND completed_date = ?');
        $c->execute([$h['id'], $today]);
        $h['doneToday'] = (bool) $c->fetch();
        $h['streak'] = habit_streak($pdo, $h['id']);
    }
    unset($h);

    json_response(['habits' => $habits]);
}

if ($method === 'POST' && $action === 'add') {
    $body = json_input();
    $name = trim($body['name'] ?? '');
    if ($name === '') json_response(['error' => 'Habit name required'], 422);

    $pdo->prepare('INSERT INTO habits (user_id, name) VALUES (?, ?)')->execute([$userId, $name]);
    json_response(['id' => (int) $pdo->lastInsertId()]);
}

if ($method === 'POST' && $action === 'toggle') {
    $body = json_input();
    $habitId = (int) ($body['id'] ?? 0);

    $stmt = $pdo->prepare('SELECT id FROM habits WHERE id = ? AND user_id = ?');
    $stmt->execute([$habitId, $userId]);
    if (!$stmt->fetch()) json_response(['error' => 'Habit not found'], 404);

    $today = today();
    $c = $pdo->prepare('SELECT 1 FROM habit_completions WHERE habit_id = ? AND completed_date = ?');
    $c->execute([$habitId, $today]);

    if ($c->fetch()) {
        $pdo->prepare('DELETE FROM habit_completions WHERE habit_id = ? AND completed_date = ?')
            ->execute([$habitId, $today]);
        add_points($pdo, $userId, -10);
        json_response(['done' => false]);
    } else {
        $pdo->prepare('INSERT INTO habit_completions (habit_id, completed_date) VALUES (?, ?)')
            ->execute([$habitId, $today]);
        add_points($pdo, $userId, 10);
        json_response(['done' => true]);
    }
}

if ($method === 'POST' && $action === 'delete') {
    $body = json_input();
    $habitId = (int) ($body['id'] ?? 0);
    $pdo->prepare('DELETE FROM habits WHERE id = ? AND user_id = ?')->execute([$habitId, $userId]);
    json_response(['ok' => true]);
}

json_response(['error' => 'Not found'], 404);
