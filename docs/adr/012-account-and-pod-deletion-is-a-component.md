# ADR 012 — Account and pod deletion is the image's second component

**Status:** accepted 2026-11-03 (proposed the same day); amendment proposed 2026-11-03, to deliberate (see "Amendment") · **Applies to:** solid-css-overlay
(the image), every instance that runs it (pod.nicolasdb.eu, Maps of Making),
the MCP connector's identity registry, and solid-backoffice if the
self-service door lives there

## Context

CSS deletes no account and no pod. Its account API removes a login (never
the last one), client credentials, a WebID link and a pod owner; the only
account it removes by itself is one left without a login for 30 minutes
(`BaseLoginAccountStorage`, 1800 s). Checked against 7.2.0's source
(solid-css-overlay README, "Accounts and pods"), then on 2026-11-03 against
the stock images: `edge` (7.3.0) and `next` (8.0.0-alpha.3) ship
`DeleteClientCredentialsHandler` and `DeletePasswordHandler` and nothing that
deletes an account or a pod. CSS `main` up to the 7.3.0 release (2026-11-02)
adds nothing either, and the only upstream issue on it (#1139) is closed
without a feature. The CSS docs' account API (checked the same day) lists
DELETE for WebID links, client credentials and password logins only.

So:
- a pod name, once taken, stays taken, and every test round burns names;
- a test instance is cleaned only by a full reset (`docker compose down -v`),
  which stops being possible the day a real account lives there;
- the right to erasure (GDPR art. 17) cannot be honoured, not even by an
  admin. No instance can open to the public without it.

ADR 009 (amendment) allows exactly one component in the image,
`PodNameGuard`, and says a second one needs its own decision: every
component is code carried across every CSS release. 8.0 already breaks the
guard's Components.js context; a second component doubles that cost.

Tracked in solid-css-overlay#17; its agreed shape is that repo's
`ROADMAP.md`, "Account and pod deletion, for admins".

## Options

1. **Delete from the volume, from outside** (a script on the data folder).
   Ruled out: the file layout is CSS's private business and may change at any
   release, and a script races the server's locks.
2. **Wait for upstream.** Costs nothing to carry, but nothing says it is
   coming, and an instance cannot open publicly meanwhile.
3. **Contribute it upstream** (an account-deletion handler in CSS itself).
   Removes the carry cost for everyone, but its timeline is not ours, and it
   would land in 8.x at the earliest.
4. **A component in the image**, beside `pod-name-guard`, using CSS's own
   stores and locks.

## Decision

Option 4 now, written so it can become option 3:

- **One route under `/.account/`**, inside CSS: delete the account's pods'
  resources depth first through the resource store (so locks and auxiliary
  resources are handled by CSS), then `delete('account', id)`, which removes
  logins, pods, WebID links and client credentials together.
- **The pod root itself goes through the data accessor**, under the
  resource locker's write lock. The store refuses it (7.3.0
  `DataAccessorBasedStore.deleteResource`: "Cannot delete a root storage
  container", and the root's `.acl` likewise), and with subdomain pods every
  pod root is a root storage. Leaving the root would keep the name taken:
  `GeneratedPodManager.createPod` answers 409 when anything exists at the
  pod's base. This is one more CSS internal to carry; the gate below is
  what notices if it changes.
- **Order:** pods' data first, the account record last. A deletion that
  fails halfway leaves the account in place, so it can be run again.
- **Two callers of that route, same code:**
  - an **admin** may delete any account. Admins are login emails listed in
    the instance's environment, written into the config at start, the same
    way as the email sender (`start/email.js`);
  - the **account owner** may delete their own, after typing their
    passphrase again.
- **Front doors** (all calling the route, none deleting on their own):
  `scripts/admin.sh` (list, delete-account) with a `make` target on the VPS;
  an account-manager page for admins; "Delete my account" for the person,
  which says plainly what goes (their pods and everything in them, their
  WebID, the agents' access).
- **Outside CSS**, the connector drops the deleted WebIDs from
  `identities.json`.
- **Gate before a tag**: a test that deletes an account with a pod and then
  takes the same pod name again, on both layouts.
- **Kept small and upstream-shaped**: no store of its own, no change to
  stock behaviour, so it can be offered upstream and removed from the image
  the release CSS has it.

## Open questions

- Where "Delete my account" lives: the overlay's account page (stock CSS
  page, every instance gets it) or solid-backoffice (the place people
  actually manage their pod). The route is the same either way.
- Data held elsewhere about a deleted WebID: copies pulled into a
  collective's pod (ADR 006) are the collective's; does erasure reach them,
  or only end the pull?

Settled on acceptance (2026-11-03):
- Admin list: the email settings were settled (mapsofmaking/maps_of_making#15,
  `start/email.js`); `ADMIN_EMAILS` is written at start the same way.
- Upstream: checked (Context, above); nothing is coming that we know of.
- Built in slices: admin delete first (route, `scripts/admin.sh`, connector
  cleanup, the gate), then listing and the account-manager page, then
  self-service once its home is decided.

## Consequences

- The image carries two components; every CSS bump checks both (8.0 first).
- A test instance can be cleaned account by account; real and test accounts
  can share an instance.
- An instance can honour erasure, a precondition for opening to the public.
- ADR 009's "one component" sentence is amended by this ADR.

## Amendment (proposed 2026-11-03, to deliberate): the server's terminal, not an admin list

**What changes.** Who may delete any account becomes whoever can run a
command on the server, not the login emails listed in `ADMIN_EMAILS`. The
account-manager page becomes a terminal tool. Built before any release, in
solid-css-overlay#36; the email list never shipped.

**Why.**
- Stock CSS never verifies a login's email. An address on the list that nobody
  had signed up with yet (a fresh install, a typo, a second address) made
  whoever signed up with it first an admin.
- The people who run an instance already prove it, with ssh and Docker on the
  VPS. A second, weaker proof added risk and gave nothing back.

**Shape.**
- The route takes `action: list | delete` and is opened by a random token. The
  image writes it at every start, mode 600, into the container's own
  filesystem (never the data volume, never `.env`).
- The tool (`admin/admin.js` in the image) runs inside the container, reads
  the token, and calls CSS on 127.0.0.1, naming the instance's host with
  `X-Forwarded-Host`.
- `scripts/admin.sh` launches it with `docker compose exec`: a TUI to list,
  sort, filter, select and delete, plus `list` and `delete --yes` for scripts.
  Afterwards it removes the connector's agents.
- The gateway templates refuse `/.account/admin/` from outside, as a second
  layer behind the token.
- Listing every account is new: stock lists only the caller's own. It reads
  the account storage's `entries('account')`, one more CSS internal to carry.

**What it leaves open.**
- No browser page for admins. If one is wanted later, it needs its own answer
  to "who is this?", decided here.
- Self-service "Delete my account" is unchanged: same deletion, opened by the
  person's own sign-in and passphrase. Where it lives is still the open
  question above.
