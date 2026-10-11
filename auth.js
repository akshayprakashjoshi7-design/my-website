import { APP_CONFIG } from "../config.js";

import {
  storage,
  sessionSet
} from "../utils/storage.js";

import {
  $,
  $$,
  createId,
  notify
} from "../utils/helpers.js";

import {
  normalizeEmail,
  isValidEmail,
  validateLogin,
  validateSignup
} from "../utils/validators.js";

// Public credentials for frontend demonstration only.
// Never use these credentials in a production authentication system.
const DEMO_ACCOUNT = Object.freeze({
  id: "demo-user",
  name: "Demo Learner",
  email: "demo@techvision.dev",
  password: "TechVisionDemo123!"
});

function showStatus(form, message, type = "info") {
  const region = form?.querySelector("[data-form-status]");

  if (!region) return;

  const allowedTypes = ["info", "success", "error"];

  region.className = `alert alert-${
    allowedTypes.includes(type) ? type : "info"
  } auth-status`;

  region.textContent = message;
  region.hidden = false;
}

function clearStatus(form) {
  const region = form?.querySelector("[data-form-status]");

  if (!region) return;

  region.textContent = "";
  region.hidden = true;
}

function clearErrors(form) {
  if (!form) return;

  form.querySelectorAll("[data-error-for]").forEach((element) => {
    element.textContent = "";
  });

  form.querySelectorAll("[aria-invalid]").forEach((element) => {
    element.removeAttribute("aria-invalid");
  });
}

function setFieldError(form, fieldName, message) {
  const errorElement = form.querySelector(
    `[data-error-for="${fieldName}"]`
  );

  const field = form.elements.namedItem(fieldName);

  if (errorElement) {
    errorElement.textContent = message;
  }

  if (field instanceof HTMLElement) {
    field.setAttribute("aria-invalid", "true");
  }
}

function renderErrors(form, errors = {}) {
  clearErrors(form);

  for (const [fieldName, message] of Object.entries(errors)) {
    setFieldError(form, fieldName, message);
  }
}

function getFormValues(form) {
  const data = new FormData(form);

  return Object.fromEntries(data.entries());
}

function getDashboardUrl() {
  return "pages/dashboard.html";
}

function createPublicUser(profile) {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    createdAt: profile.createdAt,
    mode: "demo"
  };
}

function startDemoSession(profile) {
  const publicUser = createPublicUser(profile);

  // Session contains profile information only, never a password.
  const sessionCreated = sessionSet("current-user", publicUser);

  if (!sessionCreated) {
    return {
      success: false,
      message:
        "Your browser could not create a session. Check browser storage settings and try again."
    };
  }

  return {
    success: true,
    user: publicUser
  };
}

function goToDashboard() {
  window.location.assign(getDashboardUrl());
}

function setBusy(button, busy, busyText = "Please wait...") {
  if (!button) return;

  if (busy) {
    button.dataset.originalText = button.textContent;
    button.disabled = true;
    button.textContent = busyText;
    return;
  }

  button.disabled = false;

  if (button.dataset.originalText) {
    button.textContent = button.dataset.originalText;
    delete button.dataset.originalText;
  }
}

function initPasswordToggles() {
  $$("[data-password-toggle]").forEach((button) => {
    if (button.dataset.initialized === "true") return;

    button.dataset.initialized = "true";

    button.addEventListener("click", () => {
      const targetId = button.dataset.passwordToggle;
      const input = document.getElementById(targetId);

      if (!(input instanceof HTMLInputElement)) return;

      const shouldShow = input.type === "password";

      input.type = shouldShow ? "text" : "password";
      button.textContent = shouldShow ? "Hide" : "Show";
      button.setAttribute(
        "aria-label",
        shouldShow ? "Hide password" : "Show password"
      );
      button.setAttribute("aria-pressed", String(shouldShow));
    });
  });
}

function initLoginPage() {
  const form = $("#login-form");
  const demoButton = $("[data-demo-login]");

  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    clearErrors(form);
    clearStatus(form);

    const values = getFormValues(form);

    const result = validateLogin({
      email: values.email,
      password: values.password
    });

    if (!result.valid) {
      renderErrors(form, result.errors);

      showStatus(
        form,
        "Please correct the highlighted fields.",
        "error"
      );

      return;
    }

    const email = normalizeEmail(values.email);
    const password = String(values.password ?? "");

    if (
      email !== DEMO_ACCOUNT.email ||
      password !== DEMO_ACCOUNT.password
    ) {
      showStatus(
        form,
        "These credentials do not match the public demo account. Use the displayed demo credentials or the demo-login button.",
        "error"
      );

      return;
    }

    const resultSession = startDemoSession({
      id: DEMO_ACCOUNT.id,
      name: DEMO_ACCOUNT.name,
      email: DEMO_ACCOUNT.email,
      createdAt: new Date().toISOString()
    });

    if (!resultSession.success) {
      showStatus(form, resultSession.message, "error");
      return;
    }

    goToDashboard();
  });

  if (demoButton) {
    demoButton.addEventListener("click", () => {
      clearErrors(form);
      clearStatus(form);

      const resultSession = startDemoSession({
        id: DEMO_ACCOUNT.id,
        name: DEMO_ACCOUNT.name,
        email: DEMO_ACCOUNT.email,
        createdAt: new Date().toISOString()
      });

      if (!resultSession.success) {
        showStatus(form, resultSession.message, "error");
        return;
      }

      goToDashboard();
    });
  }
}

function initSignupPage() {
  const form = $("#signup-form");

  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    clearErrors(form);
    clearStatus(form);

    const values = getFormValues(form);

    const validation = validateSignup({
      name: values.name,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword
    });

    const errors = { ...validation.errors };

    const termsCheckbox = $("#signup-terms", form);

    if (!termsCheckbox?.checked) {
      errors.terms = "Please acknowledge the demo-account limitation.";
    }

    if (Object.keys(errors).length > 0) {
      renderErrors(form, errors);

      showStatus(
        form,
        "Please correct the highlighted fields.",
        "error"
      );

      return;
    }

    const email = normalizeEmail(values.email);

    // This demo has one public login account and does not maintain
    // a real account database.
    if (email === DEMO_ACCOUNT.email) {
      setFieldError(
        form,
        "email",
        "This email is reserved for the public demo account. Use another email for the signup preview."
      );

      showStatus(
        form,
        "Please use a different email address.",
        "error"
      );

      return;
    }

    const profile = {
      id: createId("user"),
      name: String(values.name).trim(),
      email,
      createdAt: new Date().toISOString()
    };

    // Store profile information only. Never store the submitted password.
    storage.set("profile", profile, profile.id);

    const resultSession = startDemoSession(profile);

    if (!resultSession.success) {
      showStatus(form, resultSession.message, "error");
      return;
    }

    showStatus(
      form,
      "Demo profile created for this session. Opening your workspace...",
      "success"
    );

    goToDashboard();
  });
}

function initForgotPasswordPage() {
  const form = $("#forgot-password-form");

  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    clearErrors(form);
    clearStatus(form);

    const values = getFormValues(form);
    const email = normalizeEmail(values.email);

    if (!isValidEmail(email)) {
      renderErrors(form, {
        email: "Enter a valid email address."
      });

      showStatus(
        form,
        "Please enter a valid email address.",
        "error"
      );

      return;
    }

    // No email is sent: this is only a frontend simulation.
    showStatus(
      form,
      "Demo complete: in a real application, recovery instructions would be sent if the account exists. No email has been sent and no password has been changed.",
      "success"
    );

    form.reset();
  });
}

export function initAuthPage(page) {
  initPasswordToggles();

  switch (page) {
    case "login":
      initLoginPage();
      break;

    case "signup":
      initSignupPage();
      break;

    case "forgotPassword":
      initForgotPasswordPage();
      break;

    default:
      console.warn(`Unknown authentication page: ${page}`);
  }
}