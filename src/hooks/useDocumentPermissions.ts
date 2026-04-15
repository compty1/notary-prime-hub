/**
 * P4-002: RBAC for DocuDex documents
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type DocPermission = "owner" | "editor" | "commenter" | "viewer";

export interface DocShare {
  id: string;
  document_id: string;
  shared_with_email: string;
  permission: DocPermission;
  accepted_at: string | null;
  created_at: string;
}

export function useDocumentPermissions(documentId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shares, setShares] = useState<DocShare[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPermission, setCurrentPermission] = useState<DocPermission>("viewer");

  const fetchShares = useCallback(async () => {
    if (!documentId) return;
    setLoading(true);
    const { data } = await supabase
      .from("docudex_shares")
      .select("*")
      .eq("document_id", documentId);

    if (data) setShares(data as DocShare[]);

    // Check if current user is owner
    const { data: doc } = await supabase
      .from("docudex_documents")
      .select("user_id")
      .eq("id", documentId)
      .single();

    if (doc?.user_id === user?.id) {
      setCurrentPermission("owner");
    } else {
      const userShare = data?.find(s => s.shared_with_email === user?.email);
      setCurrentPermission((userShare?.permission as DocPermission) || "viewer");
    }

    setLoading(false);
  }, [documentId, user]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  const shareDocument = useCallback(async (email: string, permission: DocPermission) => {
    if (!documentId) return;
    const { error } = await supabase.from("docudex_shares").insert({
      document_id: documentId,
      shared_with_email: email,
      permission,
    });

    if (error) {
      toast({ title: "Share failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Document shared", description: `Shared with ${email} as ${permission}.` });
      fetchShares();
    }
  }, [documentId, toast, fetchShares]);

  const revokeAccess = useCallback(async (shareId: string) => {
    await supabase.from("docudex_shares").delete().eq("id", shareId);
    fetchShares();
  }, [fetchShares]);

  const canEdit = currentPermission === "owner" || currentPermission === "editor";
  const canComment = canEdit || currentPermission === "commenter";

  return { shares, loading, currentPermission, canEdit, canComment, shareDocument, revokeAccess };
}
