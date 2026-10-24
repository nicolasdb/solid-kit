# ADR 011 — An app is one image; an instance brings its config and its look

**Status:** proposed 2026-10-24, to deliberate · **Applies to:** every app built
from the kit that an instance deploys (solid-backoffice first), solid-css-overlay
(already this shape), and every vertical that dresses them (Maps of Making
first)

## Context

ADR 010 settles that account features run only same-site: Maps of Making's
agents can be managed only from a `*.mapsofmaking.org` host. So every instance
of the overlay that offers agents needs its own backoffice deploy. Today the
backoffice cannot give it one without a fork:

- It is built on a laptop and rsynced (`make vps-push`). Its instance values
  are compiled in: `SIGNUP_PROVIDER`, `DEFAULT_IDENTIFIER` and `UPLOAD_LIMITS`
  in `src/config.ts`, `theme.css` imported into the bundle. A second instance
  means a second build, then a second copy of the code.
- solid-css-overlay already solved the same problem for the server (ADR 009):
  one image, tagged, published by CI; an instance is a checkout at a tag that
  pins it, adds git-ignored values, and mounts its look over the image's.

And the look has no single home. Maps of Making's design system on claude.ai
was extracted from the live map (`nicolasdb/maps_of_making@mom-demo`, 13 Oct):
the map is its source, and the pods would have taken a third copy (the empty
`mapsofmaking/mom-pods-overlay`). Its tokens (`paper`, `ink`, `rule`, `accent`,
the `state-*` ladder) are not the kit's slots (`--surface`, `--text-*`,
`--border`, `--accent`), so the kit's apps cannot read them as they are.

## Decision

1. **The horizontal ships one image per app, dressed in the kit's own look.**
   A tag `v<version>` makes CI publish `ghcr.io/nicolasdb/<app>:<version>`,
   with the same checks as a push. The Solid Kit design system (`design/`,
   `theme.css`) is the default look of every image. An instance pins a version,
   never `:latest`. Nothing is compiled on the server.
2. **An instance's values are read at run time, not compiled.** A kit app
   reads `/instance.json` at boot (issuer and sign-up provider, upload limits,
   app name) and loads `/skin.css` after `theme.css`. Both are mounted by the
   instance; absent, the image's defaults hold. What the server can describe
   itself (ADR 010's `provider.json`) is read from the server, not repeated in
   `instance.json`. Values that must be the app's own origin (the Client ID
   Document of ADR 010, point 6) are generated at start from the deploy's
   public URL.
3. **The deploy is a checkout of the app's repo at its tag**, as with the
   overlay: `instance-template/` (compose, `.env.example`, a gateway template)
   is used in place, never edited; the instance's values are git-ignored files
   beside it. A feature that needs an instance to edit a tracked file is
   designed wrong.
4. **A vertical's look has one source: its design-system repo**, in its own
   organisation (Maps of Making: `mapsofmaking/design-system`). It holds:
   - `tokens/`: the vertical's tokens, fonts and logos, in its own names. The
     source of truth: the vertical's own apps (the map, the landing) import
     them, and its claude.ai design system is synced from here, not the other
     way round.
   - `skins/kit/skin.css`: the mapping from those tokens to the kit's slots,
     the complete set in every theme it offers, passing
     `npm run audit -- --skin`. The one file every horizontal image reads.
   - one folder per function it deploys (`pods/`, `backoffice/`): its words
     and values, and the compose override that mounts them.
5. **The slot set is the contract** between the horizontal and every vertical.
   A slot is added, never renamed; the audit is how a vertical learns its
   mapping is incomplete. A vertical needing a value no slot carries asks for
   a slot; it does not override a component.

## Consequences

- solid-backoffice gets a Dockerfile, a tagged CI publish and an
  `instance-template/`; `src/config.ts` keeps only what is the app's own
  (`APP_NAME`, `SESSION_ID`). pod.nicolasdb.eu's backoffice moves to the image
  too, then `make vps-push` goes.
- On a VPS, one checkout per function plus one of the vertical's look
  (Maps of Making: `/srv/mom-pods`, `/srv/mom-backoffice`,
  `/srv/mom-design-system`). A change of look is a commit in the design-system
  repo, `git pull`, `docker compose up -d`: no image is rebuilt.
- `mapsofmaking/mom-pods-overlay` becomes `mapsofmaking/design-system`; the
  overlay's `overlay-template/` describes a folder of a design-system repo
  rather than a repo of its own.
- The map stops being the source of Maps of Making's look: it imports
  `tokens/tokens.css`. Agreed 2026-10-24; the map's side is Maps of Making's
  work, not the kit's.
- A second vertical (OpenFab, ...) costs a design-system repo and a mapping,
  not a fork of any app.
- A mounted `skin.css` is unchecked code from the instance's point of view:
  the audit runs in the design-system repo's CI, and the image never fails to
  start on a bad skin; it only looks wrong.

## Open

- The skin's fonts: served by each image from the mounted folder (as the
  overlay does, `/.well-known/css/fonts/skin/`), or once from a static host of
  the vertical. Per image is simpler and keeps every function standalone.
- Maps of Making offers riso paper only (no dark theme): the mapping fills the
  dark and contrast slots from the same paper, or the theme switch is hidden
  on a skin with one theme. To settle in the mapping, with the audit.
