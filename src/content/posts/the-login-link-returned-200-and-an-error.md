---
title: "The login link returned 200 and an error"
description: "Taking ikea-cli from Canada to every market on www.ikea.com meant reading IKEA's own config per country. Saudi Arabia's pointed at the Australian login tenant, and my first check missed it."
pubDate: 2026-10-25
tags: ["python", "open-source", "testing"]
---

[ikea-cli](https://github.com/soffits/ikea-cli) is a command-line tool for the IKEA website: search, stock, delivery, your real cart and favourites, orders. Version 0.1.0 only knew Canada. Version 0.2.0, released the same day, works in the 51 countries IKEA serves from `www.ikea.com/<country>/<language>/`.

I didn't want to maintain a hand-written country table. The tools I looked at either hard-code a country or two, or keep a fixed list of country codes and a store file by hand, and none of them carry the per-country login settings an account feature needs. So 0.2.0 ships a `markets.json` produced by a script, `scripts/update_markets.py`, that asks IKEA. Every input comes from IKEA itself:

- the `hreflang` links on www.ikea.com for which countries are on the shared platform, plus IKEA's country-picker data for names and for the countries with their own separate site (China, Türkiye, Greece and a dozen others);
- a request to `www.ikea.com/<cc>/` with no `Accept-Language`, so IKEA's redirect picks the default language instead of my headers picking English;
- each market's login page, which loads a JavaScript bundle with an Auth0 domain and client id in it;
- a few product searches, for currency and price layout.

One of those sources sends data that reads two ways, and one of my checks was too easy to pass.

## The price that looked like two decimals

IKEA's search API doesn't send a formatted price string. It sends parts:

```python
{'prefix': '', 'wholeNumber': '2.040', 'separator': '.', 'decimals': '00', 'suffix': '€'}
```

That is from Germany, today, for a PAX wardrobe. The group mark in `wholeNumber` is `.` and the decimal separator is also `.`. Put back together, it reads `2.040.00€`. A German shop would normally write `2.040,00 €`, but the API does not say so anywhere, and guessing from the locale would mean bringing in a locale library for one function and trusting it over what IKEA actually sends.

I took the parts as the source and let the generator learn each market's layout from them: symbol before or after, how many decimals, which marks. When a market sends the same mark for both, the generator drops grouping, so German prices print as `2040.00€`. It looks a little odd, but it can't be misread. The other markets came out the way their sites show them: `1 299,00 $` in Canadian French, `CHF 3'540.25`, `47 570:-` in Sweden, three decimals in Bahrain.

## The login check that passed on an error page

Login was the part I cared about most, because it is what gives you your real cart. Each market's login bundle names an accounts domain, usually `<cc>.accounts.ikea.com`, and a public client id. ikea-cli uses those for a copy-paste login: you sign in on ikea.com in your own browser, and the CLI swaps a one-time code for tokens. It never handles the password.

My first live test for "login works in this market" opened the authorize URL with that domain and client id and checked for HTTP 200. It passed.

Saudi Arabia's bundle names `au.accounts.ikea.com`, the Australian tenant. So does Bahrain's. That looked odd but possible, maybe a shared regional tenant. The authorize request did return 200. It returned it after redirecting to this:

```text
https://au.accounts.ikea.com/en/identity/error-container/?client_id=...&error=unauthorized_client&error_description=Callback%20URL%20mismatch.
```

Auth0 shows its errors as a normal page, and the page loads fine, so the status code was useless as a signal. The tenant does not accept `www.ikea.com/sa/ar/profile/login/` as a place to send the user back to, so a real login from the Saudi market could never finish with those settings. The status-code test would have shipped a `login` command for Saudi Arabia that sent people to an error page.

The check now follows the redirects and fails if the final URL is an error page or carries `error=`. The generator runs the same check and leaves out any login settings Auth0 rejects, so those markets say "login is not available here" before anything is sent. I reran it today, and Saudi Arabia still lands on the callback mismatch.

## Twenty-one markets on a different system

Saudi Arabia turned out to be part of a bigger split. About 19 newer markets don't use the old login bundle at all; their sign-in goes through a server-side session and publishes no client id. Probing them as a guest showed the rest follows: the cart answers 401 for a fresh guest token, favourites answer "Retail ID is not supported", and the delivery service's country list doesn't include them. Saudi Arabia and Bahrain behave the same way, which makes me think their old-style bundle is left over rather than in use.

So the generator does a few read-only guest probes per market and records what IKEA actually serves there. The final table has 51 markets: 30 with login, cart, favourites and delivery, and 21 where only search, product pages, stores and stock work. One of those, Ukraine, lists no products online at all, so it is marked unusable. In those 21, `ikea cart` stops before making a request and says the feature isn't available in that market, with its own exit code, instead of passing on a bare 401.

## What I actually know

I ran the full guest smoke test (44 checks) live in Canada (English and French), the US, the UK, Germany, France, Sweden, Spain, Japan, South Korea and Australia, and the reduced set in the UAE. South Korea failed delivery on the first run because it has no postal-code lookup and the fulfilment API wants the state code as a string even when it is empty; sending `""` fixed it. The other 40 markets use the same services with settings from the same generator, but nobody has run them end to end. Account features, meaning a real login, cart and orders, have only been tested with a Canadian account. The README says both things in plain words, because the tested-market column is the most honest part of the table.

I've stopped treating a 200 from an identity provider as a result. It means some page loaded. With Auth0, that page can be the error.
