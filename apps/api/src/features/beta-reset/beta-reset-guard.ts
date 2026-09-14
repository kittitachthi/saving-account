export function betaResetTargetAssert(environment: NodeJS.ProcessEnv) {
  const databaseUrl = new URL(environment.DATABASE_URL ?? "invalid:");
  if (
    environment.NODE_ENV === "production" ||
    environment.BETA_RESET_TARGET !== "beta" ||
    environment.BETA_RESET_DATABASE !== databaseUrl.pathname.slice(1)
  ) {
    throw new Error("Beta reset refused: target confirmation does not match");
  }
  return databaseUrl;
}
