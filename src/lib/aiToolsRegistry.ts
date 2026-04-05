import {
  FileText, FileSignature, Users, Briefcase, Receipt, BookOpen, BarChart3,
  GraduationCap, Brain, Shield, DollarSign, Target, Mail, Megaphone,
  MessageCircle, Lock, ClipboardCheck, Palette, Search, Lightbulb,
  FileCode, ListChecks, Newspaper, TrendingUp, AlertTriangle, Globe,
  Database, Layers, Workflow, PieChart, UserCheck, Tag, Zap, Scale,
  Building2, Heart, Landmark, Cog, MapPin, Rocket, Crosshair, FlaskConical,
  UserPlus, LayoutGrid, GitBranch, ArrowUpDown, StickyNote, Pencil, type LucideIcon
} from "lucide-react";

export type ToolFieldType = "text" | "textarea" | "select" | "number";

export interface ToolField {
  name: string;
  label: string;
  type: ToolFieldType;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

export type ToolCategory =
  | "Documents & Generation"
  | "Analysis & Insights"
  | "Communication"
  | "Compliance & Legal"
  | "Creative & Strategy";

export interface AITool {
  id: string;
  title: string;
  category: ToolCategory;
  description: string;
  icon: LucideIcon;
  fields: ToolField[];
  systemPrompt: string;
  maxTokens?: number;
}

const CATEGORY_ICONS: Record<ToolCategory, LucideIcon> = {
  "Documents & Generation": FileText,
  "Analysis & Insights": Brain,
  "Communication": Mail,
  "Compliance & Legal": Shield,
  "Creative & Strategy": Lightbulb,
};
export { CATEGORY_ICONS };

export const AI_TOOLS: AITool[] = [
  // ═══════════════════════════════════════
  // DOCUMENTS & GENERATION
  // ═══════════════════════════════════════
  {
    id: "contract-generator",
    title: "AI Contract Generator",
    category: "Documents & Generation",
    description: "Generate legally-formatted contracts — NDAs, SaaS agreements, freelance contracts — in seconds.",
    icon: FileSignature,
    fields: [
      { name: "contractType", label: "Contract Type", type: "select", required: true, options: [
        { value: "nda", label: "Non-Disclosure Agreement (NDA)" },
        { value: "saas", label: "SaaS Service Agreement" },
        { value: "freelance", label: "Freelance/Contractor Agreement" },
        { value: "employment", label: "Employment Agreement" },
        { value: "partnership", label: "Partnership Agreement" },
        { value: "licensing", label: "Licensing Agreement" },
        { value: "consulting", label: "Consulting Agreement" },
        { value: "lease", label: "Lease Agreement" },
        { value: "custom", label: "Custom Contract" },
      ]},
      { name: "party1", label: "Party 1 (Name / Company)", type: "text", placeholder: "Acme Corporation", required: true },
      { name: "party2", label: "Party 2 (Name / Company)", type: "text", placeholder: "Jane Smith / Beta LLC" },
      { name: "jurisdiction", label: "Governing Jurisdiction", type: "text", placeholder: "State of Ohio" },
      { name: "keyTerms", label: "Key Terms & Special Clauses", type: "textarea", placeholder: "Duration, payment terms, non-compete scope, IP ownership..." },
    ],
    systemPrompt: `You are a professional legal document drafter. Generate a complete, well-structured contract in markdown.

FORMAT REQUIREMENTS:
- Title in bold caps at top
- Use "WHEREAS" recitals before main clauses
- Number all sections (1. DEFINITIONS, 2. SCOPE, etc.)
- Sub-sections as 1.1, 1.2, etc.
- Include standard boilerplate: Entire Agreement, Severability, Amendments, Waiver, Notices
- End with signature blocks in a markdown table (Name, Title, Date, Signature lines)
- Include "GOVERNING LAW" clause referencing the specified jurisdiction
- Use formal legal language throughout
- Add "IN WITNESS WHEREOF" before signature block`,
  },
  {
    id: "meeting-minutes",
    title: "Meeting Minutes Synthesizer",
    category: "Documents & Generation",
    description: "Transform raw meeting transcripts into structured, corporate-formatted minutes with action items.",
    icon: Users,
    fields: [
      { name: "meetingType", label: "Meeting Type", type: "select", required: true, options: [
        { value: "board", label: "Board Meeting" },
        { value: "team", label: "Team/Staff Meeting" },
        { value: "client", label: "Client Meeting" },
        { value: "project", label: "Project Status Meeting" },
        { value: "allhands", label: "All-Hands / Town Hall" },
      ]},
      { name: "attendees", label: "Attendees", type: "textarea", placeholder: "John Smith (Chair), Jane Doe (Secretary), Bob Wilson..." },
      { name: "transcript", label: "Meeting Notes / Transcript", type: "textarea", placeholder: "Paste raw meeting notes, transcript, or key discussion points...", required: true },
      { name: "date", label: "Meeting Date", type: "text", placeholder: "April 2, 2026" },
    ],
    systemPrompt: `You are a corporate secretary drafting formal meeting minutes. Output in clean markdown.

FORMAT:
- Header: "MINUTES OF [TYPE] MEETING" with date, time, location
- **Attendees** table: Name | Title/Role | Present/Absent
- **Call to Order**: who called, time
- **Agenda Items**: numbered sections with Discussion and Resolution/Decision
- **Action Items** table: # | Action | Owner | Due Date | Priority
- **Next Meeting**: date/time if mentioned
- Use formal parliamentary language for board meetings
- Mark motions as "MOVED by [name], SECONDED by [name]. CARRIED/DEFEATED."
- End with "Minutes prepared by [Secretary name]" and "Approved: ___________"`,
  },
  {
    id: "business-proposal",
    title: "Business Proposal Writer",
    category: "Documents & Generation",
    description: "Create compelling, industry-specific business proposals with executive summaries and budgets.",
    icon: Briefcase,
    fields: [
      { name: "industry", label: "Industry", type: "select", required: true, options: [
        { value: "technology", label: "Technology / SaaS" },
        { value: "consulting", label: "Consulting / Professional Services" },
        { value: "construction", label: "Construction / Engineering" },
        { value: "healthcare", label: "Healthcare" },
        { value: "finance", label: "Finance / Banking" },
        { value: "marketing", label: "Marketing / Advertising" },
        { value: "education", label: "Education" },
        { value: "other", label: "Other" },
      ]},
      { name: "clientName", label: "Client / Recipient", type: "text", placeholder: "ABC Corporation", required: true },
      { name: "projectScope", label: "Project Scope / Services Offered", type: "textarea", placeholder: "Describe the project, deliverables, and objectives...", required: true },
      { name: "budget", label: "Estimated Budget Range", type: "text", placeholder: "$10,000 - $50,000" },
      { name: "timeline", label: "Project Timeline", type: "text", placeholder: "3 months, Q3 2026" },
    ],
    systemPrompt: `You are a senior business development professional. Create a comprehensive, persuasive business proposal in markdown.

STRUCTURE:
1. **Cover Page**: Title, client name, your company, date, confidentiality notice
2. **Executive Summary**: 2-3 compelling paragraphs
3. **Understanding of Needs**: Client pain points and objectives
4. **Proposed Solution**: Detailed approach with methodology
5. **Scope of Work**: Deliverables table (Deliverable | Description | Timeline)
6. **Project Timeline**: Phase-based Gantt-style table (Phase | Activities | Duration | Milestone)
7. **Investment / Budget**: Pricing table (Item | Description | Qty | Unit Price | Total) with subtotals
8. **Team / Qualifications**: Key team members and relevant experience
9. **Terms & Conditions**: Payment terms, assumptions, exclusions
10. **Next Steps**: Clear call to action

Use professional, confident tone. Include relevant industry terminology.`,
  },
  {
    id: "policy-generator",
    title: "Policy Document Generator",
    category: "Documents & Generation",
    description: "Generate HR, IT security, and compliance policy documents following ISO/SOC2/GDPR templates.",
    icon: Shield,
    fields: [
      { name: "policyType", label: "Policy Type", type: "select", required: true, options: [
        { value: "acceptable-use", label: "Acceptable Use Policy" },
        { value: "data-classification", label: "Data Classification Policy" },
        { value: "incident-response", label: "Incident Response Policy" },
        { value: "access-control", label: "Access Control Policy" },
        { value: "remote-work", label: "Remote Work Policy" },
        { value: "byod", label: "BYOD Policy" },
        { value: "password", label: "Password Policy" },
        { value: "data-retention", label: "Data Retention Policy" },
        { value: "anti-harassment", label: "Anti-Harassment Policy" },
        { value: "code-of-conduct", label: "Code of Conduct" },
        { value: "whistleblower", label: "Whistleblower Policy" },
        { value: "custom", label: "Custom Policy" },
      ]},
      { name: "framework", label: "Compliance Framework", type: "select", options: [
        { value: "iso27001", label: "ISO 27001" },
        { value: "soc2", label: "SOC 2 Type II" },
        { value: "gdpr", label: "GDPR" },
        { value: "hipaa", label: "HIPAA" },
        { value: "nist", label: "NIST CSF" },
        { value: "none", label: "General / No Specific Framework" },
      ]},
      { name: "companyName", label: "Company Name", type: "text", placeholder: "Your Company Name", required: true },
      { name: "additionalContext", label: "Additional Requirements", type: "textarea", placeholder: "Industry-specific requirements, existing policies to reference..." },
    ],
    systemPrompt: `You are a compliance and policy specialist. Generate a comprehensive, enterprise-grade policy document in markdown.

FORMAT:
- **Document Header**: Policy title, Document ID (POL-XXX), Version, Effective Date, Review Date, Classification
- **1. Purpose**: Clear statement of policy intent
- **2. Scope**: Who/what this policy applies to
- **3. Definitions**: Key terms table (Term | Definition)
- **4. Policy Statements**: Numbered, detailed policy clauses with sub-sections
- **5. Roles & Responsibilities**: RACI-style table (Role | Responsibilities)
- **6. Compliance**: Monitoring, enforcement, and consequences
- **7. Exceptions**: Process for requesting exceptions
- **8. Related Documents**: References to other policies
- **9. Revision History**: Table (Version | Date | Author | Changes)
- **Approval Signatures**: Table with Name, Title, Signature, Date

Reference the specified compliance framework controls where applicable. Use formal, unambiguous language.`,
  },
  {
    id: "invoice-generator",
    title: "Invoice & Quote Generator",
    category: "Documents & Generation",
    description: "Create professional invoices and quotes with tax calculations and multi-currency support.",
    icon: Receipt,
    fields: [
      { name: "documentType", label: "Document Type", type: "select", required: true, options: [
        { value: "invoice", label: "Invoice" },
        { value: "quote", label: "Quote / Estimate" },
        { value: "proforma", label: "Pro-forma Invoice" },
        { value: "credit-note", label: "Credit Note" },
      ]},
      { name: "fromCompany", label: "From (Your Business)", type: "text", placeholder: "Your Business Name & Address", required: true },
      { name: "toClient", label: "To (Client)", type: "text", placeholder: "Client Name & Address", required: true },
      { name: "lineItems", label: "Line Items", type: "textarea", placeholder: "Item 1: Web Design - $2,500\nItem 2: SEO Setup - $800\nItem 3: Monthly Hosting - $50/mo x 12", required: true },
      { name: "taxRate", label: "Tax Rate (%)", type: "number", placeholder: "7.25" },
      { name: "currency", label: "Currency", type: "select", options: [
        { value: "USD", label: "USD ($)" },
        { value: "EUR", label: "EUR (€)" },
        { value: "GBP", label: "GBP (£)" },
        { value: "CAD", label: "CAD (C$)" },
      ]},
      { name: "paymentTerms", label: "Payment Terms", type: "select", options: [
        { value: "net15", label: "Net 15" },
        { value: "net30", label: "Net 30" },
        { value: "net60", label: "Net 60" },
        { value: "due-receipt", label: "Due on Receipt" },
        { value: "50-50", label: "50% Upfront, 50% on Completion" },
      ]},
      { name: "notes", label: "Notes / Special Instructions", type: "textarea", placeholder: "Thank you for your business..." },
    ],
    systemPrompt: `You are an accounting document specialist. Generate a professional, calculation-accurate invoice or quote in markdown.

FORMAT:
- **Header**: Document type (INVOICE / QUOTATION), Invoice #, Date, Due Date
- **From**: Company details block (name, address, phone, email, tax ID)
- **Bill To**: Client details block
- **Line Items Table**:
  | # | Description | Qty | Unit Price | Amount |
  With proper alignment and calculations
- **Subtotal**: Sum of all line items
- **Tax**: Calculated at specified rate with label
- **Total**: Bold, prominent total in specified currency
- **Payment Terms**: Terms and accepted methods
- **Bank Details**: Placeholder for wire transfer info
- **Notes**: Footer notes
- **Terms & Conditions**: Standard payment/late fee terms

All calculations must be mathematically correct. Use proper currency formatting.`,
  },
  {
    id: "tech-docs",
    title: "Technical Documentation Writer",
    category: "Documents & Generation",
    description: "Generate API docs, user manuals, and SOPs with proper technical formatting.",
    icon: FileCode,
    fields: [
      { name: "docType", label: "Documentation Type", type: "select", required: true, options: [
        { value: "api-reference", label: "API Reference" },
        { value: "user-manual", label: "User Manual" },
        { value: "setup-guide", label: "Setup / Installation Guide" },
        { value: "architecture", label: "Architecture Document" },
        { value: "runbook", label: "Operations Runbook" },
        { value: "troubleshooting", label: "Troubleshooting Guide" },
      ]},
      { name: "product", label: "Product / System Name", type: "text", placeholder: "Your Product Name", required: true },
      { name: "audience", label: "Target Audience", type: "select", options: [
        { value: "developers", label: "Developers" },
        { value: "end-users", label: "End Users" },
        { value: "admins", label: "System Administrators" },
        { value: "mixed", label: "Mixed / General" },
      ]},
      { name: "content", label: "Features / Endpoints / Content to Document", type: "textarea", placeholder: "Describe the features, API endpoints, or system components to document...", required: true },
    ],
    systemPrompt: `You are a senior technical writer. Generate clear, comprehensive technical documentation in markdown.

FORMAT FOR API DOCS:
- **Overview**: Purpose, base URL, authentication
- **Endpoints** table: Method | Endpoint | Description
- Each endpoint section with:
  - HTTP method badge (GET/POST/PUT/DELETE)
  - Request headers, parameters, body (in code blocks with JSON)
  - Response examples (success + error) in code blocks
  - Status codes table: Code | Description
- **Authentication**: API key / OAuth flow details
- **Rate Limits**: Table with limits
- **Error Handling**: Standard error response format

FORMAT FOR USER MANUALS:
- **Table of Contents**
- Step-by-step instructions with numbered steps
- Screenshots placeholders: [Screenshot: description]
- Tips/warnings in blockquotes (> ⚠️ Warning: ...)
- FAQ section at end

Use precise technical language. Include code examples where relevant.`,
  },
  {
    id: "board-report",
    title: "Board Report Generator",
    category: "Documents & Generation",
    description: "Create executive-ready board reports with KPI dashboards and financial highlights.",
    icon: BarChart3,
    fields: [
      { name: "companyName", label: "Company Name", type: "text", required: true },
      { name: "reportPeriod", label: "Reporting Period", type: "text", placeholder: "Q1 2026 / FY 2025" },
      { name: "kpis", label: "Key Metrics & KPIs", type: "textarea", placeholder: "Revenue: $2.5M, Growth: 15%, Churn: 3.2%, NPS: 72...", required: true },
      { name: "highlights", label: "Key Highlights & Challenges", type: "textarea", placeholder: "Major wins, challenges, strategic decisions needed..." },
      { name: "financials", label: "Financial Summary", type: "textarea", placeholder: "Revenue, expenses, EBITDA, cash position, burn rate..." },
    ],
    systemPrompt: `You are a corporate communications specialist preparing board-level reports. Generate an executive-ready board report in markdown.

STRUCTURE:
1. **Header**: Company logo placeholder, "BOARD OF DIRECTORS REPORT", period, CONFIDENTIAL
2. **Executive Summary**: 3-4 bullet highlights
3. **KPI Dashboard**: Table with Metric | Target | Actual | Variance | Trend (↑↓→)
4. **Financial Highlights**: Revenue, expenses, margins in table format with YoY comparison
5. **Operational Update**: Key accomplishments, challenges
6. **Strategic Initiatives**: Progress table (Initiative | Status | Owner | Timeline | RAG)
7. **Risk Register**: Top 5 risks table (Risk | Impact | Likelihood | Mitigation | Owner)
8. **Outlook & Forecast**: Next quarter/year projections
9. **Decisions Required**: Clear action items for board approval
10. **Appendix**: Detailed financial tables

Use RAG status indicators (🟢 🟡 🔴). Keep language concise and executive-appropriate.`,
  },
  {
    id: "training-manual",
    title: "Training Manual Creator",
    category: "Documents & Generation",
    description: "Build step-by-step training materials with quizzes, objectives, and competency checklists.",
    icon: GraduationCap,
    fields: [
      { name: "topic", label: "Training Topic", type: "text", required: true, placeholder: "New Employee Onboarding / CRM System Training" },
      { name: "audience", label: "Target Audience", type: "text", placeholder: "New hires, sales team, managers..." },
      { name: "duration", label: "Training Duration", type: "select", options: [
        { value: "30min", label: "30 minutes" },
        { value: "1hr", label: "1 hour" },
        { value: "halfday", label: "Half day" },
        { value: "fullday", label: "Full day" },
        { value: "multiday", label: "Multi-day program" },
      ]},
      { name: "content", label: "Topics & Skills to Cover", type: "textarea", placeholder: "List the key topics, skills, and competencies to cover...", required: true },
      { name: "includeQuiz", label: "Include Assessments", type: "select", options: [
        { value: "yes", label: "Yes - Include quizzes & assessments" },
        { value: "no", label: "No - Content only" },
      ]},
    ],
    systemPrompt: `You are an instructional designer creating professional training materials. Generate a complete training manual in markdown.

FORMAT:
1. **Cover Page**: Title, version, date, department, confidentiality
2. **Learning Objectives**: Bullet list with measurable outcomes ("By the end, participants will be able to...")
3. **Prerequisites**: Required knowledge/tools
4. **Module Outline**: Table (Module | Topic | Duration | Method)
5. **Content Modules**: Each with:
   - Module title and objective
   - Key concepts in clear paragraphs
   - Step-by-step procedures (numbered)
   - Practice exercises in blockquotes
   - Tips/best practices (💡 Pro Tip: ...)
   - Common mistakes to avoid (⚠️ Watch Out: ...)
6. **Knowledge Check**: Multiple-choice questions with answer key
7. **Competency Checklist**: Table (Skill | Can Demonstrate | Needs Practice | Not Yet)
8. **Resources**: Additional reading/reference links
9. **Feedback Form**: Evaluation questions

Use engaging, accessible language. Include real-world examples.`,
  },
  {
    id: "sop-generator",
    title: "SOP Generator",
    category: "Documents & Generation",
    description: "Create detailed Standard Operating Procedures with flowcharts, checklists, and role assignments.",
    icon: ListChecks,
    fields: [
      { name: "processName", label: "Process Name", type: "text", required: true, placeholder: "Employee Onboarding / Incident Response" },
      { name: "department", label: "Department / Team", type: "text", placeholder: "HR, IT, Operations..." },
      { name: "processSteps", label: "Process Steps & Details", type: "textarea", required: true, placeholder: "Describe the process steps, decision points, and roles involved..." },
      { name: "frequency", label: "Process Frequency", type: "select", options: [
        { value: "daily", label: "Daily" },
        { value: "weekly", label: "Weekly" },
        { value: "monthly", label: "Monthly" },
        { value: "asneeded", label: "As Needed / Event-Driven" },
      ]},
    ],
    systemPrompt: `You are a process improvement specialist. Generate a detailed SOP document in markdown.

FORMAT:
1. **Header**: SOP Title, Document # (SOP-XXX), Version, Effective Date, Review Date
2. **Purpose**: Why this SOP exists
3. **Scope**: What processes/departments it covers
4. **Definitions**: Table of key terms
5. **Roles & Responsibilities**: RACI table (Task | Responsible | Accountable | Consulted | Informed)
6. **Prerequisites / Materials**: What's needed before starting
7. **Procedure**: Numbered steps with sub-steps
   - Decision points marked: "⟐ DECISION: If [condition], go to Step X; otherwise continue"
   - Include expected timeframes per step
   - Mark critical steps: "⚠️ CRITICAL STEP"
8. **Process Flow**: Text-based flowchart using markdown
9. **Quality Checks**: Verification checkpoints
10. **Exception Handling**: What to do when things go wrong
11. **Records**: What documentation to maintain
12. **Revision History**: Version table`,
  },
  {
    id: "case-study",
    title: "Case Study Writer",
    category: "Documents & Generation",
    description: "Generate compelling customer success case studies with metrics, quotes, and structured narratives.",
    icon: Target,
    fields: [
      { name: "clientName", label: "Client / Company Name", type: "text", required: true },
      { name: "industry", label: "Client Industry", type: "text", placeholder: "Healthcare, SaaS, Retail..." },
      { name: "challenge", label: "Challenge / Problem", type: "textarea", required: true, placeholder: "What problem was the client facing?" },
      { name: "solution", label: "Solution Provided", type: "textarea", required: true, placeholder: "What solution did you implement?" },
      { name: "results", label: "Results & Metrics", type: "textarea", placeholder: "40% cost reduction, 3x faster processing, $500K saved..." },
    ],
    systemPrompt: `You are a marketing content specialist creating compelling case studies. Generate in markdown.

FORMAT:
1. **Headline**: Compelling, results-driven headline
2. **Snapshot Box**: Industry | Company Size | Solution | Timeline | Key Result
3. **Executive Summary**: 2-3 sentence overview
4. **The Challenge**: Client pain points with context (use storytelling)
5. **The Solution**: What was implemented, how, and why this approach
6. **Implementation**: Timeline table (Phase | Activity | Duration)
7. **Results**: Bold metrics with context
   - Use callout blocks: > 📊 "40% reduction in processing time"
   - Before/After comparison table
8. **Client Quote**: Blockquote with attribution
   > "Quote here." — Name, Title, Company
9. **Key Takeaways**: Bullet list
10. **About [Your Company]**: Brief boilerplate

Use persuasive, specific language. Quantify everything possible.`,
  },
  {
    id: "whitepaper",
    title: "Whitepaper Generator",
    category: "Documents & Generation",
    description: "Create authoritative thought leadership whitepapers with research-backed insights and data.",
    icon: BookOpen,
    fields: [
      { name: "topic", label: "Whitepaper Topic", type: "text", required: true, placeholder: "The Future of Remote Work in 2026" },
      { name: "audience", label: "Target Audience", type: "text", placeholder: "C-suite executives, IT directors..." },
      { name: "keyPoints", label: "Key Arguments / Research Points", type: "textarea", required: true, placeholder: "Main thesis, supporting data points, research findings..." },
      { name: "length", label: "Desired Length", type: "select", options: [
        { value: "short", label: "Short (2-3 pages)" },
        { value: "medium", label: "Medium (5-7 pages)" },
        { value: "long", label: "Long (10+ pages)" },
      ]},
    ],
    systemPrompt: `You are a thought leadership content strategist. Generate an authoritative whitepaper in markdown.

FORMAT:
1. **Title Page**: Title, subtitle, author, date, company
2. **Table of Contents**
3. **Executive Summary**: Key findings and recommendations
4. **Introduction**: Problem statement, market context
5. **Body Sections** (3-5 main sections):
   - Research-backed arguments with data citations
   - Industry statistics in callout blocks
   - Comparison tables where relevant
   - Expert perspective quotes
6. **Case Studies / Examples**: Real-world applications
7. **Recommendations**: Actionable steps
8. **Conclusion**: Summary and call to action
9. **Methodology**: How data was gathered (if applicable)
10. **References**: Numbered citation list
11. **About the Author(s)**: Brief bios

Use authoritative, data-driven tone. Include [Source: ...] citations. Format statistics prominently.`,
  },
  {
    id: "job-description",
    title: "Job Description Writer",
    category: "Documents & Generation",
    description: "Create inclusive, compelling job descriptions with clear requirements, benefits, and DEI-conscious language.",
    icon: UserPlus,
    fields: [
      { name: "title", label: "Job Title", type: "text", required: true, placeholder: "Senior Software Engineer" },
      { name: "department", label: "Department", type: "text", placeholder: "Engineering, Marketing, Sales..." },
      { name: "level", label: "Level", type: "select", options: [
        { value: "entry", label: "Entry Level" },
        { value: "mid", label: "Mid-Level" },
        { value: "senior", label: "Senior" },
        { value: "lead", label: "Lead / Principal" },
        { value: "director", label: "Director" },
        { value: "vp", label: "VP / Executive" },
      ]},
      { name: "requirements", label: "Key Requirements & Responsibilities", type: "textarea", required: true, placeholder: "Core skills, responsibilities, qualifications..." },
      { name: "benefits", label: "Benefits & Perks", type: "textarea", placeholder: "Health insurance, 401k, remote work, PTO..." },
      { name: "salary", label: "Salary Range", type: "text", placeholder: "$120,000 - $160,000" },
    ],
    systemPrompt: `You are an HR specialist creating inclusive, compelling job descriptions. Generate in markdown.

FORMAT:
1. **Job Title** — clear, standard title (avoid jargon)
2. **About Us**: Company mission (placeholder)
3. **The Role**: 2-3 paragraph overview of the opportunity
4. **What You'll Do**: Bullet list of responsibilities (8-12 items)
5. **What You'll Bring**: Requirements split into:
   - **Required**: Must-have qualifications
   - **Preferred**: Nice-to-have qualifications
6. **What We Offer**: Benefits table (Category | Benefit)
7. **Compensation**: Salary range + equity/bonus info
8. **Our Values**: Brief culture section
9. **Equal Opportunity Statement**: Inclusive language

IMPORTANT: Use inclusive language. Avoid gendered terms. Replace "ninja/rockstar" with professional terms. Use "you" language. Keep requirements realistic — don't ask for 10 years in a 5-year-old technology.`,
  },
  {
    id: "project-charter",
    title: "Project Charter Generator",
    category: "Documents & Generation",
    description: "Create formal project charters with scope, stakeholders, milestones, risks, and governance structures.",
    icon: Landmark,
    fields: [
      { name: "projectName", label: "Project Name", type: "text", required: true },
      { name: "sponsor", label: "Project Sponsor", type: "text", placeholder: "VP of Engineering" },
      { name: "objective", label: "Project Objective & Scope", type: "textarea", required: true, placeholder: "What is the project trying to achieve? What's in/out of scope?" },
      { name: "budget", label: "Estimated Budget", type: "text", placeholder: "$500,000" },
      { name: "timeline", label: "Expected Timeline", type: "text", placeholder: "6 months, Jan - Jun 2026" },
      { name: "stakeholders", label: "Key Stakeholders", type: "textarea", placeholder: "List key stakeholders and their roles..." },
    ],
    systemPrompt: `You are a PMO specialist. Generate a formal project charter document in markdown.

FORMAT:
1. **Project Charter Header**: Project name, charter #, date, version
2. **Project Overview**: Purpose, business case, alignment to strategy
3. **Objectives**: SMART objectives table (Objective | Measure | Target | Timeline)
4. **Scope**: In-scope / Out-of-scope table
5. **Deliverables**: Table (Deliverable | Description | Acceptance Criteria)
6. **Milestones**: Table (Milestone | Target Date | Dependencies)
7. **Stakeholders**: Table (Name | Role | Interest | Influence | Communication)
8. **Budget**: Cost breakdown table (Category | Estimated Cost | Notes)
9. **Risks**: Table (Risk | Probability | Impact | Mitigation | Owner)
10. **Assumptions & Constraints**: Bullet lists
11. **Governance**: Decision-making structure, escalation path
12. **Approval**: Signature table (Name | Role | Signature | Date)`,
  },
  {
    id: "api-docs",
    title: "API Documentation Writer",
    category: "Documents & Generation",
    description: "Generate comprehensive REST API documentation with endpoints, request/response examples, and error codes.",
    icon: FileCode,
    fields: [
      { name: "apiName", label: "API Name", type: "text", required: true, placeholder: "Payment Gateway API v2" },
      { name: "baseUrl", label: "Base URL", type: "text", placeholder: "https://api.example.com/v2" },
      { name: "endpoints", label: "Endpoints to Document", type: "textarea", required: true, placeholder: "GET /users - List users\nPOST /users - Create user\nGET /users/:id - Get user\n..." },
      { name: "authType", label: "Authentication Type", type: "select", options: [
        { value: "api-key", label: "API Key" },
        { value: "bearer", label: "Bearer Token / JWT" },
        { value: "oauth2", label: "OAuth 2.0" },
        { value: "basic", label: "Basic Auth" },
      ]},
    ],
    systemPrompt: `You are a developer experience specialist. Generate comprehensive API documentation in markdown.

FORMAT:
1. **Overview**: API purpose, versioning, base URL
2. **Authentication**: How to authenticate with examples
3. **Rate Limiting**: Limits table and headers
4. **Endpoints Reference**: For each endpoint:
   ### \`METHOD /path\`
   Description
   **Parameters**: Table (Name | Type | Required | Description)
   **Request Body**: JSON in code block
   **Response**: JSON in code block with status code
   **Error Responses**: Table (Code | Message | Description)
   **Example**: curl command in code block
5. **Data Models**: Schema definitions with types
6. **Error Handling**: Standard error format, common codes table
7. **Pagination**: How pagination works with examples
8. **Webhooks**: Event types and payload examples (if applicable)
9. **SDKs**: Available client libraries
10. **Changelog**: Version history table`,
  },
  {
    id: "changelog",
    title: "Changelog & Release Notes Writer",
    category: "Documents & Generation",
    description: "Generate professional changelogs and release notes from feature lists, bug fixes, and breaking changes.",
    icon: GitBranch,
    fields: [
      { name: "version", label: "Version Number", type: "text", required: true, placeholder: "v2.5.0" },
      { name: "releaseDate", label: "Release Date", type: "text", placeholder: "April 2, 2026" },
      { name: "changes", label: "Changes (features, fixes, breaking changes)", type: "textarea", required: true, placeholder: "New: Dark mode support\nFixed: Login timeout issue\nBreaking: Removed v1 API endpoints\n..." },
      { name: "format", label: "Format Style", type: "select", options: [
        { value: "keepachangelog", label: "Keep a Changelog (standard)" },
        { value: "customer-facing", label: "Customer-Facing Release Notes" },
        { value: "internal", label: "Internal Engineering Notes" },
      ]},
    ],
    systemPrompt: `You are a technical writer creating professional release documentation in markdown.

FORMAT (Keep a Changelog):
# Changelog
## [version] - date
### ✨ Added
- New features
### 🔄 Changed
- Changes to existing functionality
### 🗑️ Deprecated
- Soon-to-be removed features
### 🐛 Fixed
- Bug fixes
### 🔒 Security
- Security improvements
### 💥 Breaking Changes
- Incompatible changes with migration guide

FOR CUSTOMER-FACING:
- Use friendly, benefit-oriented language
- Group by user impact
- Include screenshots placeholders
- Add "How to use" sections for major features

FOR INTERNAL:
- Include PR/ticket references
- Technical implementation details
- Performance impact notes
- Database migration notes`,
  },

  // ═══════════════════════════════════════
  // ANALYSIS & INSIGHTS
  // ═══════════════════════════════════════
  {
    id: "sentiment-analyzer",
    title: "Document Sentiment Analyzer",
    category: "Analysis & Insights",
    description: "Analyze any document's tone, sentiment, and professionalism with detailed scoring.",
    icon: Brain,
    fields: [
      { name: "document", label: "Document Text to Analyze", type: "textarea", required: true, placeholder: "Paste the document, email, or text you want analyzed..." },
      { name: "context", label: "Context / Purpose", type: "select", options: [
        { value: "business", label: "Business Communication" },
        { value: "marketing", label: "Marketing Content" },
        { value: "legal", label: "Legal Document" },
        { value: "customer-service", label: "Customer Service" },
        { value: "internal", label: "Internal Communication" },
      ]},
    ],
    systemPrompt: `You are a communication analyst specializing in document tone analysis. Provide a comprehensive sentiment analysis in markdown.

FORMAT:
1. **Overall Sentiment Score**: Numerical score (1-10) with label (Negative/Neutral/Positive)
2. **Tone Profile**: Table (Dimension | Score | Assessment)
   - Professionalism, Warmth, Urgency, Confidence, Clarity, Persuasiveness
3. **Sentiment Breakdown by Section**: Analyze each paragraph/section
4. **Language Analysis**:
   - Power words used
   - Passive vs active voice ratio
   - Reading level (Flesch-Kincaid)
   - Jargon/complexity assessment
5. **Emotional Triggers**: Identified emotional language
6. **Recommendations**: Specific suggestions for improvement
7. **Revised Version**: If issues found, provide improved version

Use data-driven analysis. Be specific and actionable.`,
  },
  {
    id: "contract-risk",
    title: "Contract Risk Analyzer",
    category: "Analysis & Insights",
    description: "Scan contracts for risky clauses, missing protections, and unusual terms.",
    icon: AlertTriangle,
    fields: [
      { name: "contractText", label: "Contract Text", type: "textarea", required: true, placeholder: "Paste the contract text to analyze for risks..." },
      { name: "partyRole", label: "Your Role in Contract", type: "select", options: [
        { value: "buyer", label: "Buyer / Client" },
        { value: "seller", label: "Seller / Provider" },
        { value: "employee", label: "Employee" },
        { value: "contractor", label: "Contractor" },
        { value: "landlord", label: "Landlord" },
        { value: "tenant", label: "Tenant" },
      ]},
    ],
    systemPrompt: `You are a contract review specialist. Analyze the contract for risks and provide a structured risk assessment in markdown.

FORMAT:
1. **Risk Summary**: Overall risk level (🟢 Low / 🟡 Medium / 🔴 High) with score
2. **Critical Issues** (🔴): Table (Clause | Risk | Impact | Recommendation)
3. **Moderate Concerns** (🟡): Table format
4. **Minor Notes** (🟢): Table format
5. **Missing Protections**: Clauses that SHOULD be present but aren't
   - Limitation of liability, indemnification, force majeure, dispute resolution, etc.
6. **Unusual Terms**: Non-standard clauses that deserve attention
7. **Key Dates & Deadlines**: Table (Event | Date/Trigger | Consequence)
8. **Financial Exposure**: Maximum potential liability analysis
9. **Recommended Modifications**: Specific language changes with before/after
10. **Negotiation Priority**: Ranked list of items to negotiate

Be thorough but practical. Flag genuinely risky items, not minor style issues.`,
  },
  {
    id: "financial-summarizer",
    title: "Financial Report Summarizer",
    category: "Analysis & Insights",
    description: "Extract key metrics, trends, and plain-English summaries from financial documents.",
    icon: DollarSign,
    fields: [
      { name: "financialData", label: "Financial Data / Report Text", type: "textarea", required: true, placeholder: "Paste financial statements, reports, or data..." },
      { name: "reportType", label: "Report Type", type: "select", options: [
        { value: "income", label: "Income Statement / P&L" },
        { value: "balance", label: "Balance Sheet" },
        { value: "cashflow", label: "Cash Flow Statement" },
        { value: "annual", label: "Annual Report" },
        { value: "quarterly", label: "Quarterly Earnings" },
        { value: "budget", label: "Budget vs Actual" },
      ]},
      { name: "audience", label: "Summary For", type: "select", options: [
        { value: "executive", label: "Executive / Board" },
        { value: "investor", label: "Investors" },
        { value: "operational", label: "Operations Team" },
        { value: "general", label: "General Audience" },
      ]},
    ],
    systemPrompt: `You are a financial analyst creating accessible summaries. Generate in markdown.

FORMAT:
1. **Executive Summary**: 3-5 key takeaways in plain English
2. **Key Metrics Dashboard**: Table (Metric | Value | Change | Trend)
   Include: Revenue, margins, growth rate, cash position, debt ratios
3. **Performance Highlights**: What's going well (with numbers)
4. **Areas of Concern**: Red flags or declining metrics
5. **Trend Analysis**: Period-over-period comparison table
6. **Ratio Analysis**: Key financial ratios table (Ratio | Value | Industry Avg | Assessment)
7. **Plain-English Explanation**: What the numbers mean for non-financial stakeholders
8. **Recommendations**: Action items based on the data
9. **Outlook**: Forward-looking assessment

Use clear language. Define financial terms in parentheses. All numbers properly formatted with commas and currency symbols.`,
  },
  {
    id: "competitor-analysis",
    title: "Competitor Analysis Report",
    category: "Analysis & Insights",
    description: "Generate comprehensive SWOT analyses and market positioning reports for competitors.",
    icon: Crosshair,
    fields: [
      { name: "yourCompany", label: "Your Company", type: "text", required: true },
      { name: "competitors", label: "Competitors to Analyze", type: "textarea", required: true, placeholder: "Competitor 1, Competitor 2, Competitor 3..." },
      { name: "industry", label: "Industry / Market", type: "text", placeholder: "SaaS, Healthcare, Retail..." },
      { name: "focusAreas", label: "Focus Areas", type: "textarea", placeholder: "Pricing, features, market share, customer satisfaction..." },
    ],
    systemPrompt: `You are a market intelligence analyst. Generate a comprehensive competitive analysis in markdown.

FORMAT:
1. **Executive Summary**: Key competitive insights
2. **Market Overview**: Industry trends, size, growth rate
3. **Competitor Profiles**: For each competitor:
   - Overview, founding, size, funding
   - Products/services
   - Target market
   - Pricing model
4. **Feature Comparison Matrix**: Table (Feature | Your Co | Comp 1 | Comp 2 | ...)
   Use ✅ ❌ 🟡 for feature support
5. **Pricing Comparison**: Table with tiers
6. **SWOT Analysis** for each competitor: 2x2 table format
7. **Competitive Positioning Map**: Describe market positioning
8. **Differentiation Opportunities**: Where you can win
9. **Threats & Risks**: What competitors do better
10. **Strategic Recommendations**: Actionable next steps`,
  },
  {
    id: "data-insight",
    title: "Data Insight Extractor",
    category: "Analysis & Insights",
    description: "Upload spreadsheets or data tables and get automated trend analysis, anomalies, and executive summaries.",
    icon: PieChart,
    fields: [
      { name: "data", label: "Data (paste CSV, table, or describe)", type: "textarea", required: true, placeholder: "Paste your data, CSV content, or describe the dataset..." },
      { name: "objective", label: "Analysis Objective", type: "text", placeholder: "Find sales trends, identify outliers, forecast growth..." },
      { name: "analysisType", label: "Analysis Type", type: "select", options: [
        { value: "descriptive", label: "Descriptive Statistics" },
        { value: "trend", label: "Trend Analysis" },
        { value: "comparative", label: "Comparative Analysis" },
        { value: "anomaly", label: "Anomaly Detection" },
        { value: "comprehensive", label: "Comprehensive / All" },
      ]},
    ],
    systemPrompt: `You are a data analyst extracting actionable insights. Generate analysis in markdown.

FORMAT:
1. **Data Overview**: Dataset summary, completeness, quality notes
2. **Key Findings**: Top 5 insights (numbered, bold headlines)
3. **Statistical Summary**: Table (Variable | Mean | Median | Std Dev | Min | Max)
4. **Trend Analysis**: Identified patterns with direction and magnitude
5. **Anomalies & Outliers**: Unusual data points with possible explanations
6. **Correlations**: Relationships between variables
7. **Segmentation**: Natural groupings in the data
8. **Visualizations**: Describe recommended charts (type, axes, what it shows)
9. **Executive Summary**: Plain-English summary for stakeholders
10. **Recommended Actions**: Data-driven decisions to make`,
  },
  {
    id: "survey-analyzer",
    title: "Survey Results Analyzer",
    category: "Analysis & Insights",
    description: "Analyze survey responses to extract themes, sentiment, and actionable insights with statistical summaries.",
    icon: ClipboardCheck,
    fields: [
      { name: "surveyData", label: "Survey Responses / Data", type: "textarea", required: true, placeholder: "Paste survey results, responses, or summary data..." },
      { name: "surveyType", label: "Survey Type", type: "select", options: [
        { value: "employee", label: "Employee Satisfaction" },
        { value: "customer", label: "Customer Feedback" },
        { value: "product", label: "Product / Feature Survey" },
        { value: "market", label: "Market Research" },
        { value: "event", label: "Event Feedback" },
      ]},
      { name: "sampleSize", label: "Sample Size", type: "number", placeholder: "150" },
    ],
    systemPrompt: `You are a survey research analyst. Generate a comprehensive analysis in markdown.

FORMAT:
1. **Survey Overview**: Purpose, methodology, sample size, response rate
2. **Key Findings**: Top 5 headline insights
3. **Quantitative Results**: Rating questions in table (Question | Avg | Median | Distribution)
4. **Qualitative Themes**: Open-ended response analysis
   - Theme table (Theme | Frequency | Sentiment | Example Quote)
5. **Sentiment Analysis**: Overall and by category
6. **Demographic Breakdowns**: Differences by segment (if data available)
7. **Trend Comparison**: vs previous survey (if applicable)
8. **Statistical Confidence**: Margin of error, confidence level
9. **Word Cloud Description**: Most frequent terms/phrases
10. **Action Items**: Prioritized recommendations table (Action | Impact | Effort | Priority)`,
  },
  {
    id: "meeting-cost",
    title: "Meeting Cost Analyzer",
    category: "Analysis & Insights",
    description: "Calculate the true cost of meetings across your organization with time waste analysis and optimization tips.",
    icon: DollarSign,
    fields: [
      { name: "meetingDetails", label: "Meeting Details", type: "textarea", required: true, placeholder: "Weekly standup: 15 min, 8 people, avg salary $120k\nAll-hands: 1 hr, 50 people, monthly\n..." },
      { name: "companySize", label: "Company Size", type: "number", placeholder: "200" },
      { name: "avgSalary", label: "Average Annual Salary ($)", type: "number", placeholder: "85000" },
    ],
    systemPrompt: `You are an organizational efficiency consultant. Calculate meeting costs and provide optimization recommendations in markdown.

FORMAT:
1. **Cost Summary**: Total annual meeting cost, cost per employee
2. **Meeting Cost Breakdown**: Table (Meeting | Frequency | Attendees | Duration | Cost/Meeting | Annual Cost)
3. **Time Analysis**: Hours spent in meetings per employee per week
4. **Opportunity Cost**: What else could be done with this time
5. **Meeting Efficiency Score**: Rating for each meeting type
6. **Waste Indicators**: Signs of meeting bloat
7. **Optimization Recommendations**: Specific, actionable changes
   - Which meetings to cut, shorten, or restructure
   - Async alternatives
8. **Projected Savings**: Table (Change | Time Saved | Cost Saved)
9. **Best Practices**: Meeting hygiene rules
10. **Implementation Plan**: How to roll out changes`,
  },
  {
    id: "churn-risk",
    title: "Churn Risk Analyzer",
    category: "Analysis & Insights",
    description: "Identify at-risk customers with predictive churn indicators, health scores, and intervention strategies.",
    icon: TrendingUp,
    fields: [
      { name: "customerData", label: "Customer / Account Data", type: "textarea", required: true, placeholder: "Customer engagement data, usage patterns, support tickets, contract details..." },
      { name: "businessModel", label: "Business Model", type: "select", options: [
        { value: "saas", label: "SaaS / Subscription" },
        { value: "ecommerce", label: "E-commerce" },
        { value: "services", label: "Professional Services" },
        { value: "marketplace", label: "Marketplace" },
      ]},
      { name: "timeframe", label: "Analysis Timeframe", type: "select", options: [
        { value: "30days", label: "Next 30 days" },
        { value: "90days", label: "Next 90 days" },
        { value: "6months", label: "Next 6 months" },
      ]},
    ],
    systemPrompt: `You are a customer success analyst. Generate a churn risk assessment in markdown.

FORMAT:
1. **Risk Summary**: Overall churn risk level, projected churn rate
2. **Health Score Dashboard**: Table (Account | Health Score | Risk Level | Key Indicator)
3. **Risk Factors**: Table (Factor | Weight | Description | Accounts Affected)
4. **At-Risk Accounts**: Detailed list with risk scores and triggers
5. **Churn Indicators**: Early warning signs identified
6. **Cohort Analysis**: Risk by customer segment/cohort
7. **Revenue Impact**: Projected revenue loss table
8. **Intervention Strategies**: For each risk level:
   - 🔴 High: Immediate actions
   - 🟡 Medium: Proactive outreach
   - 🟢 Low: Monitoring approach
9. **Retention Playbooks**: Specific scripts and offers
10. **Success Metrics**: How to measure intervention effectiveness`,
  },
  {
    id: "pricing-strategy",
    title: "Pricing Strategy Analyzer",
    category: "Analysis & Insights",
    description: "Analyze and optimize pricing models with competitive benchmarks, elasticity insights, and tier structures.",
    icon: Tag,
    fields: [
      { name: "currentPricing", label: "Current Pricing", type: "textarea", required: true, placeholder: "Describe your current pricing tiers, packages, and prices..." },
      { name: "competitors", label: "Competitor Pricing (if known)", type: "textarea", placeholder: "Competitor A: $29/mo, Competitor B: $49/mo..." },
      { name: "businessModel", label: "Business Model", type: "select", options: [
        { value: "subscription", label: "Subscription / SaaS" },
        { value: "usage", label: "Usage-Based" },
        { value: "freemium", label: "Freemium" },
        { value: "one-time", label: "One-Time Purchase" },
        { value: "hybrid", label: "Hybrid" },
      ]},
      { name: "goals", label: "Pricing Goals", type: "textarea", placeholder: "Increase ARPU, reduce churn, enter new market segment..." },
    ],
    systemPrompt: `You are a pricing strategy consultant. Generate a comprehensive pricing analysis in markdown.

FORMAT:
1. **Executive Summary**: Key pricing insights and recommendations
2. **Current Pricing Assessment**: Strengths and weaknesses
3. **Competitive Benchmark**: Table (Feature/Tier | You | Comp 1 | Comp 2 | Market Avg)
4. **Value Metric Analysis**: What customers value most vs what you charge for
5. **Tier Optimization**: Recommended tier structure table
6. **Price Sensitivity Analysis**: Estimated elasticity and optimal price points
7. **Revenue Impact Modeling**: Table (Scenario | Price | Est. Conversion | Revenue)
8. **Psychological Pricing**: Anchoring, decoy effect, charm pricing recommendations
9. **Implementation Roadmap**: How to roll out changes
10. **A/B Test Plan**: What to test and how to measure`,
  },

  // ═══════════════════════════════════════
  // COMMUNICATION
  // ═══════════════════════════════════════
  {
    id: "email-campaign",
    title: "Email Campaign Generator",
    category: "Communication",
    description: "Create professional email sequences with A/B variants and industry-matched tone.",
    icon: Mail,
    fields: [
      { name: "campaignGoal", label: "Campaign Goal", type: "select", required: true, options: [
        { value: "welcome", label: "Welcome / Onboarding Sequence" },
        { value: "nurture", label: "Lead Nurture" },
        { value: "promotional", label: "Promotional / Sale" },
        { value: "reengagement", label: "Re-engagement / Win-back" },
        { value: "upsell", label: "Upsell / Cross-sell" },
        { value: "event", label: "Event Invitation" },
        { value: "announcement", label: "Product Announcement" },
      ]},
      { name: "audience", label: "Target Audience", type: "text", required: true, placeholder: "SaaS CTOs, small business owners, existing customers..." },
      { name: "emailCount", label: "Number of Emails", type: "select", options: [
        { value: "3", label: "3-email sequence" },
        { value: "5", label: "5-email sequence" },
        { value: "7", label: "7-email sequence" },
      ]},
      { name: "product", label: "Product / Service", type: "text", required: true, placeholder: "What are you promoting?" },
      { name: "tone", label: "Tone", type: "select", options: [
        { value: "professional", label: "Professional" },
        { value: "friendly", label: "Friendly / Casual" },
        { value: "urgent", label: "Urgent / Action-oriented" },
        { value: "educational", label: "Educational" },
      ]},
    ],
    systemPrompt: `You are an email marketing strategist. Generate a complete email campaign sequence in markdown.

FORMAT FOR EACH EMAIL:
---
### Email [#]: [Name]
**Send Timing**: Day X / Trigger
**Subject Line A**: [Primary subject]
**Subject Line B**: [A/B variant]
**Preview Text**: [First line preview]

**Body**:
[Full email copy with greeting, body paragraphs, CTA]

**CTA Button**: [Button text]
**CTA Link**: [Placeholder URL]

---

ALSO INCLUDE:
1. **Campaign Overview**: Goal, audience, timeline
2. **Sequence Flow**: Table (Email | Day | Trigger | Goal | KPI)
3. **Segmentation**: Who gets which variant
4. **A/B Testing Plan**: What to test per email
5. **Success Metrics**: Table (Metric | Target | Industry Avg)
6. **Opt-out Strategy**: Compliance notes (CAN-SPAM / GDPR)`,
  },
  {
    id: "press-release",
    title: "Press Release Writer",
    category: "Communication",
    description: "Generate AP-style press releases with boilerplate, quotes, and distribution guidance.",
    icon: Megaphone,
    fields: [
      { name: "headline", label: "Announcement Headline", type: "text", required: true, placeholder: "Company X Launches Revolutionary AI Platform" },
      { name: "details", label: "Announcement Details", type: "textarea", required: true, placeholder: "What's being announced? Key facts, figures, and quotes..." },
      { name: "companyName", label: "Company Name", type: "text", required: true },
      { name: "contactInfo", label: "Media Contact Info", type: "text", placeholder: "Name, email, phone" },
      { name: "releaseType", label: "Release Type", type: "select", options: [
        { value: "product", label: "Product Launch" },
        { value: "funding", label: "Funding / Investment" },
        { value: "partnership", label: "Partnership" },
        { value: "milestone", label: "Company Milestone" },
        { value: "executive", label: "Executive Appointment" },
        { value: "event", label: "Event Announcement" },
      ]},
    ],
    systemPrompt: `You are a PR professional writing AP-style press releases. Generate in markdown.

FORMAT (strict AP style):
1. **FOR IMMEDIATE RELEASE** (or EMBARGOED UNTIL: [date])
2. **Headline**: Bold, compelling, present tense
3. **Subheadline**: Supporting detail in italics
4. **Dateline**: CITY, State (Month Day, Year) —
5. **Lead Paragraph**: Who, what, when, where, why in first paragraph
6. **Body Paragraphs**: Inverted pyramid structure
   - Most important info first
   - Supporting details
   - Background/context
7. **Executive Quote**: Blockquote format with attribution
   > "Quote here," said Name, Title at Company.
8. **Additional Details**: Features, statistics, availability
9. **Availability**: When/where available
10. **About [Company]**: Boilerplate paragraph
11. **Media Contact**: Name, Title, Email, Phone
12. **###** (end mark)

Use third person. No superlatives. Be factual and newsworthy.`,
  },
  {
    id: "client-communication",
    title: "Client Communication Drafter",
    category: "Communication",
    description: "Draft difficult client emails — price increases, delays, terminations — with diplomatic precision.",
    icon: MessageCircle,
    fields: [
      { name: "scenario", label: "Scenario", type: "select", required: true, options: [
        { value: "price-increase", label: "Price Increase Notification" },
        { value: "project-delay", label: "Project Delay Communication" },
        { value: "scope-change", label: "Scope Change Request" },
        { value: "contract-termination", label: "Contract Termination" },
        { value: "service-disruption", label: "Service Disruption Notice" },
        { value: "payment-reminder", label: "Payment Reminder" },
        { value: "negative-feedback", label: "Response to Negative Feedback" },
        { value: "bad-news", label: "Other Bad News" },
      ]},
      { name: "context", label: "Situation Details", type: "textarea", required: true, placeholder: "Describe the situation, relationship history, and specific details..." },
      { name: "clientName", label: "Client Name", type: "text", placeholder: "Client name or company" },
      { name: "tone", label: "Desired Tone", type: "select", options: [
        { value: "empathetic", label: "Empathetic & Understanding" },
        { value: "firm", label: "Firm but Professional" },
        { value: "apologetic", label: "Apologetic" },
        { value: "matter-of-fact", label: "Matter-of-Fact" },
      ]},
    ],
    systemPrompt: `You are an expert in professional client communications. Draft a diplomatic, well-crafted email in markdown.

FORMAT:
1. **Subject Line**: Clear, non-alarming subject
2. **Greeting**: Appropriate salutation
3. **Opening**: Positive or relationship-affirming opener
4. **Context**: Brief background (1-2 sentences)
5. **Core Message**: Clear, honest, specific communication
   - What happened / is changing
   - Why (honest reason)
   - Impact on client
6. **Solution / Mitigation**: What you're doing about it
7. **Next Steps**: Clear action items with dates
8. **Closing**: Maintain relationship, offer to discuss
9. **Sign-off**: Professional closing

ALSO PROVIDE:
- **Talking Points**: For follow-up call
- **FAQ**: Anticipated questions and answers
- **Alternative Version**: Shorter/different tone variant
- **Red Flags to Avoid**: What NOT to say`,
  },
  {
    id: "pitch-deck",
    title: "Pitch Deck Outliner",
    category: "Communication",
    description: "Generate investor pitch deck outlines with slide-by-slide content, speaker notes, and design direction.",
    icon: Rocket,
    fields: [
      { name: "companyName", label: "Company Name", type: "text", required: true },
      { name: "problem", label: "Problem You Solve", type: "textarea", required: true, placeholder: "What pain point does your product address?" },
      { name: "solution", label: "Your Solution", type: "textarea", required: true, placeholder: "How does your product/service solve it?" },
      { name: "stage", label: "Company Stage", type: "select", options: [
        { value: "pre-seed", label: "Pre-seed" },
        { value: "seed", label: "Seed" },
        { value: "series-a", label: "Series A" },
        { value: "series-b", label: "Series B+" },
        { value: "growth", label: "Growth / Late Stage" },
      ]},
      { name: "askAmount", label: "Fundraising Ask", type: "text", placeholder: "$2M seed round" },
      { name: "metrics", label: "Key Metrics / Traction", type: "textarea", placeholder: "MRR, users, growth rate, revenue..." },
    ],
    systemPrompt: `You are a pitch deck strategist who has helped raise $500M+. Generate a comprehensive pitch deck outline in markdown.

FORMAT FOR EACH SLIDE:
### Slide [#]: [Title]
**Visual Direction**: [What to show — chart type, image, diagram]
**Key Message**: [One sentence takeaway]
**Content**:
[Bullet points or data to include]
**Speaker Notes**: [What to say, 2-3 sentences]

---

STANDARD DECK STRUCTURE (12-15 slides):
1. Title / Hook
2. Problem
3. Solution
4. Market Size (TAM/SAM/SOM)
5. Product (demo/screenshots)
6. Business Model
7. Traction / Metrics
8. Competition
9. Go-to-Market Strategy
10. Team
11. Financials / Projections
12. The Ask
13. Appendix slides

Include data visualization recommendations for each slide.`,
  },
  {
    id: "crisis-communication",
    title: "Crisis Communication Planner",
    category: "Communication",
    description: "Draft crisis response communications, stakeholder statements, and internal messaging frameworks.",
    icon: AlertTriangle,
    fields: [
      { name: "crisisType", label: "Crisis Type", type: "select", required: true, options: [
        { value: "data-breach", label: "Data Breach / Security Incident" },
        { value: "product-failure", label: "Product Failure / Outage" },
        { value: "pr-crisis", label: "PR / Reputation Crisis" },
        { value: "legal", label: "Legal / Regulatory Issue" },
        { value: "leadership", label: "Leadership / Executive Issue" },
        { value: "financial", label: "Financial / Layoffs" },
        { value: "safety", label: "Safety / Health Incident" },
      ]},
      { name: "details", label: "Crisis Details", type: "textarea", required: true, placeholder: "What happened, when, who's affected, current status..." },
      { name: "companyName", label: "Company Name", type: "text", required: true },
      { name: "severity", label: "Severity Level", type: "select", options: [
        { value: "critical", label: "Critical — Immediate action needed" },
        { value: "high", label: "High — Significant impact" },
        { value: "moderate", label: "Moderate — Contained but visible" },
      ]},
    ],
    systemPrompt: `You are a crisis communications expert. Generate a comprehensive crisis response plan in markdown.

FORMAT:
1. **Crisis Assessment**: Severity, stakeholders affected, timeline
2. **Immediate Response Checklist**: Time-critical actions (first 1-4-24 hours)
3. **Stakeholder Map**: Table (Audience | Priority | Channel | Message | Timing)
4. **External Statement**: Ready-to-publish statement
5. **Internal Communication**: All-hands email template
6. **Customer Communication**: Email to affected customers
7. **Social Media Response**: Platform-specific responses
8. **Media Statement**: For press inquiries
9. **FAQ**: Anticipated questions with approved answers
10. **Escalation Matrix**: Table (Scenario | Decision Maker | Action)
11. **Monitoring Plan**: What to track, where, frequency
12. **Recovery Communication**: Follow-up messaging timeline
13. **Post-Mortem Template**: What to document after resolution`,
  },
  {
    id: "newsletter",
    title: "Newsletter Generator",
    category: "Communication",
    description: "Create engaging company newsletters with curated content sections, metrics highlights, and CTAs.",
    icon: Newspaper,
    fields: [
      { name: "newsletterType", label: "Newsletter Type", type: "select", required: true, options: [
        { value: "internal", label: "Internal / Employee Newsletter" },
        { value: "customer", label: "Customer Newsletter" },
        { value: "industry", label: "Industry / Thought Leadership" },
        { value: "product", label: "Product Updates" },
      ]},
      { name: "topics", label: "Topics to Cover", type: "textarea", required: true, placeholder: "Company wins, product updates, team highlights, industry news..." },
      { name: "companyName", label: "Company / Brand Name", type: "text", required: true },
      { name: "frequency", label: "Frequency", type: "select", options: [
        { value: "weekly", label: "Weekly" },
        { value: "biweekly", label: "Bi-weekly" },
        { value: "monthly", label: "Monthly" },
        { value: "quarterly", label: "Quarterly" },
      ]},
    ],
    systemPrompt: `You are a content marketing specialist. Generate a complete newsletter in markdown.

FORMAT:
1. **Header**: Newsletter name, edition #, date
2. **Hero Section**: Main story with compelling headline
3. **Quick Highlights**: 3 bullet-point updates
4. **Feature Article**: 200-300 word in-depth piece
5. **Metrics Spotlight**: Key numbers in callout format
   > 📊 **42%** increase in customer satisfaction this quarter
6. **Team Spotlight / Quote**: Employee highlight or customer quote
7. **Product Updates**: What's new (for product newsletters)
8. **Industry News**: Curated external news (for industry newsletters)
9. **Upcoming Events**: Table (Event | Date | Location | RSVP Link)
10. **Call to Action**: Clear CTA with button text
11. **Footer**: Social links, unsubscribe, legal

Keep sections scannable. Use emoji tastefully. Include [Image: description] placeholders.`,
  },
  {
    id: "social-media-planner",
    title: "Social Media Content Planner",
    category: "Communication",
    description: "Generate a full month of social media posts across platforms with hashtags, timing, and content calendars.",
    icon: Globe,
    fields: [
      { name: "brand", label: "Brand / Company Name", type: "text", required: true },
      { name: "platforms", label: "Platforms", type: "textarea", placeholder: "LinkedIn, Twitter/X, Instagram, Facebook, TikTok..." },
      { name: "topics", label: "Content Themes / Topics", type: "textarea", required: true, placeholder: "Product launches, industry insights, behind-the-scenes, tips..." },
      { name: "tone", label: "Brand Voice", type: "select", options: [
        { value: "professional", label: "Professional / Corporate" },
        { value: "casual", label: "Casual / Friendly" },
        { value: "witty", label: "Witty / Humorous" },
        { value: "inspirational", label: "Inspirational / Motivational" },
        { value: "educational", label: "Educational / Thought Leader" },
      ]},
      { name: "postsPerWeek", label: "Posts per Week (per platform)", type: "number", placeholder: "5" },
    ],
    systemPrompt: `You are a social media strategist. Generate a complete monthly content calendar in markdown.

FORMAT:
1. **Content Strategy Overview**: Pillars, themes, content mix ratio
2. **Content Calendar**: Table for each week:
   | Day | Platform | Post Type | Content | Hashtags | Best Time |
3. **Post Templates**: Full post copy for each entry
   - Platform-specific formatting (LinkedIn long-form, Twitter thread, etc.)
   - Hashtag sets (primary + secondary)
   - Emoji usage appropriate to platform
4. **Content Pillars**: Table (Pillar | % of Content | Example Topics)
5. **Visual Direction**: Image/video recommendations per post
6. **Engagement Strategy**: Comment response templates
7. **Key Dates**: Holidays, industry events, awareness days
8. **KPIs**: Table (Metric | Current | Target | Platform)
9. **A/B Tests**: Content experiments to run

Include 20-30 unique post ideas across all platforms.`,
  },
  {
    id: "rfp-response",
    title: "RFP Response Writer",
    category: "Communication",
    description: "Generate structured responses to Requests for Proposals with compliance matrices and win themes.",
    icon: FileText,
    fields: [
      { name: "rfpSummary", label: "RFP Requirements Summary", type: "textarea", required: true, placeholder: "Summarize the key requirements, evaluation criteria, and scope of the RFP..." },
      { name: "companyName", label: "Your Company Name", type: "text", required: true },
      { name: "solution", label: "Your Proposed Solution", type: "textarea", required: true, placeholder: "How will you meet the requirements? Key differentiators..." },
      { name: "pastPerformance", label: "Relevant Experience", type: "textarea", placeholder: "Similar projects completed, references..." },
    ],
    systemPrompt: `You are an RFP response specialist with a 70%+ win rate. Generate a compelling RFP response in markdown.

FORMAT:
1. **Cover Letter**: Executive-level summary
2. **Compliance Matrix**: Table (Requirement # | Requirement | Compliant | Reference Section)
3. **Executive Summary**: Win themes, value proposition
4. **Technical Approach**: Detailed solution description
5. **Methodology**: Phased approach table (Phase | Activities | Deliverables | Timeline)
6. **Team Qualifications**: Key personnel table (Name | Role | Years Exp | Certifications)
7. **Past Performance**: 2-3 relevant case studies
8. **Risk Management**: Identified risks and mitigations
9. **Pricing Summary**: Cost breakdown table
10. **Implementation Timeline**: Milestone schedule
11. **Value-Added Services**: Extras included
12. **References**: Contact information table

Focus on client benefits, not features. Use "you/your" language. Quantify everything.`,
  },

  // ═══════════════════════════════════════
  // COMPLIANCE & LEGAL
  // ═══════════════════════════════════════
  {
    id: "gdpr-policy",
    title: "GDPR / Privacy Policy Generator",
    category: "Compliance & Legal",
    description: "Generate jurisdiction-aware privacy policies with data processing and cookie details.",
    icon: Lock,
    fields: [
      { name: "companyName", label: "Company / Website Name", type: "text", required: true },
      { name: "websiteUrl", label: "Website URL", type: "text", placeholder: "https://www.example.com" },
      { name: "jurisdiction", label: "Primary Jurisdiction", type: "select", required: true, options: [
        { value: "gdpr", label: "EU / GDPR" },
        { value: "ccpa", label: "California / CCPA" },
        { value: "both", label: "Both GDPR & CCPA" },
        { value: "global", label: "Global / Multi-jurisdiction" },
      ]},
      { name: "dataTypes", label: "Data Types Collected", type: "textarea", required: true, placeholder: "Names, emails, payment info, cookies, analytics, location..." },
      { name: "thirdParties", label: "Third-Party Services Used", type: "textarea", placeholder: "Google Analytics, Stripe, Mailchimp, AWS..." },
    ],
    systemPrompt: `You are a privacy law specialist. Generate a comprehensive, legally-structured privacy policy in markdown.

FORMAT:
1. **Effective Date** and **Last Updated**
2. **Introduction**: Who we are, what this policy covers
3. **Information We Collect**: Table (Data Type | Purpose | Legal Basis | Retention)
4. **How We Use Your Information**: Purposes with legal bases
5. **Cookies & Tracking**: Table (Cookie | Provider | Purpose | Duration | Type)
6. **Data Sharing & Third Parties**: Table (Service | Data Shared | Purpose | Privacy Policy Link)
7. **Your Rights**: Table (Right | Description | How to Exercise) — include all applicable rights
8. **Data Retention**: Retention periods table
9. **International Transfers**: Transfer mechanisms (SCCs, adequacy decisions)
10. **Children's Privacy**: Age restrictions
11. **Security Measures**: Technical and organizational measures
12. **Changes to This Policy**: Notification process
13. **Contact Information**: DPO details, supervisory authority
14. **Cookie Consent**: Banner requirements

Use clear, plain language. Reference specific articles (e.g., GDPR Art. 6, Art. 13).`,
  },
  {
    id: "audit-checklist",
    title: "Audit Checklist Generator",
    category: "Compliance & Legal",
    description: "Create industry-specific audit checklists for SOC2, ISO 27001, and HIPAA compliance.",
    icon: ClipboardCheck,
    fields: [
      { name: "framework", label: "Compliance Framework", type: "select", required: true, options: [
        { value: "soc2", label: "SOC 2 Type II" },
        { value: "iso27001", label: "ISO 27001" },
        { value: "hipaa", label: "HIPAA" },
        { value: "pci-dss", label: "PCI DSS" },
        { value: "nist", label: "NIST CSF" },
        { value: "gdpr", label: "GDPR" },
        { value: "custom", label: "Custom / Internal" },
      ]},
      { name: "scope", label: "Audit Scope", type: "textarea", required: true, placeholder: "Which systems, processes, or departments are in scope?" },
      { name: "companyType", label: "Company Type", type: "select", options: [
        { value: "saas", label: "SaaS Company" },
        { value: "healthcare", label: "Healthcare Organization" },
        { value: "finance", label: "Financial Services" },
        { value: "ecommerce", label: "E-commerce" },
        { value: "general", label: "General / Other" },
      ]},
    ],
    systemPrompt: `You are a compliance auditor. Generate a comprehensive audit checklist in markdown.

FORMAT:
1. **Audit Overview**: Framework, scope, audit period, lead auditor
2. **Control Families**: Organized by domain (for SOC2: CC1-CC9, for ISO: A.5-A.18)
3. **Checklist Format** per control family:

### [Control Family Name]
| # | Control | Requirement | Evidence Required | Status | Notes |
|---|---------|-------------|-------------------|--------|-------|
| 1 | CC1.1 | Description | Documents/screenshots needed | ☐ | |

4. **Evidence Collection Guide**: What documents to prepare
5. **Interview Schedule**: Table (Interviewee | Role | Topics | Duration)
6. **Testing Procedures**: How to verify each control
7. **Common Findings**: Typical issues and remediation
8. **Readiness Score**: Self-assessment scoring table
9. **Remediation Tracker**: Table (Finding | Severity | Owner | Due Date | Status)
10. **Audit Timeline**: Key dates and milestones`,
  },
  {
    id: "risk-register",
    title: "Risk Register Builder",
    category: "Compliance & Legal",
    description: "Create comprehensive risk registers with probability/impact matrices, mitigations, and owner assignments.",
    icon: Shield,
    fields: [
      { name: "domain", label: "Risk Domain", type: "select", required: true, options: [
        { value: "enterprise", label: "Enterprise / Strategic" },
        { value: "operational", label: "Operational" },
        { value: "cybersecurity", label: "Cybersecurity / IT" },
        { value: "financial", label: "Financial" },
        { value: "compliance", label: "Compliance / Regulatory" },
        { value: "project", label: "Project-Specific" },
      ]},
      { name: "context", label: "Organization / Project Context", type: "textarea", required: true, placeholder: "Describe the organization, key operations, and risk landscape..." },
      { name: "riskAppetite", label: "Risk Appetite", type: "select", options: [
        { value: "conservative", label: "Conservative / Risk-Averse" },
        { value: "moderate", label: "Moderate / Balanced" },
        { value: "aggressive", label: "Aggressive / Risk-Tolerant" },
      ]},
    ],
    systemPrompt: `You are a risk management specialist. Generate a comprehensive risk register in markdown.

FORMAT:
1. **Risk Register Overview**: Scope, methodology, review date
2. **Risk Assessment Matrix** (5x5):
   Table showing Likelihood (1-5) vs Impact (1-5) with risk levels
3. **Risk Register**: Detailed table
   | ID | Risk | Category | Likelihood (1-5) | Impact (1-5) | Risk Score | Rating | Mitigation | Owner | Status | Review Date |
4. **Top 10 Risks**: Detailed analysis of highest-scoring risks
   - Description, root cause, potential impact, mitigation plan
5. **Risk Heat Map**: Text-based visualization
   🔴 Critical (15-25) | 🟠 High (10-14) | 🟡 Medium (5-9) | 🟢 Low (1-4)
6. **Mitigation Action Plan**: Table (Risk ID | Action | Owner | Timeline | Cost | Status)
7. **Key Risk Indicators (KRIs)**: Monitoring metrics
8. **Escalation Procedures**: When and how to escalate
9. **Review Schedule**: Cadence and responsibilities`,
  },
  {
    id: "compliance-gap",
    title: "Compliance Gap Analyzer",
    category: "Compliance & Legal",
    description: "Assess your organization's compliance posture against frameworks like SOC2, ISO 27001, and HIPAA.",
    icon: Search,
    fields: [
      { name: "framework", label: "Target Framework", type: "select", required: true, options: [
        { value: "soc2", label: "SOC 2" },
        { value: "iso27001", label: "ISO 27001" },
        { value: "hipaa", label: "HIPAA" },
        { value: "gdpr", label: "GDPR" },
        { value: "nist", label: "NIST CSF" },
      ]},
      { name: "currentState", label: "Current Security Posture", type: "textarea", required: true, placeholder: "Describe your current security controls, policies, and practices..." },
      { name: "companyType", label: "Organization Type", type: "text", placeholder: "SaaS startup, healthcare provider, financial services..." },
    ],
    systemPrompt: `You are a compliance consultant. Perform a gap analysis in markdown.

FORMAT:
1. **Executive Summary**: Overall readiness score (%), critical gaps count
2. **Readiness Dashboard**: Table (Domain | Controls Required | Implemented | Gap | Score)
3. **Gap Analysis by Control Domain**: For each domain:
   ### [Domain Name]
   | Control | Requirement | Current State | Gap | Priority | Effort |
   Status indicators: ✅ Met | 🟡 Partial | ❌ Not Met
4. **Critical Gaps**: Top issues requiring immediate attention
5. **Quick Wins**: Easy-to-implement improvements
6. **Remediation Roadmap**: Phased plan
   - Phase 1 (0-30 days): Critical fixes
   - Phase 2 (30-90 days): Major improvements
   - Phase 3 (90-180 days): Full compliance
7. **Resource Requirements**: People, tools, budget estimates
8. **Timeline to Compliance**: Estimated dates per domain
9. **Recommended Tools**: Software/services to help
10. **Ongoing Maintenance**: What to do post-certification`,
  },
  {
    id: "dpa-generator",
    title: "Data Processing Agreement Generator",
    category: "Compliance & Legal",
    description: "Generate GDPR-compliant Data Processing Agreements with controller/processor terms and safeguards.",
    icon: Scale,
    fields: [
      { name: "controller", label: "Data Controller (Your Company)", type: "text", required: true },
      { name: "processor", label: "Data Processor (Vendor)", type: "text", required: true },
      { name: "dataTypes", label: "Types of Personal Data Processed", type: "textarea", required: true, placeholder: "Names, emails, IP addresses, financial data..." },
      { name: "processingPurpose", label: "Purpose of Processing", type: "textarea", placeholder: "Email marketing, payment processing, analytics..." },
      { name: "jurisdiction", label: "Governing Law", type: "text", placeholder: "EU Member State / UK / US State" },
    ],
    systemPrompt: `You are a data protection legal specialist. Generate a GDPR-compliant DPA in markdown.

FORMAT:
1. **DATA PROCESSING AGREEMENT** — header with parties, date
2. **RECITALS**: Whereas clauses establishing context
3. **1. DEFINITIONS**: Key terms table (Term | Definition)
4. **2. SCOPE AND PURPOSE**: Processing details
5. **3. OBLIGATIONS OF THE PROCESSOR**: Numbered clauses (Art. 28 GDPR requirements)
6. **4. OBLIGATIONS OF THE CONTROLLER**: Controller responsibilities
7. **5. CATEGORIES OF DATA SUBJECTS**: Who the data belongs to
8. **6. TYPES OF PERSONAL DATA**: Table (Category | Data Elements | Special Category?)
9. **7. SUB-PROCESSORS**: Authorization process, current list requirement
10. **8. DATA TRANSFERS**: International transfer mechanisms (SCCs)
11. **9. SECURITY MEASURES**: Technical and organizational measures (Annex II)
12. **10. DATA BREACH NOTIFICATION**: 72-hour notification requirements
13. **11. AUDITS AND INSPECTIONS**: Right to audit clause
14. **12. DATA SUBJECT RIGHTS**: Assistance obligations
15. **13. TERM AND TERMINATION**: Duration and data deletion
16. **14. LIABILITY**: Responsibility allocation
17. **ANNEX I**: Processing details table
18. **ANNEX II**: Security measures checklist
19. **SIGNATURE BLOCK**: Table format`,
  },
  {
    id: "incident-report",
    title: "Incident Report Generator",
    category: "Compliance & Legal",
    description: "Create structured incident reports for workplace safety, security breaches, and operational failures.",
    icon: AlertTriangle,
    fields: [
      { name: "incidentType", label: "Incident Type", type: "select", required: true, options: [
        { value: "security-breach", label: "Security / Data Breach" },
        { value: "workplace-safety", label: "Workplace Safety" },
        { value: "service-outage", label: "Service Outage / IT Incident" },
        { value: "compliance", label: "Compliance Violation" },
        { value: "hr", label: "HR / Workplace Incident" },
        { value: "environmental", label: "Environmental" },
      ]},
      { name: "details", label: "Incident Details", type: "textarea", required: true, placeholder: "What happened, when, where, who was involved, what was the impact..." },
      { name: "severity", label: "Severity", type: "select", options: [
        { value: "critical", label: "Critical (P1)" },
        { value: "high", label: "High (P2)" },
        { value: "medium", label: "Medium (P3)" },
        { value: "low", label: "Low (P4)" },
      ]},
      { name: "reportedBy", label: "Reported By", type: "text", placeholder: "Name and role" },
    ],
    systemPrompt: `You are a compliance officer creating incident reports. Generate in markdown.

FORMAT:
1. **INCIDENT REPORT** header with Report #, Classification, Date
2. **Incident Summary**: One-paragraph overview
3. **Incident Details**:
   | Field | Detail |
   | Date/Time | |
   | Location | |
   | Reported By | |
   | Severity | P1/P2/P3/P4 |
   | Status | |
4. **Description of Events**: Chronological timeline
   | Time | Event | Actor | Impact |
5. **People Involved**: Table (Name | Role | Involvement)
6. **Impact Assessment**: What was affected, scope of damage
7. **Immediate Response Actions**: What was done
8. **Root Cause Analysis**: 5 Whys or fishbone analysis
9. **Corrective Actions**: Table (Action | Owner | Due Date | Status)
10. **Preventive Measures**: Long-term improvements
11. **Evidence / Attachments**: List of supporting docs
12. **Regulatory Notifications**: Required notifications and status
13. **Lessons Learned**: Key takeaways
14. **Approvals**: Sign-off table`,
  },

  // ═══════════════════════════════════════
  // CREATIVE & STRATEGY
  // ═══════════════════════════════════════
  {
    id: "brand-voice",
    title: "Brand Voice Analyzer & Adapter",
    category: "Creative & Strategy",
    description: "Analyze your brand's voice profile and adapt any content to match it consistently.",
    icon: Palette,
    fields: [
      { name: "sampleContent", label: "Sample Content (your brand's voice)", type: "textarea", required: true, placeholder: "Paste 2-3 samples of your existing content that represent your brand voice..." },
      { name: "contentToAdapt", label: "Content to Adapt", type: "textarea", placeholder: "Paste content you want rewritten in your brand voice..." },
      { name: "brandName", label: "Brand Name", type: "text", required: true },
    ],
    systemPrompt: `You are a brand strategist and copywriter. Analyze brand voice and adapt content in markdown.

FORMAT:
1. **Brand Voice Profile**:
   | Dimension | Assessment | Scale (1-10) |
   - Formality, Warmth, Humor, Authority, Playfulness, Technical Level
2. **Voice Characteristics**:
   - **Tone**: Primary and secondary tones
   - **Language**: Vocabulary preferences, sentence structure
   - **Personality**: If the brand were a person...
   - **Do's**: What the brand voice sounds like
   - **Don'ts**: What to avoid
3. **Voice Guidelines**: Rules for consistent voice
4. **Adapted Content**: Rewritten content matching the brand voice
5. **Before/After Comparison**: Key changes highlighted
6. **Voice Consistency Checklist**: Quick-check questions
7. **Example Phrases**: Table (Generic | On-Brand Version)`,
  },
  {
    id: "market-research",
    title: "Market Research Brief Generator",
    category: "Creative & Strategy",
    description: "Create structured research briefs with methodology, timeline, and budget frameworks.",
    icon: Search,
    fields: [
      { name: "researchObjective", label: "Research Objective", type: "textarea", required: true, placeholder: "What do you need to learn? What decision will this inform?" },
      { name: "market", label: "Target Market / Industry", type: "text", required: true, placeholder: "B2B SaaS, consumer healthcare, enterprise finance..." },
      { name: "budget", label: "Research Budget", type: "text", placeholder: "$5,000 - $25,000" },
      { name: "timeline", label: "Timeline", type: "text", placeholder: "4-6 weeks" },
    ],
    systemPrompt: `You are a market research director. Generate a comprehensive research brief in markdown.

FORMAT:
1. **Research Brief Overview**: Background, business context
2. **Research Objectives**: Primary and secondary questions
3. **Hypotheses**: What we expect to find
4. **Methodology**: Table (Method | Description | Sample Size | Timeline)
   - Qualitative: interviews, focus groups
   - Quantitative: surveys, data analysis
5. **Target Respondents**: Screening criteria table
6. **Discussion Guide / Survey Framework**: Key questions by topic
7. **Competitive Intelligence Scope**: What to collect
8. **Data Sources**: Primary and secondary sources table
9. **Analysis Framework**: How data will be analyzed
10. **Deliverables**: Table (Deliverable | Format | Due Date)
11. **Budget Breakdown**: Table (Item | Cost | Notes)
12. **Timeline**: Gantt-style table (Week | Activity | Milestone)
13. **Success Criteria**: How to measure research quality`,
  },
  {
    id: "strategic-plan",
    title: "Strategic Planning Document Builder",
    category: "Creative & Strategy",
    description: "Build comprehensive strategic plans with vision, OKRs, SWOT, and roadmaps.",
    icon: Layers,
    fields: [
      { name: "companyName", label: "Company Name", type: "text", required: true },
      { name: "timeframe", label: "Planning Horizon", type: "select", options: [
        { value: "1year", label: "1-Year Plan" },
        { value: "3year", label: "3-Year Plan" },
        { value: "5year", label: "5-Year Plan" },
      ]},
      { name: "currentState", label: "Current State / Context", type: "textarea", required: true, placeholder: "Where the company is now — revenue, market position, team size, challenges..." },
      { name: "aspirations", label: "Strategic Aspirations", type: "textarea", required: true, placeholder: "Where you want to be — goals, markets, revenue targets..." },
    ],
    systemPrompt: `You are a management consulting strategist. Generate a comprehensive strategic plan in markdown.

FORMAT:
1. **Executive Summary**: One-page strategic overview
2. **Vision & Mission**: Clear, inspiring statements
3. **Core Values**: 5-7 values with descriptions
4. **SWOT Analysis**: 2x2 table format with detailed items
5. **Strategic Pillars**: 3-5 key focus areas
6. **OKRs by Pillar**: Table (Objective | Key Result 1 | Key Result 2 | Key Result 3 | Owner)
7. **Market Analysis**: Competitive landscape, market trends
8. **Growth Strategy**: Expansion plans, new markets/products
9. **Financial Projections**: Table (Year | Revenue | Growth | Headcount | Key Investment)
10. **Resource Requirements**: People, technology, capital
11. **Risk Assessment**: Strategic risks and mitigations
12. **Implementation Roadmap**: Quarterly milestones table
13. **Governance**: Review cadence, decision-making framework
14. **Success Metrics**: KPI dashboard table`,
  },
  {
    id: "okr-generator",
    title: "OKR Generator",
    category: "Creative & Strategy",
    description: "Generate aligned Objectives and Key Results for teams and organizations with scoring and progress tracking.",
    icon: Target,
    fields: [
      { name: "level", label: "OKR Level", type: "select", required: true, options: [
        { value: "company", label: "Company-Wide" },
        { value: "department", label: "Department" },
        { value: "team", label: "Team" },
        { value: "individual", label: "Individual" },
      ]},
      { name: "department", label: "Department / Team (if applicable)", type: "text", placeholder: "Engineering, Sales, Marketing..." },
      { name: "goals", label: "Goals / Focus Areas", type: "textarea", required: true, placeholder: "What do you want to achieve this quarter/year?" },
      { name: "period", label: "Time Period", type: "select", options: [
        { value: "q1", label: "Q1" }, { value: "q2", label: "Q2" },
        { value: "q3", label: "Q3" }, { value: "q4", label: "Q4" },
        { value: "annual", label: "Annual" },
      ]},
    ],
    systemPrompt: `You are an OKR coach. Generate well-structured OKRs in markdown.

FORMAT:
1. **OKR Summary**: Level, period, alignment to company strategy
2. **Objectives & Key Results**: For each objective:
   ### Objective [#]: [Inspiring objective statement]
   | KR # | Key Result | Baseline | Target | Score Method |
   - 3-5 measurable key results per objective
   - Scoring: 0.0-1.0 scale (0.7 = target)
3. **Alignment Map**: How these OKRs cascade from/to other levels
4. **Initiative Mapping**: Table (KR | Initiative / Project | Owner | Resources)
5. **Check-in Template**: Weekly/monthly review format
6. **Scoring Guide**: How to score each KR
7. **Anti-patterns to Avoid**: Common OKR mistakes
8. **Stretch vs Committed**: Classification of each KR

OKR RULES:
- Objectives: Qualitative, inspiring, time-bound
- Key Results: Quantitative, measurable, specific
- No tasks/activities as KRs — outcomes only`,
  },
  {
    id: "value-proposition",
    title: "Value Proposition Canvas",
    category: "Creative & Strategy",
    description: "Map customer jobs, pains, and gains to your product's features, pain relievers, and gain creators.",
    icon: Heart,
    fields: [
      { name: "product", label: "Product / Service Name", type: "text", required: true },
      { name: "customerSegment", label: "Target Customer Segment", type: "text", required: true, placeholder: "SMB owners, enterprise IT managers, consumers..." },
      { name: "productDescription", label: "Product Description", type: "textarea", required: true, placeholder: "What does your product/service do?" },
      { name: "customerContext", label: "Customer Context", type: "textarea", placeholder: "What do your customers struggle with? What are they trying to achieve?" },
    ],
    systemPrompt: `You are a product strategist using the Value Proposition Canvas framework. Generate in markdown.

FORMAT:
1. **Customer Profile**:
   ### Customer Jobs
   | # | Job | Type (Functional/Social/Emotional) | Importance |
   
   ### Customer Pains
   | # | Pain | Severity (1-5) | Frequency |
   
   ### Customer Gains
   | # | Gain | Relevance | Type (Required/Expected/Desired/Unexpected) |

2. **Value Map**:
   ### Products & Services
   | # | Feature / Service | Description |
   
   ### Pain Relievers
   | # | Pain Addressed | How Product Relieves It | Fit Score |
   
   ### Gain Creators
   | # | Gain Addressed | How Product Creates It | Fit Score |

3. **Fit Analysis**: Where you have strong fit vs gaps
4. **Messaging Matrix**: Table (Segment | Pain | Message | Proof Point)
5. **Elevator Pitch**: 30-second pitch based on the canvas
6. **Competitive Advantage**: Unique value vs competitors`,
  },
  {
    id: "ab-test-planner",
    title: "A/B Test Planner",
    category: "Creative & Strategy",
    description: "Design rigorous A/B experiments with hypotheses, sample size calculations, and success criteria.",
    icon: FlaskConical,
    fields: [
      { name: "testArea", label: "What to Test", type: "select", required: true, options: [
        { value: "landing-page", label: "Landing Page" },
        { value: "email", label: "Email Campaign" },
        { value: "pricing", label: "Pricing" },
        { value: "feature", label: "Product Feature" },
        { value: "cta", label: "CTA / Button" },
        { value: "checkout", label: "Checkout Flow" },
        { value: "onboarding", label: "Onboarding" },
      ]},
      { name: "hypothesis", label: "What You Want to Test & Why", type: "textarea", required: true, placeholder: "Changing the CTA from 'Sign Up' to 'Start Free Trial' will increase conversions because..." },
      { name: "currentMetric", label: "Current Baseline Metric", type: "text", placeholder: "Current conversion rate: 3.2%" },
      { name: "traffic", label: "Available Traffic / Sample", type: "text", placeholder: "10,000 visitors/month" },
    ],
    systemPrompt: `You are a growth experimentation specialist. Generate a rigorous A/B test plan in markdown.

FORMAT:
1. **Test Overview**: Name, owner, priority, dates
2. **Hypothesis**: Structured format:
   > **If** we [change], **then** [metric] will [improve by X%] **because** [reasoning]
3. **Variables**:
   | Variable | Control (A) | Variant (B) |
4. **Primary Metric**: What defines success
5. **Secondary Metrics**: Additional measurements
6. **Guard Rail Metrics**: What must NOT decrease
7. **Sample Size Calculation**: Table with confidence level, MDE, power, required N
8. **Test Duration**: Based on traffic and required sample
9. **Segmentation**: User segments to analyze
10. **Implementation Plan**: Technical requirements
11. **Success Criteria**: Decision framework
    - If primary metric improves by ≥X% with p<0.05: Ship variant
    - If inconclusive: [plan]
    - If negative: [plan]
12. **Risks & Mitigations**: What could go wrong
13. **Post-Test Analysis Template**: What to document`,
  },
  {
    id: "user-persona",
    title: "User Persona Builder",
    category: "Creative & Strategy",
    description: "Create detailed user personas with demographics, behaviors, goals, frustrations, and journey touchpoints.",
    icon: UserCheck,
    fields: [
      { name: "product", label: "Product / Service", type: "text", required: true },
      { name: "targetAudience", label: "Target Audience Description", type: "textarea", required: true, placeholder: "Describe your ideal customer — who they are, what they do, what they need..." },
      { name: "personaCount", label: "Number of Personas", type: "select", options: [
        { value: "1", label: "1 Primary Persona" },
        { value: "2", label: "2 Personas (Primary + Secondary)" },
        { value: "3", label: "3 Personas (Primary + 2 Secondary)" },
      ]},
      { name: "dataPoints", label: "Known Data Points", type: "textarea", placeholder: "Any existing customer data, survey results, or insights..." },
    ],
    systemPrompt: `You are a UX researcher creating detailed user personas. Generate in markdown.

FORMAT FOR EACH PERSONA:
1. **Persona Card**:
   ## [Persona Name] — "[Quote that captures their mindset]"
   | Attribute | Detail |
   | Age | |
   | Occupation | |
   | Location | |
   | Income | |
   | Education | |
   | Tech Savviness | |

2. **Bio**: 2-3 paragraph narrative
3. **Goals**: Bullet list of primary and secondary goals
4. **Frustrations / Pain Points**: Bullet list with severity
5. **Motivations**: What drives their decisions
6. **Behaviors**: How they research, buy, and use products
7. **Preferred Channels**: Where they spend time
8. **Day in the Life**: Typical day narrative
9. **Journey Map**: Table (Stage | Doing | Thinking | Feeling | Touchpoints | Opportunities)
10. **Objections**: Why they might NOT buy
11. **How to Win Them**: Key messages and features
12. **Anti-Persona**: Who this is NOT`,
  },
  {
    id: "business-model-canvas",
    title: "Business Model Canvas Generator",
    category: "Creative & Strategy",
    description: "Create comprehensive Business Model Canvases with all 9 building blocks and strategic analysis.",
    icon: LayoutGrid,
    fields: [
      { name: "businessName", label: "Business Name", type: "text", required: true },
      { name: "businessDescription", label: "Business Description", type: "textarea", required: true, placeholder: "What does the business do? Who does it serve? How does it make money?" },
      { name: "industry", label: "Industry", type: "text", placeholder: "SaaS, Healthcare, Retail..." },
      { name: "stage", label: "Business Stage", type: "select", options: [
        { value: "idea", label: "Idea / Concept" },
        { value: "startup", label: "Startup / MVP" },
        { value: "growth", label: "Growth" },
        { value: "mature", label: "Mature / Established" },
      ]},
    ],
    systemPrompt: `You are a business strategy consultant. Generate a comprehensive Business Model Canvas in markdown.

FORMAT:
1. **Business Model Canvas Overview**

2. **The 9 Building Blocks**: Each as a detailed section:

### 1. Customer Segments
- Segment descriptions, sizes, characteristics

### 2. Value Propositions
- For each segment: what value you deliver

### 3. Channels
Table: | Channel | Phase | Type | Cost |

### 4. Customer Relationships
Table: | Segment | Relationship Type | Description |

### 5. Revenue Streams
Table: | Stream | Type | Pricing | Est. Revenue % |

### 6. Key Resources
- Physical, Intellectual, Human, Financial

### 7. Key Activities
- Production, Problem Solving, Platform/Network

### 8. Key Partnerships
Table: | Partner | Type | Motivation | Key Activity |

### 9. Cost Structure
Table: | Cost | Type (Fixed/Variable) | Est. Amount | % of Total |

3. **Canvas Summary**: Visual text-based layout
4. **Strategic Analysis**: Strengths, vulnerabilities, opportunities
5. **Next Steps**: Validation experiments to run`,
  },
  {
    id: "swot-deep-dive",
    title: "SWOT Deep Dive Analyzer",
    category: "Creative & Strategy",
    description: "Generate comprehensive SWOT analyses with strategic implications, action items, and TOWS matrix.",
    icon: Crosshair,
    fields: [
      { name: "subject", label: "Subject of Analysis", type: "text", required: true, placeholder: "Company name, product, or project" },
      { name: "context", label: "Context & Background", type: "textarea", required: true, placeholder: "Current situation, market position, competitive landscape..." },
      { name: "industry", label: "Industry", type: "text", placeholder: "Technology, Healthcare, Finance..." },
    ],
    systemPrompt: `You are a management consultant performing strategic analysis. Generate a comprehensive SWOT in markdown.

FORMAT:
1. **Executive Summary**: Key strategic insights
2. **SWOT Matrix**: 2x2 table format
   | | Helpful | Harmful |
   | Internal | **Strengths** | **Weaknesses** |
   | External | **Opportunities** | **Threats** |

3. **Detailed Analysis**: For each quadrant:
   - 5-8 items with explanation and evidence
   - Impact rating (High/Medium/Low)
   - Trend direction (↑ Growing, → Stable, ↓ Declining)

4. **TOWS Strategic Matrix**: Cross-referencing quadrants
   | | Strengths | Weaknesses |
   | Opportunities | **SO Strategies** (Maximize) | **WO Strategies** (Minimize/Maximize) |
   | Threats | **ST Strategies** (Maximize/Minimize) | **WT Strategies** (Minimize) |

5. **Strategic Implications**: What this means
6. **Priority Actions**: Table (Action | Quadrant | Impact | Effort | Timeline)
7. **Risk Monitoring**: Key indicators to watch
8. **Review Schedule**: When to reassess`,
  },
  {
    id: "product-roadmap",
    title: "Product Roadmap Builder",
    category: "Creative & Strategy",
    description: "Create strategic product roadmaps with themes, epics, prioritization frameworks, and timeline visualizations.",
    icon: MapPin,
    fields: [
      { name: "productName", label: "Product Name", type: "text", required: true },
      { name: "timeframe", label: "Roadmap Timeframe", type: "select", options: [
        { value: "quarter", label: "Quarterly" },
        { value: "halfyear", label: "6 Months" },
        { value: "annual", label: "Annual" },
      ]},
      { name: "features", label: "Planned Features / Initiatives", type: "textarea", required: true, placeholder: "List features, improvements, and initiatives to prioritize..." },
      { name: "strategy", label: "Product Strategy / Goals", type: "textarea", placeholder: "Product vision, key metrics to move, market goals..." },
    ],
    systemPrompt: `You are a product management leader. Generate a strategic product roadmap in markdown.

FORMAT:
1. **Product Vision**: One-sentence vision statement
2. **Strategic Themes**: 3-4 themes driving the roadmap
3. **Prioritization Framework**: RICE or MoSCoW scoring table
   | Feature | Reach | Impact | Confidence | Effort | Score | Priority |
4. **Roadmap by Theme**: For each quarter/phase:
   ### [Period]: [Theme]
   | Epic | Features | Owner | Effort | Dependencies | Status |
5. **Now / Next / Later** view:
   - **Now** (Current quarter): Committed items
   - **Next** (Following quarter): Planned items
   - **Later** (Future): Exploratory items
6. **Dependencies**: Table (Feature | Depends On | Team | Risk)
7. **Resource Allocation**: Team capacity by theme
8. **Success Metrics**: Table (Theme | Metric | Current | Target | Timeline)
9. **Risks & Mitigations**: Roadmap execution risks
10. **Review Cadence**: How and when to update`,
  },
  // ═══════════════════════════════════════
  // ADDITIONAL TOOLS (49-50)
  // ═══════════════════════════════════════
  {
    id: "proposal-template",
    title: "RFP Proposal Template",
    category: "Documents & Generation",
    description: "Generate a polished RFP-ready proposal with scope, deliverables, timeline, and pricing tables.",
    icon: Briefcase,
    fields: [
      { name: "projectName", label: "Project / RFP Name", type: "text", required: true, placeholder: "e.g. Website Redesign for Acme Corp" },
      { name: "clientName", label: "Client / Organization", type: "text", required: true, placeholder: "e.g. Acme Corp" },
      { name: "scope", label: "Scope of Work", type: "textarea", required: true, placeholder: "Describe the deliverables, phases, and objectives..." },
      { name: "budget", label: "Budget Range", type: "text", placeholder: "e.g. $15,000 – $25,000" },
      { name: "timeline", label: "Timeline", type: "text", placeholder: "e.g. 8 weeks" },
      { name: "tone", label: "Tone", type: "select", options: [
        { value: "formal", label: "Formal" },
        { value: "professional", label: "Professional" },
        { value: "conversational", label: "Conversational" },
      ]},
    ],
    systemPrompt: `You are a proposal writing expert. Generate a complete, professional RFP-ready proposal in markdown with these sections:
1. **Cover Page** (project title, prepared for, prepared by, date)
2. **Executive Summary** (2-3 paragraphs)
3. **Understanding of Requirements**
4. **Scope of Work** (numbered deliverables)
5. **Project Timeline** (markdown table with phases, milestones, dates)
6. **Pricing** (markdown table with line items, quantities, unit prices, totals)
7. **Team & Qualifications**
8. **Terms & Conditions**
9. **Next Steps**

Use professional formatting, numbered sections, and clear markdown tables for pricing and timelines.`,
    maxTokens: 4000,
  },
  {
    id: "executive-summary",
    title: "Executive Summary Generator",
    category: "Documents & Generation",
    description: "Create a concise, impactful executive summary for business plans, reports, or proposals.",
    icon: FileText,
    fields: [
      { name: "documentType", label: "Document Type", type: "select", required: true, options: [
        { value: "business-plan", label: "Business Plan" },
        { value: "annual-report", label: "Annual Report" },
        { value: "project-proposal", label: "Project Proposal" },
        { value: "research-report", label: "Research Report" },
        { value: "strategic-plan", label: "Strategic Plan" },
      ]},
      { name: "keyPoints", label: "Key Points / Content to Summarize", type: "textarea", required: true, placeholder: "Paste the main content, data points, or bullet points to summarize..." },
      { name: "audience", label: "Target Audience", type: "text", required: true, placeholder: "e.g. Board of Directors, Investors, C-Suite" },
      { name: "length", label: "Desired Length", type: "select", options: [
        { value: "brief", label: "Brief (1 paragraph)" },
        { value: "standard", label: "Standard (3-5 paragraphs)" },
        { value: "detailed", label: "Detailed (1-2 pages)" },
      ]},
    ],
    systemPrompt: `You are an executive communications specialist. Write a compelling executive summary in markdown that:
- Opens with a strong hook or key finding
- Highlights the most critical data points and outcomes
- Uses clear, jargon-free language appropriate for the target audience
- Includes a brief recommendation or call to action
- Maintains a confident, authoritative tone
- Uses bold for key metrics and findings
- Keeps paragraphs concise and scannable

Structure: Problem/Opportunity → Key Findings → Recommendations → Next Steps.`,
    maxTokens: 2000,
  },
  // ═══════════════════════════════════════
  // OHIO NOTARY TOOLS
  // ═══════════════════════════════════════
  {
    id: "ohio-ron-certificate",
    title: "Ohio RON Certificate Generator",
    category: "Compliance & Legal",
    description: "Generate Ohio-compliant Remote Online Notarization certificates with ORC §147.60–147.66 citations.",
    icon: Landmark,
    fields: [
      { name: "certType", label: "Certificate Type", type: "select", required: true, options: [
        { value: "acknowledgment", label: "Acknowledgment" },
        { value: "jurat", label: "Jurat" },
        { value: "copy_certification", label: "Copy Certification" },
        { value: "signature_witnessing", label: "Signature Witnessing" },
      ]},
      { name: "signerName", label: "Signer Name", type: "text", required: true, placeholder: "John A. Smith" },
      { name: "notaryName", label: "Notary Name", type: "text", required: true, placeholder: "Jane B. Doe" },
      { name: "commissionNumber", label: "Commission Number", type: "text", required: true, placeholder: "2024-OH-12345" },
      { name: "commissionExpiry", label: "Commission Expiration Date", type: "text", placeholder: "December 31, 2027" },
      { name: "county", label: "County of Notarization", type: "text", placeholder: "Franklin County" },
      { name: "documentDescription", label: "Document Description", type: "text", placeholder: "Deed of Trust" },
    ],
    systemPrompt: `You are an Ohio-commissioned notary public specialist. Generate a legally compliant RON notarial certificate following Ohio Revised Code §147.60–147.66.

FORMAT REQUIREMENTS:
- Include proper venue block: "STATE OF OHIO, COUNTY OF [county]"
- Include the specific statutory language for the certificate type
- Include notary block with name, commission number, commission expiration, and "Remote Online Notarization" designation
- Cite applicable ORC sections (§147.60 for definitions, §147.63 for notarial acts, §147.64 for standards)
- Include tamper-evident seal notation
- Include audio-video recording retention notice (10-year requirement per §147.63)
- Format as a professional legal certificate in markdown with clear sections`,
    maxTokens: 3000,
  },
  {
    id: "ohio-journal-drafter",
    title: "Notary Journal Entry Drafter",
    category: "Compliance & Legal",
    description: "Draft Ohio-compliant notary journal entries per ORC §147.04 requirements.",
    icon: BookOpen,
    fields: [
      { name: "notarizationType", label: "Type of Notarization", type: "select", required: true, options: [
        { value: "acknowledgment", label: "Acknowledgment" },
        { value: "jurat", label: "Jurat" },
        { value: "oath", label: "Oath/Affirmation" },
        { value: "copy_certification", label: "Copy Certification" },
      ]},
      { name: "signerName", label: "Signer Name", type: "text", required: true, placeholder: "Full legal name" },
      { name: "documentType", label: "Document Type", type: "text", required: true, placeholder: "e.g., Power of Attorney, Deed" },
      { name: "idType", label: "ID Verification Method", type: "select", required: true, options: [
        { value: "drivers_license", label: "Driver's License" },
        { value: "passport", label: "Passport" },
        { value: "state_id", label: "State ID Card" },
        { value: "military_id", label: "Military ID" },
        { value: "kba", label: "Knowledge-Based Authentication (KBA)" },
      ]},
      { name: "sessionType", label: "Session Type", type: "select", required: true, options: [
        { value: "ron", label: "Remote Online (RON)" },
        { value: "in_person", label: "In-Person" },
        { value: "mobile", label: "Mobile Notary" },
      ]},
      { name: "additionalNotes", label: "Additional Notes", type: "textarea", placeholder: "Any unusual circumstances, credible witnesses, etc." },
    ],
    systemPrompt: `You are an Ohio notary journal compliance expert. Generate a complete journal entry that meets ORC §147.04 requirements.

REQUIRED FIELDS:
- Date and time of notarization
- Type of notarial act performed
- Type, title, or description of document
- Signer's printed name and signature line
- Identity verification method with details
- Fee charged (use standard Ohio notary fee of $5.00 per signature per ORC §147.08)
- For RON sessions: technology platform used, KBA results, recording duration
- Session unique identifier

Format as a structured journal entry form in markdown with clear field labels and values.`,
    maxTokens: 2000,
  },
  {
    id: "ohio-acknowledgment-jurat",
    title: "Ohio Acknowledgment/Jurat Formatter",
    category: "Compliance & Legal",
    description: "Format Ohio jurisdictional acknowledgment or jurat certificates with proper statutory language.",
    icon: Scale,
    fields: [
      { name: "formType", label: "Form Type", type: "select", required: true, options: [
        { value: "individual_ack", label: "Individual Acknowledgment" },
        { value: "corporate_ack", label: "Corporate Acknowledgment" },
        { value: "representative_ack", label: "Representative Acknowledgment" },
        { value: "jurat", label: "Jurat (Verification on Oath/Affirmation)" },
        { value: "attestation", label: "Attestation" },
      ]},
      { name: "signerName", label: "Signer Name", type: "text", required: true, placeholder: "Full legal name" },
      { name: "capacity", label: "Signing Capacity", type: "text", placeholder: "e.g., individually, as CEO of XYZ Corp" },
      { name: "county", label: "County", type: "text", required: true, placeholder: "Franklin" },
      { name: "notaryName", label: "Notary Public Name", type: "text", required: true },
      { name: "commissionNumber", label: "Commission Number", type: "text", required: true },
    ],
    systemPrompt: `You are an Ohio notarial certificate specialist. Generate the proper Ohio statutory form.

REQUIREMENTS:
- Use exact statutory language from ORC §147.55 (short form certificates)
- Include proper venue: "STATE OF OHIO, COUNTY OF ___"
- Include signer's capacity if applicable
- Include notary signature block with commission details
- For RON: add "This notarial act involved a remote online notarization" per Ohio rules
- Reference applicable ORC sections

Format as a clean, print-ready legal form in markdown.`,
    maxTokens: 2000,
  },
  {
    id: "ron-session-summary",
    title: "RON Session Summary Report",
    category: "Compliance & Legal",
    description: "Generate comprehensive RON session summary reports for records retention and compliance.",
    icon: ClipboardCheck,
    fields: [
      { name: "sessionId", label: "Session ID", type: "text", required: true, placeholder: "RON-20240101-abc123" },
      { name: "signerName", label: "Signer Name", type: "text", required: true },
      { name: "notaryName", label: "Notary Name", type: "text", required: true },
      { name: "documentTypes", label: "Documents Notarized (comma-separated)", type: "textarea", required: true, placeholder: "Power of Attorney, Deed of Trust" },
      { name: "kbaResult", label: "KBA Result", type: "select", required: true, options: [
        { value: "pass", label: "Passed" },
        { value: "fail_retry_pass", label: "Failed 1st, Passed 2nd" },
        { value: "fail", label: "Failed (Session Terminated)" },
      ]},
      { name: "recordingDuration", label: "Recording Duration (minutes)", type: "number", placeholder: "15" },
      { name: "additionalInfo", label: "Additional Information", type: "textarea", placeholder: "Credible witnesses, interpreter present, unusual circumstances" },
    ],
    systemPrompt: `You are an Ohio RON compliance documentation specialist. Generate a comprehensive session summary report.

REQUIRED SECTIONS:
1. **Session Header**: ID, date/time, participants
2. **Identity Verification**: KBA results, ID type, credential analysis
3. **Notarial Acts Performed**: Each document with act type
4. **Technology Compliance**: Platform used, recording confirmation, tamper-evident seal applied
5. **Ohio Compliance Checklist**:
   - KBA within 2-attempt limit (ORC §147.66)
   - Audio-video recording captured and stored
   - 10-year retention period noted (ORC §147.63)
   - Digital certificate applied
   - Journal entry created
6. **Signatures & Attestation**

Format as a formal compliance report in markdown with tables for structured data.`,
    maxTokens: 4000,
  },
  {
    id: "notary-commission-checklist",
    title: "Notary Commission Renewal Checklist",
    category: "Compliance & Legal",
    description: "Generate a comprehensive Ohio notary commission renewal checklist with deadlines and requirements.",
    icon: ListChecks,
    fields: [
      { name: "notaryName", label: "Notary Name", type: "text", required: true },
      { name: "currentExpiry", label: "Current Commission Expiration", type: "text", required: true, placeholder: "March 15, 2027" },
      { name: "commissionTypes", label: "Commission Types", type: "select", required: true, options: [
        { value: "traditional", label: "Traditional Notary Only" },
        { value: "ron", label: "RON Endorsement Only" },
        { value: "both", label: "Traditional + RON" },
      ]},
      { name: "county", label: "County of Commission", type: "text", required: true, placeholder: "Franklin" },
    ],
    systemPrompt: `You are an Ohio notary commission administration expert. Generate a detailed renewal checklist.

INCLUDE:
1. **Timeline**: Key dates working backward from expiration (90 days, 60 days, 30 days)
2. **Application Requirements**: Forms, fees ($15 for traditional per ORC §147.04), background check
3. **Bond Requirements**: $10,000 surety bond (ORC §147.01), E&O insurance recommendations
4. **RON Endorsement** (if applicable):
   - Additional $25 fee
   - Approved technology provider registration
   - Training/CE requirements
5. **Continuing Education**: Hours required, approved providers
6. **Document Checklist**: Everything needed for submission
7. **Post-Renewal**: Update seal, notify clients, update technology platforms
8. **Important Contacts**: Ohio Secretary of State office details

Format as a clear, actionable checklist with checkbox-style items in markdown.`,
    maxTokens: 3000,
  },
];

export const TOOL_CATEGORIES: ToolCategory[] = [
  "Documents & Generation",
  "Analysis & Insights",
  "Communication",
  "Compliance & Legal",
  "Creative & Strategy",
];

export function getToolById(id: string): AITool | undefined {
  return AI_TOOLS.find(t => t.id === id);
}

export function getToolsByCategory(category: ToolCategory): AITool[] {
  return AI_TOOLS.filter(t => t.category === category);
}
