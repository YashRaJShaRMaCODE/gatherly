import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

function encodeBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function POST(request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  try {
    const { userId, has } = await auth();
    if (!userId) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    if (!has({ plan: "pro" })) return NextResponse.json({ error: "An active Pro plan is required." }, { status: 403 });

    const secret = process.env.ENTITLEMENT_SIGNING_SECRET;
    if (!secret || secret.length < 32) {
      return NextResponse.json({ error: "Pro event access is not configured." }, { status: 503 });
    }

    const encoder = new TextEncoder();
    const payloadPart = encodeBase64Url(encoder.encode(JSON.stringify({ sub: userId, exp: Date.now() + 30_000 })));
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadPart));
    return NextResponse.json({ proof: `${payloadPart}.${encodeBase64Url(new Uint8Array(signature))}` });
  } catch (error) {
    console.error("Pro entitlement verification failed:", error?.name || "UnknownError");
    return NextResponse.json({ error: "Could not verify your plan." }, { status: 503 });
  }
}
