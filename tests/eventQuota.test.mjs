import assert from "node:assert/strict";
import { test } from "node:test";
import { eventConsumesFreeSlot } from "../lib/eventQuota.mjs";

test("free-created events consume a free slot", () => {
  assert.equal(eventConsumesFreeSlot({ createdWithPro: false }), true);
});

test("Pro-created events do not consume a free slot", () => {
  assert.equal(eventConsumesFreeSlot({ createdWithPro: true }), false);
});

test("legacy events without a plan marker remain counted", () => {
  assert.equal(eventConsumesFreeSlot({}), true);
});
