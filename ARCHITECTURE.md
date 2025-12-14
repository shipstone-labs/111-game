# Architecture

Technical design document for Ruzzle PWA.

## File Structure

```
├── index.html      # Minimal markup, DOM structure
├── styles.css      # All styling including animations
├── game.js         # Game logic, rendering, event handling
├── test.html       # Test suite (unit + e2e)
├── sw.js           # Service worker for offline caching
├── manifest.json   # PWA manifest
└── README.md       # User-facing documentation
```

## Code Organization (game.js)

### Constants (lines 1-27)

| Constant | Purpose |
|----------|---------|
| `GRID_SIZE` | Board dimensions (4x4). Single source of truth for grid calculations. |
| `TILE_SIZE`, `TILE_GAP`, `BOARD_PADDING` | Layout metrics for canvas rendering. |
| `BOARD_WIDTH`, `BOARD_HEIGHT` | Computed canvas dimensions. |
| `SELECTION_RADIUS` | Hit detection radius for tile selection. |
| `GAME_DURATION` | Round length in seconds. |
| `LETTER_VALUES` | Scrabble-style point values per letter. |
| `MULTIPLIER_COLORS` | Color coding for DL/TL/DW/TW badges. |
| `VOWELS`, `VOWEL_WEIGHTS` | Vowel set and frequency distribution. |
| `GUARANTEED` | Letters that appear on every board (E, T, A, S, R, I, N). |
| `HIGH_VALUE` | Letters requiring adjacency to vowels (Q, X, Z, J, K). |
| `CONSONANT_WEIGHTS` | Consonant frequency distribution. |

### State Variables (lines 29-44)

| Variable | Type | Purpose |
|----------|------|---------|
| `board` | Array&lt;Tile&gt; | 16-element array of tile objects |
| `selectedPath` | Array&lt;number&gt; | Indices of currently selected tiles |
| `isDragging` | boolean | Whether user is mid-drag |
| `currentPos` | {x, y} | Current pointer position for line rendering |
| `displayWord` | string | Word being formed (shown in pill) |
| `displayScore` | number | Score preview for current word |
| `totalScore` | number | Accumulated score for round |
| `showInvalid` | boolean | Whether to show invalid word feedback |
| `invalidMessage` | string | "not a word" or "already used" |
| `timeRemaining` | number | Countdown seconds |
| `gameActive` | boolean | Whether input is accepted |
| `usedWords` | Set&lt;string&gt; | Words already played this round |
| `hasPlayedOnce` | boolean | Controls "Play" vs "Play Again" button text |

### Tile Object Shape

```javascript
{
  letter: string,      // Single uppercase letter
  multiplier: string|null,  // 'DL', 'TL', 'DW', 'TW', or null
  row: number,         // 0-3
  col: number          // 0-3
}
```

## Board Generation Algorithm

### Letter Selection (`selectLetters`)

1. **Guaranteed letters**: Always include E, T, A, S, R, I, N (7 letters)
2. **Vowel balancing**: Add vowels until count reaches 5-7 (weighted toward E, A)
3. **High-value letters**: 50% chance to add 1-2 from Q, X, Z, J, K
4. **Fill remaining**: Weighted consonant selection favoring common letters
5. **Shuffle**: Fisher-Yates shuffle for random placement

### High-Value Adjacency (`ensureHighValueAdjacency`)

Problem: Q, X, Z, J, K are nearly unplayable without adjacent vowels.

Solution: After initial placement, scan for high-value letters without adjacent vowels. Swap with any non-high-value letter that has adjacent vowels.

### Multiplier Placement (`addMultipliers`)

Constraints:
- 0-5 multipliers per board (uniform random)
- Maximum 2 of each type (DL, TL, DW, TW)
- Prefer placement on common letters (vowels + T, N, S, R, L, D, C, M, P)
- Limit adjacent multiplier pairs to ≤2
- Limit multiplier clusters (3+ adjacent) to ≤1

Algorithm: Generate random placement, check constraints, retry up to 50 times.

## Rendering Pipeline (`draw`)

Canvas drawing order (back to front):

1. **Background gradient** - Blue gradient fill
2. **Tile shadows** - Offset dark rounded rects
3. **Tile bases** - Gray (unselected) or orange (selected) rounded rects
4. **Tile faces** - White/orange gradient rounded rects
5. **Multiplier borders** - Colored stroke on tiles with multipliers
6. **Letter shadows** - Offset dark text
7. **Letters** - Main letter text
8. **Point values** - Small number in corner
9. **Multiplier badges** - Circular badges with type labels
10. **Path lines** - Orange line connecting selected tiles

## Event Flow

### Drag Detection

```
mousedown/touchstart → handleStart()
  ├─ Check gameActive
  ├─ Clear any invalid state
  ├─ Hit-test tile at coordinates
  ├─ Initialize selectedPath with first tile
  └─ Set isDragging = true

mousemove/touchmove → handleMove()
  ├─ Check isDragging && gameActive
  ├─ Update currentPos for line rendering
  ├─ Hit-test tile at coordinates
  ├─ If tile in path (not last): truncate path (backtrack)
  ├─ If tile not in path && adjacent to last: append to path
  └─ Update displayWord and displayScore

mouseup/touchend → handleEnd()
  ├─ Check gameActive
  ├─ Set isDragging = false
  ├─ If word in usedWords: show "already used"
  ├─ Else if isValidWord(): add to usedWords, add score
  ├─ Else: show "not a word"
  └─ Clear selectedPath
```

### Adjacency Check

Two tiles are adjacent if their row and column differences are both ≤1, excluding the same tile:

```javascript
function areAdjacent(t1, t2) {
  const rd = Math.abs(t1.row - t2.row);
  const cd = Math.abs(t1.col - t2.col);
  return rd <= 1 && cd <= 1 && !(rd === 0 && cd === 0);
}
```

This allows 8-directional movement (horizontal, vertical, diagonal).

## Scoring Calculation

Order of operations in `calculateWordScore`:

1. For each tile in path:
   - Get base letter value from `LETTER_VALUES`
   - If DL: multiply letter value by 2
   - If TL: multiply letter value by 3
   - If DW: accumulate word multiplier ×2
   - If TW: accumulate word multiplier ×3
   - Add letter value to sum

2. Multiply sum by accumulated word multiplier

3. Add length bonus:
   - 5 letters: +5
   - 6 letters: +10
   - 7 letters: +15
   - 8 letters: +20
   - 9+ letters: +25

Example: "DOG" with DL on D, TL on O, DW on G
- D: 2 × 2 = 4
- O: 1 × 3 = 3
- G: 3 (no letter multiplier)
- Sum: 10
- Word multiplier: ×2 (from DW)
- Final: 10 × 2 = 20 (no length bonus for 3 letters)

## Timer System

- `startTimer()`: Initialize countdown, set `gameActive = true`
- `stopTimer()`: Clear interval, set `gameActive = false`
- On expiry: Call `showGameOver()`, display overlay with final score

The `gameActive` flag gates all input handling, preventing play after time expires.

## Service Worker Strategy

Cache-first for assets, network-first for navigation:

```javascript
// Navigation: try network, fall back to cache
if (e.request.mode === 'navigate') {
  fetch(e.request).catch(() => caches.match(e.request))
}

// Assets: try cache, fall back to network
else {
  caches.match(e.request).then(cached => cached || fetch(e.request))
}
```

Cache version (`CACHE_NAME`) must be bumped on any file change to invalidate old caches.

## Test Architecture

### Unit Tests

Pure function tests that don't require DOM or canvas:
- `formatTime()` - Timer display formatting
- `getLengthBonus()` - Word length bonus calculation
- `getNeighbors()` - Tile adjacency enumeration
- `areAdjacent()` - Pairwise adjacency check
- `selectLetters()` - Letter generation constraints
- `generateBoard()` - Board structure validation
- `calculateWordScore()` - Scoring with controlled board

### E2E Tests

Simulate gameplay by manipulating game state and calling handlers with mock events:

1. Set up known board state
2. Mock `canvas.getBoundingClientRect()` for coordinate calculation
3. Call `handleStart/handleMove/handleEnd` with computed tile coordinates
4. Assert state changes (score, usedWords, selectedPath, flags)

This tests the full integration without requiring a browser automation framework.

## Design Decisions

### Why Canvas?

- Smooth drag animations without DOM reflow
- Single rendering context for tiles, paths, badges
- Consistent appearance across browsers
- Touch events work identically to mouse events

### Why No Build Step?

- Minimal complexity for a single-file game
- Direct deployment to Cloudflare Pages
- Easy to understand and modify
- No dependency management overhead

### Why Stub Dictionary?

The `isValidWord()` function alternates true/false for testing purposes. A production implementation would:
- Load a word list (Scrabble dictionary, aspell, etc.)
- Use a Trie for efficient prefix checking during drag
- Potentially call an API for validation

The stub allows full gameplay testing without dictionary complexity.
