## Scope

Ten changes across the app. Existing files touched: `AppShell.tsx`, `ProfileDrawer.tsx`, all five tab files, `use-theme.ts`, plus a few new components/hooks.

## Changes

**1. Profile photo cropper**
In `ProfileDrawer.tsx`, after image select show a modal with a circular crop viewport, zoom slider (1–3x) and drag-to-pan. Save a square-cropped dataURL via canvas so the avatar (AppShell header + RankingTab hero) is always centered & consistent. New component: `PhotoCropper.tsx`.

**2. Pull-to-refresh (all tabs, focus Attendance + Finances)**
New hook `use-pull-to-refresh.ts` + `PullToRefresh.tsx` wrapper: touch/pointer drag from top when scrollTop=0 reveals a spinner; on release triggers a refresh callback that re-runs the tab's simulated loading (skeletons show again). Wrap each tab's root.

**3. Ranking highlight + share card**
- Highlight the user's rank: large rank badge (e.g., "#3") with gradient chip, prominent placement above the class list; row for the user gets a ring + accent bg.
- Add a Share button. Opens a modal that renders a shareable card (user photo, name, rank, score, then class rank list below). Uses `html-to-image` to export PNG; falls back to `navigator.share` if available, else download. Add `html-to-image` via `bun add`.

**4. Finances: two columns (School Fee | Bus Fee)**
Rework `FinancesTab.tsx` into a two-column responsive grid (stack on narrow). School Fee column keeps current summary. Bus Fee column: if student uses bus → normal fee card; if not → friendly empty state "You're not on any bus — enjoy! 🚶" with playful illustration/emoji. Add a `usesBus` flag in mock data.

**5. Notices: highlighted date + top-pinned alerts**
- Date rendered larger with an accent block (day number XL, month label small).
- Alerts (items flagged `pinned` or `type==='alert'`) pinned to top of the notices list with a distinct accent border/icon.

**6. Global pinned alerts**
New `AlertBanner` shown at top of every tab when alerts exist (sourced from notices data). Dismissable per-session.

**7. Smaller, wider-fit bottom nav**
In `AppShell.tsx`: reduce nav height (h-11→h-10), tighter padding, allow width up to `min(96vw,460px)`, shrink icon+label gap; labels only for active tab (already), ensure 5 tabs fit without overflow at 360px width.

**8. Animated theme toggle on main page**
Move theme toggle out of ProfileDrawer into the AppShell top bar. Animated sun/moon logo (rotate + scale + color morph on click) with a subtle pulse to invite clicks. On toggle, add a brief page-level cross-fade / circular reveal animation.

**9. Attendance: absent days**
Add absent count card alongside Present. Compute from mock data (total - present). Show as a red-accent stat card with the number of absent days.

**10. Recommended polish**
- Haptic-style tap feedback on nav (scale).
- Skeleton reused during pull-to-refresh.
- Ensure semantic tokens only (no hardcoded colors); extend `styles.css` with `--accent-success`, `--accent-warning`, `--gradient-rank` etc. if needed.

## Technical notes

- New files: `src/components/app/PhotoCropper.tsx`, `src/components/app/PullToRefresh.tsx`, `src/components/app/ShareRankCard.tsx`, `src/components/app/AlertBanner.tsx`, `src/components/app/ThemeToggle.tsx`, `src/hooks/use-pull-to-refresh.ts`, `src/hooks/use-alerts.ts`.
- Deps: `bun add html-to-image` for share export.
- Design tokens go in `src/styles.css`; components use `bg-foreground/text-background` etc., never raw hex.
- Cropper: pure canvas, no library needed.

Reply "go" to implement, or tell me which items to drop / reorder.