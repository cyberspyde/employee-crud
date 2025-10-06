import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  Building,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  MapPin,
} from "lucide-react";
import { Employee } from "../types/employee";

interface DashboardProps {
  employees: Employee[];
  loading: boolean;
}

export default function Dashboard({ employees, loading }: DashboardProps) {
  const statusLabels: Record<Employee["employment_status"], string> = {
    active: "Faol",
    inactive: "Noaktiv",
    terminated: "Ishdan bo'shatilgan",
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="h-32 animate-pulse rounded-3xl border border-slate-200/70 bg-white/80 shadow-inner shadow-slate-900/5 transition-colors dark:border-slate-700/50 dark:bg-slate-800/50 dark:shadow-black/20" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-3xl border border-slate-200/60 bg-white/70 shadow-inner shadow-slate-900/5 transition-colors dark:border-slate-700/50 dark:bg-slate-800/50 dark:shadow-black/20"
            />
          ))}
        </div>
      </motion.div>
    );
  }

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(
    (emp) => emp.employment_status === "active",
  ).length;
  const departments = [
    ...new Set(employees.map((emp) => emp.department).filter(Boolean)),
  ].length;
  const avgExperience =
    employees.length > 0
      ? Math.round(
          employees.reduce((sum, emp) => sum + emp.years_experience, 0) /
            employees.length,
        )
      : 0;

  const stats = [
    {
      title: "Jami xodimlar",
      value: totalEmployees,
      icon: Users,
      accent: "from-sky-500 via-blue-500 to-indigo-500",
      subcopy: "Barcha tizimdagi profil soni",
    },
    {
      title: "Faol xodimlar",
      value: activeEmployees,
      icon: UserPlus,
      accent: "from-emerald-500 via-emerald-600 to-teal-500",
      subcopy: "Hozirda faol ishlayotganlar",
    },
    {
      title: "Bo'limlar",
      value: departments,
      icon: Building,
      accent: "from-purple-500 via-indigo-500 to-blue-500",
      subcopy: "Faol bo'limlar soni",
    },
    {
      title: "O'rtacha tajriba",
      value: `${avgExperience} yil`,
      icon: TrendingUp,
      accent: "from-amber-500 via-orange-500 to-rose-500",
      subcopy: "Jamoa tajribasi",
    },
  ];

  const recentEmployees = employees.slice(0, 5);
  const departmentStats = employees.reduce(
    (acc, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
        className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 text-white shadow-[0_35px_90px_-40px_rgba(59,130,246,0.8)] transition-all dark:border-blue-500/50 dark:shadow-[0_35px_90px_-40px_rgba(59,130,246,0.6)]"
      >
        <div className="absolute -right-16 top-4 h-48 w-48 rounded-full bg-white/25 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan-300/40 blur-3xl" />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center space-x-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wider backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Jamoa ko'rinishi</span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Salom! Bugungi holat juda ajoyib.
            </h2>
            <p className="text-sm text-white/80">
              Quyidagi metrikalar yordamida HR faoliyatini kuzating, yangi
              xodimlarni aniqlang va bo'limlardagi taqsimotni baholang.
            </p>
          </div>
          <div className="grid gap-3 rounded-2xl border border-white/20 bg-white/10 p-5 text-sm text-white/80 backdrop-blur-sm">
            <motion.div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Jami xodimlar</span>
              </span>
              <span className="text-2xl font-semibold text-white">
                {totalEmployees}
              </span>
            </motion.div>
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <ArrowUpRight className="h-4 w-4" />
                <span>Faol xodimlar</span>
              </span>
              <span className="text-xl font-semibold text-white">
                {activeEmployees}
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.article
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.2 + index * 0.1,
                type: "spring",
                stiffness: 100,
              }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_25px_55px_-40px_rgba(15,23,42,0.45)] transition-all duration-300 hover:border-blue-200 hover:shadow-[0_35px_80px_-45px_rgba(59,130,246,0.65)] dark:border-slate-700/50 dark:bg-slate-800/90 dark:shadow-[0_25px_55px_-40px_rgba(0,0,0,0.8)] dark:hover:border-blue-500/50 dark:hover:shadow-[0_35px_80px_-45px_rgba(59,130,246,0.4)]"
            >
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.accent}`}
              />
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.accent} opacity-10 dark:opacity-5`}
              />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 transition-colors dark:text-slate-400">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900 transition-colors dark:text-white">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 transition-colors dark:text-slate-400">
                    {stat.subcopy}
                  </p>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.accent} text-white shadow-lg shadow-blue-500/30 transition-transform duration-300 hover:scale-105 dark:shadow-blue-500/20`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </motion.article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
        <motion.article
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
          className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-2xl shadow-slate-900/10 transition-colors dark:border-slate-700/50 dark:bg-slate-800/90 dark:shadow-black/50"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 transition-colors dark:text-white">
                Yaqinda qo'shilgan xodimlar
              </h3>
              <p className="text-sm text-slate-600 transition-colors dark:text-slate-400">
                Eng so'nggi profil qo'shilishlari
              </p>
            </div>
            <button className="inline-flex items-center space-x-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition-all duration-200 hover:border-blue-200 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:text-blue-400">
              Barchasini ko'rish
            </button>
          </div>
          <div className="mt-5 space-y-3">
            {recentEmployees.map((employee, index) => (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.02, x: 5 }}
                className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 transition-all duration-200 hover:border-blue-200 hover:bg-white dark:border-slate-700/50 dark:bg-slate-900/30 dark:hover:border-blue-500/50 dark:hover:bg-slate-900/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 text-white shadow-md shadow-blue-500/25 transition-transform duration-300 hover:scale-105 dark:shadow-blue-500/15">
                    <span className="text-sm font-semibold">
                      {employee.first_name.charAt(0)}
                      {employee.last_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 transition-colors dark:text-white">
                      {employee.first_name} {employee.last_name}
                    </p>
                    <p className="text-sm text-slate-600 transition-colors dark:text-slate-400">
                      {employee.position}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                    employee.employment_status === "active"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : employee.employment_status === "inactive"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                  }`}
                >
                  {statusLabels[employee.employment_status] ??
                    employee.employment_status}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
          className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-2xl shadow-slate-900/10 transition-colors dark:border-slate-700/50 dark:bg-slate-800/90 dark:shadow-black/50"
        >
          <h3 className="text-lg font-semibold text-slate-900 transition-colors dark:text-white">
            Bo'limlar bo'yicha taqsimot
          </h3>
          <p className="text-sm text-slate-600 transition-colors dark:text-slate-400">
            Tarkibni kuzatish va balansni baholash
          </p>
          <div className="mt-6 space-y-4">
            {Object.entries(departmentStats)
              .sort(([, a], [, b]) => b - a)
              .map(([department, count]) => (
                <div
                  key={department}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 transition-all duration-200 hover:border-blue-200 dark:border-slate-700/50 dark:bg-slate-900/30 dark:hover:border-blue-500/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-500 transition-all duration-200 hover:scale-105 dark:bg-blue-900/30 dark:text-blue-400">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-slate-900 transition-colors dark:text-white">
                      {department}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-28 rounded-full bg-slate-200/80 transition-colors dark:bg-slate-700/50">
                      <div
                        className="rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500 py-1 transition-all duration-300"
                        style={{
                          width: `${totalEmployees > 0 ? (count / totalEmployees) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm font-semibold text-slate-600 transition-colors dark:text-slate-400">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </motion.article>
      </section>
    </motion.div>
  );
}
