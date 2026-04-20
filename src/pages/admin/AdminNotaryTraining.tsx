import { usePageMeta } from "@/hooks/usePageMeta";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Search, Loader2, BookOpen, Award, Clock } from "lucide-react";
import { format } from "date-fns";
import { DashboardEnhancer } from "@/components/services/DashboardEnhancer";

const COURSE_CATEGORIES = [
  { value: "initial_commission", label: "Initial Commission Training" },
  { value: "ron_certification", label: "RON Certification" },
  { value: "loan_signing", label: "Loan Signing Agent" },
  { value: "continuing_ed", label: "Continuing Education" },
  { value: "ohio_compliance", label: "Ohio Compliance Updates" },
  { value: "business_development", label: "Business Development" },
  { value: "technology", label: "Technology & Tools" },
  { value: "ethics", label: "Ethics & Best Practices" },
];

export default function AdminNotaryTraining() {
  usePageMeta({ title: "Notary Training — Admin", noIndex: true });
  const [search, setSearch] = useState("");

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["continuing-education"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("continuing_education")
        .select("*")
        .order("completed_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = courses.filter((c: any) =>
    !search || c.course_name?.toLowerCase().includes(search.toLowerCase()) || c.provider?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCredits = courses.reduce((sum: number, c: any) => sum + (c.credits || 0), 0);

  return (
    <DashboardEnhancer category="training">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" /> Notary Training & Certification
          </h1>
          <p className="text-sm text-muted-foreground">Course management, CE tracking & certification records</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Courses</p><p className="text-2xl font-bold">{courses.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Credits</p><p className="text-2xl font-bold text-primary">{totalCredits}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Categories</p><p className="text-2xl font-bold">{COURSE_CATEGORIES.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">With Certificates</p><p className="text-2xl font-bold text-success">{courses.filter((c: any) => c.certificate_path).length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="completed">
        <TabsList>
          <TabsTrigger value="completed" className="gap-1"><Award className="h-3.5 w-3.5" /> Completed</TabsTrigger>
          <TabsTrigger value="catalog" className="gap-1"><BookOpen className="h-3.5 w-3.5" /> Course Catalog</TabsTrigger>
        </TabsList>

        <TabsContent value="completed" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No courses recorded yet.</CardContent></Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Certificate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.course_name}</TableCell>
                      <TableCell className="text-sm">{c.provider || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{c.credits} CE</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(c.completed_date), "MMM d, yyyy")}</TableCell>
                      <TableCell>{c.certificate_path ? <Badge className="bg-success/10 text-success">On File</Badge> : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Available Course Categories</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {COURSE_CATEGORIES.map(cat => (
                  <div key={cat.value} className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                    <p className="font-medium">{cat.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {courses.filter((c: any) => c.course_name?.toLowerCase().includes(cat.label.toLowerCase().split(" ")[0])).length} completed
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </DashboardEnhancer>
  );
}
