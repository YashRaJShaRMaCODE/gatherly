import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  aiGenerationsAfterRefund,
  getAiGenerationQuotaState,
  verifyAiQuotaRefundProof,
} from "../lib/aiQuota.mjs";

// Store or update user from Clerk
export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }

    // Check if we've already stored this identity before
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (user !== null) {
      // If we've seen this identity before but details changed, update them
      const updates = {};
      if (user.name !== identity.name) {
        updates.name = identity.name ?? "Anonymous";
      }
      if (user.email !== identity.email) {
        updates.email = identity.email ?? "";
      }
      if (user.imageUrl !== identity.pictureUrl) {
        updates.imageUrl = identity.pictureUrl;
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = Date.now();
        await ctx.db.patch(user._id, updates);
      }

      return user._id;
    }

    // If it's a new identity, create a new user with defaults
    return await ctx.db.insert("users", {
      email: identity.email ?? "",
      tokenIdentifier: identity.tokenIdentifier,
      name: identity.name ?? "Anonymous",
      imageUrl: identity.pictureUrl,
      hasCompletedOnboarding: false,
      freeEventsCreated: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get current authenticated user
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // 🔹 Lookup by tokenIdentifier
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  },
});

// Reserve one of the authenticated user's five daily AI generations.
export const consumeAiGeneration = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) throw new Error("User not found");

    const now = Date.now();
    const today = new Date(now).toISOString().slice(0, 10);
    const quotaState = getAiGenerationQuotaState(
      user.aiUsageDate,
      user.aiGenerationsToday ?? 0,
      user.aiGenerationReservations ?? [],
      today,
      now
    );
    const used = quotaState.used;
    if (used >= 5) {
      const reset = new Date(now);
      reset.setUTCHours(24, 0, 0, 0);
      return { allowed: false, remaining: 0, resetsAt: reset.toISOString() };
    }

    const reservationId = `r:${now}:${crypto.randomUUID()}`;
    await ctx.db.patch(user._id, {
      aiUsageDate: today,
      aiGenerationsToday: used + 1,
      aiGenerationReservations: [...quotaState.reservations, reservationId],
      updatedAt: now,
    });
    return { allowed: true, remaining: 4 - used, reservationId };
  },
});

export const commitAiGeneration = mutation({
  args: { reservationId: v.string() },
  handler: async (ctx, { reservationId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    const reservations = user.aiGenerationReservations ?? [];
    if (!reservations.includes(reservationId)) return { committed: false };
    await ctx.db.patch(user._id, {
      aiGenerationReservations: reservations.filter((id) => id !== reservationId),
      updatedAt: Date.now(),
    });
    return { committed: true };
  },
});

// Return one reserved generation only when the authenticated server route proves failure.
export const refundAiGeneration = mutation({
  args: { reservationId: v.string(), proof: v.string() },
  handler: async (ctx, { reservationId, proof }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const secret = process.env.ENTITLEMENT_SIGNING_SECRET ?? "";
    if (!await verifyAiQuotaRefundProof(proof, identity.subject, reservationId, secret)) {
      throw new Error("Invalid quota refund proof");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) throw new Error("User not found");

    const reservations = user.aiGenerationReservations ?? [];
    if (!reservations.includes(reservationId)) return { refunded: false };

    const today = new Date().toISOString().slice(0, 10);
    const refundedCount = aiGenerationsAfterRefund(
      user.aiUsageDate,
      user.aiGenerationsToday ?? 0,
      today
    );
    const nextReservations = reservations.filter((id) => id !== reservationId);
    if (refundedCount === null) {
      await ctx.db.patch(user._id, {
        aiGenerationReservations: nextReservations,
        updatedAt: Date.now(),
      });
      return { refunded: false };
    }

    await ctx.db.patch(user._id, {
      aiGenerationsToday: refundedCount,
      aiGenerationReservations: nextReservations,
      updatedAt: Date.now(),
    });
    return { refunded: true };
  },
});

// Complete onboarding (attendee preferences)
export const completeOnboarding = mutation({
  args: {
    location: v.object({
      city: v.string(),
      state: v.optional(v.string()), // Added state field
      country: v.string(),
    }),
    interests: v.array(v.string()), // Min 3 categories
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) throw new Error("Please sign in to complete onboarding.");

    if (args.interests.length < 3 || args.interests.length > 12) {
      throw new Error("Choose 3 to 12 valid interests.");
    }
    const validInterests = new Set([
      "tech", "music", "sports", "art", "food", "business", "health",
      "education", "gaming", "networking", "outdoor", "community",
    ]);
    const interests = [...new Set(args.interests.map((interest) => interest.trim()))];
    if (interests.length < 3 || interests.length > validInterests.size || interests.some((interest) => !validInterests.has(interest))) {
      throw new Error("Choose 3 to 12 valid interests.");
    }
    const { city, state, country } = args.location;
    if ([city, state, country].some((value) => value !== undefined && (value.trim().length < 2 || value.length > 100))) {
      throw new Error("Location fields must be between 2 and 100 characters.");
    }

    await ctx.db.patch(user._id, {
      location: { city: city.trim(), state: state?.trim(), country: country.trim() },
      interests,
      hasCompletedOnboarding: true,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});
