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
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chambers table for law firms/groups
export const chambers = pgTable("chambers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chamber memberships
export const chamberMemberships = pgTable("chamber_memberships", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  chamberId: uuid("chamber_id").references(() => chambers.id),
  userId: varchar("user_id").references(() => users.id),
  role: varchar("role", { length: 50 }).default("member"), // member, admin
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Cases table
export const cases = pgTable("cases", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 500 }).notNull(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  court: varchar("court", { length: 255 }).notNull(),
  caseNumber: varchar("case_number", { length: 100 }),
  nextHearingDate: timestamp("next_hearing_date"),
  priority: varchar("priority", { length: 20 }).default("normal"), // normal, urgent, critical
  status: varchar("status", { length: 20 }).default("active"), // active, closed, archived
  isPrivate: boolean("is_private").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  chamberId: uuid("chamber_id").references(() => chambers.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Diary entries table
export const diaryEntries = pgTable("diary_entries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: uuid("case_id").references(() => cases.id),
  entryDate: timestamp("entry_date").notNull(),
  hearingSummary: text("hearing_summary"),
  remarks: text("remarks"),
  nextHearingDate: timestamp("next_hearing_date"),
  isSharedWithChamber: boolean("is_shared_with_chamber").default(false),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // 👇 add this new column
  lastNotifiedAt: timestamp("last_notified_at"), 
});

// Documents table
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  size: integer("size").notNull(),
  caseId: uuid("case_id").references(() => cases.id),
  diaryEntryId: uuid("diary_entry_id").references(() => diaryEntries.id),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments table for shared entries
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  diaryEntryId: uuid("diary_entry_id").references(() => diaryEntries.id),
  content: text("content").notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reminders table
export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: uuid("case_id").references(() => cases.id),
  reminderDate: timestamp("reminder_date").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscriptions table
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  endpoint: text("endpoint").notNull().unique(), // browser’s push endpoint
  p256dh: text("p256dh").notNull(), // client key
  auth: text("auth").notNull(), // client auth secret
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  cases: many(cases),
  diaryEntries: many(diaryEntries),
  documents: many(documents),
  comments: many(comments),
  reminders: many(reminders),
  chamberMemberships: many(chamberMemberships),
  chambersCreated: many(chambers),
}));

export const chambersRelations = relations(chambers, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [chambers.createdBy],
    references: [users.id],
  }),
  memberships: many(chamberMemberships),
  cases: many(cases),
}));

export const chamberMembershipsRelations = relations(chamberMemberships, ({ one }) => ({
  chamber: one(chambers, {
    fields: [chamberMemberships.chamberId],
    references: [chambers.id],
  }),
  user: one(users, {
    fields: [chamberMemberships.userId],
    references: [users.id],
  }),
}));

export const casesRelations = relations(cases, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [cases.createdBy],
    references: [users.id],
  }),
  chamber: one(chambers, {
    fields: [cases.chamberId],
    references: [chambers.id],
  }),
  diaryEntries: many(diaryEntries),
  documents: many(documents),
  reminders: many(reminders),
}));

export const diaryEntriesRelations = relations(diaryEntries, ({ one, many }) => ({
  case: one(cases, {
    fields: [diaryEntries.caseId],
    references: [cases.id],
  }),
  createdBy: one(users, {
    fields: [diaryEntries.createdBy],
    references: [users.id],
  }),
  documents: many(documents),
  comments: many(comments),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  case: one(cases, {
    fields: [documents.caseId],
    references: [cases.id],
  }),
  diaryEntry: one(diaryEntries, {
    fields: [documents.diaryEntryId],
    references: [diaryEntries.id],
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  diaryEntry: one(diaryEntries, {
    fields: [comments.diaryEntryId],
    references: [diaryEntries.id],
  }),
  createdBy: one(users, {
    fields: [comments.createdBy],
    references: [users.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  case: one(cases, {
    fields: [reminders.caseId],
    references: [cases.id],
  }),
  user: one(users, {
    fields: [reminders.userId],
    references: [users.id],
  }),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));
// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertChamberSchema = createInsertSchema(chambers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCaseSchema = createInsertSchema(cases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDiaryEntrySchema = createInsertSchema(diaryEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true,
});

export const insertChamberMembershipSchema = createInsertSchema(chamberMemberships).omit({
  id: true,
  joinedAt: true,
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Chamber = typeof chambers.$inferSelect;
export type InsertChamber = z.infer<typeof insertChamberSchema>;
export type Case = typeof cases.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type InsertDiaryEntry = z.infer<typeof insertDiaryEntrySchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type ChamberMembership = typeof chamberMemberships.$inferSelect;
export type InsertChamberMembership = z.infer<typeof insertChamberMembershipSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
