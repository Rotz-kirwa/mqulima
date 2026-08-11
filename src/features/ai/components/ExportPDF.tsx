import React, { useState } from "react";
import { Download, FileText, Share2, Check } from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { Message, Conversation } from "../types/ai.types";

interface Props {
  messages: Message[];
  activeConversation?: Conversation;
  userName: string;
}

export const ExportPDF: React.FC<Props> = ({
  messages,
  activeConversation,
  userName,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const title = activeConversation ? activeConversation.title : "Mqulima AI Chat";

  const handleExportMarkdown = () => {
    if (messages.length === 0) return;
    let mdText = `# ${title}\nGenerated on ${new Date().toLocaleDateString()} via Mqulima AI\n\n---\n\n`;
    for (const msg of messages) {
      const label = msg.role === "user" ? "Farmer" : "Mqulima AI";
      mdText += `### **${label}**\n${msg.content}\n\n`;
    }

    const blob = new Blob([mdText], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "_")}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Markdown exported");
    setIsOpen(false);
  };

  const handleExportJSON = () => {
    if (messages.length === 0) return;
    const payload = {
      title,
      exportedAt: new Date().toISOString(),
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "_")}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("JSON exported");
    setIsOpen(false);
  };

  const handleExportPDF = () => {
    if (messages.length === 0) return;
    try {
      const doc = new jsPDF();
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(17, 47, 32);
      doc.text(title, 20, 20);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on ${new Date().toLocaleDateString()} from Mqulima AI`, 20, 28);
      doc.line(20, 32, 190, 32);

      let y = 42;
      doc.setFontSize(10);
      for (const msg of messages) {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }

        const roleText = msg.role === "user" ? `${userName} (Farmer)` : "Mqulima AI Expert";
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(msg.role === "user" ? 45 : 17, msg.role === "user" ? 106 : 47, msg.role === "user" ? 79 : 32);
        doc.text(`${roleText}:`, 20, y);
        y += 6;

        doc.setFont("Helvetica", "normal");
        doc.setTextColor(30, 30, 30);
        const cleanContent = msg.content.replace(/[*#`_\-]/g, "").trim();
        const splitContent = doc.splitTextToSize(cleanContent, 170);
        for (const line of splitContent) {
          if (y > 275) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 20, y);
          y += 5.5;
        }
        y += 6;
      }
      doc.save(`${title.toLowerCase().replace(/\s+/g, "_")}.pdf`);
      toast.success("PDF exported");
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF.");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={messages.length === 0}
        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-40 transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Export</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-[#1B3627] bg-[#0C1510] p-1.5 shadow-xl z-20 space-y-1">
          <button
            onClick={handleExportPDF}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-red-400" />
            PDF Document
          </button>
          <button
            onClick={handleExportMarkdown}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Share2 className="h-3.5 w-3.5 text-emerald-400" />
            Markdown File
          </button>
          <button
            onClick={handleExportJSON}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-blue-400" />
            JSON Format
          </button>
        </div>
      )}
    </div>
  );
};
