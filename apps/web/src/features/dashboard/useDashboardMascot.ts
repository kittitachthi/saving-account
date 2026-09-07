import { useEffect, useRef, useState } from "react";

export type MascotReaction = "income" | "expense" | "saving" | "error";
export type MascotState = "idle" | "sleeping" | MascotReaction;

const REACTION_MS = 4000;
const AFK_MS = 60000;

export function useDashboardMascot() {
  const [state, setState] = useState<MascotState>("idle");
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    let afkTimer: ReturnType<typeof setTimeout> | undefined;
    const restartActivity = () => {
      clearTimeout(afkTimer);
      if (document.visibilityState !== "visible") return;
      setState((current) => (current === "sleeping" ? "idle" : current));
      afkTimer = setTimeout(() => {
        setState((current) => (current === "idle" ? "sleeping" : current));
      }, AFK_MS);
    };
    const events = [
      "pointermove",
      "pointerdown",
      "touchstart",
      "keydown",
      "scroll",
    ] as const;
    events.forEach((event) =>
      document.addEventListener(event, restartActivity, {
        capture: true,
        passive: true,
      }),
    );
    document.addEventListener("visibilitychange", restartActivity);
    restartActivity();
    return () => {
      clearTimeout(afkTimer);
      clearTimeout(reactionTimer.current);
      events.forEach((event) =>
        document.removeEventListener(event, restartActivity, true),
      );
      document.removeEventListener("visibilitychange", restartActivity);
    };
  }, []);

  const reactToResult = (reaction: MascotReaction) => {
    clearTimeout(reactionTimer.current);
    setState(reaction);
    // Error uses the same temporary feedback window; detailed retry guidance stays in the form.
    reactionTimer.current = setTimeout(() => setState("idle"), REACTION_MS);
  };
  return { state, reactToResult };
}
