export function canCancelRegistration(eventStart, now = Date.now()) {
  return eventStart > now;
}

export function isCheckInOpen(eventStart, eventEnd, now = Date.now()) {
  return eventStart <= now && now < eventEnd;
}
