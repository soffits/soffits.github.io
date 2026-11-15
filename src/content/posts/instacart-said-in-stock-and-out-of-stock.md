---
title: "Instacart marked the pasta available and unavailable"
description: "Instacart's item data has two availability fields that can disagree, and one null price was enough to fail a whole search in the CLI."
pubDatetime: 2026-11-08
modDatetime: 2026-11-14
tags: ["go", "graphql", "open-source"]
---

The Instacart CLI in [printing-press-library](https://github.com/mvanhorn/printing-press-library/tree/main/library/commerce/instacart) can look up a store, add products and show your cart, and I'd been using it to put grocery orders together. Until this week, `cart show` only gave you names and quantities. On the website, the same cart had a note under Tomato on the Vine: "This item is not available in your area." The CLI never showed that, so a dead item could sit in the cart until someone happened to open the web page.

My fix is merged as [#2432](https://github.com/mvanhorn/printing-press-library/pull/2432). It also adds a host option so you can point the CLI at instacart.ca, but that part is just plumbing. The interesting part was what Instacart's responses actually say.

## Which field to believe

`CartData`, the cart query, has no price or availability at all. The web app gets those from a separate persisted query called `Items`, which returns an availability block for each item. Here's a shortened one from the live responses I recorded for the tests:

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

`stockLevel` looks like the field to use, since it has the most detail (`highlyInStock`, `inStock`, `lowStock`, `outOfStock`). Here it says `inStock`. The boolean says the opposite, and so do the label shoppers see and the "Show similar" button. Three answers to one question, in one object. If the CLI went by `stockLevel`, it would tell you the pasta is in stock.

So `available` decides. `stockLevel` only comes in after that, to tell "low stock" from "in stock", and Instacart's own label goes next to it when it adds something. That mattered for another odd item in the recordings, smoked salmon with `available: true`, `stockLevel: "lowStock"` and the label "Likely out of stock". The CLI prints `low stock (Likely out of stock)`, which is about as much as Instacart knows too.

My guess is that `stockLevel` is an estimate from store inventory and `available` also checks delivery to your address, which would explain the "not available in your area" wording. I couldn't find anything from Instacart that confirms it, so the code doesn't depend on that. It just trusts the field that matches what the website shows. With the patch in, `search` listed the tomatoes from the web cart as `UNAVAILABLE (Out of stock)`.

## One null price broke the whole search

One recorded `Items` response had this next to its data:

```json
"errors": [
  { "message": "Internal Error", "path": ["items", 4, "price"] }
]
```

Item 4 was strawberries, unavailable, with `price: null`. Everything else in the response was fine. That's allowed in GraphQL: one field fails and becomes `null`, the error gives its path, and `data` still comes back for the rest. The CLI's client turned every `errors` entry into a Go error, and `search` stopped at the first one. So a single unavailable item without a price killed the entire search.

Now `search` uses whatever `data` comes back and only fails if the error leaves nothing to show. The parser also skips `null` entries in the `items` list, because that response had one of those too. In `cart show`, a line that's missing from `Items` now says `availability unknown` instead of looking normal.

The test data is those real responses, cleaned up, and it still has the null entry, the contradictory pasta and the `Internal Error`. If I'd written the fixtures by hand, I'd probably have given every item a price.
