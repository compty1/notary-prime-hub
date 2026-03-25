import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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

  const fetchRoles = async (userId: string) => {
    setRolesLoading(true);
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (data) {
      setRoles(data.map((r) => r.role as UserRole));
    }
    setRolesLoading(false);
  };

  // Session timeout: periodically check if session is still valid with warning
  useEffect(() => {
    if (!session) return;
    const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
    const WARNING_BEFORE = 30 * 1000; // 30 seconds before check

    // Show warning 30s before the check
    const warningTimeout = setTimeout(() => {
      // We'll import toast dynamically to avoid circular deps
      import("@/hooks/use-toast").then(({ toast }) => {
        toast({ title: "Session check", description: "Your session will be verified shortly." });
      });
    }, CHECK_INTERVAL - WARNING_BEFORE);

    const interval = setInterval(async () => {
      const { data: { session: current }, error } = await supabase.auth.getSession();
      if (error || !current) {
        import("@/hooks/use-toast").then(({ toast }) => {
          toast({ title: "Session expired", description: "You have been signed out for security.", variant: "destructive" });
        });
        setSession(null);
        setUser(null);
        setRoles([]);
      }
    }, CHECK_INTERVAL);
    return () => { clearInterval(interval); clearTimeout(warningTimeout); };
  }, [session]);

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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
    try { localStorage.clear(); sessionStorage.clear(); } catch {}
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
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
