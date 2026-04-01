import { usePageTitle } from "@/lib/usePageTitle";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import { Upload, Camera, FileText, CheckCircle, Loader2, LogOut, RefreshCw } from "lucide-react";

export default function MobileUpload() {
  usePageTitle("Mobile Upload");
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Login state for unauthenticated users
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const fetchDocuments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("uploaded_by", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setDocuments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchDocuments();
    else setLoading(false);
  }, [user]);

  // Realtime subscription for live updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("mobile-docs")
      .on("postgres_changes", { event: "*", schema: "public", table: "documents", filter: `uploaded_by=eq.${user.id}` }, () => {
        fetchDocuments();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
    setLoginLoading(false);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || !user) return;
    setUploading(true);
    let successCount = 0;

    for (const file of Array.from(files)) {
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
      if (uploadError) {
        toast({ title: "Upload failed", description: `${file.name}: ${uploadError.message}`, variant: "destructive" });
        continue;
      }

      const { error: dbError } = await supabase.from("documents").insert({
        file_name: file.name,
        file_path: filePath,
        uploaded_by: user.id,
        status: "uploaded",
      });

      if (dbError) {
        toast({ title: "Error saving", description: dbError.message, variant: "destructive" });
      } else {
        successCount++;
      }
    }

    if (successCount > 0) {
      toast({ title: "Uploaded", description: `${successCount} document${successCount > 1 ? "s" : ""} uploaded successfully` });
      fetchDocuments();
    }
    setUploading(false);
  };

  // Unauthenticated view
  if (!user) {
    return (
      <main aria-label="Mobile Upload Login" className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Logo size="lg" showText subtitle="Mobile Upload" className="mb-8" />
        <Card className="w-full max-w-sm border-border/50">
          <CardHeader>
            <CardTitle className="font-sans text-lg text-center">Sign In to Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-accent/90" disabled={loginLoading}>
                {loginLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/portal" className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="font-sans text-sm font-bold text-foreground">Mobile Upload</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Upload Actions */}
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground text-center">Upload documents or take a photo</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-6 w-6 text-primary" />
                <span className="text-xs">Choose File</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploading}
              >
                <Camera className="h-6 w-6 text-primary" />
                <span className="text-xs">Take Photo</span>
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              multiple
              onChange={(e) => handleUpload(e.target.files)}
            />
            <input
              ref={cameraInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleUpload(e.target.files)}
            />

            {uploading && (
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Uploading...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-sans text-base flex items-center justify-between">
              Recent Uploads
              <Button variant="ghost" size="sm" onClick={fetchDocuments}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : documents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded yet</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString()} • {new Date(doc.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {doc.status === "uploaded" ? (
                        <><CheckCircle className="mr-1 h-3 w-3 text-primary" /> Uploaded</>
                      ) : doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
