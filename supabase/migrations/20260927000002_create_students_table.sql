-- ==============================================================================
-- Migration: 20260927000002_create_students_table.sql
-- Description: Create admission_type enum, students table with foreign keys,
--              duplicate prevention on registration_number, updated_at trigger,
--              performance indexes, and RLS enablement.
-- ==============================================================================

-- 1. Create admission_type enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admission_type') THEN
    CREATE TYPE admission_type AS ENUM ('JAMBITE', 'DIRECT_ENTRY');
  END IF;
END $$;

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  other_name TEXT,
  phone_number TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  admission_type admission_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Validation constraints
  CONSTRAINT chk_student_first_name_not_empty CHECK (char_length(trim(first_name)) > 0),
  CONSTRAINT chk_student_last_name_not_empty CHECK (char_length(trim(last_name)) > 0),
  CONSTRAINT chk_student_phone_number_not_empty CHECK (char_length(trim(phone_number)) > 0),
  CONSTRAINT chk_student_registration_number_not_empty CHECK (char_length(trim(registration_number)) > 0),

  -- Registration number must be strictly unique to prevent duplicate submissions
  CONSTRAINT uq_students_registration_number UNIQUE (registration_number)
);

-- Trigger for students updated_at
DROP TRIGGER IF EXISTS trg_students_updated_at ON students;
CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_students_faculty_id ON students (faculty_id);
CREATE INDEX IF NOT EXISTS idx_students_department_id ON students (department_id);
CREATE INDEX IF NOT EXISTS idx_students_registration_number ON students (registration_number);
CREATE INDEX IF NOT EXISTS idx_students_admission_type ON students (admission_type);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students (created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Base Policies (Will be refined in Phase 8 for role-based faculty scoping)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Allow public insert into students'
  ) THEN
    -- Public enrollment allows new submissions
    CREATE POLICY "Allow public insert into students"
      ON students FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;
