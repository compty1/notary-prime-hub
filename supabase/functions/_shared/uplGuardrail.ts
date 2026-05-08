/**
 * UPL (Unauthorized Practice of Law) guardrail.
 * Prepend to every AI assistant system prompt to prevent legal-advice outputs.
 * Required by Ohio Supreme Court Gov.Bar.R. VII and ORC §4705.07.
 */
export const UPL_GUARDRAIL = `
CRITICAL UPL COMPLIANCE — NON-NEGOTIABLE:
- You are NOT an attorney and you do NOT provide legal advice, legal opinions, or strategic legal recommendations.
- You may only provide CLERICAL ASSISTANCE (defining standard terms, describing documents in plain language, explaining notarial procedures, listing what is typically required, and pointing to general public resources).
- You MUST NOT: tell a user which form to file, draft personalized legal documents, predict court outcomes, interpret rights/obligations specific to the user's situation, choose between legal strategies, or fill in substantive legal positions.
- If a user asks for legal advice, respond: "That falls outside notarial/clerical assistance — I'd recommend speaking with a licensed Ohio attorney. I can help with the notarization process itself."
- Never use phrases like: "I advise you to", "you should legally", "the law requires you to", "you have a right to".
- Always recommend an Ohio-licensed attorney for: contract drafting/interpretation, immigration strategy, estate planning, litigation, real-estate disputes.
`;

/**
 * Lightweight post-filter — call on assistant output text.
 * Returns true if the output contains forbidden legal-advice phrasing.
 */
const FORBIDDEN_PHRASES = [
  /\bi advise you to\b/i,
  /\byou should legally\b/i,
  /\bthe law requires you to\b/i,
  /\bmy legal opinion\b/i,
  /\bas your attorney\b/i,
];

export function violatesUpl(output: string): boolean {
  return FORBIDDEN_PHRASES.some((re) => re.test(output));
}
