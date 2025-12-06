import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import {
  insertTopicSchema,
  insertLessonSchema,
  insertAssessmentSchema,
  insertPrerequisiteSchema,
  type LearningMode,
  learningModes,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/topics", async (req, res) => {
    try {
      const mode = req.query.mode as LearningMode | undefined;
      const search = req.query.search as string | undefined;

      if (mode && !learningModes.includes(mode)) {
        return res.status(400).json({ message: "Invalid mode" });
      }

      const topics = await storage.getTopics({
        mode,
        search,
        publishedOnly: true,
      });
      res.json(topics);
    } catch (error) {
      console.error("Error fetching topics:", error);
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  app.get("/api/topics/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }

      const topic = await storage.getTopic(id);
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }

      if (!topic.isPublished) {
        return res.status(404).json({ message: "Topic not found" });
      }

      res.json(topic);
    } catch (error) {
      console.error("Error fetching topic:", error);
      res.status(500).json({ message: "Failed to fetch topic" });
    }
  });

  app.get("/api/admin/topics", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const mode = req.query.mode as LearningMode | undefined;
      const search = req.query.search as string | undefined;

      if (mode && !learningModes.includes(mode)) {
        return res.status(400).json({ message: "Invalid mode" });
      }

      const topics = await storage.getTopics({ mode, search, publishedOnly: false });
      res.json(topics);
    } catch (error) {
      console.error("Error fetching admin topics:", error);
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  app.get("/api/admin/topics/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }

      const topic = await storage.getTopic(id);
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }

      res.json(topic);
    } catch (error) {
      console.error("Error fetching topic:", error);
      res.status(500).json({ message: "Failed to fetch topic" });
    }
  });

  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.post("/api/admin/topics", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const body = req.body;

      const topicData = insertTopicSchema.parse({
        ...body.topic,
        createdById: userId,
      });

      const topic = await storage.createTopic(topicData);

      if (body.lessons && Array.isArray(body.lessons)) {
        for (const lesson of body.lessons) {
          const lessonData = insertLessonSchema.parse({
            ...lesson,
            topicId: topic.id,
          });
          await storage.createLesson(lessonData);
        }
      }

      if (body.assessments && Array.isArray(body.assessments)) {
        for (const assessment of body.assessments) {
          const assessmentData = insertAssessmentSchema.parse({
            ...assessment,
            topicId: topic.id,
          });
          await storage.createAssessment(assessmentData);
        }
      }

      if (body.prerequisiteIds && Array.isArray(body.prerequisiteIds)) {
        for (const prereqId of body.prerequisiteIds) {
          const prereqData = insertPrerequisiteSchema.parse({
            topicId: topic.id,
            prerequisiteTopicId: prereqId,
          });
          await storage.createPrerequisite(prereqData);
        }
      }

      const fullTopic = await storage.getTopic(topic.id);
      res.status(201).json(fullTopic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating topic:", error);
      res.status(500).json({ message: "Failed to create topic" });
    }
  });

  app.put("/api/admin/topics/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }

      const existingTopic = await storage.getTopic(id);
      if (!existingTopic) {
        return res.status(404).json({ message: "Topic not found" });
      }

      const body = req.body;
      const topicData = insertTopicSchema.partial().parse(body.topic);

      await storage.updateTopic(id, topicData);

      await storage.deleteLessonsByTopicId(id);
      await storage.deleteAssessmentsByTopicId(id);
      await storage.deletePrerequisitesByTopicId(id);

      if (body.lessons && Array.isArray(body.lessons)) {
        for (const lesson of body.lessons) {
          const lessonData = insertLessonSchema.parse({
            ...lesson,
            topicId: id,
          });
          await storage.createLesson(lessonData);
        }
      }

      if (body.assessments && Array.isArray(body.assessments)) {
        for (const assessment of body.assessments) {
          const assessmentData = insertAssessmentSchema.parse({
            ...assessment,
            topicId: id,
          });
          await storage.createAssessment(assessmentData);
        }
      }

      if (body.prerequisiteIds && Array.isArray(body.prerequisiteIds)) {
        for (const prereqId of body.prerequisiteIds) {
          const prereqData = insertPrerequisiteSchema.parse({
            topicId: id,
            prerequisiteTopicId: prereqId,
          });
          await storage.createPrerequisite(prereqData);
        }
      }

      const fullTopic = await storage.getTopic(id);
      res.json(fullTopic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating topic:", error);
      res.status(500).json({ message: "Failed to update topic" });
    }
  });

  app.patch("/api/admin/topics/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }

      const existingTopic = await storage.getTopic(id);
      if (!existingTopic) {
        return res.status(404).json({ message: "Topic not found" });
      }

      const topicData = insertTopicSchema.partial().parse(req.body);
      const updated = await storage.updateTopic(id, topicData);

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating topic:", error);
      res.status(500).json({ message: "Failed to update topic" });
    }
  });

  app.delete("/api/admin/topics/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }

      const deleted = await storage.deleteTopic(id);
      if (!deleted) {
        return res.status(404).json({ message: "Topic not found" });
      }

      res.json({ message: "Topic deleted successfully" });
    } catch (error) {
      console.error("Error deleting topic:", error);
      res.status(500).json({ message: "Failed to delete topic" });
    }
  });

  return httpServer;
}
