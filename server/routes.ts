import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import {
  insertTopicSchema,
  insertLessonSchema,
  insertAssessmentSchema,
  insertPrerequisiteSchema,
  insertAssessmentSubmissionSchema,
  type LearningMode,
  type Assessment,
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

  // User Progress routes
  app.get("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.get("/api/progress/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/progress/:topicId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const topicId = parseInt(req.params.topicId);
      
      if (isNaN(topicId)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }

      const progress = await storage.getTopicProgress(userId, topicId);
      res.json(progress || null);
    } catch (error) {
      console.error("Error fetching topic progress:", error);
      res.status(500).json({ message: "Failed to fetch topic progress" });
    }
  });

  app.post("/api/progress/:topicId/start", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const topicId = parseInt(req.params.topicId);
      
      if (isNaN(topicId)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }

      const topic = await storage.getTopic(topicId);
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }

      const progress = await storage.startTopic(userId, topicId);
      res.json(progress);
    } catch (error) {
      console.error("Error starting topic:", error);
      res.status(500).json({ message: "Failed to start topic" });
    }
  });

  app.post("/api/progress/:topicId/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const topicId = parseInt(req.params.topicId);
      
      if (isNaN(topicId)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }

      const topic = await storage.getTopic(topicId);
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }

      const progress = await storage.completeTopic(userId, topicId);
      res.json(progress);
    } catch (error) {
      console.error("Error completing topic:", error);
      res.status(500).json({ message: "Failed to complete topic" });
    }
  });

  // Assessment routes
  app.get("/api/assessments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid assessment ID" });
      }

      const assessment = await storage.getAssessment(id);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      res.json(assessment);
    } catch (error) {
      console.error("Error fetching assessment:", error);
      res.status(500).json({ message: "Failed to fetch assessment" });
    }
  });

  // Assessment Submission routes
  app.get("/api/submissions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const submissions = await storage.getUserSubmissions(userId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.get("/api/submissions/:assessmentId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assessmentId = parseInt(req.params.assessmentId);

      if (isNaN(assessmentId)) {
        return res.status(400).json({ message: "Invalid assessment ID" });
      }

      const submission = await storage.getSubmission(userId, assessmentId);
      res.json(submission || null);
    } catch (error) {
      console.error("Error fetching submission:", error);
      res.status(500).json({ message: "Failed to fetch submission" });
    }
  });

  app.post("/api/submissions/:assessmentId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assessmentId = parseInt(req.params.assessmentId);

      if (isNaN(assessmentId)) {
        return res.status(400).json({ message: "Invalid assessment ID" });
      }

      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      const { answers } = req.body;
      if (!answers || typeof answers !== "object") {
        return res.status(400).json({ message: "Answers are required" });
      }

      // Auto-grade the assessment
      const questions = (assessment.questions as any[]) || [];
      let correctCount = 0;
      const totalQuestions = questions.length;

      for (const question of questions) {
        const userAnswer = answers[question.id];
        if (userAnswer !== undefined && userAnswer === question.correctAnswer) {
          correctCount++;
        }
      }

      const score = totalQuestions > 0 
        ? Math.round((correctCount / totalQuestions) * 100) 
        : 0;
      const passingScore = assessment.passingScore || 70;
      const passed = score >= passingScore;

      const submissionData = insertAssessmentSubmissionSchema.parse({
        userId,
        assessmentId,
        answers,
        score,
        passed,
      });

      const submission = await storage.submitAssessment(submissionData);
      res.status(201).json(submission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error submitting assessment:", error);
      res.status(500).json({ message: "Failed to submit assessment" });
    }
  });

  return httpServer;
}
