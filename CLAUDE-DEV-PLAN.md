# CLAUDE DEV PLAN — 111 (ruzzle-pwa)

## RECOVERY START HERE

If you're reading this after context loss:
1. Read the STATUS section below (current phase, last checkpoint)
2. Read only the files listed in "Files This Phase"
3. Run `node test.js` — must pass before any changes
4. Continue from "Next Action"

DO NOT read the entire codebase. Read only what STATUS says.

---

## STATUS (UPDATE DURING WORK)

### Current Phase
PM Feedback Fixes — IN PROGRESS

### Last Checkpoint
2025-12-17 — v1.2 deployed, PM feedback received

### Deployed URL
https://ruzzle-pwa.pages.dev

### Known State
- Timer: 60 seconds, working
- Multi-board scoring: working
- +30s bonus at 3 boards: code exists, PM reports not triggering
- 110 trap: generates new board (correct)
- Overshoot: generates new board (incorrect — should keep same board)

### Test Status
```
node test.js
✓ ALL TESTS PASSED (87/87)
```

### Next Action
Review and fix PM feedback issues (see ISSUES section)

### Blockers
None

### Branch
main (create feature branch before fixes)

---

## ISSUES (PM FEEDBACK 2025-12-17)

| # | Issue | Testable? | Status |
|---|-------|-----------|--------|
| 47 | +30s bonus not triggering at 3 boards | ⚠️ Partial | TBD — logic passes test, display untestable |
| 48 | Overshoot generates new board (should keep same) | ✅ Yes | TODO |
| 49 | 110 trap UX feels blocked | ❌ No | TBD — CSS/animation only |

### Issue 47: Bonus Not Triggering
**Symptom:** PM solved 3+ boards repeatedly, never saw +30s bonus
**Code:** `if (boardsSolved === BONUS_THRESHOLD)` fires once at exactly 3
**Test:** Existing test passes (`gotBonus: true` at boardsSolved=3)
**Unknown:** Is bonus supposed to repeat at 6, 9, 12...?
**Testable:** Logic only. Timer display update is DOM (untestable).
**Action:** Clarify requirement, then decide.

### Issue 48: Overshoot Keeps Same Board
**Symptom:** Overshoot generates new board, player loses knowledge
**Expected:** Reset score/words but keep same board (rewards memory)
**Code change:** Remove `board = generateBoard()` from overshoot branch
**Testable:** ✅ Yes — can verify board unchanged after overshoot
**Action:** Write test first, then fix.

### Issue 49: 110 Trap UX
**Symptom:** Trap message feels like game is blocked, user reaches for Reset
**Cause:** Red shake animation signals "error/stop" even though new board is ready
**Testable:** ❌ No — CSS animation timing, visual perception
**Action:** TBD for manual testing. Possible fix: shorter feedback duration, different color.

---

## TESTING APPROACH

### What I Can Test (Autonomous)
```bash
node test.js
```
- Game logic via exported functions
- State transitions (valid, invalid, trap, overshoot, solved)
- Scoring calculations
- Board generation constraints
- Dictionary validation

### What I Cannot Test (Manual Only)
- DOM rendering
- CSS animations and colors
- Timer display updates
- Touch/mouse input handling
- Visual feedback timing
- Service worker behavior

### Test-First Rule
**Never claim a fix works without a passing test.**

For testable issues:
1. Write failing test that captures the bug
2. Run `node test.js` — confirm test fails
3. Implement fix
4. Run `node test.js` — confirm test passes
5. Commit with test + fix together

For untestable issues:
1. Mark as TBD
2. Document expected behavior
3. User tests manually after deploy

---

## CONTEXT BUDGET RULES

Per micro-phase:
- File reads: 3 max
- File writes: 2 max
- Tool calls: 8 max
- Code in response: 50 lines max (rest to file)

**Danger signals:**
- Reading same file twice → losing context
- 5+ tool calls in one response → pause and checkpoint
- Debugging loop > 2 iterations → commit partial, document blocker

---

## FILE STRUCTURE

```
├── index.html      # Entry point
├── styles.css      # UI styling (untestable)
├── game.js         # Game logic + exports for testing
├── test.js         # Node.js test suite (87 tests)
├── words.txt.gz    # Dictionary (83K words)
├── sw.js           # Service worker
├── manifest.json   # PWA manifest
├── DESIGN.md       # Game design spec
├── README.md       # User docs
└── CLAUDE-DEV-PLAN.md  # This file
```

### Key Exports (game.js)

For testing, game.js exports:
```javascript
module.exports = {
  // Constants
  TARGET_SCORE, TRAP_SCORE, GRID_SIZE, LETTER_VALUES,
  BONUS_THRESHOLD, BONUS_TIME,
  
  // Functions
  getLengthBonus, getNeighbors, areAdjacent,
  selectLetters, generateBoard, hasAdjacentVowel,
  calculateWordScore, isValidWord, setDictionary,
  
  // State management
  setState, getState, submitWord
};
```

---

## WORKFLOW

### Before Starting Any Fix
```bash
cd /Users/creed/projects/ruzzle-pwa
git checkout main
git pull
node test.js  # Must pass
git checkout -b fix/issue-XX-description
```

### After Each Fix
```bash
node test.js  # Must pass
git add -A
git commit -m "fix: description (#XX)"
git push origin fix/issue-XX-description
```

### Merging
```bash
git checkout main
git merge fix/issue-XX-description
git push origin main
# Cloudflare Pages auto-deploys
```

---

## COMPLETED PHASES

| Version | Features | Date |
|---------|----------|------|
| v1.0 | Core game, local dictionary, 111 rules | 2025-12-14 |
| v1.1 | 60-second timer | 2025-12-16 |
| v1.2 | Multi-board scoring, +30s bonus | 2025-12-16 |

---

## END OF PLAN
