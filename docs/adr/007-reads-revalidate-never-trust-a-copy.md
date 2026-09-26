# ADR 007 — Reads revalidate; a copy is never trusted

**Status:** accepted · **Applies to:** apps built from the kit

## Context

Apps built from the kit show what the pods say now: a role, a membership, a
share is read again on every screen, never stored. On a real network each
request is a round trip, and screens were written as chains of `await`s,
so a home screen of six reads cost six round trips even where no read needed
another's answer. The backoffice measured it (26 Sep 2026, 300 ms added per
request): a member's home took 2.6 s, the collective's 3.7 s, and every tab
switch paid it again.

Browser HTTP caching does not help. Solid servers send no `Cache-Control` on
pod resources, authenticated requests carry DPoP headers, and the kit already
uses `cache: "no-store"` so a write never starts from a stale ETag.

## Decision

Three rules, in order of what they save.

1. **Start every read that does not need another one's answer.** A screen's
   reads form a tree (a profile names collectives, a config names a roster);
   only those links wait. Everything else starts at once.
2. **Draw from the last load, then read behind it.** The last load stays in
   memory; a navigation draws from it at once, reads again, and redraws only
   if the result would change the screen and nobody is typing. A render that
   follows a write reads first, so a button's effect is what the screen shows.
3. **Revalidate display reads.** `src/lib/read.ts` keeps each displayed
   document's ETag and body in memory and asks with `If-None-Match`; a 304
   hands back the kept body. The server is asked every time: this saves the
   download, not the round trip.

Around them:

- **Memory only.** Nothing read from a pod goes into localStorage,
  sessionStorage or IndexedDB. The kept load and documents are forgotten at
  sign-out (`forgetReads()`).
- **Writes never start from a kept copy.** They read through `conditional.ts`
  and send `If-Match` (its invariant 1 stands).
- **A cache can only save time.** A provider whose CORS refuses
  `If-None-Match` gets the plain request instead.

## Consequences

The backoffice, after rules 1–3: 1.7 s and 1.5 s on the first load at 300 ms
per request, tab switches instant, confirmed live on test.nicolasdb.eu.
Community Solid Server 7 answers 304 through a DPoP-bound fetch.

Rule 2 lives in each app's screen code: the kit has no router or load
function to put it in (ADR 004's reasoning: copied, not abstracted). Rules 1
and 3 are the kit's: `read.ts`, and reviewing every new chain of `await`s for
reads that could start together.

Every read on someone else's pod still reaches their access log; a 304 is a
request. An app that shows many foreign addresses at once (a list of what the
user follows) keeps a short copy on the user's own pod and reads the address
only when it is opened.
