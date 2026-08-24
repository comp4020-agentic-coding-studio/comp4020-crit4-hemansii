# Process overview

A reading-guide to how the work came together --- a map to your process, not an
essay about it. Markers read this file and follow its citations; they don't
trawl the repo for evidence you didn't point at, so if a moment mattered, cite
it.

This file is the shape; the course site's
[assessment page](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#what-you-submit)
is the requirement, and its
[word counts](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#word-counts)
cover every deliverable.

## What I built

A browser xylophone for Crit 4 ("An instrument"): ten bars across two octaves
of C major pentatonic, played live with the Web Audio API by mouse, touch, or
keyboard, with velocity and glissando drag as the expressive controls.

## The moments that mattered

- **The stack conversion script silently dropped the link-preview card.**
  Running the course `stack` skill's Astro conversion folded `index.html` into
  a new `Layout.astro`, but the script carried over only `<title>` --- the
  `meta description` and `og:image` tags were gone, which would have failed
  the shipped invariants and shipped a bare link preview. Rather than
  re-running the script or patching it blind, I diffed the pre-conversion
  `index.html` against the generated `Layout.astro`, found exactly what was
  missing, and threaded `description`/`card` through as `Layout.astro` props
  instead of hardcoding them, so every future page gets the same defaults for
  free. `pnpm check` went from 2 failing invariants to 18/18 green
  ([`5b665c0`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-hemansii/commit/5b665c0)).

- **Choosing what the spec could actually check.** The published spec mixes
  lines a test can assert ("sound is made live," "playable by mouse, keyboard
  or touch") with lines only a person can judge at the crit ("expressive,"
  "a stranger can play it uninstructed," "no way to play it wrong"). Rather
  than writing a spec test that only pretends to check the judged ones, I
  wrote `spec/instrument.test.ts` to assert only what's mechanical: that the
  built JS constructs an `AudioContext` (not a pre-recorded `<audio>`
  element), and that it wires up both pointer and keyboard handlers. Those
  tests started red against the still-empty starter page and went green once
  the xylophone shipped
  ([`c1b70f5`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-hemansii/commit/c1b70f5)
  red, [`70eafed`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-hemansii/commit/70eafed)
  green).

- **Picking a scale, not just an instrument.** The brief's "no way to play it
  wrong" line is easy to state and easy to miss in practice --- a chromatic
  keyboard has plenty of wrong-sounding combinations. I chose two octaves of
  C major pentatonic specifically because *any* combination of its five notes
  sounds consonant together, which pushes "you can't play it wrong" into the
  scale itself rather than relying on the player's restraint. I verified the
  build by driving it headlessly (click, keyboard, and a drag glissando
  across bars) with Playwright and checking the console stayed clean, not
  just that `pnpm check` passed
  ([`70eafed`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-hemansii/commit/70eafed)).

- **Playtesting found the velocity was there but couldn't be heard.**
  After shipping the xylophone I played it myself and asked for a second
  opinion: hitting near the top vs. the bottom of a bar was supposed to feel
  like a different strike, but it read as a barely-different volume tweak.
  Rather than just widening the gain range, I made a hard hit change *timbre*
  too --- more overtone, a shorter attack --- because a real mallet strike
  isn't only louder when it's harder, it's brighter
  ([`85a3a86`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-hemansii/commit/85a3a86)).
  The same pass replaced a visible, pointless self-linking "Home" nav with a
  skip-link that's invisible until focused --- the nav landmark invariant
  still passes, but there's no dead chrome above the instrument.

- **Making "two players sound different" demonstrable, not just claimed.**
  That line in the spec is judged by ear at the crit, which means nothing in
  the repo proves it on its own. I added record/playback: every hit, from
  any input method, is captured as (bar, velocity, timestamp) and can be
  replayed exactly. Two people can each record a short run on the same
  instrument and compare the results directly, rather than the tutor having
  to take it on trust
  ([`f95c786`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-hemansii/commit/f95c786)).

- **Designing against the rendered page, not the stylesheet.** The spec asks
  that "the opening screen invites the first sound," which the starter's
  plain white page and CSS-rainbow bars plainly didn't. Committing to one
  direction --- a warm concert xylophone --- let me build real instrument
  anatomy (walnut frame, graduated bars on a common suspension axis, brass
  resonators lengthening toward the low notes) instead of decorating a
  widget. I worked from screenshots of the *built* site at both marking
  viewports rather than the dev server, which is what caught three things
  the CSS looked fine for: bars stretched full-width read as buttons rather
  than slats, the resonators were too stubby to read as tubes at all, and on
  a 390px phone ten bars left ~33px each --- too fine to strike, so the rack
  now stands on end with full-width bars
  ([`b244682`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-hemansii/commit/b244682)).

- **Two sensors the checks don't have.** `pnpm check` stayed green through
  the whole redesign while two real defects sat in the page, so I measured
  rather than trusted it. Computing contrast ratios directly showed the
  engraved key letters at 3.05:1 against the darkest bar --- under WCAG AA
  --- which I fixed by raising the low end of the wood ramp and setting the
  letters in solid ink, to 4.85:1. And a scripted pass over every input path
  (click, drag glissando, each keyboard letter, record, playback) tapping
  `createOscillator` to assert the *frequencies that actually reached the
  audio graph* caught that the phone bars had landed at 42px, just under the
  44px touch target. Both are things a green suite and a careful look would
  both have missed.

- **A reviewer's "that looks a bit off" was a real bug, not taste.** Shown a
  screenshot, my reviewer said the gold resonator tubes "don't look bad, they
  just don't look the best" --- no diagnosis, just that something was wrong.
  It would have been easy to treat that as a styling preference and nudge the
  colour. Measuring instead found the actual defect: each tube hung from the
  bottom of the fixed bar-zone rather than from the bar above it, so the gap
  grew as the bars shortened and the top notes' resonators drifted away from
  theirs. Pulling each tube up by exactly that gap
  (`--zone * --t * 0.21`) makes every one hang 6px under its own bar, which I
  confirmed by asserting the measured bar-bottom-to-tube-top distance across
  all ten slots rather than by looking again
  ([`f29976f`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-hemansii/commit/f29976f)).

## Before you ship

`pnpm check:evidence` verifies your citations resolve to real commits, that a
reflection entry the marker reads is in `reflections/`, and that your
`CLAUDE.md` is there --- before a marker ever opens the file. It checks that
your map is traceable, not that it is good: the marker judges whether your
small, deliberately chosen set of moments shows real judgement and reflection. A
green check is not a substitute for that curation.

Images aren't checked: whether one renders is visible the moment you look. Open
this file on GitHub and look at it before you ship.
