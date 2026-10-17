# Procedures: moved

The procedures of a collective's agent (pull, confrontation) and of a
member's agent (contribution), and the `collectif` skill that loads them,
moved to the connector they are written against, on 2026-10-16:

- procedures: [`solid-css-overlay/mcp-connector/procedures/`](https://github.com/nicolasdb/solid-css-overlay/blob/main/mcp-connector/procedures/README.md)
- skill: [`solid-css-overlay/mcp-connector/skills/collectif/`](https://github.com/nicolasdb/solid-css-overlay/blob/main/mcp-connector/skills/collectif/SKILL.md)
- what comes next for them (pull as code, any file format, a trigger):
  [`mcp-connector/docs/collective-pipeline.md`](https://github.com/nicolasdb/solid-css-overlay/blob/main/mcp-connector/docs/collective-pipeline.md)

A procedure and the connector tools it calls change together, so they ship
in the same release. The protocol they implement stays here:
[ADR 006](../adr/006-membership-and-publication-by-pull.md). The last
version kept here is contribution v3, pull v2, confrontation v3 (git history
of this folder).
