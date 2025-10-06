import { useState, useCallback } from "react";
import { useEmployees } from "./hooks/useEmployees";
import { Employee, SearchFilters, EmployeeFormData } from "./types/employee";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import EmployeeList from "./components/EmployeeList";
import SearchEmployees from "./components/SearchEmployees";
import EmployeeForm from "./components/EmployeeForm";
import EmployeeDetail from "./components/EmployeeDetail";
import { AdminUnlockModal } from "./components/AdminUnlockModal";
import { Settings } from "./components/Settings";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  const {
    employees,
    loading,
    error,
    fetchEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  } = useEmployees();

  const [currentView, setCurrentView] = useState("dashboard");
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleAddEmployee = useCallback(
    async (data: EmployeeFormData) => {
      try {
        await addEmployee(data);
        setShowForm(false);
        if (currentView !== "employees") {
          setCurrentView("employees");
        }
      } catch (error) {
        console.error("Xodimni qo'shishda xatolik:", error);
      }
    },
    [addEmployee, currentView],
  );

  const handleUpdateEmployee = useCallback(
    async (data: Partial<EmployeeFormData>) => {
      if (!editingEmployee) return;
      try {
        await updateEmployee(editingEmployee.id, data);
        setEditingEmployee(null);
        setViewingEmployee(null);
      } catch (error) {
        console.error("Xodimni yangilashda xatolik:", error);
      }
    },
    [editingEmployee, updateEmployee],
  );

  const handleDeleteEmployee = useCallback(
    async (id: string) => {
      if (
        window.confirm("Haqiqatan ham bu xodimni o'chirib tashlamoqchimisiz?")
      ) {
        try {
          await deleteEmployee(id);
        } catch (error) {
          console.error("Xodimni o'chirishda xatolik:", error);
        }
      }
    },
    [deleteEmployee],
  );

  const handleViewChange = useCallback((view: string) => {
    setCurrentView(view);
    if (view === "add") {
      setShowForm(true);
    }
  }, []);

  const handleSearch = useCallback(
    (filters: SearchFilters) => {
      fetchEmployees(filters);
    },
    [fetchEmployees],
  );

  const handleEditEmployee = useCallback((employee: Employee) => {
    setEditingEmployee(employee);
    setViewingEmployee(null);
  }, []);

  const handleViewEmployee = useCallback((employee: Employee) => {
    setViewingEmployee(employee);
  }, []);

  const renderCurrentView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard employees={employees} loading={loading} />;
      case "employees":
        return (
          <EmployeeList
            employees={employees}
            loading={loading}
            onEdit={handleEditEmployee}
            onDelete={handleDeleteEmployee}
            onView={handleViewEmployee}
          />
        );
      case "search":
        return (
          <SearchEmployees
            employees={employees}
            onFilter={handleSearch}
            loading={loading}
            onView={handleViewEmployee}
            onEdit={handleEditEmployee}
            onDelete={handleDeleteEmployee}
          />
        );
      case "settings":
        return <Settings />;
      default:
        return <Dashboard employees={employees} loading={loading} />;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Xato</h2>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">
            Iltimos, server sozlamalari to'g'ri ekanini tekshiring.
          </p>
        </div>
      </div>
    );
  }

  const handleUnlock = () => {
    setIsUnlocked(true);
  };

  if (!isUnlocked) {
    return <AdminUnlockModal onUnlock={handleUnlock} />;
  }

  return (
    <ThemeProvider>
      <div>
        <Layout currentView={currentView} onViewChange={handleViewChange}>
          {renderCurrentView()}
        </Layout>

        {/* Add Employee Form */}
        {showForm && (
          <EmployeeForm
            onSave={handleAddEmployee}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Edit Employee Form */}
        {editingEmployee && (
          <EmployeeForm
            employee={editingEmployee}
            onSave={handleUpdateEmployee}
            onCancel={() => setEditingEmployee(null)}
          />
        )}

        {/* Employee Detail View */}
        {viewingEmployee && (
          <EmployeeDetail
            employee={viewingEmployee}
            onClose={() => setViewingEmployee(null)}
            onEdit={() => handleEditEmployee(viewingEmployee)}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
