import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertCaseSchema,
  insertDiaryEntrySchema,
  insertDocumentSchema,
  insertCommentSchema,
  insertReminderSchema,
  insertChamberSchema,
  insertChamberMembershipSchema,
} from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
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

  // Case routes
  app.get("/api/cases", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cases = await storage.getCasesByUser(userId);
      res.json(cases);
    } catch (error) {
      console.error("Error fetching cases:", error);
      res.status(500).json({ message: "Failed to fetch cases" });
    }
  });

  app.post("/api/cases", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const caseData = insertCaseSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      const newCase = await storage.createCase(caseData);
      res.json(newCase);
    } catch (error) {
      console.error("Error creating case:", error);
      res.status(500).json({ message: "Failed to create case" });
    }
  });

  app.get("/api/cases/:id", isAuthenticated, async (req: any, res) => {
    try {
      const caseRecord = await storage.getCaseById(req.params.id);
      if (!caseRecord) {
        return res.status(404).json({ message: "Case not found" });
      }
      res.json(caseRecord);
    } catch (error) {
      console.error("Error fetching case:", error);
      res.status(500).json({ message: "Failed to fetch case" });
    }
  });

  app.put("/api/cases/:id", isAuthenticated, async (req: any, res) => {
    try {
      const updates = insertCaseSchema.partial().parse(req.body);
      const updatedCase = await storage.updateCase(req.params.id, updates);
      res.json(updatedCase);
    } catch (error) {
      console.error("Error updating case:", error);
      res.status(500).json({ message: "Failed to update case" });
    }
  });

  app.delete("/api/cases/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteCase(req.params.id);
      res.json({ message: "Case deleted successfully" });
    } catch (error) {
      console.error("Error deleting case:", error);
      res.status(500).json({ message: "Failed to delete case" });
    }
  });

  // Diary entry routes
  app.get("/api/cases/:caseId/diary-entries", isAuthenticated, async (req: any, res) => {
    try {
      const entries = await storage.getDiaryEntriesByCase(req.params.caseId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching diary entries:", error);
      res.status(500).json({ message: "Failed to fetch diary entries" });
    }
  });

  app.post("/api/diary-entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entryData = insertDiaryEntrySchema.parse({
        ...req.body,
        createdBy: userId,
      });
      const newEntry = await storage.createDiaryEntry(entryData);
      res.json(newEntry);
    } catch (error) {
      console.error("Error creating diary entry:", error);
      res.status(500).json({ message: "Failed to create diary entry" });
    }
  });

  app.put("/api/diary-entries/:id", isAuthenticated, async (req: any, res) => {
    try {
      const updates = insertDiaryEntrySchema.partial().parse(req.body);
      const updatedEntry = await storage.updateDiaryEntry(req.params.id, updates);
      res.json(updatedEntry);
    } catch (error) {
      console.error("Error updating diary entry:", error);
      res.status(500).json({ message: "Failed to update diary entry" });
    }
  });

  app.delete("/api/diary-entries/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteDiaryEntry(req.params.id);
      res.json({ message: "Diary entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting diary entry:", error);
      res.status(500).json({ message: "Failed to delete diary entry" });
    }
  });

  // Document upload routes
  app.post("/api/documents", isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;
      const { caseId, diaryEntryId } = req.body;

      const documentData = insertDocumentSchema.parse({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        caseId: caseId || null,
        diaryEntryId: diaryEntryId || null,
        uploadedBy: userId,
      });

      const newDocument = await storage.createDocument(documentData);
      res.json(newDocument);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.get("/api/cases/:caseId/documents", isAuthenticated, async (req: any, res) => {
    try {
      const documents = await storage.getDocumentsByCase(req.params.caseId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id/download", isAuthenticated, async (req: any, res) => {
    try {
      // Implementation for document download would go here
      // This would serve the file from the uploads directory
      res.status(501).json({ message: "Document download not implemented yet" });
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  // Chamber routes
  app.get("/api/chambers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chambers = await storage.getChambersByUser(userId);
      res.json(chambers);
    } catch (error) {
      console.error("Error fetching chambers:", error);
      res.status(500).json({ message: "Failed to fetch chambers" });
    }
  });

  app.post("/api/chambers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chamberData = insertChamberSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      const newChamber = await storage.createChamber(chamberData);
      
      // Add creator as admin member
      await storage.addChamberMember({
        chamberId: newChamber.id,
        userId: userId,
        role: "admin",
      });

      res.json(newChamber);
    } catch (error) {
      console.error("Error creating chamber:", error);
      res.status(500).json({ message: "Failed to create chamber" });
    }
  });

  app.get("/api/chambers/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const members = await storage.getChamberMembers(req.params.id);
      res.json(members);
    } catch (error) {
      console.error("Error fetching chamber members:", error);
      res.status(500).json({ message: "Failed to fetch chamber members" });
    }
  });

  app.get("/api/chambers/:id/shared-entries", isAuthenticated, async (req: any, res) => {
    try {
      const sharedEntries = await storage.getSharedDiaryEntries(req.params.id);
      res.json(sharedEntries);
    } catch (error) {
      console.error("Error fetching shared entries:", error);
      res.status(500).json({ message: "Failed to fetch shared entries" });
    }
  });

  // Comment routes
  app.get("/api/diary-entries/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const comments = await storage.getCommentsByDiaryEntry(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const commentData = insertCommentSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      const newComment = await storage.createComment(commentData);
      res.json(newComment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Reminder routes
  app.get("/api/reminders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reminders = await storage.getRemindersByUser(userId);
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  app.get("/api/reminders/upcoming", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const days = parseInt(req.query.days as string) || 7;
      const upcomingReminders = await storage.getUpcomingReminders(userId, days);
      res.json(upcomingReminders);
    } catch (error) {
      console.error("Error fetching upcoming reminders:", error);
      res.status(500).json({ message: "Failed to fetch upcoming reminders" });
    }
  });

  app.post("/api/reminders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reminderData = insertReminderSchema.parse({
        ...req.body,
        userId: userId,
      });
      const newReminder = await storage.createReminder(reminderData);
      res.json(newReminder);
    } catch (error) {
      console.error("Error creating reminder:", error);
      res.status(500).json({ message: "Failed to create reminder" });
    }
  });

  // Calendar routes
  app.get("/api/calendar/hearings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : new Date();
      const end = endDate ? new Date(endDate as string) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      const hearings = await storage.getHearingsByDateRange(userId, start, end);
      res.json(hearings);
    } catch (error) {
      console.error("Error fetching hearings:", error);
      res.status(500).json({ message: "Failed to fetch hearings" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup for real-time collaboration
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req) => {
    console.log("WebSocket connection established");

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Broadcast to all connected clients except sender
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  return httpServer;
}
