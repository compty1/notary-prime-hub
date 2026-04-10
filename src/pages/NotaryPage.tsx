import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Phone, Mail, Globe, Calendar, Shield, Award, CheckCircle,
  ExternalLink, FileSignature, Star, Facebook, Linkedin, Twitter, User,
  Share2, Pencil,
} from "lucide-react";
import { motion } from "framer-motion";
import { BRAND } from "@/lib/brand";
import { ensureHex } from "@/lib/colorUtils";
import { sanitizeHtml } from "@/lib/sanitize";

const PROFESSIONAL_TYPE_LABELS: Record<string, string> = {
  notary: "Commissioned Notary Public",
  signing_agent: "Signing Agent",
  doc_preparer: "Document Preparer",
  virtual_assistant: "Virtual Assistant",
  mobile_notary: "Mobile Notary",
  other: "Professional",
};

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

/** Resolve a storage path or URL to a displayable signed URL */
async function resolveStorageUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from("documents").createSignedUrl(path, 3600);
  return data?.signedUrl || null;
}

export default function NotaryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<NotaryPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [isOwner, setIsOwner] = useState(false);

  usePageMeta({
    title: page?.seo_title || page?.display_name || "Notary",
    description: page?.seo_description || `Professional notary services by ${page?.display_name || "a certified notary"}.`,
    // SEO001: noIndex for unpublished pages
    noIndex: page ? !page.is_published : false,
    // PU001: OG image from profile photo
    ogImage: profilePhotoUrl || undefined,
    schema: page ? {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: page.display_name,
      description: page.seo_description || page.tagline,
      telephone: page.phone,
      email: page.email,
      url: `https://notardex.com/n/${page.slug}`,
      // PU005: Use commissioned state from credentials instead of hardcoded Ohio
      areaServed: {
        "@type": "State",
        name: page.credentials?.commissioned_state || "Ohio",
      },
      // SEO004: Add image to schema
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

  // PERF001: Single query + parallel photo resolution
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

      // W007: Check if current user is the page owner
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser && currentUser.id === pageData.user_id) setIsOwner(true);

      // Resolve all photos in parallel
      const [profileUrl, coverUrl] = await Promise.all([
        resolveStorageUrl(pageData.profile_photo_path),
        resolveStorageUrl(pageData.cover_photo_path),
      ]);
      setProfilePhotoUrl(profileUrl);
      setCoverPhotoUrl(coverUrl);

      const gallery = Array.isArray(pageData.gallery_photos) ? pageData.gallery_photos : [];
      if (gallery.length > 0) {
        const urls = await Promise.all(gallery.map(p => resolveStorageUrl(p)));
        setGalleryUrls(urls.filter((u): u is string => !!u));
      }
      setLoading(false);
    })();
  }, [slug]);

  // Photo resolution now happens in the main useEffect above (PERF001)

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
  // D002: Ensure colors are hex
  const themeColor = ensureHex(page.theme_color);
  const accentColor = ensureHex(page.accent_color, "#1e40af");
  const fontFamily = page.font_family || "Inter";
  const navServices = Array.isArray(page.nav_services) ? page.nav_services : [];
  const professionalType = page.professional_type || "notary";
  const professionalLabel = PROFESSIONAL_TYPE_LABELS[professionalType] || "Professional";

  // B001/S001: Use slug instead of user_id in ref param to prevent UUID leak
  const refParam = page.slug;

  // B004: Handle missing booking configuration
  let bookingUrl: string | null = null;
  let bookingLabel = "Book Appointment";
  if (page.use_platform_booking) {
    bookingUrl = `/book?notary=${page.slug}&ref=${refParam}`;
  } else if (page.external_booking_url) {
    bookingUrl = page.external_booking_url;
  } else {
    // No booking configured - show contact instead
    bookingUrl = page.email ? `mailto:${page.email}` : (page.phone ? `tel:${page.phone}` : null);
    bookingLabel = "Contact to Book";
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // BUG004: Check if socials have actual non-empty values
  const hasSocialLinks = Object.values(socials).some(v => v && String(v).trim().length > 0);

  return (
    <div style={{ fontFamily: `"${fontFamily}", sans-serif` }}>
      {fontFamily !== "Inter" && (
        <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700;800;900&display=swap`} />
      )}
      {/* R001: Pass hideNav to prevent double navbar */}
      <PageShell hideNav>
        {/* Dynamic Nav Bar */}
        {navServices.length > 0 && (
          <nav className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" aria-label="Professional page navigation">
            <div className="mx-auto max-w-6xl flex items-center gap-1 overflow-x-auto px-4 py-2">
              {navServices.map(name => (
                <button
                  key={name}
                  onClick={() => scrollToSection(name.toLowerCase().replace(/\s+/g, "-"))}
                  className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
                  aria-label={`Go to ${name} section`}
                >
                  {name}
                </button>
              ))}
              <div className="ml-auto">
                {bookingUrl && (
                  bookingUrl.startsWith("/") ? (
                    <Link to={bookingUrl}>
                      <Button size="sm" className="gap-1 font-bold" style={{ backgroundColor: themeColor }}>
                        <Calendar className="h-3 w-3" /> Book
                      </Button>
                    </Link>
                  ) : (
                    <a href={bookingUrl} target={bookingUrl.startsWith("mailto:") || bookingUrl.startsWith("tel:") ? undefined : "_blank"} rel="noopener noreferrer">
                      <Button size="sm" className="gap-1 font-bold" style={{ backgroundColor: themeColor }}>
                        <Calendar className="h-3 w-3" /> {bookingLabel === "Contact to Book" ? "Contact" : "Book"}
                      </Button>
                    </a>
                  )
                )}
              </div>
            </div>
          </nav>
        )}

        {/* Hero */}
        <section
          className="relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${themeColor}22, ${accentColor}08)` }}
        >
          {coverPhotoUrl && (
            <div className="absolute inset-0 opacity-20">
              <img src={coverPhotoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
          )}
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left"
            >
              {/* Profile Photo */}
              <div
                className="flex h-32 w-32 items-center justify-center rounded-full border-4 shadow-xl sm:h-40 sm:w-40"
                style={{ borderColor: themeColor, background: `${themeColor}15` }}
              >
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt={`${page.display_name} profile photo`} className="h-full w-full rounded-full object-cover" />
                ) : (
                  <span className="text-4xl font-black" style={{ color: themeColor }}>
                    {page.display_name?.charAt(0)?.toUpperCase() || "N"}
                  </span>
                )}
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  {page.display_name}
                </h1>
                {page.title && (
                  <p className="mt-1 text-lg font-medium" style={{ color: themeColor }}>
                    {page.title}
                  </p>
                )}
                {page.tagline && (
                  <p className="mt-2 text-lg text-muted-foreground">{page.tagline}</p>
                )}

                {/* Professional type + Credential badges */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  <Badge variant="outline" className="gap-1" style={{ borderColor: accentColor, color: accentColor }}>
                    <User className="h-3 w-3" /> {professionalLabel}
                  </Badge>
                  {creds.nna_certified && (
                    <Badge className="gap-1" style={{ backgroundColor: themeColor, color: "white" }}>
                      <Award className="h-3 w-3" /> NNA Certified
                    </Badge>
                  )}
                  {creds.ron_certified && (
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="h-3 w-3" /> RON Certified
                    </Badge>
                  )}
                  {creds.eo_insured && (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle className="h-3 w-3" /> E&O Insured
                    </Badge>
                  )}
                  {creds.bonded && (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle className="h-3 w-3" /> Bonded
                    </Badge>
                  )}
                  {page.is_featured && (
                    <Badge className="gap-1 bg-amber-500 text-white">
                      <Star className="h-3 w-3" /> Featured
                    </Badge>
                  )}
                </div>

                {/* SEO003: Ohio Compliance Badge */}
                {creds.commissioned_state?.toLowerCase().includes("ohio") && (
                  <div className="mt-2">
                    <Badge variant="outline" className="gap-1 text-xs border-green-600 text-green-700 dark:text-green-400">
                      <Shield className="h-3 w-3" /> Ohio Compliant — ORC §147
                    </Badge>
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                  {bookingUrl && (
                    bookingUrl.startsWith("/") ? (
                      <Link to={bookingUrl}>
                        <Button size="lg" className="gap-2 font-bold shadow-lg" style={{ backgroundColor: themeColor }}>
                          <Calendar className="h-4 w-4" /> {bookingLabel}
                        </Button>
                      </Link>
                    ) : (
                      <a href={bookingUrl} target={bookingUrl.startsWith("mailto:") || bookingUrl.startsWith("tel:") ? undefined : "_blank"} rel="noopener noreferrer">
                        <Button size="lg" className="gap-2 font-bold shadow-lg" style={{ backgroundColor: themeColor }}>
                          <Calendar className="h-4 w-4" /> {bookingLabel}
                        </Button>
                      </a>
                    )
                  )}
                  {page.signing_platform_url && (
                    <a href={page.signing_platform_url} target="_blank" rel="noopener noreferrer">
                      <Button size="lg" variant="outline" className="gap-2 font-bold">
                        <FileSignature className="h-4 w-4" /> Sign Documents
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* W007: Edit link for page owner + E009: Social sharing */}
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
              <Link to="/portal?tab=notary-page">
                <Button variant="outline" size="sm" className="gap-1 text-xs">
                  <Pencil className="h-3 w-3" /> Edit Page
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: page.display_name, text: page.tagline || `Professional services by ${page.display_name}`, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              aria-label="Share this page"
            >
              <Share2 className="h-3 w-3" /> Share
            </Button>
          </div>
        </div>

        {/* About / Bio */}
        {page.bio && (
          <section id="about" className="mx-auto max-w-4xl px-4 py-12">
            <h2 className="mb-4 text-2xl font-bold">About</h2>
            <div className="prose prose-lg max-w-none text-muted-foreground dark:prose-invert">
              {page.bio.split("\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        )}

        {/* Gallery - PU002: Use resolved URLs */}
        {galleryUrls.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="mb-4 text-2xl font-bold">Gallery</h2>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
              {galleryUrls.map((url, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className="aspect-[4/3] overflow-hidden rounded-xl border shadow-sm"
                >
                  {/* ACC001: Descriptive alt text */}
                  <img src={url} alt={`${page.display_name} - gallery photo ${i + 1} of ${galleryUrls.length}`} className="h-full w-full object-cover" loading="lazy" />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Services */}
        {services.length > 0 && (
          <section id="services" className="bg-muted/30 py-12">
            <div className="mx-auto max-w-6xl px-4">
              <h2 className="mb-6 text-2xl font-bold">Services Offered</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((svc: any, i: number) => (
                  <motion.div
                    key={i}
                    id={typeof svc === "string" ? svc.toLowerCase().replace(/\s+/g, "-") : (svc.name || "").toLowerCase().replace(/\s+/g, "-")}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    viewport={{ once: true }}
                  >
                    <Card className="h-full transition-shadow hover:shadow-md">
                      <CardContent className="p-5">
                        <h3 className="font-bold text-foreground">{svc.name || svc}</h3>
                        {svc.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{svc.description}</p>
                        )}
                        {svc.price && (
                          <p className="mt-2 text-sm font-semibold" style={{ color: themeColor }}>
                            {svc.price}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Service Areas */}
        {areas.length > 0 && (
          <section className="mx-auto max-w-4xl px-4 py-12">
            <h2 className="mb-4 text-2xl font-bold">Service Areas</h2>
            <div className="flex flex-wrap gap-2">
              {areas.map((area: string, i: number) => (
                <Badge key={i} variant="secondary" className="gap-1 text-sm">
                  <MapPin className="h-3 w-3" /> {area}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Credentials & Commission Info */}
        {(creds.commission_number || creds.commission_expiration) && (
          <section className="bg-muted/30 py-12">
            <div className="mx-auto max-w-4xl px-4">
              <h2 className="mb-4 text-2xl font-bold">Professional Credentials</h2>
              <Card>
                <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
                  {creds.commission_number && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Commission #</p>
                      <p className="font-semibold">{creds.commission_number}</p>
                    </div>
                  )}
                  {creds.commission_expiration && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Commission Expires</p>
                      <p className="font-semibold">{creds.commission_expiration}</p>
                    </div>
                  )}
                  {creds.commissioned_state && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Commissioned State</p>
                      <p className="font-semibold">{creds.commissioned_state}</p>
                    </div>
                  )}
                  {creds.bond_info && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Bond Information</p>
                      <p className="font-semibold">{creds.bond_info}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Contact & Social */}
        <section className="mx-auto max-w-4xl px-4 py-12">
          <h2 className="mb-4 text-2xl font-bold">Contact</h2>
          <div className="flex flex-wrap gap-4">
            {page.phone && (
              <a href={`tel:${page.phone}`} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors hover:bg-muted">
                <Phone className="h-4 w-4" style={{ color: themeColor }} />
                <span className="font-medium">{page.phone}</span>
              </a>
            )}
            {page.email && (
              <a href={`mailto:${page.email}`} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors hover:bg-muted">
                <Mail className="h-4 w-4" style={{ color: themeColor }} />
                <span className="font-medium">{page.email}</span>
              </a>
            )}
            {page.website_url && (
              <a href={page.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors hover:bg-muted">
                <Globe className="h-4 w-4" style={{ color: themeColor }} />
                <span className="font-medium">Website</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          {/* BUG004: Only show social links section if at least one has a value */}
          {hasSocialLinks && (
            <div className="mt-4 flex gap-3">
              {socials.facebook && socials.facebook.trim() && (
                <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="rounded-full border p-2 transition-colors hover:bg-muted" aria-label="Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {socials.linkedin && socials.linkedin.trim() && (
                <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="rounded-full border p-2 transition-colors hover:bg-muted" aria-label="LinkedIn">
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
              {socials.twitter && socials.twitter.trim() && (
                <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="rounded-full border p-2 transition-colors hover:bg-muted" aria-label="Twitter">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
            </div>
          )}
        </section>

        {/* PU006: Contact form section */}
        {page.email && (
          <section className="bg-muted/30 py-12">
            <div className="mx-auto max-w-lg px-4 text-center">
              <h2 className="mb-2 text-2xl font-bold">Send a Message</h2>
              <p className="mb-4 text-sm text-muted-foreground">Have a question? Reach out directly.</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const subject = encodeURIComponent(String(formData.get("subject") || "Inquiry"));
                  const body = encodeURIComponent(String(formData.get("message") || ""));
                  window.location.href = `mailto:${page.email}?subject=${subject}&body=${body}`;
                }}
                className="space-y-3 text-left"
              >
                <div>
                  <label className="text-sm font-medium" htmlFor="contact-subject">Subject</label>
                  <input id="contact-subject" name="subject" required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="e.g. Notarization inquiry" />
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="contact-message">Message</label>
                  <textarea id="contact-message" name="message" required rows={3} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="How can we help?" />
                </div>
                <Button type="submit" className="w-full gap-2 font-bold" style={{ backgroundColor: themeColor }}>
                  <Mail className="h-4 w-4" /> Send Message
                </Button>
              </form>
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="py-12" style={{ background: `linear-gradient(135deg, ${themeColor}15, ${accentColor}05)` }}>
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-2xl font-bold">Ready to Get Started?</h2>
            <p className="mt-2 text-muted-foreground">
              Schedule your appointment today. Professional, secure, and compliant.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {bookingUrl && (
                bookingUrl.startsWith("/") ? (
                  <Link to={bookingUrl}>
                    <Button size="lg" className="gap-2 font-bold shadow-lg" style={{ backgroundColor: themeColor }}>
                      <Calendar className="h-4 w-4" /> {bookingLabel === "Contact to Book" ? "Contact to Book" : "Book Now"}
                    </Button>
                  </Link>
                ) : (
                  <a href={bookingUrl} target={bookingUrl.startsWith("mailto:") || bookingUrl.startsWith("tel:") ? undefined : "_blank"} rel="noopener noreferrer">
                    <Button size="lg" className="gap-2 font-bold shadow-lg" style={{ backgroundColor: themeColor }}>
                      <Calendar className="h-4 w-4" /> {bookingLabel === "Contact to Book" ? "Contact to Book" : "Book Now"}
                    </Button>
                  </a>
                )
              )}
              {page.signing_platform_url && (
                <a href={page.signing_platform_url} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="gap-2 font-bold">
                    <FileSignature className="h-4 w-4" /> Sign Documents Online
                  </Button>
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t bg-muted/20 py-4 text-center text-xs text-muted-foreground">
          Powered by <Link to="/" className="font-semibold hover:underline">{BRAND.name}</Link> —
          Professional {creds.commissioned_state || "Ohio"} Notary Services
        </div>
      </PageShell>
    </div>
  );
}
