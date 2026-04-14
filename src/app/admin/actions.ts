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

  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Failed to update lead status:", error);
    return { success: false };
  }

  return { success: true };
}

export async function updateLeadFollowUp(
  id: string,
  payload: { owner?: string; notes?: string; markContactedNow?: boolean }
) {
  const isAuthed = await ensureAdminSession();
  if (!isAuthed) return { success: false };

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

  return { success: true };
}
