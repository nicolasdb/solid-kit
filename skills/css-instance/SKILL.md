---
name: css-instance
description: Give a Community Solid Server instance its own look and words — welcome, log in, sign up, password reset, OIDC consent, account, create pod, session recovery, public .md pages — without forking the server. Use when starting a new CSS instance (a provider, a collective's server such as Maps of Making), restyling one, rewriting its identity-page copy, or after a CSS image bump. Applies solid-kit's templates/css-instance overlay with a per-instance skin, checks it with the skin audit and a local smoke run, and deploys it as bind mounts.
---

# CSS instance — a stock server, one skin

A CSS instance's identity pages are where a person first meets their pod. This
skill gives an instance its own pages while CSS stays a **stock image**: the
generic overlay in [`templates/css-instance/`](../../templates/css-instance/README.md)
is bind-mounted over CSS's templates, and only a **skin** (colours, fonts, mark)
and the **words** belong to the instance. Why it is built this way:
[ADR 009](../../docs/adr/009-css-instance-is-a-skin-over-stock.md).

Instance 1 is pod.nicolasdb.eu (pocpod0). Read its `infra/css/` when in doubt:
it is the worked example, deployed.

## Invariants — no instance breaks these

1. **Copy only on CSS's pages.** Every id, `name`, `class` the scripts use and
   every script line stays stock. CSS's own client code drives these forms;
   change a word, never a hook. The documented exceptions are in each file's
   header (consent, create-pod, account) — add one only with the same kind of
   header.
2. **What comes from outside goes in as text.** An app's name, a client ID, a
   server error, a WebID: `textContent`, never `innerHTML` or a template
   string into markup. Stock CSS gets this wrong on consent; ours does not.
3. **Light is the default.** Dark and High contrast only behind
   `<html data-theme>`, stamped before first paint by `pod-ui.js`; no
   `prefers-color-scheme: dark`; `prefers-contrast: more` only while no
   choice is stored (solid-kit ADR 008). Same storage key as the kit.
4. **The complete slot set in every theme**, text at 4.5:1 (7:1 in High
   contrast), `--border-control` at 3:1. The audit decides, not the eye.
5. **No third-party request.** Fonts are self-hosted woff2 in the skin.
6. **A WebID is never parsed for logic.** Splitting one for display (consent)
   is fine; deriving anything from the split is not.
7. **Never edit `main.css` or `pod-ui.js` for one instance.** If an instance
   needs something they cannot do, change the template in solid-kit, for
   every instance — or the next copy silently loses it.

## The method, in order

### 1. Draft the look before the code (recommended)

On a Claude Design canvas with the instance's design system: tokens sheet,
log in, consent, a states board (focus, error, disabled, loading, +30 % copy),
then the other pages, desktop and 360 px. Render the **real markup** — the
`markup/` captures of the instance's pages — so only the CSS and the words
vary. pocpod0's canvas "CSS instance — Pod" is the model. Decide the copy
there, in a "stock vs proposed" table.

### 2. Copy the overlay

```sh
cp -r solid-kit/templates/css-instance/css/.            <instance>/infra/css/
cp    solid-kit/templates/css-instance/skins/pod/skin.css <instance>/infra/css/skin.css
cp -r solid-kit/templates/css-instance/skins/pod/fonts  <instance>/infra/css/fonts
cp    solid-kit/templates/css-instance/scripts/check-css-overrides.sh <instance>/scripts/
echo "solid-kit templates/css-instance @ $(git -C solid-kit rev-parse --short HEAD)" > <instance>/infra/css/SOURCE
```

Start from the `pod` skin even for a very different look: it is complete and
passes, so every step after this is a change you can audit.

### 3. The skin

Edit `skin.css` slot by slot (names and meanings: solid-kit `src/styles/core.css`
and the design system's tokens). Replace the fonts in `fonts/` and the
`@font-face` lines; keep the three roles (`--font-heading`, `--font-body`,
`--font-mono`). Then, in solid-kit:

```sh
npm run audit -- --skin <instance>/infra/css/skin.css
```

until it passes. A brand colour that fails as text (a riso red on paper) stays
for marks, borders and 24 px+ type; give text a darker sibling slot.

A paper-only skin has no dark look: keep the dark block with the Daylight
values, or remove the "Dark" button (`INSTANCE: theme switch`).

### 4. The words

`grep -rn "INSTANCE:" <instance>/infra/css` lists the chrome and the welcome
page. Then the copy of each page in `templates/identity/**`, from the table
decided in step 1. Plain words, second person, sentence case, every error with
a way forward (solid-kit `docs/ux-principles.md`). The page's first `<h1>`
becomes the tab title (`extractTitle`), so keep the `<h1>` first; a header
comment uses `-%>` so no newline comes before it.

### 5. Wire it

The mounts and the doc-view entries: `templates/css-instance/README.md`, as
is. Then baseline the overrides against the instance's image:

```sh
scripts/check-css-overrides.sh --rebaseline solidproject/community-server:<version>
```

### 6. Run it locally — before any deploy

```sh
templates/css-instance/test/try-local.sh <instance>/infra/css 3123
TRY_CSS_DIR=<printed dir> node templates/css-instance/test/smoke.mjs http://localhost:3123 /tmp/shots
```

All checks green, **then look at the screenshots** — a check passes on a page
that is still wrong. If playwright's browser is missing, set `CHROMIUM_PATH`.

### 7. Deploy and verify

Deploy the mounts (the instance's own deploy), copy the welcome page into the
data volume, then `scripts/check-css-overrides.sh '' https://<instance>` and
the "Identity pages of a CSS instance" section of solid-kit's
`docs/manual-tests.md` — stale sign-in and a real app's consent are not
covered by the smoke run.

## After a CSS image bump

`scripts/check-css-overrides.sh <new image>`: every override whose stock file
changed is listed. Diff stock against ours, merge, rebaseline, then step 6.
