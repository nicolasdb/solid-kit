# ADR 004 — The kit is copied, not packaged

**Status:** accepted · **Revisit when:** the trigger below fires

## Context

Three apps share auth, pod discovery, a design system and a deploy pattern. That
sharing can be a published npm package or a template repository whose files get
copied.

The population is three small apps and one maintainer. A package buys
single-point updates and costs versioning, publishing, a release process, and
the pressure to keep an API stable for consumers that could simply be edited
instead. At this size the cost lands first and the benefit arrives later, if at
all.

## Decision

`solid-kit` is a **template repository**. Starting an app means copying it.
Each app records in its README which kit version it was copied from — that pin
is the coherence contract: files may diverge, but the divergence is visible.

## The trigger for changing this

When the same bugfix has to be applied in three places, promote `auth.ts` and
`pod.ts` to a versioned package. That pain is the signal — not foresight about
it.

Note which files that names. `auth.ts` and `pod.ts` are protocol-shaped: they
change when the spec or the server does, identically for everyone. The scaffold,
the theme and the deploy files are *meant* to diverge per app, and they should
stay copied even after a package exists.

## Consequences

- An app can edit any kit file without coordination. That is the point.
- Improvements do not propagate on their own — a fix found in one app has to be
  carried back to the kit deliberately, or it is lost to the others.
- The kit stays readable as a whole, which matters more than it sounds: the
  reason these files are worth sharing is the comments explaining what went
  wrong before, and those survive being copied better than they survive being
  abstracted.
