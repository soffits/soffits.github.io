---
title: "The installer worked; Defender was busy"
description: "A winget submission failed installation validation even though both installers finished and the static scan passed. The Defender logs told a different story."
pubDate: 2026-09-27
tags: ["winget", "releases", "debugging"]
---

I submitted [AionUi Community 2.1.60](https://github.com/microsoft/winget-pkgs/pull/422258) to winget with x64 and ARM64 Windows installers. Installation validation failed. That's an uncomfortable result for a package other people are supposed to install, and I didn't want to dismiss it as flaky CI.

Both installers had completed successfully. Their URLs and SHA-256 hashes matched the published release assets, and winget's separate static Installers Scan passed. In my [notes on the validation logs](https://github.com/microsoft/winget-pkgs/pull/422258#issuecomment-5373077984), Microsoft Defender's signature update returned `0x80070652`. Its full scan then returned `0x8050111c`: another scan was already in progress. I found no threat name or detection ID in those logs.

That wasn't a clean scan. It was a scan that didn't finish, so I asked for a rerun rather than asking anyone to waive the check.

After the rerun, I [checked the logs again](https://github.com/microsoft/winget-pkgs/pull/422258#issuecomment-5416912459). On x64, the validator had started the bundled `aioncore.exe` on its own. AionUI normally launches that component with an explicit data directory. Run alone, it fell back to a relative `data` folder that the validation environment wouldn't let it write. That error came from launching an internal component outside the app's normal path; it wasn't an installer failure. The ARM64 Defender step still reported the same scan-in-progress error.

A maintainer requested another validation run. The [PR's final checks](https://github.com/microsoft/winget-pkgs/pull/422258) passed, and the package merged without changing the installer URLs or hashes. I still want Defender to scan the files. I just want its report to distinguish "couldn't complete the scan" from "found something in the file," because those require different responses.
