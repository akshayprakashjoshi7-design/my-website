import { storage } from "../utils/storage.js";
import { $, $$ } from "../utils/helpers.js";
import { getCurrentUser } from "./navigation.js";

const BUILT_IN_RESOURCES = [
  {
    id: "resource-mdn-html",
    title: "MDN Web Docs",
    category: "development",
    description: "HTML, CSS, JavaScript aur web platform ke liye detailed developer documentation.",
    url: "https://developer.mozilla.org/",
    icon: "</>",
    source: "Official documentation"
  },
  {
    id: "resource-javascript",
    title: "JavaScript Guide",
    category: "programming",
    description: "JavaScript syntax, functions, objects, modules aur language fundamentals.",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    icon: "JS",
    source: "Official documentation"
  },
  {
    id: "resource-git",
    title: "Git Documentation",
    category: "programming",
    description: "Version control, repositories, commits, branches aur Git commands seekho.",
    url: "https://git-scm.com/doc",
    icon: "⑂",
    source: "Official documentation"
  },
  {
    id: "resource-python",
    title: "Python Documentation",
    category: "programming",
    description: "Python tutorial, standard library aur language reference.",
    url: "https://docs.python.org/3/",
    icon: "Py",
    source: "Official documentation"
  },
  {
    id: "resource-linux",
    title: "Linux Journey",
    category: "linux",
    description: "Linux command line, permissions, processes aur operating system fundamentals.",
    url: "https://linuxjourney.com/",
    icon: "$_",
    source: "Learning reference"
  },
  {
    id: "resource-kali",
    title: "Kali Linux Documentation",
    category: "cybersecurity",
    description: "Kali Linux installation, configuration aur authorized security lab guidance.",
    url: "https://www.kali.org/docs/",
    icon: "K",
    source: "Official documentation"
  },
  {
    id: "resource-owasp",
    title: "OWASP Top 10",
    category: "cybersecurity",
    description: "Common web application security risks aur defensive mitigation concepts.",
    url: "https://owasp.org/www-project-top-ten/",
    icon: "⬡",
    source: "Security reference"
  },
  {
    id: "resource-nmap",
    title: "Nmap Reference Guide",
    category: "cybersecurity",
    description: "Network discovery aur security auditing tool ke documented features. Sirf authorized labs par practice karein.",
    url: "https://nmap.org/book/man.html",
    icon: "N",
    source: "Official documentation"
  },
  {
    id: "resource-gitHub",
    title: "GitHub Docs",
    category: "development",
    description: "Repositories, issues, pull requests aur collaborative development workflows.",
    url: "https://docs.github.com/",
    icon: "GH",
    source: "Official documentation"
  }
];

function getUser() {
  const user = getCurrentUser();

  if (!user?.id) {
    window.location.replace("../login.html");
    return null;
  }

  return user;
}

function getBookmarks(userId) {
  const saved = storage.get("resource-bookmarks", [], userId);

  return Array.isArray(saved)
    ? saved.filter((id) => typeof id === "string")
    : [];
}

function getCreatorResources(userId) {
  const saved = storage.get("creator-content", [], userId);

  if (!Array.isArray(saved)) return [];

  return saved
    .filter((item) => item && item.status === "published")
    .map((item) => ({
      id: String(item.id),
      title: String(item.title || "Untitled resource"),
      category: String(item.category || "other"),
      description: String(item.description || ""),
      url: String(item.url || ""),
      icon: "✎",
      source: "Community demo content",
      creator: true
    }));
}

function getAllResources(userId) {
  return [
    ...BUILT_IN_RESOURCES,
    ...getCreatorResources(userId)
  ];
}

function safeHttpUrl(value) {
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

function formatCategory(value) {
  const labels = {
    development: "Development",
    programming: "Programming",
    cybersecurity: "Cybersecurity",
    linux: "Linux",
    other: "Other"
  };

  return labels[value] || "Other";
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined) element.textContent = String(text);

  return element;
}

function showMessage(message, type = "info") {
  const element = $("[data-resource-message]");

  if (!element) return;

  element.className = `alert alert-${type}`;
  element.textContent = message;
  element.hidden = false;
}

function initResources(user) {
  const searchInput = $("#resource-search");
  const grid = $("[data-resource-grid]");
  const emptyState = $("[data-resource-empty]");
  const resetButton = $("[data-resource-reset]");
  const countElement = $("[data-resource-count]");
  const savedContainer = $("[data-saved-resources]");
  const filterButtons = $$("[data-resource-filter]");

  if (!grid) return;

  let activeCategory = "all";
  let resources = getAllResources(user.id);
  let bookmarks = getBookmarks(user.id);

  function saveBookmarks() {
    return storage.set("resource-bookmarks", bookmarks, user.id);
  }

  function renderCard(resource) {
    const card = createElement("article", "resource-card");
    card.dataset.resourceCard = "";
    card.dataset.resourceId = resource.id;
    card.dataset.category = resource.category;

    const top = createElement("div", "resource-card-top");
    const icon = createElement("span", "resource-type-icon", resource.icon || "R");
    icon.setAttribute("aria-hidden", "true");

    const category = createElement(
      "span",
      "resource-category",
      formatCategory(resource.category)
    );

    top.append(icon, category);

    const title = createElement("h3", "", resource.title);
    const description = createElement("p", "", resource.description);

    const actions = createElement("div", "resource-card-actions");
    const safeUrl = safeHttpUrl(resource.url);

    if (safeUrl) {
      const openLink = createElement("a", "button button-primary", "Open resource ↗");
      openLink.href = safeUrl;
      openLink.target = "_blank";
      openLink.rel = "noopener noreferrer";
      actions.append(openLink);
    } else {
      const unavailable = createElement("span", "muted-text", "No external link");
      actions.append(unavailable);
    }

    const bookmarkButton = createElement(
      "button",
      "button button-ghost resource-bookmark",
      bookmarks.includes(resource.id) ? "★" : "☆"
    );

    bookmarkButton.type = "button";
    bookmarkButton.dataset.bookmarkId = resource.id;
    bookmarkButton.setAttribute(
      "aria-pressed",
      String(bookmarks.includes(resource.id))
    );
    bookmarkButton.setAttribute(
      "aria-label",
      bookmarks.includes(resource.id)
        ? `Remove ${resource.title} from saved resources`
        : `Save ${resource.title}`
    );
    bookmarkButton.title = bookmarks.includes(resource.id)
      ? "Remove bookmark"
      : "Save resource";

    actions.append(bookmarkButton);
    card.append(top, title, description, actions);

    return card;
  }

  function renderGrid() {
    resources = getAllResources(user.id);

    const query = String(searchInput?.value || "")
      .trim()
      .toLowerCase();

    const visibleResources = resources.filter((resource) => {
      const categoryMatches =
        activeCategory === "all" ||
        resource.category === activeCategory;

      const searchText = [
        resource.title,
        resource.description,
        resource.category,
        resource.source
      ].join(" ").toLowerCase();

      return categoryMatches &&
        (!query || searchText.includes(query));
    });

    grid.replaceChildren();

    visibleResources.forEach((resource) => {
      grid.append(renderCard(resource));
    });

    if (emptyState) {
      emptyState.hidden = visibleResources.length > 0;
    }

    if (countElement) {
      countElement.textContent = String(resources.length);
    }

    renderSavedResources();
  }

  function renderSavedResources() {
    if (!savedContainer) return;

    savedContainer.replaceChildren();

    const savedResources = resources.filter((resource) =>
      bookmarks.includes(resource.id)
    );

    if (!savedResources.length) {
      savedContainer.append(
        createElement("p", "muted-text", "You haven't saved any resources yet.")
      );
      return;
    }

    savedResources.forEach((resource) => {
      const row = createElement("article", "saved-resource-item");
      const content = document.createElement("div");

      content.append(
        createElement("h3", "", resource.title),
        createElement(
          "p",
          "muted-text",
          `${formatCategory(resource.category)} · ${resource.source}`
        )
      );

      const removeButton = createElement(
        "button",
        "button button-ghost button-small",
        "Remove"
      );

      removeButton.type = "button";
      removeButton.dataset.removeBookmark = resource.id;

      row.append(content, removeButton);
      savedContainer.append(row);
    });
  }

  searchInput?.addEventListener("input", renderGrid);

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.resourceFilter || "all";

      filterButtons.forEach((item) => {
        const selected = item === button;

        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-pressed", String(selected));
      });

      renderGrid();
    });
  });

  resetButton?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";

    activeCategory = "all";

    filterButtons.forEach((button) => {
      const selected = button.dataset.resourceFilter === "all";

      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    renderGrid();
  });

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-bookmark-id]");

    if (!button) return;

    const id = button.dataset.bookmarkId;

    if (bookmarks.includes(id)) {
      bookmarks = bookmarks.filter((item) => item !== id);
    } else {
      bookmarks.push(id);
    }

    const saved = saveBookmarks();

    renderGrid();

    showMessage(
      saved
        ? "Your saved resources have been updated."
        : "Browser storage is unavailable. The bookmark may not persist.",
      saved ? "success" : "error"
    );
  });

  savedContainer?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-bookmark]");

    if (!button) return;

    bookmarks = bookmarks.filter(
      (id) => id !== button.dataset.removeBookmark
    );

    const saved = saveBookmarks();

    renderGrid();

    showMessage(
      saved ? "Bookmark removed." : "Could not persist the bookmark change.",
      saved ? "success" : "error"
    );
  });

  renderGrid();
}

export function initResourcesPage() {
  const user = getUser();

  if (!user) return;

  initResources(user);
}