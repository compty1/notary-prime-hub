import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Warehouse, AlertTriangle, Package, TrendingUp, Bell } from "lucide-react";

interface MaterialItem {
  id: string;
  name: string;
  category: string;
  vendor: string;
  stockLevel: number;
  reorderThreshold: number;
  unit: string;
  costPerUnit: number;
  lastRestocked: string;
}

const MOCK_MATERIALS: MaterialItem[] = [
  { id: "1", name: "14pt Cardstock (White)", category: "Paper", vendor: "Capitol Square Printing", stockLevel: 85, reorderThreshold: 20, unit: "reams", costPerUnit: 12.50, lastRestocked: "2026-04-01" },
  { id: "2", name: "16pt Cardstock (White)", category: "Paper", vendor: "Capitol Square Printing", stockLevel: 62, reorderThreshold: 20, unit: "reams", costPerUnit: 15.00, lastRestocked: "2026-03-28" },
  { id: "3", name: "18pt Cotton/Linen", category: "Paper", vendor: "Custom Imprint", stockLevel: 15, reorderThreshold: 10, unit: "reams", costPerUnit: 28.00, lastRestocked: "2026-03-15" },
  { id: "4", name: "Premium Vinyl (Gloss)", category: "Vinyl", vendor: "Custom Imprint", stockLevel: 45, reorderThreshold: 15, unit: "rolls", costPerUnit: 35.00, lastRestocked: "2026-04-05" },
  { id: "5", name: "Holographic Vinyl", category: "Vinyl", vendor: "Custom Imprint", stockLevel: 8, reorderThreshold: 10, unit: "rolls", costPerUnit: 65.00, lastRestocked: "2026-03-10" },
  { id: "6", name: "Gold Foil Rolls", category: "Finishing", vendor: "Custom Imprint", stockLevel: 22, reorderThreshold: 5, unit: "rolls", costPerUnit: 45.00, lastRestocked: "2026-04-02" },
  { id: "7", name: "Soft-Touch Lamination Film", category: "Finishing", vendor: "Capitol Square Printing", stockLevel: 30, reorderThreshold: 10, unit: "rolls", costPerUnit: 55.00, lastRestocked: "2026-03-25" },
  { id: "8", name: "60# Offset (Cream)", category: "Paper", vendor: "The Printed Image", stockLevel: 70, reorderThreshold: 25, unit: "reams", costPerUnit: 8.50, lastRestocked: "2026-04-08" },
  { id: "9", name: "80# Gloss Text", category: "Paper", vendor: "Kenwel Printers", stockLevel: 55, reorderThreshold: 20, unit: "reams", costPerUnit: 11.00, lastRestocked: "2026-04-03" },
  { id: "10", name: "Chipboard Backers", category: "Binding", vendor: "Kenwel Printers", stockLevel: 200, reorderThreshold: 50, unit: "sheets", costPerUnit: 0.35, lastRestocked: "2026-03-20" },
  { id: "11", name: "Wire-O Binding Spines", category: "Binding", vendor: "Zip Print", stockLevel: 120, reorderThreshold: 30, unit: "pieces", costPerUnit: 0.45, lastRestocked: "2026-04-01" },
  { id: "12", name: "Cloth Covers (Black)", category: "Binding", vendor: "AlphaGraphics", stockLevel: 18, reorderThreshold: 10, unit: "sheets", costPerUnit: 4.50, lastRestocked: "2026-03-12" },
  { id: "13", name: "Corrugated Boxes (10x8x4)", category: "Packaging", vendor: "Jet Container", stockLevel: 300, reorderThreshold: 100, unit: "pieces", costPerUnit: 1.20, lastRestocked: "2026-04-06" },
  { id: "14", name: "Branded Packing Tape", category: "Packaging", vendor: "Jet Container", stockLevel: 48, reorderThreshold: 12, unit: "rolls", costPerUnit: 3.50, lastRestocked: "2026-03-30" },
];

export default function AdminPrintInventory() {
  usePageMeta({ title: "Print Inventory", noIndex: true });
  const [catFilter, setCatFilter] = useState("all");

  const categories = [...new Set(MOCK_MATERIALS.map(m => m.category))];
  const filtered = catFilter === "all" ? MOCK_MATERIALS : MOCK_MATERIALS.filter(m => m.category === catFilter);
  const lowStock = MOCK_MATERIALS.filter(m => m.stockLevel <= m.reorderThreshold);
  const totalValue = MOCK_MATERIALS.reduce((s, m) => s + m.stockLevel * m.costPerUnit, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Warehouse className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Print Inventory & Materials</h1>
          <p className="text-sm text-muted-foreground">Track stock levels, costs, and vendor supply across all materials.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{MOCK_MATERIALS.length}</p><p className="text-xs text-muted-foreground">Material Types</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-500" /><div><p className="text-2xl font-bold">{lowStock.length}</p><p className="text-xs text-muted-foreground">Low Stock Alerts</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-500" /><div><p className="text-2xl font-bold">${totalValue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Inventory Value</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Bell className="h-5 w-5 text-yellow-500" /><div><p className="text-2xl font-bold">{categories.length}</p><p className="text-xs text-muted-foreground">Categories</p></div></div></CardContent></Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-4 w-4" /> Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStock.map(m => (
                <Badge key={m.id} variant="outline" className="border-orange-500/30 text-orange-700">
                  {m.name} — {m.stockLevel} {m.unit} (threshold: {m.reorderThreshold})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3">
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-48 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Cost/Unit</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Last Restocked</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(m => {
              const pct = Math.min(100, (m.stockLevel / (m.reorderThreshold * 4)) * 100);
              const isLow = m.stockLevel <= m.reorderThreshold;
              return (
                <TableRow key={m.id}>
                  <TableCell className="font-medium text-sm">{m.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{m.category}</Badge></TableCell>
                  <TableCell className="text-xs">{m.vendor}</TableCell>
                  <TableCell>
                    <span className={isLow ? "text-orange-600 font-semibold" : ""}>{m.stockLevel} {m.unit}</span>
                  </TableCell>
                  <TableCell className="w-32">
                    <Progress value={pct} className={`h-2 ${isLow ? "[&>div]:bg-orange-500" : ""}`} />
                  </TableCell>
                  <TableCell>${m.costPerUnit.toFixed(2)}</TableCell>
                  <TableCell className="font-medium">${(m.stockLevel * m.costPerUnit).toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{m.lastRestocked}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
