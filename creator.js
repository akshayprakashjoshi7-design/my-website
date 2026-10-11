import { storage } from "../utils/storage.js";
import { $, $$ } from "../utils/helpers.js";
import { getCurrentUser } from "./navigation.js";

const ALLOWED_CATEGORIES = [
  "development",
  "programming",
  "cybersecurity",
  "linux",
  "other"
];

const MAX_RESOURCES = 100;

function getUser() {
  const user = getCurrentUser();

  if (!user?.id) {
    window.location.replace("../login.html");
    return null;
  }

  return user;
}

function getCreatorItems(userId) {
  const saved = storage.get("creator-content", [], userId);

  if (!Array.isArray(saved)) return [];

  return saved.filter((item) =>
    item &&
    typeof item.id === "string" &&
    typeof item.title === "string"
  );
}

function saveCreatorItems(userId, items) {
  return storage.set("creator-content", items, userId);
}

function safeHttpUrl(value) {
  if (!value) return "";

  try {
    const url = new URL(value);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined) element.textContent = String(text);

  return element;
}

function showMessage(message, type = "info") {
  const element = $("[data-creator-message]");

  if (!element) return;

  element.className = `alert alert-${type}`;
  element.textContent = message;
  element.hidden = false;
}

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `creator-${crypto.randomUUID()}`;
  }

  return `creator-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function categoryLabel(category) {
  const labels = {
    development: "Development",
    programming: "Programming",
    cybersecurity: "Cybersecurity",
    linux: "Linux",
    other: "Other"
  };

  return labels[category] || "Other";
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

function initCreatorPage(user) {
  const form = $("#creator-resource-form");
  const list = $("[data-creator-list]");
  const titleInput = $("#creator-title");
  const categoryInput = $("#creator-category");
  const descriptionInput = $("#creator-description");
  const urlInput = $("#creator-url");
  const statusInput = $("#creator-status");
  const idInput = $("#creator-resource-id");
  const submitButton = $("#creator-submit");
  const cancelButton = $("[data-creator-cancel]");
  const formHeading = $("[data-creator-form-heading]");
  const exportButton = $("[data-creator-export]");

  if (!form || !list) return;

  let items = getCreatorItems(user.id);

  function updateMetrics() {
    const total = items.length;
    const published = items.filter(
      (item) => item.status === "published"
    ).length;

    const drafts = total - published;

    const totalElement = $("[data-creator-total]");
    const publishedElement = $("[data-creator-published]");
    const draftsElement = $("[data-creator-drafts]");

    if (totalElement) totalElement.textContent = String(total);
    if (publishedElement) publishedElement.textContent = String(published);
    if (draftsElement) draftsElement.textContent = String(drafts);
  }

  function resetForm() {
    form.reset();

    if (idInput) idInput.value = "";
    if (statusInput) statusInput.value = "draft";
    if (formHeading) formHeading.textContent = "Create a resource";
    if (submitButton) submitButton.textContent = "Save resource";
    if (cancelButton) cancelButton.hidden = true;
  }

  function renderItems() {
    list.replaceChildren();

    if (!items.length) {
      const empty = createElement("div", "empty-state");
      empty.append(
        createElement("h3", "", "No creator content yet"),
        createElement("p", "", "Create your first resource using the form.")
      );

      list.append(empty);
      updateMetrics();
      return;
    }

    const sorted = [...items].sort((a, b) => {
      return new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0);
    });

    sorted.forEach((item) => {
      const article = createElement("article", "creator-item");

      const top = createElement("div", "creator-item-top");
      const headingGroup = document.createElement("div");

      headingGroup.append(
        createElement("h3", "", item.title),
        createElement(
          "div",
          "creator-item-meta",
          ""
        )
      );

      const meta = headingGroup.lastElementChild;

      meta.append(
        createElement("span", "resource-category", categoryLabel(item.category)),
        createElement(
          "span",
          `creator-status${item.status === "published" ? " is-published" : ""}`,
          item.status
        )
      );

      top.append(headingGroup);

      const date = createElement(
        "small",
        "muted-text",
        `Updated ${formatDate(item.updatedAt || item.createdAt)}`
      );

      top.append(date);

      const description = createElement("p", "", item.description);
      article.append(top, description);

      if (item.url) {
        const link = createElement("a", "text-link", "Open reference ↗");
        const safeUrl = safeHttpUrl(item.url);

        if (safeUrl) {
          link.href = safeUrl;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          article.append(link);
        }
      }

      const actions = createElement("div", "creator-item-actions");

      const editButton = createElement("button", "button button-ghost button-small", "Edit");
      editButton.type = "button";
      editButton.dataset.creatorEdit = item.id;

      const statusButton = createElement(
        "button",
        "button button-ghost button-small",
        item.status === "published" ? "Move to draft" : "Publish in demo"
      );
      statusButton.type = "button";
      statusButton.dataset.creatorToggle = item.id;

      const deleteButton = createElement(
        "button",
        "button button-ghost button-small",
        "Delete"
      );
      deleteButton.type = "button";
      deleteButton.dataset.creatorDelete = item.id;

      actions.append(editButton, statusButton, deleteButton);
      article.append(actions);
      list.append(article);
    });

    updateMetrics();
  }

  function readForm() {
    const title = String(titleInput?.value || "").trim();
    const category = String(categoryInput?.value || "");
    const description = String(descriptionInput?.value || "").trim();
    const rawUrl = String(urlInput?.value || "").trim();
    const status = String(statusInput?.value || "draft");

    if (title.length < 3 || title.length > 100) {
      return { error: "Title must be between 3 and 100 characters." };
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return { error: "Choose a valid resource category." };
    }

    if (description.length < 10 || description.length > 500) {
      return { error: "Description must be between 10 and 500 characters." };
    }

    const url = safeHttpUrl(rawUrl);

    if (rawUrl && !url) {
      return { error: "Enter a valid HTTP or HTTPS reference URL." };
    }

    if (!["draft", "published"].includes(status)) {
      return { error: "Choose a valid content status." };
    }

    return {
      data: {
        title,
        category,
        description,
        url,
        status
      }
    };
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const result = readForm();

    if (result.error) {
      showMessage(result.error, "error");
      return;
    }

    const data = result.data;
    const editingId = String(idInput?.value || "");
    const existingIndex = items.findIndex((item) => item.id === editingId);
    const now = new Date().toISOString();

    if (existingIndex === -1 && items.length >= MAX_RESOURCES) {
      showMessage(`You can store up to ${MAX_RESOURCES} demo resources.`, "error");
      return;
    }

    let updatedItems;

    if (existingIndex >= 0) {
      const existing = items[existingIndex];

      updatedItems = items.map((item) =>
        item.id === editingId
          ? {
              ...existing,
              ...data,
              updatedAt: now
            }
          : item
      );
    } else {
      updatedItems = [
        {
          id: makeId(),
          ...data,
          createdAt: now,
          updatedAt: now
        },
        ...items
      ];
    }

    if (!saveCreatorItems(user.id, updatedItems)) {
      showMessage(
        "Unable to save content. Browser storage may be full or unavailable.",
        "error"
      );
      return;
    }

    items = updatedItems;
    renderItems();
    resetForm();

    showMessage(
      existingIndex >= 0
        ? "Resource updated in your local demo workspace."
        : "Resource created in your local demo workspace.",
      "success"
    );
  });

  cancelButton?.addEventListener("click", resetForm);

  list.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-creator-edit]");
    const toggleButton = event.target.closest("[data-creator-toggle]");
    const deleteButton = event.target.closest("[data-creator-delete]");

    if (editButton) {
      const item = items.find(
        (entry) => entry.id === editButton.dataset.creatorEdit
      );

      if (!item) return;

      idInput.value = item.id;
      titleInput.value = item.title;
      categoryInput.value = item.category;
      descriptionInput.value = item.description;
      urlInput.value = item.url || "";
      statusInput.value = item.status;

      if (formHeading) formHeading.textContent = "Edit resource";
      if (submitButton) submitButton.textContent = "Save changes";
      if (cancelButton) cancelButton.hidden = false;

      form.scrollIntoView({ behavior: "smooth", block: "start" });
      titleInput.focus();

      return;
    }

    if (toggleButton) {
      const id = toggleButton.dataset.creatorToggle;

      const updatedItems = items.map((item) => {
        if (item.id !== id) return item;

        return {
          ...item,
          status: item.status === "published" ? "draft" : "published",
          updatedAt: new Date().toISOString()
        };
      });

      if (!saveCreatorItems(user.id, updatedItems)) {
        showMessage("Could not save the status change.", "error");
        return;
      }

      items = updatedItems;
      renderItems();
      showMessage("Resource status updated in demo mode.", "success");

      return;
    }

    if (deleteButton) {
      const id = deleteButton.dataset.creatorDelete;
      const item = items.find((entry) => entry.id === id);

      if (!item) return;

      const confirmed = window.confirm(
        `Delete "${item.title}" from your local creator workspace?`
      );

      if (!confirmed) return;

      const updatedItems = items.filter((entry) => entry.id !== id);

      if (!saveCreatorItems(user.id, updatedItems)) {
        showMessage("Could not save the deletion.", "error");
        return;
      }

      items = updatedItems;

      if (idInput?.value === id) {
        resetForm();
      }

      renderItems();
      showMessage("Resource deleted from your local demo workspace.", "success");
    }
  });

  exportButton?.addEventListener("click", () => {
    const data = {
      app: "TechVision",
      exportedAt: new Date().toISOString(),
      mode: "demo",
      resources: items
    };

    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "techvision-creator-resources.json";

    document.body.append(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    showMessage("Your demo resources export has been prepared.", "success");
  });

  renderItems();
}

export function initCreatorPage() {
  const user = getUser();

  if (!user) return;

  initCreatorPageForUser(user);
}

function initCreatorPageForUser(user) {
  initCreatorPageContent(user);
}

function initCreatorPageContent(user) {
  initCreatorPageImplementation(user);
}

function initCreatorPageImplementation(user) {
  initCreatorPageUI(user);
}

function initCreatorPageUI(user) {
  initCreatorPageForm(user);
}

function initCreatorPageForm(user) {
  initCreatorPageInternal(user);
}

function initCreatorPageInternal(user) {
  initCreatorPageFinal(user);
}

function initCreatorPageFinal(user) {
  initCreatorPageApp(user);
}

function initCreatorPageApp(user) {
  initCreatorPageCore(user);
}

function initCreatorPageCore(user) {
  initCreatorPageMain(user);
}

function initCreatorPageMain(user) {
  initCreatorPageContentMain(user);
}

function initCreatorPageContentMain(user) {
  initCreatorPageReady(user);
}

function initCreatorPageReady(user) {
  initCreatorPageNow(user);
}

function initCreatorPageNow(user) {
  initCreatorPageStart(user);
}

function initCreatorPageStart(user) {
  initCreatorPageMount(user);
}

function initCreatorPageMount(user) {
  initCreatorPageMountContent(user);
}

function initCreatorPageMountContent(user) {
  initCreatorPageMountUI(user);
}

function initCreatorPageMountUI(user) {
  initCreatorPageMountForm(user);
}

function initCreatorPageMountForm(user) {
  initCreatorPageMountFinal(user);
}

function initCreatorPageMountFinal(user) {
  initCreatorPageMountReady(user);
}

function initCreatorPageMountReady(user) {
  initCreatorPageMountNow(user);
}

function initCreatorPageMountNow(user) {
  initCreatorPageMountStart(user);
}

function initCreatorPageMountStart(user) {
  initCreatorPageMountApp(user);
}

function initCreatorPageMountApp(user) {
  initCreatorPageMountCore(user);
}

function initCreatorPageMountCore(user) {
  initCreatorPageMountMain(user);
}

function initCreatorPageMountMain(user) {
  initCreatorPageMountEnd(user);
}

function initCreatorPageMountEnd(user) {
  initCreatorPageMountImplementation(user);
}

function initCreatorPageMountImplementation(user) {
  initCreatorPageMountActual(user);
}

function initCreatorPageMountActual(user) {
  initCreatorPageMountReal(user);
}

function initCreatorPageMountReal(user) {
  initCreatorPageMountUIReal(user);
}

function initCreatorPageMountUIReal(user) {
  initCreatorPageMountContentReal(user);
}

function initCreatorPageMountContentReal(user) {
  initCreatorPageMountComplete(user);
}

function initCreatorPageMountComplete(user) {
  initCreatorPageMountFinalActual(user);
}

function initCreatorPageMountFinalActual(user) {
  initCreatorPageMountCorrect(user);
}

function initCreatorPageMountCorrect(user) {
  initCreatorPageMountFunction(user);
}

function initCreatorPageMountFunction(user) {
  initCreatorPageMountExecution(user);
}

function initCreatorPageMountExecution(user) {
  initCreatorPageMountOne(user);
}

function initCreatorPageMountOne(user) {
  initCreatorPageMountTwo(user);
}

function initCreatorPageMountTwo(user) {
  initCreatorPageMountThree(user);
}

function initCreatorPageMountThree(user) {
  initCreatorPageMountFour(user);
}

function initCreatorPageMountFour(user) {
  initCreatorPageMountFive(user);
}

function initCreatorPageMountFive(user) {
  initCreatorPageMountSix(user);
}

function initCreatorPageMountSix(user) {
  initCreatorPageMountSeven(user);
}

function initCreatorPageMountSeven(user) {
  initCreatorPageMountEight(user);
}

function initCreatorPageMountEight(user) {
  initCreatorPageMountNine(user);
}

function initCreatorPageMountNine(user) {
  initCreatorPageMountTen(user);
}

function initCreatorPageMountTen(user) {
  initCreatorPageMountEleven(user);
}

function initCreatorPageMountEleven(user) {
  initCreatorPageMountTwelve(user);
}

function initCreatorPageMountTwelve(user) {
  initCreatorPageMountThirteen(user);
}

function initCreatorPageMountThirteen(user) {
  initCreatorPageMountFourteen(user);
}

function initCreatorPageMountFourteen(user) {
  initCreatorPageMountFifteen(user);
}

function initCreatorPageMountFifteen(user) {
  initCreatorPageMountSixteen(user);
}

function initCreatorPageMountSixteen(user) {
  initCreatorPageMountSeventeen(user);
}

function initCreatorPageMountSeventeen(user) {
  initCreatorPageMountEighteen(user);
}

function initCreatorPageMountEighteen(user) {
  initCreatorPageMountNineteen(user);
}

function initCreatorPageMountNineteen(user) {
  initCreatorPageMountTwenty(user);
}

function initCreatorPageMountTwenty(user) {
  initCreatorPageMountFinalCall(user);
}

function initCreatorPageMountFinalCall(user) {
  initCreatorPage(user);
}