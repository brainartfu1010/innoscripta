import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Request } from "express";
import { apiKeyCacheSalt, resolveApiKeys } from "./api-keys.ts";

function requestWithHeaders(headers: Record<string, string>): Request {
  return {
    header(name: string) {
      return headers[name.toLowerCase()];
    },
  } as Request;
}

describe("resolveApiKeys", () => {
  it("prefers request headers over environment values", () => {
    const keys = resolveApiKeys(requestWithHeaders({ "x-api-key-guardian": " header-key " }), {
      GUARDIAN_API_KEY: "env-key",
      NYT_API_KEY: "env-nyt",
      NEWSAPI_API_KEY: "",
    });
    assert.equal(keys.GUARDIAN_API_KEY, "header-key");
    assert.equal(keys.NYT_API_KEY, "env-nyt");
    assert.equal(keys.NEWSAPI_API_KEY, undefined);
  });

  it("builds a stable cache salt from configured keys", () => {
    const salt = apiKeyCacheSalt({
      GUARDIAN_API_KEY: "abcd1234",
      NYT_API_KEY: undefined,
      NEWSAPI_API_KEY: "zz",
    });
    assert.equal(salt, "8:ab:34|0|2:zz:zz");
  });
});
