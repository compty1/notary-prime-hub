import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Clock, Shield, FileText, CheckCircle } from "lucide-react";

const CHAIN_OF_CUSTODY_STEPS = [
  { step: "Pickup Verification", actions: ["Photograph package at pickup", "Record sender name and signature", "Note package condition and seal integrity", "Log pickup time and location"] },
  { step: "In-Transit Security", actions: ["Maintain continuous possession", "Do not leave in unattended vehicle", "Use tamper-evident bags for legal docs", "Log any stops or transfers"] },
  { step: "Delivery Confirmation", actions: ["Obtain recipient signature", "Photograph package at delivery", "Record delivery time and recipient name", "Note any discrepancies in condition"] },
  { step: "Documentation", actions: ["Complete chain of custody form", "Upload photos to delivery record", "Generate delivery confirmation receipt", "File affidavit of delivery if needed"] },
];

const DELIVERY_TYPES = [
  { type: "Standard Same-Day", sla: "4-6 hours", price: "$35-75", desc: "Non-urgent documents within metro area" },
  { type: "Rush Delivery", sla: "1-2 hours", price: "$75-150", desc: "Time-sensitive legal filings, court documents" },
  { type: "Scheduled Delivery", sla: "Next business day", price: "$25-50", desc: "Pre-arranged pickup and delivery windows" },
  { type: "Legal Filing Run", sla: "Same day filing", price: "$50-100", desc: "Court filings with proof of submission" },
  { type: "Multi-Stop Route", sla: "4-8 hours", price: "$100-250", desc: "Multiple pickups/deliveries on single route" },
  { type: "After-Hours/Weekend", sla: "As scheduled", price: "$100-200", desc: "Outside business hours delivery service" },
];

const OHIO_COURIER_COMPLIANCE = [
  { rule: "No special license required for document courier in Ohio", ref: "General Business" },
  { rule: "Commercial auto insurance required for business vehicle use", ref: "ORC §4509.01" },
  { rule: "HIPAA compliance required for medical document transport", ref: "45 CFR §164" },
  { rule: "Chain of custody documentation for legal evidence", ref: "Ohio R. Evid. 901" },
  { rule: "Court filing deadlines are jurisdictional — no extensions", ref: "Ohio Civ.R. 6" },
];

export function CourierAdvancedTools() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Chain of Custody Protocol
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {CHAIN_OF_CUSTODY_STEPS.map((s, i) => (
              <div key={s.step} className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{i + 1}</div>
                  <h4 className="font-semibold text-sm">{s.step}</h4>
                </div>
                <div className="grid gap-1 ml-10">
                  {s.actions.map((a) => (
                    <div key={a} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-success" /> {a}
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
            <Truck className="h-5 w-5" />
            Delivery Service Types & Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DELIVERY_TYPES.map((d) => (
              <div key={d.type} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{d.type}</span>
                    <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />{d.sla}</Badge>
                    <Badge variant="secondary" className="text-xs">{d.price}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ohio Courier Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {OHIO_COURIER_COMPLIANCE.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded bg-muted/50">
                <span className="text-sm flex-1">{r.rule}</span>
                <Badge variant="outline" className="text-xs shrink-0">{r.ref}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
