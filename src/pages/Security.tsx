import { usePageMeta } from "@/hooks/usePageMeta";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Shield, Lock, Eye, Server, Users, Activity, AlertTriangle,
  Key, Globe, Bug, ShieldCheck, CheckCircle2
} from "lucide-react";
import securityBadge from "@/assets/security-compliance-badge.jpg";

const securityDomains = [
  {
    icon: Lock,
    title: "Encryption",
    items: [
      "TLS 1.2+ for all data in transit — all connections are HTTPS-only with HSTS enforcement",
      "AES-256 encryption for data at rest, including documents, recordings, and personal information",
      "SHA-256 cryptographic hashing for document integrity verification and tamper-evident seals",
      "End-to-end encrypted video connections for all RON sessions",
    ],
  },
  {
    icon: Users,
    title: "Access Controls",
    items: [
      "Role-Based Access Control (RBAC) with principle of least privilege",
      "Multi-factor authentication (MFA) available for all user accounts",
      "Session timeout enforcement with automatic logout after inactivity",
      "IP-based access logging and anomaly detection",
      "Separate administrative access controls with audit trail",
    ],
  },
  {
    icon: Eye,
    title: "Audit Logging",
    items: [
      "Comprehensive audit trails for all system actions and data access",
      "Immutable log entries with timestamps, user identity, and action details",
      "Real-time monitoring and alerting for suspicious activity patterns",
      "Log retention for minimum 5 years in compliance with Ohio recordkeeping requirements",
    ],
  },
  {
    icon: Server,
    title: "Infrastructure",
    items: [
      "Hosted on SOC 2 Type II aligned cloud infrastructure within the United States",
      "Geographic data residency — all customer data stored in US-based data centers",
      "Automated backups with point-in-time recovery capabilities",
      "High availability architecture with 99.9% uptime SLA",
      "Network segmentation and firewall protection at all tiers",
    ],
  },
  {
    icon: Shield,
    title: "Vendor Management",
    items: [
      "All third-party vendors undergo security assessment before integration",
      "Data Processing Agreements (DPAs) in place with all subprocessors",
      "Regular vendor security reviews and compliance verification",
      "Minimal data sharing — only what is necessary for service delivery",
    ],
  },
  {
    icon: Activity,
    title: "Monitoring & Incident Response",
    items: [
      "24/7 automated security monitoring with real-time alerting",
      "Documented incident response plan with defined escalation procedures",
      "Maximum 72-hour breach notification commitment to affected users",
      "Post-incident review and remediation tracking",
      "Regular security tabletop exercises and response drills",
    ],
  },
  {
    icon: Key,
    title: "Authentication & SSO",
    items: [
      "Secure password policies with complexity requirements and breach detection",
      "Email verification required for all new accounts",
      "Password reset with time-limited secure tokens",
      "Session token rotation after authentication to prevent fixation attacks",
      "CSRF protection via X-Requested-With header validation",
    ],
  },
  {
    icon: Globe,
    title: "API Security",
    items: [
      "All API endpoints authenticated and authorized via JWT tokens",
      "Rate limiting on all public and authenticated endpoints",
      "Input validation and sanitization on all request parameters (Zod schema validation)",
      "Content Security Policy (CSP) headers enforced",
      "CORS configuration restricted to authorized origins",
    ],
  },
  {
    icon: Bug,
    title: "Vulnerability Management",
    items: [
      "Regular dependency scanning and automated security updates",
      "XSS prevention through DOMPurify sanitization of all user-generated content",
      "SQL injection prevention via parameterized queries (no raw SQL execution)",
      "File upload validation with MIME type checking and extension whitelisting",
      "Security.txt published for responsible vulnerability disclosure",
    ],
  },
];

export default function Security() {
  usePageMeta({
    title: "Security Overview | NotarDex",
    description: "NotarDex security practices: encryption, access controls, audit logging, infrastructure, and vulnerability management for secure online notarization.",
  });

  return (
    <PageShell>
      <div className="container mx-auto max-w-4xl px-4 pt-4">
        <Breadcrumbs />
      </div>

      {/* Hero */}
      <section className="bg-sidebar-background text-white py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                <Lock className="mr-1 h-3 w-3" /> Enterprise Security
              </Badge>
              <h1 className="text-4xl font-bold mb-4">Platform Security</h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                NotarDex employs enterprise-grade security measures to protect your documents,
                identity information, and notarial records at every layer.
              </p>
            </div>
            <div className="flex-shrink-0">
              <img
                src={securityBadge}
                alt="NotarDex Platform Security — SOC 2 Type II Aligned, 256-bit Encryption"
                className="w-48 h-48 rounded-2xl object-cover shadow-xl"
                loading="lazy"
                width={192}
                height={192}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Security Domains Grid */}
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {securityDomains.map((domain) => (
            <Card key={domain.title} className="h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <domain.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-base font-bold text-foreground">{domain.title}</h2>
                </div>
                <ul className="space-y-2">
                  {domain.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Responsible Disclosure */}
        <Card className="mt-8 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Responsible Disclosure</h3>
                <p className="text-sm text-muted-foreground">
                  If you discover a security vulnerability, please report it responsibly. Our security.txt file
                  is available at <code className="text-xs bg-muted px-1 rounded">/.well-known/security.txt</code>.
                  We will acknowledge receipt within 48 hours and work with you to address the issue promptly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center py-8">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/compliance">
              <Button>
                <ShieldCheck className="mr-2 h-4 w-4" /> View Compliance Standards
              </Button>
            </Link>
            <Link to="/terms">
              <Button variant="outline">Terms & Privacy</Button>
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
