# Procedures

Written instructions for a collective's agent: what it reads, what it writes,
in which order, and what it must never do. They implement
[ADR 006](../adr/006-membership-and-publication-by-pull.md) on the agent's
side, as the backoffice implements it on the member's and the admin's side.

| Procedure | Version | Runs as | Does | Writes to |
|---|---|---|---|---|
| [`procedure-pull.md`](procedure-pull.md) | v2 | the collective's agent | follows what members announced, snapshots what changed | `depots/` only |
| [`procedure-confrontation.md`](procedure-confrontation.md) | v3 | the collective's agent | reads each new snapshot against the collective's principles, describes it in a Turtle sidecar, loads the graph | `confrontations/` (report + sidecar, `sujets.ttl` append), `chantiers/` (append), the graph (`graph_ingest`) |
| [`procedure-contribution.md`](procedure-contribution.md) | v2 | a member's own agent | draws on the collective's graph, deposits in `<dossier-partage>` citing what it builds on, reads the member's inbox | the member's own `<dossier-partage>` only |

Each one is an input → process → output module: it names what it reads,
what it writes, and it is the only writer of its output.

**One text for every collective.** No procedure holds a collective's
address. Each starts by resolving the collective (contribution: the
member's `org:memberOf` → `config.ttl`; pull and confrontation: `config.ttl`,
then a check that the connector's WebID is `hs:agent`, stopping otherwise).
They are in French, were first run by hand from a claude.ai session with the
agent's own connector (2026-09-24, see ADR 006, "Live evidence"), and are
meant to guide Hermes or any other LLM agent as well: the protocol does not
care who runs it.

## Placeholders

What each procedure resolves at its step 0, and how the text names it:

| In prose | In Turtle templates | What it is |
|---|---|---|
| `<pod-collectif>` | `<POD-COLLECTIF>` | the folder that holds `config.ttl` |
| `<collectif>` | `<IRI-DU-COLLECTIF>` | the subject `a hs:Collective` (what members cite in `org:memberOf`) |
| `<agent-commun>` | `<AGENT-COMMUN>` | `hs:agent` |
| `<dossier-partage>` | `<URL-DU-DOSSIER-PARTAGE-DU-MEMBRE>` | `hs:bundleFolder`, relative to the member's pod |
| — | `<NOM-DU-COLLECTIF>` | `foaf:name` of the collective in `config.ttl` |

Uppercase marks a value to substitute inside Turtle, where `<…>` is already
an IRI. The `hs:` prefix is **not** a placeholder: it is the same for every
collective ([open](#open)).

## Copied, not shared

Like the kit itself ([ADR 004](../adr/004-kit-is-copied-not-packaged.md)), a
collective copies these to its pod and makes them its own: its principles,
its thresholds, its own history. The versions here are the reference that
copies are compared against, and the place where a fix to the protocol lands
first.

**On the pod, procedures live beside the principles**, flat in
`principles/` (`principles/procedure-*.md` next to `cultivate.md` or the
collective's equivalent). `config.ttl` points there with `hs:procedures`, so
no agent writes the path in. The earlier `procedures/` folder is
deprecated. Read only for the agent and the members, changed only by
ceremony: a procedure is a rule the agent applies on the collective's
behalf, like a principle. Members already hold Read on `principles/`
(solid-backoffice grants it on acceptance), so they can read what their
agent does.

**The agent proposes and a person applies.** A procedure is the agent's own
instruction; an agent that rewrites it, prompted by a document it just read,
rewrites its own rules. So the agent has Read on the procedures, not Write:
it writes a proposed change (a diff and its reason) where it already writes,
and a person applies it.

**What a copy may add.** A collective keeps its own history in annexes of
its copy, never here. HyperScope's copy has two: confrontation annexe C
(flat files from the 2026-09-24 test) and pull annexe D (`output2hyperscope/`,
literal `hs:fichier` on early snapshots). The generic texts point to such
annexes without numbering them.

**Changes come back here** when they fix the protocol rather than a
collective's own choices, so another collective's copy can be compared
against this reference. Each procedure carries its version in its title;
how a copy learns it is behind is [open](#open).

## Cleanup of 2026-10-01

The three procedures were made generic on HyperScope's pod by its agent, and
taken back here the same day.

| File | Before → after | Change |
|---|---|---|
| `procedure-contribution.md` | v1 → v2 | New §0, resolve the collective: `org:memberOf` from the profile → `config.ttl` → `hs:agent`, `hs:roster`, `ldp:inbox`, `hs:bundleFolder`. Never trust the folders on the pod. Several collectives: ask which. HyperScope addresses replaced by placeholders. |
| `procedure-confrontation.md` | v2 → v3 | §0: resolve the collective and check the connector's WebID is `hs:agent`, else stop. Placeholders in Turtle templates. 🟩/🟧/🟥 is a stigmergic signal, never a judgement or a sanction. HyperScope's flat-file case moved to its pod-only annexe C. |
| `procedure-pull.md` | v1 → v2 | Step 0, check the role. File table expressed through `config.ttl`. A nick without `foaf:member` is not a member. Annexes B and C in placeholders. HyperScope's history moved to its pod-only annexe D. |

Vocabulary in the same pass: the `sujets.ttl` example's definition reads
« délibère / qui porte quoi », not « décide / qui décide quoi »; a human's
part is a « confirmation » or a « proposition à délibérer », never a
decision the agent waits for. The procedures no longer name `access-log/`:
they say a read leaves « une trace consultable par lui » (see open below).

## Governance

A procedure is a rule the collective's agent follows on the collective's
behalf, so changing one is a governance act, not an edit: the strongest
ceremony, a deliberation between members (see `guide/glossaire.md`,
« Cérémonie »). How a collective holds that deliberation (threshold, who
confirms) is still to be deliberated, alongside its principles.

## What must stay in step

- **The backoffice's files.** The roster, `config.ttl` and the messages in
  `inbox/` are defined by `solid-backoffice` (`docs/reference/collective-files.md`,
  `docs/examples/`). When one changes there, the procedures are checked here.
- **ADR 006 §3.** The snapshot path the procedures use,
  `depots/<nick>/<file-slug>/<AAAA-MM-JJTHHMM>/`, is what the live runs
  produced. ADR 006 §3 still says `<member-slug>/<bundle-slug>/<published>-<etag>/`.
  One of the two has to change; open.

## Open

- **The `hs:` namespace** (`https://pod.nicolasdb.eu/hyperscope/vocab#`) is
  hosted on one collective's pod but serves all of them. A neutral one (w3id
  or the kit's domain) is the target; the rename is a mechanical pass, to be
  deliberated. Until then: never replace it.
- **`access-log/` is deprecated** (EPIC9): read receipts move to a log
  server fed on `.acl` reads, consultable per account. The procedures are
  already neutral; `solid_read_resource`'s description in the connector
  still names `access-log/`, to update with EPIC9.
- **Keeping a pod copy in step.** A version header in each procedure (it is
  in the title today) plus a `principles/VERSION`, and a backoffice command
  « mettre à jour les procédures », run as a ceremony. Not built.

## Proposed, not adopted

From the live run of 2026-10-01 (ADR 006, "Live evidence"). Each changes a
procedure every collective follows, so each is a proposal to deliberate,
not an edit; none is in the texts above.

| Proposal | Procedure | What it addresses |
|---|---|---|
| `s-appuie-sur` gives the snapshot's **file**, not its folder | contribution | links to a folder enter the graph with no title |
| Update `sources.ttl` by Turtle append, not by rewriting it whole | pull | cost and risk of a full rewrite on every pull (an append on the same subject gave the same result) |
| Abstracts name methods and devices, not only themes | confrontation | links the graph cannot see because it holds abstracts, not text |
| Give weight to the author's own `sujets:` (self-signification) | confrontation | who signifies the trace: today the common agent alone classifies and flags |

Also seen, no change proposed: an IRI mis-encoded by the agent in
`sources.ttl` (fixed in the same session; reread IRIs before writing), and
two new subjects in one day, a pace to watch.

