from flask import Flask, request, redirect, url_for, session, render_template, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os

from config import Config

app = Flask(__name__, template_folder="tampletes")
app.config.from_object(Config)

db = SQLAlchemy(app)

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    sessions = db.relationship('TimerSession', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password: str) -> None:
        """Hash and set the user's password"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verify the user's password"""
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.email}>'


# Session History Model
class TimerSession(db.Model):
    __tablename__ = 'session'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    session_type = db.Column(db.String(20), nullable=False)  # 'work', 'short', 'long', 'custom'
    duration = db.Column(db.Integer, nullable=False)  # in minutes
    completed_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert session to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'session_type': self.session_type,
            'duration': self.duration,
            'completed_at': self.completed_at.isoformat(),
            'date': self.completed_at.strftime('%Y-%m-%d'),
            'time': self.completed_at.strftime('%H:%M')
        }

    def __repr__(self):
        return f'<TimerSession {self.session_type} - {self.duration}m>'

def init_db():
    """Initialize database tables"""
    with app.app_context():
        db.create_all()
 

# Routes
@app.route("/")
def index():
    """Redirect to home page"""
    return redirect(url_for("home"))


@app.route("/home")
def home():
    """
    Home page function - Break Time Dashboard
    Displays user information, break time settings, and statistics
    """
    user_id = session.get("user_id")
    if not user_id:
        flash("Please log in to access this page", "error")
        return redirect(url_for("login"))
    
    user = User.query.get(user_id)
    if not user:
        session.clear()
        flash("Session expired. Please log in again.", "error")
        return redirect(url_for("login"))
    
    # Get user statistics
    total_users = User.query.count()
    user_number = User.query.filter(User.id <= user.id).count()
    
    # Break time default settings
    break_settings = {
        'work_duration': 25,  # minutes
        'short_break': 5,     # minutes
        'long_break': 15,     # minutes
        'sessions_until_long_break': 4
    }
    
    # Prepare dashboard data
    dashboard_data = {
        'user': user,
        'user_number': user_number,
        'total_users': total_users,
        'is_admin': user.id == 1,
        'session_active': True,
        'break_settings': break_settings,
        'total_breaks_today': 0,  # Will be tracked with database
        'total_work_time': 0,     # Will be tracked with database
    }
    
    return render_template("home.html", **dashboard_data)


@app.route("/register", methods=["GET", "POST"])
def register():
    """
    Register function - handles user registration
    GET: Display registration form
    POST: Process registration data
    """
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        confirm = request.form.get("confirm", "")

        # Validation
        errors = []
        if not email:
            errors.append("Email is required")
        elif "@" not in email or "." not in email:
            errors.append("Please enter a valid email address")
        
        if not password:
            errors.append("Password is required")
        elif len(password) < 6:
            errors.append("Password must be at least 6 characters")
        
        if password != confirm:
            errors.append("Passwords do not match")
        
        # Check if email already exists
        if email and User.query.filter_by(email=email).first():
            errors.append("Email already registered")

        # If no errors, create user
        if not errors:
            try:
                user = User(email=email)
                user.set_password(password)
                db.session.add(user)
                db.session.commit()
                
                # Log the user in
                session["user_id"] = user.id
                flash("Account created successfully!", "success")
                return redirect(url_for("index"))
            except Exception as e:
                db.session.rollback()
                flash("An error occurred. Please try again.", "error")
        else:
            for error in errors:
                flash(error, "error")

    return render_template("register.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    """
    Login function - handles user authentication
    GET: Display login form
    POST: Process login credentials
    """
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        # Validation
        if not email or not password:
            flash("Email and password are required", "error")
        else:
            # Find user by email
            user = User.query.filter_by(email=email).first()
            
            # Verify credentials
            if user and user.check_password(password):
                # Set session
                session["user_id"] = user.id
                flash(f"Welcome back, {user.email}!", "success")
                return redirect(url_for("index"))
            else:
                flash("Invalid email or password", "error")

    return render_template("login.html")


@app.route("/logout")
def logout():
    """Logout function - clears user session"""
    session.clear()
    flash("You have been logged out", "info")
    return redirect(url_for("login"))


@app.route("/api/sessions", methods=["POST"])
def save_session():
    """Save a completed session to history"""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    data = request.get_json()
    if not data or 'session_type' not in data or 'duration' not in data:
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        new_session = TimerSession(
            user_id=user_id,
            session_type=data['session_type'],
            duration=data['duration']
        )
        db.session.add(new_session)
        db.session.commit()
        return jsonify({"success": True, "session": new_session.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/sessions", methods=["GET"])
def get_sessions():
    """Get user's session history"""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        # Get limit parameter (default 50, max 500)
        limit = min(int(request.args.get('limit', 50)), 500)
        
        sessions = TimerSession.query.filter_by(user_id=user_id)\
            .order_by(TimerSession.completed_at.desc())\
            .limit(limit)\
            .all()
        
        return jsonify({
            "sessions": [s.to_dict() for s in sessions],
            "total": TimerSession.query.filter_by(user_id=user_id).count()
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/history")
def history():
    """Display session history page"""
    user_id = session.get("user_id")
    if not user_id:
        flash("Please log in to access this page", "error")
        return redirect(url_for("login"))
    
    user = User.query.get(user_id)
    if not user:
        session.clear()
        flash("Session expired. Please log in again.", "error")
        return redirect(url_for("login"))
    
    return render_template("history.html", user=user)


if __name__ == "__main__":
    init_db()
    # Use PORT from environment variable for hosting platforms
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)




