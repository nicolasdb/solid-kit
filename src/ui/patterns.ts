/**
 * The UX patterns these apps have converged on, as components.
 *
 * Tier 2 of how preferences get set (see `./ux.ts`): a principle you import
 * cannot be violated by accident. "At most four chunks" written in a document
 * is a hope; `renderConceptCard` throwing at five is a rule.
 *
 * Every function here returns an HTML string, matching how the rest of the kit
 * renders. The two that need behaviour (`mountCheckpoint`, `toast`) take a
 * container and wire themselves.
 */
import { MAX_CHOICES, MAX_CHUNKS_PER_STEP, UNDO_WINDOW_MS } from "./ux";
import { announce } from "./a11y";

/** Escapes text before it goes into innerHTML. */
export function esc(value: string): string {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

/* ── Concept card ─────────────────────────────────────────────────────────── */

export interface Chunk {
  /** One short glyph or emoji. Decorative — the title carries the meaning. */
  icon?: string;
  title: string;
  body: string;
}

export interface ConceptCard {
  /** Self-numbering context, e.g. "Idea 2 of 3 · Who you are". */
  kicker?: string;
  title: string;
  /** At most MAX_CHUNKS_PER_STEP. More throws — see below. */
  chunks: Chunk[];
  /** One concrete artefact for the chunk that needs it: a sample WebID, a path. */
  aside?: string;
}

/**
 * A single explanatory step.
 *
 * Throws above `MAX_CHUNKS_PER_STEP` rather than truncating: dropping a chunk
 * silently would lose authored content, while throwing surfaces the decision
 * the first time the screen is opened — split the step, or cut something.
 * Chunks are authored copy, not user data, so this fails during development.
 */
export function renderConceptCard(card: ConceptCard): string {
  if (card.chunks.length > MAX_CHUNKS_PER_STEP) {
    throw new Error(
      `Concept "${card.title}" has ${card.chunks.length} chunks; the limit is ` +
        `${MAX_CHUNKS_PER_STEP}. Split the step rather than raising the limit — ` +
        `see src/ui/ux.ts.`
    );
  }

  return `
    <article class="concept">
      ${card.kicker ? `<p class="label-mono">${esc(card.kicker)}</p>` : ""}
      <h2>${esc(card.title)}</h2>
      <ul class="concept-chunks">
        ${card.chunks
          .map(
            (chunk) => `
          <li>
            ${chunk.icon ? `<span class="concept-icon" aria-hidden="true">${esc(chunk.icon)}</span>` : ""}
            <div>
              <p class="concept-chunk-title">${esc(chunk.title)}</p>
              <p class="concept-chunk-body">${esc(chunk.body)}</p>
            </div>
          </li>`
          )
          .join("")}
      </ul>
      ${card.aside ? `<p class="concept-aside"><code>${esc(card.aside)}</code></p>` : ""}
    </article>`;
}

/* ── Phase rail ───────────────────────────────────────────────────────────── */

/**
 * Progress shown as a few phases rather than a step count.
 *
 * Ten steps shown as "4 of 10" reads as a wall; the same ten grouped into three
 * named phases reads as nearly done with the first. Goal-gradient: people push
 * harder when the end of the *current* segment is visible.
 *
 * `current` is the index of the active phase, not the step.
 */
export function renderPhaseRail(phases: string[], current: number): string {
  return `
    <nav class="phase-rail" aria-label="Progress">
      <ol>
        ${phases
          .map((phase, i) => {
            const state = i < current ? "done" : i === current ? "current" : "todo";
            // The state is in the text for assistive tech, not colour alone.
            const label =
              state === "done" ? "completed" : state === "current" ? "current step" : "not started";
            return `
          <li class="phase is-${state}" ${state === "current" ? 'aria-current="step"' : ""}>
            <span class="phase-bar"></span>
            <span class="phase-name">${esc(phase)}</span>
            <span class="visually-hidden">(${label})</span>
          </li>`;
          })
          .join("")}
      </ol>
    </nav>`;
}

/* ── Comprehension checkpoint ─────────────────────────────────────────────── */

export interface CheckpointOption {
  label: string;
  correct?: boolean;
  /** Shown after choosing — explain why, for the wrong answers too. */
  response: string;
}

export interface Checkpoint {
  question: string;
  options: CheckpointOption[];
}

/**
 * A phase boundary that asks whether the explanation landed.
 *
 * The point is that it is not a counter: a "Next" button measures scrolling,
 * this measures understanding, and it is the cheapest honest signal available.
 * Getting it wrong is not a failure state — the response explains, and the
 * reader moves on.
 */
export function renderCheckpoint(checkpoint: Checkpoint): string {
  if (checkpoint.options.length > MAX_CHOICES) {
    throw new Error(
      `Checkpoint "${checkpoint.question}" offers ${checkpoint.options.length} options; ` +
        `the limit is ${MAX_CHOICES}. See src/ui/ux.ts.`
    );
  }

  return `
    <section class="checkpoint">
      <p class="label-mono">One quick check</p>
      <h2>${esc(checkpoint.question)}</h2>
      <div class="checkpoint-options">
        ${checkpoint.options
          .map(
            (option, i) => `
          <button class="ghost" data-checkpoint-option="${i}">${esc(option.label)}</button>`
          )
          .join("")}
      </div>
      <p class="checkpoint-response" hidden></p>
    </section>`;
}

/** Wires a rendered checkpoint. `onAnswer` fires with whether it was right. */
export function mountCheckpoint(
  container: HTMLElement,
  checkpoint: Checkpoint,
  onAnswer?: (correct: boolean) => void
): void {
  const response = container.querySelector<HTMLElement>(".checkpoint-response");
  if (!response) return;

  container.querySelectorAll<HTMLButtonElement>("[data-checkpoint-option]").forEach((button) => {
    button.addEventListener("click", () => {
      const option = checkpoint.options[Number(button.dataset.checkpointOption)];

      response.textContent = option.response;
      response.hidden = false;
      response.classList.toggle("is-correct", Boolean(option.correct));
      // Announced as well as shown: the response appears below the buttons and
      // focus stays on the button, so nothing would otherwise read it out.
      announce(option.response);

      container
        .querySelectorAll<HTMLButtonElement>("[data-checkpoint-option]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));

      onAnswer?.(Boolean(option.correct));
    });
  });
}

/* ── Empty state ──────────────────────────────────────────────────────────── */

export interface EmptyState {
  title: string;
  /** One line. Say what would be here and how it gets here. */
  body: string;
  action?: { label: string; id: string };
}

/**
 * What a person sees the first time — usually before they see anything else.
 *
 * A pod starts empty, so this is the real first screen of every app built on
 * the kit, and "nothing here" is the least useful thing it could say. Name what
 * belongs here, and offer the one action that creates it.
 */
export function renderEmptyState(state: EmptyState): string {
  return `
    <div class="empty-state">
      <h2>${esc(state.title)}</h2>
      <p class="lead">${esc(state.body)}</p>
      ${state.action ? `<p><button id="${esc(state.action.id)}">${esc(state.action.label)}</button></p>` : ""}
    </div>`;
}

/* ── Pending ──────────────────────────────────────────────────────────────── */

/**
 * Waiting on the network — which, for a pod app, is most first loads.
 *
 * Says what is being waited for rather than spinning anonymously: "Finding your
 * pod" is diagnosable when it hangs, a bare spinner is not. `role="status"`
 * announces it without stealing focus.
 */
export function renderPending(message: string): string {
  return `
    <div class="pending" role="status">
      <span class="pending-spinner" aria-hidden="true"></span>
      <span>${esc(message)}</span>
    </div>`;
}

/* ── Undo toast ───────────────────────────────────────────────────────────── */

let toastTimer: number | undefined;

/**
 * The mechanism behind "reversible everywhere".
 *
 * Reversibility is the principle that lets every other one relax: a person who
 * knows they can undo will try things, and an app whose actions are all
 * reversible needs far fewer confirmation dialogs. That trade only works if
 * undoing is genuinely easy, which is what this is for.
 *
 * One toast at a time — a stack of them is a second thing to manage at exactly
 * the moment attention is elsewhere. A new toast replaces the old, running the
 * previous one's `onDismiss` so nothing is left half-finished.
 */
export function toast(
  message: string,
  options: { undo?: () => void; durationMs?: number; onDismiss?: () => void } = {}
): void {
  const { undo, durationMs = UNDO_WINDOW_MS, onDismiss } = options;

  document.querySelector(".toast")?.remove();
  if (toastTimer !== undefined) clearTimeout(toastTimer);

  const el = document.createElement("div");
  el.className = "toast";
  // assertive, not polite: this carries a time-limited action, so it has to
  // interrupt rather than wait for a pause.
  el.setAttribute("role", "alert");
  el.innerHTML = `
    <span class="toast-message">${esc(message)}</span>
    ${undo ? `<button class="toast-undo ghost">Undo</button>` : ""}
    <button class="toast-close ghost" aria-label="Dismiss">✕</button>`;

  const dismiss = () => {
    if (toastTimer !== undefined) clearTimeout(toastTimer);
    el.remove();
    onDismiss?.();
  };

  el.querySelector(".toast-undo")?.addEventListener("click", () => {
    undo?.();
    dismiss();
  });
  el.querySelector(".toast-close")?.addEventListener("click", dismiss);

  document.body.appendChild(el);
  toastTimer = window.setTimeout(dismiss, durationMs);
}
