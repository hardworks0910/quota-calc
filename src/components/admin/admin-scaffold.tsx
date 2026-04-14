"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getAdminNavSummary } from "@/app/admin/actions";

type AdminScaffoldProps = {
  title: string;
  onRefresh?: () => Promise<void> | void;
  refreshing?: boolean;
  children: React.ReactNode;
};

const navItems = [
  { key: "dashboard", href: "/admin/leads", label: "Dashboard", icon: LayoutDashboard },
  { key: "activity", href: "/admin/activity", label: "Activity", icon: Activity },
];

export function AdminScaffold({
  title,
  onRefresh,
  refreshing = false,
  children,
}: AdminScaffoldProps) {
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [navSummary, setNavSummary] = useState({ leadCount: 0, todayEventCount: 0 });

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/admin/session", { cache: "no-store" });
        const data = (await res.json()) as { authed?: boolean };
        setAuthed(Boolean(data.authed));
      } finally {
        setChecking(false);
      }
    }
    checkSession();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("admin_sidebar_collapsed");
    if (saved === "1") setSidebarCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("admin_sidebar_collapsed", sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!authed) return;
    getAdminNavSummary().then(setNavSummary).catch(() => {
      setNavSummary({ leadCount: 0, todayEventCount: 0 });
    });
  }, [authed, pathname]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
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
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setLoginError("");
                const res = await fetch("/api/admin/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ password }),
                });
                const data = (await res.json()) as {
                  success?: boolean;
                  message?: string;
                };
                if (res.ok && data.success) {
                  setAuthed(true);
                  setPassword("");
                  return;
                }
                setLoginError(data.message || "Login failed");
              }}
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
              {loginError ? (
                <p className="text-xs text-destructive">{loginError}</p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-sm font-semibold">{title}</h1>
          </div>
          {onRefresh ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRefresh()}
              disabled={refreshing}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5 mr-1.5", refreshing && "animate-spin")}
              />
              Refresh
            </Button>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div
          className={cn(
            "grid gap-6",
            sidebarCollapsed
              ? "lg:grid-cols-[88px_minmax(0,1fr)]"
              : "lg:grid-cols-[220px_minmax(0,1fr)]"
          )}
        >
          <aside className="hidden lg:block">
            <Card className="sticky top-20">
              <CardHeader className="pb-3">
                <div
                  className={cn(
                    "flex items-center gap-2",
                    sidebarCollapsed ? "justify-center" : "justify-between"
                  )}
                >
                  {!sidebarCollapsed ? (
                    <CardTitle className="text-sm">Navigation</CardTitle>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setSidebarCollapsed((v) => !v)}
                  >
                    {sidebarCollapsed ? (
                      <PanelLeftOpen className="h-4 w-4" />
                    ) : (
                      <PanelLeftClose className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {navItems.map((item) => (
                  (() => {
                    const badgeCount =
                      item.key === "dashboard"
                        ? navSummary.leadCount
                        : navSummary.todayEventCount;
                    return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative block rounded-md border px-3 py-2 text-xs",
                      pathname === item.href
                        ? "bg-muted border-foreground/20 font-medium"
                        : "hover:bg-muted/40",
                      sidebarCollapsed
                        ? "mx-1 h-9 flex items-center justify-center"
                        : "flex items-center gap-2"
                    )}
                    title={item.label}
                  >
                    {pathname === item.href ? (
                      <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-foreground/60" />
                    ) : null}
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!sidebarCollapsed ? item.label : null}
                    {!sidebarCollapsed ? (
                      <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                        {badgeCount}
                      </span>
                    ) : (
                      <span className="absolute -right-1 -top-1 rounded bg-foreground px-1 text-[9px] leading-4 text-background">
                        {badgeCount}
                      </span>
                    )}
                    {sidebarCollapsed ? (
                      <span className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border bg-background px-2 py-1 text-[11px] opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                        {item.label}
                      </span>
                    ) : null}
                  </Link>
                    );
                  })()
                ))}
              </CardContent>
            </Card>
          </aside>

          <main className="space-y-4">
            <div className="flex items-center gap-2 lg:hidden">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-xs",
                    pathname === item.href
                      ? "bg-muted border-foreground/20 font-medium"
                      : "hover:bg-muted/40"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
