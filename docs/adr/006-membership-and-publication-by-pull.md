# ADR 006 — Membership and publication by pull

**Status:** proposed · **Applies to:** backoffice, collective pods (HyperScope
first, then Maps of Making and networks), the collective's agent on Hermes

## Context

A collective (HyperScope today, a fablab network or a Maps of Making region
tomorrow) has a common pod. Members work on their own pods and want some of
that work to reach the common pod. They also want their teammates and the
collective's agent to be able to read it, confront it with the collective's
principles, and bring it back into later sessions.

The first design, worked out on 2026-09-23 for Phase 0, was **push**. A
member's agent copied a report into `hyperscope/depots/`, holding an Append
grant there so that nobody could overwrite anyone else's deposit. It broke down
in three places:

- **It violated the single-writer invariant.** pocpod0 `architecture.md` BP-6
  says only your own agent writes your pod, and everything else is a grant you
  hold on someone else's pod. Push made every member's agent a writer on the
  common pod.
- **Append-only was a workaround, not a guarantee.** WAC Append was never
  verified against CSS for a create by PUT. The backoffice had no UI for it, and
  "correct it by depositing a v2" was a rule people would have had to remember.
- **Consent sat on the wrong pod.** The act of sharing was a write to someone
  else's pod, so nothing on the member's own pod recorded it.

Two other facts shaped the decision:

- **Membership needs two sides.** Xavier's WebID is `chabivdb` and his agent is
  `bridget`. Nothing ties either name to "Xavier", or Xavier to HyperScope,
  without a declaration from him *and* a recognition from the collective.
- **Revoking works forward only.** It stops future reads. It never un-reads or
  un-copies anything. This was misunderstood repeatedly, and it is also the
  rule solid-dash settled on (PRD FR-26).

## Decision

### 1. The member publishes; the collective pulls

The member's pod is the source of truth. **Publishing means granting the
collective's agent Read on a resource or container, then announcing it.**
Nothing is ever written into the common pod by a member.

1. **Grant.** On their own pod, the member gives the collective's agent WebID
   `acl:Read` on the bundle. That grant *is* the act of consent: it is visible
   on the member's pod and revocable there.
2. **Announce.** The member (or their app) sends an `as:Announce` to the common
   pod's `inbox/`, with the bundle's URI as `as:object`.
3. **Pull.** The collective's agent fetches the bundle and stores a snapshot
   (§3). It is the only writer on the common pod.
4. **Follow.** The agent subscribes to changes (§4). A new ETag produces a new
   snapshot, and a new confrontation runs against it. There is no "v2" deposit:
   editing your own document *is* the new version.

**A bundle is whatever URI the member points at**, whatever its shape:

- a single Turtle document, such as a solid-dash Bundle;
- a JSON or Markdown file;
- a container such as `output2/hyperscope/`, where everything inside is part
  of the bundle. One folder per collective under a private `output2/`, so a
  member of several collectives grants each agent its own folder only.

A container is the easiest shape to use day to day: set its grant once, then
drop files into it. The collective discovers new files through container `Add`
notifications.

### 2. Membership is a handshake, read from both sides

- **The member declares.** Their profile carries `foaf:name`,
  `org:memberOf <collective IRI>`, and `acl:delegates <agent WebID>`. The
  collective IRI is the subject of its `config.ttl` (`config.ttl#hyperscope`),
  so following the link from a profile leads to the collective's description. The
  agent's profile points back at the human. A claim made from one side only
  proves nothing.
- **The member asks.** An `as:Join` is sent to the collective's `inbox/`.
- **The collective recognises.** An admin accepts and writes
  `<config.ttl#hyperscope> foaf:member <WebID>` into the collective's
  `membres.ttl`, then sends an `as:Accept` (or `as:Reject`) to the member's
  inbox. The roster holds **only** `foaf:member` lines: names and agents are
  read from each member's profile, so there is one source for each fact and
  nothing in the roster goes stale.

The state is **read, not stored**. It follows from which side declares what:

| Member declares `memberOf` | Collective lists `foaf:member` | State |
|---|---|---|
| yes | yes | member |
| yes | no | request pending (or refused) |
| no | yes | left: the member withdrew |
| no | no | not a member |

Either side can end membership on its own, without asking the other.

**Membership grants nothing.** `membres.ttl` is descriptive, and permissions
stay per-WebID ACLs. Accepting a member and writing their ACLs are two
separate writes that leave two separate traces, even when the backoffice
chains them behind one click. Never use `vcard:Group` or `foaf:Group` as an
ACL subject: ACP ignores it silently, and the WAC→ACP move would then drop
access without a single error.

What membership *does* switch on is behaviour. When a member publishes, the
collective accepts the `as:Announce` and follows the bundle. Announcements
from non-members wait for a human.

### 3. Snapshots are copies, kept as they were

The collective keeps a copy, never only a link. A confrontation must refer to
the exact text it judged. A link could change after the judgement, or vanish.

- Path: `depots/<member-slug>/<bundle-slug>/<published>-<etag>/`. It holds the
  original bytes unchanged, plus a `provenance.ttl` that records the source URI,
  source ETag, fetch time, the fetching agent, and the Announce that triggered
  the fetch.
- **Snapshots are never rewritten or deleted by the pull.** If the source
  disappears (404) or access is revoked (401/403), the next snapshot is not
  taken and the bundle is marked `source-gone` or `access-revoked`. Earlier
  snapshots stay. That is what revocation means (see Context).
- **A deleted source file is marked, not mirrored.** When a file disappears
  from a followed container (`Remove`, or missing from the next listing), the
  bundle's record marks that file `source-gone`; its snapshots stay. This is
  not a breach of [ADR 001](001-index-vs-truth.md) rule 4 (deletion
  propagates): a snapshot is the collective's own record, taken with the
  member's consent, not an index of the member's pod. Its own deletion, if
  ever, is the retention rule below.
- **Derived text is an index, not truth.** A `.docx` is kept as a `.docx`. The
  Markdown or plain text extracted from it for the agent and for oxigraph is
  derived and rebuildable ([ADR 001](001-index-vs-truth.md)). If it is stored
  beside the snapshot, it is named so it cannot be mistaken for the original.

#### Versions (proposed)

A change to a file means a new snapshot of **that file only**, fetched whole
(HTTP has no partial read of a change); unchanged files are skipped from the
container listing. The checks run again on the new snapshot. Three rules keep
the number of versions sane:

- **Only when the bytes changed.** The agent hashes what it fetched and takes
  no snapshot if the hash equals the last one. CSS's ETag cannot be used for
  this: it holds no content hash (see Live evidence).
- **Only once the file has settled.** A change is snapshotted after the file
  has been quiet for a while, so a series of saves gives one version. The
  delay is set per collective in `config.ttl`.
- **Retention is a separate task, never the pull.** A snapshot that a
  confrontation refers to is kept for good. Others beyond the last *n* per
  file may be pruned by a scheduled task, with *n* set in `config.ttl`.

Git is not needed: snapshots under `<published>-<etag>/` already form a
linear history with a single writer, and git's branches and merges answer a
problem this design does not have. If members need to compare versions, that
is a diff view over two snapshots.

#### Status (proposed)

Each snapshot folder holds, beside the original file and `provenance.ttl`, a
`status.ttl` written by the collective's agent: one entry per event
(`collected`, `reviewed`, `flagged`, `error`), each with its time and, for a
review, the confrontation it came from. Entries are added, never rewritten.
This works for any file type, since nothing is written into the file itself.

For reading at scale, the agent also keeps `depots/<member>/index.ttl`: per
source file, its latest snapshot and latest status, plus `source-gone` when
it applies. It is derived and rebuildable from the snapshot folders, and it
lets a member's backoffice or agent see everything with one read. Queries
across members go to oxigraph, which indexes one named graph per snapshot and
marks the latest; apps never read oxigraph ([ADR 001](001-index-vs-truth.md)
rule 5).

### 4. Change detection: a notification is a trigger, never data

CSS 7 implements the Solid Notifications Protocol, and pocpod0's config imports
`css:config/http/notifications/all.json`. The collective's agent subscribes
with a `WebhookChannel2023` whose `sendTo` is the Hermes webhook.

Properties from the CSS documentation that this design relies on:

- **Subscribing needs Solid-OIDC and Read on the topic.** The member's grant
  (§1.1) is exactly what lets the agent subscribe. Revoking it also ends the
  agent's ability to subscribe again.
- **A container topic emits `Add`/`Remove`; a resource topic emits
  `Create`/`Update`/`Delete`.** Each notification carries `state`, which is the
  new ETag and therefore the diff key for §1.4 at no extra cost.
- **CSS removes channels after 14 days by default** (`maxDuration`). The agent
  must re-subscribe before then, or the server's `maxDuration` must be changed.
  Either way it is a scheduled task, not a one-off.
- **CSS signs webhook requests** with a DPoP-style token issued under the
  server's own WebhookWebId.

**The agent never trusts the body of a notification.** A notification only
makes the agent GET the bundle with its own credentials. That GET is the
authority: it gets the content, the ETag and the access decision. A forged or
replayed webhook can therefore cause, at worst, one unnecessary GET. Checking
the signature is defence in depth, not the security boundary.

**Polling is the fallback, not a second design.** A scheduled pass
(conditional GET with `If-None-Match` on every followed bundle) covers two
cases: providers that do not implement notifications, and notifications lost
while Hermes was down. The webhook makes changes quick to arrive; the poll
makes sure none is missed.

### 5. Who holds which rights on the common pod

| Container | Members and their agents | Collective agent | Owner (admin) |
|---|---|---|---|
| `inbox/` | Append (authenticated agents, members or not) | Read | Control |
| `depots/` | Read | Read, Write | Control |
| `confrontations/`, `chantiers/`, `briefs/` | Read | Read, Write | Control |
| `principles/`, `membres.ttl` | Read | Read | Control; writes after ceremony or acceptance |
| `config.ttl` | Read (any authenticated agent) | Read | Control |

`config.ttl` is the exception to "members only": it is how an applicant
learns where the inbox is and which agent to grant, so it is read *before*
membership. It holds nothing secret. Its shape is defined by the backoffice
(`solid-backoffice`, `docs/examples/hyperscope-config.ttl`): the group IRI,
the inbox, the agent and the bundle folder name.

Each WebID is listed by name in every ACL, as §2 requires. Accepting a member
therefore also means adding their WebID to the Read grants above; until then,
the roster is unreadable to them, and the backoffice shows their state as
"pending", never as "refused". No member holds
Write anywhere on the common pod. Append on `depots/` is no longer needed,
which removes the unverified CSS behaviour from the critical path.

## Consequences

- **A member onboards with one grant.** They grant the collective's agent Read
  on `output2hyperscope/`. This happens on their own pod, in their own
  backoffice, and becomes a step in the onboarding path.
- **The collective's agent must run somewhere that listens.** On Hermes: a
  dedicated agent with its own WebID and connector, a reachable webhook, the
  14-day re-subscribe task and the polling fallback. Until that agent exists,
  a pull triggered by hand from a claude.ai session with the same identity is
  a valid stopgap, because the protocol does not care who triggers the GET.
- **One identity, one connector.** The WebID that pulls is the WebID members
  grant to. Retire the claude.ai connector (`hyperscopeMain`) when Hermes takes
  over, so that journals can tell a scheduled task from a manual session.
- **The backoffice needs several pods, not a push button.** It must read the
  common pod, and pods where a teammate granted you something (the Xavier
  case), with your own WebID. That is a list of places, not a publishing
  flow. For binary files, the minimum is download; online preview is not
  required.
- **This is the same loop as solid-dash, one level up.** A solid-dash Bundle
  granted to the collective's agent is a bundle in this ADR's sense. The
  solid-dash Request Box and this `inbox/` both use Append-by-anyone-
  authenticated.
- **A deposit is not the same as a publication.** A snapshot on the common pod
  is readable by members only. Making anything public from it is a separate
  decision, taken with the collective's own threshold mechanism.
- **Consent covers what the grant covers.** If a member grants a container,
  every file they later drop in it is published, which is the convenience and
  also the risk. The onboarding copy must say so in one line, as plainly as
  solid-dash says that revoking is forward-only.

## Live evidence

**2026-09-24: manual pull and confrontation, end to end.** The source was
`hyperscope_ndb/output2hyperscope/` on the member's pod, with Read granted to
`agent#me`. From a claude.ai session using `hyperscopeMain`, one `.md` file
was pulled into `hyperscope/depots/`. The confrontation procedure then wrote
its report into `confrontations/` with a 🟧 flag, and `depots/` was left
untouched. The grant, the pull, the single writer and the confrontation all
held.

What the manual run did *not* yet do, and the next run must do:

- It wrote the file flat into `depots/`, keeping its original name, with no
  `<member>/<bundle>/<published>-<etag>/` path and no `provenance.ttl`.
  Without the source ETag, the next pull cannot tell whether anything changed.
- It was triggered from chat, with no `as:Announce` in `inbox/`.
- The pull steps were improvised. The confrontation already had a written
  procedure; the pull needs one too, and that procedure is also the
  specification for the Hermes task.

**2026-09-24, later that day: change detection.** After the connector began
returning version metadata (pocpod0 `de537b9`), the pull ran twice in a row.
The first run snapshotted both files under `depots/nicolas/`, with real keys.
The second run found both keys unchanged and wrote nothing. CSS 7 does include
`dcterms:modified` and `posix:size` for each child in a container listing, so
a pull can skip unchanged files without reading them, and without leaving a
read receipt on the member's pod.

A finding from that run: CSS's ETag has the form `"<mtime-ms>-<content-type>"`.
It contains no content hash and not even the size. On CSS it carries the same
information as `modified`. The agent matched a stored ETag against a listed
`modified` by decoding that format. It worked, but it depends on an
implementation detail. The procedure now records both keys and only ever
compares keys of the same kind.

## Open, and to verify live before relying on it

- The settle delay, the retention count and which statuses exist: proposed
  in §3, to be set from the first real use.

- Whether webhook channels survive a CSS restart with our
  `storage/key-value/resource-store.json` config. If they do not, the polling
  fallback carries the gap until the next re-subscribe.
- Whether a container channel emits for changes inside nested sub-containers.
  If it does not, a bundle container is flat or is followed one level at a
  time.
- Where `as:Accept` lands when the member's pod has no `ldp:inbox`. The
  onboarding path should create one.
- Whether `acl:delegates` is still the right predicate for human → agent, or
  whether a newer term has replaced it.
