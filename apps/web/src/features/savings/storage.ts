export const SAVINGS_GOAL_KEY = "daily-money-savings-goal-v1";
export const savingsGoalStorageRawRead = (storage: Storage = localStorage) =>
  storage.getItem(SAVINGS_GOAL_KEY);
export const loadSavingsGoal = (
  storage: Storage = localStorage,
): number | null => {
  const value = Number(savingsGoalStorageRawRead(storage));
  return Number.isFinite(value) && value > 0 ? value : null;
};
export const saveSavingsGoal = (
  goal: number,
  storage: Storage = localStorage,
) => storage.setItem(SAVINGS_GOAL_KEY, String(goal));
