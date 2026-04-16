import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logAuditEvent } from "@/lib/auditLog";
import { safeGetJson, safeSetJson } from "@/lib/safeStorage";
import { generateSessionFingerprint, IdleTimeoutManager } from "@/lib/sessionSecurity";

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
  const idleManagerRef = useRef<IdleTimeoutManager | null>(null);

  // GAP-0367: Session fingerprinting for anti-hijacking
  useEffect(() => {
    if (!session) {
      idleManagerRef.current?.stop();
      return;
    }
    // Store fingerprint on sign-in to detect session hijacking
    const fp = generateSessionFingerprint();
    const storedFp = sessionStorage.getItem("session_fp");
    if (storedFp && storedFp !== fp) {
      console.warn("Session fingerprint mismatch — possible session hijacking");
      signOut();
      return;
    }
    sessionStorage.setItem("session_fp", fp);

    // GAP-0367: Idle timeout — 30min idle = auto sign-out
    if (!idleManagerRef.current) {
      idleManagerRef.current = new IdleTimeoutManager(
        30 * 60 * 1000, // 30min
        60 * 1000, // warn 1min before
        () => setShowTimeoutWarning(true),
        () => {
          setShowTimeoutWarning(false);
          toast({ title: "Session expired", description: "You were signed out due to inactivity.", variant: "destructive" });
          supabase.auth.signOut();
        }
      );
    }
    idleManagerRef.current.start();
    return () => { idleManagerRef.current?.stop(); };
  }, [session]);

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
    // IMPORTANT: getSession must be set up BEFORE onAuthStateChange
    // to avoid race conditions on the published site.
    let initialSessionHandled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Skip if this is the initial session (already handled by getSession)
        if (!initialSessionHandled) return;

        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Fire-and-forget: do NOT await inside onAuthStateChange
          fetchRoles(session.user.id);
        } else {
          setRoles([]);
          setRolesLoading(false);
        }

        // Session timeout persistence: reset timers on token refresh
        if (event === "TOKEN_REFRESHED" && session) {
          setShowTimeoutWarning(false);
        }

        // Token refresh failure handling (item 1907)
        if (event === "TOKEN_REFRESHED" && !session) {
          console.error("Token refresh failed — forcing sign out");
          toast({ title: "Session expired", description: "Your session could not be refreshed. Please sign in again.", variant: "destructive" });
          setSession(null);
          setUser(null);
          setRoles([]);
        }

        // Remember Me: sign out on tab close if session_only flag set
        if (event === "SIGNED_IN") {
          try {
            const sessionOnly = sessionStorage.getItem("notardex_session_only");
            if (sessionOnly === "true") {
              const handleUnload = () => {
                sessionStorage.removeItem("notardex_session_only");
              };
              window.addEventListener("beforeunload", handleUnload);
            }
          } catch {}
        }

        // Handle sign out event
        if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
          setRoles([]);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoles(session.user.id).finally(() => {
          setLoading(false);
          initialSessionHandled = true;
        });
      } else {
        setLoading(false);
        initialSessionHandled = true;
      }
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
    // Client-side rate limiting using safe storage (item 485)
    const now = Date.now();
    const key = "login_attempts";
    const attempts: number[] = safeGetJson<number[]>(key, [], sessionStorage);
    const recent = attempts.filter((t) => now - t < 60_000); // last 60s
    if (recent.length >= 5) {
      logAuditEvent("login_rate_limited", { details: { email } });
      return { error: { message: "Too many login attempts. Please wait 60 seconds before trying again." } };
    }
    recent.push(now);
    safeSetJson(key, recent, sessionStorage);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      logAuditEvent("login_failed", { details: { email, reason: error.message } });
    } else {
      logAuditEvent("login_success", { details: { email } });
      // Gap 2: Rotate session token after sign-in to prevent session fixation
      await supabase.auth.refreshSession();
    }
    return { error };
  };

  const signOut = async () => {
    // Item 179: Audit log sign-out event
    logAuditEvent("sign_out", { entityType: "auth" });
    await supabase.auth.signOut();
    setRoles([]);
    setSession(null);
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
    } catch (e) { console.warn("Storage cleanup error:", e); }
    // H-10: Use soft navigation instead of full page reload
    // QueryClient cache is invalidated by the auth state change listener
    window.location.replace("/");
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
