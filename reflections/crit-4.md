# Crit 4 — An instrument

## What was the breakthrough that moved the work forward?

Deciding that "there is no way to play it wrong" belonged in the scale, not in
the player.

My first instinct was a keyboard-shaped instrument with every note available.
That would have left the spec line depending on the player's restraint — hit
the wrong two notes together and it sounds bad, so the only defence is not
doing that. Choosing two octaves of C major pentatonic instead made consonance
a property of the instrument itself: any combination of its five notes works,
so there is no wrong note to reach for. The requirement stopped being
something I had to police and became something the material guaranteed.

That move generalised further than I expected. `pnpm check` stayed green
through nearly every real defect this week, because nothing in it can hear a
sound or look at a page. So rather than trust it, I built sensors that could
see what it couldn't: computing contrast ratios directly, which caught the key
letters at 3.05:1 and under WCAG AA; asserting computed styles, which caught
the mallet cursor silently falling back to an arrow on the bars; and
intercepting `createOscillator` to assert the frequencies that actually
reached the audio graph, instead of only that a handler had fired.

## What did this work change about who I want to be as a developer?

I want to stop filing vague reactions under taste. Three times I could tell
something was wrong without being able to say what — the resonators, the
mallet, the wording of the hint — and each had a specific, findable cause.
The instinct I want is to reach for a measurement before an opinion.
