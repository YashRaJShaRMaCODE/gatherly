import { securePublicOrigin } from "@/lib/publicOrigin.mjs";

const siteUrl = securePublicOrigin(process.env.NEXT_PUBLIC_SITE_URL);

export default function robots() {
  if (!siteUrl) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
