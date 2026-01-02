// Calculate total viewport height requirements for 111 game
// Production vs Prototype comparison

console.log('='.repeat(60));
console.log('111 GAME VIEWPORT HEIGHT REQUIREMENTS');
console.log('='.repeat(60));

// Common iPhone screen heights (safe area, excluding notch/home indicator)
const devices = {
  'iPhone SE (2020)': { width: 375, height: 667, safeHeight: 647 },
  'iPhone 12/13/14': { width: 390, height: 844, safeHeight: 800 },
  'iPhone 12/13/14 Pro': { width: 393, height: 852, safeHeight: 808 },
  'iPhone 14 Pro Max': { width: 430, height: 932, safeHeight: 888 },
  'Android (typical)': { width: 360, height: 740, safeHeight: 720 }
};

// Production layout measurements
const production = {
  bodyPadding: 20,
  containerGap: 12,
  
  // Header section
  headerHeight: 40,  // timer is tallest at 40px
  headerPadding: 8,
  
  // Board
  boardSize: 356,
  
  // Button
  buttonHeight: 48,
  buttonMargin: 12,
  
  // Word feedback
  wordFeedbackHeight: 30,
  wordFeedbackMargin: 12
};

// Prototype layout measurements  
const prototype = {
  bodyPadding: 16,
  containerGap: 10,
  
  // Header section - timer is 53px
  headerHeight: 53,
  headerPadding: 8,
  
  // Board
  boardSize: 356,
  
  // Button
  buttonHeight: 44,
  buttonMargin: 10,
  
  // Word feedback
  wordFeedbackHeight: 30,
  wordFeedbackMargin: 10
};

function calculateTotalHeight(layout, name) {
  const total = 
    layout.bodyPadding * 2 +  // top and bottom
    layout.headerHeight + layout.headerPadding * 2 +
    layout.containerGap +
    layout.buttonHeight + layout.buttonMargin * 2 +
    layout.containerGap +
    layout.wordFeedbackHeight + layout.wordFeedbackMargin * 2 +
    layout.containerGap +
    layout.boardSize;
    
  console.log(`\n${name}:`);
  console.log(`  Body padding (top + bottom): ${layout.bodyPadding * 2}px`);
  console.log(`  Header: ${layout.headerHeight + layout.headerPadding * 2}px`);
  console.log(`  New Game button: ${layout.buttonHeight + layout.buttonMargin * 2}px`);
  console.log(`  Word feedback: ${layout.wordFeedbackHeight + layout.wordFeedbackMargin * 2}px`);
  console.log(`  Board: ${layout.boardSize}px`);
  console.log(`  Container gaps: ${layout.containerGap * 3}px`);
  console.log(`  TOTAL HEIGHT NEEDED: ${total}px`);
  
  return total;
}

const prodTotal = calculateTotalHeight(production, 'PRODUCTION');
const protoTotal = calculateTotalHeight(prototype, 'PROTOTYPE');

console.log('\n' + '='.repeat(60));
console.log('DIFFERENCE');
console.log('='.repeat(60));
console.log(`Prototype needs ${protoTotal - prodTotal}px MORE vertical space`);
console.log(`That's a ${((protoTotal / prodTotal - 1) * 100).toFixed(1)}% increase`);

console.log('\n' + '='.repeat(60));
console.log('DEVICE COMPATIBILITY');
console.log('='.repeat(60));

for (const [name, specs] of Object.entries(devices)) {
  console.log(`\n${name} (${specs.width}×${specs.height}, safe: ${specs.safeHeight}px):`);
  
  const prodFits = prodTotal <= specs.safeHeight;
  const protoFits = protoTotal <= specs.safeHeight;
  const prodMargin = specs.safeHeight - prodTotal;
  const protoMargin = specs.safeHeight - protoTotal;
  
  console.log(`  Production: ${prodFits ? '✓' : '✗'} (${prodMargin >= 0 ? '+' : ''}${prodMargin}px margin)`);
  console.log(`  Prototype:  ${protoFits ? '✓' : '✗'} (${protoMargin >= 0 ? '+' : ''}${protoMargin}px margin)`);
  
  if (!protoFits && prodFits) {
    console.log(`  ⚠️  PROTOTYPE WILL NOT FIT - requires scrolling!`);
  } else if (protoFits && protoMargin < 20) {
    console.log(`  ⚠️  PROTOTYPE FITS but very tight (< 20px margin)`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('RECOMMENDATION');
console.log('='.repeat(60));

if (protoTotal > devices['iPhone SE (2020)'].safeHeight) {
  console.log('⚠️  PROBLEM: Prototype layout exceeds iPhone SE screen height');
  console.log('   Users on smaller devices will need to scroll');
  console.log('\nOPTIONS:');
  console.log('1. Keep current production sizes (safe for all devices)');
  console.log('2. Use prototype sizes but reduce body padding further');
  console.log('3. Use prototype sizes only on larger devices (responsive)');
  console.log('4. Reduce board size slightly to accommodate larger UI elements');
} else {
  console.log('✓ Prototype layout should fit on all common devices');
}
