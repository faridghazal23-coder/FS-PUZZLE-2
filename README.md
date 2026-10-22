# FS Puzzle — Match. Burst. Shine.

A neon match-3 gem puzzle for iOS and Android, built with **React Native + Expo**. No backend: progress, settings and scores are stored on the device.

## Features

- Match-3 on a 7 × 8 board. Swipe a gem, or tap one gem and then a neighbour.
- 40 generated levels with rising difficulty, plus a **Daily Challenge** (same board for everyone, per date).
- Score, move counter, optional elapsed-time display, 1–3 star rating per level.
- Hint (3 per level), Undo (last move), Restart, Pause.
- Saved progress: stars, best scores, unlocked levels, daily results, play streak.
- Sound effects, haptics and **looping concentration music** (two tracks), each with its own switch.
- Dark and light themes. Every tap target is at least 44 px.
- The app pauses itself when it goes to the background.

## Run it

Requirements: Node 20.19 or newer, and the **Expo Go** app on your phone (or an Android emulator / iOS simulator).

```bash
npm install
npx expo install --fix     # aligns package versions with the Expo SDK you have
npm start                  # scan the QR code with Expo Go
```

If Expo Go reports an incompatible SDK, upgrade the project: `npx expo install expo@latest` and then `npx expo install --fix`.

### Tests

```bash
npm test                   # 40 unit tests, run with Node's built-in test runner
npm run measure            # prints a bot-vs-target difficulty table for every level
npm run generate-audio     # re-creates the WAV files in assets/audio
```

## Architecture

```
src/engine/    PURE game logic (no React). Fully unit-tested.
  constants.js   board size, scoring constants, statuses
  rng.js         seeded random numbers (same seed => same board)
  board.js       match detection, swapping, gravity, cascades, reshuffle
  game.js        state machine: createGame, tryMove, takeHint, undoMove, restartGame
  levels.js      algorithmic level + daily-challenge generator and TUNING knobs
src/state/     progress.js and settings.js are pure; storage.js wraps AsyncStorage; AppContext.js is the React glue
src/services/  audio.js (expo-audio), haptics.js (expo-haptics)
src/components/ Board (gestures + animations), Gem (SVG), buttons, result sheet, ...
src/screens/   Home, Levels, Daily, Settings, HowToPlay, Game
tests/         board, game, levels, progress tests
scripts/       generate-audio.js, measure-difficulty.js
```

The UI never changes game state directly. `GameScreen` calls `tryMove(game, a, b)`, which returns the new state plus a list of animation *steps* (cleared gems, falling gems, new gems, points). `Board` plays those steps.

### Guarantees

- **Playable start:** a new board has no existing matches and at least one valid move.
- **Never stuck:** if a move leaves no valid move, the gems are reshuffled (`reshuffle` in `board.js`).
- **Solvable levels:** targets are a fraction of what a greedy bot scores. A test plays all 40 levels with that bot and requires it to win each one.
- **Invalid moves:** swaps that are not adjacent, out of bounds or make no match are rejected, cost no move, and the gems bounce back.
- **Deterministic:** the same level or date always gives the same starting board, and the RNG state is stored in the game so Undo and Restart are exact.

## Adding levels

Levels are generated, not written by hand.

1. Open `src/engine/constants.js` and raise `LEVEL_COUNT` (for example to 60).
2. Run `npm test`. The solvability test plays every level with the bot.
3. Run `npm run measure` to see the difficulty curve.

The Levels screen builds its grid from `LEVEL_COUNT`, so nothing else needs editing.

## Tweaking difficulty

All knobs are in the `TUNING` object in `src/engine/levels.js`:

| Knob | Effect |
| --- | --- |
| `typeCount` | Gem colours (4–6). Fewer colours means more accidental cascades and higher scores. |
| `startMoves`, `levelsPerMove`, `minMoves` | Moves per level start at `startMoves`, drop by 1 every `levelsPerMove` levels, never below `minMoves`. |
| `easiestFactor`, `hardestFactor` | Target as a fraction of the bot's expected score, rising from level 1 to the last level. Higher is harder. |
| `botPointsPerMove` | Average bot score per move. Re-measure with `npm run measure` after changing `typeCount`. |
| `starMultipliers` | 2-star and 3-star thresholds as multiples of the target. |

Other constants: `HINTS_PER_LEVEL`, `BOARD_ROWS`, `BOARD_COLS` and `POINTS_PER_TILE` in `constants.js`.

Keep `hardestFactor` low enough that `bot/target` in the measure table stays above 1.0 for every level. The solvability test fails if it does not.

## Scoring and rules

- A run of N gems scores `50 × N × (N − 2)`, multiplied by the chain number (1, 2, 3, ... for cascades).
- Reach the 1-star score before the moves run out to win. Reaching the 3-star score ends the level at once.
- Running out of moves below the 1-star score loses.

## Music

Two ambient loops (Calm Flow, Deep Focus) are synthesised by `scripts/generate-audio.js`, so there are no licence issues. Both loop seamlessly. To use your own music, replace `assets/audio/music-calm.wav` or `music-deep.wav` with a looping track; no code changes are needed. Music stays quiet (30% volume) so it does not cover the sound effects.

## Ideas for future updates

1. **Power-ups and special gems:** 4-match line blasters, 5-match colour bombs, and a shop to spend earned stars on hammers or shuffles.
2. **Online leaderboards:** daily-challenge rankings and friend scores (Game Center / Google Play Games, or a small backend).
3. **Rewarded ads and monetisation:** watch an ad for an extra hint or +3 moves, with an optional "remove ads" purchase.
4. **Worlds and obstacles:** ice, locked or stone gems, and goals like "collect 20 rubies", with a new gem theme for each world.
5. **Cloud save and notifications:** sync progress across devices, and a daily-challenge reminder that protects the streak.
