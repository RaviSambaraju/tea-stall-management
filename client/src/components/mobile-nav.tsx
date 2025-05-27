import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { BarChart3, ShoppingCart, Package, Receipt } from "lucide-react";

const mobileNavItems = [
  { href: "/", icon: BarChart3, label: "Dashboard" },
  { href: "/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/inventory", icon: Package, label: "Inventory" },
  { href: "/billing", icon: Receipt, label: "Billing" },
];

export function MobileNav() {
  const [location] = useLocation();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
      <div className="flex justify-around">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex flex-col items-center space-y-1 p-2 cursor-pointer",
                  isActive ? "text-tea-green" : "text-gray-400"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
