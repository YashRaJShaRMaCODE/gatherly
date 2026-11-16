import { securePublicOrigin } from "@/lib/publicOrigin.mjs";

const siteUrl = securePublicOrigin(process.env.NEXT_PUBLIC_SITE_URL);

export default function sitemap() {
  return siteUrl ? [{ url: `${siteUrl}/` }] : [];
}
