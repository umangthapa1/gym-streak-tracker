# 💪 Gym Streak Tracker

A modern, responsive gym workout tracker app built with Python Flask, HTML, CSS, and vanilla JavaScript. Track your workout streaks, plan your weekly routines, and celebrate your progress with confetti animations!

## Features

✨ **Core Features:**
- 🔥 **Streak Tracking** - Track consecutive workout days with current and best streak records
- ✅ **Daily Check-in** - One-tap button to log today's workout with celebration confetti effect
- 📋 **Weekly Routine Planner** - Assign specific workouts to each day of the week with muscle groups or mark rest days
- 📊 **Workout Calendar** - Visual monthly calendar showing all workout days highlighted
- 📈 **Stats Dashboard** - Shows total workouts, this week's workouts, this month's workouts, and average per week

## Design

🎨 **Modern Dark UI:**
- Slate gray backgrounds with indigo/purple gradient accents
- Dark gradient cards with glassmorphism effects
- Rounded corners (2xl) on all cards and buttons
- Smooth animations and transitions
- Mobile responsive layout
- Muscle group emojis (💪 for biceps, 🦵 for legs, etc.)
- Rest days in amber/orange with coffee icon ☕
- Confetti burst animation on check-in

## Pages

1. **Home** - Main dashboard with:
   - Streak card with animated numbers
   - Today's routine display
   - Check-in button
   - Stats grid
   - Weekly schedule preview
   - Monthly calendar

2. **Routines** - Full page to manage weekly workout schedule:
   - Add/edit/delete routines for each day
   - Select muscle groups
   - Mark days as rest days
   - Today highlighted with ring indicator

## Data Structure

```
Workouts:
  - date: YYYY-MM-DD
  - notes: string

Routines:
  - day_of_week: 0-6 (0=Sunday)
  - name: string
  - muscle_groups: array
  - is_rest_day: boolean
```

## Installation & Setup

### Prerequisites
- Python 3.7+
- Any modern web browser

### Quick Start

1. **Navigate to the app directory:**
   ```bash
   cd app
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the app:**
   ```bash
   python app.py
   ```

4. **Open in browser:**
   - Go to `http://localhost:5000`

### Or use the provided script:
```bash
bash run.sh
```

## Project Structure

```
Gym Streak/
├── app/
│   ├── app.py                 # Flask backend
│   ├── requirements.txt        # Python dependencies
│   ├── gym_data.json          # Data storage (auto-created)
│   ├── templates/
│   │   ├── index.html         # Home page
│   │   └── routines.html      # Routines management page
│   └── static/
│       ├── css/
│       │   └── style.css      # Custom styles
│       └── js/
│           ├── main.js        # Home page logic
│           ├── routines.js    # Routines page logic
│           └── confetti.js    # Confetti animation
└── run.sh                     # Quick start script
```

## Usage

### Check In for Today
1. Click the "✨ Check In Today" button on the home page
2. Enjoy the confetti celebration! 🎉
3. Your streak will update automatically

### Manage Routines
1. Click "Schedule" button in the header
2. Click "Add Workout" or "Edit Muscles" on any day
3. Select muscle groups to assign
4. Or mark the day as a rest day
5. Click "Save"

### View Calendar
- Scroll down on the home page to see the current month's calendar
- Workout days are highlighted in indigo/purple
- Today has a ring indicator

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Customization

### Change Colors
Edit `app/static/css/style.css`:
- `from-indigo-600` - Change to other Tailwind colors
- `from-slate-900` - Background colors

### Add More Muscle Groups
Edit `app/static/js/routines.js`:
```javascript
const availableMuscleGroups = [
    'Chest', 'Back', 'Biceps', 'Triceps', 'Legs', 'Shoulders', 'Abs', 'Cardio', 'Arms', 'Glutes'
];
```

### Customize Emojis
Edit `app/static/js/main.js` and `app/static/js/routines.js`:
```javascript
const muscleGroups = {
    'chest': '🫀',  // Change these emojis
    'back': '🔙',
    // ... etc
};
```

## API Endpoints

- `GET /` - Home page
- `GET /routines` - Routines management page
- `GET /api/stats` - Get all statistics
- `GET /api/workouts` - Get all workouts
- `POST /api/checkout-today` - Check in for today
- `GET /api/routines` - Get all routines
- `PUT /api/routines/<day>` - Update routine for a day
- `GET /api/calendar` - Get calendar data for month

## Data Persistence

All data is stored in `gym_data.json` in the app directory. This file is automatically created on first run and persists across sessions.

## Tips

- ⏰ Check in at the same time each day for a consistent routine
- 🎯 Use the weekly planner to set realistic goals
- 📊 Monitor the stats dashboard to track your progress
- ☕ Don't forget to mark rest days to avoid burnout

## Technical Stack

- **Backend:** Python Flask
- **Frontend:** HTML5, CSS3 (Tailwind CSS), Vanilla JavaScript
- **Animation:** CSS animations + Canvas-based confetti
- **Data Storage:** JSON file-based
- **Icons:** Unicode emojis

## Known Limitations

- Data is stored locally in JSON format (not suitable for multi-user scenarios)
- Single browser/device tracking (no cloud sync)
- Requires running Python server locally

## Future Enhancements

- Database support (SQLite/PostgreSQL)
- Multi-user support with authentication
- Export data to CSV
- Mobile app version
- Workout notes and photos
- Progress graphs
- Social sharing

## License

Free to use and modify!

## Troubleshooting

**App won't start:**
- Make sure Python 3.7+ is installed: `python --version`
- Try `python3 app.py` instead of `python app.py`

**Port 5000 already in use:**
- Edit `app.py` line at the bottom: `app.run(debug=True, port=5001)`

**Data not saving:**
- Make sure the app directory has write permissions
- Check that `gym_data.json` was created

**Styling looks off:**
- Clear browser cache (Ctrl+Shift+Delete / Cmd+Shift+Delete)
- Make sure Tailwind CDN loads (check browser console)

---

Made with 💪 for fitness enthusiasts!
