document.addEventListener('DOMContentLoaded', () => {
    init();
});

const elements = {
    grid: document.getElementById('year-grid'),
    daysRemaining: document.getElementById('days-remaining'),
    percentCompleted: document.getElementById('percent-completed'),
    settingsTrigger: document.getElementById('settings-trigger'),
    settingsModal: document.getElementById('settings-modal'),
    closeSettings: document.getElementById('close-settings'),
    radioButtons: document.querySelectorAll('input[name="today-style"]'),

    focusWrapper: document.getElementById('focus-wrapper'),
    clearFocusBtn: document.getElementById('clear-focus'),
    focusTitle: document.querySelector('.focus-title'),

    // Scratchpad Elements
    scratchpadTrigger: document.getElementById('scratchpad-trigger'),
    scratchpadPanel: document.getElementById('scratchpad-panel'),
    scratchpadContent: document.getElementById('scratchpad-content'),
    closeScratchpad: document.getElementById('close-scratchpad'),

    // Day Modal Elements
    dayModal: document.getElementById('day-modal'),
    modalDateTitle: document.getElementById('modal-date-title'),
    dotNote: document.getElementById('dot-note'),
    saveDotBtn: document.getElementById('save-dot-btn'),
    deleteDotBtn: document.getElementById('delete-dot-btn'),
    closeDayModal: document.getElementById('close-day-modal'),
    milestoneOption: document.getElementById('milestone-option'),
    journalOption: document.getElementById('journal-option'),
    dotTypeRadios: document.getElementsByName('dot-type')
};

// Default State
const DEFAULT_STATE = {
    todayStyle: 'orange',
    dailyFocus: {
        text: '',
        completed: false,
        date: '' // To reset daily
    },
    scratchpad: '',
    dotsData: {} // 'YYYY-MM-DD': { note: '', type: 'milestone'|'journal', completed: boolean }
};

let currentState = loadState();

function loadState() {
    const stored = localStorage.getItem('yearInDotsState');
    if (!stored) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(stored) };
}

function saveState() {
    localStorage.setItem('yearInDotsState', JSON.stringify(currentState));
}

function init() {
    checkNewDay();
    setupSettings();
    setupFocus();
    setupScratchpad();
    setupDotsInteraction();
    render();
}

function checkNewDay() {
    const todayStr = new Date().toDateString();
    if (currentState.dailyFocus.date !== todayStr) {
        // Reset focus for a new day, but keep the old one in history if we wanted (not yet implemented)
        currentState.dailyFocus = {
            text: '',
            completed: false,
            date: todayStr
        };
        saveState();
    }
}

function render() {
    const now = new Date();
    const year = now.getFullYear();
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const totalDays = isLeap ? 366 : 365;

    // Calculate Day of Year
    const start = new Date(year, 0, 0);
    const diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // Update Stats
    const daysRemaining = totalDays - dayOfYear;
    const percent = ((dayOfYear / totalDays) * 100).toFixed(1);

    elements.percentCompleted.textContent = `${percent}% Completed`;

    // Countdown / Stats
    updateCountdown(totalDays, dayOfYear, daysRemaining);

    // Render Focus UI
    renderFocus();

    // Render Grid
    elements.grid.innerHTML = '';

    for (let i = 1; i <= totalDays; i++) {
        const dot = document.createElement('div');
        dot.classList.add('dot');

        if (i < dayOfYear) {
            dot.classList.add('completed');
            dot.title = `Day ${i} (Completed)`;
        } else if (i === dayOfYear) {
            dot.classList.add('today');
            dot.classList.add(currentState.todayStyle);
            dot.title = `Day ${i} (Today)`;

            if (currentState.todayStyle === 'hourglass') {
                dot.textContent = '⏳';
            }
        } else {
            dot.title = `Day ${i}`;
        }

        // Check for stored data
        const dateStr = getDateStringFromDay(year, i);
        if (currentState.dotsData && currentState.dotsData[dateStr]) {
            const data = currentState.dotsData[dateStr];
            if (data.type) {
                dot.classList.add(data.type);
                dot.title += ` - ${data.note || data.type}`;
            }
        }

        // Add click handler
        dot.addEventListener('click', () => openDayModal(i, year));

        elements.grid.appendChild(dot);
    }
}

// Helper to get YYYY-MM-DD from day of year
function getDateStringFromDay(year, dayOfYear) {
    const date = new Date(year, 0, dayOfYear);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function updateCountdown(totalDays, currentDayOfYear, standardDaysRemaining) {
    // Find nearest future milestone
    const nowStr = getDateStringFromDay(new Date().getFullYear(), currentDayOfYear);
    const dots = currentState.dotsData;

    let nearestMilestone = null;
    let minDiff = Infinity;

    for (const [dateStr, data] of Object.entries(dots)) {
        if (data.type === 'milestone') {
            // Simple string comparison works for YYYY-MM-DD
            if (dateStr > nowStr) {
                // Calculate diff
                const milestoneDate = new Date(dateStr);
                const today = new Date(nowStr); // Normalize time
                const diffTime = Math.abs(milestoneDate - today);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < minDiff) {
                    minDiff = diffDays;
                    nearestMilestone = { date: dateStr, ...data, days: diffDays };
                }
            }
        }
    }

    if (nearestMilestone) {
        elements.daysRemaining.textContent = `${nearestMilestone.days} Days until ${nearestMilestone.note || 'Milestone'}`;
        elements.daysRemaining.classList.add('highlight-stat');
    } else {
        elements.daysRemaining.textContent = `${standardDaysRemaining} Days Remaining`;
        elements.daysRemaining.classList.remove('highlight-stat');
    }
}

function setupDotsInteraction() {
    elements.closeDayModal.addEventListener('click', () => {
        elements.dayModal.classList.remove('active');
    });

    elements.dayModal.addEventListener('click', (e) => {
        if (e.target === elements.dayModal) {
            elements.dayModal.classList.remove('active');
        }
    });

    // Save
    elements.saveDotBtn.addEventListener('click', saveDotData);

    // Delete
    elements.deleteDotBtn.addEventListener('click', deleteDotData);
}

let currentModalDay = null; // Store current day being edited

function openDayModal(dayOfYear, year) {
    currentModalDay = { dayOfYear, year };
    const dateStr = getDateStringFromDay(year, dayOfYear);
    const dateObj = new Date(dateStr);

    // Set Title
    elements.modalDateTitle.textContent = dateObj.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Load Data
    const data = currentState.dotsData[dateStr] || { type: '', note: '' };
    elements.dotNote.value = data.note || '';

    // Select Radio
    // Determine context: Past or Future?
    const now = new Date();
    const todayStr = new Date().toDateString(); // Compare normalized dates
    const isToday = dateObj.toDateString() === todayStr;
    const isPast = dateObj < now && !isToday;

    // Reset Radios
    Array.from(elements.dotTypeRadios).forEach(r => r.checked = false);

    // Default selection logic
    if (data.type) {
        const radio = document.querySelector(`input[name="dot-type"][value="${data.type}"]`);
        if (radio) radio.checked = true;
    } else {
        // Pre-select based on time
        if (isPast || isToday) {
            document.querySelector(`input[value="journal"]`).checked = true;
        } else {
            document.querySelector(`input[value="milestone"]`).checked = true;
        }
    }

    elements.dayModal.classList.add('active');
    elements.dotNote.focus();
}

function saveDotData() {
    if (!currentModalDay) return;

    const { dayOfYear, year } = currentModalDay;
    const dateStr = getDateStringFromDay(year, dayOfYear);

    const note = elements.dotNote.value.trim();
    const type = document.querySelector('input[name="dot-type"]:checked')?.value;

    if (!note && !type) {
        // Nothing to save
        deleteDotData();
        return;
    }

    currentState.dotsData[dateStr] = {
        note,
        type
    };

    saveState();
    elements.dayModal.classList.remove('active');
    render(); // Re-render to show indicators
}

function deleteDotData() {
    if (!currentModalDay) return;
    const { dayOfYear, year } = currentModalDay;
    const dateStr = getDateStringFromDay(year, dayOfYear);

    if (currentState.dotsData[dateStr]) {
        delete currentState.dotsData[dateStr];
        saveState();
    }

    elements.dayModal.classList.remove('active');
    render();
}

function setupSettings() {
    // Sync UI with state
    const currentRadio = document.querySelector(`input[value="${currentState.todayStyle}"]`);
    if (currentRadio) currentRadio.checked = true;

    // Open Modal
    elements.settingsTrigger.addEventListener('click', () => {
        elements.settingsModal.classList.add('active');
    });

    // Close Modal and Save
    elements.closeSettings.addEventListener('click', () => {
        elements.settingsModal.classList.remove('active');
        // Just in case it wasn't caught by change event, mainly for ux closing
    });

    // Close on click outside
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            elements.settingsModal.classList.remove('active');
        }
    });

    // Radio Changes
    elements.radioButtons.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                currentState.todayStyle = e.target.value;
                localStorage.setItem('todayStyle', currentState.todayStyle);
                render(); // Re-render to apply style immediately
            }
        });
    });
}

function setupFocus() {
    // Input Enter Key
    elements.focusInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.value.trim() !== '') {
            setFocus(e.target.value.trim());
        }
    });

    // Checkbox Click
    elements.focusCheckbox.addEventListener('click', () => {
        toggleFocusCompletion();
    });

    // Display Click (to toggle completion too)
    elements.focusDisplay.addEventListener('click', () => {
        toggleFocusCompletion();
    });

    // Clear Focus
    elements.clearFocusBtn.addEventListener('click', () => {
        clearFocus();
    });
}

function setFocus(text) {
    currentState.dailyFocus.text = text;
    currentState.dailyFocus.completed = false;
    currentState.dailyFocus.date = new Date().toDateString();
    saveState();
    renderFocus();
}

function toggleFocusCompletion() {
    currentState.dailyFocus.completed = !currentState.dailyFocus.completed;
    saveState();
    renderFocus();

    // Optional: Celebrate if completed!
    if (currentState.dailyFocus.completed && currentState.todayStyle !== 'hourglass') {
        const todayDot = document.querySelector('.dot.today');
        if (todayDot) {
            todayDot.style.backgroundColor = 'var(--highlight-color)'; // Make it solid gold/orange
            setTimeout(() => {
                // Revert animation style if needed in render()
                render();
            }, 1000);
        }
    }
}

function clearFocus() {
    currentState.dailyFocus.text = '';
    currentState.dailyFocus.completed = false;
    saveState();
    renderFocus();
    // Focus back on input
    setTimeout(() => elements.focusInput.focus(), 10);
}

function renderFocus() {
    const { text, completed } = currentState.dailyFocus;

    if (text) {
        // Show Display Mode
        elements.focusInput.hidden = true;
        elements.focusDisplay.hidden = false;
        elements.focusCheckbox.hidden = false;
        elements.clearFocusBtn.hidden = false;
        elements.focusTitle.textContent = "TODAY";

        elements.focusDisplay.textContent = text;

        if (completed) {
            elements.focusWrapper.classList.add('focus-completed');
        } else {
            elements.focusWrapper.classList.remove('focus-completed');
        }
    } else {
        // Show Input Mode
        elements.focusInput.hidden = false;
        elements.focusInput.value = '';
        elements.focusDisplay.hidden = true;
        elements.focusCheckbox.hidden = true;
        elements.clearFocusBtn.hidden = true;
        elements.focusTitle.textContent = "What is your main focus for today?";
        elements.focusWrapper.classList.remove('focus-completed');
    }
}

function setupScratchpad() {
    // Load saved content
    elements.scratchpadContent.value = currentState.scratchpad || '';

    // Toggle Panel
    elements.scratchpadTrigger.addEventListener('click', () => {
        elements.scratchpadPanel.classList.toggle('active');
        if (elements.scratchpadPanel.classList.contains('active')) {
            elements.scratchpadContent.focus();
        }
    });

    elements.closeScratchpad.addEventListener('click', () => {
        elements.scratchpadPanel.classList.remove('active');
    });

    // Auto-save on input
    elements.scratchpadContent.addEventListener('input', (e) => {
        currentState.scratchpad = e.target.value;
        saveState();
    });

    // Close when clicking outside (optional, but good UX)
    document.addEventListener('click', (e) => {
        if (!elements.scratchpadPanel.contains(e.target) &&
            !elements.scratchpadTrigger.contains(e.target) &&
            elements.scratchpadPanel.classList.contains('active')) {
            elements.scratchpadPanel.classList.remove('active');
        }
    });
}
