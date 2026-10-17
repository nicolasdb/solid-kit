# ADR 008 — Light by default; dark and high contrast by choice

**Status:** accepted, amended 17 Oct 2026 (see the end) · **Applies to:** apps built from the kit

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

## Amendment — 17 Oct 2026: the device decides only when asked to

The Solid Kit design system (`design/`) consolidated the kit, the backoffice
and the portfolio onto one switch, the backoffice's. What changed:

- **The switch is one icon button cycling Light → Dark → Same as this
  device** (`renderThemeButton`). Its label names the current choice and the
  action ("Theme: dark. Change it"). The three words gave way because
  "same as this device" is the choice the backoffice's people were asking for,
  and a fourth word would make the switch a list to study.
- **Light is still the default for everyone**, and is now stamped
  `data-theme="light"` in the HTML itself. Choosing Light clears the stored
  value instead of storing "light".
- **"Same as this device" is resolved in the blocking first-paint script**,
  not in CSS. It reads `prefers-contrast: more` first, then
  `prefers-color-scheme: dark`, stamps `contrast`, `dark` or `light`, and
  follows changes while the page is open. So each theme's values live once,
  in `theme.css`: there is no `prefers-color-scheme` block and no
  `prefers-contrast` copy of the contrast theme. The audit refuses both in
  `theme.css` (a skin may still carry the contrast copy, complete and in
  agreement).
- **High contrast leaves the cycle.** It is what "same as this device" gives a
  person whose system asks for more contrast. Contrast is asked first: someone
  who asked for more contrast on a dark system gets High contrast, the one
  theme built to be read by outline alone.

Consequences, beyond those above:

- A person whose system asks for more contrast now sees Light until they pick
  "same as this device". Before, the OS signal applied with no choice made.
  Someone who wants High contrast without changing a system setting has no way
  to get it; if that turns out to matter, it is a fourth step in the cycle, not
  a CSS media query.
- A stored "contrast", from the three-word switch, is no longer a choice and
  reads as Light. The key (`solid-kit:theme`) is unchanged, so "dark" carries
  over.
- The first-paint script holds a copy of the key, the choices and the
  resolution. `theme.test.ts` runs every entry's copy against the same cases
  as `theme.ts`.
