/*
  # Employee Database Schema

  1. New Tables
    - `employees`
      - `id` (uuid, primary key)
      - `employee_id` (text, unique employee identifier)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `date_of_birth` (date)
      - `hire_date` (date)
      - `position` (text)
      - `department` (text)
      - `salary` (numeric)
      - `manager_id` (uuid, foreign key)
      - `employment_status` (text)
      - `address_street` (text)
      - `address_city` (text)
      - `address_state` (text)
      - `address_zip` (text)
      - `address_country` (text)
      - `emergency_contact_name` (text)
      - `emergency_contact_phone` (text)
      - `skills` (text array)
      - `years_experience` (integer)
      - `education_level` (text)
      - `profile_image_url` (text)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Local setup disables RLS/policies so the table is fully accessible.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  date_of_birth date,
  hire_date date NOT NULL DEFAULT CURRENT_DATE,
  position text NOT NULL,
  department text NOT NULL,
  salary numeric(10,2),
  manager_id uuid REFERENCES employees(id),
  employment_status text NOT NULL DEFAULT 'active',
  address_street text,
  address_city text,
  address_state text,
  address_zip text,
  address_country text DEFAULT 'USA',
  emergency_contact_name text,
  emergency_contact_phone text,
  skills text[] DEFAULT '{}',
  years_experience integer DEFAULT 0,
  education_level text,
  profile_image_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_position ON employees(position);
CREATE INDEX IF NOT EXISTS idx_employees_employment_status ON employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_employees_full_name ON employees(first_name, last_name);

-- Insert sample data
INSERT INTO employees (
  employee_id, first_name, last_name, email, phone, date_of_birth, hire_date,
  position, department, salary, employment_status, address_street, address_city,
  address_state, address_zip, emergency_contact_name, emergency_contact_phone,
  skills, years_experience, education_level, notes
) VALUES
(
  'EMP001', 'John', 'Smith', 'john.smith@company.com', '555-0123', '1985-03-15', '2020-01-15',
  'Senior Software Engineer', 'Engineering', 95000, 'active', '123 Main St', 'San Francisco',
  'CA', '94105', 'Jane Smith', '555-0124', ARRAY['JavaScript', 'React', 'Node.js'], 8,
  'Bachelor''s Degree', 'Excellent team player with strong technical skills'
),
(
  'EMP002', 'Sarah', 'Johnson', 'sarah.johnson@company.com', '555-0234', '1990-07-22', '2021-03-01',
  'Product Manager', 'Product', 85000, 'active', '456 Oak Ave', 'San Francisco',
  'CA', '94107', 'Mike Johnson', '555-0235', ARRAY['Product Strategy', 'Agile', 'Analytics'], 5,
  'Master''s Degree', 'Strategic thinker with excellent communication skills'
),
(
  'EMP003', 'Michael', 'Brown', 'michael.brown@company.com', '555-0345', '1988-11-10', '2019-08-20',
  'UX Designer', 'Design', 75000, 'active', '789 Pine St', 'Oakland',
  'CA', '94612', 'Lisa Brown', '555-0346', ARRAY['UI/UX Design', 'Figma', 'User Research'], 6,
  'Bachelor''s Degree', 'Creative designer with user-centered approach'
),
(
  'EMP004', 'Emily', 'Davis', 'emily.davis@company.com', '555-0456', '1992-05-08', '2022-01-10',
  'Marketing Specialist', 'Marketing', 65000, 'active', '321 Elm St', 'Berkeley',
  'CA', '94720', 'Tom Davis', '555-0457', ARRAY['Digital Marketing', 'SEO', 'Content Strategy'], 3,
  'Bachelor''s Degree', 'Results-driven marketer with creative flair'
),
(
  'EMP005', 'David', 'Wilson', 'david.wilson@company.com', '555-0567', '1983-09-25', '2018-05-15',
  'Engineering Manager', 'Engineering', 120000, 'active', '654 Maple Dr', 'San Jose',
  'CA', '95110', 'Rachel Wilson', '555-0568', ARRAY['Leadership', 'Software Architecture', 'Team Management'], 12,
  'Master''s Degree', 'Experienced leader with strong technical background'
)
ON CONFLICT (employee_id) DO NOTHING;
