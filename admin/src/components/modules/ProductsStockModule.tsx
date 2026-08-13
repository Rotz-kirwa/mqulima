import React, { useState, useEffect } from "react";
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  CheckCircle, 
  XCircle, 
  Star, 
  Image as ImageIcon,
  ShoppingBag,
  RefreshCw,
  Upload,
  Link as LinkIcon,
  FileImage,
  Loader2
} from "lucide-react";
import { adminFetch } from "../../lib/api";

export const ProductsStockModule: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Form Fields
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodUnit, setProdUnit] = useState("50kg bag");
  const [prodCategory, setProdCategory] = useState("Seeds & Seedlings");
  const [prodDescription, setProdDescription] = useState("");
  const [prodImageUrl, setProdImageUrl] = useState("");
  const [prodStatus, setProdStatus] = useState("published");
  const [prodRating, setProdRating] = useState<number>(5);

  // Image Upload Mode State
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const categoriesList = [
    "Seeds & Seedlings",
    "Fertilizers & Soil Health",
    "Agrochemicals & Crop Protection",
    "Farm Tools & Machinery",
    "Animal Feeds & Veterinary",
    "Fresh Farm Produce",
    "Irrigation & Greenhouse"
  ];

  const fetchProducts = () => {
    setLoading(true);
    adminFetch(`/api/admin/products?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch products error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setProdName("");
    setProdPrice("");
    setProdUnit("50kg bag");
    setProdCategory("Seeds & Seedlings");
    setProdDescription("");
    setProdImageUrl("");
    setProdStatus("published");
    setProdRating(5);
    setUploadMode("file");
    setShowModal(true);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setProdName(product.name || "");
    setProdPrice(product.price ? product.price.toString() : "");
    setProdUnit(product.unit || "50kg bag");
    setProdCategory(product.category || "Seeds & Seedlings");
    setProdDescription(product.description || "");
    setProdImageUrl(product.imageUrl || "");
    setProdStatus(product.status || "published");
    setProdRating(Number(product.rating) || 5);
    setUploadMode(product.imageUrl ? "url" : "file");
    setShowModal(true);
  };

  const handleImageFileChange = (file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WEBP, GIF).");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setProdImageUrl(e.target.result as string);
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      alert("Failed to read image file.");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const action = editingProduct ? "update_product" : "create_product";
      const payload: any = {
        action,
        name: prodName,
        price: parseFloat(prodPrice) || 0,
        unit: prodUnit,
        category: prodCategory,
        description: prodDescription,
        imageUrl: prodImageUrl,
        status: prodStatus,
        rating: prodRating,
      };

      if (editingProduct) {
        payload.id = editingProduct.id;
      }

      const res = await adminFetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchProducts();
      }
    } catch (e) {
      console.error("Save product error:", e);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const res = await adminFetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_status", id, status: currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProducts();
      }
    } catch (e) {
      console.error("Toggle status error:", e);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the shop catalog?`)) {
      return;
    }
    try {
      const res = await adminFetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_product", id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProducts();
      }
    } catch (e) {
      console.error("Delete product error:", e);
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesStatus = selectedStatus === "All" || p.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const publishedCount = products.filter((p) => p.status === "published").length;

  const defaultImages: Record<string, string> = {
    "Seeds & Seedlings": "https://images.unsplash.com/photo-1592417817098-8f3d6eb231fc?w=300&auto=format&fit=crop&q=80",
    "Fertilizers & Soil Health": "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=300&auto=format&fit=crop&q=80",
    "Agrochemicals & Crop Protection": "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=300&auto=format&fit=crop&q=80",
    "Farm Tools & Machinery": "https://images.unsplash.com/photo-1595246140625-573b715d11dc?w=300&auto=format&fit=crop&q=80",
    "Animal Feeds & Veterinary": "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=300&auto=format&fit=crop&q=80",
    "Fresh Farm Produce": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&auto=format&fit=crop&q=80",
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5: return "5.0 Stars (Excellent Quality)";
      case 4: return "4.0 Stars (Very Good)";
      case 3: return "3.0 Stars (Average)";
      case 2: return "2.0 Stars (Fair)";
      case 1: return "1.0 Star (Basic)";
      default: return `${stars}.0 Stars`;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#CCE5E1] pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#0F3D3C] flex items-center gap-2">
            <Package className="h-6 w-6 text-[#278C7B]" /> Products & Shop Catalog
          </h1>
          <p className="text-xs text-[#2C5E5B] mt-1">
            Add and manage agricultural products, input prices, 5-star ratings, packaging units, and shop showcase descriptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-mono bg-white border border-[#CCE5E1] text-[#0F3D3C] px-3 py-1.5 rounded-[6px] shadow-2xs font-bold">
              Total Products: <strong className="text-[#278C7B]">{products.length}</strong>
            </span>
            <span className="text-xs font-mono bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-[6px] shadow-2xs font-bold">
              Live in Shop: <strong>{publishedCount}</strong>
            </span>
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-[#278C7B] hover:bg-[#1E6B5E] text-white text-xs font-bold rounded-[6px] shadow-xs cursor-pointer flex items-center gap-2 transition"
          >
            <Plus className="h-4 w-4" /> Add Product to Shop
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-[#CCE5E1] p-3 rounded-[6px] shadow-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search products by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#E8F4F1] border border-[#CCE5E1] text-xs text-[#0F3D3C] placeholder-[#4A7C79] px-3 py-2 pl-9 rounded-[6px] focus:outline-none focus:border-[#278C7B]"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#4A7C79]" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#E8F4F1] border border-[#CCE5E1] text-xs text-[#0F3D3C] px-3 py-2 rounded-[6px] font-mono focus:outline-none focus:border-[#278C7B]"
          >
            <option value="All">All Product Categories</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#E8F4F1] border border-[#CCE5E1] text-xs text-[#0F3D3C] px-3 py-2 rounded-[6px] font-mono focus:outline-none focus:border-[#278C7B]"
          >
            <option value="All">All Shop Statuses</option>
            <option value="published">Published (Live)</option>
            <option value="draft">Draft / Hidden</option>
          </select>

          <button
            onClick={fetchProducts}
            disabled={loading}
            className="p-2 bg-[#E8F4F1] hover:bg-[#d6ece7] text-[#0F3D3C] rounded-[6px] border border-[#CCE5E1] transition cursor-pointer"
            title="Refresh Products"
          >
            <RefreshCw className={`h-4 w-4 text-[#278C7B] ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Product Catalog Data Table */}
      <div className="bg-white border border-[#CCE5E1] rounded-[6px] overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#E8F4F1] border-b border-[#CCE5E1] font-mono text-[11px] uppercase text-[#0F3D3C]">
            <tr>
              <th className="p-3">Product Item</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price & Unit</th>
              <th className="p-3">Star Rating</th>
              <th className="p-3">Shop Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#CCE5E1]/60 font-sans">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#4A7C79] font-mono">
                  Loading product catalog...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#4A7C79]">
                  No matching products found in shop catalog.
                </td>
              </tr>
            ) : (
              filtered.map((product) => {
                const img = product.imageUrl || defaultImages[product.category] || "https://images.unsplash.com/photo-1592417817098-8f3d6eb231fc?w=300&auto=format&fit=crop&q=80";
                const isLive = product.status === "published";
                const starVal = Math.round(Number(product.rating) || 5);

                return (
                  <tr key={product.id} className="hover:bg-[#E8F4F1]/60 transition border-b border-[#CCE5E1]/50">
                    {/* Product Item / Preview */}
                    <td className="p-3 font-semibold text-[#0F3D3C]">
                      <div className="flex items-center gap-3">
                        <img
                          src={img}
                          alt={product.name}
                          className="w-11 h-11 object-cover rounded-[6px] border border-[#CCE5E1] shrink-0 bg-gray-100"
                        />
                        <div>
                          <div className="font-bold text-sm text-[#0F3D3C] flex items-center gap-1.5">
                            {product.name}
                          </div>
                          <div className="text-[10px] text-[#4A7C79] font-mono font-normal">ID: {product.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-3 font-mono">
                      <span className="px-2.5 py-1 bg-[#E8F4F1] border border-[#CCE5E1] text-[#0F3D3C] rounded-[4px] font-bold text-[11px] inline-block">
                        {product.category || "Inputs"}
                      </span>
                    </td>

                    {/* Price & Unit */}
                    <td className="p-3 font-mono">
                      <div className="text-sm font-extrabold text-[#0F3D3C]">
                        KSh {product.price ? product.price.toLocaleString() : "0"}
                      </div>
                      <div className="text-[10px] text-emerald-800 font-bold">
                        per {product.unit || "unit"}
                      </div>
                    </td>

                    {/* Star Rating Column */}
                    <td className="p-3 font-mono">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3.5 w-3.5 ${
                              star <= starVal
                                ? "fill-amber-400 text-amber-500"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="text-[11px] font-bold text-[#0F3D3C] ml-1">
                          {Number(product.rating || 5).toFixed(1)}
                        </span>
                      </div>
                    </td>

                    {/* Shop Status */}
                    <td className="p-3 font-mono">
                      <button
                        onClick={() => handleToggleStatus(product.id, product.status)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] font-extrabold text-[10px] transition cursor-pointer border ${
                          isLive
                            ? "bg-teal-50 border-teal-300 text-[#278C7B] hover:bg-teal-100"
                            : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                        }`}
                        title="Click to toggle shop visibility"
                      >
                        {isLive ? (
                          <>
                            <CheckCircle className="h-3.5 w-3.5 text-[#278C7B]" /> LIVE IN SHOP
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5 text-gray-500" /> DRAFT / HIDDEN
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="px-2.5 py-1.5 bg-[#E8F4F1] hover:bg-[#d6ece7] border border-[#CCE5E1] text-[#0F3D3C] font-bold rounded-[6px] text-xs cursor-pointer inline-flex items-center gap-1 transition"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-[#278C7B]" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-[6px] border border-rose-200 transition cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* ADD / EDIT PRODUCT MODAL WITH STAR RATING SELECTOR */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveProduct}
            className="bg-white border border-[#CCE5E1] rounded-[8px] max-w-lg w-full text-left space-y-4 p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#CCE5E1] pb-3">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#0F3D3C] flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-[#278C7B]" />
                  {editingProduct ? "Edit Shop Product" : "Add Product to Main Shop Page"}
                </h2>
                <p className="text-xs text-[#4A7C79] font-mono mt-0.5">
                  Upload image, select 5-star rating, configure pricing, and showcase description.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-[6px] hover:bg-[#E8F4F1] text-[#0F3D3C] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs font-mono">
              {/* Product Name */}
              <div>
                <label className="block text-[#4A7C79] text-[10px] uppercase font-bold mb-1">Product Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Certified Hybrid Maize Seed H614D (25kg)"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full bg-[#E8F4F1] border border-[#CCE5E1] p-2.5 rounded-[6px] text-[#0F3D3C] font-bold focus:outline-none focus:border-[#278C7B]"
                />
              </div>

              {/* Category & Packaging Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4A7C79] text-[10px] uppercase font-bold mb-1">Product Category *</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full bg-[#E8F4F1] border border-[#CCE5E1] p-2.5 rounded-[6px] text-[#0F3D3C] font-bold focus:outline-none focus:border-[#278C7B]"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#4A7C79] text-[10px] uppercase font-bold mb-1">Packaging Unit *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50kg bag, 1L bottle, 25kg, Piece"
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="w-full bg-[#E8F4F1] border border-[#CCE5E1] p-2.5 rounded-[6px] text-[#0F3D3C] font-bold focus:outline-none focus:border-[#278C7B]"
                  />
                </div>
              </div>

              {/* Price & Shop Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4A7C79] text-[10px] uppercase font-bold mb-1">Unit Price (KSh) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 3500"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full bg-[#E8F4F1] border border-[#CCE5E1] p-2.5 rounded-[6px] text-[#0F3D3C] font-bold focus:outline-none focus:border-[#278C7B]"
                  />
                </div>

                <div>
                  <label className="block text-[#4A7C79] text-[10px] uppercase font-bold mb-1">Shop Visibility *</label>
                  <select
                    value={prodStatus}
                    onChange={(e) => setProdStatus(e.target.value)}
                    className="w-full bg-[#E8F4F1] border border-[#CCE5E1] p-2.5 rounded-[6px] text-[#0F3D3C] font-bold focus:outline-none focus:border-[#278C7B]"
                  >
                    <option value="published">✓ Live in Shop Catalog</option>
                    <option value="draft">Draft / Hidden from Shop</option>
                  </select>
                </div>
              </div>

              {/* 5-STAR RATING SELECTOR */}
              <div className="p-3 bg-[#E8F4F1] border border-[#CCE5E1] rounded-[8px] space-y-1.5">
                <label className="block text-[#4A7C79] text-[10px] uppercase font-bold flex items-center justify-between">
                  <span>Product Star Rating (1 to 5 Stars) *</span>
                  <span className="text-[#0F3D3C] font-bold text-xs">{getRatingLabel(prodRating)}</span>
                </label>
                
                <div className="flex items-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setProdRating(star)}
                      className="p-1 cursor-pointer transition hover:scale-110 focus:outline-none"
                      title={`Set rating to ${star} star${star > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          star <= prodRating
                            ? "fill-amber-400 text-amber-500 drop-shadow-xs"
                            : "text-gray-300 hover:text-amber-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 font-sans">
                  Click on the stars above to select product showcase score displayed on the store.
                </p>
              </div>

              {/* PRODUCT IMAGE UPLOAD SECTION */}
              <div className="space-y-2 border border-[#CCE5E1] rounded-[8px] p-3 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <label className="text-[#4A7C79] text-[10px] uppercase font-bold flex items-center gap-1">
                    <FileImage className="h-3.5 w-3.5 text-[#278C7B]" /> Product Image Selection *
                  </label>
                  
                  <div className="flex items-center gap-1 bg-[#E8F4F1] p-0.5 rounded-[6px] border border-[#CCE5E1]">
                    <button
                      type="button"
                      onClick={() => setUploadMode("file")}
                      className={`px-2 py-1 text-[10px] font-bold rounded-[4px] cursor-pointer flex items-center gap-1 transition ${
                        uploadMode === "file" ? "bg-[#278C7B] text-white shadow-2xs" : "text-[#0F3D3C]"
                      }`}
                    >
                      <Upload className="h-3 w-3" /> Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode("url")}
                      className={`px-2 py-1 text-[10px] font-bold rounded-[4px] cursor-pointer flex items-center gap-1 transition ${
                        uploadMode === "url" ? "bg-[#278C7B] text-white shadow-2xs" : "text-[#0F3D3C]"
                      }`}
                    >
                      <LinkIcon className="h-3 w-3" /> Image URL
                    </button>
                  </div>
                </div>

                {uploadMode === "file" ? (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-[6px] p-4 text-center transition cursor-pointer relative bg-white ${
                      dragActive ? "border-[#278C7B] bg-emerald-50/50" : "border-[#CCE5E1] hover:border-[#278C7B]"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageFileChange(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    {isUploading ? (
                      <div className="flex flex-col items-center justify-center py-2 text-[#278C7B] space-y-1">
                        <Loader2 className="h-6 w-6 animate-spin text-[#278C7B]" />
                        <span className="font-bold text-xs">Uploading & Processing Image...</span>
                      </div>
                    ) : prodImageUrl ? (
                      <div className="flex items-center gap-4 text-left">
                        <img
                          src={prodImageUrl}
                          alt="Product Upload Preview"
                          className="w-16 h-16 object-cover rounded-[6px] border border-[#CCE5E1] bg-gray-100 shrink-0"
                        />
                        <div className="flex-1">
                          <span className="text-xs font-bold text-[#0F3D3C] block flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Image Selected
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono block">Click or drag another image to replace</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProdImageUrl("");
                          }}
                          className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-2 text-[#4A7C79] space-y-1">
                        <Upload className="h-6 w-6 text-[#278C7B]" />
                        <span className="font-bold text-xs text-[#0F3D3C]">Click to Upload Product Image</span>
                        <span className="text-[10px] text-gray-500">Supports PNG, JPG, WEBP or drag & drop</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={prodImageUrl}
                      onChange={(e) => setProdImageUrl(e.target.value)}
                      className="w-full bg-[#E8F4F1] border border-[#CCE5E1] p-2.5 rounded-[6px] text-[#0F3D3C] focus:outline-none focus:border-[#278C7B]"
                    />
                    <p className="text-[10px] text-gray-500">
                      Paste direct web image link.
                    </p>
                  </div>
                )}

                {/* Optional thumbnail preview bar if URL is set */}
                {prodImageUrl && uploadMode === "url" && (
                  <div className="flex items-center gap-3 pt-2 border-t border-[#CCE5E1]/50">
                    <img
                      src={prodImageUrl}
                      alt="URL Preview"
                      className="w-10 h-10 object-cover rounded border border-[#CCE5E1] bg-gray-100"
                    />
                    <span className="text-[10px] font-mono text-emerald-800 font-bold">Image Link Preview Valid</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-[#4A7C79] text-[10px] uppercase font-bold mb-1">Shop Product Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide key product specifications, application rates, or benefits for farmers viewing the product on the shop page..."
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  className="w-full bg-[#E8F4F1] border border-[#CCE5E1] p-2.5 rounded-[6px] text-[#0F3D3C] font-sans text-xs focus:outline-none focus:border-[#278C7B]"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#CCE5E1] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-100 text-[#0F3D3C] font-bold text-xs rounded-[6px] hover:bg-gray-200 cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#278C7B] hover:bg-[#1E6B5E] text-white font-bold text-xs rounded-[6px] cursor-pointer transition shadow-xs"
              >
                {editingProduct ? "Save Changes" : "Publish to Shop"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
