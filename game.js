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
  Q:9, R:1, S:1, T:1, U:2, V:5, W:4, X:8, Y:4, Z:9
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
  playSound(600, 0.08, 0.25, 'sine');
}

function playTrapSound() {
  playSound(200, 0.3, 0.4, 'sawtooth');
}

function playSuccessSound() {
  playSound(600, 0.2, 0.4, 'sine');
}

function playBonusSound() {
  playSound(800, 0.3, 0.5, 'sine');
  setTimeout(() => playSound(1200, 0.2, 0.3, 'sine'), 50);
}

// =============================================================================
// BOARD TRACKING
// =============================================================================

function saveCurrentBoardResult() {
  const boardSnapshot = board.map(tile => ({
    letter: tile.letter,
    multiplier: tile.multiplier,
    row: tile.row,
    col: tile.col
  }));
  
  const boardSignature = board.map(t => t.letter).join('');
  
  const alreadyExists = boardResults.boardStates.some(savedBoard => {
    const savedSignature = savedBoard.map(t => t.letter).join('');
    return savedSignature === boardSignature;
  });
  
  if (!alreadyExists) {
    boardResults.boardStates.push(boardSnapshot);
  }
}

function saveFinalGameResults() {
  if (boardResults.playerWords && boardResults.playerWords.length > 0) {
    sessionStorage.setItem('boardResults', JSON.stringify(boardResults));
  }
}

function saveFinalBoardLayout() {
  boardResults.finalBoard = board.map(tile => ({
    letter: tile.letter,
    multiplier: tile.multiplier,
    row: tile.row,
    col: tile.col
  }));
}

function resetBoardTracking() {
  currentBoardBest = { word: '', score: 0 };
}

function trackWord(word, score) {
  if (score > currentBoardBest.score) {
    currentBoardBest = { word, score };
  }
  boardResults.playerWords.push({ word: word, score: score });
}

function findAllPaths(startIdx, currentPath, visited, allPaths) {
  if (currentPath.length >= 2) {
    allPaths.push([...currentPath]);
  }
  if (currentPath.length >= 9) return;
  const neighbors = getNeighbors(startIdx);
  for (const nextIdx of neighbors) {
    if (!visited.has(nextIdx)) {
      visited.add(nextIdx);
      currentPath.push(nextIdx);
      findAllPaths(nextIdx, currentPath, visited, allPaths);
      currentPath.pop();
      visited.delete(nextIdx);
    }
  }
}

function findBestPossibleWord(boardTiles) {
  if (!dictionary || !boardTiles || boardTiles.length === 0) {
    return { word: 'N/A', score: 0 };
  }
  let bestWord = '';
  let bestScore = 0;
  for (let startIdx = 0; startIdx < boardTiles.length; startIdx++) {
    const allPaths = [];
    findAllPaths(startIdx, [startIdx], new Set([startIdx]), allPaths);
    for (const path of allPaths) {
      const word = path.map(i => boardTiles[i].letter).join('');
      if (!isValidWord(word)) continue;
      const score = calculateWordScore(path, boardTiles);
      if (score === TRAP_SCORE) continue;
      if (score > TARGET_SCORE) continue;
      if (score > bestScore) {
        bestScore = score;
        bestWord = word;
      }
    }
  }
  return { word: bestWord || 'N/A', score: bestScore };
}

function computeAllBestWords() {
  const wordMap = new Map();
  if (boardResults.boardStates && dictionary) {
    for (const boardState of boardResults.boardStates) {
      const boardWords = findAllHelpfulWords(boardState);
      for (const w of boardWords) {
        if (!wordMap.has(w.word) || wordMap.get(w.word) < w.score) {
          wordMap.set(w.word, w.score);
        }
      }
    }
  }
  // Ensure words the player actually spelled are always included
  if (boardResults.playerWords) {
    for (const pw of boardResults.playerWords) {
      if (!wordMap.has(pw.word) || wordMap.get(pw.word) < pw.score) {
        wordMap.set(pw.word, pw.score);
      }
    }
  }
  return Array.from(wordMap.entries())
    .map(([word, score]) => ({ word, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function findAllHelpfulWords(boardTiles) {
  if (!dictionary || !boardTiles || boardTiles.length === 0) {
    return [];
  }
  const bestScores = new Map(); // word -> best score found
  for (let startIdx = 0; startIdx < boardTiles.length; startIdx++) {
    const allPaths = [];
    findAllPaths(startIdx, [startIdx], new Set([startIdx]), allPaths);
    for (const path of allPaths) {
      const word = path.map(i => boardTiles[i].letter).join('');
      if (!isValidWord(word)) continue;
      const score = calculateWordScore(path, boardTiles);
      if (score === TRAP_SCORE) continue;
      if (score > TARGET_SCORE) continue;
      // Keep the highest score found for this word across all paths
      if (!bestScores.has(word) || score > bestScores.get(word)) {
        bestScores.set(word, score);
      }
    }
  }
  return Array.from(bestScores.entries()).map(([word, score]) => ({ word, score }));
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
let gameState = 'ready';
let feedbackMessage = '';
let feedbackType = '';

let timeRemaining = GAME_DURATION;
let timerInterval = null;

let boardsSolved = 0;
const BONUS_THRESHOLD = 3;
const BONUS_TIME = 10;

let elapsedTime = 0; // total seconds played
let warningShown60 = false;
let warningShown20 = false;

let boardResults = { playerWords: [], boardStates: [], finalBoard: null };
let currentBoardBest = { word: '', score: 0 };

let dictionary = null;

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
    initTwoLetterWords();
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
  const vowelCount = 5 + Math.floor(Math.random() * 3);
  while (letters.filter(l => VOWELS.includes(l)).length < vowelCount) {
    letters.push(weightedRandom(VOWEL_WEIGHTS));
  }
  while (letters.length < 16) {
    letters.push(weightedRandom(CONSONANT_WEIGHTS));
  }
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
  multipliers.forEach((mult, i) => {
    tiles[positions[i]].multiplier = mult;
  });
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
  return Math.min((length - 4) * 5, 25);
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

function isValidPath(path) {
  const seen = new Set();
  for (const idx of path) {
    if (seen.has(idx)) return false;
    seen.add(idx);
  }
  return true;
}

function canReachTarget() {
  // Check if any valid unused word on the board can be played without busting
  // (i.e., totalScore + wordScore <= TARGET_SCORE and wordScore != TRAP_SCORE - totalScore)
  const needed = TARGET_SCORE - totalScore;
  if (needed <= 0) return false;
  
  for (let startIdx = 0; startIdx < board.length; startIdx++) {
    const allPaths = [];
    findAllPaths(startIdx, [startIdx], new Set([startIdx]), allPaths);
    for (const path of allPaths) {
      const word = path.map(i => board[i].letter).join('');
      if (foundWords.has(word)) continue;
      if (!isValidWord(word)) continue;
      const score = calculateWordScore(path, board);
      const newTotal = totalScore + score;
      // Any word that doesn't bust and doesn't hit the 110 trap means the board is still playable
      if (newTotal <= TARGET_SCORE && newTotal !== TRAP_SCORE) {
        return true;
      }
    }
  }
  return false;
}

function processWordSubmission(path) {
  if (!isValidPath(path)) return { result: 'invalid-path', path };
  const word = path.map(i => board[i].letter).join('');
  if (foundWords.has(word)) return { result: 'duplicate', word };
  if (!isValidWord(word)) return { result: 'invalid', word };
  const wordScore = calculateWordScore(path, board);
  const newTotal = totalScore + wordScore;
  if (newTotal === TARGET_SCORE) {
    foundWords.add(word);
    trackWord(word, wordScore);
    saveCurrentBoardResult();
    boardsSolved++;
    resetBoardTracking();
    totalScore = 0;
    // Every board completion gives +20 seconds
    timeRemaining += BONUS_TIME;
    return { result: 'solved', word, wordScore, boardsSolved, gotBonus: true };
  } else if (newTotal === TRAP_SCORE) {
    // Bust: don't add to foundWords, don't reset board or score
    return { result: 'trap', word, wordScore, newTotal, boardsSolved, preBustScore: totalScore };
  } else if (newTotal > TARGET_SCORE) {
    // Bust: don't add to foundWords, don't reset board or score
    return { result: 'overshoot', word, wordScore, newTotal, boardsSolved, preBustScore: totalScore };
  } else {
    foundWords.add(word);
    trackWord(word, wordScore);
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
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.roundRect(x + 3, y + 4, TILE_SIZE, TILE_SIZE, cornerRadius);
      ctx.fill();
      ctx.fillStyle = '#252540';
      ctx.beginPath();
      ctx.roundRect(x, y, TILE_SIZE, TILE_SIZE, cornerRadius);
      ctx.fill();
    }
  }
}

function draw() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (gameState === 'ready') {
    drawBlankBoard();
    return;
  }
  const cornerRadius = 12;
  const faceInset = 4;
  for (let i = 0; i < board.length; i++) {
    const tile = board[i];
    const x = BOARD_PADDING + tile.col * (TILE_SIZE + TILE_GAP);
    const y = BOARD_PADDING + tile.row * (TILE_SIZE + TILE_GAP);
    const isSel = selectedPath.includes(i);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 4, TILE_SIZE, TILE_SIZE, cornerRadius);
    ctx.fill();
    ctx.fillStyle = isSel ? '#d17a15' : '#2a2a4a';
    ctx.beginPath();
    ctx.roundRect(x, y, TILE_SIZE, TILE_SIZE, cornerRadius);
    ctx.fill();
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
    if (tile.multiplier) {
      ctx.strokeStyle = MULTIPLIER_COLORS[tile.multiplier];
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x + 1.5, y + 1.5, TILE_SIZE - faceInset - 3, TILE_SIZE - faceInset - 3, cornerRadius - 2);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.font = 'bold 38px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tile.letter, x + (TILE_SIZE - faceInset) / 2 + 1, y + (TILE_SIZE - faceInset) / 2 + 2);
    ctx.fillStyle = isSel ? '#5a4010' : '#fff';
    ctx.fillText(tile.letter, x + (TILE_SIZE - faceInset) / 2, y + (TILE_SIZE - faceInset) / 2);
    ctx.fillStyle = isSel ? '#7a5a20' : '#aaa';
    ctx.font = 'bold 20px system-ui';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(LETTER_VALUES[tile.letter], x + TILE_SIZE - faceInset - 6, y + 6);
  }
  for (let i = 0; i < board.length; i++) {
    const tile = board[i];
    if (!tile.multiplier) continue;
    const x = BOARD_PADDING + tile.col * (TILE_SIZE + TILE_GAP);
    const y = BOARD_PADDING + tile.row * (TILE_SIZE + TILE_GAP);
    const bx = x - 2, by = y - 2;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(bx + BADGE_RADIUS + 1, by + BADGE_RADIUS + 1, BADGE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(bx + BADGE_RADIUS, by + BADGE_RADIUS, BADGE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    const badgeGrad = ctx.createLinearGradient(bx, by, bx, by + BADGE_RADIUS * 2);
    badgeGrad.addColorStop(0, lightenColor(MULTIPLIER_COLORS[tile.multiplier], 15));
    badgeGrad.addColorStop(1, MULTIPLIER_COLORS[tile.multiplier]);
    ctx.fillStyle = badgeGrad;
    ctx.beginPath();
    ctx.arc(bx + BADGE_RADIUS, by + BADGE_RADIUS, BADGE_RADIUS - 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tile.multiplier, bx + BADGE_RADIUS, by + BADGE_RADIUS);
  }
  if (selectedPath.length > 1) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const first = getTileCenter(board[selectedPath[0]].row, board[selectedPath[0]].col);
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
      selectedPath = selectedPath.slice(0, idx + 1);
    } else if (idx === -1) {
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
        foundWords.clear(); // New board, reset used words
        board = generateValidBoard();
        updateScore();
        draw();
        playBonusSound();
        updateTimerDisplay();
        showFeedback(`${word} = 111! Board #${result.boardsSolved} — +10 sec!`, 'bonus');
        break;
      case 'trap':
        playTrapSound();
        showFeedback(`${word} = 110 BUST!`, 'trap');
        // After 1 second, check if board is still playable
        setTimeout(() => {
          if (!canReachTarget()) {
            // Dead board — give new board, keep score and timer
            foundWords.clear();
            board = generateValidBoard();
            showFeedback('New board — no path to 111', 'timeout');
          }
          draw();
        }, 1000);
        break;
      case 'overshoot':
        showFeedback(`${word} = ${result.newTotal} BUST!`, 'overshoot');
        // After 1 second, check if board is still playable
        setTimeout(() => {
          if (!canReachTarget()) {
            // Dead board — give new board, keep score and timer
            foundWords.clear();
            board = generateValidBoard();
            showFeedback('New board — no path to 111', 'timeout');
          }
          draw();
        }, 1000);
        break;
      case 'valid':
        updateScore();
        showFeedback(`${word} +${result.wordScore}`, 'valid');
        // Check if board is still playable after this word
        setTimeout(() => {
          if (!canReachTarget()) {
            foundWords.clear();
            board = generateValidBoard();
            showFeedback('New board — no path to 111', 'timeout');
            draw();
          }
        }, 500);
        break;
    }
  } else {
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
  if (type !== 'win') {
    feedbackTimeout = setTimeout(() => {
      wordPill.className = 'word-pill';
      feedbackTimeout = null;
    }, FEEDBACK_DURATION);
  }
}

function showSelecting(word) {
  if (feedbackTimeout) return;
  wordText.textContent = word;
  wordPill.className = 'word-pill visible selecting';
}

function hideWordPill() {
  if (feedbackTimeout) return;
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
  // If absolute time warnings have been triggered, keep those styles
  if (warningShown20) {
    timerDisplay.className = 'timer critical';
  } else if (warningShown60) {
    timerDisplay.className = 'timer warning';
  } else if (timeRemaining <= 10) {
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
  elapsedTime = 0;
  warningShown60 = false;
  warningShown20 = false;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeRemaining--;
    elapsedTime++;
    // Flash warnings based on time remaining on current board
    if (timeRemaining <= 60 && !warningShown60) {
      warningShown60 = true;
      timerDisplay.className = 'timer warning';
    }
    if (timeRemaining <= 20 && !warningShown20) {
      warningShown20 = true;
      timerDisplay.className = 'timer critical';
    }
    updateTimerDisplay();
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
  saveFinalBoardLayout();
  saveCurrentBoardResult();
  selectedPath = [];
  isDragging = false;
  currentPos = null;
  showFeedback(`Time's up! Boards: ${boardsSolved}`, 'timeout');
  startBtn.textContent = 'New Game';
  draw();
  setTimeout(() => {
    saveFinalGameResults();
    try {
      boardResults.bestWords = computeAllBestWords();
      saveFinalGameResults();
    } catch(e) {
      console.error('Solver error:', e);
    }
    if (resultsBtn) {
      resultsBtn.classList.add('visible');
      resultsBtn.style.display = 'block';
    }
  }, 50);
}

function endGameMaxTime() {
  gameState = 'timeout';
  saveFinalBoardLayout();
  saveCurrentBoardResult();
  selectedPath = [];
  isDragging = false;
  currentPos = null;
  showFeedback(`4-minute limit reached. Game over. Boards: ${boardsSolved}`, 'timeout');
  startBtn.textContent = 'New Game';
  draw();
  setTimeout(() => {
    saveFinalGameResults();
    try {
      boardResults.bestWords = computeAllBestWords();
      saveFinalGameResults();
    } catch(e) {
      console.error('Solver error:', e);
    }
    if (resultsBtn) {
      resultsBtn.classList.add('visible');
      resultsBtn.style.display = 'block';
    }
  }, 50);
}

function startGame() {
  console.log('111 game v21 — 10s bonus, no time cap, dead board detection');
  if (!audioContext) initAudio();
  gameState = 'playing';
  totalScore = 0;
  boardsSolved = 0;
  foundWords.clear();
  boardResults = { playerWords: [], boardStates: [], finalBoard: null };
  currentBoardBest = { word: '', score: 0 };
  sessionStorage.removeItem('boardResults');
  board = generateValidBoard();
  updateScore();
  startBtn.textContent = 'Reset';
  if (resultsBtn) {
    resultsBtn.classList.remove('visible');
    resultsBtn.style.display = 'none';
  }
  startTimer();
  draw();
}

function resetGame() {
  saveCurrentBoardResult(); // Save board for results analysis
  stopTimer();
  totalScore = 0;
  boardsSolved = 0;
  foundWords.clear();
  boardResults = { playerWords: [], boardStates: [], finalBoard: null };
  currentBoardBest = { word: '', score: 0 };
  sessionStorage.removeItem('boardResults');
  board = generateValidBoard();
  gameState = 'playing';
  updateScore();
  if (resultsBtn) {
    resultsBtn.classList.remove('visible');
    resultsBtn.style.display = 'none';
  }
  startBtn.textContent = 'Reset';
  startTimer();
  draw();
}

// =============================================================================
// BOARD VALIDATION
// =============================================================================

let twoLetterWords = null;
let threeLetterWords = null;

function initTwoLetterWords() {
  if (!dictionary) return;
  twoLetterWords = new Set([...dictionary].filter(w => w.length === 2));
  threeLetterWords = new Set([...dictionary].filter(w => w.length === 3));
  console.log(`Two-letter words: ${twoLetterWords.size}, Three-letter: ${threeLetterWords.size}`);
}

function validateLetterDistribution(tiles) {
  const counts = {};
  for (const tile of tiles) {
    counts[tile.letter] = (counts[tile.letter] || 0) + 1;
  }
  const uniqueCount = Object.keys(counts).length;
  const maxCount = Math.max(...Object.values(counts));
  return uniqueCount >= 9 && maxCount <= 4;
}

function validateHighValueLetter(tiles) {
  return tiles.some(t => LETTER_VALUES[t.letter] >= 4);
}

function validateNoAdjacentTriples(tiles) {
  const grid = [];
  for (let r = 0; r < 4; r++) {
    grid[r] = tiles.slice(r * 4, r * 4 + 4).map(t => t.letter);
  }
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 2; c++) {
      if (grid[r][c] === grid[r][c+1] && grid[r][c] === grid[r][c+2]) return false;
    }
  }
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 2; r++) {
      if (grid[r][c] === grid[r+1][c] && grid[r][c] === grid[r+2][c]) return false;
    }
  }
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      if (grid[r][c] === grid[r+1][c+1] && grid[r][c] === grid[r+2][c+2]) return false;
    }
  }
  for (let r = 0; r < 2; r++) {
    for (let c = 2; c < 4; c++) {
      if (grid[r][c] === grid[r+1][c-1] && grid[r][c] === grid[r+2][c-2]) return false;
    }
  }
  return true;
}

function validatePlayableLetters(tiles) {
  if (!twoLetterWords || !threeLetterWords) return true;
  for (let i = 0; i < tiles.length; i++) {
    const letter = tiles[i].letter;
    const neighbors = getNeighbors(i);
    let hasValidWord = false;
    for (const n of neighbors) {
      const pair1 = letter + tiles[n].letter;
      const pair2 = tiles[n].letter + letter;
      if (twoLetterWords.has(pair1) || twoLetterWords.has(pair2)) {
        hasValidWord = true;
        break;
      }
    }
    if (!hasValidWord) {
      for (const n1 of neighbors) {
        const n1Neighbors = getNeighbors(n1);
        for (const n2 of n1Neighbors) {
          if (n2 === i) continue;
          if (!neighbors.includes(n2)) {
            const l = letter, a = tiles[n1].letter, b = tiles[n2].letter;
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

function validateBoard(tiles) {
  return validateLetterDistribution(tiles) &&
         validateHighValueLetter(tiles) &&
         validateNoAdjacentTriples(tiles) &&
         validatePlayableLetters(tiles);
}

function generateValidBoard(maxAttempts = 50) {
  for (let i = 0; i < maxAttempts; i++) {
    const tiles = generateBoard();
    if (validateBoard(tiles)) return tiles;
  }
  console.warn('Failed to generate valid board after', maxAttempts, 'attempts');
  return generateBoard();
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
  
  startBtn.disabled = true;
  startBtn.textContent = 'Loading...';
  const loaded = await loadDictionary();
  if (loaded) {
    startBtn.disabled = false;
    startBtn.textContent = 'Play';
  } else {
    startBtn.textContent = 'Error';
  }
  
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
  
  draw();
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TARGET_SCORE, TRAP_SCORE, LETTER_VALUES, MULTIPLIER_COLORS,
    VOWELS, GUARANTEED, HIGH_VALUE, GRID_SIZE,
    BONUS_THRESHOLD, BONUS_TIME, GAME_DURATION, FEEDBACK_DURATION,
    selectLetters, generateBoard, getNeighbors, hasAdjacentVowel,
    validateLetterDistribution, validateHighValueLetter, validateNoAdjacentTriples,
    validatePlayableLetters, validateBoard, generateValidBoard, initTwoLetterWords,
    areAdjacent, getTileCenter, getTileAt,
    getLengthBonus, calculateWordScore,
    isValidWord,
    isValidPath,
    setDictionary: (dict) => { dictionary = dict; },
    getState: () => ({ board, totalScore, boardsSolved, foundWords: [...foundWords], gameState, timeRemaining }),
    setState: (s) => { 
      if (s.board) board = s.board;
      if (s.totalScore !== undefined) totalScore = s.totalScore;
      if (s.boardsSolved !== undefined) boardsSolved = s.boardsSolved;
      if (s.foundWords) { foundWords.clear(); s.foundWords.forEach(w => foundWords.add(w)); }
      if (s.gameState) gameState = s.gameState;
      if (s.timeRemaining !== undefined) timeRemaining = s.timeRemaining;
    },
    getSelectionState: () => ({ selectedPath: [...selectedPath], isDragging, currentPos }),
    setSelectionState: (path, dragging) => { selectedPath = path; isDragging = dragging; },
    clearSelection: () => { selectedPath = []; isDragging = false; currentPos = null; },
    submitWord: (path) => {
      selectedPath = path;
      return processWordSubmission(path);
    }
  };
}
