# Write.

Editorial blog front-end — a writing journal presented as a timeline.
Posts are nodes on a vertical spine, grouped by month. Serif titles
(the literary voice) paired with monospace timestamps (the log voice),
set in ink on paper.

> This package is **style only** — no state, no handlers, no data fetching.
> `src/data/posts.ts` holds static placeholder content you can replace.

## Run

```bash
npm install
npm run dev
```

## Structure

```
src/
  index.css                 design tokens, reset, base type, keyframes
  App.tsx / App.css         page "sheet" layout + footer
  components/
    Header.tsx / .css        brand wordmark + (inert) action buttons
    MonthSection.tsx / .css   month label + timeline list
    PostItem.tsx / .css       one timeline entry (node + rail + title + meta)
    icons.tsx                 inline Moon / Home SVGs
  data/posts.ts             static placeholder content
```

## Responsive

Desktop shows a centered paper sheet on a warm off-white desk.
At `max-width: 640px` it collapses to the mobile prototype: full-bleed
white page, brand centered with actions pinned right, tighter timeline.

## Effects (deliberately light)

- Staggered fade-up of months & posts on load (pure CSS, respects `prefers-reduced-motion`)
- Hover: the timeline node "inks in" and the title darkens & nudges right
- Sticky header that content slides under
- Soft light pooling behind the sheet
