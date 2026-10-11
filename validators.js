export function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function isValidEmail(value) {
  const email = normalizeEmail(value);

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function validatePassword(value) {
  const password = String(value ?? "");

  if (password.length < 8) {
    return "Password must contain at least 8 characters.";
  }

  if (password.length > 128) {
    return "Password must not exceed 128 characters.";
  }

  return "";
}

export function validateSignup({
  name,
  email,
  password,
  confirmPassword
}) {
  const errors = {};

  const cleanName = String(name ?? "").trim();

  if (cleanName.length < 2) {
    errors.name = "Enter a name containing at least 2 characters.";
  } else if (cleanName.length > 80) {
    errors.name = "Name must not exceed 80 characters.";
  }

  if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  const passwordError = validatePassword(password);

  if (passwordError) {
    errors.password = passwordError;
  }

  if (String(password ?? "") !== String(confirmPassword ?? "")) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateLogin({ email, password }) {
  const errors = {};

  if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!String(password ?? "")) {
    errors.password = "Enter your password.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateRequiredForm(form) {
  const errors = {};

  if (!(form instanceof HTMLFormElement)) {
    return {
      valid: false,
      errors: { form: "A valid form is required." }
    };
  }

  for (const field of form.querySelectorAll("[required]")) {
    const value = String(field.value ?? "").trim();

    if (!value) {
      errors[field.name || field.id || "field"] =
        "This field is required.";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}