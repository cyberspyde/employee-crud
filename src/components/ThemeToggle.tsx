import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition-all hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10"
      aria-label={theme === 'dark' ? 'Yorug\' rejimga o\'tish' : 'Qorong\'u rejimga o\'tish'}
      title={theme === 'dark' ? 'Yorug\' rejimga o\'tish' : 'Qorong\'u rejimga o\'tish'}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
