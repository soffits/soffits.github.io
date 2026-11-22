---
title: "A third of a day's recall leads were repeats, and one PDF came back 17 times"
description: "rummage adds a few leads from old notes and chats to each prompt. Counting one real day of them showed 36% were minutes-old messages from other sessions, and the benchmark showed the thresholds can't tell whether there is anything to find."
pubDatetime: 2026-11-22
tags: ["rummage", "agents", "memory", "evaluation"]
---

[rummage](https://github.com/soffits/rummage) is the local search tool I run over my notes, mail and old chat sessions. One part of it is `rummage recall`, a hook that runs on every prompt. It searches the index with the prompt and puts up to four leads at the top of the context, each a pointer to a passage the model can open.

It had been live for two days when I wanted to know whether it was any good. rummage keeps no log of what it injected, but the injected blocks are saved in my session logs, so I pulled them out and counted the day from midnight on the 16th.

## What a day looked like

426 recalls, 1,583 leads. Two things stood out.

577 of the leads (36%) came from the "recent turns" part, which adds messages from other chat sessions in the last few minutes. Nearly all were messages the user had sent in a parallel conversation. The bar for them was one term in common with the prompt, and in Chinese the shared terms were common two-character pairs, so they matched almost anything.

Then the repeats. 382 of those 577 recent leads had already been shown to the same session within the previous six hours. Across the whole day, about a third of all leads were something the session had already been given, and one item had been given sixteen times. The model still has the earlier block in its context, so that's wasted space.

The worst case was one PDF of OCR'd screenshots of a chat, in Chinese. It came back 17 times that day for prompts that had nothing to do with it, at z-scores of 3.1 to 4.8 (the gate for a meaning match is 2). Casual Chinese sentences all land near it. Retrieval people call an item like that a hub, close to everything. Raising the threshold would have cut every passage of that kind along with it.

## What I changed

Three rules, in 0.28.0:

- An item already shown to a session in the last six hours is left out.
- An item shown to three or more other sessions in the last day is a hub, and from then on counts only when its words match, not its meaning.
- A recent turn from another session has to share 30% of the prompt's words.

What went to which session is kept in a small file next to the index, not in it, so the hook never waits for an indexing run's write lock. The hub rule is a crude form of a known fix, normalising against past queries, without storing any query vectors. A proper per-item hubness score would need them.

Before shipping I replayed the same day through the new rules: 1,611 leads became 831, leads from items already shown five or more times went from 491 to 0, the PDF from 17 to 3, and the share from recent turns from 36% to 1%. A couple of days after it was live, the real logs showed 4% and no lead shown five times or more, so the replay was a little optimistic about the share.

I also tried skipping the recent-turn part for short follow-ups like "rename it then". It removed more noise, but it also breaks the case where a new session picks up one from a minute ago, and it saved only seven leads a day, so I dropped it.

## Whether there was anything to find

The log shows how much recall says. It can't show whether recall was right to say anything, so I ran its selection on two public long-term chat memory sets, LoCoMo and LongMemEval-S. The benchmark script writes each conversation as a chat log, indexes it, and asks every question through recall.

On LoCoMo (1,986 questions), at the default thresholds an injected item is an evidence turn for 48% of the answerable questions. On the questions that are supposed to be unanswerable, recall injects something 67% of the time. Those are adversarial: each takes a real event and gives it to the other speaker, so a very close turn exists (39% of the injections on them are exactly that turn). The cleaner test is LongMemEval-S's abstention questions, which ask about something never mentioned. Recall injected on 27 of those 30.

Raising the thresholds quiets it, but the hits go with it. On LoCoMo, a bar of z 4 took the unanswerable injections from 67% to 31% and the hit rate from 48% to 26%. LongMemEval did a little better, with the hit rate falling from 93% to 69% while abstention injections fell from 90% to 53%, and I'd still call it the same trade. The threshold sets how much recall says. It doesn't know whether the history holds an answer.

How much is an injection worth to a model that reads it? On LongMemEval-S, with Claude Sonnet as the reader and Claude Haiku grading with LongMemEval's own prompts (so these don't compare with published scores):

| | accuracy |
|---|---|
| no memory | 3% |
| one recall injection | 55% |
| the agent searching rummage itself, 1.5 searches on average | 80% |

An injection holds a session with the answer for 93% of the questions, and the reader still gets only 55% right, worst on the ones that need several sessions or dates at once. Letting the agent search is worth 25 points for about three times the tokens. Of its 100 wrong answers, 63 came after its searches had shown a turn from every session holding the answer, so most of what's left is picking the right turn and reading it, not finding the session.

That's how I now think of recall: a nudge that something might be worth searching for, which is also how its block is worded since 0.28.1 (the lines are cues to check, not facts). Presenting them as remembered facts would be confidently wrong on every unanswerable question it speaks up for.

## What's open

Precision on LoCoMo is a third at the defaults, and I don't have a cheap way to make recall stay quiet when there's nothing to say. A model reading the leads before they go in might do it, but that puts a model call inside a hook that has a few seconds, and I'd want a measurement showing it pays before adding one. I haven't measured that, and the benchmarks page in the repo lists the other runs I stopped before they finished.
