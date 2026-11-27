# Turkey Trot — The Great Thanksgiving Escape

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/DizellaCapital/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/DizellaCapital/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

A turkey escape game for the [Make the best turkey escape game](https://make.fun/bounty/turkey-run-game-01) bounty on make.fun.

## The game

Thanksgiving is coming — and Gobbles the turkey is the main course. Run 1200m from the farmyard, through the barn and the kitchen, to the forest gate. Farmer Jed chases you the whole way: every stumble lets him gain, every corn cob and feather dash buys room. Jump the fences, hay bales and the oven; duck under the thrown carving knives; hide in a haystack when he gets close and watch him search for you.

- **Stages:** Farmyard (0–400m) → Barn (400–800m) → Kitchen (800–1200m) → Forest gate. Each stage is faster and nastier.
- **HUD:** score, distance progress with stage markers, 3 lives (hearts), feather dash meter, and a flashing FARMER CLOSE warning.
- **Endings:** reach the gate and ESCAPE, or run out of lives / let the farmer catch you and get CAUGHT. Both end screens offer an instant restart.
- **Scoring:** distance + corn (+50) + pumpkin pie (+100, restores a life) + stage bonuses (+250) + escape bonus (+1000) + life bonus.

## Controls

- **Jump:** Space, ↑, W, or click/tap
- **Duck / hide in haystack:** ↓ or S
- **Feather dash:** Shift
- **Pause:** P or Esc · **Mute:** M · **Start / restart:** Space

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no libraries, no network requests — plain canvas 2D and WebAudio synth, all in `game/`. The four screenshots are real renders of the game's own code, staged deterministically with `?shot=start|play|chase|end&seed=7` (see `shots.json`).
