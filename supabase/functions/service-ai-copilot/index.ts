import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCorsOptions, errorResponse, rateLimitGuard, requireEnvVars } from "../_shared/middleware.ts";

/**
 * Service AI Copilot — Sprint 8
 * Modes: generate, review, refine, suggest_next, autocomplete, outreach_email
 * Streaming SSE responses via Lovable AI Gateway
 */

const VALID_MODES = new Set(["generate", "review", "refine", "suggest_next", "autocomplete", "outreach_email"]);

const CATEGORY_SYSTEM_PROMPTS: Record<string, string> = {
  notarization: `You are an expert Ohio notary operations assistant. You specialize in:
- Ohio Revised Code Chapter 147 compliance
- Remote Online Notarization (RON) under ORC §147.65-66
- Acknowledgments, jurats, copy certifications, oaths
- Journal entry requirements (ORC §147.551)
- Identity verification (ORC §147.542)
- Seal and signature requirements
Always cite specific ORC sections. Format output in professional legal document style.`,

  legal: `You are an expert legal document assistant. You specialize in:
- Power of Attorney documents (general, durable, healthcare, limited)
- Estate planning documents (wills, trusts, healthcare directives)
- Affidavits and sworn statements
- Corporate resolutions and bylaws
- Contract drafting and review
- UPL (Unauthorized Practice of Law) awareness
Always include proper legal formatting with numbered paragraphs, defined terms, and signature blocks.`,

  translation: `You are an expert certified translation assistant. You specialize in:
- USCIS-accepted certified translation formatting
- Certificate of Translation Accuracy statements
- Side-by-side source/target document layout
- Legal terminology in multiple languages
- Glossary management and consistency
- Word count and page count tracking
Always include the certification statement and translator credentials block.`,

  content: `You are an expert content creation assistant for business communications. You specialize in:
- SEO-optimized blog posts and articles
- Professional newsletters and email campaigns
- Social media content calendars
- Press releases and media kits
- Case studies and white papers
- Brand voice consistency
Include readability scores, SEO keyword suggestions, and meta descriptions.`,

  business: `You are an expert business document assistant. You specialize in:
- Business formation documents (Articles of Incorporation, Operating Agreements)
- Business plans and proposals
- Corporate governance documents
- SOS filings and annual reports
- Financial projections and budgets
- Industry-standard formatting and compliance
Use professional corporate formatting with proper section numbering.`,

  immigration: `You are an expert immigration document assistant. You specialize in:
- USCIS form preparation guidance (I-130, I-485, I-765, N-400, etc.)
- Document checklists by visa category
- Country-specific notarization requirements
- Translation coordination for immigration documents
- Processing timeline estimation
- Supporting evidence organization
Always reference current USCIS requirements and processing times.`,

  research: `You are an expert research and analysis assistant. You specialize in:
- Market research reports
- Competitive analysis
- Data analysis and visualization recommendations
- Academic and professional citations
- Methodology documentation
- Executive summary writing
Use proper citation formatting and include methodology sections.`,

  verification: `You are an expert identity and background verification assistant. You specialize in:
- I-9 Employment Verification compliance
- Background check processing
- Identity certificate preparation
- Fingerprinting service coordination (FD-258)
- E-Verify guidance
- Document authentication
Always reference current DHS and USCIS requirements.`,

  "real-estate": `You are an expert real estate document assistant. You specialize in:
- Loan signing packages
- Deed transfers and title documents
- Mortgage and HELOC documents
- Closing cost breakdowns
- E-recording requirements
- Title company coordination
Use industry-standard real estate formatting and include all required disclosures.`,

  "court-forms": `You are an expert court forms assistant. You specialize in:
- Ohio court form preparation
- Filing requirements by county
- Case type classifications
- Deadline calculations
- Required attachments and exhibits
- Service of process documentation
Always reference specific Ohio Rules of Civil/Criminal Procedure.`,

  "process-serving": `You are an expert process serving assistant. You specialize in:
- Service of process rules (Ohio Civ.R. 4)
- Affidavit of service generation
- Substituted service requirements
- Due diligence documentation
- Skip tracing coordination
- Attempt logging and GPS documentation
Follow Ohio Rules of Civil Procedure for service requirements.`,

  default: `You are a professional document and service delivery assistant. You help create high-quality, industry-standard deliverables. Format all output in clean, professional markdown with proper structure, headings, and formatting.`,
};

function getModeInstructions(mode: string): string {
  switch (mode) {
    case "generate":
      return "Generate a complete, professional document based on the provided inputs. Be thorough — do not truncate or abbreviate. Use proper markdown formatting with headers, tables, lists, and emphasis where appropriate.";
    case "review":
      return "Review the provided content for quality, completeness, compliance, and accuracy. Provide a detailed analysis with: 1) Overall quality score (1-10), 2) Strengths, 3) Issues found (categorized by severity), 4) Specific improvement recommendations, 5) Compliance check results. Format as a structured review report.";
    case "refine":
      return "Refine and improve the provided content based on the given instructions. Maintain the original structure and intent while making the requested improvements. Return the complete refined version.";
    case "suggest_next":
      return "Based on the current state of this service/job, suggest the next 3-5 actionable steps the professional should take. Include estimated time for each step, any compliance requirements, and potential issues to watch for. Format as a numbered action list.";
    case "autocomplete":
      return "Complete the partial content provided. Match the existing tone, style, and formatting. Provide a natural, professional continuation that fits seamlessly with what's already written.";
    case "outreach_email":
      return "Generate a professional outreach email for business development. The email should be personalized, compelling, and action-oriented. Include: subject line, email body, and a clear call-to-action. Keep it concise (under 200 words) and professional.";
    default:
      return "Provide professional assistance with the requested task.";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsOptions(req);

  try {
    const rl = rateLimitGuard(req, 20);
    if (rl) return rl;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse(req, 401, "Unauthorized");
    }

    const envErr = requireEnvVars(req, "SUPABASE_URL", "LOVABLE_API_KEY");
    if (envErr) return envErr;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse(req, 401, "Unauthorized");

    const body = await req.json();
    const { mode, category, content, fields, instructions, tone, length: outputLength, previousOutput } = body;

    if (!mode || !VALID_MODES.has(mode)) {
      return errorResponse(req, 400, "Invalid mode", `Mode must be one of: ${[...VALID_MODES].join(", ")}`);
    }

    const systemPrompt = CATEGORY_SYSTEM_PROMPTS[category] || CATEGORY_SYSTEM_PROMPTS.default;
    const modeInstructions = getModeInstructions(mode);

    let toneInstruction = "";
    if (tone) toneInstruction = `\n\nTone/Style: ${tone}`;
    let lengthInstruction = "";
    if (outputLength) lengthInstruction = `\n\nDesired length: ${outputLength}`;

    const messages: Array<{ role: string; content: string }> = [
      {
        role: "system",
        content: `${systemPrompt}\n\n## Task\n${modeInstructions}${toneInstruction}${lengthInstruction}\n\nIMPORTANT: Output ONLY in markdown format. Use proper markdown tables, headers, bold, italic, lists, code blocks, and blockquotes. Be thorough and complete.`,
      },
    ];

    if (mode === "generate" || mode === "outreach_email") {
      const fieldEntries = fields
        ? Object.entries(fields as Record<string, string>)
            .filter(([, v]) => v && String(v).trim())
            .map(([k, v]) => `**${k}**: ${v}`)
            .join("\n")
        : "";
      messages.push({
        role: "user",
        content: instructions
          ? `${instructions}\n\n${fieldEntries}`
          : `Generate based on these inputs:\n\n${fieldEntries}`,
      });
    } else if (mode === "review") {
      messages.push({
        role: "user",
        content: `Review the following content:\n\n${content || previousOutput}\n\n${instructions ? `Additional review criteria: ${instructions}` : ""}`,
      });
    } else if (mode === "refine") {
      if (previousOutput) {
        messages.push({ role: "assistant", content: previousOutput });
      }
      messages.push({
        role: "user",
        content: `Refine with these instructions: ${instructions || "Improve quality, clarity, and completeness."}`,
      });
    } else if (mode === "suggest_next") {
      messages.push({
        role: "user",
        content: `Current context:\n\n${content || ""}\n\n${instructions ? `Additional context: ${instructions}` : "Suggest the next steps for this service delivery."}`,
      });
    } else if (mode === "autocomplete") {
      messages.push({
        role: "user",
        content: `Complete this partial content:\n\n${content}`,
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      const status = response.status === 429 ? 429 : response.status === 402 ? 402 : 500;
      return new Response(JSON.stringify({ error: `AI service error: ${response.status}`, details: errText }), {
        status,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders(req),
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return errorResponse(req, 500, "Internal Error", (err as Error).message);
  }
});
