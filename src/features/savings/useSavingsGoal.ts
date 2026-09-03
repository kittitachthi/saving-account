import { useState } from "react";
import { loadSavingsGoal, saveSavingsGoal } from "./storage";
export const useSavingsGoal = () => {
  const [goal, setGoalState] = useState<number | null>(() => loadSavingsGoal());
  const setGoal = (value: number) => { saveSavingsGoal(value); setGoalState(value); };
  return { goal, setGoal };
};
