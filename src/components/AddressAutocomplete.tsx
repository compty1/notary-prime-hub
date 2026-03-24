import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2, Building2, Navigation } from "lucide-react";

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
    suburb?: string;
    county?: string;
  };
  type?: string;
  class?: string;
  name?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: {
    address: string;
    city: string;
    state: string;
    zip: string;
    fullAddress: string;
    name?: string;
  }) => void;
  placeholder?: string;
  userLat?: number | null;
  userLon?: number | null;
}

const stateAbbreviations: Record<string, string> = {
  Ohio: "OH", Indiana: "IN", Kentucky: "KY", "West Virginia": "WV",
  Pennsylvania: "PA", Michigan: "MI", Illinois: "IL", Virginia: "VA",
  "New York": "NY", California: "CA", Texas: "TX", Florida: "FL",
  Georgia: "GA", "North Carolina": "NC", "South Carolina": "SC",
  Tennessee: "TN", Alabama: "AL", Missouri: "MO", Wisconsin: "WI",
  Minnesota: "MN", Iowa: "IA", Colorado: "CO", Arizona: "AZ",
  Maryland: "MD", Massachusetts: "MA", "New Jersey": "NJ",
  Washington: "WA", Oregon: "OR", Connecticut: "CT",
};

function getStateAbbr(state: string): string {
  return stateAbbreviations[state] || state?.substring(0, 2).toUpperCase() || "";
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Search address or place (e.g. Walmart, Starbucks...)",
  userLat,
  userLon,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        // Build Nominatim search URL with viewbox bias near Columbus, OH
        const params = new URLSearchParams({
          q: query,
          format: "json",
          addressdetails: "1",
          limit: "6",
          countrycodes: "us",
          "accept-language": "en",
        });

        // Bias results near user location or Columbus, OH
        const lat = userLat ?? 39.9612;
        const lon = userLon ?? -82.9988;
        // viewbox: ~50 mile radius
        params.set("viewbox", `${lon - 0.8},${lat + 0.6},${lon + 0.8},${lat - 0.6}`);
        params.set("bounded", "0"); // Don't strictly bound, just bias

        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          {
            headers: {
              "User-Agent": "Notar/1.0",
            },
          }
        );
        const data: AddressSuggestion[] = await resp.json();
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch {
        setSuggestions([]);
      }
      setLoading(false);
    },
    [userLat, userLon]
  );

  const handleChange = (val: string) => {
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  const handleSelect = (s: AddressSuggestion) => {
    const addr = s.address;
    const streetParts = [addr.house_number, addr.road].filter(Boolean).join(" ");
    const city = addr.city || addr.town || addr.village || addr.suburb || "";
    const state = addr.state ? getStateAbbr(addr.state) : "";
    const zip = addr.postcode?.split("-")[0] || "";

    // Build a clean display name
    const placeName = s.name && s.name !== streetParts && s.class !== "highway" ? s.name : undefined;
    const displayStreet = placeName ? `${placeName}, ${streetParts}` : streetParts;
    const fullAddress = [displayStreet, city, `${state} ${zip}`].filter(Boolean).join(", ");

    onSelect({
      address: displayStreet || s.display_name.split(",")[0],
      city,
      state,
      zip,
      fullAddress,
      name: placeName,
    });

    onChange(displayStreet || s.display_name.split(",")[0]);
    setOpen(false);
  };

  const getIcon = (s: AddressSuggestion) => {
    if (s.class === "shop" || s.class === "amenity" || s.class === "leisure" || s.class === "office") {
      return <Building2 className="h-4 w-4 flex-shrink-0 text-accent" />;
    }
    return <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />;
  };

  const formatSuggestion = (s: AddressSuggestion) => {
    const addr = s.address;
    const placeName = s.name && s.class !== "highway" ? s.name : null;
    const street = [addr.house_number, addr.road].filter(Boolean).join(" ");
    const city = addr.city || addr.town || addr.village || "";
    const state = addr.state ? getStateAbbr(addr.state) : "";

    return {
      primary: placeName || street || s.display_name.split(",")[0],
      secondary: [placeName ? street : null, city, state].filter(Boolean).join(", "),
    };
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-8"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
          {suggestions.map((s, i) => {
            const { primary, secondary } = formatSuggestion(s);
            return (
              <button
                key={i}
                type="button"
                className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/10 first:rounded-t-lg last:rounded-b-lg"
                onClick={() => handleSelect(s)}
              >
                {getIcon(s)}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{primary}</p>
                  {secondary && (
                    <p className="truncate text-xs text-muted-foreground">{secondary}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
