/* ══════════════════════════════════════════════
   QueuePro — JavaScript Engine v2.0
   Features: Student + Admin + 14 New Features
══════════════════════════════════════════════ */

// ─── App State ───
const state = {
  role: null,
  college: '',
  userName: '',
  theme: localStorage.getItem('qp-theme') || 'dark',
  selectedService: 'Examination Form',
  selectedTime: null,
  currentRating: 0,
  queuePosition: 7,
  tokenNumber: 'T-0049',
  queuePaused: false,
  currentServing: 42,
  broadcastType: 'info',
  soundEnabled: true,
  confettiRunning: false,
  counters: [
    { id: 1, name: 'Counter C-1', status: 'open',   token: 'T-0042', waiting: 8 },
    { id: 2, name: 'Counter C-2', status: 'open',   token: 'T-0031', waiting: 5 },
    { id: 3, name: 'Counter C-3', status: 'busy',   token: 'T-0019', waiting: 12 },
    { id: 4, name: 'Counter C-4', status: 'closed', token: '—',       waiting: 0 },
  ],
  adminStudents: [
    { token:'T-0042', name:'Rahul Sharma',  service:'Examination Form', time:'10:00 AM', status:'Processing' },
    { token:'T-0043', name:'Priya Gupta',   service:'TC / Migration',   time:'10:15 AM', status:'Waiting'    },
    { token:'T-0044', name:'Aman Singh',    service:'Scholarship',      time:'10:30 AM', status:'Waiting'    },
    { token:'T-0045', name:'Sneha Patel',   service:'Bonafide Cert.',   time:'10:45 AM', status:'Waiting'    },
    { token:'T-0046', name:'Karan Mehta',   service:'ID Card',          time:'11:00 AM', status:'Waiting'    },
    { token:'T-0047', name:'Riya Verma',    service:'Fee Submission',   time:'11:15 AM', status:'Waiting'    },
    { token:'T-0048', name:'Nikhil Joshi',  service:'Examination Form', time:'11:30 AM', status:'Waiting'    },
    { token:'T-0049', name:'Aditya Kumar',  service:'Examination Form', time:'11:45 AM', status:'Waiting'    },
    { token:'T-0050', name:'Pooja Das',     service:'Scholarship',      time:'12:00 PM', status:'Waiting'    },
  ],
  docRequirements: {
    'Examination Form':    ['Aadhar Card', 'College ID', 'Fee Receipt'],
    'TC / Migration':      ['Aadhar Card', 'College ID', 'NOC from Department', 'Fee Clearance'],
    'Scholarship':         ['Aadhar Card', 'Income Certificate', 'Marksheet'],
    'Bonafide Certificate':['Aadhar Card', 'College ID'],
    'ID Card':             ['Passport Photo', 'College ID Proof'],
    'Fee Submission':      ['Fee Challan', 'College ID'],
  }
};

// ─── Chart references (allow re-render) ───
let charts = {};

// ─── DOM Ready ───
window.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  setDefaultDate();
  generateQueuePeople();
  generateQueueList();
  generateQRCode();
  initBusyChart();
  animateCounters();
  setToday();
  startLiveUpdates();
  startClock();
  spawnParticles();
  restoreSession();
  initSmartGreeting();
  updateCountdownRing(state.queuePosition * 2.5);
  generateHeatmap();
  buildCounterBoard();
});

// ══════════════════════════════════════════
//  THEME
// ══════════════════════════════════════════
function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const icon  = document.getElementById('theme-icon');
  const aIcon = document.getElementById('a-theme-icon');
  const label = document.getElementById('theme-label');
  const isDark = state.theme === 'dark';
  if (icon)  icon.className  = isDark ? 'fas fa-moon' : 'fas fa-sun';
  if (aIcon) aIcon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
  if (label) label.textContent = isDark ? 'Dark Mode' : 'Light Mode';
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('qp-theme', state.theme);
  applyTheme();
  showToast(state.theme === 'dark' ? '🌙 Dark mode on' : '☀️ Light mode on');
  // Destroy and recreate charts so they pick up new colors
  setTimeout(() => {
    destroyAllCharts();
    initBusyChart();
    if (document.getElementById('adminWeekChart')) initAdminCharts();
  }, 200);
}

function destroyAllCharts() {
  Object.values(charts).forEach(c => { try { c.destroy(); } catch(e){} });
  charts = {};
  // Reset canvas init flags
  ['busyChart','adminWeekChart','adminPieChart','adminMonthChart'].forEach(id => {
    const el = document.getElementById(id);
    if (el) delete el.dataset.chartInit;
  });
}

// ══════════════════════════════════════════
//  SESSION PERSISTENCE
// ══════════════════════════════════════════
function restoreSession() {
  const saved = JSON.parse(localStorage.getItem('qp-session') || '{}');
  if (saved.college) {
    const sel = document.getElementById('college-select');
    if (sel) sel.value = saved.college;
  }
  if (saved.remember) {
    const rem = document.getElementById('remember-me');
    if (rem) rem.checked = true;
  }
}

function saveSession() {
  const remember = document.getElementById('remember-me')?.checked;
  if (remember) {
    localStorage.setItem('qp-session', JSON.stringify({ college: state.college, remember: true }));
  } else {
    localStorage.removeItem('qp-session');
  }
}

// ══════════════════════════════════════════
//  SMART GREETING
// ══════════════════════════════════════════
function initSmartGreeting() {
  const hour = new Date().getHours();
  let greeting, emoji, sub;
  if (hour < 12) {
    greeting = 'Good Morning'; emoji = '☀️';
    sub = 'Early bird! Queue is usually lighter before 10 AM.';
  } else if (hour < 17) {
    greeting = 'Good Afternoon'; emoji = '⚡';
    sub = 'Peak hours active. Your queue overview for today:';
  } else {
    greeting = 'Good Evening'; emoji = '🌙';
    sub = 'Winding down. Great time — queue is light after 4 PM!';
  }
  const emojiEl = document.getElementById('s-greeting-emoji');
  const subEl   = document.getElementById('s-greeting-sub');
  if (emojiEl) emojiEl.textContent = emoji;
  if (subEl)   subEl.textContent   = sub;
}

// ══════════════════════════════════════════
//  LANDING PAGE
// ══════════════════════════════════════════
function selectRole(role) {
  state.role = role;
  document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll(`.role-card[data-role="${role}"]`).forEach(c => c.classList.add('selected'));
}

function launchDashboard() {
  const college = document.getElementById('college-select').value;
  const name    = document.getElementById('user-name').value.trim();

  if (!college) { showToast('⚠️ Please select your college'); return; }
  if (!name)    { showToast('⚠️ Please enter your name');    return; }
  if (!state.role) { showToast('⚠️ Please choose a role');  return; }

  state.college  = college;
  state.userName = name;
  saveSession();

  const initial = name.charAt(0).toUpperCase();
  if (state.role === 'student') {
    setEl('s-avatar', initial);
    setEl('s-name', name);
    setEl('s-college', college);
    setEl('s-college-badge', college);
    setEl('s-welcome-name', name.split(' ')[0]);
    setEl('t-college', college);
    setEl('p-avatar-big', initial);
    setEl('p-name-big', name);
    setEl('p-college-name', college);
    setVal('pf-name', name);
    setVal('pf-college', college);
    setEl('print-college', college);
    switchPage('student-page');
    initAdminCharts();
    animateCounters();
    initSmartGreeting();
    updateOfficeHours();
  } else {
    setEl('a-name', name);
    setEl('a-college', college);
    setEl('a-college-badge', college);
    setVal('a-college-input', college);
    setVal('a-admin-name', name);
    switchPage('admin-page');
    buildAdminStudents();
    buildUpcoming();
    buildTodayWork();
    buildFullTokenList();
    initAdminCharts();
    animateCounters();
    generateHeatmap();
    buildCounterBoard();
  }
  showToast('✅ Welcome, ' + name.split(' ')[0] + '!');
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
}

function logout() {
  switchPage('landing-page');
  state.role = null;
  showToast('👋 Logged out successfully');
}

// ══════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════
function showSection(id, role, linkEl) {
  const page = role === 'student' ? 'student-page' : 'admin-page';
  document.querySelectorAll(`#${page} .content-section`).forEach(s => s.classList.remove('active'));
  const sec = document.getElementById(id);
  if (sec) sec.classList.add('active');

  // Update active nav link
  if (linkEl) {
    document.querySelectorAll(`#${page} .nav-link`).forEach(l => l.classList.remove('active'));
    linkEl.classList.add('active');
  }

  // Title update
  const titles = {
    's-dashboard':'Dashboard','s-booking':'Slot Booking','s-queue':'Live Queue',
    's-token':'My Token','s-documents':'Documents','s-history':'Token History',
    's-feedback':'Feedback','s-profile':'Profile','s-notifications':'Notifications',
    'a-dashboard':'Admin Dashboard','a-queue-control':'Queue Control','a-students':'Students',
    'a-analytics':'Analytics','a-heatmap':'Activity Heatmap','a-counters':'Live Counters',
    'a-documents':'Doc Manager','a-broadcast':'Broadcast','a-settings':'Settings'
  };
  const titleEl = document.getElementById(role === 'student' ? 's-topbar-title' : 'a-topbar-title');
  if (titleEl && titles[id]) titleEl.textContent = titles[id];

  // Lazy init
  if (id === 's-queue')    refreshQueue();
  if (id === 'a-analytics') setTimeout(() => { destroyAllCharts(); initAdminCharts(); }, 100);
  if (id === 'a-heatmap')  generateHeatmap();
  if (id === 'a-counters') buildCounterBoard();

  animateCounters();
  closeSidebars();
}

function showAdminSection(id, linkEl) {
  showSection(id, 'admin', linkEl);
}

// ── Sidebar toggles ──
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}
function toggleAdminSidebar() {
  document.getElementById('admin-sidebar').classList.toggle('open');
}
function closeSidebars() {
  if (window.innerWidth <= 800) {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('admin-sidebar')?.classList.remove('open');
  }
}

// ══════════════════════════════════════════
//  SMART CLOCK
// ══════════════════════════════════════════
function startClock() {
  const tick = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    setEl('clock-time', `${h}:${m}:${s}`);
    setEl('clock-date', now.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' }));
    setEl('smart-day', now.toLocaleDateString('en-IN', { weekday: 'short' }));
    updateOfficeHours(now);
  };
  tick();
  setInterval(tick, 1000);
}

function updateOfficeHours(now) {
  now = now || new Date();
  const start = 9, end = 17;
  const h = now.getHours() + now.getMinutes() / 60;
  const pct = Math.min(100, Math.max(0, ((h - start) / (end - start)) * 100));
  const ohFill = document.getElementById('oh-fill');
  const ohStatus = document.getElementById('oh-status');
  if (ohFill) ohFill.style.width = pct + '%';
  if (ohStatus) {
    if (h >= start && h < end) {
      ohStatus.textContent = 'Open';
      ohStatus.className = 'oh-open';
    } else {
      ohStatus.textContent = 'Closed';
      ohStatus.className = 'oh-closed';
    }
  }
}

// ══════════════════════════════════════════
//  FLOATING PARTICLES
// ══════════════════════════════════════════
function spawnParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.top  = Math.random() * 100 + '%';
    const colors = ['#00d4ff','#7c3aed','#ff4d8b','#00e676'];
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDuration = (Math.random() * 8 + 4) + 's';
    p.style.animationDelay    = (Math.random() * 6) + 's';
    p.style.width = p.style.height = (Math.random() * 4 + 2) + 'px';
    container.appendChild(p);
  }
}

// ══════════════════════════════════════════
//  QUEUE PEOPLE ANIMATION
// ══════════════════════════════════════════
const emojis = ['👨‍🎓','👩‍🎓','🧑‍🎓','👨','👩','🧑','👦','👧'];
function generateQueuePeople() {
  const el = document.getElementById('queue-people');
  if (!el) return;
  el.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
    const div = document.createElement('div');
    div.className = 'queue-person ' + (i === state.queuePosition ? 'you' : 'other');
    div.textContent = i === state.queuePosition ? '⭐' : emojis[Math.floor(Math.random() * emojis.length)];
    div.title = i === state.queuePosition ? 'You' : `Person ${i}`;
    div.style.animationDelay = (i * 0.05) + 's';
    el.appendChild(div);
  }
}

function generateQueueList() {
  const list = document.getElementById('queue-list');
  if (!list) return;
  list.innerHTML = '';
  const names = ['Rahul S.','Priya G.','Aman K.','Sneha P.','Karan M.','Riya V.','You','Nikhil J.','Pooja D.','Arav S.'];
  names.forEach((name, i) => {
    const item = document.createElement('div');
    const pos  = i + 1;
    item.className = 'q-list-item' + (pos === state.queuePosition ? ' yours' : '') + (pos === 1 ? ' current' : '');
    item.innerHTML = `
      <span class="q-num">#${pos}</span>
      <div class="q-avatar">${emojis[i % emojis.length]}</div>
      <span class="q-name">${name}</span>
      <span class="q-time">${pos === 1 ? '🟢 Now' : `~${(pos * 2.5) | 0} min`}</span>
      ${pos === state.queuePosition ? '<span class="chip cyan">You</span>' : ''}
    `;
    list.appendChild(item);
  });
}

function refreshQueue() {
  generateQueueList();
  showToast('🔄 Queue refreshed');
}

// ══════════════════════════════════════════
//  COUNTDOWN RING
// ══════════════════════════════════════════
function updateCountdownRing(minutes) {
  const numEl = document.getElementById('countdown-num');
  const ring  = document.getElementById('ring-fill');
  if (numEl) numEl.textContent = Math.round(minutes);
  if (ring) {
    const circumference = 2 * Math.PI * 34; // 213.6
    const maxMinutes = 60;
    const pct = Math.min(1, minutes / maxMinutes);
    ring.style.strokeDashoffset = circumference * (1 - pct);
  }
}

// ══════════════════════════════════════════
//  POSITION ALERT
// ══════════════════════════════════════════
function checkPositionAlert(pos) {
  const bar = document.getElementById('position-alert-bar');
  const txt = document.getElementById('position-alert-text');
  if (!bar) return;
  if (pos <= 5 && pos > 0) {
    bar.style.display = 'flex';
    if (txt) txt.textContent = `🔔 You're ${pos} position${pos === 1 ? '' : 's'} away! Head to Counter C-3 now.`;
    if (state.soundEnabled && pos <= 3) playBeep();
  } else {
    bar.style.display = 'none';
  }
}

// ══════════════════════════════════════════
//  SOUND ALERT
// ══════════════════════════════════════════
let audioCtx = null;
function playBeep() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    osc.start(); osc.stop(audioCtx.currentTime + 0.6);
  } catch(e) {}
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  const btn = document.getElementById('sound-btn');
  if (btn) {
    btn.innerHTML = state.soundEnabled
      ? '<i class="fas fa-volume-up"></i>'
      : '<i class="fas fa-volume-mute"></i>';
    btn.classList.toggle('muted', !state.soundEnabled);
  }
  showToast(state.soundEnabled ? '🔊 Sound alerts on' : '🔇 Sound alerts off');
}

// ══════════════════════════════════════════
//  SLOT BOOKING
// ══════════════════════════════════════════
function selectService(el, service) {
  document.querySelectorAll('.service-item').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  state.selectedService = service;
  // Update doc hint
  const docs = state.docRequirements[service] || [];
  const hintEl = document.getElementById('booking-doc-text');
  if (hintEl) hintEl.textContent = docs.length ? 'Bring: ' + docs.join(', ') : 'No specific documents required.';
}

function selectTime(el) {
  document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  state.selectedTime = el.childNodes[0].textContent.trim();
}

function confirmBooking() {
  const date = document.getElementById('booking-date').value;
  if (!date) { showToast('⚠️ Please select a date'); return; }
  if (!state.selectedTime) { showToast('⚠️ Please select a time slot'); return; }

  // Update token display
  setEl('t-number', 'T-0050');
  setEl('t-service', state.selectedService);
  setEl('t-time', state.selectedTime);
  setEl('print-token-num', 'T-0050');
  setEl('print-service', state.selectedService);
  setEl('print-date', date);
  setEl('print-time', state.selectedTime);
  state.tokenNumber = 'T-0050';
  state.selectedService = state.selectedService;

  openModal(`
    <div style="text-align:center;padding:16px 0">
      <div style="font-size:3rem;margin-bottom:12px">🎉</div>
      <h3 style="font-family:'Syne',sans-serif;font-size:1.4rem;margin-bottom:8px">Booking Confirmed!</h3>
      <p style="color:var(--text-sec);margin-bottom:16px">Your slot has been booked successfully</p>
      <div style="background:rgba(0,212,255,0.08);border:1px solid rgba(0,212,255,0.2);border-radius:12px;padding:16px;text-align:left;display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;justify-content:space-between;font-size:0.85rem"><span style="color:var(--text-sec)">Service</span><strong>${state.selectedService}</strong></div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem"><span style="color:var(--text-sec)">Date</span><strong>${date}</strong></div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem"><span style="color:var(--text-sec)">Time</span><strong>${state.selectedTime}</strong></div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem"><span style="color:var(--text-sec)">Token</span><strong style="color:var(--accent-cyan)">T-0050</strong></div>
      </div>
      <button class="btn-primary full-width mt" onclick="closeModal();showSection('s-token','student',null)">
        <i class="fas fa-ticket-alt"></i> View Token
      </button>
    </div>
  `);
  triggerConfetti();
}

// ══════════════════════════════════════════
//  CONFETTI
// ══════════════════════════════════════════
function triggerConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas || state.confettiRunning) return;
  state.confettiRunning = true;
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    w: Math.random() * 10 + 4,
    h: Math.random() * 6 + 3,
    color: ['#00d4ff','#7c3aed','#ff4d8b','#ffd700','#00e676','#ff6b35'][Math.floor(Math.random()*6)],
    speed: Math.random() * 4 + 2,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.2,
    drift: (Math.random() - 0.5) * 2,
  }));

  let frame = 0;
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.y += p.speed;
      p.x += p.drift;
      p.angle += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
    });
    frame++;
    if (frame < 150) requestAnimationFrame(animate);
    else { ctx.clearRect(0, 0, canvas.width, canvas.height); state.confettiRunning = false; }
  };
  animate();
}

// ══════════════════════════════════════════
//  QR CODE
// ══════════════════════════════════════════
function generateQRCode() {
  const el = document.getElementById('qrcode');
  if (!el || el.dataset.generated) return;
  try {
    new QRCode(el, {
      text: `QUEUEPRO|TOKEN:${state.tokenNumber}|COLLEGE:${state.college || 'IIT Delhi'}|SERVICE:Examination Form|DATE:${new Date().toLocaleDateString()}`,
      width: 110, height: 110,
      colorDark: '#000000', colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
    el.dataset.generated = 'true';
  } catch(e) {
    el.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:#333">QR Code</div>';
  }
}

// ══════════════════════════════════════════
//  DOWNLOAD TOKEN
// ══════════════════════════════════════════
function downloadToken() {
  const canvas = document.createElement('canvas');
  canvas.width = 400; canvas.height = 580;
  const ctx = canvas.getContext('2d');

  // Background
  const grad = ctx.createLinearGradient(0,0,400,580);
  grad.addColorStop(0, '#0d1320'); grad.addColorStop(1, '#1a2035');
  ctx.fillStyle = grad; ctx.fillRect(0,0,400,580);

  // Glowing border
  ctx.strokeStyle = '#00d4ff'; ctx.lineWidth = 2;
  ctx.strokeRect(10,10,380,560);

  // Header strip
  ctx.fillStyle = 'rgba(0,212,255,0.1)'; ctx.fillRect(10,10,380,80);
  ctx.fillStyle = '#00d4ff'; ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center'; ctx.fillText('⬡ QueuePro', 200, 40);
  ctx.fillStyle = '#8a9ab5'; ctx.font = '13px sans-serif';
  ctx.fillText(state.college || 'IIT Delhi', 200, 62);
  ctx.fillText('OFFICIAL TOKEN', 200, 80);

  // Token number
  ctx.fillStyle = '#e8edf5'; ctx.font = 'bold 68px sans-serif';
  ctx.fillText(state.tokenNumber, 200, 200);

  // Service
  ctx.fillStyle = '#00d4ff'; ctx.font = '16px sans-serif';
  ctx.fillText(state.selectedService, 200, 226);

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
  ctx.setLineDash([6,4]);
  ctx.beginPath(); ctx.moveTo(30,250); ctx.lineTo(370,250); ctx.stroke();
  ctx.setLineDash([]);

  // Details
  const details = [
    ['Date', new Date().toLocaleDateString()],
    ['Time', state.selectedTime || '10:00 AM'],
    ['Counter', 'C-3'],
    ['College', state.college || 'IIT Delhi'],
  ];
  details.forEach(([label, val], i) => {
    const y = 282 + i * 46;
    ctx.fillStyle = '#8a9ab5'; ctx.font = '13px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(label, 50, y);
    ctx.fillStyle = '#e8edf5'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(val, 350, y);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(30, y+10); ctx.lineTo(370, y+10); ctx.stroke();
  });

  // Footer
  ctx.fillStyle = 'rgba(0,212,255,0.08)'; ctx.fillRect(10,488,380,82);
  ctx.fillStyle = '#8a9ab5'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Show this token at the counter', 200, 512);
  ctx.fillStyle = '#00d4ff'; ctx.font = 'bold 12px sans-serif';
  ctx.fillText('🌐 queuepro.college.edu', 200, 536);
  ctx.fillStyle = '#4a5568'; ctx.font = '10px sans-serif';
  ctx.fillText('Generated: ' + new Date().toLocaleString(), 200, 558);

  const link = document.createElement('a');
  link.download = `${state.tokenNumber.replace('-','_')}_token.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('📥 Token downloaded!');
}

// ══════════════════════════════════════════
//  PRINT TOKEN
// ══════════════════════════════════════════
function printToken() {
  setEl('print-college', state.college || 'IIT Delhi');
  setEl('print-token-num', state.tokenNumber);
  setEl('print-service', state.selectedService);
  setEl('print-date', new Date().toLocaleDateString());
  setEl('print-time', state.selectedTime || '10:00 AM');
  window.print();
  showToast('🖨️ Print dialog opened');
}

// ══════════════════════════════════════════
//  SHARE TOKEN
// ══════════════════════════════════════════
function shareToken() {
  const text = `QueuePro Token 🎫\nToken: ${state.tokenNumber}\nService: ${state.selectedService}\nCollege: ${state.college}\nTime: ${state.selectedTime || '10:00 AM'}\nCounter: C-3`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast('📋 Token details copied!'));
  } else {
    showToast('📋 Copy: ' + state.tokenNumber);
  }
}

function shareWhatsApp() {
  const text = encodeURIComponent(`QueuePro Token 🎫\nToken: ${state.tokenNumber}\nService: ${state.selectedService}\nCollege: ${state.college}\nTime: ${state.selectedTime || '10:00 AM'}\nCounter: C-3`);
  window.open(`https://wa.me/?text=${text}`, '_blank');
  showToast('📱 Opening WhatsApp...');
}

// ══════════════════════════════════════════
//  CANCEL / RESCHEDULE
// ══════════════════════════════════════════
function cancelBookingPrompt() {
  openModal(`
    <div style="text-align:center;padding:16px 0">
      <div style="font-size:2.5rem;margin-bottom:12px">⚠️</div>
      <h3 style="font-family:'Syne',sans-serif;font-size:1.2rem;margin-bottom:8px">Cancel Booking?</h3>
      <p style="color:var(--text-sec);font-size:0.88rem;margin-bottom:20px">Your token <strong>${state.tokenNumber}</strong> will be cancelled. This cannot be undone.</p>
      <div style="display:flex;gap:10px">
        <button class="btn-outline full-width" onclick="closeModal()">Keep Booking</button>
        <button class="btn-primary full-width" style="background:linear-gradient(135deg,#ff4444,#ff6b35)" onclick="confirmCancel()">Yes, Cancel</button>
      </div>
    </div>
  `);
}

function confirmCancel() {
  closeModal();
  showToast('❌ Booking cancelled successfully');
}

function reschedulePrompt() {
  openModal(`
    <div style="padding:8px 0">
      <h3 style="font-family:'Syne',sans-serif;font-size:1.2rem;margin-bottom:16px"><i class="fas fa-sync-alt" style="color:var(--accent-cyan)"></i> Reschedule Token</h3>
      <div class="form-group">
        <label>New Date</label>
        <input type="date" id="reschedule-date" class="date-input" />
      </div>
      <div class="form-group">
        <label>New Time</label>
        <select id="reschedule-time" style="width:100%;padding:11px 14px;background:rgba(255,255,255,0.07);border:1px solid var(--border);border-radius:10px;color:var(--text-primary);font-family:'DM Sans',sans-serif;outline:none;appearance:none">
          <option>9:00 AM</option><option>10:00 AM</option>
          <option>12:00 PM</option><option>2:00 PM</option><option>4:00 PM</option>
        </select>
      </div>
      <button class="btn-primary full-width mt" onclick="confirmReschedule()"><i class="fas fa-check"></i> Confirm Reschedule</button>
    </div>
  `);
}

function confirmReschedule() {
  closeModal();
  showToast('📅 Token rescheduled successfully!');
}

// ══════════════════════════════════════════
//  FILE UPLOAD
// ══════════════════════════════════════════
function handleFileUpload(e) {
  Array.from(e.target.files).forEach(file => addUploadItem(file));
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('upload-area')?.classList.remove('drag-over');
  Array.from(e.dataTransfer.files).forEach(file => addUploadItem(file));
}

function addUploadItem(file) {
  if (file.size > 5 * 1024 * 1024) { showToast('⚠️ File too large (max 5MB)'); return; }
  const list = document.getElementById('upload-list');
  if (!list) return;
  const item = document.createElement('div');
  item.className = 'upload-item';
  const size = (file.size / 1024).toFixed(1) + ' KB';
  const icon = file.type.includes('pdf') ? 'fa-file-pdf' : file.type.includes('image') ? 'fa-file-image' : 'fa-file';
  item.innerHTML = `<i class="fas ${icon}"></i><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${file.name}</span><small style="color:var(--text-sec);white-space:nowrap">${size}</small><i class="fas fa-times rm" onclick="this.parentElement.remove();showToast('🗑️ File removed')"></i>`;
  list.appendChild(item);
  showToast(`✅ ${file.name} added`);
}

// ══════════════════════════════════════════
//  FEEDBACK
// ══════════════════════════════════════════
function rateStar(n) {
  state.currentRating = n;
  document.querySelectorAll('#star-rating i').forEach((star, i) => {
    star.classList.toggle('lit', i < n);
  });
  const labels = ['','Poor 😕','Fair 😐','Good 😊','Great 😄','Excellent! 🤩'];
  setEl('rating-label', labels[n]);
}

function toggleTag(el) { el.classList.toggle('active'); }

function submitFeedback() {
  if (!state.currentRating) { showToast('⭐ Please rate first'); return; }
  const tags = [...document.querySelectorAll('.fb-tag.active')].map(t => t.textContent).join(', ');
  openModal(`
    <div style="text-align:center;padding:16px 0">
      <div style="font-size:3rem;margin-bottom:12px">🙏</div>
      <h3 style="font-family:'Syne',sans-serif;font-size:1.3rem;margin-bottom:8px">Thanks for your feedback!</h3>
      <p style="color:var(--text-sec);font-size:0.88rem">Rating: ${'⭐'.repeat(state.currentRating)}</p>
      ${tags ? `<p style="color:var(--text-sec);font-size:0.8rem;margin-top:6px">Tags: ${tags}</p>` : ''}
      <button class="btn-primary mt full-width" onclick="closeModal()">Close</button>
    </div>
  `);
  triggerConfetti();
}

// ══════════════════════════════════════════
//  PROFILE
// ══════════════════════════════════════════
function editProfile() { showToast('✏️ Edit profile fields below'); }

function saveProfile() {
  const name = document.getElementById('pf-name')?.value || state.userName;
  setEl('s-name', name);
  setEl('p-name-big', name);
  setEl('s-avatar', name.charAt(0).toUpperCase());
  setEl('p-avatar-big', name.charAt(0).toUpperCase());
  state.userName = name;
  showToast('✅ Profile saved!');
}

// ══════════════════════════════════════════
//  NOTIFICATIONS
// ══════════════════════════════════════════
function clearNotifs() {
  document.querySelectorAll('.notif-item.unread').forEach(n => n.classList.remove('unread'));
  const dot   = document.getElementById('s-notif-dot');
  const badge = document.getElementById('notif-badge');
  if (dot)   dot.style.display   = 'none';
  if (badge) badge.style.display = 'none';
  showToast('✅ All notifications cleared');
}

// ══════════════════════════════════════════
//  HISTORY
// ══════════════════════════════════════════
function filterHistory(e) {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll('#history-tbody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function viewToken(id) {
  showToast(`📋 Viewing token #${id}`);
}

// ══════════════════════════════════════════
//  ADMIN: Build Student Lists
// ══════════════════════════════════════════
function buildAdminStudents(data) {
  const tbody = document.getElementById('admin-students-tbody');
  if (!tbody) return;
  const list = data || state.adminStudents;
  tbody.innerHTML = list.map(s => `
    <tr>
      <td><strong style="color:var(--accent-cyan)">${s.token}</strong></td>
      <td>${s.name}</td>
      <td>${s.service}</td>
      <td>${s.time}</td>
      <td>${statusChip(s.status)}</td>
      <td><button class="btn-sm" onclick="adminAction('${s.token}')">Manage</button></td>
    </tr>
  `).join('');
}

function filterAdminStudents(e) {
  const q = e.target.value.toLowerCase();
  const filtered = state.adminStudents.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.token.toLowerCase().includes(q) ||
    s.service.toLowerCase().includes(q) ||
    s.status.toLowerCase().includes(q)
  );
  buildAdminStudents(filtered);
}

function statusChip(status) {
  const map = { Processing: 'purple', Waiting: 'orange', Done: 'green', Cancelled: 'red' };
  return `<span class="chip ${map[status] || 'cyan'}">${status}</span>`;
}

function buildUpcoming() {
  const list = document.getElementById('upcoming-list');
  if (!list) return;
  list.innerHTML = state.adminStudents.slice(0, 5).map((s, i) => `
    <div class="upcoming-item">
      <span class="up-num">${i + 1}</span>
      <div>
        <div class="up-name">${s.name}</div>
        <div class="up-service">${s.service}</div>
      </div>
      <span class="up-time">${s.time}</span>
      ${statusChip(s.status)}
    </div>
  `).join('');
}

function buildTodayWork() {
  const list = document.getElementById('todays-list');
  if (!list) return;
  const done = [
    { token:'T-0035', name:'Amit Shah',   service:'Fee Submission',  status:'done' },
    { token:'T-0036', name:'Neha Roy',    service:'Bonafide Cert.',  status:'done' },
    { token:'T-0037', name:'Suresh K.',   service:'TC / Migration',  status:'done' },
    { token:'T-0038', name:'Kavita M.',   service:'Scholarship',     status:'pending' },
    { token:'T-0039', name:'Rohan D.',    service:'ID Card',         status:'done' },
  ];
  list.innerHTML = done.map(d => `
    <div class="todays-item">
      <i class="fas ${d.status === 'done' ? 'fa-check-circle done' : 'fa-clock pending-t'}"></i>
      <div style="flex:1">
        <div style="font-weight:600;font-size:0.85rem">${d.name}</div>
        <div style="font-size:0.75rem;color:var(--text-sec)">${d.service}</div>
      </div>
      <strong style="font-size:0.8rem;color:var(--accent-cyan)">${d.token}</strong>
    </div>
  `).join('');
}

function buildFullTokenList() {
  const list = document.getElementById('full-token-list');
  if (!list) return;
  list.innerHTML = state.adminStudents.map(s => `
    <div class="ft-item">
      <span class="ft-num">${s.token}</span>
      <div class="ft-info">
        <div style="font-weight:600;font-size:0.85rem">${s.name}</div>
        <div class="ft-service">${s.service} · ${s.time}</div>
      </div>
      ${statusChip(s.status)}
      <button class="btn-sm" onclick="adminAction('${s.token}')">⚡</button>
    </div>
  `).join('');
}

function adminAction(token) {
  openModal(`
    <div>
      <h3 style="font-family:'Syne',sans-serif;font-size:1.2rem;margin-bottom:16px">Manage Token <span style="color:var(--accent-cyan)">${token}</span></h3>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="ctrl-btn green" style="width:100%;justify-content:flex-start" onclick="markTokenDone('${token}')"><i class="fas fa-check"></i> Mark as Done</button>
        <button class="ctrl-btn cyan" style="width:100%;justify-content:flex-start" onclick="closeModal();showToast('📢 Student called to counter')"><i class="fas fa-bullhorn"></i> Call Student</button>
        <button class="ctrl-btn orange" style="width:100%;justify-content:flex-start" onclick="closeModal();showToast('⏭️ Token skipped')"><i class="fas fa-forward"></i> Skip Token</button>
        <button class="ctrl-btn red" style="width:100%;justify-content:flex-start" onclick="closeModal();showToast('❌ Token cancelled')"><i class="fas fa-times"></i> Cancel Token</button>
      </div>
    </div>
  `);
}

function markTokenDone(token) {
  const student = state.adminStudents.find(s => s.token === token);
  if (student) student.status = 'Done';
  closeModal();
  buildAdminStudents();
  buildUpcoming();
  buildFullTokenList();
  showToast('✅ Token marked as done');
}

// ══════════════════════════════════════════
//  ADMIN: Queue Controls
// ══════════════════════════════════════════
function callNext() {
  if (state.queuePaused) { showToast('⚠️ Queue is paused. Resume first.'); return; }
  state.currentServing++;
  const el = document.getElementById('now-serving-token');
  if (el) {
    el.style.transform = 'scale(0.8)';
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = `T-${String(state.currentServing).padStart(4,'0')}`;
      el.style.transform = 'scale(1)';
      el.style.opacity = '1';
      el.style.transition = 'all 0.25s ease';
    }, 250);
  }
  const serveChip = document.getElementById('serving-chip');
  if (serveChip) serveChip.textContent = `Processing: #T-${String(state.currentServing).padStart(4,'0')}`;
  showToast(`📢 Calling T-${String(state.currentServing).padStart(4, '0')}`);
  if (state.soundEnabled) playBeep();
}

function pauseQueue() {
  state.queuePaused = !state.queuePaused;
  const btn  = document.getElementById('pause-btn');
  const chip = document.getElementById('queue-status-chip');
  if (btn) btn.innerHTML = state.queuePaused
    ? '<i class="fas fa-play"></i> Resume'
    : '<i class="fas fa-pause"></i> Pause';
  if (chip) {
    chip.textContent = state.queuePaused ? 'Paused' : 'Processing';
    chip.style.background = state.queuePaused ? 'rgba(255,68,68,0.15)' : '';
    chip.style.color = state.queuePaused ? 'var(--accent-red)' : '';
  }
  showToast(state.queuePaused ? '⏸️ Queue paused' : '▶️ Queue resumed');
}

function resetQueue() {
  openModal(`
    <div style="text-align:center;padding:16px 0">
      <div style="font-size:2.5rem;margin-bottom:12px">🔄</div>
      <h3 style="font-family:'Syne',sans-serif;font-size:1.2rem;margin-bottom:8px">Reset Queue?</h3>
      <p style="color:var(--text-sec);font-size:0.88rem;margin-bottom:20px">This will reset all token numbers and positions for today.</p>
      <div style="display:flex;gap:10px">
        <button class="btn-outline full-width" onclick="closeModal()">Cancel</button>
        <button class="btn-primary full-width" style="background:linear-gradient(135deg,#ff4444,#ff6b35)" onclick="doReset()">Reset Queue</button>
      </div>
    </div>
  `);
}

function doReset() {
  state.currentServing = 0;
  setEl('now-serving-token', 'T-0000');
  closeModal();
  showToast('🔄 Queue has been reset');
}

function exportCSV() {
  const headers = ['Token','Name','Service','Time','Status'];
  const rows = state.adminStudents.map(s => [s.token, s.name, s.service, s.time, s.status]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `queue_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📊 CSV exported!');
}

function saveSlotLimits() { showToast('✅ Slot limits saved successfully'); }

// ══════════════════════════════════════════
//  ACTIVITY HEATMAP
// ══════════════════════════════════════════
function generateHeatmap() {
  const grid = document.getElementById('heatmap-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const weeks = 12;
  const days = 7;
  const data = [];
  let total = 0;
  let peak = 0;
  let peakDate = '';

  for (let w = 0; w < weeks; w++) {
    const col = document.createElement('div');
    col.className = 'hm-col';
    for (let d = 0; d < days; d++) {
      const val = Math.random() < 0.1 ? 0 : Math.floor(Math.random() * 40);
      const date = new Date();
      date.setDate(date.getDate() - ((weeks - 1 - w) * 7 + (6 - d)));
      const dateStr = date.toLocaleDateString('en-IN', { day:'numeric', month:'short', weekday:'short' });
      const cell = document.createElement('div');
      cell.className = 'hm-cell';
      const level = val === 0 ? 0 : val < 8 ? 1 : val < 16 ? 2 : val < 28 ? 3 : 4;
      const colors = ['rgba(255,255,255,0.06)','rgba(0,212,255,0.2)','rgba(0,212,255,0.4)','rgba(0,212,255,0.65)','rgba(0,212,255,0.9)'];
      cell.style.background = colors[level];
      cell.setAttribute('data-tip', `${dateStr}: ${val} tokens`);
      col.appendChild(cell);
      data.push(val);
      total += val;
      if (val > peak) { peak = val; peakDate = dateStr; }
    }
    grid.appendChild(col);
  }

  const avg = Math.round(total / data.length);
  // Count active streak
  let streak = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i] > 0) streak++; else break;
  }
  setEl('hm-total', total.toLocaleString());
  setEl('hm-peak-day', peakDate.split(',')[0]);
  setEl('hm-avg', avg + '/day');
  setEl('hm-streak', streak + ' days');
}

// ══════════════════════════════════════════
//  MULTI-COUNTER BOARD
// ══════════════════════════════════════════
function buildCounterBoard() {
  const grid = document.getElementById('counters-grid');
  if (!grid) return;
  grid.innerHTML = state.counters.map(c => `
    <div class="counter-card ${c.status}" id="counter-card-${c.id}">
      <div class="counter-name">${c.name}</div>
      <div class="counter-status-tag">${c.status.toUpperCase()}</div>
      <div class="counter-token" id="ctoken-${c.id}">${c.token}</div>
      <div class="counter-label">Now Serving</div>
      <div class="counter-divider"></div>
      <div class="counter-footer">
        <span><i class="fas fa-users" style="color:var(--accent-cyan)"></i> ${c.waiting} waiting</span>
        <button class="btn-sm" onclick="callNextCounter(${c.id})"><i class="fas fa-forward"></i> Next</button>
      </div>
    </div>
  `).join('');
}

function callNextCounter(id) {
  const counter = state.counters.find(c => c.id === id);
  if (!counter || counter.status === 'closed') { showToast('⚠️ Counter is closed'); return; }
  const num = parseInt(counter.token.replace('T-','')) + 1;
  counter.token = `T-${String(num).padStart(4,'0')}`;
  counter.waiting = Math.max(0, counter.waiting - 1);
  const el = document.getElementById(`ctoken-${id}`);
  if (el) {
    el.style.opacity = '0';
    setTimeout(() => { el.textContent = counter.token; el.style.opacity = '1'; el.style.transition = 'opacity 0.3s'; }, 200);
  }
  showToast(`📢 ${counter.name}: Calling ${counter.token}`);
  if (state.soundEnabled) playBeep();
}

function addCounter() {
  const newId = state.counters.length + 1;
  state.counters.push({ id: newId, name: `Counter C-${newId}`, status: 'open', token: 'T-0001', waiting: 0 });
  buildCounterBoard();
  showToast(`✅ Counter C-${newId} added`);
}

function callNextOnAll() {
  state.counters.filter(c => c.status !== 'closed').forEach(c => {
    const num = parseInt(c.token.replace('T-','').replace('—','0')) + 1;
    c.token = `T-${String(num).padStart(4,'0')}`;
  });
  buildCounterBoard();
  showToast('📢 All counters advanced');
}

function closeAllCounters() {
  state.counters.forEach(c => c.status = 'closed');
  buildCounterBoard();
  showToast('🔒 All counters closed');
}

// ══════════════════════════════════════════
//  ADMIN: Broadcast
// ══════════════════════════════════════════
function selectBroadcastType(el, type) {
  document.querySelectorAll('#a-broadcast .role-card').forEach(c => c.classList.remove('active-card'));
  el.classList.add('active-card');
  state.broadcastType = type;
}

function sendBroadcast() {
  const msg    = document.getElementById('broadcast-msg')?.value?.trim();
  const target = document.getElementById('broadcast-target')?.value;
  if (!msg) { showToast('⚠️ Please enter a message'); return; }

  const icons  = { info:'info-circle', alert:'exclamation-triangle', success:'check-circle' };
  const colors = { info:'cyan', alert:'orange', success:'green' };
  const hist   = document.getElementById('broadcast-hist');
  if (hist) {
    const item = document.createElement('div');
    item.className = 'notif-item';
    item.innerHTML = `
      <div class="notif-icon ${colors[state.broadcastType]}"><i class="fas fa-${icons[state.broadcastType]}"></i></div>
      <div class="notif-body"><strong>${msg.slice(0,50)}${msg.length > 50 ? '...' : ''}</strong><p>Sent to ${target}</p><span>Just now</span></div>
    `;
    hist.insertBefore(item, hist.firstChild);
  }

  // Add to student notifications
  const notifList = document.getElementById('notif-list');
  if (notifList) {
    const item = document.createElement('div');
    item.className = 'notif-item unread';
    item.innerHTML = `
      <div class="notif-icon ${colors[state.broadcastType]}"><i class="fas fa-broadcast-tower"></i></div>
      <div class="notif-body"><strong>Admin Broadcast</strong><p>${msg}</p><span>Just now</span></div>
    `;
    notifList.insertBefore(item, notifList.firstChild);
    // Show badge
    const badge = document.getElementById('notif-badge');
    const dot   = document.getElementById('s-notif-dot');
    if (badge) { badge.style.display = ''; badge.textContent = '!'; }
    if (dot)   dot.style.display = '';
  }

  const msgEl = document.getElementById('broadcast-msg');
  if (msgEl) msgEl.value = '';
  showToast(`📢 Broadcast sent to ${target}`);
}

// ══════════════════════════════════════════
//  ADMIN: Settings
// ══════════════════════════════════════════
function saveAdminSettings() {
  const college = document.getElementById('a-college-input')?.value;
  if (college) {
    setEl('a-college', college);
    setEl('a-college-badge', college);
  }
  showToast('✅ Settings saved!');
}

function addDocRow() {
  const mgr = document.getElementById('doc-manager');
  if (!mgr) return;
  const row = document.createElement('div');
  row.className = 'dm-row';
  row.innerHTML = `
    <select class="dm-select"><option>Examination Form</option><option>TC / Migration</option><option>Scholarship</option><option>Bonafide Cert.</option></select>
    <input type="text" placeholder="Document name..." class="dm-inp" />
    <button class="btn-sm red-btn" onclick="this.parentElement.remove();showToast('🗑️ Removed')"><i class="fas fa-trash"></i></button>
  `;
  mgr.appendChild(row);
  row.querySelector('.dm-inp')?.focus();
}

function saveDocManager() { showToast('✅ Document requirements saved'); }

// ══════════════════════════════════════════
//  CHARTS
// ══════════════════════════════════════════
function initBusyChart() {
  const ctx = document.getElementById('busyChart');
  if (!ctx || ctx.dataset.chartInit) return;
  ctx.dataset.chartInit = 'true';

  const isDark = state.theme === 'dark';
  charts.busy = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM'],
      datasets: [{
        data: [8,15,22,28,25,30,18,10,5],
        backgroundColor: ctx2 => {
          const v = ctx2.raw;
          return v >= 25 ? 'rgba(255,107,53,0.75)' : v >= 15 ? 'rgba(124,58,237,0.65)' : 'rgba(0,212,255,0.5)';
        },
        borderRadius: 6, borderSkipped: false,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.raw} tokens` } } },
      scales: {
        x: { grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }, ticks: { color: isDark ? '#8a9ab5' : '#4a5568', font: { size: 10 } } },
        y: { grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }, ticks: { color: isDark ? '#8a9ab5' : '#4a5568', font: { size: 10 } }, beginAtZero: true }
      }
    }
  });
}

function initAdminCharts() {
  initBusyChart();
  const isDark = state.theme === 'dark';
  const gridC  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const tickC  = isDark ? '#8a9ab5' : '#4a5568';
  const bkgC   = isDark ? '#0d1320' : '#e4eaf6';

  // Week Chart
  const wCtx = document.getElementById('adminWeekChart');
  if (wCtx && !wCtx.dataset.chartInit) {
    wCtx.dataset.chartInit = 'true';
    charts.week = new Chart(wCtx, {
      type: 'line',
      data: {
        labels: ['Mon','Tue','Wed','Thu','Fri','Sat'],
        datasets: [{
          label: 'Tokens',
          data: [32,45,28,56,41,18],
          borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.1)',
          fill: true, tension: 0.4, pointBackgroundColor: '#00d4ff', pointRadius: 4,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridC }, ticks: { color: tickC, font: { size: 10 } } },
          y: { grid: { color: gridC }, ticks: { color: tickC, font: { size: 10 } }, beginAtZero: true }
        }
      }
    });
  }

  // Pie Chart
  const pCtx = document.getElementById('adminPieChart');
  if (pCtx && !pCtx.dataset.chartInit) {
    pCtx.dataset.chartInit = 'true';
    charts.pie = new Chart(pCtx, {
      type: 'doughnut',
      data: {
        labels: ['Exam Form','TC/Migration','Scholarship','Bonafide','ID Card','Fee'],
        datasets: [{
          data: [35,15,20,12,10,8],
          backgroundColor: ['#00d4ff','#7c3aed','#00e676','#ff6b35','#ff4d8b','#3b82f6'],
          borderWidth: 2,
          borderColor: bkgC,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: tickC, font: { size: 11 }, boxWidth: 12 } } }
      }
    });
  }

  // Month Chart
  const mCtx = document.getElementById('adminMonthChart');
  if (mCtx && !mCtx.dataset.chartInit) {
    mCtx.dataset.chartInit = 'true';
    const labels = Array.from({ length: 28 }, (_, i) => `${i + 1}`);
    const data   = labels.map(() => Math.floor(Math.random() * 40 + 10));
    charts.month = new Chart(mCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Tokens', data,
          backgroundColor: 'rgba(124,58,237,0.55)',
          borderRadius: 4, borderSkipped: false,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridC }, ticks: { color: tickC, font: { size: 9 }, maxTicksLimit: 14 } },
          y: { grid: { color: gridC }, ticks: { color: tickC, font: { size: 10 } }, beginAtZero: true }
        }
      }
    });
  }
}

// ══════════════════════════════════════════
//  COUNTER ANIMATION
// ══════════════════════════════════════════
function animateCounters() {
  document.querySelectorAll('.stat-value[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    if (!target || el.dataset.animated) return;
    el.dataset.animated = 'true';
    let current = 0;
    const inc = Math.ceil(target / 30);
    const timer = setInterval(() => {
      current = Math.min(current + inc, target);
      el.textContent = current;
      if (current >= target) clearInterval(timer);
    }, 30);
  });
}

// ══════════════════════════════════════════
//  LIVE UPDATES (simulate)
// ══════════════════════════════════════════
function startLiveUpdates() {
  setInterval(() => {
    if (Math.random() > 0.65 && state.role === 'student') {
      const posEl    = document.getElementById('live-pos');
      const bigNumEl = document.getElementById('big-queue-num');
      const currentPos = parseInt(posEl?.textContent || '7');
      if (currentPos > 1) {
        const newPos = currentPos - 1;
        state.queuePosition = newPos;

        // Animate position change
        if (posEl) {
          posEl.classList.add('changed');
          posEl.textContent = newPos;
          setTimeout(() => posEl.classList.remove('changed'), 500);
        }
        if (bigNumEl) bigNumEl.textContent = newPos;

        // Update wait info
        const waitMin = newPos * 2.5;
        setEl('s-wait-time', `${waitMin | 0}`);
        document.getElementById('s-wait-time') && (document.getElementById('s-wait-time').innerHTML = `${waitMin | 0}<small>min</small>`);
        setEl('ai-pred', `${waitMin | 0} min`);
        setEl('q-wait', waitMin | 0);
        setEl('wt-pos', newPos);
        setEl('wt-before', newPos - 1);
        setEl('wt-est', `~${waitMin | 0} min`);
        setEl('dashboard-wait', waitMin | 0);
        setEl('ahead-count', newPos - 1);
        setEl('countdown-num', waitMin | 0);

        const aiFill = document.getElementById('ai-fill');
        if (aiFill) aiFill.style.width = `${Math.min(100, newPos * 8)}%`;

        // Progress bar
        const fill = document.getElementById('queue-progress-fill');
        if (fill) fill.style.width = `${Math.min(100, (1 - newPos/30) * 100)}%`;

        updateCountdownRing(waitMin);
        checkPositionAlert(newPos);
        generateQueuePeople();
      }
    }
  }, 5000);
}

// ══════════════════════════════════════════
//  KEYBOARD SHORTCUTS
// ══════════════════════════════════════════
function openShortcuts() {
  document.getElementById('shortcuts-overlay').classList.add('active');
}
function closeShortcuts() {
  document.getElementById('shortcuts-overlay').classList.remove('active');
}

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeShortcuts();
  }
  if (e.key === '?' && !e.ctrlKey) openShortcuts();
  if (!e.ctrlKey) return;

  if (state.role === 'student') {
    const navMap = {
      b: 's-booking', q: 's-queue', t: 's-token',
      h: 's-history', n: 's-notifications', d: 's-dashboard',
    };
    const key = e.key.toLowerCase();
    if (key === 'p') { e.preventDefault(); printToken(); return; }
    if (navMap[key]) {
      e.preventDefault();
      showSection(navMap[key], 'student', null);
    }
  }
  if (state.role === 'admin') {
    const navMap = { d: 'a-dashboard', q: 'a-queue-control', s: 'a-students', a: 'a-analytics' };
    const key = e.key.toLowerCase();
    if (navMap[key]) {
      e.preventDefault();
      showAdminSection(navMap[key], null);
    }
  }
});

// ══════════════════════════════════════════
//  MODAL & TOAST
// ══════════════════════════════════════════
function openModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('active');
}
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
}

let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

// ══════════════════════════════════════════
//  UTILITIES
// ══════════════════════════════════════════
function setDefaultDate() {
  const dateEl = document.getElementById('booking-date');
  if (dateEl) {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const iso = today.toISOString().split('T')[0];
    dateEl.value = iso;
    dateEl.min   = iso;
  }
}

function setToday() {
  const el = document.getElementById('t-date');
  if (el) el.textContent = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

// Close modal on outside click
window.addEventListener('click', e => {
  const sidebar  = document.getElementById('sidebar');
  const aSidebar = document.getElementById('admin-sidebar');
  if (sidebar  && sidebar.classList.contains('open')  && !sidebar.contains(e.target)  && !e.target.closest('.menu-btn')) sidebar.classList.remove('open');
  if (aSidebar && aSidebar.classList.contains('open') && !aSidebar.contains(e.target) && !e.target.closest('.menu-btn')) aSidebar.classList.remove('open');
});