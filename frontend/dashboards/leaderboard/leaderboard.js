/* =====================================================================
   LEADERBOARD PAGE (leaderboard.js)
   =====================================================================
   HOW THIS WORKS
   - leaderboard.html has an EMPTY <section id="leaderboardList">.
   - When the page opens (and whenever a period tab is clicked) this file
     calls  GET /api/leaderboard?period=today|week|month|year|all
     and builds one row per student.
   - Students, lecturers and admins can all open this page. Only students
     (and committee members) are ranked; lecturers/admins just view it.

   Needs these to be loaded first (see the <script> tags in the html):
       /auth/registration/api.js   -> apiRequest()
       ../dashboard.js             -> el(), showListMessage(), makeListIcon(),
                                      currentUserReady, ICONS

   Backend response shape:
   {
     "period": "week",
     "since": "2026-11-16T00:00:00.000Z",     // null for "all"
     "entries": [ { "rank": 1, "userId": "...", "displayName": "Aoife Byrne", "xp": 1250 }, ... ],
     "me": { "rank": 4, "xp": 830 }           // null for lecturers/admins, rank null if 0 xp
   }
*/
(function () {
    'use strict';

    const DEFAULT_PERIOD = 'week';
    const PERIOD_LABELS = {
        today: 'today',
        week: 'this week',
        month: 'this month',
        year: 'this year',
        all: 'all time'
    };

    // Where "Home" / the logo should go for each role (same pages as login.js)
    const HOME_PAGES = {
        ADMIN: '/dashboards/admin-dashboard/admin.html',
        LECTURER: '/dashboards/lecturer-dashboard/lecturer.html',
        STUDENT: '/dashboards/student-dashboard/student.html',
        COMMITTEE_MEMBER: '/dashboards/student-dashboard/student.html'
    };

    const listContainer = document.getElementById('leaderboardList');
    const tabsContainer = document.getElementById('periodTabs');
    const myRankCard = document.getElementById('myRank');

    let currentUser = null;
    let requestCounter = 0; // so a slow old response can never overwrite a newer one

    /* ---------- helpers ---------- */
    function formatXp(xp) {
        return xp.toLocaleString('en-IE') + ' XP';
    }

    function initialsOf(name) {
        return name
            .split(' ')
            .filter(Boolean)
            .map(function (word) { return word[0]; })
            .join('')
            .slice(0, 2)
            .toUpperCase();
    }

    /* ---------- one row ---------- */
    function createRow(entry) {
        const isMe = currentUser !== null && entry.userId === currentUser.id;
        const row = el('div', isMe ? 'leaderRow isMe' : 'leaderRow');

        const badgeClass = entry.rank <= 3 ? 'rankBadge rank' + entry.rank : 'rankBadge';
        const badge = el('span', badgeClass, String(entry.rank));

        const avatar = el('span', 'avatar', initialsOf(entry.displayName));

        const text = el('div', 'rowText');
        const name = el('strong', '', entry.displayName);
        if (isMe) name.append(el('span', 'youTag', 'You'));
        text.append(name);

        row.append(badge, avatar, text, el('span', 'xpValue', formatXp(entry.xp)));
        return row;
    }

    /* ---------- "your position" card ---------- */
    function renderMyRank(me, period) {
        if (!me) {               // lecturers / admins are not ranked
            myRankCard.hidden = true;
            return;
        }
        document.getElementById('myRankIcon').innerHTML = ICONS.trophy; // fixed string from dashboard.js, not backend data

        const text = document.getElementById('myRankText');
        const value = document.getElementById('myRankValue');

        if (me.rank === null) {
            text.textContent = 'No XP earned ' + PERIOD_LABELS[period] + ' yet. Complete a quest to get on the board!';
            value.textContent = '–';
        } else {
            text.textContent = formatXp(me.xp) + ' earned ' + PERIOD_LABELS[period];
            value.textContent = '#' + me.rank;
        }
        myRankCard.hidden = false;
    }

    /* ---------- load + show ---------- */
    async function loadLeaderboard(period) {
        const thisRequest = ++requestCounter;
        showListMessage(listContainer, 'Loading leaderboard…');

        try {
            const data = await apiRequest('/api/leaderboard?period=' + encodeURIComponent(period), { auth: true });
            if (thisRequest !== requestCounter) return; // a newer tab click already took over

            renderMyRank(data.me, period);

            if (data.entries.length === 0) {
                showListMessage(listContainer, 'Nobody has earned XP ' + PERIOD_LABELS[period] + ' yet.');
                return;
            }
            listContainer.replaceChildren(...data.entries.map(createRow));
            listContainer.scrollTop = 0;
        } catch (error) {
            if (thisRequest !== requestCounter) return;
            console.error(error);
            myRankCard.hidden = true;
            if (error.status === 401) {          // token expired
                clearSession();
                window.location.replace('/auth/login/');
                return;
            }
            showListMessage(listContainer, 'Could not load the leaderboard. Please try again later.');
        }
    }

    /* ---------- period tabs ---------- */
    tabsContainer.addEventListener('click', function (event) {
        const button = event.target.closest('.periodTab');
        if (!button) return;

        tabsContainer.querySelectorAll('.periodTab').forEach(function (tab) {
            const active = tab === button;
            tab.classList.toggle('active', active);
            tab.setAttribute('aria-pressed', String(active));
        });
        loadLeaderboard(button.dataset.period);
    });

    /* ---------- start ---------- */
    currentUserReady.then(function (user) {
        if (!user) return; // dashboard.js already redirected to the login page

        currentUser = user;

        // Home + logo go to the dashboard that matches this person's role
        const home = HOME_PAGES[user.role] || HOME_PAGES.STUDENT;
        document.getElementById('homeLink').href = home;
        document.getElementById('logoLink').href = home;

        loadLeaderboard(DEFAULT_PERIOD);
    });
})();
