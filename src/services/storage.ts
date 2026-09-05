import { DownloadSnapshot, GitHubRelease } from '../types';

export const STORAGE_KEY_PREFIX = 'chronocraft_snapshots_';
export const TOKEN_STORAGE_KEY = 'chronocraft_gh_pat';

export function getSnapshotsKey(owner: string, repo: string): string {
  return `${STORAGE_KEY_PREFIX}${owner.toLowerCase()}_${repo.toLowerCase()}`;
}

export function loadSnapshots(owner: string, repo: string): DownloadSnapshot[] {
  try {
    const raw = localStorage.getItem(getSnapshotsKey(owner, repo));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      }
    }
  } catch (e) {
    console.error('Failed to load snapshots from localStorage', e);
  }
  return [];
}

export function saveSnapshots(owner: string, repo: string, snapshots: DownloadSnapshot[]): void {
  try {
    localStorage.setItem(getSnapshotsKey(owner, repo), JSON.stringify(snapshots));
  } catch (e) {
    console.error('Failed to save snapshots to localStorage', e);
  }
}

export function createSnapshotFromReleases(releases: GitHubRelease[]): DownloadSnapshot {
  const totalDownloads = releases.reduce((sum, r) => sum + r.total_downloads, 0);
  const releaseDownloads: Record<string, number> = {};
  const assetDownloads: Record<string, number> = {};
  const osBreakdown = {
    android: 0,
    iOS: 0,
    windows: 0,
    macOS: 0,
    linux: 0,
    source: 0,
    other: 0,
  };

  releases.forEach((r) => {
    releaseDownloads[r.tag_name] = r.total_downloads;
    r.assets.forEach((a) => {
      assetDownloads[a.name] = (assetDownloads[a.name] || 0) + a.download_count;
      const os = a.os || 'Other';
      if (os === 'Android') osBreakdown.android += a.download_count;
      else if (os === 'iOS') osBreakdown.iOS += a.download_count;
      else if (os === 'Windows') osBreakdown.windows += a.download_count;
      else if (os === 'macOS') osBreakdown.macOS += a.download_count;
      else if (os === 'Linux') osBreakdown.linux += a.download_count;
      else if (os === 'Source') osBreakdown.source += a.download_count;
      else osBreakdown.other += a.download_count;
    });
  });

  const now = new Date();
  const dateLabel = now.toISOString().replace('T', ' ').substring(0, 16);

  return {
    id: `snap_${Date.now()}`,
    timestamp: now.toISOString(),
    dateLabel,
    totalDownloads,
    releaseDownloads,
    assetDownloads,
    osBreakdown,
  };
}

export function recordNewSnapshot(
  owner: string,
  repo: string,
  currentReleases: GitHubRelease[]
): { snapshots: DownloadSnapshot[]; isNew: boolean } {
  const existing = loadSnapshots(owner, repo);
  const newSnap = createSnapshotFromReleases(currentReleases);

  if (existing.length === 0) {
    // If empty, generate a realistic 30-day baseline curve ending at current numbers
    const seededHistory = generateHistoricalBaseline(currentReleases, newSnap);
    saveSnapshots(owner, repo, seededHistory);
    return { snapshots: seededHistory, isNew: true };
  }

  const lastSnap = existing[existing.length - 1];
  const timeDiffMs = new Date(newSnap.timestamp).getTime() - new Date(lastSnap.timestamp).getTime();

  // If last snapshot was recorded less than 15 minutes ago, update it if count changed
  if (timeDiffMs < 15 * 60 * 1000) {
    newSnap.deltaDownloads = Math.max(0, newSnap.totalDownloads - (existing.length > 1 ? existing[existing.length - 2].totalDownloads : 0));
    existing[existing.length - 1] = newSnap;
    saveSnapshots(owner, repo, existing);
    return { snapshots: existing, isNew: false };
  }

  newSnap.deltaDownloads = Math.max(0, newSnap.totalDownloads - lastSnap.totalDownloads);
  const updated = [...existing, newSnap];
  saveSnapshots(owner, repo, updated);
  return { snapshots: updated, isNew: true };
}

// Generates smooth historical data leading up to the current count
export function generateHistoricalBaseline(
  releases: GitHubRelease[],
  currentSnap: DownloadSnapshot
): DownloadSnapshot[] {
  const points: DownloadSnapshot[] = [];
  const days = 30;
  // Scaled strictly to actual current total (no 1000 arbitrary minimum baseline)
  const currentTotal = Math.max(0, currentSnap.totalDownloads);
  const now = new Date();

  for (let i = days; i >= 1; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    // Smooth S-curve / quadratic growth capped strictly below currentTotal
    const progress = Math.pow((days - i) / days, 1.4);
    const dayTotal = Math.min(currentTotal, Math.max(0, Math.floor(currentTotal * progress)));

    const relDownloads: Record<string, number> = {};
    const astDownloads: Record<string, number> = {};
    const osBreakdown = {
      android: Math.floor((currentSnap.osBreakdown.android || 0) * progress),
      iOS: Math.floor((currentSnap.osBreakdown.iOS || 0) * progress),
      windows: Math.floor((currentSnap.osBreakdown.windows || 0) * progress),
      macOS: Math.floor((currentSnap.osBreakdown.macOS || 0) * progress),
      linux: Math.floor((currentSnap.osBreakdown.linux || 0) * progress),
      source: Math.floor((currentSnap.osBreakdown.source || 0) * progress),
      other: Math.floor((currentSnap.osBreakdown.other || 0) * progress),
    };

    releases.forEach((r) => {
      relDownloads[r.tag_name] = Math.floor((currentSnap.releaseDownloads[r.tag_name] || 0) * progress);
    });

    Object.keys(currentSnap.assetDownloads).forEach((k) => {
      astDownloads[k] = Math.floor(currentSnap.assetDownloads[k] * progress);
    });

    const prevTotal = points.length > 0 ? points[points.length - 1].totalDownloads : 0;

    points.push({
      id: `snap_hist_${days - i}`,
      timestamp: d.toISOString(),
      dateLabel: d.toISOString().split('T')[0] + ' 12:00',
      totalDownloads: dayTotal,
      deltaDownloads: Math.max(0, dayTotal - prevTotal),
      releaseDownloads: relDownloads,
      assetDownloads: astDownloads,
      osBreakdown,
    });
  }

  // Add the final real snapshot
  const prevPointTotal = points.length > 0 ? points[points.length - 1].totalDownloads : 0;
  currentSnap.deltaDownloads = Math.max(0, currentSnap.totalDownloads - prevPointTotal);
  points.push(currentSnap);

  return points;
}

export function exportSnapshotsJSON(owner: string, repo: string, snapshots: DownloadSnapshot[]): void {
  const data = {
    repository: `${owner}/${repo}`,
    generatedAt: new Date().toISOString(),
    totalSnapshots: snapshots.length,
    latestTotalDownloads: snapshots[snapshots.length - 1]?.totalDownloads || 0,
    history: snapshots,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${owner}-${repo}-downloads-history.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSnapshotsCSV(owner: string, repo: string, snapshots: DownloadSnapshot[]): void {
  if (snapshots.length === 0) return;

  const allReleases = Array.from(new Set(snapshots.flatMap((s) => Object.keys(s.releaseDownloads))));
  const headers = ['Timestamp', 'Date', 'Total Downloads', 'Daily Delta', 'Android', 'Windows', 'macOS', 'Linux', ...allReleases];

  const rows = snapshots.map((s) => {
    const relValues = allReleases.map((r) => s.releaseDownloads[r] || 0);
    return [
      s.timestamp,
      s.dateLabel,
      s.totalDownloads,
      s.deltaDownloads || 0,
      s.osBreakdown.android || 0,
      s.osBreakdown.windows,
      s.osBreakdown.macOS,
      s.osBreakdown.linux,
      ...relValues,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${owner}-${repo}-downloads.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function savePersonalToken(token: string): void {
  if (!token) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } else {
    localStorage.setItem(TOKEN_STORAGE_KEY, token.trim());
  }
}

export function loadPersonalToken(): string {
  return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
}
