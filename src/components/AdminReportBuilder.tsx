import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BarChart3, Download } from "lucide-react";

type ReportType = "appointments" | "revenue" | "compliance" | "clients";

interface ReportData {
  label: string;
  value: number;
}

const SAMPLE_DATA: Record<ReportType, ReportData[]> = {
  appointments: [
    { label: "Jan", value: 45 }, { label: "Feb", value: 52 },
    { label: "Mar", value: 48 }, { label: "Apr", value: 61 },
    { label: "May", value: 55 }, { label: "Jun", value: 67 },
  ],
  revenue: [
    { label: "Jan", value: 3200 }, { label: "Feb", value: 3800 },
    { label: "Mar", value: 3500 }, { label: "Apr", value: 4200 },
    { label: "May", value: 3900 }, { label: "Jun", value: 4800 },
  ],
  compliance: [
    { label: "KBA Pass", value: 95 }, { label: "Journal Complete", value: 98 },
    { label: "Recording Consent", value: 100 }, { label: "E-Seal Applied", value: 97 },
  ],
  clients: [
    { label: "New", value: 23 }, { label: "Returning", value: 45 },
    { label: "Business", value: 12 }, { label: "Referral", value: 8 },
  ],
};

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(220 70% 50%)", "hsl(160 60% 45%)"];

export function AdminReportBuilder() {
  const [reportType, setReportType] = useState<ReportType>("appointments");
  const data = SAMPLE_DATA[reportType];

  const exportCSV = () => {
    const csv = ["Label,Value", ...data.map(d => `${d.label},${d.value}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BarChart3 className="h-4 w-4" /> Report Builder
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={reportType} onValueChange={v => setReportType(v as ReportType)}>
            <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="appointments">Appointments</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="clients">Clients</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> CSV</Button>
        </div>
      </CardHeader>
      <CardContent>
        {reportType === "clients" ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80} label={({ label, value }) => `${label}: ${value}`}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <XAxis dataKey="label" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
