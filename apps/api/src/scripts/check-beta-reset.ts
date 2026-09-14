import { config as loadEnvironment } from "dotenv";
import { betaResetTargetAssert } from "../features/beta-reset/beta-reset-guard.js";

loadEnvironment({ path: new URL("../../../../.env", import.meta.url) });

const target = betaResetTargetAssert(process.env);
process.stdout.write(
  `Beta reset target verified: ${target.hostname}/${target.pathname.slice(1)}\nNo data was changed. Follow docs/BETA-DATA-RESET.md before implementing execution.\n`,
);
