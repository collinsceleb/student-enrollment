ALTER TABLE public.admin_profiles
  ADD COLUMN IF NOT EXISTS has_changed_password BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.admin_profiles
  ADD COLUMN IF NOT EXISTS temporary_password_issued_at TIMESTAMPTZ;

ALTER TABLE public.admin_profiles
  ADD COLUMN IF NOT EXISTS temporary_password_reset_id UUID;

ALTER TABLE public.admin_profiles
  ALTER COLUMN has_changed_password SET DEFAULT FALSE;

DROP POLICY IF EXISTS "Admins can update their own profile"
  ON public.admin_profiles;
DROP POLICY IF EXISTS "Public can insert profiles only for themselves"
  ON public.admin_profiles;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles ap
    WHERE ap.user_id = auth.uid()
      AND ap.role = 'SUPER_ADMIN'
      AND ap.has_changed_password
      AND (
        ap.temporary_password_issued_at IS NULL OR
        COALESCE(NULLIF(auth.jwt() ->> 'auth_time', '')::BIGINT, 0) >=
          FLOOR(EXTRACT(EPOCH FROM ap.temporary_password_issued_at))::BIGINT
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_faculty_admin_for_target(faculty_id_input UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles ap
    WHERE ap.user_id = auth.uid()
      AND ap.role = 'FACULTY_ADMIN'
      AND ap.faculty_id = faculty_id_input
      AND ap.has_changed_password
      AND (
        ap.temporary_password_issued_at IS NULL OR
        COALESCE(NULLIF(auth.jwt() ->> 'auth_time', '')::BIGINT, 0) >=
          FLOOR(EXTRACT(EPOCH FROM ap.temporary_password_issued_at))::BIGINT
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.enforce_faculty_admin_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_faculty_id UUID;
BEGIN
  target_faculty_id := CASE
    WHEN TG_OP = 'DELETE' THEN OLD.faculty_id
    ELSE NEW.faculty_id
  END;

  IF auth.uid() IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  IF public.is_faculty_admin_for_target(target_faculty_id)
    OR public.is_super_admin() THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Administrator is not authorized to modify this faculty';
END;
$$;