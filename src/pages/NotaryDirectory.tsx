import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Award, Shield, Star, Search, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface NotarySummary {
  id: string;
  slug: string;
  display_name: string;
  title: string;
  tagline: string;
  profile_photo_path: string | null;
  theme_color: string;
  service_areas: string[];
  credentials: Record<string, any>;
  is_featured: boolean;
}

export default function NotaryDirectory() {
  usePageMeta({
    title: "Find a Notary — Ohio Notary Directory",
    description: "Browse certified Ohio notary professionals. Book in-person or remote online notarization appointments with trusted, credentialed notaries.",
  });

  const [notaries, setNotaries] = useState<NotarySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("notary_pages")
        .select("id, slug, display_name, title, tagline, profile_photo_path, theme_color, service_areas, credentials, is_featured")
        .eq("is_published", true)
        .order("is_featured", { ascending: false });
      setNotaries((data as any[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = notaries.filter(n =>
    n.display_name.toLowerCase().includes(search.toLowerCase()) ||
    (n.service_areas || []).some((a: string) => a.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Find a Notary</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Browse our network of certified Ohio notary professionals
          </p>
        </div>

        <div className="relative mx-auto mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or location..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No notaries found matching your search.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((n, i) => {
              const creds = n.credentials || {};
              const color = n.theme_color || "#eab308";
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/n/${n.slug}`}>
                    <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer group">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div
                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 text-xl font-black"
                            style={{ borderColor: color, color, background: `${color}10` }}
                          >
                            {n.profile_photo_path ? (
                              <img src={n.profile_photo_path} alt={n.display_name} className="h-full w-full rounded-full object-cover" />
                            ) : (
                              n.display_name?.charAt(0)?.toUpperCase() || "N"
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-foreground truncate group-hover:underline">{n.display_name}</h3>
                              {n.is_featured && <Star className="h-4 w-4 shrink-0 text-amber-500 fill-amber-500" />}
                            </div>
                            {n.title && <p className="text-sm" style={{ color }}>{n.title}</p>}
                            {n.tagline && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{n.tagline}</p>}
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {creds.nna_certified && <Badge variant="outline" className="text-xs gap-1"><Award className="h-2.5 w-2.5" /> NNA</Badge>}
                          {creds.ron_certified && <Badge variant="outline" className="text-xs gap-1"><Shield className="h-2.5 w-2.5" /> RON</Badge>}
                          {creds.eo_insured && <Badge variant="outline" className="text-xs">E&O</Badge>}
                        </div>

                        {(n.service_areas || []).length > 0 && (
                          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{(n.service_areas as string[]).slice(0, 3).join(", ")}{(n.service_areas as string[]).length > 3 ? ` +${(n.service_areas as string[]).length - 3} more` : ""}</span>
                          </div>
                        )}

                        <Button size="sm" className="mt-4 w-full gap-1.5" style={{ backgroundColor: color }}>
                          <Calendar className="h-3.5 w-3.5" /> Book Appointment
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </PageShell>
  );
}
