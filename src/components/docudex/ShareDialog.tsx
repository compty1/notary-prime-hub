/**
 * P4-002: Share dialog for document RBAC
 */
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { DocPermission, DocShare } from "@/hooks/useDocumentPermissions";
import { Users, Send, Trash2, Shield } from "lucide-react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shares: DocShare[];
  onShare: (email: string, permission: DocPermission) => void;
  onRevoke: (shareId: string) => void;
}

const PERMISSION_LABELS: Record<DocPermission, string> = {
  owner: "Owner",
  editor: "Can edit",
  commenter: "Can comment",
  viewer: "Can view",
};

export function ShareDialog({ open, onOpenChange, shares, onShare, onRevoke }: ShareDialogProps) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<DocPermission>("viewer");

  const handleShare = () => {
    if (!email.trim()) return;
    onShare(email.trim(), permission);
    setEmail("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" /> Share Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address..."
              className="flex-1"
              onKeyDown={e => e.key === "Enter" && handleShare()}
            />
            <Select value={permission} onValueChange={v => setPermission(v as DocPermission)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Can edit</SelectItem>
                <SelectItem value="commenter">Can comment</SelectItem>
                <SelectItem value="viewer">Can view</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleShare} disabled={!email.trim()} size="icon" aria-label="Action">
              <Send className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">People with access</Label>
            {shares.length === 0 && (
              <p className="text-xs text-muted-foreground py-3 text-center">
                Only you have access
              </p>
            )}
            {shares.map(s => (
              <div key={s.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm">{s.shared_with_email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px]">
                    {PERMISSION_LABELS[s.permission as DocPermission] || s.permission}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => onRevoke(s.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
