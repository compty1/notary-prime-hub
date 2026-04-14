/**
 * NS-006: Service area display with Ohio county map visualization
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

// Extended Ohio county/city coordinates for SVG positioning
const OHIO_LOCATIONS: Record<string, { x: number; y: number }> = {
  "franklin": { x: 50, y: 55 }, "columbus": { x: 50, y: 55 },
  "madison": { x: 42, y: 55 }, "west jefferson": { x: 40, y: 54 },
  "london": { x: 40, y: 56 }, "delaware": { x: 52, y: 45 },
  "union": { x: 45, y: 42 }, "marysville": { x: 45, y: 42 },
  "pickaway": { x: 52, y: 65 }, "circleville": { x: 52, y: 65 },
  "licking": { x: 60, y: 52 }, "newark": { x: 60, y: 52 },
  "fairfield": { x: 58, y: 62 }, "lancaster": { x: 58, y: 62 },
  "clark": { x: 32, y: 55 }, "springfield": { x: 32, y: 55 },
  "greene": { x: 35, y: 60 }, "xenia": { x: 35, y: 60 },
  "montgomery": { x: 30, y: 62 }, "dayton": { x: 30, y: 60 },
  "hamilton": { x: 25, y: 75 }, "cincinnati": { x: 25, y: 75 },
  "cuyahoga": { x: 62, y: 15 }, "cleveland": { x: 62, y: 15 },
  "summit": { x: 65, y: 22 }, "akron": { x: 65, y: 22 },
  "lucas": { x: 30, y: 10 }, "toledo": { x: 30, y: 10 },
  "mahoning": { x: 78, y: 22 }, "youngstown": { x: 78, y: 22 },
  "stark": { x: 70, y: 28 }, "canton": { x: 70, y: 28 },
  "lorain": { x: 55, y: 15 }, "elyria": { x: 55, y: 15 },
  "butler": { x: 28, y: 72 }, "warren": { x: 38, y: 52 },
  "lake": { x: 68, y: 12 }, "mentor": { x: 68, y: 12 },
  "trumbull": { x: 78, y: 18 }, "medina": { x: 58, y: 22 },
  "portage": { x: 70, y: 20 }, "richland": { x: 52, y: 30 },
  "mansfield": { x: 52, y: 30 }, "tuscarawas": { x: 68, y: 35 },
  "ross": { x: 48, y: 72 }, "chillicothe": { x: 48, y: 72 },
  "scioto": { x: 42, y: 82 }, "portsmouth": { x: 42, y: 82 },
  "athens": { x: 62, y: 72 }, "muskingum": { x: 62, y: 55 },
  "zanesville": { x: 62, y: 55 }, "wood": { x: 35, y: 15 },
  "bowling green": { x: 35, y: 15 }, "allen": { x: 32, y: 30 },
  "lima": { x: 32, y: 30 }, "marion": { x: 45, y: 35 },
  "knox": { x: 55, y: 42 }, "mount vernon": { x: 55, y: 42 },
  "ashland": { x: 58, y: 28 }, "erie": { x: 48, y: 12 },
  "sandusky": { x: 48, y: 12 }, "huron": { x: 48, y: 18 },
  "hancock": { x: 38, y: 25 }, "findlay": { x: 38, y: 25 },
  "miami": { x: 28, y: 55 }, "troy": { x: 28, y: 55 },
  "preble": { x: 24, y: 60 }, "darke": { x: 22, y: 52 },
  "shelby": { x: 32, y: 42 }, "auglaize": { x: 28, y: 38 },
  "mercer": { x: 22, y: 35 }, "van wert": { x: 22, y: 28 },
  "defiance": { x: 22, y: 18 }, "williams": { x: 18, y: 10 },
  "fulton": { x: 25, y: 8 }, "henry": { x: 28, y: 15 },
  "putnam": { x: 30, y: 25 }, "seneca": { x: 42, y: 22 },
  "tiffin": { x: 42, y: 22 }, "crawford": { x: 45, y: 28 },
  "wyandot": { x: 40, y: 28 }, "hardin": { x: 38, y: 32 },
  "logan": { x: 38, y: 38 }, "champaign": { x: 35, y: 48 },
  "urbana": { x: 35, y: 48 }, "fayette": { x: 42, y: 62 },
  "washington ch": { x: 42, y: 62 }, "highland": { x: 38, y: 70 },
  "hillsboro": { x: 38, y: 70 }, "pike": { x: 42, y: 78 },
  "jackson": { x: 48, y: 78 }, "gallia": { x: 55, y: 82 },
  "gallipolis": { x: 55, y: 82 }, "meigs": { x: 60, y: 78 },
  "washington": { x: 65, y: 65 }, "marietta": { x: 68, y: 65 },
  "morgan": { x: 62, y: 62 }, "perry": { x: 58, y: 58 },
  "hocking": { x: 55, y: 65 }, "vinton": { x: 52, y: 70 },
  "adams": { x: 35, y: 80 }, "brown": { x: 30, y: 78 },
  "clermont": { x: 28, y: 78 }, "clinton": { x: 35, y: 65 },
  "wilmington": { x: 35, y: 65 }, "warren county": { x: 28, y: 68 },
  "lebanon": { x: 28, y: 68 }, "geauga": { x: 72, y: 15 },
  "ashtabula": { x: 78, y: 10 }, "columbiana": { x: 80, y: 28 },
  "jefferson": { x: 78, y: 32 }, "belmont": { x: 75, y: 40 },
  "guernsey": { x: 68, y: 45 }, "harrison": { x: 75, y: 38 },
  "carroll": { x: 72, y: 32 }, "holmes": { x: 62, y: 32 },
  "wayne": { x: 60, y: 28 }, "wooster": { x: 60, y: 28 },
  "coshocton": { x: 62, y: 42 }, "noble": { x: 68, y: 50 },
  "monroe": { x: 72, y: 48 },
};

export function ServiceAreaMap({ areas, isRonCertified, isMobileNotary, themeColor }: ServiceAreaMapProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-6 flex-col sm:flex-row">
          {/* SVG Ohio map */}
          <div className="relative h-52 w-full sm:w-52 shrink-0 rounded-lg bg-muted/50 border overflow-hidden">
            <svg viewBox="0 0 100 100" className="h-full w-full" aria-label={`Service areas: ${areas.join(", ")}`}>
              <path
                d="M18,5 L48,5 L55,3 L65,5 L80,8 L82,12 L78,18 L80,25 L78,32 L76,40 L74,48 L70,55 L68,62 L65,68 L60,75 L55,80 L50,85 L45,88 L38,85 L32,80 L28,75 L25,68 L22,60 L20,50 L18,40 L18,30 L20,20 L18,12 Z"
                fill={`${themeColor}08`}
                stroke={`${themeColor}30`}
                strokeWidth="0.5"
              />
              {areas.map((area, i) => {
                const key = area.toLowerCase().split(",")[0].trim();
                const pos = OHIO_LOCATIONS[key] || { x: 45 + ((i * 7) % 30), y: 40 + ((i * 11) % 40) };
                return (
                  <g key={i}>
                    <motion.circle
                      cx={pos.x} cy={pos.y} r="2.5"
                      fill={themeColor} opacity="0.8"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.05, type: "spring" }}
                    />
                    <circle cx={pos.x} cy={pos.y} r="6" fill={themeColor} opacity="0.08" />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Area badges */}
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
