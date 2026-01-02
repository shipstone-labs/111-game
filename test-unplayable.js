// Test specific unplayable letters from Chris's feedback
// Position 0 (upper-left) in all three screens:
// Screen1: N at position 0
// Screen2: W at position 12 (lower-left, row 3 col 0)
// Screen3: P at position 0

const fs = require('fs');
const zlib = require('zlib');
const game = require('./game.js');

// Load dictionary
function loadDictionary() {
  const compressed = fs.readFileSync('words.txt.gz');
  const decompressed = zlib.gunzipSync(compressed);
  const text = decompressed.toString('utf8');
  const dict = new Set(text.trim().toUpperCase().split('\n'));
  game.setDictionary(dict);  // USE setDictionary not setState
  game.initTwoLetterWords();
  return dict;
}

const dict = loadDictionary();

// Screen 1 - N at position 0 is unplayable
const screen1 = [
  {letter:'N',multiplier:null,row:0,col:0},          // <- UNPLAYABLE
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

// Screen 2 - W at position 12 (lower-left) is unplayable
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
  {letter:'W',multiplier:null,row:3,col:0},           // <- UNPLAYABLE
  {letter:'Y',multiplier:'DW',row:3,col:1},
  {letter:'T',multiplier:null,row:3,col:2},
  {letter:'A',multiplier:'TL',row:3,col:3}
];

// Screen 3 - P at position 0 is unplayable
const screen3 = [
  {letter:'P',multiplier:'TL',row:0,col:0},           // <- UNPLAYABLE
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

console.log('Analyzing Chris\'s specific unplayable letters:\n');

function analyzeUnplayableLetter(board, position, screenName) {
  const letter = board[position].letter;
  const neighbors = game.getNeighbors(position);
  
  console.log(`${screenName} - Position ${position}: ${letter}`);
  console.log('='.repeat(70));
  console.log(`  Neighbors: ${neighbors.map(n => `${n}=${board[n].letter}`).join(', ')}`);
  
  // Check 2-letter words
  console.log('\n  2-LETTER WORDS:');
  let valid2Letters = [];
  for (const n of neighbors) {
    const pair1 = letter + board[n].letter;
    const pair2 = board[n].letter + letter;
    const valid1 = dict.has(pair1);
    const valid2 = dict.has(pair2);
    console.log(`    ${letter}+${board[n].letter}: ${pair1} ${valid1 ? '✓' : '✗'}  |  ${pair2} ${valid2 ? '✓' : '✗'}`);
    if (valid1) valid2Letters.push(pair1);
    if (valid2 && pair1 !== pair2) valid2Letters.push(pair2);
  }
  
  // Check 3-letter words (only valid adjacent paths)
  console.log('\n  3-LETTER WORDS (valid adjacent paths only):');
  let valid3Letters = [];
  for (const n1 of neighbors) {
    const n1Neighbors = game.getNeighbors(n1);
    for (const n2 of n1Neighbors) {
      if (n2 === position || neighbors.includes(n2)) continue;
      
      const l = letter, a = board[n1].letter, b = board[n2].letter;
      const word1 = l + a + b;
      const word2 = b + a + l;
      const valid1 = dict.has(word1);
      const valid2 = dict.has(word2);
      
      if (valid1 || valid2) {
        console.log(`    Path ${position}→${n1}→${n2} (${l}-${a}-${b}):`);
        if (valid1) {
          console.log(`      ${word1} ✓`);
          valid3Letters.push(word1);
        }
        if (valid2) {
          console.log(`      ${word2} ✓`);
          valid3Letters.push(word2);
        }
      }
    }
  }
  
  const hasValidWords = valid2Letters.length > 0 || valid3Letters.length > 0;
  
  console.log(`\n  VALIDATION RESULT: ${hasValidWords ? '✓ PASSES (has valid words)' : '✗ FAILS (no valid words)'}`);
  console.log(`  Valid 2-letter words found: ${valid2Letters.length}`);
  console.log(`  Valid 3-letter words found: ${valid3Letters.length}`);
  console.log(`  CHRIS'S FEEDBACK: This letter is UNPLAYABLE`);
  
  if (hasValidWords && valid2Letters.length > 0) {
    console.log(`\n  ⚠️  PROBLEM: Letter passes validation with 2-letter words:`);
    console.log(`      ${valid2Letters.join(', ')}`);
    console.log(`      These might be obscure words that players don't know!`);
  }
  
  console.log('\n');
  
  return {
    letter,
    position,
    valid2Letters,
    valid3Letters,
    passesValidation: hasValidWords
  };
}

const results = {
  screen1: analyzeUnplayableLetter(screen1, 0, 'SCREEN 1'),
  screen2: analyzeUnplayableLetter(screen2, 12, 'SCREEN 2'),
  screen3: analyzeUnplayableLetter(screen3, 0, 'SCREEN 3')
};

console.log('='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));

for (const [screen, data] of Object.entries(results)) {
  console.log(`\n${screen.toUpperCase()}: ${data.letter} at position ${data.position}`);
  console.log(`  Passes current validation: ${data.passesValidation ? 'YES ✓' : 'NO ✗'}`);
  console.log(`  Chris says it's unplayable: YES`);
  
  if (data.passesValidation) {
    console.log(`  \n  ROOT CAUSE: Letter passes validation because of these words:`);
    if (data.valid2Letters.length > 0) {
      console.log(`    2-letter: ${data.valid2Letters.join(', ')}`);
      console.log(`    ⚠️  These are likely obscure 2-letter words players don't recognize`);
    }
    if (data.valid3Letters.length > 0) {
      console.log(`    3-letter: ${data.valid3Letters.join(', ')}`);
    }
  }
}

console.log('\n' + '='.repeat(70));
console.log('CONCLUSION');
console.log('='.repeat(70));
console.log('The validation allows letters that form valid but OBSCURE 2-letter words.');
console.log('Players don\'t recognize these words, making the letters effectively unplayable.');
console.log('\nSOLUTION: Filter 2-letter word list to only COMMON words (top 50-100).');
console.log('='.repeat(70));
