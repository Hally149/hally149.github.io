# Sprout — Full-Stack Setup (PHP + MySQL)

Everything in this folder is one webroot: the frontend (`index.html`, `style.css`,
`app.js`) and the backend (`auth/`, `api/`, `config.php`) are served together, so
there's no separate frontend/backend URL to configure.

## 1. Requirements
- PHP 8+ with the `pdo_mysql` extension
- MySQL or MariaDB

## 2. Create the database
```
mysql -u root -p < schema.sql
```
This creates the `sprout_app` database, all tables, and seeds the 7 accessories
(Fancy Water Bowl, Cozy Blanket, Sunglasses, Little Hat, Star Collar, Flower Crown,
Rainbow Scarf).

## 3. Configure the connection
Open `config.php` and set your credentials near the top:
```php
$DB_HOST = 'localhost';
$DB_NAME = 'sprout_app';
$DB_USER = 'root';
$DB_PASS = '';
```

## 4. Run it

**Option A — PHP's built-in server (quickest for testing):**
```
php -S localhost:8000
```
Then open http://localhost:8000

**Option B — XAMPP / MAMP / a real Apache setup:**
Copy this whole folder into your `htdocs` (e.g. `htdocs/sprout`) and visit
`http://localhost/sprout`.

## 5. Using the app
- Sign up for an account on first visit (the auth screen).
- Every screen — Dashboard, Mood, Health, Nutrition, Habits, Companion, Settings —
  is now backed by your MySQL database instead of local browser storage, so your
  data follows you across devices and browsers.
- Default starter habits ("Drink water", "Move your body", "Journal a little",
  "Get some sunlight") are created automatically for each new account.

## How the pieces fit together
- `config.php` — DB connection + shared helpers (`json_response`, `require_login`,
  `add_points`, `compute_care_score`, etc.). Every other PHP file includes this first.
- `auth/` — register, login, logout, and a session check (`me.php`) the frontend
  calls on page load to decide whether to show the login screen or the app.
- `api/` — one file per resource (`water.php`, `mood.php`, `sleep.php`,
  `workouts.php`, `meals.php`, `habits.php`, `accessories.php`, `settings.php`,
  `reset.php`), plus `dashboard.php` which bundles everything the Dashboard and
  Companion screens need into a single request.
- Points and the companion's "care score" are computed **server-side** — the
  client never awards points itself, so it can't be tricked into granting extras
  by replaying a request.
- A `daily_awards` table stops the once-per-day bonuses (water goal, mood log,
  sleep log) from being farmed by saving the same entry over and over.

## Notes
- Sessions use PHP's built-in cookie-based sessions — no extra libraries needed.
- Passwords are hashed with `password_hash()` / verified with `password_verify()`.
- All queries use PDO prepared statements.
- This is a teaching/coursework-scale setup (no email verification, no password
  reset flow, no rate limiting) — solid to build on, not hardened for production.
