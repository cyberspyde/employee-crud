import type { Employee, EmployeeFormData, SearchFilters } from '../types/employee';

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
  if (filters.department && filters.department !== 'all') {
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



