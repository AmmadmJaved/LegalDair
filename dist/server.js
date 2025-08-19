var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express from "express";
import path2 from "path";
import dotenv2 from "dotenv";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  cases: () => cases,
  casesRelations: () => casesRelations,
  chamberMemberships: () => chamberMemberships,
  chamberMembershipsRelations: () => chamberMembershipsRelations,
  chambers: () => chambers,
  chambersRelations: () => chambersRelations,
  comments: () => comments,
  commentsRelations: () => commentsRelations,
  diaryEntries: () => diaryEntries,
  diaryEntriesRelations: () => diaryEntriesRelations,
  documents: () => documents,
  documentsRelations: () => documentsRelations,
  insertCaseSchema: () => insertCaseSchema,
  insertChamberMembershipSchema: () => insertChamberMembershipSchema,
  insertChamberSchema: () => insertChamberSchema,
  insertCommentSchema: () => insertCommentSchema,
  insertDiaryEntrySchema: () => insertDiaryEntrySchema,
  insertDocumentSchema: () => insertDocumentSchema,
  insertReminderSchema: () => insertReminderSchema,
  insertUserSchema: () => insertUserSchema,
  reminders: () => reminders,
  remindersRelations: () => remindersRelations,
  sessions: () => sessions,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
  uuid
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var chambers = pgTable("chambers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var chamberMemberships = pgTable("chamber_memberships", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  chamberId: uuid("chamber_id").references(() => chambers.id),
  userId: varchar("user_id").references(() => users.id),
  role: varchar("role", { length: 50 }).default("member"),
  // member, admin
  joinedAt: timestamp("joined_at").defaultNow()
});
var cases = pgTable("cases", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 500 }).notNull(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  court: varchar("court", { length: 255 }).notNull(),
  caseNumber: varchar("case_number", { length: 100 }),
  nextHearingDate: timestamp("next_hearing_date"),
  priority: varchar("priority", { length: 20 }).default("normal"),
  // normal, urgent, critical
  status: varchar("status", { length: 20 }).default("active"),
  // active, closed, archived
  isPrivate: boolean("is_private").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  chamberId: uuid("chamber_id").references(() => chambers.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var diaryEntries = pgTable("diary_entries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: uuid("case_id").references(() => cases.id),
  entryDate: timestamp("entry_date").notNull(),
  hearingSummary: text("hearing_summary"),
  remarks: text("remarks"),
  nextHearingDate: timestamp("next_hearing_date"),
  isSharedWithChamber: boolean("is_shared_with_chamber").default(false),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var documents = pgTable("documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  size: integer("size").notNull(),
  caseId: uuid("case_id").references(() => cases.id),
  diaryEntryId: uuid("diary_entry_id").references(() => diaryEntries.id),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});
var comments = pgTable("comments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  diaryEntryId: uuid("diary_entry_id").references(() => diaryEntries.id),
  content: text("content").notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: uuid("case_id").references(() => cases.id),
  reminderDate: timestamp("reminder_date").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});
var usersRelations = relations(users, ({ many }) => ({
  cases: many(cases),
  diaryEntries: many(diaryEntries),
  documents: many(documents),
  comments: many(comments),
  reminders: many(reminders),
  chamberMemberships: many(chamberMemberships),
  chambersCreated: many(chambers)
}));
var chambersRelations = relations(chambers, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [chambers.createdBy],
    references: [users.id]
  }),
  memberships: many(chamberMemberships),
  cases: many(cases)
}));
var chamberMembershipsRelations = relations(chamberMemberships, ({ one }) => ({
  chamber: one(chambers, {
    fields: [chamberMemberships.chamberId],
    references: [chambers.id]
  }),
  user: one(users, {
    fields: [chamberMemberships.userId],
    references: [users.id]
  })
}));
var casesRelations = relations(cases, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [cases.createdBy],
    references: [users.id]
  }),
  chamber: one(chambers, {
    fields: [cases.chamberId],
    references: [chambers.id]
  }),
  diaryEntries: many(diaryEntries),
  documents: many(documents),
  reminders: many(reminders)
}));
var diaryEntriesRelations = relations(diaryEntries, ({ one, many }) => ({
  case: one(cases, {
    fields: [diaryEntries.caseId],
    references: [cases.id]
  }),
  createdBy: one(users, {
    fields: [diaryEntries.createdBy],
    references: [users.id]
  }),
  documents: many(documents),
  comments: many(comments)
}));
var documentsRelations = relations(documents, ({ one }) => ({
  case: one(cases, {
    fields: [documents.caseId],
    references: [cases.id]
  }),
  diaryEntry: one(diaryEntries, {
    fields: [documents.diaryEntryId],
    references: [diaryEntries.id]
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id]
  })
}));
var commentsRelations = relations(comments, ({ one }) => ({
  diaryEntry: one(diaryEntries, {
    fields: [comments.diaryEntryId],
    references: [diaryEntries.id]
  }),
  createdBy: one(users, {
    fields: [comments.createdBy],
    references: [users.id]
  })
}));
var remindersRelations = relations(reminders, ({ one }) => ({
  case: one(cases, {
    fields: [reminders.caseId],
    references: [cases.id]
  }),
  user: one(users, {
    fields: [reminders.userId],
    references: [users.id]
  })
}));
var insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true
});
var insertChamberSchema = createInsertSchema(chambers).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertCaseSchema = createInsertSchema(cases).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertDiaryEntrySchema = createInsertSchema(diaryEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true
});
var insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true
});
var insertChamberMembershipSchema = createInsertSchema(chamberMemberships).omit({
  id: true,
  joinedAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import dotenv from "dotenv";
dotenv.config();
neonConfig.webSocketConstructor = ws;
console.log("DATABASE_URL:", process.env.DATABASE_URL);
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database.?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function testDbConnection() {
  try {
    const client2 = await pool.connect();
    console.log("\u2705 Database connection successful");
    client2.release();
  } catch (error) {
    console.error("\u274C Database connection failed:", error);
    throw error;
  }
}
testDbConnection();
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, and, gte, lte } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  // Case operations
  async createCase(caseData) {
    const [newCase] = await db.insert(cases).values(caseData).returning();
    return newCase;
  }
  async getCasesByUser(userId) {
    return await db.select().from(cases).where(eq(cases.createdBy, userId)).orderBy(desc(cases.updatedAt));
  }
  async getCaseById(id) {
    const [caseRecord] = await db.select().from(cases).where(eq(cases.id, id));
    return caseRecord;
  }
  async updateCase(id, updates) {
    const [updatedCase] = await db.update(cases).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(cases.id, id)).returning();
    return updatedCase;
  }
  async deleteCase(id) {
    await db.delete(cases).where(eq(cases.id, id));
  }
  // Diary entry operations
  async createDiaryEntry(entryData) {
    const [entry] = await db.insert(diaryEntries).values(entryData).returning();
    return entry;
  }
  async getDiaryEntriesByCase(caseId) {
    return await db.select().from(diaryEntries).where(eq(diaryEntries.caseId, caseId)).orderBy(desc(diaryEntries.entryDate));
  }
  async getSharedDiaryEntries(chamberId) {
    const result = await db.select({
      id: diaryEntries.id,
      caseId: diaryEntries.caseId,
      entryDate: diaryEntries.entryDate,
      hearingSummary: diaryEntries.hearingSummary,
      remarks: diaryEntries.remarks,
      nextHearingDate: diaryEntries.nextHearingDate,
      isSharedWithChamber: diaryEntries.isSharedWithChamber,
      createdBy: diaryEntries.createdBy,
      createdAt: diaryEntries.createdAt,
      updatedAt: diaryEntries.updatedAt
    }).from(diaryEntries).innerJoin(cases, eq(diaryEntries.caseId, cases.id)).where(
      and(
        eq(cases.chamberId, chamberId),
        eq(diaryEntries.isSharedWithChamber, true)
      )
    ).orderBy(desc(diaryEntries.createdAt));
    return result;
  }
  async updateDiaryEntry(id, updates) {
    const [updatedEntry] = await db.update(diaryEntries).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(diaryEntries.id, id)).returning();
    return updatedEntry;
  }
  async deleteDiaryEntry(id) {
    await db.delete(diaryEntries).where(eq(diaryEntries.id, id));
  }
  // Document operations
  async createDocument(documentData) {
    const [document] = await db.insert(documents).values(documentData).returning();
    return document;
  }
  async getDocumentsByCase(caseId) {
    return await db.select().from(documents).where(eq(documents.caseId, caseId)).orderBy(desc(documents.createdAt));
  }
  async getDocumentsByDiaryEntry(diaryEntryId) {
    return await db.select().from(documents).where(eq(documents.diaryEntryId, diaryEntryId)).orderBy(desc(documents.createdAt));
  }
  async deleteDocument(id) {
    await db.delete(documents).where(eq(documents.id, id));
  }
  // Comment operations
  async createComment(commentData) {
    const [comment] = await db.insert(comments).values(commentData).returning();
    return comment;
  }
  async getCommentsByDiaryEntry(diaryEntryId) {
    return await db.select().from(comments).where(eq(comments.diaryEntryId, diaryEntryId)).orderBy(desc(comments.createdAt));
  }
  async deleteComment(id) {
    await db.delete(comments).where(eq(comments.id, id));
  }
  // Chamber operations
  async createChamber(chamberData) {
    const [chamber] = await db.insert(chambers).values(chamberData).returning();
    return chamber;
  }
  async getChambersByUser(userId) {
    const result = await db.select({
      id: chambers.id,
      name: chambers.name,
      description: chambers.description,
      createdBy: chambers.createdBy,
      createdAt: chambers.createdAt,
      updatedAt: chambers.updatedAt
    }).from(chambers).innerJoin(chamberMemberships, eq(chambers.id, chamberMemberships.chamberId)).where(eq(chamberMemberships.userId, userId));
    return result;
  }
  async getChamberById(id) {
    const [chamber] = await db.select().from(chambers).where(eq(chambers.id, id));
    return chamber;
  }
  async addChamberMember(membershipData) {
    const [membership] = await db.insert(chamberMemberships).values(membershipData).returning();
    return membership;
  }
  async getChamberMembers(chamberId) {
    const result = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users).innerJoin(chamberMemberships, eq(users.id, chamberMemberships.userId)).where(eq(chamberMemberships.chamberId, chamberId));
    return result;
  }
  // Reminder operations
  async createReminder(reminderData) {
    const [reminder] = await db.insert(reminders).values(reminderData).returning();
    return reminder;
  }
  async getRemindersByUser(userId) {
    return await db.select().from(reminders).where(eq(reminders.userId, userId)).orderBy(desc(reminders.reminderDate));
  }
  async getUpcomingReminders(userId, days) {
    const now = /* @__PURE__ */ new Date();
    const futureDate = /* @__PURE__ */ new Date();
    futureDate.setDate(now.getDate() + days);
    return await db.select().from(reminders).where(
      and(
        eq(reminders.userId, userId),
        eq(reminders.isRead, false),
        gte(reminders.reminderDate, now),
        lte(reminders.reminderDate, futureDate)
      )
    ).orderBy(reminders.reminderDate);
  }
  async markReminderAsRead(id) {
    await db.update(reminders).set({ isRead: true }).where(eq(reminders.id, id));
  }
  // Calendar operations
  async getHearingsByDateRange(userId, startDate, endDate) {
    return await db.select().from(cases).where(
      and(
        eq(cases.createdBy, userId),
        gte(cases.nextHearingDate, startDate),
        lte(cases.nextHearingDate, endDate)
      )
    ).orderBy(cases.nextHearingDate);
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
import { OAuth2Client } from "google-auth-library";
import { eq as eq2 } from "drizzle-orm";
var client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
async function verifyGoogleToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing token" });
    }
    const token = authHeader.split(" ")[1];
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = payload;
    const userId = payload.sub;
    const email = payload.email ?? "";
    const firstName = payload.given_name ?? "";
    const lastName = payload.family_name ?? "";
    const profileImageUrl = payload.picture ?? "";
    const existing = await db.select().from(users).where(eq2(users.id, userId));
    if (existing.length === 0) {
      await db.insert(users).values({
        id: userId,
        // using Google sub as PK
        email,
        firstName,
        lastName,
        profileImageUrl
      });
    } else {
      const user = existing[0];
      if (user.email !== email || user.firstName !== firstName || user.lastName !== lastName || user.profileImageUrl !== profileImageUrl) {
        await db.update(users).set({ email, firstName, lastName, profileImageUrl }).where(eq2(users.id, userId));
      }
    }
    next();
  } catch (err) {
    console.error("verifyGoogleToken error:", err);
    res.status(401).json({ message: "Unauthorized" });
  }
}

// server/routes.ts
var upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
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
  }
});
async function registerRoutes(app2) {
  app2.use("/api", verifyGoogleToken);
  app2.get("/api/auth/user", async (req, res) => {
    try {
      const userId = req.user.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/cases", async (req, res) => {
    try {
      console.log("Fetching cases for user:", req.user);
      const userId = req.user.sub;
      console.log("Bearer ", req.headers.authorization);
      const cases2 = await storage.getCasesByUser(userId);
      res.json(cases2);
    } catch (error) {
      console.error("Error fetching cases:", error);
      res.status(500).json({ message: "Failed to fetch cases" });
    }
  });
  app2.post("/api/cases", async (req, res) => {
    try {
      const userId = req.user.sub;
      const caseData = insertCaseSchema.parse({
        ...req.body,
        createdBy: userId,
        nextHearingDate: new Date(req.body.nextHearingDate)
      });
      const newCase = await storage.createCase(caseData);
      res.json(newCase);
    } catch (error) {
      console.error("Error creating case:", error);
      res.status(500).json({
        message: "Failed to create case",
        error: error.message || error
      });
    }
  });
  app2.get("/api/cases/:id", async (req, res) => {
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
  app2.put("/api/cases/:id", async (req, res) => {
    try {
      const updates = insertCaseSchema.partial().parse(req.body);
      const updatedCase = await storage.updateCase(req.params.id, updates);
      res.json(updatedCase);
    } catch (error) {
      console.error("Error updating case:", error);
      res.status(500).json({ message: "Failed to update case" });
    }
  });
  app2.delete("/api/cases/:id", async (req, res) => {
    try {
      await storage.deleteCase(req.params.id);
      res.json({ message: "Case deleted successfully" });
    } catch (error) {
      console.error("Error deleting case:", error);
      res.status(500).json({ message: "Failed to delete case" });
    }
  });
  app2.get("/api/cases/:caseId/diary-entries", async (req, res) => {
    try {
      const entries = await storage.getDiaryEntriesByCase(req.params.caseId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching diary entries:", error);
      res.status(500).json({ message: "Failed to fetch diary entries" });
    }
  });
  app2.post("/api/diary-entries", async (req, res) => {
    try {
      const userId = req.user.sub;
      const entryData = insertDiaryEntrySchema.parse({
        ...req.body,
        createdBy: userId
      });
      const newEntry = await storage.createDiaryEntry(entryData);
      res.json(newEntry);
    } catch (error) {
      console.error("Error creating diary entry:", error);
      res.status(500).json({ message: "Failed to create diary entry" });
    }
  });
  app2.put("/api/diary-entries/:id", async (req, res) => {
    try {
      const updates = insertDiaryEntrySchema.partial().parse(req.body);
      const updatedEntry = await storage.updateDiaryEntry(req.params.id, updates);
      res.json(updatedEntry);
    } catch (error) {
      console.error("Error updating diary entry:", error);
      res.status(500).json({ message: "Failed to update diary entry" });
    }
  });
  app2.delete("/api/diary-entries/:id", async (req, res) => {
    try {
      await storage.deleteDiaryEntry(req.params.id);
      res.json({ message: "Diary entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting diary entry:", error);
      res.status(500).json({ message: "Failed to delete diary entry" });
    }
  });
  app2.post("/api/documents", upload.single("file"), async (req, res) => {
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
        uploadedBy: userId
      });
      const newDocument = await storage.createDocument(documentData);
      res.json(newDocument);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });
  app2.get("/api/cases/:caseId/documents", async (req, res) => {
    try {
      const documents2 = await storage.getDocumentsByCase(req.params.caseId);
      res.json(documents2);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });
  app2.get("/api/documents/:id/download", async (req, res) => {
    try {
      res.status(501).json({ message: "Document download not implemented yet" });
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });
  app2.get("/api/chambers", async (req, res) => {
    try {
      const userId = req.user.sub;
      const chambers2 = await storage.getChambersByUser(userId);
      res.json(chambers2);
    } catch (error) {
      console.error("Error fetching chambers:", error);
      res.status(500).json({ message: "Failed to fetch chambers" });
    }
  });
  app2.post("/api/chambers", async (req, res) => {
    try {
      const userId = req.user.sub;
      const chamberData = insertChamberSchema.parse({
        ...req.body,
        createdBy: userId
      });
      const newChamber = await storage.createChamber(chamberData);
      await storage.addChamberMember({
        chamberId: newChamber.id,
        userId,
        role: "admin"
      });
      res.json(newChamber);
    } catch (error) {
      console.error("Error creating chamber:", error);
      res.status(500).json({ message: "Failed to create chamber" });
    }
  });
  app2.get("/api/chambers/:id/members", async (req, res) => {
    try {
      const members = await storage.getChamberMembers(req.params.id);
      res.json(members);
    } catch (error) {
      console.error("Error fetching chamber members:", error);
      res.status(500).json({ message: "Failed to fetch chamber members" });
    }
  });
  app2.get("/api/chambers/:id/shared-entries", async (req, res) => {
    try {
      const sharedEntries = await storage.getSharedDiaryEntries(req.params.id);
      res.json(sharedEntries);
    } catch (error) {
      console.error("Error fetching shared entries:", error);
      res.status(500).json({ message: "Failed to fetch shared entries" });
    }
  });
  app2.get("/api/diary-entries/:id/comments", async (req, res) => {
    try {
      const comments2 = await storage.getCommentsByDiaryEntry(req.params.id);
      res.json(comments2);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });
  app2.post("/api/comments", async (req, res) => {
    try {
      const userId = req.user.sub;
      const commentData = insertCommentSchema.parse({
        ...req.body,
        createdBy: userId
      });
      const newComment = await storage.createComment(commentData);
      res.json(newComment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });
  app2.get("/api/reminders", async (req, res) => {
    try {
      const userId = req.user.sub;
      const reminders2 = await storage.getRemindersByUser(userId);
      res.json(reminders2);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });
  app2.get("/api/reminders/upcoming", async (req, res) => {
    try {
      const userId = req.user.sub;
      const days = parseInt(req.query.days) || 7;
      const upcomingReminders = await storage.getUpcomingReminders(userId, days);
      res.json(upcomingReminders);
    } catch (error) {
      console.error("Error fetching upcoming reminders:", error);
      res.status(500).json({ message: "Failed to fetch upcoming reminders" });
    }
  });
  app2.post("/api/reminders", async (req, res) => {
    try {
      const userId = req.user.sub;
      const reminderData = insertReminderSchema.parse({
        ...req.body,
        userId
      });
      const newReminder = await storage.createReminder(reminderData);
      res.json(newReminder);
    } catch (error) {
      console.error("Error creating reminder:", error);
      res.status(500).json({ message: "Failed to create reminder" });
    }
  });
  app2.get("/api/calendar/hearings", async (req, res) => {
    try {
      const userId = req.user.sub;
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate) : /* @__PURE__ */ new Date();
      const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3);
      const hearings = await storage.getHearingsByDateRange(userId, start, end);
      res.json(hearings);
    } catch (error) {
      console.error("Error fetching hearings:", error);
      res.status(500).json({ message: "Failed to fetch hearings" });
    }
  });
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws2, req) => {
    console.log("WebSocket connection established");
    ws2.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        wss.clients.forEach((client2) => {
          if (client2 !== ws2 && client2.readyState === WebSocket.OPEN) {
            client2.send(JSON.stringify(data));
          }
        });
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
    ws2.on("close", () => {
      console.log("WebSocket connection closed");
    });
    ws2.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });
  return httpServer;
}

// server/index.ts
dotenv2.config();
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const pathReq = req.path;
  let capturedJsonResponse;
  const originalJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (pathReq.startsWith("/api")) {
      let logLine = `${req.method} ${pathReq} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      console.log(logLine.length > 100 ? logLine.slice(0, 99) + "\u2026" : logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  const publicPath = path2.resolve(process.cwd(), "dist");
  app.use(express.static(publicPath));
  app.get("*", (_req, res) => {
    res.sendFile(path2.resolve(publicPath, "index.html"));
  });
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.HOST || "0.0.0.0";
  server.listen(port, host, () => {
    console.log(`\u{1F680} Server running at http://${host}:${port}`);
  });
})();
