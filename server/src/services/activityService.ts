import { prisma } from '../utils/prisma';
import { AppError } from '../errors/AppError';
import { ActivityStatus, ActivityCategory } from '@prisma/client';
import { calculatePriorityScore } from '../utils/priorityUtils';

export class ActivityService {
  static async createActivity(userId: string, data: any) {
    const faculty = await prisma.facultyProfile.findUnique({
      where: { userId },
    });

    if (!faculty) throw new AppError('Faculty profile not found', 404);

    return await prisma.activity.create({
      data: {
        ...data,
        facultyProfileId: faculty.id,
      },
    });
  }

  static async getMyActivities(userId: string, query: any) {
    const faculty = await prisma.facultyProfile.findUnique({
      where: { userId },
    });

    if (!faculty) throw new AppError('Faculty profile not found', 404);

    const { from, to, category, status, search, includeArchived } = query;

    const where: any = {
      facultyProfileId: faculty.id,
      isArchived: includeArchived === 'true' ? undefined : false,
    };

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    let activities = await prisma.activity.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { course: true },
    });

    const today = new Date();
    let enrichedActivities = activities.map(act => {
      // Ignore completed/cancelled for active priority logic, but we still return a base score of 0
      if (act.status === ActivityStatus.COMPLETED || act.status === ActivityStatus.CANCELLED) {
        return { ...act, priorityScore: 0, priorityLevel: 'LOW', isOverdue: false };
      }
      const p = calculatePriorityScore(act, 'NORMAL', today);
      return {
        ...act,
        priorityScore: p.score,
        priorityLevel: p.level,
        isOverdue: p.isOverdue
      };
    });

    if (query.sortBy === 'priority') {
      enrichedActivities.sort((a, b) => b.priorityScore - a.priorityScore);
    }

    return enrichedActivities;
  }

  static async getActivityById(userId: string, activityId: string) {
    const faculty = await prisma.facultyProfile.findUnique({
      where: { userId },
    });

    if (!faculty) throw new AppError('Faculty profile not found', 404);

    const activity = await prisma.activity.findFirst({
      where: { id: activityId, facultyProfileId: faculty.id },
      include: { course: true },
    });

    if (!activity) throw new AppError('Activity not found', 404);

    return activity;
  }

  static async updateActivity(userId: string, activityId: string, data: any) {
    // Ownership check
    await this.getActivityById(userId, activityId);

    return await prisma.activity.update({
      where: { id: activityId },
      data,
    });
  }

  static async archiveActivity(userId: string, activityId: string) {
    // Ownership check
    await this.getActivityById(userId, activityId);

    return await prisma.activity.update({
      where: { id: activityId },
      data: { isArchived: true },
    });
  }

  static async updateActivityStatus(userId: string, activityId: string, status: ActivityStatus) {
    // Ownership check
    await this.getActivityById(userId, activityId);

    return await prisma.activity.update({
      where: { id: activityId },
      data: { status },
    });
  }

  static async getWorkloadSummary(userId: string, query: any) {
    const faculty = await prisma.facultyProfile.findUnique({
      where: { userId },
    });

    if (!faculty) throw new AppError('Faculty profile not found', 404);

    const { from, to } = query;

    const where: any = {
      facultyProfileId: faculty.id,
      isArchived: false,
    };

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const activities = await prisma.activity.findMany({ where });

    let totalEstimatedMinutes = 0;
    let totalActualMinutes = 0;
    const categories: Record<string, number> = {};

    activities.forEach(act => {
      if (act.estimatedMinutes) totalEstimatedMinutes += act.estimatedMinutes;
      if (act.actualMinutes) totalActualMinutes += act.actualMinutes;
      
      const cat = act.category as string;
      if (!categories[cat]) categories[cat] = 0;
      if (act.actualMinutes) {
        categories[cat] += act.actualMinutes;
      } else if (act.estimatedMinutes) {
        // Fallback to estimated if actual is 0/null
        categories[cat] += act.estimatedMinutes;
      }
    });

    return {
      totalEstimatedMinutes,
      totalActualMinutes,
      activityCount: activities.length,
      categories,
    };
  }
}
