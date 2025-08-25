import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import webpush from "web-push";

import {
  insertCaseSchema,
  insertDiaryEntrySchema,
  insertDocumentSchema,
  insertCommentSchema,
  insertReminderSchema,
  insertChamberSchema,
  insertChamberMembershipSchema,
} from "@shared/schema";
import { verifyGoogleToken } from "./auth";



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
  // await setupAuth(app);
  // protect everything else
  app.use("/api", verifyGoogleToken);

  // configure webpush once
  webpush.setVapidDetails(
    "mailto:ammad.mjaved@gmail.com",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  // save subscription
  app.post("/api/subscribe", async (req: any, res) => {
    try {
      const userId = (req as any).user?.sub;
       if (!userId) {
          return res.status(401).json({ error: "Unauthorized: user not found" });
        }
        const subscription = req.body as {
        endpoint: string;
        expirationTime?: number | null;
        keys: {
          p256dh: string;
          auth: string;
        };
      };

      if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
        return res.status(400).json({ error: "Invalid subscription" });
      }
      await storage.savePushSubscription({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      });
      res.json({ message: "Subscription saved" });
    } catch (error) {
      console.error("Error saving subscription:", error);
      res.status(500).json({ message: "Failed to save subscription" });
    }
  });

  // test send notification
  app.post("/api/notify", async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const subscription = await storage.getPushSubscriptionsByUser(userId);

      if (!subscription) {
        return res.status(404).json({ message: "No subscription found" });
      }

      const payload = JSON.stringify({
        title: req.body.title || "Reminder",
        body: req.body.body || "You have an upcoming reminder!",
      });

        // Loop through each subscription
      for (const sub of subscription) {
        // Convert DB object to PushSubscription shape
        const pushSub: webpush.PushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSub, JSON.stringify({
            title: "New Message",
            body: "You have a new notification",
          }));
        } catch (err) {
          console.error("Failed to send push:", err);
          // Optional: remove invalid subscriptions from DB here
        }
      }
      res.json({ message: "Notification sent" });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });


  // Auth routes
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Case routes
  app.get("/api/cases" , async (req: any, res) => {
    try {
      console.log("Fetching cases for user:", req.user);  
      const userId = req.user.sub;
      console.log("Bearer ", req.headers.authorization);
      const cases = await storage.getCasesByUser(userId);
      res.json(cases);
    } catch (error) {
      console.error("Error fetching cases:", error);
      res.status(500).json({ message: "Failed to fetch cases" });
    }
  });

  app.post("/api/cases", async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const caseData = insertCaseSchema.parse({
        ...req.body,
        createdBy: userId,
        nextHearingDate: new Date(req.body.nextHearingDate),
      });
      const newCase = await storage.createCase(caseData);
      res.json(newCase);
    } catch (error: any) {
      console.error("Error creating case:", error);

      // For debugging, send the error message back
      res.status(500).json({ 
        message: "Failed to create case", 
        error: error.message || error 
      });
    }
  });


  app.get("/api/cases/:id" , async (req: any, res) => {
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

  app.put("/api/cases/:id" , async (req: any, res) => {
    try {
      const updates = insertCaseSchema.partial().parse(req.body);
      const updatedCase = await storage.updateCase(req.params.id, updates);
      res.json(updatedCase);
    } catch (error) {
      console.error("Error updating case:", error);
      res.status(500).json({ message: "Failed to update case" });
    }
  });

  app.delete("/api/cases/:id" , async (req: any, res) => {
    try {
      await storage.deleteCase(req.params.id);
      res.json({ message: "Case deleted successfully" });
    } catch (error) {
      console.error("Error deleting case:", error);
      res.status(500).json({ message: "Failed to delete case" });
    }
  });

  // Diary entry routes
  app.get("/api/cases/:caseId/diary-entries" , async (req: any, res) => {
    try {
      const entries = await storage.getDiaryEntriesByCase(req.params.caseId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching diary entries:", error);
      res.status(500).json({ message: "Failed to fetch diary entries" });
    }
  });

  app.post("/api/diary-entries" , async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const entryData = insertDiaryEntrySchema.parse({
        ...req.body,
        createdBy: userId,
        entryDate: new Date(req.body.entryDate),
        nextHearingDate: new Date(req.body.nextHearingDate),
      });
      const newEntry = await storage.createDiaryEntry(entryData);
      res.json(newEntry);
    } catch (error) {
      console.error("Error creating diary entry:", error);
      res.status(500).json({ message: "Failed to create diary entry" });
    }
  });

  app.put("/api/diary-entries/:id" , async (req: any, res) => {
    try {
      const updates = insertDiaryEntrySchema.partial().parse(req.body);
      const updatedEntry = await storage.updateDiaryEntry(req.params.id, updates);
      res.json(updatedEntry);
    } catch (error) {
      console.error("Error updating diary entry:", error);
      res.status(500).json({ message: "Failed to update diary entry" });
    }
  });

  app.delete("/api/diary-entries/:id" , async (req: any, res) => {
    try {
      await storage.deleteDiaryEntry(req.params.id);
      res.json({ message: "Diary entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting diary entry:", error);
      res.status(500).json({ message: "Failed to delete diary entry" });
    }
  });

  // Document upload routes
  app.post("/api/documents" , upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.sub;
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

  app.get("/api/cases/:caseId/documents" , async (req: any, res) => {
    try {
      const documents = await storage.getDocumentsByCase(req.params.caseId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id/download" , async (req: any, res) => {
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
  app.get("/api/chambers" , async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const chambers = await storage.getChambersByUser(userId);
      res.json(chambers);
    } catch (error) {
      console.error("Error fetching chambers:", error);
      res.status(500).json({ message: "Failed to fetch chambers" });
    }
  });

  app.post("/api/chambers" , async (req: any, res) => {
    try {
      const userId = req.user.sub;
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

  // Add this after your existing chamber routes
app.post("/api/chambers/:id/members", async (req: any, res) => {
  try {
    const adminId = req.user.sub;
    const chamberId = req.params.id;
    const { email, role = "member" } = req.body;

    // Check if the requestor is an admin of the chamber
    const membership = await storage.getChamberMembership(chamberId, adminId);
    if (!membership || membership.role !== "admin") {
      return res.status(403).json({ message: "Only chamber admins can add members" });
    }
     // Lookup user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add the new member
    const newMembership = await storage.addChamberMember({
      chamberId,
      userId: user.id,
      role,
    });

    res.json({
      ...newMembership,
      user, // include profile info in response
    });
  } catch (error) {
    console.error("Error adding chamber member:", error);
    res.status(500).json({ message: "Failed to add chamber member" });
  }
});

  app.get("/api/chambers/:id/members" , async (req: any, res) => {
    try {
      const members = await storage.getChamberMembers(req.params.id);
      res.json(members);
    } catch (error) {
      console.error("Error fetching chamber members:", error);
      res.status(500).json({ message: "Failed to fetch chamber members" });
    }
  });

  app.get("/api/chambers/:id/shared-entries", async (req: any, res) => {
    try {
      const sharedEntries = await storage.getSharedDiaryEntries(req.params.id);
      res.json(sharedEntries);
    } catch (error) {
      console.error("Error fetching shared entries:", error);
      res.status(500).json({ message: "Failed to fetch shared entries" });
    }
  });

  // Comment routes
  app.get("/api/diary-entries/:id/comments", async (req: any, res) => {
    try {
      const comments = await storage.getCommentsByDiaryEntry(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/comments" , async (req: any, res) => {
    try {
      const userId = req.user.sub;
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
  app.get("/api/reminders" , async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const reminders = await storage.getRemindersByUser(userId);
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  app.get("/api/reminders/upcoming" , async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const days = parseInt(req.query.days as string) || 7;
      const upcomingReminders = await storage.getUpcomingReminders(userId, days);
      res.json(upcomingReminders);
    } catch (error) {
      console.error("Error fetching upcoming reminders:", error);
      res.status(500).json({ message: "Failed to fetch upcoming reminders" });
    }
  });

  app.post("/api/reminders" , async (req: any, res) => {
    try {
      const userId = req.user.sub;
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
  app.get("/api/calendar/hearings" , async (req: any, res) => {
    try {
      const userId = req.user.sub;
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
