/**
 * SVC-437/463: Service filter bar with badges
 * Filters services by category, availability, and features.
 */
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X, Globe, Zap, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterTag {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

const FILTER_TAGS: FilterTag[] = [
  { id: "remote", label: "Remote Available", icon: <Globe className="h-3 w-3" /> },
  { id: "same-day", label: "Same-Day", icon: <Zap className="h-3 w-3" /> },
  { id: "24hr", label: "24hr Turnaround", icon: <Clock className="h-3 w-3" /> },
];

interface ServiceFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeTags: string[];
  onTagToggle: (tag: string) => void;
  onClear: () => void;
  categories?: string[];
  activeCategory?: string;
  onCategoryChange?: (cat: string) => void;
}

export function ServiceFilterBar({
  searchQuery, onSearchChange, activeTags, onTagToggle, onClear,
  categories = [], activeCategory, onCategoryChange,
}: ServiceFilterBarProps) {
  const hasFilters = searchQuery || activeTags.length > 0 || activeCategory;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search services..."
            className="pl-9"
          />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="mr-1 h-3 w-3" /> Clear
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <Badge
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onCategoryChange?.(activeCategory === cat ? "" : cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_TAGS.map(tag => (
          <Badge
            key={tag.id}
            variant={activeTags.includes(tag.id) ? "default" : "outline"}
            className={cn("cursor-pointer gap-1", activeTags.includes(tag.id) && "bg-primary text-primary-foreground")}
            onClick={() => onTagToggle(tag.id)}
          >
            {tag.icon} {tag.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
