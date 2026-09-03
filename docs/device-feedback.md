# Device feedback: sound, haptics, screen wake

Learnings from solid-sport-tracker, where an app has to be followed **hands
busy, phone in a pocket or on the floor** — a workout timer. Nothing here is in
the kit as code: the three channels are only worth wiring when an app actually
needs them, and each one is small. What is worth copying is the list of things
that cost a debugging session the first time.

The three toggles are always the same three: **sound**, **haptics**, **screen
stays on**.

## They are device preferences, not user preferences

Store them in `localStorage`, never on the pod. They describe the room and the
hardware — a silent yoga class, a run with headphones, a tablet on a stand —
not the person. The same person wants opposite settings on two devices, and
syncing them through the pod actively fights the user.

This is the one rule here that is a *design* decision rather than a platform
constraint, and it is the one most likely to be got wrong by default.

## Both audio and video need a user gesture

An `AudioContext` is created **suspended** until a user gesture resumes it. If
the app builds it at load and only plays at the first event, nothing is ever
heard, and there is no error — the beeps simply do not exist.

Arm it from the tap that starts the thing (the "Start" button), not from the
toggle alone, and not from a timer callback. The same applies to the video
fallback described below: `video.play()` outside a gesture rejects.

## `navigator.vibrate` does not exist on iOS Safari

And where it does exist, it does nothing while the page is hidden.

Consequence to state in the app's own README rather than discover twice: **an
"eyes-free by vibration" goal is unreachable on iPhone**, whatever the code
does. On iOS the usable channel is sound. A pattern designed for a wrist and a
pattern designed for an ear in headphones are not the same pattern, so this
changes design, not just support.

Hide the toggle when unsupported rather than showing a button that lies —
`"vibrate" in navigator` is the check.

## Screen wake: two routes to the same thing

There is no "override the device setting". There are two entry points into the
*same* OS sleep inhibition:

1. `navigator.wakeLock.request("screen")` — the dedicated API.
2. A muted, looping, 1px `<video>` playing — the "YouTube trick". A browser
   playing video asks the system to stay awake by itself.

The video is **not stronger** than a granted lock, which is the intuition to
correct: it is a different door to the same room. It earns its place as a
fallback where `navigator.wakeLock` is missing (Firefox mobile, insecure
contexts, iOS before 18.4) and where a granted lock is dropped and cannot be
retaken.

Details that matter:

- **The browser releases the lock whenever the page is hidden.** Re-acquire on
  `visibilitychange`. Without this the lock survives exactly one notification.
- Listen to the sentinel's `release` event. A drop while the page is visible and
  the lock is still wanted is the signal to start the video fallback.
- The fallback video can be generated locally — 3 s of black 64×64 VP9 is
  **581 bytes**, no dependency, `ffmpeg -f lavfi -i color=c=black:s=64x64:r=1
  -t 3 -c:v libvpx-vp9 -b:v 10k -an blank.webm`. WebM covers Android and
  Firefox; a WebM-only fallback leaves old iOS Safari uncovered, which is
  already the most constrained platform (see vibration above).
- Position the video off-screen with `opacity: 0`, **not** `display: none` — a
  browser pauses a video it considers unrendered, and a paused video inhibits
  nothing.

## A toggle acts on tap, or it is lying

The bug worth naming: screen-wake acquisition was guarded on "a session is
running", so turning the toggle on before starting held nothing. The button
showed itself as on while nothing was held.

Two reasons that guard is wrong, and the second is the one that bites: the tap
is *also* the user gesture the acquisition needs. Deferring the acquisition to a
later, gesture-less moment can make it fail outright.

## Make the active path visible, or you cannot debug it

"The screen still goes dark" is indistinguishable from "the lock was never
taken" from the other end of a conversation, and both from "the OS ignored a
lock it granted". Days can go into guessing between those.

The fix is three characters on the button: which path is live (native / video /
neither) plus a counter of unexpected drops. It turned an unfalsifiable report
into one round trip. It was added as a debugging aid and kept, because the
question "is my screen actually being held" is one the user has too.

Poll it — the video path has no event to say it stopped. And repaint **after**
the `await`, not before: acquisition is asynchronous, and a readout painted
first shows a stale state until the next poll.

## Related: measure time by the clock, not by ticks

Adjacent to signals because it is the other thing a backgrounded mobile tab
breaks. Android throttles a hidden tab's `setInterval` to roughly once a minute,
then freezes it. A timer that counts ticks under-reports real elapsed time by
more than half, silently.

Compute from `Date.now()` deltas and treat the interval as nothing but a repaint
trigger; re-sync from the clock on `visibilitychange`. When catching up across
several elapsed steps at once, drain them **silently** and emit one signal at
the end — otherwise the return to foreground fires a burst of beeps for steps
that finished while the phone was in a pocket.
