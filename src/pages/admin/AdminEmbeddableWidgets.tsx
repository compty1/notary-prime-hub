import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Code, Calendar, CheckCircle, Copy, Eye, Palette } from "lucide-react";
import { toast } from "sonner";

const BASE_URL = window.location.origin;

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative">
      <pre className="bg-muted/50 border rounded-lg p-3 text-xs overflow-x-auto font-mono">{code}</pre>
      <Button variant="ghost" size="sm" className="absolute top-1 right-1" onClick={() => { navigator.clipboard.writeText(code); toast.success("Copied!"); }}><Copy className="h-3 w-3" /></Button>
    </div>
  );
}

export default function AdminEmbeddableWidgets() {
  usePageMeta({ title: "Embeddable Widgets" });
  const [theme, setTheme] = useState("light");
  const [primaryColor, setPrimaryColor] = useState("#8B5CF6");
  const [showBranding, setShowBranding] = useState(true);

  const bookNowSnippet = `<div id="ntr-book-widget"></div>
<script src="${BASE_URL}/widgets/book-now.js"
  data-theme="${theme}"
  data-color="${primaryColor}"
  data-branding="${showBranding}"
></script>`;

  const availabilitySnippet = `<div id="ntr-availability-widget"></div>
<script src="${BASE_URL}/widgets/availability.js"
  data-theme="${theme}"
  data-color="${primaryColor}"
></script>`;

  const verificationSnippet = `<a href="${BASE_URL}/verify/{YOUR_SEAL_ID}" target="_blank">
  <img src="${BASE_URL}/widgets/verification-badge.svg" alt="Verification badge"
    alt="Verified by NotaryPrime"
    width="120" height="40" />
</a>`;

  const statusSnippet = `<div id="ntr-status-widget"
  data-order="{ORDER_NUMBER}"></div>
<script src="${BASE_URL}/widgets/order-status.js"></script>`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Embeddable Widgets</h1>
          <p className="text-muted-foreground text-sm">Add booking, availability, and verification widgets to any website</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Widget Customization</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-6">
          <div className="space-y-1">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={setTheme}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="light">Light</SelectItem><SelectItem value="dark">Dark</SelectItem><SelectItem value="auto">Auto</SelectItem></SelectContent></Select>
          </div>
          <div className="space-y-1">
            <Label>Primary Color</Label>
            <div className="flex items-center gap-2"><Input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 h-9 p-1" /><Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-24 font-mono text-xs" /></div>
          </div>
          <div className="flex items-center gap-2 pt-5"><Switch checked={showBranding} onCheckedChange={setShowBranding} /><Label>Show Branding</Label></div>
        </CardContent>
      </Card>

      <Tabs defaultValue="book-now">
        <TabsList className="flex-wrap">
          <TabsTrigger value="book-now"><Calendar className="h-3.5 w-3.5 mr-1" />Book Now</TabsTrigger>
          <TabsTrigger value="availability"><Eye className="h-3.5 w-3.5 mr-1" />Availability</TabsTrigger>
          <TabsTrigger value="verification"><CheckCircle className="h-3.5 w-3.5 mr-1" />Verification Badge</TabsTrigger>
          <TabsTrigger value="status"><Code className="h-3.5 w-3.5 mr-1" />Order Status</TabsTrigger>
        </TabsList>

        <TabsContent value="book-now" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Book Now Widget</CardTitle>
              <CardDescription>Let clients book appointments directly from your website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 border-2 border-dashed rounded-lg p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-primary mb-2" />
                <p className="font-medium">Book Now Widget Preview</p>
                <p className="text-xs text-muted-foreground">Shows available dates, service selection, and booking form</p>
                <Button className="mt-3" style={{ backgroundColor: primaryColor }}>Book Appointment</Button>
              </div>
              <div><Label className="text-sm font-medium">Embed Code</Label><CodeBlock code={bookNowSnippet} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Eye className="h-5 w-5 text-primary" />Availability Calendar</CardTitle>
              <CardDescription>Display real-time availability on your website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 border-2 border-dashed rounded-lg p-8 text-center">
                <div className="grid grid-cols-7 gap-1 max-w-xs mx-auto mb-3">
                  {["M","T","W","T","F","S","S"].map((d, i) => <div key={i} className="text-xs font-medium text-muted-foreground p-1">{d}</div>)}
                  {Array.from({ length: 28 }, (_, i) => (
                    <div key={i} className={`text-xs p-1 rounded ${[3,7,10,14,17,21].includes(i) ? "bg-green-100 text-green-700 dark:bg-green-900/30" : "text-muted-foreground"}`}>{i + 1}</div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Green = Available slots</p>
              </div>
              <div><Label className="text-sm font-medium">Embed Code</Label><CodeBlock code={availabilitySnippet} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-600" />Verification Badge</CardTitle>
              <CardDescription>Add a verification badge that links to your seal verification page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 border-2 border-dashed rounded-lg p-8 text-center">
                <div className="inline-flex items-center gap-2 border-2 border-green-500 rounded-full px-4 py-2 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">Verified by NotaryPrime</span>
                </div>
              </div>
              <div><Label className="text-sm font-medium">Embed Code</Label><CodeBlock code={verificationSnippet} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Code className="h-5 w-5 text-primary" />Order Status Widget</CardTitle>
              <CardDescription>Let clients track their order status from your website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 border-2 border-dashed rounded-lg p-8 text-center">
                <div className="flex items-center justify-center gap-3">
                  {["Received", "Processing", "Completed"].map((s, i) => (
                    <div key={s} className="flex items-center gap-1">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${i < 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
                      <span className="text-xs">{s}</span>
                      {i < 2 && <div className="w-8 h-0.5 bg-muted" />}
                    </div>
                  ))}
                </div>
              </div>
              <div><Label className="text-sm font-medium">Embed Code</Label><CodeBlock code={statusSnippet} /></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
