<?php
require_once __DIR__ . '/../config.php';
$userId = require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Method not allowed'], 405);
}

$stmt = $pdo->prepare(
    'SELECT name, pet_name, water_goal, dark_mode, points, equipped_accessory
     FROM users WHERE id = ?'
);
$stmt->execute([$userId]);
$user = $stmt->fetch();

$care = compute_care_score($pdo, $userId);

json_response(['user' => $user, 'care' => $care]);
