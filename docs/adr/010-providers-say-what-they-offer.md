# ADR 010 — A provider says what it offers; the account stays with its own app

**Status:** accepted 2026-10-24 (proposed 2026-10-23); amended 2026-10-30 (see the end) · **Applies to:** solid-css-overlay
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
   provider does not offer agents. Servers running solid-css-overlay do.").
   The provider is not named: it is one of many, and naming it reads as
   blame. Our overlay is named, so the person knows what to look for.
   Informative, never a nag, never a fake button.
5. **The server keeps its own guard.** `ONBOARD_CORS_ORIGINS` (the connector)
   still lists which app origins may mint. The descriptor tells apps what
   exists; it grants nothing.
6. **Consent names the app's origin, when the server can vouch for it.** CSS
   7.2's consent data (`ClientInfoHandler`) carries `client_id`, `client_name`,
   `client_uri`, `logo_uri`, ... and no redirect URIs; everything but the
   `client_id` is declared by the app itself. So:
   - Our apps log in with a **Client ID Document**: the `client_id` is a URL
     on the app's own origin (`https://backoffice.mapsofmaking.org/id.jsonld`)
     listing its `redirect_uris`. CSS fetches it and redirects only there, so
     that URL's host is where the app runs. The consent page shows it, large,
     as the thing to check, above the name the app gives itself.
   - A `client_id` that is not a URL (dynamic registration, any origin can get
     one): the page says the app did not say where it is served from, and
     shows `client_name` as a claim, not a fact.
   - No CSS component for this: the page reads what CSS already sends.
   The provider's host in the header is set large enough to read, and an
   instance's own skin (not the generic one) is the default for any instance
   open to the public.
7. **One model of an agent: a WebID in its owner's pod, linked to its owner's
   account.** The owner is a person or a collective (a collective has its own
   account and pod). CSS makes client credentials only for a WebID linked to
   the account asking (`CreateClientCredentialsHandler`:
   `webIdStore.isLinked`), and the connector's mint gate checks the same link.
   An agent with an account of its own would need a password nobody uses, and
   its revocation would live in a second place. The agent needs no pod of its
   own: it works where it was granted access. The overlay's install notes
   change to this model.

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

- The backoffice moves from dynamic registration (`clientName` in
  `src/lib/auth.ts`) to a Client ID Document served by each deploy, its URL
  and redirect URI from deploy configuration.
- An app we do not control, registered dynamically, gets a consent page that
  says it is unverified. That is true, and it is the case to be wary of.

## Resolved while drafting (2026-10-23)

- **Redirect URIs on the consent page:** CSS 7.2 does not send them
  (`ClientInfoHandler`, read off the 7.2.0-5 image). Point 6 rests on the
  Client ID Document instead.
- **The connector booting with no identities:** fixed in solid-css-overlay
  7.2.0-5; it serves `/onboard/` alone until the first agent is minted.
- **Two models of an agent:** point 7.

## Amendment (accepted 2026-10-30): a same-site app may create an account

What stays: point 3. Signing in happens on the provider's own pages, no app
asks for a provider's password, and account features run only same-site.

What it adds: **creating** an account is not signing in. At creation there is
no password yet: the person chooses one. Maps of Making's home app
(`home.mapsofmaking.org`, MoM Epic 14) onboards a makerspace in one step
(the pod's name, the space's mailbox, a passphrase typed twice), the way
pocpod0 proved it against the account API (`registerAccount`, 2026-07-21).
Sending that person to the provider's generic sign-up page halfway through
would lose them at the moment the onboarding is meant to carry them.

8. **A same-site app may create an account, and only create it.**
   - It runs the account API in order: create the account, add the password
     login, create the pod (which creates the WebID). The password goes from
     the form to the server once; the app never stores, shows or resends it.
   - Then it signs in like any app: Solid-OIDC with its Client ID Document,
     on the provider's pages (point 6). Whether the cookie set at creation
     spares the person typing the passphrase again is measured, not assumed
     (MoM spike 14.0); either way, the provider's page is where it happens.
   - A cross-site app never creates accounts: it links to the provider's own
     sign-up page, as it does for every account feature.
9. **The descriptor says whether accounts can be created.** A new capability
   in `/.well-known/css/provider.json`, listed only when the instance has open
   registration on:

   ```json
   "register": { "path": "/.account/", "podNames": "subdomain" }
   ```

   No `register` entry means no creation offered: the app says so before any
   field and offers its other way (for MoM, hosting the file yourself). Name
   rules are the server's (`PodNameGuard`, ADR 009 amendment); the app checks
   the same rules early for the person's sake, and the server's answer wins.
10. **Creation is resumable, and the name is checked first.** CSS's
    `account.create` is anonymous and unconditional: every call makes a new
    account, and the pod name is only refused at the last step. So the app
    checks the name before anything is created (how to ask "is this name free"
    without creating it is part of spike 14.0), keeps the half-built account
    for the session (not per pod name: after "taken", the retry uses another
    name on the same account), and resumes from the failed step. An empty pod
    name never reaches the network: CSS reads it as "claim the pod root"
    (found live 2026-07-22).
11. **Open registration has its own guard.** Before an instance lists
    `register` publicly, its gateway rate-limits `/.account/` (and any name
    check). The descriptor still grants nothing (point 5).

Consequences:

- pocpod0's sequence moves into the kit as `lib/register.ts`, with the
  session-keyed resume state (pocpod0 keys it per pod name, which orphans an
  account when the name is changed after a refusal).
- solid-css-overlay adds the `register` entry to the descriptor, written only
  when registration is enabled in the instance's configuration;
  `scripts/check-overrides.sh` checks it matches.
- The provider's login and consent pages are now part of a newcomer's first
  minutes: their copy is reviewed with the onboarding's (ADR 009).
- Accepting this amendment unblocks MoM Story 14.3 (with the 14.0 report).
