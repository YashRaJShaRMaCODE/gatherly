export function aiGenerationsAfterRefund(usageDate, currentCount, today) {
  if (usageDate !== today || !Number.isInteger(currentCount) || currentCount < 1) {
    return null;
  }
  return currentCount - 1;
}

function encodeBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function signAiQuotaRefundProof(subject, reservationId, secret, now = Date.now()) {
  const payload = encodeBase64Url(new TextEncoder().encode(JSON.stringify({
    subject,
    reservationId,
    expiresAt: now + 5 * 60_000,
  })));
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifyAiQuotaRefundProof(proof, subject, reservationId, secret, now = Date.now()) {
  if (typeof proof !== "string" || secret.length < 32) return false;
  const [payloadPart, signaturePart, extra] = proof.split(".");
  if (!payloadPart || !signaturePart || extra !== undefined) return false;

  try {
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(payloadPart)));
    if (
      payload.subject !== subject
      || payload.reservationId !== reservationId
      || !Number.isFinite(payload.expiresAt)
      || payload.expiresAt <= now
      || payload.expiresAt > now + 5 * 60_000
    ) return false;

    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
    );
    return await crypto.subtle.verify(
      "HMAC", key, decodeBase64Url(signaturePart), new TextEncoder().encode(payloadPart)
    );
  } catch {
    return false;
  }
}
