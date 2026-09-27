-- Department removal must preserve enrolled student records.
ALTER TABLE public.students
  DROP CONSTRAINT IF EXISTS students_department_id_fkey,
  ADD CONSTRAINT students_department_id_fkey
    FOREIGN KEY (department_id)
    REFERENCES public.departments(id)
    ON DELETE RESTRICT;