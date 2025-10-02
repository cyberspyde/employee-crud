import { useState, useEffect } from 'react';
import { X, Save, User, Mail, MapPin, Briefcase, UploadCloud } from 'lucide-react';
import { Employee, EmployeeFormData } from '../types/employee';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;

interface EmployeeFormProps {
  employee?: Employee | null;
  onSave: (data: EmployeeFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function EmployeeForm({ employee, onSave, onCancel, loading }: EmployeeFormProps) {
  const [formData, setFormData] = useState<EmployeeFormData>({
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    hire_date: new Date().toISOString().split('T')[0],
    position: '',
    department: '',
    salary: undefined,
    employment_status: 'active',
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    address_country: "O'zbekiston",
    emergency_contact_name: '',
    emergency_contact_phone: '',
    skills: [],
    years_experience: 0,
    education_level: '',
    profile_image_url: '',
    notes: ''
  });

  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState<Partial<EmployeeFormData>>({});
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageInputKey, setImageInputKey] = useState(0);
  const maxImageSizeMb = Math.round(MAX_IMAGE_SIZE_BYTES / (1024 * 1024));

  useEffect(() => {
    if (employee) {
      setFormData({
        employee_id: employee.employee_id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        phone: employee.phone || '',
        date_of_birth: employee.date_of_birth || '',
        hire_date: employee.hire_date,
        position: employee.position,
        department: employee.department,
        salary: employee.salary,
        employment_status: employee.employment_status,
        address_street: employee.address_street || '',
        address_city: employee.address_city || '',
        address_state: employee.address_state || '',
        address_zip: employee.address_zip || '',
        address_country: employee.address_country || "O'zbekiston",
        emergency_contact_name: employee.emergency_contact_name || '',
        emergency_contact_phone: employee.emergency_contact_phone || '',
        skills: employee.skills,
        years_experience: employee.years_experience,
        education_level: employee.education_level || '',
        profile_image_url: employee.profile_image_url || '',
        notes: employee.notes || ''
      });
      setImageError(null);
      setImageInputKey(prev => prev + 1);
    } else {
      setFormData(prev => ({
        ...prev,
        hire_date: new Date().toISOString().split('T')[0],
        profile_image_url: ''
      }));
      setImageError(null);
      setImageInputKey(prev => prev + 1);
    }
  }, [employee]);

  const validateForm = (): boolean => {
    const newErrors: Partial<EmployeeFormData> = {};

    if (!formData.employee_id.trim()) newErrors.employee_id = 'Xodim ID kiritilishi shart';
    if (!formData.first_name.trim()) newErrors.first_name = 'Ism kiritilishi shart';
    if (!formData.last_name.trim()) newErrors.last_name = 'Familiya kiritilishi shart';
    if (!formData.email.trim()) newErrors.email = 'Email kiritilishi shart';
    if (!formData.position.trim()) newErrors.position = 'Lavozim kiritilishi shart';
    if (!formData.department.trim()) newErrors.department = "Bo'lim kiritilishi shart";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Email formati noto'g'ri";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      await onSave(formData);
    } catch (error) {
      console.error("Xodimni saqlashda xatolik:", error);
    }
  };

  const handleInputChange = (field: keyof EmployeeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addSkill();
    }
  };

  const handleImageFileSelect = (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Ruxsat etilgan formatlar: JPG, PNG yoki WebP.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageError(`Rasm hajmi ${maxImageSizeMb}MB dan oshmasligi kerak.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        handleInputChange('profile_image_url', result);
        setImageError(null);
      } else {
        setImageError('Rasmni yuklashda xatolik yuz berdi.');
      }
    };
    reader.onerror = () => {
      setImageError('Rasmni yuklashda xatolik yuz berdi.');
    };
    reader.readAsDataURL(file);
  };

  const handleImageInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageInputKey(prev => prev + 1);
      return;
    }
    handleImageFileSelect(file);
    setImageInputKey(prev => prev + 1);
  };

  const handleRemoveImage = () => {
    handleInputChange('profile_image_url', '');
    setImageError(null);
    setImageInputKey(prev => prev + 1);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {employee ? 'Xodimni tahrirlash' : 'Yangi xodim qo\'shish'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-80px)] p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Asosiy ma'lumotlar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Xodim ID *
                </label>
                <input
                  type="text"
                  value={formData.employee_id}
                  onChange={(e) => handleInputChange('employee_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.employee_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="EMP001"
                />
                {errors.employee_id && (
                  <p className="text-red-600 text-sm mt-1">{errors.employee_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bandlik holati
                </label>
                <select
                  value={formData.employment_status}
                  onChange={(e) => handleInputChange('employment_status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Faol</option>
                  <option value="inactive">Noaktiv</option>
                  <option value="terminated">Ishdan bo'shatilgan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ism *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.first_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.first_name && (
                  <p className="text-red-600 text-sm mt-1">{errors.first_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Familiya *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.last_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.last_name && (
                  <p className="text-red-600 text-sm mt-1">{errors.last_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tug'ilgan sana
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ishga qabul qilingan sana *
                </label>
                <input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => handleInputChange('hire_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lavozim *
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.position ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.position && (
                  <p className="text-red-600 text-sm mt-1">{errors.position}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bo'lim *
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.department ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.department && (
                  <p className="text-red-600 text-sm mt-1">{errors.department}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ish haqi (USD)
                </label>
                <input
                  type="number"
                  value={formData.salary ?? ''}
                  onChange={(e) => handleInputChange('salary', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={0}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tajriba yillari
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.years_experience}
                  onChange={(e) => handleInputChange('years_experience', Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ta'lim darajasi
                </label>
                <select
                  value={formData.education_level}
                  onChange={(e) => handleInputChange('education_level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tanlanmagan</option>
                  <option value="High School">O'rta maktab</option>
                  <option value="Associate Degree">Kollej</option>
                  <option value="Bachelor's Degree">Bakalavr</option>
                  <option value="Master's Degree">Magistr</option>
                  <option value="PhD">PhD</option>
                  <option value="Other">Boshqa</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profil rasmi
                </label>
                <div className="space-y-3">
                  {formData.profile_image_url ? (
                    <div className="relative inline-flex items-center">
                      <img
                        src={formData.profile_image_url}
                        alt="Xodim rasmi"
                        className="h-28 w-28 rounded-xl object-cover shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-500 shadow hover:text-red-600"
                        aria-label="Rasmni olib tashlash"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-28 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
                      Rasm tanlanmagan
                    </div>
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <label className="inline-flex cursor-pointer items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:border-blue-400 hover:text-blue-600">
                      <UploadCloud className="h-4 w-4" />
                      <span>Rasm yuklash</span>
                      <input
                        key={imageInputKey}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleImageInputChange}
                        className="hidden"
                      />
                    </label>
                    {formData.profile_image_url && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:border-red-300 hover:text-red-600"
                      >
                        Rasmni olib tashlash
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    JPG, PNG yoki WebP. Maksimal {maxImageSizeMb}MB.
                  </p>
                  {imageError && (
                    <p className="text-xs font-semibold text-red-600">
                      {imageError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Aloqa ma'lumotlari
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="employee@example.com"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+998 90 123 45 67"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Favqulodda aloqa qilinadigan shaxs
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Shaxs ismi"
                  />
                  <input
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Telefon raqam"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Manzil ma'lumotlari
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ko'cha manzili
                </label>
                <input
                  type="text"
                  value={formData.address_street}
                  onChange={(e) => handleInputChange('address_street', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shahar
                </label>
                <input
                  type="text"
                  value={formData.address_city}
                  onChange={(e) => handleInputChange('address_city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Viloyat / Shtat
                </label>
                <input
                  type="text"
                  value={formData.address_state}
                  onChange={(e) => handleInputChange('address_state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pochta indeksi
                </label>
                <input
                  type="text"
                  value={formData.address_zip}
                  onChange={(e) => handleInputChange('address_zip', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mamlakat
                </label>
                <input
                  type="text"
                  value={formData.address_country}
                  onChange={(e) => handleInputChange('address_country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Ko'nikmalar
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ko'nikmani yozing va Enter tugmasini bosing"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Qo'shish
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-2 w-4 h-4 text-blue-600 hover:text-blue-800"
                      aria-label="Ko'nikmani olib tashlash"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Izohlar
            </h3>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Xodim haqida qo'shimcha izohlar..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saqlanmoqda...' : 'Xodimni saqlash'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
