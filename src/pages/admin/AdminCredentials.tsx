import { usePageMeta } from "@/hooks/usePageMeta";
import CredentialVault from "@/components/CredentialVault";

export default function AdminCredentials() {
  usePageMeta({ title: "Credential Vault", noIndex: true });
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Credential Vault</h1>
        <p className="text-muted-foreground text-sm">Store and manage usernames, passwords, and account details for external services.</p>
      </div>
      <CredentialVault />
    </div>
  );
}
