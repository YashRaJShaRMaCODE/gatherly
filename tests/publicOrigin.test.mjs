import test from "node:test";
import assert from "node:assert/strict";
import { securePublicOrigin } from "../lib/publicOrigin.mjs";

test("public origin accepts only a plain HTTPS origin", () => {
  assert.equal(securePublicOrigin(" https://events.example/ "), "https://events.example");
  assert.equal(securePublicOrigin("http://events.example"), null);
  assert.equal(securePublicOrigin("https://user:pass@events.example"), null);
  assert.equal(securePublicOrigin("https://events.example/path"), null);
  assert.equal(securePublicOrigin("https://"), null);
  assert.equal(securePublicOrigin(""), null);
});
