import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, User, Mail, MapPin, UploadCloud, Plus, Briefcase, GraduationCap } from "lucide-react";
import { Employee, EmployeeFormData, Experience, Education } from "../types/employee";
import { uploadImage } from "../lib/api";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;

interface EmployeeFormProps {
  employee?: Employee | null;
  onSave: (data: EmployeeFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function EmployeeForm({
  employee,
  onSave,
  onCancel,
  loading,
}: EmployeeFormProps) {
  const [formData, setFormData] = useState<EmployeeFormData>({
    employee_id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    hire_date: new Date().toISOString().split("T")[0],
    position: "",
    department: "",
    salary: undefined,
    employment_status: "active",
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    address_country: "O'zbekiston",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    skills: [],
    years_experience: 0,
    education_level: "",
    profile_image_url: "",
    notes: "",
    experiences: [],
    education: [],
  });

  const [skillInput, setSkillInput] = useState("");
  const [newExperience, setNewExperience] = useState<Experience>({
    company: "",
    position: "",
    start_date: "",
    end_date: "",
    description: "",
  });
  const [newEducation, setNewEducation] = useState<Education>({
    institution: "",
    degree: "",
    field_of_study: "",
    start_date: "",
    end_date: "",
    description: "",
  });
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
        phone: employee.phone || "",
        date_of_birth: employee.date_of_birth || "",
        hire_date: employee.hire_date,
        position: employee.position,
        department: employee.department,
        salary: employee.salary,
        employment_status: employee.employment_status,
        address_street: employee.address_street || "",
        address_city: employee.address_city || "",
        address_state: employee.address_state || "",
        address_zip: employee.address_zip || "",
        address_country: employee.address_country || "O'zbekiston",
        emergency_contact_name: employee.emergency_contact_name || "",
        emergency_contact_phone: employee.emergency_contact_phone || "",
        skills: employee.skills,
        years_experience: employee.years_experience,
        education_level: employee.education_level || "",
        profile_image_url: employee.profile_image_url || "",
        notes: employee.notes || "",
        experiences: employee.experiences || [],
        education: employee.education || [],
      });
      setImageError(null);
      setImageInputKey((prev) => prev + 1);
    } else {
      setFormData((prev) => ({
        ...prev,
        hire_date: new Date().toISOString().split("T")[0],
        profile_image_url: "",
        experiences: [],
        education: [],
      }));
      setImageError(null);
      setImageInputKey((prev) => prev + 1);
    }
  }, [employee]);

  const validateForm = (): boolean => {
    const newErrors: Partial<EmployeeFormData> = {};

    if (!formData.first_name.trim())
      newErrors.first_name = "Ism kiritilishi shart";
    if (!formData.last_name.trim())
      newErrors.last_name = "Familiya kiritilishi shart";
    if (!formData.email.trim()) newErrors.email = "Email kiritilishi shart";
    if (!formData.position.trim())
      newErrors.position = "Lavozim kiritilishi shart";
    if (!formData.department.trim())
      newErrors.department = "Bo'lim kiritilishi shart";

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleInputChange = (field: keyof EmployeeFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSkill();
    }
  };

  const handleImageFileSelect = async (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.some((type) => type === file.type)) {
      setImageError("Ruxsat etilgan formatlar: JPG, PNG yoki WebP.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageError(`Rasm hajmi ${maxImageSizeMb}MB dan oshmasligi kerak.`);
      return;
    }

    setImageError(null);
    try {
      const { filePath } = await uploadImage(file);
      handleInputChange("profile_image_url", filePath);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Rasmni yuklashda xatolik yuz berdi.";
      setImageError(message);
    }
  };

  const handleImageInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageInputKey((prev) => prev + 1);
      return;
    }
    await handleImageFileSelect(file);
    setImageInputKey((prev) => prev + 1);
  };

  const handleRemoveImage = () => {
    handleInputChange("profile_image_url", "");
    setImageError(null);
    setImageInputKey((prev) => prev + 1);
  };

  // Experience handlers
  const addExperience = () => {
    if (newExperience.company && newExperience.position && newExperience.start_date) {
      setFormData((prev) => ({
        ...prev,
        experiences: [...(prev.experiences || []), { ...newExperience }],
      }));
      setNewExperience({
        company: "",
        position: "",
        start_date: "",
        end_date: "",
        description: "",
      });
    }
  };

  const removeExperience = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences?.filter((_, i) => i !== index) || [],
    }));
  };

  // Education handlers
  const addEducation = () => {
    if (newEducation.institution && newEducation.degree && newEducation.start_date) {
      setFormData((prev) => ({
        ...prev,
        education: [...(prev.education || []), { ...newEducation }],
      }));
      setNewEducation({
        institution: "",
        degree: "",
        field_of_study: "",
        start_date: "",
        end_date: "",
        description: "",
      });
    }
  };

  const removeEducation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education?.filter((_, i) => i !== index) || [],
    }));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl"
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {employee ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}
            </h2>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={onCancel}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
              aria-label="Yopish"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </motion.div>

          <form
            onSubmit={handleSubmit}
            className="overflow-y-auto max-h-[calc(90vh-80px)] p-6 space-y-6"
          >
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Asosiy ma'lumotlar
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bandlik holati
                  </label>
                  <select
                    value={formData.employment_status}
                    onChange={(e) =>
                      handleInputChange("employment_status", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Faol</option>
                    <option value="inactive">Noaktiv</option>
                    <option value="terminated">Ishdan bo'shatilgan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ism *
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) =>
                      handleInputChange("first_name", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-gray-100 ${
                      errors.first_name
                        ? "border-red-300 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.first_name && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.first_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Familiya *
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) =>
                      handleInputChange("last_name", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-gray-100 ${
                      errors.last_name
                        ? "border-red-300 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.last_name && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.last_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tug'ilgan sana
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) =>
                      handleInputChange("date_of_birth", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ishga qabul qilingan sana *
                  </label>
                  <input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) =>
                      handleInputChange("hire_date", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lavozim *
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) =>
                      handleInputChange("position", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-gray-100 ${
                      errors.position
                        ? "border-red-300 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.position && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.position}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bo'lim *
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) =>
                      handleInputChange("department", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-gray-100 ${
                      errors.department
                        ? "border-red-300 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.department && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.department}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ish haqi (USD)
                  </label>
                  <input
                    type="number"
                    value={formData.salary ?? ""}
                    onChange={(e) =>
                      handleInputChange(
                        "salary",
                        e.target.value ? parseFloat(e.target.value) : undefined,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tajriba yillari
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.years_experience}
                    onChange={(e) =>
                      handleInputChange(
                        "years_experience",
                        Number(e.target.value) || 0,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ta'lim darajasi
                  </label>
                  <select
                    value={formData.education_level}
                    onChange={(e) =>
                      handleInputChange("education_level", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                          className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-slate-800 text-gray-500 shadow hover:text-red-600"
                          aria-label="Rasmni olib tashlash"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-28 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-sm text-gray-500 dark:text-gray-400">
                        Rasm tanlanmagan
                      </div>
                    )}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <label className="inline-flex cursor-pointer items-center space-x-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400">
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Aloqa ma'lumotlari
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-gray-100 ${
                      errors.email
                        ? "border-red-300 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="employee@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+998 90 123 45 67"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Favqulodda aloqa qilinadigan shaxs
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={formData.emergency_contact_name}
                      onChange={(e) =>
                        handleInputChange(
                          "emergency_contact_name",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Shaxs ismi"
                    />
                    <input
                      type="tel"
                      value={formData.emergency_contact_phone}
                      onChange={(e) =>
                        handleInputChange(
                          "emergency_contact_phone",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Telefon raqam"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Manzil ma'lumotlari
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ko'cha manzili
                  </label>
                  <input
                    type="text"
                    value={formData.address_street}
                    onChange={(e) =>
                      handleInputChange("address_street", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Shahar
                  </label>
                  <input
                    type="text"
                    value={formData.address_city}
                    onChange={(e) =>
                      handleInputChange("address_city", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Viloyat / Shtat
                  </label>
                  <input
                    type="text"
                    value={formData.address_state}
                    onChange={(e) =>
                      handleInputChange("address_state", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pochta indeksi
                  </label>
                  <input
                    type="text"
                    value={formData.address_zip}
                    onChange={(e) =>
                      handleInputChange("address_zip", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mamlakat
                  </label>
                  <input
                    type="text"
                    value={formData.address_country}
                    onChange={(e) =>
                      handleInputChange("address_country", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Ko'nikmalar
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ko'nikma qo'shish..."
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors dark:bg-blue-600 dark:hover:bg-blue-700"
                  >
                    Qo'shish
                  </button>
                </div>
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-2 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Work Experience Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Ish tajribasi
              </h3>
              
              {/* Existing experiences */}
              {formData.experiences && formData.experiences.length > 0 && (
                <div className="space-y-3 mb-4">
                  {formData.experiences.map((exp, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {exp.position}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {exp.company}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExperience(index)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        {exp.start_date} - {exp.end_date || "Hozir"}
                      </p>
                      {exp.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add new experience form */}
              <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Yangi tajriba qo'shish
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newExperience.company}
                    onChange={(e) =>
                      setNewExperience({ ...newExperience, company: e.target.value })
                    }
                    placeholder="Kompaniya nomi *"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={newExperience.position}
                    onChange={(e) =>
                      setNewExperience({ ...newExperience, position: e.target.value })
                    }
                    placeholder="Lavozim *"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={newExperience.start_date}
                    onChange={(e) =>
                      setNewExperience({ ...newExperience, start_date: e.target.value })
                    }
                    placeholder="Boshlanish sanasi *"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={newExperience.end_date}
                    onChange={(e) =>
                      setNewExperience({ ...newExperience, end_date: e.target.value })
                    }
                    placeholder="Tugash sanasi"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <textarea
                  value={newExperience.description}
                  onChange={(e) =>
                    setNewExperience({ ...newExperience, description: e.target.value })
                  }
                  placeholder="Tavsif"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addExperience}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tajriba qo'shish
                </button>
              </div>
            </div>

            {/* Education Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2" />
                Ta'lim
              </h3>
              
              {/* Existing education */}
              {formData.education && formData.education.length > 0 && (
                <div className="space-y-3 mb-4">
                  {formData.education.map((edu, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {edu.degree}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {edu.institution}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEducation(index)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {edu.field_of_study && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {edu.field_of_study}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {edu.start_date} - {edu.end_date || "Hozir"}
                      </p>
                      {edu.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                          {edu.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add new education form */}
              <div className="space-y-3 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Yangi ta'lim qo'shish
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newEducation.institution}
                    onChange={(e) =>
                      setNewEducation({ ...newEducation, institution: e.target.value })
                    }
                    placeholder="Muassasa nomi *"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    value={newEducation.degree}
                    onChange={(e) =>
                      setNewEducation({ ...newEducation, degree: e.target.value })
                    }
                    placeholder="Daraja *"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    value={newEducation.field_of_study}
                    onChange={(e) =>
                      setNewEducation({ ...newEducation, field_of_study: e.target.value })
                    }
                    placeholder="O'qish yo'nalishi"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="date"
                    value={newEducation.start_date}
                    onChange={(e) =>
                      setNewEducation({ ...newEducation, start_date: e.target.value })
                    }
                    placeholder="Boshlanish sanasi *"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="date"
                    value={newEducation.end_date}
                    onChange={(e) =>
                      setNewEducation({ ...newEducation, end_date: e.target.value })
                    }
                    placeholder="Tugash sanasi"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <textarea
                  value={newEducation.description}
                  onChange={(e) =>
                    setNewEducation({ ...newEducation, description: e.target.value })
                  }
                  placeholder="Tavsif"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={addEducation}
                  className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ta'lim qo'shish
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Izohlar
              </h3>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Xodim haqida qo'shimcha izohlar..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? "Saqlanmoqda..." : "Xodimni saqlash"}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
