-- Faculty deletion must never cascade into enrollment data or leave admins
-- without their assigned faculty.
ALTER TABLE public.departments
  DROP CONSTRAINT IF EXISTS departments_faculty_id_fkey,
  ADD CONSTRAINT departments_faculty_id_fkey
    FOREIGN KEY (faculty_id) REFERENCES public.faculties(id) ON DELETE RESTRICT;

ALTER TABLE public.students
  DROP CONSTRAINT IF EXISTS students_faculty_id_fkey,
  ADD CONSTRAINT students_faculty_id_fkey
    FOREIGN KEY (faculty_id) REFERENCES public.faculties(id) ON DELETE RESTRICT;

ALTER TABLE public.admin_profiles
  DROP CONSTRAINT IF EXISTS admin_profiles_faculty_id_fkey,
  ADD CONSTRAINT admin_profiles_faculty_id_fkey
    FOREIGN KEY (faculty_id) REFERENCES public.faculties(id) ON DELETE RESTRICT;