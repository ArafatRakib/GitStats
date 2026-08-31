import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check, ChevronDown } from 'lucide-react';
import { ThemeMode } from '../types';

interface ThemeToggleProps {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  onThemeChange: (theme: ThemeMode) => void;
}

export function ThemeToggle({ theme, resolvedTheme, onThemeChange }: ThemeToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { mode: ThemeMode; label: string; icon: typeof Sun; subtitle: string }[] = [
    {
      mode: 'light',
      label: 'Light',
      icon: Sun,
      subtitle: 'Classic bright appearance',
    },
    {
      mode: 'dark',
      label: 'Dark',
      icon: Moon,
      subtitle: 'Easy on the eyes',
    },
    {
      mode: 'system',
      label: 'System',
      icon: Laptop,
      subtitle: `Follow OS settings (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`,
    },
  ];

  const CurrentIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Laptop;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        id="btn-theme-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
        title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} (Click to switch)`}
        aria-label="Toggle theme settings"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <CurrentIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span className="hidden sm:inline capitalize font-medium">{theme}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
      </button>

      {/* Theme Selection Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/80 mb-1">
            Appearance
          </div>

          {options.map(({ mode, label, icon: Icon, subtitle }) => {
            const isActive = theme === mode;
            return (
              <button
                key={mode}
                onClick={() => {
                  onThemeChange(mode);
                  setIsOpen(false);
                }}
                className={`w-full flex items-start space-x-2.5 px-3 py-2 text-left text-xs transition-colors ${
                  isActive
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className={`p-1 rounded-md mt-0.5 ${
                  isActive 
                    ? 'bg-indigo-600 text-white dark:bg-indigo-500' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="truncate">{label}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ml-1.5 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal truncate mt-0.5">
                    {subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
