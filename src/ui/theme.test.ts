import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  THEMES,
  THEME_STORAGE_KEY,
  currentTheme,
  renderThemeSwitch,
  setTheme,
  storedTheme,
  wireThemeSwitch,
} from "./theme";

const root = document.documentElement;

beforeEach(() => {
  localStorage.clear();
  delete root.dataset.theme;
  document.body.innerHTML = "";
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
});

describe("default", () => {
  it("is light when nothing is stored, whatever the OS colour scheme", () => {
    // ADR 008: the OS dark setting is not followed. Only a stamp changes theme.
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("color-scheme: dark") }));
    expect(storedTheme()).toBeNull();
    expect(currentTheme()).toBe("light");
  });

  it("reports high contrast when the OS asks for it and nothing is stamped", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("prefers-contrast") }));
    expect(currentTheme()).toBe("contrast");
  });

  it("lets an explicit light choice beat the OS contrast request", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("prefers-contrast") }));
    setTheme("light");
    expect(root.dataset.theme).toBe("light");
    expect(currentTheme()).toBe("light");
  });
});

describe("storage", () => {
  it("remembers a choice", () => {
    setTheme("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(storedTheme()).toBe("dark");
  });

  it("ignores a stored value that is not a theme", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "system");
    expect(storedTheme()).toBeNull();
  });

  it("still applies the theme when storage throws", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    setTheme("contrast");
    expect(root.dataset.theme).toBe("contrast");
    spy.mockRestore();
  });
});

describe("switch", () => {
  it("offers the three themes in words, with the current one pressed", () => {
    document.body.innerHTML = renderThemeSwitch("contrast");
    const buttons = [...document.querySelectorAll<HTMLButtonElement>("[data-theme-set]")];
    expect(buttons.map((b) => b.textContent)).toEqual(["Light", "Dark", "High contrast"]);
    expect(buttons.map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", "false", "true"]);
  });

  it("keeps working after the screen is re-rendered", () => {
    // The styleguide bug: listeners attached to the buttons die with them.
    const container = document.createElement("div");
    document.body.appendChild(container);
    const onChange = vi.fn();
    wireThemeSwitch(container, onChange);

    container.innerHTML = renderThemeSwitch("light");
    container.innerHTML = renderThemeSwitch("light");
    container.querySelector<HTMLButtonElement>('[data-theme-set="dark"]')!.click();

    expect(root.dataset.theme).toBe("dark");
    expect(onChange).toHaveBeenCalledWith("dark");
    expect(
      container.querySelector('[data-theme-set="dark"]')!.getAttribute("aria-pressed")
    ).toBe("true");
    expect(
      container.querySelector('[data-theme-set="light"]')!.getAttribute("aria-pressed")
    ).toBe("false");
  });
});

describe("pre-paint script", () => {
  // Each HTML entry stamps the stored theme before first paint with its own
  // copy of the key and the choices. A copy that drifts silently loses the
  // person's choice on load, or flashes the wrong theme — so check every one.
  for (const file of ["index.html", "styleguide.html", "guidelines.html"]) {
    it(`${file} reads the same key and accepts every theme`, () => {
      const html = readFileSync(join(__dirname, "../..", file), "utf8");
      expect(html).toContain(`localStorage.getItem("${THEME_STORAGE_KEY}")`);
      for (const theme of THEMES) expect(html).toContain(`t === "${theme}"`);
      // Before the module script, or it is not before first paint.
      expect(html.indexOf(THEME_STORAGE_KEY)).toBeLessThan(html.indexOf('type="module"'));
    });
  }
});
