# 📊 GitStats - Release Download Analytics & Performance Tracker

[![GitHub Release](https://img.shields.io/github/v/release/ArafatRakib/GitStats?color=indigo&logo=github&style=flat-square)](https://github.com/ArafatRakib/GitStats/releases)
[![License](https://img.shields.io/github/license/ArafatRakib/GitStats?color=blue&style=flat-square)](LICENSE)
[![GitHub Pages Deployment](https://img.shields.io/github/deployments/ArafatRakib/GitStats/github-pages?label=demo&logo=github&style=flat-square)](https://arafatrakib.github.io/GitStats/)

**GitStats** is a modern, cross-platform release analytics dashboard and periodic metrics logger for GitHub repositories. Designed for open-source maintainers and developer teams, GitStats provides rate-limit-safe download trajectory tracking, platform breakdown (Windows, macOS, Linux, Android, iOS), and automated GitHub Actions time-series logging.

🚀 **Live App**: [https://arafatrakib.github.io/GitStats/](https://arafatrakib.github.io/GitStats/)

---

## ✨ Features

- **📈 Download Trajectory Charts**: Interactive cumulative & daily download velocity graphs powered by Recharts.
- **📱 Cross-Platform OS Breakdown**: Automatically categorizes binary releases (.apk, .exe, .dmg, .deb, .tar.gz, .ipa) by operating system.
- **🔍 Any User or Repo Lookup**: Search any public GitHub username to inspect all developer public repositories via a dropdown selector.
- **🛡️ 100% Rate-Limit Proof**: Operates seamlessly without authentication, or connect an optional Personal Access Token (PAT) to expand quota to 5,000 requests/hr.
- **🤖 GitHub Actions Periodic Tracker**: Includes a zero-dependency Node.js script and automated workflow file to capture periodic historical snapshots without API limits.
- **🎯 README Badges Generator**: Generates dynamic markdown badges for release download counts to embed directly into your repository README.
- **📊 App Visitor Analytics**: Integrated privacy-friendly visitor and unique hit counters.

---

## 🛠️ Automated Setup for Your Repository

To record time-series download snapshots automatically without hitting API rate limits:

1. Create `.github/workflows/track-downloads.yml` in your repository:

```yaml
name: Track Release Downloads Periodic Logger

on:
  schedule:
    - cron: '0 */6 * * *' # Runs every 6 hours
  workflow_dispatch:

permissions:
  contents: write

jobs:
  track-metrics:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Fetch & Log Release Stats
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: node scripts/track-downloads.mjs
      - name: Commit & Push Updated History
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add data/downloads-history.json
          git diff --staged --quiet || (git commit -m "chore(stats): update download metrics snapshot [skip ci]" && git push)
```

2. Generate the helper script `scripts/track-downloads.mjs` directly inside the Actions modal in GitStats!
````javascript 
// scripts/track-downloads.mjs
// Lightweight Node.js tracker script with zero external dependencies
import { promises as fs } from 'fs';
import path from 'path';

const owner = process.env.REPO_OWNER || '';
const repo = process.env.REPO_NAME || '';
const token = process.env.GITHUB_TOKEN;
const dataFilePath = process.env.DATA_FILE || 'data/downloads-history.json';

function detectOS(filename) {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.apk') || lower.endsWith('.aab') || lower.endsWith('.xapk') || lower.includes('android')) return 'Android';
  if (lower.endsWith('.ipa') || lower.includes('ios') || lower.includes('iphone') || lower.includes('ipad')) return 'iOS';
  if (lower.endsWith('.exe') || lower.endsWith('.msi') || lower.endsWith('.msix') || lower.includes('win')) return 'Windows';
  if (lower.endsWith('.dmg') || lower.endsWith('.pkg') || lower.includes('mac') || lower.includes('darwin') || lower.includes('osx')) return 'macOS';
  if (lower.endsWith('.deb') || lower.endsWith('.rpm') || lower.endsWith('.appimage') || lower.endsWith('.snap') || lower.endsWith('.flatpak') || lower.endsWith('.tar.gz') || lower.includes('linux')) return 'Linux';
  if (lower.endsWith('.zip') || lower.endsWith('.tar')) return 'Source';
  return 'Other';
}

async function run() {
  console.log(`Fetching release stats for ${owner}/${repo}...`);
  
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'ChronoCraft-Metrics-Tracker',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=100`, { headers });
  
  if (!res.ok) {
    throw new Error(`GitHub API returned ${res.status}: ${res.statusText}`);
  }

  const releases = await res.json();
  
  let totalDownloads = 0;
  const releaseDownloads = {};
  const assetDownloads = {};
  const osBreakdown = { android: 0, iOS: 0, windows: 0, macOS: 0, linux: 0, source: 0, other: 0 };

  for (const r of releases) {
    let relTotal = 0;
    for (const a of (r.assets || [])) {
      const count = a.download_count || 0;
      relTotal += count;
      totalDownloads += count;
      assetDownloads[a.name] = (assetDownloads[a.name] || 0) + count;

      const os = detectOS(a.name);
      if (os === 'Android') osBreakdown.android += count;
      else if (os === 'iOS') osBreakdown.iOS += count;
      else if (os === 'Windows') osBreakdown.windows += count;
      else if (os === 'macOS') osBreakdown.macOS += count;
      else if (os === 'Linux') osBreakdown.linux += count;
      else if (os === 'Source') osBreakdown.source += count;
      else osBreakdown.other += count;
    }
    releaseDownloads[r.tag_name] = relTotal;
  }

  const now = new Date();
  const snapshot = {
    id: `snap_${Date.now()}`,
    timestamp: now.toISOString(),
    dateLabel: now.toISOString().replace('T', ' ').substring(0, 16),
    totalDownloads,
    releaseDownloads,
    assetDownloads,
    osBreakdown,
  };

  // Ensure output directory exists
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });

  let database = { repository: `${owner}/${repo}`, lastUpdated: now.toISOString(), history: [] };
  
  try {
    const existingRaw = await fs.readFile(dataFilePath, 'utf-8');
    database = JSON.parse(existingRaw);
  } catch (err) {
    console.log('No existing history file found. Initializing new database...');
  }

  if (!Array.isArray(database.history)) {
    database.history = [];
  }

  // Calculate delta from previous snapshot
  if (database.history.length > 0) {
    const prev = database.history[database.history.length - 1];
    snapshot.deltaDownloads = Math.max(0, totalDownloads - prev.totalDownloads);
  } else {
    snapshot.deltaDownloads = 0;
  }

  database.history.push(snapshot);
  database.lastUpdated = now.toISOString();
  database.latestTotalDownloads = totalDownloads;

  await fs.writeFile(dataFilePath, JSON.stringify(database, null, 2), 'utf-8');
  console.log(`✅ Successfully recorded snapshot! Total downloads: ${totalDownloads} (${database.history.length} snapshots in history)`);
}

run().catch((err) => {
  console.error('Fatal error running tracker:', err);
  process.exit(1);
});

````
   
## 💻 Tech Stack
* Framework: React 19 + TypeScript + Vite
* Styling: Tailwind CSS v4
* Data Visualization: Recharts
* Icons: Lucide React
* Mobile Mobile & Cross-Platform: Optimized for Capacitor WebViews & Mobile Browsers

## 🤝 Contributing
​Contributions are welcome! Feel free to open issues or submit pull requests to enhance platform detection, chart visualizations, or mobile UI performance.