# 111

A word puzzle game where you solve boards by scoring exactly 111 points.

**Play:** https://ruzzle-pwa.pages.dev (or deploy your own)

## Rules

- Form words by connecting adjacent letters on a 4×4 grid
- Minimum 2 letters, diagonal connections allowed
- **Goal:** Score exactly 111 to solve the board
- **Trap:** Landing on 110 resets with a new board (no credit)
- **Overshoot:** Going over 111 resets with a new board (no credit)
- **Timer:** 60 seconds to solve as many boards as possible
- **Bonus:** Solve 3 boards to earn +30 seconds

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

- [x] Timer (60-second countdown)
- [x] Timer bonus (+30s at 3 boards)
- [ ] Leaderboards
- [ ] Multiplayer challenge mode

## License

Proprietary
