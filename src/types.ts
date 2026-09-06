export interface GitHubAsset {
  id: number;
  name: string;
  label: string | null;
  content_type: string;
  size: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  browser_download_url: string;
  os?: 'Android' | 'iOS' | 'HarmonyOS' | 'Windows' | 'macOS' | 'Linux' | 'FreeBSD' | 'Solaris' | 'ChromeOS' | 'Source' | 'Other';
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  html_url: string;
  assets: GitHubAsset[];
  total_downloads: number;
}

export interface GitHubRepoInfo {
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  default_branch: string;
}

export interface DownloadSnapshot {
  id: string;
  timestamp: string; // ISO string
  dateLabel: string; // e.g. "2025-05-10 12:00"
  totalDownloads: number;
  deltaDownloads?: number;
  releaseDownloads: Record<string, number>; // tagName -> count
  assetDownloads: Record<string, number>; // assetName -> count
  osBreakdown: {
    android?: number;
    iOS?: number;
    windows: number;
    macOS: number;
    linux: number;
    source: number;
    other: number;
  };
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
  used: number;
  resource: string;
  lastUpdated: string;
}

export interface PlatformStats {
  name: 'Android' | 'iOS' | 'Windows' | 'macOS' | 'Linux' | 'Source' | 'Other';
  count: number;
  percentage: number;
  color: string;
  iconName: string;
}

export interface TrafficReferrer {
  referrer: string;
  count: number;
  uniques: number;
}

export interface TrafficViewDay {
  timestamp: string;
  count: number;
  uniques: number;
}

export interface TrafficData {
  views: {
    count: number;
    uniques: number;
    views: TrafficViewDay[];
  };
  clones: {
    count: number;
    uniques: number;
    clones: TrafficViewDay[];
  };
  referrers: TrafficReferrer[];
}

export type ThemeMode = 'light' | 'dark' | 'system';
