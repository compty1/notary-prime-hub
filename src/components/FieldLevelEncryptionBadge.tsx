import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock, ShieldCheck } from "lucide-react";

interface FieldLevelEncryptionBadgeProps {
  fieldName: string;
  encrypted?: boolean;
  className?: string;
}

export function FieldLevelEncryptionBadge({ fieldName, encrypted = true, className }: FieldLevelEncryptionBadgeProps) {
  if (!encrypted) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={`text-[10px] gap-1 cursor-help ${className}`}>
          <Lock className="h-3 w-3" /> Encrypted
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex items-center gap-2 text-xs">
          <ShieldCheck className="h-4 w-4 text-green-500" />
          <span>"{fieldName}" is encrypted at rest (AES-256-GCM)</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
