/**
 * NS-004: Compact embedded booking widget for notary pages
 * Renders inline date/service picker with direct booking flow
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface EmbeddableBookingWidgetProps {
  notarySlug: string;
  notaryName: string;
  services: string[];
  themeColor: string;
  usePlatformBooking: boolean;
  externalBookingUrl?: string;
}

export function EmbeddableBookingWidget({
  notarySlug,
  notaryName,
  services,
  themeColor,
  usePlatformBooking,
  externalBookingUrl,
}: EmbeddableBookingWidgetProps) {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState("");

  const handleBook = () => {
    if (usePlatformBooking) {
      const params = new URLSearchParams({ notary: notarySlug, ref: notarySlug });
      if (selectedService) params.set("service", selectedService);
      navigate(`/book?${params.toString()}`);
    } else if (externalBookingUrl) {
      window.open(externalBookingUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <Card className="border-2 shadow-lg" style={{ borderColor: `${themeColor}40` }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" style={{ color: themeColor }} />
            Book with {notaryName}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select a service and schedule your appointment
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {services.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Service Type</label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a service..." />
                </SelectTrigger>
                <SelectContent>
                  {services.map((svc) => (
                    <SelectItem key={svc} value={svc}>
                      {svc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">Same-day appointments often available</p>
              <p className="text-xs text-muted-foreground">Book online 24/7 — we'll confirm your slot</p>
            </div>
          </div>

          <Button
            onClick={handleBook}
            className="w-full gap-2 font-bold text-base py-5"
            style={{ backgroundColor: themeColor }}
          >
            Book Appointment <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Free cancellation up to 24 hours before your appointment
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
