import assert from "node:assert/strict";
import { test } from "node:test";
import { buildCsv, safeCsvFilename, toSafeCsvCell } from "../lib/csv.mjs";

test("CSV cells quote delimiters and neutralize spreadsheet formulas", () => {
  assert.equal(toSafeCsvCell('=HYPERLINK("https://bad.test")'), '"\'=HYPERLINK(""https://bad.test"")"');
  assert.equal(toSafeCsvCell("  @SUM(1,2)"), '"\'  @SUM(1,2)"');
  assert.equal(buildCsv([["Name", "Email"], ["Asha, Sharma", "asha@example.test"]]),
    '"Name","Email"\r\n"Asha, Sharma","asha@example.test"');
});

test("CSV filenames remove path and control characters", () => {
  assert.equal(safeCsvFilename("../Event: Spring"), "..-Event- Spring_registrations.csv");
  assert.equal(safeCsvFilename("   "), "event_registrations.csv");
});
