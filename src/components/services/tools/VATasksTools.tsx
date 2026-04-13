import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Clock, Target, Zap } from "lucide-react";

const TASK_CATEGORIES = [
  {
    category: "Document Management",
    tasks: ["Scan & organize incoming mail", "File documents in cloud storage", "Prepare document packages for signing", "Index notary journal entries"],
    avgTime: "1-2 hrs/day",
  },
  {
    category: "Client Communication",
    tasks: ["Respond to initial inquiries", "Send appointment confirmations", "Follow up on pending documents", "Handle rescheduling requests"],
    avgTime: "2-3 hrs/day",
  },
  {
    category: "Calendar & Scheduling",
    tasks: ["Manage appointment calendar", "Block travel time between signings", "Coordinate multi-party signings", "Send reminders 24hr before"],
    avgTime: "1 hr/day",
  },
  {
    category: "Administrative",
    tasks: ["Process payments and invoicing", "Update CRM records", "Track commission sheets", "Order supplies (stamps, journals)"],
    avgTime: "1-2 hrs/day",
  },
  {
    category: "Marketing Support",
    tasks: ["Post to social media accounts", "Update Google Business Profile", "Send monthly newsletters", "Manage online reviews"],
    avgTime: "1 hr/day",
  },
];

const SLA_BENCHMARKS = [
  { task: "Initial client response", target: "< 30 minutes", priority: "Critical" },
  { task: "Document preparation", target: "< 2 hours", priority: "High" },
  { task: "Invoice generation", target: "< 1 hour after completion", priority: "High" },
  { task: "Follow-up on missing docs", target: "< 4 hours", priority: "Medium" },
  { task: "Social media post", target: "Daily by 10 AM", priority: "Low" },
  { task: "Journal entry completion", target: "Same day", priority: "Critical" },
];

export function VATasksTools() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            VA Task Categories & Workflows
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {TASK_CATEGORIES.map((cat) => (
              <div key={cat.category} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">{cat.category}</h4>
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" /> {cat.avgTime}
                  </Badge>
                </div>
                <div className="grid gap-1">
                  {cat.tasks.map((t) => (
                    <div key={t} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3 text-primary" /> {t}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            SLA Response Benchmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {SLA_BENCHMARKS.map((s) => (
              <div key={s.task} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">{s.task}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{s.target}</Badge>
                  <Badge variant={s.priority === "Critical" ? "destructive" : s.priority === "High" ? "default" : "secondary"} className="text-xs">
                    {s.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
