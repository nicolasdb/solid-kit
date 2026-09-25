# Procedures

Written instructions for a collective's agent: what it reads, what it writes,
in which order, and what it must never do. They implement
[ADR 006](../adr/006-membership-and-publication-by-pull.md) on the agent's
side, as the backoffice implements it on the member's and the admin's side.

| Procedure | Does | Writes to |
|---|---|---|
| [`procedure-pull.md`](procedure-pull.md) | follows what members announced, snapshots what changed | `depots/` only |
| [`procedure-confrontation.md`](procedure-confrontation.md) | reads each new snapshot against the collective's principles | `confrontations/`, `chantiers/` (append) |

They are written for HyperScope, in French, and were first run by hand from a
claude.ai session with the agent's own connector (2026-09-24, see ADR 006,
"Live evidence"). The same text is meant to guide Hermes or any other LLM
agent: the protocol does not care who runs it.

## Copied, not shared

Like the kit itself ([ADR 004](../adr/004-kit-is-copied-not-packaged.md)), a
collective copies these and makes them its own: its principles, its paths,
its thresholds. The versions here are the reference that copies are compared
against, and the place where a fix to the protocol lands first.

A copy may later live on the collective's own pod, where its agent reads it.
That is for production, and only once there is a reason for it.

## Governance

A procedure is a rule the collective's agent follows on the collective's
behalf, so changing one is a governance decision, not an edit. How a
collective adopts or changes its procedures (ceremony, threshold, who signs)
is **to be decided**, alongside its principles.

## What must stay in step

- **The backoffice's files.** The roster, `config.ttl` and the messages in
  `inbox/` are defined by `solid-backoffice` (`docs/reference/collective-files.md`,
  `docs/examples/`). When one changes there, the procedures are checked here.
- **ADR 006 §3.** The snapshot path the procedures use,
  `depots/<nick>/<file-slug>/<AAAA-MM-JJTHHMM>/`, is what the live runs
  produced. ADR 006 §3 still says `<member-slug>/<bundle-slug>/<published>-<etag>/`.
  One of the two has to change; open.
