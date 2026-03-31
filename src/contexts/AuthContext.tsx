import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logAuditEvent } from "@/lib/auditLog";

type UserRole = "admin" | "client" | "notary";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  roles: UserRole[];
  isAdmin: boolean;
  isNotary: boolean;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);
  const { toast } = useToast();

  const abortRef = React.useRef<AbortController | null>(null);

  const fetchRoles = async (userId: string) => {
    // Abort any in-flight role fetch
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setRolesLoading(true);
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    // If this request was aborted, skip state updates
    if (controller.signal.aborted) return;
    if (data) {
      setRoles(data.map((r) => r.role as UserRole));
    }
    setRolesLoading(false);
  };

  // Session timeout: warn 30s before expiry, then sign out
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  useEffect(() => {
    if (!session) { setShowTimeoutWarning(false); return; }
    const expiresAt = session.expires_at;
    if (!expiresAt) return;

    const expiryMs = expiresAt * 1000;
    const warnMs = expiryMs - Date.now() - 30_000; // 30s before
    const expireMs = expiryMs - Date.now();

    const warnTimer = warnMs > 0 ? setTimeout(() => setShowTimeoutWarning(true), warnMs) : undefined;
    const expireTimer = expireMs > 0 ? setTimeout(async () => {
      setShowTimeoutWarning(false);
      toast({ title: "Session expired", description: "You have been signed out for security.", variant: "destructive" });
      setSession(null);
      setUser(null);
      setRoles([]);
    }, expireMs) : undefined;

    return () => {
      if (warnTimer) clearTimeout(warnTimer);
      if (expireTimer) clearTimeout(expireTimer);
    };
  }, [session, toast]);

  const extendSession = async () => {
    setShowTimeoutWarning(false);
    await supabase.auth.refreshSession();
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchRoles(session.user.id);
        } else {
          setRoles([]);
          setRolesLoading(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/portal`,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Client-side rate limiting
    const now = Date.now();
    const key = "login_attempts";
    const stored = sessionStorage.getItem(key);
    const attempts: number[] = stored ? JSON.parse(stored) : [];
    const recent = attempts.filter((t) => now - t < 60_000); // last 60s
    if (recent.length >= 5) {
      logAuditEvent("login_rate_limited", { details: { email } });
      return { error: { message: "Too many login attempts. Please wait 60 seconds before trying again." } };
    }
    recent.push(now);
    sessionStorage.setItem(key, JSON.stringify(recent));

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      logAuditEvent("login_failed", { details: { email, reason: error.message } });
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
    // Only clear auth-related storage, not theme preferences
    try {
      const theme = localStorage.getItem("theme");
      sessionStorage.clear();
      // Preserve theme preference
      if (theme) localStorage.setItem("theme", theme);
      // Remove auth-specific keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("sb-") || key === "ai_assistant_history" || key === "pendingBooking")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {}
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        roles,
        isAdmin: roles.includes("admin"),
        isNotary: roles.includes("notary"),
        loading: loading || rolesLoading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
      {/* Session timeout warning modal */}
      {showTimeoutWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="mx-4 max-w-sm rounded-lg bg-background p-6 shadow-xl border border-border">
            <h3 className="text-lg font-bold text-foreground mb-2">Session Expiring</h3>
            <p className="text-sm text-muted-foreground mb-4">Your session will expire in less than 30 seconds. Would you like to stay signed in?</p>
            <div className="flex gap-2">
              <button onClick={extendSession} className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Stay Signed In</button>
              <button onClick={signOut} className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
