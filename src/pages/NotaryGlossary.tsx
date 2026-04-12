/**
 * SVC-469: Glossary of notary terms
 * Public-facing reference page for common notarization terminology.
 */
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const GLOSSARY: { term: string; definition: string; orc?: string }[] = [
  { term: "Acknowledgment", definition: "A notarial act where the signer personally appears before a notary and acknowledges that they voluntarily signed the document.", orc: "ORC §147.53" },
  { term: "Affidavit", definition: "A written statement of facts confirmed by oath or affirmation before a notary public." },
  { term: "Apostille", definition: "A certificate issued by the Ohio Secretary of State authenticating documents for international use under the Hague Convention." },
  { term: "Certificate of Notarial Act", definition: "The notary's written statement attached to or embedded in a document, certifying the notarial act performed.", orc: "ORC §147.542" },
  { term: "Commission", definition: "The authority granted by the state to an individual to perform notarial acts. Ohio commissions last 5 years.", orc: "ORC §147.03" },
  { term: "Copy Certification", definition: "A notarial act where a notary certifies that a copy of a document is a true and accurate reproduction of the original." },
  { term: "Credible Witness", definition: "A person who personally knows the signer and can vouch for their identity when the signer lacks proper ID." },
  { term: "E-Seal", definition: "An electronic version of the notary's official seal used in electronic and remote online notarizations." },
  { term: "Jurat", definition: "A notarial act in which the signer takes an oath or affirmation before the notary that the statements in a document are true.", orc: "ORC §147.53" },
  { term: "Journal Entry", definition: "A chronological record maintained by the notary of each notarial act performed, required by Ohio law.", orc: "ORC §147.141" },
  { term: "Knowledge-Based Authentication (KBA)", definition: "Identity verification method using questions derived from the signer's personal information databases. Ohio allows a maximum of 2 KBA attempts.", orc: "ORC §147.66" },
  { term: "Notarial Act", definition: "Any official act performed by a notary public including acknowledgments, jurats, oaths, affirmations, and copy certifications." },
  { term: "Notary Public", definition: "A person commissioned by the state to serve as an impartial witness to the signing of documents and administer oaths." },
  { term: "Oath", definition: "A solemn pledge to a supreme being that statements are true or that a person will perform certain duties faithfully." },
  { term: "Remote Online Notarization (RON)", definition: "A notarial act performed using audio-video communication technology where the signer and notary are in different locations.", orc: "ORC §147.66" },
  { term: "Signer", definition: "The individual whose signature is being notarized or who is taking an oath/affirmation before the notary." },
  { term: "Signature Witnessing", definition: "A notarial act where the notary witnesses the signing of a document by the signer." },
  { term: "Surety Bond", definition: "A bond required of notaries to protect the public from financial loss due to notary misconduct. Ohio requires a $10,000 bond.", orc: "ORC §147.04" },
  { term: "Venue", definition: "The location (state and county) where the notarial act is performed, stated at the top of the notary certificate." },
];

export default function NotaryGlossary() {
  const [search, setSearch] = useState("");
  const filtered = GLOSSARY.filter(
    g => g.term.toLowerCase().includes(search.toLowerCase()) || g.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Notary Glossary</h1>
        <p className="text-muted-foreground mb-6">Common terms and definitions used in notarization services.</p>

        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search terms..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="space-y-3">
          {filtered.map(g => (
            <Card key={g.term}>
              <CardContent className="py-4">
                <h3 className="font-semibold text-foreground">{g.term}</h3>
                <p className="text-sm text-muted-foreground mt-1">{g.definition}</p>
                {g.orc && (
                  <span className="inline-block mt-2 text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {g.orc}
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No terms match "{search}"</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
