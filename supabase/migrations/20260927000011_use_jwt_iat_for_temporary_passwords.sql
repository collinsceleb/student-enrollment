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
        COALESCE(NULLIF(auth.jwt() ->> 'iat', '')::BIGINT, 0) >=
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
        COALESCE(NULLIF(auth.jwt() ->> 'iat', '')::BIGINT, 0) >=
          FLOOR(EXTRACT(EPOCH FROM ap.temporary_password_issued_at))::BIGINT
      )
  );
$$;