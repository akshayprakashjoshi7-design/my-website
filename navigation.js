import {
  storage,
  sessionGet,
  sessionRemove
} from "../utils/storage.js";

import { notify } from "../utils/helpers.js";

export function getCurrentUser() {
  return sessionGet("current-user", null);
}

export function applyTheme(theme) {
  const safeTheme = theme === "light" ? "light" : "dark";

  document.documentElement.dataset.theme = safeTheme;

  const themeButtons = document.querySelectorAll("[data-theme-toggle]");

  themeButtons.forEach((button) => {
    button.setAttribute(
      "aria-label",
      safeTheme === "dark"
        ? "Switch to light theme"
        : "Switch to dark theme"
    );

    button.setAttribute("aria-pressed", String(safeTheme === "light"));
    button.textContent = safeTheme === "dark" ? "☀" : "☾";
  });

  return safeTheme;
}

export function initTheme() {
  const preferences = storage.get("preferences", {});
  const initialTheme = preferences.theme || "dark";

  applyTheme(initialTheme);

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const currentTheme =
        document.documentElement.dataset.theme || "dark";

      const nextTheme = currentTheme === "dark" ? "light" : "dark";

      applyTheme(nextTheme);

      const updatedPreferences = {
        ...storage.get("preferences", {}),
        theme: nextTheme
      };

      storage.set("preferences", updatedPreferences);
      notify(`Theme changed to ${nextTheme} mode.`, "success");
    });
  });
}

export function initMobileNavigation() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");

  if (!toggle || !nav) return;

  const closeMenu = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");

    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

export function initActiveNavigation() {
  const currentPath = window.location.pathname.replace(/\/+$/, "");

  document.querySelectorAll("[data-nav] a[href]").forEach((link) => {
    try {
      const target = new URL(link.href, window.location.href);
      const targetPath = target.pathname.replace(/\/+$/, "");

      if (targetPath === currentPath) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    } catch {
      // Ignore invalid links.
    }
  });
}

export function initLogout() {
  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", () => {
      sessionRemove("current-user");

      const depth = Number(document.body.dataset.depth || 0);
      const prefix = depth > 0 ? "../".repeat(depth) : "";

      window.location.href = `${prefix}login.html`;
    });
  });
}