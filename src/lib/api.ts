import type { Employee, EmployeeFormData, SearchFilters, Experience, Education } from '../types/employee';
import type {
  Department,
  DepartmentNode,
  DepartmentInput,
  DepartmentUpdateInput,
  DepartmentAssignmentResponse,
} from '../types/department';

const DEFAULT_API_PORT = '4000';

function resolveBaseUrl(): string {
  const explicit = import.meta.env.VITE_API_BASE_URL;
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined' && window.location) {
    const origin = new URL(window.location.origin);
    const configuredPort = import.meta.env.VITE_API_PORT ?? DEFAULT_API_PORT;
    origin.port = configuredPort;
    return origin.toString().replace(/\/$/, '');
  }

  return `http://localhost:${DEFAULT_API_PORT}`;
}

const API_BASE_URL = resolveBaseUrl();

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const normalizedHeaders = new Headers(headers);

  let serializedBody: BodyInit | undefined;
  if (body !== undefined) {
    serializedBody = JSON.stringify(body);
    if (!normalizedHeaders.has('Content-Type')) {
      normalizedHeaders.set('Content-Type', 'application/json');
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: normalizedHeaders,
    body: serializedBody,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
      const message = typeof payload === 'string' ? payload : payload?.error ?? payload?.message;
      throw new Error(message || "So'rov bajarilmadi");
  }

  return payload as T;
}

function buildQueryString(filters?: Partial<SearchFilters>): string {
  if (!filters) {
    return '';
  }

  const params = new URLSearchParams();

  if (filters.query) {
    params.set('query', filters.query);
  }
  if (filters.department_id && filters.department_id !== 'all') {
    params.set('department_id', filters.department_id);
  } else if (filters.department && filters.department !== 'all') {
    params.set('department', filters.department);
  }
  if (filters.position && filters.position !== 'all') {
    params.set('position', filters.position);
  }
  if (filters.employment_status && filters.employment_status !== 'all') {
    params.set('employment_status', filters.employment_status);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export async function fetchEmployees(filters?: Partial<SearchFilters>): Promise<Employee[]> {
  const queryString = buildQueryString(filters);
  return request<Employee[]>(`/employees${queryString}`);
}

export async function fetchEmployee(id: string): Promise<Employee> {
  return request<Employee>(`/employees/${id}`);
}

export async function createEmployee(payload: EmployeeFormData): Promise<Employee> {
  return request<Employee>('/employees', { method: 'POST', body: payload });
}

export async function updateEmployee(id: string, payload: Partial<EmployeeFormData>): Promise<Employee> {
  return request<Employee>(`/employees/${id}`, { method: 'PUT', body: payload });
}

export async function deleteEmployee(id: string): Promise<void> {
  await request<void>(`/employees/${id}`, { method: 'DELETE' });
}

export async function uploadImage(file: File): Promise<{ filePath: string }> {
  const formData = new FormData();
  formData.append('profile_image', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json();
    const message = payload?.error ?? "Rasm yuklashda xatolik";
    throw new Error(message);
  }

  return response.json();
}

// ==================== EXPERIENCE API ====================

export async function fetchExperiences(employeeId: string): Promise<Experience[]> {
  return request<Experience[]>(`/employees/${employeeId}/experiences`);
}

export async function createExperience(employeeId: string, payload: Omit<Experience, 'id' | 'employee_id' | 'created_at' | 'updated_at'>): Promise<Experience> {
  return request<Experience>(`/employees/${employeeId}/experiences`, { method: 'POST', body: payload });
}

export async function updateExperience(employeeId: string, experienceId: string, payload: Omit<Experience, 'id' | 'employee_id' | 'created_at' | 'updated_at'>): Promise<Experience> {
  return request<Experience>(`/employees/${employeeId}/experiences/${experienceId}`, { method: 'PUT', body: payload });
}

export async function deleteExperience(employeeId: string, experienceId: string): Promise<void> {
  await request<void>(`/employees/${employeeId}/experiences/${experienceId}`, { method: 'DELETE' });
}

// ==================== EDUCATION API ====================

export async function fetchEducation(employeeId: string): Promise<Education[]> {
  return request<Education[]>(`/employees/${employeeId}/education`);
}

export async function createEducation(employeeId: string, payload: Omit<Education, 'id' | 'employee_id' | 'created_at' | 'updated_at'>): Promise<Education> {
  return request<Education>(`/employees/${employeeId}/education`, { method: 'POST', body: payload });
}

export async function updateEducation(employeeId: string, educationId: string, payload: Omit<Education, 'id' | 'employee_id' | 'created_at' | 'updated_at'>): Promise<Education> {
  return request<Education>(`/employees/${employeeId}/education/${educationId}`, { method: 'PUT', body: payload });
}

export async function deleteEducation(employeeId: string, educationId: string): Promise<void> {
  await request<void>(`/employees/${employeeId}/education/${educationId}`, { method: 'DELETE' });
}


export async function fetchDepartments(): Promise<Department[]> {
  return request<Department[]>("/departments");
}

export async function fetchDepartmentTree(): Promise<DepartmentNode[]> {
  return request<DepartmentNode[]>("/departments/tree");
}

export async function createDepartment(payload: DepartmentInput): Promise<Department> {
  return request<Department>("/departments", { method: "POST", body: payload });
}

export async function updateDepartment(
  id: string,
  payload: DepartmentUpdateInput,
): Promise<Department> {
  return request<Department>(`/departments/${id}`, { method: "PUT", body: payload });
}

export async function deleteDepartment(id: string): Promise<void> {
  await request<void>(`/departments/${id}`, { method: "DELETE" });
}

export async function assignEmployeesToDepartment(
  departmentId: string,
  employeeIds: string[],
): Promise<DepartmentAssignmentResponse> {
  return request<DepartmentAssignmentResponse>(
    `/departments/${departmentId}/employees`,
    { method: "POST", body: { employeeIds } },
  );
}

export async function removeEmployeeFromDepartment(
  departmentId: string,
  employeeId: string,
): Promise<Employee> {
  return request<Employee>(`/departments/${departmentId}/employees/${employeeId}`, {
    method: "DELETE",
  });
}
