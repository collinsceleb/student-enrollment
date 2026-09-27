-- ==============================================================================
-- Migration: 20260927000004_create_admin_profiles.sql
-- Description: Phase 7 Authentication + Role Model
--              Create admin_roles enum, admin_profiles table, and role enforcement
--              for SUPER_ADMIN and FACULTY_ADMIN assignments.
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
    CREATE TYPE admin_role AS ENUM ('SUPER_ADMIN', 'FACULTY_ADMIN');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role admin_role NOT NULL,
  faculty_id UUID NULL REFERENCES faculties(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_admin_profile_role CHECK (role IN ('SUPER_ADMIN', 'FACULTY_ADMIN'))
);

CREATE INDEX IF NOT EXISTS idx_admin_profiles_user_id ON admin_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_role ON admin_profiles (role);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_faculty_id ON admin_profiles (faculty_id);

ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_profiles_updated_at ON admin_profiles;
CREATE TRIGGER trg_admin_profiles_updated_at
  BEFORE UPDATE ON admin_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Admins can view their own profile"
  ON admin_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update their own profile"
  ON admin_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can manage admin profiles"
  ON admin_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles ap
      WHERE ap.user_id = auth.uid()
        AND ap.role = 'SUPER_ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_profiles ap
      WHERE ap.user_id = auth.uid()
        AND ap.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Public can insert profiles only for themselves"
  ON admin_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
