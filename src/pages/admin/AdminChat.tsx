import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, User, Shield, Loader2 } from "lucide-react";

export default function AdminChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Record<string, any[]>>({});
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load all chat messages grouped by sender
    supabase.from("chat_messages").select("*").order("created_at", { ascending: true }).then(({ data }) => {
      if (data) {
        const grouped: Record<string, any[]> = {};
        data.forEach((msg: any) => {
          const key = msg.is_admin ? "admin" : msg.sender_id;
          const convKey = msg.is_admin ? (data.find((m: any) => !m.is_admin && m.sender_id !== msg.sender_id)?.sender_id || msg.sender_id) : msg.sender_id;
          // Group by non-admin sender
          const userKey = msg.is_admin ? msg.sender_id : msg.sender_id;
          if (!grouped[userKey]) grouped[userKey] = [];
          grouped[userKey].push(msg);
        });
        // Regroup properly: all messages for each unique non-admin sender
        const proper: Record<string, any[]> = {};
        data.forEach((msg: any) => {
          // Find the "conversation" user — if admin sent, attribute to the conversation
          const userId = msg.is_admin ? msg.sender_id : msg.sender_id;
          if (!proper[userId]) proper[userId] = [];
          proper[userId].push(msg);
        });
        setConversations(proper);
        // Auto-select first conversation
        const keys = Object.keys(proper);
        if (keys.length > 0 && !selectedUser) setSelectedUser(keys[0]);
      }
    });

    // Subscribe to realtime
    const channel = supabase.channel("admin-chat").on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
      const msg = payload.new as any;
      setConversations((prev) => {
        const key = msg.sender_id;
        return { ...prev, [key]: [...(prev[key] || []), msg] };
      });
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [conversations, selectedUser]);

  const sendMessage = async () => {
    if (!message.trim() || !user || !selectedUser) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({ sender_id: user.id, message: message.trim(), is_admin: true } as any);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setMessage("");
    setSending(false);
  };

  const userIds = Object.keys(conversations).filter((id) => id !== user?.id);
  const currentMessages = selectedUser ? conversations[selectedUser] || [] : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Live Chat & Document Review</h1>
        <p className="text-sm text-muted-foreground">Real-time client chat and document pre-review queue</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3" style={{ height: "calc(100vh - 240px)" }}>
        {/* Conversation list */}
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Conversations</CardTitle></CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[500px]">
              {userIds.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No conversations yet</p>
              ) : (
                userIds.map((uid) => {
                  const msgs = conversations[uid] || [];
                  const lastMsg = msgs[msgs.length - 1];
                  const unread = msgs.filter((m) => !m.is_admin && !m.read).length;
                  return (
                    <div key={uid} onClick={() => setSelectedUser(uid)}
                      className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${selectedUser === uid ? "bg-accent/10" : "hover:bg-muted"}`}>
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{uid.slice(0, 8)}...</p>
                        {lastMsg && <p className="text-xs text-muted-foreground truncate">{lastMsg.message}</p>}
                      </div>
                      {unread > 0 && <Badge className="bg-accent text-accent-foreground text-xs">{unread}</Badge>}
                    </div>
                  );
                })
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className="border-border/50 md:col-span-2 flex flex-col">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-accent" />
              {selectedUser ? `Chat with ${selectedUser.slice(0, 8)}...` : "Select a conversation"}
            </CardTitle>
          </CardHeader>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "450px" }}>
            {currentMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.is_admin ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${msg.is_admin ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"}`}>
                  <div className="flex items-center gap-1 mb-1">
                    {msg.is_admin ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    <span className="text-xs opacity-70">{new Date(msg.created_at).toLocaleTimeString()}</span>
                  </div>
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
          {selectedUser && (
            <div className="border-t p-3 flex gap-2">
              <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a reply..." onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
              <Button size="sm" onClick={sendMessage} disabled={sending} className="bg-accent text-accent-foreground hover:bg-gold-dark">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
