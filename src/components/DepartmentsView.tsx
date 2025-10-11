import { useEffect, useMemo, useState } from "react";
import { GitBranch, Plus, RefreshCw, Users, Trash2, Edit2, UserPlus, ArrowUpRight, Link2 } from "lucide-react";
import type { DepartmentNode, DepartmentInput, DepartmentUpdateInput } from "../types/department";
import type { Employee } from "../types/employee";
import { useDepartments } from "../hooks/useDepartments";

interface DepartmentsViewProps {
  employees: Employee[];
  employeesLoading: boolean;
  refreshEmployees: () => Promise<void>;
}

interface FormState {
  name: string;
  description: string;
  parent_id: string | null;
}

function findNode(nodes: DepartmentNode[], id: string): DepartmentNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const child = findNode(node.children, id);
    if (child) {
      return child;
    }
  }
  return null;
}

function collectDescendants(root: DepartmentNode | null): Set<string> {
  const ids = new Set<string>();
  if (!root) {
    return ids;
  }
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    ids.add(current.id);
    stack.push(...current.children);
  }
  return ids;
}

function flatten(nodes: DepartmentNode[]): DepartmentNode[] {
  const result: DepartmentNode[] = [];
  const stack = [...nodes];
  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    result.push(current);
    stack.push(...current.children);
  }
  return result;
}

export default function DepartmentsView({ employees, employeesLoading, refreshEmployees }: DepartmentsViewProps) {
  const {
    departments,
    tree,
    loading,
    error,
    refresh,
    create,
    update,
    remove,
    assignEmployees,
    removeEmployee,
  } = useDepartments();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<FormState>({ name: "", description: "", parent_id: null });
  const [saving, setSaving] = useState(false);

  const [showAssign, setShowAssign] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  const selectedDepartment = useMemo(() => {
    if (!selectedId) return null;
    return departments.find((item) => item.id === selectedId) ?? null;
  }, [departments, selectedId]);

  const selectedNode = useMemo(() => {
    if (!selectedId) return null;
    return findNode(tree, selectedId);
  }, [tree, selectedId]);

  useEffect(() => {
    if (!selectedId && tree.length > 0) {
      setSelectedId(tree[0].id);
    }
  }, [tree, selectedId]);

  useEffect(() => {
    const initial = new Set<string>();
    flatten(tree).forEach((node) => {
      if (node.children.length > 0) {
        initial.add(node.id);
      }
    });
    setExpanded(initial);
  }, [tree]);

  const parentOptions = useMemo(() => {
    if (!selectedDepartment) {
      return departments;
    }
    const blocked = collectDescendants(selectedNode);
    blocked.add(selectedDepartment.id);
    return departments.filter((department) => !blocked.has(department.id));
  }, [departments, selectedDepartment, selectedNode]);

  const availableEmployees = useMemo(() => {
    if (!selectedDepartment) return [] as Employee[];
    return employees.filter((employee) => employee.department_id !== selectedDepartment.id);
  }, [employees, selectedDepartment]);

  const toggleExpanded = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleOpenCreate = (parentId: string | null) => {
    setFormState({ name: "", description: "", parent_id: parentId });
    setIsEditing(false);
    setShowForm(true);
  };

  const handleOpenEdit = () => {
    if (!selectedDepartment) return;
    setFormState({
      name: selectedDepartment.name,
      description: selectedDepartment.description ?? "",
      parent_id: selectedDepartment.parent_id ?? null,
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formState.name.trim()) return;
    setSaving(true);
    try {
      if (isEditing && selectedDepartment) {
        const payload: DepartmentUpdateInput = {
          name: formState.name.trim(),
          description: formState.description.trim() ? formState.description.trim() : null,
          parent_id: formState.parent_id,
        };
        await update(selectedDepartment.id, payload);
      } else {
        const payload: DepartmentInput = {
          name: formState.name.trim(),
          description: formState.description.trim() ? formState.description.trim() : undefined,
          parent_id: formState.parent_id,
          head_id: null,
        };
        await create(payload);
      }
      await refreshEmployees();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDepartment) return;
    if (!window.confirm(`"${selectedDepartment.name}� bo'limini o'chirmoqchimisiz?`)) {
      return;
    }
    setSaving(true);
    try {
      await remove(selectedDepartment.id);
      await refreshEmployees();
      setSelectedId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedDepartment || !selectedEmployee) return;
    setAssigning(true);
    try {
      await assignEmployees(selectedDepartment.id, [selectedEmployee]);
      await refreshEmployees();
      setShowAssign(false);
      setSelectedEmployee("");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveEmployee = async (employeeId: string) => {
    if (!selectedDepartment) return;
    if (!window.confirm("Xodimni bu bo'limdan olib tashlashni xohlaysizmi?")) {
      return;
    }
    await removeEmployee(selectedDepartment.id, employeeId);
    await refreshEmployees();
  };

  const handleRefresh = async () => {
    await refresh();
    await refreshEmployees();
  };

  const renderTree = (nodes: DepartmentNode[]) => (
    <ul className="space-y-2">
      {nodes.map((node) => {
        const isSelected = node.id === selectedId;
        const isExpanded = expanded.has(node.id);
        const buttonClass = isSelected
          ? "flex-1 rounded-lg border border-blue-500 bg-blue-50 px-3 py-2 text-left text-blue-700 dark:border-blue-400 dark:bg-blue-950/40"
          : "flex-1 rounded-lg border border-gray-200 px-3 py-2 text-left text-gray-800 hover:border-gray-300 dark:border-white/10 dark:bg-slate-900 dark:text-gray-100";
        return (
          <li key={node.id} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-start gap-2">
              <button type="button" className={buttonClass} onClick={() => setSelectedId(node.id)}>
                <div className="font-semibold">{node.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">A'zolar: {node.member_count ?? node.employees.length}</div>
              </button>
              <div className="flex flex-col gap-2">
                {node.children.length > 0 && (
                  <button
                    type="button"
                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:border-white/10 dark:text-gray-300"
                    onClick={() => toggleExpanded(node.id)}
                  >
                    {isExpanded ? "Yopish" : "Ochish"}
                  </button>
                )}
                <button
                  type="button"
                  className="rounded-lg border border-dashed border-gray-300 px-2 py-1 text-xs text-gray-600 hover:border-blue-400 hover:text-blue-600 dark:border-white/10 dark:text-gray-300"
                  onClick={() => handleOpenCreate(node.id)}
                >
                  <Plus className="mr-1 inline h-3 w-3" /> Pastki bo'lim
                </button>
              </div>
            </div>
            {isExpanded && node.children.length > 0 && (
              <div className="mt-2 border-l border-dashed border-gray-200 pl-3 dark:border-white/10">{renderTree(node.children)}</div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
            <GitBranch className="h-5 w-5 text-blue-500" /> Bo'limlar tartibi
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Bo'limlar, bog'lanishlar va xodimlarni boshqaring</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:border-white/10 dark:text-gray-300"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" /> Yangilash
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
            onClick={() => handleOpenCreate(null)}
          >
            <Plus className="h-4 w-4" /> Bo'lim qo'shish
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,_1fr)_minmax(0,_1fr)]">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-slate-950">
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Tartib</h3>
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">Yuklanmoqda...</div>
          ) : tree.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">Bo'limlar topilmadi</div>
          ) : (
            renderTree(tree)
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950">
          {selectedDepartment && selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedDepartment.name}</h3>
                  {selectedDepartment.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">{selectedDepartment.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 dark:bg-white/10">
                      <Users className="h-3 w-3" /> A'zolar: {selectedNode.member_count ?? selectedNode.employees.length}
                    </span>
                    {selectedDepartment.parent_id ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 dark:bg-white/10">
                        <Link2 className="h-3 w-3" /> Ota bo'lim mavjud
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 dark:bg-white/10">
                        <ArrowUpRight className="h-3 w-3" /> Yuqori daraja
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedDepartment.parent_id && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:border-white/10 dark:text-gray-300"
                      onClick={() => update(selectedDepartment.id, { parent_id: null })}
                    >
                      <ArrowUpRight className="h-3 w-3" /> Yuqoriga ko'tarish
                    </button>
                  )}
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:border-white/10 dark:text-gray-300"
                    onClick={handleOpenEdit}
                  >
                    <Edit2 className="h-3 w-3" /> Tahrirlash
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:border-red-300 dark:border-red-500/40 dark:text-red-300"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-3 w-3" /> O'chirish
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Xodimlar</h4>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-blue-700"
                    onClick={() => setShowAssign(true)}
                  >
                    <UserPlus className="h-3 w-3" /> Biriktirish
                  </button>
                </div>
                {selectedNode.employees.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Xodimlar mavjud emas.</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedNode.employees.map((employee) => (
                      <li key={employee.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-white/10">
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-200">
                            {employee.first_name} {employee.last_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{employee.position}</div>
                        </div>
                        <button
                          type="button"
                          className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:border-red-300 dark:border-red-500/40 dark:text-red-300"
                          onClick={() => handleRemoveEmployee(employee.id)}
                        >
                          Olib tashlash
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Pastki bo'limlar</h4>
                {selectedNode.children.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pastki bo'limlar mavjud emas.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.children.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:border-white/10 dark:text-gray-300"
                        onClick={() => setSelectedId(child.id)}
                      >
                        <GitBranch className="h-3 w-3" /> {child.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[200px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              Bo'limni tanlang yoki yangi bo'lim qo'shing
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{isEditing ? "Bo'limni tahrirlash" : "Yangi bo'lim"}</h4>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Nomi</label>
            <input
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Tavsif</label>
            <textarea
              value={formState.description}
              onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Ota bo'lim</label>
            <select
              value={formState.parent_id ?? "__root__"}
              onChange={(event) => setFormState((prev) => ({ ...prev, parent_id: event.target.value === "__root__" ? null : event.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900 dark:text-white"
            >
              <option value="__root__">Yuqori daraja</option>
              {parentOptions.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-blue-700 disabled:bg-blue-400"
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
            <button
              type="button"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:border-white/10 dark:text-gray-300"
              onClick={() => setShowForm(false)}
            >
              Bekor qilish
            </button>
          </div>
        </form>
      )}

      {showAssign && (
        <form onSubmit={handleAssign} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Xodimni biriktirish</h4>
          {employeesLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Xodimlar yuklanmoqda...</p>
          ) : availableEmployees.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Biriktirish uchun xodim yo'q.</p>
          ) : (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Xodim</label>
              <select
                value={selectedEmployee}
                onChange={(event) => setSelectedEmployee(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark;border-white/10 dark:bg-slate-900 dark:text-white"
                required
              >
                <option value="" disabled>
                  Xodimni tanlang
                </option>
                {availableEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name} � {employee.position}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={assigning || availableEmployees.length === 0}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-blue-700 disabled:bg-blue-400"
            >
              {assigning ? "Biriktirilmoqda..." : "Biriktirish"}
            </button>
            <button
              type="button"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:border-gray-300 hover:text-gray-900 dark;border-white/10 dark:text-gray-300"
              onClick={() => {
                setShowAssign(false);
                setSelectedEmployee("");
              }}
            >
              Bekor qilish
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
