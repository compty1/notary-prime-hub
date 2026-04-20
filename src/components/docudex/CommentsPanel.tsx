/**
 * P4-007: Threaded comments with resolve/unresolve
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEditorStore } from "@/stores/editorStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MessageSquare, Send, CheckCircle, Circle, X } from "lucide-react";

interface Comment {
  id: string;
  document_id: string;
  user_id: string;
  content: string;
  page_index: number;
  position: { x: number; y: number } | null;
  resolved: boolean;
  created_at: string;
}

interface CommentsPanelProps {
  documentId: string | null;
  className?: string;
}

export function CommentsPanel({ documentId, className }: CommentsPanelProps) {
  const { user } = useAuth();
  const { activePageId, pages } = useEditorStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  const activePageIndex = pages.findIndex(p => p.id === activePageId);

  const fetchComments = useCallback(async () => {
    if (!documentId) return;
    const { data } = await supabase
      .from("docudex_comments")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false });

    if (data) setComments(data as Comment[]);
  }, [documentId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async () => {
    if (!documentId || !user || !newComment.trim()) return;

    await supabase.from("docudex_comments").insert({
      document_id: documentId,
      user_id: user.id,
      content: newComment.trim(),
      page_index: activePageIndex >= 0 ? activePageIndex : 0,
    });

    setNewComment("");
    fetchComments();
  };

  const toggleResolved = async (commentId: string, currentResolved: boolean) => {
    await supabase
      .from("docudex_comments")
      .update({ resolved: !currentResolved })
      .eq("id", commentId);
    fetchComments();
  };

  const filtered = comments.filter(c =>
    showResolved ? true : !c.resolved
  );

  const pageComments = filtered.filter(c => c.page_index === activePageIndex);
  const otherComments = filtered.filter(c => c.page_index !== activePageIndex);

  return (
    <div className={cn("w-72 border-l border-border bg-card flex flex-col", className)}>
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" /> Comments
        </h3>
        <Badge
          variant={showResolved ? "default" : "outline"}
          className="text-[10px] cursor-pointer"
          onClick={() => setShowResolved(!showResolved)}
        >
          {showResolved ? "All" : "Open"}
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        {pageComments.length > 0 && (
          <div className="px-3 py-2">
            <p className="text-[10px] font-medium text-muted-foreground mb-2">This page</p>
            {pageComments.map(c => (
              <CommentItem key={c.id} comment={c} onToggle={toggleResolved} />
            ))}
          </div>
        )}

        {otherComments.length > 0 && (
          <div className="px-3 py-2 border-t border-border">
            <p className="text-[10px] font-medium text-muted-foreground mb-2">Other pages</p>
            {otherComments.map(c => (
              <CommentItem key={c.id} comment={c} onToggle={toggleResolved} />
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="p-6 text-center text-xs text-muted-foreground">
            No comments yet
          </div>
        )}
      </ScrollArea>

      <div className="px-3 py-2 border-t border-border">
        <div className="flex gap-1.5">
          <Input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addComment()}
            placeholder="Add comment..."
            className="h-8 text-xs"
          />
          <Button size="icon" className="h-8 w-8 shrink-0" onClick={addComment} disabled={!newComment.trim()} aria-label="Action">
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CommentItem({ comment, onToggle }: { comment: Comment; onToggle: (id: string, resolved: boolean) => void }) {
  return (
    <div className={cn(
      "rounded-lg border border-border p-2 mb-2 text-xs",
      comment.resolved && "opacity-60"
    )}>
      <div className="flex items-start justify-between gap-1">
        <p className="flex-1">{comment.content}</p>
        <button
          onClick={() => onToggle(comment.id, comment.resolved)}
          className="shrink-0 mt-0.5 hover:text-primary transition-colors"
          title={comment.resolved ? "Reopen" : "Resolve"}
        >
          {comment.resolved
            ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            : <Circle className="w-3.5 h-3.5 text-muted-foreground" />
          }
        </button>
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <Badge variant="outline" className="text-[9px]">Page {comment.page_index + 1}</Badge>
        <span className="text-[10px] text-muted-foreground">
          {new Date(comment.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
