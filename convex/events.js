import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { eventConsumesFreeSlot } from "../lib/eventQuota.mjs";

const eventCategories = new Set([
  "tech", "music", "sports", "art", "food", "business", "health",
  "education", "gaming", "networking", "outdoor", "community",
]);

async function verifyProProof(proof, subject) {
  const secret = process.env.ENTITLEMENT_SIGNING_SECRET;
  if (!proof || proof.length > 2048 || !secret) return false;
  const [payloadPart, signaturePart] = proof.split(".");
  if (!payloadPart || !signaturePart) return false;

  try {
    const decode = (part) => {
      const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
      return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    };
    const payload = JSON.parse(new TextDecoder().decode(decode(payloadPart)));
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      decode(signaturePart),
      new TextEncoder().encode(payloadPart)
    );
    return valid && payload.sub === subject && payload.exp > Date.now() && payload.exp - Date.now() <= 60_000;
  } catch {
    return false;
  }
}

// Create a new event
export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    timezone: v.string(),
    locationType: v.union(v.literal("physical"), v.literal("online")),
    venue: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.string(),
    state: v.optional(v.string()),
    country: v.string(),
    capacity: v.number(),
    ticketType: v.union(v.literal("free"), v.literal("paid")),
    ticketPrice: v.optional(v.number()),
    coverImage: v.optional(v.string()),
    themeColor: v.optional(v.string()),
    entitlementProof: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Please sign in to create an event.");
      const { entitlementProof, ...eventArgs } = args;
      const user = await ctx.runQuery(internal.users.getCurrentUser);
      if (!user) throw new Error("User not found.");

      const hasPro = await verifyProProof(entitlementProof, identity.subject);

      // SERVER-SIDE CHECK: Verify event limit for Free users
      if (!hasPro && user.freeEventsCreated >= 1) {
        throw new Error(
          "Free event limit reached. Please upgrade to Pro to create more events."
        );
      }

      // SERVER-SIDE CHECK: Verify custom color usage
      const defaultColor = "#1e3a8a";
      if (!hasPro && args.themeColor && args.themeColor !== defaultColor) {
        throw new Error(
          "Custom theme colors are a Pro feature. Please upgrade to Pro."
        );
      }

      // Force default color for Free users
      const themeColor = hasPro ? args.themeColor : defaultColor;

      const title = args.title.trim();
      const description = args.description.trim();
      if (title.length < 3 || title.length > 80) throw new Error("Title must be 3 to 80 characters.");
      if (description.length < 20 || description.length > 5000) throw new Error("Description must be 20 to 5000 characters.");
      if (!eventCategories.has(args.category)) throw new Error("Choose a valid event category.");
      if (args.startDate <= Date.now() || args.endDate <= args.startDate) throw new Error("Choose a future start and a later end time.");
      if (!Number.isInteger(args.capacity) || args.capacity < 1 || args.capacity > 50000) throw new Error("Capacity must be between 1 and 50,000.");
      if (args.ticketType === "paid" && (!Number.isFinite(args.ticketPrice) || args.ticketPrice <= 0 || args.ticketPrice > 10_000_000)) throw new Error("Paid events need a valid ticket price up to ₹1 crore.");
      if (args.tags.length > 10 || args.tags.some((tag) => tag.length > 40)) throw new Error("Use up to 10 tags, each no longer than 40 characters.");
      if (args.city.trim().length < 2 || args.country.trim().length < 2 || args.city.length > 100 || args.country.length > 100 || (args.state?.length ?? 0) > 100 || (args.venue?.length ?? 0) > 200 || (args.address?.length ?? 0) > 500 || args.timezone.length > 64) throw new Error("Location and timezone fields are invalid or too long.");
      if (args.coverImage) {
        const coverImage = new URL(args.coverImage);
        if (coverImage.protocol !== "https:" || coverImage.hostname !== "images.unsplash.com") throw new Error("Cover images must use Unsplash HTTPS URLs.");
      }
      if (args.themeColor && !/^#[0-9a-f]{6}$/i.test(args.themeColor)) throw new Error("Theme color must be a six-digit hex color.");
      if (args.locationType === "physical" && !args.venue?.trim() && !args.address?.trim()) throw new Error("Physical events need a venue or address.");
      try {
        new Intl.DateTimeFormat("en", { timeZone: args.timezone });
      } catch {
        throw new Error("Choose a valid time zone.");
      }

      // Generate slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "event";

      // Create event
      const eventId = await ctx.db.insert("events", {
        ...eventArgs,
        title,
        description,
        city: args.city.trim(),
        state: args.state?.trim(),
        country: args.country.trim(),
        venue: args.venue?.trim() || undefined,
        address: args.address?.trim() || undefined,
        timezone: args.timezone.trim(),
        tags: args.tags.map((tag) => tag.trim()).filter(Boolean),
        ticketPrice: args.ticketType === "paid" ? args.ticketPrice : undefined,
        themeColor, // Use validated color
        slug: `${slug}-${Date.now()}`,
        organizerId: user._id,
        organizerName: user.name,
        registrationCount: 0,
        checkedInCount: 0,
        createdWithPro: hasPro,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Update user's free event count
      if (!hasPro) {
        await ctx.db.patch(user._id, {
          freeEventsCreated: user.freeEventsCreated + 1,
        });
      }

      return eventId;
    } catch (error) {
      throw new Error(`Failed to create event: ${error.message}`);
    }
  },
});

// Get event by slug
export const getEventBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    return event;
  },
});

// Get events by organizer
export const getMyEvents = query({
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) throw new Error("Please sign in to view your events.");

    const events = await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizerId", user._id))
      .order("desc")
      .take(500);

    return events;
  },
});

// Delete event
export const deleteEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) throw new Error("Please sign in to delete your event.");

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check if user is the organizer
    if (event.organizerId !== user._id) {
      throw new Error("You are not authorized to delete this event");
    }

    // Delete all registrations for this event
    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    for (const registration of registrations) {
      await ctx.db.delete(registration._id);
    }

    // Delete the event
    await ctx.db.delete(args.eventId);

    // Update free event count if it was a free event
    if (eventConsumesFreeSlot(event) && user.freeEventsCreated > 0) {
      await ctx.db.patch(user._id, {
        freeEventsCreated: user.freeEventsCreated - 1,
      });
    }

    return { success: true };
  },
});
