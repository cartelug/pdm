# PCI handoff: start here

This branch solves the archive-transfer problem. The complete website and ALL original tracked image assets are already at the repository root. Nothing needs to be downloaded from Drive, decoded from a large base64 response or restored from the two ZIPs when using this branch.

Published website baseline: `a4843dd3fe2d8b5b35943b7eb6131fdbda5aeb58`.
Handoff branch: `handoff/claude-pci-2026-10-25`.
This branch adds instructions only; it does not deploy a new website or move `main`.

## For a chat that can read GitHub

Connect `cartelug/pdm`, select this branch where branch selection is available, and read `handoff/claude/README.md`, `handoff/claude/TAKEOVER_PROMPT.txt` and the guides below. Read the architecture and relevant source files next. A repository context connector can supply files for analysis; it is not automatically a writable Git checkout or a runtime that can build the website.

## For Codex / Claude Code / a coding workspace

If no working checkout exists, clone this branch using the command below. If a checkout already exists, inspect its branch, status, uncommitted edits and any `docs/joshua/` work first. Preserve that work. Fetch this branch and read its handoff files without blindly replacing the current tree or switching over unsaved edits.

```sh
git clone --branch handoff/claude-pci-2026-10-25 --single-branch https://github.com/cartelug/pdm.git
cd pdm
```

The code and assets are at the root of `pdm`, not inside a `website/` subdirectory. Run normal project setup and checks from that root. No older-image restoration script is needed for this full clone. When beginning implementation, make an appropriate working branch and compare current remote `main`; this handoff branch records a baseline, not a promise that main will never advance.

## Read in this order

1. `handoff/claude/TAKEOVER_PROMPT.txt`.
2. `handoff/claude/guides/02_JOSHUA_10_MINUTE_GUIDE.md` and `03_HOST_ACCOUNT_SETUP.md`.
3. `handoff/claude/guides/04_FULL_WEBSITE_REDESIGN_GUIDE.md`.
4. `handoff/claude/guides/05_FONT_TYPOGRAPHY_GUIDE.md`.
5. `handoff/claude/guides/06_IMAGE_ART_DIRECTION_GUIDE.md`.
6. `handoff/claude/guides/07_CODE_ARCHITECTURE_MAP.md` and `08_TEST_DEPLOY_ROLLBACK.md`.
7. `handoff/claude/guides/09_KNOWN_GAPS_AND_DECISIONS.md` and `10_ACCEPTANCE_CHECKLIST.md`.
8. The root `ARCHITECTURE.md`, `docs/OPERATIONS-HANDOVER.md` and `docs/quality/OFFICIAL-KIT-2026-10-25.md`.

Guides 00 and 01 preserve the complete original handoff context. Where they mention an extracted source snapshot, use this repository root instead. Source/asset paths in all guides are relative to the repository root. The original ZIP inventory/checksum files describe archive delivery and are not required for this Git workflow.

## Essential boundaries

Walk for Education is already underway. Keep unconfirmed dates, current location, kilometres and financial totals unconfirmed. Preserve real kit/face/building references and label imagined arrival scenes. Keep Archivo/Lexend typography and the existing source/build lanes unless a deliberate new instruction changes them. Coordinators record; finance reconciles; currencies, pledges, received money, sponsored steps and physical kilometres remain distinct. Preserve protected hooks and frozen fragments.

Do not publish to `main` or the live website until Neeza instructs you. This handoff branch is the transfer mechanism, not a release approval. Private ledger/configuration and staff credentials stay on the host. Named staff account activation remains a separate host administrator task.

## If only a small readable file works

Use `handoff/claude/PCI_AI_START_HERE.txt`. It contains the transfer instructions and all eleven guides in plain UTF-8 text, without images or archive encoding. This is useful for understanding the project; connect the repository or use a coding workspace to execute the work.
