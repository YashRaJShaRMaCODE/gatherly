import assert from "node:assert/strict";
import test from "node:test";
import {
  matchesEventLocation,
  registrationAction,
  validateEventDetails,
} from "../convex/event-rules.js";

const validEvent = {
  startDate: 2_000,
  endDate: 3_000,
  capacity: 20,
  ticketType: "free",
};

test("event creation requires future dates, a positive integer capacity, and a paid ticket price", () => {
  assert.equal(validateEventDetails(validEvent, 1_000), null);
  assert.equal(validateEventDetails({ ...validEvent, startDate: 1_000 }, 1_000).field, "startDate");
  assert.equal(validateEventDetails({ ...validEvent, endDate: 2_000 }, 1_000).field, "endDate");
  assert.equal(validateEventDetails({ ...validEvent, capacity: 2.5 }, 1_000).field, "capacity");
  assert.equal(validateEventDetails({ ...validEvent, ticketType: "paid" }, 1_000).field, "ticketPrice");
  assert.equal(validateEventDetails({ ...validEvent, ticketType: "paid", ticketPrice: 0 }, 1_000).field, "ticketPrice");
  assert.equal(validateEventDetails({ ...validEvent, ticketType: "paid", ticketPrice: 50 }, 1_000), null);
});

test("registration rules allow cancelled attendees to rebook only while seats remain", () => {
  assert.equal(registrationAction("confirmed", 10, 10), "already_registered");
  assert.equal(registrationAction("cancelled", 9, 10), "reactivate");
  assert.equal(registrationAction("cancelled", 10, 10), "full");
  assert.equal(registrationAction(undefined, 0, 10), "create");
});

test("location matching applies both city and state, case-insensitively", () => {
  const event = { city: "Springfield", state: "Illinois" };
  assert.equal(matchesEventLocation(event, " springfield ", "ILLINOIS"), true);
  assert.equal(matchesEventLocation(event, "Springfield", "Massachusetts"), false);
  assert.equal(matchesEventLocation(event, "Springfield", undefined), true);
  assert.equal(matchesEventLocation(event, undefined, "Illinois"), true);
});
