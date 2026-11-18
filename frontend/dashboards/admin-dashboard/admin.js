/* =====================================================================
   ADMIN DASHBOARD - "Recent admin activity" list
   =====================================================================
   HOW THIS WORKS
   - admin.html only contains an EMPTY <section id="activityList">.
   - This file asks for the latest admin activity, then builds one row
     per entry and puts it in that section.
   - This list changes all the time, so it is built from data, never typed by hand.

   !! THE ACTIVITY BELOW IS JUST EXAMPLE DATA !!
   It is a placeholder until the backend is finished.

   BACKEND TODO (2 steps):
   1. In fetchRecentActivity(), uncomment the REAL VERSION and delete the example return.
   2. Make the endpoint return a JSON array (in the order they should appear) shaped like EXAMPLE_ACTIVITY.
      Optional: re-run loadActivity() every so often (see the bottom) to keep it fresh.
*/

/* Shape of ONE activity entry coming from the backend:
   {
     id:          501,                              // unique id
     type:        "user",                           // "user" | "module" | "challenge" | "reward"
     title:       "New user registered",            // short headline
     description: "Student account created",        // what happened
     timestamp:   "2026-11-06T09:42:00Z"            // ISO date-time
   }
   "type" decides the icon and the category label (see ACTIVITY_TYPES). */
const ACTIVITY_TYPES = {
    user:      { icon: 'user',   category: 'Account management' },
    module:    { icon: 'book',   category: 'Module management' },
    challenge: { icon: 'trophy', category: 'Campus challenges' },
    reward:    { icon: 'basket', category: 'Reward store' }
};

/* Example timestamps: fixed times on TODAY's date, so they always read "Today, 09:42" etc. */
function todayAt(hours, minutes) {
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
}

const EXAMPLE_ACTIVITY = [
    { id: 1, type: 'user',      title: 'New user registered',   description: 'Student account created',                  timestamp: todayAt(9, 42) },
    { id: 2, type: 'module',    title: 'Module updated',        description: 'Module details changed',                   timestamp: todayAt(10, 18) },
    { id: 3, type: 'challenge', title: 'Campus quest created',  description: 'New university-wide challenge added',      timestamp: todayAt(11, 36) },
    { id: 4, type: 'reward',    title: 'Reward stock updated',  description: 'New item was added to the shop',           timestamp: todayAt(12, 5) },
    { id: 5, type: 'user',      title: 'New user registered',   description: 'Lecturer account created',                 timestamp: todayAt(13, 20) },
    { id: 6, type: 'module',    title: 'Module created',        description: 'CS190 - Operating Systems added',          timestamp: todayAt(14, 2) },
    { id: 7, type: 'challenge', title: 'Campus quest updated',  description: 'Library Week challenge deadline extended', timestamp: todayAt(14, 45) },
    { id: 8, type: 'reward',    title: 'Coupon stock low',      description: 'Campus Café voucher has 5 left',           timestamp: todayAt(15, 30) },
    { id: 9,  type: 'user',   title: 'User role changed',     description: 'Student promoted to Lecturer',            timestamp: todayAt(16, 10) },
    { id: 10, type: 'module', title: 'Module deleted',        description: 'CS099 - Test Module removed',             timestamp: todayAt(16, 40) }
];

async function fetchRecentActivity() {
    // --- REAL VERSION (uncomment when the endpoint exists) ---
    // const response = await fetch('/api/admin/activity?limit=20', { credentials: 'include' });
    // if (!response.ok) throw new Error('Could not load activity');
    // return await response.json();

    // --- EXAMPLE DATA (delete once the backend is connected) ---
    return EXAMPLE_ACTIVITY;
}

/* "Today, 09:42" / "Yesterday, 17:10" / "3 Nov, 12:00" */
function formatActivityTime(isoString) {
    const date = new Date(isoString);
    const time = date.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit', hour12: false });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const dayDifference = Math.round((startOfToday - new Date(date).setHours(0, 0, 0, 0)) / 86400000);

    if (dayDifference === 0) return 'Today, ' + time;
    if (dayDifference === 1) return 'Yesterday, ' + time;
    return date.toLocaleDateString('en-IE', { day: 'numeric', month: 'short' }) + ', ' + time;
}

/* Builds one activity row (same markup/classes as the old hard-coded rows). */
function createActivityRow(entry) {
    const type = ACTIVITY_TYPES[entry.type] || { icon: 'book', category: 'Admin' };

    const row = el('div', 'activityRow');
    const text = el('div');
    text.append(
        el('strong', '', entry.title + ' — ' + entry.description),
        el('span', '', formatActivityTime(entry.timestamp) + ' · ' + type.category)
    );

    row.append(makeListIcon(type.icon), text);
    return row;
}

async function loadActivity() {
    const container = document.getElementById('activityList');
    if (!container.hasChildNodes()) showListMessage(container, 'Loading activity…');

    try {
        const activity = await fetchRecentActivity();

        if (activity.length === 0) {
            showListMessage(container, 'No recent activity yet.');
            return;
        }
        container.replaceChildren(...activity.map(createActivityRow));
    } catch (error) {
        console.error(error);
        showListMessage(container, 'Could not load activity. Please try again later.');
    }
}

loadActivity();

// OPTIONAL (backend): refresh the list automatically every minute.
// setInterval(loadActivity, 60000);
