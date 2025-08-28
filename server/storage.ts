import {
  users,
  cases,
  diaryEntries,
  documents,
  comments,
  reminders,
  chambers,
  chamberMemberships,
  pushSubscriptions,
  type User,
  type UpsertUser,
  type Case,
  type InsertCase,
  type DiaryEntry,
  type InsertDiaryEntry,
  type Document,
  type InsertDocument,
  type Comment,
  type InsertComment,
  type Reminder,
  type InsertReminder,
  type Chamber,
  type InsertChamber,
  type ChamberMembership,
  type InsertChamberMembership,
  type PushSubscription,
  type InsertPushSubscription,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, gte, lte, sql, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Case operations
  createCase(caseData: InsertCase): Promise<Case>;
  getCasesByUser(userId: string): Promise<Case[]>;
  getCaseById(id: string): Promise<Case | undefined>;
  updateCase(id: string, updates: Partial<InsertCase>): Promise<Case>;
  deleteCase(id: string): Promise<void>;

  // Diary entry operations
  createDiaryEntry(entryData: InsertDiaryEntry): Promise<DiaryEntry>;
  getDiaryEntriesByCase(caseId: string): Promise<DiaryEntry[]>;
  getSharedDiaryEntries(chamberId: string): Promise<DiaryEntry[]>;
  updateDiaryEntry(id: string, updates: Partial<InsertDiaryEntry>): Promise<DiaryEntry>;
  deleteDiaryEntry(id: string): Promise<void>;

  // Document operations
  createDocument(documentData: InsertDocument): Promise<Document>;
  getDocumentsByCase(caseId: string): Promise<Document[]>;
  getDocumentsByDiaryEntry(diaryEntryId: string): Promise<Document[]>;
  deleteDocument(id: string): Promise<void>;

  // Comment operations
  createComment(commentData: InsertComment): Promise<Comment>;
  getCommentsByDiaryEntry(diaryEntryId: string): Promise<Comment[]>;
  deleteComment(id: string): Promise<void>;

  // Chamber operations
  createChamber(chamberData: InsertChamber): Promise<Chamber>;
  getChambersByUser(userId: string): Promise<Chamber[]>;
  getChamberById(id: string): Promise<Chamber | undefined>;
  addChamberMember(membershipData: InsertChamberMembership): Promise<ChamberMembership>;
  getChamberMembers(chamberId: string): Promise<User[]>;

  // Reminder operations
  createReminder(reminderData: InsertReminder): Promise<Reminder>;
  getRemindersByUser(userId: string): Promise<Reminder[]>;
  getUpcomingReminders(userId: string, days: number): Promise<Reminder[]>;
  markReminderAsRead(id: string): Promise<void>;

  // Calendar operations
  getHearingsByDateRange(startDate: Date, endDate: Date, userId?: string): Promise<DiaryEntry[]>;
  getAllHearingsByDateRange(startDate: Date, endDate: Date): Promise<DiaryEntry[]>;
  /// Push subscription operations
  savePushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription>;
  getPushSubscriptionsByUser(userId: string): Promise<PushSubscription[]>;
  deletePushSubscription(endpoint: string): Promise<void>;

}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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

  // Case operations
  async createCase(caseData: InsertCase): Promise<Case> {
    const [newCase] = await db.insert(cases).values(caseData).returning();
    return newCase;
  }

  async getCasesByUser(userId: string): Promise<Case[]> {
    return await db
      .select()
      .from(cases)
      .where(eq(cases.createdBy, userId))
      .orderBy(desc(cases.updatedAt));
  }

  async getCaseById(id: string): Promise<Case | undefined> {
    const [caseRecord] = await db.select().from(cases).where(eq(cases.id, id));
    return caseRecord;
  }

  async updateCase(id: string, updates: Partial<InsertCase>): Promise<Case> {
    const [updatedCase] = await db
      .update(cases)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cases.id, id))
      .returning();
    return updatedCase;
  }

  async deleteCase(id: string): Promise<void> {
    await db.delete(cases).where(eq(cases.id, id));
  }

  // Diary entry operations
  // update createDiaryEntry when use select isSharedWithChamber == true then add chamber id as well

  async createDiaryEntry(entryData: InsertDiaryEntry): Promise<DiaryEntry> {
    const [entry] = await db.insert(diaryEntries).values(entryData).returning();
    return entry;
  }

  async getDiaryEntriesByCase(caseId: string): Promise<DiaryEntry[]> {
    return await db
      .select()
      .from(diaryEntries)
      .where(eq(diaryEntries.caseId, caseId))
      .orderBy(desc(diaryEntries.entryDate));
  }

  async getSharedDiaryEntries(chamberId: string): Promise<DiaryEntry[]> {
    const result = await db
      .select({
        id: diaryEntries.id,
        caseId: diaryEntries.caseId,
        entryDate: diaryEntries.entryDate,
        hearingSummary: diaryEntries.hearingSummary,
        remarks: diaryEntries.remarks,
        nextHearingDate: diaryEntries.nextHearingDate,
        isSharedWithChamber: diaryEntries.isSharedWithChamber,
        createdBy: diaryEntries.createdBy,
        createdAt: diaryEntries.createdAt,
        updatedAt: diaryEntries.updatedAt,
        // lastNotifiedAt: diaryEntries.lastNotifiedAt,
      })
      .from(diaryEntries)
      .innerJoin(cases, eq(diaryEntries.caseId, cases.id))
      .where(
        and(
          // eq(cases.chamberId, chamberId), ToDO implement in future with dairy entry save with chamber
          eq(diaryEntries.isSharedWithChamber, true)
        )
      )
      .orderBy(desc(diaryEntries.createdAt));
    return result;
  }

  async updateDiaryEntry(id: string, updates: Partial<InsertDiaryEntry>): Promise<DiaryEntry> {
    const [updatedEntry] = await db
      .update(diaryEntries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(diaryEntries.id, id))
      .returning();
    return updatedEntry;
  }

  async deleteDiaryEntry(id: string): Promise<void> {
    await db.delete(diaryEntries).where(eq(diaryEntries.id, id));
  }

  // Document operations
  async createDocument(documentData: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(documentData).returning();
    return document;
  }

  async getDocumentsByCase(caseId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.caseId, caseId))
      .orderBy(desc(documents.createdAt));
  }

  async getDocumentsByDiaryEntry(diaryEntryId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.diaryEntryId, diaryEntryId))
      .orderBy(desc(documents.createdAt));
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Comment operations
  async createComment(commentData: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(commentData).returning();
    return comment;
  }

  async getCommentsByDiaryEntry(diaryEntryId: string): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.diaryEntryId, diaryEntryId))
      .orderBy(desc(comments.createdAt));
  }

  async deleteComment(id: string): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  // Chamber operations
  async createChamber(chamberData: InsertChamber): Promise<Chamber> {
    const [chamber] = await db.insert(chambers).values(chamberData).returning();
    return chamber;
  }

  async getChambersByUser(userId: string): Promise<Chamber[]> {
    const result = await db
      .select({
        id: chambers.id,
        name: chambers.name,
        description: chambers.description,
        createdBy: chambers.createdBy,
        createdAt: chambers.createdAt,
        updatedAt: chambers.updatedAt,
      })
      .from(chambers)
      .innerJoin(chamberMemberships, eq(chambers.id, chamberMemberships.chamberId))
      .where(eq(chamberMemberships.userId, userId));
    return result;
  }

  async getChamberById(id: string): Promise<Chamber | undefined> {
    const [chamber] = await db.select().from(chambers).where(eq(chambers.id, id));
    return chamber;
  }

  async addChamberMember(membershipData: InsertChamberMembership): Promise<ChamberMembership> {
    const [membership] = await db
      .insert(chamberMemberships)
      .values(membershipData)
      .returning();
    return membership;
  }

  async getChamberMembers(chamberId: string): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .innerJoin(chamberMemberships, eq(users.id, chamberMemberships.userId))
      .where(eq(chamberMemberships.chamberId, chamberId));
    return result;
  }

  async getChamberMembership(chamberId: string, userId: string): Promise<ChamberMembership | undefined> {
    const [membership] = await db
      .select()
      .from(chamberMemberships)
      .where(
        and(
          eq(chamberMemberships.chamberId, chamberId),
          eq(chamberMemberships.userId, userId)
        )
      );
    return membership;
  }

  // Reminder operations
  async createReminder(reminderData: InsertReminder): Promise<Reminder> {
    const [reminder] = await db.insert(reminders).values(reminderData).returning();
    return reminder;
  }

  async getRemindersByUser(userId: string): Promise<Reminder[]> {
    return await db
      .select()
      .from(reminders)
      .where(eq(reminders.userId, userId))
      .orderBy(desc(reminders.reminderDate));
  }

  async getUpcomingReminders(userId: string, days: number): Promise<Reminder[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return await db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.userId, userId),
          eq(reminders.isRead, false),
          gte(reminders.reminderDate, now),
          lte(reminders.reminderDate, futureDate)
        )
      )
      .orderBy(reminders.reminderDate);
  }

  async markReminderAsRead(id: string): Promise<void> {
    await db
      .update(reminders)
      .set({ isRead: true })
      .where(eq(reminders.id, id));
  }

  // Calendar operations
  async getHearingsByDateRange(startDate: Date, endDate: Date,userId: string): Promise<DiaryEntry[]> {
    // Subquery: get latest updated entry per case
      const latestPerCase = db
        .select({
          caseId: diaryEntries.caseId,
          maxUpdatedAt: sql`MAX(${diaryEntries.updatedAt})`.as("maxUpdatedAt"),
        })
        .from(diaryEntries)
        .where(
          and(
            eq(diaryEntries.createdBy, userId),
            gte(diaryEntries.nextHearingDate, startDate),
            lte(diaryEntries.nextHearingDate, endDate)
          )
        )
        .groupBy(diaryEntries.caseId)
        .as("latestPerCase");
    return await db
       .select({
          id: diaryEntries.id,
          createdAt: diaryEntries.createdAt,
          updatedAt: diaryEntries.updatedAt,
          nextHearingDate: diaryEntries.nextHearingDate,
          createdBy: diaryEntries.createdBy,
          caseId: diaryEntries.caseId,
          entryDate: diaryEntries.entryDate,
          hearingSummary: diaryEntries.hearingSummary,
          remarks: diaryEntries.remarks,
          isSharedWithChamber: diaryEntries.isSharedWithChamber,
          // lastNotifiedAt: diaryEntries.lastNotifiedAt,
          title: cases.title,
          userId: diaryEntries.createdBy
        })
      .from(diaryEntries)
      .innerJoin(cases, eq(diaryEntries.caseId, cases.id))
      .innerJoin(
        latestPerCase,
        and(
          eq(diaryEntries.caseId, latestPerCase.caseId),
          eq(diaryEntries.updatedAt, latestPerCase.maxUpdatedAt)
        )
      )
      .orderBy(diaryEntries.updatedAt);
  }

  async  getAllHearingsByDateRange(start: Date, end: Date): Promise<DiaryEntry[]> {
  return await db
    .select()
    .from(diaryEntries)
    .where(
      and(
        gte(diaryEntries.nextHearingDate, start),
        lte(diaryEntries.nextHearingDate, end),
        // ✅ ensures we don’t resend within 1 hour
        // or(
        //   isNull(diaryEntries.lastNotifiedAt),
        //   sql`${diaryEntries.lastNotifiedAt} < NOW() - INTERVAL '1 hour'`
        // )
      )
    );
}
  // Push subscription operations
  async savePushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription> {
    const [record] = await db
      .insert(pushSubscriptions)
      .values(subscription)
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint, // unique constraint ensures one row per endpoint
        set: {
          userId: subscription.userId,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
          createdAt: new Date(),
        },
      })
      .returning();
    return record;
  }

  async getPushSubscriptionsByUser(userId: string): Promise<PushSubscription[]> {
    return await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }
}

export const storage = new DatabaseStorage();
