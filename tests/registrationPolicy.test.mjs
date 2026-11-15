import assert from "node:assert/strict";
import test from "node:test";

import { canCancelRegistration, isCheckInOpen } from "../convex/lib/registrationPolicy.js";

test("registration cancellation closes when the event starts", () => {
  assert.equal(canCancelRegistration(101, 100), true);
  assert.equal(canCancelRegistration(100, 100), false);
  assert.equal(canCancelRegistration(99, 100), false);
});

test("attendee check-in opens at event start and closes at event end", () => {
  assert.equal(isCheckInOpen(100, 200, 99), false);
  assert.equal(isCheckInOpen(100, 200, 100), true);
  assert.equal(isCheckInOpen(100, 200, 199), true);
  assert.equal(isCheckInOpen(100, 200, 200), false);
});
