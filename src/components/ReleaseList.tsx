import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Download, 
  ExternalLink, 
  Tag, 
  Search, 
  FileCode, 
  Laptop, 
  Apple, 
  Terminal,
  Smartphone,
  Calendar,
  Sparkles
} from 'lucide-react';
import { GitHubRelease, GitHubAsset } from '../types';
import { formatBytes } from '../services/githubApi';

interface ReleaseListProps {
  releases: GitHubRelease[];
}

export function ReleaseList({ releases }: ReleaseListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({
    [releases[0]?.id || 0]: true, // Expand latest by default
  });

  const totalRepoDownloads = releases.reduce((sum, r) => sum + r.total_downloads, 0);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all: Record<number, boolean> = {};
    releases.forEach((r) => { all[r.id] = true; });
    setExpandedIds(all);
  };

  const collapseAll = () => {
    setExpandedIds({});
  };

  const filteredReleases = releases.filter((r) => {
    const matchTag = r.tag_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchName = (r.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchAsset = r.assets.some((a) => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchTag || matchName || matchAsset;
  });

  const getOSIcon = (os?: string) => {
    switch (os) {
      case 'Android':
        return <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'iOS':
        return <Smartphone className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />;
      case 'Windows':
        return <Laptop className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case 'macOS':
        return <Apple className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'Linux':
        return <Terminal className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      default:
        return <FileCode className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />;
    }
  };

  const getOSBadgeClass = (os?: string) => {
    switch (os) {
      case 'Android':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      case 'iOS':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800';
      case 'Windows':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
      case 'macOS':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
      case 'Linux':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mb-8 overflow-hidden transition-colors">
      
      {/* Header & Filter Controls */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Release Versions & Asset Downloads</span>
            <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {releases.length} releases
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Download counts, file sizes, and platform metrics for each published binary release
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter release or asset..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44 sm:w-56"
            />
          </div>

          <button
            onClick={expandAll}
            className="px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
          >
            Collapse
          </button>
        </div>
      </div>

      {/* Release Items Accordion List */}
      <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
        {filteredReleases.map((release, index) => {
          const isExpanded = !!expandedIds[release.id];
          const releaseShare = totalRepoDownloads > 0 ? Math.round((release.total_downloads / totalRepoDownloads) * 100) : 0;
          const isLatest = index === 0;

          return (
            <div key={release.id} className="transition-colors hover:bg-slate-50/40 dark:hover:bg-slate-800/30">
              
              {/* Release Row Header */}
              <div
                onClick={() => toggleExpand(release.id)}
                className="p-4 sm:px-6 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-start sm:items-center space-x-3">
                  <div className="mt-0.5 sm:mt-0 p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">{release.tag_name}</span>
                      {isLatest && (
                        <span className="px-2 py-0.2 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Latest
                        </span>
                      )}
                      {release.prerelease && (
                        <span className="px-2 py-0.2 rounded text-[11px] font-medium bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Pre-release
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center space-x-2">
                      <span>{release.name || release.tag_name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        {new Date(release.published_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side stats & toggle */}
                <div className="flex items-center space-x-4 sm:space-x-6">
                  
                  {/* Downloads & share bar */}
                  <div className="text-right">
                    <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-mono flex items-center justify-end gap-1.5">
                      <span>{release.total_downloads.toLocaleString()}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-normal">downloads</span>
                    </div>
                    <div className="flex items-center justify-end space-x-1.5 mt-0.5">
                      <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full" style={{ width: `${releaseShare}%` }} />
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 font-mono">{releaseShare}%</span>
                    </div>
                  </div>

                  <a
                    href={release.html_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    title="View on GitHub"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Assets Breakdown */}
              {isExpanded && (
                <div className="px-4 sm:px-6 pb-4 pt-1 bg-slate-50/70 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80">
                  
                  {release.assets.length === 0 ? (
                    <div className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
                      No standalone binary assets uploaded for this release (source code zip/tarball available on GitHub).
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Attached Release Binaries ({release.assets.length})
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        {release.assets.map((asset) => {
                          const assetShare = release.total_downloads > 0
                            ? Math.round((asset.download_count / release.total_downloads) * 100)
                            : 0;

                          return (
                            <div
                              key={asset.id}
                              className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                                  {getOSIcon(asset.os)}
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono font-bold text-slate-900 dark:text-white">{asset.name}</span>
                                    <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border ${getOSBadgeClass(asset.os)} dark:bg-opacity-20`}>
                                      {asset.os || 'Binary'}
                                    </span>
                                  </div>
                                  <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                                    {formatBytes(asset.size)} {asset.label ? `• ${asset.label}` : ''}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end space-x-4 pl-9 sm:pl-0">
                                <div className="text-left sm:text-right">
                                  <div className="font-mono font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                                    {asset.download_count.toLocaleString()} <span className="text-slate-500 dark:text-slate-400 text-[11px] font-normal">dl</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                    {assetShare}% of version
                                  </div>
                                </div>

                                <a
                                  href={asset.browser_download_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-700 dark:hover:text-indigo-300 text-slate-700 dark:text-slate-200 font-medium transition border border-slate-200/80 dark:border-slate-700"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Release Body / Changelog snippet if available */}
                  {release.body && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                      <details className="text-xs text-slate-600 dark:text-slate-300">
                        <summary className="cursor-pointer font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 select-none">
                          View Release Notes & Changelog
                        </summary>
                        <div className="mt-2 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto text-slate-700 dark:text-slate-300">
                          {release.body}
                        </div>
                      </details>
                    </div>
                  )}

                </div>
              )}

            </div>
          );
        })}

        {filteredReleases.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No releases match "{searchTerm}". Try clearing your filter.
          </div>
        )}
      </div>

    </div>
  );
}
