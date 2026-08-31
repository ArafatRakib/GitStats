export interface WorkflowGeneratorOptions {
  owner: string;
  repo: string;
  scheduleHour: number; // e.g. 6 for every 6 hours
  branch: string; // e.g. 'main' or 'gh-pages'
  dataFile: string; // e.g. 'public/data/downloads-history.json'
}

export function generateWorkflowYaml(opts: WorkflowGeneratorOptions): string {
  const cronExpr = opts.scheduleHour === 24 ? '0 0 * * *' : `0 */${opts.scheduleHour} * * *`;

  return `# .github/workflows/track-downloads.yml
name: Track Release Downloads Periodic Logger

on:
  schedule:
    # Runs every ${opts.scheduleHour} hour${opts.scheduleHour > 1 ? 's' : ''} automatically
    - cron: '${cronExpr}'
  workflow_dispatch: # Allows manual trigger from Actions tab anytime
  release:
    types: [published, edited]

permissions:
  contents: write # Needed to commit snapshot data back to repository

jobs:
  track-metrics:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          ref: ${opts.branch}
          fetch-depth: 0

      - name: Setup Node.js Environment
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Fetch & Log Release Download Stats
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          REPO_OWNER: '${opts.owner}'
          REPO_NAME: '${opts.repo}'
          DATA_FILE: '${opts.dataFile}'
        run: |
          node scripts/track-downloads.mjs

      - name: Commit & Push Updated History
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add ${opts.dataFile}
          
          # Only commit if changes exist
          if git diff --staged --quiet; then
            echo "No changes in download counts."
          else
            git commit -m "chore(stats): update download metrics snapshot [skip ci]"
            git push origin ${opts.branch}
          fi
`;
}

export function generateTrackScript(opts: WorkflowGeneratorOptions): string {
  return `// scripts/track-downloads.mjs
// Lightweight Node.js tracker script with zero external dependencies
import { promises as fs } from 'fs';
import path from 'path';

const owner = process.env.REPO_OWNER || '${opts.owner}';
const repo = process.env.REPO_NAME || '${opts.repo}';
const token = process.env.GITHUB_TOKEN;
const dataFilePath = process.env.DATA_FILE || '${opts.dataFile}';

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
  console.log(\`Fetching release stats for \${owner}/\${repo}...\`);
  
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'ChronoCraft-Metrics-Tracker',
  };
  if (token) {
    headers['Authorization'] = \`Bearer \${token}\`;
  }

  const res = await fetch(\`https://api.github.com/repos/\${owner}/\${repo}/releases?per_page=100\`, { headers });
  
  if (!res.ok) {
    throw new Error(\`GitHub API returned \${res.status}: \${res.statusText}\`);
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
    id: \`snap_\${Date.now()}\`,
    timestamp: now.toISOString(),
    dateLabel: now.toISOString().replace('T', ' ').substring(0, 16),
    totalDownloads,
    releaseDownloads,
    assetDownloads,
    osBreakdown,
  };

  // Ensure output directory exists
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });

  let database = { repository: \`\${owner}/\${repo}\`, lastUpdated: now.toISOString(), history: [] };
  
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
  console.log(\`✅ Successfully recorded snapshot! Total downloads: \${totalDownloads} (\${database.history.length} snapshots in history)\`);
}

run().catch((err) => {
  console.error('Fatal error running tracker:', err);
  process.exit(1);
});
`;
}
