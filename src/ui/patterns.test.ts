import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  renderConceptCard,
  renderCheckpoint,
  mountCheckpoint,
  renderPhaseRail,
  renderEmptyState,
  renderPending,
  toast,
  esc,
} from "./patterns";
import { MAX_CHUNKS_PER_STEP, MAX_CHOICES, UNDO_WINDOW_MS } from "./ux";

/** Renders a markup string into a detached container for querying. */
function mount(markup: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = markup;
  document.body.appendChild(host);
  return host;
}

const chunk = (n: number) => ({ title: `Title ${n}`, body: `Body ${n}` });

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("esc", () => {
  it("neutralises markup in copy", () => {
    expect(esc('<img src=x onerror="alert(1)">')).not.toContain("<img");
  });
});

describe("renderConceptCard", () => {
  it("renders every chunk", () => {
    const host = mount(
      renderConceptCard({ title: "Your pod", chunks: [chunk(1), chunk(2), chunk(3)] })
    );
    expect(host.querySelectorAll(".concept-chunks > li")).toHaveLength(3);
  });

  it(`throws above ${MAX_CHUNKS_PER_STEP} chunks rather than truncating`, () => {
    // The rule is only real if it fails loudly. Silently dropping the fifth
    // chunk would lose authored copy and nobody would notice.
    const chunks = Array.from({ length: MAX_CHUNKS_PER_STEP + 1 }, (_, i) => chunk(i));

    expect(() => renderConceptCard({ title: "Too much", chunks })).toThrow(
      new RegExp(String(MAX_CHUNKS_PER_STEP))
    );
  });

  it(`allows exactly ${MAX_CHUNKS_PER_STEP}`, () => {
    const chunks = Array.from({ length: MAX_CHUNKS_PER_STEP }, (_, i) => chunk(i));
    expect(() => renderConceptCard({ title: "At the limit", chunks })).not.toThrow();
  });

  it("marks the icon decorative — the title carries the meaning", () => {
    const host = mount(
      renderConceptCard({ title: "T", chunks: [{ ...chunk(1), icon: "🔑" }] })
    );
    expect(host.querySelector(".concept-icon")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("escapes authored copy", () => {
    const host = mount(
      renderConceptCard({ title: "<script>x</script>", chunks: [chunk(1)] })
    );
    expect(host.querySelector("script")).toBeNull();
  });
});

describe("renderPhaseRail", () => {
  it("marks the current phase for assistive tech, not by colour alone", () => {
    const host = mount(renderPhaseRail(["Understand", "Set up", "Ready"], 1));

    const current = host.querySelector('[aria-current="step"]');
    expect(current?.textContent).toContain("Set up");
    // Each phase states its state in text, so the rail is not colour-only.
    expect(host.textContent).toContain("completed");
    expect(host.textContent).toContain("current step");
    expect(host.textContent).toContain("not started");
  });

  it("classes phases as done / current / todo", () => {
    const host = mount(renderPhaseRail(["a", "b", "c"], 1));
    const classes = [...host.querySelectorAll(".phase")].map((p) => p.className);
    expect(classes).toEqual([
      "phase is-done",
      "phase is-current",
      "phase is-todo",
    ]);
  });
});

describe("renderCheckpoint / mountCheckpoint", () => {
  const checkpoint = {
    question: "What is a pod?",
    options: [
      { label: "A public website", response: "Not quite — nothing is public by default." },
      { label: "My own locker", correct: true, response: "That's it." },
    ],
  };

  it(`throws above ${MAX_CHOICES} options`, () => {
    const options = Array.from({ length: MAX_CHOICES + 1 }, (_, i) => ({
      label: `Option ${i}`,
      response: "…",
    }));
    expect(() => renderCheckpoint({ question: "Too many?", options })).toThrow();
  });

  it("hides the response until an answer is chosen", () => {
    const host = mount(renderCheckpoint(checkpoint));
    expect(host.querySelector<HTMLElement>(".checkpoint-response")!.hidden).toBe(true);
  });

  it("explains a WRONG answer rather than just rejecting it", () => {
    const host = mount(renderCheckpoint(checkpoint));
    mountCheckpoint(host, checkpoint);

    host.querySelector<HTMLButtonElement>('[data-checkpoint-option="0"]')!.click();

    const response = host.querySelector<HTMLElement>(".checkpoint-response")!;
    expect(response.hidden).toBe(false);
    expect(response.textContent).toContain("nothing is public by default");
    // Not styled as correct — but not as a failure either.
    expect(response.classList.contains("is-correct")).toBe(false);
  });

  it("reports the correct answer", () => {
    const host = mount(renderCheckpoint(checkpoint));
    const answers: boolean[] = [];
    mountCheckpoint(host, checkpoint, (correct) => answers.push(correct));

    host.querySelector<HTMLButtonElement>('[data-checkpoint-option="1"]')!.click();

    expect(answers).toEqual([true]);
    expect(
      host.querySelector<HTMLElement>(".checkpoint-response")!.classList.contains("is-correct")
    ).toBe(true);
  });

  it("announces the response, which appears away from the focused button", () => {
    const host = mount(renderCheckpoint(checkpoint));
    mountCheckpoint(host, checkpoint);

    host.querySelector<HTMLButtonElement>('[data-checkpoint-option="1"]')!.click();

    const live = document.querySelector('[aria-live="polite"]');
    expect(live?.textContent).toBe("That's it.");
  });
});

describe("renderEmptyState", () => {
  it("names what belongs here and offers the action that creates it", () => {
    const host = mount(
      renderEmptyState({
        title: "Nothing here yet",
        body: "This is where your séances will appear.",
        action: { label: "Start the first one", id: "start" },
      })
    );

    expect(host.querySelector("h2")?.textContent).toBe("Nothing here yet");
    expect(host.querySelector("#start")?.textContent).toBe("Start the first one");
  });

  it("works without an action", () => {
    const host = mount(renderEmptyState({ title: "Empty", body: "Nothing to do here." }));
    expect(host.querySelector("button")).toBeNull();
  });
});

describe("renderPending", () => {
  it("says what it is waiting for, and announces without stealing focus", () => {
    const host = mount(renderPending("Finding your pod…"));

    expect(host.textContent).toContain("Finding your pod…");
    expect(host.querySelector(".pending")?.getAttribute("role")).toBe("status");
    expect(host.querySelector(".pending-spinner")?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("toast", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows the message and disappears after the undo window", () => {
    toast("Séance deleted.");

    expect(document.querySelector(".toast")?.textContent).toContain("Séance deleted.");

    vi.advanceTimersByTime(UNDO_WINDOW_MS + 1);
    expect(document.querySelector(".toast")).toBeNull();
  });

  it("runs undo and dismisses immediately", () => {
    const undo = vi.fn();
    toast("Deleted.", { undo });

    document.querySelector<HTMLButtonElement>(".toast-undo")!.click();

    expect(undo).toHaveBeenCalledTimes(1);
    expect(document.querySelector(".toast")).toBeNull();
  });

  it("offers no undo button when there is nothing to undo", () => {
    toast("Saved.");
    expect(document.querySelector(".toast-undo")).toBeNull();
  });

  it("can be dismissed by hand before the window closes", () => {
    toast("Deleted.", { undo: () => {} });
    document.querySelector<HTMLButtonElement>(".toast-close")!.click();
    expect(document.querySelector(".toast")).toBeNull();
  });

  it("keeps only ONE toast — a stack is a second thing to manage", () => {
    toast("First.");
    toast("Second.");

    expect(document.querySelectorAll(".toast")).toHaveLength(1);
    expect(document.querySelector(".toast")?.textContent).toContain("Second.");
  });

  it("does not let a replaced toast's timer dismiss the new one", () => {
    toast("First.");
    vi.advanceTimersByTime(UNDO_WINDOW_MS - 100);
    toast("Second.");

    // The first toast's timer would fire here if it had not been cleared.
    vi.advanceTimersByTime(200);
    expect(document.querySelector(".toast")?.textContent).toContain("Second.");
  });

  it("escapes the message", () => {
    toast("<script>alert(1)</script>");
    expect(document.querySelector(".toast script")).toBeNull();
  });
});
