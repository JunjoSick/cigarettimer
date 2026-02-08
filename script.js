// --- DOM Elements ---
const timerDisplay = document.getElementById('timer-display');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const startPauseBtn = document.getElementById('start-pause');
const resetBtn = document.getElementById('reset');
const skipBtn = document.getElementById('skip');
const quoteEl = document.getElementById('quote');
const titleEl = document.getElementById('mode-title');
const buttArea = document.getElementById('butt-area');
const sessionCountEl = document.getElementById('session-count');
const sessionIndicator = document.getElementById('session-indicator');
const notificationSound = document.getElementById('notification-sound');
const pauseSound = document.getElementById('pause-sound');
const smokeContainer = document.getElementById('smoke-container');
const srAnnouncer = document.getElementById('sr-announcer');

// Settings elements
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const settingsOverlay = document.getElementById('settings-overlay');
const settingsClose = document.getElementById('settings-close');
const focusDurationInput = document.getElementById('focus-duration');
const shortBreakDurationInput = document.getElementById('short-break-duration');
const longBreakDurationInput = document.getElementById('long-break-duration');
const longBreakIntervalInput = document.getElementById('long-break-interval');
const soundEnabledInput = document.getElementById('sound-enabled');
const autoStartInput = document.getElementById('auto-start');
const notificationsEnabledInput = document.getElementById('notifications-enabled');
const smokeEnabledInput = document.getElementById('smoke-enabled');

// Stats elements
const statsBtn = document.getElementById('stats-btn');
const statsPanel = document.getElementById('stats-panel');
const statsOverlay = document.getElementById('stats-overlay');
const statsClose = document.getElementById('stats-close');
const exportStatsBtn = document.getElementById('export-stats');
const clearStatsBtn = document.getElementById('clear-stats');

// --- Default Settings ---
const defaultSettings = {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    soundEnabled: true,
    autoStart: false,
    notificationsEnabled: false,
    smokeEnabled: true,
};

// --- App State ---
let settings = { ...defaultSettings };
let timer;
let isRunning = false;
let isBreak = false;
let isLongBreak = false;
let minutes = 25;
let seconds = 0;
let completedSessions = 0;
let sessionsUntilLongBreak = 0;
let smokeInterval = null;

// --- Statistics State ---
let stats = {
    sessions: [], // Array of { date: 'YYYY-MM-DD', focusMinutes: number }
    lastActiveDate: null,
    currentStreak: 0,
};

// --- Quotes ---
const focusQuotes = [
    '"The mind is a good fire to warm by, a bad one to burn by."',
    '"Concentration is the secret of strength."',
    '"The successful warrior is the average man, with laser-like focus."',
    '"To produce a mighty work, you must choose a single theme..."',
    '"The art of being wise is the art of knowing what to overlook."',
    '"Time is the coin of your life. Spend it wisely."',
    '"He who is not every day conquering some fear has not learned the secret of life."',
    '"The simple act of paying attention can take you a long way."',
    '"What you stay focused on will grow."',
    '"Discipline is the bridge between goals and accomplishment."',
    '"The future is something which everyone reaches at the rate of sixty minutes an hour."',
    '"Amateurs sit and wait for inspiration, the rest of us just get up and go to work."',
];

const cigaretteQuotes = [
    '"A cigarette is the perfect type of a perfect pleasure."',
    '"Smoking is a striking way of staying under the radar."',
    '"Time takes a cigarette, puts it in your mouth."',
    '"Life is a pause between a cigarette and another."',
    '"To smoke is to meditate on the transcendence of ash."',
    '"Every cigarette has a story, unseen and unspoken."',
    '"The cigarette is a portable therapist."',
    '"Smoking is one of the leading causes of statistics."',
    "\"A cigarette is a breathing space. It's a punctuation mark in the sentence of your day.\"",
    '"I smoke in moderation. Only one cigarette at a time."',
    '"There are some things that are better done with a cigarette."',
];

function getRandomQuote(quotes) {
    return quotes[Math.floor(Math.random() * quotes.length)];
}

// --- Screen Reader Announcements ---
function announce(message) {
    srAnnouncer.textContent = message;
    // Clear after announcement to allow repeat announcements
    setTimeout(() => {
        srAnnouncer.textContent = '';
    }, 1000);
}

// --- Date Utilities ---
function getToday() {
    return new Date().toISOString().split('T')[0];
}

function getStartOfWeek() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
}

function getDayName(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function isYesterday(dateStr) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return dateStr === yesterday.toISOString().split('T')[0];
}

// --- Statistics Functions ---
function loadStats() {
    const saved = localStorage.getItem('pomodoroStats');
    if (saved) {
        stats = JSON.parse(saved);
    }
    updateStreak();
}

function saveStats() {
    localStorage.setItem('pomodoroStats', JSON.stringify(stats));
}

function recordSession(focusMinutes) {
    const today = getToday();

    // Find or create today's entry
    let todayEntry = stats.sessions.find((s) => s.date === today);
    if (!todayEntry) {
        todayEntry = { date: today, focusMinutes: 0, count: 0 };
        stats.sessions.push(todayEntry);
    }

    todayEntry.focusMinutes += focusMinutes;
    todayEntry.count = (todayEntry.count || 0) + 1;

    // Update streak
    updateStreak();
    saveStats();
    updateStatsDisplay();
}

function updateStreak() {
    const today = getToday();
    const todayEntry = stats.sessions.find((s) => s.date === today);

    if (todayEntry && todayEntry.count > 0) {
        // Has session today
        if (stats.lastActiveDate === today) {
            // Already counted today
            return;
        } else if (
            stats.lastActiveDate === null ||
            isYesterday(stats.lastActiveDate)
        ) {
            // Continue or start streak
            stats.currentStreak++;
        } else if (stats.lastActiveDate !== today) {
            // Streak broken, start new
            stats.currentStreak = 1;
        }
        stats.lastActiveDate = today;
    } else if (stats.lastActiveDate && !isYesterday(stats.lastActiveDate) && stats.lastActiveDate !== today) {
        // No session today and last active wasn't yesterday
        stats.currentStreak = 0;
    }
}

function getTodayStats() {
    const today = getToday();
    const entry = stats.sessions.find((s) => s.date === today);
    return entry || { count: 0, focusMinutes: 0 };
}

function getWeekStats() {
    const weekStart = getStartOfWeek();
    const weekSessions = stats.sessions.filter((s) => s.date >= weekStart);

    return {
        count: weekSessions.reduce((sum, s) => sum + (s.count || 0), 0),
        focusMinutes: weekSessions.reduce((sum, s) => sum + s.focusMinutes, 0),
    };
}

function getTotalStats() {
    return {
        count: stats.sessions.reduce((sum, s) => sum + (s.count || 0), 0),
        focusMinutes: stats.sessions.reduce((sum, s) => sum + s.focusMinutes, 0),
    };
}

function getWeekChartData() {
    const data = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const entry = stats.sessions.find((s) => s.date === dateStr);

        data.push({
            date: dateStr,
            day: getDayName(dateStr),
            count: entry ? entry.count || 0 : 0,
        });
    }

    return data;
}

function formatTime(minutes) {
    if (minutes < 60) {
        return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function updateStatsDisplay() {
    const today = getTodayStats();
    const week = getWeekStats();
    const total = getTotalStats();

    document.getElementById('current-streak').textContent = stats.currentStreak;
    document.getElementById('today-sessions').textContent = today.count;
    document.getElementById('today-focus-time').textContent = formatTime(
        today.focusMinutes
    );
    document.getElementById('week-sessions').textContent = week.count;
    document.getElementById('week-focus-time').textContent = formatTime(
        week.focusMinutes
    );
    document.getElementById('total-sessions').textContent = total.count;
    document.getElementById('total-focus-time').textContent = formatTime(
        total.focusMinutes
    );

    // Update week chart
    renderWeekChart();
}

function renderWeekChart() {
    const chart = document.getElementById('week-chart');
    const data = getWeekChartData();
    const maxCount = Math.max(...data.map((d) => d.count), 1);

    chart.innerHTML = data
        .map((d) => {
            const height = (d.count / maxCount) * 100;
            const isToday = d.date === getToday();
            return `
            <div class="chart-bar-container">
                <div class="chart-bar ${isToday ? 'today' : ''}" style="height: ${height}%" title="${d.count} sessions">
                    <span class="chart-bar-value">${d.count}</span>
                </div>
                <span class="chart-bar-label">${d.day}</span>
            </div>
        `;
        })
        .join('');
}

function exportStats() {
    const data = {
        exportDate: new Date().toISOString(),
        settings: settings,
        statistics: stats,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focus-timer-data-${getToday()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    announce('Data exported successfully');
}

function clearStats() {
    if (
        confirm(
            'Are you sure you want to clear all statistics? This cannot be undone.'
        )
    ) {
        stats = {
            sessions: [],
            lastActiveDate: null,
            currentStreak: 0,
        };
        completedSessions = 0;
        sessionsUntilLongBreak = 0;
        sessionCountEl.textContent = '0';
        buttArea.innerHTML = '';
        saveStats();
        updateStatsDisplay();
        renderSessionIndicator();
        localStorage.removeItem('pomodoroSessions');
        announce('All statistics cleared');
    }
}

// --- Settings Functions ---
function loadSettings() {
    const saved = localStorage.getItem('pomodoroSettings');
    if (saved) {
        settings = { ...defaultSettings, ...JSON.parse(saved) };
    }
    applySettingsToUI();
}

function saveSettings() {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
}

function applySettingsToUI() {
    focusDurationInput.value = settings.focusDuration;
    shortBreakDurationInput.value = settings.shortBreakDuration;
    longBreakDurationInput.value = settings.longBreakDuration;
    longBreakIntervalInput.value = settings.longBreakInterval;
    soundEnabledInput.checked = settings.soundEnabled;
    autoStartInput.checked = settings.autoStart;
    notificationsEnabledInput.checked = settings.notificationsEnabled;
    smokeEnabledInput.checked = settings.smokeEnabled;

    updateSettingDisplayValues();
}

function updateSettingDisplayValues() {
    document.getElementById('focus-duration-value').textContent =
        `${focusDurationInput.value} min`;
    document.getElementById('short-break-duration-value').textContent =
        `${shortBreakDurationInput.value} min`;
    document.getElementById('long-break-duration-value').textContent =
        `${longBreakDurationInput.value} min`;
    document.getElementById('long-break-interval-value').textContent =
        `${longBreakIntervalInput.value} sessions`;
}

function openPanel(panel, overlay, btn) {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';

    // Focus first focusable element
    const firstFocusable = panel.querySelector('button, input, [tabindex="0"]');
    if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 100);
    }
}

function closePanel(panel, overlay, btn) {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    btn.focus();
}

function openSettings() {
    openPanel(settingsPanel, settingsOverlay, settingsBtn);
}

function closeSettings() {
    closePanel(settingsPanel, settingsOverlay, settingsBtn);
}

function openStats() {
    updateStatsDisplay();
    openPanel(statsPanel, statsOverlay, statsBtn);
}

function closeStats() {
    closePanel(statsPanel, statsOverlay, statsBtn);
}

function handleSettingChange() {
    settings.focusDuration = parseInt(focusDurationInput.value, 10);
    settings.shortBreakDuration = parseInt(shortBreakDurationInput.value, 10);
    settings.longBreakDuration = parseInt(longBreakDurationInput.value, 10);
    settings.longBreakInterval = parseInt(longBreakIntervalInput.value, 10);
    settings.soundEnabled = soundEnabledInput.checked;
    settings.autoStart = autoStartInput.checked;
    settings.notificationsEnabled = notificationsEnabledInput.checked;
    settings.smokeEnabled = smokeEnabledInput.checked;

    updateSettingDisplayValues();
    saveSettings();

    // Update smoke effect
    if (!settings.smokeEnabled) {
        stopSmoke();
    } else if (isBreak && isRunning) {
        startSmoke();
    }

    // If timer isn't running and we're at the start, update display
    if (!isRunning && seconds === 0) {
        if (!isBreak) {
            minutes = settings.focusDuration;
        }
        updateDisplay();
    }

    renderSessionIndicator();
}

// --- Notification Functions ---
function sendNotification(title, body) {
    if (
        !settings.notificationsEnabled ||
        !('Notification' in window) ||
        Notification.permission !== 'granted'
    ) {
        return;
    }

    if (document.hidden) {
        new Notification(title, {
            body: body,
            icon: './icon-192.png',
            tag: 'pomodoro-timer',
        });
    }
}

async function enableNotifications() {
    if (!('Notification' in window)) {
        alert('Your browser does not support notifications.');
        notificationsEnabledInput.checked = false;
        return;
    }

    if (Notification.permission === 'denied') {
        alert(
            'Notifications are blocked. Please enable them in your browser settings.'
        );
        notificationsEnabledInput.checked = false;
        return;
    }

    if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            notificationsEnabledInput.checked = false;
        }
    }

    handleSettingChange();
}

// --- Smoke Effects ---
function createSmokeParticle() {
    if (!settings.smokeEnabled || !isBreak) return;

    const particle = document.createElement('div');
    particle.className = 'smoke-particle';

    // Random starting position near bottom center
    const startX = 45 + Math.random() * 10;
    particle.style.left = `${startX}%`;
    particle.style.bottom = '10%';

    // Random drift direction
    const drift = (Math.random() - 0.5) * 100;
    particle.style.setProperty('--drift', `${drift}px`);

    // Random size
    const size = 30 + Math.random() * 40;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    // Random duration
    const duration = 4 + Math.random() * 3;
    particle.style.animationDuration = `${duration}s`;

    smokeContainer.appendChild(particle);

    // Remove after animation
    setTimeout(() => {
        particle.remove();
    }, duration * 1000);
}

function startSmoke() {
    if (smokeInterval) return;
    smokeInterval = setInterval(createSmokeParticle, 300);
}

function stopSmoke() {
    if (smokeInterval) {
        clearInterval(smokeInterval);
        smokeInterval = null;
    }
    // Clear existing particles
    smokeContainer.innerHTML = '';
}

// --- Visual Functions ---
function renderButt() {
    const buttImg = document.createElement('img');
    buttImg.src = './butt.png';
    buttImg.className = 'cigarette-butt';
    buttImg.alt = '';
    buttImg.setAttribute('aria-hidden', 'true');

    // FIXED: Reduced random range to keep butts inside the ashtray bowl
    const offsetX = -5;
    const offsetY = -5;
    const radiusX = 25; // Was 35, reduced to prevent edge clipping
    const radiusY = 15; // Was 20, reduced to keep inside top/bottom rims
    
    const angle = Math.random() * 2 * Math.PI;
    const randomRadius = Math.sqrt(Math.random());
    const x = randomRadius * radiusX * Math.cos(angle);
    const y = randomRadius * radiusY * Math.sin(angle);
    const finalRotation = Math.random() * 360;

    buttImg.style.left = `${50 + offsetX + x}%`;
    buttImg.style.top = `${50 + offsetY + y}%`;
    buttImg.style.transform = `translate(-50%, -50%) rotate(${finalRotation}deg)`;

    buttArea.appendChild(buttImg);
}

function renderSessionIndicator() {
    sessionIndicator.innerHTML = '';
    const total = settings.longBreakInterval;

    sessionIndicator.setAttribute('aria-valuenow', sessionsUntilLongBreak);
    sessionIndicator.setAttribute('aria-valuemax', total);

    for (let i = 0; i < total; i++) {
        const dot = document.createElement('span');
        dot.className = 'session-dot';
        dot.setAttribute('aria-hidden', 'true');
        if (i < sessionsUntilLongBreak) {
            dot.classList.add('completed');
        }
        sessionIndicator.appendChild(dot);
    }
}

function addCigaretteButt() {
    completedSessions++;
    sessionsUntilLongBreak++;
    renderButt();
    renderSessionIndicator();

    // Record the session
    recordSession(settings.focusDuration);
}

// --- Timer Logic ---
function updateDisplay() {
    const min = String(minutes).padStart(2, '0');
    const sec = String(seconds).padStart(2, '0');
    minutesEl.textContent = min;
    secondsEl.textContent = sec;

    let titleText = 'Focus';
    if (isBreak) {
        titleText = isLongBreak ? 'Long Break' : 'Cigarette Time';
    }
    document.title = `${min}:${sec} - ${titleText}`;
}

function playSound(sound) {
    if (!settings.soundEnabled) return;

    sound.currentTime = 0;
    sound.play().catch(() => {
        // Autoplay blocked, ignore
    });
}

function switchMode() {
    isBreak = !isBreak;

    timerDisplay.classList.add('fading');
    quoteEl.style.opacity = '0';

    setTimeout(() => {
        if (isBreak) {
            // Switching to break
            playSound(pauseSound);
            addCigaretteButt();

            // Check if it's time for a long break
            if (sessionsUntilLongBreak >= settings.longBreakInterval) {
                isLongBreak = true;
                minutes = settings.longBreakDuration;
                titleEl.textContent = 'Long Break';
                announce(
                    `Great work! Long break time. ${settings.longBreakDuration} minutes.`
                );
                sendNotification(
                    'Long Break Time! 🎉',
                    `Great work! Take a ${settings.longBreakDuration} minute break.`
                );
            } else {
                isLongBreak = false;
                minutes = settings.shortBreakDuration;
                titleEl.textContent = 'Cigarette Time';
                announce(`Break time. ${settings.shortBreakDuration} minutes.`);
                sendNotification(
                    'Break Time! 🚬',
                    `Take a ${settings.shortBreakDuration} minute break.`
                );
            }

            quoteEl.textContent = getRandomQuote(cigaretteQuotes);
            document.body.classList.add('break-mode');
            startSmoke();
        } else {
            // Switching to focus
            playSound(notificationSound);
            stopSmoke();

            // Reset long break counter after a long break
            if (isLongBreak) {
                sessionsUntilLongBreak = 0;
                isLongBreak = false;
                renderSessionIndicator();
            }

            minutes = settings.focusDuration;
            titleEl.textContent = 'Focus';
            quoteEl.textContent = getRandomQuote(focusQuotes);
            document.body.classList.remove('break-mode');
            announce(`Focus time. ${settings.focusDuration} minutes.`);
            sendNotification(
                'Focus Time! 💪',
                `Time to focus for ${settings.focusDuration} minutes.`
            );
        }

        seconds = 0;
        updateDisplay();
        sessionCountEl.textContent = completedSessions;

        timerDisplay.classList.remove('fading');
        quoteEl.style.transition = 'opacity 0.4s ease-in-out';
        quoteEl.style.opacity = '1';

        // Auto-start if enabled
        if (settings.autoStart) {
            startTimer();
        } else {
            pauseTimer();
            startPauseBtn.textContent = 'Start';
            document.getElementById('app-container').classList.remove('is-paused');
        }
    }, 400);
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    startPauseBtn.textContent = 'Pause';
    startPauseBtn.setAttribute('aria-label', 'Pause timer');
    document.getElementById('app-container').classList.remove('is-paused');

    announce(`Timer started. ${minutes} minutes ${seconds} seconds remaining.`);

    if (minutes === settings.focusDuration && seconds === 0 && !isBreak) {
        document.getElementById('app-container').classList.add('animate-start');
    }

    // Start smoke if on break
    if (isBreak && settings.smokeEnabled) {
        startSmoke();
    }

    timer = setInterval(() => {
        if (seconds === 0) {
            if (minutes === 0) {
                switchMode();
            } else {
                minutes--;
                seconds = 59;
            }
        } else {
            seconds--;
        }
        updateDisplay();
    }, 1000);
}

function pauseTimer() {
    clearInterval(timer);
    isRunning = false;
    startPauseBtn.textContent = 'Resume';
    startPauseBtn.setAttribute('aria-label', 'Resume timer');
    document.getElementById('app-container').classList.add('is-paused');
    stopSmoke();
    announce('Timer paused.');
}

function resetTimer() {
    pauseTimer();
    isBreak = false;
    isLongBreak = false;
    minutes = settings.focusDuration;
    seconds = 0;
    sessionsUntilLongBreak = 0;
    titleEl.textContent = 'Focus';
    quoteEl.textContent = getRandomQuote(focusQuotes);
    startPauseBtn.textContent = 'Start';
    startPauseBtn.setAttribute('aria-label', 'Start timer');
    completedSessions = 0;
    sessionCountEl.textContent = '0';
    buttArea.innerHTML = '';
    document.body.classList.remove('break-mode');
    document.getElementById('app-container').classList.remove('is-paused');
    stopSmoke();
    renderSessionIndicator();
    updateDisplay();
    announce('Timer reset.');
}

function skipToNext() {
    clearInterval(timer);
    isRunning = false;
    stopSmoke();
    announce('Skipping to next phase.');
    switchMode();

    if (!settings.autoStart) {
        startTimer();
    }
}

// --- Keyboard Shortcuts ---
function handleKeydown(e) {
    // Don't trigger shortcuts when typing in inputs or when panels are open
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    // Close panels with Escape
    if (e.key === 'Escape') {
        if (settingsPanel.classList.contains('open')) {
            closeSettings();
            return;
        }
        if (statsPanel.classList.contains('open')) {
            closeStats();
            return;
        }
    }

    // Don't trigger other shortcuts when panels are open
    if (
        settingsPanel.classList.contains('open') ||
        statsPanel.classList.contains('open')
    ) {
        return;
    }

    // Don't trigger if modifier keys are pressed
    if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
    }

    switch (e.key.toLowerCase()) {
        case ' ':
            e.preventDefault();
            if (isRunning) {
                pauseTimer();
            } else {
                startTimer();
            }
            break;
        case 'r':
            e.preventDefault();
            resetTimer();
            break;
        case 's':
            e.preventDefault();
            skipToNext();
            break;
    }
}

// --- Trap Focus in Panels ---
function trapFocus(panel) {
    const focusableElements = panel.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    panel.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    });
}

// --- Event Listeners ---
startPauseBtn.addEventListener('click', () => {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
});

resetBtn.addEventListener('click', resetTimer);
skipBtn.addEventListener('click', skipToNext);

// Settings listeners
settingsBtn.addEventListener('click', openSettings);
settingsClose.addEventListener('click', closeSettings);
settingsOverlay.addEventListener('click', closeSettings);

focusDurationInput.addEventListener('input', handleSettingChange);
shortBreakDurationInput.addEventListener('input', handleSettingChange);
longBreakDurationInput.addEventListener('input', handleSettingChange);
longBreakIntervalInput.addEventListener('input', handleSettingChange);
soundEnabledInput.addEventListener('change', handleSettingChange);
autoStartInput.addEventListener('change', handleSettingChange);
notificationsEnabledInput.addEventListener('change', enableNotifications);
smokeEnabledInput.addEventListener('change', handleSettingChange);

// Stats listeners
statsBtn.addEventListener('click', openStats);
statsClose.addEventListener('click', closeStats);
statsOverlay.addEventListener('click', closeStats);
exportStatsBtn.addEventListener('click', exportStats);
clearStatsBtn.addEventListener('click', clearStats);

// Keyboard shortcuts
document.addEventListener('keydown', handleKeydown);

// Trap focus in panels
trapFocus(settingsPanel);
trapFocus(statsPanel);

// --- Service Worker Registration ---
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('./sw.js')
            .then((registration) => {
                console.log('SW registered:', registration.scope);
            })
            .catch((error) => {
                console.log('SW registration failed:', error);
            });
    }
}

// --- Initialize App ---
function initializeApp() {
    // Favicon
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href =
        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="30" y="20" width="40" height="60" rx="5" fill="%23FDF5E6"/><rect x="30" y="20" width="40" height="15" rx="5" fill="%23FFA500"/></svg>';
    document.head.appendChild(favicon);

    // Load settings and stats
    loadSettings();
    loadStats();

    // Set initial timer based on settings
    minutes = settings.focusDuration;

    // Load saved session count for today's display
    const todayStats = getTodayStats();
    completedSessions = todayStats.count;
    for (let i = 0; i < completedSessions; i++) {
        renderButt();
    }

    sessionCountEl.textContent = completedSessions;
    quoteEl.textContent = getRandomQuote(focusQuotes);
    renderSessionIndicator();
    updateDisplay();

    // Register service worker
    registerServiceWorker();
}

initializeApp();