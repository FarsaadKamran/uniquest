/* =====================================================================
   STUDENT DASHBOARD (student.js)
   =====================================================================
   Student-only behaviour. Everything shared by all dashboards (toast,
   user dropdown, current user, el(), showListMessage()) lives in
   dashboard.js, which MUST be loaded first:

       <script src="dashboard.js"></script>
       <script src="student.js"></script>

   Wrapped in a function so its variable names can never clash with the
   ones in dashboard.js.
*/
(function () {
    'use strict';

    /* ---------- Modal helpers (shared by both popups) ---------- */
    function openModal(modal) {
        modal.classList.add('active');
    }

    function closeModal(modal) {
        modal.classList.remove('active');
    }

    // One Escape handler closes whichever popup is open
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        document.querySelectorAll('.modalOverlay.active').forEach(closeModal);
    });

    // Clicking the dark area outside the white box closes that popup
    document.querySelectorAll('.modalOverlay').forEach((overlay) => {
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) closeModal(overlay);
        });
    });


    /* =====================================================================
       WELCOME MESSAGE
       Uses the user already loaded by dashboard.js (no extra request).
       ===================================================================== */
    currentUserReady.then((user) => {
        const welcomeName = document.getElementById('welcomeName');
        if (user && welcomeName) welcomeName.textContent = user.firstName;
    });


    /* =====================================================================
       QUEST TABS (active / completed)
       BACKEND TODO: the quest cards are still typed in student.html.
       When the endpoint exists, build them from data (like lecturer.js
       does) and set data-status="active" or "completed" on each card.
       ===================================================================== */
    const tabButtons = document.querySelectorAll('.tabButton');
    const questList = document.getElementById('questList');
    const questCards = document.querySelectorAll('.questCard');

    tabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            tabButtons.forEach((tab) => tab.classList.remove('active'));
            button.classList.add('active');

            const selectedTab = button.dataset.tab;
            let visibleQuests = 0;

            // Show only the quests matching the selected tab
            questCards.forEach((quest) => {
                const matches = quest.dataset.status === selectedTab;
                quest.style.display = matches ? 'flex' : 'none';
                if (matches) visibleQuests++;
            });

            // Show a message if there is nothing to display
            let emptyMessage = document.getElementById('emptyMessage');

            if (visibleQuests === 0) {
                if (!emptyMessage) {
                    emptyMessage = el('p', null, '');
                    emptyMessage.id = 'emptyMessage';
                    questList.appendChild(emptyMessage);
                }
                emptyMessage.textContent = 'No ' + selectedTab + ' quests to display yet.';
            } else if (emptyMessage) {
                emptyMessage.remove();
            }
        });
    });


    /* =====================================================================
       ATTENDANCE POPUP
       ===================================================================== */
    const scanButton = document.getElementById('scanAttendance');
    const attendanceModal = document.getElementById('attendanceModal');
    const closeAttendanceButton = document.getElementById('closeModal');
    const attendanceForm = document.getElementById('attendanceForm');
    const classCodeInput = document.getElementById('classCode');
    const attendanceMessage = document.getElementById('attendanceMessage');

    scanButton.addEventListener('click', () => {
        attendanceMessage.textContent = '';
        openModal(attendanceModal);
        classCodeInput.focus();
    });

    closeAttendanceButton.addEventListener('click', () => closeModal(attendanceModal));

    attendanceForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const classCode = classCodeInput.value.trim();

        if (classCode === '') {
            attendanceMessage.textContent = 'Please enter a class code.';
            return;
        }

        // BACKEND TODO: send the class code to the server.
        // The server should verify that the code is valid, belongs to an
        // active class and has not expired. Only register attendance after
        // successful verification.

        attendanceMessage.textContent = 'Frontend demo: Class code received. Verification will be handled by the backend.';
    });


    /* =====================================================================
       ASSIGNMENT DATA
       =====================================================================
       BACKEND TODO: replace this sample array with data from the backend.
       Each object is one assignment. The "Open Assignment" buttons in
       student.html point at an entry through data-assignment="<index>".
       (Better long-term: use a real assignment ID instead of an index.)
    */
    const assignments = [
        {
            module: 'CS162 - Computer Systems',
            title: 'Lab Report 4',
            xp: '250 XP',
            status: 'Not submitted',
            due: 'Due: Fri 23 Oct, 17:00',
            earlyBird: 'Early bird cutoff: Wed 21 Oct, 17:00 (closed)',
            bonus: 'Early bird bonus: +50 XP extra (expired)',
            description: 'Complete the Lab 4 exercises and submit your report as a PDF.',
            fileName: 'Lab 4 Instruction.pdf',
            fileUrl: 'files/lab4-instruction.pdf' // BACKEND TODO: real PDF URL
        },
        {
            module: 'CS171 - Software Engineering',
            title: 'Sprint Review',
            xp: '200 XP',
            status: 'Draft saved',
            due: 'Due: Sat 24 Oct, 23:59',
            earlyBird: 'Early bird cutoff: Thu 22 Oct, 23:59',
            bonus: 'Early bird bonus: +50 XP extra',
            description: 'Submit your team sprint review and peer feedback.',
            fileName: 'Sprint Review Instructions.pdf',
            fileUrl: 'files/sprint-review-instructions.pdf'
        },
        {
            module: 'CS180 - Data Structures',
            title: 'Weekly Practice',
            xp: '150 XP',
            status: 'In progress',
            due: 'Due: Sun 25 Oct, 23:59',
            earlyBird: 'Early bird cutoff: Fri 23 Oct, 23:59',
            bonus: 'Early bird bonus: +50 XP extra',
            description: 'Complete the required practice set and submit your answers.',
            fileName: 'Weekly Practice Instructions.pdf',
            fileUrl: 'files/weekly-practice-instructions.pdf'
        }
    ];


    /* =====================================================================
       ASSIGNMENT POPUP
       ===================================================================== */
    const assignmentModal = document.getElementById('assignmentModal');
    const closeAssignmentButton = document.getElementById('closeAssignmentModal');
    const assignmentButtons = document.querySelectorAll('.assignmentButton');
    const assignmentForm = document.getElementById('assignmentForm');
    const assignmentUpload = document.getElementById('assignmentUpload');
    const submissionMessage = document.getElementById('submissionMessage');

    // element id in student.html  ->  property in the assignment object
    const ASSIGNMENT_FIELDS = {
        assignmentModule: 'module',
        assignmentTitle: 'title',
        assignmentXp: 'xp',
        assignmentStatus: 'status',
        assignmentDue: 'due',
        assignmentEarlyBird: 'earlyBird',
        assignmentBonus: 'bonus',
        assignmentDescription: 'description',
        assignmentFileName: 'fileName'
    };

    function openAssignment(assignmentIndex) {
        const assignment = assignments[assignmentIndex];
        if (!assignment) return;

        // textContent (not innerHTML): backend text can never inject HTML
        Object.entries(ASSIGNMENT_FIELDS).forEach(([elementId, property]) => {
            document.getElementById(elementId).textContent = assignment[property];
        });

        document.getElementById('assignmentPdf').href = assignment.fileUrl;

        // Reset the form when opening another assignment
        assignmentForm.reset();
        submissionMessage.textContent = '';

        openModal(assignmentModal);
    }

    assignmentButtons.forEach((button) => {
        button.addEventListener('click', () => {
            openAssignment(Number(button.dataset.assignment));
        });
    });

    closeAssignmentButton.addEventListener('click', () => closeModal(assignmentModal));

    assignmentForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const selectedFile = assignmentUpload.files[0];

        if (!selectedFile) {
            submissionMessage.textContent = 'Please select a PDF before submitting.';
            return;
        }

        // Client-side check only. The backend MUST validate type and size again.
        if (selectedFile.type !== 'application/pdf') {
            submissionMessage.textContent = 'Please upload a PDF file.';
            return;
        }

        // BACKEND TODO: send the PDF to the backend. The backend should:
        // 1. Verify the logged-in student.
        // 2. Verify the assignment and submission deadline.
        // 3. Store the uploaded PDF securely.
        // 4. Save the submission record in the database.
        // 5. Update the student's assignment status.

        submissionMessage.textContent = 'Demo submission successful! Backend upload integration pending.';
    });

})();
