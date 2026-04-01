import { corsHeaders } from "@supabase/supabase-js/cors";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const EXTRACTOR_PROMPTS: Record<string, string> = {
  legal: `You are a legal document analyst specializing in contracts, deeds, and legal agreements.
Extract the following into a structured JSON response using the extract_results tool:
- parties: Array of party names and their roles
- key_dates: Array of {date, description} for all dates mentioned (effective, expiration, renewal, termination)
- obligations: Array of {party, obligation, deadline} for each obligation
- termination_clauses: Array of termination conditions with notice periods
- consideration: Financial terms, amounts, payment schedules
- renewal_terms: Auto-renewal conditions, opt-out requirements
- governing_law: Jurisdiction and governing law
- risk_flags: Array of potential issues or unusual clauses
- summary: 2-3 sentence executive summary

For each extracted item, include a "source_quote" field with the exact text from the document where you found it.`,

  finance: `You are a financial document analyst specializing in invoices, bank statements, and financial records.
Extract the following into a structured JSON response using the extract_results tool:
- transactions: Array of {date, description, category, amount, type: "debit"|"credit"}
- categories: Object mapping category names to total amounts
- total_credits: Total income/credits
- total_debits: Total expenses/debits
- net_amount: Net balance change
- date_range: {start, end} dates covered
- recurring_items: Array of detected recurring transactions
- anomalies: Array of unusual transactions or amounts
- summary: 2-3 sentence financial summary

Categorize transactions into: rent, utilities, payroll, supplies, travel, professional_services, insurance, taxes, subscriptions, other.
For each item include "source_quote" with the original text.`,

  hr: `You are an HR document analyst specializing in resumes, employee handbooks, and HR policies.
Extract the following into a structured JSON response using the extract_results tool:

For RESUMES:
- candidate_name, email, phone, location
- skills: Array of skills with proficiency level
- experience: Array of {company, title, dates, key_achievements}
- education: Array of {institution, degree, year}
- certifications: Array of certifications
- summary: Professional summary

For HANDBOOKS/POLICIES:
- policies: Array of {name, description, key_rules}
- pto_details: PTO/leave policy details
- benefits: Array of benefit descriptions
- compliance_requirements: Required trainings, certifications
- disciplinary_process: Steps in disciplinary process
- summary: 2-3 sentence overview

For each item include "source_quote" with the original text.`,

  general: `You are a document analyst. Analyze this document and extract structured information using the extract_results tool:
- document_type: What kind of document this is
- key_entities: Array of {name, type: "person"|"organization"|"location"|"date"|"amount"}
- dates: Array of {date, context}
- obligations: Array of action items, requirements, or commitments
- financial_items: Array of monetary amounts with context
- key_clauses: Array of important sections or clauses
- action_items: Array of required next steps
- risk_flags: Array of potential concerns
- summary: 2-3 sentence executive summary

For each extracted item, include "source_quote" with the exact text from the document.`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { document_text, extractor_type = "general" } = await req.json();

    if (!document_text || typeof document_text !== "string") {
      return new Response(JSON.stringify({ error: "document_text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (document_text.length > 100000) {
      return new Response(JSON.stringify({ error: "Document too large. Maximum 100,000 characters." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = EXTRACTOR_PROMPTS[extractor_type] || EXTRACTOR_PROMPTS.general;

    const tools = [
      {
        type: "function",
        function: {
          name: "extract_results",
          description: "Return the structured extraction results from the document analysis.",
          parameters: {
            type: "object",
            properties: {
              document_type: { type: "string" },
              summary: { type: "string" },
              results: {
                type: "object",
                description: "The extracted data — shape varies by extractor type",
              },
              confidence: {
                type: "number",
                description: "Overall confidence score 0-100",
              },
            },
            required: ["document_type", "summary", "results", "confidence"],
            additionalProperties: false,
          },
        },
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this document:\n\n${document_text}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "extract_results" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI service is busy. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI did not return structured results" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ extraction: extracted, extractor_type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-extract-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
