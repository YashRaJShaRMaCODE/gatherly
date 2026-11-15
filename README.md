# Spott — AI Event Organiser

Discover and create events with AI-powered planning, Clerk authentication, and Convex backend.

![Spott landing page](https://github.com/user-attachments/assets/f7f48cdc-a3bf-40e0-b275-cf690e1bdd48)

## Tech Stack

- **Next.js 16** (App Router)
- **Convex** (database & backend)
- **Clerk** (authentication)
- **Google Gemini** (AI event generation)
- **Unsplash** (cover images)
- **Tailwind CSS 4** + **shadcn/ui**

## Prerequisites

- Node.js 20.9+
- Accounts on [Convex](https://convex.dev), [Clerk](https://clerk.com), [Google AI Studio](https://aistudio.google.com), and [Unsplash Developers](https://unsplash.com/developers)

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL |
| `CONVEX_DEPLOYMENT` | Convex deployment name (from `npx convex dev`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk JWT issuer (Frontend API URL) |
| `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY` | Unsplash API access key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `ENTITLEMENT_SIGNING_SECRET` | Shared 32+ character secret for signed Clerk Pro access proofs and server-only AI quota refunds (set in Next.js and Convex; never expose it to the browser) |

### Product limits

- AI event drafts require sign-in and are capped at five attempts per user per UTC day. Gemini output is only a draft; review it before publishing.
- Free organizers can have one free event at a time; deleting it releases the slot. Pro-created events do not consume the free slot. Pro access is verified on the server; direct client-supplied plan flags are never trusted.
- Paid ticket prices are informational only. Attendees pay organizers outside Spott; there is no checkout, payment capture, refund handling, or payout flow.

### Subscription setup

The current paid offer is for individual event organizers, not teams. The upgrade modal uses Clerk's `PricingTable`, and feature checks expect a public user plan with the exact slug `pro`. In Clerk Dashboard, enable Billing and configure that user plan with the actual features and a price/interval validated with organizers. The app does not define or collect a price in source code. Keep billing in test mode until checkout, renewal, cancellation, expiry, and server-side Pro entitlement have been verified. Organization-wide plans and shared team workspaces are not implemented. See [Clerk's B2C Billing guide](https://clerk.com/docs/guides/billing/for-b2c).

### 3. Start Convex

In a separate terminal:

```bash
npx convex dev
```

This creates your Convex project, writes `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` to `.env.local`, and syncs backend functions.

### 4. Connect Clerk to Convex

In the [Clerk Dashboard](https://dashboard.clerk.com):

1. Go to **JWT Templates** → create a template named `convex`
2. Set the issuer to your Clerk Frontend API URL
3. Copy that URL into `CLERK_JWT_ISSUER_DOMAIN` in `.env.local`

In the [Convex Dashboard](https://dashboard.convex.dev):

1. Go to **Settings → Environment Variables**
2. Add `CLERK_JWT_ISSUER_DOMAIN` with the same value

### 5. Seed sample events (optional)

```bash
npx convex run seed:seedEvents
```

### 6. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Production

### Deploy Convex

```bash
npx convex deploy
```

Copy the production `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOYMENT` into your hosting provider's environment variables.

### Deploy Next.js

Choose a hosting plan whose current terms permit commercial use and whose runtime fits a dynamic Next.js app. Confirm pricing, request limits, sleep behavior, and database/network compatibility before launch; a free tier may be suitable for a demo but is not assumed production-ready.

1. Import the project into the chosen host
2. Add all environment variables from `.env.example`
3. Set `ENTITLEMENT_SIGNING_SECRET` to the same strong random value in the Next.js host and Convex production environment
4. Deploy and verify sign-in, event creation, AI quotas, organizer access, and attendee registration on the production URL

Or build locally:

```bash
npm run build
npm start
```

### Post-deploy checklist

- [ ] All env vars set on Vercel/hosting platform
- [ ] Set the same `ENTITLEMENT_SIGNING_SECRET` in the Next.js host and Convex production environment
- [ ] `CLERK_JWT_ISSUER_DOMAIN` set in Convex production env
- [ ] Clerk allowed origins include your production domain
- [ ] Convex production deployment is linked (`npx convex deploy`)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

GitHub Actions runs lint, build, and a production dependency audit on pushes and pull requests to `main`.

## Project Structure

```
app/           → Next.js pages and API routes
components/    → UI components
convex/        → Convex backend (schema, queries, mutations)
hooks/         → React hooks
lib/           → Utilities
public/        → Static assets
proxy.js       → Clerk route protection (Next.js 16)
```

## Tutorial

Based on the [Full Stack AI Event Organiser tutorial](https://www.youtube.com/watch?v=4keJJzL-VCM).
