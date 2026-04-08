const DEFAULT_DESKTOP_API_ORIGIN = "http://127.0.0.1:4000";
const STARTUP_RETRY_COUNT = 60;
const STARTUP_RETRY_DELAY_MS = 250;

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function isDesktopApp() {
  return "__TAURI_INTERNALS__" in window;
}

export function getApiBase() {
  const configured = import.meta.env.VITE_API_BASE?.trim();
  if (configured) {
    return trimTrailingSlash(configured);
  }

  return isDesktopApp() ? `${DEFAULT_DESKTOP_API_ORIGIN}/api` : "/api";
}

export async function fetchWithDesktopRetry(input: string, init?: RequestInit) {
  const attempts = isDesktopApp() ? STARTUP_RETRY_COUNT : 1;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fetch(input, init);
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) {
        break;
      }

      await wait(STARTUP_RETRY_DELAY_MS);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Network request failed");
}
