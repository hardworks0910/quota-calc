"use server";

type LeadNotificationPayload = {
  industry: string;
  estimatedQuota: number;
  companyName: string;
  contactPerson: string;
  whatsapp: string;
};

export async function sendTelegramLeadNotification(
  payload: LeadNotificationPayload
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return;

  const message = [
    "New Lead Received",
    `Industry: ${payload.industry}`,
    `Estimated Quota: ${payload.estimatedQuota}`,
    `Company: ${payload.companyName}`,
    `Contact: ${payload.contactPerson}`,
    `WhatsApp: ${payload.whatsapp}`,
  ].join("\n");

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Telegram notify failed:", await res.text());
    }
  } catch (err) {
    console.error("Telegram notify error:", err);
  }
}
