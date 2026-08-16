# Sprout — Quick Start Guide

A full-stack wellness companion app with PHP backend, MySQL database, and modern frontend.

## 🚀 Quick Setup (5 minutes)

### Prerequisites
- PHP 8+ installed
- MySQL/MariaDB installed and running
- A terminal/command prompt

### Step 1: Create the Database

Open your terminal and run:

```bash
mysql -u root -p < schema.sql
```

If you don't have a password set for MySQL root:

```bash
mysql -u root < schema.sql
```

**What this does:**
- Creates the `sprout_app` database
- Sets up all tables (users, moods, water logs, habits, etc.)
- Inserts 7 pre-defined accessories

### Step 2: Configure Database Connection

Open `config.php` and verify your credentials match:

```php
$DB_HOST = 'localhost';
$DB_NAME = 'sprout_app';
$DB_USER = 'root';
$DB_PASS = '';  // Add password if you have one
```

### Step 3: Start the Server

Navigate to the project folder in terminal:

```bash
cd /path/to/sprout-fullstack
```

Run PHP's built-in server:

```bash
php -S localhost:8000
```

**Output should show:**
```
Development Server started at http://127.0.0.1:8000
```

### Step 4: Open the App

Visit in your browser:

```
http://localhost:8000
```

You should see the **Sprout login screen**. ✨

---

## 👤 First Time Setup

1. **Click "Sign up"** on the auth screen
2. **Fill in:**
   - Name (any name)
   - Email (any valid email)
   - Password (6+ characters)
3. **Click "Create account"**
4. **Dashboard loads** — you're in!

You'll see 4 default habits auto-created:
- ✓ Drink water
- ✓ Move your body
- ✓ Journal a little
- ✓ Get some sunlight

---

## 📊 Feature Overview

### Dashboard
- Daily companion mood & care score
- Quick stats: water, mood, sleep, habits
- Fast links to log mood, health, nutrition

### Mood
- 5-point mood check-in (Awful → Great)
- Optional notes
- 14-day history chart

### Health
- Water tracking with visual ring
- Sleep log (hours + quality)
- Workout log (type, duration)

### Nutrition
- Log meals (Breakfast/Lunch/Dinner/Snack)
- Balanced day indicator

### Habits
- Track daily habits with streaks
- Mark complete for points
- Add/remove custom habits

### Companion (Sprout)
- Virtual pet that responds to your care
- 3 moods: Sad (0-39), Neutral (40-69), Happy (70+)
- Unlock accessories with points or water
- 7 unique accessories to collect

### Settings
- Rename your companion
- Set daily water goal
- Toggle dark mode
- Full data reset

---

## 🎯 Points & Rewards System

| Action | Points | Frequency |
|--------|--------|-----------|
| Log mood | 5 pts | Once per day |
| Drink water (goal reached) | 10 pts + Unlock bowl | Once per day |
| Log sleep | 5-10 pts | Once per day |
| Add workout | 15 pts | Unlimited |
| Log meal | 5 pts | Unlimited |
| Complete habit | 10 pts | Per habit, per day |

**Accessories unlock at:**
- 🥣 Bowl: Hit water goal (free)
- 🧶 Blanket: 30 pts
- 🕶️ Sunglasses: 45 pts
- 🎩 Hat: 40 pts
- ⭐ Collar: 50 pts
- 🌸 Crown: 60 pts
- 🌈 Scarf: 70 pts

---

## 🗄️ Database Structure

**Core tables:**
- `users` — Account info, pet name, settings
- `mood_entries` — Daily mood logs (1 per day)
- `water_log` — Cup tracking (1 per day)
- `sleep_log` — Hours & quality (1 per day)
- `workouts` — Exercise logs (unlimited)
- `meals` — Meal logs (unlimited)
- `habits` — User's habit list
- `habit_completions` — Track which habits done today
- `accessories` — Available items (7 pre-loaded)
- `user_accessories` — Unlocked items per user
- `daily_awards` — Tracks once-per-day bonuses

---

## 🔧 API Endpoints

All endpoints return JSON and require session authentication.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `auth/register.php` | POST | Create account |
| `auth/login.php` | POST | Log in |
| `auth/logout.php` | POST | Log out |
| `auth/me.php` | GET | Check auth status |
| `api/dashboard.php` | GET | User + care score |
| `api/water.php` | GET/POST | Track water |
| `api/mood.php` | GET/POST | Log mood |
| `api/sleep.php` | GET/POST | Log sleep |
| `api/workouts.php` | GET/POST | Log workouts |
| `api/meals.php` | GET/POST | Log meals |
| `api/habits.php` | GET/POST | Manage habits |
| `api/accessories.php` | GET/POST | Buy/equip items |
| `api/settings.php` | POST | Update settings |
| `api/reset.php` | POST | Clear all data |

---

## 🐛 Troubleshooting

### "Database connection failed"
- Check MySQL is running: `mysqld` (Windows) or `brew services start mysql` (Mac)
- Verify credentials in `config.php`
- Try: `mysql -u root -p` to test connection

### "Cannot load page" / blank screen
- Check browser console for errors (F12 → Console)
- Verify PHP server is running on `http://localhost:8000`
- Try hard refresh (Ctrl+Shift+R)

### Styles not loading
- Clear browser cache
- Verify `style.css` exists in project root
- Check file permissions

### Mood won't save
- Ensure database is running
- Check browser console for API errors
- Try logging out and back in

---

## 📝 Code Structure

```
sprout-fullstack/
├── index.html           # Main app HTML
├── app.js              # Frontend logic (400+ lines)
├── style.css           # All styling
├── config.php          # DB connection + helpers
├── schema.sql          # Database setup script
├── auth/
│   ├── register.php    # New account creation
│   ├── login.php       # Authentication
│   ├── logout.php      # Session destroy
│   └── me.php          # Auth check endpoint
└── api/
    ├── dashboard.php   # User + care score
    ├── water.php       # Water tracking
    ├── mood.php        # Mood logs
    ├── sleep.php       # Sleep logs
    ├── workouts.php    # Exercise logs
    ├── meals.php       # Meal logs
    ├── habits.php      # Habit management
    ├── accessories.php # Unlocks & equips
    ├── settings.php    # Profile updates
    └── reset.php       # Data reset
```

---

## ✨ Recent Fixes (Prototype v1.1)

1. ✅ Fixed mood selection persistence when switching screens
2. ✅ Added water goal validation (1-20 cups)
3. ✅ Improved mood state management
4. ✅ Better error handling on all API calls

---

## 🚀 Next Steps

After setup, try:

1. **Daily routine:** Log mood → drink water → log workout
2. **Build habits:** Add 3 habits, complete one daily
3. **Unlock items:** Reach 30+ points, buy the blanket
4. **Dark mode:** Toggle in settings
5. **Reset data:** Start fresh (Settings → Reset)

---

## 📧 Support

Issues? Check:
- Browser console (F12 → Console)
- MySQL is running
- `config.php` credentials
- All files are present

---

**Enjoy your wellness journey with Sprout! 🌱**
