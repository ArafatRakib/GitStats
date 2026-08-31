import { Download, TrendingUp, Tag, Laptop, Layers, Smartphone, Apple, Terminal, Star, GitFork, ExternalLink } from 'lucide-react';
import { GitHubRelease, DownloadSnapshot, GitHubRepoInfo } from '../types';

interface OverviewCardsProps {
  releases: GitHubRelease[];
  snapshots: DownloadSnapshot[];
  repoInfo: GitHubRepoInfo | null;
  owner: string;
  repo: string;
}

export function OverviewCards({ releases, snapshots, repoInfo, owner, repo }: OverviewCardsProps) {
  const totalDownloads = releases.reduce((sum, r) => sum + r.total_downloads, 0);
  const totalAssets = releases.reduce((sum, r) => sum + r.assets.length, 0);

  // Latest release info
  const latestRelease = releases[0] || null;

  // OS Breakdown
  let androidCount = 0;
  let iosCount = 0;
  let winCount = 0;
  let macCount = 0;
  let linuxCount = 0;
  let sourceCount = 0;

  releases.forEach((r) => {
    r.assets.forEach((a) => {
      const os = a.os || 'Other';
      if (os === 'Android') androidCount += a.download_count;
      else if (os === 'iOS') iosCount += a.download_count;
      else if (os === 'Windows') winCount += a.download_count;
      else if (os === 'macOS') macCount += a.download_count;
      else if (os === 'Linux') linuxCount += a.download_count;
      else if (os === 'Source') sourceCount += a.download_count;
    });
  });

  const osMap = [
    { name: 'Android', count: androidCount, short: 'Android' },
    { name: 'Windows', count: winCount, short: 'Win' },
    { name: 'macOS', count: macCount, short: 'Mac' },
    { name: 'Linux', count: linuxCount, short: 'Linux' },
    { name: 'iOS', count: iosCount, short: 'iOS' },
  ].sort((a, b) => b.count - a.count);

  const topOS = osMap[0]?.count > 0 ? osMap[0] : { name: 'Multi-platform', count: totalDownloads, short: 'All' };
  const topOSPercent = totalDownloads > 0 ? Math.round((topOS.count / totalDownloads) * 100) : 0;

  const getPlatformIcon = (name: string) => {
    if (name === 'Android' || name === 'iOS') return <Smartphone className="w-4 h-4" />;
    if (name === 'macOS') return <Apple className="w-4 h-4" />;
    if (name === 'Linux') return <Terminal className="w-4 h-4" />;
    return <Laptop className="w-4 h-4" />;
  };

  // Top 3 active platforms for the subtitle
  const activePlatforms = osMap.filter((p) => p.count > 0);

  // Calculate 7-day growth
  let sevenDayDelta = 0;
  let growthRatePercent = 0;
  if (snapshots.length >= 2) {
    const latest = snapshots[snapshots.length - 1];
    // Find snapshot from approx 7 days ago
    const targetTime = new Date(latest.timestamp).getTime() - 7 * 24 * 60 * 60 * 1000;
    const pastSnap = snapshots.find((s) => new Date(s.timestamp).getTime() >= targetTime) || snapshots[0];
    sevenDayDelta = Math.max(0, latest.totalDownloads - pastSnap.totalDownloads);
    if (pastSnap.totalDownloads > 0) {
      growthRatePercent = Math.round((sevenDayDelta / pastSnap.totalDownloads) * 100);
    }
  }

  const starCount = repoInfo ? repoInfo.stargazers_count : 0;
  const forkCount = repoInfo ? repoInfo.forks_count : 0;
  const isRepoValid = Boolean(owner && repo);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      
      {/* 1. Total Downloads */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Downloads</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Download className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
            {totalDownloads.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+{sevenDayDelta.toLocaleString()} 7d ({growthRatePercent > 0 ? `+${growthRatePercent}%` : 'steady'})</span>
          </div>
        </div>
      </div>

      {/* 2. GitHub Stars (Prominent Gold / Amber Card) */}
      <a
        href={isRepoValid ? `https://github.com/${owner}/${repo}/stargazers` : '#'}
        target={isRepoValid ? '_blank' : '_self'}
        rel="noreferrer"
        onClick={(e) => {
          if (!isRepoValid) e.preventDefault();
        }}
        
        className={`group bg-gradient-to-b from-amber-500/5 to-amber-500/10 dark:from-amber-950/30 dark:to-amber-900/20 rounded-xl p-5 border border-amber-300/80 dark:border-amber-700/60 shadow-xs relative overflow-hidden transition-all ${
          isRepoValid ? 'hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md cursor-pointer' : 'cursor-default'
        } block`}
        title={isRepoValid ? 'View Stargazers on GitHub' : 'No repository selected'}
      >

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
            GitHub Stars
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-300 group-hover:scale-110 transition-transform">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-900 dark:text-amber-200 tracking-tight font-mono">
              {starCount.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-amber-700/90 dark:text-amber-400">
              Stars
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-medium">
            <span className="flex items-center gap-1">
              <GitFork className="w-3 h-3" />
              {forkCount} {forkCount === 1 ? 'fork' : 'forks'}
            </span>
            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">
              Star repo <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>
      </a>

      {/* 3. Latest Release */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Latest Release</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Tag className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-mono">
              {latestRelease ? latestRelease.tag_name : 'N/A'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {latestRelease?.total_downloads.toLocaleString()} dl
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate" title={latestRelease?.name || ''}>
            {latestRelease ? `${new Date(latestRelease.published_at).toLocaleDateString()} • ${latestRelease.assets.length} binaries` : 'No release found'}
          </p>
        </div>
      </div>

      {/* 4. Top Platform / OS */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Top Platform</span>
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400">
            {getPlatformIcon(topOS.name)}
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2">
            <span>{topOS.name}</span>
            <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">{topOSPercent}%</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-x-2 gap-y-0.5">
            {activePlatforms.length > 0 ? (
              activePlatforms.slice(0, 2).map((p, idx) => (
                <span key={p.name} className="flex items-center gap-1">
                  {idx > 0 && <span className="text-slate-300 dark:text-slate-700">•</span>}
                  <span>{p.short}: {Math.round((p.count / (totalDownloads || 1)) * 100)}%</span>
                </span>
              ))
            ) : (
              <span>No platform data</span>
            )}
          </div>
        </div>
      </div>

      {/* 5. Release History & Builds */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Releases & Builds</span>
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {releases.length} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">Releases</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {totalAssets} assets • avg {releases.length ? Math.round(totalDownloads / releases.length).toLocaleString() : 0} dl/rel
          </p>
        </div>
      </div>

    </div>
  );
}
