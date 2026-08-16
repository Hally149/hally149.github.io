<?php
require_once __DIR__ . '/../config.php';

if (empty($_SESSION['user_id'])) {
    json_response(['authenticated' => false]);
}

$stmt = $pdo->prepare(
    'SELECT id, name, email, pet_name, water_goal, dark_mode, points, equipped_accessory
     FROM users WHERE id = ?'
);
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();

if (!$user) {
    json_response(['authenticated' => false]);
}

json_response(['authenticated' => true, 'user' => $user]);
