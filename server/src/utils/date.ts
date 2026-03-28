export type MonthYear = {
  month: number;
  year: number;
};

export const getMonthYear = (date = new Date()): MonthYear => ({
  month: date.getUTCMonth() + 1,
  year: date.getUTCFullYear(),
});

export const startOfUtcDay = (date = new Date()): Date => {
  const value = new Date(date);
  value.setUTCHours(0, 0, 0, 0);
  return value;
};

export const endOfUtcDay = (date = new Date()): Date => {
  const value = new Date(date);
  value.setUTCHours(23, 59, 59, 999);
  return value;
};
