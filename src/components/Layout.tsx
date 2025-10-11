import { Users, Search, Plus, Settings, Home, Menu, X, GitBranch } from "lucide-react";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import DatabaseStatus from "./DatabaseStatus";

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Asosiy", icon: Home },
  { id: "employees", label: "Xodimlar", icon: Users },
  { id: "search", label: "Qidiruv", icon: Search },
  { id: "add", label: "Xodim qo'shish", icon: Plus },
  { id: "departments", label: "Bo'limlar", icon: GitBranch },
  { id: "settings", label: "Sozlamalar", icon: Settings },
];

export default function Layout({
  children,
  currentView,
  onViewChange,
}: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleViewChange = (view: string) => {
    onViewChange(view);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <div className="pointer-events-none fixed inset-0 opacity-30 dark:opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.06),_transparent_55%)] dark:bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.12),_transparent_55%)]" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-xl dark:border-white/5 dark:bg-slate-950/80 transition-colors"
      >
        <div className="mx-auto flex h-16 w-full max-w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            {/* Menu Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-cyan-400/10 hover:from-blue-500/20 hover:via-indigo-500/20 hover:to-cyan-400/20 dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-cyan-400/20 dark:hover:from-blue-500/30 dark:hover:via-indigo-500/30 dark:hover:to-cyan-400/30 transition-all"
            >
              <AnimatePresence mode="wait">
                {isSidebarOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-5 w-5 text-gray-700 dark:text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-5 w-5 text-gray-700 dark:text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: 0.1,
              }}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 shadow-lg shadow-blue-500/20 dark:shadow-blue-500/40"
            >
              <Users className="h-5 w-5 text-white" />
            </motion.span>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                Xodimlar bazasi
              </h1>
              <p className="text-xs text-gray-600 dark:text-slate-300">
                Jamoangizni tez toping va boshqaring
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center space-x-3"
          >
            <DatabaseStatus />
            <ThemeToggle />
          </motion.div>
        </div>

        {/* Mobile nav (only visible on mobile when sidebar is closed) */}
        <AnimatePresence>
          {!isSidebarOpen && isMobile && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mx-auto w-full max-w-7xl px-4 overflow-hidden lg:hidden"
            >
              <div className="flex gap-2 overflow-x-auto py-3">
                {NAV_ITEMS.map(({ id, label }, index) => {
                  const isActive = currentView === id;
                  return (
                    <motion.button
                      key={id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleViewChange(id)}
                      className={`flex shrink-0 items-center rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                        isActive
                          ? "border-blue-300 bg-blue-100 text-blue-900 shadow-inner shadow-blue-500/20 dark:border-white/40 dark:bg-white/10 dark:text-white dark:shadow-blue-500/30"
                          : "border-gray-300 bg-gray-100 text-gray-700 hover:border-gray-400 hover:bg-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/25 dark:hover:text-white"
                      }`}
                    >
                      {label}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <div className="relative z-10 flex">
        {/* Animated Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* Mobile overlay */}
              {isMobile && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
                />
              )}

              {/* Sidebar */}
              <motion.aside
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className={`${
                  isMobile ? "fixed" : "relative"
                } z-40 h-[calc(100vh-4rem)] w-72 border-r border-gray-200 bg-white/90 backdrop-blur-xl dark:border-white/5 dark:bg-slate-950/90 transition-colors`}
              >
                <div className="flex h-full w-full flex-col justify-between px-4 py-6">
                  <nav className="space-y-1">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400/80"
                    >
                      Navigatsiya
                    </motion.p>
                    <div className="space-y-2 pt-2">
                      {NAV_ITEMS.map(({ id, label, icon: Icon }, index) => {
                        const isActive = currentView === id;
                        return (
                          <motion.button
                            key={id}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{
                              delay: 0.1 + index * 0.05,
                              type: "spring",
                              stiffness: 100,
                            }}
                            whileHover={{ scale: 1.02, x: 5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleViewChange(id)}
                            className={`group flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left transition-all duration-200 ${
                              isActive
                                ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 text-white shadow-[0_10px_30px_-12px_rgba(59,130,246,0.3)] dark:from-blue-600/70 dark:via-indigo-600/70 dark:to-cyan-500/70 dark:shadow-[0_10px_30px_-12px_rgba(59,130,246,0.55)]"
                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                            }`}
                          >
                            <span className="flex items-center space-x-3">
                              <motion.span
                                animate={
                                  isActive
                                    ? { rotate: [0, 360], scale: [1, 1.1, 1] }
                                    : {}
                                }
                                transition={{ duration: 0.5 }}
                                className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                                  isActive
                                    ? "border-white/60 bg-white/30 dark:border-white/40 dark:bg-white/15"
                                    : "border-gray-300 bg-gray-50 group-hover:border-gray-400 group-hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:group-hover:border-white/30 dark:group-hover:bg-white/10"
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </motion.span>
                              <span className="text-sm font-medium">
                                {label}
                              </span>
                            </span>
                            {isActive && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                                className="h-2 w-2 rounded-full bg-cyan-300"
                              />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </nav>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="rounded-2xl border border-gray-300 bg-gray-50 p-4 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 transition-colors"
                  >
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Yordam kerakmi?
                    </h3>
                    <p className="mt-2 text-xs text-gray-600 dark:text-slate-300/90">
                      O&apos;quv qo&apos;llanmalarini oching va tezkor
                      klavishlar yordamida jarayonni tezlashtiring.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-600 dark:bg-white/10 dark:text-sky-200 dark:hover:bg-white/20"
                    >
                      Qo&apos;llanmani ko&apos;rish
                    </motion.button>
                  </motion.div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <motion.main
          animate={{ marginLeft: !isMobile && isSidebarOpen ? 0 : 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="flex-1 overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10"
          >
            {children}
          </motion.div>
        </motion.main>
      </div>
    </div>
  );
}

