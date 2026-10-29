---
title: "A hover button that slid out from under the cursor"
description: "An 8px gap on a slide-out dock button meant a pointer resting 6px from the viewport edge lost :hover as soon as the button moved."
pubDatetime: 2026-10-18
tags: ["css", "browser-extensions"]
---

In `OpenBrowserAgent`, the page-translate button sits half-tucked into the right edge of the viewport and slides out on `:hover`:

```css
.page-button-dock[data-edge="right"] {
  --out-x: calc(-100% - var(--page-button-gap));
}

.page-button-dock:hover {
  transform: translate(var(--out-x), var(--out-y));
}
```

Tucked in, the visible half of the 36px button covers the strip from `0px` to `18px` from the right edge. When hovered, it slides onto the page plus an `8px` gap (`--page-button-gap`), so it now occupies `8px` to `44px`.

Our browser test pointed `6px` from the right edge, waited for the button to slide out, and clicked. On the `0.2.0-beta.12` release commit it started timing out, failing 3 times out of 5 locally. At `6px` from the edge, the pointer hovers the tucked button, the button slides over to `8px–44px`, `:hover` immediately drops because the button is no longer under the cursor, the button slides back, and the next pointer event starts the cycle all over again. (In headless Chromium, `:hover` is only re-evaluated when a pointer event fires, so a stationary synthetic cursor stayed put while a real hand or repeated mouse events made the button bounce between `756px` and `769px`.)

[PR #122](https://github.com/Lumysia/OpenBrowserAgent/pull/122) bridges that `8px` gap with an invisible `::after` pseudo-element on the dock:

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

Because `::after` counts as part of the element for hit testing, a cursor in the `0px–8px` gap keeps `:hover` active while the button is out, and sits off-screen past the viewport edge when the button is tucked. The same PR also fixed a separate test race where a tab helper ran in `about:blank` before the target page loaded, and the browser suite passed 13 runs in a row locally.
