# 111 Game Design Document

## Overview

111 is a word puzzle game where players form words on a 4×4 letter grid to score exactly 111 points. The strategic challenge lies in precise point management—overshooting or landing on 110 resets progress.

## Core Mechanics

### Grid
- 4×4 grid of letter tiles (16 tiles total)
- Each tile has a letter and point value
- Some tiles have score multipliers

### Word Formation
- Connect adjacent tiles (including diagonals) to form words
- Minimum 2 letters
- Each tile can only be used once per word
- Path can be retraced by dragging back

### Scoring

**Letter Values (Scrabble-style):**
| Points | Letters |
|--------|---------|
| 1 | A, E, I, O, R, S, T |
| 2 | D, L, N, U |
| 3 | G |
| 4 | B, C, F, H, M, P, W, Y |
| 5 | K, V |
| 8 | J, X |
| 10 | Q, Z |

**Multipliers:**
- DL (Double Letter): 2× letter value
- TL (Triple Letter): 3× letter value
- DW (Double Word): 2× word total
- TW (Triple Word): 3× word total

**Length Bonus:**
| Word Length | Bonus |
|-------------|-------|
| 2-4 letters | 0 |
| 5 letters | +5 |
| 6 letters | +10 |
| 7 letters | +15 |
| 8+ letters | +20-25 (capped at +25) |

**Score Calculation:**
1. Sum letter values (applying DL/TL multipliers)
2. Apply DW/TW multipliers to word total
3. Add length bonus

### Win/Loss Conditions

| Condition | Result |
|-----------|--------|
| Score exactly 111 | **Win** |
| Score 110 | Reset to 0 (trap) |
| Score > 111 | Reset to 0 (overshoot) |

**Board Persistence:** The same board remains after a reset. Players must find a different path to 111.

### Dictionary
- TWL06 (Tournament Word List)
- 83,667 valid words (2-8 letters)
- Loaded locally, no server required

## Board Generation

### Letter Distribution
- 7 guaranteed common letters: E, T, A, S, R, I, N
- 5-7 vowels per board
- Weighted random selection favoring common letters
- High-value letters (Q, X, Z, J, K) guaranteed adjacent vowel

### Multiplier Distribution
- 2× DL, 2× TL, 1× DW, 1× TW per board (6 total)
- Randomly placed

## User Interface

### Layout
- Header: Target display, score, Play/Reset button
- Word pill: Shows current selection and feedback
- Canvas: 4×4 tile grid

### Feedback States
| State | Display |
|-------|---------|
| Selecting | Gray pill with letters |
| Valid word | Green pill with "+N" |
| Invalid word | Red pill "Not a word" |
| Duplicate | Orange pill "Already used" |
| 110 trap | Red pill with shake animation |
| Overshoot | Red pill with shake animation |
| Win | Green pill with pulse animation |

### Game States
1. **Ready** — Blank board, Play button enabled
2. **Playing** — Board visible, accepting input
3. **Won** — Board frozen, Play button becomes "New Game"

## Technical Implementation

### Architecture
- Single-page PWA
- Vanilla JavaScript (no framework)
- Canvas-based rendering
- Local dictionary (gzipped, decompressed via DecompressionStream)

### Files
| File | Purpose |
|------|---------|
| index.html | Entry point, DOM structure |
| styles.css | UI styling |
| game.js | Game logic, rendering, input |
| words.txt.gz | Dictionary (203KB) |
| sw.js | Service worker for offline |
| manifest.json | PWA manifest |

### Browser Requirements
- DecompressionStream API (Chrome 80+, Firefox 113+, Safari 16.4+)
- Canvas roundRect (Chrome 99+, Firefox 112+, Safari 15.4+)

## Deferred Features

### Timer System (v2)
- 60-second countdown per round
- Game ends when timer reaches 0
- Timer starts on Play

### Timer Bonus (v2+)
- +30 seconds for completing 4 puzzles
- Puzzle = successfully reaching 111

### Multiplayer (future)
- Challenge mode with shared boards
- Leaderboards

## Version History

### v1.0 (Current)
- Core gameplay without timer
- Local dictionary validation
- 111/110/overshoot rules
- Board persistence on reset
- PWA offline support
