import { usePageMeta } from "@/hooks/usePageMeta";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FileText, ExternalLink, Printer, BookOpen, Upload, Download, Trash2, Loader2, FolderOpen, Search } from "lucide-react";

const ohioForms = [
  {
    category: "Notary Commission",
    forms: [
      { title: "Application for Notary Public Commission", url: "https://notary.ohiosos.gov/", desc: "Initial application to become a notary public in Ohio" },
      { title: "Notary Public Renewal Application", url: "https://notary.ohiosos.gov/", desc: "Renewal of existing notary commission" },
      { title: "Change of Name/Address Form", url: "https://notary.ohiosos.gov/", desc: "Update personal information on your commission" },
    ],
  },
  {
    category: "Notarial Certificates",
    forms: [
      { title: "Acknowledgment Certificate (Individual)", url: "https://www.ohiosos.gov/notary/information/", desc: "Standard acknowledgment for individuals appearing before a notary (ORC §147.55)" },
      { title: "Jurat Certificate", url: "https://www.ohiosos.gov/notary/information/", desc: "Certificate for sworn statements / affidavits (ORC §147.53)" },
      { title: "Copy Certification Certificate", url: "https://www.ohiosos.gov/notary/information/", desc: "For certifying copies of documents (not vital records)" },
      { title: "Signature Witnessing Certificate", url: "https://www.ohiosos.gov/notary/information/", desc: "Certificate for witnessing a signature" },
    ],
  },
  {
    category: "RON (Remote Online Notarization)",
    forms: [
      { title: "RON Commission Application", url: "https://notary.ohiosos.gov/", desc: "Apply for authorization to perform remote online notarization" },
      { title: "RON Technology Provider Registration", url: "https://www.ohiosos.gov/notary/", desc: "Register your RON platform with Ohio SOS" },
    ],
  },
];

const notarialCertTemplates = [
  {
    title: "Acknowledgment (Individual)",
    content: `State of Ohio, County of ___________

On this ___ day of _________, 20___, before me, the undersigned notary public, personally appeared _________________________, proved to me through satisfactory evidence of identification to be the person(s) whose name(s) is/are subscribed to the within instrument, and acknowledged to me that he/she/they executed the same for the purposes therein contained.

IN WITNESS WHEREOF, I have hereunto set my hand and official seal.

_________________________
Notary Public, State of Ohio
My Commission Expires: ___________`,
  },
  {
    title: "Acknowledgment (Representative)",
    content: `State of Ohio, County of ___________

On this ___ day of _________, 20___, before me, the undersigned notary public, personally appeared _________________________, proved to me through satisfactory evidence of identification to be the person(s) whose name(s) is/are subscribed to the within instrument, and acknowledged to me that he/she/they executed the same in his/her/their authorized capacity(ies) as _____________ of _________________________ and that by his/her/their signature(s) on the instrument, the person(s), or the entity upon behalf of which the person(s) acted, executed the instrument.

_________________________
Notary Public, State of Ohio
My Commission Expires: ___________`,
  },
  {
    title: "Jurat",
    content: `State of Ohio, County of ___________

Subscribed and sworn to (or affirmed) before me this ___ day of _________, 20___, by _________________________, proved to me on the basis of satisfactory evidence of identification to be the person(s) who appeared before me.

_________________________
Notary Public, State of Ohio
My Commission Expires: ___________`,
  },
  {
    title: "Copy Certification",
    content: `State of Ohio, County of ___________

I certify that the attached is a true, exact, and unaltered copy of _________________________ presented to me by the document's custodian, _________________________, on this ___ day of _________, 20___.

_________________________
Notary Public, State of Ohio
My Commission Expires: ___________`,
  },
];

const FORM_CATEGORIES = ["Notarial Certificates", "Client Forms", "Business Forms", "Legal Templates", "Immigration", "Real Estate", "General"];

export default function AdminTemplates() {
  usePageMeta({ title: "Templates", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [libraryForms, setLibraryForms] = useState<any[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("General");
  const [uploadTitle, setUploadTitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const fetchLibrary = async () => {
    setLoadingLibrary(true);
    const { data } = await supabase.from("form_library").select("*").order("created_at", { ascending: false });
    if (data) setLibraryForms(data);
    setLoadingLibrary(false);
  };

  useEffect(() => { fetchLibrary(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 20MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const filePath = `form_library/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("documents").upload(filePath, file);
    if (uploadErr) {
      toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { error: insertErr } = await supabase.from("form_library").insert({
      title: uploadTitle || file.name.replace(/\.[^.]+$/, ""),
      category: uploadCategory,
      file_path: filePath,
      file_name: file.name,
      uploaded_by: user.id,
    });
    if (insertErr) {
      toast({ title: "Error", description: insertErr.message, variant: "destructive" });
    } else {
      toast({ title: "Form uploaded" });
      setUploadTitle("");
      fetchLibrary();
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadForm = async (form: any) => {
    const { data, error } = await supabase.storage.from("documents").download(form.file_path);
    if (error) { toast({ title: "Download failed", variant: "destructive" }); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url; a.download = form.file_name; a.click();
    URL.revokeObjectURL(url);
  };

  const deleteForm = async (form: any) => {
    if (!confirm(`Delete "${form.title}"?`)) return;
    await supabase.storage.from("documents").remove([form.file_path]);
    await supabase.from("form_library").delete().eq("id", form.id);
    toast({ title: "Form deleted" });
    fetchLibrary();
  };

  const filteredLibrary = libraryForms.filter(f => {
    if (filterCategory !== "all" && f.category !== filterCategory) return false;
    if (searchTerm && !f.title.toLowerCase().includes(searchTerm.toLowerCase()) && !f.file_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-sans text-2xl font-bold text-foreground">Templates & Forms Library</h1>
        <p className="text-sm text-muted-foreground">Ohio notary forms, certificates, and your custom form library</p>
      </div>

      <Tabs defaultValue="ohio-forms" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ohio-forms"><FileText className="mr-1 h-4 w-4" /> Ohio Forms</TabsTrigger>
          <TabsTrigger value="certificates"><BookOpen className="mr-1 h-4 w-4" /> Notarial Certificates</TabsTrigger>
          <TabsTrigger value="library"><FolderOpen className="mr-1 h-4 w-4" /> My Forms Library</TabsTrigger>
        </TabsList>

        <TabsContent value="ohio-forms" className="space-y-6">
          {ohioForms.map((cat) => (
            <div key={cat.category}>
              <h2 className="font-sans text-lg font-semibold mb-3">{cat.category}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {cat.forms.map((form) => (
                  <Card key={form.title} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{form.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{form.desc}</p>
                        </div>
                        <a href={form.url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline"><ExternalLink className="h-3 w-3 mr-1" /> Open</Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">Standard Ohio notarial certificate templates. Click "Print" to print on blank certificate paper.</p>
          {notarialCertTemplates.map((cert) => (
            <Card key={cert.title} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-sans font-semibold">{cert.title}</h3>
                  <Button size="sm" variant="outline" onClick={() => {
                    const w = window.open("", "_blank");
                    if (w) {
                      w.document.write(`<html><head><title>${cert.title}</title><style>body{font-family:serif;padding:2rem;line-height:2;white-space:pre-wrap;max-width:700px;margin:0 auto}</style></head><body>${cert.content.replace(/\n/g, "<br/>")}</body></html>`);
                      w.document.close();
                      w.print();
                    }
                  }}><Printer className="h-3 w-3 mr-1" /> Print</Button>
                </div>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-serif bg-muted/50 rounded-lg p-3">{cert.content}</pre>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          {/* Upload section */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-sans text-sm font-semibold">Upload New Form</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Title</Label>
                  <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Form title..." />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FORM_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.tiff" className="hidden" onChange={handleUpload} />
                  <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="">
                    {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
                    Upload
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search & filter */}
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search forms..." className="pl-9" />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {FORM_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Forms list */}
          {loadingLibrary ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : filteredLibrary.length === 0 ? (
            <Card className="border-border/50"><CardContent className="py-8 text-center text-muted-foreground">
              <FolderOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              No forms in library. Upload your first form above.
            </CardContent></Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredLibrary.map(form => (
                <Card key={form.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{form.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{form.file_name}</p>
                        <Badge variant="outline" className="text-xs mt-1">{form.category}</Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => downloadForm(form)}><Download className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                          const w = window.open("", "_blank");
                          if (w) {
                            w.document.write(`<html><head><title>${form.title}</title></head><body><p>Printing: ${form.title}</p><p>File: ${form.file_name}</p></body></html>`);
                            w.document.close();
                            w.print();
                          }
                        }}><Printer className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteForm(form)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
