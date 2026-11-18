/* ---------- "Not implemented yet" placeholder ----------
   Any element with the attribute data-placeholder shows a small
   message instead of navigating. When a real page is ready, remove
   data-placeholder from that element and set its real href. */
const toast = document.createElement('div');
toast.className = 'toast';
toast.setAttribute('role', 'status');
document.body.appendChild(toast);

let toastTimer;
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-placeholder]');
    if (!target) return;

    event.preventDefault();
    closeUserMenu();
    showToast('Not implemented yet');
});

/* ---------- User dropdown (top right) ---------- */
const userMenuButton = document.getElementById('userMenuButton');
const userDropdown = document.getElementById('userDropdown');

function closeUserMenu() {
    if (!userMenuButton) return;
    userDropdown.hidden = true;
    userMenuButton.setAttribute('aria-expanded', 'false');
}

if (userMenuButton) {
    userMenuButton.addEventListener('click', (event) => {
        event.stopPropagation();
        const willOpen = userDropdown.hidden;
        userDropdown.hidden = !willOpen;
        userMenuButton.setAttribute('aria-expanded', String(willOpen));
    });

    // Close when clicking anywhere else or pressing Escape
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.userWrapper')) closeUserMenu();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeUserMenu();
    });
}


/* =====================================================================
   SHARED HELPERS (used by student.js, lecturer.js and admin.js)
   ===================================================================== */

/* Small helper to build an element safely.
   Always use textContent (not innerHTML) for data that comes from the
   backend, so user-written text can never inject HTML. */
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

/* Icons are fixed strings written by us (NOT backend data), so innerHTML is safe here. */
const ICONS = {
    book:   '<svg viewBox="0 0 24 24"><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/></svg>',
    user:   '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    trophy: '<svg viewBox="0 0 24 24"><path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/></svg>',
    basket: '<svg viewBox="0 0 24 24"><path d="M3 10h18l-2 10H5z"/><path d="M8 10l4-6 4 6M9 14v3M15 14v3"/></svg>'
};

function makeListIcon(iconName) {
    const span = el('span', 'listIcon');
    span.innerHTML = ICONS[iconName] || ICONS.book;
    return span;
}

/* Shows a message inside a list panel (loading / empty / error). */
function showListMessage(container, message) {
    container.replaceChildren(el('p', 'listMessage', message));
}

/* =====================================================================
   CURRENT USER (name, role and initials in the top right)
   =====================================================================
   BACKEND TODO: replace the example below with a real request.
   Expected JSON from the backend:
   {
     "firstName": "Alex",
     "lastName": "Morgan",
     "role": "Lecturer",          // "Student", "Lecturer" or "Admin" (shown in the chip)
     "university": "Maynooth"
   }
*/
async function fetchCurrentUser() {
    if (!getToken()) {
        window.location.replace('/auth/login/');
        return null;
    }
    try {
        const { user } = await apiRequest('/api/auth/me', { auth: true });
        return user;
    } catch (error) {
        clearSession();
        window.location.replace('/auth/login/');
        return null;
    }
}

const ROLE_LABELS = {
    STUDENT: 'Student',
    LECTURER: 'Lecturer',
    ADMIN: 'Admin',
    COMMITTEE_MEMBER: 'Committee member'
};

async function loadCurrentUser() {
    try {
        const user = await fetchCurrentUser();
        if (!user) return null;
        const initials = user.displayName
            .split(' ')
            .map(function (word) { return word[0]; })
            .join('')
            .slice(0, 2)
            .toUpperCase();
        document.getElementById('userAvatar').textContent = initials;
        document.getElementById('userName').textContent = user.displayName;
        document.getElementById('userRole').textContent = (ROLE_LABELS[user.role] || user.role) + ' · Maynooth';
        return user;
    } catch (error) {
        console.error(error);
        return null;
    }
}

/* Page scripts (student.js, lecturer.js, admin.js) can use the loaded user
   without a second request:  currentUserReady.then(user => { ... });
   "user" is null if the request failed or the user is not logged in. */
const currentUserReady = loadCurrentUser();

// Log out: wipe the saved login before the link goes to the login page
document.addEventListener('click', function (event) {
    if (event.target.closest('.logout')) {
        clearSession();
    }
});

// Back button restores pages from cache, so check the login again when the page is shown
window.addEventListener('pageshow', function () {
    if (!getToken()) {
        window.location.replace('/auth/login/');
    }
});