import React, { useState, useCallback } from "react";
import { FileCheck, Upload, History, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import EnterpriseLayout from "@/components/enterprise/EnterpriseLayout";
import { validateFile, ALLOWED_DOCUMENT_MIMES } from "@/lib/fileValidation";

const AIGrader = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);

  const { data: history, refetch } = useQuery({
    queryKey: ["ai-grades", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("ai_document_grades").select("*").order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
    enabled: !!user,
  });

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      const err = validateFile(f, { allowedMimes: new Set(["application/pdf"]), maxBytes: 10 * 1024 * 1024 });
      if (err) { toast.error(err); return; }
      setFile(f);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const err = validateFile(f, { allowedMimes: new Set(["application/pdf"]), maxBytes: 10 * 1024 * 1024 });
      if (err) { toast.error(err); return; }
      setFile(f);
    }
  };

  const handleGrade = async () => {
    if (!file || !user) return;
    setGrading(true);
    try {
      // Extract text - send as base64 for the AI to process
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let text = "";
      // Simple text extraction from PDF bytes
      const decoder = new TextDecoder("utf-8", { fatal: false });
      text = decoder.decode(bytes).replace(/[^\x20-\x7E\n\r\t]/g, " ").substring(0, 15000);

      if (text.trim().length < 50) {
        text = `[PDF document: ${file.name}, size: ${(file.size / 1024).toFixed(1)}KB. Unable to extract full text client-side. Please analyze based on available content.]`;
      }

      const { data, error } = await supabase.functions.invoke("analyze-document", {
        body: { text, document_name: file.name, document_type: "pdf" },
      });

      if (error) throw error;
      setResult(data);
      refetch();
      toast.success("Document graded successfully");
    } catch (err: any) {
      toast.error(err.message || "Grading failed");
    } finally {
      setGrading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 80) return "text-info";
    if (score >= 70) return "text-warning";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getSeverityVariant = (sev: string): "default" | "secondary" | "destructive" | "outline" => {
    if (sev === "High") return "destructive";
    if (sev === "Medium") return "default";
    return "secondary";
  };

  return (
    <EnterpriseLayout title="AI Document Grader" icon={FileCheck} description="AI-powered compliance analysis against Ohio ORC §147 standards">
      <Tabs defaultValue="grade">
        <TabsList>
          <TabsTrigger value="grade"><Upload className="mr-1.5 h-3.5 w-3.5" />Grade Document</TabsTrigger>
          <TabsTrigger value="history"><History className="mr-1.5 h-3.5 w-3.5" />Grade History</TabsTrigger>
        </TabsList>

        <TabsContent value="grade" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Upload */}
            <Card className="border-dashed">
              <CardContent className="p-6">
                <div
                  className={`flex flex-col items-center justify-center rounded-[16px] border-2 border-dashed p-12 transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/20"}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                >
                  <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
                  <p className="mb-2 text-sm font-semibold">Drop PDF here or click to upload</p>
                  <p className="text-xs text-muted-foreground">Max 10MB • PDF only</p>
                  <input type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" id="grader-upload" />
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => document.getElementById("grader-upload")?.click()}>
                    Choose File
                  </Button>
                </div>
                {file && (
                  <div className="mt-4 flex items-center justify-between rounded-[12px] bg-muted p-3">
                    <span className="text-sm font-medium truncate">{file.name}</span>
                    <Button onClick={handleGrade} disabled={grading} variant="dark" size="sm">
                      {grading ? "Analyzing..." : "Grade Document"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Score */}
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-black">Compliance Score</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <div className="relative flex h-40 w-40 items-center justify-center">
                    <svg className="h-40 w-40 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" className="text-muted" strokeWidth="10" />
                      <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" className={getScoreColor(result.overall_score)} strokeWidth="10" strokeDasharray={`${(result.overall_score / 100) * 314} 314`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className={`text-4xl font-black ${getScoreColor(result.overall_score)}`}>{result.overall_score}</span>
                      <span className="text-2xl font-black text-muted-foreground">{result.grade_letter}</span>
                    </div>
                  </div>
                  {result.summary && <p className="text-center text-sm text-muted-foreground">{result.summary}</p>}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Findings */}
          {result?.findings?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />Findings ({result.findings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Recommendation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.findings.map((f: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="capitalize font-medium">{f.category?.replace(/_/g, " ")}</TableCell>
                        <TableCell>{f.issue}</TableCell>
                        <TableCell><Badge variant={getSeverityVariant(f.severity)}>{f.severity}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{f.recommendation}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-6">
              {history?.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">No grading history yet. Upload a document to get started.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Findings</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history?.map((g: any) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">{g.document_name}</TableCell>
                        <TableCell><span className={`font-black ${getScoreColor(g.overall_score)}`}>{g.overall_score}</span></TableCell>
                        <TableCell><Badge variant="outline">{g.grade_letter}</Badge></TableCell>
                        <TableCell>{(g.findings as any[])?.length || 0}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(g.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </EnterpriseLayout>
  );
};

export default AIGrader;
