import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createStudent: vi.fn(),
  createAdminClient: vi.fn(() => ({})),
  verifyTurnstileToken: vi.fn(),
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
vi.mock("@/lib/server/turnstile", () => ({
  verifyTurnstileToken: mocks.verifyTurnstileToken,
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

describe("POST /api/enrollment Turnstile gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a missing token before contacting verification or the database", async () => {
    const response = await POST(request(validStudent));

    expect(response.status).toBe(403);
    expect(mocks.verifyTurnstileToken).not.toHaveBeenCalled();
    expect(mocks.createStudent).not.toHaveBeenCalled();
  });

  it("rejects a failed token before validating or inserting student data", async () => {
    mocks.verifyTurnstileToken.mockResolvedValue("rejected");

    const response = await POST(
      request({ turnstile_token: "invalid", first_name: 42 })
    );

    expect(response.status).toBe(403);
    expect(mocks.verifyTurnstileToken).toHaveBeenCalledWith("invalid");
    expect(mocks.createStudent).not.toHaveBeenCalled();
  });

  it("validates student data only after successful verification", async () => {
    mocks.verifyTurnstileToken.mockResolvedValue("verified");

    const invalidStudentResponse = await POST(
      request({ turnstile_token: "valid", first_name: 42 })
    );

    expect(invalidStudentResponse.status).toBe(400);
    expect(mocks.verifyTurnstileToken).toHaveBeenCalledWith("valid");
    expect(mocks.createStudent).not.toHaveBeenCalled();
  });

  it("inserts valid enrollment data after successful verification", async () => {
    mocks.verifyTurnstileToken.mockResolvedValue("verified");
    mocks.createStudent.mockResolvedValue({});

    const response = await POST(
      request({ ...validStudent, turnstile_token: "valid" })
    );

    expect(response.status).toBe(201);
    expect(mocks.createStudent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining(validStudent)
    );
  });
});
