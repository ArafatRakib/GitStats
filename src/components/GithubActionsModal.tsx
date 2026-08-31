import { useState } from 'react';
import { 
  Workflow, 
  Copy, 
  Check, 
  X, 
  ShieldCheck, 
  FileCode, 
  Clock, 
  GitBranch, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { generateWorkflowYaml, generateTrackScript } from '../services/workflowGenerator';

interface GithubActionsModalProps {
  owner: string;
  repo: string;
  isOpen: boolean;
  onClose: () => void;
}

export function GithubActionsModal({ owner, repo, isOpen, onClose }: GithubActionsModalProps) {
  const [scheduleHour, setScheduleHour] = useState(6);
  const [branch, setBranch] = useState('main');
  const [dataFile, setDataFile] = useState('data/downloads-history.json');
  const [copiedFile, setCopiedFile] = useState<'workflow' | 'script' | null>(null);
  const [activeView, setActiveView] = useState<'workflow' | 'script'>('workflow');

  if (!isOpen) return null;

  const workflowYaml = generateWorkflowYaml({
    owner,
    repo,
    scheduleHour,
    branch,
    dataFile,
  });

  const trackScript = generateTrackScript({
    owner,
    repo,
    scheduleHour,
    branch,
    dataFile,
  });

  const handleCopy = (type: 'workflow' | 'script') => {
    const text = type === 'workflow' ? workflowYaml : trackScript;
    navigator.clipboard.writeText(text);
    setCopiedFile(type);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-150 transition-colors flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Sticky Header with Close Button */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-t-2xl sticky top-0 z-20 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Workflow className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">GitHub Actions Setup</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 hidden xs:block">Automated download tracking with zero API rate-limits</p>
            </div>
          </div>

          <button
            id="btn-close-actions-modal"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 shrink-0 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">

        {/* Why this prevents rate limits */}
        <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 mb-5">
          <div className="flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-emerald-950 dark:text-emerald-100">How this prevents rate limit bans completely:</strong>
              <ul className="mt-1 space-y-1 text-emerald-800 dark:text-emerald-300 list-disc list-inside leading-relaxed">
                <li>
                  GitHub Actions runs on GitHub’s own servers using the repository's built-in <code className="bg-emerald-100/80 dark:bg-emerald-900/80 px-1 py-0.5 rounded font-mono">GITHUB_TOKEN</code> (granting 1,000 API requests/hr).
                </li>
                <li>
                  The script periodically appends snapshot records directly into <code className="bg-emerald-100/80 dark:bg-emerald-900/80 px-1 py-0.5 rounded font-mono">{dataFile}</code> in your repository.
                </li>
                <li>
                  This web app hosted on GitHub Pages or locally fetches your repository's raw JSON file via GitHub's CDN—<strong>triggering ZERO API calls</strong> from your users or your IP!
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Configuration options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Logging Frequency</label>
            <select
              value={scheduleHour}
              onChange={(e) => setScheduleHour(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value={1}>Every 1 hour</option>
              <option value={3}>Every 3 hours</option>
              <option value={6}>Every 6 hours (Recommended)</option>
              <option value={12}>Every 12 hours</option>
              <option value={24}>Once daily (Midnight UTC)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Branch</label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">History Database Path</label>
            <input
              type="text"
              value={dataFile}
              onChange={(e) => setDataFile(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Code tabs */}
        <div className="mb-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveView('workflow')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeView === 'workflow'
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                1. .github/workflows/track-downloads.yml
              </button>
              <button
                onClick={() => setActiveView('script')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeView === 'script'
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                2. scripts/track-downloads.mjs
              </button>
            </div>

            <button
              onClick={() => handleCopy(activeView)}
              className="inline-flex items-center space-x-1 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition border border-indigo-200 dark:border-indigo-800"
            >
              {copiedFile === activeView ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-3 relative">
            <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-72 border border-slate-800">
              {activeView === 'workflow' ? workflowYaml : trackScript}
            </pre>
          </div>
        </div>

        {/* Step-by-step setup checklist */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 space-y-2">
          <h4 className="font-bold text-slate-900 dark:text-white">3-Minute Setup Instructions:</h4>
          <ol className="space-y-1.5 list-decimal list-inside leading-relaxed text-slate-600 dark:text-slate-300">
            <li>
              In your <span className="font-mono font-semibold text-slate-900 dark:text-white">{owner}/{repo}</span> repo, create file <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono text-slate-800 dark:text-slate-200">.github/workflows/track-downloads.yml</code> and paste the workflow code.
            </li>
            <li>
              Create file <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono text-slate-800 dark:text-slate-200">scripts/track-downloads.mjs</code> and paste the Node.js script.
            </li>
            <li>
              Under repo <strong>Settings → Actions → General → Workflow permissions</strong>, select <strong>"Read and write permissions"</strong> so the bot can commit the snapshot file.
            </li>
          </ol>
        </div>

        </div>

        {/* Modal Footer with Close Action */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 rounded-b-2xl flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-300 dark:border-slate-700 transition"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
}
