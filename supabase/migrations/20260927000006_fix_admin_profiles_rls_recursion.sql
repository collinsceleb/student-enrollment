-- Replace the self-referencing policy from migration 00004 with the
-- SECURITY DEFINER helper introduced in migration 00005.
DROP POLICY IF EXISTS "Super admins can manage admin profiles"
  ON admin_profiles;

CREATE POLICY "Super admins can manage admin profiles"
  ON admin_profiles
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());