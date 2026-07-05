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

- Node.js 18+
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

### Deploy Next.js (Vercel recommended)

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Deploy

Or build locally:

```bash
npm run build
npm start
```

### Post-deploy checklist

- [ ] All env vars set on Vercel/hosting platform
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
