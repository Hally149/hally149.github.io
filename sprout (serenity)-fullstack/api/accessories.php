<?php
require_once __DIR__ . '/../config.php';
$userId = require_login();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET') {
    $stmt = $pdo->query('SELECT id, name, emoji, unlock_type, cost FROM accessories');
    $all = $stmt->fetchAll();

    $stmt = $pdo->prepare('SELECT accessory_id FROM user_accessories WHERE user_id = ?');
    $stmt->execute([$userId]);
    $unlocked = array_column($stmt->fetchAll(), 'accessory_id');

    $stmt = $pdo->prepare('SELECT equipped_accessory, points FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    foreach ($all as &$a) {
        $a['unlocked'] = in_array($a['id'], $unlocked, true);
        $a['equipped'] = ($a['id'] === $user['equipped_accessory']);
    }
    unset($a);

    json_response(['accessories' => $all, 'points' => (int) $user['points']]);
}

if ($method === 'POST' && $action === 'unlock') {
    $body = json_input();
    $id = $body['id'] ?? '';

    $stmt = $pdo->prepare('SELECT * FROM accessories WHERE id = ?');
    $stmt->execute([$id]);
    $acc = $stmt->fetch();
    if (!$acc || $acc['unlock_type'] !== 'points') {
        json_response(['error' => 'This item cannot be unlocked with points'], 422);
    }

    $stmt = $pdo->prepare('SELECT 1 FROM user_accessories WHERE user_id = ? AND accessory_id = ?');
    $stmt->execute([$userId, $id]);
    if ($stmt->fetch()) json_response(['error' => 'Already unlocked'], 409);

    $stmt = $pdo->prepare('SELECT points FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $points = (int) $stmt->fetchColumn();
    if ($points < $acc['cost']) json_response(['error' => 'Not enough points'], 422);

    add_points($pdo, $userId, -$acc['cost']);
    $pdo->prepare('INSERT INTO user_accessories (user_id, accessory_id) VALUES (?, ?)')
        ->execute([$userId, $id]);

    json_response(['ok' => true]);
}

if ($method === 'POST' && $action === 'equip') {
    $body = json_input();
    $id = $body['id'] ?? null;

    if ($id !== null) {
        $stmt = $pdo->prepare('SELECT 1 FROM user_accessories WHERE user_id = ? AND accessory_id = ?');
        $stmt->execute([$userId, $id]);
        if (!$stmt->fetch()) json_response(['error' => 'Not unlocked yet'], 422);
    }

    $stmt = $pdo->prepare('SELECT equipped_accessory FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $current = $stmt->fetchColumn();
    $newVal = ($current === $id) ? null : $id;

    $pdo->prepare('UPDATE users SET equipped_accessory = ? WHERE id = ?')->execute([$newVal, $userId]);
    json_response(['equipped' => $newVal]);
}

json_response(['error' => 'Not found'], 404);
