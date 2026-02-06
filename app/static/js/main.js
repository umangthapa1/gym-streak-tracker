// Theme handling
const THEME_STORAGE_KEY = 'gym-streak-theme';

function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

function applyTheme(theme) {
    const t = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    // small fade so switching feels smooth
    try {
        document.body.classList.add('theme-fade');
        window.setTimeout(() => document.body.classList.remove('theme-fade'), 220);
    } catch {}
}

function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    let current = getPreferredTheme();
    applyTheme(current);

    const syncToggle = () => {
        const isDark = current === 'dark';
        toggle.classList.toggle('is-dark', isDark);
        toggle.setAttribute('aria-checked', isDark ? 'true' : 'false');
    };
    syncToggle();

    toggle.addEventListener('click', () => {
        current = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_STORAGE_KEY, current);
        applyTheme(current);
        syncToggle();
    });
}

// Muscle group icons (Font Awesome)
const muscleGroupIcons = {
    'chest': 'fa-lungs',
    'back': 'fa-dumbbell',
    'biceps': 'fa-hand-fist',
    'triceps': 'fa-hand-fist',
    'legs': 'fa-mountain',
    'shoulders': 'fa-shield',
    'abs': 'fa-square',
    'cardio': 'fa-person-running',
    'arms': 'fa-hand-fist',
    'glutes': 'fa-person-biking'
};

let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();

// Load initial data
document.addEventListener('DOMContentLoaded', () => {
    try {
        initThemeToggle();
    } catch (e) {
        console.error('Theme init failed', e);
    }

    // Header blur-on-scroll
    try {
        const header = document.getElementById('site-header');
        if (header) {
            const update = () => {
                if (window.scrollY > 8) header.classList.add('is-scrolled');
                else header.classList.remove('is-scrolled');
            };
            update();
            window.addEventListener('scroll', update, { passive: true });
        }
    } catch (e) {
        console.error('Header scroll init failed', e);
    }

    // Only run dashboard logic on the home page (where streak/calendar exist)
    if (document.getElementById('current-streak')) {
        loadStats();
        loadTodayRoutine();
        loadWeeklySchedule();
        loadCalendar();
    }
});

// Fetch and display stats
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        // Update streak with animation - prefer display_streak when provided
        const streakEl = document.getElementById('current-streak');
        const displayStreak = typeof stats.display_streak !== 'undefined' ? stats.display_streak : stats.current_streak;
        if (streakEl) streakEl.textContent = displayStreak;
        
        const bestStreakEl = document.getElementById('best-streak');
        if (bestStreakEl) bestStreakEl.textContent = stats.best_streak;
        
        const bestStreakCopyEl = document.getElementById('best-streak-copy');
        if (bestStreakCopyEl) bestStreakCopyEl.textContent = stats.best_streak;
        
        const totalWorkoutsEl = document.getElementById('total-workouts');
        if (totalWorkoutsEl) totalWorkoutsEl.textContent = stats.total_workouts;
        
        const thisWeekEl = document.getElementById('this-week');
        if (thisWeekEl) thisWeekEl.textContent = stats.this_week;
        
        const thisMonthEl = document.getElementById('this-month');
        if (thisMonthEl) thisMonthEl.textContent = stats.this_month;
        
        const avgPerWeekEl = document.getElementById('avg-per-week');
        if (avgPerWeekEl) avgPerWeekEl.textContent = stats.avg_per_week.toFixed(1);

        // Consistency + milestone card
        const consistencyScoreEl = document.getElementById('consistency-score');
        const consistencyLabelEl = document.getElementById('consistency-label');
        const consistencyBarEl = document.getElementById('consistency-bar');
        const nextMilestoneEl = document.getElementById('next-milestone');

        if (consistencyScoreEl && consistencyLabelEl && consistencyBarEl && nextMilestoneEl) {
            const goalPerWeek = 4;
            const avgPerWeek = Number(stats.avg_per_week) || 0;
            const rawScore = goalPerWeek > 0 ? (avgPerWeek / goalPerWeek) * 100 : 0;
            const clamped = Math.max(0, Math.min(100, Math.round(rawScore)));

            consistencyScoreEl.textContent = `${clamped}%`;
            consistencyBarEl.style.width = `${clamped}%`;

            let label = 'Dialed in';
            if (clamped < 40) label = 'Just getting started';
            else if (clamped < 70) label = 'Building momentum';
            consistencyLabelEl.textContent = `${label} • Goal 4 workouts/week`;

            const milestones = [7, 21, 30, 50, 100];
            const current = displayStreak || 0;
            const best = stats.best_streak || 0;
            const reference = Math.max(current, best);
            let upcoming = null;
            for (let i = 0; i < milestones.length; i++) {
                if (reference < milestones[i]) {
                    upcoming = milestones[i];
                    break;
                }
            }
            if (!upcoming && reference > 0) {
                upcoming = reference + 10;
            }

            if (upcoming) {
                const remaining = Math.max(0, upcoming - current);
                if (current === 0) {
                    nextMilestoneEl.textContent = `Log your first workout to start working toward a ${upcoming}-day streak.`;
                } else {
                    nextMilestoneEl.textContent = `${remaining} more day${remaining === 1 ? '' : 's'} to hit a ${upcoming}-day streak milestone.`;
                }
            } else {
                nextMilestoneEl.textContent = 'Log your first session to start your streak.';
            }
        }

        // Show fire badge if streak >= 7
        const fireBadge = document.getElementById('fire-badge');
        if (fireBadge && displayStreak >= 7) {
            fireBadge.classList.remove('hidden');
        }

        // Update check-in button status
        if (stats.today_logged) {
            const btn = document.getElementById('checkin-btn');
            if (btn) {
                btn.disabled = true;
                btn.classList.add('opacity-50', 'cursor-not-allowed');
                btn.innerHTML = '<span class="text-2xl">✅</span><span>Workout Logged!</span>';
                btn.style.background = 'linear-gradient(to right, #10b981, #059669)';
            }
            const checkinStatusEl = document.getElementById('checkin-status');
            if (checkinStatusEl) checkinStatusEl.textContent = '';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load today's routine
async function loadTodayRoutine() {
    const todayRoutineDiv = document.getElementById('today-routine');
    if (!todayRoutineDiv) {
        console.warn('today-routine element not found');
        return;
    }

    // Show loading state
    todayRoutineDiv.innerHTML = `
        <div class="p-6 rounded-2xl bg-white dark-routine-card border border-slate-200 dark-routine-border animate-pulse">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-slate-200 dark-routine-skeleton"></div>
                <div class="flex-1">
                    <div class="h-4 bg-slate-200 dark-routine-skeleton rounded w-32 mb-2"></div>
                    <div class="h-6 bg-slate-200 dark-routine-skeleton rounded w-48"></div>
                </div>
            </div>
        </div>
    `;

    try {
        const response = await fetch('/api/routines');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const routines = await response.json();

        // Handle both object format {"0": {...}, "1": {...}} and array format
        if (routines === null || routines === undefined) {
            throw new Error('Routines data is null or undefined');
        }

        const today = new Date().getDay();
        let todayRoutine = null;
        
        // Try array access first, then object access
        if (Array.isArray(routines)) {
            todayRoutine = routines[today];
        } else if (typeof routines === 'object') {
            todayRoutine = routines[today] || routines[String(today)];
        } else {
            throw new Error(`Invalid routines format: expected object or array, got ${typeof routines}`);
        }

        // If still no routine, create a default empty one
        if (!todayRoutine) {
            todayRoutine = {
                name: '',
                muscle_groups: [],
                is_rest_day: false
            };
        }

        todayRoutineDiv.innerHTML = '';

        if (todayRoutine.is_rest_day) {
            todayRoutineDiv.innerHTML = `
                <div class="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark-routine-rest border border-amber-100 dark-routine-border">
                    <div class="flex items-start gap-4">
                        <div class="w-14 h-14 rounded-xl bg-amber-100 dark-routine-icon flex items-center justify-center text-white text-2xl flex-shrink-0"><i class="fas fa-mug-hot"></i></div>
                        <div class="flex-1">
                            <h3 class="text-xl font-bold text-amber-900 dark-routine-text">Rest Day</h3>
                            <p class="text-sm text-amber-700 dark-routine-text-muted mt-1">Recovery is part of the process</p>
                        </div>
                    </div>
                </div>
            `;
        } else if (todayRoutine.muscle_groups && todayRoutine.muscle_groups.length > 0) {
            const firstMuscle = todayRoutine.muscle_groups[0].toLowerCase();
            const iconClass = muscleGroupIcons[firstMuscle] || 'fa-dumbbell';

            todayRoutineDiv.innerHTML = `
                <div class="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark-routine-workout border border-indigo-100 dark-routine-border">
                    <div class="flex items-start justify-between gap-4 mb-4">
                        <div class="flex items-start gap-4 flex-1">
                            <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0"><i class="fas ${iconClass}"></i></div>
                            <div>
                                <p class="text-xs font-bold uppercase text-indigo-600 dark-routine-label tracking-wide mb-1">TODAY'S WORKOUT</p>
                                <h3 class="text-2xl font-bold text-slate-900 dark-routine-text">${todayRoutine.name}</h3>
                            </div>
                        </div>
                        <a href="/routines" class="text-indigo-600 dark-routine-link hover:text-indigo-700 font-medium text-sm">Edit</a>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        ${todayRoutine.muscle_groups.map(mg => {
                            const icon = muscleGroupIcons[mg.toLowerCase()] || 'fa-dumbbell';
                            return `
                            <span class="px-4 py-2 rounded-full bg-white dark-routine-chip border border-indigo-200 dark-routine-border text-sm font-medium text-slate-900 dark-routine-text">
                                <i class="fas ${icon} mr-1"></i>${mg}
                            </span>
                        `;
                        }).join('')}
                    </div>
                </div>
            `;
        } else {
            todayRoutineDiv.innerHTML = `
                <div class="p-6 rounded-2xl bg-white dark-routine-card border border-slate-200 dark-routine-border">
                    <p class="text-slate-600 dark-routine-text-muted font-medium">No routine planned for today</p>
                    <a href="/routines" class="text-indigo-600 dark-routine-link hover:text-indigo-700 text-sm font-medium mt-2 inline-block">
                        Set up routine →
                    </a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading today routine:', error);
        todayRoutineDiv.innerHTML = `
            <div class="p-6 rounded-2xl bg-white dark-routine-card border border-red-200 dark-routine-border">
                <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-lg bg-red-100 dark-routine-error flex items-center justify-center text-red-600 text-lg flex-shrink-0">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-lg font-bold text-red-900 dark-routine-text">Failed to load routine</h3>
                        <p class="text-sm text-red-700 dark-routine-text-muted mt-1">${error.message || 'Unknown error'}</p>
                        <button onclick="loadTodayRoutine()" class="mt-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold">
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Load weekly schedule preview
async function loadWeeklySchedule() {
    const weeklyScheduleDiv = document.getElementById('weekly-schedule');
    if (!weeklyScheduleDiv) {
        console.warn('weekly-schedule element not found');
        return;
    }

    try {
        const response = await fetch('/api/routines');
        const routines = await response.json();

        weeklyScheduleDiv.innerHTML = '';

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date().getDay();

        for (let i = 0; i < 7; i++) {
            const routine = routines[i] || routines[String(i)] || null;
            const isToday = i === today;
            const borderClass = isToday ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500 dark-weekly-today' : 'border-slate-200 hover:bg-slate-50 dark-weekly-item';

            let html = `<div class="p-4 rounded-2xl border ${borderClass} flex items-center justify-between transition-all dark-weekly-card">`;

            if (routine && routine.is_rest_day) {
                html += `
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                        <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 text-lg"><i class="fas fa-mug-hot"></i></div>
                        <div>
                            <p class="font-semibold text-slate-900">${dayAbbr[i]}</p>
                            <p class="text-sm text-amber-600 font-medium">Rest Day</p>
                        </div>
                    </div>
                `;
            } else if (routine && routine.muscle_groups && routine.muscle_groups.length > 0) {
                const firstMuscle = routine.muscle_groups[0].toLowerCase();
                const iconClass = muscleGroupIcons[firstMuscle] || 'fa-dumbbell';
                
                html += `
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                        <div class="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-lg"><i class="fas ${iconClass}"></i></div>
                        <div class="min-w-0">
                            <p class="font-semibold text-slate-900">${dayAbbr[i]}</p>
                            <p class="text-sm text-slate-600 truncate">${routine.name}</p>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="flex items-center gap-3 flex-1">
                        <span class="text-2xl text-slate-300">-</span>
                        <div>
                            <p class="font-semibold text-slate-900">${dayAbbr[i]}</p>
                            <p class="text-sm text-slate-400">No routine</p>
                        </div>
                    </div>
                `;
            }

            if (isToday) {
                html += `<span class="text-xs font-bold text-indigo-600 ml-auto">Today</span>`;
            }

            html += `</div>`;
            weeklyScheduleDiv.innerHTML += html;
        }
    } catch (error) {
        console.error('Error loading weekly schedule:', error);
    }
}

// Check in for today
async function checkInToday() {
    const button = document.getElementById('checkin-btn');
    button.disabled = true;

    try {
        const response = await fetch('/api/checkout-today', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: '' })
        });

        if (response.ok) {
            const data = await response.json();

            // Animate streak update
            const streakEl = document.getElementById('current-streak');
            streakEl.classList.add('animate-scale-pop');
            streakEl.textContent = data.current_streak;

            // Confetti burst
            const rect = button.getBoundingClientRect();
            confetti.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 80);

            // If a badge was awarded, show badge modal
            if (data.new_badge) {
                showBadgeModal(data.new_badge);
            }

            // Update button state
            button.innerHTML = '<span class="text-2xl">✅</span><span>Workout Logged! <a href="#" onclick="undoCheckIn(event)" class="underline text-xs ml-2">Undo</a></span>';
            button.style.background = 'linear-gradient(to right, #10b981, #059669)';
            button.classList.add('opacity-75', 'cursor-not-allowed');

            // Show fire badge if applicable
            if (data.current_streak >= 7) {
                document.getElementById('fire-badge').classList.remove('hidden');
            }

            // Reload everything
            setTimeout(() => {
                loadStats();
                loadTodayRoutine();
                loadWeeklySchedule();
            }, 800);


// Badge modal helper
function showBadgeModal(badge) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-3xl border border-slate-200 p-8 max-w-sm w-full shadow-xl text-center">
            <div class="text-6xl mb-4">${badge.icon || '🏅'}</div>
            <h3 class="text-xl font-bold">${badge.name}</h3>
            <p class="text-sm text-slate-600 mt-2">${badge.description || ''}</p>
            <div class="mt-6">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="px-4 py-2 rounded-2xl bg-indigo-600 text-white">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}
        } else {
            const error = await response.json();
            alert(error.error || 'Error checking in');
            button.disabled = false;
        }
    } catch (error) {
        console.error('Error checking in:', error);
        alert('Error checking in');
        button.disabled = false;
    }
}

// Load calendar
async function loadCalendar() {
    const calendarTitleEl = document.getElementById('calendar-title');
    const calendarDiv = document.getElementById('calendar');
    
    if (!calendarTitleEl || !calendarDiv) {
        console.warn('Calendar elements not found');
        return;
    }

    try {
        const response = await fetch(`/api/calendar?month=${currentMonth}&year=${currentYear}`);
        const calendarData = await response.json();

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        
        calendarTitleEl.textContent = `${monthNames[currentMonth - 1]} ${currentYear}`;

        // Get first day of month and number of days
        const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
        const today = new Date().getDate();
        const isCurrentMonth = currentMonth === new Date().getMonth() + 1 && currentYear === new Date().getFullYear();

        calendarDiv.innerHTML = '';

        // Days header
        const daysHeader = document.createElement('div');
        daysHeader.className = 'grid grid-cols-7 gap-2 mb-4';
        daysHeader.innerHTML = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            .map(day => `<div class="text-center text-sm font-bold text-slate-500 py-2">${day}</div>`)
            .join('');
        calendarDiv.appendChild(daysHeader);

        // Days grid
        const daysGrid = document.createElement('div');
        daysGrid.className = 'grid grid-cols-7 gap-2';
        
        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            daysGrid.innerHTML += '<div></div>';
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = isCurrentMonth && day === today;
            const hasWorkout = calendarData.workout_dates.includes(day);

            let className = 'p-2 rounded-xl text-center font-semibold transition-all relative';
            
            if (hasWorkout) {
                className += ' bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/30';
            } else {
                className += ' bg-white border border-slate-200 text-slate-700 hover:bg-slate-50';
            }

            if (isToday) {
                className += ' ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-50';
            }

            const cellDiv = document.createElement('div');
            cellDiv.className = className;
            cellDiv.textContent = day;
            cellDiv.style.animationDelay = `${day * 0.01}s`;
            cellDiv.classList.add('animate-fade-in');
            
            daysGrid.appendChild(cellDiv);
        }

        calendarDiv.appendChild(daysGrid);
    } catch (error) {
        console.error('Error loading calendar:', error);
    }
}

// Calendar navigation
function prevMonth() {
    if (currentMonth === 1) {
        currentMonth = 12;
        currentYear--;
    } else {
        currentMonth--;
    }
    loadCalendar();
}

function nextMonth() {
    if (currentMonth === 12) {
        currentMonth = 1;
        currentYear++;
    } else {
        currentMonth++;
    }
    loadCalendar();
}

// Undo today's check-in
async function undoCheckIn(event) {
    event.preventDefault();
    
    if (!confirm('Delete today\'s workout and undo check-in?')) return;

    const today = new Date().toISOString().split('T')[0];

    try {
        const response = await fetch(`/api/workouts/${today}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });

        if (response.ok) {
            const data = await response.json();
            
            // Reset button state
            const button = document.getElementById('checkin-btn');
            button.disabled = false;
            button.classList.remove('opacity-75', 'cursor-not-allowed');
            button.innerHTML = '<span class="text-2xl">🏋️</span><span>Log Today\'s Workout</span>';
            button.style.background = 'linear-gradient(to right, #6366f1, #a855f7)';

            // Reload everything
            loadStats();
            loadTodayRoutine();
            loadWeeklySchedule();
            loadCalendar();
        } else {
            alert('Error undoing check-in');
        }
    } catch (error) {
        console.error('Error undoing check-in:', error);
        alert('Error undoing check-in');
    }
}

// Generic app modal helper (uses #app-modal in base.html).
// On pages that don't include the modal skeleton (e.g. the public home page),
// we gracefully fall back to a simple alert instead of throwing.
function showAppModal(title, bodyHtml) {
    const modal = document.getElementById('app-modal');
    const titleEl = document.getElementById('app-modal-title');
    const body = document.getElementById('app-modal-body');

    // If any required element is missing, use a basic alert so the
    // Share button (and other callers) still behave instead of crashing.
    if (!modal || !titleEl || !body) {
        try {
            let plain = '';
            if (typeof bodyHtml === 'string') {
                // Strip the most common tags so the alert is readable.
                plain = bodyHtml.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
            } else if (bodyHtml && bodyHtml.textContent) {
                plain = bodyHtml.textContent;
            }
            alert(title + (plain ? '\n\n' + plain : ''));
        } catch (e) {
            alert(title);
        }
        return;
    }

    titleEl.textContent = title;
    if (typeof bodyHtml === 'string') body.innerHTML = bodyHtml; else {
        body.innerHTML = '';
        body.appendChild(bodyHtml);
    }
    modal.classList.remove('hidden');
}
function closeAppModal() {
    const modal = document.getElementById('app-modal');
    if (modal) modal.classList.add('hidden');
}
// wire close buttons
document.addEventListener('DOMContentLoaded', () => {
    const close = document.getElementById('app-modal-close');
    const ok = document.getElementById('app-modal-ok');
    if (close) close.addEventListener('click', closeAppModal);
    if (ok) ok.addEventListener('click', closeAppModal);
    // Allow Escape to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAppModal();
    });

    // Mobile nav dropdown toggle
    const navToggle = document.getElementById('nav-toggle');
    const primaryNav = document.getElementById('primary-nav');
    if (navToggle && primaryNav) {
        navToggle.addEventListener('click', () => {
            const isOpen = primaryNav.classList.contains('nav-open');
            if (isOpen) {
                primaryNav.classList.remove('nav-open');
                navToggle.setAttribute('aria-expanded', 'false');
            } else {
                primaryNav.classList.add('nav-open');
                navToggle.setAttribute('aria-expanded', 'true');
            }
        });
    }

    // Helper to open the share modal and handle copy/revoke
    async function handleShareClick() {
        try {
            console.debug('[share] handleShareClick invoked');
            // Try GET first to see if a token exists
            let r = await fetch('/api/share-token', { method: 'GET', credentials: 'same-origin' });
            if (!r.ok) throw new Error('failed');
            let data = await r.json();
            if (!data.share_token) {
                // create a new token
                r = await fetch('/api/share-token', { method: 'POST', credentials: 'same-origin' });
                if (!r.ok) throw new Error('failed');
                data = await r.json();
            }
            const url = data.share_url || `${location.origin}/share/${data.share_token}`;

            const body = document.createElement('div');
            body.className = 'space-y-4 animate-slide-in-up';
            body.innerHTML = `
                <div class="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 p-4 shadow-sm relative overflow-hidden">
                    <div class="absolute -top-6 -right-6 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl"></div>
                    <div class="absolute -bottom-8 -left-4 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl"></div>
                    <div class="relative">
                        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-500 mb-2 flex items-center gap-2">
                            <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white text-xs shadow-md">
                                <i class="fas fa-link"></i>
                            </span>
                            Shareable streak link
                        </p>
                        <div class="flex items-center gap-2 rounded-xl bg-slate-900/95 text-slate-50 px-3 py-2 font-mono text-xs shadow-inner">
                            <span class="break-words text-[11px] leading-snug">${url}</span>
                        </div>
                        <p class="text-xs text-slate-500 mt-3">
                            Send this link to friends so they can follow your progress and keep you accountable.
                        </p>
                    </div>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div class="flex items-center gap-2 text-[11px] text-slate-500">
                        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow"></span>
                        Live while your share token is active.
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="copy-share" class="btn-small px-3 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow hover:bg-indigo-500 transition-all">
                            Copy link
                        </button>
                        <button id="open-share" class="btn-small px-3 py-1.5 rounded-full bg-slate-800 text-slate-100 text-xs font-semibold shadow hover:bg-slate-700 transition-all">
                            Open
                        </button>
                        <button id="revoke-share" class="btn-small px-3 py-1.5 rounded-full bg-rose-500/90 text-white text-xs font-semibold hover:bg-rose-500 transition-all">
                            Revoke
                        </button>
                    </div>
                </div>
            `;
            showAppModal('Share your streak', body);

            const copyBtn = document.getElementById('copy-share');
            const revokeBtn = document.getElementById('revoke-share');

            if (copyBtn) copyBtn.addEventListener('click', async () => {
                try { await navigator.clipboard.writeText(url); copyBtn.textContent = 'Copied!'; setTimeout(()=>copyBtn.textContent='Copy',1500); }
                catch (err) {
                    const ta = document.createElement('textarea'); ta.value = url; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); copyBtn.textContent = 'Copied!'; setTimeout(()=>copyBtn.textContent='Copy',1500);
                }
            });

            const openBtn = document.getElementById('open-share');
            if (openBtn) openBtn.addEventListener('click', () => {
                window.open(url, '_blank');
            });

            if (revokeBtn) revokeBtn.addEventListener('click', async () => {
                if (!confirm('Revoke share link?')) return;
                const rr = await fetch('/api/share-token/revoke', { method: 'POST', credentials: 'same-origin' });
                const jr = await rr.json();
                if (jr && jr.success) { showAppModal('Share revoked', '<p>Link revoked</p>'); }
                else { showAppModal('Error', '<p>Failed to revoke share link</p>'); }
            });
        } catch (err) {
            console.error('Share error', err);
            showAppModal('Error', '<p>Failed to create or fetch share link</p>');
        }
    }

    // Attach a direct click listener to the share button as a fallback
    const directShareBtn = document.getElementById('share-btn');
    if (directShareBtn) {
        directShareBtn.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            handleShareClick();
        });
    }

    // Settings modal: open/close and username + delete account
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const settingsModalClose = document.getElementById('settings-modal-close');
    const settingsSaveUsername = document.getElementById('settings-save-username');
    const settingsNewUsername = document.getElementById('settings-new-username');
    const settingsCurrentUsernameEl = document.getElementById('settings-current-username');
    const settingsDeleteAccountBtn = document.getElementById('settings-delete-account-btn');
    const settingsDeleteConfirmModal = document.getElementById('settings-delete-confirm-modal');
    const settingsDeleteConfirmInput = document.getElementById('settings-delete-confirm-input');
    const settingsDeleteConfirmBtn = document.getElementById('settings-delete-confirm-btn');
    const settingsDeleteCancel = document.getElementById('settings-delete-cancel');

    function openSettingsModal() {
        if (settingsModal) {
            settingsModal.classList.remove('hidden');
            if (settingsNewUsername) settingsNewUsername.value = '';
        }
    }
    function closeSettingsModal() {
        if (settingsModal) settingsModal.classList.add('hidden');
    }
    function openDeleteConfirmModal() {
        if (settingsDeleteConfirmModal) {
            settingsDeleteConfirmModal.classList.remove('hidden');
            if (settingsDeleteConfirmInput) {
                settingsDeleteConfirmInput.value = '';
                settingsDeleteConfirmInput.focus();
            }
            if (settingsDeleteConfirmBtn) settingsDeleteConfirmBtn.disabled = true;
        }
    }
    function closeDeleteConfirmModal() {
        if (settingsDeleteConfirmModal) settingsDeleteConfirmModal.classList.add('hidden');
    }

    if (settingsBtn) settingsBtn.addEventListener('click', openSettingsModal);
    if (settingsModalClose) settingsModalClose.addEventListener('click', closeSettingsModal);
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) closeSettingsModal(); });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (settingsDeleteConfirmModal && !settingsDeleteConfirmModal.classList.contains('hidden')) closeDeleteConfirmModal();
            else closeSettingsModal();
        }
    });

    if (settingsSaveUsername && settingsNewUsername) {
        settingsSaveUsername.addEventListener('click', async () => {
            const newUsername = settingsNewUsername.value.trim();
            const currentUsername = settingsModal ? settingsModal.getAttribute('data-current-username') : '';
            if (!newUsername) { alert('Please enter a new username'); return; }
            if (newUsername.length < 3 || newUsername.length > 20) { alert('Username must be 3–20 characters'); return; }
            if (newUsername === currentUsername) { alert('New username must be different'); return; }
            try {
                const r = await fetch('/api/settings/username', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: newUsername })
                });
                const data = await r.json();
                if (r.ok) {
                    if (settingsModal) settingsModal.setAttribute('data-current-username', newUsername);
                    if (settingsCurrentUsernameEl) settingsCurrentUsernameEl.textContent = newUsername;
                    settingsNewUsername.value = '';
                    alert('Username updated!');
                } else {
                    alert(data.error || 'Failed to update username');
                }
            } catch (err) {
                console.error(err);
                alert('Error updating username');
            }
        });
    }

    if (settingsDeleteAccountBtn) settingsDeleteAccountBtn.addEventListener('click', openDeleteConfirmModal);
    if (settingsDeleteCancel) settingsDeleteCancel.addEventListener('click', closeDeleteConfirmModal);
    if (settingsDeleteConfirmInput) {
        settingsDeleteConfirmInput.addEventListener('input', () => {
            const currentUsername = settingsModal ? settingsModal.getAttribute('data-current-username') : '';
            settingsDeleteConfirmBtn.disabled = settingsDeleteConfirmInput.value.trim() !== currentUsername;
        });
    }
    if (settingsDeleteConfirmBtn) {
        settingsDeleteConfirmBtn.addEventListener('click', async () => {
            if (settingsDeleteConfirmBtn.disabled) return;
            if (!confirm('Are you sure? This cannot be undone.')) return;
            try {
                const r = await fetch('/api/settings/account', { method: 'DELETE', credentials: 'same-origin' });
                const data = await r.json();
                if (r.ok) {
                    alert('Account deleted. Redirecting…');
                    window.location.href = '/login';
                } else {
                    alert(data.error || 'Failed to delete account');
                }
            } catch (err) {
                console.error(err);
                alert('Error deleting account');
            }
        });
    }

    // Global handler for the Stop Impersonation banner button so it works on any page
    document.addEventListener('click', function(e) {
        if (!e.target) return;
        console.debug('[doc-click] target=', e.target);
        // support clicks on the button or contained elements
        const stopBtn = (e.target.id === 'stop-impersonate-btn') ? e.target : e.target.closest ? e.target.closest('#stop-impersonate-btn') : null;
        if (stopBtn) {
            if (!confirm('Stop impersonation and return to admin?')) return;
            fetch('/api/admin/stop_impersonate', { method: 'POST', credentials: 'same-origin' }).then(r=>r.json()).then(d=>{
                if (d && d.success) {
                    showAppModal('Impersonation stopped', '<p>Returned to admin account.</p>');
                    setTimeout(()=>location.reload(),800);
                } else {
                    showAppModal('Error', '<p>Failed to stop impersonation</p>');
                }
            }).catch(err=>{ console.error(err); showAppModal('Server error','<p>Server error occurred</p>') });
            return;
        }

        // Share button (header)
        const shareBtn = (e.target.id === 'share-btn') ? e.target : e.target.closest ? e.target.closest('#share-btn') : null;
        if (shareBtn) {
            handleShareClick();
            return;
        }

        // nothing matched; ignore
    });
});
