const passwordInput = document.getElementById("loginPassword");
const togglePassword = document.getElementById("togglePassword");
const emailInput = document.getElementById("universityEmail");
const rememberMe = document.getElementById("rememberMe");
const loginForm = document.getElementById("loginForm");
const loginButton = loginForm.querySelector(".loginButton");
const loginError = document.getElementById("loginError");

const loginSuccess = document.getElementById("loginSuccess");

// Coming from the register page
if (new URLSearchParams(window.location.search).has("registered")) {
    loginSuccess.textContent = "Account created. You can log in now.";
    loginSuccess.hidden = false;
}

// Show or hide the password when the button is clicked
togglePassword.addEventListener("click", function () {
    if (passwordInput.type === "password")
    {
        passwordInput.type = "text";
        togglePassword.textContent = "Hide";
        togglePassword.setAttribute("aria-label", "Hide password");
    }
    else
    {
        passwordInput.type = "password";
        togglePassword.textContent = "Show";
        togglePassword.setAttribute("aria-label", "Show password");
    }
});

// Send the credentials to the backend
loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    showFormError(loginError, "");
    loginSuccess.hidden = true;

    loginButton.disabled = true;

    try {
        const { user, token } = await apiRequest("/api/auth/login", {
            method: "POST",
            body: {
                email: emailInput.value.trim(),
                password: passwordInput.value,
            },
        });

        saveSession(token, rememberMe.checked);

        const homePages = {
            ADMIN: "/dashboards/admin-dashboard/admin.html",
            LECTURER: "/dashboards/lecturer-dashboard/lecturer.html",
            STUDENT: "/dashboards/student-dashboard/student.html",
            COMMITTEE_MEMBER: "/dashboards/student-dashboard/student.html",
        };
        window.location.href = homePages[user.role] || homePages.STUDENT;
    }
    catch (error) {
        showFormError(loginError, error.message);
    }
    finally {
        loginButton.disabled = false;
    }
});
