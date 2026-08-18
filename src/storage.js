export async function loadKey(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw != null) return JSON.parse(raw);
    return fallback;
  } catch {
    return fallback;
  }
}

export async function saveKey(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("storage save failed", key, e);
  }
}

export const SYNC_TIME_KEY = "kept:exportedAt";

export function readExportTime() {
  try {
    return localStorage.getItem(SYNC_TIME_KEY);
  } catch {
    return null;
  }
}

export function writeExportTime(iso) {
  try {
    localStorage.setItem(SYNC_TIME_KEY, iso);
  } catch {
    /* ignore */
  }
}
