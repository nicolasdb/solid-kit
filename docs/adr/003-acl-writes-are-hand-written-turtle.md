# ADR 003 — ACL writes are hand-written Turtle

**Status:** accepted, with a consequence still open (ACP)
**Applies to:** backoffice · **Blocks:** the WAC→ACP migration

## Context

The obvious way to manage permissions from a Solid app is Inrupt's
`universalAccess` API: it abstracts over WAC and ACP, and it is what the
documentation recommends.

A live audit on 2026-07-23 (`pocpod0/backoffice/pod-api.js:283-292`) found that
`universalAccess.setAgentAccess` / `setPublicAccess` wrote **container grants
without `acl:default`**. The effect is a permission that looks correct and is
useless: another agent could read and write the *container* but never any of its
children. A "shared folder" shared nothing. CSS itself honours a correct grant
fine — an anonymous PUT against a hand-written `.acl` returned 205 — so the
server was not the problem.

## Decision

The backoffice writes the `.acl` document itself, as Turtle. Deterministic,
inspectable, and it emits `acl:default` on containers so grants actually inherit.

Four details in that implementation are load-bearing, and any rewrite must keep
them:

1. **The target is resolved explicitly.** From `<file>.acl`, a relative `./`
   resolves to the *parent container* — so writing `./` for a plain file grants
   access to the whole folder instead of the one file. Containers get `./`,
   files get `./<basename>`.
2. **The owner block is always re-emitted** with Read, Write and Control. Never
   lock yourself out.
3. **Unparseable authorizations are a refusal, not a rewrite.** If the existing
   `.acl` contains something this app does not understand — `acl:agentGroup`,
   `acl:origin`, an unrecognized agentClass — editing it would silently delete
   someone's grant. Refuse and say so.
4. **WebIDs are validated before interpolation.** They are spliced raw into
   Turtle as `acl:agent <…>`; anything that could break out of the URI token is
   rejected rather than sanitized.

Also worth keeping: `getAccess` distinguishes *three* states, not two — explicit
grants, no grants, and **inherited from a parent** (no standalone `.acl`).
Collapsing "inherited" into "no access" misreports a private pod as broken.

## Consequences — and the open question

Hand-written WAC Turtle is exactly what **ACP breaks**. ACP uses `.acr`
resources and a different model, so every line of this code is WAC-specific.

That does not block the ACP move, but it reorders it:

- Apps that only read and write *data* (valisette, sport-tracker) are unaffected
  by a WAC→ACP switch — enforcement is server-side.
- The blast radius is the backoffice alone.
- Before flipping the provider: settle whether `universalAccess` writes correct
  ACP (the `acl:default` bug was WAC-specific and may not have an ACP analogue —
  **verify against a live ACP instance, do not assume**), or whether the same
  hand-written approach is needed for `.acr`.
- Then: rebuild the permission UI, verify grant/revoke against WAC, *then*
  switch the server, with a migration script for existing `.acl` → `.acr`. CSS
  does not convert them. Flipping first leaves no working permission UI during
  the migration.

An earlier version of the ecosystem plan said to build the backoffice's
permissions on `universalAccess`. This ADR supersedes that.
