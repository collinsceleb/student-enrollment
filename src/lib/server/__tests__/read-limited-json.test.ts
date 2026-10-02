import { describe, expect, it } from "vitest";

import {
  InvalidJsonBodyError,
  readLimitedJson,
  RequestBodyTooLargeError,
} from "@/lib/server/read-limited-json";

describe("readLimitedJson", () => {
  it("parses valid JSON within the byte limit", async () => {
    const request = new Request("https://example.test/api", {
      method: "POST",
      body: JSON.stringify({ name: "Student" }),
    });

    await expect(readLimitedJson(request, 64)).resolves.toEqual({
      name: "Student",
    });
  });

  it("rejects declared bodies above the byte limit", async () => {
    const request = new Request("https://example.test/api", {
      method: "POST",
      headers: { "content-length": "100" },
      body: "{}",
    });

    await expect(readLimitedJson(request, 64)).rejects.toBeInstanceOf(
      RequestBodyTooLargeError
    );
  });

  it("rejects streamed bodies above the byte limit", async () => {
    const request = new Request("https://example.test/api", {
      method: "POST",
      body: JSON.stringify({
        name: "A student payload larger than this limit",
      }),
    });

    await expect(readLimitedJson(request, 8)).rejects.toBeInstanceOf(
      RequestBodyTooLargeError
    );
  });

  it("rejects malformed JSON", async () => {
    const request = new Request("https://example.test/api", {
      method: "POST",
      body: "not json",
    });

    await expect(readLimitedJson(request, 64)).rejects.toBeInstanceOf(
      InvalidJsonBodyError
    );
  });
});
