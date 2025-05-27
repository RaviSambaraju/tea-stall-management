import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getCategoryIcon } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Search, AlertTriangle } from "lucide-react";
import type { Item, InsertItem } from "@shared/schema";

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: InsertItem) => {
      return apiRequest("POST", "/api/items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({ title: "Item created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Failed to create item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertItem> }) => {
      return apiRequest("PUT", `/api/items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({ title: "Item updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Failed to update item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({ title: "Item deleted successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = items.filter(item => item.stock <= item.lowStockThreshold);
  const categories = [...new Set(items.map(item => item.category))];

  const resetForm = () => {
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const itemData: InsertItem = {
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      price: formData.get("price") as string,
      stock: parseInt(formData.get("stock") as string),
      lowStockThreshold: parseInt(formData.get("lowStockThreshold") as string),
      unit: formData.get("unit") as string,
    };

    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data: itemData });
    } else {
      createItemMutation.mutate(itemData);
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = (item: Item) => {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      deleteItemMutation.mutate(item.id);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="flex-1 overflow-auto p-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-sm text-gray-500">Manage your tea stall items and stock levels</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setEditingItem(null)}
              className="bg-tea-green text-white hover:bg-tea-light"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingItem?.name || ""}
                  placeholder="Enter item name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue={editingItem?.category || ""} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tea">Tea</SelectItem>
                      <SelectItem value="snacks">Snacks</SelectItem>
                      <SelectItem value="beverages">Beverages</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select name="unit" defaultValue={editingItem?.unit || "piece"} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="piece">Piece</SelectItem>
                      <SelectItem value="cup">Cup</SelectItem>
                      <SelectItem value="plate">Plate</SelectItem>
                      <SelectItem value="glass">Glass</SelectItem>
                      <SelectItem value="packet">Packet</SelectItem>
                      <SelectItem value="kg">Kilogram</SelectItem>
                      <SelectItem value="liter">Liter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={editingItem?.price || ""}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="stock">Current Stock</Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    defaultValue={editingItem?.stock || ""}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  type="number"
                  defaultValue={editingItem?.lowStockThreshold || ""}
                  placeholder="5"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-tea-green hover:bg-tea-light"
                  disabled={createItemMutation.isPending || updateItemMutation.isPending}
                >
                  {editingItem ? "Update Item" : "Add Item"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Low Stock Alert ({lowStockItems.length} items)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-orange-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-orange-600">
                      Only {item.stock} {item.unit}(s) left
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(item)}
                    className="text-xs"
                  >
                    Restock
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search items..."
            className="pl-10"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className={item.stock <= item.lowStockThreshold ? "border-red-200" : ""}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-tea-green bg-opacity-10 rounded-lg flex items-center justify-center">
                    <i className={`${getCategoryIcon(item.category)} text-tea-green`}></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(item)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Price:</span>
                  <span className="font-bold text-tea-green">
                    {formatCurrency(parseFloat(item.price))}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Stock:</span>
                  <span className={`font-semibold ${
                    item.stock <= item.lowStockThreshold ? "text-red-600" : "text-gray-900"
                  }`}>
                    {item.stock} {item.unit}(s)
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Low Stock:</span>
                  <span className="text-sm text-gray-500">
                    {item.lowStockThreshold} {item.unit}(s)
                  </span>
                </div>
              </div>

              {item.stock <= item.lowStockThreshold && (
                <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-xs text-red-600 font-medium">Low Stock Alert</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No items found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
