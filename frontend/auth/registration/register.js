
const accountType = document.getElementById("accountType");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const emailHint = document.getElementById("emailHint");

const displayNameGroup = document.getElementById("displayNameGroup");
const displayNameInput = document.getElementById("displayName");

const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const registerForm = document.getElementById("registerForm");
const registerButton = registerForm.querySelector(".registerButton");
const registerError = document.getElementById("registerError");

// Form value -> backend role
const ROLE_BY_ACCOUNT_TYPE = {
    student: "STUDENT",
    lecturer: "LECTURER",
    committee: "COMMITTEE_MEMBER",
};

// Backend field name -> input, so validation errors appear on the right field
const INPUT_BY_FIELD = {
    fullName: fullNameInput,
    email: emailInput,
    displayName: displayNameInput,
    password: passwordInput,
};

// Lecturers use staff email, everyone else uses student email
function isStaff() {
    return accountType.value === "lecturer";
}

// Update the form when the account type changes
function updateRegistrationForm() {
    const staff = isStaff();

    // Lecturers don't appear on the leaderboard
    displayNameGroup.hidden = staff;
    displayNameInput.required = !staff;

    // Update the university email hint and placeholder
    if (!staff)
    {
        emailInput.placeholder = "you@mumail.ie";
        emailHint.textContent = "Use your @mumail.ie student email.";
    }
    else
    {
        emailInput.placeholder = "you@mu.ie";
        emailHint.textContent = "Use your @mu.ie staff email.";
    }

    // Clear previous validation messages
    emailInput.setCustomValidity("");
}

// Listen for account type changes
accountType.addEventListener("change", updateRegistrationForm);

// Set the correct initial form
updateRegistrationForm();

// Show or hide the password
togglePassword.addEventListener("click", function () {
    const isHidden = passwordInput.type === "password";

    passwordInput.type = isHidden ? "text" : "password";
    togglePassword.textContent = isHidden ? "Hide" : "Show";

    togglePassword.setAttribute(
        "aria-label", isHidden ? "Hide password" : "Show password");
});

// Validate locally, then create the account on the backend
registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    showFormError(registerError, "");

    const staff = isStaff();
    const email = emailInput.value.trim().toLowerCase();

    // Check the email domain for the selected account type
    const validEmail = staff ? email.endsWith("@mu.ie") : email.endsWith("@mumail.ie");

    if (!validEmail)
    {
        emailInput.setCustomValidity(staff ? "Please use your @mu.ie staff email." : "Please use your @mumail.ie student email.");

        emailInput.reportValidity();
        return;
    }

    emailInput.setCustomValidity("");

    const body = {
        accountType: ROLE_BY_ACCOUNT_TYPE[accountType.value],
        fullName: fullNameInput.value.trim(),
        email: email,
        password: passwordInput.value,
    };

    if (!staff) {
        body.displayName = displayNameInput.value.trim();
    }

    registerButton.disabled = true;

    try {
        await apiRequest("/api/auth/register", { method: "POST", body: body });

        window.location.href = "../login/index.html?registered=1";
    }
    catch (error) {
        registerButton.disabled = false;

        // Point at the first field the backend rejected, if any
        for (const [field, messages] of Object.entries(error.details)) {
            const input = INPUT_BY_FIELD[field];
            if (input && messages && messages.length) {
                input.setCustomValidity(messages[0]);
                input.reportValidity();
                return;
            }
        }

        showFormError(registerError, error.message);
    }
});

// Clear custom errors when the user edits a field
for (const input of Object.values(INPUT_BY_FIELD)) {
    input.addEventListener("input", function () {
        input.setCustomValidity("");
    });
}
