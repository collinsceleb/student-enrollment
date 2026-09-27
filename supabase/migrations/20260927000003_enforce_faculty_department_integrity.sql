-- ==============================================================================
-- Migration: 20260927000003_enforce_faculty_department_integrity.sql
-- Description: Phase 4 Database Integrity: Ensure students cannot be enrolled
--              with a department that does not belong to the specified faculty.
-- ==============================================================================

-- 1. Ensure composite uniqueness on departments(id, faculty_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_departments_id_faculty_id'
  ) THEN
    ALTER TABLE departments
      ADD CONSTRAINT uq_departments_id_faculty_id UNIQUE (id, faculty_id);
  END IF;
END $$;

-- 2. Add composite foreign key on students(department_id, faculty_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_students_department_faculty'
  ) THEN
    ALTER TABLE students
      ADD CONSTRAINT fk_students_department_faculty
      FOREIGN KEY (department_id, faculty_id)
      REFERENCES departments (id, faculty_id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Database Trigger for clear, descriptive error messaging on mismatch
CREATE OR REPLACE FUNCTION check_student_faculty_department_match()
RETURNS TRIGGER AS $$
DECLARE
  v_department_faculty_id UUID;
BEGIN
  SELECT faculty_id INTO v_department_faculty_id
  FROM departments
  WHERE id = NEW.department_id;

  IF v_department_faculty_id IS NULL THEN
    RAISE EXCEPTION 'Department % does not exist', NEW.department_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF v_department_faculty_id <> NEW.faculty_id THEN
    RAISE EXCEPTION 'Database integrity violation: department % does not belong to faculty %',
      NEW.department_id, NEW.faculty_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_student_faculty_department ON students;
CREATE TRIGGER trg_check_student_faculty_department
  BEFORE INSERT OR UPDATE OF faculty_id, department_id ON students
  FOR EACH ROW
  EXECUTE FUNCTION check_student_faculty_department_match();
