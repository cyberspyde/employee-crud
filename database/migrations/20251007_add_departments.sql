/*
  # Introduce Department Hierarchies

  1. Schema
    - Create `departments` table with self-referencing hierarchy and metadata columns.
    - Link employees to departments via `department_id` while keeping legacy department names.

  2. Data Migration
    - Seed existing employee departments, including a fallback `Unassigned` root node.
    - Backfill `department_id` for all employees.
*/

BEGIN;

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  parent_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  head_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_name_lower ON departments (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON departments (parent_id);
CREATE INDEX IF NOT EXISTS idx_departments_head_id ON departments (head_id);

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

INSERT INTO departments (name, description)
VALUES ('Unassigned', 'Default holding department for employees awaiting assignment')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id) ON DELETE SET NULL;

INSERT INTO departments (name)
SELECT DISTINCT department
FROM employees
WHERE department IS NOT NULL
  AND LENGTH(TRIM(department)) > 0
  AND LOWER(department) <> 'unassigned'
ON CONFLICT (name) DO NOTHING;

UPDATE employees e
SET department_id = d.id
FROM departments d
WHERE e.department_id IS NULL
  AND LOWER(TRIM(e.department)) = LOWER(d.name);

WITH unassigned AS (
  SELECT id, name FROM departments WHERE LOWER(name) = 'unassigned' LIMIT 1
)
UPDATE employees e
SET department_id = unassigned.id,
    department = unassigned.name
FROM unassigned
WHERE e.department_id IS NULL;

COMMIT;
