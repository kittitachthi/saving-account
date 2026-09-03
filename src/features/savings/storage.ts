export const SAVINGS_GOAL_KEY = "daily-money-savings-goal-v1";
export const loadSavingsGoal = (storage: Storage = localStorage): number | null => {
  const value = Number(storage.getItem(SAVINGS_GOAL_KEY));
  return Number.isFinite(value) && value > 0 ? value : null;
};
export const saveSavingsGoal = (goal: number, storage: Storage = localStorage) => storage.setItem(SAVINGS_GOAL_KEY, String(goal));
