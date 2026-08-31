import { useState, useRef, ChangeEvent } from 'react';
import { 
  History, 
  FileSpreadsheet, 
  FileJson, 
  Upload, 
  Camera, 
  Trash2, 
  Check, 
  AlertCircle,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { DownloadSnapshot, GitHubRelease } from '../types';
import { 
  exportSnapshotsCSV, 
  exportSnapshotsJSON, 
  recordNewSnapshot, 
  saveSnapshots 
} from '../services/storage';

interface HistoryLogTableProps {
  owner: string;
  repo: string;
  snapshots: DownloadSnapshot[];
  currentReleases: GitHubRelease[];
  onSnapshotsUpdated: (updated: DownloadSnapshot[]) => void;
}

export function HistoryLogTable({
  owner,
  repo,
  snapshots,
  currentReleases,
  onSnapshotsUpdated,
}: HistoryLogTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const itemsPerPage = 10;
  const reversedSnapshots = [...snapshots].reverse(); // newest first
  const totalPages = Math.ceil(reversedSnapshots.length / itemsPerPage) || 1;
  const paginated = reversedSnapshots.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const showNotification = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleManualSnapshot = () => {
    const { snapshots: updated, isNew } = recordNewSnapshot(owner, repo, currentReleases);
    onSnapshotsUpdated(updated);
    showNotification(isNew ? 'New snapshot point recorded!' : 'Recent snapshot point updated with current metrics.');
  };

  const handleExportCSV = () => {
    exportSnapshotsCSV(owner, repo, snapshots);
    showNotification('CSV log file exported successfully.');
  };

  const handleExportJSON = () => {
    exportSnapshotsJSON(owner, repo, snapshots);
    showNotification('JSON history database file exported.');
  };

  const handleImportJSON = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string;
        const parsed = JSON.parse(raw);
        let items: DownloadSnapshot[] = [];

        if (Array.isArray(parsed)) {
          items = parsed;
        } else if (parsed && Array.isArray(parsed.history)) {
          items = parsed.history;
        }

        if (items.length > 0) {
          // Sort chronologically
          items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          saveSnapshots(owner, repo, items);
          onSnapshotsUpdated(items);
          showNotification(`Successfully imported ${items.length} historical snapshot records!`);
        } else {
          showNotification('No valid history array found in JSON.');
        }
      } catch (err) {
        showNotification('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetHistory = () => {
    if (window.confirm('Reset all historical snapshot logs for this repository?')) {
      const { snapshots: newHistory } = recordNewSnapshot(owner, repo, currentReleases);
      onSnapshotsUpdated(newHistory);
      showNotification('Snapshot history reset to fresh baseline.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mb-8 overflow-hidden transition-colors">
      
      {/* Header with action toolbar */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Periodic Download Log & Snapshot Database</span>
            </h3>
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/60">
              {snapshots.length} snapshots
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Periodic time-series metrics recorded by automated GitHub Actions cron or browser sessions
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          
          <button
            id="btn-take-snapshot"
            onClick={handleManualSnapshot}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg transition shadow-xs"
            title="Record immediate metrics point"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Take Snapshot</span>
          </button>

          <button
            id="btn-export-json"
            onClick={handleExportJSON}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition border border-slate-200/80 dark:border-slate-700"
            title="Download JSON file for GitHub repository"
          >
            <FileJson className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>Export JSON</span>
          </button>

          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition border border-slate-200/80 dark:border-slate-700"
            title="Export spreadsheet CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {/* Import JSON */}
          <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition border border-slate-200/80 dark:border-slate-700 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Import JSON</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>

          <button
            onClick={handleResetHistory}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
            title="Clear and reset history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {message && (
        <div className="bg-indigo-50 dark:bg-indigo-950/80 border-b border-indigo-100 dark:border-indigo-900 px-4 py-2 text-xs font-semibold text-indigo-800 dark:text-indigo-200 flex items-center space-x-2 animate-in fade-in">
          <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{message}</span>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 uppercase text-[11px] tracking-wider">
            <tr>
              <th className="py-3 px-4 sm:px-6">Snapshot Time</th>
              <th className="py-3 px-4 text-right">Total Downloads</th>
              <th className="py-3 px-4 text-right">Period Growth</th>
              <th className="py-3 px-4 text-center">Android</th>
              <th className="py-3 px-4 text-center">Windows</th>
              <th className="py-3 px-4 text-center">macOS</th>
              <th className="py-3 px-4 text-center">Linux</th>
              <th className="py-3 px-4">Top Active Releases</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800 font-sans">
            {paginated.map((snap) => {
              const delta = snap.deltaDownloads || 0;
              const topReleases = Object.entries(snap.releaseDownloads || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);

              return (
                <tr key={snap.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 sm:px-6 font-mono text-slate-800 dark:text-slate-200">
                    <div className="font-semibold">{snap.dateLabel}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">{new Date(snap.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                  </td>
                  
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {snap.totalDownloads.toLocaleString()}
                  </td>

                  <td className="py-3 px-4 text-right font-mono">
                    {delta > 0 ? (
                      <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800">
                        +{delta.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600">0</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    {(snap.osBreakdown?.android || 0).toLocaleString()}
                  </td>

                  <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-slate-300">
                    {(snap.osBreakdown?.windows || 0).toLocaleString()}
                  </td>

                  <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-slate-300">
                    {(snap.osBreakdown?.macOS || 0).toLocaleString()}
                  </td>

                  <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-slate-300">
                    {(snap.osBreakdown?.linux || 0).toLocaleString()}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {topReleases.map(([tag, count]) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {tag}: {count.toLocaleString()}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div>
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, reversedSnapshots.length)} of {reversedSnapshots.length} snapshot logs
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Previous
            </button>
            <span className="px-2 font-mono font-medium text-slate-700 dark:text-slate-200">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
