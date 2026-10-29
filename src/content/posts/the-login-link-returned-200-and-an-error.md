---
title: "Taking ikea-cli from Canada to 51 countries"
description: "Generating per-country configs from www.ikea.com turned up German prices with two dots, Saudi login links that redirected to an Auth0 error page with HTTP 200, and 21 markets on a newer session system."
pubDatetime: 2026-10-25
tags: ["python", "open-source"]
---

When I released [ikea-cli](https://github.com/soffits/ikea-cli) 0.1.0, it only worked against IKEA Canada. Version 0.2.0 expands that to the 51 countries IKEA serves from `www.ikea.com/<country>/<language>/`.

Rather than maintaining a country table by hand, `scripts/update_markets.py` generates `markets.json` directly from IKEA's live site:

- the `hreflang` links on `www.ikea.com` for countries on the shared platform, plus IKEA's country-picker data for display names and countries that run separate sites (China, Türkiye, Greece, and a dozen others);
- a bare request to `www.ikea.com/<cc>/` with no `Accept-Language` header, so IKEA's redirect chooses the market's default language;
- each market's login page bundle, which embeds an Auth0 domain and public client ID;
- sample product searches to learn each market's currency symbol and price formatting.

Two things in that generator output surprised me.

## German prices with `.` for both thousands and decimals

IKEA's search API does not return a formatted price string; it returns pieces:

```python
{'prefix': '', 'wholeNumber': '2.040', 'separator': '.', 'decimals': '00', 'suffix': '€'}
```

That payload is from Germany for a PAX wardrobe. Both the thousands separator inside `wholeNumber` and the decimal `separator` field are `.`, so concatenating them literally produces `2.040.00€`. Rather than pulling in a locale library and overriding what IKEA sends, the generator checks whether `wholeNumber` already uses the same character as `separator` and strips the grouping mark when they collide. German prices print as `2040.00€`, while other markets keep their native formatting (`1 299,00 $` in Canadian French, `CHF 3'540.25`, `47 570:-` in Sweden, and three decimal places in Bahrain).

## An Auth0 error page that returned HTTP 200

Each market's login bundle usually points at `<cc>.accounts.ikea.com` and a public client ID. `ikea-cli` uses those for a browser copy-paste login flow so it never touches the user's password. My first check opened each market's authorize URL and verified that it returned HTTP 200.

Saudi Arabia and Bahrain both pointed at `au.accounts.ikea.com` (the Australian tenant) and returned 200, right after redirecting to:

```text
https://au.accounts.ikea.com/en/identity/error-container/?client_id=...&error=unauthorized_client&error_description=Callback%20URL%20mismatch.
```

Because Auth0 renders that error page with a 200 status, a status-code check passed even though `au.accounts.ikea.com` rejects `www.ikea.com/sa/ar/profile/login/` as a callback URL. The generator now follows redirects and drops login settings whenever the final URL lands on an error page or includes `error=`.

## Twenty-one markets on server-side sessions

Saudi Arabia and Bahrain turned out to be part of a wider split. Nineteen newer markets do not load the client-side Auth0 bundle at all; their sign-in uses a server-side session with no public client ID, their guest cart endpoint returns 401 on fresh tokens, favourites return `"Retail ID is not supported"`, and the delivery API omits them. Saudi Arabia and Bahrain behave the same way, suggesting their old login bundle is just left over.

The generator runs read-only guest probes per market and records which endpoints work. Out of 51 markets in `markets.json`, 30 support login, cart, favourites, and delivery, while 21 support search, product pages, stores, and stock only (with Ukraine marked unusable online because it lists no products). On those 21 markets, `ikea cart` exits early with a clear message instead of failing with a raw 401.

I ran the 44-check guest test suite live against Canada (English and French), the US, the UK, Germany, France, Sweden, Spain, Japan, South Korea, and Australia, plus the search/stock subset in the UAE (fixing a South Korea delivery bug along the way where the fulfilment API required `""` instead of `null` for an empty state code). Real account login, cart, and order history have only been tested with a Canadian account so far, and the README table marks which markets have been tested end-to-end.
