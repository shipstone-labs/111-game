/**
 * @fileoverview 111 - Word puzzle game where you must score exactly 111
 * @version 1.0.0
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const GRID_SIZE = 4;
const TILE_SIZE = 72;
const TILE_GAP = 12;
const BOARD_PADDING = 16;
const BOARD_WIDTH = TILE_SIZE * GRID_SIZE + TILE_GAP * (GRID_SIZE - 1) + BOARD_PADDING * 2;
const BOARD_HEIGHT = BOARD_WIDTH;
const BADGE_RADIUS = 14;
const SELECTION_RADIUS = TILE_SIZE * 0.5;

const TARGET_SCORE = 111;
const TRAP_SCORE = 110;
const GAME_DURATION = 60; // seconds

const LETTER_VALUES = {
  A:1, B:4, C:4, D:2, E:1, F:4, G:3, H:4,
  I:1, J:8, K:5, L:2, M:3, N:1, O:1, P:4,
  Q:10, R:1, S:1, T:1, U:2, V:5, W:4, X:8, Y:4, Z:10
};

const MULTIPLIER_COLORS = { DL:'#4CAF50', TL:'#2196F3', DW:'#FF9800', TW:'#F44336' };
const VOWELS = ['A', 'E', 'I', 'O', 'U'];
const GUARANTEED = ['E', 'T', 'A', 'S', 'R', 'I', 'N'];
const HIGH_VALUE = ['Q', 'X', 'Z', 'J', 'K'];

const VOWEL_WEIGHTS = { E: 40, A: 25, I: 20, O: 10, U: 5 };
const CONSONANT_WEIGHTS = {
  T:15, N:14, S:14, R:13, L:12, D:10, C:9, M:8, P:8,
  G:7, H:6, B:5, Y:5, F:4, K:3, W:3, V:2, X:1, Z:1, J:1, Q:1
};

// =============================================================================
// STATE
// =============================================================================

let board = [];
let selectedPath = [];
let isDragging = false;
let currentPos = null;
let displayWord = '';
let totalScore = 0;
let foundWords = new Set();
let gameState = 'ready'; // 'ready', 'playing', 'timeout'
let feedbackMessage = '';
let feedbackType = ''; // 'invalid', 'duplicate', 'trap', 'overshoot'

/** Timer state */
let timeRemaining = GAME_DURATION;
let timerInterval = null;

/** Boards solved counter (final score) */
let boardsSolved = 0;
const BONUS_THRESHOLD = 3;
const BONUS_TIME = 30;

/** @type {Set<string>|null} Dictionary loaded from words.txt.gz */
let dictionary = null;

// DOM elements (initialized in init())
let canvas, ctx, scoreDisplay, boardsDisplay, startBtn, targetDisplay, wordPill, wordText, timerDisplay;
let feedbackTimeout = null;

// =============================================================================
// DICTIONARY
// =============================================================================

async function loadDictionary() {
  try {
    const response = await fetch('words.txt.gz');
    const blob = await response.blob();
    const ds = new DecompressionStream('gzip');
    const decompressed = blob.stream().pipeThrough(ds);
    const text = await new Response(decompressed).text();
    dictionary = new Set(text.trim().toUpperCase().split('\n'));
    console.log(`Dictionary loaded: ${dictionary.size} words`);
    return true;
  } catch (err) {
    console.error('Failed to load dictionary:', err);
    return false;
  }
}

function isValidWord(word) {
  if (!dictionary || word.length < 2) return false;
  return dictionary.has(word.toUpperCase());
}

// =============================================================================
// BOARD GENERATION
// =============================================================================

function weightedRandom(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [letter, weight] of entries) {
    r -= weight;
    if (r <= 0) return letter;
  }
  return entries[0][0];
}

function selectLetters() {
  const letters = [...GUARANTEED];
  const vowelCount = 5 + Math.floor(Math.random() * 3); // 5-7 vowels
  
  while (letters.filter(l => VOWELS.includes(l)).length < vowelCount) {
    letters.push(weightedRandom(VOWEL_WEIGHTS));
  }
  
  while (letters.length < 16) {
    letters.push(weightedRandom(CONSONANT_WEIGHTS));
  }
  
  // Shuffle
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  
  return letters.slice(0, 16);
}

function getNeighbors(index) {
  const row = Math.floor(index / 4);
  const col = index % 4;
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr, nc = col + dc;
      if (nr >= 0 && nr < 4 && nc >= 0 && nc < 4) {
        neighbors.push(nr * 4 + nc);
      }
    }
  }
  return neighbors;
}

function hasAdjacentVowel(tiles, index) {
  return getNeighbors(index).some(n => VOWELS.includes(tiles[n].letter));
}

function generateBoard() {
  const letters = selectLetters();
  const multipliers = ['DL', 'DL', 'TL', 'TL', 'DW', 'TW'];
  const positions = Array.from({length: 16}, (_, i) => i);
  
  // Shuffle positions for multiplier placement
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  const tiles = letters.map((letter, i) => ({
    letter,
    multiplier: null,
    row: Math.floor(i / 4),
    col: i % 4
  }));
  
  // Assign multipliers to first 6 shuffled positions
  multipliers.forEach((mult, i) => {
    tiles[positions[i]].multiplier = mult;
  });
  
  // Ensure high-value letters have adjacent vowels (swap if needed)
  for (let i = 0; i < tiles.length; i++) {
    if (HIGH_VALUE.includes(tiles[i].letter) && !hasAdjacentVowel(tiles, i)) {
      const neighbors = getNeighbors(i);
      const vowelIdx = tiles.findIndex((t, idx) => 
        VOWELS.includes(t.letter) && !neighbors.includes(idx)
      );
      if (vowelIdx !== -1) {
        const swapTarget = neighbors[Math.floor(Math.random() * neighbors.length)];
        [tiles[vowelIdx].letter, tiles[swapTarget].letter] = 
          [tiles[swapTarget].letter, tiles[vowelIdx].letter];
      }
    }
  }
  
  return tiles;
}

// =============================================================================
// SCORING
// =============================================================================

function getLengthBonus(length) {
  if (length < 5) return 0;
  return Math.min((length - 4) * 5, 25); // +5 per letter over 4, max +25
}

function calculateWordScore(path, boardTiles) {
  let letterSum = 0;
  let wordMultiplier = 1;
  
  for (const idx of path) {
    const tile = boardTiles[idx];
    let letterValue = LETTER_VALUES[tile.letter] || 1;
    
    if (tile.multiplier === 'DL') letterValue *= 2;
    else if (tile.multiplier === 'TL') letterValue *= 3;
    else if (tile.multiplier === 'DW') wordMultiplier *= 2;
    else if (tile.multiplier === 'TW') wordMultiplier *= 3;
    
    letterSum += letterValue;
  }
  
  return letterSum * wordMultiplier + getLengthBonus(path.length);
}

// =============================================================================
// GEOMETRY
// =============================================================================

function getTileCenter(row, col) {
  const faceInset = 4;
  return {
    x: BOARD_PADDING + col * (TILE_SIZE + TILE_GAP) + (TILE_SIZE - faceInset) / 2,
    y: BOARD_PADDING + row * (TILE_SIZE + TILE_GAP) + (TILE_SIZE - faceInset) / 2
  };
}

function getTileAt(x, y) {
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const center = getTileCenter(row, col);
      const dist = Math.hypot(x - center.x, y - center.y);
      if (dist < SELECTION_RADIUS) {
        return { row, col, index: row * 4 + col };
      }
    }
  }
  return null;
}

function areAdjacent(t1, t2) {
  const rd = Math.abs(t1.row - t2.row);
  const cd = Math.abs(t1.col - t2.col);
  return rd <= 1 && cd <= 1 && !(rd === 0 && cd === 0);
}

// =============================================================================
// RENDERING
// =============================================================================

function lightenColor(hex, pct) {
  const num = parseInt(hex.replace('#',''), 16);
  const amt = Math.round(2.55 * pct);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0xFF) + amt);
  const B = Math.min(255, (num & 0xFF) + amt);
  return `rgb(${R},${G},${B})`;
}

function drawBlankBoard() {
  const cornerRadius = 12;
  
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const x = BOARD_PADDING + col * (TILE_SIZE + TILE_GAP);
      const y = BOARD_PADDING + row * (TILE_SIZE + TILE_GAP);
      
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.roundRect(x + 3, y + 4, TILE_SIZE, TILE_SIZE, cornerRadius);
      ctx.fill();
      
      // Empty tile
      ctx.fillStyle = '#252540';
      ctx.beginPath();
      ctx.roundRect(x, y, TILE_SIZE, TILE_SIZE, cornerRadius);
      ctx.fill();
    }
  }
}

function draw() {
  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Don't draw tiles before game starts
  if (gameState === 'ready') {
    drawBlankBoard();
    return;
  }
  
  const cornerRadius = 12;
  const faceInset = 4;
  
  // Draw tiles
  for (let i = 0; i < board.length; i++) {
    const tile = board[i];
    const x = BOARD_PADDING + tile.col * (TILE_SIZE + TILE_GAP);
    const y = BOARD_PADDING + tile.row * (TILE_SIZE + TILE_GAP);
    const isSel = selectedPath.includes(i);
    
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 4, TILE_SIZE, TILE_SIZE, cornerRadius);
    ctx.fill();
    
    // Tile base
    ctx.fillStyle = isSel ? '#d17a15' : '#2a2a4a';
    ctx.beginPath();
    ctx.roundRect(x, y, TILE_SIZE, TILE_SIZE, cornerRadius);
    ctx.fill();
    
    // Tile face gradient
    const tileGrad = ctx.createLinearGradient(x, y, x, y + TILE_SIZE - faceInset);
    if (isSel) {
      tileGrad.addColorStop(0, '#ffcc66');
      tileGrad.addColorStop(1, '#f5a623');
    } else {
      tileGrad.addColorStop(0, '#3a3a5a');
      tileGrad.addColorStop(1, '#2a2a4a');
    }
    ctx.fillStyle = tileGrad;
    ctx.beginPath();
    ctx.roundRect(x, y, TILE_SIZE - faceInset, TILE_SIZE - faceInset, cornerRadius);
    ctx.fill();
    
    // Multiplier border
    if (tile.multiplier) {
      ctx.strokeStyle = MULTIPLIER_COLORS[tile.multiplier];
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x + 1.5, y + 1.5, TILE_SIZE - faceInset - 3, TILE_SIZE - faceInset - 3, cornerRadius - 2);
      ctx.stroke();
    }
    
    // Letter shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.font = 'bold 38px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tile.letter, x + (TILE_SIZE - faceInset) / 2 + 1, y + (TILE_SIZE - faceInset) / 2 + 2);
    
    // Letter
    ctx.fillStyle = isSel ? '#5a4010' : '#fff';
    ctx.fillText(tile.letter, x + (TILE_SIZE - faceInset) / 2, y + (TILE_SIZE - faceInset) / 2);
    
    // Point value
    ctx.fillStyle = isSel ? '#7a5a20' : '#888';
    ctx.font = 'bold 13px system-ui';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
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
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(bx + BADGE_RADIUS + 1, by + BADGE_RADIUS + 1, BADGE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    
    // Badge background
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(bx + BADGE_RADIUS, by + BADGE_RADIUS, BADGE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    
    // Badge gradient
    const badgeGrad = ctx.createLinearGradient(bx, by, bx, by + BADGE_RADIUS * 2);
    badgeGrad.addColorStop(0, lightenColor(MULTIPLIER_COLORS[tile.multiplier], 15));
    badgeGrad.addColorStop(1, MULTIPLIER_COLORS[tile.multiplier]);
    ctx.fillStyle = badgeGrad;
    ctx.beginPath();
    ctx.arc(bx + BADGE_RADIUS, by + BADGE_RADIUS, BADGE_RADIUS - 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Badge text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tile.multiplier, bx + BADGE_RADIUS, by + BADGE_RADIUS);
  }
  
  // Draw selection path
  if (selectedPath.length > 1) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const first = getTileCenter(board[selectedPath[0]].row, board[selectedPath[0]].col);
    
    // Path shadow
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(first.x + 2, first.y + 2);
    for (let i = 1; i < selectedPath.length; i++) {
      const c = getTileCenter(board[selectedPath[i]].row, board[selectedPath[i]].col);
      ctx.lineTo(c.x + 2, c.y + 2);
    }
    if (isDragging && currentPos) ctx.lineTo(currentPos.x + 2, currentPos.y + 2);
    ctx.stroke();
    
    // Path line
    ctx.strokeStyle = '#e8850c';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < selectedPath.length; i++) {
      const c = getTileCenter(board[selectedPath[i]].row, board[selectedPath[i]].col);
      ctx.lineTo(c.x, c.y);
    }
    if (isDragging && currentPos) ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();
  }
}

// =============================================================================
// INPUT HANDLERS
// =============================================================================

function getCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
}

function handleStart(e) {
  if (gameState !== 'playing') return;
  e.preventDefault();
  
  const coords = getCoords(e);
  const tile = getTileAt(coords.x, coords.y);
  
  if (tile) {
    selectedPath = [tile.index];
    isDragging = true;
    currentPos = coords;
    displayWord = board[tile.index].letter;
    showSelecting(displayWord);
    draw();
  }
}

function handleMove(e) {
  if (!isDragging || gameState !== 'playing') return;
  e.preventDefault();
  
  const coords = getCoords(e);
  currentPos = coords;
  const tile = getTileAt(coords.x, coords.y);
  
  if (tile) {
    const idx = selectedPath.indexOf(tile.index);
    if (idx !== -1 && idx < selectedPath.length - 1) {
      // Backtrack
      selectedPath = selectedPath.slice(0, idx + 1);
    } else if (idx === -1) {
      // Extend path if adjacent
      const last = board[selectedPath[selectedPath.length - 1]];
      if (areAdjacent(last, tile)) {
        selectedPath.push(tile.index);
      }
    }
    displayWord = selectedPath.map(i => board[i].letter).join('');
    showSelecting(displayWord);
  }
  draw();
}

function handleEnd(e) {
  if (!isDragging || gameState !== 'playing') return;
  e.preventDefault();
  
  isDragging = false;
  currentPos = null;
  
  const word = selectedPath.map(i => board[i].letter).join('');
  
  if (word.length >= 2) {
    if (foundWords.has(word)) {
      showFeedback('Already used', 'duplicate');
    } else if (!isValidWord(word)) {
      showFeedback('Not a word', 'invalid');
    } else {
      // Valid word - calculate score
      const wordScore = calculateWordScore(selectedPath, board);
      const newTotal = totalScore + wordScore;
      
      if (newTotal === TARGET_SCORE) {
        // Solved! Increment counter and generate new board
        boardsSolved++;
        foundWords.clear();
        totalScore = 0;
        board = generateBoard();
        updateScore();
        draw(); // Immediately render new board
        
        // Check for time bonus at threshold
        if (boardsSolved === BONUS_THRESHOLD) {
          timeRemaining += BONUS_TIME;
          updateTimerDisplay();
          showFeedback(`${word} = 111! Board #${boardsSolved} +${BONUS_TIME}s bonus!`, 'bonus');
        } else {
          showFeedback(`${word} = 111! Board #${boardsSolved}`, 'solved');
        }
      } else if (newTotal === TRAP_SCORE) {
        // 110 trap - reset board, no credit
        totalScore = 0;
        foundWords.clear();
        board = generateBoard();
        updateScore();
        draw(); // Immediately render new board
        showFeedback(`${word} = 110 trap! New board.`, 'trap');
      } else if (newTotal > TARGET_SCORE) {
        // Overshoot - reset board, no credit
        totalScore = 0;
        foundWords.clear();
        board = generateBoard();
        updateScore();
        draw(); // Immediately render new board
        showFeedback(`${word} = ${newTotal} overshoot! New board.`, 'overshoot');
      } else {
        // Normal score
        totalScore = newTotal;
        foundWords.add(word);
        updateScore();
        showFeedback(`${word} +${wordScore}`, 'valid');
      }
    }
  } else {
    // Word too short, hide the selecting display
    hideWordPill();
  }
  
  selectedPath = [];
  displayWord = '';
  draw();
}

// =============================================================================
// UI UPDATES
// =============================================================================

function updateScore(state = '') {
  scoreDisplay.textContent = totalScore;
  boardsDisplay.textContent = boardsSolved;
  
  // Apply animation class to boards display for special states
  if (state === 'solved' || state === 'bonus') {
    boardsDisplay.parentElement.className = 'boards winner';
    setTimeout(() => { boardsDisplay.parentElement.className = 'boards'; }, 500);
  }
}

function showFeedback(message, type) {
  if (feedbackTimeout) {
    clearTimeout(feedbackTimeout);
    feedbackTimeout = null;
  }
  
  wordText.textContent = message;
  wordPill.className = `word-pill visible ${type}`;
  
  // Auto-hide after delay (except for win)
  if (type !== 'win') {
    feedbackTimeout = setTimeout(() => {
      wordPill.className = 'word-pill';
      feedbackTimeout = null;
    }, 1500);
  }
}

function showSelecting(word) {
  if (feedbackTimeout) return; // Don't override feedback
  wordText.textContent = word;
  wordPill.className = 'word-pill visible selecting';
}

function hideWordPill() {
  if (feedbackTimeout) return; // Don't hide during feedback
  wordPill.className = 'word-pill';
}

// =============================================================================
// TIMER
// =============================================================================

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(timeRemaining);
  
  // Update timer styling based on remaining time
  if (timeRemaining <= 10) {
    timerDisplay.className = 'timer critical';
  } else if (timeRemaining <= 20) {
    timerDisplay.className = 'timer warning';
  } else {
    timerDisplay.className = 'timer';
  }
}

function startTimer() {
  stopTimer();
  timeRemaining = GAME_DURATION;
  updateTimerDisplay();
  
  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();
    
    if (timeRemaining <= 0) {
      stopTimer();
      endGameTimeout();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function endGameTimeout() {
  gameState = 'timeout';
  showFeedback(`Time's up! Boards: ${boardsSolved}`, 'timeout');
  startBtn.textContent = 'New Game';
}

function startGame() {
  if (!dictionary) {
    console.error('Dictionary not loaded');
    return;
  }
  
  gameState = 'playing';
  totalScore = 0;
  boardsSolved = 0;
  foundWords.clear();
  board = generateBoard();
  updateScore();
  startBtn.textContent = 'Reset';
  startTimer();
  draw();
}

function resetGame() {
  totalScore = 0;
  boardsSolved = 0;
  foundWords.clear();
  board = generateBoard();
  gameState = 'playing';
  updateScore();
  startTimer();
  draw();
}

// =============================================================================
// INITIALIZATION
// =============================================================================

async function init() {
  canvas = document.getElementById('board');
  ctx = canvas.getContext('2d');
  scoreDisplay = document.getElementById('scoreValue');
  boardsDisplay = document.getElementById('boardsValue');
  startBtn = document.getElementById('startBtn');
  targetDisplay = document.getElementById('targetValue');
  wordPill = document.getElementById('wordPill');
  wordText = document.getElementById('wordText');
  timerDisplay = document.getElementById('timer');
  
  canvas.width = BOARD_WIDTH;
  canvas.height = BOARD_HEIGHT;
  canvas.style.width = BOARD_WIDTH + 'px';
  canvas.style.height = BOARD_HEIGHT + 'px';
  
  // Load dictionary
  startBtn.disabled = true;
  startBtn.textContent = 'Loading...';
  const loaded = await loadDictionary();
  
  if (loaded) {
    startBtn.disabled = false;
    startBtn.textContent = 'Play';
  } else {
    startBtn.textContent = 'Error';
  }
  
  // Event listeners
  canvas.addEventListener('mousedown', handleStart);
  canvas.addEventListener('mousemove', handleMove);
  canvas.addEventListener('mouseup', handleEnd);
  canvas.addEventListener('mouseleave', handleEnd);
  canvas.addEventListener('touchstart', handleStart, { passive: false });
  canvas.addEventListener('touchmove', handleMove, { passive: false });
  canvas.addEventListener('touchend', handleEnd, { passive: false });
  
  startBtn.addEventListener('click', () => {
    if (gameState === 'ready' || gameState === 'timeout') {
      startGame();
    } else {
      resetGame();
    }
  });
  
  // Draw blank board
  draw();
}

// Service worker registration
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// Start when DOM ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}

// Node.js exports for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Constants
    TARGET_SCORE, TRAP_SCORE, LETTER_VALUES, MULTIPLIER_COLORS,
    VOWELS, GUARANTEED, HIGH_VALUE, GRID_SIZE,
    BONUS_THRESHOLD, BONUS_TIME, GAME_DURATION,
    // Board generation
    selectLetters, generateBoard, getNeighbors, hasAdjacentVowel,
    // Geometry
    areAdjacent, getTileCenter, getTileAt,
    // Scoring
    getLengthBonus, calculateWordScore,
    // Dictionary
    isValidWord,
    // For test injection
    setDictionary: (dict) => { dictionary = dict; },
    // State access for integration tests
    getState: () => ({ board, totalScore, boardsSolved, foundWords: [...foundWords], gameState }),
    setState: (s) => { 
      if (s.board) board = s.board;
      if (s.totalScore !== undefined) totalScore = s.totalScore;
      if (s.boardsSolved !== undefined) boardsSolved = s.boardsSolved;
      if (s.foundWords) { foundWords.clear(); s.foundWords.forEach(w => foundWords.add(w)); }
      if (s.gameState) gameState = s.gameState;
    },
    // Simulate word submission (for integration tests)
    submitWord: (path) => {
      selectedPath = path;
      const word = path.map(i => board[i].letter).join('');
      
      if (foundWords.has(word)) return { result: 'duplicate', word };
      if (!isValidWord(word)) return { result: 'invalid', word };
      
      const wordScore = calculateWordScore(path, board);
      const newTotal = totalScore + wordScore;
      
      if (newTotal === TARGET_SCORE) {
        // Solved - increment boards, reset for next board
        boardsSolved++;
        totalScore = 0;
        foundWords.clear();
        board = generateBoard();
        const gotBonus = boardsSolved === BONUS_THRESHOLD;
        return { result: 'solved', word, wordScore, boardsSolved, gotBonus };
      } else if (newTotal === TRAP_SCORE) {
        // Trap - new board, no credit
        totalScore = 0;
        foundWords.clear();
        board = generateBoard();
        return { result: 'trap', word, wordScore, newTotal, boardsSolved };
      } else if (newTotal > TARGET_SCORE) {
        // Overshoot - new board, no credit
        totalScore = 0;
        foundWords.clear();
        board = generateBoard();
        return { result: 'overshoot', word, wordScore, newTotal, boardsSolved };
      } else {
        totalScore = newTotal;
        foundWords.add(word);
        return { result: 'valid', word, wordScore, totalScore };
      }
    }
  };
}
