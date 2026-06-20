# Key Buddy

**Key Buddy** is a friendly keyboard and mouse learning app for **kids** and **adults**. Built with Vite + vanilla JavaScript. Works in the browser, as a Windows portable app, or as a Linux AppImage.

**Play online:** [keybuddy.thejumpvault.com](https://keybuddy.thejumpvault.com/)

## Who it's for

On the welcome screen, choose:

- **For My Child** — ages 3–14 type their age; the app maps them to an age group and adjusts difficulty automatically.
- **For Adults** — pick a skill level (Beginner → Expert) and open the **Training Hub** with lessons, practice games, and progress tracking (including WPM).

Progress (star ratings, lesson completion, typing speed) is saved in the browser on that device.

## Activities

### Typing (kids + adults)

| Game | Description |
|------|-------------|
| **Letter Pop** | Press the letter shown on screen |
| **Balloon Letters** | Press the letter on each balloon as it drifts across |
| **Word Garden** | Type words and short phrases |
| **Key Explorer** | Find highlighted keys on the keyboard |
| **Number Train** | Type numbers on the number row |
| **Sentence Complete** | Pick the missing word with the mouse, then type it |
| **Key Ninja** | Press keys to slice flying fruit before it falls (ages 7–12) |

### Mouse (kids + adults)

| Game | Description |
|------|-------------|
| **Balloon Pop** | Click floating balloons before they escape |
| **Drag & Match** | Drag colored shapes to matching buckets |
| **Click the Critter** | Click (or double-click) moving critters |
| **Color Click** | Click the circle that matches the color name |
| **Hide n Seek** | Find the lion before it reaches the sheep |
| **Maze Mouse** | Guide the cursor through a maze without touching walls |

### Adult lessons (Training Hub → Learn)

| Lesson | Description |
|--------|-------------|
| **Home Row Drill** | Guided home-row key practice |
| **Typing Test** | 60-second speed and accuracy benchmark |
| **Form Controls** | Checkboxes, radio buttons, and dropdown menus |

Adults also get **Practice** (typing and mouse games at their level), **Progress** (WPM history and lesson stats), and rotating **ergonomics tips**.

## Accessibility (no parent gate)

Open **Accessibility** from the welcome screen, hub, or the ♿ button (bottom-left). Press **`?`** on most screens for the same panel.

- Theme (auto / dark / light)
- Text size
- Reduce motion
- High contrast mode
- Keyboard shortcuts legend

Music and sound toggles in the top-right toolbar include **vertical volume sliders** on hover or focus.

## Parent Settings (math gate)

**Parent Settings** on the **child game hub** (after choosing For My Child) requires solving a short math problem. Parents can:

- Turn individual games on or off
- Override difficulty (auto / easy / medium / hard)
- Set round length (short / normal / long)
- Control timed games and on-screen keyboard visibility
- Adjust child age group override
- Mute music and sound effects

Display and accessibility options are available **without** the parent gate via the Accessibility hub.

Settings are saved in the browser on that machine.

## Adding a new game

1. Create a class in `src/activities/typing/` or `src/activities/mouse/` extending `Activity.js`
2. Register it in `src/config/activityRegistry.js` — add to `ACTIVITIES` and `ACTIVITY_CONFIG`
3. Rebuild — the game appears in the hub automatically (enabled by default)

See the comment block at the top of `activityRegistry.js` for the full checklist. Use `audiences: ['adult']` and `hubSection: 'learn'` for adult-only lessons.

---

## Web app deployment

The site deploys automatically to GitHub Pages when you push to `main`.

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

The workflow `.github/workflows/deploy-web.yml` builds `dist/` and publishes it. `public/CNAME` tells GitHub Pages which custom domain to use.

---

## Windows — portable app (.exe)

Build a portable app kids can launch with one click.

**Release workflow** (bump version every new `.exe`; build only when you approve):

```bash
npm install
npm run bump:version              # 1.0.0 → 1.0.1 (patch; use -- minor or -- major)
npm run package:win -- --approve  # only after you approve the release
```

Creates **`release/Keyboard-Learning-<version>-portable.exe`** (version from `package.json`).

`npm run package:win` without `--approve` is blocked on purpose.

Copy the `.exe` anywhere (Desktop, USB drive) and double-click to play. No browser or Node.js needed.

Windows may show a SmartScreen warning because the app is not store-signed — click **More info**, then **Run anyway**.

For a traditional installer:

```bash
npm run package:win:installer
```

Press **F11** inside the app for fullscreen.

### Automatic updates

The Windows app checks GitHub for a newer release on startup (after a short delay). If an update exists, it offers to download the new `.exe` to the **Downloads** folder.

**Publishing an update:**

1. `npm run bump:version` (or bump manually in `package.json`).
2. `npm run package:win -- --approve`.
3. Create a [GitHub Release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) tagged `v1.0.1` (matching your version).
4. Attach **`release/Keyboard-Learning-1.0.1-portable.exe`** to that release.

---

## Transfer to Linux laptop

### Option 1 — App menu shortcut (zip package)

On your **Windows dev PC**:

```bash
npm install
npm run package:linux
```

Creates `release/key-buddy-linux/` and `.zip`.

**One-time setup on Linux Mint**:

```bash
cd ~/Games/key-buddy-linux
chmod +x KeyBuddy.sh install-desktop.sh
./install-desktop.sh
```

Kids launch **Key Buddy** from the app menu — no terminal required.

### Option 2 — Native AppImage

Build on Linux or WSL:

```bash
npm run bump:version
npm run package:linux:app -- --approve
```

Creates `release/Key-Buddy-<version>.AppImage`. Copy to the laptop, `chmod +x`, double-click.

---

## Linux Mint (full project + Node.js)

```bash
npm install
npm run build
npm run preview
```

Open **Firefox** → **http://127.0.0.1:5183**

### Tips

- Press **F11** in the browser for fullscreen
- Use a dedicated Firefox profile to keep progress separate
- Use **Change** on the hub to update a child's age when they grow into the next tier
- Fonts work offline using system fallbacks (Ubuntu, Cantarell on Mint)

---

## Development

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

## Repository

[github.com/enachealex/Keyboard-Learning](https://github.com/enachealex/Keyboard-Learning)
