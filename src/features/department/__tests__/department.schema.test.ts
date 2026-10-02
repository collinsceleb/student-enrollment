import { describe, it, expect } from "vitest";
import { departmentSchema } from "@/lib/validation/department.schema";

describe("Department Validation Schema", () => {
  const validFacultyId = "11111111-1111-4111-8111-111111111111";

  it("should validate and normalize a valid department input", () => {
    const validData = {
      faculty_id: validFacultyId,
      name: "Computer Engineering",
      code: "cpe",
    };

    const parsed = departmentSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.faculty_id).toBe(validFacultyId);
      expect(parsed.data.name).toBe("Computer Engineering");
      expect(parsed.data.code).toBe("CPE");
    }
  });

  it("should trim surrounding whitespace from name and code", () => {
    const dataWithWhitespace = {
      faculty_id: validFacultyId,
      name: "  Electrical Engineering  ",
      code: "  eee  ",
    };

    const parsed = departmentSchema.safeParse(dataWithWhitespace);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("Electrical Engineering");
      expect(parsed.data.code).toBe("EEE");
    }
  });

  it("should reject invalid faculty_id format (non-UUID)", () => {
    const invalidData = {
      faculty_id: "not-a-uuid",
      name: "Mechanical Engineering",
      code: "MEE",
    };

    const parsed = departmentSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it("should reject empty or whitespace-only department name", () => {
    const invalidData = {
      faculty_id: validFacultyId,
      name: "   ",
      code: "MEE",
    };

    const parsed = departmentSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it("should reject department code longer than 20 characters", () => {
    const invalidData = {
      faculty_id: validFacultyId,
      name: "Mechanical Engineering",
      code: "TOOLONGDEPARTMENTCODE123",
    };

    const parsed = departmentSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it("should reject unexpected fields that could mutate persisted data", () => {
    const parsed = departmentSchema.safeParse({
      faculty_id: validFacultyId,
      name: "Mechanical Engineering",
      code: "MEE",
      id: "33333333-3333-4333-8333-333333333333",
    });

    expect(parsed.success).toBe(false);
  });
});
