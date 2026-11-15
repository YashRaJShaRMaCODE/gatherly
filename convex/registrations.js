import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { canCancelRegistration, isCheckInOpen } from "./lib/registrationPolicy";

// Generate unique QR code ID
function generateQRCode() {
  const randomParts = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, "0")
  );
  return `EVT-${randomParts.join("").toUpperCase()}`;
}

// Register for an event
export const registerForEvent = mutation({
  args: {
    eventId: v.id("events"),
    attendeeName: v.string(),
    attendeeEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) throw new Error("Please sign in to register.");

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }
    if (event.startDate <= Date.now()) throw new Error("Registration for this event has closed.");

    const attendeeName = args.attendeeName.trim();
    const attendeeEmail = args.attendeeEmail.trim().toLowerCase();
    if (attendeeName.length < 2 || attendeeName.length > 120) {
      throw new Error("Name must be between 2 and 120 characters.");
    }
    if (attendeeEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendeeEmail)) {
      throw new Error("Enter a valid email address.");
    }

    // Check if event is full
    if (event.registrationCount >= event.capacity) {
      throw new Error("Event is full");
    }

    // Check if user already registered
    const existingRegistration = await ctx.db
      .query("registrations")
      .withIndex("by_event_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id)
      )
      .unique();

    if (existingRegistration?.status === "confirmed") {
      throw new Error("You are already registered for this event");
    }

    const registeredAt = Date.now();
    const qrCode = generateQRCode();
    const registrationId = existingRegistration
      ? existingRegistration._id
      : await ctx.db.insert("registrations", {
          eventId: args.eventId,
          userId: user._id,
          attendeeName,
          attendeeEmail,
          qrCode,
          checkedIn: false,
          status: "confirmed",
          registeredAt,
        });

    if (existingRegistration) {
      await ctx.db.patch(registrationId, {
        attendeeName,
        attendeeEmail,
        qrCode,
        checkedIn: false,
        checkedInAt: undefined,
        status: "confirmed",
        registeredAt,
      });
    }

    // Update event registration count
    await ctx.db.patch(args.eventId, {
      registrationCount: event.registrationCount + 1,
    });

    return registrationId;
  },
});

// Check if user is registered for an event
export const checkRegistration = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) return null;

    const registration = await ctx.db
      .query("registrations")
      .withIndex("by_event_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id)
      )
      .unique();

    return registration?.status === "confirmed" ? registration : null;
  },
});

// Get user's registrations (tickets)
export const getMyRegistrations = query({
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) throw new Error("Please sign in to view your tickets.");

    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(100);

    // Fetch event details for each registration
    const registrationsWithEvents = await Promise.all(
      registrations.map(async (reg) => {
        const event = await ctx.db.get(reg.eventId);
        return {
          ...reg,
          event,
        };
      })
    );

    return registrationsWithEvents;
  },
});

// Cancel registration
export const cancelRegistration = mutation({
  args: { registrationId: v.id("registrations") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) throw new Error("Please sign in to manage your tickets.");

    const registration = await ctx.db.get(args.registrationId);
    if (!registration) {
      throw new Error("Registration not found");
    }

    // Check if user owns this registration
    if (registration.userId !== user._id) {
      throw new Error("You are not authorized to cancel this registration");
    }

    if (registration.status === "cancelled") return { success: true };
    if (registration.checkedIn) throw new Error("A checked-in ticket cannot be cancelled.");

    const event = await ctx.db.get(registration.eventId);
    if (!event) {
      throw new Error("Event not found");
    }
    if (!canCancelRegistration(event.startDate)) {
      throw new Error("Registration can only be cancelled before the event starts.");
    }

    // Update registration status
    await ctx.db.patch(args.registrationId, {
      status: "cancelled",
    });

    // Decrement event registration count
    if (event.registrationCount > 0) {
      await ctx.db.patch(registration.eventId, {
        registrationCount: event.registrationCount - 1,
      });
    }

    return { success: true };
  },
});

// Get registrations for an event (for organizers)
export const getEventRegistrations = query({
  args: { eventId: v.id("events"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) throw new Error("Please sign in to view this guest list.");

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check if user is the organizer
    if (event.organizerId !== user._id) {
      throw new Error("You are not authorized to view registrations");
    }

    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .paginate(args.paginationOpts);

    return registrations;
  },
});

// Check-in attendee with QR code
export const checkInAttendee = mutation({
  args: { qrCode: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) throw new Error("Please sign in to check in attendees.");
    if (args.qrCode.length > 80) throw new Error("Invalid QR code");

    const registration = await ctx.db
      .query("registrations")
      .withIndex("by_qr_code", (q) => q.eq("qrCode", args.qrCode))
      .unique();

    if (!registration) {
      throw new Error("Invalid QR code");
    }

    const event = await ctx.db.get(registration.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check if user is the organizer
    if (event.organizerId !== user._id) {
      throw new Error("You are not authorized to check in attendees");
    }
    if (!isCheckInOpen(event.startDate, event.endDate)) {
      throw new Error("Check-in is available only while the event is running.");
    }
    if (registration.status !== "confirmed") throw new Error("This ticket was cancelled.");

    // Check if already checked in
    if (registration.checkedIn) {
      return {
        success: false,
        message: "Already checked in",
        registration,
      };
    }

    let checkedInCount = event.checkedInCount;
    if (checkedInCount === undefined) {
      const existingRegistrations = await ctx.db
        .query("registrations")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect();
      checkedInCount = existingRegistrations.filter(
        (item) => item.checkedIn && item.status === "confirmed"
      ).length;
    }

    // Check in
    await ctx.db.patch(registration._id, {
      checkedIn: true,
      checkedInAt: Date.now(),
    });
    await ctx.db.patch(event._id, { checkedInCount: checkedInCount + 1 });

    return {
      success: true,
      message: "Check-in successful",
      registration: {
        ...registration,
        checkedIn: true,
        checkedInAt: Date.now(),
      },
    };
  },
});
