# DriftGuard design philosophy

Inspired by infrastructure-grade product sites (Cloudflare, Linear, Vercel) — **not** a visual clone. We borrow the *discipline*, not the palette or marks.

## What we take from that school of design

| Principle | How DriftGuard applies it |
|-----------|---------------------------|
| **Mark is geometry, not illustration** | Logo is two traces + anchor dot — schema baseline vs drift |
| **Accent is scarce** | Green (`#3dd68c`) only for CTAs, checks, and the sentinel in the mark |
| **Dark UI, soft contrast** | `#0a0f14` bg, `#111922` surfaces, `#1e2a38` borders — no gradients in chrome |
| **Typography carries hierarchy** | Instrument Sans only; weight/size do the work, not decoration |
| **Assets are SVG-first** | Crisp at 16px favicon and 1200px OG card |
| **Content over chrome** | No heavy nav bars; favicon + optional 36px mark beside the title |

## What we deliberately avoid

- Orange / cloud motifs (Cloudflare-owned territory)
- Tagline stacks under every logo lockup
- Stock “shield” clipart or busy gradients
- Replacing the existing minimal page layout with marketing chrome

## Color tokens

| Token | Hex | Use |
|-------|-----|-----|
| `bg` | `#0a0f14` | Page background |
| `surface` | `#111922` | Cards |
| `border` | `#1e2a38` | Dividers |
| `text` | `#e8eef4` | Primary copy |
| `muted` | `#8fa3b8` | Secondary copy |
| `accent` | `#3dd68c` | CTA, mark sentinel, success |
| `warning` | `#ffb020` | Drift warnings |
| `breaking` | `#ff6b6b` | Breaking changes |

## Asset inventory

```
brand/
  DESIGN.md
  logo-mark.svg          — App icon, favicon source
  logo-wordmark.svg      — Horizontal lockup (mark + name)
  favicon.svg            — 32×32 optimized mark
  og-card.svg            — 1200×630 social preview
  pattern-grid.svg       — Subtle background texture
  icon-watch.svg         — Monitoring watches
  icon-diff.svg          — Schema diff
  icon-mcp.svg           — MCP tool schemas
  palette.svg            — Token reference sheet
web/brand/               — Deployed copy (keep in sync)
```

When updating artwork, edit `brand/` then copy to `web/brand/`.
