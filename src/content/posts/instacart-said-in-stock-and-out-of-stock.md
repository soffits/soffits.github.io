---
title: "Instacart marked the pasta available and unavailable"
description: "Giving an Instacart CLI stock and price data required choosing between two conflicting availability fields and preventing a single null price from breaking an entire search."
pubDatetime: 2026-11-08
tags: ["go", "graphql", "open-source"]
---

The Instacart CLI inside [printing-press-library](https://github.com/mvanhorn/printing-press-library/tree/main/library/commerce/instacart) supports store searches, item additions, and cart display. Before this week, `cart show` output only names and quantities. On the website, that same cart carried a note beneath Tomato on the Vine: "This item is not available in your area." Nothing in the CLI reflected this, meaning an unavailable item could remain in a cart until a person chanced to visit the web page.

The fix I made is now merged under [#2432](https://github.com/mvanhorn/printing-press-library/pull/2432). It additionally allows the host to be configured, enabling the CLI to run against instacart.ca, though that portion is routine infrastructure. What proved interesting was examining Instacart's actual responses.

## Which field actually reports stock?

Neither price nor availability appears in the cart query, `CartData`. Those details come to the web app through a different persisted query, `Items`, whose response includes an availability block for each item. Below is a trimmed example from the live responses I captured for the tests:

```json
{
  "name": "Filotea La Matassine Egg Pasta Variety Pack",
  "availability": {
    "available": false,
    "stockLevel": "inStock",
    "viewSection": {
      "stockLevelLabelString": "Out of stock",
      "outOfStockCtaString": "Show similar"
    }
  }
}
```

`stockLevel` looks like the obvious first choice because it carries the greatest detail (`highlyInStock`, `inStock`, `lowStock`, `outOfStock`). For this item it reports `inStock`. Yet the boolean, the shopper-facing label, and the "Show similar" button each indicate the reverse. A CLI relying on `stockLevel` would display the pasta as available.

Therefore `available` is the deciding field. Only afterward does `stockLevel` come into play, separating "low stock" from "in stock", and Instacart's label appears beside that value when it says something more. This matters for a second strange recorded item: smoked salmon with `available: true`, `stockLevel: "lowStock"`, and the label "Likely out of stock". Its output is `low stock (Likely out of stock)`, an honest reflection of what Instacart knows.

A possible explanation for the conflict is that `stockLevel` resembles a store inventory estimate, while `available` might additionally account for whether delivery to this address is possible, matching the "not available in your area" phrasing. I have found no Instacart material confirming that theory, so the code does not rely on it. Instead, the field consistent with the website is treated as authoritative. After the patch, `search` returned the tomatoes flagged by the web cart as `UNAVAILABLE (Out of stock)`.

## How a single null price broke the search

A recorded `Items` response included the following alongside its data:

```json
"errors": [
  { "message": "Internal Error", "path": ["items", 4, "price"] }
]
```

Strawberries were item 4, unavailable, and had `price: null`. The rest of the response was valid. GraphQL permits this pattern: one field fails and turns into `null`, the error names the path, and the remaining `data` still comes through. The CLI client converts every `errors` entry into a Go error, and `search` quit the moment it encountered one. A single unavailable item lacking a price caused the entire search to fail.

Now `search` parses any `data` that arrives and fails only if the error leaves nothing displayable. The parser additionally ignores `null` entries in the `items` list, and the same response contained one such entry. Within `cart show`, any line absent from `Items` is labeled `availability unknown` rather than silently appearing normal.

Those real responses, scrubbed, form the test data, and the null entry, the inconsistent pasta, and the `Internal Error` remain present. Had I written a fixture manually, it would likely have assigned a price to every item.
