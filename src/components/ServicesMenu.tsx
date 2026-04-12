/**
 * SVC-002: Dynamic services navigation menu built from service registry
 */
import { Link } from "react-router-dom";
import {
  NavigationMenu, NavigationMenuContent, NavigationMenuItem,
  NavigationMenuList, NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { SERVICE_REGISTRY, getRegistryCategories } from "@/lib/serviceRegistry";
import { CATEGORY_LABELS } from "@/lib/serviceConstants";

export function ServicesMenu() {
  const categories = getRegistryCategories();

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent">Services</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[500px] gap-3 p-4 md:w-[600px] md:grid-cols-2">
              {categories.slice(0, 8).map(cat => {
                const label = CATEGORY_LABELS[cat]?.label || cat;
                const services = SERVICE_REGISTRY.filter(s => s.category === cat).slice(0, 4);
                return (
                  <div key={cat} className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">{label}</h4>
                    {services.map(svc => (
                      <Link
                        key={svc.id}
                        to={svc.path}
                        className="block rounded-md p-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        {svc.name}
                      </Link>
                    ))}
                  </div>
                );
              })}
              <div className="col-span-2 pt-2 border-t">
                <Link to="/services" className="text-sm font-medium text-primary hover:underline">
                  View All Services →
                </Link>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
