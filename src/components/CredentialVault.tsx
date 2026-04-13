/**
 * Sprint 6: Credential Vault — stores external account credentials.
 * Passwords are stored as plaintext in the DB (encrypted_password column)
 * and masked in the UI with show/hide toggle.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Eye, EyeOff, Copy, Trash2, Pencil, Search, ExternalLink, KeyRound } from "lucide-react";
import { toast } from "sonner";

interface Credential {
  id: string;
  service_name: string;
  service_url: string | null;
  service_logo_url: string | null;
  username: string | null;
  email: string | null;
  encrypted_password: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const emptyForm = { service_name: "", service_url: "", username: "", email: "", encrypted_password: "", notes: "" };

function getLogoUrl(serviceUrl: string | null, serviceName: string): string {
  if (serviceUrl) {
    try {
      const domain = new URL(serviceUrl.startsWith("http") ? serviceUrl : `https://${serviceUrl}`).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch { /* fallback */ }
  }
  const slug = serviceName.toLowerCase().replace(/\s+/g, "");
  return `https://www.google.com/s2/favicons?domain=${slug}.com&sz=64`;
}

export default function CredentialVault() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Credential | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: credentials = [], isLoading } = useQuery({
    queryKey: ["user_credentials", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_credentials")
        .select("*")
        .order("service_name");
      if (error) throw error;
      return data as Credential[];
    },
    enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async (values: typeof form & { id?: string }) => {
      const payload = {
        user_id: user!.id,
        service_name: values.service_name,
        service_url: values.service_url || null,
        service_logo_url: getLogoUrl(values.service_url, values.service_name),
        username: values.username || null,
        email: values.email || null,
        encrypted_password: values.encrypted_password || null,
        notes: values.notes || null,
      };
      if (values.id) {
        const { error } = await supabase.from("user_credentials").update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_credentials").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_credentials"] });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      toast.success(editing ? "Credential updated" : "Credential added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_credentials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_credentials"] });
      toast.success("Credential deleted");
    },
  });

  const filtered = credentials.filter(
    (c) =>
      c.service_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.username || "").toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (c: Credential) => {
    setEditing(c);
    setForm({
      service_name: c.service_name,
      service_url: c.service_url || "",
      username: c.username || "",
      email: c.email || "",
      encrypted_password: c.encrypted_password || "",
      notes: c.notes || "",
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search credentials…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" /> Add Account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Credential</DialogTitle></DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                upsert.mutate({ ...form, id: editing?.id });
              }}
              className="space-y-3"
            >
              <div><Label>Service Name *</Label><Input required value={form.service_name} onChange={(e) => setForm((f) => ({ ...f, service_name: e.target.value }))} placeholder="e.g. Gmail, Stripe" /></div>
              <div><Label>Service URL</Label><Input value={form.service_url} onChange={(e) => setForm((f) => ({ ...f, service_url: e.target.value }))} placeholder="https://mail.google.com" /></div>
              <div><Label>Username</Label><Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
              <div><Label>Password</Label><Input type="password" value={form.encrypted_password} onChange={(e) => setForm((f) => ({ ...f, encrypted_password: e.target.value }))} /></div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
              <Button type="submit" disabled={upsert.isPending} className="w-full">{editing ? "Update" : "Save"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground text-center py-8">Loading…</div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <KeyRound className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">No credentials stored yet. Click "Add Account" to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="group relative">
              <CardHeader className="pb-2 flex-row items-center gap-3">
                <img
                  src={c.service_logo_url || getLogoUrl(c.service_url, c.service_name)}
                  alt=""
                  className="h-8 w-8 rounded"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.service_name)}&size=64&background=6366f1&color=fff`; }}
                />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm truncate">{c.service_name}</CardTitle>
                  {c.service_url && (
                    <a href={c.service_url.startsWith("http") ? c.service_url : `https://${c.service_url}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Visit
                    </a>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-xs">
                {c.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <div className="flex items-center gap-1">
                      <span className="truncate max-w-[160px]">{c.email}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyToClipboard(c.email!, "Email")}><Copy className="h-3 w-3" /></Button>
                    </div>
                  </div>
                )}
                {c.username && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Username:</span>
                    <div className="flex items-center gap-1">
                      <span className="truncate max-w-[160px]">{c.username}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyToClipboard(c.username!, "Username")}><Copy className="h-3 w-3" /></Button>
                    </div>
                  </div>
                )}
                {c.encrypted_password && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Password:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono">{showPasswords[c.id] ? c.encrypted_password : "••••••••"}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowPasswords((p) => ({ ...p, [c.id]: !p[c.id] }))}>
                        {showPasswords[c.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyToClipboard(c.encrypted_password!, "Password")}><Copy className="h-3 w-3" /></Button>
                    </div>
                  </div>
                )}
                {c.notes && <p className="text-muted-foreground pt-1 border-t">{c.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
