// Muscle groups available
const availableMuscleGroups = [
    'Chest', 'Back', 'Biceps', 'Triceps', 'Legs', 'Shoulders', 'Abs', 'Cardio', 'Arms', 'Glutes'
];

const muscleGroupEmojis = {
    'chest': '🫀',
    'back': '🔙',
    'biceps': '💪',
    'triceps': '💪',
    'legs': '🦵',
    'shoulders': '🔺',
    'abs': '6️⃣',
    'cardio': '🏃',
    'arms': '💪',
    'glutes': '🍑'
};

// muscleGroupIcons is provided by main.js (Font Awesome icons)

// Toggle menu visibility
function toggleMenu(dayIndex) {
    const menu = document.getElementById(`menu-${dayIndex}`);
    menu.classList.toggle('hidden');
    
    // Close other open menus
    document.querySelectorAll('[id^="menu-"]').forEach(m => {
        if (m.id !== `menu-${dayIndex}`) {
            m.classList.add('hidden');
        }
    });
}

// Close menus when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.relative')) {
        document.querySelectorAll('[id^="menu-"]').forEach(m => {
            m.classList.add('hidden');
        });
    }
});

// Load routines on page load
document.addEventListener('DOMContentLoaded', () => {
    loadRoutines();
    loadStats();
});

// Normalize API response: backend returns { "0": {...}, "1": {...} } or empty {}.
// Ensure we always have an array of 7 day objects.
function normalizeRoutines(raw) {
    const defaultDay = () => ({ is_rest_day: false, muscle_groups: [], name: '' });
    const list = Array.from({ length: 7 }, (_, i) => {
        const key = String(i);
        return raw[key] != null
            ? { is_rest_day: !!raw[key].is_rest_day, muscle_groups: raw[key].muscle_groups || [], name: raw[key].name || '' }
            : defaultDay();
    });
    return list;
}

// Load and display routines
async function loadRoutines() {
    try {
        const response = await fetch('/api/routines');
        const raw = await response.json();
        const routines = normalizeRoutines(raw);

        const grid = document.getElementById('routines-grid');
        grid.innerHTML = '';

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date().getDay();

        for (let i = 0; i < 7; i++) {
            const routine = routines[i];
            const day = days[i];
            const isToday = i === today;
            const borderClass = isToday ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400' : '';
            const todayLabel = isToday ? '<span class="text-xs font-bold text-indigo-600 dark:text-indigo-400 ml-auto">Today</span>' : '';

            let html = `<div class="p-4 rounded-2xl border-2 ${borderClass} border-slate-200 dark-routine-border flex items-center justify-between dark-routine-card">`;

            if (routine.is_rest_day) {
                html += `
                    <div class="flex items-center gap-3 flex-1">
                        <span class="text-2xl">☕</span>
                        <div>
                            <p class="font-bold text-slate-900 dark-routine-text">${dayAbbr[i]}</p>
                            <p class="text-sm text-slate-500 dark-routine-text-muted">Rest Day</p>
                        </div>
                    </div>
                    ${todayLabel}
                    <div class="relative">
                        <button onclick="toggleMenu(${i})" class="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition">
                            <i class="fas fa-ellipsis-vertical"></i>
                        </button>
                        <div id="menu-${i}" class="hidden absolute right-0 mt-2 w-40 dark-modal-bg rounded-lg shadow-lg border dark-modal-border z-10">
                            <button onclick="openEditModal(${i}); toggleMenu(${i})" class="w-full text-left px-4 py-2 text-sm text-slate-700 dark-modal-text hover:bg-slate-50 dark-modal-hover flex items-center gap-2">
                                <i class="fas fa-pencil text-indigo-600 dark:text-indigo-400"></i> Edit
                            </button>
                            <button onclick="deleteRoutine(${i})" class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                <i class="fas fa-trash text-red-600 dark:text-red-400"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
            } else if (routine.muscle_groups && routine.muscle_groups.length > 0) {
                const firstMuscle = routine.muscle_groups[0].toLowerCase();
                const iconClass = muscleGroupIcons[firstMuscle] || 'fa-dumbbell';

                html += `
                    <div class="flex items-center gap-3 flex-1">
                        <span class="w-10 h-10 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                            <i class="fas ${iconClass}"></i>
                        </span>
                        <div>
                            <p class="font-bold text-slate-900 dark-routine-text">${dayAbbr[i]}</p>
                            <p class="text-sm text-slate-600 dark-routine-text-muted">${routine.muscle_groups.join(', ')}</p>
                        </div>
                    </div>
                    ${todayLabel}
                    <div class="relative">
                        <button onclick="toggleMenu(${i})" class="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition">
                            <i class="fas fa-ellipsis-vertical"></i>
                        </button>
                        <div id="menu-${i}" class="hidden absolute right-0 mt-2 w-40 dark-modal-bg rounded-lg shadow-lg border dark-modal-border z-10">
                            <button onclick="openEditModal(${i}); toggleMenu(${i})" class="w-full text-left px-4 py-2 text-sm text-slate-700 dark-modal-text hover:bg-slate-50 dark-modal-hover flex items-center gap-2">
                                <i class="fas fa-pencil text-indigo-600 dark:text-indigo-400"></i> Edit
                            </button>
                            <button onclick="deleteRoutine(${i})" class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                <i class="fas fa-trash text-red-600 dark:text-red-400"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="flex items-center gap-3 flex-1">
                        <span class="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold">
                            -
                        </span>
                        <div>
                            <p class="font-bold text-slate-900 dark-routine-text">${dayAbbr[i]}</p>
                            <p class="text-sm text-slate-500 dark-routine-text-muted">No routine set</p>
                        </div>
                    </div>
                    ${todayLabel}
                    <div class="relative">
                        <button onclick="toggleMenu(${i})" class="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition">
                            <i class="fas fa-ellipsis-vertical"></i>
                        </button>
                        <div id="menu-${i}" class="hidden absolute right-0 mt-2 w-40 dark-modal-bg rounded-lg shadow-lg border dark-modal-border z-10">
                            <button onclick="openEditModal(${i}); toggleMenu(${i})" class="w-full text-left px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark-modal-hover flex items-center gap-2">
                                <i class="fas fa-plus text-indigo-600 dark:text-indigo-400"></i> Add Routine
                            </button>
                        </div>
                    </div>
                `;
            }

            html += `</div>`;
            grid.innerHTML += html;
        }
    } catch (error) {
        console.error('Error loading routines:', error);
    }
}

// Open edit modal
function openEditModal(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4';
    modal.id = `modal-${dayIndex}`;

    modal.innerHTML = `
        <div class="dark-modal-bg rounded-3xl border dark-modal-border p-8 max-w-md w-full shadow-xl animate-scale-pop-slow">
            <h2 class="text-2xl font-bold mb-6 dark-modal-text">${days[dayIndex]}</h2>
            
            <div class="mb-6">
                <label class="flex items-center gap-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer">
                    <input type="checkbox" id="rest-day-check" onchange="updateMuscleDisplay(${dayIndex})" class="w-5 h-5 rounded-lg cursor-pointer" />
                    <span class="font-semibold dark-modal-text">Rest Day</span>
                </label>
            </div>

            <div id="muscles-container" class="mb-6">
                <p class="text-sm font-semibold dark-modal-text-muted mb-3 uppercase tracking-wider">Routine Name</p>
                <input type="text" id="routine-name" placeholder="e.g., Chest & Biceps" class="w-full mb-4">
                
                <p class="text-sm font-semibold dark-modal-text-muted mb-3 uppercase tracking-wider">Muscle Groups</p>
                <div class="space-y-2 mb-4 flex flex-wrap gap-2" id="muscle-list"></div>
                
                <div class="flex flex-wrap gap-2 mb-3" id="muscle-buttons"></div>
            </div>

            <div class="flex gap-3">
                <button onclick="saveRoutine(${dayIndex}, '${modal.id}')" class="flex-1 px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold transition-all">
                    Save
                </button>
                <button onclick="closeModal('${modal.id}')" class="flex-1 px-4 py-2 rounded-2xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 dark-modal-text font-bold transition-all">
                    Cancel
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Load current routine
    fetch('/api/routines')
        .then(r => r.json())
        .then(raw => {
            const routines = normalizeRoutines(raw);
            const routine = routines[dayIndex];
            const restCheck = document.getElementById('rest-day-check');
            const routineName = document.getElementById('routine-name');
            const muscleButtons = document.getElementById('muscle-buttons');

            restCheck.checked = routine.is_rest_day;
            routineName.value = routine.name || '';
            updateMuscleDisplay(dayIndex);

            // Create muscle group buttons
            availableMuscleGroups.forEach(mg => {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = mg;
                button.className = 'px-4 py-2 rounded-full border-2 transition-all cursor-pointer font-medium text-sm';
                
                const isSelected = routine.muscle_groups && routine.muscle_groups.includes(mg);
                if (isSelected) {
                    button.className += ' border-indigo-600 dark:border-indigo-500 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300';
                } else {
                    button.className += ' border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-600 dark:hover:border-indigo-500';
                }
                
                button.onclick = () => toggleMuscleButton(mg, button);
                muscleButtons.appendChild(button);
            });

            // After buttons are created, update the routine name default from the current selection
            updateRoutineNameFromSelected();

            // Close modal on background click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal.id);
                }
            });
        });
}

// Update muscle display based on rest day checkbox
function updateMuscleDisplay(dayIndex) {
    const restCheck = document.getElementById('rest-day-check');
    const musclesContainer = document.getElementById('muscles-container');
    const routineName = document.getElementById('routine-name');
    
    if (restCheck.checked) {
        musclesContainer.style.display = 'none';
        // If routine name was auto-generated, clear it when making a rest day
        if (routineName && routineName.dataset && routineName.dataset.autoTitle && routineName.value.trim() === routineName.dataset.autoTitle.trim()) {
            routineName.value = '';
            routineName.dataset.autoTitle = '';
        }
    } else {
        musclesContainer.style.display = 'block';
        // Recompute name based on muscle selection if appropriate
        updateRoutineNameFromSelected();
    }
}

// Toggle muscle button selection
function toggleMuscleButton(muscle, button) {
    button.classList.toggle('border-indigo-600');
    button.classList.toggle('dark:border-indigo-500');
    button.classList.toggle('bg-indigo-100');
    button.classList.toggle('dark:bg-indigo-900/30');
    button.classList.toggle('text-indigo-700');
    button.classList.toggle('dark:text-indigo-300');
    button.classList.toggle('border-slate-300');
    button.classList.toggle('dark:border-slate-600');
    button.classList.toggle('bg-white');
    button.classList.toggle('dark:bg-slate-800');
    button.classList.toggle('text-slate-700');
    button.classList.toggle('dark:text-slate-300');
    button.classList.toggle('hover:border-indigo-600');
    button.classList.toggle('dark:hover:border-indigo-500');

    // Update the routine name default when selection changes
    updateRoutineNameFromSelected();
}

// Create a display-friendly title from selected muscles
function makeTitleFromMuscles(muscles) {
    const caps = muscles.map(m => {
        // Normalize spacing and capitalization
        return m.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    });

    if (caps.length === 0) return '';
    if (caps.length === 1) return caps[0];
    if (caps.length === 2) return `${caps[0]} and ${caps[1]}`;
    // 3+ -> 'A, B and C'
    return `${caps.slice(0, -1).join(', ')} and ${caps[caps.length - 1]}`;
}

// Update the routine name input based on selected muscles
function updateRoutineNameFromSelected() {
    const routineName = document.getElementById('routine-name');
    const muscleButtons = document.getElementById('muscle-buttons');
    if (!routineName || !muscleButtons) return;

    const selectedButtons = Array.from(muscleButtons.querySelectorAll('button'))
        .filter(btn => btn.classList.contains('text-indigo-700'));
    const muscles = selectedButtons.map(btn => btn.textContent.trim());

    const newTitle = makeTitleFromMuscles(muscles);
    const prevAuto = routineName.dataset.autoTitle || '';

    // If the user hasn't provided a custom name (empty) or the current name equals the previous auto-generated one,
    // update it with the new auto-generated title. Otherwise, respect the user's custom title.
    if (!routineName.value.trim() || routineName.value.trim() === prevAuto.trim()) {
        routineName.value = newTitle;
        routineName.dataset.autoTitle = newTitle;
    }
}


// Add muscle group in modal
function addMuscleToModal(dayIndex) {
    const select = document.getElementById('muscle-select');
    const muscle = select.value;

    if (!muscle) return;

    const muscleList = document.getElementById('muscle-list');
    const existing = Array.from(muscleList.querySelectorAll('div')).map(div => div.textContent.trim());

    if (!existing.includes(muscle)) {
        const div = document.createElement('div');
        div.className = 'p-2 rounded-lg bg-indigo-900/30 border border-indigo-500/20 flex items-center justify-between';
        div.innerHTML = `
            <span>${muscle}</span>
            <button type="button" onclick="this.parentElement.remove()" class="text-slate-400 hover:text-red-400 transition">×</button>
        `;
        muscleList.appendChild(div);
    }

    select.value = '';
}

// Remove muscle from modal
function removeMuscleFromModal(muscle) {
    // Find and remove the muscle from the display
    const muscleList = document.getElementById('muscle-list');
    const divs = muscleList.querySelectorAll('div');
    
    for (let div of divs) {
        if (div.textContent.includes(muscle)) {
            div.remove();
            break;
        }
    }
}

// Save routine
async function saveRoutine(dayIndex, modalId) {
    const restCheck = document.getElementById('rest-day-check');
    const routineName = document.getElementById('routine-name');
    const muscleButtons = document.getElementById('muscle-buttons');
    
    // Get selected muscles from buttons
    const selectedButtons = Array.from(muscleButtons.querySelectorAll('button'))
        .filter(btn => btn.classList.contains('text-indigo-700'));
    const muscles = selectedButtons.map(btn => btn.textContent);

    try {
        const response = await fetch(`/api/routines/${dayIndex}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: routineName.value || '',
                is_rest_day: restCheck.checked,
                muscle_groups: restCheck.checked ? [] : muscles
            })
        });

        if (response.ok) {
            closeModal(modalId);
            loadRoutines();
        }
    } catch (error) {
        console.error('Error saving routine:', error);
    }
}

// Toggle rest day
async function toggleRestDay(dayIndex, makeRestDay) {
    try {
        const response = await fetch(`/api/routines/${dayIndex}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                is_rest_day: makeRestDay,
                muscle_groups: makeRestDay ? [] : []
            })
        });

        if (response.ok) {
            loadRoutines();
        }
    } catch (error) {
        console.error('Error updating routine:', error);
    }
}

// Remove muscle group
async function removeMuscleGroup(dayIndex, muscle) {
    try {
        const response = await fetch('/api/routines');
        const raw = await response.json();
        const routines = normalizeRoutines(raw);
        const routine = routines[dayIndex];
        
        routine.muscle_groups = routine.muscle_groups.filter(m => m !== muscle);

        const updateResponse = await fetch(`/api/routines/${dayIndex}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                is_rest_day: routine.is_rest_day,
                muscle_groups: routine.muscle_groups
            })
        });

        if (updateResponse.ok) {
            loadRoutines();
        }
    } catch (error) {
        console.error('Error removing muscle group:', error);
    }
}

function deleteRoutine(dayIndex) {
    window.dayToDelete = dayIndex;
    document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
    document.getElementById('delete-modal').classList.add('hidden');
    window.dayToDelete = null;
}

function confirmDelete() {
    const dayIndex = window.dayToDelete;
    closeDeleteModal();

    fetch(`/api/routines/${dayIndex}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.success || data.routine) {
                loadRoutines();
                loadStats();
            } else {
                alert('Failed to delete routine');
            }
        })
        .catch(err => {
            console.error('Error deleting routine:', err);
            alert('Error deleting routine');
        });
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// Load and display stats
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        const displayStreak = typeof stats.display_streak !== 'undefined' ? stats.display_streak : stats.current_streak;
        document.getElementById('streak-display').textContent = displayStreak;
        document.getElementById('best-streak-display').textContent = stats.best_streak;
        document.getElementById('this-week').textContent = stats.this_week;
        document.getElementById('this-month').textContent = stats.this_month;
        document.getElementById('total-workouts').textContent = stats.total_workouts;
        document.getElementById('avg-per-week').textContent = stats.avg_per_week.toFixed(1);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}
