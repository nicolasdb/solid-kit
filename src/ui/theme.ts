/**
 * The theme switch: Light by default for everyone, Dark and High contrast by
 * explicit choice. See ADR 008.
 *
 * The operating system's dark setting is deliberately NOT followed. These apps
 * address everyday people, for whom dark-by-default is a developer habit rather
 * than a preference, and the light paper ground is the calmer of the two. The
 * one OS signal that is honoured is `prefers-contrast: more`, and that is done
 * in theme.css, not here: it applies only while no choice is stored, so the
 * switch can still override it.
 *
 * The choice is stamped on `<html data-theme>` BEFORE first paint by an inline
 * script in each HTML entry (index, styleguide, guidelines) — a module script
 * runs too late, and a dark choice would flash light on every load. That script
 * duplicates `THEME_STORAGE_KEY` and the list of choices by necessity; the test
 * reads the HTML files to keep the copies in step.
 */

export const THEMES = ["light", "dark", "contrast"] as const;

export type Theme = (typeof THEMES)[number];

/** Plain words, not "Ink" and "Daylight": the switch is for everyone. */
export const THEME_LABELS: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  contrast: "High contrast",
};

/**
 * Shared by every app on one origin, on purpose — unlike SESSION_ID. Someone
 * who needs high contrast in one app needs it in the next one too.
 */
export const THEME_STORAGE_KEY = "solid-kit:theme";

const isTheme = (value: unknown): value is Theme =>
  typeof value === "string" && (THEMES as readonly string[]).includes(value);

/** The stored choice, or null when none was made (or storage is unavailable). */
export function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * The theme on screen right now. With no stamp that is Light — or High
 * contrast if the OS asks for more contrast, which theme.css honours on its own.
 */
export function currentTheme(root: HTMLElement = document.documentElement): Theme {
  const stamped = root.dataset.theme;
  if (isTheme(stamped)) return stamped;
  return matchMedia?.("(prefers-contrast: more)").matches ? "contrast" : "light";
}

/** Applies and remembers a choice. An explicit "light" is stamped too, so it beats the OS contrast setting. */
export function setTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage unavailable: the theme still applies for this page view.
  }
}

/**
 * The switch: three pressed-state buttons in a labelled group. Text, not icons
 * — a sun and a moon say nothing about high contrast, and a person looking for
 * it should be able to read the word.
 */
export function renderThemeSwitch(current: Theme = currentTheme()): string {
  return `
    <div class="theme-switch" role="group" aria-label="Theme">
      ${THEMES.map(
        (theme) => `
        <button type="button" class="ghost" data-theme-set="${theme}"
                aria-pressed="${theme === current}">${THEME_LABELS[theme]}</button>`
      ).join("")}
    </div>`;
}

/**
 * Wires every switch inside `container`, once, by delegation — screens replace
 * their DOM on each render, and listeners attached to the buttons themselves
 * would be lost with them (the styleguide learned this the hard way).
 *
 * The pressed state is updated in place, so a screen does not have to re-render
 * for it; `onChange` is for the screens that must (the styleguide recomputes
 * its contrast figures).
 */
export function wireThemeSwitch(container: HTMLElement, onChange?: (theme: Theme) => void): void {
  container.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-theme-set]");
    if (!button || !isTheme(button.dataset.themeSet)) return;

    const theme = button.dataset.themeSet;
    setTheme(theme);
    container.querySelectorAll<HTMLButtonElement>("[data-theme-set]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.themeSet === theme));
    });
    onChange?.(theme);
  });
}
