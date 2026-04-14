"use server";

import { leadSchema } from "@/lib/schemas";
import type { IndustryId } from "@/lib/schemas";

type SubmitLeadPayload = {
  industry: IndustryId;
  calculationData: Record<string, unknown>;
  estimatedQuota: number;
  companyName: string;
  contactPerson: string;
  whatsapp: string;
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

    const { error } = await supabase.from("leads").insert({
      industry: payload.industry,
      calculation_data: payload.calculationData,
      estimated_quota: payload.estimatedQuota,
      company_name: parsed.data.companyName,
      contact_person: parsed.data.contactPerson,
      whatsapp: parsed.data.whatsapp,
      status: "new",
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return {
        success: false as const,
        error: { _form: [error.message] },
      };
    }

    return { success: true as const };
  } catch (e) {
    console.error("Failed to insert lead:", e);
    return {
      success: false as const,
      error: { _form: ["Submission failed. Please try again later."] },
    };
  }
}
