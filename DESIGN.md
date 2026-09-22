# OPTAIMYZE Portal — Design System

Short reference for building/maintaining portal pages so the UI stays consistent.
Everything below already exists — reuse it, don't reinvent it.

---

## 1. Liquid-glass surfaces (`components/landing/glass.jsx`)

The single source of truth for the glass look. Exports:

- `<GlassStyles />` — injects the global CSS. Render **once per page root** (it is
  idempotent). Provides:
  - `.liquid-glass` + `.liquid-glass-{glow}` card surfaces (light & dark variants,
    hover glow border via `--glow`)
  - `.specular` cursor-tracked highlight, `.blob` / `.blob-2` ambient drift,
    `.hero-grid-bg` blueprint grid
  - keyframes: `fadeInUp`, `fadeInUpBig` (featured tiles), `drift`, `heroBarGrow`
  - `prefers-reduced-motion` disables all motion automatically
- `<Tilt glow={accent} className="h-full">` — 3D tilt wrapper + specular.
  `glow` ∈ `cyan | emerald | violet | amber | sky | indigo | rose | slate`
  (`slate` = muted/“coming soon”).

**Rules**
- Never hardcode white/translucent backgrounds for cards — use `Tilt` or
  `liquid-glass` classes so both themes stay correct.
- Accent-colored utility classes (`bg-cyan-500/10`, `text-amber-600` …) must be
  **literal strings in source** — Tailwind scans statically, so no
  `` `bg-${color}-500/10` `` interpolation. Keep a static map (see `ACCENT_TEXT` /
  `ACCENT_CHIP` / `ACCENT_BLOB` in `ModuleGrid.js` / `ModuleDashboardPage.js`) and copy it.

## 2. Theme

- Toggle writes `localStorage["optaimyze-theme"]` = `light | dark`; root gets `.dark`.
- Theme-aware colors: prefer the `text-slate-* dark:text-*` pairs in glass
  components, or legacy `app-*` CSS vars (`--app-accent`, `--app-surface` …) in
  older pages. Everything new must render correctly in **both** themes.

## 3. Page archetypes

### A. Home dashboard — `components/ModuleGrid.js`
- Greeting `Tilt` banner (time-aware) + **bento grid**.
- Grid: `grid grid-cols-2 gap-5 lg:grid-cols-6`; spans via `TILE_SPANS`
  (2-wide and 3-wide tiles, one `lg:row-span-2` featured tile).
- Featured tile (`purchaseorders`) shows an extra accent chip; add extra data via
  the aggregate stats endpoint (see §5), never by fetching from the tile.
- Entrance: `computeStagger(cards)` — delay = accumulated column units × 0.07s;
  featured tile uses `fadeInUpBig 0.7s`, others `fadeInUp 0.5s`, easing
  `cubic-bezier(0.22,1,0.36,1)`, `both` fill mode.

### B. Module dashboard (`*dashboard` pages) — `components/ModuleDashboardPage.js`
- Hero `Tilt` banner: module icon, `HUB` eyebrow, title, description, **live chips**.
- Sublink cards: `Tilt` cards in `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`;
  **bento**: first card and (when ≥4 links) 4th card get `sm:col-span-2 xl:col-span-2`.
  Entrance: wide cards at 0.05s, narrow at `0.1 + index*0.06`s.
- Quick-actions aside: gradient primary button + glass secondary button.

### C. Data sub-pages (lists, explorers) — `components/GlassSubPageHero.js`
```jsx
<GlassSubPageHero icon={LucideIcon} eyebrow="…" title="…" description="…"
                  accent="cyan" moduleKey="purchaseorders">
  {/* optional action buttons (right side) */}
</GlassSubPageHero>
```
- Compact hero, shows 1–2 live chips automatically when `moduleKey` is set.
- Already wired into: `PurchaseOrdersManager` (per-tab `HERO_CONFIG`),
  `StockManager`, `vendorevaluation/webformat`. Copy that pattern for new managers.

## 4. Navigation

- **Sidebar** (`components/SidebarLayout.js`): module icons via `MODULE_ICONS`
  (lucide); main links **uppercase 11px extrabold tracking-wide**; sub-links
  **title case in Poppins**; active = accent bar + soft bg; hover = slide + bar grow.
- **Header** (`components/ModuleHeader.js`): `NAV_ICONS` per top-level item,
  animated gradient underline sweep, chevron rotate on hover; dropdowns are
  theme-aware glass (`bg-app-surface/95 backdrop-blur`) with hover arrow-reveal —
  no hardcoded dark dropdowns.

## 5. Live data chips (read-only)

- `GET /api/dashboard/stats` → aggregate counts for home tiles (session-guarded,
  401 otherwise, `Cache-Control: no-store`, every count individually try/caught → `null`).
- `GET /api/dashboard/stats?module=<key>` → 1–2 human-readable chips per module.
  Valid keys live in `MODULE_KEYS` in that file.
- Legacy Mongo fields are kebab-case (`pending-val-sar`, `po-value-sar`) and may be
  strings/empty — always coerce with `$convert { onError: 0, onNull: 0 }`.
- Client pattern: fetch once in `useEffect`, render chips only when non-null;
  never block the page on stats.

## 6. Checklist for a new page

1. Wrap in the page archetype above; render `<GlassStyles />` at the root.
2. Pick an accent; copy the static accent maps — no dynamic Tailwind classes.
3. Add/extend stats in `pages/api/dashboard/stats.js` (read-only, guarded).
4. Bento spans + `computeStagger` (or per-card delays) for card grids.
5. Screenshot-verify in **both** themes before shipping.
