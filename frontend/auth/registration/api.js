// Shared helpers for talking to the UniQuest backend.
// The backend serves these pages itself, so the API lives on the same origin.

const TOKEN_KEY = "uniquestToken";

// "Remember me" keeps the token in localStorage (survives closing the browser),
// otherwise sessionStorage (cleared when the tab is closed).
function saveSession(token, remember) {
    clearSession();
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
}

function getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

function clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
}

// Error thrown for any non-2xx response. `details` holds per-field validation messages.
class ApiError extends Error {
    constructor(status, code, message, details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details || {};
    }
}

async function apiRequest(path, { method = "GET", body, auth = false } = {}) {
    const headers = { Accept: "application/json" };

    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    if (auth) {
        const token = getToken();
        if (token) headers.Authorization = "Bearer " + token;
    }

    let response;
    try {
        response = await fetch(path, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new ApiError(0, "NETWORK_ERROR", "Cannot reach the server. Is the backend running?");
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const err = (data && data.error) || {};
        const message = response.status === 429
            ? "Too many attempts. Please wait a few minutes and try again."
            : err.message || "Something went wrong (" + response.status + ")";
        throw new ApiError(response.status, err.code, message, err.details);
    }

    return data;
}

// Show a message in a form's error box (pass an empty string to hide it).
function showFormError(element, message) {
    element.textContent = message;
    element.hidden = !message;
}
