# Start here

This is everything needed to understand, continue and operate the published PCI website from its source. It is not just a design prompt.

## Original archive instructions (Git users follow the branch README instead)

1. Upload the complete ZIP to Claude in a project or coding workspace that can read archives and edit files.
2. Paste `SEND_TO_CLAUDE.txt`. Ask Claude to read the package before proposing changes.

If Claude's upload limit rejects the full archive, extract it locally. Upload the `handoff/claude/guides/` directory and `CLAUDE.md`, then connect the GitHub repository or let Claude clone it. All website assets are already tracked there. Do not solve a size limit by deleting image masters from the repository or uploading private credentials.

## What is already shipped

The baseline is the final 25 October release, not an earlier preview. Both site addresses were verified against the same commit. It already contains:

- Twenty campaign scenes, forty independent landscape/portrait compositions, native compressed masters and responsive AVIF/WebP output.
- Official shirt/bag references, a transparent bag treatment, actual main-building reference and illustrated arrival labels.
- Refined image gradients and mobile framing across the homepage, Walk page, partners and participation pages.
- An ongoing-walk state that does not invent a start date or day count.
- Named-role operations, contribution recording, finance reconciliation, public approved progress, consent handling, reports and HD PNG generation.
- Joshua's staff start page, full guide and a separate one-time host account setup kit.

The complete prior design plan, forty-composition manifest, twenty detailed image prompts, contact sheet, QA reports and all existing project documentation are inside `docs/` and the asset tree.

## Choose the right next action

| Need | Start with |
| --- | --- |
| Joshua wants to use the system | Guide 02; guide 03 only if his account is not activated |
| Claude needs to improve design | Guides 04, 05 and 06, then the actual source |
| Claude needs to run or edit the code | Guide 07 and `ARCHITECTURE.md` |
| Claude is ready to release | Guide 08 and the actual workflows |
| A campaign fact is missing | Guide 09; keep it unconfirmed until an authorised source supplies it |

## Source versus a working checkout

the repository root contains the exact files from the published commit. Git history, installed `node_modules` and build caches are deliberately absent. For ongoing work, use a real clone of `cartelug/pdm` and inspect current remote changes. If the remote still points to the snapshot, the files should already match; copying them back is unnecessary. If it has advanced, review differences before applying anything from the ZIP.

The bundle itself is the deliverable for this request. No additional deployment is needed simply to hand it to Claude.
