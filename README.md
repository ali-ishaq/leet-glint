# LeetGlint

LeetGlint is a restrained Chrome extension for LeetCode. It appears in exactly two moments: when a problem statement is confusing, and when a user has a failed test. It gives one nudge and then steps away.

## Two trigger moments

1. Clarify a confusing problem statement
   - The extension adds a Clarify button near the problem header.
   - It rephrases the ambiguous wording in plain English without giving strategy or a solution.

2. Get a hint after a failing test
   - The extension hooks into the test result state and adds a Hint button when the run is wrong.
   - Each level narrows the bug without revealing corrected code.

## One nudge, then stop

The product philosophy is intentionally narrow: never coach a full session, never reveal a full solution, and never keep escalating after the user has already gotten a useful pointer. The extension limits hint escalation to three levels and clarify escalation to two levels.

## Setup

1. Install dependencies with `npm install`.
2. Run `npm run build`.
3. Open Chrome and choose Load unpacked.
4. Point Chrome at the generated `dist` folder.

## Provider setup

Open the options page to choose a provider and paste your API key. The key is stored only in Chrome local storage.
