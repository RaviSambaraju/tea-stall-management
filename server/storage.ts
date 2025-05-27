import { 
  items, 
  orders, 
  orderItems, 
  type Item, 
  type InsertItem, 
  type Order, 
  type InsertOrder, 
  type OrderItem, 
  type InsertOrderItem,
  type OrderWithItems,
  type DashboardStats
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lt, lte } from "drizzle-orm";

export interface IStorage {
  // Item operations
  getItems(): Promise<Item[]>;
  getItem(id: number): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, item: Partial<InsertItem>): Promise<Item | undefined>;
  deleteItem(id: number): Promise<boolean>;
  getLowStockItems(): Promise<Item[]>;
  updateItemStock(id: number, quantity: number): Promise<Item | undefined>;

  // Order operations
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<OrderWithItems | undefined>;
  createOrder(order: InsertOrder, orderItems: InsertOrderItem[]): Promise<OrderWithItems>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  getOrdersByStatus(status: string): Promise<Order[]>;
  getTodaysOrders(): Promise<Order[]>;

  // Order item operations
  getOrderItems(orderId: number): Promise<(OrderItem & { item: Item })[]>;

  // Dashboard stats
  getDashboardStats(): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private items: Map<number, Item>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private currentItemId: number;
  private currentOrderId: number;
  private currentOrderItemId: number;

  constructor() {
    this.items = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.currentItemId = 1;
    this.currentOrderId = 1;
    this.currentOrderItemId = 1;

    // Initialize with some sample items
    this.initializeItems();
  }

  private initializeItems() {
    const sampleItems: InsertItem[] = [
      { name: "Masala Tea", category: "tea", price: "15.00", stock: 50, lowStockThreshold: 10, unit: "cup" },
      { name: "Ginger Tea", category: "tea", price: "18.00", stock: 30, lowStockThreshold: 5, unit: "cup" },
      { name: "Black Tea", category: "tea", price: "12.00", stock: 40, lowStockThreshold: 8, unit: "cup" },
      { name: "Samosa", category: "snacks", price: "12.00", stock: 25, lowStockThreshold: 10, unit: "piece" },
      { name: "Pakoras", category: "snacks", price: "20.00", stock: 15, lowStockThreshold: 5, unit: "plate" },
      { name: "Biscuits", category: "snacks", price: "5.00", stock: 100, lowStockThreshold: 20, unit: "packet" },
      { name: "Cold Coffee", category: "beverages", price: "25.00", stock: 20, lowStockThreshold: 5, unit: "glass" },
      { name: "Lemonade", category: "beverages", price: "15.00", stock: 30, lowStockThreshold: 10, unit: "glass" },
    ];

    sampleItems.forEach(item => {
      const id = this.currentItemId++;
      this.items.set(id, { ...item, id });
    });
  }

  // Item operations
  async getItems(): Promise<Item[]> {
    return Array.from(this.items.values());
  }

  async getItem(id: number): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async createItem(item: InsertItem): Promise<Item> {
    const id = this.currentItemId++;
    const newItem: Item = { ...item, id };
    this.items.set(id, newItem);
    return newItem;
  }

  async updateItem(id: number, item: Partial<InsertItem>): Promise<Item | undefined> {
    const existingItem = this.items.get(id);
    if (!existingItem) return undefined;

    const updatedItem: Item = { ...existingItem, ...item };
    this.items.set(id, updatedItem);
    return updatedItem;
  }

  async deleteItem(id: number): Promise<boolean> {
    return this.items.delete(id);
  }

  async getLowStockItems(): Promise<Item[]> {
    return Array.from(this.items.values()).filter(
      item => item.stock <= item.lowStockThreshold
    );
  }

  async updateItemStock(id: number, quantity: number): Promise<Item | undefined> {
    const item = this.items.get(id);
    if (!item) return undefined;

    const updatedItem: Item = { ...item, stock: Math.max(0, item.stock + quantity) };
    this.items.set(id, updatedItem);
    return updatedItem;
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const items = await this.getOrderItems(id);
    return { ...order, items };
  }

  async createOrder(order: InsertOrder, orderItemsData: InsertOrderItem[]): Promise<OrderWithItems> {
    const id = this.currentOrderId++;
    const now = new Date();
    const newOrder: Order = { 
      ...order, 
      id, 
      createdAt: now,
      completedAt: null
    };
    this.orders.set(id, newOrder);

    // Create order items and update inventory
    const items: (OrderItem & { item: Item })[] = [];
    for (const orderItemData of orderItemsData) {
      const orderItemId = this.currentOrderItemId++;
      const orderItem: OrderItem = {
        ...orderItemData,
        id: orderItemId,
        orderId: id,
      };
      this.orderItems.set(orderItemId, orderItem);

      // Update inventory
      await this.updateItemStock(orderItemData.itemId, -orderItemData.quantity);

      // Get item details
      const item = await this.getItem(orderItemData.itemId);
      if (item) {
        items.push({ ...orderItem, item });
      }
    }

    return { ...newOrder, items };
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder: Order = { 
      ...order, 
      status,
      completedAt: status === "completed" ? new Date() : order.completedAt
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.status === status);
  }

  async getTodaysOrders(): Promise<Order[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return Array.from(this.orders.values()).filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= today && orderDate < tomorrow;
    });
  }

  // Order item operations
  async getOrderItems(orderId: number): Promise<(OrderItem & { item: Item })[]> {
    const items: (OrderItem & { item: Item })[] = [];
    
    for (const orderItem of this.orderItems.values()) {
      if (orderItem.orderId === orderId) {
        const item = await this.getItem(orderItem.itemId);
        if (item) {
          items.push({ ...orderItem, item });
        }
      }
    }

    return items;
  }

  // Dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    const todaysOrders = await this.getTodaysOrders();
    const pendingOrders = await this.getOrdersByStatus("pending");
    const lowStockItems = await this.getLowStockItems();

    const todaySales = todaysOrders.reduce((sum, order) => 
      sum + parseFloat(order.totalAmount), 0
    );

    return {
      todaySales,
      ordersToday: todaysOrders.length,
      pendingOrders: pendingOrders.length,
      lowStockItems: lowStockItems.length,
    };
  }
}

export class DatabaseStorage implements IStorage {
  async getItems(): Promise<Item[]> {
    const result = await db.select().from(items);
    return result;
  }

  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item || undefined;
  }

  async createItem(item: InsertItem): Promise<Item> {
    const [newItem] = await db
      .insert(items)
      .values(item)
      .returning();
    return newItem;
  }

  async updateItem(id: number, item: Partial<InsertItem>): Promise<Item | undefined> {
    const [updatedItem] = await db
      .update(items)
      .set(item)
      .where(eq(items.id, id))
      .returning();
    return updatedItem || undefined;
  }

  async deleteItem(id: number): Promise<boolean> {
    const result = await db.delete(items).where(eq(items.id, id));
    return result.rowCount > 0;
  }

  async getLowStockItems(): Promise<Item[]> {
    const result = await db
      .select()
      .from(items)
      .where(lte(items.stock, items.lowStockThreshold));
    return result;
  }

  async updateItemStock(id: number, quantity: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    if (!item) return undefined;

    const [updatedItem] = await db
      .update(items)
      .set({ stock: Math.max(0, item.stock + quantity) })
      .where(eq(items.id, id))
      .returning();
    return updatedItem || undefined;
  }

  async getOrders(): Promise<Order[]> {
    const result = await db
      .select()
      .from(orders)
      .orderBy(orders.createdAt);
    return result.reverse(); // Most recent first
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const orderItemsWithItems = await this.getOrderItems(id);
    return { ...order, items: orderItemsWithItems };
  }

  async createOrder(order: InsertOrder, orderItemsData: InsertOrderItem[]): Promise<OrderWithItems> {
    const [newOrder] = await db
      .insert(orders)
      .values(order)
      .returning();

    const orderItemsWithItems: (OrderItem & { item: Item })[] = [];
    
    for (const orderItemData of orderItemsData) {
      const [newOrderItem] = await db
        .insert(orderItems)
        .values({
          ...orderItemData,
          orderId: newOrder.id,
        })
        .returning();

      // Update inventory
      await this.updateItemStock(orderItemData.itemId, -orderItemData.quantity);

      // Get item details
      const item = await this.getItem(orderItemData.itemId);
      if (item) {
        orderItemsWithItems.push({ ...newOrderItem, item });
      }
    }

    return { ...newOrder, items: orderItemsWithItems };
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const updateData: any = { status };
    if (status === "completed") {
      updateData.completedAt = new Date();
    }

    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder || undefined;
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    const result = await db
      .select()
      .from(orders)
      .where(eq(orders.status, status));
    return result;
  }

  async getTodaysOrders(): Promise<Order[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await db
      .select()
      .from(orders)
      .where(and(
        gte(orders.createdAt, today),
        lt(orders.createdAt, tomorrow)
      ));
    return result;
  }

  async getOrderItems(orderId: number): Promise<(OrderItem & { item: Item })[]> {
    const result = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        itemId: orderItems.itemId,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice,
        item: items,
      })
      .from(orderItems)
      .innerJoin(items, eq(orderItems.itemId, items.id))
      .where(eq(orderItems.orderId, orderId));
    
    return result;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const todaysOrders = await this.getTodaysOrders();
    const pendingOrders = await this.getOrdersByStatus("pending");
    const lowStockItems = await this.getLowStockItems();

    const todaySales = todaysOrders.reduce((sum, order) => 
      sum + parseFloat(order.totalAmount), 0
    );

    return {
      todaySales,
      ordersToday: todaysOrders.length,
      pendingOrders: pendingOrders.length,
      lowStockItems: lowStockItems.length,
    };
  }
}

export const storage = new DatabaseStorage();
