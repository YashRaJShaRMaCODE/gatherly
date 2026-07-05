import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/my-events(.*)",
  "/create-event(.*)",
  "/my-tickets(.*)",
]);

function isClerkConfigured() {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const hasValidPrefix =
    clerkKey.startsWith("pk_test_") || clerkKey.startsWith("pk_live_");
  const isPlaceholder =
    clerkKey.includes("YOUR_KEY") ||
    clerkKey.includes("REPLACE_WITH") ||
    clerkKey.length < 30;

  return hasValidPrefix && !isPlaceholder;
}

const middleware = clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (!userId && isProtectedRoute(req)) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  return NextResponse.next();
});

export default function proxy(req, event) {
  if (!isClerkConfigured()) {
    return NextResponse.next();
  }

  return middleware(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
