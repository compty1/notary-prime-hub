import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

type UploadedDoc = {
  file: File;
  status: "pending" | "validating" | "valid" | "invalid";
  error?: string;
};

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE_MB = 25;

interface DocumentUploadValidatorProps {
  onValidFiles?: (files: File[]) => void;
  maxFiles?: number;
}

export function DocumentUploadValidator({ onValidFiles, maxFiles = 10 }: DocumentUploadValidatorProps) {
  const [docs, setDocs] = useState<UploadedDoc[]>([]);

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: `Unsupported type: ${file.type.split("/")[1] || "unknown"}` };
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return { valid: false, error: `File exceeds ${MAX_SIZE_MB}MB limit` };
    }
    if (file.name.length > 255) {
      return { valid: false, error: "Filename too long (max 255 chars)" };
    }
    return { valid: true };
  }, []);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList).slice(0, maxFiles - docs.length);

    const newDocs: UploadedDoc[] = files.map(file => {
      const result = validateFile(file);
      return {
        file,
        status: result.valid ? "valid" : "invalid",
        error: result.error,
      };
    });

    const updated = [...docs, ...newDocs];
    setDocs(updated);

    const validFiles = updated.filter(d => d.status === "valid").map(d => d.file);
    onValidFiles?.(validFiles);

    const invalidCount = newDocs.filter(d => d.status === "invalid").length;
    if (invalidCount > 0) {
      toast.warning(`${invalidCount} file(s) failed validation`);
    }
  }, [docs, maxFiles, validateFile, onValidFiles]);

  const removeDoc = (index: number) => {
    const updated = docs.filter((_, i) => i !== index);
    setDocs(updated);
    onValidFiles?.(updated.filter(d => d.status === "valid").map(d => d.file));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm"><Upload className="h-4 w-4" /> Document Upload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Drop files or click to upload</span>
          <span className="text-[10px] text-muted-foreground">PDF, JPEG, PNG, TIFF, DOC/DOCX • Max {MAX_SIZE_MB}MB</span>
          <input
            type="file"
            multiple
            accept={ALLOWED_TYPES.join(",")}
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
        </label>

        {docs.length > 0 && (
          <div className="space-y-2">
            {docs.map((doc, i) => (
              <div key={i} className={`flex items-center gap-2 p-2 rounded border text-sm ${
                doc.status === "invalid" ? "border-red-500/30 bg-red-500/5" : "border-green-500/30 bg-green-500/5"
              }`}>
                {doc.status === "valid" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                )}
                <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{doc.file.name}</span>
                <span className="text-[10px] text-muted-foreground">{(doc.file.size / 1024 / 1024).toFixed(1)}MB</span>
                {doc.error && <span className="text-[10px] text-red-500">{doc.error}</span>}
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => removeDoc(i)}>×</Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{docs.filter(d => d.status === "valid").length} valid / {docs.length} total</span>
          <span>Max {maxFiles} files</span>
        </div>
      </CardContent>
    </Card>
  );
}
