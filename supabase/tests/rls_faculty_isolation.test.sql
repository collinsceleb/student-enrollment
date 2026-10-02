BEGIN;

SELECT plan(4);

INSERT INTO public.faculties (id, name, code)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'RLS Faculty A', 'RLSA'),
  ('22222222-2222-4222-8222-222222222222', 'RLS Faculty B', 'RLSB');

INSERT INTO public.departments (id, faculty_id, name, code)
VALUES
  (
    '33333333-3333-4333-8333-333333333333',
    '11111111-1111-4111-8111-111111111111',
    'RLS Department A',
    'RLSDPA'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    '22222222-2222-4222-8222-222222222222',
    'RLS Department B',
    'RLSDPB'
  );

INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data
)
VALUES
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'authenticated',
    'authenticated',
    'rls-faculty-a@example.test',
    '',
    now(),
    '{}',
    '{}'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'authenticated',
    'authenticated',
    'rls-faculty-b@example.test',
    '',
    now(),
    '{}',
    '{}'
  );

INSERT INTO public.admin_profiles (user_id, role, faculty_id, has_changed_password)
VALUES
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'FACULTY_ADMIN',
    '11111111-1111-4111-8111-111111111111',
    TRUE
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'FACULTY_ADMIN',
    '22222222-2222-4222-8222-222222222222',
    TRUE
  );

INSERT INTO public.students (
  id,
  first_name,
  last_name,
  phone_number,
  registration_number,
  faculty_id,
  department_id,
  admission_type
)
VALUES
  (
    '55555555-5555-4555-8555-555555555555',
    'Student',
    'Faculty A',
    '08000000001',
    'RLS-A-001',
    '11111111-1111-4111-8111-111111111111',
    '33333333-3333-4333-8333-333333333333',
    'JAMBITE'
  ),
  (
    '66666666-6666-4666-8666-666666666666',
    'Student',
    'Faculty B',
    '08000000002',
    'RLS-B-001',
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444444',
    'DIRECT_ENTRY'
  );

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  TRUE
);
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
  TRUE
);

SELECT is(
  (SELECT count(*)::INTEGER FROM public.students),
  1,
  'Faculty Admin A can read their own faculty student'
);
SELECT is(
  (SELECT count(*)::INTEGER FROM public.students WHERE faculty_id = '22222222-2222-4222-8222-222222222222'),
  0,
  'Faculty Admin A cannot read Faculty B students'
);

SELECT set_config(
  'request.jwt.claim.sub',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  TRUE
);
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  TRUE
);

SELECT is(
  (SELECT count(*)::INTEGER FROM public.students),
  1,
  'Faculty Admin B can read their own faculty student'
);
SELECT is(
  (SELECT count(*)::INTEGER FROM public.students WHERE faculty_id = '11111111-1111-4111-8111-111111111111'),
  0,
  'Faculty Admin B cannot read Faculty A students'
);

SELECT * FROM finish();
ROLLBACK;
