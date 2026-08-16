<?php
require_once __DIR__ . '/../config.php';
$userId = require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

$pdo->prepare('DELETE FROM mood_entries WHERE user_id = ?')->execute([$userId]);
$pdo->prepare('DELETE FROM water_log WHERE user_id = ?')->execute([$userId]);
$pdo->prepare('DELETE FROM sleep_log WHERE user_id = ?')->execute([$userId]);
$pdo->prepare('DELETE FROM workouts WHERE user_id = ?')->execute([$userId]);
$pdo->prepare('DELETE FROM meals WHERE user_id = ?')->execute([$userId]);
$pdo->prepare('DELETE FROM habit_completions WHERE habit_id IN (SELECT id FROM habits WHERE user_id = ?)')->execute([$userId]);
$pdo->prepare('DELETE FROM habits WHERE user_id = ?')->execute([$userId]);
$pdo->prepare('DELETE FROM user_accessories WHERE user_id = ?')->execute([$userId]);
$pdo->prepare('DELETE FROM daily_awards WHERE user_id = ?')->execute([$userId]);
$pdo->prepare('UPDATE users SET points = 0, equipped_accessory = NULL, pet_name = "Pip", water_goal = 8 WHERE id = ?')
    ->execute([$userId]);

$defaults = ['Drink water', 'Move your body', 'Journal a little', 'Get some sunlight'];
$stmt = $pdo->prepare('INSERT INTO habits (user_id, name) VALUES (?, ?)');
foreach ($defaults as $h) {
    $stmt->execute([$userId, $h]);
}

json_response(['ok' => true]);
