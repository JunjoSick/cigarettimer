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
const notificationSound = document.getElementById('notification-sound');
const pauseSound = document.getElementById('pause-sound');

// --- Timer State ---
let timer;
let isRunning = false;
let isBreak = false;
let minutes = 25;
let seconds = 0;
let completedSessions = 0;


const focusQuotes = [ "\"The mind is a good fire to warm by, a bad one to burn by.\"", "\"Concentration is the secret of strength.\"", "\"The successful warrior is the average man, with laser-like focus.\"", "\"To produce a mighty work, you must choose a single theme...\"", "\"The art of being wise is the art of knowing what to overlook.\"", "\"Time is the coin of your life. Spend it wisely.\"", "\"He who is not every day conquering some fear has not learned the secret of life.\"", "\"The simple act of paying attention can take you a long way.\"", "\"What you stay focused on will grow.\"", "\"Discipline is the bridge between goals and accomplishment.\"", "\"The future is something which everyone reaches at the rate of sixty minutes an hour.\"", "\"Amateurs sit and wait for inspiration, the rest of us just get up and go to work.\"" ];
const cigaretteQuotes = [ "\"A cigarette is the perfect type of a perfect pleasure.\"", "\"Smoking is a striking way of staying under the radar.\"", "\"Time takes a cigarette, puts it in your mouth.\"", "\"Life is a pause between a cigarette and another.\"", "\"To smoke is to meditate on the transcendence of ash.\"", "\"Every cigarette has a story, unseen and unspoken.\"", "\"The cigarette is a portable therapist.\"", "\"Smoking is one of the leading causes of statistics.\"", "\"A cigarette is a breathing space. It's a punctuation mark in the sentence of your day.\"", "\"I smoke in moderation. Only one cigarette at a time.\"", "\"There are some things that are better done with a cigarette.\"" ];
function getRandomQuote(q) { return q[Math.floor(Math.random() * q.length)]; }

// --- Visual & Audio Functions ---
function playAnimation(fn) { fn(); }
function renderButt() {
    const buttImg = document.createElement('img');
    buttImg.src = './butt.png';
    buttImg.className = 'cigarette-butt';
    const offsetX = -5, offsetY = -5, radiusX = 35, radiusY = 20;
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
function addCigaretteButt() {
    completedSessions++;
    localStorage.setItem('pomodoroSessions', completedSessions);
    renderButt();
}

// --- Timer Logic ---
function updateDisplay() {
    const min = String(minutes).padStart(2, '0');
    const sec = String(seconds).padStart(2, '0');
    minutesEl.textContent = min;
    secondsEl.textContent = sec;
    document.title = `${min}:${sec} - ${isBreak ? 'Cigarette Time' : 'Focus'}`;
}

function switchMode() {
    isBreak = !isBreak;
    
    timerDisplay.classList.add('fading');
    quoteEl.style.opacity = '0';

    setTimeout(() => {
        if (isBreak) { 
            pauseSound.play(); 
            minutes = 5;
            titleEl.textContent = 'Cigarette Time';
            quoteEl.textContent = getRandomQuote(cigaretteQuotes);
        } else { 
            notificationSound.play(); 
            addCigaretteButt();
            minutes = 25;
            titleEl.textContent = 'Focus';
            quoteEl.textContent = getRandomQuote(focusQuotes);
        }
        
        seconds = 0; 
        updateDisplay();
        sessionCountEl.textContent = completedSessions;

        timerDisplay.classList.remove('fading');
        quoteEl.style.transition = 'opacity 0.4s ease-in-out';
        quoteEl.style.opacity = '1';
    }, 400);
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    startPauseBtn.textContent = 'Pause';
    document.getElementById('app-container').classList.remove('is-paused');
    if (minutes === 25 && seconds === 0 && !isBreak) playAnimation(() => document.getElementById('app-container').classList.add('animate-start'));

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
    document.getElementById('app-container').classList.add('is-paused');
}

function resetTimer() {
    pauseTimer();
    isBreak = false;
    minutes = 25;
    seconds = 0;
    titleEl.textContent = 'Focus';
    quoteEl.textContent = getRandomQuote(focusQuotes);
    startPauseBtn.textContent = 'Start';
    completedSessions = 0;
    sessionCountEl.textContent = '0';
    buttArea.innerHTML = '';
    localStorage.removeItem('pomodoroSessions');
    updateDisplay();
}

// --- Event Listeners ---
startPauseBtn.addEventListener('click', () => isRunning ? pauseTimer() : startTimer());
resetBtn.addEventListener('click', resetTimer);
skipBtn.addEventListener('click', () => {
    if (!isRunning && !isBreak) return;
    clearInterval(timer);
    isRunning = false;
    switchMode();
    startTimer();
});

// --- Initial Setup on Page Load ---
function initializeApp() {
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="30" y="20" width="40" height="60" rx="5" fill="%23FDF5E6"/><rect x="30" y="20" width="40" height="15" rx="5" fill="%23FFA500"/></svg>';
    document.head.appendChild(favicon);

    const savedSessions = localStorage.getItem('pomodoroSessions');
    if (savedSessions) {
        completedSessions = parseInt(savedSessions, 10);
        for (let i = 0; i < completedSessions; i++) {
            renderButt();
        }
    }
    sessionCountEl.textContent = completedSessions;
    quoteEl.textContent = getRandomQuote(focusQuotes);
    updateDisplay();
}

initializeApp();