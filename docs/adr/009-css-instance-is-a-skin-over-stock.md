# ADR 009 — A CSS instance is a skin over a stock server

**Status:** accepted, amended 2026-10-14 (see "Amendment") · **Applies to:** every Community Solid Server instance in
the ecosystem (pod.nicolasdb.eu, Maps of Making, the next one)

## Context

A CSS instance's identity pages — welcome, log in, sign up, consent, account —
are a person's first contact with their pod. Stock CSS ships them as plain
developer pages. pocpod0 restyled them (Story 7.2), then redid them properly:
tokens by solid-kit slot, a theme switch, readable WebIDs on consent, a
message when the server never answers, plain-language copy. Maps of Making
needs the same pages with a different look and different words, on a
different VPS. A second instance is the moment to decide what is shared.

Forking CSS for this would mean maintaining a server. Copying pocpod0's
`infra/css/` by hand would mean two diverging copies of the same behaviour,
with fixes made once and lost once.

## Decision

- **CSS stays a stock image.** An instance's pages are bind mounts over its
  `templates/` folder, served by CSS's own `/.well-known/css/` mappings; the
  mounted files are copies of stock templates, guarded by a hash baseline
  (`check-css-overrides.sh`) so an image bump cannot silently invalidate them.
- **The kit provides the overlay; the provider instantiates it.**
  `templates/css-instance/` holds what is generic — `main.css` (structure,
  reading only slots), `pod-ui.js` (behaviour), the chrome and the page
  overrides — and a reference skin. An instance copies it (ADR 004) and owns
  only its **skin** (`skin.css`: colours by slot, fonts, mark) and its
  **words** (copy, welcome page, the `INSTANCE:` lines).
- **Generic means generic.** An instance never edits `main.css` or `pod-ui.js`;
  a need they cannot meet is a change to the template, for every instance.
- **Machine-checked before a deploy.** `npm run audit -- --skin` decides
  contrast and slot completeness for a skin; `test/try-local.sh` +
  `test/smoke.mjs` run the instance's real CSS version with the overlay and
  drive the real flows, including an OIDC consent.
- **The method is a skill** (`skills/css-instance/`), so the next instance —
  or an agent asked to make one — follows the same steps and invariants.

## Consequences

- The atlas row for the provider changes: it owns its CSS config and its
  instance of the overlay; the overlay itself is the kit's.
- A fix to consent, recovery or the theme switch is made in the kit and
  re-copied into each instance; `infra/css/SOURCE` records which kit commit an
  instance carries, so a stale copy is visible.
- Per-instance divergence is confined to two places that are easy to read —
  `skin.css` and the copy — and to file headers that say what changed from
  stock.
- An instance that needs a page the overlay does not cover adds a copy-only
  override with the same kind of header, and proposes it to the template if a
  second instance would want it.

## Amendment (2026-10-14): an image, not a copy

What stays: CSS is never patched, an instance owns only its skin and its
words, generic means generic, everything is machine-checked before a deploy.

What changed: the overlay is no longer copied from the kit into each instance.
It lives in its own repository, [`nicolasdb/solid-css-overlay`](https://github.com/nicolasdb/solid-css-overlay),
and ships baked into a versioned image, `ghcr.io/nicolasdb/solid-css-overlay:<stock>-<n>`
(`FROM` stock CSS), alongside the MCP connector's image. An instance pins a
version in its `.env` and mounts only its own `overlay/` (skin, fonts, welcome
page). A fix reaches an instance as a version bump, not a re-copy, and nothing
is built on the instance's side. The skill and the smoke run moved with it;
the skin audit (`npm run audit -- --skin`) stays here, beside the slots it
checks.

Two decisions came with the move:

- **New instances create pods as subdomains** (`<name>.<server host>`), not
  folders. An instance that already has folder pods (pocpod0) keeps them for
  good: with the file backend, switching would re-read every pod's data under
  another address (ADR 002: the URI is the identity).
- **One component in the image, `PodNameGuard`.** With subdomains a pod name
  becomes a hostname, and stock CSS checks only that it is not empty, so
  `open_fab` made a pod no certificate covers. The guard refuses such names
  and reserved ones on the server. It is the exception to "files where stock
  CSS already looks"; a second component would need its own decision.

The decision to copy rather than package (ADR 004) still holds for apps: an
app's code is meant to diverge. A server's identity pages are not.
