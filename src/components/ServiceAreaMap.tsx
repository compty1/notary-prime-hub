/**
 * NS-006: Service area display with visual map placeholder
 * Uses a styled visual representation of service areas
 */
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Globe, Car } from "lucide-react";
import { motion } from "framer-motion";

interface ServiceAreaMapProps {
  areas: string[];
  isRonCertified?: boolean;
  isMobileNotary?: boolean;
  themeColor: string;
}

// Ohio county coordinates for visual positioning (simplified)
const OHIO_COUNTIES: Record<string, { x: number; y: number }> = {
  "franklin": { x: 50, y: 55 },
  "columbus": { x: 50, y: 55 },
  "madison": { x: 42, y: 55 },
  "west jefferson": { x: 40, y: 54 },
  "london": { x: 40, y: 56 },
  "delaware": { x: 52, y: 45 },
  "union": { x: 45, y: 42 },
  "pickaway": { x: 52, y: 65 },
  "licking": { x: 60, y: 52 },
  "fairfield": { x: 58, y: 62 },
  "clark": { x: 32, y: 55 },
  "greene": { x: 35, y: 60 },
  "montgomery": { x: 30, y: 62 },
  "dayton": { x: 30, y: 60 },
  "hamilton": { x: 25, y: 75 },
  "cincinnati": { x: 25, y: 75 },
  "cuyahoga": { x: 62, y: 15 },
  "cleveland": { x: 62, y: 15 },
  "summit": { x: 65, y: 22 },
  "akron": { x: 65, y: 22 },
  "lucas": { x: 30, y: 10 },
  "toledo": { x: 30, y: 10 },
};

export function ServiceAreaMap({ areas, isRonCertified, isMobileNotary, themeColor }: ServiceAreaMapProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-6 flex-col sm:flex-row">
          {/* Visual area representation */}
          <div className="relative h-48 w-full sm:w-48 shrink-0 rounded-lg bg-muted/50 border overflow-hidden">
            <svg viewBox="0 0 100 100" className="h-full w-full" aria-label="Service area visualization">
              {/* Ohio state outline (simplified) */}
              <path
                d="M25,5 L75,5 L80,15 L78,30 L72,45 L70,60 L68,75 L60,85 L50,90 L35,85 L25,75 L22,60 L20,45 L22,30 L25,15 Z"
                fill={`${themeColor}08`}
                stroke={`${themeColor}30`}
                strokeWidth="0.5"
              />
              {/* Area markers */}
              {areas.map((area, i) => {
                const key = area.toLowerCase().split(",")[0].trim();
                const pos = OHIO_COUNTIES[key] || { x: 50 + (i * 5 - 10), y: 50 + (i * 5 - 10) };
                return (
                  <g key={i}>
                    <circle cx={pos.x} cy={pos.y} r="3" fill={themeColor} opacity="0.7" />
                    <circle cx={pos.x} cy={pos.y} r="8" fill={themeColor} opacity="0.1" />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Area list */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap gap-2">
              {areas.map((area, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  viewport={{ once: true }}
                >
                  <Badge variant="secondary" className="gap-1 text-sm px-3 py-1.5">
                    <MapPin className="h-3 w-3" /> {area}
                  </Badge>
                </motion.div>
              ))}
            </div>

            <div className="space-y-2 pt-2">
              {isMobileNotary && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Car className="h-4 w-4" style={{ color: themeColor }} />
                  <span>Mobile notary — <strong>will travel to your location</strong></span>
                </p>
              )}
              {isRonCertified && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" style={{ color: themeColor }} />
                  <span>Remote Online Notarization — <strong>serve clients anywhere in Ohio</strong></span>
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
