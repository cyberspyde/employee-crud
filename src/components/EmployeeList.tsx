import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Eye,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Briefcase,
  CheckCircle2,
  SlidersHorizontal,
  Globe,
  Languages,
  FileSpreadsheet,
  FileText,
  RefreshCcw,
  Loader2,
} from 'lucide-react';
import { Employee } from '../types/employee';

type ExperienceOption = {
  id: string;
  label: string;
  min?: number;
  max?: number;
};

type EmployeeFilters = {
  experience: ExperienceOption['id'];
  country: string;
  city: string;
  languages: string[];
};

const EXPERIENCE_OPTIONS: ExperienceOption[] = [
  { id: 'all', label: 'Barcha tajribalar' },
  { id: '0-2', label: '0-2 yil', min: 0, max: 2 },
  { id: '3-5', label: '3-5 yil', min: 3, max: 5 },
  { id: '6-10', label: '6-10 yil', min: 6, max: 10 },
  { id: '10+', label: '10+ yil', min: 10 },
];

const EMPLOYMENT_STATUS_LABELS: Record<Employee['employment_status'], string> = {
  active: 'Faol',
  inactive: 'Noaktiv',
  terminated: "Ishdan bo'shatilgan",
};

const makeSafeFileSegment = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/(^-|-$)+/g, '');

const buildLocationString = (employee: Employee) => {
  const parts = [employee.address_city, employee.address_state, employee.address_country]
    .map(part => part?.trim())
    .filter(Boolean);
  return parts.join(', ') || '—';
};

const formatSkills = (skills: string[] | undefined) => (skills?.length ? skills.join(', ') : '—');

const buildDocFileName = (employee: Employee) => {
  const nameSegment = makeSafeFileSegment(`${employee.first_name} ${employee.last_name}`.trim());
  const idSegment = makeSafeFileSegment(employee.employee_id || employee.id);
  const base = [nameSegment, idSegment].filter(Boolean).join('-');
  return `${base || 'employee-profile'}.docx`;
};

const resolveImageBuffer = async (source: string): Promise<ArrayBuffer | null> => {
  if (!source) {
    return null;
  }

  if (source.startsWith('data:')) {
    const commaIndex = source.indexOf(',');
    if (commaIndex === -1) {
      return null;
    }
    const base64 = source.substring(commaIndex + 1);
    try {
      const binary = globalThis.atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      console.warn('Profil rasmi dekodlanmadi', error);
      return null;
    }
  }

  const response = await fetch(source);
  if (!response.ok) {
    return null;
  }
  return await response.arrayBuffer();
};

interface EmployeeListProps {
  employees: Employee[];
  loading: boolean;
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
  onView: (employee: Employee) => void;
}

export default function EmployeeList({ employees, loading, onEdit, onDelete, onView }: EmployeeListProps) {
  const [filters, setFilters] = useState<EmployeeFilters>({
    experience: 'all',
    country: 'all',
    city: 'all',
    languages: [],
  });
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState<null | 'excel' | 'word'>(null);

  const countryOptions = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach(employee => {
      const country = employee.address_country?.trim();
      if (country) {
        map.set(country.toLowerCase(), country);
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1], 'uz', { sensitivity: 'base' }))
      .map(([value, label]) => ({ value, label }));
  }, [employees]);

  const cityOptions = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach(employee => {
      const city = employee.address_city?.trim();
      if (!city) return;
      const employeeCountry = employee.address_country?.trim().toLowerCase();
      if (filters.country !== 'all' && employeeCountry !== filters.country) return;
      map.set(city.toLowerCase(), city);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1], 'uz', { sensitivity: 'base' }))
      .map(([value, label]) => ({ value, label }));
  }, [employees, filters.country]);

  const languageOptions = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach(employee => {
      employee.skills?.forEach(skill => {
        const trimmed = skill.trim();
        if (trimmed) {
          map.set(trimmed.toLowerCase(), trimmed);
        }
      });
    });
    return Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1], 'uz', { sensitivity: 'base' }))
      .map(([value, label]) => ({ value, label }));
  }, [employees]);

  useEffect(() => {
    setSelectedEmployees(prev => {
      const validIds = new Set(employees.map(emp => emp.id));
      const next = new Set(Array.from(prev).filter(id => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [employees]);

  useEffect(() => {
    if (filters.country !== 'all' && !countryOptions.some(option => option.value === filters.country)) {
      setFilters(prev => ({ ...prev, country: 'all', city: 'all' }));
    }
  }, [filters.country, countryOptions]);

  useEffect(() => {
    if (filters.city !== 'all' && !cityOptions.some(option => option.value === filters.city)) {
      setFilters(prev => ({ ...prev, city: 'all' }));
    }
  }, [filters.city, cityOptions]);

  useEffect(() => {
    if (!filters.languages.length) return;
    const available = new Set(languageOptions.map(option => option.value));
    const filtered = filters.languages.filter(language => available.has(language));
    if (filtered.length !== filters.languages.length) {
      setFilters(prev => ({ ...prev, languages: filtered }));
    }
  }, [filters.languages, languageOptions]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const experienceOption = EXPERIENCE_OPTIONS.find(option => option.id === filters.experience);
      if (experienceOption && experienceOption.id !== 'all') {
        const min = experienceOption.min ?? Number.NEGATIVE_INFINITY;
        const max = experienceOption.max ?? Number.POSITIVE_INFINITY;
        if (employee.years_experience < min) return false;
        if (employee.years_experience > max) return false;
      }

      if (filters.country !== 'all') {
        const employeeCountry = employee.address_country?.trim().toLowerCase() ?? '';
        if (employeeCountry !== filters.country) return false;
      }

      if (filters.city !== 'all') {
        const employeeCity = employee.address_city?.trim().toLowerCase() ?? '';
        if (employeeCity !== filters.city) return false;
      }

      if (filters.languages.length > 0) {
        const skillSet = new Set(
          (employee.skills ?? [])
            .map(skill => skill.trim().toLowerCase())
            .filter(Boolean)
        );
        const matches = filters.languages.every(language => skillSet.has(language));
        if (!matches) return false;
      }

      return true;
    });
  }, [employees, filters]);

  const selectedVisibleEmployees = useMemo(
    () => filteredEmployees.filter(employee => selectedEmployees.has(employee.id)),
    [filteredEmployees, selectedEmployees]
  );

  const exportCandidates = selectedVisibleEmployees.length > 0 ? selectedVisibleEmployees : filteredEmployees;
  const hasExportCandidates = exportCandidates.length > 0;

  const allSelected = filteredEmployees.length > 0 && filteredEmployees.every(employee => selectedEmployees.has(employee.id));
  const hasCustomFilters =
    filters.experience !== 'all' ||
    filters.country !== 'all' ||
    filters.city !== 'all' ||
    filters.languages.length > 0;

  const updateFilter = useCallback(<K extends keyof EmployeeFilters>(key: K, value: EmployeeFilters[K]) => {
    setFilters(prev => {
      if (key === 'country') {
        return { ...prev, country: value as string, city: 'all' };
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const toggleLanguage = useCallback((language: string) => {
    setFilters(prev => {
      const nextLanguages = prev.languages.includes(language)
        ? prev.languages.filter(item => item !== language)
        : [...prev.languages, language];
      return { ...prev, languages: nextLanguages };
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ experience: 'all', country: 'all', city: 'all', languages: [] });
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedEmployees(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (!filteredEmployees.length) return;
    setSelectedEmployees(prev => {
      const next = new Set(prev);
      const everySelected = filteredEmployees.every(employee => next.has(employee.id));
      if (everySelected) {
        filteredEmployees.forEach(employee => next.delete(employee.id));
        return next;
      }
      filteredEmployees.forEach(employee => next.add(employee.id));
      return next;
    });
  }, [filteredEmployees]);
  const handleExportExcel = useCallback(async () => {
    if (!hasExportCandidates || exporting) return;
    try {
      setExporting('excel');
      const xlsx = await import('xlsx');
      const rows = exportCandidates.map(employee => ({
        'Xodim ID': employee.employee_id,
        Ism: `${employee.first_name} ${employee.last_name}`.trim(),
        Email: employee.email,
        Telefon: employee.phone ?? '—',
        Lavozim: employee.position,
        "Bo'lim": employee.department,
        Holat: EMPLOYMENT_STATUS_LABELS[employee.employment_status] ?? employee.employment_status,
        "Tajriba (yil)": employee.years_experience,
        Manzil: buildLocationString(employee),
        "Ko'nikmalar": formatSkills(employee.skills),
      }));
      const worksheet = xlsx.utils.json_to_sheet(rows);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Xodimlar');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      xlsx.writeFile(workbook, `employees-${timestamp}.xlsx`);
    } catch (error) {
      console.error('Excel export failed', error);
      window.alert('Excel faylini yaratishda xatolik yuz berdi.');
    } finally {
      setExporting(null);
    }
  }, [exportCandidates, exporting, hasExportCandidates]);

  const handleExportWord = useCallback(async () => {
    if (!hasExportCandidates || exporting) return;
    try {
      setExporting('word');
      const docx = await import('docx');
      const JSZip = (await import('jszip')).default;
      const { saveAs } = await import('file-saver');
      const zip = new JSZip();

      for (const employee of exportCandidates) {
        const document = new docx.Document();
        const paragraphs: docx.Paragraph[] = [];

        paragraphs.push(
          new docx.Paragraph({
            text: `${employee.first_name} ${employee.last_name}`.trim(),
            heading: docx.HeadingLevel.TITLE,
            spacing: { after: 200 },
          })
        );

        if (employee.profile_image_url) {
          try {
            const response = await fetch(employee.profile_image_url);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const image = docx.Media.addImage(document, arrayBuffer, 160, 160);
              paragraphs.push(
                new docx.Paragraph({
                  alignment: docx.AlignmentType.CENTER,
                  spacing: { after: 200 },
                  children: [image],
                })
              );
            }
          } catch (error) {
            console.warn('Profil rasmi yuklab olinmadi', error);
          }
        }

        const fieldParagraph = (label: string, value: string) =>
          new docx.Paragraph({
            spacing: { after: 120 },
            children: [
              new docx.TextRun({ text: `${label}: `, bold: true }),
              new docx.TextRun({ text: value }),
            ],
          });

        paragraphs.push(
          fieldParagraph('Lavozim', employee.position || '—'),
          fieldParagraph("Bo'lim", employee.department || '—'),
          fieldParagraph('Holat', EMPLOYMENT_STATUS_LABELS[employee.employment_status] ?? employee.employment_status),
          fieldParagraph('Email', employee.email || '—'),
          fieldParagraph('Telefon', employee.phone ?? '—'),
          fieldParagraph('Manzil', buildLocationString(employee)),
          fieldParagraph('Tajriba', `${employee.years_experience} yil`),
          fieldParagraph("Ko'nikmalar", formatSkills(employee.skills)),
        );

        if (employee.notes) {
          paragraphs.push(
            new docx.Paragraph({
              spacing: { before: 120, after: 120 },
              children: [
                new docx.TextRun({ text: 'Izohlar: ', bold: true }),
                new docx.TextRun({ text: employee.notes }),
              ],
            })
          );
        }

        document.addSection({
          properties: {
            page: {
              margin: { top: 720, right: 720, bottom: 720, left: 720 },
            },
          },
          children: paragraphs,
        });

        const buffer = await docx.Packer.toBuffer(document);
        zip.file(buildDocFileName(employee), buffer);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `employees-word-${timestamp}.zip`);
    } catch (error) {
      console.error('Word export failed', error);
      window.alert('Word formatida eksport qilishda xatolik yuz berdi.');
    } finally {
      setExporting(null);
    }
  }, [exportCandidates, exporting, hasExportCandidates]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-24 animate-pulse rounded-3xl border border-slate-200/70 bg-white/80 shadow-inner shadow-slate-900/5" />
        {[...Array(4)].map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-3xl border border-slate-200/60 bg-white/70 shadow-inner shadow-slate-900/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-2xl shadow-slate-900/10 sm:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 rounded-l-full bg-gradient-to-l from-blue-500/20 via-indigo-500/10 to-transparent sm:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
              <Users className="h-3.5 w-3.5" />
              <span>Jamoa ma'lumotlari</span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Xodimlar ro'yxati</h2>
            <p className="text-sm text-slate-600">
              Tanlangan xodimlarni kuzating, kartalar orqali tezkor ma'lumot oling va kerakli amalni bitta klik bilan bajaring.
            </p>
          </div>
          <div className="grid w-full gap-4 rounded-3xl border border-slate-200/70 bg-white/90 p-5 text-sm text-slate-600 shadow-sm shadow-slate-900/5 sm:grid-cols-3 lg:w-auto">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Jami xodimlar</p>
              <p className="text-2xl font-semibold text-slate-900">{employees.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tanlanganlar</p>
              <p className="flex items-center gap-1 text-2xl font-semibold text-blue-600">
                {selectedEmployees.size}
                {selectedEmployees.size > 0 && <CheckCircle2 className="h-4 w-4" />}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Faol bo'limlar</p>
              <p className="text-2xl font-semibold text-slate-900">
                {new Set(employees.map(employee => employee.department)).size}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/70 bg-white/95 shadow-2xl shadow-slate-900/5">
        <header className="flex flex-col gap-4 border-b border-slate-200/70 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Xodimlar</h3>
            <p className="text-sm text-slate-600">
              {filteredEmployees.length} ta xodim topildi
              {selectedVisibleEmployees.length > 0 && ` • ${selectedVisibleEmployees.length} ta tanlandi`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {selectedVisibleEmployees.length > 0 && (
              <div className="inline-flex items-center space-x-3 rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-2 text-sm font-medium text-blue-700">
                <CheckCircle2 className="h-4 w-4" />
                <span>{selectedVisibleEmployees.length} ta xodim tanlandi</span>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={!hasExportCandidates || exporting !== null}
                className={`inline-flex items-center space-x-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                  hasExportCandidates && exporting !== 'word'
                    ? 'border-emerald-200 bg-emerald-50/70 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100'
                    : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                }`}
              >
                {exporting === 'excel' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                <span>Excelga eksport</span>
              </button>
              <button
                type="button"
                onClick={handleExportWord}
                disabled={!hasExportCandidates || exporting !== null}
                className={`inline-flex items-center space-x-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                  hasExportCandidates && exporting !== 'excel'
                    ? 'border-blue-200 bg-blue-50/70 text-blue-700 hover:border-blue-300 hover:bg-blue-100'
                    : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                }`}
              >
                {exporting === 'word' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                <span>Wordga eksport</span>
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-4 px-4 pb-6 pt-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium text-slate-700">Joriy natijalarni tanlash</span>
            </label>
            {selectedVisibleEmployees.length > 0 ? (
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {selectedVisibleEmployees.length} ta karta boshqaruvga tayyor
              </span>
            ) : (
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Hech narsa tanlanmagan
              </span>
            )}
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <SlidersHorizontal className="h-4 w-4 text-blue-500" />
                <span>Kengaytirilgan filtrlar</span>
              </div>
              {hasCustomFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center space-x-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  <span>Filtrlarni tiklash</span>
                </button>
              )}
            </div>
            <div className="grid gap-4 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Briefcase className="h-3.5 w-3.5 text-blue-500" />
                  <span>Tajriba</span>
                </label>
                <select
                  value={filters.experience}
                  onChange={event => updateFilter('experience', event.target.value as ExperienceOption['id'])}
                  className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-3 text-sm text-slate-700 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                >
                  {EXPERIENCE_OPTIONS.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Globe className="h-3.5 w-3.5 text-blue-500" />
                  <span>Mamlakat</span>
                </label>
                <select
                  value={filters.country}
                  onChange={event => updateFilter('country', event.target.value)}
                  className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-3 text-sm text-slate-700 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="all">Barcha joylashuvlar</option>
                  {countryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-blue-500" />
                  <span>Shahar</span>
                </label>
                <select
                  value={filters.city}
                  onChange={event => updateFilter('city', event.target.value)}
                  className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-3 text-sm text-slate-700 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  disabled={filters.country !== 'all' && cityOptions.length === 0}
                >
                  <option value="all">Barcha shaharlar</option>
                  {cityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Languages className="h-3.5 w-3.5 text-blue-500" />
                  <span>Tillar / ko'nikmalar</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {languageOptions.length === 0 ? (
                    <span className="text-xs text-slate-400">Ko'nikma ma'lumotlari mavjud emas</span>
                  ) : (
                    languageOptions.map(option => {
                      const active = filters.languages.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleLanguage(option.value)}
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition ${
                            active
                              ? 'border-blue-500 bg-blue-500 text-white shadow-[0_10px_25px_-15px_rgba(59,130,246,0.65)]'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-12 text-center shadow-inner shadow-slate-900/5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Mos keladigan xodimlar topilmadi</h3>
              <p className="mt-2 text-sm text-slate-600">Filtrlarni o'zgartiring yoki tiklash tugmasidan foydalaning.</p>
              {hasCustomFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 inline-flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-500"
                >
                  <RefreshCcw className="h-4 w-4" />
                  <span>Filtrlarni tiklash</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEmployees.map(employee => {
                const isSelected = selectedEmployees.has(employee.id);

                return (
                  <article
                    key={employee.id}
                    className={`group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/95 p-5 shadow-sm shadow-slate-900/5 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl ${
                      isSelected ? 'border-blue-300 shadow-[0_25px_60px_-45px_rgba(59,130,246,0.65)]' : ''
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500" />
                    )}
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div className="flex flex-1 items-start gap-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection(employee.id)}
                          className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 text-white shadow-lg shadow-blue-500/30">
                            <span className="text-sm font-semibold">
                              {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                            </span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-lg font-semibold text-slate-900">
                                {employee.first_name} {employee.last_name}
                              </h4>
                              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">#{employee.employee_id}</span>
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                employee.employment_status === 'active'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : employee.employment_status === 'inactive'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}>
                                {EMPLOYMENT_STATUS_LABELS[employee.employment_status] ?? employee.employment_status}
                              </span>
                            </div>
                            <div className="inline-flex items-center space-x-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                              <Briefcase className="h-3.5 w-3.5" />
                              <span>{employee.position}</span>
                            </div>
                            <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
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
                                <span>{buildLocationString(employee)}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                <span>{new Date(employee.hire_date).toLocaleDateString('uz-UZ')}</span>
                              </div>
                            </div>
                            <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                              {employee.years_experience} yil tajriba
                            </div>
                            {employee.skills?.length ? (
                              <div className="flex flex-wrap gap-2">
                                {employee.skills.map(skill => (
                                  <span
                                    key={skill}
                                    className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onView(employee)}
                          className="rounded-xl border border-slate-200/70 bg-white/90 px-3 py-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEdit(employee)}
                          className="rounded-xl border border-slate-200/70 bg-white/90 px-3 py-2 text-slate-500 transition hover:border-emerald-200 hover:text-emerald-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(employee.id)}
                          className="rounded-xl border border-slate-200/70 bg-white/90 px-3 py-2 text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}










