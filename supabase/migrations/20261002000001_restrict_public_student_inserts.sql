DROP POLICY IF EXISTS "Allow public insert into students"
  ON public.students;

DROP POLICY IF EXISTS "Public can insert students"
  ON public.students;

DROP POLICY IF EXISTS "Faculty admins can delete their faculty students"
  ON public.students;