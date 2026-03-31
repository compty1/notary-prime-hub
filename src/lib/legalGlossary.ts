export interface GlossaryTerm {
  term: string;
  definition: string;
}

export const legalGlossary: GlossaryTerm[] = [
  { term: "Jurat", definition: "A fancy way of saying you promise to tell the truth, usually involving an oath before a notary." },
  { term: "Acknowledgment", definition: "When a notary confirms that you signed a document willingly and you are who you say you are." },
  { term: "Affiant", definition: "The person who signs a sworn statement (affidavit), promising that everything they wrote is true." },
  { term: "Instrument", definition: "Just a legal word for any official document — like a contract, deed, or power of attorney." },
  { term: "Notarial Act", definition: "Any official action a notary performs, like witnessing a signature or administering an oath." },
  { term: "Deponent", definition: "A person who gives testimony or makes a statement under oath, usually in writing." },
  { term: "Attestation", definition: "A formal statement by a notary that they witnessed you sign a document." },
  { term: "Apostille", definition: "A special certificate that makes your notarized document valid in other countries that accept it." },
  { term: "Authentication", definition: "The process of verifying that a document, signature, or seal is genuine and valid." },
  { term: "Certified Copy", definition: "A copy of an original document that a notary confirms is a true and accurate reproduction." },
  { term: "Credential Analysis", definition: "The process of examining your ID to make sure it's real and hasn't been tampered with." },
  { term: "E-Seal", definition: "A digital version of a notary's official stamp, used for electronic and remote notarizations." },
  { term: "Locus Sigilli", definition: "Latin for 'place of the seal' — the spot on a document where the notary's seal goes." },
  { term: "Venue", definition: "In notary terms, the location (state and county) where the notarization takes place." },
  { term: "Oath", definition: "A solemn promise, usually invoking a higher power, that what you're saying or signing is truthful." },
  { term: "Affirmation", definition: "Like an oath, but without the religious part — a serious promise that your statements are true." },
  { term: "Principal", definition: "The main person involved in the notarization — the one whose signature is being notarized." },
  { term: "Subscribing Witness", definition: "Someone who watches you sign a document and can confirm that they saw you do it." },
  { term: "Affidavit", definition: "A written statement you sign under oath, swearing that everything in it is true." },
  { term: "Power of Attorney", definition: "A legal document that lets someone else make decisions or sign things on your behalf." },
  { term: "Notary Public", definition: "A person authorized by the state to witness signatures, administer oaths, and certify documents." },
  { term: "Commission", definition: "The official authorization from the state that allows someone to work as a notary public." },
  { term: "RON", definition: "Remote Online Notarization — getting your documents notarized over a video call from anywhere." },
  { term: "KBA", definition: "Knowledge-Based Authentication — security questions based on your personal history to verify your identity." },
  { term: "Signer", definition: "The person who signs a document in front of a notary." },
  { term: "Seal", definition: "The notary's official stamp or embossed mark that makes a notarization official." },
  { term: "Notarize", definition: "The act of having a notary public officially witness and certify a document or signature." },
  { term: "Escrow", definition: "When a neutral third party holds money or documents until certain conditions are met." },
  { term: "Deed", definition: "A legal document that transfers ownership of property from one person to another." },
  { term: "Mortgage", definition: "A loan agreement where your home is used as collateral — if you don't pay, the lender can take it." },
  { term: "Title", definition: "Legal proof that you own a piece of property." },
  { term: "Witness", definition: "Someone who watches a signing or event happen so they can confirm it later if needed." },
  { term: "Executor", definition: "The person named in a will to carry out the wishes of someone who has passed away." },
  { term: "Beneficiary", definition: "The person who receives money, property, or benefits from a will, trust, or insurance policy." },
  { term: "Trust", definition: "A legal arrangement where one person manages assets for the benefit of another." },
  { term: "Grantor", definition: "The person who creates a trust or transfers property to someone else." },
  { term: "Grantee", definition: "The person who receives property or assets from a grantor." },
  { term: "Codicil", definition: "An addition or change made to an existing will without rewriting the whole thing." },
  { term: "Duress", definition: "Being forced or pressured into signing something against your will — this makes the document invalid." },
  { term: "Capacity", definition: "A person's mental ability to understand what they're signing and the consequences of signing it." },
  { term: "Revocation", definition: "Officially canceling or taking back something, like a power of attorney or notarization." },
  { term: "Surety Bond", definition: "An insurance-like guarantee that a notary will do their job properly and follow the law." },
  { term: "ORC", definition: "Ohio Revised Code — the official collection of all Ohio state laws." },
  { term: "Venue Statement", definition: "The part of a notarial certificate that states where (state and county) the notarization happened." },
  { term: "Credible Witness", definition: "A trusted person who can vouch for the identity of the signer when they don't have proper ID." },
  { term: "Journal Entry", definition: "A record the notary keeps of every notarization they perform, required by law in many states." },
  { term: "Satisfactory Evidence", definition: "Proof (like a valid ID) that convinces the notary that you are who you claim to be." },
  { term: "Closing", definition: "The final step in a real estate deal where all documents are signed and the property officially changes hands." },
  { term: "Signing Agent", definition: "A notary who specializes in handling the paperwork for real estate loan closings." },
  { term: "E-Notarization", definition: "Notarizing electronic documents in person using digital signatures and seals." },
];

/** Build a case-insensitive regex matching all glossary terms (whole-word only) */
export function buildGlossaryRegex(): RegExp {
  const escaped = legalGlossary.map(g => g.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
}

/** Look up a term (case-insensitive) */
export function findDefinition(term: string): string | undefined {
  const lower = term.toLowerCase();
  return legalGlossary.find(g => g.term.toLowerCase() === lower)?.definition;
}
