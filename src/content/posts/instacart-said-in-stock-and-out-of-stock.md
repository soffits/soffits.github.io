---
title: "Instacart said the pasta was in stock and out of stock"
description: "Adding stock and prices to an Instacart CLI meant choosing between two availability fields that disagree, and keeping one item's null price from failing a whole search."
pubDatetime: 2026-11-08
tags: ["go", "graphql", "open-source"]
---

The Instacart CLI in [printing-press-library](https://github.com/mvanhorn/printing-press-library/tree/main/library/commerce/instacart) can search a store, add items and show a cart. Until this week, `cart show` printed names and quantities and nothing else. The same cart on the website had a line under Tomato on the Vine: "This item is not available in your area." The CLI gave no sign of it, so an item could sit in a cart, unavailable, until someone happened to open the web page.

My change for that is merged as [#2432](https://github.com/mvanhorn/printing-press-library/pull/2432). It also makes the host configurable so the CLI works on instacart.ca, but that part is plumbing. The interesting part was reading what Instacart actually sends back.

## Which field says it's in stock?

The cart query, `CartData`, has no price or availability at all. The web app gets those from a separate persisted query, `Items`, and every item in that response has an availability block. Here is one from the live responses I recorded for the tests, trimmed:

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

`stockLevel` is the field you'd reach for first, since it has the most detail (`highlyInStock`, `inStock`, `lowStock`, `outOfStock`). It says `inStock`. The boolean, the label the shopper sees, and the "Show similar" button all say the opposite. A CLI that trusted `stockLevel` would print this pasta as available.

So `available` decides. `stockLevel` is only used after that, to split "low stock" from "in stock", and Instacart's own label is printed next to it when it adds something. That matters for another odd item in the recordings, smoked salmon with `available: true`, `stockLevel: "lowStock"` and the label "Likely out of stock". It prints as `low stock (Likely out of stock)`, which is honest about what Instacart knows.

I can guess why the two fields disagree: `stockLevel` looks like a store inventory estimate, and `available` may also cover whether the item can be delivered to this address, which would fit the "not available in your area" wording. I haven't found anything from Instacart that confirms it, so the code doesn't depend on that reading. It just treats the field that matches the website as the answer. The tomatoes the web cart had flagged came back from the patched `search` as `UNAVAILABLE (Out of stock)`.

## One null price emptied the search

One recorded `Items` response had this next to the data:

```json
"errors": [
  { "message": "Internal Error", "path": ["items", 4, "price"] }
]
```

Item 4 was strawberries, out of stock, with `price: null`. Everything else in the response was fine. GraphQL allows that: a field fails, it becomes `null`, the error explains which path, and the rest of `data` still arrives. The CLI's client turns any entry in `errors` into a Go error, and `search` gave up as soon as it saw one. One out-of-stock item without a price made the whole search fail.

Search now parses whatever `data` came back and only fails when the error left nothing to show. The parser also skips `null` entries in the `items` list, which the same response had one of. In `cart show`, a line that `Items` didn't return is marked `availability unknown` instead of quietly printing as if it were fine.

The tests run against scrubbed copies of those real responses, with the null entry, the contradictory pasta and the `Internal Error` left in. A fixture I wrote by hand would probably have given every item a price.
