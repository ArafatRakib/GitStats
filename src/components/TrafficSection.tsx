import { useState, useEffect } from 'react';
import { 
  Globe, 
  Eye, 
  GitFork, 
  ExternalLink, 
  ShieldAlert, 
  Sparkles, 
  Share2,
  Lock,
  Info
} from 'lucide-react';
import { TrafficReferrer } from '../types';
import { fetchRepoReferrers } from '../services/githubApi';

interface TrafficSectionProps {
  owner: string;
  repo: string;
  hasToken: boolean;
  onOpenTokenModal: () => void;
}

export function TrafficSection({ owner, repo, hasToken, onOpenTokenModal }: TrafficSectionProps) {
  const [liveReferrers, setLiveReferrers] = useState<TrafficReferrer[]>([]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (owner && repo && hasToken) {
      const token = localStorage.getItem('chronocraft_gh_pat') || '';
      fetchRepoReferrers(owner, repo, token).then((data) => {
        if (isMounted) {
          if (data.length > 0) {
            setLiveReferrers(data);
            setIsLive(true);
          } else {
            setIsLive(false);
          }
        }
      });
    } else {
      setIsLive(false);
    }
    return () => {
      isMounted = false;
    };
  }, [owner, repo, hasToken]);

  // Representative / Estimated sample traffic data when live API data is restricted
  const sampleReferrers = [
    { source: 'github.com/explore', count: 1840, uniques: 920, percentage: 38 },
    { source: 'google.com', count: 1220, uniques: 810, percentage: 25 },
    { source: 'reddit.com/r/webdev', count: 740, uniques: 520, percentage: 15 },
    { source: 'twitter.com / x.com', count: 480, uniques: 340, percentage: 10 },
    { source: 'producthunt.com', count: 320, uniques: 210, percentage: 7 },
    { source: 'direct / bookmarks', count: 240, uniques: 180, percentage: 5 },
  ];

  const displayReferrers = isLive
    ? liveReferrers.map((r) => {
        const total = liveReferrers.reduce((s, item) => s + item.count, 0) || 1;
        return {
          source: r.referrer,
          count: r.count,
          uniques: r.uniques,
          percentage: Math.round((r.count / total) * 100),
        };
      })
    : sampleReferrers;

  const sampleRegions = [
    { region: 'United States & Canada', percentage: 42, icon: '🇺🇸 / 🇨🇦', trend: '+18%' },
    { region: 'European Union & UK', percentage: 28, icon: '🇪🇺 / 🇬🇧', trend: '+12%' },
    { region: 'Asia & Pacific (IN, JP, BD, SG)', percentage: 20, icon: '🌏', trend: '+25%' },
    { region: 'Latin America & Other', percentage: 10, icon: '🌎', trend: '+8%' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mb-8 overflow-hidden transition-colors">
      
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Traffic Referrers & Geographic Distribution</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Discover where users discover {repo || 'your repository'} and download your releases
          </p>
        </div>

        {!hasToken && (
          <button
            onClick={onOpenTokenModal}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition border border-indigo-200 dark:border-indigo-800 self-start sm:self-auto"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Connect Token for Live Traffic API</span>
          </button>
        )}
      </div>

      <div className="p-4 sm:p-6">
        

        {/* Intuitive Traffic Access Level Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-700/60">
            <div className="flex items-center space-x-2">
              <Share2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="font-bold text-slate-900 dark:text-white">Understanding Traffic Data Access</span>
            </div>

            {!hasToken && (
              <button
                onClick={onOpenTokenModal}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition border border-indigo-200 dark:border-indigo-800 shrink-0 self-start sm:self-auto"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Connect Owner Token</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {/* Without PAT Mode */}
            <div className={`p-3 rounded-lg border transition ${!hasToken ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60' : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'}`}>
              <div className="flex items-center space-x-1.5 font-bold text-slate-800 dark:text-slate-200 mb-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span>Public Mode (Without PAT)</span>
              </div>
              <ul className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed pl-3.5 list-disc">
                <li>Release download totals & asset counts are <strong>100% live</strong>.</li>
                <li>Geographic & traffic referrers show <strong>sample data</strong> due to GitHub privacy restrictions.</li>
              </ul>
            </div>

            {/* With PAT Mode */}
            <div className={`p-3 rounded-lg border transition ${hasToken ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60' : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'}`}>
              <div className="flex items-center space-x-1.5 font-bold text-slate-800 dark:text-slate-200 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Authenticated Mode (With PAT)</span>
              </div>
              <ul className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed pl-3.5 list-disc">
                <li>Unlocks <strong>live 14-day referrer websites</strong> for repos you own or collaborate on.</li>
                <li>Increases API quota from 60 to <strong>5,000 requests/hour</strong>.</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">         
          {/* Top Referrers */}
          <div className="lg:col-span-7">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>Top Traffic Sources & Referrers</span>
                {isLive ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Live Data
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
                    Sample Data
                  </span>
                )}
              </span>
              <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500 font-sans">14-day window</span>
            </h4>

            <div className="space-y-2.5">
              {displayReferrers.map((item) => (
                <div key={item.source} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>{item.source}</span>
                    </div>
                    <div className="font-mono text-slate-900 dark:text-slate-100 font-bold">
                      {item.count.toLocaleString()} views <span className="text-slate-400 dark:text-slate-500 font-normal text-[11px]">({item.uniques} unique)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, item.percentage * 2)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Geographic Estimates */}
          <div className="lg:col-span-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
              <span>Geographic Region Share</span>
              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 font-sans normal-case bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                All GitHub (Estimated)
              </span>
            </h4>

            <div className="space-y-3">
              {sampleRegions.map((region) => (
                <div key={region.region} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-2xs">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="text-sm">{region.icon}</span>
                      <span>{region.region}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{region.percentage}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                    <span>Adoption growth</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{region.trend}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-2.5 text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
              * Note: GitHub does not track or expose geographic IP locations for any repository. These figures reflect estimated global open-source developer demographic distribution.
            </p>
          </div>


        </div>

      </div>

    </div>
  );
}
