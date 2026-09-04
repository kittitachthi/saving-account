import { useState } from "react";
import type { BetaWaitlistRequest } from "@saving-account/contracts";

export const WAITLIST_CONSENT_VERSION = "2026-09-04";
export type WaitlistSubmissionState =
  "idle" | "submitting" | "success" | "error";

export function useBetaWaitlist() {
  const [state, setState] = useState<WaitlistSubmissionState>("idle");
  const submit = async (email: string) => {
    setState("submitting");
    const body: BetaWaitlistRequest = {
      email,
      consent: true,
      consentVersion: WAITLIST_CONSENT_VERSION,
    };
    try {
      const response = await fetch("/api/beta/waitlist", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("Waitlist request failed");
      setState("success");
      return true;
    } catch {
      setState("error");
      return false;
    }
  };
  return {
    state,
    submit,
    reset: () => setState("idle"),
    fail: () => setState("error"),
  };
}
