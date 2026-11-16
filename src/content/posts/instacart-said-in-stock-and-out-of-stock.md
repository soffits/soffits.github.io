---
title: "Three things in the grocery cart were unavailable, and my CLI said nothing"
description: "Instacart's item data has two availability fields that can disagree, and one null price was enough to fail a whole search in the CLI."
pubDatetime: 2026-11-08
modDatetime: 2026-11-15
tags: ["go", "graphql", "open-source"]
---

I help someone in my family with their grocery orders, and I'd been putting the carts together from a terminal with the Instacart CLI in [printing-press-library](https://github.com/mvanhorn/printing-press-library/tree/main/library/commerce/instacart). It can look up a store, add products and show you the cart, and for a few weeks that was all I needed.

Then they opened the cart on the website before an order and asked me why two of the things said they weren't available. There were actually three. Under the vine tomatoes, for one, it said "This item is not available in your area." I hadn't seen any of it, because `cart show` only listed names and quantities. A dead item could sit in that cart until a person happened to open the web page, and this time the person wasn't me.

That stung a little, so I fixed it. The change is merged as [#2432](https://github.com/mvanhorn/printing-press-library/pull/2432). It also adds a host option so the CLI isn't tied to one Instacart site, but that part is plumbing. What I didn't expect was how hard it was to get a straight answer out of Instacart's own data.

## Which field to believe

`CartData`, the cart query, has no price or availability at all. The web app gets those from a separate persisted query called `Items`, which returns an availability block for each item. I expected to read that block and be done. Here's a shortened one from the live responses I recorded for the tests:

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

`stockLevel` looks like the field to use. It has the most detail (`highlyInStock`, `inStock`, `lowStock`, `outOfStock`). Here it says `inStock`. The boolean says the opposite, and so do the label shoppers see and the "Show similar" button. That's three answers to one question inside one object. A CLI that went by the most detailed field would have cheerfully told you the pasta was in stock, which is exactly the mistake I was trying to fix.

So `available` decides. `stockLevel` only comes in after that, to tell "low stock" from "in stock", and Instacart's own label goes next to it when it adds something. That mattered for another odd item in the recordings, smoked salmon with `available: true`, `stockLevel: "lowStock"` and the label "Likely out of stock". The CLI prints `low stock (Likely out of stock)`, which is about as much as Instacart knows too.

My guess is that `stockLevel` is an estimate from store inventory and `available` also checks delivery to your address, which would fit the "not available in your area" wording. I couldn't find anything from Instacart that confirms it, so the code doesn't depend on it. It trusts the field that matches what the website shows. With the patch in, `search` listed the tomatoes from that web cart as `UNAVAILABLE (Out of stock)`.

## One null price broke the whole search

One recorded `Items` response had this next to its data:

```json
"errors": [
  { "message": "Internal Error", "path": ["items", 4, "price"] }
]
```

Item 4 was strawberries, unavailable, with `price: null`. Everything else in the response was fine. GraphQL allows that: one field fails and becomes `null`, the error gives its path, and `data` still comes back for the rest. The CLI's client turned every `errors` entry into a Go error, and `search` stopped at the first one. One unavailable box of strawberries without a price killed the entire search.

Now `search` uses whatever `data` comes back and only fails if the errors leave nothing to show. The parser also skips `null` entries in the `items` list, because that response had one of those too. In `cart show`, a line that's missing from `Items` now says `availability unknown` instead of looking normal.

The test data is those real responses, cleaned up, with the null entry, the contradictory pasta and the `Internal Error` all still in it. I'm glad I recorded them instead of writing fixtures by hand. I'd have given every item a price and one honest availability flag, and the tests would have passed against a version of Instacart that doesn't exist.

Was it worth a PR for a cart that someone could just open in a browser? I think so. The whole reason to use a CLI for groceries is that you don't have to open the browser, and a CLI that hides "unavailable" makes you open it anyway, just later and with someone else catching the mistake for you. If you script against a store's GraphQL, I'd record a few real responses early, before you've decided what the data looks like.
