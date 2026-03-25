# GridSmith Working Context

This file is the **living handoff** between sessions.

- Foundation context: `docs/gridsmith-context.md`
- Task tracker: `docs/TODO.md`
- This file: current implementation state, recent decisions, and immediate next actions.

## How To Use This File

- Update this file at the end of meaningful work sessions.
- Keep entries short and factual (what changed, why, and what remains).
- Treat `docs/TODO.md` as the canonical checklist and mirror only key status here.

## Project Guardrails

- Do not commit directly to `main`.
- Branch names should:
  - start with `feature-` or `bug-`
  - use lowercase words separated by `-`

Reference rule: `.cursor/rules/no-direct-main-commits.mdc`

## Current Snapshot (as of latest updates)

- Product focus remains a client-side baseplate generator on top of OpenSCAD WASM.
- Production deployment path is working (Vercel + Cognito Google auth flow validated).
- PWA/app branding has been switched to **GridSmith** (title + manifest naming).
- Google Analytics is now wired for route-level page views and key viewer conversion events.

### Recently Completed (high impact)

- Added privacy route and footer link:
  - `/privacy` route is implemented
  - footer includes Terms + Privacy links
- Improved mobile UX:
  - responsive hamburger nav in header
  - fixed initial mobile `/baseplate` behavior so params panel/tab is discoverable on first load
- Viewer polish:
  - removed AR/camera launch affordance from model viewer on mobile
- Removed axes feature entirely:
  - removed axes overlay rendering
  - removed axes toggle and state plumbing
  - removed obsolete assets (`axes.scad`, `public/axes.glb`)
- Auth display behavior:
  - show account display name only when `given_name` exists
- Analytics rollout completed:
  - sitewide `page_view` tracking on route changes
  - `stl_rendered` and `stl_downloaded` events implemented
  - event params include `rows`, `columns`, and enum-based `title_type` (`GridSmith`, `OpenForge`, `Custom`)

### Recent Commit Trail

- `434fb68` marked analytics TODOs complete in docs
- `51a4d67` added Google Analytics page and STL event tracking
- `7c44e9b` added analytics tracking TODOs for production follow-up
- `2e3108f` added Cursor branch safety rule
- `2fa724d` updated TODOs to match current project state
- `5209095` removed axes feature and related assets
- `ddd9fa0` removed mobile AR launch button
- `9830e42` fixed mobile viewer params initialization
- `41a67ba` added responsive mobile hamburger header
- `209c135` branded install prompt/app name as GridSmith

## What To Do Next

See `docs/TODO.md` for full list. Immediate likely candidates:

1. Finalize legal copy (replace placeholder Terms/Privacy content).
2. Re-enable and design advanced parameter settings section.
3. Add deployment runbook notes (Cognito callback/sign-out URL matching + Vercel env checklist).
4. Consider PWA cache-busting/versioning strategy for faster metadata/icon refresh after deploys.

## Notes For New Chats

When starting a new chat, include:

- current branch name
- any uncommitted changes
- the specific next task
- reminder to follow `.cursor/rules/no-direct-main-commits.mdc`
