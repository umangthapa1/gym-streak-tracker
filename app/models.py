from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import json

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    workouts = db.relationship('Workout', backref='user', lazy=True, cascade='all, delete-orphan')
    routines = db.relationship('Routine', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Workout(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.String(10), nullable=False)
    notes = db.Column(db.String(255))

class Routine(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    day = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(120))
    muscle_groups = db.Column(db.String(500))  # Store as JSON string
    is_rest_day = db.Column(db.Boolean, default=False)

    def get_muscle_groups(self):
        if self.muscle_groups:
            return json.loads(self.muscle_groups)
        return []

    def set_muscle_groups(self, groups):
        self.muscle_groups = json.dumps(groups)
