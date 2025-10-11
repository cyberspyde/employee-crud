const fs = require("fs");
const path = "src/components/EmployeeForm.tsx";
let text = fs.readFileSync(path, "utf8");
const original = String.raw`                <div>
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
                </div>`;
const replacement = String.raw`                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bo'lim *
                  </label>
                  <select
                    value={formData.department_id ?? ''}
                    onChange={(event) => {
                      const value = event.target.value;
                      const found = departments.find((department) => department.id === value);
                      handleInputChange('department', found?.name ?? '');
                      setFormData((current) => ({
                        ...current,
                        department_id: value ? value : undefined,
                      }));
                    }}
                    disabled={departmentsLoading}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-gray-100 ${
                      errors.department
                        ? 'border-red-300 dark:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="" disabled>
                      {departmentsLoading ? "Bo'limlar yuklanmoqda..." : "Bo'limni tanlang"}
                    </option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                  {departmentsError && (
                    <p className="text-red-600 text-sm mt-1">{departmentsError}</p>
                  )}
                  {errors.department && (
                    <p className="text-red-600 text-sm mt-1">{errors.department}</p>
                  )}
                </div>`;
if (text.includes(original)) {
  text = text.replace(original, replacement);
  fs.writeFileSync(path, text);
}
