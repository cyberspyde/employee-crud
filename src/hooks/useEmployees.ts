import { useState, useEffect } from 'react';
import type { Employee, EmployeeFormData, SearchFilters } from '../types/employee';
import {
  fetchEmployees as fetchEmployeesApi,
  fetchEmployee as fetchEmployeeApi,
  createEmployee as createEmployeeApi,
  updateEmployee as updateEmployeeApi,
  deleteEmployee as deleteEmployeeApi,
} from '../lib/api';

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async (filters?: SearchFilters) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEmployeesApi(filters);
      setEmployees(data || []);
    } catch (err) {
  const message = err instanceof Error ? err.message : "Xatolik yuz berdi";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (employeeData: EmployeeFormData) => {
    try {
      const created = await createEmployeeApi(employeeData);
      setEmployees(prev => [created, ...prev]);
      return created;
    } catch (err) {
  const message = err instanceof Error ? err.message : "Xodimni qo'shishda xatolik";
      throw new Error(message);
    }
  };

  const updateEmployee = async (id: string, employeeData: Partial<EmployeeFormData>) => {
    try {
      const updated = await updateEmployeeApi(id, employeeData);
      setEmployees(prev => prev.map(emp => (emp.id === id ? updated : emp)));
      return updated;
    } catch (err) {
  const message = err instanceof Error ? err.message : "Xodimni yangilashda xatolik";
      throw new Error(message);
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await deleteEmployeeApi(id);
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    } catch (err) {
  const message = err instanceof Error ? err.message : "Xodimni o'chirishda xatolik";
      throw new Error(message);
    }
  };

  const getEmployee = async (id: string) => {
    try {
      return await fetchEmployeeApi(id);
    } catch (err) {
  const message = err instanceof Error ? err.message : "Xodimni olishda xatolik";
      throw new Error(message);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee,
  };
}



