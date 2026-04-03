// ── STATE ────────────────────────────────────────────────────────────────────
let passage = '';
let typed = '';
let started = false;
let finished = false;
let startTime = null;
let timerInterval = null;
let countdown = null;
let mode = 'timed';   // 'timed' | 'words'
let modeVal = 30;      // seconds or word count

// ── SEEN TRACKING ────────────────────────────────────────────────────────────
// Persisted in localStorage so seen state survives page reloads.
const SEEN_KEY = val => `tt_seen_${val}`;

function loadSeen(val) {
  try {
    const raw = localStorage.getItem(SEEN_KEY(val));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveSeen(val, set) {
  try { localStorage.setItem(SEEN_KEY(val), JSON.stringify([...set])); } catch {}
}

function pickUnseen(pool, seen) {
  if (seen.size >= pool.length) seen.clear();
  const unseen = pool.map((_, i) => i).filter(i => !seen.has(i));
  return unseen[Math.floor(Math.random() * unseen.length)];
}

// ── DOM REFS ────────────────────────────────────────────────────────────────
const passageEl    = document.getElementById('passage');
const inputBox     = document.getElementById('inputBox');
const resultPanel  = document.getElementById('resultPanel');
const liveWpm      = document.getElementById('liveWpm');
const liveAcc      = document.getElementById('liveAcc');
const liveTime     = document.getElementById('liveTime');
const finalWpm     = document.getElementById('finalWpm');
const finalAcc     = document.getElementById('finalAcc');
const finalCorrect = document.getElementById('finalCorrect');
const finalErrors  = document.getElementById('finalErrors');
const progressBar  = document.querySelector('.underline-bar');
const pills        = document.querySelectorAll('.pill');

// ── INIT ────────────────────────────────────────────────────────────────────
let currentIdx = -1;

function pickPassage(reuse = false) {
  const pool = PASSAGES[modeVal] || PASSAGES[30];

  if (!reuse) {
    const seen = loadSeen(modeVal);
    currentIdx = pickUnseen(pool, seen);
    seen.add(currentIdx);
    saveSeen(modeVal, seen);
  }

  passage = pool[currentIdx];
}

function renderPassage() {
  passageEl.textContent = passage;
}

function init(reuse = false) {
  clearInterval(timerInterval);
  clearInterval(countdown);
  started = false;
  finished = false;
  typed = '';
  startTime = null;

  pickPassage(reuse);
  renderPassage();

  inputBox.value = '';
  inputBox.disabled = false;
  inputBox.placeholder = 'Start typing to begin…';

  resultPanel.classList.remove('visible');
  inputBox.style.display = '';

  liveWpm.textContent  = '—';
  liveAcc.textContent  = '—';
  liveTime.textContent = mode === 'timed' ? `${modeVal}s` : `0 / ${modeVal}w`;

  setProgress(0);
  inputBox.focus();
}

// ── PILL CONFIG ──────────────────────────────────────────────────────────────
pills.forEach(p => {
  p.addEventListener('click', () => {
    pills.forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    mode    = p.dataset.mode;
    modeVal = parseInt(p.dataset.val, 10);
    init(false);
  });
});

// ── TYPING ──────────────────────────────────────────────────────────────────
inputBox.addEventListener('input', () => {
  if (finished) return;

  typed = inputBox.value;

  if (!started && typed.length > 0) {
    started = true;
    startTime = Date.now();
    startTimers();
  }

  updateLiveStats();

  if (mode === 'words' && typed.length >= passage.length) {
    const typedWords = typed.trim().split(/\s+/).length;
    if (typedWords >= modeVal) finish();
  }
});

// Prevent paste
inputBox.addEventListener('paste', e => e.preventDefault());

function startTimers() {
  if (mode === 'timed') {
    let remaining = modeVal;
    liveTime.textContent = `${remaining}s`;

    countdown = setInterval(() => {
      remaining--;
      liveTime.textContent = `${remaining}s`;
      setProgress((modeVal - remaining) / modeVal * 100);
      if (remaining <= 0) finish();
    }, 1000);

  } else {
    timerInterval = setInterval(() => {
      const words = typed.trim().split(/\s+/).filter(Boolean).length;
      liveTime.textContent = `${words} / ${modeVal}w`;
      setProgress(words / modeVal * 100);
    }, 200);
  }
}

function updateLiveStats() {
  if (!startTime) return;
  const elapsedMin = (Date.now() - startTime) / 60000;
  const words = typed.trim().split(/\s+/).filter(Boolean).length;
  const wpm = elapsedMin > 0 ? Math.round(words / elapsedMin) : 0;

  let correct = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === passage[i]) correct++;
  }
  const acc = typed.length > 0 ? Math.round(correct / typed.length * 100) : 100;

  liveWpm.textContent = wpm;
  liveAcc.textContent = `${acc}%`;
}

// ── FINISH ──────────────────────────────────────────────────────────────────
function finish() {
  if (finished) return;
  finished = true;
  clearInterval(timerInterval);
  clearInterval(countdown);

  inputBox.disabled = true;
  inputBox.style.display = 'none';

  const elapsedMin = (Date.now() - startTime) / 60000;
  const words = typed.trim().split(/\s+/).filter(Boolean).length;
  const wpm = elapsedMin > 0 ? Math.round(words / elapsedMin) : 0;

  let correct = 0, errors = 0;
  const len = Math.min(typed.length, passage.length);
  for (let i = 0; i < len; i++) {
    typed[i] === passage[i] ? correct++ : errors++;
  }
  const acc = typed.length > 0 ? Math.round(correct / typed.length * 100) : 0;

  finalWpm.textContent     = wpm;
  finalAcc.textContent     = `${acc}%`;
  finalCorrect.textContent = correct;
  finalErrors.textContent  = errors;

  resultPanel.classList.add('visible');
  setProgress(100);
}

// ── PROGRESS BAR ────────────────────────────────────────────────────────────
function setProgress(pct) {
  progressBar.style.setProperty('--progress', `${Math.min(pct, 100)}%`);
}

// ── RETRY / NEW ──────────────────────────────────────────────────────────────
document.getElementById('retryBtn').addEventListener('click', () => init(true));
document.getElementById('newBtn').addEventListener('click', () => init(false));

// ── KEYBOARD SHORTCUTS ───────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') init(false);
  if (e.key === 'Tab') { e.preventDefault(); inputBox.focus(); }
});

// ── DARK MODE ────────────────────────────────────────────────────────────────
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = themeToggle.querySelector('.theme-icon');

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  themeIcon.textContent = dark ? '🌙' : '☀️';
  themeToggle.dataset.tooltip = dark ? 'Toggle Light Mode' : 'Toggle Dark Mode';
}

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
let isDark = prefersDark.matches;
applyTheme(isDark);

themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  applyTheme(isDark);
});

prefersDark.addEventListener('change', e => {
  isDark = e.matches;
  applyTheme(isDark);
});

// ── START ────────────────────────────────────────────────────────────────────
init();
