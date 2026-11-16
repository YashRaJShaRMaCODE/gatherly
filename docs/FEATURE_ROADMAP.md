# Spott feature roadmap

Features below are candidates, not validated demand. Prioritize from interviews. Existing functions are labeled as baseline so they are not double-counted as new work.

| # | Feature | User problem solved | Competitor gap / reason to test | Impact | Effort | Status |
|---:|---|---|---|---|---|---|
| 1 | Add event to calendar (.ics) | Attendees forget event date or have to re-enter event details | The discovery page should create a usable next action after RSVP | High | Low | Implemented locally; downloads a UTC, escaped, folded `.ics` without attendee data; 3 unit tests |
| 2 | Organizer event templates / duplicate event | Recurring hosts repeat descriptions, venue and settings | Reduce setup without needing a new organization plan | High | Medium | Planned |
| 3 | Public attendee capacity/waitlist controls | Hosts need a fair path after an event fills | Existing event registration currently blocks when capacity is reached | High | Medium | Planned |
| 4 | Organizer collaboration roles | Co-hosts need scoped access without sharing passwords | Team plans exist elsewhere, but Spott currently targets individuals | High | High | Planned; role and billing boundary first |
| 5 | Registration question builder | Hosts need a small amount of event-specific context | Avoid moving guest lists to external forms | High | Medium | Planned; privacy/data minimization review |
| 6 | Calendar-based reminder schedule | Attendees miss event changes or arrival time | Reminders can reduce manual coordination | High | High | Planned; email provider and consent needed |
| 7 | Offline check-in queue and reconciliation | Venue Wi-Fi can fail at the door | Keep admission flowing during a network issue | High | High | Planned; duplicate-scan handling required |
| 8 | Event attendance and RSVP funnel | Organizer cannot compare interest, registrations and check-ins | Basic event analytics should be actionable and exportable | High | Medium | Planned |
| 9 | Import/export calendar and RSVP data | Hosts need migration and backup | Prevent event history being trapped | Medium | Medium | CSV export exists; import validation planned |
| 10 | Waitlist promotion with explicit acceptance | Canceled seats are difficult to refill fairly | Reduce manual waitlist contact; no automatic paid promises | Medium | High | Planned; consent and idempotency required |
| 11 | Saved search and event alerts | Attendees miss new events matching interests | Improve repeat discovery | Medium | High | Planned; email opt-in and unsubscribe needed |
| 12 | Event page language alternatives | Local communities serve multilingual audiences | Reduce organizer translation effort while preserving facts | Medium | High | Planned; human review required |
| 13 | Shareable public event toolkit | Hosts need consistent copy/assets across channels | Make event distribution easier without fake urgency | Medium | Medium | Planned |
| 14 | Accessible check-in roster mode | Door staff need keyboard, zoom, and screen-reader support | Improve reliability at busy entrances | Medium | Medium | Planned; WCAG 2.2 AA review |
| 15 | Organizer post-event feedback summary | Hosts need an evidence-based improvement loop | Aggregate optional feedback rather than vanity metrics | Medium | High | Planned; participant consent and retention limits |

## Baseline already present

Event discovery and filtering, AI event draft generation, individual Clerk sign-in, Convex event/registration data, QR check-in, cancellation, CSV registration export, onboarding, free/Pro event quota, explicit offline payment to the organizer, and `.ics` calendar download are current code paths. Their presence is not proof of production readiness. Subscription pricing remains owner-configured in Clerk test mode; there is no ticket checkout or payout feature.
