import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, MapPin, Award, Shield, Star, Search, Calendar, User, ChevronLeft, ChevronRight, ArrowUpDown, Monitor } from "lucide-react";
import { motion } from "framer-motion";
import { ensureHex } from "@/lib/colorUtils";
import { CommissionBadge } from "@/components/CommissionBadge";

const PROFESSIONAL_TYPES: Record<string, string> = {
  notary: "Notary Public",
  signing_agent: "Signing Agent",
  doc_preparer: "Document Preparer",
  virtual_assistant: "Virtual Assistant",
  mobile_notary: "Mobile Notary",
  other: "Professional",
};

interface ProfessionalSummary {
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
  professional_type: string;
  services_offered: any[];
  status: string;
}

const PAGE_SIZE = 12;

export default function NotaryDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const typeFilter = searchParams.get("type");

  usePageMeta({
    title: typeFilter
      ? `Find a ${PROFESSIONAL_TYPES[typeFilter] || "Professional"} — Ohio Professional Directory`
      : "Find a Notary or Professional — Ohio Directory",
    description: typeFilter
      ? `Browse certified Ohio ${PROFESSIONAL_TYPES[typeFilter] || "professional"}s. Book in-person or remote online notarization appointments.`
      : "Browse certified Ohio notary and service professionals. Book in-person or remote online notarization appointments with trusted, credentialed professionals.",
  });

  const [professionals, setProfessionals] = useState<ProfessionalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState(typeFilter || "all");
  const [ronFilter, setRonFilter] = useState(searchParams.get("ron") === "true");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"featured" | "name" | "areas">("featured");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("notary_pages")
        .select("id, slug, display_name, title, tagline, profile_photo_path, theme_color, service_areas, credentials, is_featured, professional_type, services_offered, status")
        .eq("is_published", true)
        .order("is_featured", { ascending: false });
      setProfessionals((data as ProfessionalSummary[]) || []);
      setLoading(false);
    })();
  }, []);

  // W003: Sync type filter with URL
  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setCurrentPage(1);
    if (value === "all") {
      searchParams.delete("type");
    } else {
      searchParams.set("type", value);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const filtered = professionals.filter(p => {
    const matchesSearch =
      p.display_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.service_areas || []).some((a: string) => a.toLowerCase().includes(search.toLowerCase()));
    const matchesType = selectedType === "all" || p.professional_type === selectedType;
    const matchesRon = !ronFilter || (p.credentials?.ron_certified === true);
    return matchesSearch && matchesType && matchesRon;
  }).sort((a, b) => {
    if (sortBy === "name") return a.display_name.localeCompare(b.display_name);
    if (sortBy === "areas") return (b.service_areas?.length || 0) - (a.service_areas?.length || 0);
    return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
  });

  // DIR001: Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedResults = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            {typeFilter ? `Find a ${PROFESSIONAL_TYPES[typeFilter] || "Professional"}` : "Find a Professional"}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Browse our network of certified Ohio professionals
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or area..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
          </div>
          <Select value={selectedType} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(PROFESSIONAL_TYPES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* DIR002: Sort options */}
          <Select value={sortBy} onValueChange={(v) => { setSortBy(v as never); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-40">
              <ArrowUpDown className="mr-1 h-3 w-3" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured First</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="areas">Most Areas</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 whitespace-nowrap text-sm cursor-pointer">
            <Checkbox
              checked={ronFilter}
              onCheckedChange={(v) => {
                setRonFilter(!!v);
                setCurrentPage(1);
                if (v) searchParams.set("ron", "true"); else searchParams.delete("ron");
                setSearchParams(searchParams, { replace: true });
              }}
            />
            <Monitor className="h-3 w-3" /> RON Available
          </label>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <User className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No professionals found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{filtered.length} professional{filtered.length !== 1 ? "s" : ""} found</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedResults.map((pro, i) => {
                const creds = pro.credentials || {};
                const areas = (pro.service_areas || []) as string[];
                const themeColor = ensureHex(pro.theme_color);
                const typeLabel = PROFESSIONAL_TYPES[pro.professional_type] || "Professional";

                return (
                  <motion.div
                    key={pro.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link to={`/n/${pro.slug}`}>
                      <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div
                              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2"
                              style={{ borderColor: themeColor, background: `${themeColor}15` }}
                            >
                              {pro.profile_photo_path?.startsWith("http") ? (
                                <img src={pro.profile_photo_path} alt={pro.display_name} className="h-full w-full rounded-full object-cover" />
                              ) : (
                                <span className="text-xl font-black" style={{ color: themeColor }}>
                                  {pro.display_name?.charAt(0)?.toUpperCase() || "P"}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-foreground truncate">{pro.display_name}</h3>
                                {pro.is_featured && <Star className="h-4 w-4 shrink-0 text-amber-500 fill-amber-500" />}
                              </div>
                              {pro.title && <p className="text-sm" style={{ color: themeColor }}>{pro.title}</p>}
                              <Badge variant="outline" className="mt-1 text-xs">{typeLabel}</Badge>
                            </div>
                          </div>

                          {pro.tagline && (
                            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{pro.tagline}</p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-1">
                            {creds.nna_certified && <Badge variant="secondary" className="text-xs gap-1"><Award className="h-3 w-3" /> NNA</Badge>}
                            {creds.ron_certified && <Badge variant="secondary" className="text-xs gap-1"><Shield className="h-3 w-3" /> RON</Badge>}
                            <CommissionBadge expirationDate={creds.commission_expiration} />
                          </div>

                          {/* Top services */}
                          {pro.services_offered && Array.isArray(pro.services_offered) && pro.services_offered.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {pro.services_offered.slice(0, 3).map((svc: any, j: number) => (
                                <Badge key={j} variant="outline" className="text-xs">
                                  {typeof svc === "string" ? svc : svc.name}
                                </Badge>
                              ))}
                              {pro.services_offered.length > 3 && (
                                <Badge variant="outline" className="text-xs">+{pro.services_offered.length - 3}</Badge>
                              )}
                            </div>
                          )}

                          {areas.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {areas.slice(0, 3).map((area, j) => (
                                <Badge key={j} variant="outline" className="text-xs gap-1">
                                  <MapPin className="h-3 w-3" /> {area}
                                </Badge>
                              ))}
                              {areas.length > 3 && <Badge variant="outline" className="text-xs">+{areas.length - 3}</Badge>}
                            </div>
                          )}

                          <Button
                            size="sm"
                            className="mt-4 w-full gap-1 font-bold"
                            style={{ backgroundColor: themeColor }}
                          >
                            <Calendar className="h-3 w-3" /> View & Book
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* DIR001: Pagination controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .map((p, idx, arr) => (
                    <span key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-muted-foreground">…</span>}
                      <Button variant={p === currentPage ? "default" : "outline"} size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p)}>
                        {p}
                      </Button>
                    </span>
                  ))}
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </PageShell>
  );
}
