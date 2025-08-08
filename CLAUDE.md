# Habits Tracker

A simple year-view habit tracking web app. Click day boxes to cycle through completion states.

**Files:**
- `index.html` - Main HTML structure
- `index.js` - Core application logic and data management
- `index.css` - Styling and visual states

**Key Features:**
- Year calendar view with day-of-year tracking
- Multiple activities support
- 3-state completion: none (grey) → full (green) → half (blue dashed) → none
- Local storage persistence with export/import functionality
- Current day indicator (white triangle)
- Backward-compatible data format

**Data Structure:**
- Full completions: `activities[activity][year] = [dayOfYear, ...]`
- Half completions: `activities[activity][year + "_half"] = [dayOfYear, ...]`
- Priority rule: `_half` arrays take precedence over regular arrays

**Development:**
- Use `make check` to run Biome linter
- No build process required - pure vanilla JS/CSS/HTML
- Data format is JSON in localStorage under key "activities"