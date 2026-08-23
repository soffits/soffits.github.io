---
title: "I merged the secret rename and deployed the old environment"
description: "A Remnawave v3 upgrade had the right APP_SECRET mapping in Git, while Komodo was still holding the old stack environment."
pubDate: 2026-08-23
tags: ["docker", "self-hosting", "deployment"]
---

The API restarted, printed one useful line, and restarted again:

```text
JwtStrategy requires a secret or key
```

I had just upgraded a self-hosted Remnawave panel from v2 to [v3.3.0](https://github.com/remnawave/panel/releases/tag/3.3.0). The migration changed its secret environment variables: `JWT_AUTH_SECRET` and `JWT_API_TOKENS_SECRET` were replaced by `APP_SECRET`.

My [upgrade pull request](https://github.com/Lumysia/Yggdrasil/pull/30) changed both places where that name appeared. Docker Compose now passed `APP_SECRET` to the container, and the Komodo resource declaration mapped `APP_SECRET` to the existing stored value. I did not rotate the secret. The name changed; the value did not.

The pull request merged cleanly, the Compose file parsed, and the deployment still gave Remnawave no usable secret.

Git was not the whole deployed state. Komodo had already imported the stack as a resource, including its environment field. Its [resource sync](https://komo.do/docs/automate/sync-resources) compares the TOML declaration with the resource Komodo currently stores, then applies the difference. Merging a new declaration into Git did not apply that difference by itself.

That left two halves of the deployment on different revisions. The Compose file expected `APP_SECRET`; Komodo's stored stack environment still supplied the two v2 names. The value had not disappeared from the secret store. It simply was not being passed under the name the v3 container read.

After I ran the resource sync, Komodo applied the renamed mapping. The next deployment started normally. There was no missing migration patch to write, no compatibility variable to add, and no reason to generate a new secret.

I had treated “the configuration is merged” as if it also meant “the deployment controller has imported the configuration.” In this setup, those are separate operations. A normal image update can hide that distinction because the environment names stay compatible. A breaking rename makes it immediate: one stale field is enough to turn an intact secret into an absent one.

For the next migration like this, I want the deployment procedure to sync resources before it deploys, then read back the effective environment **names**—never their values. Seeing `APP_SECRET` in the stored stack would have caught this before the container entered its restart loop.
