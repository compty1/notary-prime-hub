import { usePageTitle } from "@/lib/usePageTitle";
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
import ReactMarkdown from "react-markdown";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Zap } from "lucide-react";

const CANNED_RESPONSES = [
  { label: "Greeting", text: "Hello! Thank you for reaching out. How can I assist you today?" },
  { label: "Documents Needed", text: "To proceed, we'll need the following documents:\n1. Valid government-issued photo ID\n2. The document(s) requiring notarization\n\nPlease upload them via the portal." },
  { label: "Appointment Reminder", text: "Just a reminder — your upcoming appointment is scheduled. Please have your documents and valid ID ready." },
  { label: "RON Instructions", text: "For your Remote Online Notarization (RON) session:\n1. Ensure stable internet and a webcam\n2. Have your valid photo ID ready\n3. You'll complete identity verification (KBA) before we begin\n4. The session will be audio/video recorded per Ohio law" },
  { label: "Payment Info", text: "You can make a payment through your Client Portal under the 'Payments' tab. We accept all major credit/debit cards." },
  { label: "Closing", text: "Thank you for choosing our services! If you have any other questions, don't hesitate to reach out. Have a great day!" },
];

export default function AdminChat() {
  usePageTitle("Live Chat");
  const { user } = useAuth();
  const { toast } = useToast();
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: msgs }, { data: profs }] = await Promise.all([
        supabase.from("chat_messages").select("*").order("created_at", { ascending: true }),
        supabase.from("profiles").select("user_id, full_name"),
      ]);
      if (msgs) setAllMessages(msgs);
      if (profs) {
        const map: Record<string, string> = {};
        profs.forEach((p: any) => { map[p.user_id] = p.full_name || p.user_id.slice(0, 8); });
        setProfiles(map);
      }
    };
    fetchData();

    const channel = supabase.channel("admin-chat").on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
      const msg = payload.new as any;
      setAllMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [allMessages, selectedUser]);

  // Group conversations by CLIENT id (non-admin sender_id)
  const clientIds = [...new Set(
    allMessages.filter((m) => !m.is_admin).map((m) => m.sender_id)
  )];

  // Get messages for selected client using recipient_id for admin messages
  const getConversation = (clientId: string) => {
    return allMessages.filter((m) => {
      // Client's own messages
      if (!m.is_admin && m.sender_id === clientId) return true;
      // Admin messages sent TO this client (using recipient_id)
      if (m.is_admin && m.recipient_id === clientId) return true;
      // Legacy: admin messages without recipient_id that were sent while this client was selected
      // (only if no recipient_id exists — backwards compat)
      return false;
    });
  };

  const getUnreadCount = (clientId: string) => {
    return allMessages.filter((m) => m.sender_id === clientId && !m.is_admin && !m.read).length;
  };

  const getLastMessage = (clientId: string) => {
    const conv = getConversation(clientId);
    return conv[conv.length - 1];
  };

  const selectConversation = async (clientId: string) => {
    setSelectedUser(clientId);
    // Mark all messages from this client as read
    await supabase.from("chat_messages").update({ read: true } as any)
      .eq("sender_id", clientId).eq("is_admin", false).eq("read", false);
    setAllMessages(prev => prev.map(m => 
      m.sender_id === clientId && !m.is_admin ? { ...m, read: true } : m
    ));
  };

  const sendMessage = async () => {
    if (!message.trim() || !user || !selectedUser) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      sender_id: user.id,
      message: message.trim(),
      is_admin: true,
      recipient_id: selectedUser,
    } as any);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setMessage("");
    setSending(false);
  };

  const currentMessages = selectedUser ? getConversation(selectedUser) : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-sans text-2xl font-bold">Live Chat & Document Review</h1>
        <p className="text-sm text-muted-foreground">Real-time client chat and document pre-review queue</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3" style={{ height: "calc(100vh - 240px)" }}>
        {/* Conversation list */}
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Conversations</CardTitle></CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[500px]">
              {clientIds.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No conversations yet</p>
              ) : (
                clientIds.map((uid) => {
                  const lastMsg = getLastMessage(uid);
                  const unread = getUnreadCount(uid);
                  const name = profiles[uid] || uid.slice(0, 8);
                  return (
                     <div key={uid} onClick={() => selectConversation(uid)}
                       role="button" tabIndex={0} aria-label={`Chat with ${name}${unread > 0 ? `, ${unread} unread` : ""}`}
                       onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectConversation(uid); } }}
                       className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${selectedUser === uid ? "bg-primary/10" : "hover:bg-muted"}`}>
                       <User className="h-5 w-5 text-muted-foreground" />
                       <div className="flex-1 min-w-0">
                         <p className="text-sm font-medium truncate">{name}</p>
                         {lastMsg && <p className="text-xs text-muted-foreground truncate">{lastMsg.message}</p>}
                       </div>
                       {unread > 0 && <Badge className="bg-primary text-primary-foreground text-xs">{unread}</Badge>}
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
              <MessageSquare className="h-4 w-4 text-primary" />
              {selectedUser ? `Chat with ${profiles[selectedUser] || selectedUser.slice(0, 8)}` : "Select a conversation"}
            </CardTitle>
          </CardHeader>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "450px" }}>
            {currentMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.is_admin ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${msg.is_admin ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  <div className="flex items-center gap-1 mb-1">
                    {msg.is_admin ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    <span className="text-xs opacity-70">{new Date(msg.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0"><ReactMarkdown>{msg.message}</ReactMarkdown></div>
                </div>
              </div>
            ))}
          </div>
          {selectedUser && (
            <div className="border-t p-3 flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" title="Canned responses"><Zap className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {CANNED_RESPONSES.map(r => (
                    <DropdownMenuItem key={r.label} onClick={() => setMessage(r.text)}>{r.label}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a reply..." maxLength={2000} onKeyDown={(e) => e.key === "Enter" && sendMessage()} className="flex-1" />
              <Button size="sm" onClick={sendMessage} disabled={sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
