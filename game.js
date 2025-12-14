/**
 * @fileoverview Ruzzle PWA - Canvas-based word game
 * @author Cartwright Reed
 * @version 1.0.0
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/** @constant {number} Grid dimensions (4x4 board) */
const GRID_SIZE = 4;

/** @constant {number} Tile size in pixels */
const TILE_SIZE = 72;

/** @constant {number} Gap between tiles in pixels */
const TILE_GAP = 12;

/** @constant {number} Padding around board edge in pixels */
const BOARD_PADDING = 16;

/** @constant {number} Computed board width */
const BOARD_WIDTH = TILE_SIZE * GRID_SIZE + TILE_GAP * (GRID_SIZE - 1) + BOARD_PADDING * 2;

/** @constant {number} Computed board height */
const BOARD_HEIGHT = BOARD_WIDTH;

/** @constant {number} Radius of multiplier badge circles */
const BADGE_RADIUS = 14;

/** @constant {number} Hit detection radius for tile selection */
const SELECTION_RADIUS = TILE_SIZE * 0.5;

/** @constant {number} Game duration in seconds */
const GAME_DURATION = 60;

/**
 * Letter point values (Scrabble-style)
 * @constant {Object.<string, number>}
 */
const LETTER_VALUES = {
  A:1, B:4, C:4, D:2, E:1, F:4, G:3, H:4,
  I:1, J:8, K:5, L:2, M:4, N:2, O:1, P:4,
  Q:10, R:1, S:1, T:1, U:2, V:5, W:4, X:8, Y:4, Z:10
};

/**
 * Color coding for multiplier badges
 * @constant {Object.<string, string>}
 */
const MULTIPLIER_COLORS = { DL:'#4CAF50', TL:'#2196F3', DW:'#FF9800', TW:'#F44336' };

/** @constant {string[]} Vowel letters */
const VOWELS = ['A', 'E', 'I', 'O', 'U'];

/**
 * Vowel frequency weights for random selection
 * @constant {Object.<string, number>}
 */
const VOWEL_WEIGHTS = { E: 40, A: 25, I: 20, O: 10, U: 5 };

/** @constant {string[]} Letters guaranteed to appear on every board */
const GUARANTEED = ['E', 'T', 'A', 'S', 'R', 'I', 'N'];

/** @constant {string[]} High-value letters requiring vowel adjacency */
const HIGH_VALUE = ['Q', 'X', 'Z', 'J', 'K'];

/**
 * Consonant frequency weights for random selection
 * @constant {Object.<string, number>}
 */
const CONSONANT_WEIGHTS = {
  T:15, N:14, S:14, R:13, L:12, D:10, C:9, M:8, P:8,
  G:7, H:6, B:5, Y:5, F:4, K:3, W:3, V:2, X:1, Z:1, J:1, Q:1
};

// =============================================================================
// STATE
// =============================================================================

/**
 * @typedef {Object} Tile
 * @property {string} letter - Single uppercase letter
 * @property {string|null} multiplier - 'DL', 'TL', 'DW', 'TW', or null
 * @property {number} row - Row index (0-3)
 * @property {number} col - Column index (0-3)
 */

/** @type {Tile[]} Current board state (16 tiles) */
let board = [];

/** @type {number[]} Indices of currently selected tiles */
let selectedPath = [];

/** @type {boolean} Whether user is currently dragging */
let isDragging = false;

/** @type {{x: number, y: number}|null} Current pointer position */
let currentPos = null;

/** @type {string} Word currently being formed */
let displayWord = '';

/** @type {number} Score preview for current word */
let displayScore = 0;

/** @type {number} Accumulated score for current round */
let totalScore = 0;

/** @type {boolean} Whether to show invalid word feedback */
let showInvalid = false;

/** @type {number|null} Timeout ID for invalid feedback */
let invalidTimeout = null;

/** @type {string} Invalid word message ("not a word" or "already used") */
let invalidMessage = 'not a word';

/** @type {number} Seconds remaining in current round */
let timeRemaining = GAME_DURATION;

/** @type {number|null} Interval ID for timer */
let timerInterval = null;

/** @type {boolean} Whether game is active and accepting input */
let gameActive = false;

/** @type {Set<string>} Words already played this round */
let usedWords = new Set();

/** @type {boolean} Whether player has started at least one game */
let hasPlayedOnce = false;

// DOM elements (initialized in init)
/** @type {HTMLCanvasElement} */
let canvas;
/** @type {CanvasRenderingContext2D} */
let ctx;
/** @type {HTMLElement} */
let scoreValue, timerDisplay, startBtn, wordPill, wordText, wordScore, gameContainer;

// =============================================================================
// DICTIONARY (STUB)
// =============================================================================

/** @type {boolean} Toggle for stub dictionary */
let stubToggle = true;

/**
 * Check if a word is valid. Stub implementation alternates true/false.
 * @param {string} word - Word to validate
 * @returns {boolean} Whether word is valid
 */
function isValidWord(word) {
  if (word.length < 2) return false;
  stubToggle = !stubToggle;
  return stubToggle;
}

// =============================================================================
// TIMER
// =============================================================================

/**
 * Format seconds as M:SS string
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Update timer display element
 */
function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(timeRemaining);
}

/**
 * Start the game timer. Resets to GAME_DURATION and begins countdown.
 */
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timeRemaining = GAME_DURATION;
  updateTimerDisplay();
  gameActive = true;
  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      gameActive = false;
      showGameOver();
    }
  }, 1000);
}

/**
 * Stop the game timer and deactivate game
 */
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  gameActive = false;
}

// =============================================================================
// GAME OVER
// =============================================================================

/**
 * Display game over overlay with final score
 */
function showGameOver() {
  const overlay = document.getElementById('gameOverOverlay');
  const finalScore = document.getElementById('finalScore');
  if (overlay && finalScore) {
    finalScore.textContent = totalScore;
    overlay.classList.add('visible');
  }
  scoreValue.classList.add('flash');
  setTimeout(() => scoreValue.classList.remove('flash'), 500);
}

/**
 * Hide game over overlay
 */
function hideGameOver() {
  const overlay = document.getElementById('gameOverOverlay');
  if (overlay) {
    overlay.classList.remove('visible');
  }
}

// =============================================================================
// WORD PILL UI
// =============================================================================

/**
 * Update word pill display based on current state
 */
function updateWordPill() {
  if (showInvalid) {
    wordPill.className = 'word-pill invalid';
    wordText.textContent = invalidMessage;
    wordScore.textContent = '';
  } else if (displayWord.length > 0) {
    wordPill.className = 'word-pill valid';
    wordText.textContent = displayWord;
    wordScore.textContent = '+' + displayScore;
  } else {
    wordPill.className = 'word-pill';
  }
}

// =============================================================================
// BOARD GENERATION
// =============================================================================

/**
 * Select a random item from weighted distribution
 * @param {Object.<string, number>} weights - Map of items to weights
 * @returns {string} Selected item
 */
function weightedPick(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [letter, weight] of entries) {
    r -= weight;
    if (r <= 0) return letter;
  }
  return entries[0][0];
}

/**
 * Fisher-Yates shuffle array in place
 * @param {Array} arr - Array to shuffle
 * @returns {Array} Shuffled array (same reference)
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate 16 letters for the board with balanced distribution.
 * Ensures guaranteed letters, vowel balance, and optional high-value letters.
 * @returns {string[]} Array of 16 letters
 */
function selectLetters() {
  const letters = [];

  // Add guaranteed letters
  for (const letter of GUARANTEED) {
    letters.push(letter);
  }

  // Balance vowels (5-7 total)
  const targetVowels = 5 + Math.floor(Math.random() * 3);
  const currentVowels = letters.filter(l => VOWELS.includes(l)).length;
  for (let i = currentVowels; i < targetVowels && letters.length < GRID_SIZE * GRID_SIZE; i++) {
    letters.push(weightedPick(VOWEL_WEIGHTS));
  }

  // Optionally add high-value letters (50% chance)
  if (Math.random() < 0.5) {
    const count = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count && letters.length < GRID_SIZE * GRID_SIZE; i++) {
      letters.push(HIGH_VALUE[Math.floor(Math.random() * HIGH_VALUE.length)]);
    }
  }

  // Fill remaining with weighted consonants
  while (letters.length < GRID_SIZE * GRID_SIZE) {
    letters.push(weightedPick(CONSONANT_WEIGHTS));
  }

  return shuffle(letters);
}

/**
 * Get indices of all tiles adjacent to given index
 * @param {number} index - Tile index (0-15)
 * @returns {number[]} Array of adjacent tile indices
 */
function getNeighbors(index) {
  const row = Math.floor(index / GRID_SIZE), col = index % GRID_SIZE;
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr, nc = col + dc;
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
        neighbors.push(nr * GRID_SIZE + nc);
      }
    }
  }
  return neighbors;
}

/**
 * Check if tile at index has at least one adjacent vowel
 * @param {Tile[]} tiles - Board tiles
 * @param {number} index - Tile index to check
 * @returns {boolean} Whether tile has adjacent vowel
 */
function hasAdjacentVowel(tiles, index) {
  return getNeighbors(index).some(ni => VOWELS.includes(tiles[ni].letter));
}

/**
 * Ensure all high-value letters (Q, X, Z, J, K) are adjacent to vowels.
 * Swaps tiles if necessary.
 * @param {Tile[]} tiles - Board tiles (mutated in place)
 */
function ensureHighValueAdjacency(tiles) {
  for (let i = 0; i < tiles.length; i++) {
    if (!HIGH_VALUE.includes(tiles[i].letter)) continue;
    if (hasAdjacentVowel(tiles, i)) continue;

    // Find a non-high-value tile with adjacent vowel to swap with
    for (let j = 0; j < tiles.length; j++) {
      if (i === j) continue;
      if (HIGH_VALUE.includes(tiles[j].letter)) continue;
      if (!hasAdjacentVowel(tiles, j)) continue;

      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
      tiles[i].row = Math.floor(i / GRID_SIZE);
      tiles[i].col = i % GRID_SIZE;
      tiles[j].row = Math.floor(j / GRID_SIZE);
      tiles[j].col = j % GRID_SIZE;
      break;
    }
  }
}

/**
 * Check if multiplier placement meets adjacency constraints.
 * Allows max 2 adjacent pairs and max 1 cluster of 3+.
 * @param {Tile[]} tiles - Board tiles
 * @returns {boolean} Whether placement is valid
 */
function checkMultiplierAdjacency(tiles) {
  const multiplierIndices = [];
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i].multiplier) multiplierIndices.push(i);
  }

  let pairCount = 0;
  let tripleCount = 0;
  const counted = new Set();

  for (const idx of multiplierIndices) {
    const neighbors = getNeighbors(idx);
    const adjacentMultipliers = neighbors.filter(n => tiles[n].multiplier);
    
    for (const adj of adjacentMultipliers) {
      const key = Math.min(idx, adj) + '-' + Math.max(idx, adj);
      if (!counted.has(key)) {
        counted.add(key);
        pairCount++;
      }
    }

    if (adjacentMultipliers.length >= 2) {
      tripleCount++;
    }
  }

  return pairCount <= 2 && tripleCount <= 1;
}

/**
 * Add multipliers to board tiles. Prefers common letters.
 * Retries up to 50 times to meet adjacency constraints.
 * @param {Tile[]} tiles - Board tiles (mutated in place)
 */
function addMultipliers(tiles) {
  const allTypes = ['DL', 'TL', 'DW', 'TW'];

  const totalCount = Math.floor(Math.random() * 6);
  if (totalCount === 0) return;

  const counts = { DL: 0, TL: 0, DW: 0, TW: 0 };
  const toPlace = [];

  // Select multiplier types (max 2 of each)
  for (let i = 0; i < totalCount; i++) {
    const available = allTypes.filter(t => counts[t] < 2);
    const type = available[Math.floor(Math.random() * available.length)];
    toPlace.push(type);
    counts[type]++;
  }

  // Try placement up to 50 times
  for (let attempt = 0; attempt < 50; attempt++) {
    for (const tile of tiles) tile.multiplier = null;

    const usedIndices = new Set();
    for (const type of toPlace) {
      let placed = false;
      for (let placeAttempt = 0; placeAttempt < 20 && !placed; placeAttempt++) {
        const index = Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE));
        if (usedIndices.has(index)) continue;

        const letter = tiles[index].letter;
        const isGood = VOWELS.includes(letter) ||
                       ['T','N','S','R','L','D','C','M','P'].includes(letter);
        if (isGood || placeAttempt > 10) {
          tiles[index].multiplier = type;
          usedIndices.add(index);
          placed = true;
        }
      }
    }

    if (checkMultiplierAdjacency(tiles)) return;
  }
}

/**
 * Generate a complete game board with letters and multipliers
 * @returns {Tile[]} Array of 16 tiles
 */
function generateBoard() {
  const letters = selectLetters();
  const tiles = letters.map((letter, i) => ({
    letter,
    multiplier: null,
    row: Math.floor(i / GRID_SIZE),
    col: i % GRID_SIZE
  }));

  ensureHighValueAdjacency(tiles);
  addMultipliers(tiles);

  return tiles;
}

// =============================================================================
// GEOMETRY
// =============================================================================

/**
 * Get center coordinates of a tile for rendering
 * @param {number} row - Tile row (0-3)
 * @param {number} col - Tile column (0-3)
 * @returns {{x: number, y: number}} Center point
 */
function getTileCenter(row, col) {
  const faceInset = 4;
  return {
    x: BOARD_PADDING + col * (TILE_SIZE + TILE_GAP) + (TILE_SIZE - faceInset) / 2,
    y: BOARD_PADDING + row * (TILE_SIZE + TILE_GAP) + (TILE_SIZE - faceInset) / 2
  };
}

/**
 * Find tile at given canvas coordinates
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {{row: number, col: number, index: number}|null} Tile info or null
 */
function getTileAt(x, y) {
  let closest = null, closestDist = Infinity;
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const center = getTileCenter(row, col);
      const dist = Math.hypot(x - center.x, y - center.y);
      if (dist < SELECTION_RADIUS && dist < closestDist) {
        closestDist = dist;
        closest = { row, col, index: row * GRID_SIZE + col };
      }
    }
  }
  return closest;
}

/**
 * Check if two tiles are adjacent (including diagonals)
 * @param {{row: number, col: number}} t1 - First tile
 * @param {{row: number, col: number}} t2 - Second tile
 * @returns {boolean} Whether tiles are adjacent
 */
function areAdjacent(t1, t2) {
  const rd = Math.abs(t1.row - t2.row), cd = Math.abs(t1.col - t2.col);
  return rd <= 1 && cd <= 1 && !(rd === 0 && cd === 0);
}

// =============================================================================
// SCORING
// =============================================================================

/**
 * Lighten a hex color by percentage
 * @param {string} hex - Hex color (#RRGGBB)
 * @param {number} pct - Percentage to lighten (0-100)
 * @returns {string} RGB color string
 */
function lightenColor(hex, pct) {
  const num = parseInt(hex.replace('#',''), 16);
  const amt = Math.round(2.55 * pct);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0xFF) + amt);
  const B = Math.min(255, (num & 0xFF) + amt);
  return `rgb(${R},${G},${B})`;
}

/**
 * Calculate word length bonus per Ruzzle rules
 * @param {number} wordLength - Number of letters in word
 * @returns {number} Bonus points (0, 5, 10, 15, 20, or 25)
 */
function getLengthBonus(wordLength) {
  if (wordLength < 5) return 0;
  if (wordLength >= 9) return 25;
  return 5 * (wordLength - 4);
}

/**
 * Calculate score for a word path
 * @param {number[]} [path=selectedPath] - Array of tile indices
 * @param {Tile[]} [boardTiles=board] - Board to score against
 * @returns {number} Total score including multipliers and length bonus
 */
function calculateWordScore(path, boardTiles) {
  path = path || selectedPath;
  boardTiles = boardTiles || board;
  if (path.length === 0) return 0;
  
  let sum = 0, wordMult = 1;
  for (const idx of path) {
    const tile = boardTiles[idx];
    let val = LETTER_VALUES[tile.letter] || 1;
    if (tile.multiplier === 'DL') val *= 2;
    else if (tile.multiplier === 'TL') val *= 3;
    else if (tile.multiplier === 'DW') wordMult *= 2;
    else if (tile.multiplier === 'TW') wordMult *= 3;
    sum += val;
  }
  
  const baseScore = sum * wordMult;
  const lengthBonus = getLengthBonus(path.length);
  return baseScore + lengthBonus;
}

// =============================================================================
// RENDERING
// =============================================================================

/**
 * Draw the complete game board to canvas
 */
function draw() {
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#4a9eda');
  bgGrad.addColorStop(1, '#2171b5');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cornerRadius = 12;
  const faceInset = 4;

  // Draw tiles
  for (let i = 0; i < board.length; i++) {
    const tile = board[i];
    const x = BOARD_PADDING + tile.col * (TILE_SIZE + TILE_GAP);
    const y = BOARD_PADDING + tile.row * (TILE_SIZE + TILE_GAP);
    const isSel = selectedPath.includes(i);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.roundRect(x + 3, y + 4, TILE_SIZE, TILE_SIZE, cornerRadius); ctx.fill();

    // Base
    ctx.fillStyle = isSel ? '#d17a15' : '#b8c4ce';
    ctx.beginPath(); ctx.roundRect(x, y, TILE_SIZE, TILE_SIZE, cornerRadius); ctx.fill();

    // Face gradient
    const tileGrad = ctx.createLinearGradient(x, y, x, y + TILE_SIZE - faceInset);
    if (isSel) { tileGrad.addColorStop(0, '#ffcc66'); tileGrad.addColorStop(1, '#f5a623'); }
    else { tileGrad.addColorStop(0, '#ffffff'); tileGrad.addColorStop(1, '#f0f4f8'); }
    ctx.fillStyle = tileGrad;
    ctx.beginPath(); ctx.roundRect(x, y, TILE_SIZE - faceInset, TILE_SIZE - faceInset, cornerRadius); ctx.fill();

    // Multiplier border
    if (tile.multiplier) {
      ctx.strokeStyle = MULTIPLIER_COLORS[tile.multiplier];
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(x + 1.5, y + 1.5, TILE_SIZE - faceInset - 3, TILE_SIZE - faceInset - 3, cornerRadius - 2); ctx.stroke();
    }

    // Letter shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.font = 'bold 38px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(tile.letter, x + (TILE_SIZE - faceInset) / 2 + 1, y + (TILE_SIZE - faceInset) / 2 + 2);

    // Letter
    ctx.fillStyle = isSel ? '#5a4010' : '#2c3e50';
    ctx.fillText(tile.letter, x + (TILE_SIZE - faceInset) / 2, y + (TILE_SIZE - faceInset) / 2);

    // Point value
    ctx.fillStyle = isSel ? '#7a5a20' : '#5a6a7a';
    ctx.font = 'bold 13px system-ui';
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText(LETTER_VALUES[tile.letter], x + TILE_SIZE - faceInset - 6, y + 6);
  }

  // Draw multiplier badges
  for (let i = 0; i < board.length; i++) {
    const tile = board[i];
    if (!tile.multiplier) continue;
    const x = BOARD_PADDING + tile.col * (TILE_SIZE + TILE_GAP);
    const y = BOARD_PADDING + tile.row * (TILE_SIZE + TILE_GAP);
    const bx = x - 2, by = y - 2;

    // Badge shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.arc(bx + BADGE_RADIUS + 1, by + BADGE_RADIUS + 1, BADGE_RADIUS, 0, Math.PI * 2); ctx.fill();

    // Badge background
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(bx + BADGE_RADIUS, by + BADGE_RADIUS, BADGE_RADIUS, 0, Math.PI * 2); ctx.fill();

    // Badge gradient
    const badgeGrad = ctx.createLinearGradient(bx, by, bx, by + BADGE_RADIUS * 2);
    badgeGrad.addColorStop(0, lightenColor(MULTIPLIER_COLORS[tile.multiplier], 15));
    badgeGrad.addColorStop(1, MULTIPLIER_COLORS[tile.multiplier]);
    ctx.fillStyle = badgeGrad;
    ctx.beginPath(); ctx.arc(bx + BADGE_RADIUS, by + BADGE_RADIUS, BADGE_RADIUS - 3, 0, Math.PI * 2); ctx.fill();

    // Badge text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(tile.multiplier, bx + BADGE_RADIUS, by + BADGE_RADIUS);
  }

  // Draw path lines
  if (selectedPath.length > 1) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const first = getTileCenter(board[selectedPath[0]].row, board[selectedPath[0]].col);

    // Shadow line
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(first.x + 2, first.y + 2);
    for (let i = 1; i < selectedPath.length; i++) {
      const c = getTileCenter(board[selectedPath[i]].row, board[selectedPath[i]].col);
      ctx.lineTo(c.x + 2, c.y + 2);
    }
    if (isDragging && currentPos) ctx.lineTo(currentPos.x + 2, currentPos.y + 2);
    ctx.stroke();

    // Main line
    ctx.strokeStyle = '#e8850c'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(first.x, first.y);
    for (let i = 1; i < selectedPath.length; i++) {
      const c = getTileCenter(board[selectedPath[i]].row, board[selectedPath[i]].col);
      ctx.lineTo(c.x, c.y);
    }
    if (isDragging && currentPos) ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();
  }
}

// =============================================================================
// INPUT HANDLING
// =============================================================================

/**
 * Convert event to canvas coordinates
 * @param {MouseEvent|TouchEvent} e - Input event
 * @returns {{x: number, y: number}} Canvas coordinates
 */
function getCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
}

/**
 * Handle drag start (mousedown/touchstart)
 * @param {MouseEvent|TouchEvent} e - Input event
 */
function handleStart(e) {
  if (!gameActive) return;
  e.preventDefault();
  if (invalidTimeout) {
    clearTimeout(invalidTimeout);
    invalidTimeout = null;
  }
  showInvalid = false;

  const coords = getCoords(e);
  const tile = getTileAt(coords.x, coords.y);
  if (tile) {
    selectedPath = [tile.index];
    isDragging = true;
    currentPos = coords;
    displayWord = board[tile.index].letter;
    displayScore = calculateWordScore();
    updateWordPill();
    draw();
  }
}

/**
 * Handle drag move (mousemove/touchmove)
 * @param {MouseEvent|TouchEvent} e - Input event
 */
function handleMove(e) {
  if (!isDragging || !gameActive) return;
  e.preventDefault();
  const coords = getCoords(e);
  currentPos = coords;
  const tile = getTileAt(coords.x, coords.y);
  if (tile) {
    const idx = selectedPath.indexOf(tile.index);
    if (idx !== -1 && idx < selectedPath.length - 1) {
      // Backtrack: truncate path
      selectedPath = selectedPath.slice(0, idx + 1);
    } else if (idx === -1) {
      // New tile: check adjacency
      const last = board[selectedPath[selectedPath.length - 1]];
      if (areAdjacent(last, tile)) {
        selectedPath.push(tile.index);
      }
    }
    displayWord = selectedPath.map(i => board[i].letter).join('');
    displayScore = calculateWordScore();
    updateWordPill();
  }
  draw();
}

/**
 * Handle drag end (mouseup/touchend)
 * @param {MouseEvent|TouchEvent} e - Input event
 */
function handleEnd(e) {
  if (!gameActive) return;
  e.preventDefault();
  isDragging = false;
  currentPos = null;

  if (displayWord.length > 0) {
    if (usedWords.has(displayWord)) {
      // Duplicate word
      showInvalid = true;
      invalidMessage = 'already used';
      displayWord = '';
      displayScore = 0;
      updateWordPill();
      invalidTimeout = setTimeout(() => {
        showInvalid = false;
        invalidTimeout = null;
        updateWordPill();
      }, 500);
    } else if (isValidWord(displayWord)) {
      // Valid word: add score
      usedWords.add(displayWord);
      totalScore += displayScore;
      scoreValue.textContent = totalScore;
      scoreValue.classList.add('flash');
      setTimeout(() => scoreValue.classList.remove('flash'), 500);
    } else {
      // Invalid word
      showInvalid = true;
      invalidMessage = 'not a word';
      displayWord = '';
      displayScore = 0;
      updateWordPill();
      invalidTimeout = setTimeout(() => {
        showInvalid = false;
        invalidTimeout = null;
        updateWordPill();
      }, 500);
    }
  }

  selectedPath = [];
  draw();
}

// =============================================================================
// GAME CONTROL
// =============================================================================

/**
 * Start a new game. Resets all state and generates new board.
 */
function startGame() {
  if (invalidTimeout) {
    clearTimeout(invalidTimeout);
    invalidTimeout = null;
  }
  hideGameOver();
  board = generateBoard();
  selectedPath = [];
  displayWord = '';
  displayScore = 0;
  totalScore = 0;
  showInvalid = false;
  usedWords.clear();
  scoreValue.textContent = '0';
  updateWordPill();
  draw();
  startTimer();
  
  if (hasPlayedOnce) {
    startBtn.textContent = 'Play Again';
  } else {
    hasPlayedOnce = true;
    startBtn.textContent = 'Play';
  }
}

/**
 * Initialize the game. Sets up canvas, event listeners, and initial state.
 */
function init() {
  canvas = document.getElementById('board');
  ctx = canvas.getContext('2d');
  scoreValue = document.getElementById('scoreValue');
  timerDisplay = document.getElementById('timerDisplay');
  startBtn = document.getElementById('startBtn');
  wordPill = document.getElementById('wordPill');
  wordText = document.getElementById('wordText');
  wordScore = document.getElementById('wordScore');
  gameContainer = document.getElementById('gameContainer');

  canvas.width = BOARD_WIDTH;
  canvas.height = BOARD_HEIGHT;
  canvas.style.width = BOARD_WIDTH + 'px';
  canvas.style.height = BOARD_HEIGHT + 'px';
  gameContainer.style.width = BOARD_WIDTH + 'px';

  // Event listeners
  canvas.addEventListener('mousedown', handleStart);
  canvas.addEventListener('mousemove', handleMove);
  canvas.addEventListener('mouseup', handleEnd);
  canvas.addEventListener('mouseleave', handleEnd);
  canvas.addEventListener('touchstart', handleStart, { passive: false });
  canvas.addEventListener('touchmove', handleMove, { passive: false });
  canvas.addEventListener('touchend', handleEnd, { passive: false });

  startBtn.addEventListener('click', startGame);

  // Initial state
  startBtn.textContent = 'Play';
  board = generateBoard();
  draw();
  startTimer();

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
  }
}

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
