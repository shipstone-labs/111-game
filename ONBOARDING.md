# 111 Game Development with Claude

Welcome! This guide helps you contribute to the 111 word game using Claude AI as your coding partner. No programming experience required.

## How It Works

1. **You describe what you want** in plain English
2. **Claude writes the code** and creates a test branch
3. **You review the results** in your browser
4. **Cart merges approved changes** to production

You can't break production — all your changes go to separate test branches first.

## Setup (One-Time)

### 1. Accept GitHub Invitation

Cart will send you an invite to collaborate on the `shipstone/ruzzle-pwa` repository. Accept it via email or at https://github.com/shipstone/ruzzle-pwa.

### 2. Connect Claude to GitHub

1. Go to https://claude.ai
2. Click **Settings** (gear icon) → **Connected Apps**
3. Click **Connect** next to GitHub
4. Authorize Claude to access your GitHub account
5. When prompted, grant access to `shipstone/ruzzle-pwa`

### 3. Start a Conversation

Begin a new chat with Claude and say:

> "I want to work on the 111 word game. The repo is github.com/shipstone/ruzzle-pwa. Please read the DESIGN.md file to understand the game."

Claude will load the project context and be ready to help.

## Making Changes

### Describe What You Want

Be specific about the change. Examples:

- ❌ "Make the game better" (too vague)
- ✅ "Make the timer text 20% larger"
- ✅ "Change the trap score from 110 to 100"
- ✅ "Add a sound effect when solving a board"

### Claude Creates a Branch

Claude will:
1. Create a new branch (e.g., `feature/larger-timer`)
2. Make the code changes
3. Run the tests to verify nothing broke
4. Give you a preview link

### Test Your Changes

Claude will provide a branch name. Ask:

> "Deploy this branch so I can test it"

Or Cart can deploy it to a test URL for you.

### Request Merge

When you're happy with the changes, tell Cart:

> "The changes on branch `feature/larger-timer` look good. Please merge to production."

Cart will review and merge to `main`, which auto-deploys to the live site.

## Example Conversation

**You:** I want to make the New Game button green instead of blue.

**Claude:** I'll create a branch and update the button color. Let me read the current styles first.

*[Claude reads styles.css]*

**Claude:** I've created branch `feature/green-button` with the change. The button background is now `#4CAF50` (green) instead of `#4a9eda` (blue). All 128 tests still pass. Would you like me to deploy this for testing?

**You:** Yes, deploy it.

**Claude:** Deployed to https://feature-green-button.111-bdb.pages.dev — try it out and let me know if that's the green you wanted.

**You:** Perfect! Please ask Cart to merge it.

## Tips

### Be Specific About Sizes
- "Make the score 50% larger" ✓
- "Make the score bigger" (how much bigger?)

### Reference the Design Doc
- "According to DESIGN.md, the trap score is 110. Can we make it configurable?"

### Ask Claude to Explain
- "Why does the board reset when I hit 110?"
- "What's the length bonus for a 6-letter word?"

### Test Before Merging
- Always play a few games on the test branch
- Check on both phone and desktop if possible

## What You Can Change

Almost anything! Common requests:

- **Visual:** Colors, sizes, fonts, animations
- **Gameplay:** Scoring rules, timer duration, bonus thresholds
- **Board generation:** Letter distribution, difficulty tuning
- **New features:** Sound effects, achievements, statistics

## What Requires Cart's Help

- Deploying to production (merging to `main`)
- Changes to the dictionary
- Infrastructure (hosting, domains)
- Anything Claude says needs human review

## Troubleshooting

### "Claude doesn't see the repo"
Make sure you connected GitHub in Claude settings and granted access to `shipstone/ruzzle-pwa`.

### "Tests are failing"
Ask Claude: "What test failed and why?" — Claude can usually fix it.

### "The change didn't work"
Clear your browser cache or try incognito mode. Ask Claude to verify the deployment.

### "I made a mistake"
No problem! Branches can be deleted. Nothing reaches production until Cart approves.

## Contact

Questions? Text or email Cart. Or just ask Claude — it knows the codebase.
