import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Bell, Mail, MessageSquare, Calendar, Shield } from "lucide-react";

type NotifChannel = "email" | "sms" | "push";
type NotifCategory = {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  channels: NotifChannel[];
};

const CATEGORIES: NotifCategory[] = [
  { key: "appointment_reminders", label: "Appointment Reminders", description: "Reminders before scheduled appointments", icon: <Calendar className="h-4 w-4" />, channels: ["email", "sms"] },
  { key: "status_updates", label: "Status Updates", description: "When appointment or document status changes", icon: <Bell className="h-4 w-4" />, channels: ["email", "sms", "push"] },
  { key: "document_ready", label: "Document Ready", description: "When notarized documents are ready for download", icon: <Mail className="h-4 w-4" />, channels: ["email"] },
  { key: "messages", label: "Messages", description: "New messages from your notary", icon: <MessageSquare className="h-4 w-4" />, channels: ["email", "push"] },
  { key: "security_alerts", label: "Security Alerts", description: "Login attempts and password changes (always on)", icon: <Shield className="h-4 w-4" />, channels: ["email"] },
  { key: "marketing", label: "Promotions & Updates", description: "New services, discounts, and platform updates", icon: <Mail className="h-4 w-4" />, channels: ["email"] },
];

const STORAGE_KEY = "notification_preferences";

export function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Record<string, Record<NotifChannel, boolean>>>({});

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setPrefs(JSON.parse(saved));
    } else {
      const defaults: Record<string, Record<NotifChannel, boolean>> = {};
      CATEGORIES.forEach(cat => {
        defaults[cat.key] = { email: true, sms: cat.key !== "marketing", push: true };
      });
      setPrefs(defaults);
    }
  }, []);

  const toggle = (category: string, channel: NotifChannel) => {
    if (category === "security_alerts") return; // always on
    setPrefs(prev => ({
      ...prev,
      [category]: { ...prev[category], [channel]: !prev[category]?.[channel] },
    }));
  };

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    toast.success("Notification preferences saved");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-[1fr_60px_60px_60px] gap-2 text-xs font-medium text-muted-foreground">
          <span />
          <span className="text-center">Email</span>
          <span className="text-center">SMS</span>
          <span className="text-center">Push</span>
        </div>

        {CATEGORIES.map((cat, i) => (
          <div key={cat.key}>
            {i > 0 && <Separator className="my-2" />}
            <div className="grid grid-cols-[1fr_60px_60px_60px] items-center gap-2">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-muted-foreground">{cat.icon}</span>
                <div>
                  <Label className="text-sm font-medium">{cat.label}</Label>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
              </div>
              {(["email", "sms", "push"] as NotifChannel[]).map(ch => (
                <div key={ch} className="flex justify-center">
                  {cat.channels.includes(ch) ? (
                    <Switch
                      checked={prefs[cat.key]?.[ch] ?? true}
                      onCheckedChange={() => toggle(cat.key, ch)}
                      disabled={cat.key === "security_alerts"}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <Button onClick={save} className="w-full mt-4">Save Preferences</Button>
      </CardContent>
    </Card>
  );
}
