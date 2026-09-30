import React from "react";
import { motion } from "framer-motion";
import {
  X,
  Globe,
  MapPin,
  Image as ImageIcon,
  Tag,
  Sparkles,
  Video,
  RotateCw,
  Send
} from "lucide-react";

export interface LazyPostComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  defaultGuestFarmer: any;
  postAudience: string;
  createLocation: string;
  setCreateLocation: (val: string) => void;
  createCategory: string;
  setCreateCategory: (val: any) => void;
  createBody: string;
  setCreateBody: React.Dispatch<React.SetStateAction<string>>;
  showEmojiShortcutBar: boolean;
  setShowEmojiShortcutBar: React.Dispatch<React.SetStateAction<boolean>>;
  postMediaFiles: any[];
  handleRemovePostMedia: (idx: number) => void;
  handlePostMediaUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showTagFields: boolean;
  setShowTagFields: React.Dispatch<React.SetStateAction<boolean>>;
  showMediaFields: boolean;
  setShowMediaFields: React.Dispatch<React.SetStateAction<boolean>>;
  createCrops: string;
  setCreateCrops: (val: string) => void;
  createLivestock: string;
  setCreateLivestock: (val: string) => void;
  createImagesText: string;
  setCreateImagesText: (val: string) => void;
  createVideoUrl: string;
  setCreateVideoUrl: (val: string) => void;
  clearPostDraft: () => void;
  handleCreatePost: (e: React.FormEvent) => void;
  isSubmittingPost: boolean;
}

export default function LazyPostComposerModal({
  isOpen,
  onClose,
  currentUser,
  defaultGuestFarmer,
  postAudience,
  createLocation,
  setCreateLocation,
  createCategory,
  setCreateCategory,
  createBody,
  setCreateBody,
  showEmojiShortcutBar,
  setShowEmojiShortcutBar,
  postMediaFiles,
  handleRemovePostMedia,
  handlePostMediaUpload,
  showTagFields,
  setShowTagFields,
  showMediaFields,
  setShowMediaFields,
  createCrops,
  setCreateCrops,
  createLivestock,
  setCreateLivestock,
  createImagesText,
  setCreateImagesText,
  createVideoUrl,
  setCreateVideoUrl,
  clearPostDraft,
  handleCreatePost,
  isSubmittingPost,
}: LazyPostComposerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-xl border border-stone-250/60 text-left relative my-auto max-h-[90vh] flex flex-col"
      >
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-stone-150 flex items-center justify-between bg-stone-50/60 shrink-0">
          <div>
            <h3 className="text-base font-bold text-stone-900 font-serif">Create Post</h3>
            <p className="text-[11px] text-stone-400 font-medium">Share with the Mqulima agricultural community</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-full transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* User Identity & Category Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={currentUser ? currentUser.avatarUrl : defaultGuestFarmer.avatarUrl}
                alt="Avatar"
                className="h-10 w-10 rounded-xl object-cover border border-stone-200 shadow-2xs"
              />
              <div>
                <h4 className="text-xs font-bold text-stone-900 leading-tight">
                  {currentUser ? currentUser.name : "Mqulima Farmer"}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200/60">
                    <Globe className="h-3 w-3" />
                    {postAudience}
                  </span>
                  {createLocation && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-stone-500 font-medium">
                      <MapPin className="h-3 w-3 text-stone-400" />
                      {createLocation}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Category Selector */}
            <select
              value={createCategory}
              onChange={(e) => setCreateCategory(e.target.value as any)}
              className="bg-stone-50 border border-stone-200 hover:border-emerald-700 text-stone-800 text-xs font-bold px-3 py-1.5 rounded-xl outline-none transition cursor-pointer"
            >
              <option value="Farm Progress">🌱 Farm Progress</option>
              <option value="Harvest Update">🌾 Harvest Update</option>
              <option value="Farming Tips">💡 Farming Tips</option>
              <option value="Question">❓ Question</option>
              <option value="Success Story">🏆 Success Story</option>
            </select>
          </div>

          {/* Large Text Editor Area */}
          <div className="space-y-2">
            <textarea
              rows={5}
              value={createBody}
              onChange={(e) => setCreateBody(e.target.value)}
              placeholder={`Share a farm update, ask a question, or tell the community what's happening on your farm, ${currentUser ? currentUser.name.split(' ')[0] : 'farmer'}...`}
              className="w-full bg-transparent text-sm text-stone-850 placeholder:text-stone-400 outline-none resize-none leading-relaxed font-normal"
              autoFocus
            />

            {/* Emoji Shortcuts Bar (Collapsible) */}
            {showEmojiShortcutBar && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-stone-50 rounded-2xl border border-stone-200/70 text-base">
                {["🌾", "🌽", "🍅", "🥛", "🐮", "🚜", "🌱", "☀️", "🌧️", "💚", "🎯", "🏷️", "📍", "💡"].map((emoji, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCreateBody((prev: string) => prev + " " + emoji)}
                    className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Attached Media Gallery Preview */}
          {postMediaFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 uppercase tracking-wide">
                <span>Attached Media ({postMediaFiles.length})</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {postMediaFiles.map((media, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border border-stone-200 bg-stone-900 shadow-2xs">
                    {media.type === "image" ? (
                      <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white text-[9px] p-2 text-center">
                        <Video className="h-6 w-6 text-emerald-400 mb-1" />
                        <span className="truncate w-full font-mono">{media.name}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePostMedia(idx)}
                      className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-red-600 text-white rounded-full p-1 transition shadow-xs cursor-pointer"
                      title="Remove item"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expandable Agricultural Fields (Crops, Livestock, Location, Links) */}
          {(showTagFields || showMediaFields) && (
            <div className="p-4 bg-stone-50/80 rounded-2xl border border-stone-200/80 space-y-3">
              {showTagFields && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">Crop Tags</label>
                    <input
                      type="text"
                      placeholder="Maize, Tomatoes..."
                      value={createCrops}
                      onChange={(e) => setCreateCrops(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 outline-none focus:border-emerald-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">Livestock Tags</label>
                    <input
                      type="text"
                      placeholder="Dairy Cattle, Poultry..."
                      value={createLivestock}
                      onChange={(e) => setCreateLivestock(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 outline-none focus:border-emerald-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">Farm Location</label>
                    <input
                      type="text"
                      placeholder="Nakuru, Kenya"
                      value={createLocation}
                      onChange={(e) => setCreateLocation(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 outline-none focus:border-emerald-700"
                    />
                  </div>
                </div>
              )}

              {showMediaFields && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">Direct Image Link</label>
                    <input
                      type="text"
                      placeholder="https://example.com/photo.jpg"
                      value={createImagesText}
                      onChange={(e) => setCreateImagesText(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 outline-none focus:border-emerald-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">Direct Video Address</label>
                    <input
                      type="text"
                      placeholder="https://example.com/video.mp4"
                      value={createVideoUrl}
                      onChange={(e) => setCreateVideoUrl(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 outline-none focus:border-emerald-700"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* "Add to Your Post" Toolbar */}
          <div className="p-3 bg-stone-50/60 rounded-2xl border border-stone-200/70 flex items-center justify-between gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-stone-700 shrink-0 pl-1">Add to post:</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <label className="p-2 hover:bg-emerald-100/70 text-emerald-800 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold" title="Upload Photo/Video">
                <ImageIcon className="h-4 w-4 text-emerald-600" />
                <span className="hidden sm:inline">Photo/Video</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handlePostMediaUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => setShowTagFields((p) => !p)}
                className={`p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                  showTagFields ? "bg-amber-100 text-amber-900" : "hover:bg-stone-200/60 text-stone-700"
                }`}
                title="Tag Crops & Location"
              >
                <Tag className="h-4 w-4 text-amber-600" />
                <span className="hidden sm:inline">Tags & Location</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMediaFields((p) => !p)}
                className={`p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                  showMediaFields ? "bg-blue-100 text-blue-900" : "hover:bg-stone-200/60 text-stone-700"
                }`}
                title="Add Links"
              >
                <Globe className="h-4 w-4 text-blue-600" />
                <span className="hidden sm:inline">Link</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEmojiShortcutBar((p) => !p)}
                className="p-2 hover:bg-stone-200/60 text-stone-700 rounded-xl transition cursor-pointer text-xs font-bold flex items-center gap-1"
                title="Insert Emoji"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="hidden sm:inline">Emojis</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer / Publish Actions */}
        <div className="px-5 py-3.5 border-t border-stone-150 bg-stone-50/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {(createBody || createCrops || postMediaFiles.length > 0) && (
              <button
                type="button"
                onClick={clearPostDraft}
                className="text-[11px] font-bold text-stone-400 hover:text-red-600 transition cursor-pointer"
              >
                Clear Draft
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-stone-400 font-medium hidden sm:inline">
              {createBody.length} chars
            </span>
            <button
              type="button"
              onClick={handleCreatePost}
              disabled={!createBody.trim() || isSubmittingPost}
              className={`px-6 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer ${
                !createBody.trim() || isSubmittingPost
                  ? "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
                  : "bg-[#1B4332] hover:bg-[#2D6A4F] text-white active:scale-95"
              }`}
            >
              {isSubmittingPost ? (
                <>
                  <RotateCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Publish Post</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
