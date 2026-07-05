export function isAppConfigured() {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

  const hasValidClerkKey =
    clerkKey.startsWith("pk_test_") || clerkKey.startsWith("pk_live_");
  const clerkKeyIsPlaceholder =
    clerkKey.includes("YOUR_KEY") ||
    clerkKey.includes("REPLACE_WITH") ||
    clerkKey.length < 30;

  const hasValidConvexUrl =
    convexUrl.startsWith("https://") && convexUrl.includes(".convex.");
  const convexUrlIsPlaceholder =
    convexUrl.includes("placeholder") || convexUrl.length < 20;

  return (
    hasValidClerkKey &&
    !clerkKeyIsPlaceholder &&
    hasValidConvexUrl &&
    !convexUrlIsPlaceholder
  );
}
