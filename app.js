// ===== Discipline Forge — App Logic =====

// ===== Data Layer =====
const STORAGE_KEY = 'discipline_forge_data';
const today = () => new Date().toISOString().split('T')[0];

function getDefaultGoals() {
    return [
        { id: generateId(), name: 'Avoid junk food', category: 'health', frequency: 'daily', target: 1, unit: 'day', color: '#00B894', createdAt: today() },
        { id: generateId(), name: 'Learn new English words', category: 'learning', frequency: 'daily', target: 10, unit: 'words', color: '#6C5CE7', createdAt: today() },
        { id: generateId(), name: 'Speak at least 100 English sentences', category: 'learning', frequency: 'daily', target: 100, unit: 'sentences', color: '#0984E3', createdAt: today() },
        { id: generateId(), name: 'Solve at least 5 maths questions', category: 'learning', frequency: 'daily', target: 5, unit: 'questions', color: '#E17055', createdAt: today() },
        { id: generateId(), name: 'Watch 1 self-help video', category: 'mindset', frequency: 'daily', target: 1, unit: 'video', color: '#E84393', createdAt: today() },
        { id: generateId(), name: 'Read 1 page of a self-help book', category: 'mindset', frequency: 'daily', target: 1, unit: 'page', color: '#FDCB6E', createdAt: today() },
        { id: generateId(), name: 'Listen to a podcast', category: 'mindset', frequency: 'daily', target: 1, unit: 'podcast', color: '#00CEC9', createdAt: today() },
        { id: generateId(), name: 'Research something new', category: 'learning', frequency: 'daily', target: 1, unit: 'topic', color: '#A29BFE', createdAt: today() },
    ];
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const data = { goals: getDefaultGoals(), dailyLog: {}, streaks: {} };
    saveData(data);
    return data;
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let appData = loadData();

// Ensure dailyLog for today exists
function ensureTodayLog() {
    const d = today();
    if (!appData.dailyLog[d]) {
        appData.dailyLog[d] = {};
    }
    appData.goals.forEach(g => {
        if (appData.dailyLog[d][g.id] === undefined) {
            appData.dailyLog[d][g.id] = { progress: 0, status: 'pending' };
        }
    });
    saveData(appData);
}

// ===== BEHIND TRACKER — Core Feature =====
function calculateGoalDeficit(goalId) {
    const goal = appData.goals.find(g => g.id === goalId);
    if (!goal || !goal.target) return { deficit: 0, missedDays: 0, totalMissed: 0 };

    let totalDeficit = 0;
    let missedDays = 0;
    const createdDate = new Date(goal.createdAt);
    const todayDate = new Date(today());

    // Go through each day from creation to today (exclusive of today — today is still in progress)
    const d = new Date(createdDate);
    while (d < todayDate) {
        const dateStr = d.toISOString().split('T')[0];
        const entry = appData.dailyLog[dateStr]?.[goalId];

        if (!entry || entry.status !== 'completed') {
            const done = entry ? entry.progress : 0;
            const missed = goal.target - done;
            if (missed > 0) {
                totalDeficit += missed;
                missedDays++;
            }
        }
        d.setDate(d.getDate() + 1);
    }

    return { deficit: totalDeficit, missedDays, totalMissed: totalDeficit, unit: goal.unit || 'items' };
}

function calculateTotalDeficit() {
    let totalDeficit = 0;
    let totalMissedDays = 0;
    const deficits = [];

    appData.goals.forEach(g => {
        const def = calculateGoalDeficit(g.id);
        if (def.deficit > 0) {
            totalDeficit += def.deficit;
            totalMissedDays += def.missedDays;
            deficits.push({ goal: g, ...def });
        }
    });

    return { totalDeficit, totalMissedDays, deficits };
}

// ===== Motivational Messages =====
const motivationalMessages = {
    behind: [
        "Every day you delay, the gap widens. Close it NOW.",
        "Your future self is counting on you. Don't let them down.",
        "The pain of discipline weighs ounces. The pain of regret weighs tons.",
        "You're behind, but not defeated. Champions recover stronger.",
        "The best time to start was yesterday. The second best time is NOW.",
        "Don't let yesterday's laziness define tomorrow's results.",
        "The gap between where you are and where you want to be is called EFFORT.",
        "Your competition isn't waiting. Neither should you.",
    ],
    catchingUp: [
        "You're gaining ground! Keep this momentum going! 🔥",
        "The gap is closing. You're proving yourself today.",
        "Progress detected! This is what discipline looks like.",
        "You started, and that's the hardest part. Now finish.",
    ],
    onTrack: [
        "You're on fire! This consistency will change your life! 🏆",
        "Zero deficit. Pure discipline. This is who you are.",
        "Champions don't take days off. You're proving it.",
        "You're building an empire one habit at a time. Keep going!",
        "Your future self is thanking you right now.",
    ],
    almostDone: [
        "Almost there! Don't quit when you're this close! ⚡",
        "Finish strong. Show the world what you're made of.",
        "You're in the final stretch. Give it everything.",
    ]
};

function getMotivationalMessage(deficitData, todayProgress) {
    const { totalDeficit } = deficitData;
    let category;

    if (totalDeficit === 0 && todayProgress >= 80) {
        category = 'onTrack';
    } else if (todayProgress >= 60) {
        category = 'almostDone';
    } else if (todayProgress >= 30) {
        category = 'catchingUp';
    } else {
        category = 'behind';
    }

    const messages = motivationalMessages[category];
    return messages[Math.floor(Math.random() * messages.length)];
}

// ===== Quote Carousel =====
let currentQuote = 0;
const quoteCount = 3;

function initQuotes() {
    const dotsContainer = document.getElementById('quote-dots');
    dotsContainer.innerHTML = '';
    for (let i = 0; i < quoteCount; i++) {
        const dot = document.createElement('button');
        dot.className = `quote-dot${i === 0 ? ' active' : ''}`;
        dot.onclick = () => goToQuote(i);
        dotsContainer.appendChild(dot);
    }
    setInterval(() => goToQuote((currentQuote + 1) % quoteCount), 6000);

    // Touch swipe support for quotes
    const carousel = document.getElementById('quotes-carousel');
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) goToQuote((currentQuote + 1) % quoteCount);
            else goToQuote((currentQuote - 1 + quoteCount) % quoteCount);
        }
    }, { passive: true });
}

function goToQuote(index) {
    const cards = document.querySelectorAll('.quote-card');
    const dots = document.querySelectorAll('.quote-dot');
    cards[currentQuote].classList.add('exit');
    cards[currentQuote].classList.remove('active');
    setTimeout(() => cards[currentQuote === index ? currentQuote : currentQuote].classList.remove('exit'), 600);
    currentQuote = index;
    cards[currentQuote].classList.add('active');
    dots.forEach((d, i) => d.classList.toggle('active', i === currentQuote));
    setTimeout(() => {
        cards.forEach((c, i) => { if (i !== currentQuote) c.classList.remove('exit'); });
    }, 600);
}

// ===== Greeting =====
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good Evening';
    if (hour < 12) greeting = 'Good Morning';
    else if (hour < 17) greeting = 'Good Afternoon';
    document.getElementById('greeting-text').textContent = greeting;

    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    document.getElementById('date-text').textContent = new Date().toLocaleDateString('en-US', options);
}

// ===== View Switching =====
function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.bottom-nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.add('active');

    const sidebarItem = document.querySelector(`.sidebar-nav [data-view="${view}"]`);
    if (sidebarItem) sidebarItem.classList.add('active');

    const bottomItem = document.querySelector(`.bottom-nav [data-view="${view}"]`);
    if (bottomItem) bottomItem.classList.add('active');

    if (view === 'calendar') renderCalendar();
    if (view === 'stats') renderStats();
    if (view === 'goals') renderGoalsList();
    if (view === 'dashboard') renderDashboard();

    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('active');
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('active');
}

// ===== Dashboard Rendering =====
function renderDashboard() {
    ensureTodayLog();
    const d = today();
    const log = appData.dailyLog[d] || {};
    const goals = appData.goals;
    const total = goals.length;
    let completed = 0, inProgress = 0, pending = 0;

    goals.forEach(g => {
        const entry = log[g.id];
        if (!entry) { pending++; return; }
        if (entry.status === 'completed') completed++;
        else if (entry.status === 'in-progress') inProgress++;
        else pending++;
    });

    // Stats
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-completed').textContent = completed;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    document.getElementById('stat-percentage').textContent = pct + '%';
    document.getElementById('stat-streak').textContent = calculateOverallStreak();

    // Progress ring
    const circumference = 2 * Math.PI * 70;
    const offset = circumference - (pct / 100) * circumference;
    const ring = document.getElementById('progress-ring');
    ring.style.strokeDashoffset = offset;
    document.getElementById('ring-percentage').textContent = pct + '%';

    // Legend
    document.getElementById('legend-pending').textContent = pending;
    document.getElementById('legend-progress').textContent = inProgress;
    document.getElementById('legend-completed').textContent = completed;

    // === Behind Tracker ===
    renderBehindTracker(pct);

    // Render goal cards
    renderGoalCards('all');
}

// ===== Behind Tracker Rendering =====
function renderBehindTracker(todayPct) {
    const container = document.getElementById('behind-tracker');
    if (!container) return;

    const deficitData = calculateTotalDeficit();
    const { totalDeficit, deficits } = deficitData;
    const message = getMotivationalMessage(deficitData, todayPct);

    if (totalDeficit === 0) {
        container.innerHTML = `
            <div class="behind-header behind-clean">
                <div class="behind-status-icon">🏆</div>
                <div class="behind-status-info">
                    <span class="behind-title">You're all caught up!</span>
                    <span class="behind-subtitle">Zero deficit. Pure discipline.</span>
                </div>
            </div>
            <div class="motivation-banner motivation-positive">
                <div class="motivation-icon">⚡</div>
                <p class="motivation-text">${message}</p>
            </div>`;
        return;
    }

    const topDeficits = deficits
        .sort((a, b) => b.deficit - a.deficit)
        .slice(0, 5);

    container.innerHTML = `
        <div class="behind-header behind-warning">
            <div class="behind-status-icon behind-pulse">📉</div>
            <div class="behind-status-info">
                <span class="behind-title">${totalDeficit} items behind</span>
                <span class="behind-subtitle">across ${deficits.length} goal${deficits.length > 1 ? 's' : ''}</span>
            </div>
            <div class="behind-deficit-badge">${totalDeficit}</div>
        </div>
        <div class="motivation-banner motivation-urgent">
            <div class="motivation-icon">🔥</div>
            <p class="motivation-text">${message}</p>
        </div>
        <div class="behind-breakdown">
            <h4 class="behind-breakdown-title">Where You're Falling Behind</h4>
            ${topDeficits.map(d => {
                const maxPossible = d.goal.target * d.missedDays;
                const severityPct = maxPossible > 0 ? Math.round((d.deficit / maxPossible) * 100) : 0;
                const severityClass = severityPct > 70 ? 'severity-critical' : severityPct > 40 ? 'severity-warning' : 'severity-mild';
                return `
                <div class="behind-item ${severityClass}">
                    <div class="behind-item-color" style="background:${d.goal.color}"></div>
                    <div class="behind-item-info">
                        <div class="behind-item-name">${escapeHtml(d.goal.name)}</div>
                        <div class="behind-item-detail">
                            <span class="behind-deficit-count">−${d.deficit} ${d.unit}</span>
                            <span class="behind-missed-days">${d.missedDays} day${d.missedDays > 1 ? 's' : ''} missed</span>
                        </div>
                    </div>
                    <div class="behind-item-severity">
                        <div class="severity-bar">
                            <div class="severity-fill" style="width:${severityPct}%"></div>
                        </div>
                    </div>
                    <button class="behind-catch-up-btn" onclick="catchUpGoal('${d.goal.id}')" title="Catch up on this goal">⚡</button>
                </div>`;
            }).join('')}
        </div>`;
}

let currentFilter = 'all';

function filterGoals(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderGoalCards(filter);
}

function renderGoalCards(filter) {
    const container = document.getElementById('dashboard-goals');
    const d = today();
    const log = appData.dailyLog[d] || {};
    let goals = appData.goals;

    if (filter !== 'all') {
        goals = goals.filter(g => {
            const entry = log[g.id];
            if (!entry) return filter === 'pending';
            return entry.status === filter;
        });
    }

    if (goals.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                </svg>
                <p>No goals found</p>
                <small>${filter === 'all' ? 'Tap + to add your first goal' : 'No goals with this status'}</small>
            </div>`;
        return;
    }

    container.innerHTML = goals.map((g, i) => {
        const entry = log[g.id] || { progress: 0, status: 'pending' };
        const pct = g.target ? Math.min(100, Math.round((entry.progress / g.target) * 100)) : (entry.status === 'completed' ? 100 : 0);
        const streak = calculateGoalStreak(g.id);
        const deficit = calculateGoalDeficit(g.id);
        const badgeClass = entry.status === 'completed' ? 'badge-completed' : entry.status === 'in-progress' ? 'badge-in-progress' : 'badge-pending';
        const statusLabel = entry.status === 'in-progress' ? 'In Progress' : entry.status.charAt(0).toUpperCase() + entry.status.slice(1);

        return `
        <div class="goal-card" style="animation-delay: ${i * 0.05}s; --card-color: ${g.color}">
            <div class="goal-card-accent" style="background:${g.color}"></div>
            <div class="goal-card-header">
                <span class="goal-card-title">${escapeHtml(g.name)}</span>
                <span class="goal-card-badge ${badgeClass}">${statusLabel}</span>
            </div>
            <div class="goal-card-meta">
                <span class="goal-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
                    ${g.frequency}
                </span>
                ${g.target ? `<span class="goal-meta-item">${entry.progress}/${g.target} ${g.unit || ''}</span>` : ''}
                ${streak > 0 ? `<span class="goal-streak"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>${streak}d</span>` : ''}
            </div>
            ${deficit.deficit > 0 ? `
            <div class="goal-card-deficit">
                <span class="deficit-indicator">📉 ${deficit.deficit} ${deficit.unit} behind</span>
                <span class="deficit-days">(${deficit.missedDays} day${deficit.missedDays > 1 ? 's' : ''} missed)</span>
                <button class="catch-up-btn" onclick="catchUpGoal('${g.id}')" title="Cover previous backlog">⚡ Catch Up</button>
            </div>` : ''}
            <div class="goal-progress-bar">
                <div class="goal-progress-fill" style="width:${pct}%;background:${g.color}"></div>
            </div>
            <div class="goal-card-footer">
                <span class="goal-progress-text"><strong>${pct}%</strong> complete</span>
                <div class="goal-card-actions">
                    ${g.target && g.target > 1 ? `
                    <button class="goal-action-btn" onclick="incrementGoal('${g.id}')" title="Add progress">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>` : ''}
                    <button class="goal-action-btn btn-check" onclick="toggleComplete('${g.id}')" title="Mark complete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                    <button class="goal-action-btn" onclick="resetGoal('${g.id}')" title="Reset">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                    </button>
                    <button class="goal-action-btn" onclick="editGoal('${g.id}')" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="goal-action-btn btn-delete" onclick="deleteGoal('${g.id}')" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ===== Goals List (Goals View) =====
function renderGoalsList() {
    const container = document.getElementById('goals-list');
    const d = today();
    const log = appData.dailyLog[d] || {};

    if (appData.goals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                <p>No goals yet</p>
                <small>Create your first goal to start building discipline</small>
            </div>`;
        return;
    }

    container.innerHTML = appData.goals.map((g, i) => {
        const entry = log[g.id] || { progress: 0, status: 'pending' };
        const pct = g.target ? Math.min(100, Math.round((entry.progress / g.target) * 100)) : (entry.status === 'completed' ? 100 : 0);
        const isComplete = entry.status === 'completed';
        const streak = calculateGoalStreak(g.id);
        const deficit = calculateGoalDeficit(g.id);

        return `
        <div class="goal-list-item" style="animation-delay:${i * 0.03}s">
            <button class="goal-list-check ${isComplete ? 'checked' : ''}" onclick="toggleComplete('${g.id}')" style="border-color:${isComplete ? g.color : ''};background:${isComplete ? g.color : ''}">
                ${isComplete ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
            </button>
            <div class="goal-list-info">
                <div class="goal-list-name ${isComplete ? 'done' : ''}">${escapeHtml(g.name)}</div>
                <div class="goal-list-details">
                    <span>${g.frequency}</span>
                    ${g.target ? `<span>${entry.progress}/${g.target} ${g.unit || ''}</span>` : ''}
                    ${streak > 0 ? `<span style="color:#E17055">🔥 ${streak}d</span>` : ''}
                    ${deficit.deficit > 0 ? `<span class="list-deficit-tag">−${deficit.deficit} behind</span><button class="catch-up-btn-sm" onclick="event.stopPropagation();catchUpGoal('${g.id}')">⚡ Catch Up</button>` : ''}
                </div>
            </div>
            <div class="goal-list-progress">
                <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width:${pct}%;background:${g.color}"></div>
                </div>
            </div>
            <div class="goal-list-actions">
                ${g.target && g.target > 1 ? `
                <button class="goal-action-btn" onclick="incrementGoal('${g.id}')" title="+1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>` : ''}
                <button class="goal-action-btn" onclick="editGoal('${g.id}')" title="Edit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="goal-action-btn" onclick="resetGoal('${g.id}')" title="Reset">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                </button>
                <button class="goal-action-btn btn-delete" onclick="deleteGoal('${g.id}')" title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>
        </div>`;
    }).join('');
}

// ===== Goal Actions =====
function incrementGoal(id) {
    ensureTodayLog();
    const d = today();
    const goal = appData.goals.find(g => g.id === id);
    const entry = appData.dailyLog[d][id];
    if (!goal || !entry) return;

    if (entry.progress < goal.target) {
        entry.progress++;
        if (entry.progress >= goal.target) {
            entry.status = 'completed';
            showToast(`"${goal.name}" completed! 🎉`, 'success');
            launchConfetti();
        } else {
            entry.status = 'in-progress';
            showToast(`+1 ${goal.unit || 'progress'} added`, 'info');
        }
        saveData(appData);
        refreshCurrentView();
    }
}

function toggleComplete(id) {
    ensureTodayLog();
    const d = today();
    const goal = appData.goals.find(g => g.id === id);
    const entry = appData.dailyLog[d][id];
    if (!goal || !entry) return;

    if (entry.status === 'completed') {
        entry.status = 'pending';
        entry.progress = 0;
        showToast(`"${goal.name}" unchecked`, 'info');
    } else {
        entry.status = 'completed';
        entry.progress = goal.target || 1;
        showToast(`"${goal.name}" completed! 🎉`, 'success');
        launchConfetti();
    }
    saveData(appData);
    refreshCurrentView();
}

function resetGoal(id) {
    ensureTodayLog();
    const d = today();
    appData.dailyLog[d][id] = { progress: 0, status: 'pending' };
    saveData(appData);
    showToast('Goal reset for today', 'info');
    refreshCurrentView();
}

// ===== Catch Up on Previous Deficit =====
function catchUpGoal(id) {
    const goal = appData.goals.find(g => g.id === id);
    if (!goal) return;

    const deficit = calculateGoalDeficit(id);
    if (deficit.deficit <= 0) {
        showToast('No deficit to catch up on!', 'info');
        return;
    }

    const amount = prompt(
        `You are ${deficit.deficit} ${deficit.unit} behind on "${goal.name}" (${deficit.missedDays} day${deficit.missedDays > 1 ? 's' : ''} missed).\n\nHow many ${deficit.unit} have you completed to cover the backlog?`,
        deficit.deficit
    );

    if (amount === null) return;
    const catchUpAmount = parseInt(amount);
    if (isNaN(catchUpAmount) || catchUpAmount <= 0) {
        showToast('Please enter a valid number', 'warning');
        return;
    }

    // Fill in past days' logs to cover the deficit
    let remaining = Math.min(catchUpAmount, deficit.deficit);
    const createdDate = new Date(goal.createdAt);
    const todayDate = new Date(today());
    const d = new Date(createdDate);

    while (d < todayDate && remaining > 0) {
        const dateStr = d.toISOString().split('T')[0];
        if (!appData.dailyLog[dateStr]) {
            appData.dailyLog[dateStr] = {};
        }
        if (!appData.dailyLog[dateStr][id]) {
            appData.dailyLog[dateStr][id] = { progress: 0, status: 'pending' };
        }

        const entry = appData.dailyLog[dateStr][id];
        if (entry.status !== 'completed') {
            const missed = goal.target - entry.progress;
            if (missed > 0) {
                const fill = Math.min(missed, remaining);
                entry.progress += fill;
                remaining -= fill;
                if (entry.progress >= goal.target) {
                    entry.status = 'completed';
                }
            }
        }
        d.setDate(d.getDate() + 1);
    }

    saveData(appData);
    const covered = Math.min(catchUpAmount, deficit.deficit) - remaining;
    showToast(`Covered ${covered} ${goal.unit} of backlog! 💪`, 'success');
    if (covered > 0) launchConfetti();
    refreshCurrentView();
}

function deleteGoal(id) {
    const goal = appData.goals.find(g => g.id === id);
    if (!confirm(`Delete "${goal.name}"? This cannot be undone.`)) return;
    appData.goals = appData.goals.filter(g => g.id !== id);
    Object.keys(appData.dailyLog).forEach(d => {
        delete appData.dailyLog[d][id];
    });
    saveData(appData);
    showToast('Goal deleted', 'warning');
    refreshCurrentView();
}

function resetAllGoals() {
    const d = today();
    appData.dailyLog[d] = {};
    appData.goals.forEach(g => {
        appData.dailyLog[d][g.id] = { progress: 0, status: 'pending' };
    });
    saveData(appData);
    closeResetModal();
    showToast('All goals reset for today', 'info');
    refreshCurrentView();
}

// ===== Goal Modal =====
function showGoalModal(goalId) {
    const modal = document.getElementById('goal-modal');
    const form = document.getElementById('goal-form');
    form.reset();
    document.getElementById('goal-id').value = '';
    document.getElementById('modal-title').textContent = 'Add New Goal';
    document.getElementById('custom-dates').style.display = 'none';

    document.querySelectorAll('.color-option').forEach((c, i) => {
        c.classList.toggle('selected', i === 0);
    });

    if (goalId) {
        const goal = appData.goals.find(g => g.id === goalId);
        if (goal) {
            document.getElementById('modal-title').textContent = 'Edit Goal';
            document.getElementById('goal-id').value = goal.id;
            document.getElementById('goal-name').value = goal.name;
            document.getElementById('goal-category').value = goal.category;
            document.getElementById('goal-frequency').value = goal.frequency;
            document.getElementById('goal-target').value = goal.target || '';
            document.getElementById('goal-unit').value = goal.unit || '';
            if (goal.frequency === 'custom') {
                document.getElementById('custom-dates').style.display = 'grid';
                document.getElementById('goal-start').value = goal.startDate || '';
                document.getElementById('goal-end').value = goal.endDate || '';
            }
            document.querySelectorAll('.color-option').forEach(c => {
                c.classList.toggle('selected', c.dataset.color === goal.color);
            });
        }
    }

    modal.classList.add('active');
}

function editGoal(id) {
    showGoalModal(id);
}

function closeGoalModal() {
    document.getElementById('goal-modal').classList.remove('active');
}

function saveGoal(e) {
    e.preventDefault();
    const id = document.getElementById('goal-id').value;
    const name = document.getElementById('goal-name').value.trim();
    const category = document.getElementById('goal-category').value;
    const frequency = document.getElementById('goal-frequency').value;
    const target = parseInt(document.getElementById('goal-target').value) || 1;
    const unit = document.getElementById('goal-unit').value.trim();
    const color = document.querySelector('.color-option.selected')?.dataset.color || '#6C5CE7';
    const startDate = document.getElementById('goal-start').value;
    const endDate = document.getElementById('goal-end').value;

    if (!name) return;

    if (id) {
        const goal = appData.goals.find(g => g.id === id);
        if (goal) {
            Object.assign(goal, { name, category, frequency, target, unit, color, startDate, endDate });
            showToast('Goal updated', 'success');
        }
    } else {
        appData.goals.push({
            id: generateId(),
            name, category, frequency, target, unit, color,
            startDate, endDate,
            createdAt: today()
        });
        showToast('New goal added!', 'success');
    }

    saveData(appData);
    ensureTodayLog();
    closeGoalModal();
    refreshCurrentView();
}

function toggleCustomDates() {
    const freq = document.getElementById('goal-frequency').value;
    document.getElementById('custom-dates').style.display = freq === 'custom' ? 'grid' : 'none';
}

// Color picker
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('color-option')) {
        document.querySelectorAll('.color-option').forEach(c => c.classList.remove('selected'));
        e.target.classList.add('selected');
    }
});

// ===== Reset Modal =====
function showResetAllModal() {
    document.getElementById('reset-modal').classList.add('active');
}

function closeResetModal() {
    document.getElementById('reset-modal').classList.remove('active');
}

// ===== Streaks =====
function calculateGoalStreak(goalId) {
    let streak = 0;
    const d = new Date();
    const todayLog = appData.dailyLog[today()]?.[goalId];
    if (todayLog?.status === 'completed') {
        streak = 1;
    } else {
        d.setDate(d.getDate() - 1);
    }

    while (true) {
        const dateStr = d.toISOString().split('T')[0];
        const entry = appData.dailyLog[dateStr]?.[goalId];
        if (entry?.status === 'completed') {
            if (todayLog?.status === 'completed' || streak > 0) streak++;
            else streak++;
            d.setDate(d.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

function calculateOverallStreak() {
    let streak = 0;
    const d = new Date();
    const goalCount = appData.goals.length;
    if (goalCount === 0) return 0;

    for (let i = 0; i < 365; i++) {
        const dateStr = d.toISOString().split('T')[0];
        const log = appData.dailyLog[dateStr];
        if (!log) { if (i === 0) { d.setDate(d.getDate() - 1); continue; } break; }

        const completed = Object.values(log).filter(e => e.status === 'completed').length;
        const pct = completed / goalCount;
        if (pct >= 0.5) {
            streak++;
            d.setDate(d.getDate() - 1);
        } else {
            if (i === 0) { d.setDate(d.getDate() - 1); continue; }
            break;
        }
    }
    return streak;
}

// ===== Calendar =====
let calendarDate = new Date();

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    document.getElementById('calendar-month-label').textContent =
        calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = today();
    const goalCount = appData.goals.length;

    const headers = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    let html = headers.map(h => `<div class="cal-header">${h}</div>`).join('');

    for (let i = 0; i < firstDay; i++) {
        html += '<div class="cal-day empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const log = appData.dailyLog[dateStr];
        let level = 0;
        let tooltip = '';
        const isToday = dateStr === todayStr;

        if (log && goalCount > 0) {
            const completed = Object.values(log).filter(e => e.status === 'completed').length;
            const pct = Math.round((completed / goalCount) * 100);
            if (pct > 0 && pct <= 25) level = 1;
            else if (pct > 25 && pct <= 50) level = 2;
            else if (pct > 50 && pct <= 75) level = 3;
            else if (pct > 75) level = 4;
            tooltip = `${completed}/${goalCount} goals (${pct}%)`;
        }

        html += `<div class="cal-day level-${level} ${isToday ? 'today' : ''} ${log ? 'has-data' : ''}" ${tooltip ? `data-tooltip="${tooltip}"` : ''}>${day}</div>`;
    }

    grid.innerHTML = html;
    renderStreakTimeline();
}

function changeMonth(delta) {
    calendarDate.setMonth(calendarDate.getMonth() + delta);
    renderCalendar();
}

function renderStreakTimeline() {
    const container = document.getElementById('streak-timeline');
    const goalCount = appData.goals.length;
    let html = '';
    const todayStr = today();

    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const log = appData.dailyLog[dateStr];
        const dayNum = d.getDate();
        const isToday = dateStr === todayStr;

        let cls = 'streak-none';
        if (log && goalCount > 0) {
            const completed = Object.values(log).filter(e => e.status === 'completed').length;
            const pct = completed / goalCount;
            if (pct >= 0.75) cls = 'streak-active';
            else if (pct > 0) cls = 'streak-partial';
        }

        html += `
        <div class="timeline-day">
            <div class="timeline-dot ${cls} ${isToday ? 'streak-today' : ''}">${dayNum}</div>
        </div>`;
    }
    container.innerHTML = html;
}

// ===== Stats =====
function renderStats() {
    renderWeeklyChart();
    renderGoalPerformance();
    renderBestStreaks();
}

function renderWeeklyChart() {
    const container = document.getElementById('weekly-chart');
    const goalCount = appData.goals.length;
    let html = '';
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const log = appData.dailyLog[dateStr];
        let pct = 0;

        if (log && goalCount > 0) {
            const completed = Object.values(log).filter(e => e.status === 'completed').length;
            pct = Math.round((completed / goalCount) * 100);
        }

        const dayLabel = days[d.getDay()];
        const hue = pct > 66 ? '160' : pct > 33 ? '270' : '10';
        const color = pct > 0 ? `hsl(${hue}, 60%, 50%)` : 'rgba(255,255,255,0.1)';

        html += `
        <div class="bar-item">
            <div class="bar-fill" style="height:${Math.max(4, pct)}%;background:${color}" data-value="${pct}%"></div>
            <span class="bar-label">${dayLabel}</span>
        </div>`;
    }
    container.innerHTML = html;
}

function renderGoalPerformance() {
    const container = document.getElementById('goal-performance');
    let html = '';

    appData.goals.forEach(g => {
        let completed = 0;
        let total = 0;
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const entry = appData.dailyLog[dateStr]?.[g.id];
            if (entry) {
                total++;
                if (entry.status === 'completed') completed++;
            } else {
                total++;
            }
        }
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

        html += `
        <div class="perf-item">
            <div class="perf-color" style="background:${g.color}"></div>
            <div class="perf-info">
                <div class="perf-name">${escapeHtml(g.name)}</div>
                <div class="perf-bar">
                    <div class="perf-bar-fill" style="width:${pct}%;background:${g.color}"></div>
                </div>
            </div>
            <span class="perf-value" style="color:${g.color}">${pct}%</span>
        </div>`;
    });

    container.innerHTML = html || '<p style="color:var(--text-muted);font-size:14px">No data yet</p>';
}

function renderBestStreaks() {
    const container = document.getElementById('best-streaks');
    const streaks = appData.goals.map(g => ({
        name: g.name,
        color: g.color,
        streak: calculateGoalStreak(g.id)
    })).sort((a, b) => b.streak - a.streak);

    if (streaks.length === 0 || streaks[0].streak === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);font-size:14px">Complete goals to build streaks!</p>';
        return;
    }

    container.innerHTML = streaks.slice(0, 5).map((s, i) => `
        <div class="streak-item">
            <span class="streak-rank" style="color:${i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--text-muted)'}">#${i + 1}</span>
            <div class="streak-item-info">
                <div class="streak-item-name">${escapeHtml(s.name)}</div>
                <div class="streak-item-days">${s.streak} day${s.streak !== 1 ? 's' : ''}</div>
            </div>
            <span class="streak-fire">${s.streak > 0 ? '🔥' : ''}</span>
        </div>`).join('');
}

// ===== Utilities =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function refreshCurrentView() {
    const activeView = document.querySelector('.view.active')?.id;
    if (activeView === 'view-dashboard') renderDashboard();
    else if (activeView === 'view-goals') renderGoalsList();
    else if (activeView === 'view-calendar') renderCalendar();
    else if (activeView === 'view-stats') renderStats();
}

// ===== Toast Notifications =====
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = {
        success: '✓',
        info: 'ℹ',
        warning: '⚠'
    };
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ===== Confetti =====
function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#6C5CE7', '#00B894', '#E17055', '#0984E3', '#FDCB6E', '#E84393', '#00CEC9', '#A29BFE'];

    for (let i = 0; i < 80; i++) {
        particles.push({
            x: canvas.width / 2 + (Math.random() - 0.5) * 200,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 15,
            vy: Math.random() * -15 - 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 8 + 3,
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 10,
            gravity: 0.3,
            opacity: 1,
        });
    }

    let frame = 0;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;

        particles.forEach(p => {
            if (p.opacity <= 0) return;
            alive = true;
            p.x += p.vx;
            p.vy += p.gravity;
            p.y += p.vy;
            p.rotation += p.rotSpeed;
            p.opacity -= 0.012;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.opacity);
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
            ctx.restore();
        });

        frame++;
        if (alive && frame < 120) requestAnimationFrame(animate);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    animate();
}

// ===== Notification Reminders =====
function checkReminders() {
    if (!('Notification' in window)) return;
    document.addEventListener('click', function requestNotif() {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
        document.removeEventListener('click', requestNotif);
    }, { once: true });
}

function sendReminder() {
    if (Notification.permission !== 'granted') return;
    const d = today();
    const log = appData.dailyLog[d] || {};
    const goalCount = appData.goals.length;
    const completed = Object.values(log).filter(e => e.status === 'completed').length;
    const remaining = goalCount - completed;

    if (remaining > 0) {
        new Notification('Discipline Forge', {
            body: `You have ${remaining} goal${remaining > 1 ? 's' : ''} remaining today. Keep pushing!`,
            icon: '◆'
        });
    }
}

setInterval(sendReminder, 2 * 60 * 60 * 1000);

// ===== Close modals on overlay click =====
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    });
});

// ===== Keyboard shortcuts =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    }
    if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !document.querySelector('.modal-overlay.active')) {
        const active = document.activeElement;
        if (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA' && active.tagName !== 'SELECT') {
            e.preventDefault();
            showGoalModal();
        }
    }
});

// ===== FAB for mobile =====
function initFAB() {
    const fab = document.getElementById('fab-add');
    if (fab) {
        fab.addEventListener('click', () => showGoalModal());
    }
}

// ===== Init =====
function init() {
    ensureTodayLog();
    updateGreeting();
    initQuotes();
    renderDashboard();
    checkReminders();
    initFAB();

    setInterval(updateGreeting, 60000);
}

init();
