---
title: "The button slid out from under the pointer"
description: "A translate button that slides out on hover stopped 8px short of the screen edge. A pointer resting 6px from the edge made it flicker, and the browser test that caught it looked flaky."
pubDate: 2026-10-18
tags: ["css", "testing", "browser-extensions"]
---

OpenBrowserAgent has a page translate button that sits half tucked into the edge of the page. Point at it and it slides out. Move away and it slides back. Most of that is two CSS rules:

```css
.page-button-dock[data-edge="right"] {
  --out-x: calc(-100% - var(--page-button-gap));
}

.page-button-dock:hover {
  transform: translate(var(--out-x), var(--out-y));
}
```

When the button is tucked, its centre sits on the edge of the viewport, so the part you can see is the 18px of a 36px button closest to the edge. When it comes out, it moves fully onto the page and then another `--page-button-gap` further, which is 8px, so it doesn't touch the edge. I read that gap as ordinary spacing.

The browser test for the button points at the visible half, 6px in from the edge, waits for the button to move, and clicks. It passed when the feature merged. Later the same day it failed on the release commit for 0.2.0-beta.12 with `Browser check timed out`. Run locally, it failed 3 times out of 5.

Six pixels from the edge is exactly where the button isn't once it's out. Out, it covers the strip from 8px to 44px. So the pointer hovers the tucked button, the button slides away from under it, `:hover` ends, the button slides back, its edge passes under the pointer, and `:hover` starts again.

I rebuilt that in a bare page with only the dock rules and a 220ms transition, put the pointer 6px from the right edge, and sent the same mouse position every 50ms. The button's left edge, read after each event, went 756, 768, 758, 769, 759, 756, 768 and kept cycling like that for the full three seconds. With the fix below it stopped at 756 and stayed.

One part surprised me. When I stopped sending mouse events, the unfixed button stayed out too. In headless Chromium, at least, hover wasn't checked again just because the element moved; it waited for the next pointer event. So the flicker needs a pointer that keeps producing events, which a hand resting a mouse against the side of the screen usually does.

That makes the failing test look less flaky to me. It was the one place where something used the button the way a person reaching for the screen edge does. I can't prove why it passed on some runs, but the likely reason is that the click sometimes landed while the button happened to be under the pointer.

The fix ([PR #122](https://github.com/Lumysia/OpenBrowserAgent/pull/122)) fills the gap with a strip that belongs to the dock:

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

A pseudo-element is part of its element for hit testing, so a pointer on the strip still counts as hovering the dock. When the button is out, the strip covers the 8px between it and the edge. When the button is tucked, the strip sits past the edge of the viewport, so it doesn't make the button catch any extra space on the page. The other three edges get the same strip on their side.

The test code didn't change. Only its comment now says why it points so close to the edge. After the fix it passed 13 times in a row locally, and CI on main went green.

Main had one more failure at the time, and that one really was the test's fault. A helper that attaches to an open tab sometimes ran its check in the tab's initial `about:blank` document, before the real page loaded, where extension storage doesn't exist. It now waits for the tab's own document. That fix went into the same PR.

The thing I'd check next time is where an element goes when it moves on hover, compared with where the pointer was when it started moving. Here those were 2px apart, and on the wrong side.
