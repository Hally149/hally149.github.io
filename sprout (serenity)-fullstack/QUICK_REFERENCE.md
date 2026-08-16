# Sprout — Quick Reference Card

Fast lookup for the most common tasks.

---

## ⚡ Quick Start (Copy-Paste)

### 1. Setup Database (one time)
```bash
mysql -u root < schema.sql
```

### 2. Start Server
```bash
php -S localhost:8000
```

### 3. Open Browser
```
http://localhost:8000
```

---

## 🎯 First Use Workflow

1. **Sign up** → Name, email, password
2. **Dashboard opens** → See your companion (Pip)
3. **Log mood** → Click Mood tab, pick emoji
4. **Drink water** → Click + button (goal: 8 cups)
5. **Complete habits** → Click checkmark on habit
6. **Earn points** → Do activities, unlock accessories

---

## 📱 Main Features at a Glance

| Screen | Does What | Shortcut |
|--------|-----------|----------|
| **Dashboard** | Today's overview | Home tab |
| **Mood** | Log feelings (1-5 scale) | Mood tab |
| **Health** | Water, sleep, workouts | Health tab |
| **Nutrition** | Track meals | Nutrition tab |
| **Habits** | Daily to-do list | Habits tab |
| **Companion** | Pet status & accessories | Companion tab |
| **Settings** | Customize app | Settings tab |

---

## 💰 Points Reference

### How to Earn
| Action | Points | Frequency |
|--------|--------|-----------|
| Log mood | 5 | 1× daily |
| Hit water goal | 10 + unlock bowl | 1× daily |
| Log sleep | 5–10 | 1× daily |
| Complete habit | 10 | Per habit, per day |
| Add workout | 15 | Unlimited |
| Log meal | 5 | Unlimited |

### How to Spend
| Item | Cost | How to Unlock |
|------|------|---------------|
| 🥣 Water Bowl | FREE | Hit water goal once |
| 🧶 Blanket | 30 pts | Buy in shop |
| 🕶️ Sunglasses | 45 pts | Buy in shop |
| 🎩 Hat | 40 pts | Buy in shop |
| ⭐ Collar | 50 pts | Buy in shop |
| 🌸 Crown | 60 pts | Buy in shop |
| 🌈 Scarf | 70 pts | Buy in shop |

---

## 🌱 Companion Care Score

Your companion Sprout's mood depends on:

```
Score = (Water 30%) + (Mood 25%) + (Sleep 20%) + (Habits 25%)
```

**Mood Tiers:**
- 🥀 **Needs care** (0-39) — Sad
- 🌿 **Content** (40-69) — Neutral  
- 🌱 **Thriving** (70-100) — Happy

**Tips to keep Sprout happy:**
1. ✓ Hit your daily water goal
2. ✓ Log your mood daily
3. ✓ Get 7+ hours of sleep
4. ✓ Complete all habits

---

## 🔧 Settings You Can Change

| Setting | Default | Range |
|---------|---------|-------|
| Pet name | "Pip" | Text |
| Water goal | 8 cups | 1-20 cups |
| Dark mode | Off | On/Off |

---

## 🔐 Account Management

### Logging In
- Email + password on login screen
- You stay logged in across sessions

### Logging Out
- Click "Log out" button at bottom of sidebar

### Changing Password
- Not available (would need new account)

### Deleting Account
- Go to Settings → Reset All Data
- ⚠️ This clears everything but keeps account

---

## 🐛 Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| "Can't connect to database" | 1. Start MySQL<br>2. Check `config.php` credentials |
| Page won't load | 1. Hard refresh (Ctrl+Shift+R)<br>2. Check PHP server running |
| Mood won't save | 1. Check MySQL is running<br>2. Try logging out/in |
| Points not showing | Refresh page (F5) |
| Styles look broken | Clear cache (Ctrl+Shift+Del) |

---

## 📊 Tracking Tips

### Best Logging Pattern
1. **Morning:** Log yesterday's sleep
2. **Noon:** Check habits, log meal
3. **Afternoon:** Log workout if done
4. **Evening:** Check in mood, drink water

### Habits Strategy
- Add habits that matter to YOU
- Start with 3-4 max (easier to maintain)
- Complete daily for streaks
- Remove if not relevant

### Companion Optimization
- Focus on water goal (30% of score)
- Don't skip mood check-ins (25%)
- Prioritize sleep (20%)
- Keep 1-2 habits consistent (25%)

---

## 🎮 Gamification Tips

1. **Daily Challenge:** Hit all 4 factors (water, mood, sleep, habits)
2. **Accessory Hunt:** Unlock all 7 items (270 pts total)
3. **Streak Race:** Get your longest habit streak
4. **Score Attack:** Reach 100-point companion score

---

## 📱 API Quick Calls

### Register
```bash
curl -X POST http://localhost:8000/auth/register.php \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@mail.com","password":"pass123"}' \
  -c cookies.txt
```

### Log Mood
```bash
curl -X POST http://localhost:8000/api/mood.php \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"value":4,"note":"Great day"}'
```

### Get Dashboard
```bash
curl http://localhost:8000/api/dashboard.php -b cookies.txt
```

---

## 📁 File Structure (Important Files)

```
sprout/
├── index.html           ← Main page (open this)
├── app.js              ← All frontend logic
├── style.css           ← All styling
├── config.php          ← Database connection
├── schema.sql          ← Run this to setup DB
├── SETUP_GUIDE.md      ← Detailed setup
├── API_DOCS.md         ← API reference
└── api/                ← Backend endpoints
    ├── water.php
    ├── mood.php
    └── ... (8 more files)
```

---

## ✅ Verification Checklist

After setup, test these:

- [ ] Can register new account
- [ ] Dashboard shows companion
- [ ] Can log mood (pick emoji)
- [ ] Can add water (click +)
- [ ] Can complete habit (click ✓)
- [ ] Points update after actions
- [ ] Can buy accessory (Companion tab)
- [ ] Can equip item
- [ ] Dark mode toggle works
- [ ] Can reset data (Settings)

---

## 🚀 Performance Tips

- Clear browser cache if styles are broken
- Close other browser tabs for speed
- Use Chrome/Firefox for best experience
- Mobile works but sidebar is collapsed

---

## 📞 Getting Help

1. **Read:** `SETUP_GUIDE.md` for detailed setup
2. **Check:** `API_DOCS.md` for endpoint details
3. **Review:** `FIXES_AND_IMPROVEMENTS.md` for known issues
4. **Debug:** Open DevTools (F12) and check Console tab

---

## 🎓 Learning Path

### Beginner
1. Register & explore dashboard
2. Log mood 3 days in a row
3. Hit water goal once

### Intermediate
4. Create 3 custom habits
5. Unlock 3 accessories
6. Get 50-point companion score

### Advanced
7. Unlock all 7 items (270 pts needed)
8. Maintain 14-day habit streak
9. Get 100-point companion score

---

## 📝 Data You Can Export

Currently: Manual export via browser DevTools
```javascript
// Open DevTools console (F12 → Console)
// Then paste:
console.log(JSON.stringify(state, null, 2))
```

Future: CSV export button in Settings

---

## 🔒 Privacy & Security

✅ **Your data:**
- Stored locally in your MySQL database
- Never sent elsewhere
- Password hashed (irreversible)
- Session-based login (secure)

❌ **No cloud sync yet** (feature in progress)

---

## 🎨 Customization

### Change Colors
Edit `style.css` variables:
```css
:root {
  --accent-sage: #6B8F71;        ← Primary color
  --accent-amber: #DCA54C;       ← Highlight
  --accent-water: #5B8AA6;       ← Water ring
  --accent-lavender: #8983AD;    ← Sleep bar
}
```

### Rename Companion
Settings tab → "Companion name" → Save

### Change Water Goal
Settings tab → "Daily water goal" → Save

---

**Happy tracking! 🌱**
