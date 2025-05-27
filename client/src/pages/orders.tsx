import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderModal } from "@/components/order-modal";
import { BillModal } from "@/components/bill-modal";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, formatTime, getStatusColor } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Eye, Clock, CheckCircle, XCircle } from "lucide-react";
import type { Order, OrderWithItems } from "@shared/schema";

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PUT", `/api/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Order status updated successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update order status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toString().includes(searchTerm) ||
      (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = (orderId: number, status: string) => {
    updateOrderStatusMutation.mutate({ id: orderId, status });
  };

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
      toast({
        title: "Failed to load order details",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "in-progress":
        return <Clock className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="flex-1 overflow-auto p-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
          <p className="text-sm text-gray-500">Track and manage all customer orders</p>
        </div>
        
        <Button 
          onClick={() => setOrderModalOpen(true)}
          className="bg-tea-green text-white hover:bg-tea-light"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Order
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {statusOptions.map((status) => {
          const count = orders.filter(order => order.status === status.value).length;
          return (
            <Card key={status.value}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{status.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${getStatusColor(status.value).replace('text-', 'bg-').replace('800', '100')}`}>
                    {getStatusIcon(status.value)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No orders found matching your criteria.</p>
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
                        <Select
                          value={order.status}
                          onValueChange={(status) => handleStatusUpdate(order.id, status)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                          <Eye className="h-4 w-4 mr-1" />
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

      <OrderModal open={orderModalOpen} onOpenChange={setOrderModalOpen} />
      <BillModal 
        open={billModalOpen} 
        onOpenChange={setBillModalOpen} 
        order={selectedOrder}
      />
    </div>
  );
}
