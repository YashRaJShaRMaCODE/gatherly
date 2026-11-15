import { query } from "./_generated/server";
import { v } from "convex/values";

const MAX_FEATURED_SCAN = 500;
const clampLimit = (limit, fallback, maximum) =>
  Math.min(Math.max(Math.floor(limit ?? fallback), 1), maximum);

// Get featured events (high registration count or recent)
export const getFeaturedEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const events = await ctx.db
      .query("events")
      .withIndex("by_start_date", (q) => q.gte("startDate", now))
      .order("asc")
      .take(MAX_FEATURED_SCAN);

    // Sort by registration count for featured
    const featured = events
      .sort((a, b) => b.registrationCount - a.registrationCount)
      .slice(0, clampLimit(args.limit, 3, 50));

    return featured;
  },
});

// Get events by location (city/state)
export const getEventsByLocation = query({
  args: {
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const limit = clampLimit(args.limit, 4, 50);
    if (args.city?.trim()) {
      return await ctx.db
        .query("events")
        .withIndex("by_city_start_date", (q) =>
          q.eq("city", args.city.trim()).gte("startDate", now)
        )
        .order("asc")
        .take(limit);
    }
    if (args.state?.trim()) {
      return await ctx.db
        .query("events")
        .withIndex("by_state_start_date", (q) =>
          q.eq("state", args.state.trim()).gte("startDate", now)
        )
        .order("asc")
        .take(limit);
    }
    return [];
  },
});

// Get popular events (high registration count)
export const getPopularEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const events = await ctx.db
      .query("events")
      .withIndex("by_start_date", (q) => q.gte("startDate", now))
      .order("asc")
      .take(MAX_FEATURED_SCAN);

    // Sort by registration count
    const popular = events
      .sort((a, b) => b.registrationCount - a.registrationCount)
      .slice(0, clampLimit(args.limit, 6, 50));

    return popular;
  },
});

// Get events by category with pagination
export const getEventsByCategory = query({
  args: {
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db
      .query("events")
      .withIndex("by_category_start_date", (q) =>
        q.eq("category", args.category).gte("startDate", now)
      )
      .order("asc")
      .take(clampLimit(args.limit, 12, 50));
  },
});

// Get event counts by category
export const getCategoryCounts = query({
  handler: async (ctx) => {
    const now = Date.now();
    const events = await ctx.db
      .query("events")
      .withIndex("by_start_date", (q) => q.gte("startDate", now))
      .collect();

    // Count events by category
    const counts = {};
    events.forEach((event) => {
      counts[event.category] = (counts[event.category] || 0) + 1;
    });

    return counts;
  },
});
