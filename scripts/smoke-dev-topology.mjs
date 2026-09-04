const appOrigin = process.env.APP_ORIGIN ?? "http://localhost:5173";
const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:3000";

async function requireOk(url, label) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${label} returned ${response.status}`);
}

await requireOk(appOrigin, "Web application");
await requireOk(`${apiOrigin}/api/health`, "Direct API health");
await requireOk(`${appOrigin}/api/health`, "Proxied API health");

const authResponse = await fetch(
  `${appOrigin}/api/auth/google/start?returnTo=%2F`,
  { redirect: "manual" },
);
if (authResponse.status !== 302) {
  throw new Error(`Google auth start returned ${authResponse.status}`);
}
const authorizationUrl = new URL(authResponse.headers.get("location"));
if (authorizationUrl.origin !== "https://accounts.google.com") {
  throw new Error("Google auth start did not redirect to Google");
}
if (
  authorizationUrl.searchParams.get("redirect_uri") !==
  `${appOrigin}/api/auth/google/callback`
) {
  throw new Error("Google callback URI does not use APP_ORIGIN");
}

process.stdout.write("Development topology smoke test passed\n");
