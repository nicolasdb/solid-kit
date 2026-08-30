# ADR 001 — Pods are truth, indexes are derived

**Status:** accepted · **Applies to:** every repo in the atlas

## Context

Pods cannot be queried. CSS serves documents — GET, PUT, PATCH — and has no
SPARQL SELECT endpoint; it supports SPARQL/N3 PATCH for updating a single
resource, but nothing queries across resources. Storing Turtle does not change
this.

What storing Turtle *does* buy is worth being precise about, because it is easy
to expect the wrong thing from it:

- **self-description** — a resource says what it is in a shared vocabulary, so
  an app that has never seen it can still read it;
- **linkability** — triples point across documents and across pods with plain
  URIs;
- **client-side query** — an engine such as Comunica evaluates SPARQL over
  fetched documents, through the authenticated fetch, ACLs respected. This is
  the spec-pure way to search across a network of pods, and it is slow at scale:
  fine for one person's own history or a few dozen public profiles, not for
  interactive search over thousands of documents.

Fast search therefore needs an index, and the platform has two (oxigraph for
triples, qdrant for embeddings). The risk is that an index quietly becomes the
place data lives.

## Decision

**Pods hold the truth. Oxigraph and qdrant are derived indexes**, in the same
relationship to pods that a search engine has to the web.

1. An aggregator crawls only what it is allowed to read — public documents, or
   documents a user granted it — and loads them into the index.
2. Every indexed triple carries provenance back to its source URI.
3. The whole index is rebuildable from pods alone. If rebuilding it would lose
   something, that something was in the wrong place.
4. Deletion propagates across all layers.
5. **Apps never write to an index and never read from one.** An app needing an
   aggregate over its own data folds client-side. Only network-scale search
   goes through a provider index, and only through an identity-aware layer —
   oxigraph's SPARQL endpoint has no per-user access control of its own, so it
   must never be reachable directly by a browser app.

## Raw files are first-class

Pods store any content type, and RDF was never meant to replace `.md`, PDFs,
audio or photos. The layout is **raw file plus Turtle sidecar**: the photo stays
a photo, and a small metadata document says what it is and links it into the
graph. RDF is the card catalog; the raw files are the library. Embeddings over
raw content sit on the index side, like everything else derived.

## Consequences

- Aggregate features are the client's job unless they are network-scale.
  Sport-tracker's tiered read-back (container listing → one document → a window
  of documents) is the pattern.
- An index can be dropped and rebuilt without ceremony, which makes schema
  changes cheap.
- Cross-pod search stays honest about being either slow (traversal) or
  restricted to public data (the aggregator).
