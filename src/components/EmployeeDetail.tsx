import { X, CreditCard as Edit, Mail, Phone, MapPin, Calendar, Briefcase, Star, User } from 'lucide-react';
import { Employee } from '../types/employee';

interface EmployeeDetailProps {
  employee: Employee;
  onClose: () => void;
  onEdit: () => void;
}

export default function EmployeeDetail({ employee, onClose, onEdit }: EmployeeDetailProps) {
  const statusLabels: Record<Employee['employment_status'], string> = {
    active: 'Faol',
    inactive: 'Noaktiv',
    terminated: "Ishdan bo'shatilgan",
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "Ko'rsatilmagan";
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <span className="text-white text-xl font-semibold">
                {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {employee.first_name} {employee.last_name}
              </h2>
              <p className="text-gray-600">{employee.position} €¢ {employee.department}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                employee.employment_status === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : employee.employment_status === 'inactive'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {statusLabels[employee.employment_status] ?? employee.employment_status}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Tahrirlash</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="bg-gray-50/80 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Asosiy ma'lumotlar
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Xodim ID:</span>
                    <span className="font-medium text-gray-900">#{employee.employee_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tug'ilgan sana:</span>
                    <span className="font-medium text-gray-900">
                      {employee.date_of_birth ? formatDate(employee.date_of_birth) : "Ko'rsatilmagan"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ishga qabul qilingan sana:</span>
                    <span className="font-medium text-gray-900">{formatDate(employee.hire_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tajriba yillari:</span>
                    <span className="font-medium text-gray-900">{employee.years_experience} yil</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/80 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Aloqa ma'lumotlari
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-gray-600">Elektron pochta:</span>
                      <a href={`mailto:${employee.email}`} className="ml-2 text-blue-600 hover:underline">
                        {employee.email}
                      </a>
                    </div>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <span className="text-gray-600">Telefon:</span>
                        <a href={`tel:${employee.phone}`} className="ml-2 text-blue-600 hover:underline">
                          {employee.phone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              {(employee.emergency_contact_name || employee.emergency_contact_phone) && (
                <div className="bg-gray-50/80 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Favqulodda aloqa</h3>
                  <div className="space-y-3">
                    {employee.emergency_contact_name && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ism:</span>
                        <span className="font-medium text-gray-900">{employee.emergency_contact_name}</span>
                      </div>
                    )}
                    {employee.emergency_contact_phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Telefon:</span>
                        <span className="font-medium text-gray-900">{employee.emergency_contact_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Employment & Professional Details */}
            <div className="space-y-6">
              <div className="bg-gray-50/80 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Bandlik tafsilotlari
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lavozim:</span>
                    <span className="font-medium text-gray-900">{employee.position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bo'lim:</span>
                    <span className="font-medium text-gray-900">{employee.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ish haqi:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(employee.salary)}</span>
                  </div>
                  {employee.education_level && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ta'lim:</span>
                      <span className="font-medium text-gray-900">{employee.education_level}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              {(employee.address_street || employee.address_city) && (
                <div className="bg-gray-50/80 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Manzil
                  </h3>
                  <div className="text-gray-900">
                    {employee.address_street && (
                      <div>{employee.address_street}</div>
                    )}
                    <div>
                      {employee.address_city}{employee.address_city && employee.address_state && ', '}
                      {employee.address_state} {employee.address_zip}
                    </div>
                    {employee.address_country && (
                      <div>{employee.address_country}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Skills */}
              {employee.skills && employee.skills.length > 0 && (
                <div className="bg-gray-50/80 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Star className="w-5 h-5 mr-2" />
                    Ko'nikmalar
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {employee.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Work Experience */}
          {employee.experiences && employee.experiences.length > 0 && (
            <div className="mt-8 bg-gray-50/80 dark:bg-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Ish tajribasi
              </h3>
              <div className="space-y-4">
                {employee.experiences.map((exp, index) => (
                  <div key={exp.id || index} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{exp.position}</h4>
                    <p className="text-gray-700 dark:text-gray-300">{exp.company}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(exp.start_date)} - {exp.end_date ? formatDate(exp.end_date) : 'Hozir'}
                    </p>
                    {exp.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-2">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {employee.education && employee.education.length > 0 && (
            <div className="mt-8 bg-gray-50/80 dark:bg-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2" />
                Ta'lim
              </h3>
              <div className="space-y-4">
                {employee.education.map((edu, index) => (
                  <div key={edu.id || index} className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{edu.degree}</h4>
                    <p className="text-gray-700 dark:text-gray-300">{edu.institution}</p>
                    {edu.field_of_study && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{edu.field_of_study}</p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(edu.start_date)} - {edu.end_date ? formatDate(edu.end_date) : 'Hozir'}
                    </p>
                    {edu.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-2">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {employee.notes && (
            <div className="mt-8 bg-gray-50/80 dark:bg-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Izohlar</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{employee.notes}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50/80 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-600">Yaratilgan vaqt:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {formatDate(employee.created_at)}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50/80 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-600">So'nggi yangilanish:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {formatDate(employee.updated_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



