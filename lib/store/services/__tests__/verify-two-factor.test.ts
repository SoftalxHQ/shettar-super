/**
 * Tests for the verifyTwoFactor transformResponse logic.
 *
 * The verifyTwoFactor mutation in api.ts reads the issued JWT from the
 * `Authorization` response header (same mechanism as login) and merges it
 * into the response body, while preserving any returned recovery codes.
 */

import { describe, it, expect } from "vitest";

interface VerifyResponseBody {
  data?: { email: string };
  backup_codes?: string[];
  token?: string;
}

// Replicates the transformResponse defined inline for verifyTwoFactor in api.ts.
function transformVerifyResponse(
  response: VerifyResponseBody,
  meta?: { response?: { headers: { get: (k: string) => string | null } } },
): VerifyResponseBody & { token: string } {
  const authHeader = meta?.response?.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "") || "";
  return { ...response, token };
}

function makeMeta(authHeader: string | null) {
  return {
    response: {
      headers: {
        get: (key: string) => (key === "Authorization" ? authHeader : null),
      },
    },
  };
}

describe("verifyTwoFactor transformResponse", () => {
  it("extracts the bearer token from the Authorization header", () => {
    const result = transformVerifyResponse(
      { data: { email: "admin@shettar.com" } },
      makeMeta("Bearer abc.def.ghi"),
    );

    expect(result.token).toBe("abc.def.ghi");
    expect(result.data?.email).toBe("admin@shettar.com");
  });

  it("returns an empty token when the header is missing", () => {
    const result = transformVerifyResponse({ data: { email: "a@b.com" } }, makeMeta(null));
    expect(result.token).toBe("");
  });

  it("preserves recovery codes returned on enrollment", () => {
    const codes = ["aaaa11", "bbbb22", "cccc33"];
    const result = transformVerifyResponse(
      { data: { email: "a@b.com" }, backup_codes: codes },
      makeMeta("Bearer token-123"),
    );

    expect(result.token).toBe("token-123");
    expect(result.backup_codes).toEqual(codes);
  });
});
