# ADR 008 — Light by default; dark and high contrast by choice

**Status:** accepted · **Applies to:** apps built from the kit

## Context

The kit followed the operating system: `prefers-color-scheme: dark` switched an
app to the ink theme with no action from the person, and `[data-theme]` let a
toggle override it. That is the convention of developer tools, and it was
inherited from them rather than chosen.

These apps address everyday people, not developers. For most of them a dark
screen is not a preference they expressed. It is a side effect of a phone
setting chosen for some other reason, and the light paper ground is the calmer
of the two. The source palette also failed two checks in daylight that its
brand values could not absorb: `--warn` at 3.5:1 and `--border` at 1.2:1 on
`--surface`.

## Decision

- **Light for everyone, by default.** `theme.css` defines light on bare
  `:root` and has no `prefers-color-scheme: dark` block. The audit refuses one.
- **Dark and High contrast are choices**, made with a visible three-word switch
  (`src/ui/theme.ts`: "Light", "Dark", "High contrast") and remembered per
  origin under `solid-kit:theme`. That key is shared on purpose, unlike
  `SESSION_ID`: someone who needs high contrast in one app needs it in the next.
- **The choice is stamped before first paint** by an inline script in each HTML
  entry, so a dark choice never flashes light. The test reads those scripts to
  keep them in step with `theme.ts`.
- **One OS signal is followed:** `prefers-contrast: more` selects High contrast
  while no choice is stamped. That person asked their system for exactly this.
  An explicit "Light" still wins.
- **High contrast is an added theme, not a re-tint.** Every text token reaches
  7:1 (AAA) on every surface, and every border and line reaches 3:1, so
  outlines alone delimit controls. Daylight's `--warn` and `--border` stay
  exact as the family's brand values, and the readable versions live here.
  `npm run audit` enforces both floors.

## Consequences

- A person on a dark phone sees a light app until they choose otherwise. That
  is intended. The switch sits at the foot of every shell screen, so the
  choice is never more than a scroll away.
- `color-scheme` is `light` on `:root` and `dark` only under
  `[data-theme="dark"]`, so form controls and scrollbars follow the chosen
  theme, not the OS.
- An app that wants the old behaviour has to reverse this ADR, not add a media
  query. The audit catches the media query.
