import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  Download,
  X,
  Sparkles,
  SlidersHorizontal,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  Pencil,
  Trash2
} from 'lucide-react';
import { Employee, SearchFilters } from '../types/employee';

const FILTER_DEBOUNCE_MS = 1200;

interface SearchEmployeesProps {
  employees: Employee[];
  onFilter: (filters: SearchFilters) => void;
  loading: boolean;
}

export default function SearchEmployees({ employees, onFilter, loading }: SearchEmployeesProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    department: 'all',
    position: 'all',
    employment_status: 'all'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const skipDebounceRef = useRef(true);

  useEffect(() => {
    if (skipDebounceRef.current) {
      skipDebounceRef.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onFilter(filters);
    }, FILTER_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [filters, onFilter]);

  const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];
  const positions = [...new Set(employees.map(emp => emp.position).filter(Boolean))];
  const statusLabels: Record<Employee['employment_status'], string> = {
    active: 'Faol',
    inactive: 'Noaktiv',
    terminated: "Ishdan bo'shatilgan",
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    const shouldDebounce = key === 'query';

    if (!shouldDebounce) {
      skipDebounceRef.current = true;
      onFilter(newFilters);
    }

    setFilters(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      query: '',
      department: 'all',
      position: 'all',
      employment_status: 'all'
    };

    skipDebounceRef.current = true;
    setFilters(clearedFilters);
    onFilter(clearedFilters);
  };

  const hasActiveFilters = filters.query || 
    filters.department !== 'all' || 
    filters.position !== 'all' || 
    filters.employment_status !== 'all';

  const activeFilterCount = [
    filters.query && 'query',
    filters.department !== 'all' && 'department',
    filters.position !== 'all' && 'position',
    filters.employment_status !== 'all' && 'status',
  ].filter(Boolean).length;

  const totalMatches = employees.length;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 text-white shadow-[0_35px_90px_-40px_rgba(59,130,246,0.8)]">
        <div className="absolute -right-20 top-12 h-48 w-48 rounded-full bg-cyan-300/40 blur-3xl" />
        <div className="absolute -left-16 -bottom-10 h-52 w-52 rounded-full bg-white/30 blur-3xl" />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center space-x-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Smart qidiruv rejimi</span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight">Xodimlarni aniqroq toping</h2>
            <p className="text-sm text-white/80">
              Natijalar avtomatik ravishda yangilanadi. Kengaytirilgan filtrlar yordamida bir necha soniyada kerakli xodimni toping.
            </p>
          </div>
          <div className="grid gap-3 rounded-2xl border border-white/20 bg-white/10 p-5 text-sm text-white/80">
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Natijalar</span>
              </span>
              <span className="text-2xl font-semibold text-white">{totalMatches}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <SlidersHorizontal className="h-4 w-4" />
                <span>Faol filtrlar</span>
              </span>
              <span className="text-xl font-semibold text-white">{activeFilterCount}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/70 bg-white/95 shadow-2xl shadow-slate-900/5">
        <div className="flex flex-col gap-4 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ism, email yoki xodim ID bo'yicha qidiring..."
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              className="w-full rounded-2xl border border-slate-200/80 bg-white py-3 pl-12 pr-4 text-sm text-slate-800 shadow-inner shadow-slate-900/5 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`inline-flex items-center space-x-2 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                showAdvanced
                  ? 'border-blue-500 bg-blue-500 text-white shadow-[0_15px_35px_-18px_rgba(59,130,246,0.7)]'
                  : 'border-slate-200/80 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-600'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filtrlar</span>
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-[1.8rem] items-center justify-center rounded-full bg-white/15 px-2 text-xs font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button className="inline-flex items-center space-x-2 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
              <Download className="h-4 w-4" />
              <span>Eksport</span>
            </button>
          </div>
        </div>

        {showAdvanced && (
          <div className="border-t border-slate-200/60 bg-slate-50/60 px-6 py-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bo'lim</label>
                <select
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-3 text-sm text-slate-700 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="all">Barcha bo'limlar</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lavozim</label>
                <select
                  value={filters.position}
                  onChange={(e) => handleFilterChange('position', e.target.value)}
                  className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-3 text-sm text-slate-700 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="all">Barcha lavozimlar</option>
                  {positions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Holat</label>
                <select
                  value={filters.employment_status}
                  onChange={(e) => handleFilterChange('employment_status', e.target.value)}
                  className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-3 text-sm text-slate-700 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="all">Barcha holatlar</option>
                  <option value="active">Faol</option>
                  <option value="inactive">Noaktiv</option>
                  <option value="terminated">Ishdan bo'shatilgan</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm">
                <span className="text-slate-600">
                  {totalMatches} ta xodim topildi
                </span>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center space-x-2 rounded-xl bg-slate-900/5 px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-900/10 hover:text-slate-800"
                >
                  <X className="h-4 w-4" />
                  <span>Filtrlarni tozalash</span>
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      <section>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-3xl border border-slate-200/60 bg-white/70 shadow-inner shadow-slate-900/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {employees.map((employee) => (
              <article
                key={employee.id}
                className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_25px_55px_-40px_rgba(15,23,42,0.45)] transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_35px_80px_-45px_rgba(59,130,246,0.65)]"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500 opacity-0 transition group-hover:opacity-100" />
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 text-white shadow-lg shadow-blue-500/30">
                      <span className="text-sm font-semibold">
                        {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {employee.first_name} {employee.last_name}
                        </h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                          #{employee.employee_id}
                        </span>
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
                      <p className="mt-1 text-sm font-medium text-blue-600">{employee.position}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <span className="rounded-full bg-slate-100/80 px-3 py-1 text-xs font-semibold text-slate-500 transition">
                      {employee.years_experience} yil tajriba
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 text-sm text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span>{employee.email}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{employee.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>{employee.department}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{new Date(employee.hire_date).toLocaleDateString('uz-UZ')}</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <button
                    onClick={() => (window.location.href = `mailto:${employee.email}`)}
                    className="inline-flex items-center space-x-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>Bog'lanish</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onView(employee)}
                      className="rounded-xl border border-slate-200/70 bg-white/90 px-2.5 py-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(employee)}
                      className="rounded-xl border border-slate-200/70 bg-white/90 px-2.5 py-2 text-slate-500 transition hover:border-emerald-200 hover:text-emerald-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(employee.id)}
                      className="rounded-xl border border-slate-200/70 bg-white/90 px-2.5 py-2 text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && employees.length === 0 && hasActiveFilters && (
          <div className="mt-6 rounded-3xl border border-slate-200/70 bg-white/95 p-12 text-center shadow-2xl shadow-slate-900/10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Natijalar topilmadi</h3>
            <p className="mt-2 text-sm text-slate-600">Qidiruv mezonlarini o'zgartiring yoki filtrlarni tozalang.</p>
            <button
              onClick={clearFilters}
              className="mt-5 inline-flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-500"
            >
              <X className="h-4 w-4" />
              <span>Filtrlarni tozalash</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
