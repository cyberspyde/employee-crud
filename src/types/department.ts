import type { Employee } from "./employee";

export interface Department {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  head_id?: string;
  member_count?: number;
  created_at: string;
  updated_at: string;
}

export interface DepartmentMember {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  position: string;
}

export interface DepartmentNode extends Department {
  children: DepartmentNode[];
  employees: DepartmentMember[];
  depth: number;
  path: string[];
  path_names: string[];
}

export interface DepartmentInput {
  name: string;
  description?: string;
  parent_id?: string | null;
  head_id?: string | null;
}

export interface DepartmentUpdateInput {
  name?: string;
  description?: string | null;
  parent_id?: string | null;
  head_id?: string | null;
}

export interface DepartmentAssignmentResponse {
  department: Department;
  employees: Employee[];
}


