/**
 * Layer 3: Reusable product callout card for embedding in content/resource pages
 */
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

interface ProductCalloutCardProps {
  title: string;
  description: string;
  price?: string;
  linkTo: string;
  variant?: "default" | "compact";
}

export function ProductCalloutCard({ title, description, price, linkTo, variant = "default" }: ProductCalloutCardProps) {
  if (variant === "compact") {
    return (
      <Link to={linkTo} className="block">
        <div className="flex items-center gap-3 p-3 rounded-xl border bg-primary/5 hover:bg-primary/10 transition-colors">
          <ShoppingCart className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{title}</p>
            {price && <p className="text-xs text-primary font-medium">From {price}</p>}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Card className="rounded-[24px] bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
      <CardContent className="flex items-center gap-4 py-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <ShoppingCart className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Link to={linkTo}>
          <Button size="sm" className="rounded-full text-xs">{price || "View"}</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
