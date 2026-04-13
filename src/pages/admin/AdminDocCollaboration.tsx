import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, FileText, Archive } from "lucide-react";

export default function AdminDocCollaboration() {
  usePageMeta({ title: "Document Collaboration" });
  const { user } = useAuth();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: rooms = [] } = useQuery({
    queryKey: ["collab_rooms"],
    queryFn: async () => {
      const { data } = await supabase.from("doc_collaboration_rooms").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: participants = [] } = useQuery({
    queryKey: ["collab_participants"],
    queryFn: async () => {
      const { data } = await supabase.from("doc_collaboration_participants").select("*");
      return data || [];
    },
  });

  const createRoom = useMutation({
    mutationFn: async (form: FormData) => {
      const { error } = await supabase.from("doc_collaboration_rooms").insert({
        room_name: form.get("name") as string,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["collab_rooms"] }); toast.success("Room created"); setCreateOpen(false); },
    onError: () => toast.error("Failed to create room"),
  });

  const toggleRoom = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("doc_collaboration_rooms").update({ is_active: !active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["collab_rooms"] }); toast.success("Room updated"); },
  });

  const activeRooms = rooms.filter(r => r.is_active);
  const archivedRooms = rooms.filter(r => !r.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Document Collaboration</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />New Room</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Collaboration Room</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); createRoom.mutate(new FormData(e.currentTarget)); }} className="space-y-3">
              <div><Label>Room Name</Label><Input name="name" placeholder="Q4 Contract Review..." required /></div>
              <Button type="submit" className="w-full" disabled={createRoom.isPending}>Create Room</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Rooms</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{activeRooms.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Participants</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{participants.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Archived</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-muted-foreground">{archivedRooms.length}</div></CardContent></Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Active Rooms</h2>
        {activeRooms.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No active collaboration rooms. Create one to start collaborating.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeRooms.map(room => {
              const roomParticipants = participants.filter(p => p.room_id === room.id);
              return (
                <Card key={room.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-medium">{room.room_name}</h3>
                          <p className="text-xs text-muted-foreground">Created {new Date(room.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline"><Users className="h-3 w-3 mr-1" />{roomParticipants.length}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => toggleRoom.mutate({ id: room.id, active: true })}><Archive className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {archivedRooms.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">Archived</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {archivedRooms.map(room => (
              <Card key={room.id} className="opacity-60">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Archive className="h-4 w-4 text-muted-foreground" />
                    <span>{room.room_name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => toggleRoom.mutate({ id: room.id, active: false })}>Restore</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
