import { Users, UserPlus, Building, TrendingUp, Sparkles, ArrowUpRight, MapPin } from 'lucide-react';
import { Employee } from '../types/employee';

interface DashboardProps {
  employees: Employee[];
  loading: boolean;
}

export default function Dashboard({ employees, loading }: DashboardProps) {
  const statusLabels: Record<Employee['employment_status'], string> = {
    active: 'Faol',
    inactive: 'Noaktiv',
    terminated: "Ishdan bo'shatilgan",
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-3xl border border-slate-200/70 bg-white/80 shadow-inner shadow-slate-900/5" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl border border-slate-200/60 bg-white/70 shadow-inner shadow-slate-900/5" />
          ))}
        </div>
      </div>
    );
  }

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.employment_status === 'active').length;
  const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))].length;
  const avgExperience = employees.length > 0 
    ? Math.round(employees.reduce((sum, emp) => sum + emp.years_experience, 0) / employees.length)
    : 0;

  const stats = [
    {
      title: 'Jami xodimlar',
      value: totalEmployees,
      icon: Users,
      accent: 'from-sky-500 via-blue-500 to-indigo-500',
      subcopy: 'Barcha tizimdagi profil soni'
    },
    {
      title: 'Faol xodimlar',
      value: activeEmployees,
      icon: UserPlus,
      accent: 'from-emerald-500 via-emerald-600 to-teal-500',
      subcopy: 'Hozirda faol ishlayotganlar'
    },
    {
      title: "Bo'limlar",
      value: departments,
      icon: Building,
      accent: 'from-purple-500 via-indigo-500 to-blue-500',
      subcopy: "Faol bo'limlar soni"
    },
    {
      title: "O'rtacha tajriba",
      value: `${avgExperience} yil`,
      icon: TrendingUp,
      accent: 'from-amber-500 via-orange-500 to-rose-500',
      subcopy: 'Jamoa tajribasi'
    }
  ];

  const recentEmployees = employees.slice(0, 5);
  const departmentStats = employees.reduce((acc, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 text-white shadow-[0_35px_90px_-40px_rgba(59,130,246,0.8)]">
        <div className="absolute -right-16 top-4 h-48 w-48 rounded-full bg-white/25 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan-300/40 blur-3xl" />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center space-x-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Jamoa ko'rinishi</span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight">Salom! Bugungi holat juda ajoyib.</h2>
            <p className="text-sm text-white/80">
              Quyidagi metrikalar yordamida HR faoliyatini kuzating, yangi xodimlarni aniqlang va bo'limlardagi taqsimotni baholang.
            </p>
          </div>
          <div className="grid gap-3 rounded-2xl border border-white/20 bg-white/10 p-5 text-sm text-white/80">
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Jami xodimlar</span>
              </span>
              <span className="text-2xl font-semibold text-white">{totalEmployees}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <ArrowUpRight className="h-4 w-4" />
                <span>Faol xodimlar</span>
              </span>
              <span className="text-xl font-semibold text-white">{activeEmployees}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <article
              key={index}
              className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_25px_55px_-40px_rgba(15,23,42,0.45)] transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_35px_80px_-45px_rgba(59,130,246,0.65)]"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.accent}`} />
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.accent} opacity-10`} />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.title}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{stat.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{stat.subcopy}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.accent} text-white shadow-lg shadow-blue-500/30`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
        <article className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-2xl shadow-slate-900/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Yaqinda qo'shilgan xodimlar</h3>
              <p className="text-sm text-slate-600">Eng so?nggi profil qo'shilishlari</p>
            </div>
            <button className="inline-flex items-center space-x-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-blue-200 hover:text-blue-600">
              Barchasini ko'rish
            </button>
          </div>
          <div className="mt-5 space-y-3">
            {recentEmployees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 transition hover:border-blue-200 hover:bg-white"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 text-white shadow-md shadow-blue-500/25">
                    <span className="text-sm font-semibold">
                      {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {employee.first_name} {employee.last_name}
                    </p>
                    <p className="text-sm text-slate-600">{employee.position}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  employee.employment_status === 'active'
                    ? 'bg-emerald-100 text-emerald-700'
                    : employee.employment_status === 'inactive'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  {statusLabels[employee.employment_status] ?? employee.employment_status}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-2xl shadow-slate-900/10">
          <h3 className="text-lg font-semibold text-slate-900">Bo'limlar bo'yicha taqsimot</h3>
          <p className="text-sm text-slate-600">Tarkibni kuzatish va balansni baholash</p>
          <div className="mt-6 space-y-4">
            {Object.entries(departmentStats)
              .sort(([,a], [,b]) => b - a)
              .map(([department, count]) => (
                <div key={department} className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-slate-900">{department}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-28 rounded-full bg-slate-200/80">
                      <div
                        className="rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500 py-1"
                        style={{ width: `${totalEmployees > 0 ? (count / totalEmployees) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm font-semibold text-slate-600">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </article>
      </section>
    </div>
  );
}
