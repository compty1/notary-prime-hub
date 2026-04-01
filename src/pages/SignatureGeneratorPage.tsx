import { usePageTitle } from "@/lib/usePageTitle";
import { PageShell } from "@/components/PageShell";
import SignatureGenerator from "@/components/SignatureGenerator";

export default function SignatureGeneratorPage() {
  usePageTitle("Signature Generator");

  return (
    <PageShell>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Professional Signature Generator</h1>
          <p className="text-muted-foreground mt-2">
            Create a professional digital signature for your documents. Type or draw your signature, customize the style, and save it for future use.
          </p>
        </div>
        <SignatureGenerator />
      </div>
    </PageShell>
  );
}
