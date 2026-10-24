# Personas × journeys

Who arrives, why, what they get at each level, and what brings them back. No
screens: this is the brief that onboarding screens are later drawn from.

Decided 2026-10-24. Draft for discussion.

## Rules this doc is written to

- **Value before Solid.** Nobody is asked to want a pod. The account and the pod
  come as a side effect of "keep it here" once something useful already exists.
  A pod is the new "self-host" for people who can't self-host.
- **Each level is worth it alone.** Someone who stops at L1 has not failed.
- **Nudges support, never nag.** A progress bar is a minimap (saved; stop and
  resume). A curiosity hint is a door: one line, at the moment value lands,
  never repeated. No streaks, leaderboards, scarcity or loss.
- **Personas, not verticals.** A vertical (Maps of Making, HyperScope…)
  customizes the top layer: skin, words, the first useful object. The levels
  underneath are shared.
- **Onboarding is a one-time app per vertical**, on its own subdomain, same site
  as the pod server. The backoffice is where people *come back*, not where they
  start.

## The levels

| | Level | What it is | Exists today? |
|---|---|---|---|
| **L1** | Something of mine, kept | A profile (with or without a location) → a file on the pod → backoffice basics: upload, who may see it, link it from the profile | genjson (value, no pod); backoffice J1/J2 (account, profile) |
| **L2** | An agent on my files | An agent identity, connected to an AI, granted folders; talk to your files | yes: backoffice J8 + connector |
| **L3** | Thinking with a collective | Join a collective, share a folder, the collective's knowledge graph answers back | joining yes (J1, J3–J5); the value loop (pull → confront → graph answers) **no** |

L2 and L3 sit side by side after L1; the person picks either, both or neither.

## Personas

| # | Persona | Who, concretely | Vertical |
|---|---|---|---|
| P1 | **Space coordinator** | Runs a makerspace, fablab, repair café, a practice (Bernard's hackerspace; the logopède in Namur). Signs up with a role email (`contact@space`) | MoM |
| P2 | **Network coordinator** | Coordinates a network of spaces. No location of their own | MoM |
| P3 | **Invited member** | A person a collective invited. Has no Solid account, doesn't know what one is | any |
| P4 | **Collective thinker** | Contributes notes to a collective and wants the collective to answer (Niel, Xavier) | HyperScope |
| P5 | **Curious about AI on own files** | Wants an assistant that reads their documents, not a cloud drive's | any |
| P6 | **Already on Solid** | Has a WebID elsewhere | any (J2) |

P1's dentist and materials dealer from `schema-roleplay-personas.md` are P1
from this doc's point of view: their difference is the bundle, not the journey.

## The grid

Each cell: **trigger** → **value** → **object left with** → **comes back where / why**.
"—" means the level is not that persona's path (they may still take it).

### P1 · Space coordinator

| | |
|---|---|
| **L1** | **Trigger:** wants the space on the map / to be found. **Value:** the space is on the map, from a file they own. **Object:** the space's JSON at a public URL, the link to register on the map. **Comes back:** to update hours, equipment, events; the map shows "last updated". Where: the vertical's own app (genjson grown up), not the backoffice |
| **L2** | **Trigger:** questions they answer over and over ("do you have a laser cutter?"). **Value:** an agent that answers from the space's own file. **Object:** an agent identity granted the space's folder. **Comes back:** when the file changes; to read the access log |
| **L3** | **Trigger:** the network asks members to join. **Value:** listed among the network's members. **Object:** `memberOf` in the space's file; membership accepted. **Comes back:** rarely; that's fine |

Handing over: the account is on a role email, so a new coordinator takes the
mailbox and with it the password reset. No account transfer feature needed.

### P2 · Network coordinator

| | |
|---|---|
| **L1** | **Trigger:** wants to show the network. **Value:** the network's page and its members on one map. **Object:** an embed (map of members) to put on the network's own site. **Comes back:** when a space asks to join |
| **L2** | **Trigger:** "which of our spaces does X?" asked by the public. **Value:** a search bot beside the embed, answering from the members' files. **Object:** the bot, on the same page as the embed. **Comes back:** when it answers wrong |
| **L3** | Is the collective: accepts requests (J3), sees the roster | |

This is the persona where L1 and L2 are one gesture: the embed is the value,
the search bot is the reason to keep it fresh.

### P3 · Invited member

| | |
|---|---|
| **L1** | **Trigger:** an invitation link from someone they know. **Value:** "you're in", nothing to understand first. **Object:** a pod address, a sign-in that works, a profile with a name. **Comes back:** via the backoffice bookmark, when the collective asks for something |
| **L2** | — (door shown once, after L3 value lands: "your notes could also have an agent") |
| **L3** | **Trigger:** the invitation itself. **Value:** **open question:** today joining grants nothing visible; the value needs L3's loop. **Object:** membership; a shared folder. **Comes back:** when the collective answers |

### P4 · Collective thinker (Niel, Xavier)

| | |
|---|---|
| **L1** | Minimal: an account and a folder of notes. Never the entry point |
| **L2** | **Trigger:** wants their own notes to answer back. **Value:** talk to own notes. **Object:** an agent on the notes folder. **Comes back:** daily, in their AI chat, not the backoffice |
| **L3** | **Trigger:** a question the collective is working on. **Value:** the collective graph answers, naming who said what; disagreements confronted. **Object:** their contribution visible in the graph's answers. **Comes back:** through the collective's own surface (the graph), not the backoffice. **Blocked:** needs the pull → confront → graph answers loop |

The backoffice shows mechanism (inbox, delegates, agent WebID, folders) and
none of this value. Don't draw P4 screens before the loop exists.

### P5 · Curious about AI on own files

| | |
|---|---|
| **L1** | **Trigger:** "I want an assistant on my files, not on Google's". **Value:** a place for files they control. **Object:** pod + a first folder with something in it. **Comes back:** to add files |
| **L2** | **Trigger:** same, it's why they came. **Value:** the AI reads only the folders they granted; the access log shows each read. **Object:** an agent connected to their AI. **Comes back:** from the AI chat; to the backoffice to grant another folder or read the log |
| **L3** | — (door, once, when the agent first answers well) |

### P6 · Already on Solid

Same grid as whichever of P1–P5 they are, minus the account step. J2 fills
what their profile lacks. The descriptor (ADR 010) decides whether L2 is
offered on their provider.

## What this tells us to build

1. **MoM's onboarding app** serves P1 and P2 at L1. genjson already gives the
   value without an account; the new part is "keep it at Maps of Making"
   creating the account and pod, then ending on the public JSON link.
2. **P2's embed + search bot** is the strongest single case for L2 and the
   reason to keep files fresh. Worth a slice of its own.
3. **The L3 value loop** gates P3's and P4's value. Until it exists, joining a
   collective is a formality; say so rather than dress it up.
4. **The backoffice** is the "comes back" place for P1 (permissions, agents),
   P3 and P5. It is never the first screen anyone sees.

## Open questions

- P3 at L3 before the loop exists: what is the honest value of joining today?
- P1's "comes back" app: genjson grown up, or the backoffice with a MoM skin?
- P2's search bot: whose agent is it, the network's or each space's?
- Where the onboarding app lives (`start.` / `welcome.`) and its name.
- Do we need a persona for the person who *runs* an instance (Nicolas, Jason)?

## Sources

- `maps_of_making/_bmad-output/planning-artifacts/schema-roleplay-personas.md` (bundles, P1 variants)
- `maps_of_making/_bmad-output/planning-artifacts/ux-bernard-wizard-spec.md` (L1 grammar for MoM)
- `solid-backoffice/docs/journeys.md` (J1–J9: the mechanics under each cell)
- [ux-principles.md](ux-principles.md), [ADR 010](adr/010-providers-say-what-they-offer.md)
