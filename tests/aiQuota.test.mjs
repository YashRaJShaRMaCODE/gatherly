import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AI_GENERATION_RESERVATION_TTL_MS,
  aiGenerationsAfterRefund,
  getAiGenerationQuotaState,
  signAiQuotaRefundProof,
  verifyAiQuotaRefundProof,
} from "../lib/aiQuota.mjs";

test("failed generation releases one reservation from today's quota", () => {
  assert.equal(aiGenerationsAfterRefund("2026-11-15", 3, "2026-11-15"), 2);
});

test("refund cannot change another UTC day's quota or go below zero", () => {
  assert.equal(aiGenerationsAfterRefund("2026-11-14", 3, "2026-11-15"), null);
  assert.equal(aiGenerationsAfterRefund("2026-11-15", 0, "2026-11-15"), null);
});

test("expired AI reservations release quota but committed generations remain counted", () => {
  const now = Date.parse("2026-11-15T12:00:00.000Z");
  const state = getAiGenerationQuotaState(
    "2026-11-15",
    4,
    [`r:${now - AI_GENERATION_RESERVATION_TTL_MS}:expired`, `r:${now - 1_000}:active`],
    "2026-11-15",
    now
  );
  assert.deepEqual(state, { used: 3, reservations: [`r:${now - 1_000}:active`] });
});

test("legacy reservations stay counted and usage resets on the next UTC day", () => {
  const now = Date.parse("2026-11-15T12:00:00.000Z");
  assert.deepEqual(
    getAiGenerationQuotaState("2026-11-15", 2, ["legacy-reservation"], "2026-11-15", now),
    { used: 2, reservations: ["legacy-reservation"] }
  );
  assert.deepEqual(
    getAiGenerationQuotaState("2026-11-15", 5, [`r:${now}:active`], "2026-11-16", now),
    { used: 0, reservations: [] }
  );
});

test("refund proof is short-lived and tied to one user and reservation", async () => {
  const secret = "s".repeat(32);
  const proof = await signAiQuotaRefundProof("user-1", "reservation-1", secret, 1_000);
  assert.equal(await verifyAiQuotaRefundProof(proof, "user-1", "reservation-1", secret, 2_000), true);
  assert.equal(await verifyAiQuotaRefundProof(proof, "user-2", "reservation-1", secret, 2_000), false);
  assert.equal(await verifyAiQuotaRefundProof(proof, "user-1", "reservation-2", secret, 2_000), false);
  assert.equal(await verifyAiQuotaRefundProof(proof, "user-1", "reservation-1", secret, 301_001), false);
});
