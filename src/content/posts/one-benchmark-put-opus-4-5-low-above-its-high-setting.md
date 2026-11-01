---
title: "One benchmark put Opus 4.5 on low effort 17 points above its high setting"
description: "Scoring every model variant separately in ECI Live gave Claude Opus 4.5 (low) an ECI of 170.4 from a single DeepResearch Bench result, because that benchmark's fitted slope is nearly flat."
pubDatetime: 2026-11-01
tags: ["ai-benchmarks", "statistics", "open-source"]
---

[ECI Live](https://soffits.github.io/eci-live/) refits Epoch AI's [Capabilities Index](https://epoch.ai/eci) every day from Epoch's open benchmark data, using Epoch's own [`eci-public`](https://github.com/epoch-research/eci-public) code in a public GitHub Actions run. The first version scored models the way Epoch does: one number per model, with every reasoning setting pooled together. Then I split it, so `GPT-6 Astra (max)` and `GPT-6 Astra (medium)` each get their own score.

The way I did that is Epoch's own method for its domain scores. The model-level fit gives every benchmark a difficulty and a slope, and the predicted score is a logistic curve of the gap between them:

```
predicted = sigmoid(slope × (capability − difficulty))
```

To score a variant, I keep each benchmark's difficulty and slope fixed and fit only that variant's capability against its own results. That's cheap and it stays on the same scale as the model-level index.

The first per-variant snapshot had 877 rows. Sorted by score alone, the fourth row was `Claude Opus 4.5 (low)` at 170.1, above `GPT-6 Astra (max)` and `Claude Opus 5.5 (max)`. The same model at `high` scored 152.9. In today's snapshot the two are at 170.4 and 153.6.

## Where the 170 came from

The low-effort row has exactly one result in the index: DeepResearch Bench, score 0.537. One data point and one unknown means the fit just solves the equation. Using the benchmark's current fitted difficulty of 159.869 and slope of 0.01407:

```
159.869 + logit(0.537) / 0.01407 = 170.41
```

That is the published number to two decimals. Nothing went wrong in the solver.

The problem is the slope. For comparison, GPQA diamond's slope is 0.132, almost ten times steeper. On DeepResearch Bench, one extra percentage point of score moves the capability estimate by about 2.9 ECI; on GPQA diamond, the same point is worth about 0.3. A nearly flat benchmark separates models weakly, so when it's all a row has, a small score difference gets inflated into a large capability gap. The bootstrap interval says so: 158.6 to 211.9. Its upper end is more than 40 points above the best ranked model.

`Claude Opus 4.5 (high)` now has 12 benchmarks and an interval of 151.8 to 155.5. Low effort did not beat high effort. One row had enough evidence to be measured and the other didn't.

This wasn't a rare case. In the current snapshot, 302 of the 816 variants rest on one or two benchmarks.

## Coverage, not only count

So splitting by variant couldn't ship as a plain sort by score. The obvious guard is a minimum count, and the index already had one: rank intervals and the chance of being #1 only count variants with at least four benchmarks, which is `eci-public`'s own minimum for a model to enter the fit. That handles Opus 4.5 on low. It doesn't handle the case that bothered me more.

`GPT-6.1 Terra` came out on October 26. Pooled at the model level, it sat fourth, at 168.05, on ten benchmarks. Split by variant, `GPT-6.1 Terra (max)` scored 168.39 on nine: two FrontierMath sets and OTIS Mock AIME for maths, GPQA diamond, SimpleQA Verified, APEX-Agents, EBR-bench, Mystery Game Puzzles and Furniture Assembly. None of them is tagged software engineering. The model's only coding result, WeirdML v3, belonged to the `xhigh` variant.

Nine benchmarks is plenty by count. It is still a strange basis for putting a model fourth on a board called General, when it has no coding result at all.

So General now means all-round. A variant is ranked only if its benchmarks cover four areas: maths and reasoning, coding, agentic tasks, and knowledge. The areas come from the domain tags on [Epoch's benchmark hub](https://epoch.ai/eci), not from a list I maintain, and the hub file is archived with each snapshot so the rule can be checked later. Variants that miss an area stay in the full table and on their own pages, marked provisional with what they're missing (for `GPT-6.1 Terra (max)`: no coding benchmark). They're never ranked or counted toward the chance of being #1. The leaderboard shows each model's highest-effort variant that qualifies. In today's snapshot, 143 of the 816 variants are ranked.

Two smaller rules came out of the same day's work:

- Results labelled "unknown" or "thinking" with no effort setting are folded into the model's top labelled variant, but only for benchmarks that variant has no result of its own on. The detail page marks them as borrowed. That gave `GPT-6 Astra (max)` six extra benchmarks, including Remote Labor Index and GSO-Bench.
- The default line-up shows each model line's newest release even when it is still provisional, so an older generation doesn't come back just because the new one hasn't been benchmarked much yet. It needs at least three benchmarks before it shows by default.

## What I'm still unsure about

The coverage rule is only as good as the tags. The hub tags FrontierMath as both Mathematics and Agent, and Furniture Assembly as Conceptual reasoning, Agent and Multimodal. Under those tags, a maths-heavy row can count as covering agentic tasks without anything I'd call agent work. I follow the tags anyway, because a list I edited by hand would just swap their judgment for mine, and nobody could check mine. The weak point is still there, and I don't have a better rule yet.

The flat-slope effect also doesn't go away once a row qualifies. It just gets diluted. A ranked variant with several low-slope benchmarks still has a wider interval than its count suggests. The leaderboard draws every score as a 90% interval with a dot for the estimate, and for thinly covered rows the interval is the more honest part.
