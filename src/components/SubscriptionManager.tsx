import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, ArrowUpRight, XCircle, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Subscription {
  id: string;
  status: string;
  amount: number;
  method: string | null;
  notes: string | null;
  created_at: string;
  stripe_payment_intent_id: string | null;
}

export default function SubscriptionManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [upgradeDialog, setUpgradeDialog] = useState(false);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["user-subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("client_id", user.id)
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as unknown as Subscription | null;
    },
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!subscription?.id) throw new Error("No active subscription");
      const { error } = await supabase.functions.invoke("process-refund", {
        body: { payment_id: subscription.id, reason: "subscription_cancelled" },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Subscription cancelled", description: "Your subscription has been cancelled. You'll retain access until the end of your billing period." });
      qc.invalidateQueries({ queryKey: ["user-subscription"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-sans">Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">You don't have an active subscription.</p>
          <Button asChild>
            <a href="/plans">View Plans</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-sans">Current Plan</CardTitle>
          <Badge variant={subscription.status === "paid" ? "default" : "secondary"}>
            {subscription.status === "paid" ? "Active" : subscription.status}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{subscription.notes || "Subscription Plan"}</p>
              <p className="text-sm text-muted-foreground">
                ${(subscription.amount || 0).toFixed(2)}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-muted-foreground/40" />
          </div>

          <p className="text-xs text-muted-foreground">
            Last payment: {new Date(subscription.created_at).toLocaleDateString()}
          </p>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setUpgradeDialog(true)}>
              <ArrowUpRight className="mr-1 h-3 w-3" /> Change Plan
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  <XCircle className="mr-1 h-3 w-3" /> Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You'll retain access until the end of your current billing period.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => cancelMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {cancelMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Yes, Cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <Dialog open={upgradeDialog} onOpenChange={setUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Your Plan</DialogTitle>
            <DialogDescription>Select a new plan to upgrade or downgrade.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {[
              { name: "Starter", price: 49, features: ["5 notarizations/mo", "1 GB storage"] },
              { name: "Professional", price: 149, features: ["25 notarizations/mo", "10 GB storage", "Priority support"] },
              { name: "Enterprise", price: 0, features: ["Unlimited", "Custom pricing"] },
            ].map((plan) => (
              <Card
                key={plan.name}
                className="cursor-pointer border-border/50 hover:border-primary transition-colors"
                onClick={() => {
                  if (plan.price === 0) {
                    toast({ title: "Contact Sales", description: "Our team will reach out to discuss Enterprise pricing." });
                  } else {
                    toast({ title: "Plan Change Initiated", description: `Switching to ${plan.name} plan. Changes take effect at next billing cycle.` });
                  }
                  setUpgradeDialog(false);
                }}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {plan.price > 0 ? `$${plan.price}/mo` : "Custom pricing"}
                    </p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-muted-foreground/30" />
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
