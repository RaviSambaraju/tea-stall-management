import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Printer } from "lucide-react";
import type { OrderWithItems } from "@shared/schema";

interface BillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderWithItems | null;
}

export function BillModal({ open, onOpenChange, order }: BillModalProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="print-hidden">
          <DialogTitle>Order Bill</DialogTitle>
        </DialogHeader>
        
        <div className="print-bill">
          {/* Bill Header */}
          <div className="text-center mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold text-gray-900">TeaStall Pro</h1>
            <p className="text-sm text-gray-600">Fresh Tea & Snacks</p>
            <p className="text-xs text-gray-500 mt-1">Order #{order.id}</p>
          </div>

          {/* Order Details */}
          <div className="mb-4 text-sm">
            <div className="flex justify-between mb-1">
              <span>Date:</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Time:</span>
              <span>{formatTime(order.createdAt)}</span>
            </div>
            {order.customerName && (
              <div className="flex justify-between mb-1">
                <span>Customer:</span>
                <span>{order.customerName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="capitalize">{order.status}</span>
            </div>
          </div>

          {/* Items */}
          <div className="border-t border-b py-4 mb-4">
            <h3 className="font-semibold mb-3 text-sm">Order Items</h3>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <div className="font-medium">{item.item.name}</div>
                    <div className="text-gray-600 text-xs">
                      {formatCurrency(parseFloat(item.unitPrice))} × {item.quantity}
                    </div>
                  </div>
                  <div className="font-medium">
                    {formatCurrency(parseFloat(item.totalPrice))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="mb-6">
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount:</span>
              <span>{formatCurrency(parseFloat(order.totalAmount))}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 border-t pt-4">
            <p>Thank you for your order!</p>
            <p>Visit us again soon</p>
          </div>
        </div>

        <div className="flex space-x-3 mt-4 print-hidden">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            className="flex-1 bg-tea-green hover:bg-tea-light"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Bill
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
