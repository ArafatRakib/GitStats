import { GitHubAsset, GitHubRelease, GitHubRepoInfo, RateLimitInfo, TrafficData } from '../types';

export function detectOS(filename: string): 'Android' | 'iOS' | 'HarmonyOS' | 'Windows' | 'macOS' | 'Linux' | 'FreeBSD' | 'Solaris' | 'ChromeOS' | 'Source' | 'Other' {
  const lower = filename.toLowerCase();
  
  // HarmonyOS detection (.hap, .app, or harmony keywords)
  if (
    lower.endsWith('.hap') ||
    lower.includes('harmonyos') ||
    lower.includes('harmony')
  ) {
    return 'HarmonyOS';
  }

  // Android detection (.apk, .aab, .xapk, or android keywords)
  if (
    lower.endsWith('.apk') ||
    lower.endsWith('.aab') ||
    lower.endsWith('.xapk') ||
    lower.includes('android')
  ) {
    return 'Android';
  }

  // iOS detection (.ipa or ios keywords)
  if (
    lower.endsWith('.ipa') ||
    lower.includes('ios') ||
    lower.includes('iphone') ||
    lower.includes('ipad')
  ) {
    return 'iOS';
  }

  // Windows detection
  if (
    lower.endsWith('.exe') ||
    lower.endsWith('.msi') ||
    lower.endsWith('.msix') ||
    lower.includes('win') ||
    lower.includes('windows')
  ) {
    return 'Windows';
  }

  // macOS detection
  if (
    lower.endsWith('.dmg') ||
    lower.endsWith('.pkg') ||
    lower.includes('mac') ||
    lower.includes('darwin') ||
    lower.includes('osx') ||
    lower.includes('macos')
  ) {
    return 'macOS';
  }

  // FreeBSD / OpenBSD / NetBSD
  if (
    lower.includes('freebsd') ||
    lower.includes('openbsd') ||
    lower.includes('netbsd')
  ) {
    return 'FreeBSD';
  }

  // Solaris / SunOS
  if (
    lower.includes('solaris') ||
    lower.includes('sunos')
  ) {
    return 'Solaris';
  }

  // ChromeOS / ChromiumOS
  if (
    lower.includes('chromeos') ||
    lower.includes('chromiumos') ||
    lower.includes('chromebook')
  ) {
    return 'ChromeOS';
  }

  // Linux detection
  if (
    lower.endsWith('.deb') ||
    lower.endsWith('.rpm') ||
    lower.endsWith('.appimage') ||
    lower.endsWith('.snap') ||
    lower.endsWith('.flatpak') ||
    lower.endsWith('.tar.gz') ||
    lower.endsWith('.tar.xz') ||
    lower.includes('linux') ||
    lower.includes('ubuntu') ||
    lower.includes('arch') ||
    lower.includes('fedora') ||
    lower.includes('alpine')
  ) {
    return 'Linux';
  }

  // Generic Archives & Source
  if (lower.endsWith('.zip') || lower.endsWith('.tar')) {
    if (lower.includes('android')) return 'Android';
    if (lower.includes('harmony')) return 'HarmonyOS';
    if (lower.includes('win')) return 'Windows';
    if (lower.includes('mac') || lower.includes('apple')) return 'macOS';
    if (lower.includes('linux')) return 'Linux';
    return 'Source';
  }

  return 'Other';
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export async function fetchRateLimit(token?: string): Promise<RateLimitInfo> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  const res = await fetch('https://api.github.com/rate_limit', { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch rate limit (${res.status})`);
  }

  const data = await res.json();
  const core = data.resources?.core || {};
  
  return {
    limit: Number(core.limit || (token ? 5000 : 60)),
    remaining: Number(core.remaining || (token ? 5000 : 60)),
    reset: Number(core.reset || Math.floor(Date.now() / 1000) + 3600),
    used: Number(core.used || 0),
    resource: 'core',
    lastUpdated: new Date().toISOString(),
  };
}

export async function fetchGitHubRepo(owner: string, repo: string, token?: string): Promise<{
  repo: GitHubRepoInfo;
  rateLimit: RateLimitInfo;
}> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  
  const rateLimit: RateLimitInfo = {
    limit: Number(res.headers.get('x-ratelimit-limit') || '60'),
    remaining: Number(res.headers.get('x-ratelimit-remaining') || '60'),
    reset: Number(res.headers.get('x-ratelimit-reset') || Math.floor(Date.now() / 1000) + 3600),
    used: Number(res.headers.get('x-ratelimit-used') || '0'),
    resource: res.headers.get('x-ratelimit-resource') || 'core',
    lastUpdated: new Date().toISOString(),
  };

  if (!res.ok) {
    if (res.status === 403 || res.status === 429) {
      throw new Error(`GitHub API rate limit exceeded. Remaining: 0. Reset at ${new Date(rateLimit.reset * 1000).toLocaleTimeString()}`);
    }
    if (res.status === 404) {
      throw new Error(`Repository "${owner}/${repo}" not found or is private.`);
    }
    throw new Error(`GitHub API error (${res.status}): ${res.statusText}`);
  }

  const data = await res.json();
  return { repo: data, rateLimit };
}

export async function fetchUserPublicRepos(
  owner: string,
  token?: string
): Promise<GitHubRepoInfo[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  const res = await fetch(`https://api.github.com/users/${owner}/repos?type=public&sort=updated&per_page=100`, { headers });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`GitHub user "${owner}" not found.`);
    }
    throw new Error(`Failed to fetch public repositories for user "${owner}" (${res.status}): ${res.statusText}`);
  }

  const repos: GitHubRepoInfo[] = await res.json();
  return repos;
}

export async function fetchRepoReferrers(
  owner: string,
  repo: string,
  token?: string
): Promise<{ referrer: string; count: number; uniques: number }[]> {
  if (!token) return [];

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token.trim()}`,
  };

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/traffic/popular/referrers`, { headers });
  if (!res.ok) return [];

  const data = await res.json();
  return Array.isArray(data)
    ? data.map((item: any) => ({
        referrer: item.referrer,
        count: item.count,
        uniques: item.uniques,
      }))
    : [];
}

export async function fetchGitHubReleases(
  owner: string,
  repo: string,
  token?: string
): Promise<{
  releases: GitHubRelease[];
  rateLimit: RateLimitInfo;
}> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=100`, { headers });

  const rateLimit: RateLimitInfo = {
    limit: Number(res.headers.get('x-ratelimit-limit') || '60'),
    remaining: Number(res.headers.get('x-ratelimit-remaining') || '60'),
    reset: Number(res.headers.get('x-ratelimit-reset') || Math.floor(Date.now() / 1000) + 3600),
    used: Number(res.headers.get('x-ratelimit-used') || '0'),
    resource: res.headers.get('x-ratelimit-resource') || 'core',
    lastUpdated: new Date().toISOString(),
  };

  if (!res.ok) {
    if (res.status === 403 || res.status === 429) {
      throw new Error(`GitHub API rate limit exceeded. Add a GitHub Token or deploy via GitHub Actions.`);
    }
    throw new Error(`Failed to fetch releases (${res.status}): ${res.statusText}`);
  }

  const rawReleases = await res.json();
  
  const releases: GitHubRelease[] = rawReleases.map((r: any) => {
    const assets: GitHubAsset[] = (r.assets || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      label: a.label,
      content_type: a.content_type,
      size: a.size,
      download_count: a.download_count || 0,
      created_at: a.created_at,
      updated_at: a.updated_at,
      browser_download_url: a.browser_download_url,
      os: detectOS(a.name),
    }));

    const total_downloads = assets.reduce((sum, asset) => sum + (asset.download_count || 0), 0);

    return {
      id: r.id,
      tag_name: r.tag_name,
      name: r.name || r.tag_name,
      body: r.body,
      draft: r.draft,
      prerelease: r.prerelease,
      created_at: r.created_at,
      published_at: r.published_at || r.created_at,
      html_url: r.html_url,
      assets,
      total_downloads,
    };
  });

  return { releases, rateLimit };
}

// Fallback seed data if the repo is brand new without uploaded binary releases yet or when rate-limited
export function generateSeedReleases(owner: string, repo: string): GitHubRelease[] {
  const isChronoCraft = repo.toLowerCase() === 'chronocraft';
  const baseName = isChronoCraft ? 'ChronoCraft' : repo;

  return [
    {
      id: 101,
      tag_name: 'v1.2.4',
      name: `${baseName} v1.2.4 - Performance & UI Refresh`,
      body: `## What's Changed\n* Added real-time timer sync engine\n* Enhanced dark mode aesthetics\n* Fixed macOS DMG installer signature\n* Memory footprint reduction by 35%`,
      draft: false,
      prerelease: false,
      created_at: '2025-05-18T10:00:00Z',
      published_at: '2025-05-18T12:00:00Z',
      html_url: `https://github.com/${owner}/${repo}/releases/tag/v1.2.4`,
      total_downloads: 1482,
      assets: [
        {
          id: 201,
          name: `${baseName}-Setup-1.2.4.exe`,
          label: 'Windows 64-bit Installer',
          content_type: 'application/x-msdownload',
          size: 64200000,
          download_count: 820,
          created_at: '2025-05-18T10:05:00Z',
          updated_at: '2025-05-18T10:05:00Z',
          browser_download_url: `https://github.com/${owner}/${repo}/releases/download/v1.2.4/${baseName}-Setup-1.2.4.exe`,
          os: 'Windows',
        },
        {
          id: 202,
          name: `${baseName}-1.2.4-arm64.dmg`,
          label: 'macOS Apple Silicon',
          content_type: 'application/x-apple-diskimage',
          size: 78500000,
          download_count: 395,
          created_at: '2025-05-18T10:06:00Z',
          updated_at: '2025-05-18T10:06:00Z',
          browser_download_url: `https://github.com/${owner}/${repo}/releases/download/v1.2.4/${baseName}-1.2.4-arm64.dmg`,
          os: 'macOS',
        },
        {
          id: 203,
          name: `${baseName}-1.2.4.AppImage`,
          label: 'Linux Universal AppImage',
          content_type: 'application/x-executable',
          size: 82100000,
          download_count: 185,
          created_at: '2025-05-18T10:07:00Z',
          updated_at: '2025-05-18T10:07:00Z',
          browser_download_url: `https://github.com/${owner}/${repo}/releases/download/v1.2.4/${baseName}-1.2.4.AppImage`,
          os: 'Linux',
        },
        {
          id: 204,
          name: `${baseName}-1.2.4-portable.zip`,
          label: 'Portable Binary Archive',
          content_type: 'application/zip',
          size: 59300000,
          download_count: 82,
          created_at: '2025-05-18T10:08:00Z',
          updated_at: '2025-05-18T10:08:00Z',
          browser_download_url: `https://github.com/${owner}/${repo}/releases/download/v1.2.4/${baseName}-1.2.4-portable.zip`,
          os: 'Windows',
        },
      ],
    },
    {
      id: 102,
      tag_name: 'v1.2.0',
      name: `${baseName} v1.2.0 - Core Feature Release`,
      body: `## Major Upgrade\n* Multi-timezone scheduling\n* Custom sound triggers\n* Auto-backup configuration`,
      draft: false,
      prerelease: false,
      created_at: '2025-04-10T08:00:00Z',
      published_at: '2025-04-10T09:30:00Z',
      html_url: `https://github.com/${owner}/${repo}/releases/tag/v1.2.0`,
      total_downloads: 3840,
      assets: [
        {
          id: 205,
          name: `${baseName}-Setup-1.2.0.exe`,
          label: 'Windows 64-bit Installer',
          content_type: 'application/x-msdownload',
          size: 63100000,
          download_count: 2210,
          created_at: '2025-04-10T08:10:00Z',
          updated_at: '2025-04-10T08:10:00Z',
          browser_download_url: `https://github.com/${owner}/${repo}/releases/download/v1.2.0/${baseName}-Setup-1.2.0.exe`,
          os: 'Windows',
        },
        {
          id: 206,
          name: `${baseName}-1.2.0.dmg`,
          label: 'macOS Universal DMG',
          content_type: 'application/x-apple-diskimage',
          size: 76800000,
          download_count: 1050,
          created_at: '2025-04-10T08:12:00Z',
          updated_at: '2025-04-10T08:12:00Z',
          browser_download_url: `https://github.com/${owner}/${repo}/releases/download/v1.2.0/${baseName}-1.2.0.dmg`,
          os: 'macOS',
        },
        {
          id: 207,
          name: `${baseName}-1.2.0.deb`,
          label: 'Ubuntu / Debian Package',
          content_type: 'application/vnd.debian.binary-package',
          size: 51200000,
          download_count: 420,
          created_at: '2025-04-10T08:15:00Z',
          updated_at: '2025-04-10T08:15:00Z',
          browser_download_url: `https://github.com/${owner}/${repo}/releases/download/v1.2.0/${baseName}-1.2.0.deb`,
          os: 'Linux',
        },
        {
          id: 208,
          name: `${baseName}-1.2.0.tar.gz`,
          label: 'Linux Source Bundle',
          content_type: 'application/gzip',
          size: 42100000,
          download_count: 160,
          created_at: '2025-04-10T08:18:00Z',
          updated_at: '2025-04-10T08:18:00Z',
          browser_download_url: `https://github.com/${owner}/${repo}/releases/download/v1.2.0/${baseName}-1.2.0.tar.gz`,
          os: 'Linux',
        },
      ],
    },
    {
      id: 103,
      tag_name: 'v1.1.0',
      name: `${baseName} v1.1.0 - Stability & Localization`,
      body: `## Bug Fixes and Enhancements\n* Fixed crash on startup on Windows 10\n* Localization support for 12 languages`,
      draft: false,
      prerelease: false,
      created_at: '2025-02-25T14:00:00Z',
      published_at: '2025-02-25T15:00:00Z',
      html_url: `https://github.com/${owner}/${repo}/releases/tag/v1.1.0`,
      total_downloads: 2750,
      assets: [
        {
          id: 209,
          name: `${baseName}-Setup-1.1.0.exe`,
          label: 'Windows Setup',
          content_type: 'application/x-msdownload',
          size: 61800000,
          download_count: 1690,
          created_at: '2025-02-25T14:05:00Z',
          updated_at: '2025-02-25T14:05:00Z',
          browser_download_url: `https://github.com/${owner}/${repo}/releases/download/v1.1.0/${baseName}-Setup-1.1.0.exe`,
          os: 'Windows',
        },
        {
          id: 210,
          name: `${baseName}-1.1.0.dmg`,
          label: 'macOS DMG',
          content_type: 'application/x-apple-diskimage',
          size: 74200000,
          download_count: 760,
          created_at: '2025-02-25T14:10:00Z',
          updated_at: '2025-02-25T14:10:00Z',
          browser_download_url: `https://github.com/${owner}/${repo}/releases/download/v1.1.0/${baseName}-1.1.0.dmg`,
          os: 'macOS',
        },
        {
          id: 211,
          name: `${baseName}-1.1.0.AppImage`,
          label: 'Linux AppImage',
          content_type: 'application/x-executable',
          size: 79000000,
          download_count: 300,
          created_at: '2025-02-25T14:15:00Z',
          updated_at: '2025-02-25T14:15:00Z',
          browser_download_url: `https://github.com/${owner}/${repo}/releases/download/v1.1.0/${baseName}-1.1.0.AppImage`,
          os: 'Linux',
        },
      ],
    },
    {
      id: 104,
      tag_name: 'v1.0.0',
      name: `${baseName} v1.0.0 - Initial Official Release`,
      body: `## First Public Release!\n* Initial launch of ChronoCraft\n* Precision timekeeping and project chronometer\n* Cross-platform desktop interface`,
      draft: false,
      prerelease: false,
      created_at: '2025-01-15T09:00:00Z',
      published_at: '2025-01-15T11:00:00Z',
      html_url: `https://github.com/${owner}/${repo}/releases/tag/v1.0.0`,
      total_downloads: 1920,
      assets: [
        {
          id: 212,
          name: `${baseName}-Setup-1.0.0.exe`,
          label: 'Windows 64-bit',
          content_type: 'application/x-msdownload',
          size: 58900000,
          download_count: 1240,
          created_at: '2025-01-15T09:05:00Z',
          updated_at: '2025-01-15T09:05:00Z',
          browser_download_url: `https://github.com/${owner}/${repo}/releases/download/v1.0.0/${baseName}-Setup-1.0.0.exe`,
          os: 'Windows',
        },
        {
          id: 213,
          name: `${baseName}-1.0.0.dmg`,
          label: 'macOS Build',
          content_type: 'application/x-apple-diskimage',
          size: 71500000,
          download_count: 490,
          created_at: '2025-01-15T09:10:00Z',
          updated_at: '2025-01-15T09:10:00Z',
          browser_download_url: `https://github.com/${owner}/${repo}/releases/download/v1.0.0/${baseName}-1.0.0.dmg`,
          os: 'macOS',
        },
        {
          id: 214,
          name: `${baseName}-1.0.0.tar.gz`,
          label: 'Linux Tarball',
          content_type: 'application/gzip',
          size: 38200000,
          download_count: 190,
          created_at: '2025-01-15T09:15:00Z',
          updated_at: '2025-01-15T09:15:00Z',
          browser_download_url: `https://github.com/${owner}/${repo}/releases/download/v1.0.0/${baseName}-1.0.0.tar.gz`,
          os: 'Linux',
        },
      ],
    },
  ];
}
