import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, CheckCircle, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export interface Comment {
  id: string;
  text: string;
  author: string;
  authorId: string;
  timestamp: string;
  resolved: boolean;
  selectedText?: string;
  pageIndex: number;
}

interface Props {
  comments: Comment[];
  onAddComment: (comment: Omit<Comment, "id" | "timestamp">) => void;
  onResolveComment: (id: string) => void;
  onDeleteComment: (id: string) => void;
  currentPage: number;
}

export function DocuDexInlineComments({ comments, onAddComment, onResolveComment, onDeleteComment, currentPage }: Props) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  const pageComments = comments.filter(c => c.pageIndex === currentPage && (showResolved || !c.resolved));

  const handleAdd = () => {
    if (!newComment.trim() || !user) return;
    onAddComment({
      text: newComment.trim(),
      author: user.email || "Unknown",
      authorId: user.id,
      resolved: false,
      pageIndex: currentPage,
    });
    setNewComment("");
  };

  return (
    <div className="border-l border-border bg-card w-64 flex flex-col">
      <div className="p-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" /> Comments
          <Badge variant="secondary" className="text-[10px] h-4">{pageComments.length}</Badge>
        </span>
        <Button variant="ghost" size="sm" className="h-5 text-[10px]" onClick={() => setShowResolved(!showResolved)}>
          {showResolved ? "Hide" : "Show"} resolved
        </Button>
      </div>

      <ScrollArea className="flex-1 p-2">
        {pageComments.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No comments on this page</p>
        )}
        {pageComments.map(c => (
          <div key={c.id} className={`mb-2 p-2 rounded border text-xs ${c.resolved ? "opacity-50 bg-muted/30" : "bg-background"}`}>
            {c.selectedText && (
              <div className="bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded text-[10px] mb-1 italic truncate">
                "{c.selectedText}"
              </div>
            )}
            <p className="mb-1">{c.text}</p>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px]">{c.author.split("@")[0]}</span>
              <div className="flex gap-0.5">
                {!c.resolved && (
                  <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => onResolveComment(c.id)} title="Resolve">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => onDeleteComment(c.id)} title="Delete">
                  <X className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>

      <div className="p-2 border-t border-border flex gap-1">
        <Input className="h-7 text-xs" placeholder="Add comment..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} />
        <Button size="sm" className="h-7 w-7 p-0 shrink-0" onClick={handleAdd} disabled={!newComment.trim()}>
          <Send className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
