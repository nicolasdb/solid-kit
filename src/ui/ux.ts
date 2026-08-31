/**
 * The UX preferences that are *values* rather than judgment.
 *
 * How preferences get set, in three tiers — this file is tier 1:
 *
 *   1. Constants here and in core.css, enforced by the components below and
 *      by `npm run audit`.
 *   2. Components in `./patterns.ts` — a principle embodied in something you
 *      import cannot be violated by accident, which is stronger than any doc.
 *   3. Judgment, in `docs/manual-tests.md` — copy tone, whether an action
 *      deserves a confirmation. No machine decides those.
 *
 * Changing a number here changes it everywhere, and the tests pin the
 * behaviour that depends on it. Change one deliberately; do not work around it
 * in a component.
 */

/**
 * Miller's law, applied: at most four things to hold at once in a single step.
 *
 * `renderConceptCard` throws above this rather than truncating. Dropping a
 * chunk silently would lose authored content; throwing surfaces the decision
 * the first time the screen is opened, which is when it can still be made
 * properly — split the step, or cut something.
 */
export const MAX_CHUNKS_PER_STEP = 4;

/**
 * How long an undo stays available.
 *
 * Long enough to notice the toast, read it and decide — and short enough that
 * the action feels finished. Below ~5s people who look away miss it entirely.
 */
export const UNDO_WINDOW_MS = 8000;

/**
 * Hick's law, applied: a choice offers at most this many options before it
 * stops being a choice and becomes a list to study.
 */
export const MAX_CHOICES = 4;
