import { useState } from 'react';
import { useEmployees } from './hooks/useEmployees';
import { Employee, SearchFilters } from './types/employee';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import SearchEmployees from './components/SearchEmployees';
import EmployeeForm from './components/EmployeeForm';
import EmployeeDetail from './components/EmployeeDetail';

function App() {
  const { 
    employees, 
    loading, 
    error, 
    fetchEmployees, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee 
  } = useEmployees();

  const [currentView, setCurrentView] = useState('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  const handleAddEmployee = async (data: any) => {
    try {
      await addEmployee(data);
      setShowForm(false);
      if (currentView !== 'employees') {
        setCurrentView('employees');
      }
    } catch (error) {
      console.error("Xodimni qo'shishda xatolik:", error);
    }
  };

  const handleUpdateEmployee = async (data: any) => {
    if (!editingEmployee) return;
    try {
      await updateEmployee(editingEmployee.id, data);
      setEditingEmployee(null);
      setViewingEmployee(null);
    } catch (error) {
      console.error("Xodimni yangilashda xatolik:", error);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm("Haqiqatan ham bu xodimni o'chirib tashlamoqchimisiz?")) {
      try {
        await deleteEmployee(id);
      } catch (error) {
        console.error("Xodimni o'chirishda xatolik:", error);
      }
    }
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    if (view === 'add') {
      setShowForm(true);
    }
  };

  const handleSearch = (filters: SearchFilters) => {
    fetchEmployees(filters);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setViewingEmployee(null);
  };

  const handleViewEmployee = (employee: Employee) => {
    setViewingEmployee(employee);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard employees={employees} loading={loading} />;
      case 'employees':
        return (
          <EmployeeList
            employees={employees}
            loading={loading}
            onEdit={handleEditEmployee}
            onDelete={handleDeleteEmployee}
            onView={handleViewEmployee}
          />
        );
      case 'search':
        return (
          <SearchEmployees
            employees={employees}
            onFilter={handleSearch}
            loading={loading}
          />
        );
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

  return (
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
  );
}

export default App;


