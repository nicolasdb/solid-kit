# Procedures

Written instructions for a collective's agent: what it reads, what it writes,
in which order, and what it must never do. They implement
[ADR 006](../adr/006-membership-and-publication-by-pull.md) on the agent's
side, as the backoffice implements it on the member's and the admin's side.

| Procedure | Does | Writes to |
|---|---|---|
| [`procedure-pull.md`](procedure-pull.md) | follows what members announced, snapshots what changed | `depots/` only |
| [`procedure-confrontation.md`](procedure-confrontation.md) | reads each new snapshot against the collective's principles, describes it in a Turtle sidecar, loads the graph | `confrontations/` (report + sidecar, `sujets.ttl` append), `chantiers/` (append), the graph (`graph_ingest`) |
| [`procedure-contribution.md`](procedure-contribution.md) | **member side**: draws on the collective's graph, deposits in `output2/<collective>/` citing what it builds on, reads the member's inbox | the member's own `output2/<collective>/` only |

Each one is an input → process → output module: it names what it reads,
what it writes, and it is the only writer of its output. The first two run
as the collective's agent; the third as a member's own agent.

They are written for HyperScope, in French, and were first run by hand from a
claude.ai session with the agent's own connector (2026-09-24, see ADR 006,
"Live evidence"). The same text is meant to guide Hermes or any other LLM
agent: the protocol does not care who runs it.

## Copied, not shared

Like the kit itself ([ADR 004](../adr/004-kit-is-copied-not-packaged.md)), a
collective copies these and makes them its own: its principles, its paths,
its thresholds. The versions here are the reference that copies are compared
against, and the place where a fix to the protocol lands first.

**HyperScope's copy lives on its pod**, in two stages (decided 2026-09-30):

- **While the pipeline is in development**: `procedures/`, where the
  collective iterates on them with its agent from real runs. They still
  change often, and no ceremony is asked for.
- **In production**: `principles/procedures/`, beside the principles, with
  the same rules: read only for the agent and the members, changed only by
  ceremony. A procedure is a rule the agent applies on the collective's
  behalf, like a principle. Members already hold Read on `principles/`
  (solid-backoffice grants it on acceptance), so they can read what their
  agent does.

In both stages **the agent proposes and a person applies**. A procedure is
the agent's own instruction; an agent that rewrites it, prompted by a
document it just read, rewrites its own rules. So the agent has Read on the
procedures, not Write: it writes a proposed change (a diff and its reason)
where it already writes, and a person applies it.

**Changes come back here** when they fix the protocol rather than
HyperScope's own choices (paths, thresholds, principles), so another
collective's copy can be compared against this reference.

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
