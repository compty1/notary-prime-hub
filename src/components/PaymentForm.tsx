import { useState, useEffect } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

let stripePromise: Promise<Stripe | null> | null = null;
let stripeLoadFailed = false;

const getStripePromise = async () => {
  if (stripeLoadFailed) stripePromise = null; // retry on failure
  if (!stripePromise) {
    stripePromise = (async () => {
      try {
        const { data } = await supabase.functions.invoke("get-stripe-config");
        if (data?.publishableKey) {
          stripeLoadFailed = false;
          return loadStripe(data.publishableKey);
        }
        stripeLoadFailed = true;
      } catch (e) {
        console.error("Failed to load Stripe config:", e);
        stripeLoadFailed = true;
      }
      return null;
    })();
  }
  return stripePromise;
};

function CheckoutForm({ amount, onSuccess, onCancel }: { amount: number; onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/portal` },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message || "Payment failed");
      setProcessing(false);
    } else {
      setSucceeded(true);
      toast({ title: "Payment successful!", description: `$${amount.toFixed(2)} has been processed.` });
      onSuccess();
    }
  };

  if (succeeded) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <CheckCircle className="h-12 w-12 text-primary" />
        <p className="text-lg font-medium text-foreground">Payment Successful</p>
        <p className="text-sm text-muted-foreground">${amount.toFixed(2)} has been charged.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={!stripe || processing} className="flex-1">
          {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
          Pay ${amount.toFixed(2)}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={processing}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

interface PaymentFormProps {
  appointmentId?: string;
  defaultAmount?: number;
  description?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PaymentForm({ appointmentId, defaultAmount, description, onSuccess, onCancel }: PaymentFormProps) {
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState(defaultAmount || 0);
  const [loading, setLoading] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    getStripePromise().then((s) => {
      setStripeInstance(s);
      setStripeLoading(false);
    });
  }, []);

  const createPaymentIntent = async () => {
    if (amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error: fnError } = await supabase.functions.invoke("create-payment-intent", {
        body: { amount, appointmentId, description },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setClientSecret(data.clientSecret);
    } catch (e: any) {
      setError(e.message || "Failed to initialize payment");
      toast({ title: "Payment error", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  if (stripeLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!stripeInstance) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-8 text-center">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Online payments are not configured yet. Please contact us to arrange payment.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (clientSecret) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" /> Complete Payment
          </CardTitle>
          <CardDescription>Amount: ${amount.toFixed(2)}</CardDescription>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripeInstance} options={{ clientSecret, appearance: { theme: document.documentElement.classList.contains('dark') ? 'night' : 'stripe' } }}>
            <CheckoutForm amount={amount} onSuccess={() => onSuccess?.()} onCancel={() => { setClientSecret(null); onCancel?.(); }} />
          </Elements>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5" /> Make a Payment
        </CardTitle>
        <CardDescription>Enter the amount and proceed to secure checkout</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="payment-amount">Amount ($)</Label>
          <Input
            id="payment-amount"
            type="number"
            min="0.50"
            max="99999"
            step="0.01"
            value={amount || ""}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setAmount(val > 0 ? val : 0);
            }}
            placeholder="0.00"
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <Button onClick={createPaymentIntent} disabled={loading || amount <= 0} className="flex-1">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
            Proceed to Pay
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
