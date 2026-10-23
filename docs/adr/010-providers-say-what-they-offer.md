# ADR 010 — A provider says what it offers; the account stays with its own app

**Status:** proposed 2026-10-23, to deliberate · **Applies to:** solid-css-overlay
(every instance: pod.nicolasdb.eu, Maps of Making, the next one),
solid-backoffice, and any app that offers provider features (agents, connector)

## Context

The backoffice's agents section (create an agent's WebID, mint its connector
URL) is shown only when `onProvider(webId)` holds: the WebID starts with
`SIGNUP_PROVIDER`, a constant in `src/config.ts` set to
`https://pod.nicolasdb.eu/`. Maps of Making's install (2026-10-23) showed what
that costs:

- A second instance of the same overlay gets nothing: the section is hidden
  for `nicolas-test.pod.mapsofmaking.org`, although that server runs the very
  connector the section talks to. One build of the backoffice per instance
  would be needed.
- The prefix test assumes folder pods. With subdomain pods (the overlay's
  default) a WebID `https://nicolas-test.pod.mapsofmaking.org/profile/card#me`
  never starts with `https://pod.mapsofmaking.org/`.
- Hidden means unseen. Someone on another provider never learns what this one
  offers, which was the point of hiding it ("hidden, never greyed out"), and is
  also an opportunity missed.

Two ways of reaching the server do different things:

- **The pod** (read, write, ACLs) goes through Solid-OIDC: a DPoP token, scoped
  by the consent screen, valid from any origin. Any app may do it.
- **The account** (`/.account/`: client credentials, linked WebIDs, pods) and
  the connector's `/onboard/` go through the `css-account` cookie, which the
  browser sends only when the app is **same-site** with the server. Client
  credentials are long-lived secrets that act as you; no consent screen scopes
  them. Today the backoffice's fallback when the cookie has lapsed is a
  password form inside the app (`#agents-unlock`).

And every instance's identity pages look alike (the generic "pod" skin): a page
copying them on another domain is hard to tell from the real one. The consent
page shows the app's `client_name`, which the app chooses itself, and a random
`client_id`, not where the app comes from.

## Decision

1. **A provider describes itself.** solid-css-overlay serves a static,
   versioned document on the server's host,
   `/.well-known/css/provider.json`: the overlay version, the pod layout, and
   one entry per capability it offers (`account`, `onboard`, `connector`),
   each with its path. No capability listed means not offered. Stock CSS has no
   such file, and that is the answer "nothing beyond Solid".
2. **Apps detect, they do not list.** An app reads the WebID's
   `solid:oidcIssuer`, fetches that issuer's descriptor, and offers what it
   lists. No provider URL is compiled into an app. Every endpoint called is on
   the **issuer's own origin**; a URL in the descriptor pointing elsewhere is
   shown, never called with the person's credentials.
3. **The account stays with its own app.** Account and onboard features run
   only when the app is same-site with the issuer (same registrable domain).
   The same-site cookie is not a limit to work around: it is the boundary.
   - No app asks for a provider's password. When the account session has
     lapsed, the app sends the person to the provider's own login page (a
     top-level navigation, back to the app afterwards), where the address bar
     names the server.
   - Cross-site, the app says where those features are ("Your agents are
     managed at backoffice.mapsofmaking.org") and links there.
4. **Shown, not hidden.** For a WebID whose provider offers less, the section
   is shown with what it would do and why it is not available here ("Your
   provider, solidcommunity.net, does not offer agents. Servers running
   solid-css-overlay do."). Informative, never a nag, never a fake button.
5. **The server keeps its own guard.** `ONBOARD_CORS_ORIGINS` (the connector)
   still lists which app origins may mint. The descriptor tells apps what
   exists; it grants nothing.
6. **Consent names the app's origin.** The consent page shows where the app
   is served from (the client's redirect URI host, or its Client ID Document's
   URL), marked as the thing to check, above the name the app gives itself.
   The provider's host in the header is set large enough to read, and an
   instance's own skin (not the generic one) is the default for any instance
   open to the public.

## Consequences

- One build of the backoffice serves every instance of the overlay. The
  instance-specific constants in `config.ts` (`SIGNUP_PROVIDER`,
  `DEFAULT_IDENTIFIER`, `UPLOAD_LIMITS`) become deploy configuration, or come
  from the descriptor (an upload limit is a capability of the gateway).
- `onProvider` and its prefix test go; the layout no longer matters.
- The descriptor is a public contract: versioned with the overlay, its fields
  only added, never renamed, and `scripts/check-overrides.sh` checks it is
  served. Its path, like every static asset with subdomain pods, answers on
  every pod too; `/.well-known/css/` already does.
- The in-app password form (`#agents-unlock`) is removed.
- Someone who is a member of several of our collectives and uses another
  instance's backoffice gets the pod features there and a link for the
  account ones. That case is thin, and served correctly.
- A provider can lie in its descriptor. It gains nothing: its endpoints only
  ever receive its own cookie.

## Open

- Does CSS 7.2's consent response carry the client's redirect URIs (point 6),
  or does the page need the Client ID Document? To check against the image.
- The connector must boot with no identities, or `/onboard/mint` can never
  create the first agent (solid-css-overlay, found 2026-10-23).
- Two models of an agent exist: the backoffice's (a WebID in the owner's pod,
  `profile/<name>#me`, linked to the owner's account) and the overlay's
  install notes (an account and a pod of its own). Settle on one.
