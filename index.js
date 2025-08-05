const STORAGE_KEY = "activities";
const DEFAULT_ACTIVITY = "default";
const VERSION = "v1";

let currentActivity = DEFAULT_ACTIVITY;

function isLeapYear(year) {
	return new Date(year, 1, 29).getDate() === 29;
}

function getDateInfo(dayOfYear, year) {
	const daysInMonth = [
		31,
		isLeapYear(year) ? 29 : 28,
		31,
		30,
		31,
		30,
		31,
		31,
		30,
		31,
		30,
		31,
	];
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

function getActivitiesData() {
	const data = localStorage.getItem(STORAGE_KEY);
	return data
		? JSON.parse(data)
		: {
				selectedActivity: DEFAULT_ACTIVITY,
				activities: { [DEFAULT_ACTIVITY]: {} },
			};
}

function setActivitiesData(data) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getData(activity, year, dayOfYear) {
	const data = getActivitiesData();
	return data.activities[activity]?.[year]?.includes(dayOfYear) || false;
}

function setData(activity, year, dayOfYear, completed) {
	const data = getActivitiesData();

	if (!data.activities[activity]) {
		data.activities[activity] = {};
	}
	if (!data.activities[activity][year]) {
		data.activities[activity][year] = [];
	}

	const days = data.activities[activity][year];
	const index = days.indexOf(dayOfYear);

	if (completed && index === -1) {
		days.push(dayOfYear);
		days.sort((a, b) => a - b);
	} else if (!completed && index !== -1) {
		days.splice(index, 1);
	}

	setActivitiesData(data);
}

function createCalendar(year) {
	const calendar = document.getElementById("calendar");
	calendar.innerHTML = "";

	const offset = getFirstDayOffset(year);
	for (let i = 0; i < offset; i++) {
		const emptyBox = document.createElement("div");
		emptyBox.className = "day-box empty";
		calendar.appendChild(emptyBox);
	}

	const daysInYear = isLeapYear(year) ? 366 : 365;

	for (let day = 1; day <= daysInYear; day++) {
		const dayBox = document.createElement("div");
		dayBox.className = "day-box";
		const dateInfo = getDateInfo(day, year);
		dayBox.textContent = dateInfo.dayOfMonth;

		dayBox.classList.add(`month-${dateInfo.month}`);

		if (dateInfo.dayOfMonth === 1) {
			const monthNames = [
				"Jan",
				"Feb",
				"Mar",
				"Apr",
				"May",
				"Jun",
				"Jul",
				"Aug",
				"Sep",
				"Oct",
				"Nov",
				"Dec",
			];
			const monthLabel = document.createElement("span");
			monthLabel.className = "month-label";
			monthLabel.textContent = monthNames[dateInfo.month - 1];
			dayBox.appendChild(monthLabel);
		}

		if (getData(currentActivity, year, day)) {
			dayBox.classList.add("completed");
		}

		const today = new Date();
		const currentYear = today.getFullYear();
		if (year === currentYear) {
			const todayDayOfYear = Math.floor(
				(today - new Date(currentYear, 0, 0)) / (1000 * 60 * 60 * 24),
			);
			if (day === todayDayOfYear) {
				dayBox.classList.add("today");
			}
		}

		dayBox.addEventListener("click", () => {
			const wasCompleted = dayBox.classList.contains("completed");
			if (wasCompleted) {
				dayBox.classList.remove("completed");
				setData(currentActivity, year, day, false);
			} else {
				dayBox.classList.add("completed");
				setData(currentActivity, year, day, true);
			}
		});

		calendar.appendChild(dayBox);
	}
}

function initYearSelect() {
	const yearSelect = document.getElementById("yearSelect");
	const thisYear = new Date().getFullYear();

	for (let year = 2025; year <= thisYear; year++) {
		const option = document.createElement("option");
		option.value = year;
		option.textContent = year;
		if (year === thisYear) {
			option.selected = true;
		}
		yearSelect.appendChild(option);
	}

	yearSelect.addEventListener("change", (e) => {
		createCalendar(parseInt(e.target.value));
	});
}

function initActivitySelect() {
	const activitySelect = document.getElementById("activitySelect");
	const addButton = document.getElementById("addActivity");
	const data = getActivitiesData();

	Object.keys(data.activities).forEach((activity) => {
		if (activity !== DEFAULT_ACTIVITY) {
			const option = document.createElement("option");
			option.value = activity;
			option.textContent = activity;
			activitySelect.appendChild(option);
		}
	});

	activitySelect.value = data.selectedActivity;
	currentActivity = data.selectedActivity;

	activitySelect.addEventListener("change", (e) => {
		currentActivity = e.target.value;
		const data = getActivitiesData();
		data.selectedActivity = currentActivity;
		setActivitiesData(data);
		createCalendar(parseInt(document.getElementById("yearSelect").value));
	});

	addButton.addEventListener("click", () => {
		const newActivity = prompt("Enter new activity name:");
		if (newActivity?.trim()) {
			const trimmedActivity = newActivity.trim();
			const data = getActivitiesData();

			if (!data.activities[trimmedActivity]) {
				data.activities[trimmedActivity] = {};

				const option = document.createElement("option");
				option.value = trimmedActivity;
				option.textContent = trimmedActivity;
				activitySelect.appendChild(option);

				activitySelect.value = trimmedActivity;
				currentActivity = trimmedActivity;
				data.selectedActivity = currentActivity;

				setActivitiesData(data);

				createCalendar(parseInt(document.getElementById("yearSelect").value));
			}
		}
	});
}

function exportData() {
	const data = getActivitiesData();
	return JSON.stringify({
		version: VERSION,
		[currentActivity]: data.activities[currentActivity],
	});
}

function importData(dataString) {
	try {
		const importedData = JSON.parse(dataString);

		if (importedData.version !== VERSION) {
			throw new Error(
				`Version mismatch: expected ${VERSION}, got ${importedData.version}`,
			);
		}

		delete importedData.version;

		const data = getActivitiesData();
		Object.assign(data.activities, importedData);
		setActivitiesData(data);

		createCalendar(parseInt(document.getElementById("yearSelect").value));
		return true;
	} catch (_e) {
		return false;
	}
}

document.addEventListener("DOMContentLoaded", () => {
	initYearSelect();
	initActivitySelect();
	createCalendar(new Date().getFullYear());

	document.getElementById("version").textContent = VERSION;

	// Export/Import button listeners
	document.getElementById("exportBtn").addEventListener("click", async () => {
		const dataString = exportData();
		try {
			await navigator.clipboard.writeText(dataString);
			alert(`Data for activity '${currentActivity}' exported to clipboard.`);
		} catch (_e) {
			prompt("Data:", dataString);
		}
	});

	document.getElementById("importBtn").addEventListener("click", () => {
		const dataString = prompt(
			"WARNING: This may overwrite existing habit data across all years.\n\nPaste your export data here:",
		);
		if (dataString) {
			if (importData(dataString)) {
				alert("Data imported successfully.");
			} else {
				alert("Invalid data format. Import failed.");
			}
		}
	});
});
