import "server-only";

const apiUrl = process.env.API_URL;

if (!apiUrl) {
  throw new Error(
    "API_URL is not configured. Add it to apps/store/.env.local.",
  );
}

const apiBaseUrl = apiUrl.replace(/\/+$/, "");

export function getApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${apiBaseUrl}${normalizedPath}`;
}