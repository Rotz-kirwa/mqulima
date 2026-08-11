import React, { useState, useEffect } from "react";
import { 
  ShoppingCart, 
  FileText, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  XCircle, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Package, 
  CreditCard,
  Building2,
  Calendar,
  Search,
  RefreshCw,
  Eye,
  Check,
  X,
  ShieldCheck,
  Tag,
  ListFilter,
  CheckCheck,
  AlertCircle
} from "lucide-react";
import { adminFetch } from "../../lib/api";

export type OrderFilterTab = "all" | "pending" | "delivered" | "cancelled";

type OrderItem = {
  id?: string;
  name: string;
  image?: string;
  quantity: number;
  price: number;
  unit?: string;
  category?: string;
};

type Order = {
  id: string;
  userId?: string;
  items?: OrderItem[] | any;
  subtotal?: string | number;
  total: string | number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | string;
  paymentMethod?: string;
  paymentStatus: "pending" | "completed" | "paid" | "failed" | string;
  deliveryAddress?: string;
  createdAt: string;
  updatedAt?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerIdNumber?: string;
  customerCounty?: string;
  customerFarmingType?: string;
};

type Quotation = {
  id: string;
  userId?: string;
  title?: string;
  items?: OrderItem[] | any;
  totalAmountKsh?: number;
  status: "pending" | "converted" | "rejected" | string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  createdAt: string;
};

export const OrdersQuotationsModule: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"orders" | "quotations">("orders");
  const [activeTab, setActiveTab] = useState<OrderFilterTab>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState<string>("");

  // Selected Order / Quote for full details modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric"
        }) + " • " +
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = () => {
    setLoading(true);
    if (activeSubTab === "orders") {
      adminFetch("/api/admin/orders")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setOrders(data.orders || []);
            if (selectedOrder) {
              const updated = (data.orders || []).find((o: Order) => o.id === selectedOrder.id);
              if (updated) setSelectedOrder(updated);
            }
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      adminFetch("/api/admin/quotations")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setQuotations(data.quotations || []);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  const handleUpdateOrderStatus = async (id: string, nextStatus: string) => {
    setUpdatingStatusId(id);
    try {
      const res = await adminFetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (e) {
      console.error("Order status error:", e);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleConvertQuote = async (id: string) => {
    try {
      const res = await adminFetch("/api/admin/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "convert_to_order", id }),
      });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (e) {
      console.error("Convert quote error:", e);
    }
  };

  // Helper to parse items safely & guarantee images & names
  const parseItems = (rawItems: any): OrderItem[] => {
    if (!rawItems) return [];
    if (typeof rawItems === "string") {
      try {
        rawItems = JSON.parse(rawItems);
      } catch (e) {
        return [];
      }
    }
    if (!Array.isArray(rawItems)) return [];
    
    return rawItems.map((item, idx) => ({
      id: item.id || `item-${idx}`,
      name: item.name || item.productName || item.title || "Agricultural Product Input",
      image: item.image || item.imageUrls?.[0] || item.productImage || "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=400",
      quantity: Number(item.quantity || item.qty || 1),
      price: Number(item.price || item.unitPrice || 0),
      unit: item.unit || "/unit",
      category: item.category || "General Agriculture"
    }));
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return { date: "N/A", time: "" };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { date: dateStr, time: "" };
      const date = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
      const time = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
      return { date, time };
    } catch (e) {
      return { date: dateStr, time: "" };
    }
  };

  // Counts calculation for orders
  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === "pending" || o.status === "processing" || o.status === "shipped").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered" || o.status === "completed").length;
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length;

  // Filtered orders list
  const filteredOrders = orders.filter((o) => {
    const q = searchTerm.toLowerCase();
    const name = (o.customerName || "").toLowerCase();
    const email = (o.customerEmail || "").toLowerCase();
    const phone = (o.customerPhone || "").toLowerCase();
    const id = (o.id || "").toLowerCase();
    const matchesSearch = name.includes(q) || email.includes(q) || phone.includes(q) || id.includes(q);

    let matchesTab = true;
    if (activeTab === "pending") {
      matchesTab = o.status === "pending" || o.status === "processing" || o.status === "shipped";
    } else if (activeTab === "delivered") {
      matchesTab = o.status === "delivered" || o.status === "completed";
    } else if (activeTab === "cancelled") {
      matchesTab = o.status === "cancelled";
    }

    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-[#CCE5E1] pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#0F3D3C] flex items-center gap-2.5">
            <ShoppingCart className="h-6 w-6 text-[#278C7B]" /> Store Orders & B2B Quotations Desk
          </h1>
          <p className="text-xs text-[#2C5E5B] mt-1">
            Manage customer store orders, inspect buyer profile accounts, view ordered product items with shop images, and update fulfillment states.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Live System Time Badge */}
          <div className="px-3 py-1.5 bg-[#E8F4F1] border border-[#CCE5E1] text-[#0F3D3C] text-xs font-mono font-bold rounded-[6px] flex items-center gap-1.5 shadow-2xs">
            <Clock className="h-3.5 w-3.5 text-[#278C7B] animate-pulse" />
            <span>{currentTime || "Loading time..."}</span>
          </div>

          {/* Sub-tab Navigation: Orders vs Quotations */}
          <div className="bg-white border border-[#CCE5E1] p-0.5 rounded-[6px] flex items-center shadow-2xs">
            <button
              onClick={() => setActiveSubTab("orders")}
              className={`px-3.5 py-1 text-xs font-bold rounded-[4px] flex items-center gap-1.5 transition cursor-pointer ${
                activeSubTab === "orders"
                  ? "bg-[#0F3D3C] text-white shadow-xs"
                  : "text-[#0F3D3C] hover:bg-[#E8F4F1]"
              }`}
            >
              <ShoppingCart className="h-3.5 w-3.5" /> Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveSubTab("quotations")}
              className={`px-3.5 py-1 text-xs font-bold rounded-[4px] flex items-center gap-1.5 transition cursor-pointer ${
                activeSubTab === "quotations"
                  ? "bg-[#0F3D3C] text-white shadow-xs"
                  : "text-[#0F3D3C] hover:bg-[#E8F4F1]"
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> B2B Quotes ({quotations.length})
            </button>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#E8F4F1] hover:bg-[#d6ece7] text-[#0F3D3C] text-xs font-bold rounded-[6px] border border-[#CCE5E1] transition cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#278C7B] ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {activeSubTab === "orders" ? (
        <>
          {/* COLOR CODED ORDER STATUS FILTER TABS */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#CCE5E1] pb-3">
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {/* ALL ORDERS TAB */}
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 text-xs font-bold rounded-[6px] transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  activeTab === "all"
                    ? "bg-[#0F3D3C] text-white shadow-md ring-2 ring-[#278C7B] border border-[#0F3D3C]"
                    : "bg-[#E8F4F1] text-[#0F3D3C] hover:bg-[#d5ece7] border border-[#CCE5E1]"
                }`}
              >
                <ListFilter className="h-4 w-4" /> All Orders ({totalCount})
              </button>

              {/* PENDING / PROCESSING ORDERS TAB (DEEP HIGH-CONTRAST BLUE) */}
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-4 py-2 text-xs font-bold rounded-[6px] transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  activeTab === "pending"
                    ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-400 border border-blue-700 font-extrabold"
                    : "bg-blue-200 text-blue-950 hover:bg-blue-300 border border-blue-400 font-bold"
                }`}
              >
                <Clock className="h-4 w-4 text-blue-900" /> Pending / Processing ({pendingCount})
              </button>

              {/* DELIVERED ORDERS TAB (EMERALD GREEN) */}
              <button
                onClick={() => setActiveTab("delivered")}
                className={`px-4 py-2 text-xs font-bold rounded-[6px] transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  activeTab === "delivered"
                    ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300 border border-emerald-700 font-extrabold"
                    : "bg-emerald-100/90 text-emerald-950 hover:bg-emerald-200 border border-emerald-300"
                }`}
              >
                <CheckCheck className="h-4 w-4 text-emerald-900" /> Delivered Orders ({deliveredCount})
              </button>

              {/* CANCELLED ORDERS TAB (ROSE RED) */}
              <button
                onClick={() => setActiveTab("cancelled")}
                className={`px-4 py-2 text-xs font-bold rounded-[6px] transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  activeTab === "cancelled"
                    ? "bg-rose-600 text-white shadow-md ring-2 ring-rose-300 border border-rose-700 font-extrabold"
                    : "bg-rose-100/90 text-rose-950 hover:bg-rose-200 border border-rose-300"
                }`}
              >
                <XCircle className="h-4 w-4 text-rose-900" /> Cancelled Orders ({cancelledCount})
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#4A7C79]" />
              <input
                type="text"
                placeholder="Search Order ID, buyer, phone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#CCE5E1] rounded-[6px] focus:outline-none focus:border-[#278C7B] text-[#0F3D3C]"
              />
            </div>
          </div>

          {/* ORDERS TABLE VIEW WITH COLOR-STRIPED ROWS */}
          <div className="bg-white border border-[#CCE5E1] rounded-[6px] overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#E8F4F1] border-b border-[#CCE5E1] font-mono text-[11px] uppercase text-[#0F3D3C]">
                <tr>
                  <th className="p-3">Order Ref ID</th>
                  <th className="p-3">Order Date & Time</th>
                  <th className="p-3">Customer / Account</th>
                  <th className="p-3">Ordered Products (Shop Images)</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Order Status</th>
                  <th className="p-3 text-right">Actions & Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CCE5E1]/60 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#4A7C79] font-mono">
                      Loading customer orders...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#4A7C79]">
                      No active orders found in this view.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const itemsList = parseItems(order.items);
                    const { date, time } = formatDateTime(order.createdAt);
                    const displayTotal = parseFloat(order.total?.toString() || "0");
                    const firstItem = itemsList[0];

                    return (
                      <tr
                        key={order.id}
                        className={`transition-all border-b border-[#CCE5E1]/60 ${
                          order.status === "delivered" || order.status === "completed"
                            ? "bg-gradient-to-r from-emerald-50 via-emerald-100/70 to-emerald-50 hover:from-emerald-100 border-l-4 border-l-emerald-600"
                            : order.status === "cancelled"
                            ? "bg-gradient-to-r from-rose-50 via-rose-100/70 to-rose-50 hover:from-rose-100 border-l-4 border-l-rose-600"
                            : "bg-gradient-to-r from-sky-200/90 via-blue-100 to-sky-100 hover:from-sky-200 border-l-4 border-l-blue-600 shadow-2xs"
                        }`}
                      >
                        {/* Order Ref ID */}
                        <td className="p-3 font-mono font-bold text-[#0F3D3C]">
                          #{order.id.slice(0, 8)}
                          <div className="text-[10px] text-[#4A7C79] font-normal uppercase mt-0.5">
                            {order.paymentMethod || "M-Pesa Express"}
                          </div>
                        </td>

                        {/* Order Date & Time */}
                        <td className="p-3 font-mono text-[#0F3D3C]">
                          <div className="font-bold flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-[#278C7B]" /> {date}
                          </div>
                          {time && (
                            <div className="text-[10px] text-[#4A7C79] flex items-center gap-1 mt-0.5">
                              <Clock className="h-2.5 w-2.5 text-[#278C7B]" /> {time}
                            </div>
                          )}
                        </td>

                        {/* Customer / Account Details */}
                        <td className="p-3 text-[#2C5E5B]">
                          <div className="font-bold text-[#0F3D3C]">
                            {order.customerName || "Registered Customer Account"}
                          </div>
                          {order.customerPhone && (
                            <div className="text-[10px] text-[#4A7C79] font-mono">{order.customerPhone}</div>
                          )}
                          {order.customerEmail && (
                            <div className="text-[10px] text-teal-800 truncate max-w-[140px]" title={order.customerEmail}>
                              {order.customerEmail}
                            </div>
                          )}
                          {order.customerCounty && (
                            <div className="text-[9px] text-[#278C7B] font-bold mt-0.5">
                              📍 {order.customerCounty}
                            </div>
                          )}
                        </td>

                        {/* Ordered Products (with Shop Image Preview) */}
                        <td className="p-3">
                          {firstItem ? (
                            <div className="flex items-center gap-2.5 max-w-xs">
                              <div className="h-10 w-10 bg-white border border-[#CCE5E1] rounded-[4px] p-0.5 shrink-0 overflow-hidden flex items-center justify-center shadow-2xs">
                                <img
                                  src={firstItem.image}
                                  alt={firstItem.name}
                                  className="h-full w-full object-contain rounded-[2px]"
                                />
                              </div>
                              <div className="overflow-hidden space-y-0.5">
                                <span className="font-bold text-[#0F3D3C] block truncate text-[11px]" title={firstItem.name}>
                                  {firstItem.name}
                                </span>
                                <span className="text-[10px] text-[#4A7C79] font-mono block">
                                  Qty: {firstItem.quantity} &middot; KSh {(firstItem.price * firstItem.quantity || displayTotal).toLocaleString()}
                                  {itemsList.length > 1 && (
                                    <strong className="text-[#278C7B] ml-1">+{itemsList.length - 1} more</strong>
                                  )}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#4A7C79]">1 Agricultural Input Item</span>
                          )}
                        </td>

                        {/* Total Amount */}
                        <td className="p-3 font-mono font-bold text-[#0F3D3C] text-xs">
                          KSh {displayTotal.toLocaleString()}
                        </td>

                        {/* Order Status Interactive Dropdown */}
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <select
                              value={order.status}
                              disabled={updatingStatusId === order.id}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className={`font-mono text-[11px] uppercase font-extrabold px-3 py-1.5 rounded-[6px] border cursor-pointer focus:outline-none transition-all shadow-xs ${
                                order.status === "delivered" || order.status === "completed"
                                  ? "bg-emerald-100 border-emerald-400 text-emerald-950 hover:bg-emerald-200"
                                  : order.status === "cancelled"
                                  ? "bg-rose-100 border-rose-400 text-rose-950 hover:bg-rose-200"
                                  : "bg-blue-200 border-blue-500 text-blue-950 hover:bg-blue-300 font-extrabold"
                              }`}
                            >
                              <option value="pending" className="bg-white text-blue-900 font-bold">⏳ Pending</option>
                              <option value="processing" className="bg-white text-blue-900 font-bold">⚙ Processing</option>
                              <option value="shipped" className="bg-white text-blue-900 font-bold">🚚 Dispatched</option>
                              <option value="delivered" className="bg-white text-emerald-900 font-bold">✓ Delivered</option>
                              <option value="cancelled" className="bg-white text-rose-900 font-bold">✕ Cancelled</option>
                            </select>
                            {updatingStatusId === order.id && (
                              <span className="text-[10px] text-gray-500 font-mono animate-pulse">...</span>
                            )}
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {order.status === "delivered" || order.status === "completed" ? (
                              <span className="px-2.5 py-1 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-[4px] text-[11px] font-extrabold inline-flex items-center gap-1 shadow-2xs">
                                <Check className="h-3.5 w-3.5 text-emerald-700" /> Delivered
                              </span>
                            ) : order.status === "cancelled" ? (
                              <span className="px-2.5 py-1 bg-rose-100 border border-rose-300 text-rose-950 rounded-[4px] text-[11px] font-extrabold inline-flex items-center gap-1 shadow-2xs">
                                <X className="h-3.5 w-3.5 text-rose-700" /> Cancelled
                              </span>
                            ) : (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, "delivered")}
                                disabled={updatingStatusId === order.id}
                                title="Mark Order as Delivered"
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[4px] text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer shadow-xs"
                              >
                                <Check className="h-3.5 w-3.5" /> Mark Delivered
                              </button>
                            )}

                            {/* Full Order & Customer Details Modal Trigger */}
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-2.5 py-1 bg-white hover:bg-[#E8F4F1] text-[#0F3D3C] rounded-[4px] text-[11px] font-bold border border-[#CCE5E1] inline-flex items-center gap-1 transition cursor-pointer shadow-xs"
                            >
                              <Eye className="h-3.5 w-3.5 text-[#278C7B]" /> Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* B2B QUOTATIONS TAB */
        <div className="bg-white border border-[#CCE5E1] rounded-[6px] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#E8F4F1] border-b border-[#CCE5E1] font-mono text-[11px] uppercase text-[#0F3D3C]">
              <tr>
                <th className="p-3.5">Quotation ID & Title</th>
                <th className="p-3.5">Customer Account</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CCE5E1]/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[#4A7C79] font-mono">
                    Loading B2B quotations...
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[#4A7C79]">
                    No B2B commercial quotations found.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-[#E8F4F1]/50 transition">
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-[#0F3D3C] block">#{q.id.slice(0, 8)}</span>
                      <span className="text-xs font-semibold text-[#2C5E5B]">{q.title || "Commercial Supply Quote"}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-[#0F3D3C] block">{q.customerName || "B2B Client Account"}</span>
                      <span className="text-[10px] text-[#4A7C79] font-mono">{q.customerEmail || "client@mkulima.co.ke"}</span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-[#0F3D3C]">
                      KSh {q.totalAmountKsh ? q.totalAmountKsh.toLocaleString() : "0"}
                    </td>
                    <td className="p-3.5 font-mono text-[10px]">
                      {q.status === "converted" ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-[2px] font-bold">
                          <CheckCircle className="h-3 w-3" /> CONVERTED TO ORDER
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-[2px] font-bold">
                          <Clock className="h-3 w-3" /> PENDING REVIEW
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {q.status !== "converted" && (
                        <button
                          onClick={() => handleConvertQuote(q.id)}
                          className="px-3 py-1.5 text-xs bg-[#278C7B] text-white font-bold rounded-[4px] hover:bg-[#1E6B5E] transition cursor-pointer shadow-xs"
                        >
                          Convert to Active Order
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* FULL CUSTOMER & ORDER DETAILS MODAL (MATCHING SERVICE DESK LOOK) */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#CCE5E1] rounded-[10px] max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-left font-sans">
            
            {/* Modal Header */}
            <div className="bg-[#0F3D3C] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-[#278C7B]" />
                <h3 className="font-bold text-sm tracking-wide">
                  Order Details Specs & Customer Account
                </h3>
                <span className="bg-[#278C7B] text-white font-mono text-[10px] px-2 py-0.5 rounded-[3px] font-bold">
                  #{selectedOrder.id.slice(0, 8)}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-300 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Customer Account Specs Block */}
              <div className="bg-[#F4F9F8] border border-[#CCE5E1] p-4 rounded-[8px] space-y-3">
                <h4 className="text-xs font-black uppercase text-[#0F3D3C] tracking-wider flex items-center gap-2">
                  <User className="h-4 w-4 text-[#278C7B]" /> Customer Account Information
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-[#4A7C79] uppercase font-bold block">Account Holder Name</span>
                    <span className="font-bold text-[#0F3D3C]">
                      {selectedOrder.customerName || "Registered Customer"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#4A7C79] uppercase font-bold block">National ID / Account ID</span>
                    <span className="font-mono font-bold text-[#0F3D3C]">
                      {selectedOrder.customerIdNumber || selectedOrder.userId || selectedOrder.id.slice(0, 8)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#4A7C79] uppercase font-bold block">Phone Contact</span>
                    <span className="font-mono font-bold text-[#0F3D3C] flex items-center gap-1">
                      <Phone className="h-3 w-3 text-[#278C7B]" /> {selectedOrder.customerPhone || "N/A"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#4A7C79] uppercase font-bold block">Email Address</span>
                    <span className="font-bold text-teal-900 flex items-center gap-1">
                      <Mail className="h-3 w-3 text-[#278C7B]" /> {selectedOrder.customerEmail || "N/A"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#4A7C79] uppercase font-bold block">County Region</span>
                    <span className="font-bold text-[#0F3D3C] flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-[#278C7B]" /> {selectedOrder.customerCounty || "Kenya"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#4A7C79] uppercase font-bold block">Farming Interest / Scale</span>
                    <span className="font-bold text-[#0F3D3C] flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-[#278C7B]" /> {selectedOrder.customerFarmingType || "Commercial Agriculture"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ordered Product Details with Shop Images */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-[#0F3D3C] tracking-wider flex items-center gap-2">
                  <Package className="h-4 w-4 text-[#278C7B]" /> Ordered Items (Catalog Details & Shop Images)
                </h4>

                <div className="space-y-2">
                  {parseItems(selectedOrder.items).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-4 border border-[#CCE5E1] p-3 rounded-[6px] bg-white shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 bg-white border border-[#CCE5E1] rounded-[6px] p-1 shrink-0 overflow-hidden flex items-center justify-center shadow-2xs">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-contain rounded-[4px]"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-[#278C7B] font-black uppercase tracking-wider block">
                            {item.category}
                          </span>
                          <h5 className="text-xs font-bold text-[#0F3D3C]">{item.name}</h5>
                          <span className="text-[10px] text-[#4A7C79] font-mono">
                            KSh {item.price.toLocaleString()} per unit
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-[#4A7C79] block">Qty: {item.quantity}</span>
                        <span className="text-xs font-black text-[#0F3D3C]">
                          KSh {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial & Delivery Summary */}
              <div className="bg-[#F4F9F8] border border-[#CCE5E1] p-4 rounded-[8px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-[#4A7C79] font-bold">Payment Method: </span>
                    <span className="font-extrabold text-[#0F3D3C] uppercase">{selectedOrder.paymentMethod || "M-Pesa"}</span>
                  </div>
                  <div>
                    <span className="text-[#4A7C79] font-bold">Payment Status: </span>
                    <span className="font-mono font-bold text-[#278C7B] uppercase">{selectedOrder.paymentStatus || "PAID"}</span>
                  </div>
                  {selectedOrder.deliveryAddress && (
                    <div>
                      <span className="text-[#4A7C79] font-bold">Delivery Location: </span>
                      <span className="font-semibold text-[#0F3D3C]">{selectedOrder.deliveryAddress}</span>
                    </div>
                  )}
                </div>

                <div className="text-right font-mono shrink-0">
                  <span className="text-[10px] text-[#4A7C79] uppercase font-bold block">Grand Total</span>
                  <span className="text-xl font-black text-[#0F3D3C]">
                    KSh {parseFloat(selectedOrder.total?.toString() || "0").toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Update Order Status Selector */}
              <div className="flex items-center justify-between gap-4 pt-2 border-t border-[#CCE5E1]">
                <span className="text-xs font-bold text-[#0F3D3C]">Update Fulfillment Status:</span>
                
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                  className="font-mono text-xs uppercase font-extrabold px-3 py-1.5 rounded-[6px] border border-[#278C7B] bg-white text-[#0F3D3C] cursor-pointer focus:outline-none"
                >
                  <option value="pending">⏳ Pending</option>
                  <option value="processing">⚙ Processing</option>
                  <option value="shipped">🚚 Dispatched</option>
                  <option value="delivered">✓ Delivered</option>
                  <option value="cancelled">✕ Cancelled</option>
                </select>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-[#E8F4F1] border-t border-[#CCE5E1] p-3 text-right">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-1.5 bg-[#0F3D3C] hover:bg-[#1E6B5E] text-white text-xs font-bold rounded-[4px] transition cursor-pointer"
              >
                Close Specs Drawer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
