/**
 * Safe wrappers for localStorage and sessionStorage to prevent security exceptions 
 * inside cross-origin sandboxed iframes (like the AI Studio Preview panel).
 */

export const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      return typeof window !== 'undefined' ? sessionStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(key, value);
      }
    } catch (err) {
      console.warn("Storage item write blocked by sandbox constraints:", err);
    }
  },
  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(key);
      }
    } catch (err) {
      console.warn("Storage item removal blocked by sandbox constraints:", err);
    }
  }
};

export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (err) {
      console.warn("Storage item write blocked by sandbox constraints:", err);
    }
  },
  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (err) {
      console.warn("Storage item removal blocked by sandbox constraints:", err);
    }
  }
};
