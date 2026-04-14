"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  TrendingUp,
  Clock,
  Filter,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getLeads, updateLeadStatus } from "./actions";

type Lead = {
  id: string;
  industry: string;
  calculation_data: Record<string, unknown>;
  estimated_quota: number;
  company_name: string;
  contact_person: string;
  whatsapp: string;
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

export default function AdminPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [filterIndustry, setFilterIndustry] = useState<string>("all");

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const data = await getLeads();
    setLeads(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) fetchLeads();
  }, [authed, fetchLeads]);

  async function handleStatusChange(id: string, status: string) {
    await updateLeadStatus(id, status);
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-lg">Admin Access</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (password === "admin2026") setAuthed(true);
              }}
              className="space-y-3"
            >
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              />
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filtered =
    filterIndustry === "all"
      ? leads
      : leads.filter((l) => l.industry === filterIndustry);

  const totalLeads = leads.length;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyLeads = leads.filter(
    (l) => new Date(l.created_at) >= weekAgo
  ).length;

  const industryCount: Record<string, number> = {};
  leads.forEach((l) => {
    industryCount[l.industry] = (industryCount[l.industry] || 0) + 1;
  });
  const topIndustry =
    Object.entries(industryCount).sort(([, a], [, b]) => b - a)[0]?.[0] ||
    "—";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <a href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </a>
            <h1 className="text-sm font-semibold">Lead Dashboard</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeads}
            disabled={loading}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    {totalLeads}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    {weeklyLeads}
                  </p>
                  <p className="text-xs text-muted-foreground">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">
                    {industryLabels[topIndustry] || topIndustry}
                  </p>
                  <p className="text-xs text-muted-foreground">Top Industry</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterIndustry} onValueChange={setFilterIndustry}>
            <SelectTrigger className="w-44" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              <SelectItem value="fnb">F&B</SelectItem>
              <SelectItem value="manufacturing">Manufacturing</SelectItem>
              <SelectItem value="construction">Construction</SelectItem>
              <SelectItem value="agriculture">Agriculture</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            {filtered.length} result{filtered.length !== 1 && "s"}
          </span>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium px-4 py-3">Company</th>
                  <th className="text-left font-medium px-4 py-3">Contact</th>
                  <th className="text-left font-medium px-4 py-3">Industry</th>
                  <th className="text-left font-medium px-4 py-3">Quota</th>
                  <th className="text-left font-medium px-4 py-3">WhatsApp</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      No leads found
                    </td>
                  </tr>
                ) : (
                  filtered.map((lead) => (
                    <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        {lead.company_name}
                      </td>
                      <td className="px-4 py-3">{lead.contact_person}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                          {industryLabels[lead.industry] || lead.industry}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums font-medium">
                        {lead.estimated_quota}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {lead.whatsapp}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={lead.status}
                          onValueChange={(v) =>
                            handleStatusChange(lead.id, v)
                          }
                        >
                          <SelectTrigger
                            size="sm"
                            className={cn(
                              "w-28 h-7 text-xs border-0",
                              statusColors[lead.status]
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleDateString("en-MY", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
