/**
 * Design Cart Bridge — connects design state to shop_cart_items with design_config
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { DesignConfig } from "./useDesignState";

interface AddDesignToCartParams {
  productType: string;
  designConfig: DesignConfig;
  quantity: number;
  unitPrice: number;
}

export function useDesignCart() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const addDesignToCart = useMutation({
    mutationFn: async ({ productType, designConfig, quantity }: AddDesignToCartParams) => {
      if (!user) throw new Error("Must be signed in to add to cart");

      const { error } = await supabase.from("shop_cart_items").insert({
        user_id: user.id,
        item_type: "addon" as const,
        item_id: productType,
        variation: "custom-design",
        quantity,
        design_config: designConfig as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shop-cart"] });
      toast.success("Custom design added to cart!");
    },
    onError: (err: Error) => {
      if (err.message.includes("signed in")) {
        toast.error("Please sign in to add items to your cart");
      } else {
        toast.error("Failed to add to cart");
      }
    },
  });

  return { addDesignToCart };
}
