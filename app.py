from flask import Flask, request, redirect, url_for, session, render_template, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

from config import Config

app = Flask(__name__, template_folder="tampletes")
app.config.from_object(Config)

db = SQLAlchemy(app)


# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    def set_password(self, password: str) -> None:
        """Hash and set the user's password"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verify the user's password"""
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.email}>'

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
        'study_break': 60,  # minutes
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


if __name__ == "__main__":
    init_db()
    app.run(debug=True)




