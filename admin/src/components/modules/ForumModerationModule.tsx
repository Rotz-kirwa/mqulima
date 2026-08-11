import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Trash2, 
  VolumeX, 
  CheckCircle2, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Search, 
  Filter, 
  UserX, 
  Sliders, 
  Plus, 
  X, 
  MessageSquare,
  FileText,
  Heart,
  Tag,
  Clock,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon
} from "lucide-react";

import { adminFetch } from "../../lib/api";

export const ForumModerationModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"reports" | "posts" | "users" | "settings">("posts");
  const [reports, setReports] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [restrictedUsers, setRestrictedUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    spamDetectionEnabled: true,
    blockExternalLinks: false,
    autoFlagReportThreshold: 3,
    offensiveWordsList: ["scam", "fake", "hacked", "weed", "casino", "betting"],
  });
  const [stats, setStats] = useState<any>({
    totalPosts: 0,
    pendingReports: 0,
    restrictedUsers: 0,
    hiddenPosts: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [reportStatusFilter, setReportStatusFilter] = useState("pending");
  const [postSearchQuery, setPostSearchQuery] = useState("");
  const [postStatusFilter, setPostStatusFilter] = useState("all");
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);

  // Settings state
  const [newKeyword, setNewKeyword] = useState("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  const fetchModerationData = () => {
    setLoading(true);
    adminFetch("/api/admin/forum-moderation")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setReports(data.reports || []);
          setPosts(data.posts || []);
          setRestrictedUsers(data.restrictedUsers || []);
          if (data.settings) setSettings(data.settings);
          if (data.stats) setStats(data.stats);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchModerationData();
  }, []);

  const triggerAction = async (payload: any) => {
    try {
      const res = await adminFetch("/api/admin/forum-moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(data.message || "Action executed successfully.");
        setTimeout(() => setActionSuccessMsg(""), 4000);
        fetchModerationData();
      }
    } catch (e) {
      console.error("Moderation action error:", e);
    }
  };

  // Filtered Reports & Posts
  const filteredReports = reports.filter((r) => {
    if (reportStatusFilter === "all") return true;
    return r.status === reportStatusFilter;
  });

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.title?.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
      p.caption?.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
      p.authorName?.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
      p.authorUsername?.toLowerCase().includes(postSearchQuery.toLowerCase());

    const matchesStatus =
      postStatusFilter === "all" ? true : (p.status || "published").toLowerCase() === postStatusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    const clean = newKeyword.trim().toLowerCase();
    if (!settings.offensiveWordsList.includes(clean)) {
      setSettings((prev: any) => ({
        ...prev,
        offensiveWordsList: [...prev.offensiveWordsList, clean],
      }));
    }
    setNewKeyword("");
  };

  const handleRemoveKeyword = (wordToRemove: string) => {
    setSettings((prev: any) => ({
      ...prev,
      offensiveWordsList: prev.offensiveWordsList.filter((w: string) => w !== wordToRemove),
    }));
  };

  const handleSaveSettings = () => {
    triggerAction({
      action: "update_settings",
      settings,
    });
  };

  const resolveAvatar = (avatarUrl: string | null, name: string) => {
    if (avatarUrl && (avatarUrl.startsWith("http") || avatarUrl.startsWith("data:"))) {
      return avatarUrl;
    }
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || "Farmer")}&backgroundColor=1a5438&textColor=ffffff`;
  };

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#CCE5E1] pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#0F3D3C] flex items-center gap-2.5">
            <div className="p-2 bg-[#E8F4F1] rounded-lg border border-[#CCE5E1]">
              <ShieldAlert className="w-5 h-5 text-[#278C7B]" />
            </div>
            Community Forum & Moderation Desk
          </h1>
          <p className="text-xs text-[#2C5E5B] mt-1">
            Real-time visual oversight of main site community posts, comments, user sanctions, and automated safety rules.
          </p>
        </div>

        <button
          onClick={fetchModerationData}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-[#E8F4F1] hover:bg-[#D4ECE6] text-[#0F3D3C] text-xs font-bold px-4 py-2.5 rounded-lg border border-[#CCE5E1] shadow-2xs transition cursor-pointer active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#278C7B]" : ""}`} />
          Refresh Moderation Desk
        </button>
      </div>

      {/* Alert Banner */}
      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-mono font-bold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {actionSuccessMsg}
          </div>
          <button onClick={() => setActionSuccessMsg("")} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Forum Posts */}
        <div className="bg-white border border-[#CCE5E1] rounded-xl p-4 shadow-2xs hover:border-[#278C7B]/50 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#4A7C79] font-extrabold tracking-wider">
              Total Community Posts
            </span>
            <div className="p-1.5 bg-[#0F3D3C]/5 rounded-md">
              <MessageSquare className="w-4 h-4 text-[#0F3D3C]" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#0F3D3C] mt-2">{stats.totalPosts}</div>
          <div className="text-[10px] text-[#4A7C79] font-mono mt-1">Live active discussions</div>
        </div>

        {/* Pending Reports */}
        <div className="bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 text-white rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-extrabold tracking-wider flex items-center gap-1.5">
              Pending Reports
              {stats.pendingReports > 0 && (
                <span className="w-2 h-2 rounded-full bg-white animate-ping inline-block" />
              )}
            </span>
            <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-xs">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-white mt-2">{stats.pendingReports}</div>
          <div className="text-[10px] text-rose-100 font-mono mt-1 font-medium">Flagged by community</div>
        </div>

        {/* Restricted / Muted Users */}
        <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-yellow-50/40 border border-amber-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-amber-800 font-extrabold tracking-wider">
              Restricted Users
            </span>
            <div className="p-1.5 bg-amber-100 rounded-md">
              <VolumeX className="w-4 h-4 text-amber-700" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-700 mt-2">{stats.restrictedUsers}</div>
          <div className="text-[10px] text-amber-700 font-mono mt-1 font-medium">Muted or suspended</div>
        </div>

        {/* Hidden / Flagged Content */}
        <div className="bg-gradient-to-br from-teal-50/90 via-emerald-50/50 to-cyan-50/40 border border-teal-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-teal-800 font-extrabold tracking-wider">
              Hidden Posts
            </span>
            <div className="p-1.5 bg-teal-100 rounded-md">
              <EyeOff className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-teal-700 mt-2">{stats.hiddenPosts}</div>
          <div className="text-[10px] text-teal-700 font-mono mt-1 font-medium">Removed from public feed</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#CCE5E1] pb-3">
        <button
          onClick={() => setActiveTab("posts")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
            activeTab === "posts"
              ? "bg-[#0F3D3C] text-white shadow-xs"
              : "bg-white text-[#4A7C79] border border-[#CCE5E1] hover:bg-[#E8F4F1] hover:text-[#0F3D3C]"
          }`}
        >
          <FileText className="w-4 h-4" />
          Community Posts Inspector ({posts.length})
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
            activeTab === "reports"
              ? "bg-[#0F3D3C] text-white shadow-xs"
              : "bg-white text-[#4A7C79] border border-[#CCE5E1] hover:bg-[#E8F4F1] hover:text-[#0F3D3C]"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Flagged Reports ({reports.length})
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
            activeTab === "users"
              ? "bg-[#0F3D3C] text-white shadow-xs"
              : "bg-white text-[#4A7C79] border border-[#CCE5E1] hover:bg-[#E8F4F1] hover:text-[#0F3D3C]"
          }`}
        >
          <UserX className="w-4 h-4" />
          User Sanctions ({restrictedUsers.length})
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
            activeTab === "settings"
              ? "bg-[#0F3D3C] text-white shadow-xs"
              : "bg-white text-[#4A7C79] border border-[#CCE5E1] hover:bg-[#E8F4F1] hover:text-[#0F3D3C]"
          }`}
        >
          <Sliders className="w-4 h-4" />
          Automated Safety Rules
        </button>
      </div>

      {/* TAB 1: RICH COMMUNITY POSTS INSPECTOR (REPLICATED FROM MAIN SITE FEED WITH ADMIN CONTROLS) */}
      {activeTab === "posts" && (
        <div className="space-y-5">
          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-[#CCE5E1] rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4A7C79]" />
              <input
                type="text"
                placeholder="Search post title, caption, author..."
                value={postSearchQuery}
                onChange={(e) => setPostSearchQuery(e.target.value)}
                className="w-full bg-[#FAFBF9] border border-[#CCE5E1] rounded-lg pl-9 pr-3 py-2 text-xs text-[#0F3D3C] outline-none focus:border-[#278C7B]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#4A7C79]">
                <Filter className="w-3.5 h-3.5 text-[#278C7B]" /> Status:
              </div>
              <select
                value={postStatusFilter}
                onChange={(e) => setPostStatusFilter(e.target.value)}
                className="bg-[#FAFBF9] border border-[#CCE5E1] text-[#0F3D3C] text-xs font-mono px-3 py-2 rounded-lg outline-none focus:border-[#278C7B]"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="hidden">Hidden</option>
                <option value="flagged">Flagged</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>
          </div>

          {/* Posts Feed Cards Grid */}
          <div className="space-y-4">
            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-[#4A7C79] bg-white border border-[#CCE5E1] rounded-xl">
                Loading community forum posts...
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-[#4A7C79] bg-white border border-dashed border-[#CCE5E1] rounded-xl">
                No community forum posts found matching search criteria.
              </div>
            ) : (
              filteredPosts.map((post) => {
                const isHidden = post.status === "hidden" || post.status === "deleted";
                const isCommentsExpanded = expandedCommentsPostId === post.id;
                const avatar = resolveAvatar(post.authorAvatar, post.authorName);

                return (
                  <div
                    key={post.id}
                    className={`bg-white border rounded-xl shadow-2xs overflow-hidden transition-all duration-200 ${
                      isHidden ? "border-amber-300 bg-amber-50/30" : "border-[#CCE5E1] hover:border-[#278C7B]/60"
                    }`}
                  >
                    {/* Admin Status Strip (Header Banner on Card) */}
                    <div className="bg-[#FAFBF9] border-b border-[#CCE5E1] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#4A7C79] uppercase font-bold">Post Status:</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase ${
                            post.status === "published"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : isHidden
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-rose-100 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {post.status || "published"}
                        </span>

                        {post.type && (
                          <span className="px-2 py-0.5 bg-[#E8F4F1] text-[#0F3D3C] border border-[#CCE5E1] rounded text-[10px] font-mono font-semibold uppercase">
                            {post.type}
                          </span>
                        )}
                      </div>

                      {/* Direct Admin Quick Controls */}
                      <div className="flex items-center gap-2">
                        {post.status === "published" ? (
                          <button
                            onClick={() => triggerAction({ action: "update_post_status", postId: post.id, newStatus: "hidden" })}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-mono font-bold transition cursor-pointer inline-flex items-center gap-1.5"
                            title="Hide post from main site community feed"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            Hide Post
                          </button>
                        ) : (
                          <button
                            onClick={() => triggerAction({ action: "update_post_status", postId: post.id, newStatus: "published" })}
                            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-mono font-bold transition cursor-pointer inline-flex items-center gap-1.5"
                            title="Publish post on main site community feed"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Publish Post
                          </button>
                        )}

                        <button
                          onClick={() => triggerAction({ action: "update_post_status", postId: post.id, newStatus: "deleted" })}
                          className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-mono font-bold transition cursor-pointer inline-flex items-center gap-1"
                          title="Delete post permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {post.authorId && (
                          <button
                            onClick={() =>
                              triggerAction({
                                action: "restrict_user",
                                userId: post.authorId,
                                type: "restricted",
                                durationDays: 1,
                                reasonText: "Admin manual moderation from post feed.",
                              })
                            }
                            className="px-2.5 py-1 bg-slate-800 hover:bg-black text-white rounded text-xs font-mono font-bold transition cursor-pointer inline-flex items-center gap-1"
                            title="Mute author for 24 hours"
                          >
                            <VolumeX className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Main Site Visual Post Representation */}
                    <div className="p-5 space-y-3.5">
                      {/* Author Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={avatar}
                            alt={post.authorName || "Author"}
                            className="w-10 h-10 rounded-full object-cover border border-[#CCE5E1]"
                          />
                          <div>
                            <strong className="text-sm text-[#0F3D3C] font-bold block">
                              {post.authorName || "Farmer User"}
                            </strong>
                            <span className="text-xs text-[#4A7C79] font-mono">
                              @{post.authorUsername?.replace(/^@/, "") || "farmer"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-[#4A7C79] font-mono">
                          <Clock className="w-3.5 h-3.5 text-[#278C7B]" />
                          {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "Recent"}
                        </div>
                      </div>

                      {/* Title & Caption */}
                      <div>
                        {post.title && (
                          <h3 className="text-base font-serif font-bold text-[#0F3D3C] mb-1.5">
                            {post.title}
                          </h3>
                        )}
                        <p className="text-xs text-[#2C5E5B] leading-relaxed whitespace-pre-line font-medium">
                          {post.caption}
                        </p>
                      </div>

                      {/* Attached Media Grid */}
                      {post.mediaUrls && post.mediaUrls.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                          {post.mediaUrls.map((url: string, idx: number) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded-lg overflow-hidden border border-[#CCE5E1] max-h-48 group relative"
                            >
                              <img
                                src={url}
                                alt={`Media attachment ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {post.tags.map((tag: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#278C7B] bg-[#E8F4F1] px-2.5 py-0.5 rounded-full border border-[#CCE5E1]"
                            >
                              <Tag className="w-3 h-3" />
                              {tag.startsWith("#") ? tag : `#${tag}`}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Public Engagement Counters & Comment Drawer Toggle */}
                      <div className="flex items-center justify-between border-t border-[#CCE5E1]/60 pt-3 text-xs font-mono text-[#4A7C79]">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 text-[#0F3D3C] font-semibold">
                            <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                            {post.likeCount || 0} Likes
                          </span>

                          <span className="flex items-center gap-1 text-[#0F3D3C] font-semibold">
                            <MessageSquare className="w-4 h-4 text-[#278C7B]" />
                            {post.commentCount || (post.comments ? post.comments.length : 0)} Comments
                          </span>

                          {post.reportsCount > 0 && (
                            <span className="flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                              {post.reportsCount} Community Reports
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => setExpandedCommentsPostId(isCommentsExpanded ? null : post.id)}
                          className="inline-flex items-center gap-1 text-[#278C7B] font-bold hover:underline cursor-pointer"
                        >
                          {isCommentsExpanded ? (
                            <>
                              Hide Comment Thread <ChevronUp className="w-4 h-4" />
                            </>
                          ) : (
                            <>
                              Inspect Comment Thread ({post.comments?.length || 0}) <ChevronDown className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>

                      {/* Expandable Comment Thread Moderation Drawer */}
                      {isCommentsExpanded && (
                        <div className="bg-[#FAFBF9] border border-[#CCE5E1] rounded-lg p-4 space-y-3 mt-3 animate-fade-in">
                          <div className="text-xs font-mono font-extrabold uppercase text-[#0F3D3C]">
                            Comments Thread Moderation
                          </div>

                          {!post.comments || post.comments.length === 0 ? (
                            <div className="text-xs font-mono text-[#4A7C79] italic p-3 text-center border border-dashed border-[#CCE5E1] rounded">
                              No comments recorded on this post thread yet.
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {post.comments.map((c: any) => (
                                <div
                                  key={c.id}
                                  className="p-3 bg-white border border-[#CCE5E1] rounded-lg text-xs space-y-1.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                                >
                                  <div>
                                    <div className="flex items-center gap-2 font-mono text-[11px]">
                                      <strong className="text-[#0F3D3C]">{c.authorName || "Farmer"}</strong>
                                      <span className="text-[#4A7C79]">@{c.authorUsername?.replace(/^@/, "")}</span>
                                      <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${
                                        c.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                      }`}>
                                        {c.status || "published"}
                                      </span>
                                    </div>
                                    <p className="text-[#2C5E5B] font-medium mt-0.5">{c.body}</p>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {c.status === "published" ? (
                                      <button
                                        onClick={() => triggerAction({ action: "update_comment_status", commentId: c.id, newStatus: "hidden" })}
                                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-mono font-bold rounded transition cursor-pointer"
                                      >
                                        Hide Comment
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => triggerAction({ action: "update_comment_status", commentId: c.id, newStatus: "published" })}
                                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-mono font-bold rounded transition cursor-pointer"
                                      >
                                        Publish Comment
                                      </button>
                                    )}

                                    <button
                                      onClick={() => triggerAction({ action: "update_comment_status", commentId: c.id, newStatus: "deleted" })}
                                      className="p-1 bg-rose-700 hover:bg-rose-800 text-white text-[10px] font-mono font-bold rounded transition cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FLAGGED REPORTS QUEUE */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          {/* Sub-toolbar */}
          <div className="bg-white border border-[#CCE5E1] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-extrabold text-[#0F3D3C] uppercase">Report Status:</span>
              <div className="flex gap-1">
                {["pending", "resolved", "dismissed", "all"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setReportStatusFilter(status)}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded-md capitalize transition cursor-pointer ${
                      reportStatusFilter === status
                        ? "bg-[#278C7B] text-white"
                        : "bg-[#FAFBF9] text-[#4A7C79] border border-[#CCE5E1] hover:bg-[#E8F4F1]"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs font-mono text-[#4A7C79]">
              Showing <strong>{filteredReports.length}</strong> reported items
            </div>
          </div>

          {/* Reports List */}
          <div className="space-y-3">
            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-[#4A7C79] bg-white border border-[#CCE5E1] rounded-xl">
                Loading community flagged reports...
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-[#4A7C79] bg-white border border-dashed border-[#CCE5E1] rounded-xl">
                No flagged reports matching criteria. Community guidelines are healthy!
              </div>
            ) : (
              filteredReports.map((rep) => (
                <div
                  key={rep.id}
                  className="bg-white border border-[#CCE5E1] hover:border-[#278C7B]/60 rounded-xl p-4 shadow-2xs space-y-3 transition"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#CCE5E1]/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-mono font-extrabold text-[10px] uppercase">
                        {rep.reason.replace("_", " ")}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#0F3D3C]">{rep.title}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-[#4A7C79]">
                      <span>Reported by: <strong className="text-[#0F3D3C]">{rep.reporterUsername}</strong></span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        rep.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {rep.status}
                      </span>
                    </div>
                  </div>

                  {/* Snippet Content */}
                  <div className="bg-[#FAFBF9] border border-[#CCE5E1] rounded-lg p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#4A7C79]">
                      <span>Author: <strong className="text-[#278C7B]">{rep.authorName}</strong> ({rep.authorUsername})</span>
                      <span>Target Type: <strong className="uppercase text-[#0F3D3C]">{rep.contentType}</strong></span>
                    </div>
                    <p className="text-[#2C5E5B] font-medium leading-relaxed italic">"{rep.snippet}"</p>
                    {rep.details && (
                      <div className="text-[11px] font-mono text-rose-700 font-medium">
                        Reporter note: {rep.details}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    {rep.status === "pending" && (
                      <>
                        <button
                          onClick={() => triggerAction({ action: "dismiss_report", id: rep.id })}
                          className="px-3 py-1.5 bg-white border border-[#CCE5E1] hover:bg-[#E8F4F1] text-[#0F3D3C] rounded-lg text-xs font-mono font-bold transition cursor-pointer"
                        >
                          Dismiss Report
                        </button>

                        <button
                          onClick={() =>
                            triggerAction({
                              action: "moderate_content",
                              reportId: rep.id,
                              targetContentType: rep.contentType,
                              targetContentId: rep.contentId,
                              mode: "hide",
                            })
                          }
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-mono font-bold transition cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          Hide Content
                        </button>

                        <button
                          onClick={() =>
                            triggerAction({
                              action: "moderate_content",
                              reportId: rep.id,
                              targetContentType: rep.contentType,
                              targetContentId: rep.contentId,
                              mode: "delete",
                            })
                          }
                          className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-mono font-bold transition cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Content
                        </button>
                      </>
                    )}

                    {rep.authorId && (
                      <button
                        onClick={() =>
                          triggerAction({
                            action: "restrict_user",
                            userId: rep.authorId,
                            type: "restricted",
                            durationDays: 1,
                            reasonText: `Content flagged for ${rep.reason}`,
                          })
                        }
                        className="px-3 py-1.5 bg-slate-800 hover:bg-black text-white rounded-lg text-xs font-mono font-bold transition cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <VolumeX className="w-3.5 h-3.5" />
                        Mute Author (24h)
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: USER SANCTIONS & BANS */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#CCE5E1] rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#CCE5E1] pb-2">
              <span className="text-xs font-mono font-extrabold uppercase text-[#0F3D3C]">
                Muted & Restricted Farmer Accounts ({restrictedUsers.length})
              </span>
            </div>

            {restrictedUsers.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-[#4A7C79] border border-dashed border-[#CCE5E1] rounded-lg">
                No user accounts currently have active restrictions or bans.
              </div>
            ) : (
              <div className="bg-white border border-[#CCE5E1] rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#E8F4F1] border-b border-[#CCE5E1] font-mono text-[11px] uppercase text-[#0F3D3C]">
                    <tr>
                      <th className="p-3">User Profile</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Sanction Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CCE5E1]/60 font-sans">
                    {restrictedUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#E8F4F1]/50 transition">
                        <td className="p-3 font-mono font-bold text-[#0F3D3C]">
                          {u.fullName || "Farmer User"} <span className="text-[#4A7C79] text-[10px]">(@{u.username})</span>
                        </td>
                        <td className="p-3 font-mono text-[#4A7C79]">{u.email || "No email on record"}</td>
                        <td className="p-3 font-mono">
                          <span className="px-2 py-0.5 rounded uppercase font-bold text-[10px] bg-rose-100 text-rose-800">
                            {u.restrictionStatus}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => triggerAction({ action: "unban_user", userId: u.id })}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-mono font-bold transition cursor-pointer inline-flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Lift Sanction
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AUTOMATED SAFETY RULES */}
      {activeTab === "settings" && (
        <div className="bg-white border border-[#CCE5E1] rounded-xl p-6 shadow-2xs space-y-6">
          <div>
            <h3 className="text-sm font-mono font-extrabold uppercase text-[#0F3D3C]">
              Automated Community Moderation Settings
            </h3>
            <p className="text-xs text-[#4A7C79] mt-0.5">
              Configure real-time automated filters to prevent spam, scam attempts, and offensive language across the forum.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Spam Filter Toggle */}
            <div className="p-4 bg-[#FAFBF9] border border-[#CCE5E1] rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-[#0F3D3C] font-mono block">Automated Spam Detection</strong>
                  <span className="text-[#4A7C79] text-[11px]">Detect rapid duplicate posts & bot submissions</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.spamDetectionEnabled}
                  onChange={(e) => setSettings({ ...settings, spamDetectionEnabled: e.target.checked })}
                  className="w-4 h-4 accent-[#278C7B] cursor-pointer"
                />
              </div>
            </div>

            {/* Block External Links */}
            <div className="p-4 bg-[#FAFBF9] border border-[#CCE5E1] rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-[#0F3D3C] font-mono block">Block External URL Links</strong>
                  <span className="text-[#4A7C79] text-[11px]">Automatically flag posts containing untrusted links</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.blockExternalLinks}
                  onChange={(e) => setSettings({ ...settings, blockExternalLinks: e.target.checked })}
                  className="w-4 h-4 accent-[#278C7B] cursor-pointer"
                />
              </div>
            </div>

            {/* Auto-Flag Threshold */}
            <div className="p-4 bg-[#FAFBF9] border border-[#CCE5E1] rounded-lg space-y-2 md:col-span-2">
              <label className="text-[#0F3D3C] font-mono font-bold block">
                Auto-Flag Report Threshold (Reports required before post auto-hides)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={settings.autoFlagReportThreshold}
                onChange={(e) => setSettings({ ...settings, autoFlagReportThreshold: parseInt(e.target.value) || 3 })}
                className="w-32 bg-white border border-[#CCE5E1] rounded-lg px-3 py-1.5 text-xs text-[#0F3D3C] font-mono outline-none focus:border-[#278C7B]"
              />
            </div>

            {/* Offensive Word Blacklist */}
            <div className="p-4 bg-[#FAFBF9] border border-[#CCE5E1] rounded-lg space-y-3 md:col-span-2">
              <div>
                <strong className="text-[#0F3D3C] font-mono block">Offensive & Scam Word Blacklist</strong>
                <span className="text-[#4A7C79] text-[11px]">Keywords that trigger instant flagging when typed in forum posts or comments.</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter forbidden keyword..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                  className="bg-white border border-[#CCE5E1] rounded-lg px-3 py-1.5 text-xs text-[#0F3D3C] font-mono outline-none focus:border-[#278C7B] w-64"
                />
                <button
                  onClick={handleAddKeyword}
                  className="px-3 py-1.5 bg-[#0F3D3C] text-white rounded-lg text-xs font-mono font-bold hover:bg-[#0A2928] cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Word
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {settings.offensiveWordsList.map((word: string) => (
                  <span
                    key={word}
                    className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 text-xs font-mono font-bold px-2.5 py-1 rounded-md border border-rose-200"
                  >
                    {word}
                    <button
                      onClick={() => handleRemoveKeyword(word)}
                      className="hover:text-rose-950 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#CCE5E1] flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="px-5 py-2.5 bg-[#278C7B] hover:bg-[#1F6E61] text-white text-xs font-bold font-mono rounded-lg shadow-xs transition cursor-pointer"
            >
              Save Moderation Rules
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
