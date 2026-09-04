import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DATABASE_URL: z.string().startsWith("postgresql://"),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_REDIRECT_URI: z.string().url(),
  LOG_LEVEL: z
    .enum(["silent", "fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
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
    googleClientId: result.data.GOOGLE_CLIENT_ID,
    googleClientSecret: result.data.GOOGLE_CLIENT_SECRET,
    googleRedirectUri: result.data.GOOGLE_REDIRECT_URI,
    logLevel: result.data.LOG_LEVEL,
  };
}
