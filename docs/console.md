# Operator Console UX Notes

## Visual Language
- Dark background (#05060A) with electric blue accents (#3B82F6) for active states.
- Tailwind + shadcn/ui components; use subtle drop shadows and 200ms ease-out animations for state changes.
- Progress bars animate from left to right when phases advance; blockers pulse amber until resolved.

## Key Screens

### 1. Runs Overview
- Grid layout of run cards showing theme, current phase, status chip, and a small progress ring.
- "Awaiting human" cards highlight with amber border and include CTA button.
- Slide-in filter drawer for status, phase, and tag filtering.

### 2. Run Detail Timeline
- Left column: vertical timeline with animated connectors that light up as phases complete.
- Right column: content panel with tabs (Summary, Artifacts, Activity, Tasks).
- Artifacts tab displays markdown preview with inline citations and download button.
- Task pane uses shadcn `Accordion` to show pending vs. completed tasks.

### 3. QA Dashboard
- Tabular view with sticky header, showing autoplayer stats (TTFI, FPS, error logs) with sparkline charts.
- Manual checklist modal with animated checklist ticks; once all items checked, "Confirm QA" button enables.

### 4. Deployment Board
- Kanban columns (To Upload → Uploading → Live) with drag-and-drop (future) and card hover previews.
- Each card displays thumbnail, variant IDs, and copy-to-clipboard metadata for Clipcade form entries.

## Animations & Feedback
- Use `framer-motion` for card hover lifts and timeline reveals.
- Toast notifications appear bottom-right, auto-dismiss after 6s, manual tasks persist in inbox drawer.
- Skeleton loaders for data fetch; shimmering gradient matches accent color.

## Accessibility
- Ensure minimum 4.5:1 contrast ratio.
- Provide keyboard shortcuts: `g r` to open Run search, `g t` to jump to Tasks.
- Live regions announce new blockers for screen readers.
