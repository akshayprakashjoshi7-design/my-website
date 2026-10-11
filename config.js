export const APP_CONFIG = Object.freeze({
  name: "TechVision",
  tagline: "Learn. Build. Secure. Create.",
  demoMode: true,
  apiBaseUrl: "",
  storagePrefix: "techvision",
  defaultTheme: "dark",

  routes: Object.freeze({
    home: "index.html",
    login: "login.html",
    signup: "signup.html",
    dashboard: "pages/dashboard.html",
    academy: "pages/academy.html",
    resources: "pages/resources.html",
    codeStudio: "pages/code-studio.html",
    terminal: "pages/terminal.html",
    repositories: "pages/repositories.html",
    notepad: "pages/notepad.html",
    assistant: "pages/assistant.html",
    cybersecurity: "pages/cybersecurity.html",
    profile: "pages/profile.html",
    settings: "pages/settings.html"
  })
});

export function getApiUrl(path) {
  if (!APP_CONFIG.apiBaseUrl) {
    throw new Error(
      "Backend API is not configured. This feature is unavailable in demo mode."
    );
  }

  const base = APP_CONFIG.apiBaseUrl.replace(/\/+$/, "");
  const endpoint = String(path).replace(/^\/+/, "");

  return `${base}/${endpoint}`;
}