const STORAGE_KEYS = {
    HABIT_PREFIX: 'habit_',
    ACTIVITIES: 'habit_activities',
    SELECTED_ACTIVITY: 'habit_selectedActivity'
};

let currentActivity = 'default';

function isLeapYear(year) {
    return new Date(year, 1, 29).getDate() === 29;
}

function getDateInfo(dayOfYear, year) {
    const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let day = dayOfYear;
    let month = 0;

    while (day > daysInMonth[month]) {
        day -= daysInMonth[month];
        month++;
    }

    return { dayOfMonth: day, month: month + 1 };
}


function getFirstDayOffset(year) {
    const jan1 = new Date(year, 0, 1);
    const dayOfWeek = jan1.getDay();
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
}

function getStorageKey(activity, year, dayOfYear) {
    return `${STORAGE_KEYS.HABIT_PREFIX}${activity}_${year}_${dayOfYear}`;
}

function loadData(activity, year, dayOfYear) {
    return localStorage.getItem(getStorageKey(activity, year, dayOfYear)) === 'true';
}

function saveData(activity, year, dayOfYear, completed) {
    if (completed) {
        localStorage.setItem(getStorageKey(activity, year, dayOfYear), 'true');
    } else {
        localStorage.removeItem(getStorageKey(activity, year, dayOfYear));
    }
}

function createCalendar(year) {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    const offset = getFirstDayOffset(year);
    for (let i = 0; i < offset; i++) {
        const emptyBox = document.createElement('div');
        emptyBox.className = 'day-box empty';
        calendar.appendChild(emptyBox);
    }

    const daysInYear = isLeapYear(year) ? 366 : 365;

    for (let day = 1; day <= daysInYear; day++) {
        const dayBox = document.createElement('div');
        dayBox.className = 'day-box';
        const dateInfo = getDateInfo(day, year);
        dayBox.textContent = dateInfo.dayOfMonth;

        dayBox.classList.add(`month-${dateInfo.month}`);

        if (dateInfo.dayOfMonth === 1) {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthLabel = document.createElement('span');
            monthLabel.className = 'month-label';
            monthLabel.textContent = monthNames[dateInfo.month - 1];
            dayBox.appendChild(monthLabel);
        }

        if (loadData(currentActivity, year, day)) {
            dayBox.classList.add('completed');
        }

        const today = new Date();
        const currentYear = today.getFullYear();
        if (year === currentYear) {
            const todayDayOfYear = Math.floor((today - new Date(currentYear, 0, 0)) / (1000 * 60 * 60 * 24));
            if (day === todayDayOfYear) {
                dayBox.classList.add('today');
            }
        }

        dayBox.addEventListener('click', () => {
            const wasCompleted = dayBox.classList.contains('completed');
            if (wasCompleted) {
                dayBox.classList.remove('completed');
                saveData(currentActivity, year, day, false);
            } else {
                dayBox.classList.add('completed');
                saveData(currentActivity, year, day, true);
            }
        });

        calendar.appendChild(dayBox);
    }
}

function initYearSelect() {
    const yearSelect = document.getElementById('yearSelect');
    const thisYear = new Date().getFullYear();

    for (let year = 2025; year <= thisYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === thisYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }

    yearSelect.addEventListener('change', (e) => {
        createCalendar(parseInt(e.target.value));
    });
}

function initActivitySelect() {
    const activitySelect = document.getElementById('activitySelect');
    const addButton = document.getElementById('addActivity');

    const savedActivities = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || '["default"]');

    savedActivities.forEach(activity => {
        if (activity !== 'default') {
            const option = document.createElement('option');
            option.value = activity;
            option.textContent = activity;
            activitySelect.appendChild(option);
        }
    });

    const savedActivity = localStorage.getItem(STORAGE_KEYS.SELECTED_ACTIVITY);
    if (savedActivity && savedActivities.includes(savedActivity)) {
        activitySelect.value = savedActivity;
        currentActivity = savedActivity;
    }

    activitySelect.addEventListener('change', (e) => {
        currentActivity = e.target.value;
        localStorage.setItem(STORAGE_KEYS.SELECTED_ACTIVITY, currentActivity);
        createCalendar(parseInt(document.getElementById('yearSelect').value));
    });

    addButton.addEventListener('click', () => {
        const newActivity = prompt('Enter new activity name:');
        if (newActivity && newActivity.trim()) {
            const trimmedActivity = newActivity.trim();
            const activities = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || '["default"]');

            if (!activities.includes(trimmedActivity)) {
                activities.push(trimmedActivity);
                localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));

                const option = document.createElement('option');
                option.value = trimmedActivity;
                option.textContent = trimmedActivity;
                activitySelect.appendChild(option);

                activitySelect.value = trimmedActivity;
                currentActivity = trimmedActivity;
                localStorage.setItem(STORAGE_KEYS.SELECTED_ACTIVITY, currentActivity);
                createCalendar(parseInt(document.getElementById('yearSelect').value));
            }
        }
    });
}

function exportData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(STORAGE_KEYS.HABIT_PREFIX)) {
            const value = localStorage.getItem(key);
            if (value === 'true') {
                const parts = key.replace(STORAGE_KEYS.HABIT_PREFIX, '').split('_');
                const activity = parts[0];

                if (activity === currentActivity) {
                    const year = parts[1];
                    const day = parts[2];
                    if (!data[activity]) data[activity] = {};
                    if (!data[activity][year]) data[activity][year] = [];

                    data[activity][year].push(parseInt(day));
                }
            }
        }
    }
    return JSON.stringify(data);
}

function importData(dataString) {
    try {
        const data = JSON.parse(dataString);

        // Clear existing habit data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(STORAGE_KEYS.HABIT_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Import new data
        for (const activity in data) {
            for (const year in data[activity]) {
                data[activity][year].forEach(day => {
                    const key = getStorageKey(activity, year, day);
                    localStorage.setItem(key, 'true');
                });
            }
        }

        // Refresh calendar
        createCalendar(parseInt(document.getElementById('yearSelect').value));
        return true;
    } catch (e) {
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initYearSelect();
    initActivitySelect();
    createCalendar(new Date().getFullYear());

    // Export/Import button listeners
    document.getElementById('exportBtn').addEventListener('click', async () => {
        const dataString = exportData();
        try {
            await navigator.clipboard.writeText(dataString);
            alert(`Data for activity '${currentActivity}' exported to clipboard.`);
        } catch (e) {
            prompt('Data:', dataString);
        }
    });

    document.getElementById('importBtn').addEventListener('click', () => {
        const dataString = prompt('WARNING: This may overwrite existing habit data across all years.\n\nPaste your export data here:');
        if (dataString) {
            if (importData(dataString)) {
                alert('Data imported successfully.');
            } else {
                alert('Invalid data format. Import failed.');
            }
        }
    });
});
