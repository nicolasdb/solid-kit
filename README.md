# solid-kit

The shared starting point for small apps that read and write a Solid pod.

Pods are the input source and the output target; the app is the process UI. This
kit is everything that is the same across those apps — signing in, finding the
pod, the design system, the deploy pattern — so a new app starts at the part
that is actually its own.

It is a **template repository**, not a package. Start an app by copying it; pin
which version you copied in the app's README. See
[`docs/adr/004-kit-is-copied-not-packaged.md`](docs/adr/004-kit-is-copied-not-packaged.md)
for why, and when that should change.

## Start an app from it

```bash
git clone https://github.com/nicolasdb/solid-kit my-app && cd my-app
rm -rf .git && git init
npm install
npm run dev
```

Then, in order:

1. `src/config.ts` — `APP_NAME`, `SESSION_ID` (**must be unique per app**),
   `DEFAULT_IDENTIFIER`.
2. `index.html` — `<title>` and `lang`.
3. `Makefile` — the four settings at the top (`APP`, `DOMAIN`, `CONTAINER`,
   `REMOTE`).
4. `docker-compose.yml` — service name, `container_name`, labels.
5. `deploy/gateway-vhost.conf.tmpl` — fill the placeholders, install the result
   into `hetzner-gateway` as `nginx/conf.d/<order>-<slug>.conf` and deploy from
   there. That repo stays the source of truth for routing.
6. `src/main.ts` — replace `renderHome`. Everything above it is the part worth
   keeping.

## What's in it

| Path | What it does |
|---|---|
| `src/lib/auth.ts` | Sign in with an OIDC issuer **or** a WebID, no hardcoded provider. Own `Session` with a per-app storage id. `completeLogin` never throws — it reports `offline` when the session state can't be determined. |
| `src/lib/pod.ts` | Two-tier pod-root discovery, `ensureContainer`, `exists`, and `isAuthError` / `describePodError` — which is how a 401 stops being mistaken for a missing resource. |
| `src/lib/conditional.ts` | ETag reads and `If-Match` writes for documents something else also writes. One retry on a 412, then report the conflict. |
| `src/lib/draft.ts` | `makeDraftStore<T>` — keeps unsaved work in `localStorage` with a TTL, for the window where the browser holds the only copy. |
| `src/styles/core.css` | Structure: spacing scale, radii, reset, layout primitives, and the slot contract a theme fills. Project-agnostic — don't edit per app. |
| `src/styles/theme.css` | Identity: the pod design system's daylight/ink palette, light and dark, mapped onto those slots. This is the file to fork for a different look. |
| `deploy/`, `Makefile`, `docker-compose.yml` | Build locally, rsync `dist/`, serve from an nginx container behind the shared gateway. |

Not included, on purpose: no demo-mode framework, no ACL/permission helpers, no
data-format helpers, no vocabulary. See the ADRs.

## Commands

```bash
npm run dev      # Vite dev server
npm run check    # typecheck only
npm run build    # typecheck + production build into dist/
make             # lists the deploy targets
```

## Testing it

There is no mock mode: completing a login needs a reachable Solid identity
provider. The kit's shell is enough to verify the whole chain — sign in, and it
prints the WebID and the discovered pod root.

Worth exercising deliberately, because these are the paths that broke before:

- Sign in with an **issuer URL**, then with a **WebID** — different code paths.
- A WebID whose profile has no `pim:storage`, to exercise the Link-header walk.
- Reload the page — `restorePreviousSession` should hold.
- An expired session, which should report an expired session rather than a raw
  401 error graph.

## Documentation

- [`docs/atlas.md`](docs/atlas.md) — the ecosystem this belongs to: which repo
  owns what, and the rule about which layers may talk to which.
- [`docs/ux-principles.md`](docs/ux-principles.md) — the interaction rules these
  apps are built to.
- [`docs/adr/`](docs/adr/) — decisions with reasons, including the ones that
  came from being wrong in production.
