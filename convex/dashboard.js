import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get event with detailed stats for dashboard
export const getEventDashboard = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);

    if (!user) {
      throw new Error("User not found");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check if user is the organizer
    if (event.organizerId !== user._id) {
      throw new Error("You are not authorized to view this dashboard");
    }

    const totalRegistrations = event.registrationCount;
    let checkedInCount = event.checkedInCount;
    if (checkedInCount === undefined) {
      const registrations = await ctx.db
        .query("registrations")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .collect();
      checkedInCount = registrations.filter(
        (registration) => registration.checkedIn && registration.status === "confirmed"
      ).length;
    }
    const pendingCount = totalRegistrations - checkedInCount;

    // Payments happen directly with organizers and are not tracked here.
    let estimatedTicketValue = 0;
    if (event.ticketType === "paid" && event.ticketPrice) {
      estimatedTicketValue = checkedInCount * event.ticketPrice;
    }

    // Calculate check-in rate
    const checkInRate =
      totalRegistrations > 0
        ? Math.round((checkedInCount / totalRegistrations) * 100)
        : 0;

    // Calculate time until event
    const now = Date.now();
    const timeUntilEvent = event.startDate - now;
    const hoursUntilEvent = Math.max(
      0,
      Math.floor(timeUntilEvent / (1000 * 60 * 60))
    );

    const today = new Date().setHours(0, 0, 0, 0);
    const startDay = new Date(event.startDate).setHours(0, 0, 0, 0);
    const endDay = new Date(event.endDate).setHours(0, 0, 0, 0);
    const isEventToday = today >= startDay && today <= endDay;
    const isEventPast = event.endDate < now;

    return {
      event,
      stats: {
        totalRegistrations,
        checkedInCount,
        pendingCount,
        capacity: event.capacity,
        checkInRate,
        estimatedTicketValue,
        hoursUntilEvent,
        isEventToday,
        isEventPast,
      },
    };
  },
});
