# Ecosystem atlas

The map of how these repositories fit together. **This file is the one owner of
that fact.** Every other repo's `CLAUDE.md` points here and describes only
itself.

Organizing principle: *pods are always the input source and the output target;
each app is the process UI for one job; the provider makes pods humane without
breaking interoperability.*

## Layers

```
Process apps — one repo each, one job each
  valisette          low-cost memories triage
  sport-tracker      timed-sequence sessions and history
  maps-of-making     space profile, events, map presence (TBD)
        │  built from ↓                    store to ↓↓
Shared foundation
  solid-kit          auth, pod helpers, tokens, UX principles, scaffold
  backoffice         account · pod · permissions · onboarding
        │  baseline published to ↓         sharing switched in backoffice ↓
Pod layer — the only data plane apps may touch
  user pods          private by default; sharing activated in the backoffice
  master pod         read-only promoted baseline: vocabularies, principles, tokens
        │  served by ↓
Provider — solid-provider
  CSS + custom layer · oxigraph · mcp-connector · gateway
```

**The layer rule: arrows only cross adjacent layers.** Apps never talk to
oxigraph or to CSS internals — only the Solid protocol, against pods. The
provider never reaches into an app's data semantics.

## Repositories

| Repo | Owns |
|---|---|
| `solid-provider` | CSS config and its identity-page overlay, oxigraph, qdrant, mcp-connector, compose, VPS infra. The product is a humane, fully compliant Solid provider. |
| `solid-kit` | The app scaffold and shared code, the design system, the deploy pattern, this atlas, the ADRs. |
| `backoffice` | Account, WebID and pod management; permissions in plain language; the onboarding path from "why does this exist" to a working account. |
| `valisette` | Triage app. |
| `solid-sport-tracker` | Session tracker with a sequence timer. |
| `maps-of-making` | Space profile and events as Turtle on the space's own pod; the map aggregates public documents. |

## How coherence is kept

- **One owner per fact.** This atlas owns the map; each repo's `CLAUDE.md` owns
  only its own facts and points here for the rest. Nothing appears twice except
  as a pointer.
- **Apps pin a kit version.** That pin is the contract. Copied files may
  diverge, but the divergence is visible.
- **One deploy pattern.** Each app: static build, own container, own vhost from
  the kit's template. The gateway repo stays the single source of routing truth.
- **The master pod is a release channel**, not a second editing surface. Git
  holds code and history; the pod carries the promoted snapshot, published on
  tag.

## Cross-cutting decisions

These live in [`adr/`](adr/) and apply across repos:

- [001 — Index vs truth](adr/001-index-vs-truth.md): pods are truth; oxigraph
  and qdrant are derived, rebuildable indexes. Apps never depend on one.
- [002 — Portability tiers](adr/002-portability-tiers.md): provider domain →
  bring-your-own WebID → custom storage domain, and why the middle tier is the
  one to build.
- [003 — ACL writes are hand-written Turtle](adr/003-acl-writes-are-hand-written-turtle.md):
  what a live audit found wrong with `universalAccess`, and what it means for
  the WAC→ACP move.
- [004 — The kit is copied, not packaged](adr/004-kit-is-copied-not-packaged.md).
- [005 — Demo mode is per app](adr/005-demo-mode-is-per-app.md).
