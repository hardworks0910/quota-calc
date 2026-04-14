"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AdminScaffold } from "@/components/admin/admin-scaffold";
import { getLeads, updateLeadFollowUp, updateLeadStatus } from "../actions";

type Lead = {
  id: string;
  lead_no: number;
  industry: string;
  estimated_quota: number;
  company_name: string;
  contact_person: string;
  whatsapp: string;
  device_id: string | null;
  user_agent: string | null;
  owner: string | null;
  notes: string | null;
  last_contacted_at: string | null;
  status: string;
  created_at: string;
};

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  contacted:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  converted:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  closed: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};
const statusOptions = ["new", "contacted", "converted", "closed"];
const industryLabels: Record<string, string> = {
  fnb: "F&B",
  manufacturing: "Manufacturing",
  construction: "Construction",
  agriculture: "Agriculture",
  cleaning: "Cleaning",
};

function parseDeviceType(userAgent: string | null): string {
  if (!userAgent) return "Unknown";
  const ua = userAgent.toLowerCase();
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) return "iPhone/iPad";
  if (ua.includes("android")) return "Android";
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "Mac";
  if (ua.includes("linux")) return "Linux";
  return "Other";
}

function csvEscape(value: string | number | null | undefined) {
  const v = String(value ?? "");
  if (v.includes(",") || v.includes("\"") || v.includes("\n")) return `"${v.replaceAll("\"", "\"\"")}"`;
  return v;
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterIndustry, setFilterIndustry] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterOwner, setFilterOwner] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [drafts, setDrafts] = useState<Record<string, { owner: string; notes: string }>>({});
  const [saveState, setSaveState] = useState<Record<string, "idle" | "saving" | "saved" | "error">>({});
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const fetchLeads = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await getLeads();
      setLeads(data);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const lead of leads) {
        if (!next[lead.id]) next[lead.id] = { owner: lead.owner ?? "", notes: lead.notes ?? "" };
      }
      return next;
    });
  }, [leads]);

  useEffect(() => {
    return () => {
      Object.values(saveTimers.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterIndustry, filterStatus, filterOwner, searchQuery]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      leads.filter((l) => {
        if (filterIndustry !== "all" && l.industry !== filterIndustry) return false;
        if (filterStatus !== "all" && l.status !== filterStatus) return false;
        if (filterOwner !== "all" && (l.owner ?? "") !== filterOwner) return false;
        if (!normalizedQuery) return true;
        return (
          l.company_name.toLowerCase().includes(normalizedQuery) ||
          l.contact_person.toLowerCase().includes(normalizedQuery) ||
          l.whatsapp.toLowerCase().includes(normalizedQuery) ||
          (l.device_id ?? "").toLowerCase().includes(normalizedQuery)
        );
      }),
    [leads, filterIndustry, filterStatus, filterOwner, normalizedQuery]
  );
  const ownerOptions = Array.from(new Set(leads.map((l) => (l.owner ?? "").trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const start = (safeCurrentPage - 1) * pageSize;
  const pagedRows = filtered.slice(start, start + pageSize);

  async function handleStatusChange(id: string, status: string) {
    await updateLeadStatus(id, status);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  }

  async function handleMarkContactedNow(id: string) {
    const ok = await updateLeadFollowUp(id, { markContactedNow: true });
    if (!ok.success) return;
    const now = new Date().toISOString();
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, last_contacted_at: now } : l)));
  }

  function queueAutoSave(id: string, nextDraft: { owner: string; notes: string }) {
    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(async () => {
      setSaveState((prev) => ({ ...prev, [id]: "saving" }));
      const ok = await updateLeadFollowUp(id, nextDraft);
      if (!ok.success) {
        setSaveState((prev) => ({ ...prev, [id]: "error" }));
        return;
      }
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, owner: nextDraft.owner || null, notes: nextDraft.notes || null } : l))
      );
      setSaveState((prev) => ({ ...prev, [id]: "saved" }));
      setTimeout(() => setSaveState((prev) => ({ ...prev, [id]: "idle" })), 1200);
    }, 700);
  }

  function handleDraftChange(id: string, field: "owner" | "notes", value: string) {
    setDrafts((prev) => {
      const current = prev[id] ?? { owner: "", notes: "" };
      const nextDraft = { ...current, [field]: value };
      queueAutoSave(id, nextDraft);
      return { ...prev, [id]: nextDraft };
    });
  }

  function handleExportCsv() {
    const headers = [
      "lead_no","company_name","contact_person","industry","estimated_quota","whatsapp",
      "device_type","device_id","owner","notes","last_contacted_at","status","created_at",
    ];
    const rows = filtered.map((l) => [
      l.lead_no, l.company_name, l.contact_person, l.industry, l.estimated_quota, l.whatsapp,
      parseDeviceType(l.user_agent), l.device_id, l.owner, l.notes, l.last_contacted_at, l.status, l.created_at,
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.map((cell) => csvEscape(cell)).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminScaffold title="Lead Dashboard - Leads" onRefresh={() => fetchLeads(true)} refreshing={loading}>
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterIndustry} onValueChange={setFilterIndustry}>
          <SelectTrigger className="w-44" size="sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            <SelectItem value="fnb">F&B</SelectItem>
            <SelectItem value="manufacturing">Manufacturing</SelectItem>
            <SelectItem value="construction">Construction</SelectItem>
            <SelectItem value="agriculture">Agriculture</SelectItem>
            <SelectItem value="cleaning">Cleaning</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40" size="sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterOwner} onValueChange={setFilterOwner}>
          <SelectTrigger className="w-40" size="sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {ownerOptions.map((owner) => (
              <SelectItem key={owner} value={owner}>{owner}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search company, contact, phone, device..."
          className="h-8 max-w-xs"
        />
        <Button variant="outline" size="sm" className="h-8" onClick={handleExportCsv} disabled={filtered.length === 0}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="max-h-[72vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b bg-muted/95 backdrop-blur">
                {["No.","Company","Contact","Industry","Quota","WhatsApp","Device","Device ID","Owner","Notes","Last Contacted","Status","Date"].map((h) => (
                  <th key={h} className="text-left font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={13} className="text-center py-12 text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={13} className="text-center py-12 text-muted-foreground">No leads found</td></tr>
              ) : (
                pagedRows.map((lead) => (
                  <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 tabular-nums font-semibold">{lead.lead_no}</td>
                    <td className="px-4 py-3 font-medium">{lead.company_name}</td>
                    <td className="px-4 py-3">{lead.contact_person}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{industryLabels[lead.industry] || lead.industry}</span></td>
                    <td className="px-4 py-3 tabular-nums font-medium">{lead.estimated_quota}</td>
                    <td className="px-4 py-3 tabular-nums">{lead.whatsapp}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{parseDeviceType(lead.user_agent)}</span></td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground max-w-[180px] truncate">{lead.device_id ?? "—"}</td>
                    <td className="px-4 py-3 min-w-[140px]">
                      <Input value={drafts[lead.id]?.owner ?? lead.owner ?? ""} placeholder="Assign owner" className="h-8 text-xs" onChange={(e) => handleDraftChange(lead.id, "owner", e.currentTarget.value)} />
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {saveState[lead.id] === "saving" && "Saving..."}
                        {saveState[lead.id] === "saved" && "Saved"}
                        {saveState[lead.id] === "error" && "Save failed"}
                      </p>
                    </td>
                    <td className="px-4 py-3 min-w-[200px]">
                      <Input value={drafts[lead.id]?.notes ?? lead.notes ?? ""} placeholder="Add note..." className="h-8 text-xs" onChange={(e) => handleDraftChange(lead.id, "notes", e.currentTarget.value)} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground min-w-[170px]">
                      <div className="space-y-1">
                        <div>{lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleString("en-MY", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</div>
                        <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => handleMarkContactedNow(lead.id)}>Mark now</Button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Select value={lead.status} onValueChange={(v) => handleStatusChange(lead.id, v)}>
                        <SelectTrigger size="sm" className={cn("w-28 h-7 text-xs border-0", statusColors[lead.status])}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((s) => (
                            <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length === 0 ? 0 : start + 1}-{Math.min(start + pageSize, filtered.length)} of {filtered.length}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safeCurrentPage === 1}>Prev</Button>
          <span className="text-xs text-muted-foreground">Page {safeCurrentPage} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safeCurrentPage === totalPages}>Next</Button>
        </div>
      </div>
    </AdminScaffold>
  );
}
