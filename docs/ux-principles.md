# UX principles

The interaction rules these apps are built to. Extracted from the backoffice,
which worked them out first and in the most detail.

The through-line: people using these apps are being asked to hold an unfamiliar
mental model (a pod, a WebID, access rules) while doing something ordinary. Every
rule below buys back attention for the ordinary thing.

## The principles

Cognitive ergonomics, via the Laws of UX:

- **Miller's law — at most four chunks per step.** A concept screen carries two
  or three ideas, never a list of nine.
- **Hick's law — one primary action.** Where a screen offers a choice, it offers
  two options and makes one visually primary.
- **Progressive disclosure.** The friendly view by default, the raw one on
  demand: plain-language sharing first, the actual WAC rules behind "show the
  technical rules".
- **Zeigarnik and goal-gradient — visible progress.** Ten chapters shown as
  three phases, because three is legible and ten is a wall.
- **Peak-end — a recap finale.** The last screen restates the mental model
  rather than just confirming success.
- **Reversibility everywhere.** Every mutating action carries an undo. "Always
  reversible" is stated to the user as a property of the system, not discovered
  per action.

Accessibility is not a setting: WCAG 2.1 AA throughout (4.5:1 contrast,
`focus-visible`, never color alone as an indicator), and where a more legible
typeface is offered, **it is the default** rather than an option to find.

## Two patterns worth reusing

**The comprehension checkpoint.** Mid-onboarding, a phase boundary is a
three-option question about what was just explained — not a counter that advances
regardless. It converts "did they scroll past it" into "did they get it", and it
is the cheapest honest signal available.

**Concept screens as pure data.** Chapters are an array of
`{ icon, title, body }` chunks rendered by one card component, with self-numbering
kickers ("Idea 2 of 3 · Who you are"). Copy stays metaphor-driven and free of
jargon — a pod is a locker, a WebID is your name on the web, sharing is handing
out copies of the key. Keeping them as data is what stops the copy from drifting
into the markup where nobody edits it.

## A note on the source

These were extracted from `pocpod0/backoffice`. Its `HANDOFF.md` is **stale
where it disagrees with the code** — it still describes ACLs going through
`universalAccess` (see [ADR 003](adr/003-acl-writes-are-hand-written-turtle.md))
and account creation as simulated, when both had been replaced. Read the code
first when the two conflict.
