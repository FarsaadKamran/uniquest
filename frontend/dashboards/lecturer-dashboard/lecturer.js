/* =====================================================================
   LECTURER DASHBOARD - "Current Assignments" list
   =====================================================================
   HOW THIS WORKS
   - lecturer.html only contains an EMPTY <section id="assignmentList">.
   - This file asks for the lecturer's assignments, then builds one row
     per assignment and puts it in that section.
   - Every lecturer sees their OWN assignments, so the backend should
     return only the logged-in lecturer's data.

   !! THE ASSIGNMENTS BELOW ARE JUST EXAMPLES !!
   They are placeholders until the backend is finished.

   BACKEND TODO (3 steps):
   1. In fetchCurrentAssignments(), uncomment the REAL VERSION and delete the example return.
   2. Make the endpoint return a JSON array shaped like the examples in EXAMPLE_ASSIGNMENTS.
   3. Fill in PAGES.submissions below once the submissions page exists.
*/

/* Where "View submissions" should go. Leave null while the page doesn't exist
   (the button then shows "Not implemented yet"). When ready, e.g.:
   submissions: 'submissions.html'
   The assignment id is added automatically: submissions.html?assignmentId=123 */
const PAGES = {
    submissions: null
};

/* Shape of ONE assignment coming from the backend:
   {
     id:         123,                     // unique assignment id
     moduleCode: "CS162",                 // module code
     moduleName: "Computer Systems",      // module name
     title:      "Lab 4 Report",          // assignment title
     dueDate:    "2026-11-20"             // ISO date (YYYY-MM-DD)
   }
   Sort order: soonest due date first is recommended (backend or here). */
const EXAMPLE_ASSIGNMENTS = [
    { id: 1, moduleCode: 'CS162', moduleName: 'Computer Systems',     title: 'Lab 4 Report',       dueDate: '2026-10-23' },
    { id: 2, moduleCode: 'CS171', moduleName: 'Software Engineering', title: 'Sprint review',      dueDate: '2026-10-24' },
    { id: 3, moduleCode: 'CS180', moduleName: 'Data Structures',      title: 'Practice questions', dueDate: '2026-10-26' },
    { id: 4, moduleCode: 'CS201', moduleName: 'Algorithms',           title: 'Problem set 3',      dueDate: '2026-10-28' },
    { id: 5, moduleCode: 'CS210', moduleName: 'Databases',            title: 'SQL coursework',     dueDate: '2026-10-30' },
    { id: 6, moduleCode: 'CS225', moduleName: 'Web Development',      title: 'Portfolio draft',    dueDate: '2026-11-02' },
    { id: 7, moduleCode: 'CS230', moduleName: 'Networks',             title: 'Packet analysis lab', dueDate: '2026-11-04' },
    { id: 8, moduleCode: 'CS240', moduleName: 'Machine Learning',     title: 'Model report',        dueDate: '2026-11-06' }
];

async function fetchCurrentAssignments() {
    // --- REAL VERSION (uncomment when the endpoint exists) ---
    // const response = await fetch('/api/lecturer/assignments?status=current', { credentials: 'include' });
    // if (!response.ok) throw new Error('Could not load assignments');
    // return await response.json();

    // --- EXAMPLE DATA (delete once the backend is connected) ---
    return EXAMPLE_ASSIGNMENTS;
}

function formatDueDate(isoDate) {
    return new Date(isoDate).toLocaleDateString('en-IE', { day: 'numeric', month: 'long' });
}

/* Builds one assignment row (same markup/classes as the old hard-coded rows). */
function createAssignmentRow(assignment) {
    const row = el('div', 'assignmentRow');

    const text = el('div', 'rowText');
    text.append(
        el('strong', '', assignment.moduleCode + ' - ' + assignment.moduleName),
        el('span', '', assignment.title + ' · Due ' + formatDueDate(assignment.dueDate))
    );

    const button = el('a', 'rowButton');
    button.append('View submissions ', el('span', 'dot', '→'));
    if (PAGES.submissions) {
        button.href = PAGES.submissions + '?assignmentId=' + encodeURIComponent(assignment.id);
    } else {
        button.href = '#';
        button.setAttribute('data-placeholder', ''); // shows "Not implemented yet"
    }

    row.append(makeListIcon('book'), text, button);
    return row;
}

async function loadAssignments() {
    const container = document.getElementById('assignmentList');
    showListMessage(container, 'Loading assignments…');

    try {
        const assignments = await fetchCurrentAssignments();

        if (assignments.length === 0) {
            showListMessage(container, 'No current assignments. Use "Create assignment" to add one.');
            return;
        }
        container.replaceChildren(...assignments.map(createAssignmentRow));
    } catch (error) {
        console.error(error);
        showListMessage(container, 'Could not load assignments. Please try again later.');
    }
}

loadAssignments();
