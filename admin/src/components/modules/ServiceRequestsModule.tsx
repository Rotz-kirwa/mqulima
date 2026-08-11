import React, { useState, useEffect } from "react";
import { 
  Wrench, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Tag, 
  Check, 
  X,
  Clock,
  ShieldCheck,
  ListFilter,
  CheckCheck,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Sparkles
} from "lucide-react";
import { adminFetch } from "../../lib/api";

export type FilterTab = "all" | "pending" | "completed" | "cancelled";
export type ViewMode = "table" | "calendar";

export const ServiceRequestsModule: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Live system date/time state
  const [currentTime, setCurrentTime] = useState<string>("");

  // Selected request for the Client & Service Details modal
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Calendar month state
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

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

  const fetchServices = () => {
    setLoading(true);
    setErrorMsg(null);
    adminFetch("/api/admin/services")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success && Array.isArray(data.serviceRequests)) {
          setRequests(data.serviceRequests);
          
          // Auto-adjust calendar to the month of the most recent service booking if available
          if (data.serviceRequests.length > 0) {
            const firstDateStr = data.serviceRequests[0].scheduledDate || data.serviceRequests[0].createdAt;
            if (firstDateStr) {
              const d = new Date(firstDateStr);
              if (!isNaN(d.getTime())) {
                setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
              }
            }
          }

          if (selectedRequest) {
            const updated = data.serviceRequests.find((r: any) => r.id === selectedRequest.id);
            if (updated) setSelectedRequest(updated);
          }
        } else {
          setErrorMsg(data.error || "Failed to load service requests");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch service requests error:", err);
        setErrorMsg(err.message || "Failed to fetch service requests");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleUpdateStatus = async (id: string, targetStatus: string) => {
    setUpdatingStatusId(id);
    try {
      const res = await adminFetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", id, targetStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchServices();
      } else {
        alert(data.error || "Failed to update service status");
      }
    } catch (e: any) {
      console.error("Update status error:", e);
      alert("Error updating status");
    } finally {
      setUpdatingStatusId(null);
    }
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

  // Counts calculation
  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === "requested" || r.status === "assigned" || r.status === "in_progress").length;
  const attendedCount = requests.filter(r => r.status === "completed").length;
  const unattendedCount = requests.filter(r => r.status === "cancelled").length;

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      (r.referenceCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.phone || "").includes(searchTerm) ||
      (r.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.serviceType || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.county || "").toLowerCase().includes(searchTerm.toLowerCase());

    let matchesTab = true;
    if (activeTab === "pending") {
      matchesTab = r.status === "requested" || r.status === "assigned" || r.status === "in_progress";
    } else if (activeTab === "completed") {
      matchesTab = r.status === "completed";
    } else if (activeTab === "cancelled") {
      matchesTab = r.status === "cancelled";
    }

    return matchesSearch && matchesTab;
  });

  // Calendar Helper Functions
  const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    const firstDayIndex = date.getDay();
    
    // Add padding days for previous month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();
  const daysGrid = getDaysInMonth(calendarYear, calendarMonthIndex);

  const prevMonth = () => {
    setCalendarMonth(new Date(calendarYear, calendarMonthIndex - 1, 1));
  };
  const nextMonth = () => {
    setCalendarMonth(new Date(calendarYear, calendarMonthIndex + 1, 1));
  };

  // Find all distinct months where services have been booked
  const availableMonths = Array.from(
    new Set(
      requests.map((r) => {
        const rawDate = r.scheduledDate || r.createdAt;
        if (!rawDate) return null;
        const d = new Date(rawDate);
        return !isNaN(d.getTime()) ? `${d.getFullYear()}-${d.getMonth()}` : null;
      }).filter(Boolean)
    )
  ).map((monthStr) => {
    const [y, m] = (monthStr as string).split("-").map(Number);
    const d = new Date(y, m, 1);
    return {
      key: monthStr as string,
      year: y,
      month: m,
      label: d.toLocaleString("default", { month: "long", year: "numeric" }),
    };
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-[#CCE5E1] pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#0F3D3C] flex items-center gap-2">
            <Wrench className="h-6 w-6 text-[#278C7B]" /> Agronomy Service Desk
          </h1>
          <p className="text-xs text-[#2C5E5B] mt-1">
            Manage farmer requests, inspect service dates & times, and switch between Table and Schedule Calendar views.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Live System Time Badge */}
          <div className="px-3 py-1.5 bg-[#E8F4F1] border border-[#CCE5E1] text-[#0F3D3C] text-xs font-mono font-bold rounded-[6px] flex items-center gap-1.5 shadow-2xs">
            <Clock className="h-3.5 w-3.5 text-[#278C7B] animate-pulse" />
            <span>{currentTime || "Loading time..."}</span>
          </div>

          {/* View Mode Toggle: Table vs Calendar */}
          <div className="bg-white border border-[#CCE5E1] p-0.5 rounded-[6px] flex items-center shadow-2xs">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 text-xs font-bold rounded-[4px] flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-[#0F3D3C] text-white shadow-xs"
                  : "text-[#0F3D3C] hover:bg-[#E8F4F1]"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Table View
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1 text-xs font-bold rounded-[4px] flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === "calendar"
                  ? "bg-[#0F3D3C] text-white shadow-xs"
                  : "text-[#0F3D3C] hover:bg-[#E8F4F1]"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" /> Schedule Calendar
            </button>
          </div>

          <button
            onClick={fetchServices}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#E8F4F1] hover:bg-[#d6ece7] text-[#0F3D3C] text-xs font-bold rounded-[6px] border border-[#CCE5E1] transition cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#278C7B] ${loading ? "animate-spin" : ""}`} /> Refresh Queue
          </button>
        </div>
      </div>

      {/* DISTINCT COLOR CODED FILTER TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#CCE5E1] pb-3">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {/* ALL SERVICES TAB */}
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-xs font-bold rounded-[6px] transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "all"
                ? "bg-[#0F3D3C] text-white shadow-md ring-2 ring-[#278C7B] border border-[#0F3D3C]"
                : "bg-[#E8F4F1] text-[#0F3D3C] hover:bg-[#d5ece7] border border-[#CCE5E1]"
            }`}
          >
            <ListFilter className="h-4 w-4" /> All Services ({totalCount})
          </button>

          {/* NEW / PENDING SERVICES TAB (DEEP HIGH-CONTRAST BLUE) */}
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 text-xs font-bold rounded-[6px] transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "pending"
                ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-400 border border-blue-700 font-extrabold"
                : "bg-blue-200 text-blue-950 hover:bg-blue-300 border border-blue-400 font-bold"
            }`}
          >
            <Clock className="h-4 w-4 text-blue-900" /> New / Pending ({pendingCount})
          </button>

          {/* ATTENDED SERVICES TAB (GREEN GRADIENT / EMERALD) */}
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-2 text-xs font-bold rounded-[6px] transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "completed"
                ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300 border border-emerald-700 font-extrabold"
                : "bg-emerald-100/90 text-emerald-950 hover:bg-emerald-200 border border-emerald-300"
            }`}
          >
            <CheckCheck className="h-4 w-4 text-emerald-900" /> Attended Services ({attendedCount})
          </button>

          {/* UNATTENDED SERVICES TAB (RED GRADIENT / ROSE) */}
          <button
            onClick={() => setActiveTab("cancelled")}
            className={`px-4 py-2 text-xs font-bold rounded-[6px] transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "cancelled"
                ? "bg-rose-600 text-white shadow-md ring-2 ring-rose-300 border border-rose-700 font-extrabold"
                : "bg-rose-100/90 text-rose-950 hover:bg-rose-200 border border-rose-300"
            }`}
          >
            <XCircle className="h-4 w-4 text-rose-900" /> Unattended Services ({unattendedCount})
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#4A7C79]" />
          <input
            type="text"
            placeholder="Search ref, farmer, phone, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#CCE5E1] rounded-[6px] focus:outline-none focus:border-[#278C7B] text-[#0F3D3C]"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 rounded-[6px] p-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* VIEW MODE 1: DATA TABLE VIEW */}
      {viewMode === "table" ? (
        <div className="bg-white border border-[#CCE5E1] rounded-[6px] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#E8F4F1] border-b border-[#CCE5E1] font-mono text-[11px] uppercase text-[#0F3D3C]">
              <tr>
                <th className="p-3">Ref Code</th>
                <th className="p-3">Service Booking Date</th>
                <th className="p-3">Service Required</th>
                <th className="p-3">Client / Account</th>
                <th className="p-3">County Location</th>
                <th className="p-3">Service Status</th>
                <th className="p-3 text-right">Attendance & Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CCE5E1]/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#4A7C79] font-mono">
                    Loading service requests...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#4A7C79]">
                    No service requests found in this category.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const bookingDateStr = req.scheduledDate || req.createdAt;
                  const { date, time } = formatDateTime(bookingDateStr);
                  return (
                    <tr
                      key={req.id}
                      className={`transition-all border-b border-[#CCE5E1]/60 ${
                        req.status === "completed"
                          ? "bg-gradient-to-r from-emerald-50 via-emerald-100/70 to-emerald-50 hover:from-emerald-100 hover:to-emerald-100/90 border-l-4 border-l-emerald-600"
                          : req.status === "cancelled"
                          ? "bg-gradient-to-r from-rose-50 via-rose-100/70 to-rose-50 hover:from-rose-100 hover:to-rose-100/90 border-l-4 border-l-rose-600"
                          : "bg-gradient-to-r from-sky-200/90 via-blue-100 to-sky-100 hover:from-sky-200 hover:to-blue-200 border-l-4 border-l-blue-600 shadow-2xs"
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-[#0F3D3C]">
                        {req.referenceCode}
                        <div className="text-[10px] text-[#4A7C79] font-normal uppercase mt-0.5">
                          {req.channel || "website"}
                        </div>
                      </td>

                      {/* SERVICE BOOKING DATE & TIME COLUMN */}
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

                      <td className="p-3">
                        <div className="font-bold text-[#0F3D3C]">{req.serviceType}</div>
                        {req.notes && (
                          <div className="text-[11px] text-gray-600 italic mt-0.5 max-w-xs truncate" title={req.notes}>
                            "{req.notes}"
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-[#2C5E5B]">
                        <div className="font-bold text-[#0F3D3C]">{req.fullName}</div>
                        <div className="text-[10px] text-[#4A7C79] font-mono">{req.phone}</div>
                        {req.email && req.email !== "Guest / Direct Order" && (
                          <div className="text-[10px] text-teal-800 truncate max-w-[140px]" title={req.email}>{req.email}</div>
                        )}
                      </td>

                      <td className="p-3 font-mono text-[#0F3D3C]">
                        <div className="font-semibold">{req.county}</div>
                        <div className="text-[10px] text-gray-600 font-normal">{req.farmScale}</div>
                      </td>

                      <td className="p-3">
                        {/* INTERACTIVE SERVICE STATUS DROPDOWN */}
                        <div className="flex items-center gap-1">
                          <select
                            value={req.status}
                            disabled={updatingStatusId === req.id}
                            onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                            className={`font-mono text-[11px] uppercase font-extrabold px-3 py-1.5 rounded-[6px] border cursor-pointer focus:outline-none transition-all shadow-xs ${
                              req.status === "completed"
                                ? "bg-emerald-100 border-emerald-400 text-emerald-950 hover:bg-emerald-200"
                                : req.status === "cancelled"
                                ? "bg-rose-100 border-rose-400 text-rose-950 hover:bg-rose-200"
                                : "bg-blue-200 border-blue-500 text-blue-950 hover:bg-blue-300 font-extrabold"
                            }`}
                          >
                            <option value="requested" className="bg-white text-blue-900 font-bold">⏳ New / Pending</option>
                            <option value="completed" className="bg-white text-emerald-900 font-bold">✓ Attended (Completed)</option>
                            <option value="cancelled" className="bg-white text-rose-900 font-bold">✕ Unattended (Cancelled)</option>
                          </select>
                          {updatingStatusId === req.id && (
                            <span className="text-[10px] text-gray-500 font-mono animate-pulse">...</span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Attendance Badge or Action Button */}
                          {req.status === "completed" ? (
                            <span className="px-2.5 py-1 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-[4px] text-[11px] font-extrabold inline-flex items-center gap-1 shadow-2xs">
                              <Check className="h-3.5 w-3.5 text-emerald-700" /> Attended
                            </span>
                          ) : req.status === "cancelled" ? (
                            <span className="px-2.5 py-1 bg-rose-100 border border-rose-300 text-rose-950 rounded-[4px] text-[11px] font-extrabold inline-flex items-center gap-1 shadow-2xs">
                              <X className="h-3.5 w-3.5 text-rose-700" /> Unattended
                            </span>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(req.id, "completed")}
                              disabled={updatingStatusId === req.id}
                              title="Mark as Attended (Completed)"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[4px] text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer shadow-xs"
                            >
                              <Check className="h-3.5 w-3.5" /> Mark Attended
                            </button>
                          )}

                          {/* Full Client & Order Specs Modal Trigger */}
                          <button
                            onClick={() => setSelectedRequest(req)}
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
      ) : (
        /* VIEW MODE 2: INTERACTIVE SCHEDULE CALENDAR CONNECTED TO ALL BOOKING DATES */
        <div className="bg-white border border-[#CCE5E1] rounded-[8px] p-5 shadow-xs space-y-4">
          {/* Calendar Header Navigation & Fast Month Jump */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#CCE5E1] pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-bold font-serif text-[#0F3D3C] flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#278C7B]" />
                {calendarMonth.toLocaleString("default", { month: "long", year: "numeric" })}
              </h2>

              <span className="text-xs font-mono text-[#2C5E5B] bg-[#E8F4F1] px-2 py-0.5 rounded border border-[#CCE5E1] font-bold">
                {filteredRequests.length} Service Bookings
              </span>

              {/* Fast Month Select Dropdown connected to all dates */}
              {availableMonths.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-mono text-[#4A7C79]">Jump Date:</span>
                  <select
                    value={`${calendarYear}-${calendarMonthIndex}`}
                    onChange={(e) => {
                      const [y, m] = e.target.value.split("-").map(Number);
                      setCalendarMonth(new Date(y, m, 1));
                    }}
                    className="text-xs font-mono font-bold bg-[#E8F4F1] border border-[#CCE5E1] text-[#0F3D3C] px-2 py-1 rounded cursor-pointer focus:outline-none"
                  >
                    {availableMonths.map((m) => (
                      <option key={m.key} value={m.key}>
                        📅 {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-1.5 bg-[#E8F4F1] hover:bg-[#d5ece7] text-[#0F3D3C] rounded border border-[#CCE5E1] transition cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCalendarMonth(new Date())}
                className="px-3 py-1 bg-[#0F3D3C] text-white text-xs font-bold rounded transition cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 bg-[#E8F4F1] hover:bg-[#d5ece7] text-[#0F3D3C] rounded border border-[#CCE5E1] transition cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs font-bold text-[#0F3D3C] bg-[#E8F4F1] py-2 rounded">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Month Grid */}
          <div className="grid grid-cols-7 gap-1.5 min-h-[420px]">
            {daysGrid.map((dayDate, idx) => {
              if (!dayDate) {
                return <div key={`empty-${idx}`} className="bg-gray-50/50 rounded border border-gray-100 min-h-[95px]" />;
              }

              const isToday =
                dayDate.getDate() === new Date().getDate() &&
                dayDate.getMonth() === new Date().getMonth() &&
                dayDate.getFullYear() === new Date().getFullYear();

              // Filter bookings matching this specific date (checking scheduledDate OR createdAt)
              const dayBookings = filteredRequests.filter((r) => {
                const rawDateStr = r.scheduledDate || r.createdAt;
                if (!rawDateStr) return false;
                const bd = new Date(rawDateStr);
                return (
                  !isNaN(bd.getTime()) &&
                  bd.getDate() === dayDate.getDate() &&
                  bd.getMonth() === dayDate.getMonth() &&
                  bd.getFullYear() === dayDate.getFullYear()
                );
              });

              return (
                <div
                  key={dayDate.toISOString()}
                  className={`p-2 rounded border flex flex-col justify-between transition-all min-h-[105px] ${
                    isToday
                      ? "bg-teal-50/90 border-[#278C7B] ring-2 ring-[#278C7B]/30"
                      : dayBookings.length > 0
                      ? "bg-emerald-50/40 border-[#278C7B]/40 shadow-2xs"
                      : "bg-white border-[#CCE5E1] hover:border-[#278C7B]"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1 mb-1">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isToday ? "bg-[#0F3D3C] text-white px-1.5 py-0.5 rounded" : "text-[#0F3D3C]"
                      }`}
                    >
                      {dayDate.getDate()}
                    </span>
                    {dayBookings.length > 0 && (
                      <span className="text-[10px] font-mono font-extrabold bg-[#278C7B] text-white px-1.5 py-0.2 rounded-full shadow-2xs">
                        {dayBookings.length} booking{dayBookings.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Booking items list for this date */}
                  <div className="space-y-1 overflow-y-auto max-h-[85px] text-left">
                    {dayBookings.length === 0 ? (
                      <span className="text-[9px] text-gray-400 italic font-mono block pt-2">No bookings</span>
                    ) : (
                      dayBookings.map((b) => {
                        const { time } = formatDateTime(b.scheduledDate || b.createdAt);
                        return (
                          <button
                            key={b.id}
                            onClick={() => setSelectedRequest(b)}
                            className={`w-full text-left p-1.5 rounded text-[10px] font-bold block transition-all cursor-pointer shadow-2xs border ${
                              b.status === "completed"
                                ? "bg-emerald-100 text-emerald-950 border-emerald-300 hover:bg-emerald-200"
                                : b.status === "cancelled"
                                ? "bg-rose-100 text-rose-950 border-rose-300 hover:bg-rose-200"
                                : "bg-blue-200 text-blue-950 border-blue-400 hover:bg-blue-300 font-extrabold"
                            }`}
                            title={`${b.referenceCode} - ${b.serviceType} (${b.fullName})`}
                          >
                            <div className="flex items-center justify-between gap-1 font-mono font-extrabold">
                              <span className="truncate">{b.referenceCode}</span>
                              {time && <span className="text-[9px] font-normal text-gray-600">{time}</span>}
                            </div>
                            <div className="truncate text-[9px] font-bold text-[#0F3D3C] mt-0.5">{b.serviceType}</div>
                            <div className="truncate text-[9px] font-normal text-gray-700">{b.fullName} ({b.county})</div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RICH CLIENT & SERVICE DETAILS MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#CCE5E1] rounded-[10px] shadow-2xl max-w-2xl w-full overflow-hidden text-left animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="bg-[#0F3D3C] text-white p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#3EB8A4] font-bold uppercase tracking-wider">
                    {selectedRequest.referenceCode}
                  </span>
                  <select
                    value={selectedRequest.status}
                    disabled={updatingStatusId === selectedRequest.id}
                    onChange={(e) => handleUpdateStatus(selectedRequest.id, e.target.value)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded font-extrabold uppercase border bg-white/10 text-white border-white/20 cursor-pointer focus:outline-none focus:bg-[#0F3D3C]"
                  >
                    <option value="requested" className="bg-[#0F3D3C] text-blue-300">⏳ New / Pending</option>
                    <option value="completed" className="bg-[#0F3D3C] text-emerald-300">✓ Attended (Completed)</option>
                    <option value="cancelled" className="bg-[#0F3D3C] text-rose-300">✕ Unattended (Cancelled)</option>
                  </select>
                </div>
                <h2 className="text-xl font-bold font-serif mt-1 text-white">
                  {selectedRequest.serviceType}
                </h2>
              </div>

              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Section 1: Client & Account Info */}
              <div className="bg-[#E8F4F1]/60 border border-[#CCE5E1] rounded-[8px] p-4 space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase text-[#0F3D3C] flex items-center gap-2 border-b border-[#CCE5E1] pb-2">
                  <User className="h-4 w-4 text-[#278C7B]" /> Client & Account Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#4A7C79] block text-[11px]">Full Client Name</span>
                    <span className="font-bold text-[#0F3D3C] text-sm">{selectedRequest.fullName}</span>
                  </div>

                  <div>
                    <span className="text-[#4A7C79] block text-[11px]">Phone Number</span>
                    <span className="font-mono font-bold text-[#0F3D3C] flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3 text-[#278C7B]" /> {selectedRequest.phone}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#4A7C79] block text-[11px]">Account Email</span>
                    <span className="font-mono text-[#0F3D3C] flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3 text-[#278C7B]" /> {selectedRequest.email}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#4A7C79] block text-[11px]">County / Location</span>
                    <span className="font-bold text-[#0F3D3C] flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-[#278C7B]" /> {selectedRequest.county}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#4A7C79] block text-[11px]">Farm Scale / Scope</span>
                    <span className="font-medium text-[#0F3D3C]">{selectedRequest.farmScale}</span>
                  </div>

                  <div>
                    <span className="text-[#4A7C79] block text-[11px]">User Account ID</span>
                    <span className="font-mono text-[10px] text-[#4A7C79] block truncate">
                      {selectedRequest.userId || "Guest Checkout (No Account)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Service & Order Specifications */}
              <div className="bg-white border border-[#CCE5E1] rounded-[8px] p-4 space-y-3 shadow-xs">
                <h3 className="text-xs font-mono font-bold uppercase text-[#0F3D3C] flex items-center gap-2 border-b border-[#CCE5E1] pb-2">
                  <Tag className="h-4 w-4 text-[#278C7B]" /> Service Specifications at Large
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#4A7C79] block text-[11px]">Order Reference</span>
                    <span className="font-mono font-bold text-[#0F3D3C]">{selectedRequest.referenceCode}</span>
                  </div>

                  <div>
                    <span className="text-[#4A7C79] block text-[11px]">Booking Channel</span>
                    <span className="font-mono uppercase text-[#0F3D3C] font-bold">{selectedRequest.channel}</span>
                  </div>

                  <div>
                    <span className="text-[#4A7C79] block text-[11px]">Service Booking Date</span>
                    <span className="font-mono text-[#0F3D3C] flex items-center gap-1 mt-0.5 font-bold">
                      <Calendar className="h-3.5 w-3.5 text-[#278C7B]" />
                      {new Date(selectedRequest.scheduledDate || selectedRequest.createdAt).toLocaleString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                      })}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#4A7C79] block text-[11px]">Estimated Cost</span>
                    <span className="font-mono font-bold text-emerald-800 text-sm flex items-center gap-0.5 mt-0.5">
                      KSh {selectedRequest.estimatedCost}
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-[#4A7C79] block text-[11px] mb-1">Farmer Notes & Instructions</span>
                    <div className="bg-gray-50 border border-gray-200 rounded p-2.5 text-xs text-gray-800 italic whitespace-pre-wrap font-sans">
                      "{selectedRequest.notes}"
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Attendance & Service Status Action Bar */}
              <div className="bg-[#E8F4F1] border border-[#CCE5E1] rounded-[8px] p-4 space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase text-[#0F3D3C] flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#278C7B]" /> Service Status & Attendance Controls
                </h3>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#CCE5E1]">
                  <div className="text-xs">
                    <span className="text-[#4A7C79] block text-[11px]">Current Status</span>
                    <span className="font-bold text-[#0F3D3C] uppercase font-mono">
                      {selectedRequest.status === "completed" ? "✓ Attended" : selectedRequest.status === "cancelled" ? "✕ Unattended" : "⏳ Pending"}
                    </span>
                  </div>

                  {/* Status Action Buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.id, "completed")}
                      disabled={updatingStatusId === selectedRequest.id}
                      className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-[6px] text-white flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        selectedRequest.status === "completed"
                          ? "bg-emerald-800 ring-2 ring-emerald-400"
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Mark Attended
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.id, "cancelled")}
                      disabled={updatingStatusId === selectedRequest.id}
                      className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-[6px] text-white flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        selectedRequest.status === "cancelled"
                          ? "bg-rose-800 ring-2 ring-rose-400"
                          : "bg-rose-600 hover:bg-rose-700"
                      }`}
                    >
                      <XCircle className="h-4 w-4" /> Mark Unattended
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#E8F4F1] border-t border-[#CCE5E1] p-3 text-right">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-1.5 bg-[#0F3D3C] hover:bg-[#1E6B5E] text-white text-xs font-bold rounded-[6px] transition cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
