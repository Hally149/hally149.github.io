<?php
/**
 * Shared bootstrap: session, DB connection, and helper functions.
 * Every auth/ and api/ script starts with: require_once __DIR__ . '/../config.php';
 */

session_start();
header('Content-Type: application/json');

// Reflect the request origin (needed if the frontend is ever served from a
// different port/host than the backend during local dev). Same-origin
// deployments don't strictly need this, but it's safe to leave in.
if (!empty($_SERVER['HTTP_ORIGIN'])) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---------- database ----------

$DB_HOST = 'localhost';
$DB_NAME = 'sprout_app';
$DB_USER = 'root';
$DB_PASS = '';

try {
    $pdo = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// ---------- request / response helpers ----------

function json_input() {
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

function json_response($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function require_login() {
    if (empty($_SESSION['user_id'])) {
        json_response(['error' => 'Not authenticated'], 401);
    }
    return $_SESSION['user_id'];
}

// ---------- date helpers ----------

function today() { return date('Y-m-d'); }
function yesterday() { return date('Y-m-d', strtotime('-1 day')); }

// ---------- points / rewards ----------

function add_points($pdo, $userId, $delta) {
    $stmt = $pdo->prepare('UPDATE users SET points = GREATEST(0, points + ?) WHERE id = ?');
    $stmt->execute([$delta, $userId]);
}

/**
 * Awards a once-per-day bonus for $key ('water' | 'mood' | 'sleep').
 * Returns true the first time it's called for that key today, false after.
 * $key is never taken from user input — only call with a literal from the whitelist below.
 */
function mark_awarded_once($pdo, $userId, $key) {
    $allowed = ['water', 'mood', 'sleep'];
    if (!in_array($key, $allowed, true)) return false;

    $date = today();
    $stmt = $pdo->prepare("SELECT $key FROM daily_awards WHERE user_id = ? AND award_date = ?");
    $stmt->execute([$userId, $date]);
    $row = $stmt->fetch();

    if ($row && $row[$key]) return false;

    if (!$row) {
        $pdo->prepare('INSERT IGNORE INTO daily_awards (user_id, award_date) VALUES (?, ?)')
            ->execute([$userId, $date]);
    }
    $pdo->prepare("UPDATE daily_awards SET $key = 1 WHERE user_id = ? AND award_date = ?")
        ->execute([$userId, $date]);
    return true;
}

function unlock_bowl_if_needed($pdo, $userId) {
    $stmt = $pdo->prepare('SELECT 1 FROM user_accessories WHERE user_id = ? AND accessory_id = "bowl"');
    $stmt->execute([$userId]);
    if ($stmt->fetch()) return false;

    $pdo->prepare('INSERT INTO user_accessories (user_id, accessory_id) VALUES (?, "bowl")')
        ->execute([$userId]);
    return true;
}

// ---------- companion care score ----------
// Mirrors the original client-side formula: water 30%, mood 25%, sleep 20%, habits 25%.

function compute_care_score($pdo, $userId) {
    $stmt = $pdo->prepare('SELECT water_goal FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $goal = (int) $stmt->fetchColumn();
    if ($goal <= 0) $goal = 8;

    $stmt = $pdo->prepare('SELECT cups FROM water_log WHERE user_id = ? AND log_date = ?');
    $stmt->execute([$userId, today()]);
    $cups = (int) ($stmt->fetchColumn() ?: 0);
    $waterPart = min($cups / $goal, 1) * 30;

    $stmt = $pdo->prepare('SELECT value FROM mood_entries WHERE user_id = ? AND entry_date = ?');
    $stmt->execute([$userId, today()]);
    $moodVal = $stmt->fetchColumn();
    $moodPart = ($moodVal !== false) ? ($moodVal / 5) * 25 : 10;

    $stmt = $pdo->prepare('SELECT hours FROM sleep_log WHERE user_id = ? AND log_date = ?');
    $stmt->execute([$userId, yesterday()]);
    $hours = $stmt->fetchColumn();
    $sleepPart = 10;
    if ($hours !== false) {
        $sleepPart = $hours >= 7 ? 20 : ($hours >= 5 ? 12 : 4);
    }

    $stmt = $pdo->prepare('SELECT COUNT(*) FROM habits WHERE user_id = ?');
    $stmt->execute([$userId]);
    $totalHabits = (int) $stmt->fetchColumn();
    if ($totalHabits === 0) $totalHabits = 1;

    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM habit_completions hc
         JOIN habits h ON h.id = hc.habit_id
         WHERE h.user_id = ? AND hc.completed_date = ?'
    );
    $stmt->execute([$userId, today()]);
    $doneHabits = (int) $stmt->fetchColumn();
    $habitPart = ($doneHabits / $totalHabits) * 25;

    $score = (int) round($waterPart + $moodPart + $sleepPart + $habitPart);
    $score = max(0, min(100, $score));

    $label = 'Needs care';
    $mood = 'sad';
    if ($score >= 70) { $label = 'Thriving'; $mood = 'happy'; }
    elseif ($score >= 40) { $label = 'Content'; $mood = 'neutral'; }

    return [
        'score' => $score,
        'label' => $label,
        'mood' => $mood,
        'water' => ['cups' => $cups, 'goal' => $goal],
        'moodValue' => $moodVal !== false ? (int) $moodVal : null,
        'sleepHours' => $hours !== false ? (float) $hours : null,
        'habits' => ['done' => $doneHabits, 'total' => $totalHabits],
    ];
}
