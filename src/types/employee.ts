export interface Experience {
  id?: string;
  employee_id?: string;
  company: string;
  position: string;
  start_date: string;
  end_date?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Education {
  id?: string;
  employee_id?: string;
  institution: string;
  degree: string;
  field_of_study?: string;
  start_date: string;
  end_date?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  hire_date: string;
  position: string;
  department: string;
  department_id?: string;
  salary?: number;
  manager_id?: string;
  employment_status: 'active' | 'inactive' | 'terminated';
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  address_country?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  skills: string[];
  years_experience: number;
  education_level?: string;
  profile_image_url?: string;
  notes?: string;
  experiences?: Experience[];
  education?: Education[];
  created_at: string;
  updated_at: string;
}

export interface EmployeeFormData {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  hire_date: string;
  position: string;
  department: string;
  department_id?: string;
  salary?: number;
  employment_status: 'active' | 'inactive' | 'terminated';
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  address_country?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  skills: string[];
  years_experience: number;
  education_level?: string;
  profile_image_url?: string;
  notes?: string;
  experiences?: Experience[];
  education?: Education[];
}

export interface SearchFilters {
  query: string;
  department: string;
  position: string;
  employment_status: string;
  department_id?: string;
}




