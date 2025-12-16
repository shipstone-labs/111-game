# 111

A word puzzle game where you must score exactly 111 points to win.

**Play:** https://ruzzle-pwa.pages.dev (or deploy your own)

## Rules

- Form words by connecting adjacent letters on a 4×4 grid
- Minimum 2 letters, diagonal connections allowed
- **Win:** Score exactly 111 points
- **Trap:** Landing on 110 resets to 0
- **Overshoot:** Going over 111 resets to 0
- Board persists after reset—find a different path

See [DESIGN.md](DESIGN.md) for complete game design.

## Quick Start

```bash
# Serve locally
python3 -m http.server 8111

# Run tests
node test.js
```

Open http://localhost:8111

## Files

```
├── index.html      # Entry point
├── styles.css      # UI styling
├── game.js         # Game logic
├── words.txt.gz    # Dictionary (83K words, 203KB)
├── sw.js           # Service worker
├── manifest.json   # PWA manifest
├── test.js         # Node.js test suite
└── DESIGN.md       # Game design document
```

## Deploy

Static files only. Upload to any host (Cloudflare Pages, Netlify, GitHub Pages, etc.).

No build step required.

## TODO

- [ ] Timer (60-second countdown)
- [ ] Timer bonus (+30s for completing puzzles)

## License

Proprietary
