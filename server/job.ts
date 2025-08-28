// job.ts
import webpush from "web-push";
import { storage } from "./storage";

export async function runHearingJob() {
  const now = new Date();

  // Tomorrow's start (00:00) and end (23:59:59)
  const tomorrowStart = new Date(now);
  tomorrowStart.setDate(now.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  try {
    // 1. Get all hearings scheduled for tomorrow
    const hearings = await storage.getAllHearingsByDateRange(
      tomorrowStart,
      tomorrowEnd
    );

    for (const hearing of hearings) {
      const userId = hearing.createdBy;
      if (!userId) continue;

      if (!hearing.caseId) continue;
      const caseRecord = await storage.getCaseById(hearing.caseId);
      if (!caseRecord) continue;

      const subscriptions = await storage.getPushSubscriptionsByUser(userId);
      if (!subscriptions?.length) continue;

      // 2. Build payload
      const payload = JSON.stringify({
        title: `Reminder: Hearing Tomorrow ${caseRecord?.title ?? "Untitled"}`,
        body: `Your hearing "${
          hearing.hearingSummary ?? "Untitled"
        }" is scheduled for tomorrow at ${
          hearing.nextHearingDate
            ? new Date(hearing.nextHearingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : "Unknown time"
        }.`,
      });

      // 3. Send to all user subscriptions
      for (const sub of subscriptions) {
        const pushSub: webpush.PushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSub, payload);
          console.log(
            `Notification sent to user ${userId} for hearing ${hearing.id}`
          );
        } catch (err) {
          console.error("Push send error:", err);
        }
      }
    }
  } catch (error) {
    console.error("Scheduler error:", error);
  }
}
