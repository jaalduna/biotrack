import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

Element.prototype.hasPointerCapture = () => false;
Element.prototype.setPointerCapture = () => {};
Element.prototype.releasePointerCapture = () => {};
Element.prototype.scrollIntoView = () => {};

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Clean up localStorage after each test
afterEach(() => {
  localStorageMock.clear();
});

// Mock window.__RUNTIME_CONFIG__
Object.defineProperty(window, "__RUNTIME_CONFIG__", {
  value: {
    API_BASE_URL: "http://localhost:8000/api/v1",
  },
  writable: true,
});
