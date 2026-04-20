import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_REGISTRY } from "@/lib/serviceRegistry";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSettings } from "@/hooks/useSettings";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Phone, Mail, Globe, Calendar, Shield, Award, CheckCircle,
  ExternalLink, FileSignature, Star, Facebook, Linkedin, Twitter, User,
  Share2, Pencil, ArrowRight, Clock, FileText, Users, MessageSquare,
  ChevronRight, Briefcase, Monitor, Lock,
} from "lucide-react";
import { motion } from "framer-motion";
import { BRAND } from "@/lib/brand";
import { ensureHex } from "@/lib/colorUtils";
import { sanitizeHtml } from "@/lib/sanitize";
import { NotaryReviews } from "@/components/NotaryReviews";
import { NotaryFAQ } from "@/components/NotaryFAQ";
import { NotaryLeadCapture } from "@/components/NotaryLeadCapture";
import { CommissionBadge } from "@/components/CommissionBadge";
import { EmbeddableBookingWidget } from "@/components/EmbeddableBookingWidget";
import { ServiceAreaMap } from "@/components/ServiceAreaMap";
import { NotaryPageQRShare } from "@/components/NotaryPageQRShare";

const PROFESSIONAL_TYPE_LABELS: Record<string, string> = {
  notary: "Commissioned Notary Public",
  signing_agent: "Signing Agent",
  doc_preparer: "Document Preparer",
  virtual_assistant: "Virtual Assistant",
  mobile_notary: "Mobile Notary",
  other: "Professional",
};

const PROCESS_STEPS = [
  { icon: Calendar, title: "Book Online", desc: "Choose a time that works for you — same-day appointments often available." },
  { icon: FileText, title: "Upload Documents", desc: "Securely upload your documents ahead of time so everything is ready." },
  { icon: Shield, title: "Verify Identity", desc: "Quick knowledge-based authentication and government ID check." },
  { icon: FileSignature, title: "Sign & Notarize", desc: "Complete your signing session — in person or via secure video." },
];

const TRUST_STATS = [
  { value: "100%", label: "Ohio Compliant" },
  { value: "Same-Day", label: "Availability" },
  { value: "24/7", label: "Online Booking" },
  { value: "Secure", label: "E-Seal Verified" },
];

interface NotaryPageData {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  title: string;
  tagline: string;
  bio: string;
  profile_photo_path: string | null;
  cover_photo_path: string | null;
  logo_path: string | null;
  phone: string;
  email: string;
  website_url: string;
  service_areas: any[];
  services_offered: any[];
  credentials: Record<string, any>;
  theme_color: string;
  accent_color: string;
  font_family: string;
  nav_services: string[];
  gallery_photos: string[];
  professional_type: string;
  signing_platform_url: string;
  use_platform_booking: boolean;
  external_booking_url: string;
  social_links: Record<string, string>;
  seo_title: string;
  seo_description: string;
  is_published: boolean;
  is_featured: boolean;
}

interface ServiceLink {
  id: string;
  name: string;
  short_description: string | null;
  category: string;
  price_from: number | null;
  pricing_model: string;
}

async function resolveStorageUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from("documents").createSignedUrl(path, 3600);
  return data?.signedUrl || null;
}

export default function NotaryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { get } = useSettings();
  const [page, setPage] = useState<NotaryPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [serviceLinks, setServiceLinks] = useState<ServiceLink[]>([]);

  usePageMeta({
    title: page?.seo_title || page?.display_name || "Notary",
    description: page?.seo_description || `Professional notary services by ${page?.display_name || "a certified notary"}.`,
    noIndex: page ? !page.is_published : false,
    ogImage: profilePhotoUrl || undefined,
    schema: page ? {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: page.display_name,
      description: page.seo_description || page.tagline,
      telephone: page.phone,
      email: page.email,
      url: `https://notar.com/n/${page.slug}`,
      areaServed: {
        "@type": "State",
        name: page.credentials?.commissioned_state || "Ohio",
      },
      image: profilePhotoUrl || undefined,
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Services",
        itemListElement: (page.services_offered || []).map((svc: any, i: number) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: svc.name || svc },
          position: i + 1,
        })),
      },
    } : null,
  });

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("notary_pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error || !data) { setNotFound(true); setLoading(false); return; }
      const pageData = data as unknown as NotaryPageData;
      setPage(pageData);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser && currentUser.id === pageData.user_id) setIsOwner(true);

      // Resolve photos in parallel
      const [profileUrl, coverUrl, resolvedLogoUrl] = await Promise.all([
        resolveStorageUrl(pageData.profile_photo_path),
        resolveStorageUrl(pageData.cover_photo_path),
        resolveStorageUrl(pageData.logo_path),
      ]);
      setProfilePhotoUrl(profileUrl);
      setCoverPhotoUrl(coverUrl);
      setLogoUrl(resolvedLogoUrl);

      const gallery = Array.isArray(pageData.gallery_photos) ? pageData.gallery_photos : [];
      if (gallery.length > 0) {
        const urls = await Promise.all(gallery.map(p => resolveStorageUrl(p)));
        setGalleryUrls(urls.filter((u): u is string => !!u));
      }

      // Fetch matching service records for clickable links
      const svcNames = (pageData.services_offered || []).map((s: any) => typeof s === "string" ? s : s.name).filter(Boolean);
      if (svcNames.length > 0) {
        const { data: svcData } = await supabase
          .from("services")
          .select("id, name, short_description, category, price_from, pricing_model")
          .in("name", svcNames)
          .eq("is_active", true);
        if (svcData) setServiceLinks(svcData);
      }

      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </PageShell>
    );
  }

  if (notFound || !page) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-3xl font-bold">Page Not Found</h1>
          <p className="text-muted-foreground">This page doesn't exist or hasn't been published yet.</p>
          <Link to="/"><Button>Return Home</Button></Link>
        </div>
      </PageShell>
    );
  }

  const creds = page.credentials || {};
  const socials = page.social_links || {};
  const services = (page.services_offered || []) as Array<{ name: string; description?: string; price?: number | string }>;
  const areas = (page.service_areas || []) as string[];
  const themeColor = ensureHex(page.theme_color);
  const accentColor = ensureHex(page.accent_color, "#1e40af");
  const fontFamily = page.font_family || "Inter";
  const navServices = Array.isArray(page.nav_services) ? page.nav_services : [];
  const professionalType = page.professional_type || "notary";
  const professionalLabel = PROFESSIONAL_TYPE_LABELS[professionalType] || "Professional";
  const refParam = page.slug;
  const hasSocialLinks = Object.values(socials).some(v => v && String(v).trim().length > 0);

  // Build service link map — combine DB services + registry for maximum match rate
  const svcLinkMap = new Map<string, ServiceLink & { registryPath?: string }>();
  serviceLinks.forEach(s => svcLinkMap.set(s.name.toLowerCase(), s));
  // Also add registry entries for name-based lookup so services without exact DB matches still link
  SERVICE_REGISTRY.forEach(r => {
    const key = r.name.toLowerCase();
    if (!svcLinkMap.has(key)) {
      svcLinkMap.set(key, { id: r.id, name: r.name, short_description: null, category: r.category, price_from: null, pricing_model: "flat", registryPath: r.path });
    } else {
      const existing = svcLinkMap.get(key)!;
      (existing as unknown as Record<string, unknown>).registryPath = r.path;
    }
  });

  let bookingUrl: string | null = null;
  let bookingLabel = "Book Appointment";
  if (page.use_platform_booking) {
    bookingUrl = `/book?notary=${page.slug}&ref=${refParam}`;
  } else if (page.external_booking_url) {
    bookingUrl = page.external_booking_url;
  } else {
    bookingUrl = page.email ? `mailto:${page.email}` : (page.phone ? `tel:${page.phone}` : null);
    bookingLabel = "Contact to Book";
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const BookButton = ({ size = "default" as "default" | "sm" | "lg", label }: { size?: "default" | "sm" | "lg"; label?: string }) => {
    const text = label || (bookingLabel === "Contact to Book" ? "Contact" : "Book Now");
    if (!bookingUrl) return null;
    if (bookingUrl.startsWith("/")) {
      return <Link to={bookingUrl}><Button size={size} className="gap-2 font-bold shadow-lg" style={{ backgroundColor: themeColor }}><Calendar className="h-4 w-4" /> {text}</Button></Link>;
    }
    return (
      <a href={bookingUrl} target={bookingUrl.startsWith("mailto:") || bookingUrl.startsWith("tel:") ? undefined : "_blank"} rel="noopener noreferrer">
        <Button size={size} className="gap-2 font-bold shadow-lg" style={{ backgroundColor: themeColor }}><Calendar className="h-4 w-4" /> {text}</Button>
      </a>
    );
  };

  return (
    <div style={{ fontFamily: `"${fontFamily.replace(/[^a-zA-Z0-9\s-]/g, "")}", sans-serif` }}>
      {fontFamily !== "Inter" && (
        <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily.replace(/[^a-zA-Z0-9\s-]/g, ""))}:wght@400;500;600;700;800;900&display=swap`} />
      )}
      <PageShell hideNav hideFooter isStandalonePage>
        {/* Sticky Nav */}
        <nav className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" aria-label="Professional page navigation">
          <div className="mx-auto max-w-6xl flex items-center gap-1 overflow-x-auto px-4 py-2">
            {logoUrl && (
              <img src={logoUrl} alt={`${page.display_name} logo`} className="h-8 w-auto max-w-[100px] object-contain mr-2 shrink-0" />
            )}
            <button onClick={() => scrollToSection("about")} className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted">About</button>
            {services.length > 0 && (
              <button onClick={() => scrollToSection("services")} className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted">Services</button>
            )}
            <button onClick={() => scrollToSection("how-it-works")} className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted">How It Works</button>
            {areas.length > 0 && (
              <button onClick={() => scrollToSection("areas")} className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted">Areas</button>
            )}
            {(page.use_platform_booking || page.external_booking_url) && (
              <button onClick={() => scrollToSection("book")} className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted">Book</button>
            )}
            {(creds.commission_number || creds.commission_expiration) && (
              <button onClick={() => scrollToSection("credentials")} className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted">Credentials</button>
            )}
            <button onClick={() => scrollToSection("contact")} className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted">Contact</button>
            {navServices.filter(n => !["About", "Services", "Contact"].includes(n)).map(name => (
              <button
                key={name}
                onClick={() => scrollToSection(name.toLowerCase().replace(/\s+/g, "-"))}
                className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
              >
                {name}
              </button>
            ))}
            <div className="ml-auto">
              <BookButton size="sm" label="Book" />
            </div>
          </div>
        </nav>

        {/* ══════ HERO ══════ */}
        <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${themeColor}22, ${accentColor}08)` }}>
          {coverPhotoUrl && (
            <div className="absolute inset-0 opacity-20">
              <img src={coverPhotoUrl} alt={`${page.display_name} cover photo`} className="h-full w-full object-cover" loading="lazy" />
            </div>
          )}
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 shadow-xl sm:h-40 sm:w-40" style={{ borderColor: themeColor, background: `${themeColor}15` }}>
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt={`${page.display_name} profile photo`} className="h-full w-full rounded-full object-cover" />
                ) : (
                  <span className="text-4xl font-black" style={{ color: themeColor }}>{page.display_name?.charAt(0)?.toUpperCase() || "N"}</span>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">{page.display_name}</h1>
                {page.title && <p className="mt-1 text-lg font-medium" style={{ color: themeColor }}>{page.title}</p>}
                {page.tagline && <p className="mt-2 text-lg text-muted-foreground">{page.tagline}</p>}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  <Badge variant="outline" className="gap-1" style={{ borderColor: accentColor, color: accentColor }}><User className="h-3 w-3" /> {professionalLabel}</Badge>
                  {creds.nna_certified && <Badge className="gap-1" style={{ backgroundColor: themeColor, color: "white" }}><Award className="h-3 w-3" /> NNA Certified</Badge>}
                  {creds.ron_certified && <Badge variant="secondary" className="gap-1"><Shield className="h-3 w-3" /> RON Certified</Badge>}
                  {creds.eo_insured && <Badge variant="outline" className="gap-1"><CheckCircle className="h-3 w-3" /> E&O Insured</Badge>}
                  {creds.bonded && <Badge variant="outline" className="gap-1"><CheckCircle className="h-3 w-3" /> Bonded</Badge>}
                  {page.is_featured && <Badge className="gap-1 bg-warning/10 text-primary-foreground"><Star className="h-3 w-3" /> Featured</Badge>}
                  <CommissionBadge expirationDate={creds.commission_expiration} />
                </div>
                {creds.commissioned_state?.toLowerCase().includes("ohio") && (
                  <div className="mt-2">
                    <Badge variant="outline" className="gap-1 text-xs border-success/30 text-success"><Shield className="h-3 w-3" /> Ohio Compliant — ORC §147</Badge>
                  </div>
                )}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                  <BookButton size="lg" label={bookingLabel} />
                  {page.signing_platform_url && (
                    <a href={page.signing_platform_url} target="_blank" rel="noopener noreferrer">
                      <Button size="lg" variant="outline" className="gap-2 font-bold"><FileSignature className="h-4 w-4" /> Sign Documents</Button>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Breadcrumb + Owner bar */}
        <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-between">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1 text-xs text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground">Home</Link></li>
              <li>/</li>
              <li><Link to="/notaries" className="hover:text-foreground">Directory</Link></li>
              <li>/</li>
              <li className="text-foreground font-medium">{page.display_name}</li>
            </ol>
          </nav>
           <div className="flex items-center gap-2">
            {isOwner && (
              <Link to="/portal?tab=notary-page"><Button variant="outline" size="sm" className="gap-1 text-xs"><Pencil className="h-3 w-3" /> Edit Page</Button></Link>
            )}
            <NotaryPageQRShare slug={page.slug} displayName={page.display_name} themeColor={themeColor} />
          </div>
        </div>

        {/* ══════ TRUST STATS BAR ══════ */}
        <section className="border-y bg-muted/20">
          <div className="mx-auto max-w-6xl grid grid-cols-2 sm:grid-cols-4 divide-x">
            {TRUST_STATS.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="px-4 py-6 text-center">
                <p className="text-2xl font-black" style={{ color: themeColor }}>{stat.value}</p>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══════ ABOUT ══════ */}
        <section id="about" className="mx-auto max-w-4xl px-4 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="mb-6 text-2xl font-bold flex items-center gap-2">
              <div className="h-8 w-1 rounded-full" style={{ backgroundColor: themeColor }} />
              About {page.display_name}
            </h2>
            {page.bio ? (
              <div className="prose prose-lg max-w-none text-muted-foreground dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.bio.replace(/\n/g, "<br />")) }} />
            ) : (
              <p className="text-muted-foreground">
                {page.display_name} is a {professionalLabel.toLowerCase()} serving {areas.length > 0 ? areas.slice(0, 3).join(", ") : "Ohio"}.
                {creds.ron_certified ? " Certified for Remote Online Notarization (RON)." : ""}
                {creds.nna_certified ? " National Notary Association certified." : ""}
                {" "}Providing professional, secure, and compliant document services.
              </p>
            )}
          </motion.div>
        </section>

        {/* ══════ GALLERY ══════ */}
        {galleryUrls.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="mb-4 text-2xl font-bold flex items-center gap-2">
              <div className="h-8 w-1 rounded-full" style={{ backgroundColor: themeColor }} />
              Gallery
            </h2>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
              {galleryUrls.map((url, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} viewport={{ once: true }} className="aspect-[4/3] overflow-hidden rounded-xl border shadow-sm">
                  <img src={url} alt={`${page.display_name} - gallery photo ${i + 1} of ${galleryUrls.length}`} className="h-full w-full object-cover" loading="lazy" />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ══════ SERVICES — CLICKABLE ══════ */}
        {services.length > 0 && (
          <section id="services" className="bg-muted/30 py-16">
            <div className="mx-auto max-w-6xl px-4">
              <h2 className="mb-2 text-2xl font-bold flex items-center gap-2">
                <div className="h-8 w-1 rounded-full" style={{ backgroundColor: themeColor }} />
                Services Offered
              </h2>
              <p className="mb-8 text-muted-foreground">Click any service to learn more about pricing, requirements, and how to get started.</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((svc: any, i: number) => {
                  const svcName = svc.name || svc;
                  const matched = svcLinkMap.get(svcName.toLowerCase());
                  const cardContent = (
                    <Card className={`h-full transition-all hover:shadow-lg ${matched ? "cursor-pointer hover:-translate-y-1" : ""} group`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-foreground group-hover:underline">{svcName}</h3>
                          {matched && <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" style={{ color: themeColor }} />}
                        </div>
                        {(svc.description || matched?.short_description) && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{svc.description || matched?.short_description}</p>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          {(svc.price || matched?.price_from) && (
                            <p className="text-sm font-semibold" style={{ color: themeColor }}>
                              {svc.price || (matched?.price_from ? `From $${matched.price_from}` : "")}
                            </p>
                          )}
                          {matched && (
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">View Details <ChevronRight className="h-3 w-3" /></span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );

                  return (
                    <motion.div
                      key={i}
                      id={svcName.toLowerCase().replace(/\s+/g, "-")}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      viewport={{ once: true }}
                    >
                      {matched ? (
                        <Link to={(matched as any).registryPath || `/services/${matched.id}`} className="block no-underline">
                          {cardContent}
                        </Link>
                      ) : (
                        cardContent
                      )}
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-8 text-center">
                <Link to="/services">
                  <Button variant="outline" className="gap-2">
                    View All Platform Services <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ══════ HOW IT WORKS ══════ */}
        <section id="how-it-works" className="py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="mb-2 text-center text-2xl font-bold">How It Works</h2>
            <p className="mb-10 text-center text-muted-foreground">Getting your documents notarized is simple and secure.</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {PROCESS_STEPS.map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                  <Card className="h-full text-center">
                    <CardContent className="p-6">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: `${themeColor}15` }}>
                        <step.icon className="h-6 w-6" style={{ color: themeColor }} />
                      </div>
                      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Step {i + 1}</div>
                      <h3 className="font-bold text-foreground">{step.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ SERVICE AREAS ══════ */}
        {areas.length > 0 && (
          <section id="areas" className="bg-muted/30 py-16">
            <div className="mx-auto max-w-4xl px-4">
              <h2 className="mb-6 text-2xl font-bold flex items-center gap-2">
                <div className="h-8 w-1 rounded-full" style={{ backgroundColor: themeColor }} />
                Service Areas
              </h2>
              <ServiceAreaMap
                areas={areas}
                isRonCertified={!!creds.ron_certified}
                isMobileNotary={professionalType === "mobile_notary"}
                themeColor={themeColor}
              />
            </div>
          </section>
        )}

        {/* ══════ EMBEDDED BOOKING ══════ */}
        {(page.use_platform_booking || page.external_booking_url) && (
          <section id="book" className="py-16">
            <div className="mx-auto max-w-lg px-4">
              <EmbeddableBookingWidget
                notarySlug={page.slug}
                notaryName={page.display_name}
                services={services.map((s: any) => s.name || s)}
                themeColor={themeColor}
                usePlatformBooking={page.use_platform_booking}
                externalBookingUrl={page.external_booking_url}
              />
            </div>
          </section>
        )}

        {/* ══════ CREDENTIALS ══════ */}
        {(creds.commission_number || creds.commission_expiration || creds.nna_certified || creds.ron_certified) && (
          <section id="credentials" className="py-16">
            <div className="mx-auto max-w-4xl px-4">
              <h2 className="mb-6 text-2xl font-bold flex items-center gap-2">
                <div className="h-8 w-1 rounded-full" style={{ backgroundColor: themeColor }} />
                Professional Credentials
              </h2>
              <Card>
                <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
                  {creds.commission_number && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Commission #</p>
                      <p className="font-semibold">{creds.commission_number}</p>
                    </div>
                  )}
                  {creds.commission_expiration && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Commission Expires</p>
                      <p className="font-semibold">{creds.commission_expiration}</p>
                    </div>
                  )}
                  {creds.commissioned_state && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Commissioned State</p>
                      <p className="font-semibold">{creds.commissioned_state}</p>
                    </div>
                  )}
                  {creds.bond_info && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Bond Information</p>
                      <p className="font-semibold">{creds.bond_info}</p>
                    </div>
                  )}
                  {creds.nna_certified && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">NNA Certification</p>
                      <p className="font-semibold flex items-center gap-1"><Award className="h-4 w-4" style={{ color: themeColor }} /> Certified Signing Agent</p>
                    </div>
                  )}
                  {creds.ron_certified && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">RON Authorization</p>
                      <p className="font-semibold flex items-center gap-1"><Monitor className="h-4 w-4" style={{ color: themeColor }} /> Authorized for RON</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* ══════ WHY CHOOSE ══════ */}
        <section className="bg-muted/30 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="mb-2 text-center text-2xl font-bold">Why Choose {page.display_name}?</h2>
            <p className="mb-10 text-center text-muted-foreground">Professional standards. Modern convenience. Ohio compliant.</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Shield, title: "Ohio Compliant", desc: "Every notarial act follows ORC §147 requirements including proper journal entries and seal verification." },
                { icon: Lock, title: "Secure & Encrypted", desc: "Documents are encrypted end-to-end. Identity verification via knowledge-based authentication." },
                { icon: Clock, title: "Fast Turnaround", desc: "Same-day appointments available. Most documents completed in a single session." },
                { icon: Monitor, title: "Remote Online Notarization", desc: "Get documents notarized from anywhere in Ohio via secure video — no travel needed." },
                { icon: Briefcase, title: "Business Ready", desc: "Experience with real estate closings, legal documents, corporate filings, and more." },
                { icon: Users, title: "Personal Service", desc: "Direct communication, flexible scheduling, and attention to every detail." },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }}>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${themeColor}15` }}>
                      <item.icon className="h-5 w-5" style={{ color: themeColor }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{item.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ REVIEWS ══════ */}
        <section id="reviews" className="py-16">
          <div className="mx-auto max-w-4xl px-4">
            <NotaryReviews notaryUserId={page.user_id} />
          </div>
        </section>

        {/* ══════ FAQ ══════ */}
        <section className="bg-muted/30 py-16">
          <div className="mx-auto max-w-3xl px-4">
            <NotaryFAQ notaryName={page.display_name} />
          </div>
        </section>

        {/* ══════ CONTACT ══════ */}
        <section id="contact" className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="mb-6 text-2xl font-bold flex items-center gap-2">
            <div className="h-8 w-1 rounded-full" style={{ backgroundColor: themeColor }} />
            Contact
          </h2>
          <div className="flex flex-wrap gap-4 mb-8">
            {page.phone && (
              <a href={`tel:${page.phone}`} className="inline-flex items-center gap-2 rounded-lg border px-4 py-3 transition-colors hover:bg-muted">
                <Phone className="h-4 w-4" style={{ color: themeColor }} />
                <span className="font-medium">{page.phone}</span>
              </a>
            )}
            {page.email && (
              <a href={`mailto:${page.email}`} className="inline-flex items-center gap-2 rounded-lg border px-4 py-3 transition-colors hover:bg-muted">
                <Mail className="h-4 w-4" style={{ color: themeColor }} />
                <span className="font-medium">{page.email}</span>
              </a>
            )}
            {page.website_url && (
              <a href={page.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border px-4 py-3 transition-colors hover:bg-muted">
                <Globe className="h-4 w-4" style={{ color: themeColor }} />
                <span className="font-medium">Website</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          {hasSocialLinks && (
            <div className="mb-8 flex gap-3">
              {socials.facebook && socials.facebook.trim() && <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="rounded-full border p-2 transition-colors hover:bg-muted" aria-label="Facebook"><Facebook className="h-5 w-5" /></a>}
              {socials.linkedin && socials.linkedin.trim() && <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="rounded-full border p-2 transition-colors hover:bg-muted" aria-label="LinkedIn"><Linkedin className="h-5 w-5" /></a>}
              {socials.twitter && socials.twitter.trim() && <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="rounded-full border p-2 transition-colors hover:bg-muted" aria-label="Twitter"><Twitter className="h-5 w-5" /></a>}
            </div>
          )}

          {/* Lead Capture Form */}
          <NotaryLeadCapture
            notarySlug={page.slug}
            notaryName={page.display_name}
            notaryUserId={page.user_id}
            services={services.map((s: any) => s.name || s)}
          />
        </section>

        {/* ══════ BOTTOM CTA ══════ */}
        <section className="py-16" style={{ background: `linear-gradient(135deg, ${themeColor}15, ${accentColor}05)` }}>
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Schedule your appointment today. Professional, secure, and Ohio compliant.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <BookButton size="lg" label={bookingLabel === "Contact to Book" ? "Contact to Book" : "Book Now"} />
              {page.signing_platform_url && (
                <a href={page.signing_platform_url} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="gap-2 font-bold"><FileSignature className="h-4 w-4" /> Sign Documents Online</Button>
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Print styles + Footer */}
        <style>{`@media print { nav, button, .no-print { display: none !important; } section { break-inside: avoid; } }`}</style>
        <div className="border-t bg-muted/20 no-print">
          <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-3 text-center sm:text-left">
                {logoUrl && <img src={logoUrl} alt={`${page.display_name} logo`} className="h-10 w-auto max-w-[80px] object-contain" />}
                <div>
                  <p className="text-sm font-semibold text-foreground">{page.display_name}</p>
                  <p className="text-xs text-muted-foreground">{professionalLabel} — {creds.commissioned_state || "Ohio"}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                {page.phone && (
                  <a href={`tel:${page.phone}`} className="flex items-center gap-1 hover:text-foreground"><Phone className="h-3 w-3" /> {page.phone}</a>
                )}
                {page.email && (
                  <a href={`mailto:${page.email}`} className="flex items-center gap-1 hover:text-foreground"><Mail className="h-3 w-3" /> {page.email}</a>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-col items-center gap-2 border-t pt-4 sm:flex-row sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {get("copyright_text", `© ${new Date().getFullYear()} ${get("site_name", BRAND.name)}. All rights reserved.`)}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Link to="/terms#privacy" className="hover:text-foreground">Terms & Privacy</Link>
                <Link to="/accessibility" className="hover:text-foreground">Accessibility</Link>
                <span>Powered by <a href="/" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">{get("site_name", BRAND.name)}</a></span>
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    </div>
  );
}
