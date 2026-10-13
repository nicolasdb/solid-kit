# ADR 009 — A CSS instance is a skin over a stock server

**Status:** accepted · **Applies to:** every Community Solid Server instance in
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
