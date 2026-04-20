import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { motion } from "framer-motion";
import { Search, Sparkles, Star } from "lucide-react";
import {
  AI_TOOLS, TOOL_CATEGORIES, CATEGORY_ICONS,
  type ToolCategory,
} from "@/lib/aiToolsRegistry";

interface ToolCatalogProps {
  onSelect: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeCategory: ToolCategory | "all";
  setActiveCategory: (c: ToolCategory | "all") => void;
  favorites: {
    isFavorite: (id: string) => boolean;
    toggleFavorite: (id: string) => void;
    favorites: string[];
  };
}

export function ToolCatalog({
  onSelect,
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  favorites,
}: ToolCatalogProps) {
  const filtered = AI_TOOLS.filter((t) => {
    const matchCat = activeCategory === "all" || t.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const grouped = TOOL_CATEGORIES.map((cat) => ({
    category: cat,
    tools: filtered.filter((t) => t.category === cat),
  })).filter((g) => g.tools.length > 0);

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-card py-16">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-3">
            <Sparkles className="mr-1 h-3 w-3" /> {AI_TOOLS.length}+ AI-Powered Tools
          </Badge>
          <h1 className="mb-4 font-sans text-4xl font-bold text-foreground md:text-5xl">
            AI Tools Hub
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Professional document generators, analyzers, and strategic tools — powered by AI
            with industry-standard formatting.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center" role="search" aria-label="Search AI tools">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={activeCategory === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setActiveCategory("all")}
            >
              All ({AI_TOOLS.length})
            </Badge>
            {favorites.favorites.length > 0 && (
              <Badge
                variant="outline"
                className="cursor-pointer gap-1 border-warning/50 text-warning"
                onClick={() => setSearchQuery("")}
              >
                <Star className="h-3 w-3 fill-yellow-500" /> Favorites ({favorites.favorites.length})
              </Badge>
            )}
            {TOOL_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              const count = AI_TOOLS.filter((t) => t.category === cat).length;
              return (
                <Badge
                  key={cat}
                  variant={activeCategory === cat ? "default" : "outline"}
                  className="cursor-pointer gap-1"
                  onClick={() => setActiveCategory(cat)}
                >
                  <Icon className="h-3 w-3" /> {cat.split(" ")[0]} ({count})
                </Badge>
              );
            })}
          </div>
        </div>

        {grouped.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p>No tools match your search.</p>
            <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {grouped.map((group) => (
              <section key={group.category}>
                <div className="mb-4 flex items-center gap-2">
                  {(() => {
                    const CatIcon = CATEGORY_ICONS[group.category];
                    return <CatIcon className="h-5 w-5 text-primary" />;
                  })()}
                  <h2 className="text-xl font-bold text-foreground">{group.category}</h2>
                  <Badge variant="secondary" className="text-xs">{group.tools.length}</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {group.tools.map((tool, i) => (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <Card
                        className="group h-full cursor-pointer hover:border-primary/30 transition-colors relative"
                        onClick={() => onSelect(tool.id)}
                      >
                        <button
                          className="absolute top-3 right-3 z-10 p-1 rounded-full hover:bg-muted transition-colors"
                          onClick={(e) => { e.stopPropagation(); favorites.toggleFavorite(tool.id); }}
                          aria-label={favorites.isFavorite(tool.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Star className={`h-4 w-4 ${favorites.isFavorite(tool.id) ? "fill-yellow-500 text-warning" : "text-muted-foreground"}`} />
                        </button>
                        <CardContent className="flex h-full flex-col p-5">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                            <tool.icon className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="mb-1 text-sm font-semibold text-foreground">
                            {tool.title}
                          </h3>
                          <p className="mb-3 flex-1 text-xs text-muted-foreground leading-relaxed">
                            {tool.description}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                          >
                            Try it <Sparkles className="ml-1 h-3 w-3" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
