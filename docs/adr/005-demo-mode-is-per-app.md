# ADR 005 — Demo mode is per app

**Status:** accepted · **Applies to:** apps built from the kit

## Context

An app that requires a working OIDC redirect before showing anything is hard to
demonstrate, hard to develop against, and impossible to preview in a sandbox.
Both existing apps solved this, and solved it differently.

**Valisette — a sentinel plus a flag.** `state.demo` is checked at exactly four
IO seams (read, write, browse, scan); an in-memory map stands in for the
network; the fixture is held as a real TOML *string* so the offline path
exercises the same parse and patch code, not a parallel one. Demo URLs use a
`demo:` scheme, which makes the "never let a synthetic path leak into a real
session" guard a one-line prefix check.

**Backoffice — two backends behind a factory.** A ten-method interface with a
`RealBackend` and a `DemoBackend`; the app holds a `client` and never touches
the libraries. The demo backend re-serializes the same Turtle so even the
technical-rules panel looks right offline, seeds friendly sample data, and has a
fault-injection hook that makes multi-step error handling testable without a
server.

Both are good. They are good at different sizes: four seams versus ten methods.

## Decision

**The kit ships no demo-mode framework.** Each app chooses its shape.

What the kit does provide is the hook that either shape needs:
`completeLogin()` returns `offline: true` when the session state cannot be
determined at all, distinguishing "no network, no library, sandboxed preview"
from a clean logged-out state. An app can offer a demo instead of a login form
that cannot work.

## The invariant that is not optional

Whichever shape an app picks: **the demo path must exercise the same parse,
patch and render code as the real one.** A demo built from parallel code paths
tests nothing and rots silently — it is a second implementation that nobody runs
against a server.

Two smaller rules, both learned in valisette:

- Guard synthetic state from leaking into real sessions. A distinct URL scheme
  makes the check trivial.
- Be honest in the UI about which mode is running. "Offline — nothing left the
  browser" is a feature, and pretending otherwise is a trust bug.

## Revisit when

A third app wants a demo mode and the first two shapes both fit badly. Two data
points is not a pattern.
