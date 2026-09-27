import { describe, it, expect } from "vitest";
import { facultySchema } from "@/lib/validation/faculty.schema";

describe("Faculty Validation Schema", () => {
  it("should validate and normalize a valid faculty input", () => {
    const validData = {
      name: "Faculty of Engineering",
      code: "eng",
    };

    const parsed = facultySchema.safeParse(validData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("Faculty of Engineering");
      expect(parsed.data.code).toBe("ENG");
    }
  });

  it("should trim surrounding whitespace from name and code", () => {
    const dataWithWhitespace = {
      name: "  Faculty of Science   ",
      code: "  sci  ",
    };

    const parsed = facultySchema.safeParse(dataWithWhitespace);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("Faculty of Science");
      expect(parsed.data.code).toBe("SCI");
    }
  });

  it("should reject empty or whitespace-only faculty name", () => {
    const invalidData = {
      name: "   ",
      code: "ENG",
    };

    const parsed = facultySchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it("should reject code longer than 20 characters", () => {
    const invalidData = {
      name: "Faculty of Humanities",
      code: "THISCODEISFARTOOLONGTOBEVALID",
    };

    const parsed = facultySchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it("should reject missing required fields", () => {
    const empty = {};
    const parsed = facultySchema.safeParse(empty);
    expect(parsed.success).toBe(false);
  });
});
