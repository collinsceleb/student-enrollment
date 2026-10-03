# Student Enrollment and Faculty Management System

## Local bootstrap for the first super admin

This project requires an initial super admin to exist before protected admin workflows are used.

### 1) Provide the values on the server
Set these as server environment variables in your hosting platform or in a local `.env.local` file for development-only testing:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-service-role-secret
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=StrongPassword123
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-site-key
TURNSTILE_SECRET_KEY=your-turnstile-secret-key
```

Important:
- In production, these values should be injected by the host and not committed to the repository.
- For local development only, a gitignored `.env.local` file is acceptable.
- Do not expose these values to the browser or commit them to source control.
- Configure the Turnstile site key and secret for login, password changes, and enrollment.
- Users who forget their password should contact a super administrator for a temporary password, then sign in and choose a permanent password.

### 2) Start the app
When you run the project normally, the bootstrap runs automatically before development and build commands:

```bash
pnpm dev
```

or

```bash
pnpm build
```

This checks whether a super admin already exists. If not, it creates the first one from the local environment values.

### 3) Sign in
Then sign in to the admin portal at:

- http://localhost:3000/login

Use the same email and password you set in `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD`.

## Default local URLs

- Public enrollment: http://localhost:3000/
- Login: http://localhost:3000/login
- Faculty dashboard: http://localhost:3000/faculty
- Admin dashboard: http://localhost:3000/admin