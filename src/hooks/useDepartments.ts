import { useState, useCallback, useEffect } from "react";
import type {
  Department,
  DepartmentInput,
  DepartmentNode,
  DepartmentUpdateInput,
  DepartmentAssignmentResponse,
} from "../types/department";
import type { Employee } from "../types/employee";
import {
  fetchDepartments,
  fetchDepartmentTree,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignEmployeesToDepartment,
  removeEmployeeFromDepartment,
} from "../lib/api";

interface UseDepartmentsOptions {
  autoLoad?: boolean;
}

interface UseDepartmentsResult {
  departments: Department[];
  tree: DepartmentNode[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshTree: () => Promise<void>;
  create: (payload: DepartmentInput) => Promise<Department>;
  update: (id: string, payload: DepartmentUpdateInput) => Promise<Department>;
  remove: (id: string) => Promise<void>;
  assignEmployees: (
    departmentId: string,
    employeeIds: string[],
  ) => Promise<DepartmentAssignmentResponse>;
  removeEmployee: (departmentId: string, employeeId: string) => Promise<Employee>;
}

const DEFAULT_OPTIONS: UseDepartmentsOptions = {
  autoLoad: true,
};

function sortDepartments(input: Department[]): Department[] {
  return [...input].sort((a, b) => a.name.localeCompare(b.name));
}

export function useDepartments(options: UseDepartmentsOptions = DEFAULT_OPTIONS): UseDepartmentsResult {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tree, setTree] = useState<DepartmentNode[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(options.autoLoad));
  const [error, setError] = useState<string | null>(null);

  const loadTree = useCallback(async () => {
    const nodes = await fetchDepartmentTree();
    setTree(nodes);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [list, nodes] = await Promise.all([fetchDepartments(), fetchDepartmentTree()]);
      setDepartments(sortDepartments(list));
      setTree(nodes);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bo'lim ma'lumotlarini yuklab bo'lmadi";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTree = useCallback(async () => {
    try {
      await loadTree();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bo'lim daraxtini yangilab bo'lmadi";
      setError(message);
      throw err;
    }
  }, [loadTree]);

  useEffect(() => {
    if (options.autoLoad) {
      refresh().catch(() => {
        // error state already handled above
      });
    }
  }, [options.autoLoad, refresh]);

  const create = useCallback(
    async (payload: DepartmentInput): Promise<Department> => {
      try {
        const created = await createDepartment(payload);
        setDepartments((current) => sortDepartments([...current, created]));
        await loadTree().catch(() => undefined);
        setError(null);
        return created;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Bo'limni yaratib bo'lmadi";
        setError(message);
        throw err;
      }
    },
    [loadTree],
  );

  const update = useCallback(
    async (id: string, payload: DepartmentUpdateInput): Promise<Department> => {
      try {
        const updated = await updateDepartment(id, payload);
        setDepartments((current) =>
          sortDepartments(current.map((department) => (department.id === id ? { ...department, ...updated } : department))),
        );
        await loadTree().catch(() => undefined);
        setError(null);
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Bo'limni yangilab bo'lmadi";
        setError(message);
        throw err;
      }
    },
    [loadTree],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteDepartment(id);
        setDepartments((current) => current.filter((department) => department.id !== id));
        await loadTree().catch(() => undefined);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Bo'limni o'chirib bo'lmadi";
        setError(message);
        throw err;
      }
    },
    [loadTree],
  );

  const assignEmployees = useCallback(
    async (departmentId: string, employeeIds: string[]): Promise<DepartmentAssignmentResponse> => {
      try {
        const response = await assignEmployeesToDepartment(departmentId, employeeIds);
        await refresh().catch(() => undefined);
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Xodimlarni bo'limga biriktirib bo'lmadi";
        setError(message);
        throw err;
      }
    },
    [refresh],
  );

  const removeEmployee = useCallback(
    async (departmentId: string, employeeId: string): Promise<Employee> => {
      try {
        const employee = await removeEmployeeFromDepartment(departmentId, employeeId);
        await refresh().catch(() => undefined);
        return employee;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Xodimni bo'limdan ajratib bo'lmadi";
        setError(message);
        throw err;
      }
    },
    [refresh],
  );

  return {
    departments,
    tree,
    loading,
    error,
    refresh,
    refreshTree,
    create,
    update,
    remove,
    assignEmployees,
    removeEmployee,
  };
}
