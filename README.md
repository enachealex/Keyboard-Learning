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

## Web app — [keybuddy.thejumpvault.com](https://keybuddy.thejumpvault.com/)

The game deploys automatically to GitHub Pages when you push to `main`.

### One-time GitHub setup

1. Repo **Settings → Pages → Build and deployment**
   - Source: **GitHub Actions**
2. Repo **Settings → Pages → Custom domain**
   - Enter: `keybuddy.thejumpvault.com`
   - Enable **Enforce HTTPS** (after DNS verifies)
3. **Cloudflare DNS** (if not already):
   - Type: `CNAME`
   - Name: `keybuddy`
   - Target: `enachealex.github.io`
   - Proxy: Proxied (orange cloud) is OK

### Deploy updates

```bash
git push origin main
```

The workflow `.github/workflows/deploy-web.yml` builds `dist/` and publishes it. No Cloudflare Tunnel needed.

`public/CNAME` tells GitHub Pages which custom domain to use.

---

## Windows — double-click app (.exe)

On Windows, build a portable app kids can launch with one click.

**Release workflow** (bump version every new `.exe`; build only when you approve):

```bash
npm install
npm run bump:version              # 1.0.0 → 1.0.1 (patch; use -- minor or -- major)
npm run package:win -- --approve  # only after you approve the release
```

Creates **`release/Keyboard-Learning-<version>-portable.exe`** (version comes from `package.json`).

`npm run package:win` without `--approve` is blocked on purpose.

Copy the `.exe` anywhere (Desktop, USB drive) and double-click to play. No browser or Node.js needed.

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

Then rebuild with `npm run package:win -- --approve` when ready.

**Publishing an update:**

1. `npm run bump:version` (or bump manually in `package.json`).
2. `npm run package:win -- --approve` (only after you approve).
3. Create a [GitHub Release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) tagged `v1.0.1` (matching your version).
4. Attach **`release/Keyboard-Learning-1.0.1-portable.exe`** to that release.

Kids already running the old portable app will be prompted on next launch. They close the old app and double-click the new file from Downloads.

---

## Transfer to Linux laptop

### Option 1 — App menu shortcut (zip package, no daily terminal)

On your **Windows dev PC**:

```bash
npm install
npm run package:linux
```

Creates `release/key-buddy-linux/` and `.zip`.

**One-time setup on Linux Mint** (grown-up only):

```bash
cd ~/Games/key-buddy-linux
chmod +x KeyBuddy.sh install-desktop.sh
./install-desktop.sh
```

After that, kids launch **Key Buddy** from the app menu like any other program — no terminal, no starting servers, no bookmarks.

### Option 2 — Native AppImage (best, like Windows `.exe`)

Build on Linux or WSL:

```bash
npm run bump:version
npm run package:linux:app -- --approve
```

Creates `release/Key-Buddy-<version>.AppImage`. Copy to the laptop, `chmod +x`, double-click.

No Python, no browser, no services — fully self-contained Electron app.

### What changed from the old zip?

The old `start.sh` flow required running a server in a terminal each time. The new `KeyBuddy.sh` launcher runs the server in the background automatically and opens the game in its own window. Closing the window stops everything.

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
