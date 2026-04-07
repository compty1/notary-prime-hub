import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Email Templates are now centrally managed in Email Management → Automated Emails.
 * This tab redirects there.
 */
export default function EmailTemplatesTab() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardContent className="py-12 text-center space-y-4">
          <Mail className="h-10 w-10 mx-auto text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold">Email Templates Moved</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              All email templates — master branding, global templates, and per-service overrides — are now managed centrally in <strong>Email Management → Automated Emails</strong>.
            </p>
          </div>
          <Button onClick={() => navigate("/admin/email-management")}>
            <Mail className="mr-2 h-4 w-4" /> Go to Email Management
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
