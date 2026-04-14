"use server";

import { supabase } from "@/db";

export async function getLeads() {
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
