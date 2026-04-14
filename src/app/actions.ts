"use server";

import { headers } from "next/headers";
import { leadSchema } from "@/lib/schemas";
import type { IndustryId } from "@/lib/schemas";
import { sendTelegramLeadNotification } from "@/lib/notifications";

type SubmitLeadPayload = {
  industry: IndustryId;
  calculationData: Record<string, unknown>;
  estimatedQuota: number;
  companyName: string;
  contactPerson: string;
  whatsapp: string;
  deviceId?: string;
};

export async function submitLead(payload: SubmitLeadPayload) {
  const parsed = leadSchema.safeParse({
    companyName: payload.companyName,
    contactPerson: payload.contactPerson,
    whatsapp: payload.whatsapp,
  });

  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors };
  }

  try {
    const { supabase } = await import("@/db");
    const ua = (await headers()).get("user-agent");

    if (payload.deviceId) {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
      const { data: recentRows, error: recentError } = await supabase
        .from("leads")
        .select("id")
        .eq("device_id", payload.deviceId)
        .gte("created_at", oneMinuteAgo)
        .limit(1);

      if (recentError) {
        console.error("Supabase anti-spam check error:", recentError);
      } else if ((recentRows?.length ?? 0) > 0) {
        return {
          success: false as const,
          error: { _form: ["Please wait 60 seconds before submitting again."] },
        };
      }
    }

    const { error } = await supabase.from("leads").insert({
      industry: payload.industry,
      calculation_data: payload.calculationData,
      estimated_quota: payload.estimatedQuota,
      company_name: parsed.data.companyName,
      contact_person: parsed.data.contactPerson,
      whatsapp: parsed.data.whatsapp,
      device_id: payload.deviceId ?? null,
      user_agent: ua ?? null,
      status: "new",
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return {
        success: false as const,
        error: { _form: [error.message] },
      };
    }

    // Best-effort notification; lead insert remains source of truth.
    void sendTelegramLeadNotification({
      industry: payload.industry,
      estimatedQuota: payload.estimatedQuota,
      companyName: parsed.data.companyName,
      contactPerson: parsed.data.contactPerson,
      whatsapp: parsed.data.whatsapp,
    });

    return { success: true as const };
  } catch (e) {
    console.error("Failed to insert lead:", e);
    return {
      success: false as const,
      error: { _form: ["Submission failed. Please try again later."] },
    };
  }
}
