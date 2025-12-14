# Ruzzle PWA

A canvas-based clone of the word game Ruzzle, built as a Progressive Web App.

**Play:** https://ruzzle-pwa.pages.dev/

## Features

- 4x4 letter grid with drag-to-select word formation
- Multipliers: DL (double letter), TL (triple letter), DW (double word), TW (triple word)
- Word length bonus: +5 for 5 letters, +10 for 6, +15 for 7, +20 for 8, +25 for 9+
- Duplicate word prevention
- 60-second timer with game-over overlay
- Offline support via service worker
- Touch and mouse input

## Scoring

| Component | Value |
|-----------|-------|
| Letter values | A=1, B=4, C=4, D=2, E=1, F=4, G=3, H=4, I=1, J=8, K=5, L=2, M=4, N=2, O=1, P=4, Q=10, R=1, S=1, T=1, U=2, V=5, W=4, X=8, Y=4, Z=10 |
| DL | Double letter value |
| TL | Triple letter value |
| DW | Double word total |
| TW | Triple word total |
| Length 5 | +5 bonus |
| Length 6 | +10 bonus |
| Length 7 | +15 bonus |
| Length 8 | +20 bonus |
| Length 9+ | +25 bonus |

## Files

- `index.html` - Game markup
- `styles.css` - Styling
- `game.js` - Game logic
- `test.html` - Test suite (unit + e2e)
- `sw.js` - Service worker for offline caching
- `manifest.json` - PWA manifest

## Testing

Open `test.html` in a browser or visit https://ruzzle-pwa.pages.dev/test.html

Tests cover:
- Timer formatting
- Word length bonus calculation
- Tile adjacency
- Board generation (letter selection, high-value adjacency)
- Scoring with multipliers
- E2E gameplay flows (drag, duplicate rejection, game over, reset)

## Development

No build step required. Edit files and deploy to Cloudflare Pages.

When making changes:
1. Bump `CACHE_NAME` version in `sw.js`
2. Run tests to verify

## License

MIT
