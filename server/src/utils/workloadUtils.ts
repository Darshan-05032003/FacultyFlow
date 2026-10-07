export const DEFAULT_WEEKLY_TARGET_MINUTES = 2400; // 40 hours

export function calculateVariance(actualMinutes: number, estimatedMinutes: number) {
  return actualMinutes - estimatedMinutes;
}

export function calculateVariancePercent(actualMinutes: number, estimatedMinutes: number) {
  const variance = actualMinutes - estimatedMinutes;
  return estimatedMinutes > 0 ? (variance / estimatedMinutes) * 100 : 0;
}

export function calculateCompletionRate(completedCount: number, totalValidCount: number) {
  return totalValidCount > 0 ? (completedCount / totalValidCount) * 100 : 0;
}

export function getWeeksInRange(startDate?: string, endDate?: string) {
  let weeksInRange = 1;
  if (startDate && endDate) {
    const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
    weeksInRange = Math.max(1, Math.round(ms / (7 * 86400000)));
  }
  return weeksInRange;
}

export function calculateUtilization(actualMinutes: number, targetMinutes: number) {
  return targetMinutes > 0 ? (actualMinutes / targetMinutes) * 100 : 0;
}

export function getWorkloadStatus(utilizationPercent: number) {
  if (utilizationPercent < 70) return 'LOW';
  if (utilizationPercent <= 100) return 'NORMAL';
  if (utilizationPercent <= 120) return 'HIGH';
  return 'OVERLOADED';
}

export function getWeekKey(dateInput: Date | string) {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNumber = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}
