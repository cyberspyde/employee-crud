import { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
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
  Trash2,
} from "lucide-react";
import { Employee, SearchFilters } from "../types/employee";
import { useDepartments } from "../hooks/useDepartments";
import type { DepartmentNode } from "../types/department";

const FILTER_DEBOUNCE_MS = 300;

interface SearchEmployeesProps {
  employees: Employee[];
  onFilter: (filters: SearchFilters) => void;
  loading: boolean;
  onView?: (employee: Employee) => void;
  onEdit?: (employee: Employee) => void;
  onDelete?: (id: string) => void;
}

const statusLabels: Record<Employee["employment_status"], string> = {
  active: "Faol",
  inactive: "Noaktiv",
  terminated: "Ishdan bo'shatilgan",
};

function flattenDepartmentTree(nodes: DepartmentNode[]): Array<{ id: string; label: string }> {
  const result: Array<{ id: string; label: string }> = [];

  const visit = (items: DepartmentNode[]) => {
    items.forEach((node) => {
      const label = node.path_names && node.path_names.length > 0
        ? node.path_names.join(" / ")
        : node.name;
      result.push({ id: node.id, label });
      if (node.children && node.children.length > 0) {
        visit(node.children);
      }
    });
  };

  visit(nodes);
  return result;
}

// Memoized Employee Card Component
const EmployeeCard = memo(
  ({
    employee,
    onView,
    onEdit,
    onDelete,
  }: {
    employee: Employee;
    onView?: (employee: Employee) => void;
    onEdit?: (employee: Employee) => void;
    onDelete?: (id: string) => void;
  }) => {
    return (
      <article className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_25px_55px_-40px_rgba(15,23,42,0.45)] transition-[transform,border-color,box-shadow] duration-200 will-change-transform hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_35px_80px_-45px_rgba(59,130,246,0.65)] dark:border-slate-700/50 dark:bg-slate-800/90 dark:shadow-[0_25px_55px_-40px_rgba(0,0,0,0.8)] dark:hover:border-blue-500/50 dark:hover:shadow-[0_35px_80px_-45px_rgba(59,130,246,0.4)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 text-white shadow-lg shadow-blue-500/30 transition-transform duration-200 will-change-transform group-hover:scale-105">
              <span className="text-sm font-semibold">
                {employee.first_name.charAt(0)}
                {employee.last_name.charAt(0)}
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {employee.first_name} {employee.last_name}
                </h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                  #{employee.employee_id}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
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
              </div>
              <p className="mt-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                {employee.position}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <span className="rounded-full bg-slate-100/80 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-700/50 dark:text-slate-400">
              {employee.years_experience} yil tajriba
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <span className="truncate">{employee.email}</span>
          </div>
          {employee.phone && (
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <span>{employee.phone}</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <span>{employee.department}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <span>
              {new Date(employee.hire_date).toLocaleDateString("uz-UZ")}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => (window.location.href = `mailto:${employee.email}`)}
            className="inline-flex items-center space-x-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition-[border-color,color] duration-150 hover:border-blue-200 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Bog'lanish</span>
          </button>
          <div className="flex items-center gap-2">
            {onView && (
              <button
                onClick={() => onView(employee)}
                className="rounded-xl border border-slate-200/70 bg-white/90 px-2.5 py-2 text-slate-500 transition-[border-color,color] duration-150 hover:border-blue-200 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
                title="Ko'rish"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(employee)}
                className="rounded-xl border border-slate-200/70 bg-white/90 px-2.5 py-2 text-slate-500 transition-[border-color,color] duration-150 hover:border-emerald-200 hover:text-emerald-600 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
                title="Tahrirlash"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(employee.id)}
                className="rounded-xl border border-slate-200/70 bg-white/90 px-2.5 py-2 text-slate-500 transition-[border-color,color] duration-150 hover:border-rose-200 hover:text-rose-600 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:border-rose-500 dark:hover:text-rose-400"
                title="O'chirish"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </article>
    );
  },
);

EmployeeCard.displayName = "EmployeeCard";

export default function SearchEmployees({
  employees,
  onFilter,
  loading,
  onView,
  onEdit,
  onDelete,
}: SearchEmployeesProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    department: "all",
    department_id: undefined,
    position: "all",
    employment_status: "all",
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const skipDebounceRef = useRef(true);
  const onFilterRef = useRef(onFilter);
  const {
    tree: departmentTree,
    loading: departmentsLoading,
    error: departmentsError,
  } = useDepartments();
  const departmentOptions = useMemo(
    () => flattenDepartmentTree(departmentTree),
    [departmentTree],
  );

  // Keep onFilter reference up to date without triggering re-renders
  useEffect(() => {
    onFilterRef.current = onFilter;
  }, [onFilter]);

  useEffect(() => {
    if (skipDebounceRef.current) {
      skipDebounceRef.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onFilterRef.current(filters);
    }, FILTER_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [filters]);

  useEffect(() => {
    if (
      filters.department !== "all" &&
      !departmentOptions.some((option) => option.id === filters.department)
    ) {
      const nextFilters: SearchFilters = {
        ...filters,
        department: "all",
        department_id: undefined,
      };
      skipDebounceRef.current = true;
      setFilters(nextFilters);
      onFilterRef.current(nextFilters);
    }
  }, [departmentOptions, filters]);


  const positions = useMemo(
    () => [...new Set(employees.map((emp) => emp.position).filter(Boolean))],
    [employees],
  );

  const handleFilterChange = useCallback(
    (key: keyof SearchFilters, value: string) => {
      setFilters((prevFilters) => {
        const newFilters = { ...prevFilters, [key]: value };
        const shouldDebounce = key === "query";

        if (!shouldDebounce) {
          skipDebounceRef.current = true;
          onFilterRef.current(newFilters);
        }

        return newFilters;
      });
    },
    [],
  );

  const handleDepartmentChange = useCallback((value: string) => {
    setFilters((prevFilters) => {
      const nextFilters = {
        ...prevFilters,
        department: value,
        department_id: value === "all" ? undefined : value,
      };
      skipDebounceRef.current = true;
      onFilterRef.current(nextFilters);
      return nextFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    const clearedFilters: SearchFilters = {
      query: "",
      department: "all",
      department_id: undefined,
      position: "all",
      employment_status: "all",
    };

    skipDebounceRef.current = true;
    setFilters(clearedFilters);
    onFilterRef.current(clearedFilters);
  }, []);

  const hasActiveFilters =
    filters.query ||
    filters.department !== "all" ||
    filters.position !== "all" ||
    filters.employment_status !== "all";

  const activeFilterCount = [
    filters.query && "query",
    filters.department !== "all" && "department",
    filters.position !== "all" && "position",
    filters.employment_status !== "all" && "status",
  ].filter(Boolean).length;

  const totalMatches = employees.length;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 text-white shadow-[0_35px_90px_-40px_rgba(59,130,246,0.8)] dark:border-blue-500/50 dark:shadow-[0_35px_90px_-40px_rgba(59,130,246,0.6)]">
        <div className="absolute -right-20 top-12 h-48 w-48 rounded-full bg-cyan-300/40 blur-3xl" />
        <div className="absolute -left-16 -bottom-10 h-52 w-52 rounded-full bg-white/30 blur-3xl" />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center space-x-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wider backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Smart qidiruv rejimi</span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Xodimlarni aniqroq toping
            </h2>
            <p className="text-sm text-white/80">
              Natijalar avtomatik ravishda yangilanadi. Kengaytirilgan filtrlar
              yordamida bir necha soniyada kerakli xodimni toping.
            </p>
          </div>
          <div className="grid gap-3 rounded-2xl border border-white/20 bg-white/10 p-5 text-sm text-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Natijalar</span>
              </span>
              <span className="text-2xl font-semibold text-white">
                {totalMatches}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <SlidersHorizontal className="h-4 w-4" />
                <span>Faol filtrlar</span>
              </span>
              <span className="text-xl font-semibold text-white">
                {activeFilterCount}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/70 bg-white/95 shadow-2xl shadow-slate-900/5 transition-colors dark:border-slate-700/50 dark:bg-slate-800/90 dark:shadow-2xl dark:shadow-black/50">
        <div className="flex flex-col gap-4 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors dark:text-slate-500" />
            <input
              type="text"
              placeholder="Ism, email yoki xodim ID bo'yicha qidiring..."
              value={filters.query}
              onChange={(e) => handleFilterChange("query", e.target.value)}
              className="w-full rounded-2xl border border-slate-200/80 bg-white py-3 pl-12 pr-4 text-sm text-slate-800 shadow-inner shadow-slate-900/5 transition-[border-color,box-shadow] duration-150 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-slate-600 dark:bg-slate-700/50 dark:text-white dark:shadow-black/20 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`inline-flex items-center space-x-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-[background-color,border-color,color] duration-150 ${
                showAdvanced
                  ? "border-blue-500 bg-blue-500 text-white shadow-[0_15px_35px_-18px_rgba(59,130,246,0.7)] dark:shadow-[0_15px_35px_-18px_rgba(59,130,246,0.5)]"
                  : "border-slate-200/80 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filtrlar</span>
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-[1.8rem] items-center justify-center rounded-full bg-white/15 px-2 text-xs font-semibold backdrop-blur-sm">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button className="inline-flex items-center space-x-2 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition-[border-color,color] duration-150 hover:border-slate-300 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white">
              <Download className="h-4 w-4" />
              <span>Eksport</span>
            </button>
          </div>
        </div>

        {showAdvanced && (
          <div className="border-t border-slate-200/60 bg-slate-50/60 px-6 py-6 dark:border-slate-700/50 dark:bg-slate-900/30">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Bo'lim
                </label>
                <select
                  value={filters.department}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  disabled={departmentsLoading}
                  className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-3 text-sm text-slate-700 shadow-sm transition-[border-color,box-shadow] duration-150 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-slate-600 dark:bg-slate-700/50 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                >
                  <option value="all">Barcha bo'limlar</option>
                  {!departmentsLoading &&
                    departmentOptions.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.label}
                      </option>
                    ))}
                </select>
                {departmentsLoading && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bo'limlar yuklanmoqda...
                  </p>
                )}
                {departmentsError && !departmentsLoading && (
                  <p className="text-xs text-rose-500">{departmentsError}</p>
                )}
                {!departmentsLoading &&
                  !departmentsError &&
                  departmentOptions.length === 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Bo'limlar mavjud emas
                    </p>
                  )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Lavozim
                </label>
                <select
                  value={filters.position}
                  onChange={(e) =>
                    handleFilterChange("position", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-3 text-sm text-slate-700 shadow-sm transition-[border-color,box-shadow] duration-150 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-slate-600 dark:bg-slate-700/50 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                >
                  <option value="all">Barcha lavozimlar</option>
                  {positions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Holat
                </label>
                <select
                  value={filters.employment_status}
                  onChange={(e) =>
                    handleFilterChange("employment_status", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-3 text-sm text-slate-700 shadow-sm transition-[border-color,box-shadow] duration-150 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-slate-600 dark:bg-slate-700/50 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                >
                  <option value="all">Barcha holatlar</option>
                  <option value="active">Faol</option>
                  <option value="inactive">Noaktiv</option>
                  <option value="terminated">Ishdan bo'shatilgan</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm transition-colors dark:border-slate-700 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">
                  {totalMatches} ta xodim topildi
                </span>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center space-x-2 rounded-xl bg-slate-900/5 px-3 py-2 text-xs font-semibold text-slate-500 transition-[background-color,color] duration-150 hover:bg-slate-900/10 hover:text-slate-800 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:bg-slate-600 dark:hover:text-slate-200"
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
              <div
                key={i}
                className="h-24 animate-pulse rounded-3xl border border-slate-200/60 bg-white/70 shadow-inner shadow-slate-900/5 dark:border-slate-700/50 dark:bg-slate-800/50 dark:shadow-black/20"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {employees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}

        {!loading && employees.length === 0 && hasActiveFilters && (
          <div className="mt-6 rounded-3xl border border-slate-200/70 bg-white/95 p-12 text-center shadow-2xl shadow-slate-900/10 dark:border-slate-700/50 dark:bg-slate-800/90 dark:shadow-black/50">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
              Natijalar topilmadi
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Qidiruv mezonlarini o'zgartiring yoki filtrlarni tozalang.
            </p>
            <button
              onClick={clearFilters}
              className="mt-5 inline-flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition-[background-color] duration-150 hover:bg-blue-500 dark:bg-blue-500 dark:shadow-blue-500/20 dark:hover:bg-blue-400"
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
