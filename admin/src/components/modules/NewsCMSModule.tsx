import React, { useState, useEffect, useRef } from "react";
import {
  Newspaper,
  Plus,
  Edit,
  Trash2,
  X,
  Image as ImageIcon,
  Video as VideoIcon,
  Upload,
  Link as LinkIcon,
  CheckCircle,
  Clock,
  Loader2,
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { adminFetch } from "../../lib/api";

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  category: string;
  sourceAttribution: string;
  status: "draft" | "published";
  publishedAt: string | null;
  createdAt: string;
}

export const NewsCMSModule: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor Modal States
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Policy & Market");
  const [sourceAttribution, setSourceAttribution] = useState("Mqulima Editorial Desk");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [mediaInputTab, setMediaInputTab] = useState<"upload" | "url">("upload");
  const [mediaUrl, setMediaUrl] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");

  // Validation States
  const [titleError, setTitleError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/news");
      const data = await res.json();
      if (data.success) {
        setArticles(data.articles || []);
      } else {
        toast.error("Failed to load news articles: " + (data.error || ""));
      }
    } catch (e) {
      console.error("Error fetching articles:", e);
      toast.error("Network error while fetching news articles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const openNewArticleModal = () => {
    setEditingId(null);
    setTitle("");
    setCategory("Policy & Market");
    setSourceAttribution("Mqulima Editorial Desk");
    setMediaType("image");
    setMediaInputTab("upload");
    setMediaUrl("");
    setContent("");
    setSummary("");
    setTitleError(null);
    setMediaError(null);
    setShowEditor(true);
  };

  const openEditModal = (article: Article) => {
    setEditingId(article.id);
    setTitle(article.title);
    setCategory(article.category || "Policy & Market");
    setSourceAttribution(article.sourceAttribution || "Mqulima Editorial Desk");
    setMediaType(article.mediaType || "image");
    setMediaInputTab(article.mediaUrl?.startsWith("data:") ? "upload" : "url");
    setMediaUrl(article.mediaUrl || "");
    setContent(article.content || "");
    setSummary(article.summary || "");
    setTitleError(null);
    setMediaError(null);
    setShowEditor(true);
  };

  // Media File Handler with Type and Size Validation
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMediaError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (mediaType === "image") {
      if (!file.type.startsWith("image/")) {
        setMediaError("Invalid file type. Please upload an image (PNG, JPG, WEBP, GIF).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMediaError("Image size exceeds limit. Maximum allowed size is 5MB.");
        return;
      }
    } else {
      if (!file.type.startsWith("video/")) {
        setMediaError("Invalid file type. Please upload a video (MP4, WEBM, MOV).");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setMediaError("Video size exceeds limit. Maximum allowed size is 50MB.");
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setMediaUrl(event.target.result as string);
        toast.success(`${mediaType === "image" ? "Image" : "Video"} loaded successfully!`);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (showEditor && editorRef.current) {
      editorRef.current.innerHTML = content;
    }
  }, [showEditor]);

  // Rich Text Editor Commands
  const formatText = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    if (command === "createLink") {
      const url = prompt("Enter hyperlink URL (e.g. https://example.com):");
      if (url) {
        document.execCommand("createLink", false, url);
      }
    } else {
      document.execCommand(command, false, value);
    }
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleSave = async (status: "draft" | "published") => {
    setTitleError(null);
    setMediaError(null);

    if (!title.trim()) {
      setTitleError("Article title is required.");
      return;
    }
    if (title.trim().length > 150) {
      setTitleError("Article title cannot exceed 150 characters.");
      return;
    }

    const currentContent = editorRef.current ? editorRef.current.innerHTML : content;

    if (!currentContent.trim() || currentContent === "<br>") {
      toast.error("Article content cannot be empty.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        id: editingId,
        title: title.trim(),
        category,
        sourceAttribution,
        mediaType,
        mediaUrl,
        summary: summary || title.trim(),
        content: currentContent,
        status,
      };

      const res = await adminFetch("/api/admin/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          status === "published"
            ? "Article published live to public news desk!"
            : "Article saved as draft."
        );
        setShowEditor(false);
        fetchArticles();
      } else {
        toast.error(data.error || "Failed to save article.");
      }
    } catch (e) {
      console.error("Save article error:", e);
      toast.error("Network error while saving article.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article? This action cannot be undone.")) return;

    try {
      const res = await adminFetch(`/api/admin/news?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Article deleted successfully.");
        fetchArticles();
      } else {
        toast.error(data.error || "Failed to delete article.");
      }
    } catch (e) {
      console.error("Delete article error:", e);
      toast.error("Failed to delete article.");
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* CMS Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#CCE5E1] pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#0F3D3C]">Agritech News & Press CMS</h1>
          <p className="text-xs text-[#2C5E5B] mt-1 font-medium">
            Publish regional agricultural news, market bulletins, videos, and weather advisory posts.
          </p>
        </div>
        <button
          onClick={openNewArticleModal}
          className="px-4 py-2.5 bg-[#278C7B] hover:bg-[#1E6B5E] text-white text-xs font-bold rounded-lg shadow-md cursor-pointer flex items-center gap-2 transition"
        >
          <Plus className="h-4 w-4" /> Create New Article
        </button>
      </div>

      {/* Articles Management Table */}
      <div className="bg-white border border-[#CCE5E1] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 bg-[#F4F9F8] border-b border-[#CCE5E1] flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-[#0F3D3C] uppercase tracking-wider flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-[#278C7B]" />
            Published & Draft Articles ({articles.length})
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-[#E8F4F1] border-b border-[#CCE5E1] font-mono text-[11px] uppercase text-[#0F3D3C]">
            <tr>
              <th className="p-3.5">Media</th>
              <th className="p-3.5">Article Title</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Date</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#CCE5E1]/60 font-sans">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#4A7C79]">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#278C7B]" />
                    <span className="font-mono text-xs">Loading Agritech news articles...</span>
                  </div>
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#4A7C79] font-mono">
                  No articles found. Click "Create New Article" to publish one.
                </td>
              </tr>
            ) : (
              articles.map((art) => (
                <tr key={art.id} className="hover:bg-[#E8F4F1]/40 transition">
                  <td className="p-3.5">
                    <div className="w-12 h-12 rounded-lg border border-[#CCE5E1] bg-[#F4F9F8] overflow-hidden flex items-center justify-center shrink-0">
                      {art.mediaUrl ? (
                        art.mediaType === "video" ? (
                          <div className="relative w-full h-full bg-slate-900 flex items-center justify-center text-white">
                            <VideoIcon className="w-5 h-5 text-amber-400" />
                          </div>
                        ) : (
                          <img src={art.mediaUrl} alt={art.title} className="w-full h-full object-cover" />
                        )
                      ) : (
                        <ImageIcon className="w-5 h-5 text-[#4A7C79]" />
                      )}
                    </div>
                  </td>
                  <td className="p-3.5 max-w-xs">
                    <span className="font-bold text-[#0F3D3C] line-clamp-2 leading-snug">{art.title}</span>
                    <span className="text-[10px] text-[#4A7C79] block mt-0.5 font-mono">{art.sourceAttribution}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-1 rounded bg-[#E8F4F1] border border-[#CCE5E1] text-[#0F3D3C] text-[10px] font-bold">
                      {art.category}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`font-mono text-[10px] uppercase font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit ${
                        art.status === "published"
                          ? "bg-emerald-50 border border-emerald-300 text-emerald-800"
                          : "bg-amber-50 border border-amber-300 text-amber-800"
                      }`}
                    >
                      {art.status === "published" ? (
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Clock className="w-3 h-3 text-amber-600" />
                      )}
                      {art.status}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[#4A7C79] text-[11px]">
                    {art.publishedAt
                      ? new Date(art.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : new Date(art.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(art)}
                        className="p-1.5 rounded bg-teal-50 border border-teal-200 text-[#278C7B] hover:bg-[#278C7B] hover:text-white transition cursor-pointer"
                        title="Edit Article"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(art.id)}
                        className="p-1.5 rounded bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                        title="Delete Article"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white border border-[#CCE5E1] rounded-2xl max-w-3xl w-full text-left space-y-6 shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#CCE5E1] pb-4">
              <div>
                <h2 className="text-xl font-serif font-bold text-[#0F3D3C]">
                  {editingId ? "Edit Agritech Article" : "Create New Agritech Article"}
                </h2>
                <p className="text-xs text-[#2C5E5B] mt-0.5">
                  Publish rich agricultural intelligence with custom images or video media.
                </p>
              </div>
              <button
                onClick={() => setShowEditor(false)}
                className="p-1.5 text-[#4A7C79] hover:text-[#0F3D3C] rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Inputs */}
            <div className="space-y-5">
              
              {/* 1. Article Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold uppercase text-[#0F3D3C]">
                    Article Title <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[11px] font-mono ${title.length > 150 ? "text-rose-600 font-bold" : "text-[#4A7C79]"}`}>
                    {title.length}/150
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={150}
                  value={title || ""}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (titleError) setTitleError(null);
                  }}
                  placeholder="e.g. Ministry Releases Q3 Harvest Forecast & Fertilizer Guidelines"
                  className={`w-full bg-[#F4F9F8] border ${
                    titleError ? "border-rose-500 focus:ring-rose-200" : "border-[#CCE5E1] focus:border-[#278C7B]"
                  } p-3 rounded-xl text-xs font-semibold text-[#0F3D3C] focus:outline-none focus:ring-2 focus:ring-[#278C7B]/20 transition`}
                />
                {titleError && (
                  <p className="text-rose-600 text-[11px] font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {titleError}
                  </p>
                )}
              </div>

              {/* Category & Attribution Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-[#0F3D3C]">Category</label>
                  <select
                    value={category || "Policy & Market"}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#F4F9F8] border border-[#CCE5E1] p-3 rounded-xl text-xs font-semibold text-[#0F3D3C] outline-none"
                  >
                    <option value="Policy & Market">Policy & Market</option>
                    <option value="Agronomy & Farm Tips">Agronomy & Farm Tips</option>
                    <option value="Agri-Tech & Tools">Agri-Tech & Tools</option>
                    <option value="Weather Advisory">Weather Advisory</option>
                    <option value="Livestock & Dairy">Livestock & Dairy</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-[#0F3D3C]">Source Attribution</label>
                  <input
                    type="text"
                    value={sourceAttribution || ""}
                    onChange={(e) => setSourceAttribution(e.target.value)}
                    placeholder="e.g. KALRO / Mqulima Desk"
                    className="w-full bg-[#F4F9F8] border border-[#CCE5E1] p-3 rounded-xl text-xs font-semibold text-[#0F3D3C] outline-none"
                  />
                </div>
              </div>

              {/* 2. Featured Media Selection */}
              <div className="space-y-2 border border-[#CCE5E1] rounded-xl p-4 bg-[#F8FCFB]">
                <div className="flex items-center justify-between pb-2 border-b border-[#CCE5E1]/60">
                  <label className="text-xs font-mono font-bold uppercase text-[#0F3D3C]">
                    Featured Media
                  </label>

                  {/* Media Type Toggle */}
                  <div className="flex items-center bg-[#E8F4F1] p-1 rounded-lg border border-[#CCE5E1]">
                    <button
                      type="button"
                      onClick={() => {
                        setMediaType("image");
                        setMediaError(null);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                        mediaType === "image" ? "bg-[#278C7B] text-white shadow-xs" : "text-[#0F3D3C] hover:bg-white/50"
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaType("video");
                        setMediaError(null);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                        mediaType === "video" ? "bg-[#278C7B] text-white shadow-xs" : "text-[#0F3D3C] hover:bg-white/50"
                      }`}
                    >
                      <VideoIcon className="w-3.5 h-3.5" />
                      <span>Video</span>
                    </button>
                  </div>
                </div>

                {/* Input Method Tabs */}
                <div className="flex items-center gap-4 text-xs font-semibold text-[#2C5E5B] pt-1">
                  <button
                    type="button"
                    onClick={() => setMediaInputTab("upload")}
                    className={`flex items-center gap-1.5 pb-1 border-b-2 transition cursor-pointer ${
                      mediaInputTab === "upload" ? "border-[#278C7B] text-[#0F3D3C] font-bold" : "border-transparent text-gray-500"
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaInputTab("url")}
                    className={`flex items-center gap-1.5 pb-1 border-b-2 transition cursor-pointer ${
                      mediaInputTab === "url" ? "border-[#278C7B] text-[#0F3D3C] font-bold" : "border-transparent text-gray-500"
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Paste Direct URL</span>
                  </button>
                </div>

                {/* Media Input Area */}
                {mediaInputTab === "upload" ? (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept={mediaType === "image" ? "image/*" : "video/*"}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#278C7B]/40 hover:border-[#278C7B] bg-white rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#E8F4F1] group-hover:bg-[#278C7B] group-hover:text-white text-[#278C7B] flex items-center justify-center transition">
                        {mediaType === "image" ? <ImageIcon className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
                      </div>
                      <p className="text-xs font-bold text-[#0F3D3C]">
                        Click to select or drag & drop {mediaType === "image" ? "an Image" : "a Video"}
                      </p>
                      <p className="text-[11px] text-[#4A7C79]">
                        {mediaType === "image" ? "PNG, JPG, WEBP up to 5MB" : "MP4, WEBM, MOV up to 50MB"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder={`https://example.com/media.${mediaType === "image" ? "jpg" : "mp4"}`}
                      className="w-full bg-white border border-[#CCE5E1] p-3 rounded-xl text-xs text-[#0F3D3C] font-mono outline-none focus:border-[#278C7B]"
                    />
                  </div>
                )}

                {mediaError && (
                  <p className="text-rose-600 text-[11px] font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {mediaError}
                  </p>
                )}

                {/* Media Preview Box */}
                {mediaUrl && (
                  <div className="mt-3 relative rounded-xl overflow-hidden border border-[#CCE5E1] bg-black/90 group">
                    {mediaType === "image" ? (
                      <img src={mediaUrl} alt="Preview" className="w-full max-h-56 object-cover" />
                    ) : (
                      <video src={mediaUrl} controls className="w-full max-h-56 object-contain" />
                    )}

                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black text-white text-xs font-bold backdrop-blur-xs transition shadow-md cursor-pointer"
                      >
                        Replace Media
                      </button>
                      <button
                        type="button"
                        onClick={() => setMediaUrl("")}
                        className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition shadow-md cursor-pointer"
                        title="Remove Media"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Article Content (Rich Text Editor) */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase text-[#0F3D3C]">
                  Article Content <span className="text-rose-500">*</span>
                </label>

                {/* Formatting Toolbar */}
                <div className="bg-[#E8F4F1] border border-[#CCE5E1] border-b-0 rounded-t-xl p-2 flex flex-wrap items-center gap-1 text-[#0F3D3C]">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => formatText("bold")}
                    className="p-1.5 rounded hover:bg-white transition cursor-pointer font-bold"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => formatText("italic")}
                    className="p-1.5 rounded hover:bg-white transition cursor-pointer italic"
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => formatText("underline")}
                    className="p-1.5 rounded hover:bg-white transition cursor-pointer underline"
                    title="Underline"
                  >
                    <Underline className="w-4 h-4" />
                  </button>
                  <div className="h-4 w-px bg-[#CCE5E1] mx-1" />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => formatText("formatBlock", "<h2>")}
                    className="p-1.5 rounded hover:bg-white transition cursor-pointer flex items-center text-xs font-serif font-bold"
                    title="Heading 2"
                  >
                    <Heading2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => formatText("formatBlock", "<h3>")}
                    className="p-1.5 rounded hover:bg-white transition cursor-pointer flex items-center text-xs font-serif font-bold"
                    title="Heading 3"
                  >
                    <Heading3 className="w-4 h-4" />
                  </button>
                  <div className="h-4 w-px bg-[#CCE5E1] mx-1" />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => formatText("insertUnorderedList")}
                    className="p-1.5 rounded hover:bg-white transition cursor-pointer"
                    title="Bullet List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => formatText("insertOrderedList")}
                    className="p-1.5 rounded hover:bg-white transition cursor-pointer"
                    title="Numbered List"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => formatText("formatBlock", "<blockquote>")}
                    className="p-1.5 rounded hover:bg-white transition cursor-pointer"
                    title="Quote"
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => formatText("createLink")}
                    className="p-1.5 rounded hover:bg-white transition cursor-pointer"
                    title="Insert Link"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Content Editable Area */}
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={() => {
                    if (editorRef.current) setContent(editorRef.current.innerHTML);
                  }}
                  onBlur={() => {
                    if (editorRef.current) setContent(editorRef.current.innerHTML);
                  }}
                  className="w-full min-h-[220px] max-h-[350px] overflow-y-auto bg-[#F4F9F8] border border-[#CCE5E1] rounded-b-xl p-4 text-xs font-sans text-[#0F3D3C] focus:outline-none focus:ring-2 focus:ring-[#278C7B]/20 leading-relaxed space-y-2 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-[#278C7B] [&_blockquote]:pl-3 [&_blockquote]:italic [&_a]:text-[#0F766E] [&_a]:underline"
                />
              </div>

            </div>

            {/* 4. Publishing Controls Footer */}
            <div className="flex items-center justify-between border-t border-[#CCE5E1] pt-4">
              <button
                type="button"
                onClick={() => setShowEditor(false)}
                className="px-4 py-2.5 rounded-xl border border-[#CCE5E1] text-[#0F3D3C] font-bold text-xs hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave("draft")}
                  className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save as Draft"}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave("published")}
                  className="px-5 py-2.5 rounded-xl bg-[#278C7B] hover:bg-[#1E6B5E] text-white font-bold text-xs transition shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Publish Article</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
