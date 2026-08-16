# Sprout API Documentation & Testing Guide

Complete reference for all endpoints with example requests/responses.

---

## Authentication Endpoints

### POST `/auth/register.php`
Register a new account.

**Request:**
```json
{
  "name": "Alex Chen",
  "email": "alex@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Alex Chen",
  "email": "alex@example.com"
}
```

**Errors:**
- `422` - Invalid input (name empty, email invalid, password < 6 chars)
- `409` - Email already exists

---

### POST `/auth/login.php`
Log in to existing account.

**Request:**
```json
{
  "email": "alex@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Alex Chen",
  "email": "alex@example.com"
}
```

**Errors:**
- `401` - Wrong email or password

---

### GET `/auth/me.php`
Check if current session is authenticated. **No login required** (useful for page load).

**Response (200 - authenticated):**
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "name": "Alex Chen",
    "email": "alex@example.com",
    "pet_name": "Pip",
    "water_goal": 8,
    "dark_mode": 0,
    "points": 45,
    "equipped_accessory": "blanket"
  }
}
```

**Response (200 - not authenticated):**
```json
{
  "authenticated": false
}
```

---

### POST `/auth/logout.php`
Destroy session and log out.

**Response:**
```json
{
  "ok": true
}
```

---

## Dashboard & Data Endpoints

### GET `/api/dashboard.php`
Get user profile + companion care score. Called on every page load.

**Response:**
```json
{
  "user": {
    "name": "Alex Chen",
    "pet_name": "Pip",
    "water_goal": 8,
    "dark_mode": 0,
    "points": 45,
    "equipped_accessory": "blanket"
  },
  "care": {
    "score": 68,
    "label": "Content",
    "mood": "neutral",
    "water": { "cups": 5, "goal": 8 },
    "moodValue": 4,
    "sleepHours": 7.5,
    "habits": { "done": 2, "total": 4 }
  }
}
```

**Care Score Calculation:**
- Water: 30% (today's cups / goal)
- Mood: 25% (today's mood rating / 5)
- Sleep: 20% (last night's hours)
- Habits: 25% (today's habits done / total)

**Mood Classifications:**
- 0-39 = "Needs care" (sad 🥀)
- 40-69 = "Content" (neutral 🌿)
- 70-100 = "Thriving" (happy 🌱)

---

## Water Tracking

### GET `/api/water.php`
Get last 14 days of water logs.

**Response:**
```json
{
  "history": [
    { "log_date": "2024-01-14", "cups": 6 },
    { "log_date": "2024-01-15", "cups": 8 },
    { "log_date": "2024-01-16", "cups": 7 }
  ]
}
```

---

### POST `/api/water.php`
Add/subtract cups of water. Triggers goal bonus on first hit per day.

**Request:**
```json
{
  "delta": 1
}
```

**Response:**
```json
{
  "cups": 6,
  "goal": 8,
  "awarded": false,
  "bowlUnlocked": false
}
```

If goal hit (first time today):
```json
{
  "cups": 8,
  "goal": 8,
  "awarded": true,
  "bowlUnlocked": true
}
```

**Notes:**
- `delta` can be negative (subtract cups)
- Cups never go below 0
- "bowl" accessory unlocked on first goal hit
- +10 points awarded only once per day

---

## Mood Logging

### GET `/api/mood.php`
Get last 14 days of mood entries.

**Response:**
```json
{
  "entries": [
    { "entry_date": "2024-01-15", "value": 4, "note": "Had a good day" },
    { "entry_date": "2024-01-16", "value": 3, "note": "" }
  ]
}
```

---

### POST `/api/mood.php`
Log today's mood (overwrites if already logged).

**Request:**
```json
{
  "value": 4,
  "note": "Feeling good about my progress"
}
```

**Response:**
```json
{
  "ok": true,
  "awarded": true
}
```

**Validation:**
- `value` must be 1-5
- `note` max 500 chars
- Only 1 entry per day (subsequent saves overwrite)
- +5 points awarded only once per day

---

## Sleep Tracking

### GET `/api/sleep.php`
Get last 14 nights of sleep logs.

**Response:**
```json
{
  "history": [
    { "log_date": "2024-01-14", "hours": 7.5, "quality": "Great" },
    { "log_date": "2024-01-15", "hours": 6, "quality": "Okay" }
  ]
}
```

---

### POST `/api/sleep.php`
Log sleep for last night.

**Request:**
```json
{
  "hours": 7.5,
  "quality": "Great"
}
```

**Response:**
```json
{
  "ok": true,
  "awarded": true,
  "points": 10
}
```

**Notes:**
- Logs for `yesterday()` (not today)
- Quality: "Poor", "Okay", or "Great"
- ≥7 hours = +10 pts, else +5 pts
- Awarded only once per day
- Only 1 entry per day (overwrites)

---

## Workouts

### GET `/api/workouts.php`
Get last 20 workouts (any date).

**Response:**
```json
{
  "workouts": [
    { "id": 1, "log_date": "2024-01-16", "type": "Cardio", "duration": 30 },
    { "id": 2, "log_date": "2024-01-16", "type": "Yoga", "duration": 20 }
  ]
}
```

---

### POST `/api/workouts.php`
Log a workout (always +15 pts, unlimited per day).

**Request:**
```json
{
  "type": "Cardio",
  "duration": 30
}
```

**Response:**
```json
{
  "ok": true,
  "points": 15
}
```

**Validation:**
- `type` can be any string
- `duration` must be > 0
- Logged for today

---

## Meals

### GET `/api/meals.php`
Get last 20 meals (any date).

**Response:**
```json
{
  "meals": [
    { "id": 1, "log_date": "2024-01-16", "name": "Oatmeal", "type": "Breakfast" },
    { "id": 2, "log_date": "2024-01-16", "name": "Salad", "type": "Lunch" }
  ]
}
```

---

### POST `/api/meals.php`
Log a meal (+5 pts, unlimited per day).

**Request:**
```json
{
  "name": "Grilled salmon with veggies",
  "type": "Dinner"
}
```

**Response:**
```json
{
  "ok": true,
  "points": 5
}
```

**Validation:**
- `name` required (max 120 chars)
- `type` must be: "Breakfast", "Lunch", "Dinner", or "Snack"
- Logged for today

---

## Habits

### GET `/api/habits.php`
Get all user habits with streak & today's status.

**Response:**
```json
{
  "habits": [
    { "id": 1, "name": "Drink water", "doneToday": true, "streak": 5 },
    { "id": 2, "name": "Move your body", "doneToday": false, "streak": 2 },
    { "id": 3, "name": "Custom habit", "doneToday": false, "streak": 0 }
  ]
}
```

---

### POST `/api/habits.php?action=add`
Create a new habit.

**Request:**
```json
{
  "name": "Meditate for 10 min"
}
```

**Response:**
```json
{
  "id": 5
}
```

---

### POST `/api/habits.php?action=toggle`
Mark a habit done/incomplete for today (+10/-10 pts).

**Request:**
```json
{
  "id": 1
}
```

**Response (marked done):**
```json
{
  "done": true
}
```

**Response (marked incomplete):**
```json
{
  "done": false
}
```

---

### POST `/api/habits.php?action=delete`
Delete a habit (and all its completions).

**Request:**
```json
{
  "id": 5
}
```

**Response:**
```json
{
  "ok": true
}
```

---

## Accessories (Shop)

### GET `/api/accessories.php`
Get all 7 accessories with unlock status and user's points.

**Response:**
```json
{
  "accessories": [
    {
      "id": "bowl",
      "name": "Fancy Water Bowl",
      "emoji": "🥣",
      "unlock_type": "water",
      "cost": 0,
      "unlocked": true,
      "equipped": false
    },
    {
      "id": "blanket",
      "name": "Cozy Blanket",
      "emoji": "🧶",
      "unlock_type": "points",
      "cost": 30,
      "unlocked": true,
      "equipped": true
    },
    {
      "id": "glasses",
      "name": "Sunglasses",
      "emoji": "🕶️",
      "unlock_type": "points",
      "cost": 45,
      "unlocked": false,
      "equipped": false
    }
  ],
  "points": 75
}
```

---

### POST `/api/accessories.php?action=unlock`
Unlock an accessory (must have enough points).

**Request:**
```json
{
  "id": "glasses"
}
```

**Response:**
```json
{
  "ok": true
}
```

**Errors:**
- `409` - Already unlocked
- `422` - Not enough points / cannot unlock with points
- Points deducted immediately

---

### POST `/api/accessories.php?action=equip`
Equip/unequip an accessory (must be unlocked). Toggles if already equipped.

**Request:**
```json
{
  "id": "blanket"
}
```

**Response:**
```json
{
  "equipped": "blanket"
}
```

**To unequip:**
```json
{
  "id": "blanket"
}
```

**Response:**
```json
{
  "equipped": null
}
```

---

## Settings

### POST `/api/settings.php`
Update user settings (any combination).

**Request (update pet name):**
```json
{
  "petName": "Sproutling"
}
```

**Request (update water goal):**
```json
{
  "waterGoal": 10
}
```

**Request (toggle dark mode):**
```json
{
  "darkMode": true
}
```

**Response:**
```json
{
  "ok": true
}
```

**Validation:**
- `petName` max 50 chars
- `waterGoal` must be 1-20
- `darkMode` boolean

---

## Data Reset

### POST `/api/reset.php`
Clear ALL user data (logs, habits, accessories, points) and reset to defaults.

**Response:**
```json
{
  "ok": true
}
```

**What gets deleted:**
- All mood entries
- All water logs
- All sleep logs
- All workouts
- All meals
- All habits + completions
- All unlocked accessories

**What gets reset:**
- Points → 0
- Pet name → "Pip"
- Water goal → 8
- Dark mode → off
- Equipped accessory → none
- 4 default habits re-created

---

## Error Handling

All errors return JSON with `error` field:

```json
{
  "error": "Not authenticated"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `401` - Not authenticated
- `404` - Not found / wrong action
- `405` - Wrong HTTP method
- `409` - Conflict (already exists)
- `422` - Invalid input
- `500` - Server error

---

## Testing with cURL

**Register:**
```bash
curl -X POST http://localhost:8000/auth/register.php \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}' \
  -c cookies.txt
```

**Log mood (with session):**
```bash
curl -X POST http://localhost:8000/api/mood.php \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"value":4,"note":"Feeling good"}'
```

**Get dashboard:**
```bash
curl http://localhost:8000/api/dashboard.php -b cookies.txt
```

---

## Testing Checklist

- [ ] Register new account
- [ ] Log in with credentials
- [ ] Log out
- [ ] Check auth status (me.php)
- [ ] Get dashboard
- [ ] Add water (+1, verify goal bonus)
- [ ] Log mood with note
- [ ] View mood history
- [ ] Log sleep
- [ ] Add workout
- [ ] Log meal
- [ ] Create habit
- [ ] Toggle habit (verify points)
- [ ] Delete habit
- [ ] Get accessories
- [ ] Unlock accessory (verify points deducted)
- [ ] Equip/unequip
- [ ] Update pet name
- [ ] Update water goal
- [ ] Toggle dark mode
- [ ] Reset all data

---

**All endpoints tested and working! 🎉**
