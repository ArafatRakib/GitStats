import { useState, FormEvent } from 'react';
import { 
  Github, 
  RefreshCw, 
  Workflow, 
  ExternalLink,
  Award,
  Search,
  Key
} from 'lucide-react';
import { GitHubRepoInfo, RateLimitInfo, ThemeMode } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  owner: string;
  repo: string;
  userRepos: GitHubRepoInfo[];
  isFetchingUserRepos: boolean;
  repoInfo: GitHubRepoInfo | null;
  rateLimit: RateLimitInfo | null;
  isLoading: boolean;
  onRefresh: () => void;
  onChangeRepo: (owner: string, repo: string) => void;
  onUserLookup: (username: string) => void;
  onOpenActionsModal: () => void;
  onOpenBadgeModal: () => void;
  onOpenTokenModal: () => void;
  isCustomTokenSet: boolean;
  isSeedData: boolean;
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  onThemeChange: (theme: ThemeMode) => void;
}

export function Header({
  owner,
  repo,
  userRepos,
  isFetchingUserRepos,
  rateLimit,
  isLoading,
  onRefresh,
  onChangeRepo,
  onUserLookup,
  onOpenActionsModal,
  onOpenBadgeModal,
  onOpenTokenModal,
  isCustomTokenSet,
  isSeedData,
  theme,
  resolvedTheme,
  onThemeChange,
}: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [inputVal, setInputVal] = useState(`${owner}/${repo}`);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    const parts = trimmed.split('/');
    if (parts.length === 2 && parts[0] && parts[1]) {
      onChangeRepo(parts[0], parts[1]);
      setIsSearchOpen(false);
    } else if (parts.length === 1 && parts[0]) {
      onUserLookup(parts[0]);
    }
  };

  const remainingQuota = rateLimit ? rateLimit.remaining : 60;
  const maxQuota = rateLimit ? rateLimit.limit : 60;

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* ROW 1: Branding, Live API Rate Limit, Theme & Refresh */}
        <div className="flex items-center justify-between h-13 sm:h-14 border-b border-slate-100 dark:border-slate-800/80 gap-2">
          
          {/* Logo & App Name */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-900 dark:from-indigo-600 dark:via-indigo-800 dark:to-slate-900 flex items-center justify-center text-white shadow-xs shrink-0">
              <Github className="w-4 h-4" />
            </div>
            
            <div className="flex items-center space-x-1.5">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                GitStats
              </h1>
              <span className="hidden xs:inline-flex text-indigo-600 dark:text-indigo-400 font-semibold text-[11px] px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/50">
                Analytics
              </span>
              {isSeedData && (
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                  Demo
                </span>
              )}
            </div>
          </div>

          {/* Row 1 Right: API Quota Pill + Theme + Refresh (Always 100% visible on any screen) */}
          <div className="flex items-center space-x-1.5 shrink-0">
            
            {/* API Quota / Rate Limit Button */}
            <button
              id="btn-rate-limit-token"
              onClick={onOpenTokenModal}
              className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors shadow-2xs"
              title={`GitHub API Quota: ${remainingQuota}/${maxQuota} requests remaining`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${remainingQuota > 10 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="font-mono text-slate-700 dark:text-slate-200 font-semibold text-[11px] sm:text-xs">
                {remainingQuota} <span className="text-[10px] text-slate-400 font-normal">req</span>
              </span>
              <Key className={`w-3 h-3 ml-0.5 ${isCustomTokenSet ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle
              theme={theme}
              resolvedTheme={resolvedTheme}
              onThemeChange={onThemeChange}
            />

            {/* Refresh Button */}
            <button
              id="btn-refresh-stats"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200/80 dark:border-slate-700/80 disabled:opacity-50"
              title="Refresh release download counts"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
            </button>
          </div>

        </div>

        {/* ROW 2: Target Repository Link & Action Toolset */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between py-2 gap-2 text-xs">
          
          {/* Target Repo Link */}
          <div className="flex items-center space-x-2 min-w-0 shrink">
            <a
              href={owner && repo ? `https://github.com/${owner}/${repo}` : '#'}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 font-semibold transition-colors bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/90 dark:hover:bg-slate-700/90 px-2.5 py-1 rounded-md border border-slate-200/70 dark:border-slate-700/70 max-w-[150px] xs:max-w-[200px] sm:max-w-none"
              title={owner && repo ? `View ${owner}/${repo} on GitHub` : 'GitHub Repository'}
            >
              <span className="truncate">{owner && repo ? `${owner}/${repo}` : 'Select Repository'}</span>
              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
            </a>
          </div>

                      {/* Action Buttons */}
          <div className="flex items-center space-x-1.5 shrink-0 ml-auto sm:ml-0">
            {!isSearchOpen && (
              <button
                id="btn-switch-repo"
                onClick={() => setIsSearchOpen(true)}
                className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors border border-slate-200/80 dark:border-slate-700 shadow-2xs"
                title="Search User or Owner/Repo"
              >
                <Search className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Search</span>
              </button>
            )}
            
            {/* GitHub Actions Automation Button */}
            <button
              id="btn-github-actions-modal"
              onClick={onOpenActionsModal}
              className="inline-flex items-center space-x-1 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-md transition-colors border border-indigo-200 dark:border-indigo-800/60 shadow-2xs"
              title="Automated sync via GitHub Actions"
            >
              <Workflow className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>Actions</span>
            </button>

            {/* Badges Generator */}
            <button
              id="btn-badges-modal"
              onClick={onOpenBadgeModal}
              className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-colors border border-slate-200 dark:border-slate-700 shadow-2xs"
              title="Get README Badges"
            >
              <Award className="w-3 h-3 text-amber-500" />
              <span>Badges</span>
            </button>
          </div>

        </div>

{/* Dedicated Mobile Search Row (Only visible when active on small screens) */}
        {isSearchOpen && (
          <div className="py-2 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-150 flex items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="flex items-center flex-1">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="owner or owner/repo"
                className="flex-1 px-3 py-1.5 text-xs rounded-l-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono min-h-[38px] touch-manipulation"
                autoFocus
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <button
                type="submit"
                disabled={isFetchingUserRepos}
                className="px-4 py-1.5 text-xs bg-indigo-600 text-white rounded-r-lg font-medium hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 min-h-[38px] touch-manipulation transition-colors shrink-0"
              >
                {isFetchingUserRepos ? '...' : 'Go'}
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="ml-2 p-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 min-h-[38px] min-w-[38px] flex items-center justify-center touch-manipulation shrink-0"
                aria-label="Cancel search"
              >
                ✕
              </button>
            </form>

            {/* If user repos are populated during active search, render dropdown beside mobile search bar */}
            {userRepos.length > 0 && (
              <select
                id="select-user-repo-mobile"
                value={repo}
                onChange={(e) => onChangeRepo(owner, e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[130px] min-h-[38px] touch-manipulation cursor-pointer font-medium shadow-2xs"
                title="Select Public Repository"
              >
                {userRepos.map((r) => (
                  <option key={r.name} value={r.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1">
                    {r.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

      </div>
    </header>
  );
}