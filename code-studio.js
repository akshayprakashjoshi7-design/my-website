
import { getCurrentUser } from "./navigation.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector));

const DEFAULT_HTML = `<main class="card">
  <span class="tag">TECHVISION</span>
  <h1>Hello, Developer!</h1>
  <p>Your coding journey starts here.</p>
  <button id="hello-button">Click me</button>
  <p id="output"></p>
</main>`;

const DEFAULT_CSS = `* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #101827;
  color: #f4f7fb;
  font-family: system-ui, sans-serif;
}

.card {
  max-width: 560px;
  padding: 42px;
  border: 1px solid #334155;
  border-radius: 20px;
  background: #182338;
  text-align: center;
}

.tag {
  color: #60a5fa;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 3px;
}

h1 {
  margin: 18px 0 12px;
}

p {
  color: #cbd5e1;
  line-height: 1.7;
}

button {
  margin-top: 12px;
  padding: 12px 20px;
  border: 0;
  border-radius: 10px;
  background: #3b82f6;
  color: white;
  font-weight: 700;
  cursor: pointer;
}`;

const DEFAULT_JS = `const button = document.querySelector("#hello-button");
const output = document.querySelector("#output");

button.addEventListener("click", () => {
  output.textContent = "Great work! Your JavaScript is running.";
});`;

let currentProjectId = null;
let currentUserKey = "guest";
let storageKey = "techvision:guest:code-studio-projects";
let previewTimer = null;

function getProjectKey() {
  try {
    const user = getCurrentUser();

    if (user) {
      const identity = user.id || user.email || user.username || "user";
      currentUserKey = String(identity).toLowerCase();
    } else {
      currentUserKey = "guest";
    }
  } catch {
    currentUserKey = "guest";
  }

  return `techvision:${currentUserKey}:code-studio-projects`;
}

function readProjects() {
  try {
    const data = localStorage.getItem(storageKey);
    const projects = data ? JSON.parse(data) : [];
    return Array.isArray(projects) ? projects : [];
  } catch {
    showMessage("Could not read saved projects from browser storage.", true);
    return [];
  }
}

function writeProjects(projects) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(projects));
    return true;
  } catch {
    showMessage(
      "Save failed. Browser storage may be full or unavailable.",
      true
    );
    return false;
  }
}

function showMessage(message, isError = false) {
  const element = $("#studio-message");
  if (!element) return;

  element.textContent = message;
  element.style.color = isError ? "#fca5a5" : "#93c5fd";
}

function setEditorStatus(message) {
  const status = $("#editor-status");
  if (status) status.textContent = message;
}

function getEditorValues() {
  return {
    html: $("#html-editor")?.value ?? "",
    css: $("#css-editor")?.value ?? "",
    js: $("#js-editor")?.value ?? ""
  };
}

function setEditorValues(project) {
  $("#html-editor").value = project.html ?? "";
  $("#css-editor").value = project.css ?? "";
  $("#js-editor").value = project.js ?? "";
}

function getProjectName() {
  const input = $("#project-name");
  return input?.value.trim().slice(0, 60) || "Untitled Project";
}

function buildPreviewDocument() {
  const { html, css, js } = getEditorValues();

  // The HTML and scripts are intentionally executed only inside the
  // sandboxed preview iframe. Do not add allow-same-origin to its sandbox.
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${css.replace(/<\/style/gi, "<\\/style")}</style>
</head>
<body>
${html.replace(/<\/body/gi, "<\\/body").replace(/<\/html/gi, "<\\/html")}
<script>
try {
${js.replace(/<\/script/gi, "<\\/script")}
} catch (error) {
  document.body.insertAdjacentHTML(
    "beforeend",
    '<pre style="white-space:pre-wrap;color:#b91c1c;padding:12px"></pre>'
  );
  document.body.lastElementChild.textContent =
    "JavaScript error: " + error.message;
}
<\/script>
</body>
</html>`;
}

function runPreview() {
  const preview = $("#code-preview");
  if (!preview) return;

  try {
    preview.srcdoc = buildPreviewDocument();
    setEditorStatus("Preview updated");
    showMessage("Preview updated successfully.");
  } catch {
    showMessage("Could not build the preview. Check your code.", true);
  }
}

function activateEditor(name) {
  $$("[data-editor-tab]").forEach((button) => {
    const active = button.dataset.editorTab === name;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });

  $$("[data-editor]").forEach((editor) => {
    const active = editor.dataset.editor === name;
    editor.classList.toggle("is-visible", active);
    editor.setAttribute("aria-hidden", String(!active));
  });

  const activeEditor = $(`[data-editor="${name}"]`);
  const label = $(`label[for="${name}-editor"]`);

  if (activeEditor && label) {
    label.textContent = `${name.toUpperCase()} editor`;
  }
}

function createProjectRecord() {
  const now = new Date().toISOString();

  return {
    id: currentProjectId || createId(),
    name: getProjectName(),
    ...getEditorValues(),
    updatedAt: now
  };
}

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `project-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function saveProject() {
  const project = createProjectRecord();
  const projects = readProjects();
  const existingIndex = projects.findIndex((item) => item.id === project.id);

  if (existingIndex >= 0) {
    projects[existingIndex] = project;
  } else {
    projects.unshift(project);
  }

  if (!writeProjects(projects)) return;

  currentProjectId = project.id;
  renderSavedProjects();
  showMessage(`"${project.name}" saved in this browser.`);
  setEditorStatus("Saved locally");
}

function loadProject(id) {
  const project = readProjects().find((item) => item.id === id);
  if (!project) {
    showMessage("That project could not be found.", true);
    return;
  }

  currentProjectId = project.id;
  $("#project-name").value = project.name || "Untitled Project";
  setEditorValues(project);
  runPreview();
  showMessage(`Loaded "${project.name}".`);
}

function deleteProject(id) {
  const project = readProjects().find((item) => item.id === id);
  if (!project) return;

  const approved = window.confirm(`Delete "${project.name}" from this browser?`);
  if (!approved) return;

  const remaining = readProjects().filter((item) => item.id !== id);

  if (!writeProjects(remaining)) return;

  if (currentProjectId === id) currentProjectId = null;

  renderSavedProjects();
  showMessage("Project deleted.");
}

function renderSavedProjects() {
  const container = $("#saved-project-list");
  const count = $("#saved-project-count");
  if (!container || !count) return;

  const projects = readProjects();

  count.textContent = `${projects.length} ${
    projects.length === 1 ? "project" : "projects"
  }`;

  container.replaceChildren();

  if (!projects.length) {
    const empty = document.createElement("p");
    empty.className = "empty-projects";
    empty.textContent = "No saved projects yet. Use Save to create one.";
    container.append(empty);
    return;
  }

  projects.forEach((project) => {
    const card = document.createElement("article");
    card.className = "saved-project-card";

    const title = document.createElement("h3");
    title.textContent = project.name || "Untitled Project";

    const date = document.createElement("p");
    const timestamp = Date.parse(project.updatedAt || "");
    date.textContent = Number.isFinite(timestamp)
      ? `Updated ${new Date(timestamp).toLocaleString()}`
      : "Saved locally";

    const actions = document.createElement("div");
    actions.className = "saved-project-card-actions";

    const loadButton = document.createElement("button");
    loadButton.type = "button";
    loadButton.textContent = "Open";
    loadButton.addEventListener("click", () => loadProject(project.id));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteProject(project.id));

    actions.append(loadButton, deleteButton);
    card.append(title, date, actions);
    container.append(card);
  });
}

function downloadHtml() {
  const name = getProjectName()
    .replace(/[^\w\- ]+/g, "")
    .trim()
    .replace(/\s+/g, "-") || "techvision-project";

  const blob = new Blob([buildPreviewDocument()], {
    type: "text/html;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${name}.html`;
  document.body.append(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  showMessage("Combined HTML preview file downloaded.");
}

function newProject() {
  const hasCode = Object.values(getEditorValues()).some((value) => value.trim());

  if (hasCode && !window.confirm("Start a new project? Save your current work first if needed.")) {
    return;
  }

  currentProjectId = null;
  $("#project-name").value = "Untitled Project";
  setEditorValues({
    html: DEFAULT_HTML,
    css: DEFAULT_CSS,
    js: DEFAULT_JS
  });

  activateEditor("html");
  runPreview();
  showMessage("New project ready. Save it to keep a local copy.");
}

function attachEditorEvents() {
  $$("[data-editor-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      activateEditor(button.dataset.editorTab);
    });
  });

  ["html", "css", "js"].forEach((name) => {
    const editor = $(`#${name}-editor`);
    if (!editor) return;

    editor.addEventListener("input", () => {
      setEditorStatus("Unsaved changes");

      window.clearTimeout(previewTimer);
      previewTimer = window.setTimeout(runPreview, 700);
    });

    editor.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;

      event.preventDefault();

      const start = editor.selectionStart;
      const end = editor.selectionEnd;

      editor.setRangeText("  ", start, end, "end");
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });

  $("#run-code-btn")?.addEventListener("click", runPreview);
  $("#refresh-preview-btn")?.addEventListener("click", runPreview);
  $("#save-project-btn")?.addEventListener("click", saveProject);
  $("#download-project-btn")?.addEventListener("click", downloadHtml);
  $("#new-project-btn")?.addEventListener("click", newProject);
}

export function initCodeStudioPage() {
  if (!$("#code-preview") || !$("#html-editor")) return;

  storageKey = getProjectKey();

  attachEditorEvents();
  activateEditor("html");
  renderSavedProjects();
  runPreview();
}
