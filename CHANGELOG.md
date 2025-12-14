# Changelog

All notable changes to Ruzzle PWA.

## [Unreleased]

## [1.0.0] - 2025-12-14

### Added
- Complete file restructure: split monolith into index.html, styles.css, game.js
- `GRID_SIZE` constant replacing hardcoded 4 throughout codebase
- Duplicate word prevention with `usedWords` Set
- "already used" feedback message for duplicate attempts
- Game-over overlay with final score display
- Word length bonus scoring per Ruzzle rules:
  - 5 letters: +5
  - 6 letters: +10
  - 7 letters: +15
  - 8 letters: +20
  - 9+ letters: +25
- Comprehensive test suite (test.html):
  - Unit tests for timer, adjacency, board generation, scoring
  - E2E tests for gameplay flows, duplicate rejection, game over
- `hasPlayedOnce` flag for "Play" → "Play Again" button text
- Score flash animation on valid word
- README.md with scoring reference
- ARCHITECTURE.md with technical design documentation
- CHANGELOG.md

### Changed
- Service worker now caches styles.css and game.js separately
- `calculateWordScore()` accepts optional parameters for testing

## [0.9.0] - 2025-12-13

### Added
- Timer/score header layout with flexbox centering
- Timer SVG icon

### Fixed
- Timer duration restored to 60 seconds (was 5 for testing)
- Header layout centering issues

## [0.8.0] - 2025-12-13

### Added
- Invalid word feedback ("not a word" pill with shake animation)
- Word pill UI restructure (persistent display area)
- Valid word pill styling (green background)

### Changed
- UI layout reorganization for better visual hierarchy

## [0.7.0] - 2025-12-13

### Fixed
- Multiplier scoring calculation order of operations
- DW/TW now correctly multiply entire word total

## [0.6.0] - 2025-12-13

### Added
- Multiplier badge rendering (DL, TL, DW, TW)
- Multiplier placement algorithm with adjacency constraints
- High-value letter adjacency to vowels

### Changed
- Board generation ensures playable letter distributions

## [0.5.0] - 2025-12-13

### Added
- Word pill display during drag
- Score preview while forming words
- Path backtracking (drag back over previous tiles)

## [0.4.0] - 2025-12-13

### Added
- Canvas-based tile rendering with 3D effect
- Drag-to-select word formation
- Path line visualization
- Touch and mouse input support

## [0.3.0] - 2025-12-13

### Added
- Service worker for offline caching
- PWA manifest
- Apple touch icon

## [0.2.0] - 2025-12-13

### Added
- Basic game timer (countdown)
- Score display
- Play button

## [0.1.0] - 2025-12-13

### Added
- Initial project setup
- 4x4 letter grid
- Letter value system (Scrabble-style)
