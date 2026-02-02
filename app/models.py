from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import json
from datetime import datetime

db = SQLAlchemy()


class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    actor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    action = db.Column(db.String(120), nullable=False)
    details = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'actor_id': self.actor_id,
            'action': self.action,
            'details': self.details,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    # Optional: token that allows a public shareable streak page
    share_token = db.Column(db.String(64), unique=True, nullable=True)
    # Admin flag for admin dashboard access
    is_admin = db.Column(db.Boolean, default=False)

    workouts = db.relationship('Workout', backref='user', lazy=True, cascade='all, delete-orphan')
    routines = db.relationship('Routine', backref='user', lazy=True, cascade='all, delete-orphan')
    badges = db.relationship('UserBadge', backref='user', lazy=True, cascade='all, delete-orphan')

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


# Badges
class Badge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(64), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    icon = db.Column(db.String(120), nullable=True)  # CSS class or emoji

    def to_dict(self):
        return {
            'id': self.id,
            'key': self.key,
            'name': self.name,
            'description': self.description,
            'icon': self.icon
        }

class UserBadge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    badge_id = db.Column(db.Integer, db.ForeignKey('badge.id'), nullable=False)
    awarded_at = db.Column(db.DateTime, nullable=False)

    badge = db.relationship('Badge')

    def to_dict(self):
        return {
            'id': self.id,
            'badge': self.badge.to_dict(),
            'awarded_at': self.awarded_at.strftime('%Y-%m-%d %H:%M:%S')
        }
