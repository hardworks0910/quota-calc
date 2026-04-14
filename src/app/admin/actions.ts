"use server";

import { cookies } from "next/headers";
import { supabase } from "@/db";

async function ensureAdminSession() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "1";
}

export async function getLeads() {
  const isAuthed = await ensureAdminSession();
  if (!isAuthed) return [];

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch leads:", error);
    return [];
  }

  return data ?? [];
}

export async function updateLeadStatus(id: string, status: string) {
  const isAuthed = await ensureAdminSession();
  if (!isAuthed) return { success: false };

  const { data: before } = await supabase
    .from("leads")
    .select("status, lead_no")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Failed to update lead status:", error);
    return { success: false };
  }

  void supabase.from("lead_events").insert({
    lead_id: id,
    lead_no: before?.lead_no ?? null,
    event_type: "status_changed",
    event_detail: `status: ${before?.status ?? "unknown"} -> ${status}`,
    actor: "admin",
  });

  return { success: true };
}

export async function updateLeadFollowUp(
  id: string,
  payload: { owner?: string; notes?: string; markContactedNow?: boolean }
) {
  const isAuthed = await ensureAdminSession();
  if (!isAuthed) return { success: false };

  const { data: before } = await supabase
    .from("leads")
    .select("owner, notes, lead_no")
    .eq("id", id)
    .single();

  const updateData: Record<string, unknown> = {};
  if (typeof payload.owner === "string") {
    updateData.owner = payload.owner.trim() || null;
  }
  if (typeof payload.notes === "string") {
    updateData.notes = payload.notes.trim() || null;
  }
  if (payload.markContactedNow) {
    updateData.last_contacted_at = new Date().toISOString();
  }

  const { error } = await supabase.from("leads").update(updateData).eq("id", id);

  if (error) {
    console.error("Failed to update lead follow-up:", error);
    return { success: false };
  }

  const details: string[] = [];
  if (typeof payload.owner === "string" && payload.owner.trim() !== (before?.owner ?? "")) {
    details.push(`owner updated to "${payload.owner.trim() || "unassigned"}"`);
  }
  if (typeof payload.notes === "string" && payload.notes.trim() !== (before?.notes ?? "")) {
    details.push("notes updated");
  }
  if (payload.markContactedNow) {
    details.push("marked as contacted now");
  }

  if (details.length > 0) {
    void supabase.from("lead_events").insert({
      lead_id: id,
      lead_no: before?.lead_no ?? null,
      event_type: "followup_updated",
      event_detail: details.join("; "),
      actor: "admin",
    });
  }

  return { success: true };
}

export async function getLeadEvents(limit = 20) {
  const isAuthed = await ensureAdminSession();
  if (!isAuthed) return [];

  const { data, error } = await supabase
    .from("lead_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch lead events:", error);
    return [];
  }
  return data ?? [];
}
