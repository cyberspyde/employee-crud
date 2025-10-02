import { Users, Search, Plus, Settings, Home } from 'lucide-react';
import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Asosiy', icon: Home },
  { id: 'employees', label: 'Xodimlar', icon: Users },
  { id: 'search', label: 'Qidiruv', icon: Search },
  { id: 'add', label: "Xodim qo'shish", icon: Plus },
  { id: 'settings', label: 'Sozlamalar', icon: Settings },
];

export default function Layout({ children, currentView, onViewChange }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.12),_transparent_55%)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 shadow-lg shadow-blue-500/40">
              <Users className="h-5 w-5 text-white" />
            </span>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">Xodimlar bazasi</h1>
              <p className="text-xs text-slate-300">Jamoangizni tez toping va boshqaring</p>
            </div>
          </div>

          <div className="flex items-center space-x-5">
            <div className="hidden items-center space-x-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 sm:flex">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-300">•</span>
              <span>Ma'lumotlar sinxronizatsiya qilingan</span>
            </div>
            <button
              type="button"
              className="flex items-center space-x-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-100 shadow-lg shadow-blue-500/10 transition hover:border-blue-500/50 hover:bg-blue-500/10"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/80 to-indigo-500/90 text-white">A</span>
              <span className="hidden sm:inline">Administrator</span>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="mx-auto w-full max-w-7xl px-4 pb-3 sm:px-6 lg:hidden lg:px-8">
          <div className="flex gap-2 overflow-x-auto pt-2">
            {NAV_ITEMS.map(({ id, label }) => {
              const isActive = currentView === id;
              return (
                <button
                  key={id}
                  onClick={() => onViewChange(id)}
                  className={`flex shrink-0 items-center rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'border-white/40 bg-white/10 text-white shadow-inner shadow-blue-500/30'
                      : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="relative z-10 flex">
        {/* Sidebar */}
        <aside className="hidden border-r border-white/5 bg-slate-950/60 backdrop-blur-xl lg:flex lg:w-72">
          <div className="flex h-[calc(100vh-4rem)] w-full flex-col justify-between px-4 py-6">
            <nav className="space-y-1">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400/80">Navigatsiya</p>
              <div className="space-y-2 pt-2">
                {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
                  const isActive = currentView === id;
                  return (
                    <button
                      key={id}
                      onClick={() => onViewChange(id)}
                      className={`group flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600/70 via-indigo-600/70 to-cyan-500/70 text-white shadow-[0_10px_30px_-12px_rgba(59,130,246,0.55)]'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center space-x-3">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${isActive ? 'border-white/40 bg-white/15' : 'border-white/10 bg-white/5 group-hover:border-white/30 group-hover:bg-white/10'}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-medium">{label}</span>
                      </span>
                      {isActive && <span className="h-2 w-2 rounded-full bg-cyan-300" />}
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-200">
              <h3 className="text-sm font-semibold text-white">Yordam kerakmi?</h3>
              <p className="mt-2 text-xs text-slate-300/90">
                O&apos;quv qo&apos;llanmalarini oching va tezkor klavishlar yordamida jarayonni tezlashtiring.
              </p>
              <button
                type="button"
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-sky-200 transition hover:bg-white/20"
              >
                Qo&apos;llanmani ko&apos;rish
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
