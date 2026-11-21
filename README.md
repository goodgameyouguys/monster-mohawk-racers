# 🏍️ Monster Mohawk Racers

A racing game for kids (about ages 4–7). Make your racer, pick a ride and a monster, and race to the finish line before the monster catches you.

It runs in any web browser: phone, tablet or computer. Nothing to install.

## How to play

**Controls**

| | Touch | Keyboard |
|---|---|---|
| Change lanes | ▲ / ▼ buttons, or swipe up/down | ↑ / ↓ |
| Boost (hold) | ⚡ BOOST | Shift (or → or B) |
| Wheelie | double-tap ⚡ and hold | double-tap Shift and hold |
| Jump / hop | ⤴ JUMP | Space |
| Flip (in the air) | tap ⤴ | Space |
| Barrel roll / kickflip (in the air) | double-tap ⤴ | double-tap Space |

- **Gas is automatic.** You always drive forward.
- **Boost** makes you go fast. The yellow ring shows how much is left. It refills by itself, and ⚡ bolts fill it faster.
- **Hop** over obstacles: tap JUMP a moment before you reach one. Short things (rocks, logs, cones, hay) are easy to clear. Tall things (snowmen, sandcastles, tombstones, big lollipops) need good timing, so tap a little earlier. Other racers are too tall to hop, so change lanes!
- **Jump anywhere** except inside a loop: on the ground, on decks, rainbow bridges, bumps and stairs. You land back on whatever you were riding, and a jump that comes down on a deck or bridge lands on top of it.
- **Hop into a ramp, spring or cannon** and it still launches you. **Tap JUMP right as you launch** for a SUPER JUMP: about 30% higher and farther.
- **Tricks:** tap JUMP in the air for a flip, double-tap for a barrel roll (a kickflip on the skateboard or scooter). Big ramps and cannons give room for combos. Land a trick to push the monster way back. Land in the middle of one and you'll be *wobbly* for a moment (never a fall).
- **Wheelies:** double-tap and hold BOOST. Hold it to keep the monster back and earn a ⭐ every second.

**Things on the track**
- **Small ramps** (hop), **big striped ramps** (big air), **springboards** (BOING!, extra high) and **cannons** (BOOM! sky-high, room for a triple flip)
- **Raised decks**, some with two levels: ride up the ramp and collect the stars on top
- **Rainbow bridges** to ride up and over, and **bumpy whoops** to bounce across
- **Loop-de-loops:** stretched like a roller-coaster loop, so you keep zooming forward the whole way around
- **Boost pads** (glowing arrows) for a free burst of speed
- **Mud puddles** slow you down
- **Rocks, logs, cones and other racers** make you fall

**Stars and hearts**
- You have 3 ❤️. Each fall costs one and lets the monster get closer. **3 falls and the monster gets you!** Then you try that track again.
- **⭐ Every 10 stars gives you a ❤️ back.** The little bar under your star count shows how close you are. If your hearts are full, 10 stars gives a SUPER STAR boost instead.
- **Down to your last heart?** A big floating ❤️ appears on the track ahead. Grab it to get a heart back!

**The monster** follows your lane and rides the same track: it jumps the ramps, gets launched from cannons, rides the loops, climbs the decks, hops over obstacles and gobbles up stars you missed. Cool moves (flips, loops, wheelies, boost pads, passing racers) push it back. Each ride has its own engine sound and each monster its own growl.

**Voice:** a laid-back southern race announcer (made with fal.ai) reads the quiz, cheers your tricks, warns you when the monster's close, and shares "Did ya know?" facts during the race.

**Quiz:** there's a short picture quiz before and after every race about vehicles, motors and racing. The announcer reads it out loud. Tap 🔊 to hear it again. It can't be skipped: keep trying until you pick the right answer.

### Customize
- **Hair, short styles:** mohawk, spiky, crew cut, side part, quiff, flat top, buzz cut, swoop, curly, afro, bald
- **Hair, long styles:** long, ponytail, pigtails, braids, bob, bun, space buns, locs, mullet
- **Hair colors:** 9, including rainbow
- **Face:** 5 expressions and 6 skin tones
- **Clothes:** T-shirt, stripes, hoodie, super suit or jacket, plus shirt and pants colors
- **Extras:** helmet, cap, crown, cowboy hat, bow or party hat; sunglasses, goggles, glasses or a mustache; cape, wings or a backpack
- **Rides:** dirt bike, ATV, skateboard, scooter, monster truck, go-kart, unicorn, shopping cart, rocket bed (in 10 colors)
- **Monster:** Mohawk Monster, Slime Blob, Dino, Robot or Ghost
- 🎲 makes a random racer

### Tracks
1. 🌳 Dirt Park
2. 🏖️ Sunny Beach
3. ⛄ Snowy Mountain
4. 🍭 Candy Land
5. 🎃 Spooky Forest

Each track is a little faster and busier than the one before. The obstacles are mixed up differently every time.

## Put it on GitHub Pages (free)

1. Go to <https://github.com/new> and make a **public** repository, for example `monster-mohawk-racers`.
2. On the new repo page, click **"uploading an existing file"**.
3. Drag these into the upload box: `index.html`, `style.css`, `README.md`, and the **`js`** and **`audio`** folders. (You don't need the `.claude` folder.)
4. Click **Commit changes**.
5. Go to **Settings → Pages**. Under *Build and deployment*, set **Source: Deploy from a branch**, **Branch: `main`**, folder **`/ (root)`**, and click **Save**.
6. Wait a minute or two, then refresh that page. It will show your link, like
   `https://YOUR-USERNAME.github.io/monster-mohawk-racers/`

Open that link on any phone, tablet or computer to play.
**Tip:** on an iPhone or iPad, tap **Share → Add to Home Screen** so it opens full-screen like an app.

## Play it on your own computer

Browsers block some features (like loading sounds) when you just double-click `index.html`. Run a tiny web server from this folder instead:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Change things

- **Quiz questions:** `js/quiz.js`. Each question lists 3 answers as `[emoji, word]`, with the **right answer first** (they get shuffled on screen), plus a fun fact.
- **Track length, speed, difficulty, and how often ramps, decks, loops, pads and obstacles show up:** the `LEVELS` list at the top of `js/game.js`.
- **Colors, hair styles, vehicles and monsters:** `js/art.js`. Everything is drawn with code, so there are no image files.
- **Music and sounds:** `audio/` (made with fal.ai CassetteAI). `eng_*.mp3` are the ride sounds and `mon_*.mp3` the monster growls. To swap one, replace the `.mp3` with a new file of the same name.
- **Voice:** `audio/voice/` holds the announcer clips (fal.ai MiniMax voice design + speech). `q12.mp3` reads question 13 and `f12.mp3` its answer and fun fact, so if you change a question's words, its clip won't match anymore. The game falls back to the browser's voice for any clip that's missing.
