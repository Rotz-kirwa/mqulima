import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  CheckCircle, 
  XCircle, 
  Shield, 
  Phone, 
  MapPin, 
  Eye, 
  X, 
  Mail, 
  IdCard, 
  Sprout, 
  Calendar, 
  ShoppingBag, 
  Briefcase, 
  BadgePercent,
  Check,
  Tag,
  UserCheck,
  Building,
  RefreshCw,
  Award
} from "lucide-react";
import { adminFetch } from "../../lib/api";

export const CustomersModule: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const fetchCustomers = () => {
    setLoading(true);
    adminFetch(`/api/admin/customers?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.customers)) {
          setCustomers(data.customers);
          if (selectedCustomer) {
            const updated = data.customers.find((c: any) => c.id === selectedCustomer.id);
            if (updated) setSelectedCustomer(updated);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch customers error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const res = await adminFetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "update_status", status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCustomers();
      }
    } catch (e) {
      console.error("Status update error:", e);
    }
  };

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.phone || "").includes(q) ||
      (c.nationalId || "").includes(q) ||
      (c.county || "").toLowerCase().includes(q) ||
      (c.deliveryLocation || "").toLowerCase().includes(q) ||
      (c.farmingType || "").toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#CCE5E1] pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#0F3D3C] flex items-center gap-2">
            <Users className="h-6 w-6 text-[#278C7B]" /> Customer & Farmer Registration CRM
          </h1>
          <p className="text-xs text-[#2C5E5B] mt-1">
            Complete database of registered farmers & clients capturing National IDs, delivery locations, farm types, and crops.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-white border border-[#CCE5E1] text-[#0F3D3C] px-3 py-1.5 rounded-[6px] shadow-2xs font-bold">
            Registered Profiles: <strong className="text-[#278C7B]">{customers.length}</strong>
          </span>
          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="p-1.5 bg-[#E8F4F1] hover:bg-[#d6ece7] text-[#0F3D3C] rounded-[6px] border border-[#CCE5E1] transition cursor-pointer"
            title="Refresh Database"
          >
            <RefreshCw className={`h-4 w-4 text-[#278C7B] ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-[#CCE5E1] p-3 rounded-[6px] shadow-xs">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search by name, email, phone, National ID, county, delivery..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#E8F4F1] border border-[#CCE5E1] text-xs text-[#0F3D3C] placeholder-[#4A7C79] px-3 py-2 pl-9 rounded-[6px] focus:outline-none focus:border-[#278C7B]"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#4A7C79]" />
        </div>
        <div className="text-xs text-[#4A7C79] font-mono">
          Showing <strong>{filtered.length}</strong> of <strong>{customers.length}</strong> registered accounts
        </div>
      </div>

      {/* Customer Data Table displaying all registration details */}
      <div className="bg-white border border-[#CCE5E1] rounded-[6px] overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#E8F4F1] border-b border-[#CCE5E1] font-mono text-[11px] uppercase text-[#0F3D3C]">
            <tr>
              <th className="p-3">Customer / Email</th>
              <th className="p-3">National ID & Phone</th>
              <th className="p-3">County & Delivery Location</th>
              <th className="p-3">Farming Type & Scope</th>
              <th className="p-3">Account & KYC</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#CCE5E1]/60 font-sans">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#4A7C79] font-mono">
                  Loading customer registration database...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#4A7C79]">
                  No matching customer profiles found.
                </td>
              </tr>
            ) : (
              filtered.map((customer) => {
                const displayId = customer.nationalId || customer.idNumber || "Not Recorded";
                const displayFarmingType = customer.farmingType || customer.natureOfAgriculture || "General Agriculture";
                const displayDelivery = customer.deliveryLocation || customer.deliveryAddress || "Standard County Delivery";

                return (
                  <tr key={customer.id} className="hover:bg-[#E8F4F1]/60 transition border-b border-[#CCE5E1]/50">
                    {/* Customer / Email */}
                    <td className="p-3 font-semibold text-[#0F3D3C]">
                      <div className="font-bold text-sm text-[#0F3D3C]">{customer.name}</div>
                      <div className="text-[11px] text-[#4A7C79] font-mono font-normal flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3 text-[#278C7B]" /> {customer.email}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1 mt-0.5">
                        <Calendar className="h-2.5 w-2.5 text-[#278C7B]" /> Reg: {formatDate(customer.createdAt)}
                      </div>
                    </td>

                    {/* National ID & Phone */}
                    <td className="p-3 font-mono text-[#0F3D3C]">
                      <div className="font-bold text-[#0F3D3C] flex items-center gap-1">
                        <Phone className="h-3 w-3 text-[#278C7B]" /> {customer.phone}
                      </div>
                      <div className="text-[10px] text-teal-900 bg-teal-100 border border-teal-300 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1 mt-1 inline-flex">
                        <IdCard className="h-3 w-3 text-[#278C7B]" /> ID: {displayId}
                      </div>
                    </td>

                    {/* County & Delivery Location */}
                    <td className="p-3 text-[#2C5E5B]">
                      <div className="font-bold text-[#0F3D3C] flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#278C7B]" /> {customer.county}
                      </div>
                      <div className="text-[10px] text-[#0F3D3C] font-mono mt-0.5 truncate max-w-[150px] font-bold" title={displayDelivery}>
                        Loc: {displayDelivery}
                      </div>
                    </td>

                    {/* Farming Type & Scope */}
                    <td className="p-3 font-mono text-[#0F3D3C]">
                      <div className="font-extrabold text-emerald-950 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded inline-flex items-center gap-1">
                        <Sprout className="h-3.5 w-3.5 text-[#278C7B]" /> {displayFarmingType}
                      </div>
                      {customer.yearsFarming > 0 && (
                        <div className="text-[10px] text-gray-600 font-normal mt-0.5">
                          {customer.yearsFarming} yrs experience
                        </div>
                      )}
                    </td>

                    {/* Account & KYC */}
                    <td className="p-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-teal-50 border border-teal-200 text-[#278C7B] px-2 py-0.5 rounded-[3px] font-extrabold shadow-2xs">
                          <CheckCircle className="h-3 w-3 text-[#278C7B]" /> KYC VERIFIED
                        </span>
                        <span className="text-[10px] font-mono text-gray-600 uppercase font-bold">
                          Role: {customer.role || "farmer"}
                        </span>
                        {customer.isRetailer && (
                          <span className="text-[9px] font-mono bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold border border-amber-300">
                            Retailer ({customer.retailerDiscountPct}% Disc)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="px-3 py-1.5 text-xs bg-[#0F3D3C] hover:bg-[#1E6B5E] text-white font-bold rounded-[6px] cursor-pointer inline-flex items-center gap-1 transition shadow-xs"
                      >
                        <Eye className="h-3.5 w-3.5 text-[#3EB8A4]" /> Full Profile
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* COMPREHENSIVE CUSTOMER REGISTRATION DRAWER MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-end z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white border-l border-[#CCE5E1] h-full p-6 text-left space-y-6 overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#CCE5E1] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-[#E8F4F1] border border-[#CCE5E1] px-2 py-0.5 rounded font-bold text-[#0F3D3C]">
                    {selectedCustomer.role ? selectedCustomer.role.toUpperCase() : "FARMER"}
                  </span>
                  <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                    ✓ KYC VERIFIED
                  </span>
                </div>
                <h2 className="text-xl font-serif font-bold text-[#0F3D3C] mt-1">{selectedCustomer.name}</h2>
                <div className="text-xs font-mono text-[#4A7C79]">Account ID: {selectedCustomer.id}</div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-[6px] hover:bg-[#E8F4F1] text-[#0F3D3C] cursor-pointer border border-transparent hover:border-[#CCE5E1] transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body: Registration Fields Grid */}
            <div className="space-y-6 text-xs">
              {/* 1. PERSONAL IDENTIFICATION */}
              <div className="bg-[#E8F4F1]/60 border border-[#CCE5E1] rounded-[8px] p-4 space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase text-[#0F3D3C] flex items-center gap-2 border-b border-[#CCE5E1] pb-2">
                  <UserCheck className="h-4 w-4 text-[#278C7B]" /> Personal Identification
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                  <div>
                    <span className="text-[#4A7C79] block text-[10px] uppercase font-bold">Full Name</span>
                    <span className="font-bold text-[#0F3D3C] text-sm">{selectedCustomer.name}</span>
                  </div>

                  <div>
                    <span className="text-[#4A7C79] block text-[10px] uppercase font-bold">National ID Number</span>
                    <span className="font-extrabold text-[#0F3D3C] bg-teal-100 px-2.5 py-1 rounded border border-teal-300 inline-block mt-0.5 font-mono">
                      {selectedCustomer.nationalId || selectedCustomer.idNumber || "Not Recorded"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#4A7C79] block text-[10px] uppercase font-bold">M-Pesa Phone</span>
                    <span className="font-bold text-[#0F3D3C] flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3 text-[#278C7B]" /> {selectedCustomer.phone}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#4A7C79] block text-[10px] uppercase font-bold">Account Email</span>
                    <span className="font-bold text-[#0F3D3C] flex items-center gap-1 mt-0.5 truncate" title={selectedCustomer.email}>
                      <Mail className="h-3 w-3 text-[#278C7B]" /> {selectedCustomer.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. FARM & LOCATION PROFILE */}
              <div className="bg-white border border-[#CCE5E1] rounded-[8px] p-4 space-y-3 shadow-xs">
                <h3 className="text-xs font-mono font-bold uppercase text-[#0F3D3C] flex items-center gap-2 border-b border-[#CCE5E1] pb-2">
                  <MapPin className="h-4 w-4 text-[#278C7B]" /> Farm Location & Delivery Address
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[#4A7C79] block text-[10px] uppercase font-mono font-bold">County Region</span>
                    <span className="font-bold text-[#0F3D3C] text-sm">{selectedCustomer.county}</span>
                  </div>

                  <div>
                    <span className="text-[#4A7C79] block text-[10px] uppercase font-mono font-bold">Farming Type</span>
                    <span className="font-extrabold text-[#0F3D3C] bg-emerald-100 px-2.5 py-1 rounded border border-emerald-300 inline-block mt-0.5 font-mono">
                      {selectedCustomer.farmingType || selectedCustomer.natureOfAgriculture || "General Agriculture"}
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-[#4A7C79] block text-[10px] uppercase font-mono font-bold mb-1">
                      Specific Delivery Location / Address
                    </span>
                    <div className="bg-[#E8F4F1] border border-[#CCE5E1] rounded p-2.5 font-mono text-[#0F3D3C] font-extrabold text-sm">
                      {selectedCustomer.deliveryLocation || selectedCustomer.deliveryAddress || "Dagoreti corner"}
                    </div>
                  </div>

                  <div>
                    <span className="text-[#4A7C79] block text-[10px] uppercase font-mono font-bold">Years Farming Experience</span>
                    <span className="font-mono font-bold text-[#0F3D3C]">
                      {selectedCustomer.yearsFarming > 0 ? `${selectedCustomer.yearsFarming} Years` : "Not specified"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#4A7C79] block text-[10px] uppercase font-mono font-bold">Nature of Agriculture</span>
                    <span className="font-mono font-bold text-[#0F3D3C]">
                      {selectedCustomer.natureOfAgriculture || selectedCustomer.farmingType || "Commercial Farmer"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. CROPS, LIVESTOCK & ACTIVITIES */}
              <div className="bg-white border border-[#CCE5E1] rounded-[8px] p-4 space-y-3 shadow-xs">
                <h3 className="text-xs font-mono font-bold uppercase text-[#0F3D3C] flex items-center gap-2 border-b border-[#CCE5E1] pb-2">
                  <Sprout className="h-4 w-4 text-[#278C7B]" /> Crops, Livestock & Activities
                </h3>

                <div className="space-y-2">
                  {selectedCustomer.crops && selectedCustomer.crops.length > 0 && (
                    <div>
                      <span className="text-[#4A7C79] block text-[10px] font-mono font-bold mb-1">Crops Grown</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedCustomer.crops.map((crop: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold font-mono text-[10px] rounded">
                            🌱 {crop}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCustomer.livestock && selectedCustomer.livestock.length > 0 && (
                    <div>
                      <span className="text-[#4A7C79] block text-[10px] font-mono font-bold mb-1">Livestock Kept</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedCustomer.livestock.map((ls: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-950 font-bold font-mono text-[10px] rounded">
                            🐄 {ls}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-[#4A7C79] block text-[10px] font-mono font-bold mb-1">Farmer Bio / Notes</span>
                    <div className="bg-gray-50 border border-gray-200 rounded p-2.5 text-gray-700 italic">
                      "{selectedCustomer.bio || "No special bio notes provided."}"
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. ACCOUNT RIGHTS & RETAILER DEALS */}
              <div className="bg-[#E8F4F1] border border-[#CCE5E1] rounded-[8px] p-4 space-y-3 font-mono">
                <h3 className="text-xs font-mono font-bold uppercase text-[#0F3D3C] flex items-center gap-2 border-b border-[#CCE5E1] pb-2">
                  <BadgePercent className="h-4 w-4 text-[#278C7B]" /> Account Rights & Retailer Status
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#4A7C79] block text-[10px] font-bold">Is Retailer Account?</span>
                    <span className="font-bold text-[#0F3D3C]">
                      {selectedCustomer.isRetailer ? "Yes (Wholesale / Retail)" : "No (Standard Farmer)"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#4A7C79] block text-[10px] font-bold">Retailer Discount</span>
                    <span className="font-bold text-amber-800">
                      {selectedCustomer.retailerDiscountPct}% Discount Rate
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-[#4A7C79] block text-[10px] font-bold">Registration Timestamp</span>
                    <span className="font-bold text-[#0F3D3C]">
                      {formatDate(selectedCustomer.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. STATUS OVERRIDE CONTROLS */}
              <div className="space-y-2 pt-2 border-t border-[#CCE5E1]">
                <label className="text-[10px] text-[#4A7C79] uppercase font-mono font-bold">Admin Account Controls</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusUpdate(selectedCustomer.id, "active")}
                    className="flex-1 py-2 bg-[#278C7B] hover:bg-[#1E6B5E] text-white rounded-[6px] font-bold cursor-pointer transition text-xs flex items-center justify-center gap-1"
                  >
                    <Check className="h-4 w-4" /> Activate Account
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedCustomer.id, "suspended")}
                    className="flex-1 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-[6px] font-bold cursor-pointer transition text-xs flex items-center justify-center gap-1"
                  >
                    <X className="h-4 w-4" /> Suspend Account
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[#CCE5E1] pt-4 text-right">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-[#0F3D3C] text-white font-bold text-xs rounded-[6px] cursor-pointer hover:bg-[#1E6B5E] transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
