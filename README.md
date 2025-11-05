# ⏰ Break Time - Smart Productivity Timer

A beautiful, modern web application that helps you stay productive with healthy breaks using the Pomodoro Technique and scheduled daily alarms.

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ Features

### 🎯 Pomodoro Timer
- **Work Sessions**: Customizable work intervals (default 25 minutes)
- **Break Management**: Short breaks (5 min) and long breaks (15 min)
- **Custom Timer**: Set any duration with minutes and seconds
- **Auto-start**: Automatically start breaks after work sessions
- **Visual Feedback**: Beautiful countdown display with color indicators

### 🔔 Daily Scheduled Alarms
- **3 Automatic Alarms**: Morning, Afternoon, and Evening
- **Unique Melodies**: Each alarm has a distinct musical sound
  - 🌅 **Morning**: Gentle ascending chime (C-E-G)
  - ☀️ **Afternoon**: Energetic school bell (2× ring)
  - 🌙 **Evening**: Calm descending wind chime (G-F-E-D)
- **Persistent**: Alarms trigger once per day even after page refresh
- **Test Function**: Preview each alarm sound before scheduling

### 📊 Statistics & Tracking
- **Sessions Completed**: Track your daily work sessions
- **Breaks Taken**: Monitor break frequency
- **Focus Time**: Calculate total productive time
- **Productivity Rank**: See your rank among all users

### 🎨 Beautiful UI/UX
- **Modern Design**: Purple-pink gradient theme
- **Responsive**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Button hover effects and transitions
- **Dark/Light Elements**: Carefully balanced color scheme
- **Clean Interface**: Intuitive and easy to use

### 🔐 User Management
- **Secure Authentication**: Login and registration system
- **Password Validation**: Minimum 6 characters required
- **Email Validation**: Proper email format checking
- **Session Management**: Secure user sessions

## 🛠️ Technologies Used

**Backend:**
- Python 3.8+
- Flask 2.0+
- SQLite3 (Database)
- Werkzeug (Security)

**Frontend:**
- HTML5
- CSS3 (Modern gradients & animations)
- JavaScript (ES6+)
- Web Audio API (Sound generation)

**Key Libraries:**
- Flask sessions for authentication
- LocalStorage for client-side data persistence
- Web Audio Context for alarm sounds

## 📦 Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/break-time.git
cd break-time
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Configure the application**
```bash
# The app uses default configuration from config.py
# You can modify SECRET_KEY and DATABASE settings if needed
```

4. **Run the application**
```bash
python app.py
```

5. **Open in browser**
```
http://localhost:5000
```

## 📖 Documentation

For detailed instructions on how to use this application, please refer to:

### 📘 [Complete User Guide](USER_GUIDE.md)
Comprehensive documentation covering:
- Account registration and login
- Dashboard overview and features
- Pomodoro timer usage
- Break management strategies
- Troubleshooting common issues
- Security and privacy information
- FAQ and best practices

## 🌐 Deployment (Hosting)

This application is ready to deploy on various hosting platforms:

### Deploy to Heroku

1. **Install Heroku CLI** and login:
```bash
heroku login
```

2. **Create a new Heroku app**:
```bash
heroku create your-app-name
```

3. **Set environment variables**:
```bash
heroku config:set SECRET_KEY=your-secret-key-here
heroku config:set FLASK_ENV=production
```

4. **Deploy**:
```bash
git push heroku main
```

5. **Initialize database**:
```bash
heroku run python -c "from app import init_db; init_db()"
```

### Deploy to Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Set the following:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Environment Variables**: Add `SECRET_KEY` and `FLASK_ENV=production`

### Deploy to PythonAnywhere

1. Upload your code to PythonAnywhere
2. Create a virtual environment and install dependencies
3. Configure WSGI file to point to your Flask app
4. Set up static files mapping

## 🚀 Quick Start Usage

### First Time Setup
1. Navigate to `http://localhost:5000`
2. Click "Register" to create an account
3. Enter your email and password (min 6 characters)
4. Login with your credentials

### Using the Timer
1. Select a timer mode: Work, Short Break, or Long Break
2. Click **▶ Start** to begin the countdown
3. Click **⏸ Pause** to pause the timer
4. Click **↻ Reset** to reset to initial time
5. When time's up, the alarm will ring continuously
6. Click **🔕 STOP ALARM** to silence it

### Setting Daily Alarms
1. Scroll to the "Daily Scheduled Alarms" section
2. Set your preferred times for:
   - 🌅 Morning Alarm
   - ☀️ Afternoon Alarm
   - 🌙 Evening Alarm
3. Click **🔊 Test** to preview each sound
4. Click **💾 Save Daily Alarm Schedule**
5. Alarms will trigger automatically at set times

### Custom Timer
1. Click the **⚙️ Custom** tab
2. Enter desired minutes and seconds
3. Click **Set Timer**
4. Start the timer as usual

### Adjusting Settings
- **Work Duration**: Change default work session length
- **Break Durations**: Adjust short and long break times
- **Auto-start Breaks**: Toggle automatic break starts
- **Notifications**: Enable browser notifications

## 📁 Project Structure

```
Break-Time/
├── app.py                 # Main Flask application
├── config.py              # Application configuration
├── requirements.txt       # Python dependencies
├── Procfile              # Heroku deployment config
├── runtime.txt           # Python version for hosting
├── .gitignore            # Git ignore file
├── README.md             # This file
│
├── instance/
│   └── breaktime.db      # SQLite database
│
├── models/
│   └── __init__.py       # Database models
│
├── routes/
│   └── __init__.py       # Route handlers
│
├── static/
│   ├── css/
│   │   └── styles.css    # Application styles
│   └── js/
│       ├── auth.js       # Authentication logic
│       └── timer.js      # Timer & alarm functionality
│
└── tampletes/
    ├── base.html         # Base template
    ├── home.html         # Dashboard/timer page
    ├── login.html        # Login page
    └── register.html     # Registration page
```

## 🎵 Alarm Sounds

The application uses **Web Audio API** to generate musical alarm sounds:

- **Synthesized Tones**: Pure sine waves for clear, pleasant sounds
- **Musical Frequencies**: Based on standard musical notes
- **Volume Control**: Balanced audio levels for comfort
- **Looping**: Alarms repeat until manually stopped

## 🔒 Security Features

- Password hashing for secure storage
- Session-based authentication
- SQL injection prevention
- XSS protection through template escaping
- CSRF protection (Flask built-in)

## 📱 Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera
- ⚠️ IE11 (Limited support)

**Note**: Web Audio API required for alarm sounds

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Known Issues

- Alarms may not trigger if browser tab is in background (browser limitation)
- Audio may require user interaction on first page load (browser security)

## 📝 Future Enhancements

- [ ] Weekly/monthly statistics charts
- [ ] Export data to CSV/JSON
- [ ] Dark mode toggle
- [ ] Mobile app version
- [ ] Sound customization options
- [ ] Integration with calendar apps
- [ ] Team productivity tracking

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Your Name**
- GitHub: [pon-makara] (https://github.com/pon-makara/Pon_Makara-Break-Time-Alarm)

## 🙏 Acknowledgments

- Inspired by the Pomodoro Technique® by Francesco Cirillo
- UI design influenced by modern gradient trends
- Sound design based on traditional school bells and wind chimes

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Contact:makara.pon@student.passerellesnumeriques.org
---

**Happy Productivity! 🚀**

Remember: Regular breaks boost productivity and creativity! ☕✨
