import assert from "node:assert/strict";
import { test } from "node:test";
import {
  aiGenerationsAfterRefund,
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

test("refund proof is short-lived and tied to one user and reservation", async () => {
  const secret = "s".repeat(32);
  const proof = await signAiQuotaRefundProof("user-1", "reservation-1", secret, 1_000);
  assert.equal(await verifyAiQuotaRefundProof(proof, "user-1", "reservation-1", secret, 2_000), true);
  assert.equal(await verifyAiQuotaRefundProof(proof, "user-2", "reservation-1", secret, 2_000), false);
  assert.equal(await verifyAiQuotaRefundProof(proof, "user-1", "reservation-2", secret, 2_000), false);
  assert.equal(await verifyAiQuotaRefundProof(proof, "user-1", "reservation-1", secret, 301_001), false);
});
