---
title: "A newsletter's invisible padding broke my overnight embedding job"
description: "rummage cuts passages at about 1,800 characters and assumed that always fits the embedding server's 2,048-token batch. A passage of hidden characters came to 2,805 tokens, and the index refresh failed with HTTP 500."
pubDatetime: 2026-11-15
tags: ["rummage", "embeddings", "llama-cpp"]
---

[rummage](https://github.com/soffits/rummage) is the local search tool I use for my own notes, chat history and mail. A job refreshes its index every hour. This morning the run at 3:17 failed with:

```
rummage.runtime.EmbedError: /v1/embeddings: HTTP 500
input (2805 tokens) is too large to process. increase the physical batch size (current batch size: 2048)
```

The runs before it had been fine. The only new thing in that run was a batch of mail the mail source had just picked up, and one of the messages was a newsletter.

## The assumption

rummage splits text into passages of about 1,800 characters and sends each one to a `llama-server` running EmbeddingGemma 2. The server is started with `-b 2048 -ub 2048`. An embedding model reads a passage in one pass, so the whole passage has to fit in that one batch, and anything over 2,048 tokens is refused. Next to the batch size in `runtime.py` there was a comment saying 2,048 tokens held a 1,800-character chunk "of any script".

I had checked that against the scripts that worry people. 1,800 characters of English is 361 tokens with this tokenizer, and 1,800 characters of Korean is 301. CJK text takes three bytes per character in UTF-8, but the model has real tokens for it, so it comes out well under the limit.

What I hadn't thought about is text the tokenizer has no tokens for. Its vocabulary falls back to bytes there, one token per byte. I measured a few characters with the same llama.cpp build and model file (500 of each, tokens per character):

| character | tokens |
|---|---|
| U+034F combining grapheme joiner | 2 |
| U+2007 figure space | 3 |
| U+202F narrow no-break space | 3 |
| U+13000 Egyptian hieroglyph | 4 |
| U+200B zero-width space | 0.25 |

So the count of tokens depends on which characters are there, and "1,800 characters" says very little. A passage made of U+034F followed by a space, repeated 900 times, is 1,800 characters and 2,700 tokens. That reproduces the same error with a different count.

I never saw the actual characters in the newsletter, because the failed run left no copy of the passage. Newsletters often pad the hidden preheader text with strings like this, so mail clients don't show the start of the body in the inbox preview. That is my best guess. The 2,805 does rule out ordinary text.

## The fix

I didn't want to raise `-ub`, because nothing bounds what the next odd passage costs. I didn't want a character filter in the chunker either, since the chunker would then have to know the tokenizer. So the embedder owns the limit now:

1. A token is never shorter than a byte, so a text whose UTF-8 length plus the two special tokens is at most 2,048 can't be over the limit. Almost everything takes this path, and costs no extra request.
2. Anything longer goes to the server's `/tokenize` endpoint for a real count.
3. If it still doesn't fit, it's halved at a space near the middle, and each half is checked the same way.
4. A passage that was split gets one vector: the mean of its pieces, weighted by token count and normalised again.

The change is in [#51](https://github.com/soffits/rummage/pull/51). Its test runs against a fake server that charges one token per ASCII character and one per byte for the rest, and returns 500 over 2,048, like the real one.

## What the averaged vector is worth

I wanted to know how much the mean is worth, since the real content may be a small part of the passage. I made up an 813-character promotional paragraph (175 tokens) and appended that same pair, U+034F and a space, as padding. Then I compared each vector with the embedding of the paragraph alone, as cosine similarity. For scale, the paragraph against an unrelated text, a flight confirmation, scores 0.718.

| padding pairs | tokens | embedded | cosine with the clean paragraph |
|---|---|---|---|
| 200 | 775 | whole | 0.968 |
| 600 | 1,975 | whole | 0.945 |
| 900 | 2,875 | in pieces | 0.840 |
| 1,200 | 3,775 | in pieces | 0.852 |

Padding alone moves the vector a little even when the passage fits. Splitting costs more, because the second piece is only padding and gets about half the weight in the mean. The result is still closer to its own paragraph (0.84) than to the unrelated text, which scores 0.745 against it, but not by much. A padded newsletter will rank lower for what it actually says than a clean one would.

So this fix stops the job from failing. It doesn't make that passage good. What would is dropping the invisible characters before chunking, and I haven't done that. Zero-width joiners and non-joiners carry meaning in emoji sequences, Persian and several Indic scripts, so a blanket strip would damage text in those. The right rule is probably to drop them only where they come in long runs between spaces. I don't have that written yet, and I haven't measured what it does to search results, only to single vectors.
