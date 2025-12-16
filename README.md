# 111

A word puzzle game where you must score exactly 111 points to win.

## Rules

- Form words by connecting adjacent letters on a 4×4 grid
- Each word scores points based on letter values and multipliers
- **Win**: Score exactly 111 points
- **110 Trap**: Landing on 110 resets your score to 0
- **Overshoot**: Going over 111 resets your score to 0
- Board persists after resets

## Multipliers

- **DL** (green): Double letter value
- **TL** (blue): Triple letter value  
- **DW** (orange): Double word value
- **TW** (red): Triple word value

## Length Bonus

- 5 letters: +5 points
- 6 letters: +10 points
- 7 letters: +15 points
- 8+ letters: +20-25 points

## Tech

Static PWA with local dictionary (83K words, 203KB gzipped). No server required.

## Deploy

Upload files to any static host. No build step.

Files:
- `index.html` - Entry point
- `styles.css` - Styling
- `game.js` - Game logic
- `words.txt.gz` - Dictionary (TWL06, 2-8 letter words)
- `manifest.json` - PWA manifest
- `sw.js` - Service worker for offline support

## Deferred Features

- [ ] Timer with puzzle completion bonuses (+30s for 4 puzzles)
