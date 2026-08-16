<?php
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

$body = json_input();
$email = trim(strtolower($body['email'] ?? ''));
$password = $body['password'] ?? '';

$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    json_response(['error' => 'Incorrect email or password'], 401);
}

$_SESSION['user_id'] = $user['id'];
json_response(['id' => $user['id'], 'name' => $user['name'], 'email' => $user['email']]);
