# Keyboard Learning

A kid-friendly browser game to learn **typing** and **mouse** skills. Built with Vite + vanilla JavaScript. Works on **Linux Mint Cinnamon**, Windows, and macOS.

## Activities

### Typing
- **Letter Pop** — Press the letter shown on screen
- **Balloon Letters** — Press the letter on each balloon as it drifts left to right
- **Word Garden** — Type words and short phrases
- **Key Explorer** — Find highlighted keys on the keyboard
- **Number Train** — Type numbers on the number row
- **Sentence Complete** — Read a sentence, pick the missing word with the mouse, then type it
- **Key Ninja** — Press keys to slice flying fruit before it falls (ages 7–12, Fruit Ninja style)

### Mouse
- **Balloon Pop** — Click floating balloons before they escape
- **Drag & Match** — Drag colored shapes to matching buckets
- **Click the Critter** — Click (or double-click) moving critters
- **Color Click** — Click the circle that matches the color name
- **Hide n Seek** — Find the lion hiding in a green field before it reaches the sheep
- **Maze Mouse** — Guide the cursor through a maze without touching the walls

On first play, kids pick their **age group** (4–6, 7–9, or 10–12). All games automatically adjust to the right level. Progress (star ratings) is saved per age group in your browser.

## Grown-Up Settings

Tap **Grown-Up Settings** on the home or hub screen and solve a **math problem** to unlock it. Adults can:

- **Turn games on/off** — hide games your child isn't ready for
- **Override difficulty** — force Easy / Medium / Hard instead of age-based
- **Round length** — Short, Normal, or Long sessions
- **Timed games** — Auto, always on, or always off
- **On-screen keyboard** — show, hide, or auto
- **Sound** — mute effects

Settings are saved in the browser on that machine.

## Adding a New Game

1. Create a class in `src/activities/typing/` or `src/activities/mouse/` extending `Activity.js`
2. Register it in `src/config/activityRegistry.js` — add to `ACTIVITIES` and `ACTIVITY_CONFIG`
3. Rebuild — the game appears in the hub automatically (enabled by default)

See the comment block at the top of `activityRegistry.js` for the full checklist.

---

## Windows — double-click app (.exe)

On Windows, build a portable app kids can launch with one click:

```bash
npm install
npm run package:win
```

Creates:

**`release/Keyboard-Learning-1.0.0-portable.exe`**

Copy that file anywhere (Desktop, USB drive) and double-click to play. No browser or Node.js needed.

Windows may show a SmartScreen warning because the app is not store-signed — click **More info**, then **Run anyway**.

For a traditional installer instead:

```bash
npm run package:win:installer
```

Press **F11** inside the app for fullscreen.

### Automatic updates

The Windows app checks GitHub for a newer release each time it starts (after a short delay so the game loads first). If an update exists, it offers to download the new `.exe` to the **Downloads** folder.

**One-time setup** — in `package.json`, set your real GitHub repo (replace the placeholders):

```json
"repository": {
  "type": "git",
  "url": "https://github.com/your-user/Keyboard-Learning.git"
},
"build": {
  "publish": [
    {
      "provider": "github",
      "owner": "your-user",
      "repo": "Keyboard-Learning"
    }
  ]
}
```

Then rebuild with `npm run package:win`.

**Publishing an update:**

1. Bump `"version"` in `package.json` (e.g. `1.0.1`).
2. Run `npm run package:win`.
3. Create a [GitHub Release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) tagged `v1.0.1` (or matching your version).
4. Attach **`release/Keyboard-Learning-1.0.1-portable.exe`** to that release.

Kids already running the old portable app will be prompted on next launch. They close the old app and double-click the new file from Downloads.

---

## Transfer to Linux laptop (recommended)

On your **Windows dev PC**, create a portable game package:

```bash
npm install
npm run package:linux
```

This builds the game and creates:

- `release/keyboard-learning-linux/` — folder to copy to the laptop
- `release/keyboard-learning-linux.zip` — same contents, easy for USB transfer

### On the Linux Mint laptop

1. Copy the folder or unzip the zip to e.g. `/home/USERNAME/Games/keyboard-learning-linux`
2. In a terminal:

```bash
cd ~/Games/keyboard-learning-linux
chmod +x start.sh install-desktop.sh
./start.sh
```

3. Firefox opens at **http://127.0.0.1:5183** — bookmark it.

**No Node.js needed on the laptop** — only Python 3 (already on Mint).

Optional app menu shortcut:

```bash
./install-desktop.sh
```

See `README.txt` inside the release folder for full instructions.

---

## Linux Mint (full project + Node.js)

If you develop directly on the laptop with the full repo:

```bash
npm install
npm run build
npm run preview
```

Open **Firefox** → **http://127.0.0.1:5183**

### Tips for parents

- Press **F11** in the browser for fullscreen
- Use a dedicated Firefox profile to keep kid progress separate
- Use **Change Age Group** on the home or hub screen when a child grows into the next tier
- Fonts work offline using system fallbacks (Ubuntu, Cantarell on Mint)

---

## Development (Windows or Linux)

```bash
npm install
npm run dev
```

Or on Linux:

```bash
bash scripts/dev.sh
```

Opens at **http://127.0.0.1:5183**

## Build

```bash
npm run build    # output in dist/
npm run preview  # serve production build locally
```

## Browsers

Tested targets:
- **Firefox** (primary — especially on Linux Mint)
- **Chromium / Chrome**
