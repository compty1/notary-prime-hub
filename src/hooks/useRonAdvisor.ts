import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { analyzeScenario, analyzeSimple, type AdvisorInput, type SimpleInput, type AdvisorResult } from "@/lib/ronLegalityEngine";
import { toast } from "sonner";

export function useRonAdvisor() {
  const [result, setResult] = useState<AdvisorResult | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  const analyze = (input: AdvisorInput) => {
    const r = analyzeScenario(input);
    setResult(r);
    setExplanation(null);
    return r;
  };

  const analyzeQuick = (input: SimpleInput) => {
    const r = analyzeSimple(input);
    setResult(r);
    setExplanation(null);
    return r;
  };

  const getExplanation = async (scenario: AdvisorInput | SimpleInput, analysisResult: AdvisorResult) => {
    setLoadingExplanation(true);
    try {
      const { data, error } = await supabase.functions.invoke("ron-advisor", {
        body: { scenario, result: analysisResult },
      });

      if (error) {
        console.error("RON advisor error:", error);
        toast.error("Could not generate AI explanation. The analysis results above are still accurate.");
        return;
      }

      if (data?.explanation) {
        setExplanation(data.explanation);
      }
    } catch (err) {
      console.error("RON advisor error:", err);
      toast.error("AI explanation unavailable. The analysis results above are still accurate.");
    } finally {
      setLoadingExplanation(false);
    }
  };

  const reset = () => {
    setResult(null);
    setExplanation(null);
    setLoading(false);
    setLoadingExplanation(false);
  };

  return { result, explanation, loading, loadingExplanation, analyze, analyzeQuick, getExplanation, reset };
}
