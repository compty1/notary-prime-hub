import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Camera, Search, Calendar, MapPin, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const PHOTO_SERVICES = [
  { name: "Professional Headshots", price: "$99", duration: "30 min" },
  { name: "Passport Photos", price: "$25", duration: "15 min" },
  { name: "ID Photos (Visa/Immigration)", price: "$35", duration: "15 min" },
  { name: "Corporate Team Photos", price: "$299+", duration: "1-2 hrs" },
  { name: "Document Photography", price: "$49", duration: "30 min" },
];

export default function AdminPhotography() {
  usePageMeta({ title: "Photography & Headshots | Admin", noIndex: true });
  const [search, setSearch] = useState("");

  const { data: bookings = [] } = useQuery({
    queryKey: ["photo-bookings"],
    queryFn: async () => {
      const { data } = await supabase.from("service_requests").select("*")
        .or("service_name.ilike.%photo%,service_name.ilike.%headshot%")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Camera className="h-6 w-6 text-primary" /> Photography & Headshots</h1>
        <p className="text-sm text-muted-foreground mt-1">Professional photography services for documents, headshots, and corporate needs</p>
      </div>

      <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
        {PHOTO_SERVICES.map(s => (
          <Card key={s.name}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Image className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">{s.name}</h3>
              </div>
              <div className="flex justify-between items-center mt-2">
                <Badge variant="outline" className="text-[10px]">{s.price}</Badge>
                <span className="text-[10px] text-muted-foreground">{s.duration}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Bookings</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No photography bookings yet</TableCell></TableRow>
              ) : bookings.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.reference_number}</TableCell>
                  <TableCell>{b.service_name}</TableCell>
                  <TableCell><Badge variant={b.status === "completed" ? "default" : "secondary"}>{b.status}</Badge></TableCell>
                  <TableCell className="text-xs">{new Date(b.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
