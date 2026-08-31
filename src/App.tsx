/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  fetchGitHubReleases, 
  fetchGitHubRepo, 
  fetchRateLimit,
  fetchUserPublicRepos,
  generateSeedReleases 
} from './services/githubApi';
import { 
  loadPersonalToken, 
  savePersonalToken, 
  loadSnapshots, 
  recordNewSnapshot 
} from './services/storage';
import { GitHubRelease, GitHubRepoInfo, RateLimitInfo, DownloadSnapshot } from './types';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header';
import { OverviewCards } from './components/OverviewCards';
import { ChartsSection } from './components/ChartsSection';
import { ReleaseList } from './components/ReleaseList';
import { HistoryLogTable } from './components/HistoryLogTable';
import { TrafficSection } from './components/TrafficSection';
import { RateLimitBanner } from './components/RateLimitBanner';
import { GithubActionsModal } from './components/GithubActionsModal';
import { BadgeGeneratorModal } from './components/BadgeGeneratorModal';
import { AlertCircle, RefreshCw, Sparkles, Workflow, ExternalLink } from 'lucide-react';

export default function App() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [token, setToken] = useState<string>(() => loadPersonalToken());

  const [repoInfo, setRepoInfo] = useState<GitHubRepoInfo | null>(null);
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [snapshots, setSnapshots] = useState<DownloadSnapshot[]>([]);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  
  const [userRepos, setUserRepos] = useState<GitHubRepoInfo[]>([]);
  const [isFetchingUserRepos, setIsFetchingUserRepos] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSeedData, setIsSeedData] = useState(false);

  // Modals state
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);

    const refreshRateLimit = useCallback(async (userToken?: string) => {
    try {
      const rl = await fetchRateLimit(userToken);
      setRateLimit(rl);
    } catch (err) {
      console.warn('Rate limit fetch notice:', err);
    }
  }, []);

  const loadData = useCallback(async (targetOwner: string, targetRepo: string, userToken?: string) => {
    setIsLoading(true);
    setError(null);

    // Always keep rate limits synchronized with latest token state
    refreshRateLimit(userToken);

    if (!targetOwner || !targetRepo) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch Repository Details
      try {
        const { repo: info, rateLimit: rl } = await fetchGitHubRepo(targetOwner, targetRepo, userToken);
        setRepoInfo(info);
        setRateLimit(rl);
      } catch (err: any) {
        console.warn('Repo fetch notice:', err.message);
      }
      
      // 2. Fetch Releases
      const { releases: fetchedReleases, rateLimit: rl2 } = await fetchGitHubReleases(targetOwner, targetRepo, userToken);
      setRateLimit(rl2);

      if (fetchedReleases.length > 0) {
        setReleases(fetchedReleases);
        setIsSeedData(false);
        const { snapshots: updatedSnapshots } = recordNewSnapshot(targetOwner, targetRepo, fetchedReleases);
        setSnapshots(updatedSnapshots);
      } else {
        // Repository has no binary releases yet - show realistic simulated baseline for ChronoCraft
        const seed = generateSeedReleases(targetOwner, targetRepo);
        setReleases(seed);
        setIsSeedData(true);
        const { snapshots: updatedSnapshots } = recordNewSnapshot(targetOwner, targetRepo, seed);
        setSnapshots(updatedSnapshots);
      }
    } catch (err: any) {
      console.error('Data fetch error, activating offline seed preview:', err.message);
      setError(err.message);
      
      // Load seed preview so user immediately experiences full charts and features
      const seed = generateSeedReleases(targetOwner, targetRepo);
      setReleases(seed);
      setIsSeedData(true);
      const { snapshots: updatedSnapshots } = recordNewSnapshot(targetOwner, targetRepo, seed);
      setSnapshots(updatedSnapshots);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(owner, repo, token);
  }, [owner, repo, token, loadData]);

  const handleSaveToken = async (newToken: string): Promise<boolean> => {
    savePersonalToken(newToken);
    setToken(newToken);
    
    try {
      const rl = await fetchRateLimit(newToken);
      setRateLimit(rl);
      if (owner && repo) {
        loadData(owner, repo, newToken);
      }
      
      // If token is valid and increases quota beyond default unauthenticated limit (60)
      if (rl.limit > 60) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };
  
  const handleChangeRepo = (newOwner: string, newRepo: string) => {
    setOwner(newOwner);
    setRepo(newRepo);
  };

  const handleUserLookup = async (username: string) => {
    setIsFetchingUserRepos(true);
    try {
      const publicRepos = await fetchUserPublicRepos(username, token);
      setUserRepos(publicRepos);
      if (publicRepos.length > 0) {
        setOwner(username);
        setRepo(publicRepos[0].name);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsFetchingUserRepos(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      
      {/* Navigation Header */}
      <Header
        owner={owner}
        repo={repo}
        userRepos={userRepos}
        isFetchingUserRepos={isFetchingUserRepos}
        repoInfo={repoInfo}
        rateLimit={rateLimit}
        isLoading={isLoading}
        onRefresh={() => loadData(owner, repo, token)}
        onChangeRepo={handleChangeRepo}
        onUserLookup={handleUserLookup}
        onOpenActionsModal={() => setIsActionsModalOpen(true)}
        onOpenBadgeModal={() => setIsBadgeModalOpen(true)}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
        isCustomTokenSet={Boolean(token)}
        isSeedData={isSeedData}
        theme={theme}
        resolvedTheme={resolvedTheme}
        onThemeChange={setTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Prominent Active Repository Name Header */}
        {owner && repo && (
          <div className="mb-6 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 min-w-0">
              {repoInfo?.owner.avatar_url ? (
                <img
                  src={repoInfo.owner.avatar_url}
                  alt={owner}
                  className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-mono font-bold shrink-0">
                  {owner.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono truncate">
                    {owner} / {repo}
                  </h2>
                </div>
                {repoInfo?.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-2xl">
                    {repoInfo.description}
                  </p>
                )}
              </div>
            </div>

            <a
              href={`https://github.com/${owner}/${repo}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition border border-slate-200 dark:border-slate-700 shrink-0 self-start sm:self-auto"
            >
              <span>View on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        )}

        {/* Seed Data / Rate Limit Warning Banner if active */}
        {isSeedData && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent dark:from-amber-500/15 dark:via-indigo-500/15 dark:to-transparent border border-amber-200/80 dark:border-amber-700/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100">
                  {error ? 'GitHub API Limit / Standalone Mode' : 'Live Preview & Metrics Seed'}
                </h4>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  {error
                    ? `Showing simulated download trajectory for ${owner}/${repo}. Add your GitHub Token or deploy via GitHub Actions for live unthrottled sync.`
                    : `Displaying baseline metrics for ${owner}/${repo}. Once your GitHub Actions workflow records live snapshots, real historical delta points will append automatically.`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setIsActionsModalOpen(true)}
                className="px-3 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg transition shadow-xs flex items-center space-x-1.5"
              >
                <Workflow className="w-3.5 h-3.5" />
                <span>Deploy Workflow</span>
              </button>
            </div>
          </div>
        )}

        {/* 1. High-Level Metrics Summary */}
        <OverviewCards
          releases={releases}
          snapshots={snapshots}
          repoInfo={repoInfo}
          owner={owner}
          repo={repo}
        />


        {/* 2. Interactive Charts Section */}
        <ChartsSection releases={releases} snapshots={snapshots} />

        {/* 3. Detailed Release Breakdown with Individual Binaries */}
        <ReleaseList releases={releases} />

        {/* 4. Periodic Snapshot Historical Database & Logs */}
        <HistoryLogTable
          owner={owner}
          repo={repo}
          snapshots={snapshots}
          currentReleases={releases}
          onSnapshotsUpdated={(updated) => setSnapshots(updated)}
        />

        {/* 5. Traffic, Geographic & Referrals Deep-Dive */}
        <TrafficSection
          owner={owner}
          repo={repo}
          hasToken={Boolean(token)}
          onOpenTokenModal={() => setIsTokenModalOpen(true)}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">GitStats Release Tracker</span>
            {owner && repo && (
              <>
                <span>•</span>
                <a
                  href={`https://github.com/${owner}/${repo}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-mono"
                >
                  github.com/{owner}/{repo}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </>
            )}
          </div>


          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsActionsModalOpen(true)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              GitHub Actions Workflow
            </button>
            <button
              onClick={() => setIsBadgeModalOpen(true)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              README Badges
            </button>
            <button
              onClick={() => setIsTokenModalOpen(true)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              Rate Limits & Token
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <RateLimitBanner
        rateLimit={rateLimit}
        token={token}
        onSaveToken={handleSaveToken}
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
      />

      <GithubActionsModal
        owner={owner}
        repo={repo}
        isOpen={isActionsModalOpen}
        onClose={() => setIsActionsModalOpen(false)}
      />

      <BadgeGeneratorModal
        owner={owner}
        repo={repo}
        releases={releases}
        isOpen={isBadgeModalOpen}
        onClose={() => setIsBadgeModalOpen(false)}
      />

    </div>
  );
}
