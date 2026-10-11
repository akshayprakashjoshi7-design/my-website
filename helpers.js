export const $ = (selector, root = document) =>
  root.querySelector(selector);

export const $$ = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector));

export function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

export function formatDate(value, options = {}) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options
  }).format(date);
}

export function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;

  if (hours) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
}

export function createId(prefix = "tv") {
  const randomPart =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}-${randomPart}`;
}

export function setText(selector, value, root = document) {
  const element = $(selector, root);

  if (element) {
    element.textContent = String(value ?? "");
  }
}

export function debounce(callback, wait = 250) {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      callback(...args);
    }, wait);
  };
}

export function notify(message, type = "info") {
  let region = $("#tv-notifications");

  if (!region) {
    region = document.createElement("div");
    region.id = "tv-notifications";
    region.className = "notification-region";
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "false");
    document.body.append(region);
  }

  const allowedTypes = new Set(["success", "error", "info"]);
  const safeType = allowedTypes.has(type) ? type : "info";

  const notice = document.createElement("div");
  notice.className = `alert alert-${safeType}`;
  notice.setAttribute("role", "status");
  notice.textContent = String(message ?? "");

  region.append(notice);

  window.setTimeout(() => {
    notice.remove();

    if (!region.childElementCount) {
      region.remove();
    }
  }, 4000);
}

export function readFormData(form) {
  return Object.fromEntries(new FormData(form).entries());
}s