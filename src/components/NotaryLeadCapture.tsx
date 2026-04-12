/**
 * NS-006: Lead capture form for notary pages.
 * Submits to leads table and triggers CRM pipeline.
 */
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, CheckCircle2 } from "lucide-react";

const leadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number").max(20).optional().or(z.literal("")),
  service: z.string().min(1, "Please select a service"),
  message: z.string().max(1000).optional().or(z.literal("")),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface NotaryLeadCaptureProps {
  notarySlug?: string;
  notaryName?: string;
  notaryUserId?: string;
  services?: string[];
}

const defaultServices = [
  "Remote Online Notarization",
  "In-Person Notarization",
  "Mobile Notarization",
  "Loan Signing",
  "Apostille",
  "I-9 Verification",
  "Document Preparation",
  "Estate Planning",
  "Other",
];

export function NotaryLeadCapture({ notarySlug, notaryName, notaryUserId, services }: NotaryLeadCaptureProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: "", email: "", phone: "", service: "", message: "" },
  });

  const serviceOptions = services?.length ? services : defaultServices;

  async function onSubmit(data: LeadFormData) {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("leads").insert({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        source: notarySlug ? `notary-page:${notarySlug}` : "notary-page",
        status: "new",
        notes: [
          data.service ? `Service: ${data.service}` : "",
          data.message ? `Message: ${data.message}` : "",
          notaryName ? `Notary: ${notaryName}` : "",
        ].filter(Boolean).join("\n"),
      });

      if (error) throw error;

      // Log to audit
      await supabase.from("audit_log").insert({
        action: "lead_captured",
        entity_type: "lead",
        details: {
          source: `notary-page:${notarySlug || "unknown"}`,
          service: data.service,
          notary_user_id: notaryUserId,
        },
      }).then(() => {}, () => {});

      setSubmitted(true);
      toast.success("Thank you! We'll be in touch shortly.");
    } catch (err) {
      console.error("Lead capture failed:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Message Sent!</h3>
          <p className="text-muted-foreground">
            {notaryName ? `${notaryName} will` : "We'll"} get back to you within 1 business day.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-border">
      <CardHeader>
        <CardTitle className="text-lg font-bold">
          {notaryName ? `Contact ${notaryName}` : "Get in Touch"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input type="tel" placeholder="(555) 555-5555" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="service" render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Needed *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {serviceOptions.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="message" render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl><Textarea placeholder="Tell us about your needs..." rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={submitting}>
              <Send className="mr-2 h-4 w-4" />
              {submitting ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
