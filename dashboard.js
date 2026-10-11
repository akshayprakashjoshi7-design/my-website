import { storage } from "../utils/storage.js";
import { formatDate, $ , $$ } from "../utils/helpers.js";
import { getCurrentUser } from "./navigation.js";

const DEFAULT_COURSES = [
  {
    id: "web-development",
    title: "Web Development Fundamentals",
    category: "WEB DEVELOPMENT",
    progress: 0
  },
  {
    id: "cybersecurity",
    title: "Cybersecurity Essentials",
    category: "CYBERSECURITY",
    progress: 0
  },
  {
    id: "programming",
    title: "Programming & Developer Tools",
    category: "PROGRAMMING",
    progress: 0
  }
];

function getDashboardState(userId) {
  const saved = storage.get("dashboard-data", null, userId);

  if (saved && typeof saved === "object") {
    return {
      courses: Array.isArray(saved.courses)
        ? saved.courses
        : DEFAULT_COURSES.map((course) => ({ ...course })),

      completedLessons: Math.max(
        0,
        Number(saved.completedLessons) || 0
      ),

      studyMinutes: Math.max(
        0,
        Number(saved.studyMinutes) || 0
      ),

      activities: Array.isArray(saved.activities)
        ? saved.activities
        : []
    };
  }

  const initialState = {
    courses: DEFAULT_COURSES.map((course) => ({ ...course })),
    completedLessons: 0,
    studyMinutes: 0,
    activities: [
      {
        id: "workspace-created",
        title: "Workspace created",
        description: "Your TechVision dashboard is ready to explore.",
        date: new Date().toISOString()
      }
    ]
  };

  storage.set("dashboard-data", initialState, userId);

  return initialState;
}

function calculateProgress(courses) {
  if (!courses.length) return 0;

  const total = courses.reduce((sum, course) => {
    const progress = Math.min(
      100,
      Math.max(0, Number(course.progress) || 0)
    );

    return sum + progress;
  }, 0);

  return Math.round(total / courses.length);
}

function setText(selector, value) {
  const element = $(selector);

  if (element) {
    element.textContent = String(value);
  }
}

function renderUser(user) {
  const name = String(user.name || "Learner").trim();
  const initial = Array.from(name)[0] || "U";

  setText("[data-user-name]", name);
  setText("[data-user-initial]", initial);

  const avatar = $("[data-user-initial]");

  if (avatar) {
    avatar.setAttribute("aria-label", `Profile: ${name}`);
    avatar.title = name;
  }
}

function renderStatistics(state) {
  const progress = calculateProgress(state.courses);
  const studyHours = Math.floor(state.studyMinutes / 60);

  setText("[data-stat='courses']", state.courses.length);
  setText("[data-stat='completed']", state.completedLessons);
  setText("[data-stat='progress']", progress);
  setText("[data-stat='studyHours']", studyHours);

  setText("[data-goal-progress]", `${progress}%`);

  const goalBar = $("[data-goal-bar]");

  if (goalBar) {
    goalBar.style.width = `${progress}%`;
  }
}

function renderCourseProgress(state) {
  const cards = $$(".learning-course");

  cards.forEach((card, index) => {
    const course = state.courses[index];

    if (!course) return;

    const progress = Math.min(
      100,
      Math.max(0, Number(course.progress) || 0)
    );

    const bar = $(".progress-fill", card);
    const percentage = $(".course-progress-row small", card);

    if (bar) {
      bar.style.width = `${progress}%`;
    }

    if (percentage) {
      percentage.textContent = `${progress}%`;
    }
  });
}

function renderActivities(state) {
  const list = $("[data-activity-list]");

  if (!list) return;

  const emptyState = $("[data-activity-empty]", list);

  // Remove previously rendered activity items, keeping the empty state.
  list.querySelectorAll("[data-rendered-activity]").forEach((item) => {
    item.remove();
  });

  const activities = state.activities
    .slice()
    .sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, 5);

  if (emptyState) {
    emptyState.hidden = activities.length > 0;
  }

  activities.forEach((activity) => {
    const item = document.createElement("div");
    item.className = "activity-item";
    item.dataset.renderedActivity = "true";

    const marker = document.createElement("span");
    marker.className = "activity-marker";
    marker.textContent = "•";
    marker.setAttribute("aria-hidden", "true");

    const content = document.createElement("div");

    const title = document.createElement("strong");
    title.textContent = String(activity.title || "Activity");

    const description = document.createElement("p");
    description.textContent = String(activity.description || "");

    content.append(title, description);

    const time = document.createElement("time");
    time.dateTime = String(activity.date || "");

    const parsedDate = new Date(activity.date);

    time.textContent = Number.isNaN(parsedDate.getTime())
      ? "Recently"
      : formatDate(parsedDate);

    item.append(marker, content, time);

    if (emptyState) {
      list.insertBefore(item, emptyState);
    } else {
      list.append(item);
    }
  });
}

function renderDemoNotice(user) {
  const mode = user.mode === "demo" ? "Demo account" : "Demo profile";

  const sidebarNote = $(".sidebar-demo-note strong");

  if (sidebarNote) {
    sidebarNote.textContent = mode;
  }
}

export function initDashboard() {
  const user = getCurrentUser();

  // Dashboard requires an active demo session.
  if (!user || !user.id) {
    window.location.replace("../login.html");
    return;
  }

  renderUser(user);

  const state = getDashboardState(user.id);

  renderStatistics(state);
  renderCourseProgress(state);
  renderActivities(state);
  renderDemoNotice(user);
}