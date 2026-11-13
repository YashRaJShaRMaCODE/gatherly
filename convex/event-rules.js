export function validateEventDetails(event, now = Date.now()) {
  if (!Number.isFinite(event.startDate) || event.startDate <= now) {
    return { field: "startDate", message: "Event start must be in the future." };
  }
  if (!Number.isFinite(event.endDate) || event.endDate <= event.startDate) {
    return { field: "endDate", message: "Event end must be after its start." };
  }
  if (!Number.isInteger(event.capacity) || event.capacity < 1) {
    return { field: "capacity", message: "Capacity must be a positive whole number." };
  }
  if (event.ticketType === "paid" && (!Number.isFinite(event.ticketPrice) || event.ticketPrice <= 0)) {
    return { field: "ticketPrice", message: "Paid tickets need a price greater than zero." };
  }
  return null;
}

export function registrationAction(status, registrationCount, capacity) {
  if (status === "confirmed") return "already_registered";
  if (registrationCount >= capacity) return "full";
  return status === "cancelled" ? "reactivate" : "create";
}

export function matchesEventLocation(event, city, state) {
  const normalizedCity = city?.trim().toLocaleLowerCase();
  const normalizedState = state?.trim().toLocaleLowerCase();
  return (!normalizedCity || event.city.trim().toLocaleLowerCase() === normalizedCity)
    && (!normalizedState || (event.state || "").trim().toLocaleLowerCase() === normalizedState);
}
