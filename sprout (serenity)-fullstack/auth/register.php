<?php
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

$body = json_input();
$name = trim($body['name'] ?? '');
$email = trim(strtolower($body['email'] ?? ''));
$password = $body['password'] ?? '';

if ($name === '' || $email === '' || strlen($password) < 6) {
    json_response(['error' => 'Name, a valid email, and a password of at least 6 characters are required'], 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['error' => 'Please enter a valid email address'], 422);
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    json_response(['error' => 'An account with that email already exists'], 409);
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
$stmt->execute([$name, $email, $hash]);
$userId = (int) $pdo->lastInsertId();

$defaults = ['Drink water', 'Move your body', 'Journal a little', 'Get some sunlight'];
$stmt = $pdo->prepare('INSERT INTO habits (user_id, name) VALUES (?, ?)');
foreach ($defaults as $h) {
    $stmt->execute([$userId, $h]);
}

$_SESSION['user_id'] = $userId;
json_response(['id' => $userId, 'name' => $name, 'email' => $email]);
