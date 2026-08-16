/* ---------- Sprout — Wellness Companion (Offline Prototype with localStorage) ---------- */

const ACCESSORY_META = {
  bowl: { emoji: '🥣', name: 'Water Bowl', cost: 50, unlock_type: 'water' },
  blanket: { emoji: '🧶', name: 'Cozy Blanket', cost: 30, unlock_type: 'points' },
  glasses: { emoji: '🕶️', name: 'Shades', cost: 40, unlock_type: 'points' },
  hat: { emoji: '🎩', name: 'Top Hat', cost: 60, unlock_type: 'points' },
  collar: { emoji: '⭐', name: 'Star Collar', cost: 50, unlock_type: 'points' },
  crown: { emoji: '🌸', name: 'Flower Crown', cost: 70, unlock_type: 'water' },
  scarf: { emoji: '🌈', name: 'Rainbow Scarf', cost: 80, unlock_type: 'points' },
};

const MOOD_FACES = [
  { value: 1, emoji: '😞', label: 'Awful' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

let state = {
  user: null, care: null, moodEntries: [], waterHistory: [],
  sleepHistory: [], workouts: [], meals: [], habits: [], accessories: [], points: 0,
};
let pendingMood = null;

/* ---------- localStorage API Mock ---------- */

function getDB() {
  const db = localStorage.getItem('sprout_db');
  if (!db) {
    const fresh = {
      users: {},
      moodEntries: [],
      waterLog: [],
      sleepLog: [],
      workouts: [],
      meals: [],
      habits: [],
      accessories: Object.keys(ACCESSORY_META).map(id => ({
        id, ...ACCESSORY_META[id], unlocked: false, equipped: false
      }))
    };
    localStorage.setItem('sprout_db', JSON.stringify(fresh));
    return fresh;
  }
  return JSON.parse(db);
}

function saveDB(db) {
  localStorage.setItem('sprout_db', JSON.stringify(db));
}

function getSessionUser() {
  return JSON.parse(localStorage.getItem('sprout_session_user') || 'null');
}

function setSessionUser(user) {
  localStorage.setItem('sprout_session_user', JSON.stringify(user));
}

function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function dayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ---------- auth ---------- */

function showAuthScreen() {
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('appRoot').style.display = 'none';
}

function showApp() {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('appRoot').style.display = 'grid';
}

async function boot() {
  const user = getSessionUser();
  if (user) {
    showApp();
    await refreshAll();
  } else {
    showAuthScreen();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  try {
    const db = getDB();
    const user = Object.values(db.users).find(u => u.email === email);
    if (!user || user.password !== password) throw new Error('Invalid email or password');
    setSessionUser(user);
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    showApp();
    await refreshAll();
  } catch (err) {
    errEl.textContent = err.message;
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const errEl = document.getElementById('registerError');
  errEl.textContent = '';
  try {
    if (!name || !email || !password) throw new Error('All fields required');
    if (password.length < 6) throw new Error('Password must be at least 6 characters');
    const db = getDB();
    if (Object.values(db.users).find(u => u.email === email)) throw new Error('Email already exists');
    
    const newUser = {
      id: Date.now(),
      name, email, password,
      pet_name: 'Sprout',
      water_goal: 8,
      dark_mode: false,
      points: 0,
      equipped_accessory: null,
      created_at: new Date().toISOString()
    };
    
    db.users[newUser.id] = newUser;
    db.habits = [
      { id: 1, user_id: newUser.id, name: 'Drink water', doneToday: false, streak: 0 },
      { id: 2, user_id: newUser.id, name: 'Move your body', doneToday: false, streak: 0 },
      { id: 3, user_id: newUser.id, name: 'Journal a little', doneToday: false, streak: 0 },
      { id: 4, user_id: newUser.id, name: 'Get some sunlight', doneToday: false, streak: 0 }
    ];
    
    saveDB(db);
    setSessionUser(newUser);
    document.getElementById('registerName').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';
    showApp();
    await refreshAll();
  } catch (err) {
    errEl.textContent = err.message;
  }
}

async function handleLogout() {
  localStorage.removeItem('sprout_session_user');
  state = { user: null, care: null, moodEntries: [], waterHistory: [], sleepHistory: [], workouts: [], meals: [], habits: [], accessories: [], points: 0 };
  showAuthScreen();
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginError').textContent = '';
}

/* ---------- care score calculation ---------- */

function calculateCare(user) {
  const db = getDB();
  const today = todayStr();
  
  const moodEntry = db.moodEntries.find(m => m.entry_date === today && m.user_id === user.id);
  const waterLog = db.waterLog.find(w => w.log_date === today && w.user_id === user.id) || { cups: 0 };
  const sleepLog = db.sleepLog.find(s => s.log_date === today && s.user_id === user.id);
  const userHabits = db.habits.filter(h => h.user_id === user.id);
  
  let score = 50;
  let moodValue = null;
  let water = { cups: waterLog.cups, goal: user.water_goal };
  let sleepHours = sleepLog ? sleepLog.hours : null;
  
  // Mood (0-20 points)
  if (moodEntry) {
    moodValue = moodEntry.value;
    score += moodEntry.value * 4;
  }
  
  // Water (0-20 points)
  score += Math.min(water.cups / water.goal, 1) * 20;
  
  // Sleep (0-20 points)
  if (sleepLog) {
    if (sleepHours >= 7 && sleepHours <= 9) score += 20;
    else if (sleepHours >= 6 && sleepHours <= 10) score += 15;
    else if (sleepHours > 0) score += 10;
  }
  
  // Habits (0-20 points)
  const habitsDone = userHabits.filter(h => h.doneToday).length;
  score += (habitsDone / Math.max(userHabits.length, 1)) * 20;
  
  score = Math.min(Math.round(score), 100);
  
  const moodMap = { happy: 'Thriving', neutral: 'Doing okay', sad: 'Needs care' };
  let moodKey = 'neutral';
  if (score >= 70) moodKey = 'happy';
  else if (score <= 40) moodKey = 'sad';
  
  return {
    score, label: moodMap[moodKey], mood: moodKey, moodValue,
    water, sleepHours,
    habits: { done: habitsDone, total: userHabits.length }
  };
}

/* ---------- data loading ---------- */

async function refreshAll() {
  const user = getSessionUser();
  if (!user) return;
  
  const db = getDB();
  state.user = user;
  state.care = calculateCare(user);
  state.moodEntries = db.moodEntries.filter(m => m.user_id === user.id);
  state.waterHistory = db.waterLog.filter(w => w.user_id === user.id);
  state.sleepHistory = db.sleepLog.filter(s => s.user_id === user.id);
  state.workouts = db.workouts.filter(w => w.user_id === user.id).reverse();
  state.meals = db.meals.filter(m => m.user_id === user.id).reverse();
  state.habits = db.habits.filter(h => h.user_id === user.id);
  state.accessories = db.accessories;
  state.points = user.points;

  applyTheme();
  render();
}

function applyTheme() {
  document.body.classList.toggle('dark', !!(state.user && state.user.dark_mode));
}

/* ---------- actions ---------- */

async function changeWater(delta) {
  const user = getSessionUser();
  if (!user) return;
  
  const db = getDB();
  const today = todayStr();
  let waterLog = db.waterLog.find(w => w.log_date === today && w.user_id === user.id);
  
  if (!waterLog) {
    waterLog = { id: Date.now(), user_id: user.id, log_date: today, cups: 0 };
    db.waterLog.push(waterLog);
  }
  
  waterLog.cups = Math.max(0, waterLog.cups + delta);
  
  let awarded = false;
  let bowlUnlocked = false;
  
  // Award points for reaching water goal
  if (waterLog.cups === user.water_goal) {
    user.points += 10;
    awarded = true;
    
    // Unlock water bowl
    const bowl = db.accessories.find(a => a.id === 'bowl');
    if (bowl && !bowl.unlocked) {
      bowl.unlocked = true;
      bowlUnlocked = true;
    }
  }
  
  db.users[user.id] = user;
  saveDB(db);
  setSessionUser(user);
  
  if (bowlUnlocked) showToast('🎉 Water goal hit — Fancy Water Bowl unlocked!');
  else if (awarded) showToast('💧 Water goal hit — +10 pts');
  
  await refreshAll();
}

async function saveMood() {
  if (pendingMood == null) return;
  
  const user = getSessionUser();
  if (!user) return;
  
  const db = getDB();
  const today = todayStr();
  const note = document.getElementById('moodNote').value.trim();
  
  let moodEntry = db.moodEntries.find(m => m.entry_date === today && m.user_id === user.id);
  if (!moodEntry) {
    moodEntry = { id: Date.now(), user_id: user.id, entry_date: today, value: pendingMood, note };
    db.moodEntries.push(moodEntry);
    user.points += 5;
    showToast('Mood logged — +5 pts');
  } else {
    moodEntry.value = pendingMood;
    moodEntry.note = note;
    showToast('Mood updated');
  }
  
  db.users[user.id] = user;
  saveDB(db);
  setSessionUser(user);
  await refreshAll();
}

async function saveSleep() {
  const user = getSessionUser();
  if (!user) return;
  
  const hours = parseFloat(document.getElementById('sleepHours').value);
  const quality = document.getElementById('sleepQuality').value;
  if (isNaN(hours) || hours < 0) return;
  
  const db = getDB();
  const lastNight = todayStr(-1);
  let sleepLog = db.sleepLog.find(s => s.log_date === lastNight && s.user_id === user.id);
  
  if (!sleepLog) {
    sleepLog = { id: Date.now(), user_id: user.id, log_date: lastNight, hours, quality };
    db.sleepLog.push(sleepLog);
    user.points += 8;
    showToast('Sleep logged — +8 pts');
  } else {
    sleepLog.hours = hours;
    sleepLog.quality = quality;
    showToast('Sleep updated');
  }
  
  db.users[user.id] = user;
  saveDB(db);
  setSessionUser(user);
  await refreshAll();
}

async function addWorkout() {
  const user = getSessionUser();
  if (!user) return;
  
  const type = document.getElementById('workoutType').value;
  const duration = parseInt(document.getElementById('workoutDuration').value, 10);
  if (!duration || duration <= 0) return;
  
  const db = getDB();
  db.workouts.push({
    id: Date.now(),
    user_id: user.id,
    type, duration,
    log_date: todayStr()
  });
  
  user.points += 15;
  db.users[user.id] = user;
  saveDB(db);
  setSessionUser(user);
  
  document.getElementById('workoutDuration').value = '';
  showToast('Workout logged — +15 pts');
  await refreshAll();
}

async function addMeal() {
  const user = getSessionUser();
  if (!user) return;
  
  const name = document.getElementById('mealName').value.trim();
  const type = document.getElementById('mealType').value;
  if (!name) return;
  
  const db = getDB();
  db.meals.push({
    id: Date.now(),
    user_id: user.id,
    name, type,
    log_date: todayStr()
  });
  
  user.points += 5;
  db.users[user.id] = user;
  saveDB(db);
  setSessionUser(user);
  
  document.getElementById('mealName').value = '';
  showToast('Meal logged — +5 pts');
  await refreshAll();
}

async function toggleHabit(id) {
  const user = getSessionUser();
  if (!user) return;
  
  const db = getDB();
  const habit = db.habits.find(h => h.id === id);
  if (!habit) return;
  
  habit.doneToday = !habit.doneToday;
  if (habit.doneToday) {
    user.points += 10;
    showToast('Habit checked — +10 pts');
  }
  
  db.users[user.id] = user;
  saveDB(db);
  setSessionUser(user);
  await refreshAll();
}

async function addHabit() {
  const user = getSessionUser();
  if (!user) return;
  
  const input = document.getElementById('newHabitName');
  const name = input.value.trim();
  if (!name) return;
  
  const db = getDB();
  db.habits.push({
    id: Date.now(),
    user_id: user.id,
    name,
    doneToday: false,
    streak: 0
  });
  
  saveDB(db);
  input.value = '';
  await refreshAll();
}

async function removeHabit(id) {
  const user = getSessionUser();
  if (!user) return;
  
  const db = getDB();
  db.habits = db.habits.filter(h => h.id !== id || h.user_id !== user.id);
  saveDB(db);
  await refreshAll();
}

async function unlockAccessory(id) {
  const user = getSessionUser();
  if (!user) return;
  
  const db = getDB();
  const acc = db.accessories.find(a => a.id === id);
  if (!acc || acc.unlocked) return;
  
  if (user.points < acc.cost) {
    showToast('Not enough points');
    return;
  }
  
  acc.unlocked = true;
  user.points -= acc.cost;
  db.users[user.id] = user;
  saveDB(db);
  setSessionUser(user);
  
  showToast((acc.emoji || '') + ' Unlocked!');
  await refreshAll();
}

async function equipAccessory(id) {
  const user = getSessionUser();
  if (!user) return;
  
  const db = getDB();
  const acc = db.accessories.find(a => a.id === id);
  if (!acc || !acc.unlocked) return;
  
  db.accessories.forEach(a => a.equipped = false);
  acc.equipped = true;
  
  user.equipped_accessory = id;
  db.users[user.id] = user;
  saveDB(db);
  setSessionUser(user);
  
  showToast('Equipped!');
  await refreshAll();
}

async function savePetName() {
  const user = getSessionUser();
  if (!user) return;
  
  const val = document.getElementById('petNameInput').value.trim();
  if (!val) return;
  
  const db = getDB();
  user.pet_name = val;
  db.users[user.id] = user;
  saveDB(db);
  setSessionUser(user);
  
  showToast('Saved');
  await refreshAll();
}

async function saveWaterGoal() {
  const user = getSessionUser();
  if (!user) return;
  
  const val = parseInt(document.getElementById('waterGoalInput').value, 10);
  if (!val || val <= 0 || val > 20) {
    showToast('Water goal must be between 1 and 20 cups');
    return;
  }
  
  const db = getDB();
  user.water_goal = val;
  db.users[user.id] = user;
  saveDB(db);
  setSessionUser(user);
  
  showToast('Saved');
  await refreshAll();
}

async function toggleDarkMode(checked) {
  const user = getSessionUser();
  if (!user) return;
  
  const db = getDB();
  user.dark_mode = checked;
  db.users[user.id] = user;
  saveDB(db);
  setSessionUser(user);
  
  await refreshAll();
}

async function resetAllData() {
  if (!confirm('Reset all Sprout data? This cannot be undone.')) return;
  
  const user = getSessionUser();
  if (!user) return;
  
  const db = getDB();
  db.moodEntries = db.moodEntries.filter(m => m.user_id !== user.id);
  db.waterLog = db.waterLog.filter(w => w.user_id !== user.id);
  db.sleepLog = db.sleepLog.filter(s => s.user_id !== user.id);
  db.workouts = db.workouts.filter(w => w.user_id !== user.id);
  db.meals = db.meals.filter(m => m.user_id !== user.id);
  db.habits = db.habits.filter(h => h.user_id !== user.id);
  
  user.points = 0;
  user.equipped_accessory = null;
  db.users[user.id] = user;
  db.accessories.forEach(a => { a.unlocked = false; a.equipped = false; });
  
  saveDB(db);
  setSessionUser(user);
  
  showToast('Data reset');
  await refreshAll();
}

/* ---------- rendering ---------- */

function switchTab(tab) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === 'screen-' + tab));
  if (tab !== 'mood' && pendingMood !== null) {
    const existing = state.moodEntries.find(m => m.entry_date === todayStr());
    pendingMood = existing ? existing.value : null;
  }
}

function faceFor(moodKey) {
  return moodKey === 'happy' ? '🌱' : (moodKey === 'neutral' ? '🌿' : '🥀');
}

function renderSidebarPet() {
  if (!state.user) return;
  document.getElementById('sidebarPetFace').textContent = faceFor(state.care.mood);
  document.getElementById('sidebarPetName').textContent = state.user.pet_name;
  document.getElementById('sidebarPoints').textContent = state.user.points;
}

function updatePetVisual() {
  if (!state.care) return;
  const svg = document.getElementById('petSvg');
  svg.classList.remove('mood-happy', 'mood-neutral', 'mood-sad');
  svg.classList.add('mood-' + state.care.mood);

  const mouths = {
    happy: 'M78 128 Q100 148 122 128',
    neutral: 'M80 132 L120 132',
    sad: 'M78 138 Q100 120 122 138',
  };
  document.getElementById('petMouth').setAttribute('d', mouths[state.care.mood]);

  const badge = document.getElementById('petAccessoryBadge');
  const equipped = state.user.equipped_accessory;
  if (equipped) {
    badge.textContent = (ACCESSORY_META[equipped] || {}).emoji || '';
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

function renderDashboard() {
  if (!state.user) return;
  const cs = state.care;
  document.getElementById('dashGreeting').textContent = greeting();
  document.getElementById('dashCareLabel').textContent = cs.label;
  document.getElementById('dashPetFace').textContent = faceFor(cs.mood);
  document.getElementById('dashPoints').textContent = state.user.points;
  document.getElementById('dashWaterCups').textContent = cs.water.cups;
  document.getElementById('dashWaterGoal').textContent = cs.water.goal;
  document.getElementById('dashWaterRing').style.setProperty('--pct', Math.min(cs.water.cups / cs.water.goal, 1) * 100);
  document.getElementById('dashMood').textContent = cs.moodValue ? MOOD_FACES.find(f => f.value === cs.moodValue).emoji : '—';
  document.getElementById('dashSleep').textContent = cs.sleepHours != null ? cs.sleepHours + 'h' : '—';
  document.getElementById('dashHabits').textContent = cs.habits.done + ' / ' + cs.habits.total;
}

function renderMoodScreen() {
  const container = document.getElementById('moodFaces');
  const existing = state.moodEntries.find(m => m.entry_date === todayStr());
  
  if (pendingMood === null && existing) {
    pendingMood = existing.value;
  }
  
  container.innerHTML = MOOD_FACES.map(f => (
    '<button class="mood-face' + (pendingMood === f.value ? ' selected' : '') + '" data-value="' + f.value + '">' +
    '<span class="mood-emoji">' + f.emoji + '</span><span class="mood-label">' + f.label + '</span></button>'
  )).join('');
  container.querySelectorAll('.mood-face').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingMood = parseInt(btn.dataset.value, 10);
      renderMoodScreen();
    });
  });

  if (existing) document.getElementById('moodNote').value = existing.note || '';

  const bars = document.getElementById('moodHistory');
  const last14 = [];
  for (let i = 13; i >= 0; i--) last14.push(todayStr(-i));
  bars.innerHTML = last14.map(day => {
    const entry = state.moodEntries.find(m => m.entry_date === day);
    const h = entry ? entry.value * 12 : 4;
    return '<div class="bar-col"><div class="bar" style="height:' + h + 'px" title="' + day + '"></div><span class="bar-label">' + dayLabel(day) + '</span></div>';
  }).join('');

  const list = document.getElementById('moodEntryList');
  const recent = state.moodEntries.slice().reverse().slice(0, 6);
  list.innerHTML = recent.length ? recent.map(m => (
    '<li><span>' + MOOD_FACES.find(f => f.value === m.value).emoji + ' ' + m.entry_date + '</span>' +
    (m.note ? '<span class="entry-note">' + escapeHtml(m.note) + '</span>' : '') + '</li>'
  )).join('') : '<li class="empty">No entries yet — log today\'s mood above.</li>';
}

function renderHealthScreen() {
  const cs = state.care;
  document.getElementById('waterCupsToday').textContent = cs.water.cups;
  document.getElementById('waterGoalToday').textContent = cs.water.goal;
  document.getElementById('waterRingHealth').style.setProperty('--pct', Math.min(cs.water.cups / cs.water.goal, 1) * 100);

  const last7 = [];
  for (let i = 6; i >= 0; i--) last7.push(todayStr(-i));

  const waterByDate = {};
  state.waterHistory.forEach(w => { waterByDate[w.log_date] = w.cups; });
  const maxCups = Math.max(cs.water.goal, ...last7.map(d => waterByDate[d] || 0), 1);
  document.getElementById('waterHistory').innerHTML = last7.map(day => {
    const cups = waterByDate[day] || 0;
    const h = (cups / maxCups) * 60;
    return '<div class="bar-col"><div class="bar bar-water" style="height:' + Math.max(h, 3) + 'px" title="' + cups + ' cups"></div><span class="bar-label">' + dayLabel(day) + '</span></div>';
  }).join('');

  const sleepByDate = {};
  state.sleepHistory.forEach(s => { sleepByDate[s.log_date] = s; });
  const lastNight = sleepByDate[todayStr(-1)];
  document.getElementById('sleepHours').value = lastNight ? lastNight.hours : '';
  document.getElementById('sleepQuality').value = lastNight ? lastNight.quality : 'Okay';

  document.getElementById('sleepHistory').innerHTML = last7.map(day => {
    const s = sleepByDate[day];
    const h = s ? Math.min(s.hours, 10) * 6 : 3;
    return '<div class="bar-col"><div class="bar bar-sleep" style="height:' + h + 'px" title="' + (s ? s.hours + 'h' : 'no data') + '"></div><span class="bar-label">' + dayLabel(day) + '</span></div>';
  }).join('');

  const list = document.getElementById('workoutList');
  const recent = state.workouts.slice(0, 6);
  list.innerHTML = recent.length ? recent.map(w => (
    '<li><span>' + w.type + '</span><span class="entry-note">' + w.duration + ' min · ' + w.log_date + '</span></li>'
  )).join('') : '<li class="empty">No workouts logged yet.</li>';
}

function renderNutritionScreen() {
  const todayMeals = state.meals.filter(m => m.log_date === todayStr());
  document.getElementById('mealsTodayCount').textContent = todayMeals.length;
  const balanced = todayMeals.length >= 3;
  document.getElementById('mealBalanceTag').textContent = balanced ? 'Balanced day' : 'Log a few more meals';
  document.getElementById('mealBalanceTag').className = 'tag ' + (balanced ? 'tag-good' : 'tag-neutral');

  const list = document.getElementById('mealList');
  const recent = state.meals.slice(0, 8);
  list.innerHTML = recent.length ? recent.map(m => (
    '<li><span>' + escapeHtml(m.name) + '</span><span class="entry-note">' + m.type + ' · ' + m.log_date + '</span></li>'
  )).join('') : '<li class="empty">No meals logged yet.</li>';
}

function renderHabitsScreen() {
  const list = document.getElementById('habitList');
  list.innerHTML = state.habits.map(h => (
    '<li class="habit-row">' +
    '<button class="habit-check' + (h.doneToday ? ' checked' : '') + '" data-id="' + h.id + '" aria-label="Toggle ' + escapeHtml(h.name) + '">' + (h.doneToday ? '✓' : '') + '</button>' +
    '<span class="habit-name">' + escapeHtml(h.name) + '</span>' +
    '<span class="habit-streak">🔥 ' + (h.streak || 0) + '</span>' +
    '<button class="habit-remove" data-id="' + h.id + '" aria-label="Remove habit">✕</button>' +
    '</li>'
  )).join('');

  list.querySelectorAll('.habit-check').forEach(btn => btn.addEventListener('click', () => toggleHabit(parseInt(btn.dataset.id, 10))));
  list.querySelectorAll('.habit-remove').forEach(btn => btn.addEventListener('click', () => removeHabit(parseInt(btn.dataset.id, 10))));
}

function renderCompanionScreen() {
  const cs = state.care;
  document.getElementById('companionName').textContent = state.user.pet_name;
  document.getElementById('companionStatus').textContent = cs.label;
  document.getElementById('companionScore').textContent = cs.score;
  document.getElementById('companionPoints').textContent = state.user.points;

  document.getElementById('factorWater').textContent = cs.water.cups + ' / ' + cs.water.goal + ' cups';
  document.getElementById('factorMood').textContent = cs.moodValue ? 'Logged' : 'Not logged yet';
  document.getElementById('factorSleep').textContent = cs.sleepHours != null ? cs.sleepHours + ' h' : 'Not logged yet';
  document.getElementById('factorHabits').textContent = cs.habits.done + ' / ' + cs.habits.total;

  const grid = document.getElementById('accessoryGrid');
  grid.innerHTML = state.accessories.map(a => {
    let action = '';
    if (!a.unlocked && a.unlock_type === 'points') {
      const can = state.user.points >= a.cost;
      action = '<button class="acc-btn" data-action="unlock" data-id="' + a.id + '" ' + (can ? '' : 'disabled') + '>Unlock · ' + a.cost + ' pts</button>';
    } else if (!a.unlocked && a.unlock_type === 'water') {
      action = '<span class="acc-hint">Hit your daily water goal to unlock</span>';
    } else {
      action = '<button class="acc-btn' + (a.equipped ? ' equipped' : '') + '" data-action="equip" data-id="' + a.id + '">' + (a.equipped ? 'Equipped' : 'Equip') + '</button>';
    }
    return (
      '<div class="acc-card' + (a.unlocked ? '' : ' locked') + '">' +
      '<div class="acc-emoji">' + a.emoji + '</div>' +
      '<div class="acc-name">' + a.name + '</div>' +
      action +
      '</div>'
    );
  }).join('');

  grid.querySelectorAll('[data-action="unlock"]').forEach(btn => btn.addEventListener('click', () => unlockAccessory(btn.dataset.id)));
  grid.querySelectorAll('[data-action="equip"]').forEach(btn => btn.addEventListener('click', () => equipAccessory(btn.dataset.id)));
}

function renderSettingsScreen() {
  if (!state.user) return;
  document.getElementById('petNameInput').value = state.user.pet_name;
  document.getElementById('waterGoalInput').value = state.user.water_goal;
  document.getElementById('darkModeToggle').checked = state.user.dark_mode;
}

function render() {
  renderSidebarPet();
  updatePetVisual();
  renderDashboard();
  renderMoodScreen();
  renderHealthScreen();
  renderNutritionScreen();
  renderHabitsScreen();
  renderCompanionScreen();
  renderSettingsScreen();
}

/* ---------- event listeners ---------- */

document.addEventListener('DOMContentLoaded', () => {
  // Auth
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  
  document.querySelectorAll('.auth-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const form = e.target.dataset.form;
      document.querySelectorAll('.auth-tab').forEach(b => b.classList.toggle('active', b.dataset.form === form));
      document.querySelectorAll('.auth-form').forEach(f => f.classList.toggle('active', f.id === form + 'Form'));
    });
  });

  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // Navigation
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.querySelectorAll('.quick-link').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Dashboard
  document.getElementById('waterMinus').addEventListener('click', () => changeWater(-1));
  document.getElementById('waterPlus').addEventListener('click', () => changeWater(1));

  // Mood
  document.getElementById('saveMoodBtn').addEventListener('click', saveMood);

  // Health
  document.getElementById('waterMinusHealth').addEventListener('click', () => changeWater(-1));
  document.getElementById('waterPlusHealth').addEventListener('click', () => changeWater(1));
  document.getElementById('saveSleepBtn').addEventListener('click', saveSleep);
  document.getElementById('addWorkoutBtn').addEventListener('click', addWorkout);

  // Nutrition
  document.getElementById('addMealBtn').addEventListener('click', addMeal);

  // Habits
  document.getElementById('addHabitBtn').addEventListener('click', addHabit);

  // Settings
  document.getElementById('savePetNameBtn').addEventListener('click', savePetName);
  document.getElementById('saveWaterGoalBtn').addEventListener('click', saveWaterGoal);
  document.getElementById('darkModeToggle').addEventListener('change', (e) => toggleDarkMode(e.target.checked));
  document.getElementById('resetDataBtn').addEventListener('click', resetAllData);

  boot();
});
