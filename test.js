/**
 * test.js - Node.js tests for 111 game logic
 * Run: node test.js
 */

const fs = require('fs');
const zlib = require('zlib');
const game = require('./game.js');

// Test utilities
let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}`);
  }
}

function assertEqual(actual, expected, name) {
  if (actual === expected) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name} (expected ${expected}, got ${actual})`);
  }
}

function assertIncludes(arr, item, name) {
  if (arr.includes(item)) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name} (${item} not in [${arr.slice(0,5).join(',')}...])`);
  }
}

function section(name) {
  console.log(`\n${name}`);
  console.log('─'.repeat(name.length));
}

// =============================================================================
// DICTIONARY LOADING
// =============================================================================

function loadDictionary() {
  const compressed = fs.readFileSync('./words.txt.gz');
  const text = zlib.gunzipSync(compressed).toString('utf8');
  const words = new Set(text.trim().toUpperCase().split('\n'));
  game.setDictionary(words);
  return words;
}

// =============================================================================
// UNIT TESTS
// =============================================================================

section('Constants');
assertEqual(game.TARGET_SCORE, 111, 'TARGET_SCORE = 111');
assertEqual(game.TRAP_SCORE, 110, 'TRAP_SCORE = 110');
assertEqual(game.GRID_SIZE, 4, 'GRID_SIZE = 4');
assertEqual(game.LETTER_VALUES['A'], 1, 'A = 1 point');
assertEqual(game.LETTER_VALUES['Q'], 10, 'Q = 10 points');
assertEqual(game.LETTER_VALUES['Z'], 10, 'Z = 10 points');

section('Length Bonus');
assertEqual(game.getLengthBonus(1), 0, '1 letter = 0 bonus');
assertEqual(game.getLengthBonus(2), 0, '2 letters = 0 bonus');
assertEqual(game.getLengthBonus(3), 0, '3 letters = 0 bonus');
assertEqual(game.getLengthBonus(4), 0, '4 letters = 0 bonus');
assertEqual(game.getLengthBonus(5), 5, '5 letters = +5 bonus');
assertEqual(game.getLengthBonus(6), 10, '6 letters = +10 bonus');
assertEqual(game.getLengthBonus(7), 15, '7 letters = +15 bonus');
assertEqual(game.getLengthBonus(8), 20, '8 letters = +20 bonus');
assertEqual(game.getLengthBonus(9), 25, '9 letters = +25 bonus (capped)');
assertEqual(game.getLengthBonus(10), 25, '10 letters = +25 bonus (capped)');

section('Adjacency - getNeighbors');
const n0 = game.getNeighbors(0);
assertEqual(n0.length, 3, 'Corner tile (0) has 3 neighbors');
assertIncludes(n0, 1, 'Tile 0 neighbors include 1');
assertIncludes(n0, 4, 'Tile 0 neighbors include 4');
assertIncludes(n0, 5, 'Tile 0 neighbors include 5');

const n5 = game.getNeighbors(5);
assertEqual(n5.length, 8, 'Center tile (5) has 8 neighbors');

const n15 = game.getNeighbors(15);
assertEqual(n15.length, 3, 'Corner tile (15) has 3 neighbors');

section('Adjacency - areAdjacent');
assert(game.areAdjacent({row:0,col:0}, {row:0,col:1}), 'Horizontal adjacent');
assert(game.areAdjacent({row:0,col:0}, {row:1,col:0}), 'Vertical adjacent');
assert(game.areAdjacent({row:0,col:0}, {row:1,col:1}), 'Diagonal adjacent');
assert(!game.areAdjacent({row:0,col:0}, {row:0,col:0}), 'Same tile not adjacent');
assert(!game.areAdjacent({row:0,col:0}, {row:0,col:2}), '2 tiles apart not adjacent');
assert(!game.areAdjacent({row:0,col:0}, {row:2,col:2}), 'Diagonal 2 apart not adjacent');

section('Board Generation - selectLetters');
const letters = game.selectLetters();
assertEqual(letters.length, 16, 'selectLetters returns 16 letters');
for (const g of game.GUARANTEED) {
  assertIncludes(letters, g, `Guaranteed letter ${g} present`);
}
const vowelCount = letters.filter(l => game.VOWELS.includes(l)).length;
assert(vowelCount >= 5 && vowelCount <= 7, `Vowel count ${vowelCount} in range 5-7`);

section('Board Generation - generateBoard');
const testBoard = game.generateBoard();
assertEqual(testBoard.length, 16, 'generateBoard returns 16 tiles');
assert(testBoard.every(t => t.letter && typeof t.row === 'number' && typeof t.col === 'number'), 
       'All tiles have letter, row, col');

// Count multipliers
const multipliers = testBoard.filter(t => t.multiplier !== null);
assert(multipliers.length >= 4 && multipliers.length <= 6, 
       `Multiplier count ${multipliers.length} in range 4-6`);

// Check high-value letters have adjacent vowels
let highValueOk = true;
for (let i = 0; i < testBoard.length; i++) {
  if (game.HIGH_VALUE.includes(testBoard[i].letter)) {
    if (!game.hasAdjacentVowel(testBoard, i)) {
      highValueOk = false;
      console.log(`    (High-value ${testBoard[i].letter} at ${i} has no adjacent vowel)`);
    }
  }
}
assert(highValueOk, 'High-value letters adjacent to vowels');

section('Scoring - calculateWordScore');
// Create controlled board for scoring tests
const scoringBoard = [
  {letter:'C',multiplier:null,row:0,col:0},
  {letter:'A',multiplier:null,row:0,col:1},
  {letter:'T',multiplier:null,row:0,col:2},
  {letter:'S',multiplier:null,row:0,col:3},
  {letter:'D',multiplier:'DL',row:1,col:0},
  {letter:'O',multiplier:'TL',row:1,col:1},
  {letter:'G',multiplier:'DW',row:1,col:2},
  {letter:'E',multiplier:'TW',row:1,col:3},
  {letter:'R',multiplier:null,row:2,col:0},
  {letter:'A',multiplier:null,row:2,col:1},
  {letter:'T',multiplier:null,row:2,col:2},
  {letter:'E',multiplier:null,row:2,col:3},
  {letter:'B',multiplier:null,row:3,col:0},
  {letter:'I',multiplier:null,row:3,col:1},
  {letter:'N',multiplier:null,row:3,col:2},
  {letter:'D',multiplier:null,row:3,col:3}
];

// CAT = C(4) + A(1) + T(1) = 6
assertEqual(game.calculateWordScore([0,1,2], scoringBoard), 6, 'CAT = 6 points');

// D with DL = D(2)*2 = 4
assertEqual(game.calculateWordScore([4], scoringBoard), 4, 'D with DL = 4 points');

// O with TL = O(1)*3 = 3
assertEqual(game.calculateWordScore([5], scoringBoard), 3, 'O with TL = 3 points');

// G with DW = G(3) * 2(word) = 6
assertEqual(game.calculateWordScore([6], scoringBoard), 6, 'G with DW = 6 points');

// E with TW = E(1) * 3(word) = 3
assertEqual(game.calculateWordScore([7], scoringBoard), 3, 'E with TW = 3 points');

// DOG with DL on D, TL on O, DW on G = (2*2 + 1*3 + 3) * 2 = 20
assertEqual(game.calculateWordScore([4,5,6], scoringBoard), 20, 'DOG with multipliers = 20');

// CATS = C(4) + A(1) + T(1) + S(1) = 7
assertEqual(game.calculateWordScore([0,1,2,3], scoringBoard), 7, 'CATS = 7 points');

// 5-letter word with TW: (4+1+1+1+1)*3 = 24 + 5 length bonus = 29
assertEqual(game.calculateWordScore([0,1,2,3,7], scoringBoard), 29, '5-letter with TW = 29');

section('Dictionary');
const dict = loadDictionary();
assert(dict.size > 80000, `Dictionary loaded: ${dict.size} words`);
assert(game.isValidWord('CAT'), 'CAT is valid');
assert(game.isValidWord('DOG'), 'DOG is valid');
assert(game.isValidWord('THE'), 'THE is valid');
assert(game.isValidWord('QUIZ'), 'QUIZ is valid');
assert(!game.isValidWord('XYZ'), 'XYZ is invalid');
assert(!game.isValidWord('ASDFGH'), 'ASDFGH is invalid');
assert(!game.isValidWord('A'), 'Single letter invalid');
assert(game.isValidWord('AA'), 'AA is valid (it is a word)');

// =============================================================================
// INTEGRATION TESTS - Game State
// =============================================================================

section('Game State - Normal Scoring');
// Set up controlled board
game.setState({ 
  board: scoringBoard, 
  totalScore: 0, 
  foundWords: [], 
  gameState: 'playing' 
});

let result = game.submitWord([0,1,2]); // CAT
assertEqual(result.result, 'valid', 'CAT accepted');
assertEqual(result.wordScore, 6, 'CAT scores 6');
assertEqual(result.totalScore, 6, 'Total now 6');

result = game.submitWord([4,5,6]); // DOG
assertEqual(result.result, 'valid', 'DOG accepted');
assertEqual(result.wordScore, 20, 'DOG scores 20');
assertEqual(result.totalScore, 26, 'Total now 26');

section('Game State - Duplicate Rejection');
result = game.submitWord([0,1,2]); // CAT again
assertEqual(result.result, 'duplicate', 'Duplicate CAT rejected');
assertEqual(game.getState().totalScore, 26, 'Score unchanged after duplicate');

section('Game State - Invalid Word Rejection');
// Need to use path that spells invalid word - XYZ not on board
// Use scoringBoard indices that spell nonsense
game.setState({ board: scoringBoard, totalScore: 50, foundWords: [], gameState: 'playing' });
result = game.submitWord([0,4,8,12]); // C-D-R-B = CDRB
assertEqual(result.result, 'invalid', 'CDRB rejected as invalid');
assertEqual(game.getState().totalScore, 50, 'Score unchanged after invalid');

section('Game State - Win at 111');
// Create board where we can score exactly 111
// Start at 105, score CAT (6) = 111
game.setState({ board: scoringBoard, totalScore: 105, foundWords: [], gameState: 'playing', boardsSolved: 0 });
result = game.submitWord([0,1,2]); // CAT = 6
assertEqual(result.result, 'solved', 'Solved at exactly 111');
assertEqual(result.boardsSolved, 1, 'Boards solved incremented to 1');
assertEqual(game.getState().totalScore, 0, 'Score reset to 0 for new board');
assertEqual(game.getState().gameState, 'playing', 'Game continues playing');

section('Game State - 110 Trap');
// Start at 104, score CAT (6) = 110 -> trap
game.setState({ board: scoringBoard, totalScore: 104, foundWords: [], gameState: 'playing', boardsSolved: 2 });
result = game.submitWord([0,1,2]); // CAT = 6 -> 110
assertEqual(result.result, 'trap', '110 triggers trap');
assertEqual(result.newTotal, 110, 'Would have been 110');
assertEqual(game.getState().totalScore, 0, 'Score reset to 0');
assertEqual(game.getState().foundWords.length, 0, 'Found words cleared');
assertEqual(game.getState().gameState, 'playing', 'Still playing after trap');
assertEqual(result.boardsSolved, 2, 'Boards solved unchanged after trap');

section('Game State - Overshoot');
// Start at 108, score CAT (6) = 114 -> overshoot
game.setState({ board: scoringBoard, totalScore: 108, foundWords: [], gameState: 'playing', boardsSolved: 1 });
result = game.submitWord([0,1,2]); // CAT = 6 -> 114
assertEqual(result.result, 'overshoot', 'Overshoot detected');
assertEqual(result.newTotal, 114, 'Would have been 114');
assertEqual(game.getState().totalScore, 0, 'Score reset to 0');
assertEqual(game.getState().foundWords.length, 0, 'Found words cleared');
assertEqual(result.boardsSolved, 1, 'Boards solved unchanged after overshoot');

section('Game State - Board Changes After Trap');
const boardBefore = JSON.stringify(game.getState().board);
game.setState({ board: scoringBoard, totalScore: 104, foundWords: [], gameState: 'playing', boardsSolved: 0 });
game.submitWord([0,1,2]); // Triggers trap
const boardAfter = JSON.stringify(game.getState().board);
assert(boardBefore !== boardAfter, 'Board changes after trap (new board generated)');

section('Game State - Bonus at 3 Boards');
game.setState({ board: scoringBoard, totalScore: 105, foundWords: [], gameState: 'playing', boardsSolved: 2 });
result = game.submitWord([0,1,2]); // CAT = 6 -> 111, boards becomes 3
assertEqual(result.result, 'solved', 'Solved at 111');
assertEqual(result.boardsSolved, 3, 'Boards solved is now 3');
assertEqual(result.gotBonus, true, 'Got bonus at 3 boards');

section('Game State - Bonus Time Mutation');
// Verify timeRemaining actually increases (not just gotBonus flag)
game.setState({ board: scoringBoard, totalScore: 105, foundWords: [], gameState: 'playing', boardsSolved: 2, timeRemaining: 30 });
const timeBefore = game.getState().timeRemaining;
result = game.submitWord([0,1,2]); // CAT = 6 -> 111, boards becomes 3, triggers bonus
const timeAfter = game.getState().timeRemaining;
assertEqual(timeBefore, 30, 'Time started at 30');
assertEqual(timeAfter, 60, 'Time increased to 60 (+30 bonus)');
assertEqual(result.gotBonus, true, 'Bonus flag also set');

section('Game State - Overshoot Keeps Same Board');
// Verify board does NOT change on overshoot (rewards memory)
// Use scoringBoard where [0,1,2] = CAT = 6 points
// Set totalScore to 108, so CAT makes 114 (overshoot)
game.setState({ board: scoringBoard, totalScore: 108, foundWords: [], gameState: 'playing', boardsSolved: 1 });
const boardBeforeOvershoot = JSON.stringify(game.getState().board);
result = game.submitWord([0,1,2]); // CAT = 6 -> 114 = overshoot
assertEqual(result.result, 'overshoot', 'Overshoot triggered');
const boardAfterOvershoot = JSON.stringify(game.getState().board);
assertEqual(boardBeforeOvershoot, boardAfterOvershoot, 'Board unchanged after overshoot');

// =============================================================================
// SUMMARY
// =============================================================================

console.log('\n' + '='.repeat(50));
if (failed === 0) {
  console.log(`✓ ALL TESTS PASSED (${passed}/${passed + failed})`);
} else {
  console.log(`✗ TESTS FAILED: ${failed} failures, ${passed} passed`);
}
console.log('='.repeat(50));

process.exit(failed > 0 ? 1 : 0);
