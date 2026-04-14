"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AdminScaffold } from "@/components/admin/admin-scaffold";
import { getLeads } from "../actions";

type Lead = {
  id: string;
  industry: string;
  status: string;
  created_at: string;
};

const industryLabels: Record<string, string> = {
  fnb: "F&B",
  manufacturing: "Manufacturing",
  construction: "Construction",
  agriculture: "Agriculture",
  cleaning: "Cleaning",
};

function toPercent(numerator: number, denominator: number) {
  if (!denominator) return "0%";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export default function AdminOverviewPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLeads();
      setLeads(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyLeads = leads.filter((l) => new Date(l.created_at) >= weekAgo).length;
    const industryCount: Record<string, number> = {};
    for (const l of leads) industryCount[l.industry] = (industryCount[l.industry] || 0) + 1;
    const topIndustry =
      Object.entries(industryCount).sort(([, a], [, b]) => b - a)[0]?.[0] || "—";
    const newCount = leads.filter((l) => l.status === "new").length;
    const contactedCount = leads.filter((l) => l.status === "contacted").length;
    const convertedCount = leads.filter((l) => l.status === "converted").length;
    const closedCount = leads.filter((l) => l.status === "closed").length;
    return {
      totalLeads,
      weeklyLeads,
      topIndustry,
      newCount,
      contactedCount,
      convertedCount,
      closedCount,
    };
  }, [leads]);

  return (
    <AdminScaffold title="Lead Dashboard - Overview" onRefresh={fetchData} refreshing={loading}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold tabular-nums">{stats.totalLeads}</p>
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
                <p className="text-2xl font-bold tabular-nums">{stats.weeklyLeads}</p>
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
                  {industryLabels[stats.topIndustry] || stats.topIndustry}
                </p>
                <p className="text-xs text-muted-foreground">Top Industry</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">New</p>
            <p className="text-xl font-semibold tabular-nums">{stats.newCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Contacted</p>
            <p className="text-xl font-semibold tabular-nums">{stats.contactedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Converted</p>
            <p className="text-xl font-semibold tabular-nums">{stats.convertedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Closed</p>
            <p className="text-xl font-semibold tabular-nums">{stats.closedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Conv. Rate</p>
            <p className="text-xl font-semibold tabular-nums">
              {toPercent(stats.convertedCount, stats.totalLeads)}
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminScaffold>
  );
}
