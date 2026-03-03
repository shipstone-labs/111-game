# 111 Game — PWA Icon Reference

**Last updated:** March 3, 2026
**Problem solved after 16 days of debugging.**
**DO NOT deviate from this setup. It works.**

---

## The Rules

1. **Landing page icon (`icon-1024.png`) is SEPARATE from app icons.** It has the white circle with drop shadow. Never touch it when fixing app icons.

2. **App icons have NO circle.** The 111 text fills the square directly on a white background.

3. **Android requires SEPARATE `maskable` icons** with the 111 content inside the inner 80% safe zone. Without this, Android shrinks the icon to fit its adaptive icon mask.

4. **The service worker MUST cache files** (not be a pass-through). Chrome will not offer "Install app" for a pass-through service worker — it only offers "Add to Home Screen," which ignores manifest icons and screenshots the page instead.

5. **Users must choose "Install app" on Android**, not just "Add to Home Screen." The install path goes: three-dot menu → Add to Home Screen → Install.

---

## File Inventory

### Landing Page (DO NOT CHANGE)
- `icon-1024.png` — White circle with 111, used in `<img>` tag on index.html

### App Icons — "any" purpose (edge-to-edge, 111 fills ~90%)
- `icon-192b.png` — 192x192
- `icon-512.png` — 512x512
- `apple-touch-icon.png` — 1024x1024

### App Icons — "maskable" purpose (111 padded to inner 72% for safe zone)
- `maskable-192.png` — 192x192
- `maskable-512.png` — 512x512
- `maskable-1024.png` — 1024x1024

---

## manifest.json (exact working version)

```json
{
  "name": "111 Game",
  "short_name": "111",
  "start_url": "/111-game/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#008E97",
  "icons": [
    {
      "src": "icon-192b.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "maskable-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "apple-touch-icon.png",
      "sizes": "1024x1024",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "maskable-1024.png",
      "sizes": "1024x1024",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

---

## index.html icon references

```html
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="icon-512.png">
```

- iPhone uses `icon-512.png` via the `apple-touch-icon` link.
- Android uses the manifest icons.
- The landing page `<img>` uses `icon-1024.png` (the circle version).

---

## sw.js requirements

- MUST cache core files (not be a pass-through)
- MUST have `install`, `activate`, and `fetch` handlers
- `install` event must call `caches.open()` and `cache.addAll()`
- `fetch` event must serve from cache on network failure
- Bump the VERSION string whenever files change
- Include all icon files (including maskable) in the CORE_FILES list

---

## Design Specs

- **Font:** Ramaraja (Google Font, SIL OFL license)
- **Aqua fill:** #008E97
- **Orange outline:** #FF6900
- **Background:** White (#FFFFFF)

---

## Common Failures and Fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Tiny 111 in circle on home screen | Chrome screenshotting the page instead of using manifest | Service worker must cache files; use "Install app" not "Add to Home Screen" |
| 111 appears shrunken inside Android's circle mask | `maskable` icons missing or `"any maskable"` combined on edge-to-edge icons | Use separate entries: `"purpose": "any"` and `"purpose": "maskable"` with padded versions |
| Icon doesn't update after uploading new files | Android/iOS cache | Uninstall app (not just remove), clear Chrome cache/data, reinstall |
| GitHub Pages not deploying | Zip file uploaded (GitHub stores it as-is) | Upload files individually |
| Old circle icon reappearing | Wrong file uploaded or old file restored | Verify live files by fetching from shipstone-labs.github.io/111-game/ |

---

## How to Regenerate Icons

If you ever need to regenerate the icon files, use the existing `apple-touch-icon.png` as the source (it has the correct 111 artwork). Crop the text content, then:

- **"any" icons:** Scale 111 to fill 90% of the square
- **"maskable" icons:** Scale 111 to fill 72% of the square (leaves room for 80% safe zone)

Place on white (#FFFFFF) background, centered, at 192x192, 512x512, and 1024x1024.
