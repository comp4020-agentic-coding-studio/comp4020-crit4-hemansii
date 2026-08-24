# Process overview

## What I built

A browser xylophone: ten bars of C major pentatonic, played live with the Web
Audio API by mouse, touch or keyboard, with strike velocity and glissando drag
as the expressive controls.

## The moments that mattered

- **Choosing what the spec could actually check.** The spec mixes lines a test
  can assert ("sound is made live", "playable by mouse, keyboard or touch")
  with lines only a person can judge ("expressive", "no way to play it
  wrong"). Rather than write tests that only pretend to check the judged ones,
  `spec/instrument.test.ts` asserts just the mechanical ones: that the built
  JS constructs an `AudioContext` rather than playing a file, and that it
  wires up both pointer and keyboard input. They started red against the empty
  starter page and went green when the xylophone landed
  ([`c1b70f5`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-hemansii/commit/c1b70f5)
  red, [`70eafed`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-hemansii/commit/70eafed)
  green).


- **Making "two players sound different" demonstrable.** That line is judged
  by ear at the crit, so nothing in the repo proves it on its own. I added
  record/playback: every hit, from any input, is captured as (bar, velocity,
  timestamp) and replayed exactly. Two people can each record a run on the
  same instrument and compare, instead of the tutor taking it on trust
  ([`f95c786`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-hemansii/commit/f95c786)).


- **Two sensors the checks don't have.** `pnpm check` stayed green through the
  whole redesign while two real defects sat in the page, because nothing in it
  can hear a sound or look at a page. Computing contrast ratios directly
  caught the key letters at 3.05:1 against the darkest bar, under WCAG AA
  (fixed to 4.85:1). And a scripted pass over every input path --- tapping
  `createOscillator` to assert the frequencies that actually reached the audio
  graph --- caught the phone bars at 42px, just under the 44px touch target.
  Both were invisible to a green suite and to a careful look
  ([`b244682`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-hemansii/commit/b244682)).


