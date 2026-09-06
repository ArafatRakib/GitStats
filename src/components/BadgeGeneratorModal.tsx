import { useState } from 'react';
import { Award, Copy, Check, X, ExternalLink } from 'lucide-react';
import { GitHubRelease } from '../types';

interface BadgeGeneratorModalProps {
  owner: string;
  repo: string;
  releases: GitHubRelease[];
  isOpen: boolean;
  onClose: () => void;
}

export function BadgeGeneratorModal({ owner, repo, releases, isOpen, onClose }: BadgeGeneratorModalProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const targetOwner = owner || 'owner';
  const targetRepo = repo || 'repo';
  const appUrl = owner && repo 
    ? `https://arafatrakib.github.io/GitStats/?repo=${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
    : 'https://arafatrakib.github.io/GitStats/';

  const badges = [
    {
      title: 'Total Downloads (All Releases)',
      previewUrl: `https://img.shields.io/github/downloads/${targetOwner}/${targetRepo}/total?color=indigo&logo=github&style=flat-square`,
      markdown: `[![GitHub Downloads](${`https://img.shields.io/github/downloads/${targetOwner}/${targetRepo}/total?color=indigo&logo=github&style=flat-square`})](${appUrl})`,
      html: `<a href="${appUrl}"><img src="https://img.shields.io/github/downloads/${targetOwner}/${targetRepo}/total?color=indigo&logo=github&style=flat-square" alt="Total Downloads" /></a>`,
    },
    {
      title: 'Latest Release Downloads',
      previewUrl: `https://img.shields.io/github/downloads/${targetOwner}/${targetRepo}/latest/total?color=emerald&logo=github&style=flat-square`,
      markdown: `[![GitHub Downloads (latest)](${`https://img.shields.io/github/downloads/${targetOwner}/${targetRepo}/latest/total?color=emerald&logo=github&style=flat-square`})](${appUrl})`,
      html: `<a href="${appUrl}"><img src="https://img.shields.io/github/downloads/${targetOwner}/${targetRepo}/latest/total?color=emerald&logo=github&style=flat-square" alt="Latest Downloads" /></a>`,
    },
    {
      title: 'Latest Version Tag',
      previewUrl: `https://img.shields.io/github/v/release/${targetOwner}/${targetRepo}?color=blue&logo=github&style=flat-square`,
      markdown: `[![GitHub Release](${`https://img.shields.io/github/v/release/${targetOwner}/${targetRepo}?color=blue&logo=github&style=flat-square`})](${appUrl})`,
      html: `<a href="${appUrl}"><img src="https://img.shields.io/github/v/release/${targetOwner}/${targetRepo}?color=blue&logo=github&style=flat-square" alt="Release Version" /></a>`,
    },
    {
      title: 'Platform Support',
      previewUrl: `https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square`,
      markdown: `[![Platform](${`https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square`})](${appUrl})`,
      html: `<a href="${appUrl}"><img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square" alt="Platform" /></a>`,
    },
  ];
  
  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-150 transition-colors flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Sticky Header with Close Button */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-t-2xl sticky top-0 z-20 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">README Badges Generator</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 hidden xs:block">Dynamic shields.io badges for your repository</p>
            </div>
          </div>

          <button
            id="btn-close-badges-modal"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 shrink-0 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1 overscroll-contain">
          {badges.map((badge, idx) => (
            <div key={badge.title} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{badge.title}</span>
                <img
                  src={badge.previewUrl}
                  alt={badge.title}
                  className="h-5"
                  onError={(e) => {
                    // Fallback visual tag if shield service is blocked in sandbox preview
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={badge.markdown}
                  className="w-full px-2.5 py-1.5 font-mono text-[11px] bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                />
                <button
                  onClick={() => handleCopy(badge.markdown, idx)}
                  className="px-3 py-1.5 font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition border border-indigo-200 dark:border-indigo-800 shrink-0 flex items-center space-x-1"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-300">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy MD</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}

          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
            <strong>Tip:</strong> Paste these markdown tags near the top of your <code className="font-mono bg-indigo-100/70 dark:bg-indigo-900/80 px-1 py-0.5 rounded">README.md</code> in <span className="font-semibold">{owner}/{repo}</span> to showcase download stats automatically!
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
