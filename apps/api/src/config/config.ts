import { z } from "zod";

const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
    DATABASE_URL: z.string().startsWith("postgresql://"),
    APP_ORIGIN: z.string().url(),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_REDIRECT_URI: z.string().url(),
    LOG_LEVEL: z
      .enum(["silent", "fatal", "error", "warn", "info", "debug", "trace"])
      .default("info"),
  })
  .superRefine((environment, context) => {
    const appOrigin = new URL(environment.APP_ORIGIN);
    const googleRedirect = new URL(environment.GOOGLE_REDIRECT_URI);
    if (
      appOrigin.pathname !== "/" ||
      appOrigin.search ||
      appOrigin.hash ||
      appOrigin.username ||
      appOrigin.password
    ) {
      context.addIssue({
        code: "custom",
        path: ["APP_ORIGIN"],
        message: "must contain an origin only",
      });
    }
    if (
      googleRedirect.origin !== appOrigin.origin ||
      googleRedirect.pathname !== "/api/auth/google/callback" ||
      googleRedirect.search ||
      googleRedirect.hash ||
      googleRedirect.username ||
      googleRedirect.password
    ) {
      context.addIssue({
        code: "custom",
        path: ["GOOGLE_REDIRECT_URI"],
        message: "must use the Public Application Origin and callback path",
      });
    }
    if (
      environment.NODE_ENV === "production" &&
      appOrigin.protocol !== "https:"
    ) {
      context.addIssue({
        code: "custom",
        path: ["APP_ORIGIN"],
        message: "must use HTTPS in production",
      });
    }
  });

export type ApiConfig = ReturnType<typeof parseConfig>;

export function parseConfig(
  environment: NodeJS.ProcessEnv | Record<string, string | undefined>,
) {
  const result = environmentSchema.safeParse(environment);

  if (!result.success) {
    const fields = [
      ...new Set(result.error.issues.map((issue) => issue.path.join("."))),
    ].join(", ");
    throw new Error(`Invalid API configuration: ${fields}`);
  }

  return {
    nodeEnv: result.data.NODE_ENV,
    port: result.data.PORT,
    databaseUrl: result.data.DATABASE_URL,
    appOrigin: new URL(result.data.APP_ORIGIN).origin,
    googleClientId: result.data.GOOGLE_CLIENT_ID,
    googleClientSecret: result.data.GOOGLE_CLIENT_SECRET,
    googleRedirectUri: result.data.GOOGLE_REDIRECT_URI,
    logLevel: result.data.LOG_LEVEL,
  };
}
