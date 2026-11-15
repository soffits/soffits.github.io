---
title: "Instacart marked the pasta available and unavailable"
description: "Instacart's item data has two availability fields that can disagree, and one null price was enough to fail a whole search in the CLI."
pubDatetime: 2026-11-08
modDatetime: 2026-11-14
tags: ["go", "graphql", "open-source"]
---

Inside [printing-press-library](https://github.com/mvanhorn/printing-press-library/tree/main/library/commerce/instacart), the Instacart CLI lets you look up a store, add products, and view the cart. Before this week, running `cart show` gave you only names and quantities. The website showed a note beneath Tomato on the Vine for that same cart: "This item is not available in your area." That never appeared in the CLI, which meant a dead item could stay put in the cart unless someone opened the web page by chance.

I got my fix merged as [#2432](https://github.com/mvanhorn/printing-press-library/pull/2432). It also adds a host option, so you can point the CLI at instacart.ca, though that piece is just plumbing. What mattered was what the responses from Instacart really contain.

## What field really tells you about stock?

`CartData`, the cart query, carries neither price nor availability. The web app pulls those from a separate persisted query called `Items`, and that query gives back an availability block for each item. Below is a shortened example taken from live responses I captured for the tests:

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

At first, `stockLevel` seems like the right field, because it carries the most detail (`highlyInStock`, `inStock`, `lowStock`, `outOfStock`). In this case it reads `inStock`. The boolean says the opposite, and so do the label customers see and the button marked "Show similar". If the CLI believed `stockLevel`, it would report that the pasta is in stock.

That leaves `available` as the deciding field. Only after that does `stockLevel` matter, and then just to tell "low stock" from "in stock"; Instacart's own label sits beside it when the label adds something. That distinction matters for another strange item among the recordings: smoked salmon where `available: true`, `stockLevel: "lowStock"`, and the label reads "Likely out of stock". The CLI shows `low stock (Likely out of stock)`, and that's close to the limit of what Instacart knows too.

I suspect `stockLevel` is an estimate from store inventory, but `available` also verifies delivery to your address; that would explain the "not available in your area" wording. I found no confirmation from Instacart, so the code doesn't rely on that theory. It simply trusts whichever field matches the website. Once the patch was in, `search` listed the web-cart tomatoes as `UNAVAILABLE (Out of stock)`.

## How a single null price took down search

A recorded `Items` response included this beside its data:

```json
"errors": [
  { "message": "Internal Error", "path": ["items", 4, "price"] }
]
```

Item 4 was strawberries, unavailable, with `price: null`. The rest of the response was fine. GraphQL permits this: a single field fails and turns into `null`, the error names its path, and `data` still arrives for everything else. The CLI client made every `errors` entry a Go error, then `search` quit at the first one. A single unavailable item with no price was enough to kill the entire search.

Now `search` works with whatever `data` arrives, and it fails only if that error leaves no results to display. The parser also drops `null` entries from the `items` list, since that response had one as well. For `cart show`, any line missing from `Items` now gets `availability unknown` rather than looking normal.

The test data consists of those real responses, cleaned up, and it still includes a null entry, the contradictory pasta, and the `Internal Error`. If I'd written a fixture myself, I probably would've given each item a price.
