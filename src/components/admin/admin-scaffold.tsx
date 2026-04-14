"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AdminScaffoldProps = {
  title: string;
  onRefresh?: () => Promise<void> | void;
  refreshing?: boolean;
  children: React.ReactNode;
};

const navItems = [
  { href: "/admin/leads", label: "Dashboard" },
  { href: "/admin/activity", label: "Activity" },
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
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <Card className="sticky top-20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block rounded-md border px-3 py-2 text-xs",
                      pathname === item.href
                        ? "bg-muted border-foreground/20 font-medium"
                        : "hover:bg-muted/40"
                    )}
                  >
                    {item.label}
                  </Link>
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
