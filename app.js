/* ---------- Sprout — Wellness Companion (full-stack client) ---------- */

const ACCESSORY_META = {
  bowl: { emoji: '🥣' }, blanket: { emoji: '🧶' }, glasses: { emoji: '🕶️' },
  hat: { emoji: '🎩' }, collar: { emoji: '⭐' }, crown: { emoji: '🌸' }, scarf: { emoji: '🌈' },
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

/* ---------- api helper ---------- */

async function api(path, opts = {}) {
  const res = await fetch(path, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch (e) { /* empty body */ }
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

/* ---------- date helpers (display only — server owns the real logic) ---------- */

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
  try {
    const me = await api('auth/me.php');
    if (me.authenticated) {
      showApp();
      await refreshAll();
    } else {
      showAuthScreen();
    }
  } catch (e) {
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
    await api('auth/login.php', { method: 'POST', body: { email, password } });
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
    await api('auth/register.php', { method: 'POST', body: { name, email, password } });
    showApp();
    await refreshAll();
  } catch (err) {
    errEl.textContent = err.message;
  }
}

async function handleLogout() {
  try { await api('auth/logout.php', { method: 'POST' }); } catch (e) { /* ignore */ }
  state = { user: null, care: null, moodEntries: [], waterHistory: [], sleepHistory: [], workouts: [], meals: [], habits: [], accessories: [], points: 0 };
  showAuthScreen();
}

/* ---------- data loading ---------- */

async function refreshAll() {
  const [dash, mood, water, sleep, workouts, meals, habits, accessories] = await Promise.all([
    api('api/dashboard.php'),
    api('api/mood.php'),
    api('api/water.php'),
    api('api/sleep.php'),
    api('api/workouts.php'),
    api('api/meals.php'),
    api('api/habits.php'),
    api('api/accessories.php'),
  ]);
  state.user = dash.user;
  state.care = dash.care;
  state.moodEntries = mood.entries;
  state.waterHistory = water.history;
  state.sleepHistory = sleep.history;
  state.workouts = workouts.workouts;
  state.meals = meals.meals;
  state.habits = habits.habits;
  state.accessories = accessories.accessories;
  state.points = accessories.points;

  applyTheme();
  render();
}

function applyTheme() {
  document.body.classList.toggle('dark', !!(state.user && state.user.dark_mode));
}

/* ---------- actions ---------- */

async function changeWater(delta) {
  try {
    const res = await api('api/water.php', { method: 'POST', body: { delta } });
    if (res.bowlUnlocked) showToast('🎉 Water goal hit — Fancy Water Bowl unlocked for Sprout!');
    else if (res.awarded) showToast('💧 Water goal hit — +10 pts');
    await refreshAll();
  } catch (err) { showToast(err.message); }
}

async function saveMood() {
  if (pendingMood == null) return;
  const note = document.getElementById('moodNote').value.trim();
  try {
    const res = await api('api/mood.php', { method: 'POST', body: { value: pendingMood, note } });
    if (res.awarded) showToast('Mood logged — +5 pts');
    await refreshAll();
  } catch (err) { showToast(err.message); }
}

async function saveSleep() {
  const hours = parseFloat(document.getElementById('sleepHours').value);
  const quality = document.getElementById('sleepQuality').value;
  if (isNaN(hours) || hours < 0) return;
  try {
    const res = await api('api/sleep.php', { method: 'POST', body: { hours, quality } });
    if (res.awarded) showToast('Sleep logged — +' + res.points + ' pts');
    await refreshAll();
  } catch (err) { showToast(err.message); }
}

async function addWorkout() {
  const type = document.getElementById('workoutType').value;
  const duration = parseInt(document.getElementById('workoutDuration').value, 10);
  if (!duration || duration <= 0) return;
  try {
    await api('api/workouts.php', { method: 'POST', body: { type, duration } });
    document.getElementById('workoutDuration').value = '';
    showToast('Workout logged — +15 pts');
    await refreshAll();
  } catch (err) { showToast(err.message); }
}

async function addMeal() {
  const name = document.getElementById('mealName').value.trim();
  const type = document.getElementById('mealType').value;
  if (!name) return;
  try {
    await api('api/meals.php', { method: 'POST', body: { name, type } });
    document.getElementById('mealName').value = '';
    showToast('Meal logged — +5 pts');
    await refreshAll();
  } catch (err) { showToast(err.message); }
}

async function toggleHabit(id) {
  try {
    await api('api/habits.php?action=toggle', { method: 'POST', body: { id } });
    await refreshAll();
  } catch (err) { showToast(err.message); }
}

async function addHabit() {
  const input = document.getElementById('newHabitName');
  const name = input.value.trim();
  if (!name) return;
  try {
    await api('api/habits.php?action=add', { method: 'POST', body: { name } });
    input.value = '';
    await refreshAll();
  } catch (err) { showToast(err.message); }
}

async function removeHabit(id) {
  try {
    await api('api/habits.php?action=delete', { method: 'POST', body: { id } });
    await refreshAll();
  } catch (err) { showToast(err.message); }
}

async function unlockAccessory(id) {
  try {
    await api('api/accessories.php?action=unlock', { method: 'POST', body: { id } });
    const meta = ACCESSORY_META[id] || {};
    showToast((meta.emoji || '') + ' Unlocked!');
    await refreshAll();
  } catch (err) { showToast(err.message); }
}

async function equipAccessory(id) {
  try {
    await api('api/accessories.php?action=equip', { method: 'POST', body: { id } });
    await refreshAll();
  } catch (err) { showToast(err.message); }
}

async function savePetName() {
  const val = document.getElementById('petNameInput').value.trim();
  if (!val) return;
  try {
    await api('api/settings.php', { method: 'POST', body: { petName: val } });
    showToast('Saved');
    await refreshAll();
  } catch (err) { showToast(err.message); }
}

async function saveWaterGoal() {
  const val = parseInt(document.getElementById('waterGoalInput').value, 10);
  if (!val || val <= 0 || val > 20) {
    showToast('Water goal must be between 1 and 20 cups');
    return;
  }
  try {
    await api('api/settings.php', { method: 'POST', body: { waterGoal: val } });
    showToast('Saved');
    await refreshAll();
  } catch (err) { showToast(err.message); }
}

async function toggleDarkMode(checked) {
  try {
    await api('api/settings.php', { method: 'POST', body: { darkMode: checked } });
    await refreshAll();
  } catch (err) { showToast(err.message); }
}

async function resetAllData() {
  if (!confirm('Reset all Sprout data? This cannot be undone.')) return;
  try {
    await api('api/reset.php', { method: 'POST' });
    await refreshAll();
  } catch (err) { showToast(err.message); }
}

/* ---------- rendering ---------- */

function switchTab(tab) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === 'screen-' + tab));
  // Reset mood selection when switching away from mood screen
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
  
  // Initialize pendingMood from database if not already set
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
    '<span class="habit-streak">🔥 ' + h.streak + '</span>' +
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
  document.getElementById('petNameInput').value = state.user.pet_name;
  document.getElementById('waterGoalInput').value = state.user.water_goal;
  document.getElementById('darkModeToggle').checked = !!state.user.dark_mode;
}

function render() {
  if (!state.user) return;
  renderSidebarPet();
  renderDashboard();
  renderMoodScreen();
  renderHealthScreen();
  renderNutritionScreen();
  renderHabitsScreen();
  renderCompanionScreen();
  renderSettingsScreen();
  updatePetVisual();
}

/* ---------- init ---------- */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-item, .quick-link').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.auth-form').forEach(f => f.classList.toggle('active', f.id === tab.dataset.form + 'Form'));
    });
  });

  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  document.getElementById('waterPlus').addEventListener('click', () => changeWater(1));
  document.getElementById('waterMinus').addEventListener('click', () => changeWater(-1));
  document.getElementById('waterPlusHealth').addEventListener('click', () => changeWater(1));
  document.getElementById('waterMinusHealth').addEventListener('click', () => changeWater(-1));

  document.getElementById('saveMoodBtn').addEventListener('click', saveMood);
  document.getElementById('saveSleepBtn').addEventListener('click', saveSleep);
  document.getElementById('addWorkoutBtn').addEventListener('click', addWorkout);
  document.getElementById('addMealBtn').addEventListener('click', addMeal);
  document.getElementById('addHabitBtn').addEventListener('click', addHabit);
  document.getElementById('savePetNameBtn').addEventListener('click', savePetName);
  document.getElementById('saveWaterGoalBtn').addEventListener('click', saveWaterGoal);
  document.getElementById('darkModeToggle').addEventListener('change', (e) => toggleDarkMode(e.target.checked));
  document.getElementById('resetDataBtn').addEventListener('click', resetAllData);

  boot();
});
