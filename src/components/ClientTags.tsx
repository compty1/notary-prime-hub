/**
 * SVC-139: Client tags display component
 * Renders auto-generated CRM tags for a client.
 */
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { getClientTags, TAG_COLORS, type ClientTag } from "@/lib/crmAutoTagging";

interface ClientTagsProps {
  clientId: string;
  className?: string;
}

const TAG_LABELS: Record<ClientTag, string> = {
  frequent: "Frequent",
  new: "New Client",
  vip: "VIP",
  ron_user: "RON User",
  mobile_notary: "Mobile",
  business: "Business",
  loan_signing: "Loan Signing",
  apostille: "Apostille",
  at_risk: "At Risk",
};

export function ClientTags({ clientId, className }: ClientTagsProps) {
  const { data: tags = [] } = useQuery({
    queryKey: ["client-tags", clientId],
    queryFn: () => getClientTags(clientId),
    staleTime: 10 * 60 * 1000,
  });

  if (tags.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className || ""}`}>
      {tags.map(tag => (
        <Badge key={tag} variant="outline" className={`text-[10px] px-1.5 py-0 ${TAG_COLORS[tag]}`}>
          {TAG_LABELS[tag]}
        </Badge>
      ))}
    </div>
  );
}
