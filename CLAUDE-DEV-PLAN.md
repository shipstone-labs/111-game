# CLAUDE DEV PLAN — 111 Same Board Feature

## RECOVERY START HERE

If you're reading this after context loss:
1. Read the STATUS section below (current phase, last checkpoint)
2. Read only the files listed in "Files This Phase"
3. Run `node test.js` — must pass before any changes
4. Continue from "Next Action"

DO NOT read the entire codebase. Read only what STATUS says.

---

## STATUS (UPDATE AFTER EVERY COMMIT)

### Current Phase
Not started — Plan created, awaiting Phase A

### Branch
feature/same-board-session

### Last Checkpoint
2025-12-21 — Plan created (no commits yet)

### Test Status
```
node test.js → 93/93 PASSED (baseline)
```

### Files This Phase
- game.js (lines 505-550 interactive path, lines 795-820 test export)

### Next Action
Create feature branch, then start Phase A-1

### Completed Steps
- [x] Understand codebase architecture
- [x] Identify duplicated logic issue
- [x] Create dev plan
- [ ] A-1: Write failing test for same-board-on-solve
- [ ] A-2: Fix interactive path (solve)
- [ ] A-3: Fix test export path (solve)
- [ ] B-1: Write failing test for same-board-on-trap
- [ ] B-2: Fix interactive path (trap)
- [ ] B-3: Fix test export path (trap)
- [ ] C-1: Fix interactive path (overshoot) — currently broken
- [ ] D-1: Update DESIGN.md
- [ ] E-1: Final verification

### Blockers
None

---

## FEATURE SUMMARY

**Request:** Chris Reed (Dec 20, 2025)
Keep the same board for the entire game session. When player solves (hits 111), 
traps (hits 110), or overshoots (>111), the board letters remain the same. 
Only selections clear. New board only when starting a fresh game.

**Rationale:**
- Reduces cognitive load of constantly adapting to new letter arrangements
- Allows player to build familiarity and find "math-word shortcuts"
- Shifts challenge from "rapid pattern recognition" to "route optimization"

---

## ARCHITECTURE ISSUE

The codebase has DUPLICATED LOGIC in two places:

1. **Interactive path** (lines 505-550): Browser gameplay
2. **Test export path** (lines 795-820): module.exports for test.js

Both must be updated for any behavior change. The Dec 17 overshoot fix was only 
applied to test export, leaving interactive path broken.

---

## MICRO-PHASES

### Phase A: Same Board on Solve (111)

**A-1: Write failing test for same-board-on-solve**
- Add test: save board state, trigger solve (111), assert board UNCHANGED
- Run tests — expect THIS test to FAIL
- Commit: "test: solve should keep same board (fails)"

**A-2: Fix interactive path (solve)**
- Line ~514: Remove `board = generateBoard();` from solve branch
- Keep: `foundWords.clear(); totalScore = 0;` (reset progress, not board)
- Run tests — new test may still fail (test export not fixed yet)
- Commit: "fix(interactive): solve keeps same board"

**A-3: Fix test export path (solve)**
- Line ~799: Remove `board = generateBoard();` from solve branch
- Run tests — new test should now PASS
- Commit: "fix(test-export): solve keeps same board"

### Phase B: Same Board on Trap (110)

**B-1: Write failing test for same-board-on-trap**
- Add test: save board state, trigger trap (110), assert board UNCHANGED
- Run tests — expect THIS test to FAIL
- Commit: "test: trap should keep same board (fails)"

**B-2: Fix interactive path (trap)**
- Line ~530: Remove `board = generateBoard();` from trap branch
- Run tests
- Commit: "fix(interactive): trap keeps same board"

**B-3: Fix test export path (trap)**
- Line ~807: Remove `board = generateBoard();` from trap branch
- Run tests — new test should PASS
- Commit: "fix(test-export): trap keeps same board"

### Phase C: Fix Interactive Overshoot (Bug)

**C-1: Fix interactive path overshoot**
- Line ~538: Remove `board = generateBoard();` (bug from incomplete Dec 17 fix)
- Run tests
- Commit: "fix(interactive): overshoot keeps same board (complete Dec 17 fix)"

### Phase D: Update Documentation

**D-1: Update DESIGN.md**
- Revise Win/Loss Conditions table
- Update v1.3 or v1.4 version notes
- Commit: "docs: update DESIGN.md for same-board behavior"

### Phase E: Final Verification

**E-1: Run full test suite**
- `node test.js` — all tests must pass
- Verify test count increased

**E-2: Manual verification checklist**
- [ ] Solve (111): board stays, score resets, counter increments
- [ ] Trap (110): board stays, score resets, no counter increment
- [ ] Overshoot: board stays, score resets, no counter increment
- [ ] New Game button: generates fresh board
- [ ] Bonus (+30s at 3 boards): still triggers correctly

**E-3: Merge and deploy**
- Merge to main
- Verify Cloudflare Pages deployment
- Commit: "chore: merge same-board feature"

---

## TESTING APPROACH

### New Tests Needed
1. Solve keeps same board
2. Trap keeps same board
3. (Overshoot test already exists)

### Test Pattern
```javascript
// Save board state
game.setState({ board: testBoard, totalScore: X });
const boardBefore = JSON.stringify(game.getState().board);

// Trigger scenario
game.submitWord([path-to-trigger-score]);

// Assert board unchanged
const boardAfter = JSON.stringify(game.getState().board);
assertEqual(boardBefore, boardAfter, 'Board should be unchanged');
```

---

## CONTEXT BUDGET RULES

Per micro-phase:
- File reads: 3 max
- File writes: 2 max
- Tool calls: 8 max

Danger signals:
- Reading same file twice → checkpoint now
- 5+ tool calls in one response → pause
- Debugging loop > 2 iterations → commit partial

---

## ROLLBACK PLAN

If feature causes issues:
```bash
git revert HEAD~N  # Revert N commits
git push origin main
```

Or restore from last known good:
```bash
git checkout 1d300c1 -- game.js
```

---

## END OF PLAN
