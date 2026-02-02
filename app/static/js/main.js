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
    loadStats();
    loadTodayRoutine();
    loadWeeklySchedule();
    loadCalendar();
});

// Fetch and display stats
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        // Update streak with animation - prefer display_streak when provided
        const streakEl = document.getElementById('current-streak');
        const displayStreak = typeof stats.display_streak !== 'undefined' ? stats.display_streak : stats.current_streak;
        streakEl.textContent = displayStreak;
        
        document.getElementById('best-streak').textContent = stats.best_streak;
        document.getElementById('best-streak-copy').textContent = stats.best_streak;
        document.getElementById('total-workouts').textContent = stats.total_workouts;
        document.getElementById('this-week').textContent = stats.this_week;
        document.getElementById('this-month').textContent = stats.this_month;
        document.getElementById('avg-per-week').textContent = stats.avg_per_week.toFixed(1);

        // Show fire badge if streak >= 7
        const fireBadge = document.getElementById('fire-badge');
        if (displayStreak >= 7) {
            fireBadge.classList.remove('hidden');
        }

        // Update check-in button status
        if (stats.today_logged) {
            const btn = document.getElementById('checkin-btn');
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            btn.innerHTML = '<span class="text-2xl">✅</span><span>Workout Logged!</span>';
            btn.style.background = 'linear-gradient(to right, #10b981, #059669)';
            document.getElementById('checkin-status').textContent = '';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load today's routine
async function loadTodayRoutine() {
    try {
        const response = await fetch('/api/routines');
        const routines = await response.json();

        const today = new Date().getDay();
        const todayRoutine = routines[today];

        const todayRoutineDiv = document.getElementById('today-routine');
        todayRoutineDiv.innerHTML = '';

        if (todayRoutine.is_rest_day) {
            todayRoutineDiv.innerHTML = `
                <div class="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                    <div class="flex items-start gap-4">
                        <div class="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center text-white text-2xl flex-shrink-0"><i class="fas fa-mug-hot"></i></div>
                        <div class="flex-1">
                            <h3 class="text-xl font-bold text-amber-900">Rest Day</h3>
                            <p class="text-sm text-amber-700 mt-1">Recovery is part of the process</p>
                        </div>
                    </div>
                </div>
            `;
        } else if (todayRoutine.muscle_groups && todayRoutine.muscle_groups.length > 0) {
            const firstMuscle = todayRoutine.muscle_groups[0].toLowerCase();
            const iconClass = muscleGroupIcons[firstMuscle] || 'fa-dumbbell';

            todayRoutineDiv.innerHTML = `
                <div class="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                    <div class="flex items-start justify-between gap-4 mb-4">
                        <div class="flex items-start gap-4 flex-1">
                            <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0"><i class="fas ${iconClass}"></i></div>
                            <div>
                                <p class="text-xs font-bold uppercase text-indigo-600 tracking-wide mb-1">TODAY'S WORKOUT</p>
                                <h3 class="text-2xl font-bold text-slate-900">${todayRoutine.name}</h3>
                            </div>
                        </div>
                        <a href="/routines" class="text-indigo-600 hover:text-indigo-700 font-medium text-sm">Edit</a>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        ${todayRoutine.muscle_groups.map(mg => {
                            const icon = muscleGroupIcons[mg.toLowerCase()] || 'fa-dumbbell';
                            return `
                            <span class="px-4 py-2 rounded-full bg-white border border-indigo-200 text-sm font-medium text-slate-900">
                                <i class="fas ${icon} mr-1"></i>${mg}
                            </span>
                        `;
                        }).join('')}
                    </div>
                </div>
            `;
        } else {
            todayRoutineDiv.innerHTML = `
                <div class="p-6 rounded-2xl bg-white border border-slate-200">
                    <p class="text-slate-600 font-medium">No routine planned for today</p>
                    <a href="/routines" class="text-indigo-600 hover:text-indigo-700 text-sm font-medium mt-2 inline-block">
                        Set up routine →
                    </a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading today routine:', error);
    }
}

// Load weekly schedule preview
async function loadWeeklySchedule() {
    try {
        const response = await fetch('/api/routines');
        const routines = await response.json();

        const weeklyScheduleDiv = document.getElementById('weekly-schedule');
        weeklyScheduleDiv.innerHTML = '';

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date().getDay();

        for (let i = 0; i < 7; i++) {
            const routine = routines[i];
            const isToday = i === today;
            const borderClass = isToday ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50';

            let html = `<div class="p-4 rounded-2xl border ${borderClass} flex items-center justify-between transition-all">`;

            if (routine.is_rest_day) {
                html += `
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                        <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 text-lg"><i class="fas fa-mug-hot"></i></div>
                        <div>
                            <p class="font-semibold text-slate-900">${dayAbbr[i]}</p>
                            <p class="text-sm text-amber-600 font-medium">Rest Day</p>
                        </div>
                    </div>
                `;
            } else if (routine.muscle_groups && routine.muscle_groups.length > 0) {
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
    try {
        const response = await fetch(`/api/calendar?month=${currentMonth}&year=${currentYear}`);
        const calendarData = await response.json();

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        
        document.getElementById('calendar-title').textContent = `${monthNames[currentMonth - 1]} ${currentYear}`;

        // Get first day of month and number of days
        const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
        const today = new Date().getDate();
        const isCurrentMonth = currentMonth === new Date().getMonth() + 1 && currentYear === new Date().getFullYear();

        const calendarDiv = document.getElementById('calendar');
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

// Generic app modal helper (uses #app-modal in base.html)
function showAppModal(title, bodyHtml) {
    const modal = document.getElementById('app-modal');
    document.getElementById('app-modal-title').textContent = title;
    const body = document.getElementById('app-modal-body');
    if (typeof bodyHtml === 'string') body.innerHTML = bodyHtml; else {
        body.innerHTML = '';
        body.appendChild(bodyHtml);
    }
    modal.classList.remove('hidden');
}
function closeAppModal() {
    document.getElementById('app-modal').classList.add('hidden');
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
            body.innerHTML = `<p class="break-words"><strong>${url}</strong></p><div class="mt-4 flex justify-end gap-2"><button id="copy-share" class="px-3 py-1 rounded bg-indigo-600 text-white">Copy</button><button id="revoke-share" class="px-3 py-1 rounded bg-rose-500 text-white">Revoke</button></div>`;
            showAppModal('Share your streak', body);

            const copyBtn = document.getElementById('copy-share');
            const revokeBtn = document.getElementById('revoke-share');

            if (copyBtn) copyBtn.addEventListener('click', async () => {
                try { await navigator.clipboard.writeText(url); copyBtn.textContent = 'Copied!'; setTimeout(()=>copyBtn.textContent='Copy',1500); }
                catch (err) {
                    const ta = document.createElement('textarea'); ta.value = url; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); copyBtn.textContent = 'Copied!'; setTimeout(()=>copyBtn.textContent='Copy',1500);
                }
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

