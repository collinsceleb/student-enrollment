-- ==============================================================================
-- Migration: 20260927000001_create_faculties_and_departments.sql
-- Description: Create faculties and departments tables with relationships,
--              constraints, updated_at triggers, and performance indexes.
-- ==============================================================================

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Trigger function for updating updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Faculties Table
CREATE TABLE IF NOT EXISTS faculties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Data validity constraints
  CONSTRAINT chk_faculty_name_not_empty CHECK (char_length(trim(name)) > 0),
  CONSTRAINT chk_faculty_code_not_empty CHECK (char_length(trim(code)) > 0),

  -- Uniqueness constraints
  CONSTRAINT uq_faculties_name UNIQUE (name),
  CONSTRAINT uq_faculties_code UNIQUE (code)
);

-- Trigger for faculties updated_at
DROP TRIGGER IF EXISTS trg_faculties_updated_at ON faculties;
CREATE TRIGGER trg_faculties_updated_at
  BEFORE UPDATE ON faculties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for faculties
CREATE INDEX IF NOT EXISTS idx_faculties_name ON faculties (name);
CREATE INDEX IF NOT EXISTS idx_faculties_code ON faculties (code);

-- 4. Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Data validity constraints
  CONSTRAINT chk_department_name_not_empty CHECK (char_length(trim(name)) > 0),
  CONSTRAINT chk_department_code_not_empty CHECK (char_length(trim(code)) > 0),

  -- Uniqueness constraints: prevent duplicate department names or codes within the same faculty
  CONSTRAINT uq_departments_faculty_id_name UNIQUE (faculty_id, name),
  CONSTRAINT uq_departments_faculty_id_code UNIQUE (faculty_id, code)
);

-- Trigger for departments updated_at
DROP TRIGGER IF EXISTS trg_departments_updated_at ON departments;
CREATE TRIGGER trg_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for departments
CREATE INDEX IF NOT EXISTS idx_departments_faculty_id ON departments (faculty_id);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments (name);
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments (code);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- 6. Read policies (Faculties and departments are publicly selectable for student enrollment forms)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'faculties' AND policyname = 'Allow public read access to faculties'
  ) THEN
    CREATE POLICY "Allow public read access to faculties"
      ON faculties FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'Allow public read access to departments'
  ) THEN
    CREATE POLICY "Allow public read access to departments"
      ON departments FOR SELECT
      USING (true);
  END IF;
END $$;
