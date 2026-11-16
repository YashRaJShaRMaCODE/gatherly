export function securePublicOrigin(value) {
  if (!value) return null;
  try {
    const url = new URL(String(value).trim());
    if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}
