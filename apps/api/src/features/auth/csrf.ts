import type { RequestHandler } from "express";

// Same-origin browser API contract. A foreign site cannot add this custom
// header without a CORS preflight, and this application does not enable CORS.
// Origin is checked against trusted configuration, never Host/proxy headers.
export function requireSameOriginMutation(appOrigin: string): RequestHandler {
  return (request, response, next) => {
    const site = request.header("Sec-Fetch-Site");
    if (
      request.header("Origin") !== appOrigin ||
      request.header("X-Pocka-Request") !== "1" ||
      (site !== undefined && site !== "same-origin")
    ) {
      response.status(403).json({
        error: { code: "CSRF_REJECTED", message: "Request not allowed" },
      });
      return;
    }
    next();
  };
}
