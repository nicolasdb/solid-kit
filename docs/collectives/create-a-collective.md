# Creating a collective

What a collective's pod holds, which part comes from this repo and which is
the collective's own. The clicks and the `.acl` documents are
solid-backoffice's [set up a collective](https://github.com/nicolasdb/solid-backoffice/blob/main/docs/how-to/set-up-a-collective.md);
who may read and write each container is
[ADR 006 §5](../adr/006-membership-and-publication-by-pull.md). Neither is
repeated here.

The aim: **the same instructions serve every member of every collective.**
Two layers carry it:

- a generic **skill** ([`skills/collectif/`](../../skills/collectif/SKILL.md))
  holding the invariants and resolving the context (who am I, which
  collective, which role);
- **procedures** on each collective's pod, read at every session, changed
  only by ceremony ([procedures](../procedures/README.md)).

The skill finds everything through `config.ttl`; nothing on the pod is
reached by a path written into a text.

## The tree

At the root of the collective's pod:

| Path | Origin | Access |
|---|---|---|
| `config.ttl` | [`templates/collective/config.ttl`](../../templates/collective/config.ttl), filled at creation | public read (the invitation reads it before sign-in); **written by the owner only, never the agent** |
| `membres.ttl` (`hs:roster`) | empty at creation | members + agent read; written by the backoffice (owner) |
| `inbox/` (`ldp:inbox`) | created empty | any signed-in agent appends; the common agent reads |
| `agents/agent` | the common agent's profile | public |
| `principles/procedure-*.md` (`hs:procedures`) | **copied from** [`docs/procedures/`](../procedures/) (generic) | members + agent read; owner writes, by ceremony |
| `principles/cultivate.md` (or equivalent) | **local**: the collective's principles | same |
| `guide/` (`hs:guide`) | **copied from** [`guide/`](../../guide/) (generic) | `guide/faq.md` public; the rest members |
| `depots/`, `confrontations/` | created by the common agent | agent edits; members read |
| `chantiers/`, `briefs/`, `public/` | to be specified | **à délibérer** |

`procedures/` at the root is deprecated: procedures and principles live
together in `principles/`.

**Generic or local.** The procedures and the guide are the same text for
every collective; a collective adds its own history only as annexes of its
copy (HyperScope: confrontation annexe C, pull annexe D). The principles are
the collective's alone, and so is anything under `depots/` and after.

## Steps, in order

1. Account and pod for the collective, and the common agent
   (`agents/agent#me`) with its connector. The collective account's profile
   declares `acl:delegates <agents/agent#me>`: that link is how the skill
   checks the agent acts for this collective.
2. `config.ttl` from the template: replace each uppercase placeholder. Public
   read, owner write only. The common agent must not be able to change it:
   it names `hs:agent` and `hs:procedures`, so an agent that could write it
   could rename itself or repoint its own rules (2026-10-01: the agent's
   attempt to add `hs:procedures` was refused with 403, as it should be).
3. `membres.ttl`, empty; `inbox/` with its rules
   ([how-to](https://github.com/nicolasdb/solid-backoffice/blob/main/docs/how-to/set-up-a-collective.md), steps 3–5).
4. `principles/`: copy the three `procedure-*.md` from this repo, then write
   the collective's principles beside them. Give the folder its own rules.
5. `guide/`: copy the three files from this repo; give `guide/faq.md` public
   read.
6. `depots/` and `confrontations/` are created by the common agent on its
   first pull and confrontation; give them their own rules once they exist.

## Open

- **Members' read on `guide/`.** Accepting a member grants Read on the shared
  folders the backoffice knows (`depots/`, `confrontations/`, `chantiers/`,
  `briefs/`, `principles/`); `guide/` is not among them yet. Until it is,
  make the whole of `guide/` public, or grant it by hand.
- **Keeping a copy in step with the repo.** Each procedure names its version
  in its title; a `principles/VERSION` and a backoffice command « mettre à
  jour les procédures », run as a ceremony, are proposed. Not built.
- **Tooling.** All of the above is by hand today; a backoffice « create a
  collective » flow would follow this table.
