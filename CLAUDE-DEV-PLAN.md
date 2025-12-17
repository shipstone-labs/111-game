# CLAUDE DEV PLAN — 111 (ruzzle-pwa)

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
A-1: Expose timeRemaining in getState()

### Branch
fix/pm-feedback-dec17

### Last Checkpoint
2025-12-17 16:25 — Branch created, tests pass (87/87)

### Test Status
```
node test.js → 87/87 PASSED
```

### Files This Phase
- game.js (lines 580-620: getState/setState functions)
- test.js (add new tests at end)

### Next Action
A-1: Add timeRemaining to getState() return object

### Completed Steps
- [x] Verify tests pass on main
- [x] Create branch fix/pm-feedback-dec17
- [x] Update CLAUDE-DEV-PLAN.md with micro-phases

### Blockers
None

---

## MICRO-PHASES (fix/pm-feedback-dec17)

### Phase A: Expose State for Testing

**A-1: Add timeRemaining to getState()**
- Edit game.js getState() to include timeRemaining
- Run tests — must still pass
- Commit: "refactor: expose timeRemaining in getState"

**A-2: Add timeRemaining to setState()**
- Edit game.js setState() to accept timeRemaining
- Run tests — must still pass  
- Commit: "refactor: accept timeRemaining in setState"

### Phase B: Test Issue 47 (Bonus Time Mutation)

**B-1: Write test for bonus time mutation**
- Add test: set timeRemaining=30, boardsSolved=2, solve board
- Assert: timeRemaining increased to 60 (not just gotBonus flag)
- Run tests — expect NEW test to pass or fail (tells us where bug is)
- Commit: "test: verify bonus time actually mutates state"

**B-2: Diagnose result**
- If B-1 passes: bug is in DOM layer (mark TBD for manual test)
- If B-1 fails: bug is in game logic, proceed to B-3

**B-3: Fix bonus time mutation (if needed)**
- Fix the code so timeRemaining actually increases
- Run tests — all must pass
- Commit: "fix: bonus time mutation (#47)"

### Phase C: Test Issue 49 (Trap Doesn't Block)

**C-1: Verify gameState after trap**
- Existing test checks gameState === 'playing' after trap
- Add test: verify board actually changed (new board generated)
- Run tests
- Commit: "test: verify trap generates new board and continues"

**C-2: Export feedback duration constant**
- Add FEEDBACK_DURATION_TRAP to exports (or create if missing)
- Add test asserting expected value (e.g., 800ms)
- Run tests
- Commit: "refactor: export feedback duration for testability"

### Phase D: Fix Issue 48 (Overshoot Same Board)

**D-1: Write failing test for overshoot board persistence**
- Add test: save board state, trigger overshoot, assert board UNCHANGED
- Run tests — expect THIS test to FAIL (proving the bug)
- Commit: "test: overshoot should keep same board (fails)"

**D-2: Fix overshoot to keep same board**
- Remove `board = generateBoard()` from overshoot branch
- Run tests — new test should pass, others still pass
- Commit: "fix: overshoot keeps same board (#48)"

### Phase E: Final Verification

**E-1: Run full test suite**
- Run `node test.js`
- All tests must pass
- Document final test count

**E-2: Update STATUS and merge**
- Update CLAUDE-DEV-PLAN.md STATUS to complete
- Merge to main
- Verify Cloudflare deploy

---

## ISSUES (PM FEEDBACK 2025-12-17)

| # | Issue | Testable? | Status |
|---|-------|-----------|--------|
| 47 | +30s bonus not triggering | ⚠️ Testing | Phase B will diagnose |
| 48 | Overshoot generates new board | ✅ Yes | Phase D will fix |
| 49 | 110 trap UX feels blocked | ⚠️ Partial | Phase C will verify logic |

---

## TESTING APPROACH

### What I Can Test (Autonomous)
```bash
node test.js
```

### What I Cannot Test (Manual Only)
- DOM rendering, CSS animations, timer display updates

### Test-First Rule
1. Write failing test that captures the bug
2. Run `node test.js` — confirm test fails
3. Implement fix
4. Run `node test.js` — confirm test passes
5. Commit with test + fix together

---

## CONTEXT BUDGET RULES

Per micro-phase:
- File reads: 3 max
- File writes: 2 max
- Tool calls: 8 max

**Danger signals:**
- Reading same file twice → losing context
- 5+ tool calls in one response → pause and checkpoint
- Debugging loop > 2 iterations → commit partial, document blocker

---

## FILE STRUCTURE

```
├── game.js         # Game logic + exports for testing
├── test.js         # Node.js test suite
├── CLAUDE-DEV-PLAN.md  # This file (STATUS here)
└── [other files not needed for this phase]
```

---

## COMPLETED VERSIONS

| Version | Features | Date |
|---------|----------|------|
| v1.0 | Core game, local dictionary, 111 rules | 2025-12-14 |
| v1.1 | 60-second timer | 2025-12-16 |
| v1.2 | Multi-board scoring, +30s bonus | 2025-12-16 |

---

## END OF PLAN
