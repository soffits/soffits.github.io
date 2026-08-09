---
title: "A 133-byte model produced KeyError 118"
description: "Git LFS left a pointer where a joblib model belonged, and pickle reported the first byte instead."
pubDate: 2026-08-09
tags: ["python", "git", "packaging"]
---

I expected a missing model to look like a missing model. Instead, [`arxiv-topic-classifier`](https://github.com/Lumysia/arxiv-topic-classifier) gave me `KeyError: 118`.

The repository packages `models/arxiv_topic_pipeline.joblib` with Git LFS. I made a fresh checkout without downloading its LFS objects, then ran the normal setup path. `uv sync --locked` installed 69 packages successfully. Nothing in that result suggested that the model file was unusable.

The smoke command got as far as loading it:

```sh
uv run arxiv-classifier smoke
```

Then `joblib.load` entered pickle and stopped at `KeyError: 118`.

That number was a better clue than its shape first suggested. The supposed model was 133 bytes long. Its first byte was lowercase `v`, byte value 118, because the file began with Git LFS's pointer header:

```text
version https://git-lfs.github.com/spec/v1
```

The pointer named the real object too: SHA-256 `9dbb9ebe754a4807b4faad61d66f2246f770ffaae741f88a31b5c0598989923b`, with a size of 36,246,675 bytes. Pickle was not reporting a strange property of the classifier. It had been handed plain text and interpreted the first character as pickle input.

The [README](https://github.com/Lumysia/arxiv-topic-classifier#install) already does the responsible visible thing. It lists Git LFS as a prerequisite, asks readers to run `git lfs install`, and includes `git lfs pull` before the smoke command. Running that pull turned the 133-byte pointer into a file with the declared size and hash. The same smoke command then returned `status passed`.

So this was not a bad installation guide, nor a corrupt published model. The instructions gave the recovery command. What bothered me was the gap between a perfectly recoverable setup mistake and the error the program chose to expose.

The loader in [`model.py`](https://github.com/Lumysia/arxiv-topic-classifier/blob/main/src/arxiv_topic_classifier/model.py) checks that the model path is a file and calls `joblib.load` immediately afterward. A Git LFS pointer satisfies that check. It is a file, just not the file the loader needs.

I had treated packaging and instructions as sufficient because the documented clone path works. This reproduction made the missing guard concrete. Before passing the path to joblib, the program should recognize the LFS pointer header and say that the model has not been downloaded, then name `git lfs pull` as the repair. That change has not been made. For now, `KeyError: 118` remains the public symptom of a 133-byte text pointer standing in for a 36 MB model.
