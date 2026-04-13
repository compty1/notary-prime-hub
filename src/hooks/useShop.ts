/**
 * Shop hooks for fetching packages, addons, and managing cart
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ShopPackage {
  id: string;
  tier_name: string;
  slug: string;
  tagline: string | null;
  physical_price: number | null;
  digital_price: number | null;
  complete_price: number | null;
  badge: string | null;
  persona_match: string | null;
  features: string[];
  sort_order: number;
  is_active: boolean;
}

export interface ShopAddon {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string | null;
  compatible_tiers: string[];
  is_active: boolean;
  sku: string | null;
}

export interface CartItem {
  id: string;
  user_id: string;
  item_type: "package" | "addon";
  item_id: string;
  variation: string;
  quantity: number;
  created_at: string;
}

export function useShopPackages() {
  return useQuery({
    queryKey: ["shop-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_packages")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : [],
      })) as ShopPackage[];
    },
  });
}

export function useShopAddons(category?: string) {
  return useQuery({
    queryKey: ["shop-addons", category],
    queryFn: async () => {
      let q = supabase.from("shop_addons").select("*").order("name");
      if (category && category !== "all") {
        q = q.eq("category", category);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as ShopAddon[];
    },
  });
}

export function useCart() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const cartQuery = useQuery({
    queryKey: ["shop-cart", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("shop_cart_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at");
      if (error) throw error;
      return (data || []) as CartItem[];
    },
    enabled: !!user,
  });

  const addToCart = useMutation({
    mutationFn: async (item: { item_type: "package" | "addon"; item_id: string; variation?: string; quantity?: number }) => {
      if (!user) throw new Error("Must be signed in");
      const { error } = await supabase.from("shop_cart_items").insert({
        user_id: user.id,
        item_type: item.item_type,
        item_id: item.item_id,
        variation: item.variation || "complete",
        quantity: item.quantity || 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shop-cart"] });
      toast.success("Added to cart!");
    },
    onError: () => toast.error("Failed to add to cart"),
  });

  const removeFromCart = useMutation({
    mutationFn: async (cartItemId: string) => {
      const { error } = await supabase.from("shop_cart_items").delete().eq("id", cartItemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shop-cart"] });
      toast.success("Removed from cart");
    },
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from("shop_cart_items").delete().eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shop-cart"] }),
  });

  return { cart: cartQuery.data || [], isLoading: cartQuery.isLoading, addToCart, removeFromCart, clearCart };
}
