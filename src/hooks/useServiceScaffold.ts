/**
 * Sprint 1: Unified service scaffold hooks.
 * Provides CRUD for service_requests + cross-sell queries + status management.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface ServiceRequest {
  id: string;
  client_id: string;
  service_name: string;
  status: string;
  intake_data: Record<string, any> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  priority: string | null;
  due_date: string | null;
  reference_number: string | null;
  deliverable_url: string | null;
  client_visible_status: string | null;
}

export interface CrossSellRule {
  id: string;
  trigger_service_type: string;
  recommended_service_type: string;
  relevance_score: number;
  display_message: string | null;
}

export interface TravelZone {
  id: string;
  zone_name: string;
  min_miles: number;
  max_miles: number | null;
  fee: number;
  description: string | null;
}

// --- useServiceRequest: CRUD for a specific service type ---
export function useServiceRequest(serviceSlug: string) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("service_requests")
      .select("*")
      .eq("client_id", user.id)
      .eq("service_name", serviceSlug)
      .order("created_at", { ascending: false });
    setRequests((data as ServiceRequest[]) ?? []);
    setLoading(false);
  }, [user, serviceSlug]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const submitRequest = async (intakeData: Record<string, any>, notes?: string) => {
    if (!user) {
      toast({ title: "Please sign in", variant: "destructive" });
      return null;
    }
    const { data, error } = await supabase.from("service_requests").insert({
      client_id: user.id,
      service_name: serviceSlug,
      intake_data: intakeData,
      notes: notes || null,
      status: "pending",
    }).select().single();

    if (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
      return null;
    }
    toast({ title: "Request submitted", description: `Reference: ${data.reference_number}` });
    await fetchRequests();
    return data;
  };

  return { requests, loading, submitRequest, refetch: fetchRequests };
}

// --- useAdminServiceRequests: Admin CRUD for a service type ---
export function useAdminServiceRequests(serviceType?: string) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("service_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (serviceType) query = query.eq("service_name", serviceType);
    const { data } = await query;
    setRequests((data as ServiceRequest[]) ?? []);
    setLoading(false);
  }, [serviceType]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("service_requests").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return false;
    }
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    return true;
  };

  return { requests, loading, updateStatus, refetch: fetchAll };
}

// --- useCrossSell: Get recommendations after completing a service ---
export function useCrossSell(completedServiceType: string) {
  const [recommendations, setRecommendations] = useState<CrossSellRule[]>([]);

  useEffect(() => {
    if (!completedServiceType) return;
    supabase
      .from("cross_sell_rules")
      .select("*")
      .eq("trigger_service_type", completedServiceType)
      .eq("is_active", true)
      .order("relevance_score", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setRecommendations((data as CrossSellRule[]) ?? []);
      });
  }, [completedServiceType]);

  return recommendations;
}

// --- useTravelZones: Get travel zone pricing ---
export function useTravelZones() {
  const [zones, setZones] = useState<TravelZone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("travel_zones")
      .select("*")
      .eq("is_active", true)
      .order("min_miles")
      .then(({ data }) => {
        setZones((data as TravelZone[]) ?? []);
        setLoading(false);
      });
  }, []);

  const getFeeForDistance = (miles: number): number => {
    const zone = zones.find(z =>
      miles >= z.min_miles && (z.max_miles === null || miles <= z.max_miles)
    );
    return zone?.fee ?? 0;
  };

  return { zones, loading, getFeeForDistance };
}
