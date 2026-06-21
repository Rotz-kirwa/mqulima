import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { MessageSquare, Users, Award, Bell, ShieldCheck, ThumbsUp, Send, Check, Search } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { CommunitySection } from "@/components/mqulima/CommunitySection";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community Forum · Mqulima" },
      {
        name: "description",
        content: "Join 5,000+ Kenyan farmers swapping wins, lessons, and agronomy advice county by county.",
      },
    ],
  }),
  component: CommunityPage,
});

// Seed data
const initialTopics = [
  { id: 1, county: "Uasin Gishu", crop: "Maize", author: "James Kimutai", title: "Best top-dressing window this season?", body: "With the delayed rains in Eldoret, should we top-dress immediately after weeding or wait for consistent rain?", replies: 3, last: "2h ago", answers: [
    { author: "Dr. Samuel Mwangi", role: "Chief Agronomist", text: "Wait for the soil to have moisture. Top-dressing during dry spells leads to volatilization where urea nitrogen is lost to the air.", verified: true },
    { author: "Mary Wanjiku", role: "Potato Farmer", text: "I faced this last season, waiting was definitely the safer option. Keep checking local forecasts!" }
  ]},
  { id: 2, county: "Nyandarua", crop: "Potatoes", author: "Peter Mwangi", title: "Anyone tried Shangi variety lately?", body: "I am planning to plant Shangi potato variety on 3 acres. What are the current seed potato source contacts in Nyandarua?", replies: 1, last: "5h ago", answers: [
    { author: "David Kiprop", role: "Dairy Farmer", text: "Try ADC farms in Molo or reach out to the county department of agriculture.", verified: false }
  ]},
  { id: 3, county: "Machakos", crop: "Mango", author: "Grace Mutiso", title: "Fruit fly traps that actually work", body: "Losing almost 20% of my harvest to fruit flies. Any organic pheromone trap suggestions?", replies: 1, last: "1d ago", answers: [
    { author: "Dr. Samuel Mwangi", role: "Chief Agronomist", text: "Use protein bait sprays or pheromone traps like Biolure. Hang them 1.5m high in the canopy.", verified: true }
  ]},
];

const farmerGroups = [
  { name: "North Rift Maize Alliance", members: 1420, county: "Uasin Gishu", desc: "For large-scale and smallholder maize farmers looking to negotiate bulk input prices." },
  { name: "Nyandarua Potato Cooperatives", members: 890, county: "Nyandarua", desc: "Sharing cold-storage logistics, price trends, and certified tuber multiplication." },
  { name: "Central Dairy Alliance", members: 1205, county: "Kiambu", desc: "Best silage recipes, local cooperative milk prices, and veterinary clinic recommendations." },
  { name: "Eastern Mango Growers", members: 512, county: "Machakos", desc: "Combating fruit flies, export market guidelines, and organic processing techniques." },
];

const reputationBoard = [
  { name: "Dr. Samuel Mwangi", role: "Chief Agronomist", points: 2840, badge: "Advisor", county: "Nakuru" },
  { name: "Mary Wanjiku", role: "Potato Expert", points: 1420, badge: "Top Farmer", county: "Nyandarua" },
  { name: "James Kimutai", role: "Grain Mentor", points: 980, badge: "Contributor", county: "Uasin Gishu" },
  { name: "Grace Mutiso", role: "Horticulture Expert", points: 840, badge: "Contributor", county: "Machakos" },
];

const mockNotifications = [
  { text: "Dr. Samuel Mwangi answered your question about top-dressing.", time: "2h ago", read: false },
  { text: "Mary Wanjiku liked your success story: potato yields up by 40%.", time: "5h ago", read: false },
  { text: "North Rift Maize Alliance posted a new notice for seed bookings.", time: "1d ago", read: true },
];

function CommunityPage() {
  const [activeTab, setActiveTab] = useState<"forum" | "groups" | "reputation" | "stories">("forum");
  const [topics, setTopics] = useState(initialTopics);
  
  // Discussion thread detail view
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  // Post modal/form state
  const [showPostForm, setShowPostForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newCrop, setNewCrop] = useState("Maize");
  const [newCounty, setNewCounty] = useState("Uasin Gishu");

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [countyFilter, setCountyFilter] = useState("All");

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.body.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCounty = countyFilter === "All" || t.county === countyFilter;
      return matchesSearch && matchesCounty;
    });
  }, [topics, searchQuery, countyFilter]);

  const activeTopic = useMemo(() => {
    return topics.find((t) => t.id === selectedTopicId);
  }, [topics, selectedTopicId]);

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) {
      toast.error("Please fill in title and body.");
      return;
    }
    const newTopic = {
      id: Date.now(),
      county: newCounty,
      crop: newCrop,
      author: "Me (Farmer)",
      title: newTitle,
      body: newBody,
      replies: 0,
      last: "Just now",
      answers: []
    };
    setTopics([newTopic, ...topics]);
    toast.success("Discussion topic posted successfully!");
    setNewTitle("");
    setNewBody("");
    setShowPostForm(false);
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTopicId) return;
    
    const updated = topics.map((t) => {
      if (t.id === selectedTopicId) {
        return {
          ...t,
          replies: t.replies + 1,
          answers: [
            ...t.answers,
            {
              author: "Me (Farmer)",
              role: "Contributor",
              text: replyText,
              verified: false
            }
          ]
        };
      }
      return t;
    });
    setTopics(updated);
    setReplyText("");
    toast.success("Reply posted!");
  };

  const markNotificationsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setShowNotifications(!showNotifications);
  };

  const handleJoinGroup = (groupName: string) => {
    toast.success(`Joined ${groupName}!`, {
      description: "You will receive updates and alerts from this group in your notifications feed.",
    });
  };

  return (
    <AppLayout>
      <div className="bg-[#FAF9F6] text-[#1A1A1A] min-h-screen font-sans">
        
        {/* Banner Section */}
        <section className="bg-gradient-to-br from-[#1A3D2F] to-[#2D6A4F] py-16 text-white text-left relative overflow-visible">
          <div className="container-px mx-auto max-w-7xl flex justify-between items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#F5A623]">
                <Users className="h-4 w-4" /> Mqulima Hub Forum
              </span>
              <h1 className="mt-3 text-4xl font-extrabold md:text-5xl tracking-tight">5,000+ Farmers. One Movement.</h1>
              <p className="mt-2 max-w-xl text-white/80 text-sm leading-relaxed">
                Ask agronomy questions, share farming guides, view success stories, and access verified advice county-by-county.
              </p>
            </div>

            {/* Notifications button */}
            <div className="relative">
              <button 
                onClick={markNotificationsRead}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer relative"
              >
                <Bell className="h-5 w-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Notifications panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl z-50 text-left text-xs">
                  <div className="font-bold text-[#1A3D2F] border-b border-gray-100 pb-2 mb-2">Recent Notifications</div>
                  <div className="space-y-2">
                    {notifications.map((n, i) => (
                      <div key={i} className={`p-2.5 rounded-lg transition ${n.read ? "bg-white" : "bg-emerald-50/50"}`}>
                        <div className="font-medium text-gray-800">{n.text}</div>
                        <div className="text-[9px] text-gray-400 font-semibold mt-1">{n.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Tab Controls */}
        <section className="border-b border-gray-200 bg-white sticky top-16 z-30 shadow-sm">
          <div className="container-px mx-auto max-w-7xl">
            <div className="flex gap-6 overflow-x-auto py-4 text-xs font-semibold uppercase tracking-wider scrollbar-none">
              {(["forum", "groups", "stories", "reputation"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setSelectedTopicId(null); }}
                  className={`pb-1 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === tab ? "border-[#2D6A4F] text-[#2D6A4F] font-extrabold" : "border-transparent text-gray-500 hover:text-[#1A1A1A]"
                  }`}
                >
                  {tab === "forum" ? "Discussion Forums" : tab === "groups" ? "Farmer Groups" : tab === "stories" ? "Success Stories" : "Reputation Board"}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12">
          <div className="container-px mx-auto max-w-7xl text-left">

            {/* TAB 1: Discussion Forums */}
            {activeTab === "forum" && (
              <div className="grid gap-8 lg:grid-cols-[2.5fr_1.2fr]">
                
                {/* Main Forum Feed */}
                <div>
                  {selectedTopicId && activeTopic ? (
                    // TOPIC DETAIL VIEW
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md md:p-8">
                      <button 
                        onClick={() => setSelectedTopicId(null)}
                        className="text-xs font-bold text-gray-400 hover:text-gray-600 mb-6 block"
                      >
                        ← Back to Discussions
                      </button>

                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-wider">
                        <span className="rounded-full bg-[#2D6A4F]/10 px-2.5 py-1 text-[#2D6A4F]">
                          {activeTopic.county}
                        </span>
                        <span className="rounded-full bg-[#F5A623]/10 px-2.5 py-1 text-[#F5A623]">
                          {activeTopic.crop}
                        </span>
                        <span className="text-gray-400">
                          Posted by {activeTopic.author}
                        </span>
                      </div>
                      <h2 className="text-xl font-extrabold text-[#1A3D2F] mt-3 leading-tight">{activeTopic.title}</h2>
                      <p className="mt-4 text-xs text-gray-600 leading-relaxed border-b border-gray-100 pb-6">{activeTopic.body}</p>

                      {/* Answers thread */}
                      <div className="mt-8 space-y-4">
                        <h3 className="text-sm font-bold text-[#1A3D2F] flex items-center gap-1.5">
                          <MessageSquare className="h-4 w-4 text-[#2D6A4F]" /> Comments & Q&A ({activeTopic.answers.length})
                        </h3>

                        {activeTopic.answers.map((ans, idx) => (
                          <div key={idx} className={`p-4 rounded-xl border ${ans.verified ? "border-emerald-200 bg-emerald-50/20" : "border-gray-150 bg-gray-50/30"}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="text-xs font-bold text-[#1A1A1A]">{ans.author}</div>
                                <div className="text-[9px] text-gray-400 font-semibold">{ans.role}</div>
                              </div>
                              {ans.verified && (
                                <span className="inline-flex items-center gap-1 text-[8px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                                  <ShieldCheck className="h-3 w-3 fill-current" /> Verified Agronomist Answer
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-2 leading-relaxed">"{ans.text}"</p>
                          </div>
                        ))}
                      </div>

                      {/* Post reply form */}
                      <form onSubmit={handleReplySubmit} className="mt-8 border-t border-gray-100 pt-6">
                        <div className="text-xs font-bold text-[#1A3D2F] mb-3">Add Your Contribution</div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Write your advice or answer here..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs outline-none focus:border-[#2D6A4F]"
                          />
                          <button
                            type="submit"
                            className="grid h-10 w-10 place-items-center rounded-xl bg-[#2D6A4F] text-white hover:bg-[#1A5438] transition cursor-pointer shrink-0"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    // TOPICS LIST VIEW
                    <div className="space-y-4">
                      {/* Controls and Post trigger */}
                      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex flex-wrap gap-3 items-center flex-1">
                          {/* Search */}
                          <div className="relative w-full max-w-xs">
                            <input
                              type="text"
                              placeholder="Search discussions..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full rounded-xl border border-gray-200 bg-white py-1.5 pl-8 pr-4 text-xs outline-none focus:border-[#2D6A4F]"
                            />
                            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                          </div>

                          {/* County selector */}
                          <select
                            value={countyFilter}
                            onChange={(e) => setCountyFilter(e.target.value)}
                            className="rounded-xl border border-gray-200 bg-white text-xs px-3 py-1.5 outline-none"
                          >
                            <option value="All">All Counties</option>
                            <option value="Uasin Gishu">Uasin Gishu</option>
                            <option value="Nyandarua">Nyandarua</option>
                            <option value="Machakos">Machakos</option>
                          </select>
                        </div>

                        <button 
                          onClick={() => setShowPostForm(!showPostForm)}
                          className="rounded-xl bg-[#2D6A4F] text-white px-4 py-2 text-xs font-bold hover:bg-[#1A5438] transition cursor-pointer"
                        >
                          Start Topic
                        </button>
                      </div>

                      {/* Add Post Form */}
                      {showPostForm && (
                        <form onSubmit={handlePostSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md space-y-4">
                          <h3 className="text-sm font-bold text-[#1A3D2F] border-b border-gray-100 pb-2">Start a New Discussion</h3>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Target Crop</span>
                              <select
                                value={newCrop}
                                onChange={(e) => setNewCrop(e.target.value)}
                                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs outline-none"
                              >
                                <option value="Maize">Maize</option>
                                <option value="Potatoes">Potatoes</option>
                                <option value="Mango">Mango</option>
                                <option value="Dairy">Dairy</option>
                              </select>
                            </label>

                            <label className="block">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Your County</span>
                              <select
                                value={newCounty}
                                onChange={(e) => setNewCounty(e.target.value)}
                                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs outline-none"
                              >
                                <option value="Uasin Gishu">Uasin Gishu</option>
                                <option value="Nyandarua">Nyandarua</option>
                                <option value="Machakos">Machakos</option>
                              </select>
                            </label>
                          </div>

                          <label className="block">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Topic Title</span>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Best top-dressing window this season?"
                              value={newTitle}
                              onChange={(e) => setNewTitle(e.target.value)}
                              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-[#2D6A4F]"
                            />
                          </label>

                          <label className="block">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Details / Background</span>
                            <textarea
                              required
                              rows={3}
                              placeholder="Provide details about your query..."
                              value={newBody}
                              onChange={(e) => setNewBody(e.target.value)}
                              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-[#2D6A4F]"
                            />
                          </label>

                          <button
                            type="submit"
                            className="w-full rounded-xl bg-[#2D6A4F] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#1A5438]"
                          >
                            Submit Post
                          </button>
                        </form>
                      )}

                      {/* Topics list */}
                      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                        <ul className="divide-y divide-gray-150">
                          {filteredTopics.length > 0 ? (
                            filteredTopics.map((t) => (
                              <li 
                                key={t.id}
                                onClick={() => setSelectedTopicId(t.id)}
                                className="flex flex-wrap items-center gap-4 p-5 transition hover:bg-gray-50/50 cursor-pointer"
                              >
                                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gray-50 text-xl shrink-0">
                                  💬
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-wider">
                                    <span className="rounded-full bg-[#2D6A4F]/10 px-2 py-0.5 text-[#2D6A4F]">
                                      {t.county}
                                    </span>
                                    <span className="rounded-full bg-[#F5A623]/10 px-2 py-0.5 text-[#F5A623]">
                                      {t.crop}
                                    </span>
                                    <span className="text-gray-400">By {t.author}</span>
                                  </div>
                                  <div className="mt-1.5 font-bold text-[#1A3D2F] truncate text-sm">{t.title}</div>
                                  <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5 leading-relaxed">{t.body}</p>
                                </div>
                                <div className="text-right text-xs shrink-0">
                                  <div className="font-extrabold text-[#1A1A1A]">{t.replies} replies</div>
                                  <div className="text-gray-400 text-[10px] mt-0.5">Last: {t.last}</div>
                                </div>
                              </li>
                            ))
                          ) : (
                            <li className="p-12 text-center text-gray-400 font-medium text-xs">
                              No discussions found matching filters.
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Sidebar */}
                <aside className="space-y-6">
                  {/* Reputation snapshot */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A3D2F] border-b border-gray-100 pb-2 mb-3 flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-[#2D6A4F]" /> Contributor Rankings
                    </h3>
                    <ul className="divide-y divide-gray-100">
                      {reputationBoard.slice(0, 3).map((r, i) => (
                        <li key={r.name} className="flex items-center justify-between py-2 text-xs">
                          <div>
                            <div className="font-bold text-[#1A1A1A]">{r.name}</div>
                            <div className="text-[9px] text-gray-400 font-semibold">{r.badge} · {r.county}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-[#2D6A4F]">{r.points} pts</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Ask an Agronomist Promotion */}
                  <div className="rounded-2xl bg-gradient-to-br from-[#F5A623] to-[#E0951F] p-5 text-white shadow-sm">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider">Expert Advice</h4>
                    <p className="text-[11px] text-white/90 mt-1 leading-relaxed">
                      Questions with the "Verified" badge have been reviewed and answered directly by our chief agronomists.
                    </p>
                  </div>
                </aside>
              </div>
            )}

            {/* TAB 2: Farmer Groups */}
            {activeTab === "groups" && (
              <div>
                <div className="mb-8 max-w-xl">
                  <h2 className="text-2xl font-extrabold text-[#1A3D2F]">Farmer Communities</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Connect directly with growers in your operating county. Join groups to share local logistics coordinates, coordinate bulk input orders, and get localized pricing.
                  </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  {farmerGroups.map((g) => (
                    <div key={g.name} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">{g.county}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">{g.members} members</span>
                        </div>
                        <h3 className="text-base font-extrabold text-[#1A3D2F] mt-3">{g.name}</h3>
                        <p className="text-xs text-gray-600 mt-2 leading-relaxed">{g.desc}</p>
                      </div>

                      <button
                        onClick={() => handleJoinGroup(g.name)}
                        className="mt-6 flex w-full items-center justify-center gap-1 rounded-xl border border-[#2D6A4F] py-2.5 text-xs font-bold text-[#2D6A4F] hover:bg-[#2D6A4F]/5 transition cursor-pointer"
                      >
                        Join Alliance
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Success Stories */}
            {activeTab === "stories" && (
              <div>
                <div className="mb-8 max-w-xl">
                  <h2 className="text-2xl font-extrabold text-[#1A3D2F]">Real Farmers, Real Wins</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Read yield updates and success reports posted directly from smallholders and commercial growers across Kenya.
                  </p>
                </div>

                <CommunitySection />
              </div>
            )}

            {/* TAB 4: Reputation Board */}
            {activeTab === "reputation" && (
              <div className="max-w-xl mx-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-md md:p-8">
                <h2 className="text-xl font-extrabold text-[#1A3D2F] mb-2">Reputation Leaderboard</h2>
                <p className="text-xs text-gray-500 mb-6">
                  Top community contributors are recognized based on verified answers, helpful replies, and yield reports.
                </p>

                <div className="divide-y divide-gray-150">
                  {reputationBoard.map((r, i) => (
                    <div key={r.name} className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-black text-gray-300 w-6">#{i+1}</div>
                        <div>
                          <div className="text-xs font-extrabold text-[#1A1A1A]">{r.name}</div>
                          <div className="text-[9px] text-[#2D6A4F] font-semibold">{r.badge} · {r.county} County</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-[#1A1A1A]">{r.points.toLocaleString()}</div>
                        <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Reputation Points</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </section>
      </div>
    </AppLayout>
  );
}
