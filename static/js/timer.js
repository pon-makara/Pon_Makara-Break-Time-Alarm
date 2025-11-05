// Break Time Timer Application
let timer = null;
let timeRemaining = 25 * 60; // seconds
let currentMode = 'work';
let isRunning = false;
let sessionsCompleted = 0;
let totalFocusTime = 0;

// Alarm looping system
let alarmInterval = null;
let isAlarmRinging = false;

// Timer settings (will be overridden by backend)
let settings = {
  work: 25,
  short: 5,
  long: 15,
  sessionsUntilLong: 4
};

// Initialize timer
function initTimer() {
  const workDuration = document.getElementById('work-duration');
  const shortBreak = document.getElementById('short-break');
  const longBreak = document.getElementById('long-break');
  
  if (workDuration) settings.work = parseInt(workDuration.value);
  if (shortBreak) settings.short = parseInt(shortBreak.value);
  if (longBreak) settings.long = parseInt(longBreak.value);
  
  setMode('work', settings.work);
  loadStats();
  
  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Set timer mode
function setMode(mode, minutes) {
  if (isRunning) {
    if (!confirm('Timer is running. Stop and switch mode?')) return;
    pauseTimer();
  }
  
  currentMode = mode;
  timeRemaining = minutes * 60;
  updateDisplay();
  
  // Update active tab
  document.querySelectorAll('.timer-tab').forEach(tab => {
    if (tab.dataset.mode === mode) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  // Update mode label
  const modeLabels = {work: 'Work Session', short: 'Short Break', long: 'Long Break', custom: 'Custom Timer'};
  document.getElementById('timer-mode').textContent = modeLabels[mode];
  
  // Hide custom timer input
  const customInput = document.getElementById('custom-timer-input');
  if (customInput) customInput.style.display = 'none';
}

// Show custom timer input
function showCustomTimer() {
  const customInput = document.getElementById('custom-timer-input');
  if (customInput) {
    customInput.style.display = 'block';
    document.getElementById('custom-minutes').focus();
  }
  
  // Update active tab
  document.querySelectorAll('.timer-tab').forEach(tab => {
    if (tab.dataset.mode === 'custom') {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
}

// Hide custom timer input
function hideCustomTimer() {
  const customInput = document.getElementById('custom-timer-input');
  if (customInput) customInput.style.display = 'none';
}

// Set custom time
function setCustomTime() {
  if (isRunning) {
    if (!confirm('Timer is running. Stop and set custom time?')) return;
    pauseTimer();
  }
  
  const minutes = parseInt(document.getElementById('custom-minutes').value) || 0;
  const seconds = parseInt(document.getElementById('custom-seconds').value) || 0;
  
  if (minutes === 0 && seconds === 0) {
    alert('Please enter a valid time (at least 1 second)');
    return;
  }
  
  if (minutes > 120) {
    alert('Maximum duration is 120 minutes');
    return;
  }
  
  currentMode = 'custom';
  timeRemaining = (minutes * 60) + seconds;
  updateDisplay();
  
  document.getElementById('timer-mode').textContent = 'Custom Timer';
  document.getElementById('timer-status').textContent = 'Ready';
  
  hideCustomTimer();
  
  alert(`Custom timer set to ${minutes}m ${seconds}s`);
}

// Start timer
function startTimer() {
  if (isRunning) return;
  
  isRunning = true;
  document.getElementById('start-btn').style.display = 'none';
  document.getElementById('pause-btn').style.display = 'inline-flex';
  document.getElementById('timer-status').textContent = 'Running';
  
  timer = setInterval(() => {
    timeRemaining--;
    updateDisplay();
    
    if (timeRemaining <= 0) {
      completeSession();
    }
  }, 1000);
}

// Pause timer
function pauseTimer() {
  isRunning = false;
  clearInterval(timer);
  document.getElementById('start-btn').style.display = 'inline-flex';
  document.getElementById('pause-btn').style.display = 'none';
  document.getElementById('timer-status').textContent = 'Paused';
}

// Reset timer
function resetTimer() {
  pauseTimer();
  setMode(currentMode, settings[currentMode]);
  document.getElementById('timer-status').textContent = 'Ready';
}

// Complete session
async function completeSession() {
  pauseTimer();
  
  // Save session to backend
  const sessionDuration = Math.ceil((settings[currentMode] || timeRemaining / 60));
  await saveSessionToBackend(currentMode, sessionDuration);
  
  // ALWAYS play alarm sound when any timer completes
  playAlarm();
  
  if (currentMode === 'work') {
    sessionsCompleted++;
    totalFocusTime += settings.work;
    updateStats();
    
    // Show notification
    showNotification('Work session complete!', 'Time for a break 🎉');
    
    // Auto-start break if enabled
    const autoStart = document.getElementById('auto-start-breaks')?.checked;
    if (autoStart) {
      const nextBreak = sessionsCompleted % settings.sessionsUntilLong === 0 ? 'long' : 'short';
      setTimeout(() => {
        setMode(nextBreak, settings[nextBreak]);
        startTimer();
      }, 2000);
    }
  } else if (currentMode === 'custom') {
    // Custom timer completed
    showNotification('Custom timer complete!', 'Your set time has arrived! ⏰');
  } else {
    // Break completed
    showNotification('Break complete!', 'Ready to get back to work? 💪');
  }
}

// Update display
function updateDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  document.getElementById('timer-display').textContent = display;
  
  // Update page title
  document.title = `${display} - Break Time`;
}

// Update statistics
function updateStats() {
  document.getElementById('sessions-completed').textContent = sessionsCompleted;
  const hours = Math.floor(totalFocusTime / 60);
  const mins = totalFocusTime % 60;
  document.getElementById('total-time').textContent = `${hours}h ${mins}m`;
  
  saveStats();
}

// Save stats to localStorage
function saveStats() {
  const today = new Date().toDateString();
  const stats = {
    date: today,
    sessions: sessionsCompleted,
    focusTime: totalFocusTime
  };
  localStorage.setItem('breakTimeStats', JSON.stringify(stats));
}

// Load stats from localStorage
function loadStats() {
  const today = new Date().toDateString();
  const saved = localStorage.getItem('breakTimeStats');
  
  if (saved) {
    const stats = JSON.parse(saved);
    if (stats.date === today) {
      sessionsCompleted = stats.sessions || 0;
      totalFocusTime = stats.focusTime || 0;
      updateStats();
    }
  }
}

// Stop alarm ringing
function stopAlarm() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
  isAlarmRinging = false;
  
  // Hide stop button
  const stopBtn = document.getElementById('stop-alarm-btn');
  if (stopBtn) stopBtn.style.display = 'none';
  
  // Reset timer display color
  const timerDisplay = document.getElementById('timer-display');
  if (timerDisplay) timerDisplay.style.color = 'var(--accent)';
  
  // Reset page title
  document.title = 'Break Time Dashboard • Break-Time';
  
  console.log('🔕 Alarm stopped by user');
}

// Play single bell ring
function playBellOnce(alarmType = 'timer') {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Different sounds for different times of day
  let bellPattern;
  
  if (alarmType === 'morning') {
    // Morning: Gentle ascending chime (C-E-G major chord arpeggio)
    bellPattern = [
      { freq: 523.25, delay: 0, duration: 0.8, volume: 0.5 },      // C5
      { freq: 659.25, delay: 300, duration: 0.8, volume: 0.55 },   // E5
      { freq: 783.99, delay: 600, duration: 1.0, volume: 0.6 }     // G5
    ];
  } else if (alarmType === 'afternoon') {
    // Afternoon: Energetic two-tone school bell (fast Ding-Dong pattern × 2)
    bellPattern = [
      { freq: 880.00, delay: 0, duration: 0.35, volume: 0.65 },     // A5 - Ding
      { freq: 659.25, delay: 400, duration: 0.6, volume: 0.7 },     // E5 - Dong
      { freq: 880.00, delay: 1100, duration: 0.35, volume: 0.65 },  // A5 - Ding
      { freq: 659.25, delay: 1500, duration: 0.6, volume: 0.7 }     // E5 - Dong
    ];
  } else if (alarmType === 'evening') {
    // Evening: Calm descending wind chime (G-F-E-D)
    bellPattern = [
      { freq: 783.99, delay: 0, duration: 0.9, volume: 0.55 },    // G5
      { freq: 698.46, delay: 350, duration: 0.9, volume: 0.5 },   // F5
      { freq: 659.25, delay: 700, duration: 0.9, volume: 0.48 },  // E5
      { freq: 587.33, delay: 1050, duration: 1.2, volume: 0.45 }  // D5
    ];
  } else {
    // Default timer: Classic two-tone bell (E-C pattern × 2)
    bellPattern = [
      { freq: 659.25, delay: 0, duration: 0.5, volume: 0.6 },
      { freq: 523.25, delay: 600, duration: 0.7, volume: 0.65 },
      { freq: 659.25, delay: 1400, duration: 0.5, volume: 0.6 },
      { freq: 523.25, delay: 2000, duration: 0.7, volume: 0.65 }
    ];
  }
  
  bellPattern.forEach(note => {
    setTimeout(() => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = note.freq;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(note.volume, audioContext.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + note.duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + note.duration);
    }, note.delay);
  });
}

// Play alarm sound continuously (school bell style)
function playAlarm(alarmType = 'timer') {
  console.log('⏰ ALARM TRIGGERED! Time is up!');
  console.log('🔔 Alarm will ring continuously until you click "Stop Alarm"');
  
  // Stop any existing alarm
  stopAlarm();
  
  isAlarmRinging = true;
  
  // Show stop button
  const stopBtn = document.getElementById('stop-alarm-btn');
  if (stopBtn) stopBtn.style.display = 'inline-flex';
  
  // Play immediately
  try {
    playBellOnce(alarmType);
  } catch (e) {
    console.error('Web Audio API failed:', e);
  }
  
  // Calculate repeat interval based on bell pattern length
  let repeatInterval;
  if (alarmType === 'morning') repeatInterval = 2000;      // 2 seconds (gentle)
  else if (alarmType === 'afternoon') repeatInterval = 2200; // 2.2 seconds (energetic)
  else if (alarmType === 'evening') repeatInterval = 2500;   // 2.5 seconds (calm)
  else repeatInterval = 3000;  // 3 seconds for default
  
  // Loop the alarm every few seconds
  alarmInterval = setInterval(() => {
    if (isAlarmRinging) {
      try {
        playBellOnce(alarmType);
        console.log('🔔 Alarm ringing... (click Stop Alarm button to silence)');
      } catch (e) {
        console.error('Alarm playback error:', e);
      }
    }
  }, repeatInterval);
  
  // Visual feedback - Flash the screen
  const timerDisplay = document.getElementById('timer-display');
  if (timerDisplay) {
    let flashCount = 0;
    const flashInterval = setInterval(() => {
      timerDisplay.style.color = flashCount % 2 === 0 ? '#22c55e' : '#f59e0b';
      flashCount++;
      if (flashCount >= 6) {
        clearInterval(flashInterval);
        timerDisplay.style.color = 'var(--accent)';
      }
    }, 300);
  }
  
  // Page title flash
  let titleFlashCount = 0;
  const originalTitle = document.title;
  const titleFlash = setInterval(() => {
    document.title = titleFlashCount % 2 === 0 ? '⏰ TIME IS UP!' : '🔔 BREAK TIME!';
    titleFlashCount++;
    if (titleFlashCount >= 10) {
      clearInterval(titleFlash);
      document.title = originalTitle;
    }
  }, 500);
}

// Show notification
function showNotification(title, body) {
  const notificationsEnabled = document.getElementById('notifications')?.checked;
  
  if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: body,
      icon: '/static/icon.png',
      badge: '/static/badge.png'
    });
  }
  
  // Fallback alert
  if (!notificationsEnabled || Notification.permission !== 'granted') {
    alert(`${title}\n${body}`);
  }
}

// Save settings
function saveSettings() {
  settings.work = parseInt(document.getElementById('work-duration').value);
  settings.short = parseInt(document.getElementById('short-break').value);
  settings.long = parseInt(document.getElementById('long-break').value);
  settings.sessionsUntilLong = parseInt(document.getElementById('sessions-until-long').value);
  
  localStorage.setItem('breakTimeSettings', JSON.stringify(settings));
  alert('Settings saved successfully!');
  
  // Reset current timer if not running
  if (!isRunning) {
    setMode(currentMode, settings[currentMode]);
  }
}

// Load settings
function loadSettings() {
  const saved = localStorage.getItem('breakTimeSettings');
  if (saved) {
    settings = JSON.parse(saved);
    document.getElementById('work-duration').value = settings.work;
    document.getElementById('short-break').value = settings.short;
    document.getElementById('long-break').value = settings.long;
    document.getElementById('sessions-until-long').value = settings.sessionsUntilLong;
  }
}

// Save session to backend
async function saveSessionToBackend(sessionType, duration) {
  try {
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_type: sessionType,
        duration: duration
      })
    });
    
    if (response.ok) {
      console.log('✅ Session saved to history');
    } else {
      console.error('❌ Failed to save session');
    }
  } catch (error) {
    console.error('❌ Error saving session:', error);
  }
}

// Quick action functions
function viewHistory() {
  window.location.href = '/history';
}

function exportData() {
  const data = {
    stats: JSON.parse(localStorage.getItem('breakTimeStats') || '{}'),
    settings: settings,
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `break-time-data-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
}

function viewStats() {
  alert(`📊 Today's Statistics\n\nSessions Completed: ${sessionsCompleted}\nFocus Time: ${Math.floor(totalFocusTime / 60)}h ${totalFocusTime % 60}m\n\nKeep up the great work!`);
}

function testAlarm() {
  playAlarm();
  showNotification('Test Notification', 'This is how your break reminder will look! 🔔');
}

// Daily Scheduled Alarms (3 times per day)
let scheduledAlarms = {
  morning: '09:00',
  afternoon: '14:00',
  evening: '18:00'
};

// Check for scheduled alarms
function checkScheduledAlarms() {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const today = now.toDateString();
  
  console.log(`⏰ [${currentTime}] Checking scheduled alarms...`);
  
  // Check if we already triggered alarms today
  const triggeredToday = localStorage.getItem('alarmsTriggeredToday');
  let triggered = triggeredToday ? JSON.parse(triggeredToday) : { date: today, alarms: [] };
  
  // Reset if it's a new day
  if (triggered.date !== today) {
    triggered = { date: today, alarms: [] };
    console.log('📅 New day detected! Resetting alarm triggers.');
  }
  
  let alarmTriggered = false;
  
  // Check each alarm
  Object.keys(scheduledAlarms).forEach(alarmType => {
    const alarmTime = scheduledAlarms[alarmType];
    const isTriggered = triggered.alarms.includes(alarmType);
    
    console.log(`   ${alarmType}: ${alarmTime} ${isTriggered ? '✅ Already played today' : currentTime === alarmTime ? '🔔 TRIGGERING NOW!' : '⏳ Waiting...'}`);
    
    if (currentTime === alarmTime && !isTriggered) {
      console.log(`🔔🔔🔔 ALARM! ${alarmType.toUpperCase()} BREAK TIME at ${alarmTime}! 🔔🔔🔔`);
      alarmTriggered = true;
      
      // Play alarm with specific type
      playAlarm(alarmType);
      
      // Show notification
      const messages = {
        morning: '🌅 Good Morning! Time for your morning break!',
        afternoon: '☀️ Afternoon Break! Take a rest and recharge!',
        evening: '🌙 Evening Break! Great work today, time to relax!'
      };
      showNotification(`${alarmType.charAt(0).toUpperCase() + alarmType.slice(1)} Break Time`, messages[alarmType]);
      
      // Mark as triggered
      triggered.alarms.push(alarmType);
      localStorage.setItem('alarmsTriggeredToday', JSON.stringify(triggered));
      
      console.log(`✅ ${alarmType} alarm marked as played for today.`);
    }
  });
  
  if (!alarmTriggered) {
    console.log('✓ No alarms at this time. Next check in 60 seconds.');
  }
}

// Load scheduled alarm times from localStorage
function loadScheduledAlarms() {
  const saved = localStorage.getItem('scheduledAlarms');
  if (saved) {
    scheduledAlarms = JSON.parse(saved);
    // Update UI if inputs exist
    if (document.getElementById('morning-alarm')) {
      document.getElementById('morning-alarm').value = scheduledAlarms.morning;
      document.getElementById('afternoon-alarm').value = scheduledAlarms.afternoon;
      document.getElementById('evening-alarm').value = scheduledAlarms.evening;
    }
  }
}

// Save scheduled alarm times
function saveScheduledAlarms() {
  scheduledAlarms.morning = document.getElementById('morning-alarm').value;
  scheduledAlarms.afternoon = document.getElementById('afternoon-alarm').value;
  scheduledAlarms.evening = document.getElementById('evening-alarm').value;
  
  localStorage.setItem('scheduledAlarms', JSON.stringify(scheduledAlarms));
  alert('✅ Daily alarm schedule saved!\n\n🌅 Morning: ' + scheduledAlarms.morning + 
        '\n☀️ Afternoon: ' + scheduledAlarms.afternoon + 
        '\n🌙 Evening: ' + scheduledAlarms.evening);
}

// Test scheduled alarm
function testScheduledAlarm(type) {
  playAlarm(type);
  const messages = {
    morning: '🌅 Good Morning! Time for your morning break!',
    afternoon: '☀️ Afternoon Break! Take a rest and recharge!',
    evening: '🌙 Evening Break! Great work today, time to relax!'
  };
  showNotification('Test: ' + type.charAt(0).toUpperCase() + type.slice(1) + ' Alarm', messages[type]);
}

// Show alarm monitoring status
function showAlarmStatus() {
  const now = new Date();
  const statusDiv = document.getElementById('alarm-status');
  if (statusDiv) {
    statusDiv.textContent = `🟢 Monitoring active • Next check: ${now.getHours()}:${(now.getMinutes() + 1).toString().padStart(2, '0')}`;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadScheduledAlarms();
  initTimer();
  
  // Add event listeners for timer tabs
  document.querySelectorAll('.timer-tab').forEach(button => {
    button.addEventListener('click', (e) => {
      const mode = e.currentTarget.dataset.mode;
      const minutes = e.currentTarget.dataset.minutes;
      
      if (mode === 'custom') {
        showCustomTimer();
      } else {
        setMode(mode, parseInt(minutes));
      }
    });
  });
  
  console.log('✅ Break Time Alarm System Loaded');
  console.log('🔔 Daily alarms will automatically play at:');
  console.log('   🌅 Morning:', scheduledAlarms.morning);
  console.log('   ☀️ Afternoon:', scheduledAlarms.afternoon);
  console.log('   🌙 Evening:', scheduledAlarms.evening);
  console.log('⏰ Checking for scheduled alarms every 60 seconds...');
  
  // Check for scheduled alarms every minute
  setInterval(() => {
    checkScheduledAlarms();
    showAlarmStatus();
  }, 60000); // Check every 60 seconds
  
  checkScheduledAlarms(); // Check immediately on load
  showAlarmStatus(); // Show initial status
  
  // Update status display every 10 seconds
  setInterval(showAlarmStatus, 10000);
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (isRunning) {
    return 'Timer is running. Are you sure you want to leave?';
  }
});
