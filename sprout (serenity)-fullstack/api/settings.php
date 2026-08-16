<?php
require_once __DIR__ . '/../config.php';
$userId = require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

$body = json_input();
$fields = [];
$values = [];

if (isset($body['petName'])) {
    $name = trim($body['petName']);
    if ($name !== '') { $fields[] = 'pet_name = ?'; $values[] = $name; }
}
if (isset($body['waterGoal'])) {
    $fields[] = 'water_goal = ?';
    $values[] = max(1, (int) $body['waterGoal']);
}
if (isset($body['darkMode'])) {
    $fields[] = 'dark_mode = ?';
    $values[] = $body['darkMode'] ? 1 : 0;
}

if (empty($fields)) {
    json_response(['error' => 'Nothing to update'], 422);
}

$values[] = $userId;
$pdo->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($values);
json_response(['ok' => true]);
