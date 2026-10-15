import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createStudent: vi.fn(),
  createAdminClient: vi.fn(() => ({})),
  consumeRateLimit: vi.fn(),
  getRequestIdentity: vi.fn(() => "203.0.113.5"),
  getUser: vi.fn(),
  getCurrentAdminProfile: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/students/student.service", () => ({
  createStudent: mocks.createStudent,
  DepartmentNotFoundError: class extends Error {},
  DuplicateRegistrationNumberError: class extends Error {},
  FacultyDepartmentMismatchError: class extends Error {},
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser,
    },
  })),
}));
vi.mock("@/features/auth/auth.service", () => ({
  getCurrentAdminProfile: mocks.getCurrentAdminProfile,
}));
vi.mock("@/lib/server/rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
  getRequestIdentity: mocks.getRequestIdentity,
}));

import { POST } from "@/app/api/enrollment/route";

const validStudent = {
  first_name: "Ama",
  last_name: "Mensah",
  phone_number: "+233 20 123 4567",
  registration_number: "SCI/2026/001",
  faculty_id: "11111111-1111-4111-8111-111111111111",
  department_id: "22222222-2222-4222-8222-222222222222",
  admission_type: "JAMBITE",
};

function request(body: Record<string, unknown>) {
  return new Request("https://example.test/api/enrollment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/enrollment authenticated & scoped gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.consumeRateLimit.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "admin@example.edu" } },
      error: null,
    });
    mocks.getCurrentAdminProfile.mockResolvedValue({
      data: {
        role: "SUPER_ADMIN",
        faculty_id: null,
        has_changed_password: true,
        session_is_current: true,
      },
      error: null,
    });
  });

  it("returns 429 when the rate limit is exceeded", async () => {
    mocks.consumeRateLimit.mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 47,
    });

    const response = await POST(request(validStudent));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("47");
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.createStudent).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests with 401", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Not logged in"),
    });

    const response = await POST(request(validStudent));

    expect(response.status).toBe(401);
    expect(mocks.createStudent).not.toHaveBeenCalled();
  });

  it("rejects users without an admin role with 403", async () => {
    mocks.getCurrentAdminProfile.mockResolvedValue({
      data: null,
      error: null,
    });

    const response = await POST(request(validStudent));

    expect(response.status).toBe(403);
    expect(mocks.createStudent).not.toHaveBeenCalled();
  });

  it("rejects users who have not changed temporary password with 401", async () => {
    mocks.getCurrentAdminProfile.mockResolvedValue({
      data: {
        role: "FACULTY_ADMIN",
        faculty_id: validStudent.faculty_id,
        has_changed_password: false,
        session_is_current: true,
      },
      error: null,
    });

    const response = await POST(request(validStudent));

    expect(response.status).toBe(401);
    expect(mocks.createStudent).not.toHaveBeenCalled();
  });

  it("rejects faculty admins attempting to enroll into another faculty with 403", async () => {
    mocks.getCurrentAdminProfile.mockResolvedValue({
      data: {
        role: "FACULTY_ADMIN",
        faculty_id: "other-faculty-uuid",
        has_changed_password: true,
        session_is_current: true,
      },
      error: null,
    });

    const response = await POST(request(validStudent));

    expect(response.status).toBe(403);
    expect(mocks.createStudent).not.toHaveBeenCalled();
  });

  it("allows faculty admins to enroll students into their assigned faculty with 201", async () => {
    mocks.getCurrentAdminProfile.mockResolvedValue({
      data: {
        role: "FACULTY_ADMIN",
        faculty_id: validStudent.faculty_id,
        has_changed_password: true,
        session_is_current: true,
      },
      error: null,
    });
    mocks.createStudent.mockResolvedValue({});

    const response = await POST(request(validStudent));

    expect(response.status).toBe(201);
    expect(mocks.createStudent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining(validStudent)
    );
  });

  it("allows super admins to enroll students into any faculty with 201", async () => {
    mocks.createStudent.mockResolvedValue({});

    const response = await POST(request(validStudent));

    expect(response.status).toBe(201);
    expect(mocks.createStudent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining(validStudent)
    );
  });

  it("rejects invalid student data with 400 without contacting createStudent", async () => {
    const response = await POST(request({ first_name: 42 }));

    expect(response.status).toBe(400);
    expect(mocks.createStudent).not.toHaveBeenCalled();
  });
});
