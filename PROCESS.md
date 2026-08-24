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

## Before you ship

`pnpm check:evidence` verifies your citations resolve to real commits, that a
reflection entry the marker reads is in `reflections/`, and that your
`CLAUDE.md` is there --- before a marker ever opens the file. It checks that
your map is traceable, not that it is good: the marker judges whether your
small, deliberately chosen set of moments shows real judgement and reflection. A
green check is not a substitute for that curation.

Images aren't checked: whether one renders is visible the moment you look. Open
this file on GitHub and look at it before you ship.
