import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, FileText, Type, Hash } from "lucide-react";

interface StatusBarProps {
  words: number;
  chars: number;
  readingTime: number;
  readability: number;
  pageCount: number;
  activePageIdx: number;
  cursorLine: number;
  cursorCol: number;
  wordCountGoal: number | null;
  isDirty: boolean;
  lastSaved: string | null;
}

export function DocuDexStatusBar({
  words, chars, readingTime, readability, pageCount, activePageIdx,
  cursorLine, cursorCol, wordCountGoal, isDirty, lastSaved,
}: StatusBarProps) {
  const goalProgress = wordCountGoal ? Math.min(100, Math.round((words / wordCountGoal) * 100)) : null;

  return (
    <div className="flex items-center gap-3 px-3 py-1 bg-muted/50 border-t text-[10px] text-muted-foreground select-none flex-wrap">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center gap-1"><Type className="h-3 w-3" /> {words} words</span>
        </TooltipTrigger>
        <TooltipContent>Word count</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> {chars.toLocaleString()} chars</span>
        </TooltipTrigger>
        <TooltipContent>Character count</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {readingTime} min read</span>
        </TooltipTrigger>
        <TooltipContent>Estimated reading time</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <span>Readability: {readability}/100</span>
        </TooltipTrigger>
        <TooltipContent>Flesch-Kincaid readability score</TooltipContent>
      </Tooltip>

      <span className="flex items-center gap-1">
        <FileText className="h-3 w-3" /> Page {activePageIdx + 1}/{pageCount}
      </span>

      <span>Ln {cursorLine}, Col {cursorCol}</span>

      {goalProgress !== null && (
        <Badge variant={goalProgress >= 100 ? "default" : "outline"} className="text-[9px] h-4">
          Goal: {goalProgress}%
        </Badge>
      )}

      <span className="ml-auto">
        {isDirty ? "● Unsaved" : lastSaved ? `Saved ${lastSaved}` : "Ready"}
      </span>
    </div>
  );
}
