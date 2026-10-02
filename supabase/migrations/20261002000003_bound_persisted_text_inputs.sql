DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_students_input_lengths'
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT chk_students_input_lengths CHECK (
        char_length(first_name) <= 100
        AND char_length(last_name) <= 100
        AND (other_name IS NULL OR char_length(other_name) <= 100)
        AND char_length(phone_number) <= 20
        AND char_length(registration_number) <= 50
      ) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_faculties_input_lengths'
  ) THEN
    ALTER TABLE public.faculties
      ADD CONSTRAINT chk_faculties_input_lengths CHECK (
        char_length(name) <= 150 AND char_length(code) <= 20
      ) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_departments_input_lengths'
  ) THEN
    ALTER TABLE public.departments
      ADD CONSTRAINT chk_departments_input_lengths CHECK (
        char_length(name) <= 150 AND char_length(code) <= 20
      ) NOT VALID;
  END IF;
END;
$$;