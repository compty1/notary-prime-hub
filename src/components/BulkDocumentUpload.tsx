import React, { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle, XCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ACCEPTED_EXTENSIONS = ".pdf,.jpg,.jpeg,.png,.tiff,.doc,.docx";
const MAX_FILE_SIZE = 20 * 1024 * 1024;

interface Props {
  userId: string;
  onComplete?: () => void;
}

interface FileStatus {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export default function BulkDocumentUpload({ userId, onComplete }: Props) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).map((file) => ({
      file,
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...arr]);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadAll = async () => {
    if (files.length === 0) return;
    setUploading(true);
    let completed = 0;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.status === "done") { completed++; continue; }

      setFiles((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: "uploading" } : item))
      );

      if (f.file.size > MAX_FILE_SIZE) {
        setFiles((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: "error", error: "Exceeds 20MB" } : item
          )
        );
        continue;
      }

      const path = `${userId}/${Date.now()}_${f.file.name}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, f.file);

      if (upErr) {
        setFiles((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: "error", error: upErr.message } : item
          )
        );
        continue;
      }

      const { error: dbErr } = await supabase.from("documents").insert({
        uploaded_by: userId,
        file_name: f.file.name,
        file_path: path,
        status: "uploaded" as any,
      });

      if (dbErr) {
        setFiles((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: "error", error: dbErr.message } : item
          )
        );
      } else {
        setFiles((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, status: "done" } : item))
        );
        completed++;
      }

      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    toast({
      title: "Bulk upload complete",
      description: `${completed}/${files.length} files uploaded successfully.`,
    });
    setUploading(false);
    onComplete?.();
  };

  return (
    <div className="space-y-4">
      <div
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          Drag & drop multiple files here
        </p>
        <p className="mb-3 text-xs text-muted-foreground">
          PDF, JPG, PNG, TIFF, DOC, DOCX — max 20MB each
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          Browse Files
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS}
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {files.length} file(s) queued
            </span>
            <Button size="sm" onClick={uploadAll} disabled={uploading}>
              {uploading ? "Uploading…" : "Upload All"}
            </Button>
          </div>

          {uploading && <Progress value={progress} className="h-2" />}

          <div className="max-h-48 space-y-1 overflow-y-auto">
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm"
              >
                {f.status === "done" ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : f.status === "error" ? (
                  <XCircle className="h-4 w-4 text-destructive" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="flex-1 truncate">{f.file.name}</span>
                {f.error && (
                  <span className="text-xs text-destructive">{f.error}</span>
                )}
                {!uploading && f.status !== "done" && (
                  <button
                    onClick={() => removeFile(i)}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
