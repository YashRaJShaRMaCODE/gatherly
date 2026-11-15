import { query } from "./_generated/server";
import { v } from "convex/values";

// Search events by title
export const searchEvents = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const searchTerm = args.query.trim();
    if (searchTerm.length < 2 || searchTerm.length > 100) {
      return [];
    }
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 5), 1), 50);

    const now = Date.now();

    // Search by title
    const searchResults = await ctx.db
      .query("events")
      .withSearchIndex("search_title", (q) => q.search("title", searchTerm))
      .filter((q) => q.gte(q.field("startDate"), now))
      .take(limit);

    return searchResults;
  },
});
