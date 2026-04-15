import React, { useState } from "react";
import { Truck, Search, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EnterpriseLayout from "@/components/enterprise/EnterpriseLayout";
import DocumentGeneratorModal from "@/components/enterprise/DocumentGeneratorModal";

const AutoFleetDesk = () => {
  const [vin, setVin] = useState("");
  const [result, setResult] = useState<any>(null);
  const [decoding, setDecoding] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const isValidVin = /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin.trim());

  const handleDecode = async () => {
    if (!isValidVin) { toast.error("Invalid VIN format"); return; }
    setDecoding(true);
    try {
      const { data, error } = await supabase.functions.invoke("decode-vin", { body: { vin: vin.trim() } });
      if (error) throw error;
      setResult(data);
      toast.success("VIN decoded successfully");
    } catch (err: any) {
      toast.error(err.message || "Decode failed");
    } finally {
      setDecoding(false);
    }
  };

  const vehicleChips = result ? [
    { label: "Year", value: result.year },
    { label: "Make", value: result.make },
    { label: "Model", value: result.model },
    { label: "Body", value: result.body_class },
    { label: "Fuel", value: result.fuel_type },
    { label: "Engine", value: `${result.engine_cylinders} cyl` },
    { label: "Drive", value: result.drive_type },
    { label: "Doors", value: result.doors },
    { label: "GVWR", value: result.gvwr },
    { label: "Trim", value: result.trim },
    { label: "Country", value: result.plant_country },
    { label: "Manufacturer", value: result.manufacturer },
  ].filter(c => c.value) : [];

  return (
    <EnterpriseLayout title="VIN Decoder / Auto Fleet Desk" icon={Truck} description="Decode VINs using the free NHTSA API and generate odometer disclosures">
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-10 font-mono uppercase tracking-widest" placeholder="Enter 17-character VIN..." value={vin} onChange={(e) => setVin(e.target.value.toUpperCase())} maxLength={17} onKeyDown={(e) => e.key === "Enter" && handleDecode()} />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono ${vin.length === 17 ? "text-green-500" : "text-muted-foreground"}`}>{vin.length}/17</span>
                <Button onClick={handleDecode} disabled={!isValidVin || decoding} variant="dark">
                  {decoding ? "Decoding..." : "Decode VIN"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  {result.year} {result.make} {result.model}
                  <Badge variant="outline">{result.vin}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {vehicleChips.map((c, i) => (
                    <div key={i} className="rounded-[12px] bg-muted px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{c.label}</p>
                      <p className="text-sm font-bold">{c.value}</p>
                    </div>
                  ))}
                </div>
                <Button onClick={() => setShowModal(true)} variant="outline" className="mt-4">
                  <FileText className="mr-2 h-4 w-4" />Generate Odometer Disclosure
                </Button>
              </CardContent>
            </Card>

            <DocumentGeneratorModal
              isOpen={showModal}
              onClose={() => setShowModal(false)}
              templateId="odometer_disclosure"
              data={{
                vin: result.vin, year: result.year || "", make: result.make || "",
                model: result.model || "", date: new Date().toLocaleDateString(),
              }}
            />
          </>
        )}
      </div>
    </EnterpriseLayout>
  );
};

export default AutoFleetDesk;
