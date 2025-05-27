import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderModal } from "@/components/order-modal";
import { formatCurrency, formatTime, getStatusColor, getCategoryIcon } from "@/lib/utils";
import { Plus, Search, TrendingUp, Clock, AlertTriangle, DollarSign } from "lucide-react";
import type { Order, Item, DashboardStats } from "@shared/schema";

export default function Dashboard() {
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: recentOrders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    select: (data) => data.slice(0, 5), // Get only the 5 most recent orders
  });

  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const { data: lowStockItems = [] } = useQuery<Item[]>({
    queryKey: ["/api/items/low-stock"],
  });

  const popularItems = items
    .filter(item => item.category === "tea" || item.name.toLowerCase().includes("samosa"))
    .slice(0, 3);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex-1 overflow-auto p-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">Today, {currentDate}</p>
        </div>
        
        <Button 
          onClick={() => setOrderModalOpen(true)}
          className="bg-tea-green text-white hover:bg-tea-light"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats ? formatCurrency(stats.todaySales) : "₹0"}
                </p>
                <p className="text-sm text-tea-green font-medium">Live updates</p>
              </div>
              <div className="w-12 h-12 bg-tea-green bg-opacity-10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-tea-green" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Orders Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.ordersToday ?? 0}
                </p>
                <p className="text-sm text-tea-green font-medium">Active orders</p>
              </div>
              <div className="w-12 h-12 bg-purple bg-opacity-10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.pendingOrders ?? 0}
                </p>
                <p className="text-sm text-orange font-medium">
                  {(stats?.pendingOrders ?? 0) > 0 ? "Needs attention" : "All clear"}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange bg-opacity-10 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.lowStockItems ?? 0}
                </p>
                <p className="text-sm text-red-500 font-medium">
                  {(stats?.lowStockItems ?? 0) > 0 ? "Restock needed" : "Stock OK"}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Button variant="ghost" className="text-tea-green hover:text-tea-light">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No orders yet today</p>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">#{order.id}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900">
                              {order.customerName || "Walk-in Customer"}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900">
                              {formatCurrency(parseFloat(order.totalAmount))}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTime(order.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Quick Order Section */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search items..."
                  className="pl-10"
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">
                  {searchTerm ? "Search Results" : "Popular Items"}
                </p>
                {(searchTerm ? filteredItems.slice(0, 3) : popularItems).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setOrderModalOpen(true)}
                    className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-tea-green hover:bg-tea-green hover:bg-opacity-5 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-tea-green bg-opacity-10 rounded-lg flex items-center justify-center">
                        <i className={`${getCategoryIcon(item.category)} text-tea-green text-sm`}></i>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(parseFloat(item.price))}</p>
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-tea-green" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          {lowStockItems.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange" />
                  <CardTitle>Low Stock Alert</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-red-600">
                          Only {item.stock} {item.unit}(s) left
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
                      >
                        Restock
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <OrderModal open={orderModalOpen} onOpenChange={setOrderModalOpen} />
    </div>
  );
}
