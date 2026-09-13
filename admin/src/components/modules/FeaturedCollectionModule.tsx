import React, { useState, useEffect, useRef } from "react";
import { Star, ArrowUp, ArrowDown, Plus, Trash2, Image as ImageIcon, Link as LinkIcon, Upload, Check, AlertCircle, Pencil, X } from "lucide-react";
import { adminFetch } from "../../lib/api";

export const FeaturedCollectionModule: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New item form state
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("/shop");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Edit modal state
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editLinkUrl, setEditLinkUrl] = useState("/shop");
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const fetchFeatured = (silent = false) => {
    if (!silent && items.length === 0) setLoading(true);
    adminFetch("/api/admin/featured")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setItems(data.featuredItems || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchFeatured();
  }, []);

  // Handle File Upload to Data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image file size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImageUrl(dataUrl);
      setImagePreview(dataUrl);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Handle URL change
  const handleUrlChange = (val: string) => {
    setImageUrl(val);
    setImagePreview(val || null);
  };

  // Add Item to Featured Collection
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!imageUrl.trim()) {
      setError("Please provide an Image URL or upload an image file.");
      return;
    }

    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          imageUrl: imageUrl.trim(),
          title: title.trim() || "Farm Essential",
          linkUrl: linkUrl.trim() || "/shop",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("New item added to Featured Collection!");
        setImageUrl("");
        setTitle("");
        setLinkUrl("/shop");
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchFeatured();
      } else {
        setError(data.error || "Failed to add featured item");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this item from the Featured Collection?")) {
      return;
    }

    try {
      const res = await adminFetch("/api/admin/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Item removed from Featured Collection.");
        fetchFeatured();
      }
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  // Start Editing Item
  const handleStartEdit = (item: any) => {
    setEditingItem(item);
    setEditTitle(item.title || "");
    setEditImageUrl(item.imageUrl || "");
    setEditLinkUrl(item.linkUrl || "/shop");
    setEditImagePreview(item.imageUrl || null);
    setError(null);
  };

  // Handle Edit File Upload to Data URL
  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image file size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setEditImageUrl(dataUrl);
      setEditImagePreview(dataUrl);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Save Edit Item
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setError(null);
    setSuccessMsg(null);

    if (!editImageUrl.trim()) {
      setError("Please provide an Image URL or upload an image file.");
      return;
    }

    setEditSaving(true);
    try {
      const res = await adminFetch("/api/admin/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: editingItem.id,
          title: editTitle.trim() || "Farm Essential",
          imageUrl: editImageUrl.trim(),
          linkUrl: editLinkUrl.trim() || "/shop",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Featured item updated successfully!");
        setEditingItem(null);
        fetchFeatured();
      } else {
        setError(data.error || "Failed to update featured item");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while updating.");
    } finally {
      setEditSaving(false);
    }
  };

  // Reorder Item
  const handleReorder = async (id: string, newPosition: number) => {
    try {
      const res = await adminFetch("/api/admin/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", id, displayOrder: newPosition }),
      });
      const data = await res.json();
      if (data.success) fetchFeatured();
    } catch (e) {
      console.error("Reorder error:", e);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#CCE5E1] pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#0F3D3C] flex items-center gap-2">
            <Star className="h-6 w-6 text-[#16A34A] fill-[#16A34A]" />
            Farm Essentials — Featured Collection
          </h1>
          <p className="text-xs text-[#2C5E5B] mt-1">
            Manage the homepage Featured Collection items. Added images will appear directly in the sliding Farm Essentials carousel.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-[6px] text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[6px] text-xs flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0 text-[#16A34A]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form: Add New Featured Collection Item */}
      <div className="bg-white border border-[#CCE5E1] rounded-[8px] p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#0F3D3C] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <Plus className="h-4 w-4 text-[#16A34A]" />
          Add New Image to Featured Collection
        </h2>

        <form onSubmit={handleAddItem} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Image Selection (Upload or URL) */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#0F3D3C]">
                1. Image Source (Upload File OR Paste URL)
              </label>

              {/* Upload Input */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  id="featured-file-upload"
                />
                <label
                  htmlFor="featured-file-upload"
                  className="flex-1 py-2 px-3 bg-[#E8F4F1] hover:bg-[#D4ECE6] border border-[#278C7B] text-[#0F3D3C] font-semibold text-xs rounded-[4px] cursor-pointer flex items-center justify-center gap-2 transition"
                >
                  <Upload className="h-4 w-4 text-[#278C7B]" />
                  <span>Upload Image File</span>
                </label>
              </div>

              <div className="relative flex items-center justify-center my-1">
                <span className="bg-white px-2 text-[10px] uppercase font-mono text-[#4A7C79]">OR</span>
                <div className="absolute inset-0 flex items-center -z-10">
                  <div className="w-full border-t border-slate-200" />
                </div>
              </div>

              {/* URL Input */}
              <div className="relative">
                <ImageIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-[#4A7C79]" />
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or CDN image URL"
                  value={imageUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-[#CCE5E1] rounded-[4px] text-xs focus:outline-none focus:border-[#278C7B] bg-[#FAFBF9]"
                />
              </div>
            </div>

            {/* Optional Metadata & Live Preview */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#0F3D3C] mb-1">
                  2. Optional Title / Caption
                </label>
                <input
                  type="text"
                  placeholder="e.g. Organic Maize Seed Vector"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CCE5E1] rounded-[4px] text-xs focus:outline-none focus:border-[#278C7B] bg-[#FAFBF9]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F3D3C] mb-1">
                  3. Link Destination (Optional)
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-[#4A7C79]" />
                  <input
                    type="text"
                    placeholder="/shop or /shop/product/slug"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-[#CCE5E1] rounded-[4px] text-xs focus:outline-none focus:border-[#278C7B] bg-[#FAFBF9]"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Live Preview Box */}
          {imagePreview && (
            <div className="p-3 bg-[#FAFBF9] border border-[#CCE5E1] rounded-[6px] flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 bg-slate-200 border border-slate-300 rounded-[2px] overflow-hidden">
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              </div>
              <div className="text-xs text-[#0F3D3C]">
                <span className="font-bold block">Preview Selected Image</span>
                <span className="text-[10px] text-[#4A7C79] block truncate max-w-md">{imageUrl}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-[4px] transition duration-200 flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>{saving ? "Adding to Featured..." : "Add to Featured Collection"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* List of Featured Items */}
      <div className="bg-white border border-[#CCE5E1] rounded-[8px] p-5 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-[#0F3D3C] uppercase tracking-wider border-b border-slate-100 pb-2">
          Current Featured Items ({items.length})
        </h2>

        {loading ? (
          <div className="p-8 text-center text-[#4A7C79] font-mono text-xs">Loading featured collection...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-[#4A7C79] text-xs font-mono">
            No items in featured collection yet. Use the form above to add an image.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-[#E8F4F1] border border-[#CCE5E1] rounded-[4px] gap-3 text-xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="h-7 w-7 shrink-0 rounded-[2px] bg-[#278C7B] text-white font-mono font-bold flex items-center justify-center text-xs">
                    #{idx + 1}
                  </span>

                  {/* Thumbnail */}
                  <div className="h-12 w-12 shrink-0 bg-white border border-[#CCE5E1] overflow-hidden rounded-[2px]">
                    <img
                      src={item.imageUrl || "/placeholder-product.png"}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/placeholder-product.png";
                      }}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="font-bold text-[#0F3D3C] truncate">{item.title}</div>
                    <div className="text-[10px] text-[#4A7C79] font-mono truncate">
                      Link: {item.linkUrl || "/shop"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleReorder(item.id, item.displayOrder - 1)}
                    className="p-1.5 bg-white border border-[#CCE5E1] text-[#0F3D3C] hover:bg-slate-100 rounded-[4px] disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    disabled={idx === items.length - 1}
                    onClick={() => handleReorder(item.id, item.displayOrder + 1)}
                    className="p-1.5 bg-white border border-[#CCE5E1] text-[#0F3D3C] hover:bg-slate-100 rounded-[4px] disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => handleStartEdit(item)}
                    className="p-1.5 bg-white border border-[#CCE5E1] text-[#278C7B] hover:bg-[#E8F4F1] rounded-[4px] cursor-pointer"
                    title="Edit Item"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-[4px] cursor-pointer ml-1"
                    title="Delete Item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Featured Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#CCE5E1] rounded-[8px] p-6 max-w-lg w-full text-left space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#CCE5E1] pb-3">
              <h2 className="text-base font-serif font-bold text-[#0F3D3C] flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#278C7B]" />
                Edit Featured Item
              </h2>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Image Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#0F3D3C]">
                  Image Source (Upload File OR Paste URL)
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    ref={editFileInputRef}
                    onChange={handleEditFileUpload}
                    className="hidden"
                    id="edit-featured-file-upload"
                  />
                  <label
                    htmlFor="edit-featured-file-upload"
                    className="flex-1 py-2 px-3 bg-[#E8F4F1] hover:bg-[#D4ECE6] border border-[#278C7B] text-[#0F3D3C] font-semibold text-xs rounded-[4px] cursor-pointer flex items-center justify-center gap-2 transition"
                  >
                    <Upload className="h-4 w-4 text-[#278C7B]" />
                    <span>Upload New Image</span>
                  </label>
                </div>

                <div className="relative">
                  <ImageIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-[#4A7C79]" />
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... or CDN image URL"
                    value={editImageUrl}
                    onChange={(e) => {
                      setEditImageUrl(e.target.value);
                      setEditImagePreview(e.target.value || null);
                    }}
                    className="w-full pl-9 pr-3 py-2 border border-[#CCE5E1] rounded-[4px] text-xs focus:outline-none focus:border-[#278C7B] bg-[#FAFBF9]"
                  />
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-[#0F3D3C] mb-1">
                  Title / Caption
                </label>
                <input
                  type="text"
                  placeholder="e.g. Organic Maize Seed Vector"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CCE5E1] rounded-[4px] text-xs focus:outline-none focus:border-[#278C7B] bg-[#FAFBF9]"
                />
              </div>

              {/* Link Input */}
              <div>
                <label className="block text-xs font-bold text-[#0F3D3C] mb-1">
                  Link Destination
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-[#4A7C79]" />
                  <input
                    type="text"
                    placeholder="/shop or /shop/product/slug"
                    value={editLinkUrl}
                    onChange={(e) => setEditLinkUrl(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-[#CCE5E1] rounded-[4px] text-xs focus:outline-none focus:border-[#278C7B] bg-[#FAFBF9]"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              {editImagePreview && (
                <div className="p-3 bg-[#FAFBF9] border border-[#CCE5E1] rounded-[6px] flex items-center gap-4">
                  <div className="h-16 w-16 shrink-0 bg-slate-200 border border-slate-300 rounded-[2px] overflow-hidden">
                    <img
                      src={editImagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/placeholder-product.png";
                      }}
                    />
                  </div>
                  <div className="text-xs text-[#0F3D3C] min-w-0">
                    <span className="font-bold block">Current Image Preview</span>
                    <span className="text-[10px] text-[#4A7C79] block truncate max-w-xs">{editImageUrl}</span>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-[#CCE5E1]">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-[#E8F4F1] hover:bg-[#D4ECE6] text-[#0F3D3C] text-xs font-semibold rounded-[4px] cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-[4px] cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
