import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Lock, Unlock, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentLockProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLocked: boolean;
  onToggleLock: (locked: boolean, password?: string) => void;
}

export function DocuDexDocumentLock({ open, onOpenChange, isLocked, onToggleLock }: DocumentLockProps) {
  const { toast } = useToast();
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [unlockPassword, setUnlockPassword] = useState("");

  const handleLock = () => {
    onToggleLock(true, usePassword ? password : undefined);
    toast({ title: "Document locked", description: "Editing is now disabled." });
    onOpenChange(false);
  };

  const handleUnlock = () => {
    onToggleLock(false);
    toast({ title: "Document unlocked", description: "Editing is now enabled." });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isLocked ? <Lock className="h-5 w-5 text-destructive" /> : <Unlock className="h-5 w-5" />}
            {isLocked ? "Unlock Document" : "Lock Document"}
          </DialogTitle>
        </DialogHeader>

        {isLocked ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">This document is currently locked. Unlock it to resume editing.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleUnlock}><Unlock className="h-4 w-4 mr-2" /> Unlock</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Locking prevents accidental edits. The document becomes read-only.</p>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Password protect</Label>
              <Switch checked={usePassword} onCheckedChange={setUsePassword} />
            </div>
            {usePassword && (
              <div>
                <Label className="text-xs">Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="Enter lock password" />
              </div>
            )}
            <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Locked documents show a lock icon and disable all editing controls.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleLock}><Lock className="h-4 w-4 mr-2" /> Lock Document</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
