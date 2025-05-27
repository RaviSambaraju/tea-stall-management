import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getCategoryIcon } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Minus, Search } from "lucide-react";
import type { Item, InsertOrder, InsertOrderItem } from "@shared/schema";

interface OrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OrderItemData {
  item: Item;
  quantity: number;
}

export function OrderModal({ open, onOpenChange }: OrderModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItemData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["/api/items"],
    enabled: open,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: { order: InsertOrder; items: InsertOrderItem[] }) => {
      return apiRequest("POST", "/api/orders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Order created successfully" });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to create order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredItems = items.filter((item: Item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToOrder = (item: Item) => {
    setOrderItems(prev => {
      const existing = prev.find(oi => oi.item.id === item.id);
      if (existing) {
        return prev.map(oi =>
          oi.item.id === item.id
            ? { ...oi, quantity: oi.quantity + 1 }
            : oi
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(prev => prev.filter(oi => oi.item.id !== itemId));
    } else {
      setOrderItems(prev =>
        prev.map(oi =>
          oi.item.id === itemId ? { ...oi, quantity } : oi
        )
      );
    }
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, oi) => {
      return total + (parseFloat(oi.item.price) * oi.quantity);
    }, 0);
  };

  const handleSubmit = () => {
    if (orderItems.length === 0) {
      toast({
        title: "No items in order",
        description: "Please add at least one item to the order",
        variant: "destructive",
      });
      return;
    }

    const total = calculateTotal();
    const order: InsertOrder = {
      customerName: customerName.trim() || undefined,
      status: "pending",
      totalAmount: total.toString(),
    };

    const items: InsertOrderItem[] = orderItems.map(oi => ({
      itemId: oi.item.id,
      quantity: oi.quantity,
      unitPrice: oi.item.price,
      totalPrice: (parseFloat(oi.item.price) * oi.quantity).toString(),
    }));

    createOrderMutation.mutate({ order, items });
  };

  const handleClose = () => {
    setCustomerName("");
    setOrderItems([]);
    setSearchTerm("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          {/* Items Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer-name">Customer Name (Optional)</Label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <Label>Search Items</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search items..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              <Label>Available Items</Label>
              {filteredItems.map((item: Item) => (
                <button
                  key={item.id}
                  onClick={() => addToOrder(item)}
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-tea-green hover:bg-tea-green hover:bg-opacity-5 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-tea-green bg-opacity-10 rounded-lg flex items-center justify-center">
                      <i className={`${getCategoryIcon(item.category)} text-tea-green text-sm`}></i>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(parseFloat(item.price))} • Stock: {item.stock}</p>
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-tea-green" />
                </button>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <Label>Order Items</Label>
            {orderItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No items added to order</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {orderItems.map((oi) => (
                  <div key={oi.item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{oi.item.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(parseFloat(oi.item.price))} each</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(oi.item.id, oi.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{oi.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(oi.item.id, oi.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="ml-2 font-medium text-tea-green">
                        {formatCurrency(parseFloat(oi.item.price) * oi.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium text-gray-900">Order Total</span>
                <span className="text-xl font-bold text-tea-green">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-tea-green hover:bg-tea-light"
                  onClick={handleSubmit}
                  disabled={createOrderMutation.isPending || orderItems.length === 0}
                >
                  {createOrderMutation.isPending ? "Creating..." : "Create Order"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
