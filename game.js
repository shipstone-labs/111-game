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
const FEEDBACK_DURATION = 1800; // ms - how long feedback message shows

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
// AUDIO CONTEXT FOR SOUND EFFECTS
// =============================================================================

let audioContext = null;

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(frequency, duration, volume = 0.3, type = 'sine') {
  if (!audioContext) initAudio();
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

function playTickSound() {
  playSound(600, 0.08, 0.25, 'sine'); // Smoother, deeper, less tinny
}

function playTrapSound() {
  playSound(200, 0.3, 0.4, 'sawtooth'); // Low, harsh beep
}

function playSuccessSound() {
  playSound(600, 0.2, 0.4, 'sine'); // Pleasant mid-tone
}

function playBonusSound() {
  // Slightly louder, higher, brighter sound
  playSound(800, 0.3, 0.5, 'sine');
  // Add a second harmonic for richness
  setTimeout(() => playSound(1200, 0.2, 0.3, 'sine'), 50);
}

// =============================================================================
// BOARD TRACKING
// =============================================================================

function saveCurrentBoardResult() {
  // Save the best word found on current board
  boardResults[currentBoardIndex] = {
    playerWord: currentBoardBest.word,
    playerScore: currentBoardBest.score,
    bestWord: 'TBD',  // Placeholder for now
    bestScore: '?'     // Placeholder for now
  };
  
  // Save to sessionStorage
  sessionStorage.setItem('boardResults', JSON.stringify(boardResults));
}

function resetBoardTracking() {
  // Reset tracking for new board
  currentBoardBest = { word: '', score: 0 };
}

function trackWord(word, score) {
  // Update if this word is better than current best for this board
  if (score > currentBoardBest.score) {
    currentBoardBest = { word, score };
  }
}

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

/** Board tracking for results page */
let boardResults = [];
let currentBoardIndex = 0;
let currentBoardBest = { word: '', score: 0 };

/** @type {Set<string>|null} Dictionary loaded from words.txt.gz */
let dictionary = null;

// DOM elements (initialized in init())
let canvas, ctx, scoreDisplay, boardsDisplay, startBtn, wordPill, wordText, timerDisplay, resultsBtn;
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
    initTwoLetterWords(); // Initialize 2-letter words for board validation
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

/**
 * Validate that a path has no duplicate tiles.
 * @param {number[]} path - Array of tile indices
 * @returns {boolean} True if path is valid (no duplicates)
 */
function isValidPath(path) {
  const seen = new Set();
  for (const idx of path) {
    if (seen.has(idx)) return false;
    seen.add(idx);
  }
  return true;
}

/**
 * Process a word submission - core game logic.
 * Shared by interactive path and test exports.
 * Mutates: totalScore, boardsSolved, foundWords, timeRemaining
 * Does NOT call UI functions.
 * @param {number[]} path - Array of tile indices
 * @returns {Object} Result object with result type and details
 */
function processWordSubmission(path) {
  // Validate path has no duplicate tiles
  if (!isValidPath(path)) return { result: 'invalid-path', path };
  
  const word = path.map(i => board[i].letter).join('');
  
  if (foundWords.has(word)) return { result: 'duplicate', word };
  if (!isValidWord(word)) return { result: 'invalid', word };
  
  // Word is valid - add to found words (persists entire game session)
  foundWords.add(word);
  
  const wordScore = calculateWordScore(path, board);
  
  // Track this word for the results page
  trackWord(word, wordScore);
  
  const newTotal = totalScore + wordScore;
  
  if (newTotal === TARGET_SCORE) {
    // Solved - increment boards, reset score (same board, words stay blocked)
    saveCurrentBoardResult();
    boardsSolved++;
    currentBoardIndex++;
    resetBoardTracking();
    totalScore = 0;
    const gotBonus = boardsSolved % BONUS_THRESHOLD === 0;
    if (gotBonus) timeRemaining += BONUS_TIME;
    return { result: 'solved', word, wordScore, boardsSolved, gotBonus };
  } else if (newTotal === TRAP_SCORE) {
    // Trap - reset score (same board, words stay blocked)
    saveCurrentBoardResult();
    currentBoardIndex++;
    resetBoardTracking();
    totalScore = 0;
    return { result: 'trap', word, wordScore, newTotal, boardsSolved };
  } else if (newTotal > TARGET_SCORE) {
    // Overshoot - reset score (same board, words stay blocked)
    saveCurrentBoardResult();
    currentBoardIndex++;
    resetBoardTracking();
    totalScore = 0;
    return { result: 'overshoot', word, wordScore, newTotal, boardsSolved };
  } else {
    // Normal valid word
    totalScore = newTotal;
    return { result: 'valid', word, wordScore, totalScore };
  }
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
    
    // Point value (20px font, was 16px)
    ctx.fillStyle = isSel ? '#7a5a20' : '#aaa';
    ctx.font = 'bold 20px system-ui';
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
  
  // Initialize audio context on first user interaction
  if (!audioContext) initAudio();
  
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
    const result = processWordSubmission(selectedPath);
    
    switch (result.result) {
      case 'duplicate':
        showFeedback('Already used', 'duplicate');
        break;
      case 'invalid':
        showFeedback('Not a word', 'invalid');
        break;
      case 'solved':
        updateScore();
        draw();
        if (result.gotBonus) {
          playBonusSound(); // Play bonus sound
          updateTimerDisplay();
          showFeedback(`${word} = 111! Extra time every third 111`, 'bonus');
        } else {
          playSuccessSound(); // Play regular success sound
          showFeedback(`${word} = 111! Board #${result.boardsSolved}`, 'solved');
        }
        break;
      case 'trap':
        playTrapSound(); // Play trap sound
        updateScore();
        draw();
        showFeedback(`${word} = 110 trap!`, 'trap');
        break;
      case 'overshoot':
        updateScore();
        draw();
        showFeedback(`${word} = ${result.newTotal} overshoot!`, 'overshoot');
        break;
      case 'valid':
        updateScore();
        showFeedback(`${word} +${result.wordScore}`, 'valid');
        break;
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
    }, FEEDBACK_DURATION);
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
  return seconds.toString();
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
    
    // Play tick sound for last 10 seconds
    if (timeRemaining <= 10 && timeRemaining > 0) {
      playTickSound();
    }
    
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
  
  // Save the final board result
  saveCurrentBoardResult();
  
  // Clear any in-progress selection
  selectedPath = [];
  isDragging = false;
  currentPos = null;
  showFeedback(`Time's up! Boards: ${boardsSolved}`, 'timeout');
  startBtn.textContent = 'New Game';
  
  // Show results button
  if (resultsBtn) {
    resultsBtn.classList.add('visible');
  }
  
  draw(); // Redraw to clear selection visuals
}

function startGame() {
  if (!dictionary) {
    console.error('Dictionary not loaded');
    return;
  }
  
  // Initialize audio on game start
  if (!audioContext) initAudio();
  
  gameState = 'playing';
  totalScore = 0;
  boardsSolved = 0;
  foundWords.clear();
  
  // Reset board tracking for new game
  boardResults = [];
  currentBoardIndex = 0;
  currentBoardBest = { word: '', score: 0 };
  sessionStorage.removeItem('boardResults');
  
  board = generateValidBoard();
  updateScore();
  startBtn.textContent = 'Reset';
  
  // Hide results button when starting new game
  if (resultsBtn) {
    resultsBtn.classList.remove('visible');
  }
  
  startTimer();
  draw();
}

function resetGame() {
  totalScore = 0;
  boardsSolved = 0;
  foundWords.clear();
  
  // Reset board tracking
  boardResults = [];
  currentBoardIndex = 0;
  currentBoardBest = { word: '', score: 0 };
  sessionStorage.removeItem('boardResults');
  
  board = generateValidBoard();
  gameState = 'playing';
  updateScore();
  
  // Hide results button when resetting game
  if (resultsBtn) {
    resultsBtn.classList.remove('visible');
  }
  
  startTimer();
  draw();
}

// =============================================================================
// BOARD VALIDATION
// =============================================================================

/** @type {Set<string>|null} Two-letter words for playability validation */
let twoLetterWords = null;
/** @type {Set<string>|null} Three-letter words for playability validation */
let threeLetterWords = null;

/**
 * Initialize the two and three-letter words sets from dictionary.
 * Called once after dictionary loads.
 */
function initTwoLetterWords() {
  if (!dictionary) return;
  twoLetterWords = new Set([...dictionary].filter(w => w.length === 2));
  threeLetterWords = new Set([...dictionary].filter(w => w.length === 3));
  console.log(`Two-letter words: ${twoLetterWords.size}, Three-letter: ${threeLetterWords.size}`);
}

/**
 * Validate letter distribution: max 4 of any letter, min 9 unique.
 * @param {Object[]} tiles - Board tiles
 * @returns {boolean} True if valid
 */
function validateLetterDistribution(tiles) {
  const counts = {};
  for (const tile of tiles) {
    counts[tile.letter] = (counts[tile.letter] || 0) + 1;
  }
  const uniqueCount = Object.keys(counts).length;
  const maxCount = Math.max(...Object.values(counts));
  return uniqueCount >= 9 && maxCount <= 4;
}

/**
 * Validate board has at least one high-value letter (4+ points).
 * @param {Object[]} tiles - Board tiles
 * @returns {boolean} True if valid
 */
function validateHighValueLetter(tiles) {
  return tiles.some(t => LETTER_VALUES[t.letter] >= 4);
}

/**
 * Validate no three identical letters in a row (horizontal, vertical, diagonal).
 * @param {Object[]} tiles - Board tiles
 * @returns {boolean} True if valid
 */
function validateNoAdjacentTriples(tiles) {
  const grid = [];
  for (let r = 0; r < 4; r++) {
    grid[r] = tiles.slice(r * 4, r * 4 + 4).map(t => t.letter);
  }
  
  // Check horizontal
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 2; c++) {
      if (grid[r][c] === grid[r][c+1] && grid[r][c] === grid[r][c+2]) return false;
    }
  }
  
  // Check vertical
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 2; r++) {
      if (grid[r][c] === grid[r+1][c] && grid[r][c] === grid[r+2][c]) return false;
    }
  }
  
  // Check diagonals (down-right)
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      if (grid[r][c] === grid[r+1][c+1] && grid[r][c] === grid[r+2][c+2]) return false;
    }
  }
  
  // Check diagonals (down-left)
  for (let r = 0; r < 2; r++) {
    for (let c = 2; c < 4; c++) {
      if (grid[r][c] === grid[r+1][c-1] && grid[r][c] === grid[r+2][c-2]) return false;
    }
  }
  
  return true;
}

/**
 * Validate every tile can form at least one 2 or 3-letter word with neighbors.
 * Uses 2-letter words first (fast), falls back to 3-letter for letters like C, V.
 * @param {Object[]} tiles - Board tiles
 * @returns {boolean} True if valid
 */
function validatePlayableLetters(tiles) {
  if (!twoLetterWords || !threeLetterWords) return true; // Skip if not loaded
  
  for (let i = 0; i < tiles.length; i++) {
    const letter = tiles[i].letter;
    const neighbors = getNeighbors(i);
    let hasValidWord = false;
    
    // Check 2-letter words first
    for (const n of neighbors) {
      const pair1 = letter + tiles[n].letter;
      const pair2 = tiles[n].letter + letter;
      if (twoLetterWords.has(pair1) || twoLetterWords.has(pair2)) {
        hasValidWord = true;
        break;
      }
    }
    
    // If no 2-letter word, check 3-letter words with ADJACENT paths
    // BUGFIX 2026-01-01: Previous code checked all permutations without verifying
    // the tiles could actually be traversed in that order
    if (!hasValidWord) {
      for (const n1 of neighbors) {
        const n1Neighbors = getNeighbors(n1);
        for (const n2 of n1Neighbors) {
          if (n2 === i) continue; // Skip self
          
          // Only check if n2 is NOT a direct neighbor of i (forms valid 3-tile path)
          if (!neighbors.includes(n2)) {
            const l = letter, a = tiles[n1].letter, b = tiles[n2].letter;
            // Check only the two valid orderings for this specific path:
            // i -> n1 -> n2  (l-a-b)
            // n2 -> n1 -> i  (b-a-l)
            if (threeLetterWords.has(l + a + b) || threeLetterWords.has(b + a + l)) {
              hasValidWord = true;
              break;
            }
          }
        }
        if (hasValidWord) break;
      }
    }
    
    if (!hasValidWord) return false;
  }
  return true;
}

/**
 * Run all board validations.
 * @param {Object[]} tiles - Board tiles
 * @returns {boolean} True if all validations pass
 */
function validateBoard(tiles) {
  return validateLetterDistribution(tiles) &&
         validateHighValueLetter(tiles) &&
         validateNoAdjacentTriples(tiles) &&
         validatePlayableLetters(tiles);
}

/**
 * Generate a board that passes all validations.
 * @param {number} maxAttempts - Maximum generation attempts
 * @returns {Object[]} Valid board tiles
 */
function generateValidBoard(maxAttempts = 50) {
  for (let i = 0; i < maxAttempts; i++) {
    const tiles = generateBoard();
    if (validateBoard(tiles)) return tiles;
  }
  console.warn('Failed to generate valid board after', maxAttempts, 'attempts');
  return generateBoard(); // Fallback
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
  wordPill = document.getElementById('wordPill');
  wordText = document.getElementById('wordText');
  timerDisplay = document.getElementById('timer');
  resultsBtn = document.getElementById('resultsBtn');
  
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
    BONUS_THRESHOLD, BONUS_TIME, GAME_DURATION, FEEDBACK_DURATION,
    // Board generation
    selectLetters, generateBoard, getNeighbors, hasAdjacentVowel,
    // Board validation
    validateLetterDistribution, validateHighValueLetter, validateNoAdjacentTriples,
    validatePlayableLetters, validateBoard, generateValidBoard, initTwoLetterWords,
    // Geometry
    areAdjacent, getTileCenter, getTileAt,
    // Scoring
    getLengthBonus, calculateWordScore,
    // Dictionary
    isValidWord,
    // Path validation
    isValidPath,
    // For test injection
    setDictionary: (dict) => { dictionary = dict; },
    // State access for integration tests
    getState: () => ({ board, totalScore, boardsSolved, foundWords: [...foundWords], gameState, timeRemaining }),
    setState: (s) => { 
      if (s.board) board = s.board;
      if (s.totalScore !== undefined) totalScore = s.totalScore;
      if (s.boardsSolved !== undefined) boardsSolved = s.boardsSolved;
      if (s.foundWords) { foundWords.clear(); s.foundWords.forEach(w => foundWords.add(w)); }
      if (s.gameState) gameState = s.gameState;
      if (s.timeRemaining !== undefined) timeRemaining = s.timeRemaining;
    },
    // Selection state for testing Bug #3 fix
    getSelectionState: () => ({ selectedPath: [...selectedPath], isDragging, currentPos }),
    setSelectionState: (path, dragging) => { selectedPath = path; isDragging = dragging; },
    clearSelection: () => { selectedPath = []; isDragging = false; currentPos = null; },
    // Simulate word submission (for integration tests)
    submitWord: (path) => {
      selectedPath = path;
      return processWordSubmission(path);
    }
  };
}
