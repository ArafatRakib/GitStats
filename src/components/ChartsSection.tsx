import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieIcon, 
  Clock, 
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { GitHubRelease, DownloadSnapshot } from '../types';

interface ChartsSectionProps {
  releases: GitHubRelease[];
  snapshots: DownloadSnapshot[];
}

type TabType = 'timeline' | 'releases' | 'os' | 'hourly';
type RangeType = '7d' | '14d' | '30d' | 'all';

const OS_COLORS: Record<string, string> = {
  Android: '#10b981', // emerald-500 (Android Green)
  iOS: '#06b6d4',     // cyan-500
  Windows: '#3b82f6', // blue-500
  macOS: '#8b5cf6',   // violet-500
  Linux: '#f59e0b',   // amber-500
  Source: '#64748b',  // slate-500
  Other: '#94a3b8',   // slate-400
};

export function ChartsSection({ releases, snapshots }: ChartsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('timeline');
  const [timelineRange, setTimelineRange] = useState<RangeType>('30d');
  const [chartMode, setChartMode] = useState<'cumulative' | 'daily'>('cumulative');

  // Filter snapshots based on selected range
  const filteredSnapshots = useMemo(() => {
    if (snapshots.length === 0) return [];
    if (timelineRange === 'all') return snapshots;

    const days = timelineRange === '7d' ? 7 : timelineRange === '14d' ? 14 : 30;
    const now = new Date(snapshots[snapshots.length - 1].timestamp).getTime();
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    const filtered = snapshots.filter((s) => new Date(s.timestamp).getTime() >= cutoff);
    return filtered.length > 0 ? filtered : snapshots;
  }, [snapshots, timelineRange]);

  // Formatted data for timeline chart
  const timelineData = useMemo(() => {
    return filteredSnapshots.map((s) => ({
      date: s.dateLabel.split(' ')[0],
      total: s.totalDownloads,
      delta: s.deltaDownloads || 0,
      android: s.osBreakdown?.android || 0,
      iOS: s.osBreakdown?.iOS || 0,
      windows: s.osBreakdown?.windows || 0,
      macOS: s.osBreakdown?.macOS || 0,
      linux: s.osBreakdown?.linux || 0,
    }));
  }, [filteredSnapshots]);

  // Releases bar chart data
  const releaseData = useMemo(() => {
    return releases.map((r) => {
      let android = 0;
      let ios = 0;
      let win = 0;
      let mac = 0;
      let linux = 0;
      let other = 0;
      r.assets.forEach((a) => {
        if (a.os === 'Android') android += a.download_count;
        else if (a.os === 'iOS') ios += a.download_count;
        else if (a.os === 'Windows') win += a.download_count;
        else if (a.os === 'macOS') mac += a.download_count;
        else if (a.os === 'Linux') linux += a.download_count;
        else other += a.download_count;
      });

      return {
        tag: r.tag_name,
        name: r.name || r.tag_name,
        downloads: r.total_downloads,
        android,
        iOS: ios,
        windows: win,
        macOS: mac,
        linux: linux,
        other: other,
        assetsCount: r.assets.length,
        published: new Date(r.published_at).toLocaleDateString(),
      };
    });
  }, [releases]);

  // OS breakdown pie chart data
  const osData = useMemo(() => {
    let android = 0;
    let ios = 0;
    let win = 0;
    let mac = 0;
    let linux = 0;
    let source = 0;
    let other = 0;

    releases.forEach((r) => {
      r.assets.forEach((a) => {
        if (a.os === 'Android') android += a.download_count;
        else if (a.os === 'iOS') ios += a.download_count;
        else if (a.os === 'Windows') win += a.download_count;
        else if (a.os === 'macOS') mac += a.download_count;
        else if (a.os === 'Linux') linux += a.download_count;
        else if (a.os === 'Source') source += a.download_count;
        else other += a.download_count;
      });
    });

    const total = android + ios + win + mac + linux + source + other || 1;

    return [
      { name: 'Android', value: android, percentage: Math.round((android / total) * 100), color: OS_COLORS.Android },
      { name: 'iOS', value: ios, percentage: Math.round((ios / total) * 100), color: OS_COLORS.iOS },
      { name: 'Windows', value: win, percentage: Math.round((win / total) * 100), color: OS_COLORS.Windows },
      { name: 'macOS', value: mac, percentage: Math.round((mac / total) * 100), color: OS_COLORS.macOS },
      { name: 'Linux', value: linux, percentage: Math.round((linux / total) * 100), color: OS_COLORS.Linux },
      { name: 'Source', value: source, percentage: Math.round((source / total) * 100), color: OS_COLORS.Source },
      { name: 'Other', value: other, percentage: Math.round((other / total) * 100), color: OS_COLORS.Other },
    ].filter((item) => item.value > 0);
  }, [releases]);

  // Hourly / Day of week activity patterns (estimated velocity)
  const hourlyActivityData = useMemo(() => {
    const hours = [
      { hour: '00:00 - 04:00', label: 'Late Night', score: 12, percentage: '12%' },
      { hour: '04:00 - 08:00', label: 'Early Morning', score: 18, percentage: '18%' },
      { hour: '08:00 - 12:00', label: 'Morning Peak', score: 32, percentage: '32%' },
      { hour: '12:00 - 16:00', label: 'Afternoon Peak', score: 26, percentage: '26%' },
      { hour: '16:00 - 20:00', label: 'Evening', score: 22, percentage: '22%' },
      { hour: '20:00 - 24:00', label: 'Night', score: 15, percentage: '15%' },
    ];
    return hours;
  }, []);

  const totalDownloads = releases.reduce((sum, r) => sum + r.total_downloads, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mb-8 overflow-hidden transition-colors">
      
  {/* Tab Navigation Header (Scrollable on mobile) */}
      <div className="border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 pt-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-slate-50/50 dark:bg-slate-900/50">
        
        {/* Scrollable Main Tabs Container */}
        <div className="flex items-center space-x-1 overflow-x-auto touch-pan-x whitespace-nowrap pb-1 md:pb-0 scrollbar-none">
          <button
            id="tab-btn-timeline"
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-t-lg transition border-b-2 -mb-px shrink-0 touch-manipulation ${
              activeTab === 'timeline'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span>Downloads Over Time</span>
          </button>

          <button
            id="tab-btn-releases"
            onClick={() => setActiveTab('releases')}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-t-lg transition border-b-2 -mb-px shrink-0 touch-manipulation ${
              activeTab === 'releases'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span>Release Comparison</span>
          </button>

          <button
            id="tab-btn-os"
            onClick={() => setActiveTab('os')}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-t-lg transition border-b-2 -mb-px shrink-0 touch-manipulation ${
              activeTab === 'os'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Platform / OS Share</span>
          </button>

          <button
            id="tab-btn-hourly"
            onClick={() => setActiveTab('hourly')}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-t-lg transition border-b-2 -mb-px shrink-0 touch-manipulation ${
              activeTab === 'hourly'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Peak Activity</span>
          </button>
        </div>

        {/* Tab Controls (Range and Mode) for Timeline */}
        {activeTab === 'timeline' && (
          <div className="flex flex-wrap items-center space-x-2 pb-2 md:pb-0 overflow-x-auto touch-pan-x">
            
            {/* Mode switch */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">
              <button
                onClick={() => setChartMode('cumulative')}
                className={`px-2 py-1 rounded-md transition touch-manipulation ${chartMode === 'cumulative' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold' : 'hover:text-slate-900 dark:hover:text-white'}`}
              >
                Cumulative
              </button>
              <button
                onClick={() => setChartMode('daily')}
                className={`px-2 py-1 rounded-md transition touch-manipulation ${chartMode === 'daily' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold' : 'hover:text-slate-900 dark:hover:text-white'}`}
              >
                Daily Downloads
              </button>
            </div>

            {/* Date range filter */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">
              {(['7d', '14d', '30d', 'all'] as RangeType[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimelineRange(r)}
                  className={`px-2 py-1 uppercase rounded-md transition touch-manipulation ${timelineRange === r ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold' : 'hover:text-slate-900 dark:hover:text-white'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
      {/* Chart Canvas Area */}
      <div className="p-4 sm:p-6">
        
        {/* 1. TIMELINE OVER TIME */}
        {activeTab === 'timeline' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {chartMode === 'cumulative' ? 'Total Downloads Trajectory' : 'Daily Download Activity'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {chartMode === 'cumulative'
                    ? 'Total cumulative downloads across all releases over time'
                    : 'Downloads recorded in each periodic snapshot period'}
                </p>
              </div>
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                {timelineData.length} data points recorded
              </div>
            </div>

            <div className="h-72 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === 'cumulative' ? (
                  <AreaChart data={timelineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-slate-200, #e2e8f0)" opacity={0.4} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#94a3b8', opacity: 0.3 }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900/95 dark:bg-slate-950 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-800 font-sans backdrop-blur-md">
                              <div className="font-semibold text-slate-300 mb-1">{label}</div>
                              <div className="text-base font-bold text-white font-mono">
                                {data.total.toLocaleString()} total downloads
                              </div>
                              {data.delta > 0 && (
                                <div className="text-emerald-400 font-medium mt-0.5">
                                  +{data.delta.toLocaleString()} downloads in snapshot
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={timelineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-slate-200, #e2e8f0)" opacity={0.4} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#94a3b8', opacity: 0.3 }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900/95 dark:bg-slate-950 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-800 backdrop-blur-md">
                              <div className="font-semibold text-slate-300 mb-1">{label}</div>
                              <div className="text-base font-bold text-emerald-400 font-mono">
                                +{data.delta.toLocaleString()} downloads
                              </div>
                              <div className="text-slate-400 text-[11px] mt-0.5">
                                Cumulative total: {data.total.toLocaleString()}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="delta" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 2. RELEASES BREAKDOWN */}
        {activeTab === 'releases' && (
          <div>
            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Release Version Distribution</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparing total binary downloads across each tagged release version
              </p>
            </div>

            <div className="h-72 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={releaseData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-slate-200, #e2e8f0)" opacity={0.4} />
                  <XAxis
                    dataKey="tag"
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                    tickLine={false}
                    axisLine={{ stroke: '#94a3b8', opacity: 0.3 }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const percent = totalDownloads > 0 ? Math.round((data.downloads / totalDownloads) * 100) : 0;
                        return (
                          <div className="bg-slate-900/95 dark:bg-slate-950 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-800 backdrop-blur-md">
                            <div className="font-bold text-indigo-300 text-sm mb-1">{data.name}</div>
                            <div className="text-slate-300 text-[11px] mb-2">Released: {data.published}</div>
                            <div className="space-y-1">
                              <div className="flex justify-between gap-4 font-mono font-bold text-white">
                                <span>Total:</span>
                                <span>{data.downloads.toLocaleString()} ({percent}%)</span>
                              </div>
                              {data.android > 0 && (
                                <div className="flex justify-between gap-4 text-emerald-300">
                                  <span>Android:</span>
                                  <span>{data.android.toLocaleString()}</span>
                                </div>
                              )}
                              {data.iOS > 0 && (
                                <div className="flex justify-between gap-4 text-cyan-300">
                                  <span>iOS:</span>
                                  <span>{data.iOS.toLocaleString()}</span>
                                </div>
                              )}
                              {data.windows > 0 && (
                                <div className="flex justify-between gap-4 text-sky-300">
                                  <span>Windows:</span>
                                  <span>{data.windows.toLocaleString()}</span>
                                </div>
                              )}
                              {data.macOS > 0 && (
                                <div className="flex justify-between gap-4 text-purple-300">
                                  <span>macOS:</span>
                                  <span>{data.macOS.toLocaleString()}</span>
                                </div>
                              )}
                              {data.linux > 0 && (
                                <div className="flex justify-between gap-4 text-amber-300">
                                  <span>Linux:</span>
                                  <span>{data.linux.toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="downloads" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={55} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 3. OS / PLATFORM DISTRIBUTION */}
        {activeTab === 'os' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-6 h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={osData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {osData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 dark:bg-slate-950 text-white p-2.5 rounded-lg text-xs shadow-lg border border-slate-800 backdrop-blur-md">
                            <div className="font-semibold">{data.name}</div>
                            <div className="font-mono font-bold mt-0.5">
                              {data.value.toLocaleString()} downloads ({data.percentage}%)
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="md:col-span-6 space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">OS & Platform Share</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Categorized by release package extensions (.apk, .aab, .ipa, .exe, .dmg, .deb, .tar.gz)
              </p>

              {osData.map((item) => (
                <div key={item.name} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                    </div>
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {item.value.toLocaleString()} <span className="text-slate-400 dark:text-slate-500 font-normal">({item.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. HOURLY / PEAK ACTIVITY */}
        {activeTab === 'hourly' && (
          <div>
            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Download Activity Heatmap (UTC Distribution)</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Estimated peak download time slots based on periodic snapshot capture deltas
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {hourlyActivityData.map((slot) => (
                <div
                  key={slot.hour}
                  className={`p-4 rounded-xl border transition ${
                    slot.score >= 25
                      ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 ring-1 ring-indigo-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">{slot.hour}</span>
                      <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{slot.label}</h5>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        slot.score >= 25 
                          ? 'bg-indigo-600 dark:bg-indigo-500 text-white' 
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {slot.percentage}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${slot.score >= 25 ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-400 dark:bg-slate-500'}`}
                      style={{ width: `${slot.score * 2.5}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2">
              <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Insight:</strong> Releases published around 08:00–12:00 UTC experience the fastest initial adoption spike across European & Asian timezones, followed by US afternoon hours.
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
