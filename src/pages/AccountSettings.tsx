import { useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Shield, Trash2, Download, Key, Eye, EyeOff } from "lucide-react";

export default function AccountSettings() {
  usePageTitle("Account Settings");
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Minimum 8 characters.", variant: "destructive" });
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast({ title: "Weak password", description: "Must contain uppercase and number.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Password updated" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [profile, appointments, documents, payments, reviews] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("appointments").select("*").eq("client_id", user.id),
        supabase.from("documents").select("id, file_name, status, created_at").eq("uploaded_by", user.id),
        supabase.from("payments").select("*").eq("client_id", user.id),
        supabase.from("reviews").select("*").eq("client_id", user.id),
      ]);
      const exportData = {
        exported_at: new Date().toISOString(),
        profile: profile.data,
        appointments: appointments.data,
        documents: documents.data,
        payments: payments.data,
        reviews: reviews.data,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "my-data-export.json"; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Data exported" });
    } catch { toast({ title: "Export failed", variant: "destructive" }); }
    setExporting(false);
  };

  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState("");

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!deletePassword) {
      setDeletePasswordError("Please enter your password to confirm.");
      return;
    }
    setDeleting(true);
    setDeletePasswordError("");
    // Re-authenticate
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: user.email!, password: deletePassword });
    if (authErr) {
      setDeletePasswordError("Incorrect password. Please try again.");
      setDeleting(false);
      return;
    }
    try {
      // Cascade delete: reminders, reviews, messages, documents, appointments, profile, roles
      await supabase.from("document_reminders").delete().eq("user_id", user.id);
      await supabase.from("reviews").delete().eq("client_id", user.id);
      await supabase.from("chat_messages").delete().eq("sender_id", user.id);
      await supabase.from("documents").delete().eq("uploaded_by", user.id);
      await supabase.from("appointments").delete().eq("client_id", user.id);
      await supabase.from("user_roles").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("user_id", user.id);
      toast({ title: "Account data deleted", description: "Signing you out..." });
      setTimeout(() => signOut(), 1500);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setDeleting(false);
  };

  return (
    <PageShell>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Breadcrumbs />
        <h1 className="mt-4 mb-8 font-sans text-3xl font-bold text-foreground">Account Settings</h1>

        {/* Change Password */}
        <Card className="mb-6 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Key className="h-5 w-5 text-primary" /> Change Password</CardTitle>
            <CardDescription>Update your login password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input id="newPassword" type={showPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Min 8 chars, 1 uppercase, 1 number</p>
              </div>
              <div>
                <Label htmlFor="confirmPw">Confirm New Password</Label>
                <Input id="confirmPw" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              </div>
              <Button type="submit" disabled={changingPassword}>{changingPassword ? "Updating..." : "Update Password"}</Button>
            </form>
          </CardContent>
        </Card>

        {/* Export Data */}
        <Card className="mb-6 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Download className="h-5 w-5 text-primary" /> Export My Data</CardTitle>
            <CardDescription>Download all your data as JSON</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleExportData} disabled={exporting}>{exporting ? "Exporting..." : "Download Data"}</Button>
          </CardContent>
        </Card>

        {/* Delete Account */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-destructive"><Trash2 className="h-5 w-5" /> Delete Account</CardTitle>
            <CardDescription>Permanently delete your account and all associated data</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete My Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete your profile, appointments, documents, payments, and all associated data. This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="px-6 pb-2">
                  <Label htmlFor="deletePassword">Enter your password to confirm</Label>
                  <Input id="deletePassword" type="password" value={deletePassword} onChange={e => { setDeletePassword(e.target.value); setDeletePasswordError(""); }} placeholder="Your current password" className="mt-1" />
                  {deletePasswordError && <p className="mt-1 text-xs text-destructive">{deletePasswordError}</p>}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {deleting ? "Deleting..." : "Yes, Delete Everything"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
