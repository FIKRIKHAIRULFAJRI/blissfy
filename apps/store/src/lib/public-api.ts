const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!publicApiUrl) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not configured. Add it to apps/store/.env.local.",
  );
}

const publicApiBaseUrl = publicApiUrl.replace(/\/+$/, "");

export function getPublicApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${publicApiBaseUrl}${normalizedPath}`;
}