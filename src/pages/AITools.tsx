import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { PageShell } from "@/components/PageShell";
import { getToolById, type ToolCategory } from "@/lib/aiToolsRegistry";
import { useFavoriteTools, useToolHistory } from "@/hooks/useFavoriteTools";
import { ToolCatalog } from "@/components/ai-tools/ToolCatalog";
import { ToolRunner } from "@/components/ai-tools/ToolRunner";

export default function AITools() {
  usePageMeta({
    title: "AI Tools Hub — 50+ Professional Document & Strategy Tools",
    description: "Generate contracts, proposals, reports, and more with AI. Industry-standard formatting, rich text output, and instant results.",
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const toolParam = searchParams.get("tool");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">("all");
  const favoritesHook = useFavoriteTools();
  const { recordUsage } = useToolHistory();

  const selectedTool = toolParam ? getToolById(toolParam) : undefined;

  const handleSelectTool = (id: string) => {
    recordUsage(id);
    setSearchParams({ tool: id }, { replace: true });
  };

  const handleBack = () => {
    setSearchParams({}, { replace: true });
  };

  return (
    <PageShell>
      {selectedTool ? (
        <ToolRunner tool={selectedTool} onBack={handleBack} />
      ) : (
        <ToolCatalog
          onSelect={handleSelectTool}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          favorites={favoritesHook}
        />
      )}
    </PageShell>
  );
}
