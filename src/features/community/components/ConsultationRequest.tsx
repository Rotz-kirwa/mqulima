import React, { useState } from "react";
import { PhoneCall, CheckCircle2, ShieldCheck, Stethoscope } from "lucide-react";
import { communityService } from "../services/community.service";
import { toast } from "sonner";
import { ConsultationTicket } from "../types/community.types";

interface Props {
  currentUser: any;
}

export const ConsultationRequest: React.FC<Props> = ({ currentUser }) => {
  const [name, setName] = useState(currentUser?.name || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [county, setCounty] = useState(currentUser?.county || "Uasin Gishu");
  const [specialty, setSpecialty] = useState("Crop & Soil Agronomy");
  const [channel, setChannel] = useState<"call" | "whatsapp" | "visit">("whatsapp");
  const [urgency, setUrgency] = useState<"normal" | "urgent" | "emergency">("normal");
  const [message, setMessage] = useState("");
  const [submittedTicket, setSubmittedTicket] = useState<ConsultationTicket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !message) {
      toast.error("Please provide a phone number and describe your farm issue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await communityService.requestConsultation({
        name: name || currentUser?.name || "Farmer Client",
        phone,
        county,
        specialty,
        channel,
        urgency,
        message,
      });

      const ticket: ConsultationTicket = {
        id: res.ticketId || `MQ-TICK-${Math.floor(1000 + Math.random() * 9000)}`,
        name: name || currentUser?.name || "Farmer Client",
        phone,
        county,
        specialty,
        channel,
        urgency,
        message,
        assignedConsultant: specialty.includes("Livestock")
          ? "Mqulima Veterinary Extension Desk"
          : "Mqulima Senior Agronomy Helpdesk",
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setSubmittedTicket(ticket);
      toast.success(`Consultation ticket ${ticket.id} registered!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to submit consultation request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-[#0C1510] border border-[#1B3627] p-6 rounded-2xl space-y-4">
      <div className="flex items-center gap-3 border-b border-[#1B3627] pb-4">
        <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#4CAF50] flex items-center justify-center">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Mqulima Expert Agronomy Consultation</h2>
          <p className="text-xs text-white/60">Request direct extension assistance from certified agronomists and veterinarians.</p>
        </div>
      </div>

      {submittedTicket ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-xl space-y-3 text-center">
          <CheckCircle2 className="h-10 w-10 text-[#4CAF50] mx-auto" />
          <h3 className="text-sm font-bold text-white">Consultation Ticket Dispatch Confirmed!</h3>
          <p className="text-xs text-white/80">
            Ticket ID: <strong className="text-[#4CAF50]">{submittedTicket.id}</strong> — Assigned to {submittedTicket.assignedConsultant}.
          </p>
          <button
            onClick={() => setSubmittedTicket(null)}
            className="mt-2 bg-[#2D6A4F] text-white px-4 py-2 rounded-xl text-xs font-bold"
          >
            Submit Another Ticket
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-white/60 mb-1">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full bg-black/40 border border-[#1B3627] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#4CAF50]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-white/60 mb-1">Phone Number (Required)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712345678"
                className="w-full bg-black/40 border border-[#1B3627] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#4CAF50]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-white/60 mb-1">Specialty Field</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full bg-black/40 border border-[#1B3627] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#4CAF50]"
              >
                <option value="Crop & Soil Agronomy">Crop & Soil Agronomy</option>
                <option value="Livestock & Veterinary Health">Livestock & Veterinary Health</option>
                <option value="Irrigation & Greenhouse Design">Irrigation & Greenhouse Design</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-white/60 mb-1">Preferred Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                className="w-full bg-black/40 border border-[#1B3627] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#4CAF50]"
              >
                <option value="whatsapp">WhatsApp Direct Chat</option>
                <option value="call">Direct Voice Call</option>
                <option value="visit">Physical Farm Visit</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-white/60 mb-1">Describe Farm Issue / Diagnostics Needed</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., My tomatoes are showing yellowing leaves with dark brown spots on lower leaves..."
              className="w-full bg-black/40 border border-[#1B3627] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#4CAF50] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#2D6A4F] text-white py-3 rounded-xl text-xs font-bold hover:bg-[#224f3b] disabled:opacity-50 transition-colors shadow-md"
          >
            {isSubmitting ? "Transmitting Ticket..." : "Submit Consultation Request"}
          </button>
        </form>
      )}
    </div>
  );
};
