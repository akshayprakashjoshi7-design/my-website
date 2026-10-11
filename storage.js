import { APP_CONFIG } from "../config.js";

const memoryStore = new Map();

function currentUserId() {
  try {
    const raw = sessionStorage.getItem(
      `${APP_CONFIG.storagePrefix}:session:current-user`
    );

    if (!raw) return "guest";

    const user = JSON.parse(raw);
    return user?.id || user?.email || "guest";
  } catch {
    return "guest";
  }
}

function makeKey(key, userId = currentUserId()) {
  const safeUser = String(userId).replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeKey = String(key).replace(/[^a-zA-Z0-9_.-]/g, "_");

  return `${APP_CONFIG.storagePrefix}:${safeUser}:${safeKey}`;
}

export const storage = {
  get(key, fallback = null, userId) {
    const storageKey = makeKey(key, userId);

    try {
      const raw = localStorage.getItem(storageKey);

      if (raw !== null) {
        return JSON.parse(raw);
      }
    } catch {
      // Fall through to in-memory storage.
    }

    return memoryStore.has(storageKey)
      ? memoryStore.get(storageKey)
      : fallback;
  },

  set(key, value, userId) {
    const storageKey = makeKey(key, userId);

    memoryStore.set(storageKey, value);

    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key, userId) {
    const storageKey = makeKey(key, userId);

    memoryStore.delete(storageKey);

    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Storage may be disabled by the browser.
    }
  },

  clearUser(userId) {
    const prefix = makeKey("", userId);

    for (const key of memoryStore.keys()) {
      if (key.startsWith(prefix)) {
        memoryStore.delete(key);
      }
    }

    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);

        if (key?.startsWith(prefix)) {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // Best-effort cleanup.
    }
  }
};

export function sessionGet(key, fallback = null) {
  try {
    const raw = sessionStorage.getItem(
      `${APP_CONFIG.storagePrefix}:session:${key}`
    );

    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function sessionSet(key, value) {
  try {
    sessionStorage.setItem(
      `${APP_CONFIG.storagePrefix}:session:${key}`,
      JSON.stringify(value)
    );

    return true;
  } catch {
    return false;
  }
}

export function sessionRemove(key) {
  try {
    sessionStorage.removeItem(
      `${APP_CONFIG.storagePrefix}:session:${key}`
    );
  } catch {
    // Storage may be disabled.
  }
}