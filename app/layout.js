import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/header";
import "./globals.css";
import { dark } from "@clerk/themes";
import { ThemeProvider } from "@/components/theme-provider";
import Footer from "@/components/footer";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import SetupRequired from "@/components/setup-required";
import { isAppConfigured } from "@/lib/env";
import { Toaster } from "sonner";
import { securePublicOrigin } from "@/lib/publicOrigin.mjs";

const siteUrl = securePublicOrigin(process.env.NEXT_PUBLIC_SITE_URL);
const secureSiteUrl = siteUrl ? new URL(siteUrl) : undefined;

export const metadata = {
  metadataBase: secureSiteUrl,
  title: "Spott | Discover and plan better events",
  description: "Find events worth showing up for, or turn an idea into a polished event draft with Spott.",
  applicationName: "Spott",
  alternates: secureSiteUrl ? { canonical: secureSiteUrl } : undefined,
  openGraph: {
    title: "Spott | Discover and plan better events",
    description: "Find events worth showing up for, or turn an idea into a polished event draft with Spott.",
    siteName: "Spott",
    type: "website",
    url: secureSiteUrl?.toString(),
  },
  twitter: {
    card: "summary_large_image",
    title: "Spott | Discover and plan better events",
    description: "Find events worth showing up for, or turn an idea into a polished event draft with Spott.",
  },
};

export const dynamic = "force-dynamic";

function AppShell({ children, showHeader = true }) {
  return (
    <>
      {showHeader && <Header />}
      <main
        className={`relative min-h-screen container mx-auto ${showHeader ? "pt-40 md:pt-32" : "pt-20"}`}
      >
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">{children}</div>
        <Footer />
      </main>
      <Toaster position="top-center" richColors />
    </>
  );
}

export default function RootLayout({ children }) {
  const configured = isAppConfigured();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-linear-to-br from-gray-950 via-zinc-900 to-stone-900 text-white">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {configured ? (
            <ClerkProvider appearance={{ baseTheme: dark }}>
              <ConvexClientProvider>
                <AppShell>{children}</AppShell>
              </ConvexClientProvider>
            </ClerkProvider>
          ) : (
            <AppShell showHeader={false}>
              <SetupRequired />
            </AppShell>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
