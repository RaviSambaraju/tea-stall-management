import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BillModal } from "@/components/bill-modal";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Search, Download, Calendar, TrendingUp, DollarSign } from "lucide-react";
import type { Order, OrderWithItems } from "@shared/schema";

export default function Billing() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("today");
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const filterOrdersByDate = (orders: Order[], filter: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case "today":
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= today && orderDate < tomorrow;
        });
      
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return orders.filter(order => new Date(order.createdAt) >= weekAgo);
      
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return orders.filter(order => new Date(order.createdAt) >= monthAgo);
      
      default:
        return orders;
    }
  };

  const filteredOrders = filterOrdersByDate(orders, dateFilter).filter(order => {
    const matchesSearch = 
      order.id.toString().includes(searchTerm) ||
      (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const completedOrders = filteredOrders.filter(order => order.status === "completed");
  
  const totalRevenue = completedOrders.reduce((sum, order) => 
    sum + parseFloat(order.totalAmount), 0
  );

  const averageOrderValue = completedOrders.length > 0 
    ? totalRevenue / completedOrders.length 
    : 0;

  const handleViewBill = async (orderId: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch order details");
      
      const orderWithItems: OrderWithItems = await response.json();
      setSelectedOrder(orderWithItems);
      setBillModalOpen(true);
    } catch (error) {
      console.error("Failed to load order details:", error);
    }
  };

  const handleExportData = () => {
    const csvContent = [
      ["Order ID", "Customer", "Total", "Status", "Date", "Time"].join(","),
      ...filteredOrders.map(order => [
        order.id,
        order.customerName || "Walk-in Customer",
        order.totalAmount,
        order.status,
        formatDate(order.createdAt),
        formatTime(order.createdAt)
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${dateFilter}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="flex-1 overflow-auto p-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Billing & Reports</h2>
          <p className="text-sm text-gray-500">View sales reports and generate bills</p>
        </div>
        
        <Button 
          onClick={handleExportData}
          variant="outline"
          className="text-tea-green border-tea-green hover:bg-tea-green hover:text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalRevenue)}
                </p>
                <p className="text-sm text-tea-green font-medium">
                  {completedOrders.length} completed orders
                </p>
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
                <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(averageOrderValue)}
                </p>
                <p className="text-sm text-purple font-medium">Per order</p>
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
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{filteredOrders.length}</p>
                <p className="text-sm text-orange font-medium">
                  {dateFilter === "today" ? "Today" : `This ${dateFilter}`}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange bg-opacity-10 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order ID or customer name..."
            className="pl-10"
          />
        </div>
        
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales History ({filteredOrders.length} orders)</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No sales found for the selected period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
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
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                          order.status === "completed" 
                            ? "bg-green-100 text-green-800" 
                            : order.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(order.createdAt)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewBill(order.id)}
                        >
                          View Bill
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <BillModal 
        open={billModalOpen} 
        onOpenChange={setBillModalOpen} 
        order={selectedOrder}
      />
    </div>
  );
}
