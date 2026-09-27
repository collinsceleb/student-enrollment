-- ==============================================================================
-- Migration: 20260927000005_phase_8_faculty_admin_rls.sql
-- Description: Phase 8 database authorization.
--              Enforce admin role restrictions so faculty admins can only access
--              records for their assigned faculty, while public enrollment retains
--              a public insert path for student submissions.
-- ==============================================================================

-- Ensure base tables have RLS enabled
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Helper: whether the current user is a super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_profiles ap
    WHERE ap.user_id = auth.uid()
      AND ap.role = 'SUPER_ADMIN'
  );
$$;

-- Helper: whether the current user is a faculty admin for a given faculty
CREATE OR REPLACE FUNCTION is_faculty_admin_for_target(faculty_id_input UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_profiles ap
    WHERE ap.user_id = auth.uid()
      AND ap.role = 'FACULTY_ADMIN'
      AND ap.faculty_id = faculty_id_input
  );
$$;

-- admin_profiles policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_profiles' AND policyname = 'Admins can view their own profile'
  ) THEN
    CREATE POLICY "Admins can view their own profile"
      ON admin_profiles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_profiles' AND policyname = 'Admins can update their own profile'
  ) THEN
    CREATE POLICY "Admins can update their own profile"
      ON admin_profiles FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_profiles' AND policyname = 'Super admins can manage admin profiles'
  ) THEN
    CREATE POLICY "Super admins can manage admin profiles"
      ON admin_profiles FOR ALL
      USING (is_super_admin())
      WITH CHECK (is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_profiles' AND policyname = 'Public can insert profiles only for themselves'
  ) THEN
    CREATE POLICY "Public can insert profiles only for themselves"
      ON admin_profiles FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- faculties policies
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
    SELECT 1 FROM pg_policies WHERE tablename = 'faculties' AND policyname = 'Super admins can manage faculties'
  ) THEN
    CREATE POLICY "Super admins can manage faculties"
      ON faculties FOR ALL
      USING (is_super_admin())
      WITH CHECK (is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'faculties' AND policyname = 'Faculty admins can view their own faculty'
  ) THEN
    CREATE POLICY "Faculty admins can view their own faculty"
      ON faculties FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM admin_profiles ap
          WHERE ap.user_id = auth.uid()
            AND ap.role = 'FACULTY_ADMIN'
            AND ap.faculty_id = faculties.id
        )
      );
  END IF;
END $$;

-- departments policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'Allow public read access to departments'
  ) THEN
    CREATE POLICY "Allow public read access to departments"
      ON departments FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'Super admins can manage departments'
  ) THEN
    CREATE POLICY "Super admins can manage departments"
      ON departments FOR ALL
      USING (is_super_admin())
      WITH CHECK (is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'Faculty admins can manage their faculty departments'
  ) THEN
    CREATE POLICY "Faculty admins can manage their faculty departments"
      ON departments FOR ALL
      USING (
        is_faculty_admin_for_target(departments.faculty_id)
      )
      WITH CHECK (
        is_faculty_admin_for_target(departments.faculty_id)
      );
  END IF;
END $$;

-- students policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Public can insert students'
  ) THEN
    CREATE POLICY "Public can insert students"
      ON students FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Super admins can access all students'
  ) THEN
    CREATE POLICY "Super admins can access all students"
      ON students FOR SELECT
      USING (is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Faculty admins can access their faculty students'
  ) THEN
    CREATE POLICY "Faculty admins can access their faculty students"
      ON students FOR SELECT
      USING (
        is_faculty_admin_for_target(students.faculty_id)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Super admins can manage students'
  ) THEN
    CREATE POLICY "Super admins can manage students"
      ON students FOR UPDATE
      USING (is_super_admin())
      WITH CHECK (is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Faculty admins can manage their faculty students'
  ) THEN
    CREATE POLICY "Faculty admins can manage their faculty students"
      ON students FOR UPDATE
      USING (
        is_faculty_admin_for_target(students.faculty_id)
      )
      WITH CHECK (
        is_faculty_admin_for_target(students.faculty_id)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Super admins can delete students'
  ) THEN
    CREATE POLICY "Super admins can delete students"
      ON students FOR DELETE
      USING (is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Faculty admins can delete their faculty students'
  ) THEN
    CREATE POLICY "Faculty admins can delete their faculty students"
      ON students FOR DELETE
      USING (
        is_faculty_admin_for_target(students.faculty_id)
      );
  END IF;
END $$;

-- Explicitly ensure all admin CRUD is tied to the designated faculty.
-- This prevents a tampered request from assigning a student to a different faculty.
CREATE OR REPLACE FUNCTION enforce_faculty_admin_scope()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1
    FROM admin_profiles ap
    WHERE ap.user_id = auth.uid()
      AND ap.role = 'FACULTY_ADMIN'
      AND ap.faculty_id = NEW.faculty_id
  ) THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1
    FROM admin_profiles ap
    WHERE ap.user_id = auth.uid()
      AND ap.role = 'SUPER_ADMIN'
  ) THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Faculty admin cannot modify records outside the assigned faculty';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_faculty_admin_scope_students ON students;
CREATE TRIGGER trg_enforce_faculty_admin_scope_students
  BEFORE INSERT OR UPDATE OF faculty_id, department_id OR DELETE ON students
  FOR EACH ROW
  EXECUTE FUNCTION enforce_faculty_admin_scope();
