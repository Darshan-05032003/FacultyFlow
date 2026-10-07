import { Activity, ActivityStatus } from '@prisma/client';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PriorityScoreResult {
  score: number;
  level: PriorityLevel;
  reasons: string[];
  daysUntilDeadline: number | null;
  isOverdue: boolean;
}

// Weights out of 100
const WEIGHTS = {
  DEADLINE: 40,
  OVERDUE: 15,
  WORKLOAD: 20,
  STATUS: 10,
  FORECAST_PRESSURE: 15,
};

// Thresholds
const THRESHOLDS = {
  LOW: 24,
  MEDIUM: 49,
  HIGH: 74,
};

export function calculateDeadlineUrgency(deadline: Date | null, now: Date): { score: number, daysRemaining: number | null, reason: string | null } {
  if (!deadline) {
    return { score: 0, daysRemaining: null, reason: null };
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  
  // Normalize both dates to midnight to calculate pure day differences
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const daysRemaining = Math.round((deadlineDate.getTime() - today.getTime()) / msPerDay);

  let score = 0;
  let reason = null;

  if (daysRemaining < 0) {
    score = WEIGHTS.DEADLINE; // Overdue gives max deadline score
  } else if (daysRemaining === 0) {
    score = WEIGHTS.DEADLINE;
    reason = "Deadline is today.";
  } else if (daysRemaining === 1) {
    score = WEIGHTS.DEADLINE * 0.9;
    reason = "Deadline is tomorrow.";
  } else if (daysRemaining <= 3) {
    score = WEIGHTS.DEADLINE * 0.75;
    reason = `Deadline is in ${daysRemaining} days.`;
  } else if (daysRemaining <= 7) {
    score = WEIGHTS.DEADLINE * 0.5;
    reason = `Deadline is approaching (${daysRemaining} days).`;
  } else {
    score = WEIGHTS.DEADLINE * 0.1;
  }

  return { score, daysRemaining, reason };
}

export function isActivityOverdue(activity: Activity, now: Date): boolean {
  if (!activity.deadline) return false;
  if (activity.status === ActivityStatus.COMPLETED || activity.status === ActivityStatus.CANCELLED) return false;
  if (activity.isArchived) return false;

  const deadlineDate = new Date(activity.deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return deadlineDate.getTime() < today.getTime();
}

export function calculateWorkloadScore(estimatedMinutes: number | null): { score: number, reason: string | null } {
  if (!estimatedMinutes || estimatedMinutes <= 0) return { score: 0, reason: null };

  // Cap at 8 hours (480 mins) for normalization
  const MAX_MINUTES = 480; 
  const normalized = Math.min(estimatedMinutes, MAX_MINUTES) / MAX_MINUTES;
  const score = normalized * WEIGHTS.WORKLOAD;
  
  let reason = null;
  if (estimatedMinutes >= 240) {
    reason = `Significant workload (${Math.round(estimatedMinutes/60)} hrs).`;
  } else if (estimatedMinutes >= 120) {
    reason = `Moderate workload (${Math.round(estimatedMinutes/60)} hrs).`;
  }

  return { score, reason };
}

export function calculateStatusScore(status: ActivityStatus): { score: number, reason: string | null } {
  let score = 0;
  let reason = null;

  if (status === ActivityStatus.IN_PROGRESS) {
    score = WEIGHTS.STATUS;
    reason = "Task is currently in progress.";
  } else if (status === ActivityStatus.PLANNED) {
    score = WEIGHTS.STATUS * 0.5;
  }

  return { score, reason };
}

export function getPriorityLevel(score: number): PriorityLevel {
  if (score <= THRESHOLDS.LOW) return 'LOW';
  if (score <= THRESHOLDS.MEDIUM) return 'MEDIUM';
  if (score <= THRESHOLDS.HIGH) return 'HIGH';
  return 'CRITICAL';
}

export function calculatePriorityScore(
  activity: Activity, 
  forecastStatusForDate: 'LOW' | 'NORMAL' | 'HIGH' | 'OVERLOADED',
  now: Date
): PriorityScoreResult {
  const reasons: string[] = [];
  let totalScore = 0;

  // 1. Deadline
  const deadlineRes = calculateDeadlineUrgency(activity.deadline, now);
  totalScore += deadlineRes.score;
  if (deadlineRes.reason) reasons.push(deadlineRes.reason);

  // 2. Overdue
  const overdue = isActivityOverdue(activity, now);
  if (overdue) {
    totalScore += WEIGHTS.OVERDUE;
    const days = deadlineRes.daysRemaining !== null ? Math.abs(deadlineRes.daysRemaining) : 0;
    reasons.push(`Overdue by ${days} day(s).`);
  }

  // 3. Workload
  const workloadRes = calculateWorkloadScore(activity.estimatedMinutes || activity.actualMinutes);
  totalScore += workloadRes.score;
  if (workloadRes.reason) reasons.push(workloadRes.reason);

  // 4. Status
  const statusRes = calculateStatusScore(activity.status);
  totalScore += statusRes.score;
  if (statusRes.reason) reasons.push(statusRes.reason);

  // 5. Forecast Pressure
  if (forecastStatusForDate === 'HIGH') {
    totalScore += WEIGHTS.FORECAST_PRESSURE * 0.6;
    reasons.push("Scheduled during a projected high-workload period.");
  } else if (forecastStatusForDate === 'OVERLOADED') {
    totalScore += WEIGHTS.FORECAST_PRESSURE;
    reasons.push("Scheduled during a projected overloaded period.");
  }

  // Clamp 0-100
  totalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

  return {
    score: totalScore,
    level: getPriorityLevel(totalScore),
    reasons,
    daysUntilDeadline: deadlineRes.daysRemaining,
    isOverdue: overdue
  };
}
