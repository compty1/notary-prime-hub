import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface ZoomConsultCTAProps {
  /** Compact = sidebar/inline use, fewer paragraphs */
  compact?: boolean;
  className?: string;
  /** Override the heading copy */
  title?: string;
  /** Override the booking destination */
  bookHref?: string;
}

/**
 * Reusable "Have Questions? Schedule a free Zoom consultation" CTA.
 * Used across service pages, RON info, loan signing, solutions pages, and home.
 */
export function ZoomConsultCTA({
  compact = false,
  className,
  title = "Have Questions?",
  bookHref = "/book?service=Consultation",
}: ZoomConsultCTAProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className={cn("space-y-3", compact ? "p-4" : "p-5")}>
          <h3 className="font-sans text-sm font-semibold flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" /> {title}
          </h3>
          <p className="text-xs text-muted-foreground">
            Schedule a free Zoom consultation to discuss your needs and get personalized guidance.
          </p>
          {!compact && (
            <>
              <p className="text-xs text-muted-foreground">
                Or message us for a response within 24 hours — we typically respond within 2 hours during business hours.
              </p>
              <p className="text-xs text-muted-foreground">
                You can also{" "}
                <Link to="/digitize" className="text-primary underline">
                  upload your document
                </Link>{" "}
                for instant AI-powered answers about what's needed.
              </p>
            </>
          )}
          <div className="flex gap-2 flex-wrap pt-1">
            <Link to={bookHref}>
              <Button size="sm">
                <Monitor className="mr-1 h-3 w-3" /> Schedule Zoom
              </Button>
            </Link>
            <Link to="/notary-guide">
              <Button size="sm" variant="outline">
                Browse Guides
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default ZoomConsultCTA;
