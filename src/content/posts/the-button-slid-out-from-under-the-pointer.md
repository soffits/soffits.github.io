---
title: "The button kept running away from the cursor"
description: "An 8px gap on a slide-out dock button meant a pointer resting 6px from the viewport edge lost :hover as soon as the button moved."
pubDatetime: 2026-10-18
modDatetime: 2026-11-15
tags: ["css", "browser-extensions"]
---

I help work on `OpenBrowserAgent`, a browser extension that, among other things, puts a small page-translate button on every page. The button sits half-tucked into the right edge of the viewport and slides out when you hover it:

```css
.page-button-dock[data-edge="right"] {
  --out-x: calc(-100% - var(--page-button-gap));
}

.page-button-dock:hover {
  transform: translate(var(--out-x), var(--out-y));
}
```

There's a browser test for it. It points the cursor `6px` from the right edge, waits for the button to slide out, and clicks. It had been passing. Then, on the `0.2.0-beta.12` release commit, it started timing out, 3 runs out of 5 on my machine.

That's the worst kind of flaky. It fails often enough to block a release and passes often enough that the timeout, the headless browser and your own machine all look like better suspects than the code. What found it in the end was plain arithmetic about where the button actually is.

Tucked in, the visible half of the 36px button covers the strip from `0px` to `18px` from the right edge. Hovered, it slides onto the page plus an `8px` gap (`--page-button-gap`), so it now covers `8px` to `44px`.

The test's cursor is at `6px`. It hovers the tucked button, the button slides out to `8px–44px`, and now nothing is under the cursor, so `:hover` drops. The button slides back under the cursor, the next pointer event hovers it again, and round it goes. The button was running away from the pointer that was trying to click it. Once I wrote the two ranges next to each other it was almost funny.

It also explains why it only failed sometimes. In headless Chromium, `:hover` is only re-evaluated when a pointer event fires, so a synthetic cursor that sat still left the button where it was. A real hand, or a run with a few more mouse events, made it bounce between `756px` and `769px`.

The fix is to bridge that `8px` gap with an invisible `::after` on the dock:

```css
.page-button-dock::after {
  content: "";
  position: absolute;
  inset: 0;
}

.page-button-dock[data-edge="right"]::after {
  left: 100%;
  right: calc(-1 * var(--page-button-gap));
}
```

`::after` counts as part of the element for hit testing, so a cursor in the `0px–8px` gap keeps `:hover` active while the button is out. When the button is tucked, that strip sits off-screen past the viewport edge and doesn't get in the way of anything. The same PR fixed a separate race where a tab helper ran in `about:blank` before the target page had loaded, and after both the browser suite passed 13 runs in a row locally.

What I keep from this one is small. The test wasn't flaky, it was right about a bug a real person would hit: park your mouse near the edge of the screen and the button jitters instead of letting you click it. When a hover test fails "sometimes", I now write down the hit areas before I touch the timeouts.
