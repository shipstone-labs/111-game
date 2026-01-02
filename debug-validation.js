// Debug why boards pass validation when they have unplayable letters

const fs = require('fs');
const zlib = require('zlib');
const game = require('./game.js');

function loadDictionary() {
  const compressed = fs.readFileSync('words.txt.gz');
  const decompressed = zlib.gunzipSync(compressed);
  const text = decompressed.toString('utf8');
  const dict = new Set(text.trim().toUpperCase().split('\n'));
  game.setDictionary(dict);  // USE setDictionary instead of setState
  game.initTwoLetterWords();
  return dict;
}

loadDictionary();

// Check if init worked
const gameState = game.getState();
console.log(`Dictionary loaded: ${gameState.dictionary ? gameState.dictionary.size + ' words' : 'NO'}\n`);

// Screen 1 with unplayable N at position 0
const screen1 = [
  {letter:'N',multiplier:null,row:0,col:0},  // UNPLAYABLE
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

console.log('Testing screen1 board validation:\n');

const result = game.validatePlayableLetters(screen1);
console.log(`validatePlayableLetters() returned: ${result}\n`);

if (result) {
  console.log('Board PASSED validation, but we know position 0 (N) is unplayable!');
  console.log('This is a BUG in validatePlayableLetters()\n');
}

// Let me manually check position 0
console.log('Manual check of position 0 (N):');
const neighbors = game.getNeighbors(0);
console.log(`  Neighbors: ${neighbors.map(n => `${n}=${screen1[n].letter}`).join(', ')}`);
console.log('  Checking 2-letter words...');

// Wait - I need to check if twoLetterWords is initialized
console.log('\nDEBUG: Checking if dictionary sets are populated...');

// Try to access the internal state to see dictionary size
const finalState = game.getState();
console.log(`Dictionary size: ${finalState.dictionary ? finalState.dictionary.size : 'NOT SET'}`);
