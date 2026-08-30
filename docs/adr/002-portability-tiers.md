# ADR 002 — Portability tiers

**Status:** accepted (tier 1 to build) · **Applies to:** provider, backoffice,
onboarding copy

## Context

Solid does not solve provider migration, and this is its most under-advertised
gap. The WebID URI *is* the identity: it appears in every ACL that grants access
on someone else's pod, in every `foaf:knows`, in every inbound link. Data can be
copied to a new provider; inbound references cannot be rewritten, because they
live on pods other people control.

The practical consequence: an account created on a school's or a network's
domain is socially locked to that domain. Leaving means breaking every existing
relation. That makes domain strategy an onboarding decision, not an afterthought.

Solid does, however, decouple identity from storage on purpose — and that is
what makes a cheap middle tier possible.

## Decision

Three tiers, and the middle one is what to build.

### Tier 0 — provider domain (today's default)

Identity and storage both at `pod.example.org/user/…`. Fine to start with. The
lock-in must be named honestly during onboarding rather than discovered later.

### Tier 1 — bring your own WebID (build this)

The WebID is one small RDF document. Host it at `my.domain/profile/card#me`,
declaring `solid:oidcIssuer` and `pim:storage` pointing at the provider; the
provider links it to the account so the issuer will vouch for it.

Every relation, ACL entry and social link then references a domain the user
owns. A later storage move becomes: copy the data, edit two triples in a
document *they* control. Identity survives; only links to specific documents
break.

Offerable as a provider service: the user points their domain at the gateway,
nginx serves the certificate and the profile document, the backoffice offers
"connect your domain" as a step. Cheap, differentiating, and the honest answer
to "what if we depend on your server?"

### Tier 2 — custom domain for storage (not now)

Preserving document URIs forever means serving the pod itself under the user's
domain. Stock CSS has one `baseUrl` and its multi-pod mode covers subdomains of
that base, not arbitrary apex domains — so this means an instance per domain.

**URI rewriting at the proxy is forbidden**, not merely discouraged: the URI is
the identity, and rewriting it produces resources whose canonical name disagrees
with where they are, which breaks signatures, ACL subjects and every inbound
link in a way that is worse than the problem.

Tier 1 removes most of the lock-in for a fraction of this cost.

## Consequences

- Onboarding gains a doctrine to teach, in one line: **your name should belong
  to you; your storage can be rented.**
- Institutional accounts can start on the provider domain without that being a
  trap, provided "graduate to your own domain" is a real, first-class flow.
- `getPrimaryPodUrl` must never derive the pod root from the WebID's hostname.
  Tier 1 makes those two different hosts by design — the kit's discovery order
  already handles this, and the prohibition is written into `pod.ts`.
