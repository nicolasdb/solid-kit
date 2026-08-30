# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

**Read [`docs/atlas.md`](docs/atlas.md) first.** It owns the map of how this
repo relates to the provider, the backoffice and the apps. This file owns only
facts about the kit itself; anything cross-cutting belongs in the atlas or an
ADR, and nothing should be stated in two places except as a pointer.

## What this repo is

A template repository, not a package (see
[ADR 004](docs/adr/004-kit-is-copied-not-packaged.md)). Apps are started by
copying it. That shapes how to change things here: this code is read by whoever
copies it next, so the comments explaining *what went wrong before* are the
most valuable content in the files, not noise to trim.

## Commands

```bash
npm install
npm run dev      # Vite dev server
npm run check    # typecheck only
npm run build    # tsc && vite build
make             # lists deploy targets, generated from `## ` comments
```

No test suite or linter is configured. Verification is a live login against a
real provider — see the README.

## Architecture

No framework, no router. Screens are functions replacing the contents of
`#app`. Three apps converged on this independently at this size; don't
introduce a component system without a reason bigger than taste.

- `src/config.ts` — everything an app changes. `SESSION_ID` **must be unique
  per app**: two apps on one origin sharing an id clobber each other's tokens,
  which is the bug that forced valisette and the backoffice onto separate
  subdomains.
- `src/lib/auth.ts` — login with no hardcoded provider; accepts an issuer URL
  or a WebID (`#` means WebID, no probe). Owns the `Session`, and exports
  `authFetch` as a *delegating* wrapper — capturing `session.fetch` at module
  load would keep sending unauthenticated requests after login.
  `completeLogin` never throws; it reports `offline` when session state is
  unknown.
- `src/lib/pod.ts` — pod-root discovery and error classification. Deliberately
  domain-free; apps use `@inrupt/solid-client` directly with `authFetch`. There
  is no generic read/write wrapper because no two apps wanted the same one.
- `src/lib/conditional.ts` — for documents something *else* also writes. If the
  app is the only writer, plain solid-client calls are simpler and enough.
- `src/lib/draft.ts` — `makeDraftStore<T>`, for the window where the browser
  holds the only copy of the user's work.
- `src/styles/core.css` — structure and the slot contract. Project-agnostic:
  never edit it per app. `src/styles/theme.css` is the file to fork for a
  different look.

### Pod-root discovery

Two tiers, and the order matters: the `pim:storage` triple in the WebID profile
first, then a walk up the URI hierarchy looking for a `Link: <pim:Storage>;
rel="type"` header.

**Stop at the first match when walking up.** A multi-pod server advertises
pim:Storage on its own server root too; continuing past the first hit yields the
server root, which is not the user's pod and is not writable.

**Never derive the pod root by string-parsing the WebID.** It happens to work
for the `/<user>/profile/card` layout and has no basis in the spec — and the
portability path ([ADR 002](docs/adr/002-portability-tiers.md)) puts identity and
storage on different hosts by design.

### Auth errors

On a private pod, an expired token makes *everything* answer 401 — existence
probes included. A raw 401 therefore says nothing about whether a resource
exists. Route it through `isAuthError` and report an expired session rather than
surfacing the server's error graph.

### Styling

`core.css` declares slots; `theme.css` fills them. Define the **complete** slot
set in every mode — a token defined for light but not dark renders one theme's
text on the other theme's ground.

Dark mode is `prefers-color-scheme` with a `[data-theme]` override, not a
hardcoded class and not JS-applied inline styles. Text tokens clear WCAG AA
4.5:1 against the surface behind them; `--text-tertiary` is the one that gets
this wrong in practice, because it carries small mono labels — re-check any
replacement against both `--surface` and `--surface-elevated`.

Two layout rules are load-bearing: `100dvh` never `vh` (`vh` ignores retracting
browser bars and pushes bottom controls underneath them), and
`env(safe-area-inset-*)` padding, which silently resolves to zero unless
`index.html` keeps `viewport-fit=cover`.

## Deployment

Static SPA built locally; only `dist/`, `docker-compose.yml` and `deploy/` are
rsynced. Nothing compiles on the server. `dist/` is a bind mount, so a new build
is served without restarting the container — `vps-restart` is only needed after
changing `deploy/nginx-site.conf`.

The app runs in its own nginx container behind the shared gateway rather than
being served by the gateway itself: serving directly would mean editing the
shared gateway compose and restarting the proxy in front of every other service,
for every deploy of this one.

`deploy/gateway-vhost.conf.tmpl` is versioned here but must be installed into
`hetzner-gateway/nginx/conf.d/` and deployed from there — that repo stays the
source of truth for routing.

## Out of scope, on purpose

No demo-mode framework ([ADR 005](docs/adr/005-demo-mode-is-per-app.md)), no
ACL/permission helpers (the backoffice's job — see
[ADR 003](docs/adr/003-acl-writes-are-hand-written-turtle.md)), no data-format
helpers (TOML and Turtle are both legitimate per-app choices), no vocabulary.
Adding any of these is a decision that needs an ADR, not a commit.
