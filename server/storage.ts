import {
  users,
  topics,
  lessons,
  assessments,
  prerequisites,
  userProgress,
  type User,
  type UpsertUser,
  type Topic,
  type InsertTopic,
  type Lesson,
  type InsertLesson,
  type Assessment,
  type InsertAssessment,
  type Prerequisite,
  type InsertPrerequisite,
  type TopicWithRelations,
  type LearningMode,
  type UserProgress,
  type UserProgressWithTopic,
} from "@shared/schema";
import { db } from "./db";
import { eq, like, and, or, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  getTopics(options?: {
    mode?: LearningMode;
    search?: string;
    publishedOnly?: boolean;
  }): Promise<Topic[]>;
  getTopic(id: number): Promise<TopicWithRelations | undefined>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  updateTopic(id: number, topic: Partial<InsertTopic>): Promise<Topic | undefined>;
  deleteTopic(id: number): Promise<boolean>;

  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, lesson: Partial<InsertLesson>): Promise<Lesson | undefined>;
  deleteLesson(id: number): Promise<boolean>;
  deleteLessonsByTopicId(topicId: number): Promise<boolean>;

  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: number, assessment: Partial<InsertAssessment>): Promise<Assessment | undefined>;
  deleteAssessment(id: number): Promise<boolean>;
  deleteAssessmentsByTopicId(topicId: number): Promise<boolean>;

  createPrerequisite(prerequisite: InsertPrerequisite): Promise<Prerequisite>;
  deletePrerequisite(id: number): Promise<boolean>;
  deletePrerequisitesByTopicId(topicId: number): Promise<boolean>;

  getStats(): Promise<{ totalTopics: number; publishedTopics: number; totalLessons: number }>;

  // User Progress methods
  getUserProgress(userId: string): Promise<UserProgressWithTopic[]>;
  getTopicProgress(userId: string, topicId: number): Promise<UserProgress | undefined>;
  startTopic(userId: string, topicId: number): Promise<UserProgress>;
  completeTopic(userId: string, topicId: number): Promise<UserProgress>;
  getUserStats(userId: string): Promise<{ completed: number; inProgress: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getTopics(options?: {
    mode?: LearningMode;
    search?: string;
    publishedOnly?: boolean;
  }): Promise<Topic[]> {
    const conditions = [];

    if (options?.publishedOnly) {
      conditions.push(eq(topics.isPublished, true));
    }

    if (options?.mode) {
      conditions.push(eq(topics.mode, options.mode));
    }

    if (options?.search) {
      const searchTerm = `%${options.search}%`;
      conditions.push(
        or(
          like(topics.title, searchTerm),
          like(topics.description, searchTerm)
        )
      );
    }

    if (conditions.length === 0) {
      return db.select().from(topics).orderBy(desc(topics.createdAt));
    }

    return db
      .select()
      .from(topics)
      .where(and(...conditions))
      .orderBy(desc(topics.createdAt));
  }

  async getTopic(id: number): Promise<TopicWithRelations | undefined> {
    const [topic] = await db.select().from(topics).where(eq(topics.id, id));
    if (!topic) return undefined;

    const topicLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.topicId, id))
      .orderBy(lessons.orderIndex);

    const topicAssessments = await db
      .select()
      .from(assessments)
      .where(eq(assessments.topicId, id));

    const topicPrereqs = await db
      .select()
      .from(prerequisites)
      .where(eq(prerequisites.topicId, id));

    const prerequisiteTopics = await Promise.all(
      topicPrereqs.map(async (prereq) => {
        const [prereqTopic] = await db
          .select()
          .from(topics)
          .where(eq(topics.id, prereq.prerequisiteTopicId));
        return { ...prereq, prerequisiteTopic: prereqTopic };
      })
    );

    let createdBy: User | undefined;
    if (topic.createdById) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, topic.createdById));
      createdBy = user;
    }

    return {
      ...topic,
      lessons: topicLessons,
      assessments: topicAssessments,
      prerequisites: prerequisiteTopics,
      createdBy,
    };
  }

  async createTopic(topic: InsertTopic): Promise<Topic> {
    const [created] = await db.insert(topics).values(topic).returning();
    return created;
  }

  async updateTopic(id: number, topic: Partial<InsertTopic>): Promise<Topic | undefined> {
    const [updated] = await db
      .update(topics)
      .set({ ...topic, updatedAt: new Date() })
      .where(eq(topics.id, id))
      .returning();
    return updated;
  }

  async deleteTopic(id: number): Promise<boolean> {
    const result = await db.delete(topics).where(eq(topics.id, id)).returning();
    return result.length > 0;
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [created] = await db.insert(lessons).values(lesson).returning();
    return created;
  }

  async updateLesson(id: number, lesson: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const [updated] = await db
      .update(lessons)
      .set(lesson)
      .where(eq(lessons.id, id))
      .returning();
    return updated;
  }

  async deleteLesson(id: number): Promise<boolean> {
    const result = await db.delete(lessons).where(eq(lessons.id, id)).returning();
    return result.length > 0;
  }

  async deleteLessonsByTopicId(topicId: number): Promise<boolean> {
    await db.delete(lessons).where(eq(lessons.topicId, topicId));
    return true;
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [created] = await db.insert(assessments).values(assessment).returning();
    return created;
  }

  async updateAssessment(id: number, assessment: Partial<InsertAssessment>): Promise<Assessment | undefined> {
    const [updated] = await db
      .update(assessments)
      .set(assessment)
      .where(eq(assessments.id, id))
      .returning();
    return updated;
  }

  async deleteAssessment(id: number): Promise<boolean> {
    const result = await db.delete(assessments).where(eq(assessments.id, id)).returning();
    return result.length > 0;
  }

  async deleteAssessmentsByTopicId(topicId: number): Promise<boolean> {
    await db.delete(assessments).where(eq(assessments.topicId, topicId));
    return true;
  }

  async createPrerequisite(prerequisite: InsertPrerequisite): Promise<Prerequisite> {
    const [created] = await db.insert(prerequisites).values(prerequisite).returning();
    return created;
  }

  async deletePrerequisite(id: number): Promise<boolean> {
    const result = await db.delete(prerequisites).where(eq(prerequisites.id, id)).returning();
    return result.length > 0;
  }

  async deletePrerequisitesByTopicId(topicId: number): Promise<boolean> {
    await db.delete(prerequisites).where(eq(prerequisites.topicId, topicId));
    return true;
  }

  async getStats(): Promise<{ totalTopics: number; publishedTopics: number; totalLessons: number }> {
    const allTopics = await db.select().from(topics);
    const allLessons = await db.select().from(lessons);

    return {
      totalTopics: allTopics.length,
      publishedTopics: allTopics.filter((t) => t.isPublished).length,
      totalLessons: allLessons.length,
    };
  }

  async getUserProgress(userId: string): Promise<UserProgressWithTopic[]> {
    const progressList = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId))
      .orderBy(desc(userProgress.updatedAt));

    const progressWithTopics = await Promise.all(
      progressList.map(async (progress) => {
        const [topic] = await db
          .select()
          .from(topics)
          .where(eq(topics.id, progress.topicId));
        return { ...progress, topic };
      })
    );

    return progressWithTopics;
  }

  async getTopicProgress(userId: string, topicId: number): Promise<UserProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.topicId, topicId)));
    return progress;
  }

  async startTopic(userId: string, topicId: number): Promise<UserProgress> {
    const existing = await this.getTopicProgress(userId, topicId);
    if (existing) {
      return existing;
    }

    const [created] = await db
      .insert(userProgress)
      .values({
        userId,
        topicId,
        status: "in_progress",
      })
      .returning();
    return created;
  }

  async completeTopic(userId: string, topicId: number): Promise<UserProgress> {
    const existing = await this.getTopicProgress(userId, topicId);
    
    if (existing) {
      const [updated] = await db
        .update(userProgress)
        .set({
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userProgress.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(userProgress)
      .values({
        userId,
        topicId,
        status: "completed",
        completedAt: new Date(),
      })
      .returning();
    return created;
  }

  async getUserStats(userId: string): Promise<{ completed: number; inProgress: number }> {
    const progressList = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    return {
      completed: progressList.filter((p) => p.status === "completed").length,
      inProgress: progressList.filter((p) => p.status === "in_progress").length,
    };
  }
}

export const storage = new DatabaseStorage();
