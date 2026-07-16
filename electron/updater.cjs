const { app, dialog, net, shell } = require('electron');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const GITHUB_API = 'https://api.github.com';
const FULL_VERSION_URL = 'https://keybuddy.thejumpvault.com/#full-version';

/** Shape of an issued license code (full validation happens in the app). */
const LICENSE_FORMAT = /^KB-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;

/** The page reports its license via IPC; main persists it here. */
function hasLicense() {
  try {
    const raw = fs.readFileSync(path.join(app.getPath('userData'), 'license.json'), 'utf8');
    const { code } = JSON.parse(raw);
    return typeof code === 'string' && LICENSE_FORMAT.test(code);
  } catch {
    return false;
  }
}

function isPlaceholder(value) {
  return !value || /^YOUR_/i.test(value);
}

function parseGitHubRepo(pkg) {
  const publish = pkg.build?.publish?.[0];
  if (publish?.provider === 'github' && publish.owner && publish.repo) {
    if (isPlaceholder(publish.owner) || isPlaceholder(publish.repo)) return null;
    return { owner: publish.owner, repo: publish.repo };
  }

  const url = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
  if (!url) return null;

  const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

function parseVersion(version) {
  return version
    .replace(/^v/i, '')
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0);
}

function isNewerVersion(latest, current) {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  const len = Math.max(a.length, b.length);

  for (let i = 0; i < len; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av > bv) return true;
    if (av < bv) return false;
  }
  return false;
}

function pickUpdateAsset(assets, isPortable, edition = 'web') {
  // Both editions publish to the same GitHub releases, so the school app
  // must only ever pick the School installer and the free app must never
  // pick it.
  if (edition === 'school') {
    return assets.find((asset) => /school/i.test(asset.name) && /setup\.exe$/i.test(asset.name));
  }
  const pattern = isPortable ? /portable\.exe$/i : /setup\.exe$/i;
  return assets.find((asset) => !/school/i.test(asset.name) && pattern.test(asset.name));
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const request = net.request({
      method: 'GET',
      url,
      redirect: 'follow',
    });

    request.setHeader('User-Agent', 'Keyboard-Learning-Updater');
    request.setHeader('Accept', 'application/vnd.github+json');

    request.on('response', (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
          return;
        }
        reject(new Error(`Update check failed (${response.statusCode}): ${body.slice(0, 200)}`));
      });
    });

    request.on('error', reject);
    request.end();
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const request = net.request({
      method: 'GET',
      url,
      redirect: 'follow',
    });

    request.setHeader('User-Agent', 'Keyboard-Learning-Updater');

    request.on('response', (response) => {
      if (response.statusCode && response.statusCode >= 400) {
        reject(new Error(`Download failed (${response.statusCode})`));
        return;
      }

      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      const file = fs.createWriteStream(destPath);

      response.pipe(file);
      file.on('finish', () => file.close(() => resolve(destPath)));
      file.on('error', (error) => {
        file.close(() => {
          fs.rm(destPath, { force: true }, () => reject(error));
        });
      });
    });

    request.on('error', reject);
    request.end();
  });
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    fs.createReadStream(filePath)
      .on('data', (chunk) => hash.update(chunk))
      .on('end', () => resolve(hash.digest('hex')))
      .on('error', reject);
  });
}

/** GitHub publishes asset digests as "sha256:<hex>". */
function expectedSha256(asset) {
  const match = /^sha256:([0-9a-f]{64})$/i.exec(asset?.digest ?? '');
  return match ? match[1].toLowerCase() : null;
}

/**
 * Verify the downloaded installer against the checksum GitHub published
 * for the release asset. Removes the file and throws on mismatch so a
 * corrupted or tampered download is never handed to the user.
 */
async function verifyDownload(destPath, asset) {
  const expected = expectedSha256(asset);
  if (!expected) return false;
  const actual = await sha256File(destPath);
  if (actual.toLowerCase() !== expected) {
    fs.rmSync(destPath, { force: true });
    throw new Error('The downloaded file failed its integrity check and was deleted. Please try again.');
  }
  return true;
}

/**
 * Free Edition without a license: updates are the paid feature. Point at
 * the site instead of downloading.
 */
async function promptFullVersion(parentWindow, version) {
  const { response } = await dialog.showMessageBox(parentWindow ?? null, {
    type: 'info',
    title: 'Update available',
    message: `Key Buddy ${version} is out!`,
    detail: 'Updates are part of the full version. Already have a license code? Enter it under Parent Settings → Desktop license.',
    buttons: ['Get the full version', 'Not now'],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });
  if (response === 0) {
    shell.openExternal(FULL_VERSION_URL);
  }
}

async function promptDownload(parentWindow, version) {
  const { response } = await dialog.showMessageBox(parentWindow ?? null, {
    type: 'info',
    title: 'Update available',
    message: `Keyboard Learning ${version} is ready.`,
    detail: 'Download the update now? It will be saved to your Downloads folder.',
    buttons: ['Download now', 'Not now'],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });
  return response === 0;
}

async function promptDownloadComplete(parentWindow, filePath, verified) {
  const verifiedNote = verified ? '\nIntegrity check passed.' : '';
  const { response } = await dialog.showMessageBox(parentWindow ?? null, {
    type: 'info',
    title: 'Update downloaded',
    message: 'The new version is in your Downloads folder.',
    detail: `${path.basename(filePath)}${verifiedNote}\n\nClose this app and double-click the new file to play.`,
    buttons: ['Show in folder', 'OK'],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });

  if (response === 0) {
    shell.showItemInFolder(filePath);
  }
}

async function checkForUpdates(parentWindow) {
  if (!app.isPackaged) return;

  let pkg;
  try {
    pkg = require(path.join(app.getAppPath(), 'package.json'));
  } catch {
    return;
  }

  const repo = parseGitHubRepo(pkg);
  if (!repo) return;

  const currentVersion = app.getVersion();
  const isPortable = Boolean(process.env.PORTABLE_EXECUTABLE_FILE);

  let release;
  try {
    release = await requestJson(
      `${GITHUB_API}/repos/${repo.owner}/${repo.repo}/releases/latest`,
    );
  } catch (error) {
    console.warn('[updater] check failed:', error.message);
    return;
  }

  const latestVersion = String(release.tag_name || release.name || '').replace(/^v/i, '');
  if (!latestVersion || !isNewerVersion(latestVersion, currentVersion)) return;

  const assets = Array.isArray(release.assets) ? release.assets : [];
  const asset = pickUpdateAsset(assets, isPortable, pkg.edition ?? 'web');
  if (!asset?.browser_download_url) {
    console.warn('[updater] no matching release asset found');
    return;
  }

  // School Edition purchases include updates; the Free Edition needs a
  // license code (the paid full version) before updates download.
  if (pkg.edition !== 'school' && !hasLicense()) {
    await promptFullVersion(parentWindow, latestVersion);
    return;
  }

  const shouldDownload = await promptDownload(parentWindow, latestVersion);
  if (!shouldDownload) return;

  const destPath = path.join(app.getPath('downloads'), asset.name);

  try {
    await downloadFile(asset.browser_download_url, destPath);
    const verified = await verifyDownload(destPath, asset);
    await promptDownloadComplete(parentWindow, destPath, verified);
  } catch (error) {
    console.warn('[updater] download failed:', error.message);
    await dialog.showMessageBox(parentWindow ?? null, {
      type: 'error',
      title: 'Update failed',
      message: 'Could not download the update.',
      detail: error.message,
      buttons: ['OK'],
    });
  }
}

function scheduleUpdateCheck(getParentWindow) {
  if (!app.isPackaged) return;

  const run = () => {
    const parentWindow = typeof getParentWindow === 'function' ? getParentWindow() : null;
    checkForUpdates(parentWindow).catch((error) => {
      console.warn('[updater] unexpected error:', error);
    });
  };

  setTimeout(run, 2500);
}

module.exports = { scheduleUpdateCheck, checkForUpdates, LICENSE_FORMAT, FULL_VERSION_URL };
