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
