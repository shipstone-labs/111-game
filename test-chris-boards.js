// Test Chris's 3 screenshot boards from Jan 1, 2026
// These boards were generated with old validation and had unplayable letters

const fs = require('fs');
const zlib = require('zlib');
const game = require('./game.js');

// Load dictionary from compressed file
function loadDictionary() {
  const compressed = fs.readFileSync('words.txt.gz');
  const decompressed = zlib.gunzipSync(compressed);
  const text = decompressed.toString('utf8');
  const dict = new Set(text.trim().toUpperCase().split('\n'));
  console.log(`Dictionary loaded: ${dict.size} words\n`);
  // Initialize for game module - USE setDictionary not setState
  game.setDictionary(dict);
  game.initTwoLetterWords();
  return dict;
}

// Screen 1: Score 83/111, Timer 34s
// Row 0: N(1), L(2,DL), A(1,TW), T(1)
// Row 1: L(2,TL), S(1,DW), N(1), U(2)
// Row 2: I(1), T(1), R(1), E(1,TL)
// Row 3: N(1), C(4), I(1), V(5,DL)
const screen1 = [
  {letter:'N',multiplier:null,row:0,col:0},
  {letter:'L',multiplier:'DL',row:0,col:1},
  {letter:'A',multiplier:'TW',row:0,col:2},
  {letter:'T',multiplier:null,row:0,col:3},
  {letter:'L',multiplier:'TL',row:1,col:0},
  {letter:'S',multiplier:'DW',row:1,col:1},
  {letter:'N',multiplier:null,row:1,col:2},
  {letter:'U',multiplier:null,row:1,col:3},
  {letter:'I',multiplier:null,row:2,col:0},
  {letter:'T',multiplier:null,row:2,col:1},
  {letter:'R',multiplier:null,row:2,col:2},
  {letter:'E',multiplier:'TL',row:2,col:3},
  {letter:'N',multiplier:null,row:3,col:0},
  {letter:'C',multiplier:null,row:3,col:1},
  {letter:'I',multiplier:null,row:3,col:2},
  {letter:'V',multiplier:'DL',row:3,col:3}
];

// Screen 2: Score 0/111, Timer 54s (fresh board)
// Row 0: N(1), R(1), C(4), E(1)
// Row 1: T(1,DL), O(1), E(1), N(1,TL)
// Row 2: S(1,TW), L(2,DL), D(2), I(1)
// Row 3: W(4), Y(4,DW), T(1), A(1,TL)
const screen2 = [
  {letter:'N',multiplier:null,row:0,col:0},
  {letter:'R',multiplier:null,row:0,col:1},
  {letter:'C',multiplier:null,row:0,col:2},
  {letter:'E',multiplier:null,row:0,col:3},
  {letter:'T',multiplier:'DL',row:1,col:0},
  {letter:'O',multiplier:null,row:1,col:1},
  {letter:'E',multiplier:null,row:1,col:2},
  {letter:'N',multiplier:'TL',row:1,col:3},
  {letter:'S',multiplier:'TW',row:2,col:0},
  {letter:'L',multiplier:'DL',row:2,col:1},
  {letter:'D',multiplier:null,row:2,col:2},
  {letter:'I',multiplier:null,row:2,col:3},
  {letter:'W',multiplier:null,row:3,col:0},
  {letter:'Y',multiplier:'DW',row:3,col:1},
  {letter:'T',multiplier:null,row:3,col:2},
  {letter:'A',multiplier:'TL',row:3,col:3}
];

// Screen 3: Score 0/111, Timer 56s (fresh board)
// Row 0: P(4,TL), Y(4,DL), G(3,TW), A(1)
// Row 1: T(1), D(2), I(1), A(1)
// Row 2: R(1,TL), A(1,DW), E(1), N(1)
// Row 3: R(1,DL), E(1), T(1), S(1)
const screen3 = [
  {letter:'P',multiplier:'TL',row:0,col:0},
  {letter:'Y',multiplier:'DL',row:0,col:1},
  {letter:'G',multiplier:'TW',row:0,col:2},
  {letter:'A',multiplier:null,row:0,col:3},
  {letter:'T',multiplier:null,row:1,col:0},
  {letter:'D',multiplier:null,row:1,col:1},
  {letter:'I',multiplier:null,row:1,col:2},
  {letter:'A',multiplier:null,row:1,col:3},
  {letter:'R',multiplier:'TL',row:2,col:0},
  {letter:'A',multiplier:'DW',row:2,col:1},
  {letter:'E',multiplier:null,row:2,col:2},
  {letter:'N',multiplier:null,row:2,col:3},
  {letter:'R',multiplier:'DL',row:3,col:0},
  {letter:'E',multiplier:null,row:3,col:1},
  {letter:'T',multiplier:null,row:3,col:2},
  {letter:'S',multiplier:null,row:3,col:3}
];

function testBoard(board, name) {
  console.log(`\n${name}:`);
  console.log('='.repeat(50));
  
  const distOk = game.validateLetterDistribution(board);
  const highValOk = game.validateHighValueLetter(board);
  const triplesOk = game.validateNoAdjacentTriples(board);
  const playableOk = game.validatePlayableLetters(board);
  const overallOk = game.validateBoard(board);
  
  console.log(`  Letter Distribution (max 4, min 9 unique): ${distOk ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  High Value Letter (4+ points):             ${highValOk ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  No Adjacent Triples:                        ${triplesOk ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  Playable Letters (all tiles):               ${playableOk ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  Overall Validation:                         ${overallOk ? '✓ PASS' : '✗ FAIL'}`);
  
  return overallOk;
}

(function() {
  const dict = loadDictionary();
  console.log('Testing Chris\'s 3 screenshot boards\n');
  
  const results = {
    screen1: testBoard(screen1, 'Screen 1 (Score 83, Timer 34s)'),
    screen2: testBoard(screen2, 'Screen 0, Timer 54s - Fresh board'),
    screen3: testBoard(screen3, 'Screen 0, Timer 56s - Fresh board')
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));
  console.log(`Screen 1: ${results.screen1 ? 'WOULD BE ACCEPTED' : 'WOULD BE REJECTED'}`);
  console.log(`Screen 2: ${results.screen2 ? 'WOULD BE ACCEPTED' : 'WOULD BE REJECTED'}`);
  console.log(`Screen 3: ${results.screen3 ? 'WOULD BE ACCEPTED' : 'WOULD BE REJECTED'}`);
  
  const allRejected = !results.screen1 && !results.screen2 && !results.screen3;
  console.log('\n' + (allRejected ? '✓ ALL THREE BOARDS NOW REJECTED BY VALIDATION' : '✗ SOME BOARDS STILL PASS'));
})();
