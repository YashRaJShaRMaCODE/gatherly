import test from "node:test";
import assert from "node:assert/strict";
import { buildCalendarEvent, calendarFilename } from "../lib/calendarEvent.mjs";

const event = {
  slug: "community-meetup",
  title: "Meetup, next; week",
  description: "Bring a notebook\nand a friend.",
  venue: "Studio 1",
  city: "Pune",
  country: "India",
  startDate: "2026-12-01T12:00:00+05:30",
  endDate: "2026-12-01T14:00:00+05:30",
};

test("calendar export escapes text and uses UTC event times", () => {
  const ics = buildCalendarEvent(event, "2026-11-17T00:00:00Z");
  assert.match(ics, /DTSTART:20261201T063000Z/);
  assert.match(ics, /DTEND:20261201T083000Z/);
  assert.match(ics, /SUMMARY:Meetup\\, next\\; week/);
  assert.match(ics, /DESCRIPTION:Bring a notebook\\nand a friend\./);
  assert.match(ics, /LOCATION:Studio 1\\, Pune\\, India/);
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
});

test("calendar export rejects invalid or reversed dates", () => {
  assert.throws(() => buildCalendarEvent({ ...event, startDate: "bad" }), /valid/);
  assert.throws(() => buildCalendarEvent({ ...event, endDate: event.startDate }), /after/);
});

test("calendar export folds long lines and sanitizes download names", () => {
  const ics = buildCalendarEvent({ ...event, description: "🙂".repeat(80) });
  for (const line of ics.split("\r\n")) {
    assert.ok(new TextEncoder().encode(line).length <= 75);
  }
  assert.equal(calendarFilename("bad/slug?x"), "bad-slug-x.ics");
});
