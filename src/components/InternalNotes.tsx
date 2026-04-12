import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Send, User, Shield } from "lucide-react";
import { format } from "date-fns";

interface InternalNote {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  isAdmin: boolean;
}

interface InternalNotesProps {
  entityType: "appointment" | "client" | "document" | "order";
  entityId: string;
}

export function InternalNotes({ entityType, entityId }: InternalNotesProps) {
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);

  const addNote = async () => {
    if (!newNote.trim()) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Log as audit entry
      await supabase.from("audit_log").insert({
        action: "internal_note_added",
        entity_type: entityType,
        entity_id: entityId,
        details: { note: newNote.trim() },
        user_id: user.id,
      });

      setNotes(prev => [{
        id: crypto.randomUUID(),
        text: newNote.trim(),
        authorId: user.id,
        authorName: user.email?.split("@")[0] ?? "Admin",
        createdAt: new Date().toISOString(),
        isAdmin: true,
      }, ...prev]);
      setNewNote("");
      toast.success("Note added");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <MessageSquare className="h-4 w-4" /> Internal Notes
          <Badge variant="outline" className="text-[10px]">Staff Only</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Textarea
            placeholder="Add an internal note..."
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            rows={2}
            className="flex-1"
          />
          <Button size="sm" onClick={addNote} disabled={!newNote.trim() || loading} className="self-end">
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-[200px]">
          {notes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No internal notes</p>
          ) : (
            <div className="space-y-2">
              {notes.map(note => (
                <div key={note.id} className="p-2 rounded border bg-muted/30 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    {note.isAdmin ? <Shield className="h-3 w-3 text-primary" /> : <User className="h-3 w-3" />}
                    <span className="text-xs font-medium">{note.authorName}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(note.createdAt), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{note.text}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
