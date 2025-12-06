import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  serial,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth with role
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 20 }).default("learner").notNull(), // "learner" or "admin"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Learning modes enum type
export const learningModes = ["skill", "school", "task"] as const;
export type LearningMode = (typeof learningModes)[number];

// Topics table for learning content
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  mode: varchar("mode", { length: 20 }).notNull(), // "skill", "school", or "task"
  imageUrl: varchar("image_url"),
  difficulty: varchar("difficulty", { length: 20 }).default("beginner"), // "beginner", "intermediate", "advanced"
  estimatedMinutes: integer("estimated_minutes").default(30),
  isPublished: boolean("is_published").default(false).notNull(),
  createdById: varchar("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Prerequisites linking topics together
export const prerequisites = pgTable("prerequisites", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").references(() => topics.id, { onDelete: "cascade" }).notNull(),
  prerequisiteTopicId: integer("prerequisite_topic_id").references(() => topics.id, { onDelete: "cascade" }).notNull(),
});

// Lessons within topics
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").references(() => topics.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  videoUrl: varchar("video_url"),
  externalLink: varchar("external_link"),
  orderIndex: integer("order_index").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Assessments for topics
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").references(() => topics.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).default("quiz").notNull(), // "quiz", "project", "exercise"
  questions: jsonb("questions"), // JSON array of questions
  passingScore: integer("passing_score").default(70),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdTopics: many(topics),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [topics.createdById],
    references: [users.id],
  }),
  lessons: many(lessons),
  assessments: many(assessments),
  prerequisites: many(prerequisites, { relationName: "topicPrerequisites" }),
  prerequisiteOf: many(prerequisites, { relationName: "prerequisiteOf" }),
}));

export const prerequisitesRelations = relations(prerequisites, ({ one }) => ({
  topic: one(topics, {
    fields: [prerequisites.topicId],
    references: [topics.id],
    relationName: "topicPrerequisites",
  }),
  prerequisiteTopic: one(topics, {
    fields: [prerequisites.prerequisiteTopicId],
    references: [topics.id],
    relationName: "prerequisiteOf",
  }),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  topic: one(topics, {
    fields: [lessons.topicId],
    references: [topics.id],
  }),
}));

export const assessmentsRelations = relations(assessments, ({ one }) => ({
  topic: one(topics, {
    fields: [assessments.topicId],
    references: [topics.id],
  }),
}));

// User Progress - tracks completed topics
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  topicId: integer("topic_id").references(() => topics.id, { onDelete: "cascade" }).notNull(),
  status: varchar("status", { length: 20 }).default("in_progress").notNull(), // "in_progress", "completed"
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assessment Submissions - tracks user answers and scores
export const assessmentSubmissions = pgTable("assessment_submissions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  assessmentId: integer("assessment_id").references(() => assessments.id, { onDelete: "cascade" }).notNull(),
  answers: jsonb("answers").notNull(), // JSON object with question id -> answer
  score: integer("score").notNull(),
  passed: boolean("passed").default(false).notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Bookmarks - personal learning collections
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  topicId: integer("topic_id").references(() => topics.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations for new tables
export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  topic: one(topics, {
    fields: [userProgress.topicId],
    references: [topics.id],
  }),
}));

export const assessmentSubmissionsRelations = relations(assessmentSubmissions, ({ one }) => ({
  user: one(users, {
    fields: [assessmentSubmissions.userId],
    references: [users.id],
  }),
  assessment: one(assessments, {
    fields: [assessmentSubmissions.assessmentId],
    references: [assessments.id],
  }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  topic: one(topics, {
    fields: [bookmarks.topicId],
    references: [topics.id],
  }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertTopicSchema = createInsertSchema(topics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
});

export const insertPrerequisiteSchema = createInsertSchema(prerequisites).omit({
  id: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssessmentSubmissionSchema = createInsertSchema(assessmentSubmissions).omit({
  id: true,
  submittedAt: true,
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema>;

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;

export type Prerequisite = typeof prerequisites.$inferSelect;
export type InsertPrerequisite = z.infer<typeof insertPrerequisiteSchema>;

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

export type AssessmentSubmission = typeof assessmentSubmissions.$inferSelect;
export type InsertAssessmentSubmission = z.infer<typeof insertAssessmentSubmissionSchema>;

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;

// Extended types for frontend
export type TopicWithRelations = Topic & {
  lessons?: Lesson[];
  assessments?: Assessment[];
  prerequisites?: (Prerequisite & { prerequisiteTopic?: Topic })[];
  createdBy?: User;
};

export type UserProgressWithTopic = UserProgress & {
  topic?: Topic;
};

export type AssessmentSubmissionWithDetails = AssessmentSubmission & {
  assessment?: Assessment;
};

export type BookmarkWithTopic = Bookmark & {
  topic?: Topic;
};
