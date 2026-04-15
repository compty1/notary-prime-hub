/**
 * Reusable file upload component for Design Studio
 * Uploads to design-assets bucket with user-scoped folders
 */
import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { validateFile, ALLOWED_IMAGE_MIMES } from "@/lib/fileValidation";

const DESIGN_MIMES = new Set([
  ...ALLOWED_IMAGE_MIMES,
  "image/svg+xml",
  "application/pdf",
]);

const MAX_DESIGN_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface DesignFileUploadProps {
  onUpload: (url: string, fileName: string) => void;
  currentUrl?: string;
  onRemove?: () => void;
  accept?: string;
  label?: string;
  className?: string;
}

export function DesignFileUpload({
  onUpload,
  currentUrl,
  onRemove,
  accept = ".png,.jpg,.jpeg,.svg,.pdf,.webp",
  label = "Upload Logo/Artwork",
  className = "",
}: DesignFileUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!user) {
        toast.error("Please sign in to upload files");
        return;
      }

      const err = validateFile(file, {
        allowedMimes: DESIGN_MIMES,
        maxBytes: MAX_DESIGN_FILE_SIZE,
      });
      if (err) {
        toast.error(err);
        return;
      }

      setUploading(true);
      try {
        const ext = file.name.split(".").pop() || "png";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("design-assets")
          .upload(path, file, { upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = await supabase.storage
          .from("design-assets")
          .createSignedUrl(path, 3600);

        if (urlData?.signedUrl) {
          onUpload(urlData.signedUrl, file.name);
          toast.success("File uploaded successfully");
        }
      } catch (e: any) {
        toast.error(e.message || "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [user, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFile]
  );

  if (currentUrl) {
    return (
      <div className={`relative group ${className}`}>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
          <ImageIcon className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm text-foreground truncate flex-1">Artwork uploaded</span>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors
          ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <Upload className="h-5 w-5 text-muted-foreground" />
        )}
        <span className="text-sm text-muted-foreground">
          {uploading ? "Uploading..." : label}
        </span>
      </div>
    </div>
  );
}
