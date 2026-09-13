import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Trash2, 
  Minus, 
  Plus, 
  ArrowRight, 
  CreditCard, 
  Landmark, 
  MessageSquare,
  CheckCircle,
  ShieldCheck,
  FileText,
  Printer,
  ShoppingBag,
  MapPin,
  Truck,
  Check,
  AlertCircle,
  Tag,
  Smartphone,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/hooks/useAuth";

type PaymentMethod = "mpesa" | "card" | "airtel" | "paystack";
type ShippingMethod = "standard" | "express" | "pickup";

export function CartDrawer() {
  const {
    cartItems,
    cartOpen,
    setCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart
  } = useCart();

  // 5-Step Checkout Wizard State
  // 0: Cart, 1: Delivery, 2: Shipping, 3: Payment, 4: Review, 5: Success
  const [step, setStep] = useState<number>(0);
  
  // Delivery details
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [county, setCounty] = useState("");
  const [town, setTown] = useState("");
  const [village, setVillage] = useState("");
  const [instructions, setInstructions] = useState("");

  // Shipping details
  const [shippingOption, setShippingOption] = useState<ShippingMethod>("standard");

  // Payment details
  const [paymentOption, setPaymentOption] = useState<PaymentMethod>("mpesa");
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [airtelNumber, setAirtelNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Coupons
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [activeCoupon, setActiveCoupon] = useState<string | null>(null);

  // Proforma Invoice Modal
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");

  useEffect(() => {
    setInvoiceNumber(`MQ-CART-${Math.floor(100000 + Math.random() * 900000)}`);
    setInvoiceDate(new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  const { user } = useAuth();
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [pollCountdown, setPollCountdown] = useState(120);
  const [paymentStatusState, setPaymentStatusState] = useState<"pending" | "success" | "failed" | "timeout">("pending");
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const pollTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // STK simulation processing countdown
  const [processing, setProcessing] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Cleanup polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  // Subtotal calculation
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  
  // Shipping cost calculation
  const shippingCost = useMemo(() => {
    if (shippingOption === "pickup") return 0;
    if (shippingOption === "express") return 450;
    return subtotal > 5000 ? 0 : 300; // Standard shipping KSh 300, free over 5K
  }, [shippingOption, subtotal]);

  // Discount calculation
  const discountAmount = useMemo(() => {
    return subtotal * appliedDiscount;
  }, [subtotal, appliedDiscount]);

  const vatAmount = 0;
  const grandTotal = subtotal - discountAmount + shippingCost;

  // Load registration details from localStorage if present
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mqulima_user_account");
      if (stored) {
        const parsed = JSON.parse(stored);
        setFullName(parsed.name || "");
        setPhoneNumber(parsed.phone || "");
        setMpesaNumber(parsed.phone || "");
        setAirtelNumber(parsed.phone || "");
        setNationalId(parsed.idNumber || "");
        setCounty(parsed.county || "");
        setTown(parsed.town || "");
        setVillage(parsed.village || "");
        setInstructions(parsed.instructions || "");
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Reset steps when drawer opens/closes
  useEffect(() => {
    if (!cartOpen) {
      setStep(0);
      setProcessing(false);
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    }
  }, [cartOpen]);

  // Coupon application handler
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code === "MUSEMBI10" || code === "SHULAMITE10") {
      setAppliedDiscount(0.10); // 10% off
      setActiveCoupon(code);
      toast.success(`Coupon ${code} applied successfully! 10% discount subtracted.`);
    } else if (code === "WELCOME5") {
      setAppliedDiscount(0.05); // 5% off
      setActiveCoupon(code);
      toast.success("Welcome coupon applied successfully!");
    } else {
      toast.error("Invalid coupon code. Try WELCOME5 or MUSEMBI10");
    }
    setCouponCode("");
  };

  const handleRemoveCoupon = () => {
    setAppliedDiscount(0);
    setActiveCoupon(null);
    toast.info("Coupon discount removed");
  };

  // Step validation
  const validateDelivery = () => {
    if (!fullName.trim() || !phoneNumber.trim() || !nationalId.trim() || !county.trim() || !town.trim()) {
      toast.error("Please fill in all required address fields.");
      return false;
    }
    if (!mpesaNumber.trim() && phoneNumber.trim()) {
      setMpesaNumber(phoneNumber.trim());
    }
    if (!airtelNumber.trim() && phoneNumber.trim()) {
      setAirtelNumber(phoneNumber.trim());
    }
    // Save to local storage
    try {
      localStorage.setItem("mqulima_user_account", JSON.stringify({
        name: fullName,
        phone: phoneNumber,
        idNumber: nationalId,
        county,
        town,
        village,
        instructions
      }));
    } catch (e) {
      console.error(e);
    }
    return true;
  };

  const startPaymentPolling = (orderId: string) => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }
    setPollCountdown(120);
    let secondsRemaining = 120;

    pollTimerRef.current = setInterval(async () => {
      secondsRemaining -= 3;
      setPollCountdown(secondsRemaining);

      if (secondsRemaining <= 0) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        setProcessing(false);
        setPaymentStatusState("timeout");
        toast.error("Payment confirmation query timed out.");
        return;
      }

      try {
        const { getPaymentStatus } = await import("@/lib/api/mpesa.server");
        const statusRes = await getPaymentStatus({ data: { orderId } });

        if (statusRes.status === "paid") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setProcessing(false);
          setPaymentStatusState("success");
          if (statusRes.receiptNumber) {
            setReceiptNumber(statusRes.receiptNumber);
          }
          setStep(5);
          clearCart();
          toast.success("M-Pesa Payment Received & Confirmed!");
        } else if (statusRes.status === "failed") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setProcessing(false);
          setPaymentStatusState("failed");
          toast.error("Payment failed or was cancelled by user.");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("Please log in to place your order.");
      return;
    }

    if (paymentOption === "mpesa") {
      if (!mpesaNumber.trim()) {
        toast.error("Please enter phone number for M-Pesa STK push prompt");
        return;
      }
      if (!/^(07|01|254|\+254)\d{8}$/.test(mpesaNumber.trim().replace(/\s+/g, ""))) {
        toast.error("Please enter a valid Kenyan phone number (e.g. 0712345678)");
        return;
      }
    } else if (paymentOption === "airtel") {
      const airtelToValidate = airtelNumber.trim() || phoneNumber.trim();
      if (!airtelToValidate) {
        toast.error("Please enter phone number for Airtel Money");
        return;
      }
      if (!/^(07|01|254|\+254)\d{8}$/.test(airtelToValidate.replace(/\s+/g, ""))) {
        toast.error("Please enter a valid Kenyan Airtel number (e.g. 0733123456)");
        return;
      }
    }

    setProcessing(true);
    setPaymentStatusState("pending");
    setReceiptNumber(null);

    try {
      // 1. Create order in DB via server function
      const { getCsrfTokenFromCookie } = await import("@/lib/csrf-client");
      const { createShopOrder } = await import("@/lib/api/shop.server");

      const orderItems = cartItems.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image || item.product.imageUrls?.[0] || "/placeholder-product.png"
      }));

      const res = await createShopOrder({
        data: {
          items: orderItems,
          couponCode: activeCoupon || undefined,
          subtotal,
          total: grandTotal,
          fullName,
          phone: phoneNumber,
          nationalId,
          county,
          town,
          village,
          instructions,
          paymentMethod: paymentOption,
          shippingOption,
          csrfToken: getCsrfTokenFromCookie()
        }
      });

      if (res.success && res.orderId) {
        setCreatedOrderId(res.orderId);

        if (paymentOption === "mpesa") {
          // Trigger Safaricom Direct M-Pesa STK Push
          const { initiateStkPush } = await import("@/lib/api/mpesa.server");
          const pushRes = await initiateStkPush({
            data: {
              phone: mpesaNumber.trim(),
              amount: grandTotal,
              orderId: res.orderId,
              description: `Shop Order ${res.orderId.slice(0, 8)}`
            }
          });

          if (pushRes.success) {
            toast.success("M-Pesa STK Push Prompt Sent! Check your phone.");
            startPaymentPolling(res.orderId);
          } else {
            throw new Error(pushRes.error || "Failed to initiate payment prompt");
          }
        } else {
          // Paystack channels: card, airtel, or paystack multi
          const { initiatePaystackCheckout } = await import("@/lib/api/paystack.server");
          const customerEmail = (user?.email && user.email.includes("@"))
            ? user.email.trim().toLowerCase()
            : `${(phoneNumber || user?.phone || fullName || "customer").toLowerCase().replace(/[^a-z0-9]/g, "") || "shopper"}@mqulima.com`;
          
          let paystackChannels: string[] | undefined = undefined;
          if (paymentOption === "card") {
            paystackChannels = ["card"];
          } else if (paymentOption === "airtel") {
            paystackChannels = ["mobile_money"];
          }

          const payRes = await initiatePaystackCheckout({
            data: {
              orderId: res.orderId,
              email: customerEmail,
              channels: paystackChannels
            }
          });

          if (payRes.success && payRes.authorizationUrl) {
            toast.success("Order initialized! Redirecting to Paystack payment gateway...");
            clearCart();
            window.location.href = payRes.authorizationUrl;
            return;
          } else {
            throw new Error((payRes as any).error || "Failed to initialize Paystack payment gateway.");
          }
        }
      } else {
        throw new Error(res.error || "Failed to create order");
      }
    } catch (err: any) {
      console.error(err);
      setProcessing(false);
      toast.error(err.message || "An error occurred while creating order.");
    }
  };

  // WhatsApp Checkout direct from cart
  const handleWhatsAppCheckout = () => {
    let itemRows = "";
    cartItems.forEach((item, index) => {
      itemRows += `${index + 1}. ${item.product.name} x${item.quantity} - KSh ${(item.product.price * item.quantity).toLocaleString()}\n`;
    });

    const deliveryDetails = fullName
      ? `\n*Delivery details:*\nName: ${fullName}\nPhone: ${phoneNumber}\nLocation: ${county}, ${town}, ${village}\n`
      : "";

    const message = `Hello Mqulima agent, I'd like to place an order via WhatsApp:\n
*Items:*\n${itemRows}
*Coupon Discount:* KSh ${discountAmount.toLocaleString()}
*Shipping Mode:* ${shippingOption.toUpperCase()}
*Total Amount:* KSh ${grandTotal.toLocaleString()}${deliveryDetails}
Please assist in processing my order!`;

    window.open(`https://wa.me/254723346134?text=${encodeURIComponent(message)}`, "_blank");
  };

  const stepsLabels = ["Cart", "Address", "Delivery", "Payment", "Review"];

  return (
    <>
      <AnimatePresence>
        {cartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => {
              if (step !== 5 && !processing) setCartOpen(false);
            }}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 z-50">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col text-left h-full"
            >
              {/* Header */}
              <div className="p-5 border-b border-gray-200 bg-white shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                    <ShoppingBag size={14} className="text-[#2D6A4F]" />
                    {step === 5 ? "Order Success" : "Mqulima Checkout Wizard"}
                  </h2>
                  {step !== 5 && !processing && (
                    <button
                      onClick={() => setCartOpen(false)}
                      className="text-gray-400 hover:text-gray-900 transition p-1"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {/* Progress Indicators */}
                {step < 5 && (
                  <div className="flex items-center justify-between mt-4">
                    {stepsLabels.map((label, idx) => (
                      <div key={label} className="flex items-center flex-1 last:flex-initial">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${
                            step >= idx
                              ? "bg-[#2D6A4F] text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {step > idx ? <Check size={10} /> : idx + 1}
                        </div>
                        <span
                          className={`hidden sm:inline text-[9px] font-bold ml-1 tracking-tight ${
                            step === idx ? "text-[#2D6A4F] font-black" : "text-gray-400"
                          }`}
                        >
                          {label}
                        </span>
                        {idx < stepsLabels.length - 1 && (
                          <div
                            className={`h-0.5 flex-1 mx-2 transition-colors ${
                              step > idx ? "bg-[#2D6A4F]" : "bg-gray-150"
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                
                {/* STEP 0: CART VIEW */}
                {step === 0 && (
                  <div className="space-y-4">
                    {cartItems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-20">
                        <span className="text-4xl block mb-2">🛒</span>
                        <h3 className="text-xs font-bold text-gray-800">Your cart is empty</h3>
                        <p className="text-[10px] text-gray-500 mt-1 max-w-[200px]">
                          Pick certified agrovet seeds, feeds, or tools from our catalog.
                        </p>
                        <button
                          onClick={() => setCartOpen(false)}
                          className="mt-6 bg-[#2D6A4F] hover:bg-[#1A5438] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition"
                        >
                          Start Shopping
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cartItems.map((item) => (
                          <div
                            key={item.product.id}
                            className="flex items-center gap-3.5 py-3 border-b border-gray-100 last:border-none"
                          >
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-50 border border-gray-150 p-0.5">
                              <img
                                src={item.product.image || '/placeholder-product.png'}
                                alt={item.product.name}
                                className="h-full w-full object-cover rounded-md"
                                onError={(e) => { e.currentTarget.src = '/placeholder-product.png'; }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-extrabold text-gray-800 truncate">{item.product.name}</h4>
                              <span className="text-[9px] text-gray-400 block mt-0.5">Brand: {item.product.brand}</span>
                              <div className="mt-1.5 flex items-center justify-between">
                                <span className="text-xs font-bold text-[#2D6A4F]">
                                  KSh {item.product.price.toLocaleString()}
                                </span>
                                <div className="flex items-center border border-gray-200 rounded-md bg-white">
                                  <button
                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                    className="p-1 text-gray-400 hover:text-gray-700"
                                  >
                                    <Minus size={10} />
                                  </button>
                                  <span className="px-2 text-[10px] font-bold text-gray-800">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                    className="p-1 text-gray-400 hover:text-gray-700"
                                  >
                                    <Plus size={10} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-gray-400 hover:text-red-500 self-start p-1 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}


                      </div>
                    )}
                  </div>
                )}

                {/* STEP 1: DELIVERY ADDRESS */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="bg-[#FAF9F5] border border-amber-300/30 rounded-xl p-3.5 text-xs text-amber-800 flex items-start gap-2">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold block mb-0.5">Shipping Address Details</strong>
                        We certify seeds and crops mapping. Fill in accurate details for correct logistics dispatch.
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Timothy Kiprono"
                          className="w-full bg-gray-50 border border-gray-200 focus:border-[#2D6A4F] focus:bg-white rounded-xl px-4 py-2.5 text-xs outline-none transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="0712345678"
                          className="w-full bg-gray-50 border border-gray-200 focus:border-[#2D6A4F] focus:bg-white rounded-xl px-4 py-2.5 text-xs outline-none transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">National ID *</label>
                        <input
                          type="text"
                          required
                          value={nationalId}
                          onChange={(e) => setNationalId(e.target.value)}
                          placeholder="34567890"
                          className="w-full bg-gray-50 border border-gray-200 focus:border-[#2D6A4F] focus:bg-white rounded-xl px-4 py-2.5 text-xs outline-none transition"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">County *</label>
                          <input
                            type="text"
                            required
                            value={county}
                            onChange={(e) => setCounty(e.target.value)}
                            placeholder="Uasin Gishu"
                            className="w-full bg-gray-50 border border-gray-200 focus:border-[#2D6A4F] focus:bg-white rounded-xl px-4 py-2.5 text-xs outline-none transition"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Town/Center *</label>
                          <input
                            type="text"
                            required
                            value={town}
                            onChange={(e) => setTown(e.target.value)}
                            placeholder="Eldoret"
                            className="w-full bg-gray-50 border border-gray-200 focus:border-[#2D6A4F] focus:bg-white rounded-xl px-4 py-2.5 text-xs outline-none transition"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Village / Estate Name</label>
                        <input
                          type="text"
                          value={village}
                          onChange={(e) => setVillage(e.target.value)}
                          placeholder="Kapsoya village"
                          className="w-full bg-gray-50 border border-gray-200 focus:border-[#2D6A4F] focus:bg-white rounded-xl px-4 py-2.5 text-xs outline-none transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Landmark / Delivery Instructions</label>
                        <textarea
                          rows={2}
                          value={instructions}
                          onChange={(e) => setInstructions(e.target.value)}
                          placeholder="Near Kipkaren Primary School"
                          className="w-full bg-gray-50 border border-gray-200 focus:border-[#2D6A4F] focus:bg-white rounded-xl px-4 py-2.5 text-xs outline-none transition resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: SHIPPING PREFERENCES */}
                {step === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Choose Shipping Speed</h3>
                    
                    <div className="space-y-3">
                      {/* Standard */}
                      <button
                        type="button"
                        onClick={() => setShippingOption("standard")}
                        className={`w-full p-4 rounded-xl border text-left flex gap-3 transition cursor-pointer ${
                          shippingOption === "standard"
                            ? "border-[#2D6A4F] bg-[#E8F5E9]/30 text-[#2D6A4F]"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                      >
                        <Truck size={20} className="shrink-0 mt-0.5" />
                        <div className="text-xs leading-normal">
                          <strong className="font-extrabold block text-gray-900">Agronomist Standard Delivery</strong>
                          <span className="text-gray-500 block mt-0.5">KES {subtotal > 5000 ? "FREE" : "300"} &middot; Shipped in 24-48 Hours</span>
                          <span className="text-[10px] text-[#2D6A4F] font-bold block mt-1">Includes seed certification advice</span>
                        </div>
                      </button>

                      {/* Express */}
                      <button
                        type="button"
                        onClick={() => setShippingOption("express")}
                        className={`w-full p-4 rounded-xl border text-left flex gap-3 transition cursor-pointer ${
                          shippingOption === "express"
                            ? "border-[#2D6A4F] bg-[#E8F5E9]/30 text-[#2D6A4F]"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                      >
                        <Truck size={20} className="shrink-0 mt-0.5 text-orange-500" />
                        <div className="text-xs leading-normal">
                          <strong className="font-extrabold block text-gray-900">Priority Same-Day Rider</strong>
                          <span className="text-gray-500 block mt-0.5">KES 450 &middot; Delivered within Nakuru/Eldoret in 6 Hours</span>
                        </div>
                      </button>

                      {/* Pickup */}
                      <button
                        type="button"
                        onClick={() => setShippingOption("pickup")}
                        className={`w-full p-4 rounded-xl border text-left flex gap-3 transition cursor-pointer ${
                          shippingOption === "pickup"
                            ? "border-[#2D6A4F] bg-[#E8F5E9]/30 text-[#2D6A4F]"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                      >
                        <MapPin size={20} className="shrink-0 mt-0.5 text-blue-500" />
                        <div className="text-xs leading-normal">
                          <strong className="font-extrabold block text-gray-900">Store Pick-up (Free)</strong>
                          <span className="text-gray-500 block mt-0.5">Pick up at Mqulima Nakuru Depot Office</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: PAYMENT GATEWAY SELECTION */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Payment Channels</h3>
                      <span className="text-[10px] text-gray-400 font-mono">Select preferred gateway</span>
                    </div>
                    
                    {/* 4 Brand-Colored Payment Options in 2x2 Grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* 1. Safaricom Direct M-Pesa (Green) */}
                      <button
                        type="button"
                        onClick={() => setPaymentOption("mpesa")}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer relative overflow-hidden ${
                          paymentOption === "mpesa"
                            ? "border-[#00A34E] bg-emerald-50/80 shadow-xs ring-2 ring-[#00A34E]/30"
                            : "border-gray-200 bg-white hover:border-[#00A34E]/60 hover:bg-emerald-50/20"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-[#00A34E] text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0 tracking-tighter">
                            M
                          </div>
                          <div className="text-left leading-none">
                            <strong className="text-xs font-bold block text-gray-900">Direct M-Pesa</strong>
                            <span className="text-[10px] text-gray-500 block mt-0.5">Safaricom Daraja</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#00A34E] text-white">
                            STK
                          </span>
                          {paymentOption === "mpesa" && (
                            <span className="h-2 w-2 rounded-full bg-[#00A34E] animate-pulse" />
                          )}
                        </div>
                      </button>

                      {/* 2. Paystack Card Pay (Navy Blue) */}
                      <button
                        type="button"
                        onClick={() => setPaymentOption("card")}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer relative overflow-hidden ${
                          paymentOption === "card"
                            ? "border-[#2563EB] bg-blue-50/80 shadow-xs ring-2 ring-[#2563EB]/30"
                            : "border-gray-200 bg-white hover:border-[#2563EB]/60 hover:bg-blue-50/20"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-[#1A1F71] text-white flex items-center justify-center shadow-xs shrink-0">
                            <CreditCard size={16} className="text-white" />
                          </div>
                          <div className="text-left leading-none">
                            <strong className="text-xs font-bold block text-gray-900">Card Pay</strong>
                            <span className="text-[10px] text-gray-500 block mt-0.5">Visa, Mastercard</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#1A1F71] text-white">
                            Cards
                          </span>
                          {paymentOption === "card" && (
                            <span className="h-2 w-2 rounded-full bg-[#2563EB] animate-pulse" />
                          )}
                        </div>
                      </button>

                      {/* 3. Airtel Money (Red) */}
                      <button
                        type="button"
                        onClick={() => setPaymentOption("airtel")}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer relative overflow-hidden ${
                          paymentOption === "airtel"
                            ? "border-[#DC2626] bg-red-50/80 shadow-xs ring-2 ring-[#DC2626]/30"
                            : "border-gray-200 bg-white hover:border-[#DC2626]/60 hover:bg-red-50/20"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-[#ED1C24] text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0 tracking-tighter">
                            A
                          </div>
                          <div className="text-left leading-none">
                            <strong className="text-xs font-bold block text-gray-900">Airtel Money</strong>
                            <span className="text-[10px] text-gray-500 block mt-0.5">Airtel Wallet</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#ED1C24] text-white">
                            Airtel
                          </span>
                          {paymentOption === "airtel" && (
                            <span className="h-2 w-2 rounded-full bg-[#DC2626] animate-pulse" />
                          )}
                        </div>
                      </button>

                      {/* 4. Paystack Multi-Option (Cyan/Teal) */}
                      <button
                        type="button"
                        onClick={() => setPaymentOption("paystack")}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer relative overflow-hidden ${
                          paymentOption === "paystack"
                            ? "border-[#0284C7] bg-sky-50/80 shadow-xs ring-2 ring-[#0284C7]/30"
                            : "border-gray-200 bg-white hover:border-[#0284C7]/60 hover:bg-sky-50/20"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-[#0AA5DB] text-white flex items-center justify-center shadow-xs shrink-0 font-black text-xs">
                            <Zap size={16} className="text-white fill-white" />
                          </div>
                          <div className="text-left leading-none">
                            <strong className="text-xs font-bold block text-gray-900">Paystack Multi</strong>
                            <span className="text-[10px] text-gray-500 block mt-0.5">Till, Bank & More</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#0AA5DB] text-white">
                            All
                          </span>
                          {paymentOption === "paystack" && (
                            <span className="h-2 w-2 rounded-full bg-[#0284C7] animate-pulse" />
                          )}
                        </div>
                      </button>
                    </div>

                    {/* DEDICATED PAYMENT INTERFACE PANELS */}
                    <div className="mt-3">
                      {/* INTERFACE 1: Direct M-Pesa */}
                      {paymentOption === "mpesa" && (
                        <div className="bg-gradient-to-b from-emerald-50/60 to-white border border-emerald-300/80 rounded-xl p-4 space-y-3 text-xs shadow-xs animate-in fade-in duration-200">
                          <div className="flex items-center justify-between border-b border-emerald-200/70 pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-5 rounded-full bg-[#00A34E] text-white flex items-center justify-center text-[10px] font-black">
                                M
                              </div>
                              <div>
                                <strong className="font-bold text-[#00A34E] block">Safaricom Direct M-Pesa STK Push</strong>
                                <span className="text-[10px] text-gray-500">Instant on-screen PIN authorization</span>
                              </div>
                            </div>
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-[#00A34E]/15 text-[#00843D] rounded-full border border-[#00A34E]/30">
                              Daraja 2.0 Live
                            </span>
                          </div>

                          <p className="text-[11px] text-gray-600 leading-relaxed">
                            An automated M-Pesa prompt will be sent immediately to your phone. Check your screen and enter your M-Pesa PIN when prompted.
                          </p>

                          <div className="space-y-1.5 pt-1">
                            <label className="text-[10px] font-bold text-gray-600 uppercase flex items-center justify-between">
                              <span>M-Pesa Mobile Number</span>
                              <span className="text-[10px] font-normal text-gray-400">Safaricom (07XX / 01XX)</span>
                            </label>
                            <div className="relative">
                              <div className="absolute left-3 top-2.5 flex items-center gap-1 text-xs text-gray-400 select-none">
                                <span className="text-sm">🇰🇪</span>
                                <span className="font-bold text-gray-600">+254</span>
                              </div>
                              <input
                                type="tel"
                                value={mpesaNumber}
                                onChange={(e) => setMpesaNumber(e.target.value)}
                                placeholder="0712 345 678"
                                className="w-full bg-white border border-emerald-300 rounded-lg pl-20 pr-3 py-2 text-xs font-mono font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#00A34E]/30 focus:border-[#00A34E] shadow-2xs"
                              />
                            </div>
                            <span className="text-[10px] text-gray-400 block">
                              Prompt appears instantly on your Safaricom SIM. Standard carrier rates apply.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* INTERFACE 2: Card Pay via Paystack */}
                      {paymentOption === "card" && (
                        <div className="bg-gradient-to-b from-blue-50/60 to-white border border-blue-300/80 rounded-xl p-4 space-y-3 text-xs shadow-xs animate-in fade-in duration-200">
                          <div className="flex items-center justify-between border-b border-blue-200/70 pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-5 rounded-full bg-[#1A1F71] text-white flex items-center justify-center">
                                <CreditCard size={12} className="text-white" />
                              </div>
                              <div>
                                <strong className="font-bold text-[#1A1F71] block">Paystack Card Gateway</strong>
                                <span className="text-[10px] text-gray-500">Local & International Debit / Credit Cards</span>
                              </div>
                            </div>
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full border border-blue-300">
                              PCI-DSS Level 1
                            </span>
                          </div>

                          <p className="text-[11px] text-gray-600 leading-relaxed">
                            Pay securely using your Visa, Mastercard, or Verve card. Clicking <strong>Place Order</strong> will connect to Paystack's 256-bit encrypted card checkout with 3D Secure OTP verification.
                          </p>

                          <div className="p-3 bg-white rounded-lg border border-blue-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-gray-500 font-medium">Accepted Networks:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black bg-[#1A1F71] text-white px-2 py-0.5 rounded italic">VISA</span>
                                <span className="text-[9px] font-black bg-[#EB001B] text-white px-2 py-0.5 rounded">mastercard</span>
                                <span className="text-[9px] font-black bg-[#00425F] text-white px-2 py-0.5 rounded">Verve</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1.5 border-t border-gray-100">
                              <span>Digital Receipt To:</span>
                              <span className="font-bold text-gray-800 font-mono truncate max-w-[180px]">
                                {user?.email || phoneNumber || "customer@mqulima.com"}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-400 block">
                            Bank-level 256-bit SSL encryption. Zero card credentials stored on Mqulima servers.
                          </span>
                        </div>
                      )}

                      {/* INTERFACE 3: Airtel Money via Paystack */}
                      {paymentOption === "airtel" && (
                        <div className="bg-gradient-to-b from-red-50/60 to-white border border-red-300/80 rounded-xl p-4 space-y-3 text-xs shadow-xs animate-in fade-in duration-200">
                          <div className="flex items-center justify-between border-b border-red-200/70 pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-5 rounded-full bg-[#ED1C24] text-white flex items-center justify-center text-[10px] font-black">
                                A
                              </div>
                              <div>
                                <strong className="font-bold text-[#ED1C24] block">Airtel Money (via Paystack)</strong>
                                <span className="text-[10px] text-gray-500">Airtel Kenya Mobile Wallet</span>
                              </div>
                            </div>
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-red-100 text-red-800 rounded-full border border-red-300">
                              Mobile Money
                            </span>
                          </div>

                          <p className="text-[11px] text-gray-600 leading-relaxed">
                            Pay directly from your Airtel Money balance. An authorization prompt will be dispatched to your Airtel phone through Paystack's mobile payment rails.
                          </p>

                          <div className="space-y-1.5 pt-1">
                            <label className="text-[10px] font-bold text-gray-600 uppercase flex items-center justify-between">
                              <span>Airtel Mobile Number</span>
                              <span className="text-[10px] font-normal text-gray-400">Airtel (073X / 075X / 078X)</span>
                            </label>
                            <div className="relative">
                              <div className="absolute left-3 top-2.5 flex items-center gap-1 text-xs text-gray-400 select-none">
                                <span className="text-sm">🇰🇪</span>
                                <span className="font-bold text-gray-600">+254</span>
                              </div>
                              <input
                                type="tel"
                                value={airtelNumber}
                                onChange={(e) => setAirtelNumber(e.target.value)}
                                placeholder="0733 123 456"
                                className="w-full bg-white border border-red-300 rounded-lg pl-20 pr-3 py-2 text-xs font-mono font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#ED1C24]/30 focus:border-[#ED1C24] shadow-2xs"
                              />
                            </div>
                            <span className="text-[10px] text-gray-400 block">
                              Available for all registered Airtel Kenya mobile wallets.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* INTERFACE 4: Paystack Multi-Option */}
                      {paymentOption === "paystack" && (
                        <div className="bg-gradient-to-b from-sky-50/60 to-white border border-sky-300/80 rounded-xl p-4 space-y-3 text-xs shadow-xs animate-in fade-in duration-200">
                          <div className="flex items-center justify-between border-b border-sky-200/70 pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-5 rounded-full bg-[#0AA5DB] text-white flex items-center justify-center font-black text-xs shadow-xs">
                                <Zap size={12} className="text-white fill-white" />
                              </div>
                              <div>
                                <strong className="font-bold text-[#0284C7] block">Paystack Multi-Payment Portal</strong>
                                <span className="text-[10px] text-gray-500">Till, Bank, Card & Multi-Channel</span>
                              </div>
                            </div>
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full border border-sky-300">
                              All Channels
                            </span>
                          </div>

                          <p className="text-[11px] text-gray-600 leading-relaxed">
                            Access all alternative payment rails on Paystack's hosted modal. You can switch between M-Pesa Till / Buy Goods, Bank Transfer, Apple/Google Pay, and Cards inside the Paystack interface.
                          </p>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className="p-2.5 bg-white rounded-lg border border-sky-200 flex items-center gap-2">
                              <span className="text-base">🛒</span>
                              <div>
                                <strong className="text-[11px] text-gray-800 block leading-tight">M-Pesa Till</strong>
                                <span className="text-[9px] text-gray-400">Buy Goods number</span>
                              </div>
                            </div>
                            <div className="p-2.5 bg-white rounded-lg border border-sky-200 flex items-center gap-2">
                              <span className="text-base">🏦</span>
                              <div>
                                <strong className="text-[11px] text-gray-800 block leading-tight">Bank EFT</strong>
                                <span className="text-[9px] text-gray-400">Direct Bank Transfer</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-400 block">
                            Redirects to Paystack's official hosted portal. Instant reconciliation upon completion.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 4: ORDER SUMMARY & REVIEW */}
                {step === 4 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Order Verification</h3>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 text-xs leading-normal">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Ship To address:</span>
                        <div className="font-extrabold text-gray-800">{fullName} ({phoneNumber})</div>
                        <div className="text-gray-500">{county} County &middot; {town} &middot; {village}</div>
                        {instructions && <div className="text-gray-400 italic">"* {instructions}"</div>}
                      </div>

                      <div className="border-t border-gray-150 pt-2.5 space-y-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Shipping method:</span>
                        <div className="font-bold text-gray-800 capitalize">{shippingOption} delivery</div>
                      </div>

                      <div className="border-t border-gray-150 pt-2.5 space-y-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Payment Choice:</span>
                        <div className="font-bold text-gray-800 uppercase">
                          {paymentOption === "mpesa"
                            ? "Safaricom Direct M-Pesa"
                            : paymentOption === "card"
                            ? "Card Payment (Paystack)"
                            : paymentOption === "airtel"
                            ? "Airtel Money (Paystack)"
                            : "Paystack Multi-Payment"}
                        </div>
                      </div>
                    </div>

                    {/* Compact Item list review */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Order Items ({cartItems.length}):</span>
                      {cartItems.map((item) => (
                        <div key={item.product.id} className="flex justify-between text-xs text-gray-600">
                          <span className="truncate max-w-[240px]">{item.product.name} (x{item.quantity})</span>
                          <span className="font-mono font-bold">KSh {(item.product.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TRANSACTION PROCESSING LOADER */}
                {processing && (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 bg-white/90 absolute inset-0 z-50">
                    <div className="relative flex items-center justify-center">
                      <div className="h-16 w-16 rounded-full border-4 border-[#2D6A4F]/20 border-t-[#2D6A4F] animate-spin" />
                      <span className="absolute text-xs font-bold text-[#2D6A4F]">
                        {paymentOption === "mpesa" ? `${pollCountdown}s` : "..."}
                      </span>
                    </div>
                    <h3 className="mt-6 text-sm font-extrabold text-gray-800 uppercase tracking-wider">
                      {paymentOption === "mpesa"
                        ? "Waiting for M-Pesa PIN..."
                        : "Connecting to Paystack Secure Checkout..."}
                    </h3>
                    <p className="mt-2 text-xs text-gray-500 max-w-xs leading-normal">
                      {paymentOption === "mpesa"
                        ? "An STK PIN prompt has been sent to your phone. Please check your screen, enter your M-Pesa PIN, and authorize to complete the payment."
                        : "Redirecting you to the encrypted Paystack payment portal to complete your transaction..."}
                    </p>
                  </div>
                )}

                {/* STEP 5: ORDER SUCCESS SCREEN */}
                {step === 5 && (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10">
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-[#E8F5E9] text-[#2D6A4F] text-3xl animate-bounce">
                      <CheckCircle className="h-10 w-10" />
                    </div>
                    <h3 className="mt-6 text-sm font-black text-gray-900 uppercase tracking-wider">Order Clear & Dispatched!</h3>
                    
                    <div className="mt-4 bg-gray-50 border border-gray-200 p-4 rounded-xl text-xs space-y-2 w-full text-left font-sans">
                      <span className="text-[9px] font-extrabold text-[#2D6A4F] uppercase tracking-wide block">Order receipt invoice:</span>
                      {createdOrderId && (
                        <div><strong>Order ID:</strong> <span className="font-mono text-gray-600">{createdOrderId}</span></div>
                      )}
                      {receiptNumber && (
                        <div><strong>M-Pesa Receipt:</strong> <span className="font-mono font-bold text-[#2D6A4F]">{receiptNumber}</span></div>
                      )}
                      <div><strong>Buyer:</strong> {fullName}</div>
                      <div><strong>Location:</strong> {county} &middot; {town}</div>
                      <div><strong>ID Number:</strong> {nationalId}</div>
                      <div className="h-px bg-gray-200 my-1" />
                      <div className="text-[10px] text-gray-500 leading-normal">
                        Certified seeds logistics tracker generated. Local agronomist agent dispatching shipment package. Check your phone SMS tracker alerts.
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setCartOpen(false);
                        setStep(0);
                      }}
                      className="mt-8 w-full rounded-xl bg-[#2D6A4F] py-3.5 text-xs font-bold text-white shadow-lg uppercase tracking-wider hover:bg-[#1A5438]"
                    >
                      Done & Return to Market
                    </button>
                  </div>
                )}

              </div>

              {/* Fixed Footer with Wizards Actions & totals */}
              {step < 5 && cartItems.length > 0 && (
                <div className="p-5 border-t border-gray-200 bg-gray-50 shrink-0 space-y-4">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Items Subtotal:</span>
                      <span className="font-mono text-gray-800">KSh {subtotal.toLocaleString()}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-[#2D6A4F] font-bold">
                        <span>Coupon Discount:</span>
                        <span className="font-mono">- KSh {discountAmount.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-500">
                      <span>Shipping Fee ({shippingOption}):</span>
                      <span className="font-mono text-gray-800">
                        {shippingCost === 0 ? "FREE" : `KSh ${shippingCost}`}
                      </span>
                    </div>
                    <div className="h-px bg-gray-200 my-2" />
                    <div className="flex justify-between text-sm font-black text-gray-900">
                      <span>Grand Total:</span>
                      <span className="text-[#2D6A4F] font-black font-mono">
                        KSh {grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Wizard actions buttons */}
                  <div className="space-y-2">
                    {step === 0 && (
                      user ? (
                        <button
                          onClick={() => setStep(1)}
                          className="w-full bg-[#2D6A4F] hover:bg-[#1A5438] text-white py-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer shadow-xs"
                        >
                          Proceed to Delivery <ArrowRight size={14} />
                        </button>
                      ) : (
                        <div className="text-center space-y-2 py-2">
                          <p className="text-[10px] text-gray-500 font-semibold">Please log in to proceed with your order checkout.</p>
                          <a
                            href="/login"
                            className="inline-block w-full text-center bg-amber-500 hover:bg-amber-600 text-white py-3 text-xs font-extrabold rounded-xl transition uppercase tracking-wider"
                          >
                            Log In to Checkout
                          </a>
                        </div>
                      )
                    )}
                    {step === 1 && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setStep(0)}
                          className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 text-xs font-bold rounded-xl hover:bg-gray-50 transition cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => { if (validateDelivery()) setStep(2); }}
                          className="flex-1 bg-[#2D6A4F] hover:bg-[#1A5438] text-white py-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
                        >
                          Shipping Speed <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                    {step === 2 && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setStep(1)}
                          className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 text-xs font-bold rounded-xl hover:bg-gray-50 transition cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => setStep(3)}
                          className="flex-1 bg-[#2D6A4F] hover:bg-[#1A5438] text-white py-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
                        >
                          Choose Payment <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                    {step === 3 && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setStep(2)}
                          className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 text-xs font-bold rounded-xl hover:bg-gray-50 transition cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => setStep(4)}
                          className="flex-1 bg-[#2D6A4F] hover:bg-[#1A5438] text-white py-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
                        >
                          Review Order <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                    {step === 4 && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setStep(3)}
                          className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 text-xs font-bold rounded-xl hover:bg-gray-50 transition cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          onClick={handlePlaceOrder}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer shadow-sm"
                        >
                          Place Order KSh {grandTotal.toLocaleString()}
                        </button>
                      </div>
                    )}

                    {/* Shared fallback WhatsApp checkout and Proforma invoice options */}
                    {step < 4 && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={handleWhatsAppCheckout}
                          className="bg-[#25D366] hover:bg-[#20BA56] text-white text-[10px] font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1 uppercase tracking-wider"
                        >
                          <MessageSquare size={12} /> WhatsApp checkout
                        </button>
                        <button
                          onClick={() => setInvoiceModalOpen(true)}
                          className="border border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F]/5 text-[10px] font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1 uppercase tracking-wider"
                        >
                          <FileText size={12} /> Get Proforma Invoice
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>

      {/* Cart Proforma Invoice Modal */}
      {invoiceModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto font-sans flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-[#1A1A1A]">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative border border-gray-100 flex flex-col text-left max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-xs">M</div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider">Cart Invoice Proposal</h3>
              </div>
              <button 
                onClick={() => setInvoiceModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 grid grid-cols-2 gap-3 text-xs mt-4">
              <div className="col-span-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fill Buyer Details</span>
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase">Customer Full Name</span>
                <input
                  type="text"
                  placeholder="Timothy Kiprono"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#2D6A4F]"
                />
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase">ID Number</span>
                <input
                  type="text"
                  placeholder="34567890"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#2D6A4F]"
                />
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase">County Destination</span>
                <input
                  type="text"
                  placeholder="Uasin Gishu"
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#2D6A4F]"
                />
              </div>
            </div>

            {/* Invoice Print Layout */}
            <div id="printable-cart-proforma" className="mt-6 border border-gray-200 rounded-xl p-6 bg-white space-y-6 text-xs text-gray-800">
              
              <div className="flex justify-between items-start border-b border-gray-155 pb-4">
                <div className="text-left">
                  <h4 className="text-sm font-black text-[#2D6A4F] uppercase">MQULIMA MARKETPLACE</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Agriculture Hub Platform</p>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-black text-gray-900 uppercase">PROFORMA INVOICE</h3>
                  <p className="text-[10px] font-bold text-[#2D6A4F] mt-1">{invoiceNumber}</p>
                  <p className="text-[10px] text-gray-400">Date: {invoiceDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-left">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">INVOICED TO:</span>
                  <strong className="text-xs text-gray-800 block mt-1">{fullName || "Valued Customer"}</strong>
                  <p className="text-[10px] text-gray-400">Location: {county || "Not specified"}</p>
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-bold">
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Rate</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item) => (
                    <tr key={item.product.id} className="border-b border-gray-100">
                      <td className="py-2.5">
                        <strong className="text-xs text-gray-800">{item.product.name}</strong>
                      </td>
                      <td className="py-2.5 text-center font-bold">{item.quantity}</td>
                      <td className="py-2.5 text-right font-mono">KES {item.product.price.toLocaleString()}</td>
                      <td className="py-2.5 text-right font-mono font-bold">KES {(item.product.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end pt-4">
                <div className="w-[220px] space-y-1.5 text-right text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal:</span>
                    <span className="font-mono text-gray-800">KES {subtotal.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#2D6A4F] font-bold">
                      <span>Discount:</span>
                      <span className="font-mono">- KES {discountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-400">
                    <span>Delivery Fee:</span>
                    <span className="font-mono text-gray-800">KES {shippingCost}</span>
                  </div>
                  <div className="h-px bg-gray-200 my-1" />
                  <div className="flex justify-between text-sm font-black text-[#2D6A4F]">
                    <span>GRAND TOTAL:</span>
                    <span className="font-mono">KES {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="mt-6 flex justify-between gap-3 border-t border-gray-100 pt-4">
              <span className="text-[10px] text-gray-400 italic flex items-center">
                *Generated automatically via Cart checkout.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInvoiceModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.success("Opening print portal...");
                    setTimeout(() => window.print(), 300);
                  }}
                  className="px-4 py-2 bg-[#2D6A4F] hover:bg-[#1A5438] rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm"
                >
                  <Printer size={14} /> Print Invoice
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
