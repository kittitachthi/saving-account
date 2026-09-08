import { useEffect, useRef, useState } from "react";
import type { AuthSessionResponse } from "@saving-account/contracts";

type SessionState =
  | { status: "loading" }
  | { status: "anonymous"; notice: string | null }
  | { status: "authenticated"; session: AuthSessionResponse };

const RENEW_INTERVAL_MS = 5 * 60 * 1000;
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const mutationRequest = (path: string, signal?: AbortSignal) =>
  fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: { "X-Pocka-Request": "1" },
    signal,
  });

export function useSession() {
  const [state, setState] = useState<SessionState>({ status: "loading" });
  const lifecycle = useRef<{
    pause: () => void;
    resume: () => void;
    clear: () => void;
  } | null>(null);
  const logoutPending = useRef(false);

  useEffect(() => {
    let disposed = false;
    let paused = false;
    let current: AuthSessionResponse | null = null;
    let controller: AbortController | null = null;
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;
    let requestVersion = 0;
    let activityVersion = 1; // Opening the application is activity.
    let renewedActivity = 0;
    let lastAttemptAt = 0;

    const clear = (notice: string | null = null) => {
      current = null;
      clearTimeout(expiryTimer);
      setState({ status: "anonymous", notice });
    };
    const sessionEnded = () =>
      clear("เซสชันสิ้นสุดแล้ว กรุณาเข้าสู่ระบบอีกครั้ง");
    const publish = (session: AuthSessionResponse) => {
      const expiry = Date.parse(session.expiresAt);
      if (!Number.isFinite(expiry) || expiry <= Date.now()) {
        sessionEnded();
        return;
      }
      current = session;
      setState({ status: "authenticated", session });
      clearTimeout(expiryTimer);
      // Re-read the authority at expiry: another tab may have renewed the same cookie.
      expiryTimer = setTimeout(() => {
        if (paused || disposed) return;
        setState({ status: "loading" });
        requestVersion++;
        controller?.abort();
        controller = null;
        void readSession();
      }, expiry - Date.now());
    };

    async function readSession() {
      if (disposed || paused || controller) return;
      const version = ++requestVersion;
      const requestController = new AbortController();
      controller = requestController;
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "same-origin",
          signal: requestController.signal,
        });
        if (disposed || paused || version !== requestVersion) return;
        if (!response.ok) {
          if (response.status === 401 && current) sessionEnded();
          else clear();
          return;
        }
        const session = (await response.json()) as AuthSessionResponse;
        if (disposed || paused || version !== requestVersion) return;
        publish(session);
        // Fresh sign-in already has seven days. Returning users renew promptly.
        lastAttemptAt = Date.parse(session.expiresAt) - SESSION_DURATION_MS;
        if (Date.now() - lastAttemptAt < RENEW_INTERVAL_MS)
          renewedActivity = activityVersion;
      } catch {
        if (!disposed && !paused && version === requestVersion) clear();
      } finally {
        if (controller === requestController) controller = null;
      }
      void renewIfActive();
    }

    async function renewIfActive() {
      if (
        disposed ||
        paused ||
        !current ||
        controller ||
        document.visibilityState !== "visible"
      )
        return;
      if (Date.parse(current.expiresAt) <= Date.now()) {
        void readSession();
        return;
      }
      if (
        activityVersion === renewedActivity ||
        Date.now() - lastAttemptAt < RENEW_INTERVAL_MS
      )
        return;
      lastAttemptAt = Date.now();
      const submittedActivity = activityVersion;
      const version = ++requestVersion;
      const requestController = new AbortController();
      controller = requestController;
      try {
        const response = await mutationRequest(
          "/api/auth/session/renew",
          requestController.signal,
        );
        if (disposed || paused || version !== requestVersion) return;
        if (response.status === 401) {
          sessionEnded();
          return;
        }
        if (!response.ok) return; // A transient failure does not sign the user out.
        const session = (await response.json()) as AuthSessionResponse;
        if (disposed || paused || version !== requestVersion) return;
        renewedActivity = submittedActivity;
        publish(session);
      } catch {
        // Keep the current UI until the authority rejects it or its expiry is reached.
      } finally {
        if (controller === requestController) controller = null;
      }
    }

    const activity = () => {
      if (document.visibilityState !== "visible") return;
      activityVersion++;
      void renewIfActive();
    };
    const events = [
      "pointerdown",
      "pointermove",
      "touchstart",
      "keydown",
      "scroll",
    ] as const;
    events.forEach((event) =>
      document.addEventListener(event, activity, {
        capture: true,
        passive: true,
      }),
    );
    document.addEventListener("visibilitychange", activity);
    const interval = setInterval(() => void renewIfActive(), RENEW_INTERVAL_MS);
    lifecycle.current = {
      pause: () => {
        paused = true;
        requestVersion++;
        controller?.abort();
        controller = null;
      },
      resume: () => {
        paused = false;
        void renewIfActive();
      },
      clear,
    };
    void readSession();
    return () => {
      disposed = true;
      requestVersion++;
      controller?.abort();
      clearInterval(interval);
      clearTimeout(expiryTimer);
      events.forEach((event) =>
        document.removeEventListener(event, activity, true),
      );
      document.removeEventListener("visibilitychange", activity);
      lifecycle.current = null;
    };
  }, []);

  const logout = async () => {
    if (logoutPending.current) return;
    logoutPending.current = true;
    const activeLifecycle = lifecycle.current;
    activeLifecycle?.pause();
    try {
      const response = await mutationRequest("/api/auth/logout");
      if (!response.ok) throw new Error("Logout failed");
      if (lifecycle.current === activeLifecycle) activeLifecycle?.clear();
    } catch (error) {
      if (lifecycle.current === activeLifecycle) activeLifecycle?.resume();
      throw error;
    } finally {
      logoutPending.current = false;
    }
  };
  return { state, logout };
}
