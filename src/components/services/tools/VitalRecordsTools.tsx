import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, FileText, MapPin, DollarSign } from "lucide-react";

const OHIO_VITAL_RECORDS = [
  { type: "Birth Certificate", agency: "Ohio Dept of Health", fee: "$21.50", processing: "2-4 weeks", notes: "Must be direct relative or legal representative" },
  { type: "Death Certificate", agency: "Ohio Dept of Health", fee: "$21.50", processing: "2-4 weeks", notes: "Available to spouse, parent, child, or legal rep" },
  { type: "Marriage Certificate", agency: "County Probate Court", fee: "$5-15", processing: "Same day to 1 week", notes: "Issued by county where license was obtained" },
  { type: "Divorce Decree", agency: "County Common Pleas Court", fee: "$10-25", processing: "1-2 weeks", notes: "Certified copies from clerk of courts" },
  { type: "Adoption Records", agency: "County Probate Court", fee: "Varies", processing: "4-8 weeks", notes: "Requires court order for sealed records" },
  { type: "Name Change Order", agency: "County Common Pleas Court", fee: "$150-200 (filing)", processing: "4-8 weeks", notes: "Publication requirement in local newspaper" },
];

const OHIO_COUNTY_OFFICES = [
  { county: "Franklin", address: "373 S High St, Columbus, OH 43215", phone: "(614) 525-3894" },
  { county: "Cuyahoga", address: "1 Lakeside Ave, Cleveland, OH 44114", phone: "(216) 443-7950" },
  { county: "Hamilton", address: "230 E 9th St, Cincinnati, OH 45202", phone: "(513) 946-4010" },
  { county: "Summit", address: "209 S High St, Akron, OH 44308", phone: "(330) 643-2350" },
  { county: "Montgomery", address: "41 N Perry St, Dayton, OH 45402", phone: "(937) 225-4640" },
  { county: "Lucas", address: "700 Adams St, Toledo, OH 43604", phone: "(419) 213-4775" },
];

export function VitalRecordsTools() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Ohio Vital Records Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {OHIO_VITAL_RECORDS.map((rec) => (
              <div key={rec.type} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{rec.type}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <DollarSign className="h-3 w-3 mr-0.5" />{rec.fee}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">{rec.processing}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Agency:</span> {rec.agency}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{rec.notes}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ohio County Offices Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {OHIO_COUNTY_OFFICES.map((office) => (
              <div key={office.county} className="p-3 rounded-lg bg-muted/50">
                <p className="font-semibold text-sm">{office.county} County</p>
                <p className="text-xs text-muted-foreground mt-1">{office.address}</p>
                <p className="text-xs text-primary mt-0.5">{office.phone}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
