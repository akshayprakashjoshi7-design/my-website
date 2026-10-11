import {
  initTheme,
  initMobileNavigation,
  initActiveNavigation,
  initLogout
} from "./modules/navigation.js";

import { $ } from "./utils/helpers.js";

const page = document.body.dataset.page || "home";

const pageModules = {
  login: () => import("./modules/auth.js"),
  signup: () => import("./modules/auth.js"),
  forgotPassword: () => import("./modules/auth.js"),

  dashboard: () => import("./modules/dashboard.js"),
  academy: () => import("./modules/courses.js"),
  courseDetails: () => import("./modules/courses.js"),
  progress: () => import("./modules/progress.js"),

  resources: () => import("./modules/resources.js"),
  creator: () => import("./modules/creator.js"),

  codeStudio: () => import("./modules/code-studio.js"),
  terminal: () => import("./modules/terminal.js"),
  repositories: () => import("./modules/repositories.js"),
  notepad: () => import("./modules/notepad.js"),

  assistant: () => import("./modules/assistant.js"),
  cybersecurity: () => import("./modules/cybersecurity.js"),
  profile: () => import("./modules/profile.js"),
  settings: () => import("./modules/settings.js")
};

async function initializePage() {
  initTheme();
  initMobileNavigation();
  initActiveNavigation();
  initLogout();

  const yearElement = $("[data-current-year]");

  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }

  const loadModule = pageModules[page];

  if (!loadModule) {
    return;
  }

  try {
    const module = await loadModule();

    if (typeof module.initAuthPage === "function") {
      module.initAuthPage(page);
    } else if (typeof module.initDashboard === "function") {
      module.initDashboard();
    } else if (typeof module.initCoursesPage === "function") {
      module.initCoursesPage(page);
    } else if (typeof module.initProgressPage === "function") {
      module.initProgressPage();
    } else if (typeof module.initResourcesPage === "function") {
      module.initResourcesPage();
    } else if (typeof module.initCreatorPage === "function") {
      module.initCreatorPage();
    } else if (typeof module.initCodeStudio === "function") {
      module.initCodeStudio();
    } else if (typeof module.initTerminal === "function") {
      module.initTerminal();
    } else if (typeof module.initRepositories === "function") {
      module.initRepositories();
    } else if (typeof module.initNotepad === "function") {
      module.initNotepad();
    } else if (typeof module.initAssistant === "function") {
      module.initAssistant();
    } else if (typeof module.initCybersecurity === "function") {
      module.initCybersecurity();
    } else if (typeof module.initProfile === "function") {
      module.initProfile();
    } else if (typeof module.initSettings === "function") {
      module.initSettings();
    }
  } catch (error) {
    console.error(`TechVision page initialization failed (${page}):`, error);

    const errorRegion = $("[data-page-error]");

    if (errorRegion) {
      errorRegion.hidden = false;
      errorRegion.textContent =
        "This page module is not available yet. Continue with the next development batch.";
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePage, {
    once: true
  });
} else {
  initializePage();
}