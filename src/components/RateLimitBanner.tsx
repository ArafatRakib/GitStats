import { useState, useEffect, FormEvent } from 'react';
import { ShieldCheck, Info, Key, CheckCircle, AlertTriangle, Sparkles, X } from 'lucide-react';
import { RateLimitInfo } from '../types';

interface RateLimitBannerProps {
  rateLimit: RateLimitInfo | null;
  token: string;
  onSaveToken: (token: string) => Promise<boolean>;
  isOpen: boolean;
  onClose: () => void;
}

export function RateLimitBanner({
  rateLimit,
  token,
  onSaveToken,
  isOpen,
  onClose,
}: RateLimitBannerProps) {
  const [inputToken, setInputToken] = useState(token);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setInputToken(token);
    setErrorMessage(null);
  }, [token, isOpen]);

  if (!isOpen) return null;

  const remaining = rateLimit?.remaining ?? 60;
  const limit = rateLimit?.limit ?? 60;
  const percent = Math.round((remaining / limit) * 100);
  const resetDate = rateLimit ? new Date(rateLimit.reset * 1000).toLocaleTimeString() : 'In 1 hour';

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsValidating(true);

    try {
      const isValidAndUpgraded = await onSaveToken(inputToken);
      if (isValidAndUpgraded) {
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          onClose();
        }, 800);
      } else {
        setErrorMessage('Token could not be verified or did not grant elevated rate limits (expected 5,000/hr). Please check token scopes and expiration.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to validate GitHub token.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    setInputToken('');
    onSaveToken('');
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-150 transition-colors flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Sticky Header with Close Button */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-t-2xl sticky top-0 z-20 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Key className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">API Rate Limit & Token</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 hidden xs:block">Manage your GitHub Personal Access Token</p>
            </div>
          </div>

          <button
            id="btn-close-token-modal"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 shrink-0 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">

        {/* Rate limit status meter */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 mb-5">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Remaining Request Quota</span>
            <span className="font-mono text-slate-900 dark:text-white font-bold">{remaining} / {limit} calls</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                percent > 40 ? 'bg-emerald-500' : percent > 15 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            <span>Reset schedule: {resetDate}</span>
            <span>{limit === 60 ? 'Unauthenticated (60/hr)' : 'Authenticated (5,000/hr)'}</span>
          </div>
        </div>

        {/* Safe Architecture Explanation */}
        <div className="mb-5 space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 dark:text-slate-200">100% Rate-Limit Proof Architecture:</strong>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                By setting up the free <strong>GitHub Actions Workflow</strong>, the cron job updates your download history JSON file on a scheduled timer. The web app then loads the static file directly with <strong>zero API calls</strong> and zero risk of hitting limits.
              </p>
            </div>
          </div>
        </div>

        {/* Optional PAT Input Form */}
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Optional: Personal Access Token (PAT)
            </label>
            <input
              id="input-github-token"
              type="password"
              value={inputToken}
              onChange={(e) => {
                setInputToken(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_..."
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Stored <em>only</em> in your browser's local memory. Upgrades rate limit to 5,000 requests/hour and unlocks GitHub Traffic API (clones, views).
            </p>
          </div>

          {/* Error / Validation Warning Banner */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start space-x-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {token ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-medium"
              >
                Clear Saved Token
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 dark:text-slate-500">No token required for public repos</span>
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              
               <button
                id="btn-save-token"
                type="submit"
                disabled={isValidating}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
              >
                {isValidating ? (
                  <span>Validating...</span>
                ) : savedSuccess ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Validated!</span>
                  </>
                ) : (
                  <span>Save Token</span>
                )}
              </button>   
            </div>
          </div>
        </form>

        </div>

      </div>
    </div>
  );
}
