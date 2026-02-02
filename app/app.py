from flask import Flask, render_template, request, jsonify, redirect, url_for, session, make_response
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from app.models import db, User, Workout, Routine
from datetime import datetime, timedelta
import json
import os
import tempfile

# Ensure Flask instance path is writable in serverless/read-only deployments
instance_path = os.environ.get('INSTANCE_PATH') or os.path.join(tempfile.gettempdir(), 'gym_streak_instance')
os.makedirs(instance_path, exist_ok=True)
app = Flask(__name__, instance_path=instance_path, instance_relative_config=True)

# Configuration
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

import ssl

database_url = os.environ.get('DATABASE_URL')
if database_url:
    # Parse URL to extract sslmode and other query params
    parsed = urlparse(database_url)
    qs = parse_qs(parsed.query)
    sslmode = qs.pop('sslmode', None)

    # Rebuild query string without sslmode (pg8000 doesn't accept sslmode kwarg)
    new_query = urlencode(qs, doseq=True)

    # Convert scheme to use pg8000 driver when appropriate
    scheme = parsed.scheme
    if scheme == 'postgres':
        scheme = 'postgresql+pg8000'
    elif scheme == 'postgresql' and '+pg8000' not in database_url:
        scheme = 'postgresql+pg8000'

    new_parsed = parsed._replace(scheme=scheme, query=new_query)
    database_url = urlunparse(new_parsed)

    # If sslmode was present and not 'disable', configure an SSLContext for pg8000
    # pg8000 expects an `ssl_context` object rather than an `ssl` boolean or `sslmode` kwarg.
    engine_options = {}
    if sslmode and sslmode[0].lower() != 'disable':
        try:
            ssl_context = ssl.create_default_context()
            # Note: You can adjust verification here if your provider requires special cert handling.
            # Add a short connect timeout to avoid long hangs during init in serverless environments.
            engine_options['connect_args'] = {'ssl_context': ssl_context, 'timeout': 5}
        except Exception as e:
            # If SSL context creation fails, log and continue; don't let app crash during import
            # We'll still set the database URL but the connection may fail until fixed.
            print('Warning: failed to create SSL context for DB connections:', e)

    if engine_options:
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = engine_options

    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///gym_streak.db'

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Remember-me cookie configuration (use env var FORCE_HTTPS=true in production to enforce Secure flag)
app.config['REMEMBER_COOKIE_DURATION'] = timedelta(days=30)
app.config['REMEMBER_COOKIE_HTTPONLY'] = True
app.config['REMEMBER_COOKIE_SAMESITE'] = 'Lax'
app.config['REMEMBER_COOKIE_SECURE'] = os.environ.get('FORCE_HTTPS', 'false').lower() == 'true'

# Initialize extensions
db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.remember_cookie_duration = timedelta(days=30)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Initialize database tables (only if they don't exist)
def init_db():
    with app.app_context():
        try:
            db.create_all()
            app.logger.info('Database initialized successfully (create_all).')
        except Exception as e:
            # In serverless environments a transient DB failure should not crash the function import.
            # Log the exception and allow the app to start; itinerary retries or migrations can run later.
            app.logger.exception('Database initialization failed; continuing without DB: %s', e)

# Try to initialize DB but do not let failures prevent the app from importing.
init_db()

# Startup diagnostic logging (redacts credentials)
try:
    parsed_final = urlparse(app.config.get('SQLALCHEMY_DATABASE_URI', ''))
    host_info = parsed_final.hostname or ''
    if parsed_final.port:
        host_info = f"{host_info}:{parsed_final.port}"
    app.logger.info('DB config - scheme=%s host=%s', parsed_final.scheme, host_info)
    engine_opts = app.config.get('SQLALCHEMY_ENGINE_OPTIONS') or {}
    has_ssl_context = bool(engine_opts.get('connect_args') and engine_opts['connect_args'].get('ssl_context'))
    app.logger.info('DB engine options present=%s ssl_context=%s', bool(engine_opts), has_ssl_context)
except Exception:
    app.logger.exception('Failed to log DB startup diagnostics')

# ============ Auth Routes ============

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            remember = request.form.get('remember') in ('1', 'on', 'true', 'True')
            login_user(user, remember=remember)
            # When 'remember' is checked, make session permanent (longer lifetime)
            session.permanent = remember
            return redirect(url_for('index'))
        else:
            return render_template('login.html', error='Invalid username or password')
    
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if password != confirm_password:
            return render_template('signup.html', error='Passwords do not match')
        
        if User.query.filter_by(username=username).first():
            return render_template('signup.html', error='Username already exists')
        
        if User.query.filter_by(email=email).first():
            return render_template('signup.html', error='Email already exists')
        
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        # Create default routines for new user
        for day in range(7):
            routine = Routine(user_id=user.id, day=day, name='', is_rest_day=False)
            db.session.add(routine)
        db.session.commit()
        
        login_user(user)
        return redirect(url_for('index'))
    
    return render_template('signup.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

# ============ App Routes ============

@app.route('/')
@login_required
def index():
    return render_template('index.html')

@app.route('/routines')
@login_required
def routines():
    return render_template('routines.html')

# ============ API Routes ============

def calculate_streak():
    """Calculate current and best streak for logged in user"""
    workouts = Workout.query.filter_by(user_id=current_user.id).all()
    workout_dates = sorted([w.date for w in workouts])
    
    if not workout_dates:
        return 0, 0
    
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Current streak (ending at today)
    current_streak = 0
    check_date = datetime.now()
    for i in range(365):
        check_str = check_date.strftime('%Y-%m-%d')
        if check_str in workout_dates:
            current_streak += 1
            check_date -= timedelta(days=1)
        else:
            break
    
    # Best streak
    best_streak = 0
    temp_streak = 0
    for idx, workout_date in enumerate(workout_dates):
        if idx == 0:
            temp_streak = 1
        else:
            current = datetime.strptime(workout_date, '%Y-%m-%d')
            prev = datetime.strptime(workout_dates[idx - 1], '%Y-%m-%d')
            if (current - prev).days == 1:
                temp_streak += 1
            else:
                best_streak = max(best_streak, temp_streak)
                temp_streak = 1
    
    best_streak = max(best_streak, temp_streak)
    
    return current_streak, best_streak


def compute_streak_from(start_date_str, workout_dates):
    """Compute consecutive streak length starting from a given date string and going backward."""
    count = 0
    try:
        check_date = datetime.strptime(start_date_str, '%Y-%m-%d')
    except Exception:
        return 0
    for i in range(365):
        check_str = check_date.strftime('%Y-%m-%d')
        if check_str in workout_dates:
            count += 1
            check_date -= timedelta(days=1)
        else:
            break
    return count

@app.route('/api/stats', methods=['GET'])
@login_required
def get_stats():
    workouts = Workout.query.filter_by(user_id=current_user.id).all()
    today = datetime.now().strftime('%Y-%m-%d')
    current_week_start = (datetime.now() - timedelta(days=datetime.now().weekday())).strftime('%Y-%m-%d')
    current_month = datetime.now().strftime('%Y-%m')
    
    total_workouts = len(workouts)
    
    this_week = sum(1 for w in workouts if w.date >= current_week_start)
    this_month = sum(1 for w in workouts if w.date.startswith(current_month))
    
    weeks_data = []
    for i in range(4):
        week_start = (datetime.now() - timedelta(days=datetime.now().weekday() + i*7)).strftime('%Y-%m-%d')
        week_end = (datetime.now() - timedelta(days=datetime.now().weekday() - 6 + i*7)).strftime('%Y-%m-%d')
        week_count = sum(1 for w in workouts if week_start <= w.date <= week_end)
        weeks_data.append(week_count)
    
    avg_per_week = sum(weeks_data) / len(weeks_data) if weeks_data else 0
    current_streak, best_streak = calculate_streak()
    # Compute a display-friendly streak: if the user hasn't logged today but did yesterday,
    # show the streak that would include yesterday so the UI reflects the ongoing streak until they log today.
    workout_dates = sorted([w.date for w in workouts])
    if current_streak == 0:
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        if yesterday in workout_dates:
            display_streak = compute_streak_from(yesterday, workout_dates)
        else:
            display_streak = 0
    else:
        display_streak = current_streak

    return jsonify({
        'total_workouts': total_workouts,
        'this_week': this_week,
        'this_month': this_month,
        'avg_per_week': round(avg_per_week, 1),
        'current_streak': current_streak,
        'display_streak': display_streak,
        'best_streak': best_streak,
        'today_logged': today in [w.date for w in workouts]
    })

@app.route('/api/workouts', methods=['GET'])
@login_required
def get_workouts():
    workouts = Workout.query.filter_by(user_id=current_user.id).all()
    return jsonify([{'date': w.date, 'notes': w.notes} for w in workouts])

@app.route('/api/checkout-today', methods=['POST'])
@login_required
def checkout_today():
    today = datetime.now().strftime('%Y-%m-%d')
    notes = request.json.get('notes', '') if request.json else ''
    
    if Workout.query.filter_by(user_id=current_user.id, date=today).first():
        return jsonify({'error': 'Already checked in today'}), 400
    
    workout = Workout(user_id=current_user.id, date=today, notes=notes)
    db.session.add(workout)
    db.session.commit()
    
    current_streak, best_streak = calculate_streak()
    
    resp = make_response(jsonify({
        'success': True,
        'current_streak': current_streak,
        'best_streak': best_streak
    }))
    # set a persistent streak cookie for convenience (30 days)
    if current_streak is not None:
        resp.set_cookie('streak', str(current_streak), max_age=30*24*3600, httponly=True, samesite='Lax', secure=app.config.get('REMEMBER_COOKIE_SECURE', False))
    return resp

@app.route('/api/routines', methods=['GET'])
@login_required
def get_routines():
    routines = Routine.query.filter_by(user_id=current_user.id).order_by(Routine.day).all()
    result = {}
    for routine in routines:
        result[str(routine.day)] = {
            'day': routine.day,
            'name': routine.name or '',
            'muscle_groups': routine.get_muscle_groups(),
            'is_rest_day': routine.is_rest_day
        }
    return jsonify(result)

@app.route('/api/routines/<int:day>', methods=['PUT', 'DELETE'])
@login_required
def manage_routine(day):
    routine = Routine.query.filter_by(user_id=current_user.id, day=day).first()
    
    if not routine:
        return jsonify({'error': 'Routine not found'}), 404
    
    if request.method == 'PUT':
        data = request.json
        routine.name = data.get('name', '')
        routine.is_rest_day = data.get('is_rest_day', False)
        routine.set_muscle_groups(data.get('muscle_groups', []))
        db.session.commit()
        
        return jsonify({
            'success': True,
            'routine': {
                'day': routine.day,
                'name': routine.name,
                'muscle_groups': routine.get_muscle_groups(),
                'is_rest_day': routine.is_rest_day
            }
        })
    
    elif request.method == 'DELETE':
        routine.name = ''
        routine.muscle_groups = '[]'
        routine.is_rest_day = False
        db.session.commit()
        
        return jsonify({'success': True, 'routine': {
            'day': routine.day,
            'name': '',
            'muscle_groups': [],
            'is_rest_day': False
        }})

@app.route('/api/workouts/<date>', methods=['DELETE'])
@login_required
def delete_workout(date):
    workout = Workout.query.filter_by(user_id=current_user.id, date=date).first()
    
    if not workout:
        return jsonify({'error': 'Workout not found'}), 404
    
    db.session.delete(workout)
    db.session.commit()
    
    current_streak, best_streak = calculate_streak()
    
    resp = make_response(jsonify({
        'success': True,
        'current_streak': current_streak,
        'best_streak': best_streak
    }))
    # update or clear streak cookie
    if current_streak and current_streak > 0:
        resp.set_cookie('streak', str(current_streak), max_age=30*24*3600, httponly=True, samesite='Lax', secure=app.config.get('REMEMBER_COOKIE_SECURE', False))
    else:
        resp.set_cookie('streak', '', expires=0)
    return resp

@app.route('/api/calendar', methods=['GET'])
@login_required
def get_calendar():
    month = request.args.get('month')
    year = request.args.get('year')
    
    if not month or not year:
        now = datetime.now()
        month = now.month
        year = now.year
    else:
        month = int(month)
        year = int(year)
    
    month_str = f"{year}-{month:02d}"
    workouts = Workout.query.filter_by(user_id=current_user.id).all()
    workout_dates = [w.date.split('-')[2] for w in workouts if w.date.startswith(month_str)]
    
    return jsonify({
        'workout_dates': [int(d) for d in workout_dates],
        'month': month,
        'year': year
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
