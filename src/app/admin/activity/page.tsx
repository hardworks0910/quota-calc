"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AdminScaffold } from "@/components/admin/admin-scaffold";
import { getLeadEvents, getLeads } from "../actions";

type LeadEvent = {
  id: string;
  lead_id: string;
  lead_no: number | null;
  event_type: string;
  event_detail: string | null;
  actor: string | null;
  created_at: string;
};

type Lead = {
  id: string;
  lead_no: number;
};

export default function AdminActivityPage() {
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("all");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [evts, leadRows] = await Promise.all([getLeadEvents(100), getLeads()]);
      setEvents(evts);
      setLeads(leadRows.map((l) => ({ id: l.id as string, lead_no: l.lead_no as number })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const leadOptions = useMemo(
    () =>
      [...leads]
        .sort((a, b) => b.lead_no - a.lead_no)
        .map((l) => ({ value: l.id, label: `Lead #${l.lead_no}` })),
    [leads]
  );

  const timelineRows = useMemo(
    () =>
      events.filter((e) => {
        if (selectedLeadId !== "all" && e.lead_id !== selectedLeadId) return false;
        if (eventTypeFilter !== "all" && e.event_type !== eventTypeFilter) return false;
        return true;
      }),
    [events, selectedLeadId, eventTypeFilter]
  );

  return (
    <AdminScaffold title="Lead Dashboard - Activity" onRefresh={fetchData} refreshing={loading}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Lead Activity Timeline</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger className="w-40 h-8 text-xs" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leads</SelectItem>
                  {leadOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="w-44 h-8 text-xs" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="lead_created">Lead Created</SelectItem>
                  <SelectItem value="status_changed">Status Changed</SelectItem>
                  <SelectItem value="followup_updated">Follow-up Updated</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setSelectedLeadId("all");
                  setEventTypeFilter("all");
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : timelineRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            timelineRows.slice(0, 40).map((e) => (
              <div key={e.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">
                    Lead #{e.lead_no ?? "?"} - {e.event_type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.created_at).toLocaleString("en-MY", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {e.event_detail ?? "No detail"} by {e.actor ?? "system"}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </AdminScaffold>
  );
}
