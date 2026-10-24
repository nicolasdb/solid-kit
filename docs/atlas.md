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
  solid-backoffice   account · pod · permissions · onboarding
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
| `solid-provider` | Its CSS instance (a pinned `solid-css-overlay` image + its skin and words, ADR 009), oxigraph, qdrant, mcp-connector, compose, VPS infra. The product is a humane, fully compliant Solid provider. |
| `solid-kit` | The app scaffold and shared code, the design system (`design/`, the reference for the pod, the backoffice and the portfolio) and its skin audit, the deploy pattern, this atlas, the ADRs. |
| `solid-css-overlay` | The CSS image every instance runs: stock CSS + the identity pages + the default skin + a secure config, pods as subdomains (ADR 009, amended); the MCP connector's image; the instance template and the `css-instance` skill. |
| `solid-backoffice` | Account, WebID and pod management; permissions in plain language; the onboarding path from "why does this exist" to a working account; the membership handshake (ADR 006). Replaces the frozen `pocpod0/backoffice/`. |
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

## Who the apps are for

[personas-journeys.md](personas-journeys.md) owns who arrives, why, and what
they get at each level (L1 something kept, L2 an agent, L3 a collective).
Onboarding screens in any repo are drawn from it.

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
- [006 — Membership and publication by pull](adr/006-membership-and-publication-by-pull.md)
  (proposed): members grant and announce, the collective's agent pulls and
  snapshots; membership is a two-sided handshake that grants nothing.
- [007 — Reads revalidate; a copy is never trusted](adr/007-reads-revalidate-never-trust-a-copy.md):
  independent reads start together, a screen draws from the last load and
  reads behind it, display reads send `If-None-Match`. Memory only.
- [008 — Light by default](adr/008-light-by-default.md) (amended): Light →
  Dark → Same as this device; the device decides only when asked to, and High
  contrast comes from it.
- [009 — A CSS instance is a skin over a stock server](adr/009-css-instance-is-a-skin-over-stock.md):
  CSS stays stock; the overlay ships as an image (`solid-css-overlay`), pods
  are subdomains on new instances, and an instance owns only its skin and its
  words.
- [010 — A provider says what it offers; the account stays with its own app](adr/010-providers-say-what-they-offer.md):
  `/.well-known/css/provider.json`, apps detect from the WebID's issuer,
  account features same-site only with no password in the app, shown not
  hidden, consent names the app's origin (Client ID Document), and an agent
  is a WebID in its owner's pod linked to its owner's account.
- [011 — An app is one image; an instance brings its config and its look](adr/011-an-app-is-one-image-an-instance-brings-its-look.md):
  tagged images dressed in the kit's look, `/instance.json` and `/skin.css`
  mounted per instance, a deploy is a checkout at a tag, and a vertical's look
  has one source, its design-system repo, mapped onto the kit's slots.

The agent's side of 006 is written as [procedures](https://github.com/nicolasdb/solid-css-overlay/blob/main/mcp-connector/procedures/README.md), beside the connector in solid-css-overlay:
pull and confrontation, copied and adapted by each collective.
What a collective's pod holds, and what it copies there (the `config.ttl`
and `membres.ttl` templates, the members' `guide/`): solid-backoffice,
[the pod tree](https://github.com/nicolasdb/solid-backoffice/blob/dev/docs/reference/collective-files.md#the-pod-tree)
and [`templates/collective/`](https://github.com/nicolasdb/solid-backoffice/blob/dev/templates/collective/README.md),
since they follow its `config.ttl`. The generic
agent skill that reads them: [`collectif`](https://github.com/nicolasdb/solid-css-overlay/blob/main/mcp-connector/skills/collectif/SKILL.md), there too.
