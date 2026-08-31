import { useState } from 'react';
import { 
  Globe, 
  Eye, 
  GitFork, 
  ExternalLink, 
  ShieldAlert, 
  Sparkles, 
  Share2,
  Lock
} from 'lucide-react';
import { TrafficData } from '../types';

interface TrafficSectionProps {
  owner: string;
  repo: string;
  hasToken: boolean;
  onOpenTokenModal: () => void;
}

export function TrafficSection({ owner, repo, hasToken, onOpenTokenModal }: TrafficSectionProps) {
  // Representative / Estimated traffic data
  const sampleReferrers = [
    { source: 'github.com/explore', count: 1840, uniques: 920, percentage: 38 },
    { source: 'google.com', count: 1220, uniques: 810, percentage: 25 },
    { source: 'reddit.com/r/webdev', count: 740, uniques: 520, percentage: 15 },
    { source: 'twitter.com / x.com', count: 480, uniques: 340, percentage: 10 },
    { source: 'producthunt.com', count: 320, uniques: 210, percentage: 7 },
    { source: 'direct / bookmarks', count: 240, uniques: 180, percentage: 5 },
  ];

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
        
        {/* GitHub Traffic API Explanation */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          <div className="flex items-start space-x-2">
            <Share2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">How GitHub Traffic & Referrals Work:</span>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                GitHub maintains a 14-day rolling window of repository view and clone traffic. While public release binary download counts are accessible without authentication, detailed referrer websites and clone logs require a Personal Access Token with repo read scope.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Top Referrers */}
          <div className="lg:col-span-7">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
              <span>Top Traffic Sources & Referrers</span>
              <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500 font-sans">14-day window</span>
            </h4>

            <div className="space-y-2.5">
              {sampleReferrers.map((item) => (
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
                    <div className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full" style={{ width: `${item.percentage * 2}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Geographic Estimates */}
          <div className="lg:col-span-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
              Geographic Region Share
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
          </div>

        </div>

      </div>

    </div>
  );
}
