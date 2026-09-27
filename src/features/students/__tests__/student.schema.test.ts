import { describe, it, expect } from "vitest";
import { studentSchema } from "@/lib/validation/student.schema";
import { formatStudentFullName } from "@/types/student";

describe("Student Validation Schema & Formatting", () => {
  const validFacultyId = "11111111-1111-4111-8111-111111111111";
  const validDepartmentId = "22222222-2222-4222-8222-222222222222";

  it("should validate a complete valid student submission", () => {
    const validData = {
      first_name: "John",
      last_name: "Doe",
      other_name: "Alexander",
      phone_number: "+234 801 234 5678",
      registration_number: "reg/2026/001",
      faculty_id: validFacultyId,
      department_id: validDepartmentId,
      admission_type: "JAMBITE",
    };

    const parsed = studentSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.first_name).toBe("John");
      expect(parsed.data.last_name).toBe("Doe");
      expect(parsed.data.other_name).toBe("Alexander");
      expect(parsed.data.registration_number).toBe("REG/2026/001");
      expect(parsed.data.admission_type).toBe("JAMBITE");
    }
  });

  it("should accept optional other_name as undefined or empty and transform to null", () => {
    const dataWithoutOtherName = {
      first_name: "Jane",
      last_name: "Smith",
      phone_number: "08098765432",
      registration_number: "reg/2026/002",
      faculty_id: validFacultyId,
      department_id: validDepartmentId,
      admission_type: "DIRECT_ENTRY",
    };

    const parsed = studentSchema.safeParse(dataWithoutOtherName);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.other_name).toBeNull();
    }
  });

  it("should normalize admission_type from title case or spaced string", () => {
    const jambiteInput = {
      first_name: "Alice",
      last_name: "Johnson",
      phone_number: "08011112222",
      registration_number: "reg/2026/003",
      faculty_id: validFacultyId,
      department_id: validDepartmentId,
      admission_type: "Jambite",
    };

    const deInput = {
      ...jambiteInput,
      registration_number: "reg/2026/004",
      admission_type: "Direct Entry",
    };

    const parsedJambite = studentSchema.safeParse(jambiteInput);
    const parsedDE = studentSchema.safeParse(deInput);

    expect(parsedJambite.success).toBe(true);
    if (parsedJambite.success) {
      expect(parsedJambite.data.admission_type).toBe("JAMBITE");
    }

    expect(parsedDE.success).toBe(true);
    if (parsedDE.success) {
      expect(parsedDE.data.admission_type).toBe("DIRECT_ENTRY");
    }
  });

  it("should reject arbitrary or invalid admission_type strings", () => {
    const invalidData = {
      first_name: "Bob",
      last_name: "Williams",
      phone_number: "08022223333",
      registration_number: "reg/2026/005",
      faculty_id: validFacultyId,
      department_id: validDepartmentId,
      admission_type: "TransferStudent",
    };

    const parsed = studentSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it("should reject invalid UUIDs for faculty_id and department_id", () => {
    const invalidIds = {
      first_name: "Bob",
      last_name: "Williams",
      phone_number: "08022223333",
      registration_number: "REG/2026/006",
      faculty_id: "not-a-valid-uuid",
      department_id: "invalid-uuid",
      admission_type: "JAMBITE",
    };

    const parsed = studentSchema.safeParse(invalidIds);
    expect(parsed.success).toBe(false);
  });

  it("should reject missing required fields", () => {
    const missingLastName = {
      first_name: "Bob",
      phone_number: "08022223333",
      registration_number: "REG/2026/007",
      faculty_id: validFacultyId,
      department_id: validDepartmentId,
      admission_type: "JAMBITE",
    };

    const parsed = studentSchema.safeParse(missingLastName);
    expect(parsed.success).toBe(false);
  });

  it("should format student full name with capitalized surname, comma, followed by other names", () => {
    const fullNameWithOther = formatStudentFullName({
      last_name: "adebayo",
      first_name: "Olumide",
      other_name: "samuel",
    });
    expect(fullNameWithOther).toBe("ADEBAYO, Olumide samuel");

    const fullNameWithoutOther = formatStudentFullName({
      last_name: "okonkwo",
      first_name: "Chukwudi",
    });
    expect(fullNameWithoutOther).toBe("OKONKWO, Chukwudi");
  });
});
