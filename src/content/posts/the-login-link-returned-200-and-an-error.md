---
title: "Taking ikea-cli from Canada to 51 countries"
description: "Generating per-country configs from www.ikea.com turned up German prices with two dots, Saudi login links that redirected to an Auth0 error page with HTTP 200, and 21 markets on a newer session system."
pubDatetime: 2026-10-25
modDatetime: 2026-11-15
tags: ["python", "open-source"]
---

ikea-cli 0.1.0 only knew IKEA Canada, and 0.2.0 covers the 51 countries IKEA serves from `www.ikea.com/<country>/<language>/`. Getting there turned up German prices with two dots in them and a login check that passed while IKEA was rejecting the login.

I wrote [ikea-cli](https://github.com/soffits/ikea-cli) because I wanted to check stock and fill an IKEA cart from a terminal instead of clicking through the site. Canada came first because it's the one I use.

I didn't want to keep a country table up to date by hand, so `scripts/update_markets.py` builds `markets.json` from IKEA's live site. It looks at:

- the `hreflang` links on `www.ikea.com` for countries on the shared platform, plus IKEA's country-picker data for display names and countries that run separate sites (China, Türkiye, Greece, and a dozen others);
- a bare request to `www.ikea.com/<cc>/` with no `Accept-Language` header, so IKEA's redirect chooses the market's default language;
- each market's login page bundle, which embeds an Auth0 domain and public client ID;
- sample product searches to learn each market's currency symbol and price formatting.

A couple of things in what it produced surprised me.

## German prices with `.` for both thousands and decimals

IKEA's search API doesn't give you a formatted price string. It gives you pieces:

```python
{'prefix': '', 'wholeNumber': '2.040', 'separator': '.', 'decimals': '00', 'suffix': '€'}
```

That's a PAX wardrobe in Germany, and both dots are real. The thousands separator inside `wholeNumber` and the decimal `separator` are both `.`, so gluing the pieces together gives you `2.040.00€`. I didn't want to pull in a locale library and override what IKEA sends, so the generator checks whether `wholeNumber` already uses the `separator` character and drops the grouping mark when they clash. German prices come out as `2040.00€`, and every other market keeps its own formatting (`1 299,00 $` in Canadian French, `CHF 3'540.25`, `47 570:-` in Sweden, and three decimal places in Bahrain).

## An Auth0 error page that returned HTTP 200

Each market's login bundle usually points at `<cc>.accounts.ikea.com` and a public client ID. IKEA's login page sits behind Cloudflare Turnstile, which a script isn't getting through, so `ikea-cli` has you sign in in a real browser and paste the result back. That also means it never sees your password. My first check just opened each market's authorize URL and looked for HTTP 200.

Saudi Arabia and Bahrain both pointed at `au.accounts.ikea.com` (the Australian tenant) and returned 200, right after redirecting to:

```text
https://au.accounts.ikea.com/en/identity/error-container/?client_id=...&error=unauthorized_client&error_description=Callback%20URL%20mismatch.
```

Auth0 serves that error page with a 200, so my status-code check passed. That one annoyed me a bit, since the check existed to catch broken logins, and the Australian tenant had been rejecting `www.ikea.com/sa/ar/profile/login/` as a callback URL the whole time. The generator now follows redirects and drops login settings whenever the final URL lands on an error page or includes `error=`.

## Twenty-one markets on server-side sessions

The first version of the table said 32 markets could log in. Dropping Saudi Arabia and Bahrain made it 30, and they weren't a one-off either. Nineteen newer markets don't load the client-side Auth0 bundle at all. They sign you in with a server-side session and no public client ID, their guest cart endpoint returns 401 on fresh tokens, favourites return `"Retail ID is not supported"`, and the delivery API leaves them out. Saudi Arabia and Bahrain behave exactly the same, so I think their old login bundle is just a leftover.

The generator now runs read-only guest probes in each market and records which endpoints work. Of the 51 markets in `markets.json`, 30 support login, cart, favourites and delivery. The other 21 only get search, product pages, stores and stock, and Ukraine is marked unusable online because it lists no products. In those 21, `ikea cart` stops early and tells you why instead of failing with a raw 401.

I ran the 44-check guest test suite live against Canada (English and French), the US, the UK, Germany, France, Sweden, Spain, Japan, South Korea and Australia, plus the search and stock checks in the UAE. That turned up a South Korea delivery bug: the fulfilment API wanted `""` instead of `null` for an empty state code. Real account login, cart and order history have only been tested with a Canadian account so far, and the README table says which markets have been tested end to end. I'd like that list to be longer, but a Canadian account is all I can test with, and guest endpoints answering doesn't show that sign-in works.
