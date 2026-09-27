CREATE OR REPLACE FUNCTION public.prevent_last_super_admin_removal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  super_admin_count INTEGER;
BEGIN
  IF OLD.role <> 'SUPER_ADMIN' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.role = 'SUPER_ADMIN' THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(20260927, 17);

  SELECT COUNT(*)
    INTO super_admin_count
    FROM public.admin_profiles
    WHERE role = 'SUPER_ADMIN';

  IF super_admin_count <= 1 THEN
    RAISE EXCEPTION 'Cannot remove the last super admin'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_last_super_admin_removal
  ON public.admin_profiles;

CREATE TRIGGER trg_prevent_last_super_admin_removal
  BEFORE DELETE OR UPDATE OF role
  ON public.admin_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_last_super_admin_removal();