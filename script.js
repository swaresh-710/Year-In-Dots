

const elements = {
    grid: document.getElementById('year-grid'),
    daysRemaining: document.getElementById('days-remaining'),
    percentCompleted: document.getElementById('percent-completed'),
    milestoneDisplay: document.getElementById('milestone-display'),
    settingsTrigger: document.getElementById('settings-trigger'),
    settingsModal: document.getElementById('settings-modal'),
    closeSettings: document.getElementById('close-settings'),
    radioButtons: document.querySelectorAll('input[name="today-style"]'),



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
    scratchpad: '',
    dotsData: {}, // 'YYYY-MM-DD': { note: '', type: 'milestone'|'journal', completed: boolean }
    focusHistory: [] // Array of { text, completed, date }
};

let currentState = loadState();

function loadState() {
    const stored = localStorage.getItem('yearInDotsState');
    if (!stored) return { ...DEFAULT_STATE };
    try {
        return { ...DEFAULT_STATE, ...JSON.parse(stored) };
    } catch (e) {
        console.error('State load failed', e);
        return { ...DEFAULT_STATE };
    }
}

function saveState() {
    localStorage.setItem('yearInDotsState', JSON.stringify(currentState));
}

function init() {
    checkNewDay();
    setupSettings();
    setupScratchpad();
    setupDotsInteraction();
    render();
}

function checkNewDay() {
    // No longer needed for focus, but kept empty for potential future use or removed entirely if no other use.
    // For now, we can remove the logic inside since focus is gone.
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

                // Add Emoji for Journal
                if (data.type === 'journal') {
                    dot.textContent = '✍️';
                    dot.classList.add('has-emoji');
                }
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
    // Always show standard days remaining, ignoring milestones for the main counter
    elements.daysRemaining.textContent = `${standardDaysRemaining} Days Remaining`;
    elements.daysRemaining.classList.remove('highlight-stat');

    // Find nearest future milestone for separate display
    const nowStr = getDateStringFromDay(new Date().getFullYear(), currentDayOfYear);
    const dots = currentState.dotsData;

    let nearestMilestone = null;
    let minDiff = Infinity;

    for (const [dateStr, data] of Object.entries(dots)) {
        if (data.type === 'milestone') {
            if (dateStr > nowStr) {
                const milestoneDate = new Date(dateStr);
                const today = new Date(nowStr);
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
        elements.milestoneDisplay.textContent = `${nearestMilestone.days} Days until ${nearestMilestone.note || 'Milestone'}`;
        elements.milestoneDisplay.classList.add('visible');
    } else {
        elements.milestoneDisplay.textContent = '';
        elements.milestoneDisplay.classList.remove('visible');
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
