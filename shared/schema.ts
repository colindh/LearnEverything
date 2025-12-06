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

// Extended types for frontend
export type TopicWithRelations = Topic & {
  lessons?: Lesson[];
  assessments?: Assessment[];
  prerequisites?: (Prerequisite & { prerequisiteTopic?: Topic })[];
  createdBy?: User;
};
