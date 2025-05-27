import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Coffee, BarChart3, ShoppingCart, Package, Receipt, TrendingUp } from "lucide-react";

const navigationItems = [
  { href: "/", icon: BarChart3, label: "Dashboard" },
  { href: "/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/inventory", icon: Package, label: "Inventory" },
  { href: "/billing", icon: Receipt, label: "Billing" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 hidden lg:block">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-tea-green rounded-lg flex items-center justify-center">
            <Coffee className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">TeaStall Pro</h1>
            <p className="text-sm text-gray-500">Inventory Management</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium cursor-pointer",
                  isActive
                    ? "bg-tea-green text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
