# DriftGuard brand guide

Official identity assets for DriftGuard hosted product, docs, and launch materials.

**Tagline:** Secure motion · Reliable trajectory

---

## Logo

| Asset | File | Use |
|-------|------|-----|
| Full lockup | `assets/logo-full.jpg` | Decks, social, Dev.to cover |
| Mark only | `assets/logo-mark.png` | Favicon source, app icon, nav |
| Wordmark | `assets/logo-wordmark.png` | Headers, light backgrounds |

### Clear space

Keep at least the height of the shield mark as padding on all sides.

### Don't

- Stretch or skew the mark
- Change gradient direction on the shield
- Place the mark on busy photography without a white or navy plate
- Use the old green (`#3dd68c`) accent — replaced by Electric Cyan

---

## Color palette

| Name | Hex | Role |
|------|-----|------|
| **Deep Navy** | `#0C243C` | Primary background, headings, nav bar |
| **Electric Cyan** | `#00A8E8` | CTAs, links, highlights, breaking-alert accent |
| **Steel Grey** | `#4D5E6B` | Secondary text, borders, muted UI |
| **Crisp White** | `#FFFFFF` | Text on dark, cards on marketing pages |

Reference swatch: `assets/guide-colors.png`

### CSS tokens

Hosted pages import `/brand.css`, which exposes `--dg-*` variables.

---

## Typography

| Weight | Use |
|--------|-----|
| **Bold** | Headlines, logo wordmark, primary buttons |
| **Medium** | Subheads, nav links |
| **Regular** | Body copy, form labels |

**Primary typeface:** Apex Sans (brand standard)

**Web fallback:** [Barlow](https://fonts.google.com/specimen/Barlow) until Apex Sans files are licensed and self-hosted.

Reference sheet: `assets/guide-typography.png`

---

## Header pattern

Reference mockup: `assets/guide-header-mockup.png`

```
[mark] DRIFTGUARD          Home · Pricing · Activate · GitHub
       SECURE MOTION • RELIABLE TRAJECTORY
```

Implemented in `web/brand.css` as `.dg-header`.

---

## Hosted asset URLs

After deploy, assets are served from:

```
/assets/branding/logo-mark.png
/assets/branding/logo-wordmark.png
/assets/branding/logo-full.jpg
```

---

## File inventory

```
branding/
  BRANDING.md
  assets/
    logo-full.jpg
    logo-mark.png
    logo-wordmark.png
    guide-colors.png
    guide-typography.png
    guide-header-mockup.png
web/
  brand.css
  assets/branding/   ← deploy copy (keep in sync with branding/assets/)
```

When updating artwork, copy into both `branding/assets/` and `web/assets/branding/`.
