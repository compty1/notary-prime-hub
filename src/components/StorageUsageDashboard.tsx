import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { HardDrive, FileText, Image, Film } from "lucide-react";

type StorageStats = {
  bucketName: string;
  fileCount: number;
  estimatedSizeMB: number;
};

export function StorageUsageDashboard() {
  const [stats, setStats] = useState<StorageStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const buckets = ["documents", "signatures"];
      const results: StorageStats[] = [];

      for (const bucket of buckets) {
        try {
          const { data } = await supabase.storage.from(bucket).list("", { limit: 1000 });
          results.push({
            bucketName: bucket,
            fileCount: data?.length ?? 0,
            estimatedSizeMB: (data?.length ?? 0) * 0.5, // estimate
          });
        } catch {
          results.push({ bucketName: bucket, fileCount: 0, estimatedSizeMB: 0 });
        }
      }

      setStats(results);
      setLoading(false);
    };
    load();
  }, []);

  const totalFiles = stats.reduce((s, b) => s + b.fileCount, 0);
  const totalMB = stats.reduce((s, b) => s + b.estimatedSizeMB, 0);
  const limitMB = 1024; // 1GB estimate

  const bucketIcon = (name: string) => {
    if (name === "documents") return <FileText className="h-4 w-4" />;
    if (name === "signatures") return <Image className="h-4 w-4" />;
    return <HardDrive className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <HardDrive className="h-4 w-4" /> Storage Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>{totalMB.toFixed(0)} MB used</span>
                <span className="text-muted-foreground">{limitMB} MB limit</span>
              </div>
              <Progress value={(totalMB / limitMB) * 100} className="h-2" />
            </div>

            <div className="space-y-2">
              {stats.map(bucket => (
                <div key={bucket.bucketName} className="flex items-center gap-3 p-2 border rounded">
                  {bucketIcon(bucket.bucketName)}
                  <div className="flex-1">
                    <span className="text-sm font-medium capitalize">{bucket.bucketName}</span>
                    <p className="text-[10px] text-muted-foreground">{bucket.fileCount} files • ~{bucket.estimatedSizeMB.toFixed(0)} MB</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {((bucket.estimatedSizeMB / limitMB) * 100).toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground">
              {totalFiles} total files across {stats.length} buckets
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
