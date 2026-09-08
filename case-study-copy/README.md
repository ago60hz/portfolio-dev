# Case study copy — working drafts

Editable extracts of the current on-site copy for three case studies, pulled
from `content/case-studies/*.ts` on 2026-09-07.

Workflow:
1. These files are the current copy, one per study, every editable string labelled
   with its structural role (title, hook, heading, prose, quote, image alt…).
2. Run the copywriting pass in CoWork on these `.md` files.
3. Claude reflects the approved copy back into `content/case-studies/<slug>.ts`
   (and image `alt` text into `content/case-studies/media.generated.ts` via the
   asset normalizer, not by hand).

Do not wire these files into the build — they are a scratch surface only.

| Study | Source | Draft |
| --- | --- | --- |
| PassportMonie | `content/case-studies/passportmonie.ts` | `passportmonie.md` |
| DEAN | `content/case-studies/dean.ts` | `dean.md` |
| Fagbemi Studios | `content/case-studies/fagbemi-studios.ts` | `fagbemi-studios.md` |
