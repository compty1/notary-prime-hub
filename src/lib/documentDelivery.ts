/**
 * Document delivery helpers.
 * Handles secure document downloads and delivery notifications.
 */
import { supabase } from "@/integrations/supabase/client";

/**
 * Generate a signed URL for secure document download.
 * URLs expire after the specified duration.
 */
export async function getSecureDocumentUrl(
  filePath: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(filePath, expiresInSeconds);

    if (error) throw error;
    return data.signedUrl;
  } catch (err) {
    console.error("Failed to generate signed URL:", err);
    return null;
  }
}

/**
 * Send document delivery notification to client.
 */
export async function notifyDocumentReady(params: {
  appointmentId: string;
  documentId: string;
  clientEmail: string;
  documentName: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke("send-appointment-emails", {
      body: {
        appointment_id: params.appointmentId,
        email_type: "document_ready",
        extra: {
          document_name: params.documentName,
          document_id: params.documentId,
        },
      },
    });

    if (error) throw error;

    // Log the notification
    await supabase.from("appointment_emails").insert({
      appointment_id: params.appointmentId,
      email_type: "document_ready",
    });

    return true;
  } catch (err) {
    console.error("Document notification failed:", err);
    return false;
  }
}

/**
 * Batch download multiple documents as individual signed URLs.
 */
export async function getDocumentBatchUrls(
  filePaths: string[],
  expiresInSeconds = 3600
): Promise<Array<{ path: string; url: string | null }>> {
  const results = await Promise.all(
    filePaths.map(async (path) => ({
      path,
      url: await getSecureDocumentUrl(path, expiresInSeconds),
    }))
  );
  return results;
}

/**
 * Check document hash integrity.
 */
export async function verifyDocumentHash(
  documentId: string,
  expectedHash: string
): Promise<boolean> {
  const { data } = await supabase
    .from("documents")
    .select("document_hash")
    .eq("id", documentId)
    .single();

  if (!data?.document_hash) return false;
  return data.document_hash === expectedHash;
}
