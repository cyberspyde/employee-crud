/*
  # Add Employee Experiences and Education Tables

  1. New Tables
    - `employee_experiences`
      - Work history for each employee
      - Multiple records per employee
    - `employee_education`
      - Education history for each employee
      - Multiple records per employee

  2. Indexes
    - Foreign key indexes for performance
    - Date indexes for filtering
*/

-- Create employee_experiences table
CREATE TABLE IF NOT EXISTS employee_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  company text NOT NULL,
  position text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create employee_education table
CREATE TABLE IF NOT EXISTS employee_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  institution text NOT NULL,
  degree text NOT NULL,
  field_of_study text,
  start_date date NOT NULL,
  end_date date,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_experiences_employee_id ON employee_experiences(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_experiences_dates ON employee_experiences(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_employee_education_employee_id ON employee_education(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_education_dates ON employee_education(start_date, end_date);

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_employee_experiences_updated_at
  BEFORE UPDATE ON employee_experiences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_education_updated_at
  BEFORE UPDATE ON employee_education
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add sample experience data for existing employees
INSERT INTO employee_experiences (employee_id, company, position, start_date, end_date, description)
SELECT 
  id,
  'Previous Company Inc',
  'Software Developer',
  hire_date - INTERVAL '3 years',
  hire_date - INTERVAL '1 day',
  'Worked on web applications using modern technologies'
FROM employees
WHERE employee_id IN ('EMP001', 'EMP005')
ON CONFLICT DO NOTHING;

-- Add sample education data for existing employees
INSERT INTO employee_education (employee_id, institution, degree, field_of_study, start_date, end_date, description)
SELECT 
  id,
  'State University',
  'Bachelor of Science',
  'Computer Science',
  hire_date - INTERVAL '7 years',
  hire_date - INTERVAL '3 years',
  'Graduated with honors'
FROM employees
WHERE employee_id IN ('EMP001', 'EMP002', 'EMP003')
ON CONFLICT DO NOTHING;
