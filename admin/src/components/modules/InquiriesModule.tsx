import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Search, 
  Filter, 
  Sparkles,
  RefreshCw,
  Inbox,
  Users,
  Briefcase,
  ShoppingBag,
  Eye,
  EyeOff
} from "lucide-react";

import { adminFetch } from "../../lib/api";

export const InquiriesModule: React.FC = () => {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Track Opened / Read Tickets with localStorage persistence
  const [openedTicketIds, setOpenedTicketIds] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("mqulima_opened_inquiries");
        if (saved) {
          return new Set(JSON.parse(saved));
        }
      } catch (e) {
        console.error(e);
      }
    }
    return new Set();
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("mqulima_opened_inquiries", JSON.stringify(Array.from(openedTicketIds)));
      } catch (e) {
        console.error(e);
      }
    }
  }, [openedTicketIds]);

  const fetchInquiries = () => {
    setLoading(true);
    adminFetch("/api/admin/inquiries")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInquiries(data.inquiries);
          if (data.inquiries.length > 0) {
            setSelectedTicket((prev: any) => prev || data.inquiries[0]);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleSelectTicket = (ticket: any) => {
    setSelectedTicket(ticket);

    // Mark ticket as opened (removes blue gradient permanently)
    setOpenedTicketIds((prev) => {
      const next = new Set(prev);
      next.add(String(ticket.id));
      return next;
    });
  };

  const toggleReadState = (ticketId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenedTicketIds((prev) => {
      const next = new Set(prev);
      if (next.has(String(ticketId))) {
        next.delete(String(ticketId));
      } else {
        next.add(String(ticketId));
      }
      return next;
    });
  };

  const resetAllToUnread = () => {
    setOpenedTicketIds(new Set());
    if (typeof window !== "undefined") {
      localStorage.removeItem("mqulima_opened_inquiries");
    }
  };

  // Filter Logic
  const filteredInquiries = inquiries.filter((t) => {
    const matchesSearch =
      t.ticketNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerPhone?.includes(searchQuery) ||
      t.title?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" ? true : t.category?.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Calculate Metrics
  const totalCount = inquiries.length;

  const newUnreadCount = inquiries.filter((t) => !openedTicketIds.has(String(t.id))).length;

  const contactCount = inquiries.filter(
    (t) => t.category?.toLowerCase().includes("contact")
  ).length;

  const stockSourcingCount = inquiries.filter(
    (t) => t.category?.toLowerCase().includes("stock sourcing")
  ).length;

  const partnershipServiceCount = inquiries.filter(
    (t) => !t.category?.toLowerCase().includes("contact") && !t.category?.toLowerCase().includes("stock sourcing")
  ).length;

  const formatWhatsAppUrl = (phone: string, ticketNo: string, name: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const formatted = cleanPhone.startsWith("0") ? `254${cleanPhone.slice(1)}` : cleanPhone;
    const msg = encodeURIComponent(`Hello ${name}, regarding your Mqulima support inquiry [${ticketNo}]: `);
    return `https://wa.me/${formatted}?text=${msg}`;
  };

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#CCE5E1] pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#0F3D3C] flex items-center gap-2.5">
            <div className="p-2 bg-[#E8F4F1] rounded-lg border border-[#CCE5E1]">
              <MessageSquare className="w-5 h-5 text-[#278C7B]" />
            </div>
            Support & Farmer Enquiries Desk
          </h1>
          <p className="text-xs text-[#2C5E5B] mt-1">
            Centralized hub for public contact submissions, partnership applications, and agronomist support requests.
          </p>
        </div>

        <button
          onClick={fetchInquiries}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-[#E8F4F1] hover:bg-[#D4ECE6] text-[#0F3D3C] text-xs font-bold px-4 py-2.5 rounded-lg border border-[#CCE5E1] shadow-2xs transition cursor-pointer active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#278C7B]" : ""}`} />
          Refresh Desk
        </button>
      </div>

      {/* High-Contrast Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inquiries */}
        <div className="bg-white border border-[#CCE5E1] rounded-xl p-4 shadow-2xs hover:border-[#278C7B]/50 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#4A7C79] font-extrabold tracking-wider">
              Total Inquiries
            </span>
            <div className="p-1.5 bg-[#0F3D3C]/5 rounded-md">
              <Inbox className="w-4 h-4 text-[#0F3D3C]" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#0F3D3C] mt-2">{totalCount}</div>
          <div className="text-[10px] text-[#4A7C79] font-mono mt-1">All logged submissions</div>
        </div>

        {/* New Unread */}
        <div className="bg-gradient-to-br from-blue-600 via-sky-600 to-indigo-700 border border-blue-500 text-white rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-white font-extrabold tracking-wider flex items-center gap-1">
              New Unread
              {newUnreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-white animate-ping inline-block" />
              )}
            </span>
            <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-xs">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-white mt-2">{newUnreadCount}</div>
          <div className="text-[10px] text-blue-100 font-mono mt-1 font-medium">Unopened blue arrivals</div>
        </div>

        {/* General Contact Messages */}
        <div className="bg-gradient-to-br from-teal-50/90 via-emerald-50/50 to-cyan-50/40 border border-teal-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-teal-800 font-extrabold tracking-wider">
              Contact Messages
            </span>
            <div className="p-1.5 bg-teal-100 rounded-md">
              <Users className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-teal-700 mt-2">{contactCount}</div>
          <div className="text-[10px] text-teal-700 font-mono mt-1 font-medium">Public contact form</div>
        </div>

        {/* Stock Sourcing Requests */}
        <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-100/40 border border-amber-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-amber-900 font-extrabold tracking-wider">
              Stock Sourcing
            </span>
            <div className="p-1.5 bg-amber-100 rounded-md">
              <ShoppingBag className="w-4 h-4 text-amber-700" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-800 mt-2">{stockSourcingCount}</div>
          <div className="text-[10px] text-amber-800 font-mono mt-1 font-medium">Unlisted agro-item queries</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-[#CCE5E1] rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4A7C79]" />
          <input
            type="text"
            placeholder="Search ticket #, customer, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAFBF9] border border-[#CCE5E1] rounded-lg pl-9 pr-3 py-2 text-xs text-[#0F3D3C] outline-none focus:border-[#278C7B] focus:ring-2 focus:ring-[#278C7B]/20 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-[#4A7C79] font-mono font-bold">
            <Filter className="w-3.5 h-3.5 text-[#278C7B]" /> Category:
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#FAFBF9] border border-[#CCE5E1] text-[#0F3D3C] text-xs font-mono px-3 py-2 rounded-lg outline-none focus:border-[#278C7B] transition cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="Stock Sourcing Request">Stock Sourcing Requests</option>
            <option value="General Contact">General Contact</option>
            <option value="Partnership Application">Partnership Application</option>
            <option value="Service Request">Service Request</option>
          </select>

          {(searchQuery || categoryFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
              }}
              className="text-[11px] font-mono text-[#278C7B] underline font-bold px-2 py-1 hover:text-[#0F3D3C] transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace (Grid 1/3 Queue, 2/3 Workspace) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Queue Panel (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#CCE5E1] rounded-lg p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#CCE5E1] pb-2 text-xs font-mono font-extrabold uppercase text-[#0F3D3C]">
            <span>Ticket Queue ({filteredInquiries.length})</span>
            <span className="text-[10px] text-blue-600 font-bold font-mono">
              {newUnreadCount} New Blue
            </span>
          </div>

          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {loading ? (
              <div className="text-xs font-mono text-[#4A7C79] p-6 text-center">Loading ticket queue...</div>
            ) : filteredInquiries.length === 0 ? (
              <div className="text-xs font-mono text-[#4A7C79] p-6 text-center border border-dashed border-[#CCE5E1] rounded">
                No support inquiries found matching criteria.
              </div>
            ) : (
              filteredInquiries.map((ticket) => {
                const isOpened = openedTicketIds.has(String(ticket.id));
                const isNewUnopened = !isOpened;
                const isSelected = selectedTicket?.id === ticket.id;

                return (
                  <div
                    key={ticket.id}
                    onClick={() => handleSelectTicket(ticket)}
                    className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all duration-300 ${
                      isNewUnopened
                        ? "bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-700 text-white border-blue-500 shadow-md hover:brightness-105"
                        : isSelected
                        ? "bg-[#E8F4F1] border-[#278C7B] text-[#0F3D3C] shadow-xs"
                        : "bg-white border-[#CCE5E1] text-[#0F3D3C] hover:border-[#278C7B]/60"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className={`font-extrabold ${isNewUnopened ? "text-white" : "text-[#278C7B]"}`}>
                        {ticket.ticketNo}
                      </span>
                      <div className="flex items-center gap-1">
                        {isNewUnopened && (
                          <span className="bg-white/20 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                            ✨ NEW
                          </span>
                        )}
                        <button
                          onClick={(e) => toggleReadState(ticket.id, e)}
                          className={`p-1 rounded hover:bg-black/10 transition text-[10px] ${
                            isNewUnopened ? "text-white" : "text-[#4A7C79]"
                          }`}
                          title={isNewUnopened ? "Mark as Read" : "Mark as Unread (Blue Gradient)"}
                        >
                          {isNewUnopened ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className={`font-bold mt-1.5 line-clamp-1 ${isNewUnopened ? "text-white" : "text-[#0F3D3C]"}`}>
                      {ticket.title}
                    </div>
                    
                    <div className={`flex items-center justify-between text-[10px] font-mono mt-1.5 ${isNewUnopened ? "text-blue-100" : "text-[#4A7C79]"}`}>
                      <span className="font-semibold">{ticket.customerName}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${isNewUnopened ? "bg-white/20 text-white" : "bg-[#0F3D3C]/5 text-[#0F3D3C]"}`}>
                        {ticket.category}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Detail & Action Panel (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-[#CCE5E1] rounded-lg p-6 space-y-5 shadow-xs">
          {selectedTicket ? (
            <>
              {/* Ticket Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#CCE5E1] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#278C7B] font-extrabold">{selectedTicket.ticketNo}</span>
                    <span className="text-[10px] bg-[#E8F4F1] text-[#0F3D3C] px-2 py-0.5 rounded font-mono font-bold border border-[#CCE5E1]">
                      {selectedTicket.category}
                    </span>
                  </div>
                  <h2 className="text-lg font-serif font-bold text-[#0F3D3C] mt-1">{selectedTicket.title}</h2>
                </div>
              </div>

              {/* Customer Contact Dossier */}
              <div className="bg-[#FAFBF9] border border-[#CCE5E1] rounded-lg p-4 space-y-3">
                <div className="text-xs font-mono font-extrabold text-[#0F3D3C] uppercase tracking-wider">
                  Client Contact Dossier
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[#4A7C79] block text-[10px] font-mono">Client Name</span>
                    <strong className="text-[#0F3D3C] font-semibold">{selectedTicket.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-[#4A7C79] block text-[10px] font-mono">Phone Number</span>
                    <strong className="text-[#278C7B] font-semibold">{selectedTicket.customerPhone}</strong>
                  </div>
                  <div>
                    <span className="text-[#4A7C79] block text-[10px] font-mono">Email Address</span>
                    <strong className="text-[#0F3D3C] font-semibold break-all">{selectedTicket.customerEmail}</strong>
                  </div>
                </div>

                {/* Direct Action Outlets */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#CCE5E1]/60">
                  <a
                    href={formatWhatsAppUrl(selectedTicket.customerPhone, selectedTicket.ticketNo, selectedTicket.customerName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20BA56] text-white text-xs font-bold px-3 py-1.5 rounded transition cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Chat on WhatsApp
                  </a>

                  <a
                    href={`tel:${selectedTicket.customerPhone}`}
                    className="inline-flex items-center gap-1.5 bg-[#0F3D3C] hover:bg-[#0A2928] text-white text-xs font-bold px-3 py-1.5 rounded transition cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call Phone
                  </a>

                  <a
                    href={`mailto:${selectedTicket.customerEmail}?subject=Re:%20Mqulima%20Support%20[${selectedTicket.ticketNo}]`}
                    className="inline-flex items-center gap-1.5 bg-white border border-[#CCE5E1] text-[#0F3D3C] hover:bg-[#E8F4F1] text-xs font-bold px-3 py-1.5 rounded transition cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#278C7B]" />
                    Send Email
                  </a>
                </div>
              </div>

              {/* Message History */}
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-[#0F3D3C]">Inquiry Message History</div>
                {selectedTicket.messages && selectedTicket.messages.map((m: any) => (
                  <div key={m.id} className="p-4 rounded-lg bg-[#E8F4F1]/60 border border-[#CCE5E1] text-xs space-y-2">
                    <div className="flex items-center justify-between font-mono text-[10px] text-[#4A7C79]">
                      <span className="font-bold text-[#0F3D3C]">{m.senderName}</span>
                      <span>{m.timestamp}</span>
                    </div>
                    <p className="text-[#2C5E5B] whitespace-pre-line leading-relaxed font-medium">{m.text}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-16 text-center text-[#4A7C79] font-mono text-xs border border-dashed border-[#CCE5E1] rounded">
              Select a support ticket from the left queue to open the resolution workspace.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
